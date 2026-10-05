const CORE_QA_API_URL = 'https://tirak-core-qa-20261005.tirak-court.workers.dev/api';

function validateCoreQaBuildGate() {
  const envName = String(process.env.EXPO_PUBLIC_ENV_NAME || '').trim().toLowerCase();
  if (envName !== 'core-qa') return;

  const apiUrl = String(process.env.EXPO_PUBLIC_API_URL || '').trim();
  if (apiUrl !== CORE_QA_API_URL) {
    throw new Error(
      `core-qa build requires EXPO_PUBLIC_API_URL="${CORE_QA_API_URL}", got "${apiUrl || '(empty)'}"`,
    );
  }

  const demoMode = String(process.env.EXPO_PUBLIC_DEMO_MODE || '').trim().toLowerCase();
  if (demoMode === 'true' || demoMode === '1') {
    throw new Error('core-qa build requires EXPO_PUBLIC_DEMO_MODE to be false or unset');
  }

  const reviewMode = String(process.env.EXPO_PUBLIC_REVIEW_MODE || '').trim().toLowerCase();
  if (reviewMode === 'true' || reviewMode === '1') {
    throw new Error('core-qa build requires EXPO_PUBLIC_REVIEW_MODE to be false or unset');
  }

  const promptPay = String(process.env.EXPO_PUBLIC_PROMPTPAY_ENABLED || '').trim().toLowerCase();
  if (promptPay === 'true' || promptPay === '1') {
    throw new Error('core-qa build requires EXPO_PUBLIC_PROMPTPAY_ENABLED to be false or unset');
  }
}

// app.config.js — extends app.json with runtime env vars for PostHog and QA environments
// Environment variables are read at build time via process.env.
module.exports = ({ config }) => {
  const projectId = config.extra?.eas?.projectId;

  if (!projectId) {
    throw new Error('Expo EAS projectId is required to configure OTA updates.');
  }

  const isCoreQa = process.env.EXPO_PUBLIC_ENV_NAME === 'core-qa';
  if (isCoreQa) {
    validateCoreQaBuildGate();
  }
  const version = isCoreQa ? '1.5.3' : config.version;
  const runtimeVersion = isCoreQa ? '1.5.3-core-qa' : config.version;

  return {
    ...config,
    version,
    runtimeVersion: isCoreQa
      ? '1.5.3-core-qa'
      : {
          policy: 'fingerprint',
        },
    ios: {
      ...config.ios,
      // Keep iOS builds and OTA updates on a deterministic runtime. EAS mutates
      // the native iOS project while preparing credentials, so a fingerprint of
      // the bare ios directory can differ between the local upload and builder.
      // Bare projects require an explicit value instead of a policy object.
      runtimeVersion: runtimeVersion,
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
      apiUrl: process.env.EXPO_PUBLIC_API_URL,
      envName: process.env.EXPO_PUBLIC_ENV_NAME,
    },
  };
};
