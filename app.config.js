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
