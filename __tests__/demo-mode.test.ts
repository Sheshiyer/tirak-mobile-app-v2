const mockGetItemAsync = jest.fn();
jest.mock('expo/virtual/env', () => ({ env: process['env'] }));
jest.mock('@/utils/secure-storage', () => ({ secureStorage: { getItemAsync: mockGetItemAsync } }));

const { isDemoModeEnabled, getDemoModeEnabled, getReviewModeEnabled } = require('@/utils/demo-mode');

describe('explicit demo isolation', () => {
  afterEach(() => {
    delete process.env.EXPO_PUBLIC_DEMO_MODE;
    delete process.env.EXPO_PUBLIC_REVIEW_MODE;
    jest.clearAllMocks();
  });

  test('defaults off even for known review identities', () => {
    expect(isDemoModeEnabled({ id: 'demo_customer_001' })).toBe(false);
  });

  test('requires a known identity even when the flag is enabled', () => {
    process.env.EXPO_PUBLIC_DEMO_MODE = 'true';
    expect(isDemoModeEnabled(null)).toBe(false);
    expect(isDemoModeEnabled({ email: 'ordinary@example.com' })).toBe(false);
    expect(isDemoModeEnabled({ id: 'demo_customer_001' })).toBe(true);
    expect(isDemoModeEnabled({ email: 'test.companion.tirak@gmail.com' })).toBe(true);
  });

  test('reads stored identity and fails closed for invalid storage', async () => {
    process.env.EXPO_PUBLIC_DEMO_MODE = 'true';
    mockGetItemAsync.mockResolvedValueOnce(JSON.stringify({ id: 'demo_companion_001' })).mockResolvedValueOnce('broken-json');
    await expect(getDemoModeEnabled()).resolves.toBe(true);
    await expect(getDemoModeEnabled()).resolves.toBe(false);
  });

  test('allows upstream review fixtures only for the two synthetic review identities', () => {
    process.env.EXPO_PUBLIC_REVIEW_MODE = 'true';
    expect(isDemoModeEnabled({ id: 'demo_customer_001' })).toBe(true);
    expect(isDemoModeEnabled({ id: 'demo_companion_001' })).toBe(true);
    expect(isDemoModeEnabled({ id: 'ordinary-user' })).toBe(false);
    expect(isDemoModeEnabled({ email: 'test.companion.tirak@gmail.com' })).toBe(false);
    process.env.EXPO_PUBLIC_REVIEW_MODE = 'TRUE';
    expect(isDemoModeEnabled({ id: 'demo_customer_001' })).toBe(false);
  });

  test('review adapters require the flag and a stored matching review identity', async () => {
    process.env.EXPO_PUBLIC_REVIEW_MODE = 'true';
    mockGetItemAsync.mockResolvedValueOnce(JSON.stringify({ id: 'demo_customer_001' }))
      .mockResolvedValueOnce(JSON.stringify({ id: 'ordinary-user' }))
      .mockResolvedValueOnce('broken-json');
    await expect(getReviewModeEnabled()).resolves.toBe(true);
    await expect(getReviewModeEnabled()).resolves.toBe(false);
    await expect(getReviewModeEnabled()).resolves.toBe(false);
    delete process.env.EXPO_PUBLIC_REVIEW_MODE;
    process.env.EXPO_PUBLIC_DEMO_MODE = 'true';
    await expect(getReviewModeEnabled()).resolves.toBe(false);
  });
});
