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

  test('legacy opt-in flags cannot activate fixtures for a known identity or read its stored credentials', async () => {
    process.env.EXPO_PUBLIC_DEMO_MODE = 'true';
    process.env.EXPO_PUBLIC_REVIEW_MODE = 'true';
    const identity = { id: 'demo_customer_001' };
    mockGetItemAsync.mockResolvedValueOnce(JSON.stringify(identity));
    expect(isDemoModeEnabled(identity)).toBe(false);
    await expect(getDemoModeEnabled()).resolves.toBe(false);
    await expect(getReviewModeEnabled()).resolves.toBe(false);
    expect(mockGetItemAsync).not.toHaveBeenCalled();
  });
});
