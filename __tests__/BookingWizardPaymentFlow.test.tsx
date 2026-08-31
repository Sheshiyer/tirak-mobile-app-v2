import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

const mockMutateAsync = jest.fn();
const mockCapture = jest.fn();

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn().mockResolvedValue(null),
    setItem: jest.fn().mockResolvedValue(undefined),
    removeItem: jest.fn().mockResolvedValue(undefined),
    multiRemove: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('expo-router', () => ({
  router: { back: jest.fn(), push: jest.fn() },
  useLocalSearchParams: () => ({}),
}));
jest.mock('posthog-react-native', () => ({ usePostHog: () => ({ capture: mockCapture }) }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock('lucide-react-native', () => new Proxy({}, {
  get: (_target, name) => {
    const ReactRuntime = require('react');
    const NativeView = require('react-native').View;
    const Icon = () => ReactRuntime.createElement(NativeView, { accessibilityLabel: `${String(name)} icon` });
    Icon.displayName = String(name);
    return Icon;
  },
}));
jest.mock('@/components/ui/RadialGradient', () => {
  const ReactRuntime = require('react');
  const NativeView = require('react-native').View;
  return { RadialGradient: ({ children }: { children: React.ReactNode }) => ReactRuntime.createElement(NativeView, null, children) };
});
jest.mock('@/components/ui/ProgressBar', () => {
  const ReactRuntime = require('react');
  const NativeView = require('react-native').View;
  return { ProgressBar: () => ReactRuntime.createElement(NativeView) };
});
jest.mock('@/components/ui/Card', () => {
  const ReactRuntime = require('react');
  const NativeView = require('react-native').View;
  return { Card: ({ children }: { children: React.ReactNode }) => ReactRuntime.createElement(NativeView, null, children) };
});
jest.mock('@/components/ui/ProfileImage', () => {
  const ReactRuntime = require('react');
  const NativeView = require('react-native').View;
  return { ProfileImage: () => ReactRuntime.createElement(NativeView) };
});
jest.mock('@/components/ui/Button', () => {
  const ReactRuntime = require('react');
  const { Text: NativeText, TouchableOpacity: NativeTouchableOpacity } = require('react-native');
  return {
    Button: ({ title, onPress, disabled }: { title: string; onPress: () => void; disabled?: boolean }) => ReactRuntime.createElement(
      NativeTouchableOpacity,
      { accessibilityRole: 'button', accessibilityLabel: title, disabled, onPress },
      ReactRuntime.createElement(NativeText, null, title),
    ),
  };
});
jest.mock('@/components/booking/BookingStepFooter', () => {
  const ReactRuntime = require('react');
  const { Text: NativeText, TouchableOpacity: NativeTouchableOpacity } = require('react-native');
  return {
    BookingStepFooter: ({ onNext, nextTitle = 'Continue', nextDisabled }: { onNext: () => void; nextTitle?: string; nextDisabled?: boolean }) => ReactRuntime.createElement(
      NativeTouchableOpacity,
      { accessibilityRole: 'button', accessibilityLabel: nextTitle, disabled: nextDisabled, onPress: onNext },
      ReactRuntime.createElement(NativeText, null, nextTitle),
    ),
  };
});

const mockTextStep = (text: string) => {
  const ReactRuntime = require('react');
  const NativeText = require('react-native').Text;
  return ReactRuntime.createElement(NativeText, null, text);
};

jest.mock('@/components/booking/steps/ServiceSelectionStep', () => ({ ServiceSelectionStep: () => mockTextStep('SERVICE_STEP') }));
jest.mock('@/components/booking/steps/DateTimePickerStep', () => ({ DateTimePickerStep: () => mockTextStep('DATE_STEP') }));
jest.mock('@/components/booking/steps/LocationSelectionStep', () => ({ LocationSelectionStep: () => mockTextStep('LOCATION_STEP') }));
jest.mock('@/components/booking/steps/SpecialRequestsStep', () => ({ SpecialRequestsStep: () => mockTextStep('REQUEST_STEP') }));
jest.mock('@/components/booking/steps/PaymentSelectionStep', () => {
  const ReactRuntime = require('react');
  const { Text: NativeText, TouchableOpacity: NativeTouchableOpacity, View: NativeView } = require('react-native');
  return {
    PaymentSelectionStep: ({ onNext }: { onNext: () => void }) => ReactRuntime.createElement(
      NativeView,
      null,
      ReactRuntime.createElement(NativeText, null, 'PAYMENT_STEP'),
      ReactRuntime.createElement(
        NativeTouchableOpacity,
        { accessibilityRole: 'button', accessibilityLabel: 'Continue from payment', onPress: onNext },
        ReactRuntime.createElement(NativeText, null, 'Continue from payment'),
      ),
    ),
  };
});
jest.mock('@/components/booking/steps/BookingConfirmationStep', () => ({ BookingConfirmationStep: () => mockTextStep('CONFIRMATION_STEP') }));
jest.mock('@/app/api/booking/booking', () => ({
  createBooking: jest.fn(),
  useCreateBooking: () => ({ mutateAsync: mockMutateAsync, isPending: false }),
}));
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

import { BookingWizard } from '@/components/booking/BookingWizard';
import { useBookingStore } from '@/stores/booking-store';
import { usePaymentStore } from '@/stores/payment-store';

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
  currentStep: 5,
  isComplete: false,
  errors: {},
};

describe('booking wizard payment routing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    usePaymentStore.getState().resetPayment();
    useBookingStore.setState({ bookingData: bookingFormData, isLoading: false, error: null });
    mockMutateAsync.mockResolvedValue({
      success: true,
      message: 'Created',
      data: {
        booking: {
          id: 'booking-confirmed-1',
          status: 'confirmed',
          paymentStatus: 'pending',
          totalAmount: 1800,
          duration: 120,
        },
      },
    });
  });

  test('stores booking truth before summary -> payment -> confirmation navigation', async () => {
    const screen = render(<BookingWizard />);

    fireEvent.press(screen.getByText(/bookingSummary\.agreeToTermsAndConditions/));
    await act(async () => fireEvent.press(screen.getByLabelText('bookingSummary.confirm')));

    await waitFor(() => expect(screen.getByText('PAYMENT_STEP')).toBeTruthy());
    expect(usePaymentStore.getState().booking).toEqual({
      id: 'booking-confirmed-1',
      status: 'confirmed',
      paymentStatus: 'pending',
    });

    fireEvent.press(screen.getByLabelText('Continue from payment'));
    expect(screen.getByText('CONFIRMATION_STEP')).toBeTruthy();
  });
});
