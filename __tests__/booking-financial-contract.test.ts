jest.mock('axios', () => ({
  __esModule: true,
  default: { post: jest.fn(), get: jest.fn(), patch: jest.fn(), isAxiosError: jest.fn() },
}));
jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  useQueryClient: () => ({ invalidateQueries: jest.fn() }),
}));
jest.mock('@/utils/secure-storage', () => ({
  secureStorage: { getItemAsync: jest.fn(), setItemAsync: jest.fn() },
}));
const mockAuthState: { user: null | { id: string } } = { user: null };
jest.mock('@/stores/auth-store', () => ({ useAuthStore: { getState: () => mockAuthState } }));
jest.mock('@/utils/booking-notifications', () => ({
  scheduleThreeHourBookingReminder: jest.fn(),
  showBookingCreatedNotification: jest.fn(),
  syncBookingReminderNotifications: jest.fn(),
}));
jest.mock('@/utils/api-errors', () => ({ handleApiError: jest.fn(), isUnauthorizedError: jest.fn() }));
jest.mock('@/constants/payment-capabilities', () => ({ isLocalPromptPayEnabled: jest.fn() }));
jest.mock('@/utils/companion-display', () => ({ isTestCompanionId: jest.fn() }));
jest.mock('@/constants/api', () => ({ API_BASE_URL: 'http://127.0.0.1:8787', apiUrl: (path: string) => path }));

import axios from 'axios';
import { createBooking, parseCreateBookingResponse } from '@/services/api/booking/booking';
import { useReviewBookingFixtureStore } from '@/stores/review-booking-fixture-store';

const responseWith = (paymentStatus: string, currency?: string) => ({
  success: true,
  message: 'Created',
  data: {
    booking: {
      id: 'booking-1',
      status: 'confirmed',
      paymentStatus,
      totalAmount: 1800,
      ...(currency === undefined ? {} : { currency }),
    },
  },
});

describe('booking financial response contract', () => {
  const originalReviewMode = process.env.EXPO_PUBLIC_REVIEW_MODE;

  afterEach(() => {
    process.env.EXPO_PUBLIC_REVIEW_MODE = originalReviewMode;
    mockAuthState.user = null;
    useReviewBookingFixtureStore.getState().reset();
    jest.clearAllMocks();
  });

  test('an enabled legacy review flag cannot fabricate checkout success after a backend failure', async () => {
    process.env.EXPO_PUBLIC_REVIEW_MODE = 'true';
    mockAuthState.user = { id: 'demo_customer_001' };
    (axios.post as jest.Mock).mockRejectedValueOnce(new Error('Backend unavailable'));
    await expect(createBooking({
      companionId: 'demo_companion_001', serviceId: 'review_experience_bangkok_001',
      date: '2099-11-20', startTime: '10:00', endTime: '13:00', duration: 180,
      location: 'Bangkok Old Town',
    })).rejects.toThrow();
    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(useReviewBookingFixtureStore.getState().booking).toBeNull();
  });

  test.each([
    'pending',
    'processing',
    'paid',
    'failed',
    'refunded',
    'restitution_pending',
    'restituted',
    'restitution_failed',
  ])('preserves canonical booking payment status %s', (paymentStatus) => {
    expect(parseCreateBookingResponse(responseWith(paymentStatus))).toMatchObject({
      data: { booking: { paymentStatus } },
    });
  });

  test('preserves an explicit non-THB booking currency unchanged', () => {
    expect(parseCreateBookingResponse(responseWith('pending', 'USD'))).toMatchObject({
      data: { booking: { currency: 'USD' } },
    });
  });

  test('does not invent currency when the backend omits it', () => {
    expect(parseCreateBookingResponse(responseWith('pending')).data.booking).not.toHaveProperty('currency');
  });

  test.each(['', 'completed', 'unknown', null])('rejects unsupported payment status %s', (paymentStatus) => {
    expect(() => parseCreateBookingResponse(responseWith(paymentStatus as string))).toThrow(
      'Invalid booking payment status',
    );
  });

  test.each([0, -1, Number.POSITIVE_INFINITY, '1800'])('rejects invalid booking total %s', (totalAmount) => {
    const response = responseWith('pending') as unknown as {
      data: { booking: { totalAmount: unknown } };
    };
    response.data.booking.totalAmount = totalAmount;

    expect(() => parseCreateBookingResponse(response)).toThrow('Invalid booking total');
  });
});
