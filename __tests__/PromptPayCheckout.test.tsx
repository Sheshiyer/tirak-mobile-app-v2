import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as ReactNative from 'react-native';
import { act, cleanup, fireEvent, render, waitFor, within } from '@testing-library/react-native';

const mockCreatePromptPayCharge = jest.fn();
let mockLanguage = 'en';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn().mockResolvedValue(null),
    setItem: jest.fn().mockResolvedValue(undefined),
    removeItem: jest.fn().mockResolvedValue(undefined),
    multiRemove: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('@/services/api/payment/payment', () => {
  class PaymentClientError extends Error {
    kind: string;

    constructor(kind: string) {
      super('Safe payment error');
      this.name = 'PaymentClientError';
      this.kind = kind;
    }
  }

  return {
    createPromptPayCharge: (...args: unknown[]) => mockCreatePromptPayCharge(...args),
    PaymentClientError,
  };
});

jest.mock('@/utils/secure-storage', () => ({
  secureStorage: {
    getItemAsync: jest.fn().mockResolvedValue(null),
    setItemAsync: jest.fn().mockResolvedValue(undefined),
    deleteItemAsync: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('@/constants/api', () => ({
  API_BASE_URL: 'http://127.0.0.1:8787',
  apiUrl: (route: string) => `http://127.0.0.1:8787${route}`,
}));

jest.mock('lucide-react-native', () => new Proxy({}, {
  get: (_target, name) => {
    const ReactRuntime = require('react');
    const NativeView = require('react-native').View;
    const Icon = () => ReactRuntime.createElement(NativeView, { accessibilityLabel: `${String(name)} icon` });
    Icon.displayName = String(name);
    return Icon;
  },
}));

jest.mock('@/components/ui/Card', () => {
  const ReactRuntime = require('react');
  const NativeView = require('react-native').View;
  return { Card: ({ children }: { children: React.ReactNode }) => ReactRuntime.createElement(NativeView, null, children) };
});

jest.mock('@/components/ui/Button', () => {
  const ReactRuntime = require('react');
  const { Text: NativeText, TouchableOpacity: NativeTouchableOpacity } = require('react-native');
  return {
    Button: ({ title, onPress, disabled, loading }: { title: string; onPress: () => void; disabled?: boolean; loading?: boolean }) => ReactRuntime.createElement(
      NativeTouchableOpacity,
      {
        accessibilityRole: 'button',
        accessibilityLabel: title,
        accessibilityState: { disabled: Boolean(disabled || loading) },
        disabled: disabled || loading,
        onPress,
      },
      ReactRuntime.createElement(NativeText, null, title),
    ),
  };
});

jest.mock('@/components/booking/BookingStepFooter', () => {
  const ReactRuntime = require('react');
  const { Text: NativeText, TouchableOpacity: NativeTouchableOpacity, View: NativeView } = require('react-native');
  return {
    BookingStepFooter: ({
      onNext,
      onPrevious,
      nextTitle,
      nextDisabled,
      previousDisabled,
      loading,
    }: {
      onNext: () => void;
      onPrevious?: () => void;
      nextTitle: string;
      nextDisabled?: boolean;
      previousDisabled?: boolean;
      loading?: boolean;
    }) => ReactRuntime.createElement(
      NativeView,
      null,
      onPrevious ? ReactRuntime.createElement(
        NativeTouchableOpacity,
        {
          accessibilityRole: 'button',
          accessibilityLabel: 'Back',
          accessibilityState: { disabled: Boolean(previousDisabled) },
          disabled: previousDisabled,
          onPress: onPrevious,
        },
        ReactRuntime.createElement(NativeText, null, 'Back'),
      ) : null,
      ReactRuntime.createElement(
        NativeTouchableOpacity,
        {
          accessibilityRole: 'button',
          accessibilityLabel: nextTitle,
          accessibilityState: { disabled: Boolean(nextDisabled || loading) },
          disabled: nextDisabled || loading,
          onPress: onNext,
        },
        ReactRuntime.createElement(NativeText, null, nextTitle),
      ),
    ),
  };
});

jest.mock('@/components/ui/ProfileImage', () => {
  const ReactRuntime = require('react');
  const NativeView = require('react-native').View;
  return { ProfileImage: () => ReactRuntime.createElement(NativeView) };
});
jest.mock('@/utils/posthog', () => ({ posthog: { capture: jest.fn(), reset: jest.fn() } }));
jest.mock('posthog-react-native', () => ({ usePostHog: () => ({ capture: jest.fn() }) }));
jest.mock('@/services/api/booking/booking', () => ({
  useCreateBooking: () => ({ data: null }),
  createBooking: jest.fn(),
}));
jest.mock('@/utils/booking-notifications', () => ({}));
jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('react-i18next', () => {
  const resources = {
    en: require('../locales/en.json'),
    th: require('../locales/th.json'),
  } as Record<string, Record<string, unknown>>;
  const translate = (key: string, values?: Record<string, unknown>) => {
    const raw = key.split('.').reduce<unknown>((value, segment) => (
      value && typeof value === 'object' ? (value as Record<string, unknown>)[segment] : undefined
    ), resources[mockLanguage]);
    if (typeof raw !== 'string') return key;
    return Object.entries(values ?? {}).reduce(
      (text, [name, value]) => text.replace(new RegExp(`{{${name}}}`, 'g'), String(value)),
      raw,
    );
  };
  return {
    useTranslation: () => ({
      t: translate,
      i18n: { language: mockLanguage, resolvedLanguage: mockLanguage },
    }),
  };
});

import { PaymentSelectionStep } from '@/components/booking/steps/PaymentSelectionStep';
import { PromptPayPendingCard } from '@/components/booking/payment/PromptPayPendingCard';
import { BookingConfirmationStep } from '@/components/booking/steps/BookingConfirmationStep';
import { usePaymentStore } from '@/stores/payment-store';
import { useBookingStore } from '@/stores/booking-store';

const pendingCharge = {
  contractVersion: 'tirak-payments-v1' as const,
  chargeId: 'chrg_local_12345678',
  paymentStatus: 'pending' as const,
  attemptStatus: 'pending' as const,
  qrCodeUrl: 'http://127.0.0.1:8787/fixture/pending.png',
  amountSatang: 180000,
  displayTotalThb: 1800,
  currency: 'THB',
  expiresAt: '2026-09-01T01:00:00.000Z',
};

const bookingFormData = {
  companionId: 'test-companion',
  companionData: {
    id: 'test-companion',
    name: 'Test Guide',
    image: '',
    location: 'Bangkok',
    rating: 5,
    languages: ['English'],
  },
  service: {
    id: 'test-service',
    name: 'Market walk',
    description: 'A market walk',
    price: 1800,
    currency: 'THB',
    duration: 2,
    category: 'walking',
  },
  dateTime: {
    date: '2026-09-02',
    time: '10:00',
    endTime: '12:00',
    duration: 2,
    isAvailable: true,
  },
  location: { area: 'Bangkok', meetingPoint: 'Station' },
  requests: {
    specialRequests: '',
    dietaryRestrictions: [],
    accessibilityNeeds: [],
    languagePreference: 'English',
    groupComposition: '',
  },
  payment: null,
  currentStep: 6,
  isComplete: true,
  errors: {},
};

const seedPayment = (
  overrides: Partial<ReturnType<typeof usePaymentStore.getState>> = {},
) => {
  usePaymentStore.setState({
    booking: { id: 'booking-1', status: 'confirmed', paymentStatus: 'pending' },
    selectedMethod: null,
    charge: null,
    phase: 'idle',
    errorKind: null,
    ...overrides,
  });
};

const renderPaymentStep = () => render(
  <PaymentSelectionStep onNext={jest.fn()} onPrevious={jest.fn()} />,
);

describe('PromptPay traveler checkout', () => {
  beforeEach(() => {
    mockLanguage = 'en';
    process.env.EXPO_PUBLIC_PROMPTPAY_ENABLED = 'true';
    mockCreatePromptPayCharge.mockReset();
    usePaymentStore.getState().resetPayment();
    useBookingStore.setState({ bookingData: bookingFormData, isLoading: false, error: null });
  });

  afterEach(() => cleanup());

  test('pending cash requests show the requested Thai schedule without calendar or chat actions', () => {
    seedPayment({
      booking: { id: 'booking-1', status: 'pending', paymentStatus: 'pending' },
      selectedMethod: 'cash',
    });
    const screen = render(<BookingConfirmationStep onPrevious={jest.fn()} />);
    expect(screen.getByText('Booking request sent')).toBeTruthy();
    expect(screen.getByText('Requested date and time (Thailand)')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Add to Calendar' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Message your local guide' })).toBeNull();
  });

  test('keeps cash visible and hides PromptPay when the capability is off', () => {
    process.env.EXPO_PUBLIC_PROMPTPAY_ENABLED = 'false';
    seedPayment();
    const screen = renderPaymentStep();

    expect(screen.getByText('Cash')).toBeTruthy();
    expect(screen.queryByText('PromptPay')).toBeNull();
  });

  test('keeps the complete cash checkout in one reachable scroll region', () => {
    process.env.EXPO_PUBLIC_PROMPTPAY_ENABLED = 'false';
    seedPayment({ selectedMethod: 'cash' });
    const screen = renderPaymentStep();
    const checkout = within(screen.getByLabelText('Payment checkout content'));

    expect(checkout.getByLabelText(/^Cash payment method/)).toBeTruthy();
    expect(checkout.getByText('Payment safety')).toBeTruthy();
    expect(checkout.getByLabelText('Continue')).toBeTruthy();
  });

  test("local payment flags cannot expose online payment or QR creation", () => {
    seedPayment();
    const screen = renderPaymentStep();
    expect(screen.queryByText("PromptPay")).toBeNull();
    expect(screen.queryByLabelText(/Create PromptPay QR/)).toBeNull();
    expect(usePaymentStore.getState().selectedMethod).toBe("cash");
    expect(useBookingStore.getState().bookingData.payment?.method).toBe("cash");
    expect(mockCreatePromptPayCharge).not.toHaveBeenCalled();
  });

  test("an uncharged PromptPay draft migrates to cash", () => {
    seedPayment({ selectedMethod: "promptpay", phase: "idle" });
    const screen = renderPaymentStep();
    expect(usePaymentStore.getState().selectedMethod).toBe("cash");
    expect(screen.getByLabelText("Continue").props.accessibilityState.disabled).toBe(false);
    expect(mockCreatePromptPayCharge).not.toHaveBeenCalled();
  });

  test.each(["pending", "indeterminate", "paid", "restitution_pending", "restituted", "restitution_failed"] as const)(
    "preserves existing %s financial state and blocks alternate cash", phase => {
      seedPayment({ selectedMethod: "promptpay", phase, charge: phase === "pending" ? pendingCharge : null });
      const screen = renderPaymentStep();
      expect(screen.getByLabelText(/^Cash payment method/).props.accessibilityState.disabled).toBe(true);
      expect(usePaymentStore.getState().selectedMethod).toBe("promptpay");
      expect(screen.queryByLabelText("Try PromptPay again")).toBeNull();
      expect(mockCreatePromptPayCharge).not.toHaveBeenCalled();
      if (phase === "paid") expect(screen.queryByText("Pay your local guide directly in cash.")).toBeNull();
    },
  );

  test.each(["creating", "pending", "indeterminate"] as const)(
    "blocks backward navigation for unresolved %s payments", phase => {
      seedPayment({ selectedMethod: "promptpay", phase });
      const screen = renderPaymentStep();
      expect(screen.getByLabelText("Back").props.accessibilityState.disabled).toBe(true);
    },
  );

  test.each([
    { phase: 'pending', errorKind: null },
    { phase: 'creating', errorKind: null },
    { phase: 'indeterminate', errorKind: null },
    { phase: 'error', errorKind: 'network' },
  ] as const)('unresolved $phase/$errorKind never instructs a second cash payment', state => {
    seedPayment({ selectedMethod: 'promptpay', ...state });
    const screen = renderPaymentStep();
    expect(screen.getByText(/Do not pay again in cash/)).toBeTruthy();
    expect(screen.queryByText('Pay your guide directly in cash. Electronic payment is unavailable for this booking.')).toBeNull();
    expect(screen.queryByText('Pay your local guide directly in cash.')).toBeNull();
    expect(mockCreatePromptPayCharge).not.toHaveBeenCalled();
  });

  test('leaving confirmation clears form state but retains a pending payment session', () => {
    useBookingStore.setState({
      bookingData: {
        ...bookingFormData,
        payment: { method: 'promptpay', amount: 1800, serviceFee: 0, totalAmount: 1800, currency: 'THB', terms: false },
        currentStep: 7,
      },
    });
    seedPayment({ selectedMethod: 'promptpay', phase: 'pending', charge: pendingCharge });
    const screen = render(<BookingConfirmationStep onPrevious={jest.fn()} />);

    fireEvent.press(screen.getByLabelText('Bookings'));

    expect(useBookingStore.getState().bookingData).toMatchObject({ currentStep: 1, payment: null });
    expect(usePaymentStore.getState()).toMatchObject({
      booking: { id: 'booking-1' },
      phase: 'pending',
      charge: pendingCharge,
    });
  });

  test('leaving confirmation may release a proved paid payment session', () => {
    useBookingStore.setState({
      bookingData: {
        ...bookingFormData,
        payment: { method: 'promptpay', amount: 1800, serviceFee: 0, totalAmount: 1800, currency: 'THB', terms: false },
        currentStep: 7,
      },
    });
    seedPayment({
      booking: { id: 'booking-1', status: 'confirmed', paymentStatus: 'paid' },
      selectedMethod: 'promptpay',
      phase: 'paid',
      charge: { ...pendingCharge, attemptStatus: 'successful', paymentStatus: 'paid' },
    });
    const screen = render(<BookingConfirmationStep onPrevious={jest.fn()} />);

    fireEvent.press(screen.getByLabelText('Back to Home'));

    expect(usePaymentStore.getState()).toMatchObject({ booking: null, phase: 'idle', charge: null });
  });

  test('renders only server pending fields and never paid language', () => {
    const screen = render(<PromptPayPendingCard charge={pendingCharge} />);

    expect(screen.getByText('Payment pending')).toBeTruthy();
    expect(screen.getByText('1,800 THB')).toBeTruthy();
    expect(screen.getByLabelText('PromptPay QR for the pending booking payment')).toBeTruthy();
    expect(screen.getByText(/Sep/)).toBeTruthy();
    expect(screen.queryByText(/Paid|Payment complete/i)).toBeNull();
    expect(screen.queryByText(/cash directly/i)).toBeNull();
  });

  test('nullable pending fields do not create a broken image or invented metadata', () => {
    const screen = render(
      <PromptPayPendingCard
        charge={{ ...pendingCharge, qrCodeUrl: null, chargeId: null, expiresAt: undefined }}
      />,
    );

    expect(screen.getByText('Payment pending')).toBeTruthy();
    expect(screen.queryByLabelText('PromptPay QR for the pending booking payment')).toBeNull();
    expect(screen.queryByText(/Reference/)).toBeNull();
    expect(screen.queryByText(/Expires/)).toBeNull();
    expect(screen.getByText(/QR details are not available/)).toBeTruthy();
  });

  test.each([
    ['pending', 'cash', 'Booking request sent', 'Pay your guide in cash.'],
    ['confirmed', 'cash', 'Booking confirmed', 'Pay your guide in cash.'],
    ['confirmed', 'promptpay', 'Booking confirmed', 'PromptPay payment pending.'],
  ] as const)('separates %s booking truth from %s payment truth', (status, method, heading, paymentCopy) => {
    useBookingStore.setState({
      bookingData: {
        ...bookingFormData,
        payment: { method, amount: 1800, serviceFee: 0, totalAmount: 1800, currency: 'THB', terms: false },
        currentStep: 7,
      },
    });
    seedPayment({
      booking: { id: 'booking-1', status, paymentStatus: 'pending' },
      selectedMethod: method,
      charge: method === 'promptpay' ? pendingCharge : null,
      phase: method === 'promptpay' ? 'pending' : 'idle',
    });

    const screen = render(<BookingConfirmationStep onPrevious={jest.fn()} />);
    expect(screen.getByText(heading)).toBeTruthy();
    expect(screen.getByText(paymentCopy)).toBeTruthy();
    if (method === 'promptpay') {
      expect(screen.queryByLabelText('Booking and payment complete')).toBeNull();
      expect(screen.queryByText(/Paid|Payment complete/i)).toBeNull();
    }
  });

  test('keeps an uncertain PromptPay outcome uncertain on confirmation', () => {
    useBookingStore.setState({
      bookingData: {
        ...bookingFormData,
        payment: { method: 'promptpay', amount: 1800, serviceFee: 0, totalAmount: 1800, currency: 'THB', terms: false },
        currentStep: 7,
      },
    });
    seedPayment({
      selectedMethod: 'promptpay',
      phase: 'error',
      errorKind: 'network',
      charge: null,
    });

    const screen = render(<BookingConfirmationStep onPrevious={jest.fn()} />);
    expect(screen.getByText(
      'Payment status is uncertain. Do not pay again or switch methods. Check this booking later.',
    )).toBeTruthy();
    expect(screen.queryByText(/Paid|Payment complete/i)).toBeNull();
  });

  test.each([
    ['paid', 'Payment confirmed. Do not pay again.'],
    ['failed', 'PromptPay payment failed. Choose cash or try PromptPay again.'],
    ['expired', 'The PromptPay QR expired. Choose cash or create a new QR.'],
    ['indeterminate', 'Payment status is uncertain. Do not pay again or switch methods. Check this booking later.'],
  ] as const)('keeps terminal %s payment truth on confirmation', (terminalPhase, copy) => {
    useBookingStore.setState({
      bookingData: {
        ...bookingFormData,
        payment: { method: 'promptpay', amount: 1800, serviceFee: 0, totalAmount: 1800, currency: 'THB', terms: false },
        currentStep: 7,
      },
    });
    seedPayment({
      selectedMethod: 'promptpay',
      phase: terminalPhase as never,
      errorKind: null,
      charge: terminalPhase === 'paid'
        ? { ...pendingCharge, attemptStatus: 'successful', paymentStatus: 'paid' }
        : null,
    });

    const screen = render(<BookingConfirmationStep onPrevious={jest.fn()} />);
    expect(screen.getByText(copy)).toBeTruthy();
    expect(screen.queryByText('Pay your guide in cash.')).toBeNull();
    if (terminalPhase === 'paid') {
      expect(screen.queryByText(/cash payment/i)).toBeNull();
    }
  });

  test.each([
    ['restitution_pending', 'Payment return is pending. Do not pay again or switch methods.'],
    ['restituted', 'Payment was returned. Do not pay again; review this booking before choosing another method.'],
    ['restitution_failed', 'Payment return needs support. Do not pay again or switch methods.'],
  ] as const)('keeps %s restitution truth on confirmation', (terminalPhase, copy) => {
    useBookingStore.setState({
      bookingData: {
        ...bookingFormData,
        payment: { method: 'promptpay', amount: 1800, serviceFee: 0, totalAmount: 1800, currency: 'THB', terms: false },
        currentStep: 7,
      },
    });
    seedPayment({ selectedMethod: 'promptpay', phase: terminalPhase as never });

    const screen = render(<BookingConfirmationStep onPrevious={jest.fn()} />);
    expect(screen.getByText(copy)).toBeTruthy();
    expect(screen.queryByText(/cash payment/i)).toBeNull();
  });

  test('renders the Phase 01 checkout and confirmation in Thai without English fallback copy', () => {
    mockLanguage = 'th';
    seedPayment({ selectedMethod: 'cash' });
    const checkout = renderPaymentStep();

    expect(checkout.queryByRole("radio", { name: /พร้อมเพย์/ })).toBeNull();
    expect(usePaymentStore.getState().selectedMethod).toBe("cash");
    expect(checkout.queryByText('Payment safety')).toBeNull();
    cleanup();

    useBookingStore.setState({
      bookingData: {
        ...bookingFormData,
        payment: { method: 'cash', amount: 1800, serviceFee: 0, totalAmount: 1800, currency: 'THB', terms: false },
        currentStep: 7,
      },
    });
    const confirmation = render(<BookingConfirmationStep onPrevious={jest.fn()} />);
    expect(confirmation.getByText('ชำระเงินสดให้ไกด์ของคุณ')).toBeTruthy();
    expect(confirmation.queryByText('Your local guide starts in')).toBeNull();
  });
});
