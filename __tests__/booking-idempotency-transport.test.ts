/**
 * Gap 1: Booking mutation must forward Idempotency-Key through the single
 * createBooking transport. Same payload reuse keeps the key; explicit new
 * attempts rotate the key; keys are stable UUIDs persisted
 * before the first POST.
 */
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
(mockedAxios.isAxiosError as unknown as jest.Mock) = jest.fn(() => false);
(mockedAxios.post as jest.Mock) = jest.fn();

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn().mockResolvedValue(null),
    setItem: jest.fn().mockResolvedValue(undefined),
    removeItem: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('@/utils/secure-storage', () => ({
  secureStorage: {
    getItemAsync: jest.fn().mockResolvedValue('test-token'),
    setItemAsync: jest.fn().mockResolvedValue(undefined),
    deleteItemAsync: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('@/utils/booking-notifications', () => ({
  showBookingCreatedNotification: jest.fn().mockResolvedValue(undefined),
  scheduleThreeHourBookingReminder: jest.fn().mockResolvedValue(undefined),
  syncBookingReminderNotifications: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/constants/payment-capabilities', () => ({
  isLocalPromptPayEnabled: () => false,
}));

jest.mock('@/utils/companion-display', () => ({
  isTestCompanionId: () => false,
}));

jest.mock('@/utils/demo-mode', () => ({
  getDemoModeEnabled: jest.fn().mockResolvedValue(false),
  isDemoModeEnabled: () => false,
  isDemoIdentity: () => false,
}));

jest.mock('@/stores/review-booking-fixture-store', () => ({
  useReviewBookingFixtureStore: { getState: () => ({}) },
  reviewBookingToBooking: jest.fn(),
  reviewBookingToListItem: jest.fn(),
}));

jest.mock('@/constants/review-mode', () => ({
  isReviewAccountUser: () => false,
  isReviewModeEnabled: () => false,
  REVIEW_ACCOUNTS: {},
}));

jest.mock('@/utils/api-errors', () => ({
  handleApiError: jest.fn(),
  isUnauthorizedError: () => false,
}));

jest.mock('@/stores/auth-store', () => ({
  useAuthStore: { getState: () => ({ user: { id: 'user-1' } }) },
}));

jest.mock('@/constants/api', () => ({
  API_BASE_URL: 'https://test.example.com',
  apiUrl: (path: string) => `https://test.example.com${path}`,
}));

import { createBooking, BookingIdempotencyConflictError, BookingScheduleConflictError } from '@/services/api/booking/booking';
import { isValidUuid } from '@/utils/idempotency';
import { useBookingStore } from '@/stores/booking-store';

const validPayload = () => ({
  companionId: '11111111-1111-4111-8111-111111111111',
  serviceId: '22222222-2222-4222-8222-222222222222',
  date: '2026-10-10',
  startTime: '10:00',
  endTime: '12:00',
  duration: 120,
  location: 'Bangkok',
  meetingPoint: 'Station',
});

const successfulResponse = {
  data: {
    success: true,
    message: 'Created',
    data: {
      booking: {
        id: 'booking-real-1',
        companionId: '11111111-1111-4111-8111-111111111111',
        companion: { id: '11111111-1111-4111-8111-111111111111', name: 'Guide', profileImage: '' },
        customerId: 'user-1',
        status: 'pending',
        totalAmount: 1800,
        serviceFee: 0,
        paymentStatus: 'pending',
        date: '2026-10-10',
        startTime: '10:00',
        endTime: '12:00',
        duration: 120,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        meetingPoint: 'Station',
      },
    },
  },
  status: 201,
  headers: {},
};

describe('booking idempotency transport', () => {
  beforeEach(() => {
    (mockedAxios.post as jest.Mock).mockReset();
    (mockedAxios.post as jest.Mock).mockResolvedValue(successfulResponse);
    useBookingStore.setState({
      bookingData: {
        ...useBookingStore.getState().bookingData,
        idempotencyKey: null,
      },
    });
  });

  test('createBooking forwards Idempotency-Key header when present on payload', async () => {
    const key = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';
    await createBooking({ ...validPayload(), idempotencyKey: key });

    const [, , config] = (mockedAxios.post as jest.Mock).mock.calls[0];
    expect(config.headers['Idempotency-Key']).toBe(key);
  });

  test('createBooking omits Idempotency-Key header when payload has no key', async () => {
    await createBooking(validPayload());

    const [, , config] = (mockedAxios.post as jest.Mock).mock.calls[0];
    expect(config.headers['Idempotency-Key']).toBeUndefined();
  });

  test('ensureIdempotencyKey returns a stable UUID persisted in store', () => {
    const store = useBookingStore.getState();
    const key1 = store.ensureIdempotencyKey();
    const key2 = store.ensureIdempotencyKey();

    expect(isValidUuid(key1)).toBe(true);
    expect(key1).toBe(key2); // same key on repeated calls
    expect(useBookingStore.getState().bookingData.idempotencyKey).toBe(key1);
  });

  test('startNewBookingAttempt produces a different UUID', () => {
    const store = useBookingStore.getState();
    const key1 = store.ensureIdempotencyKey();
    const key2 = store.startNewBookingAttempt();

    expect(isValidUuid(key2)).toBe(true);
    expect(key2).not.toBe(key1);
    expect(useBookingStore.getState().bookingData.idempotencyKey).toBe(key2);
  });

  test('prepareBookingRequest includes idempotencyKey from store', () => {
    useBookingStore.setState({
      bookingData: {
        ...useBookingStore.getState().bookingData,
        companionId: '11111111-1111-4111-8111-111111111111',
        service: {
          id: '22222222-2222-4222-8222-222222222222',
          name: 'Walk',
          description: 'A walk',
          price: 1800,
          duration: 2,
          category: 'walking',
        },
        dateTime: {
          date: '2026-10-10',
          time: '10:00',
          endTime: '12:00',
          duration: 2,
          isAvailable: true,
        },
        location: { area: 'Bangkok', meetingPoint: 'Station' },
      },
    });

    const req = useBookingStore.getState().prepareBookingRequest();
    expect(req).not.toBeNull();
    expect(isValidUuid(req!.idempotencyKey!)).toBe(true);
    expect(useBookingStore.getState().bookingData.attemptedBookingRequest).toEqual(req);

    // Calling again reuses the same key
    const req2 = useBookingStore.getState().prepareBookingRequest();
    expect(req2!.idempotencyKey).toBe(req!.idempotencyKey);
  });

  test('retryOriginalBookingRequest reuses the immutable first attempted payload', () => {
    useBookingStore.setState({
      bookingData: {
        ...useBookingStore.getState().bookingData,
        attemptedBookingRequest: {
          ...validPayload(),
          idempotencyKey: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
        },
      },
    });

    const retried = useBookingStore.getState().retryOriginalBookingRequest();
    expect(retried).toEqual({
      ...validPayload(),
      idempotencyKey: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
    });
  });

  test('createBooking distinguishes idempotency 409 from schedule 409', async () => {
    mockedAxios.isAxiosError.mockReturnValue(true);

    mockedAxios.post.mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 409, data: { code: 'IDEMPOTENCY_CONFLICT', message: 'same idempotency key used with different payload' } },
    });
    await expect(createBooking({ ...validPayload(), idempotencyKey: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee' }))
      .rejects.toBeInstanceOf(BookingIdempotencyConflictError);

    mockedAxios.post.mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 409, data: { code: 'SCHEDULE_CONFLICT', message: 'Selected slot is no longer available' } },
    });
    await expect(createBooking(validPayload())).rejects.toBeInstanceOf(BookingScheduleConflictError);
  });
});
