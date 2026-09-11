import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react-native';

const mockMutateAsync = jest.fn();
const mockSetPaymentBooking = jest.fn();
const mockOnNext = jest.fn();

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn().mockResolvedValue(null),
    setItem: jest.fn().mockResolvedValue(undefined),
    removeItem: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('lucide-react-native', () => new Proxy({}, {
  get: () => () => {
    const ReactRuntime = require('react');
    const NativeView = require('react-native').View;
    return ReactRuntime.createElement(NativeView);
  },
}));

jest.mock('@/components/ui/Card', () => {
  const ReactRuntime = require('react');
  const NativeView = require('react-native').View;
  return {
    Card: ({ children }: { children: React.ReactNode }) => ReactRuntime.createElement(NativeView, null, children),
  };
});

jest.mock('@/components/ui/ProfileImage', () => {
  const ReactRuntime = require('react');
  const NativeView = require('react-native').View;
  return { ProfileImage: () => ReactRuntime.createElement(NativeView) };
});

jest.mock('@/components/booking/BookingStepFooter', () => {
  const ReactRuntime = require('react');
  const { Text: NativeText, TouchableOpacity: NativeTouchableOpacity } = require('react-native');
  return {
    BookingStepFooter: ({ onNext, nextTitle, nextDisabled, loading }: {
      onNext: () => void;
      nextTitle: string;
      nextDisabled?: boolean;
      loading?: boolean;
    }) => ReactRuntime.createElement(
      NativeTouchableOpacity,
      {
        accessibilityRole: 'button',
        accessibilityLabel: nextTitle,
        accessibilityState: { disabled: Boolean(nextDisabled || loading), busy: Boolean(loading) },
        disabled: nextDisabled || loading,
        onPress: onNext,
      },
      ReactRuntime.createElement(NativeText, null, nextTitle),
    ),
  };
});

jest.mock('@/app/api/booking/booking', () => ({
  createBooking: jest.fn(),
  useCreateBooking: () => ({ isPending: false, mutateAsync: mockMutateAsync }),
}));

jest.mock('@/stores/payment-store', () => ({
  usePaymentStore: (selector: (state: { setBooking: typeof mockSetPaymentBooking }) => unknown) => (
    selector({ setBooking: mockSetPaymentBooking })
  ),
}));

jest.mock('posthog-react-native', () => ({
  usePostHog: () => ({ capture: jest.fn() }),
}));

jest.mock('react-i18next', () => {
  const en = require('../locales/en.json') as Record<string, unknown>;
  const translate = (key: string) => {
    const value = key.split('.').reduce<unknown>((current, segment) => (
      current && typeof current === 'object'
        ? (current as Record<string, unknown>)[segment]
        : undefined
    ), en);
    return typeof value === 'string' ? value : key;
  };
  return {
    useTranslation: () => ({
      t: translate,
      i18n: { language: 'en', resolvedLanguage: 'en' },
    }),
  };
});

import { BookingSummaryStep } from '@/components/booking/steps/BookingSummaryStep';
import { useBookingStore } from '@/stores/booking-store';

const bookingData = {
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
    customizations: { groupSize: 4, addOns: ['lunch', 'photos'] },
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

const successfulBooking = {
  success: true,
  message: 'Created',
  data: {
    booking: {
      id: 'booking-1',
      status: 'confirmed',
      paymentStatus: 'pending',
      totalAmount: 1800,
      duration: 120,
    },
  },
};

describe('booking summary contracts', () => {
  beforeEach(() => {
    mockMutateAsync.mockReset();
    mockSetPaymentBooking.mockReset();
    mockOnNext.mockReset();
    useBookingStore.setState({ bookingData, isLoading: false, error: null, services: [] });
  });

  afterEach(() => cleanup());

  test('uses the one bookable guide quote and does not price unsupported group or add-on inputs', () => {
    const screen = render(<BookingSummaryStep onNext={mockOnNext} onPrevious={jest.fn()} />);

    expect(screen.getAllByText('฿1,800').length).toBeGreaterThan(0);
    expect(screen.queryByText('฿8,300')).toBeNull();
    expect(screen.queryByText('฿1,100')).toBeNull();
  });

  test('exposes the terms agreement as a real checkbox with checked state', () => {
    const screen = render(<BookingSummaryStep onNext={mockOnNext} onPrevious={jest.fn()} />);
    const checkbox = screen.getByRole('checkbox');

    expect(checkbox.props.accessibilityState.checked).toBe(false);
    fireEvent.press(checkbox);
    expect(screen.getByRole('checkbox').props.accessibilityState.checked).toBe(true);
  });

  test('latches synchronously so two same-render presses submit one booking', async () => {
    let resolveBooking!: (value: typeof successfulBooking) => void;
    mockMutateAsync.mockReturnValue(new Promise((resolve) => { resolveBooking = resolve; }));
    const screen = render(<BookingSummaryStep onNext={mockOnNext} onPrevious={jest.fn()} />);

    fireEvent.press(screen.getByRole('checkbox'));
    const confirm = screen.getByLabelText('Confirm');
    fireEvent.press(confirm);
    fireEvent.press(confirm);

    await waitFor(() => expect(mockMutateAsync).toHaveBeenCalledTimes(1));
    expect(screen.getByLabelText('Confirm').props.accessibilityState).toMatchObject({
      disabled: true,
      busy: true,
    });

    await act(async () => resolveBooking(successfulBooking));
    expect(mockSetPaymentBooking).toHaveBeenCalledWith(expect.objectContaining({ id: 'booking-1' }));
  });
});
