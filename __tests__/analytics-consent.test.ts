const mockClient = { optIn: jest.fn().mockResolvedValue(undefined), optOut: jest.fn().mockResolvedValue(undefined), reset: jest.fn(), identify: jest.fn() };
const mockConstructor = jest.fn(() => mockClient);
jest.mock('posthog-react-native', () => ({ __esModule: true, default: mockConstructor }));
jest.mock('expo-constants', () => ({ __esModule: true, default: { expoConfig: { extra: { posthogProjectToken: 'test-project-key', posthogHost: 'https://analytics.test' } } } }));

const { applyAnalyticsConsent } = require('@/utils/posthog');

describe('analytics consent boundary', () => {
  test('starts opted out without persisted identity, automatic tracking or remote configuration', () => {
    expect(mockConstructor).toHaveBeenCalledWith('test-project-key', expect.objectContaining({ defaultOptIn: false, persistence: 'memory', captureAppLifecycleEvents: false, preloadFeatureFlags: false, disableRemoteConfig: true, enableSessionReplay: false }));
    expect(mockClient.optIn).not.toHaveBeenCalled();
  });

  test('only affirmative saved consent enables capture with the opaque account ID', async () => {
    await applyAnalyticsConsent('opaque-id', false);
    expect(mockClient.optIn).not.toHaveBeenCalled();
    await applyAnalyticsConsent('opaque-id', true);
    expect(mockClient.optIn).toHaveBeenCalledTimes(1);
    expect(mockClient.identify).toHaveBeenCalledWith('opaque-id');
    expect(mockClient.identify.mock.calls[0]).toHaveLength(1);
  });

  test('logout and revocation cannot be undone by an older queued opt-in', async () => {
    mockClient.optIn.mockClear();
    mockClient.identify.mockClear();
    const pendingOptIn = applyAnalyticsConsent('previous-user', true);
    const logout = applyAnalyticsConsent();
    await Promise.all([pendingOptIn, logout]);
    expect(mockClient.optIn).not.toHaveBeenCalled();
    expect(mockClient.identify).not.toHaveBeenCalled();
    expect(mockClient.optOut).toHaveBeenCalled();
    expect(mockClient.reset).toHaveBeenCalled();
  });
});
