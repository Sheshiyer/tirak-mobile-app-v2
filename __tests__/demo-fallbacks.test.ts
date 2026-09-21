jest.mock('expo/virtual/env', () => ({ env: process['env'] }));
const mockAxios: any = Object.assign(jest.fn(), { get: jest.fn(), post: jest.fn(), put: jest.fn(), isAxiosError: (error: any) => Boolean(error?.isAxiosError) });
jest.mock('axios', () => ({ __esModule: true, default: mockAxios }));
jest.mock('@tanstack/react-query', () => ({ useQuery: jest.fn(), useMutation: jest.fn(), useQueryClient: jest.fn() }));
jest.mock('@/constants/api', () => ({ API_BASE_URL: 'https://app.test', apiUrl: (path: string) => `https://app.test${path}` }));
jest.mock('@/utils/logger', () => ({ logger: { warn: jest.fn(), error: jest.fn(), log: jest.fn() } }));
jest.mock('@/utils/api-errors', () => ({ handleApiError: jest.fn(), isUnauthorizedError: (error: any) => error?.response?.status === 401 }));
const mockGetItemAsync = jest.fn();
jest.mock('@/utils/secure-storage', () => ({ secureStorage: { getItemAsync: mockGetItemAsync, setItemAsync: jest.fn() } }));
const mockDemoEnabled = jest.fn();
const mockReviewEnabled = jest.fn();
jest.mock('@/utils/demo-mode', () => ({ getDemoModeEnabled: mockDemoEnabled, getReviewModeEnabled: mockReviewEnabled, isDemoModeEnabled: () => false }));
jest.mock('@/stores/auth-store', () => ({ useAuthStore: Object.assign(jest.fn(() => null), { getState: () => ({ user: { id: 'real-user', userType: 'customer' } }) }) }));
jest.mock('@/utils/booking-notifications', () => ({ scheduleThreeHourBookingReminder: jest.fn(), showBookingCreatedNotification: jest.fn(), syncBookingReminderNotifications: jest.fn() }));

const { fetchCustomerProfile, updateCustomerProfile } = require('@/app/api/customer/customerProfile');
const { fetchCompanionProfile, createOrUpdateCompanionProfile } = require('@/app/api/companion/profile');
const { fetchSupplierStats } = require('@/app/api/companion/stats');
const { fetchCompanions, fetchCompanionById, saveCompanionAvailability, fetchCompanionAvailability } = require('@/app/api/companion/companion');
const { fetchBookingById, updateBookingStatus, createBooking } = require('@/app/api/booking/booking');
const { getCompanionImage, getCompanionServices } = require('@/utils/companion-display');
const { getNotifications, markNotificationRead, markAllNotificationsRead } = require('@/app/api/notifications/notifications');

describe('ordinary accounts never receive demo fallbacks', () => {
  const unavailable = { isAxiosError: true, response: { status: 404, data: { message: 'Not found' } } };
  beforeEach(() => {
    jest.clearAllMocks();
    (global as any).__DEV__ = false;
    mockDemoEnabled.mockResolvedValue(false);
    mockReviewEnabled.mockResolvedValue(false);
    mockGetItemAsync.mockResolvedValue(null);
    mockAxios.get.mockRejectedValue(unavailable);
    mockAxios.post.mockRejectedValue(unavailable);
    mockAxios.put.mockRejectedValue(unavailable);
    mockAxios.mockRejectedValue(unavailable);
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => jest.restoreAllMocks());

  test.each([
    ['customer profile read', () => fetchCustomerProfile()],
    ['customer profile save', () => updateCustomerProfile({ name: 'Actual traveler' })],
    ['companion profile read', () => fetchCompanionProfile()],
    ['companion profile save', () => createOrUpdateCompanionProfile({ first_name: 'Real guide' })],
    ['supplier statistics', () => fetchSupplierStats()],
    ['availability save', () => saveCompanionAvailability('guide-1', [])],
  ])('%s propagates backend failure instead of fake success', async (_name, execute: any) => {
    await expect(execute()).rejects.toEqual(unavailable);
  });

  test('discovery filters known test and demo profiles, preserving real guides', async () => {
    mockAxios.get.mockResolvedValue({ data: { success: true, data: { companions: [{ id: 'real-guide', displayName: 'Actual guide' }, { id: '30c6d267-22d1-4cd0-8bdc-46993c14c143' }, { id: 'companion_001' }], pagination: { total: 3 } } } });
    const result = await fetchCompanions();
    expect(result.data.companions).toEqual([{ id: 'real-guide', displayName: 'Actual guide' }]);
  });

  test('direct known test-profile links are unavailable outside demo mode', async () => {
    await expect(fetchCompanionById('30c6d267-22d1-4cd0-8bdc-46993c14c143')).rejects.toThrow('not available');
    expect(mockAxios.get).not.toHaveBeenCalled();
  });

  test('the review build flag alone does not replace ordinary discovery with fixtures', async () => {
    process.env.EXPO_PUBLIC_REVIEW_MODE = 'true';
    try {
      mockAxios.get.mockResolvedValue({ data: { success: true, data: { companions: [{ id: 'real-guide' }], pagination: { total: 1 } } } });
      const result = await fetchCompanions();
      expect(result.data.companions).toEqual([{ id: 'real-guide' }]);
      expect(mockAxios.get).toHaveBeenCalledTimes(1);
    } finally {
      delete process.env.EXPO_PUBLIC_REVIEW_MODE;
    }
  });

  test('an enabled review identity keeps the upstream deterministic guide and availability', async () => {
    mockReviewEnabled.mockResolvedValue(true);
    mockDemoEnabled.mockResolvedValue(true);
    const discovery = await fetchCompanions();
    expect(discovery.data.companions).toHaveLength(1);
    expect(discovery.data.companions[0].id).toBe('demo_companion_001');
    await expect(fetchCompanionById('demo_companion_001')).resolves.toMatchObject({
      success: true,
      data: { id: 'demo_companion_001', services: [{ id: 'review_experience_bangkok_001' }] },
    });
    await expect(fetchCompanionAvailability('demo_companion_001', { startDate: '2026-10-01', endDate: '2026-10-02' })).resolves.toMatchObject({
      success: true,
      data: { availability: [{ date: '2026-10-01' }, { date: '2026-10-02' }] },
    });
    expect(mockAxios.get).not.toHaveBeenCalled();
  });

  test('a missing availability endpoint does not resurrect cached preview slots', async () => {
    mockGetItemAsync.mockImplementation(async (key: string) => key === 'tirak-local-availability' ? JSON.stringify({ 'guide-1': [{ date: '2026-10-01', available: true, slots: [] }] }) : null);
    await expect(fetchCompanionAvailability('guide-1', { startDate: '2026-10-01', endDate: '2026-10-02' })).rejects.toThrow();
  });

  test('known test profiles do not gain invented images or services by default', () => {
    const profile = { id: '30c6d267-22d1-4cd0-8bdc-46993c14c143' };
    expect(getCompanionImage(profile)).toBe('');
    expect(getCompanionServices(profile)).not.toEqual(['Temple walks', 'Market tasting']);
  });

  test('phone-local guide images never enter public card data', () => {
    const profile = {
      profileImage: 'file:///data/user/0/com.tirak/cache/profile.jpg',
      gallery: ['file:///phone/cover.jpg', 'https://cdn.example.test/guide.jpg'],
    };
    expect(getCompanionImage(profile)).toBe('https://cdn.example.test/guide.jpg');
  });

  test('customer photo changes upload first and persist only the public URL', async () => {
    mockAxios.post.mockResolvedValue({ data: { success: true, data: { imageUrl: 'https://api.example.test/api/uploads/public/avatars/user/photo.jpg' } } });
    mockAxios.put.mockResolvedValue({ data: { success: true, data: { updated: true } } });

    const result = await updateCustomerProfile({
      id: '123e4567-e89b-12d3-a456-426614174001',
      name: 'Actual traveler',
      profileImage: 'file:///data/user/0/com.tirak/cache/profile.jpg',
    });

    expect(mockAxios.post).toHaveBeenCalledWith(
      'https://app.test/api/users/123e4567-e89b-12d3-a456-426614174001/avatar',
      expect.any(FormData),
      expect.objectContaining({ headers: expect.objectContaining({ 'Content-Type': 'multipart/form-data' }) }),
    );
    expect(mockAxios.put).toHaveBeenCalledWith(
      'https://app.test/api/users/profile',
      expect.objectContaining({
        name: 'Actual traveler',
        profileImage: 'https://api.example.test/api/uploads/public/avatars/user/photo.jpg',
      }),
      expect.any(Object),
    );
    expect(result.data.profileImage).toBe('https://api.example.test/api/uploads/public/avatars/user/photo.jpg');
  });

  test('demo booking links and status updates are disabled without the gate', async () => {
    await expect(fetchBookingById('demo_booking_001')).rejects.toThrow();
    await expect(updateBookingStatus('demo_booking_001', { status: 'confirmed' })).rejects.toThrow();
  });

  test('failed booking with a test supplier cannot become a local successful booking', async () => {
    await expect(createBooking({ companionId: '30c6d267-22d1-4cd0-8bdc-46993c14c143', date: '2026-10-01', startTime: '09:00', duration: 60 })).rejects.toThrow();
  });

  test('cached demo bookings cannot appear as real notifications', async () => {
    mockGetItemAsync.mockImplementation(async (key: string) => key === 'tirak-demo-bookings' ? JSON.stringify([{ id: 'demo_booking_001', status: 'pending' }]) : null);
    const result = await getNotifications();
    expect(result.data.notifications).toEqual([]);
  });

  test('notification failures are not reported as successful local updates', async () => {
    mockGetItemAsync.mockResolvedValue('token');
    await expect(markNotificationRead('notification-1')).rejects.toEqual(unavailable);
    await expect(markAllNotificationsRead()).rejects.toEqual(unavailable);
    await expect(getNotifications()).rejects.toEqual(unavailable);
  });

  test('deliberately enabled review mode still permits preview profile fallback', async () => {
    mockDemoEnabled.mockResolvedValue(true);
    await expect(fetchCompanionProfile()).resolves.toMatchObject({ success: true, data: { displayName: 'Test Companion' } });
  });
});
