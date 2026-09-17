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

jest.mock('@/app/api/payment/payment', () => {
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
jest.mock('@/app/api/booking/booking', () => ({
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

  test('shows cash plus an ineligible PromptPay method for an unconfirmed booking', () => {
    seedPayment({ booking: { id: 'booking-1', status: 'pending', paymentStatus: 'pending' } });
    const screen = renderPaymentStep();

    expect(screen.getByText('Cash')).toBeTruthy();
    expect(screen.getByText('PromptPay')).toBeTruthy();
    expect(screen.getByText('PromptPay becomes available when this booking is confirmed.')).toBeTruthy();
    const method = screen.getByLabelText(/^PromptPay payment method/);
    expect(method.props.accessibilityState.disabled).toBe(true);
    expect(StyleSheet.flatten(method.props.style).opacity).toBe(1);
    expect(StyleSheet.flatten(
      screen.getByText('Pay with a Thai banking app after your guide confirms the booking.').props.style,
    ).color).toBe('#6B7280');
    expect(StyleSheet.flatten(
      screen.getByText('PromptPay becomes available when this booking is confirmed.').props.style,
    ).color).toBe('#6B7280');
  });

  test('a confirmed booking exposes one guarded Create PromptPay QR action', async () => {
    let resolveCharge!: (value: typeof pendingCharge) => void;
    mockCreatePromptPayCharge.mockReturnValueOnce(new Promise((resolve) => { resolveCharge = resolve; }));
    seedPayment();
    const screen = renderPaymentStep();

    fireEvent.press(screen.getByLabelText(/^PromptPay payment method/));
    expect(screen.getByLabelText('Create PromptPay QR')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Create PromptPay QR'));
    fireEvent.press(screen.getByLabelText('Creating QR...'));

    expect(mockCreatePromptPayCharge).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Cash')).toBeTruthy();
    expect(screen.getByLabelText(/^Cash payment method/).props.accessibilityState.disabled).toBe(true);

    await act(async () => resolveCharge(pendingCharge));
  });

  test('keeps the confirmed pre-request action and footer reachable in the checkout scroll region', () => {
    seedPayment();
    const screen = renderPaymentStep();

    fireEvent.press(screen.getByLabelText(/^PromptPay payment method/));
    const checkout = within(screen.getByLabelText('Payment checkout content'));

    expect(checkout.getByLabelText(/^PromptPay payment method/)).toBeTruthy();
    expect(checkout.getByLabelText('Create PromptPay QR')).toBeTruthy();
    expect(checkout.getByLabelText('Continue')).toBeTruthy();
  });

  test('keeps selected locked PromptPay copy high contrast without dimming the card', () => {
    seedPayment({
      selectedMethod: 'promptpay',
      phase: 'pending',
      charge: pendingCharge,
    });
    const screen = renderPaymentStep();

    expect(StyleSheet.flatten(
      screen.getByLabelText(/^PromptPay payment method/).props.style,
    ).opacity).toBe(1);
    expect(StyleSheet.flatten(screen.getByText('PromptPay').props.style).color).toBe('#111827');
    expect(StyleSheet.flatten(
      screen.getByText('Pay with a Thai banking app after your guide confirms the booking.').props.style,
    ).color).toBe('#6B7280');
    expect(screen.getAllByText('Wait for payment status before changing methods.').every(
      (copy) => StyleSheet.flatten(copy.props.style).color === '#6B7280',
    )).toBe(true);
    expect(StyleSheet.flatten(screen.getByText('Local test').props.style).color).toBe('#111827');
  });

  test.each([
    ['creating', null],
    ['error', 'in-progress'],
    ['error', 'indeterminate'],
    ['error', 'network'],
    ['error', 'unknown'],
    ['pending', null],
  ] as const)('locks cash while the payment state is %s / %s', (phase, errorKind) => {
    seedPayment({
      selectedMethod: 'promptpay',
      phase,
      errorKind,
      charge: phase === 'pending' ? pendingCharge : null,
    });
    const screen = renderPaymentStep();

    expect(screen.getByText('Cash')).toBeTruthy();
    expect(screen.getByLabelText(/^Cash payment method/).props.accessibilityState.disabled).toBe(true);
    if (phase !== 'pending') {
      expect(screen.getAllByText(
        phase === 'creating'
          ? 'Creating QR...'
          : 'Payment status is uncertain. Do not pay again or switch methods. Check this booking later.',
      ).length).toBeGreaterThan(0);
    }
  });

  test('a definite no-charge error re-enables cash with truthful copy', () => {
    seedPayment({ selectedMethod: 'promptpay', phase: 'error', errorKind: 'disabled' });
    const screen = renderPaymentStep();

    expect(screen.getByText('PromptPay is unavailable in this environment. Choose cash.')).toBeTruthy();
    expect(screen.getByLabelText(/^Cash payment method/).props.accessibilityState.disabled).toBe(false);
  });

  test('an already-paid booking disables every payment action and never renders cash instructions', () => {
    seedPayment({
      booking: { id: 'booking-1', status: 'confirmed', paymentStatus: 'paid' },
      selectedMethod: 'promptpay',
      phase: 'paid' as never,
      errorKind: 'already-paid' as never,
      charge: { ...pendingCharge, attemptStatus: 'successful', paymentStatus: 'paid' },
    });
    const screen = renderPaymentStep();

    expect(screen.getByText('This booking is already paid or refunded. Do not pay again.')).toBeTruthy();
    expect(screen.getByLabelText(/^Cash payment method/).props.accessibilityState.disabled).toBe(true);
    expect(screen.getByLabelText(/^PromptPay payment method/).props.accessibilityState.disabled).toBe(true);
    expect(screen.queryByText('Pay your local guide directly in cash.')).toBeNull();
    expect(screen.queryByText('Pay with a Thai banking app after your guide confirms the booking.')).toBeNull();
    expect(screen.getByLabelText('Continue').props.accessibilityState.disabled).toBe(false);
  });

  test('an authoritative paid booking can continue even when cash was previously selected', () => {
    seedPayment({
      booking: { id: 'booking-1', status: 'confirmed', paymentStatus: 'paid' },
      selectedMethod: 'cash',
      phase: 'idle',
    });

    const screen = renderPaymentStep();
    expect(screen.getByText('Payment confirmed. Do not pay again.')).toBeTruthy();
    expect(screen.queryByText('Pay your local guide directly in cash.')).toBeNull();
    expect(screen.getByLabelText('Continue').props.accessibilityState.disabled).toBe(false);
  });

  test.each([
    ['paid', 'Payment confirmed. Do not pay again.'],
    ['failed', 'PromptPay payment failed. Choose cash or try PromptPay again.'],
    ['expired', 'The PromptPay QR expired. Choose cash or create a new QR.'],
    ['indeterminate', 'Payment status is uncertain. Do not pay again or switch methods. Check this booking later.'],
  ] as const)('renders explicit %s PromptPay truth', (terminalPhase, copy) => {
    seedPayment({
      selectedMethod: 'promptpay',
      phase: terminalPhase as never,
      charge: terminalPhase === 'paid'
        ? { ...pendingCharge, attemptStatus: 'successful', paymentStatus: 'paid' }
        : null,
    });

    const screen = renderPaymentStep();
    expect(screen.getByText(copy)).toBeTruthy();
  });

  test.each([
    ['restitution_pending', 'Payment return is pending. Do not pay again or switch methods.'],
    ['restituted', 'Payment was returned. Do not pay again; review this booking before choosing another method.'],
    ['restitution_failed', 'Payment return needs support. Do not pay again or switch methods.'],
  ] as const)('locks alternate methods during %s and shows restitution truth', (terminalPhase, copy) => {
    seedPayment({ selectedMethod: 'promptpay', phase: terminalPhase as never });

    const screen = renderPaymentStep();
    expect(screen.getByText(copy)).toBeTruthy();
    expect(screen.getByLabelText(/^Cash payment method/).props.accessibilityState.disabled).toBe(true);
    expect(screen.getByLabelText(/^PromptPay payment method/).props.accessibilityState.disabled).toBe(true);
    expect(screen.queryByText('Pay your local guide directly in cash.')).toBeNull();
    expect(screen.getByLabelText('Continue').props.accessibilityState.disabled).toBe(false);
  });

  test.each([
    ['processing', 'Payment status is uncertain. Do not pay again or switch methods. Check this booking later.'],
    ['paid', 'Payment confirmed. Do not pay again.'],
    ['refunded', 'Payment return is pending. Do not pay again or switch methods.'],
    ['restitution_pending', 'Payment return is pending. Do not pay again or switch methods.'],
    ['restituted', 'Payment was returned. Do not pay again; review this booking before choosing another method.'],
    ['restitution_failed', 'Payment return needs support. Do not pay again or switch methods.'],
  ] as const)('locks methods and preserves booking-level %s truth', (paymentStatus, copy) => {
    seedPayment({
      booking: { id: 'booking-1', status: 'confirmed', paymentStatus },
      phase: 'idle',
      selectedMethod: null,
    });

    const screen = renderPaymentStep();

    expect(screen.getByText(copy)).toBeTruthy();
    expect(screen.getByRole('radio', { name: /Cash payment method/ }).props.accessibilityState.disabled).toBe(true);
    expect(screen.getByRole('radio', { name: /PromptPay payment method/ }).props.accessibilityState.disabled).toBe(true);
  });

  test.each(['failed', 'expired'] as const)('offers a safe same-booking retry for %s', async (phase) => {
    mockCreatePromptPayCharge.mockResolvedValueOnce(pendingCharge);
    seedPayment({
      booking: { id: 'booking-1', status: 'confirmed', paymentStatus: 'failed' },
      selectedMethod: 'promptpay',
      phase,
      charge: { ...pendingCharge, attemptStatus: phase, paymentStatus: 'failed' },
    });

    const screen = renderPaymentStep();
    fireEvent.press(screen.getByLabelText('Try PromptPay again'));

    await waitFor(() => expect(usePaymentStore.getState().phase).toBe('pending'));
    expect(mockCreatePromptPayCharge).toHaveBeenCalledTimes(1);
  });

  test.each(['pending', 'indeterminate', 'paid', 'restitution_pending', 'restituted', 'restitution_failed'] as const)(
    'does not expose retry for %s',
    (phase) => {
      seedPayment({ selectedMethod: 'promptpay', phase, charge: phase === 'pending' ? pendingCharge : null });
      const screen = renderPaymentStep();

      expect(screen.queryByLabelText('Try PromptPay again')).toBeNull();
    },
  );

  test.each(['creating', 'pending', 'indeterminate'] as const)(
    'blocks backward navigation for %s',
    (phase) => {
      seedPayment({ selectedMethod: 'promptpay', phase, charge: phase === 'pending' ? pendingCharge : null });
      const screen = renderPaymentStep();

      expect(screen.getByLabelText('Back').props.accessibilityState.disabled).toBe(true);
    },
  );

  test('includes local-test and active lock reason in PromptPay accessibility metadata', () => {
    seedPayment({ selectedMethod: 'promptpay', phase: 'pending', charge: pendingCharge });
    const screen = renderPaymentStep();
    const promptPay = screen.getByRole('radio', {
      name: 'PromptPay payment method. Local test. Wait for payment status before changing methods.',
    });

    expect(promptPay.props.accessibilityHint).toBe('Wait for payment status before changing methods.');
  });

  test('fails PromptPay closed when booking response explicitly names a non-THB currency', () => {
    seedPayment({
      booking: { id: 'booking-1', status: 'confirmed', paymentStatus: 'pending', currency: 'USD' },
    });
    const screen = renderPaymentStep();

    expect(screen.getByRole('radio', { name: /PromptPay payment method/ }).props.accessibilityState.disabled).toBe(true);
    expect(screen.getByText('PromptPay requires a THB booking total. Choose cash for this booking.')).toBeTruthy();
  });

  test('moves accessibility focus to payment recovery after a creation error', async () => {
    const focus = jest.spyOn(ReactNative.AccessibilityInfo, 'setAccessibilityFocus').mockImplementation(() => undefined);
    const findHandle = jest.spyOn(require('react-native'), 'findNodeHandle').mockReturnValue(42);
    seedPayment({ selectedMethod: 'promptpay', phase: 'error', errorKind: 'disabled' });

    renderPaymentStep();

    await waitFor(() => expect(focus).toHaveBeenCalledWith(42));
    findHandle.mockRestore();
    focus.mockRestore();
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
    seedPayment({ selectedMethod: 'promptpay', phase: 'expired' as never });
    const checkout = renderPaymentStep();

    expect(checkout.getByText('คิวอาร์พร้อมเพย์หมดอายุแล้ว เลือกเงินสดหรือสร้างคิวอาร์ใหม่')).toBeTruthy();
    expect(checkout.getByRole('radio', {
      name: 'วิธีชำระด้วยพร้อมเพย์. ทดสอบในเครื่อง.',
    })).toBeTruthy();
    expect(checkout.queryByText('Payment safety')).toBeNull();
    cleanup();

    useBookingStore.setState({
      bookingData: {
        ...bookingFormData,
        payment: { method: 'promptpay', amount: 1800, serviceFee: 0, totalAmount: 1800, currency: 'THB', terms: false },
        currentStep: 7,
      },
    });
    const confirmation = render(<BookingConfirmationStep onPrevious={jest.fn()} />);
    expect(confirmation.getByText('คิวอาร์พร้อมเพย์หมดอายุแล้ว เลือกเงินสดหรือสร้างคิวอาร์ใหม่')).toBeTruthy();
    expect(confirmation.queryByText('Your local guide starts in')).toBeNull();
  });
});
