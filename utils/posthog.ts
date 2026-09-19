import PostHog from 'posthog-react-native';
import Constants from 'expo-constants';

const apiKey = Constants.expoConfig?.extra?.posthogProjectToken as string | undefined;
const host = Constants.expoConfig?.extra?.posthogHost as string | undefined;
const isPostHogConfigured = !!(apiKey && apiKey !== 'phc_your_project_token_here');

// Consent comes from the account API on every session, never a previous user's
// persisted SDK preference. Disable automatic collection before that check.
export const posthog = new PostHog(apiKey || 'placeholder_key', {
  host,
  disabled: !isPostHogConfigured,
  defaultOptIn: false,
  persistence: 'memory',
  captureAppLifecycleEvents: false,
  enableSessionReplay: false,
  disableRemoteConfig: true,
  disableSurveys: true,
  flushAt: 20,
  flushInterval: 10000,
  maxBatchSize: 100,
  maxQueueSize: 1000,
  preloadFeatureFlags: false,
  sendFeatureFlagEvent: false,
  featureFlagsRequestTimeoutMs: 10000,
  requestTimeout: 10000,
  fetchRetryCount: 3,
  fetchRetryDelay: 3000,
});

let consentUpdate = Promise.resolve();
let consentRevision = 0;

export function applyAnalyticsConsent(userId?: string, optedIn = false): Promise<void> {
  const revision = ++consentRevision;
  if (!optedIn || !userId) void posthog.optOut();
  consentUpdate = consentUpdate.catch(() => {}).then(async () => {
    await posthog.optOut();
    posthog.reset();
    if (revision !== consentRevision || !isPostHogConfigured || !optedIn || !userId) return;
    await posthog.optIn();
    if (revision !== consentRevision) {
      await posthog.optOut();
      return;
    }
    // Only the opaque account ID is sent; never email, name, gender or DOB.
    posthog.identify(userId);
  });
  return consentUpdate;
}

export const isPostHogEnabled = isPostHogConfigured;
