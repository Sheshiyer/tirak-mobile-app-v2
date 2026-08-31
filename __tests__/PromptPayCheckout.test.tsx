import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react-native';

const mockCreatePromptPayCharge = jest.fn();

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
  const { Text: NativeText, TouchableOpacity: NativeTouchableOpacity } = require('react-native');
  return {
    BookingStepFooter: ({ onNext, nextTitle, nextDisabled, loading }: { onNext: () => void; nextTitle: string; nextDisabled?: boolean; loading?: boolean }) => ReactRuntime.createElement(
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
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => ({
      'bookingConfirmation.noCompanionData': 'No guide data available',
      'bookingConfirmation.bookingId': 'Booking ID',
      'bookingConfirmation.message': 'Message',
      'bookingConfirmation.bookingDetails': 'Booking Details',
      'bookingConfirmation.service': 'Service',
      'bookingConfirmation.dateTime': 'Date & Time',
      'bookingConfirmation.meetingPoint': 'Meeting Point',
      'bookingConfirmation.paymentMethod': 'Payment Method',
      'bookingConfirmation.totalAmount': 'Guide Rate',
      'bookingConfirmation.whatsNext': 'What happens next?',
      'bookingConfirmation.waitForConfirmation': 'Wait for Confirmation',
      'bookingConfirmation.waitForConfirmationDescription': 'Your local guide will confirm your booking within 24 hours.',
      'bookingConfirmation.prepareForYourExperience': 'Plan the details',
      'bookingConfirmation.prepareForYourExperienceDescription': 'Use chat to plan the details.',
      'bookingConfirmation.meetAtTheLocation': 'Meet at the public start point',
      'bookingConfirmation.meetAtTheLocationDescription': 'Arrive early.',
      'bookingConfirmation.bookings': 'Bookings',
      'bookingConfirmation.backToHome': 'Back to Home',
      'payments.bookingRequestSent': 'Booking request sent',
      'payments.bookingConfirmed': 'Booking confirmed',
      'payments.cashState': 'Pay your guide in cash.',
      'payments.promptPayPendingState': 'PromptPay payment pending.',
    } as Record<string, string>)[key] ?? key,
  }),
}));

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

  test('shows cash plus an ineligible PromptPay method for an unconfirmed booking', () => {
    seedPayment({ booking: { id: 'booking-1', status: 'pending', paymentStatus: 'pending' } });
    const screen = renderPaymentStep();

    expect(screen.getByText('Cash')).toBeTruthy();
    expect(screen.getByText('PromptPay')).toBeTruthy();
    expect(screen.getByText('PromptPay becomes available when this booking is confirmed.')).toBeTruthy();
    expect(screen.getByLabelText('PromptPay payment method').props.accessibilityState.disabled).toBe(true);
  });

  test('a confirmed booking exposes one guarded Create PromptPay QR action', async () => {
    let resolveCharge!: (value: typeof pendingCharge) => void;
    mockCreatePromptPayCharge.mockReturnValueOnce(new Promise((resolve) => { resolveCharge = resolve; }));
    seedPayment();
    const screen = renderPaymentStep();

    fireEvent.press(screen.getByLabelText('PromptPay payment method'));
    expect(screen.getByLabelText('Create PromptPay QR')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Create PromptPay QR'));
    fireEvent.press(screen.getByLabelText('Creating QR...'));

    expect(mockCreatePromptPayCharge).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Cash')).toBeTruthy();
    expect(screen.getByLabelText('Cash payment method').props.accessibilityState.disabled).toBe(true);

    await act(async () => resolveCharge(pendingCharge));
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
    expect(screen.getByLabelText('Cash payment method').props.accessibilityState.disabled).toBe(true);
    if (phase !== 'pending') {
      expect(screen.getByText(
        phase === 'creating'
          ? 'Creating QR...'
          : 'Payment status is uncertain. Do not pay again or switch methods. Check this booking later.',
      )).toBeTruthy();
    }
  });

  test('a definite no-charge error re-enables cash with truthful copy', () => {
    seedPayment({ selectedMethod: 'promptpay', phase: 'error', errorKind: 'disabled' });
    const screen = renderPaymentStep();

    expect(screen.getByText('PromptPay is unavailable in this environment. Choose cash.')).toBeTruthy();
    expect(screen.getByLabelText('Cash payment method').props.accessibilityState.disabled).toBe(false);
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
});
