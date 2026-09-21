// app.config.js — extends app.json with runtime env vars for PostHog
// Environment variables are read at build time via process.env.
module.exports = ({ config }) => {
  const projectId = config.extra?.eas?.projectId;

  if (!projectId) {
    throw new Error('Expo EAS projectId is required to configure OTA updates.');
  }

  return {
    ...config,
    runtimeVersion: {
      policy: 'fingerprint',
    },
    ios: {
      ...config.ios,
      // Keep iOS builds and OTA updates on a deterministic runtime. EAS mutates
      // the native iOS project while preparing credentials, so a fingerprint of
      // the bare ios directory can differ between the local upload and builder.
      // Bare projects require an explicit value instead of a policy object.
      runtimeVersion: config.version,
    },
    updates: {
      ...config.updates,
      url: `https://u.expo.dev/${projectId}`,
    },
    extra: {
      ...config.extra,
      posthogProjectToken: process.env.POSTHOG_PROJECT_TOKEN,
      posthogHost: process.env.POSTHOG_HOST,
      // Exact build gate: review-only UI is omitted unless explicitly enabled.
      reviewMode: process.env.EXPO_PUBLIC_REVIEW_MODE === 'true',
    },
  };
};
