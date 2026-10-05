/**
 * QA environment detection for badge display and build-time validation.
 *
 * Metro requires direct static process.env.* reads so the bundler can inline
 * the values at build time. Indexed access (process.env[key]) is NOT inlined.
 *
 * babel-preset-expo transforms direct EXPO_PUBLIC_* reads into
 * require("expo/virtual/env").env lookups. Keep reads static and direct.
 */

/** Canonical core-qa API URL. Used for exact-match validation. */
export const CORE_QA_API_URL = 'https://tirak-core-qa-20261005.tirak-court.workers.dev/api';

/**
 * Direct static reads — Metro inlines these at build time.
 */
export function isCoreQaEnvironment(): boolean {
  const envName = String(process.env.EXPO_PUBLIC_ENV_NAME || '').trim().toLowerCase();
  if (envName === 'core-qa' || envName === 'qa') return true;
  const apiUrl = String(process.env.EXPO_PUBLIC_API_URL || '').trim();
  return apiUrl === CORE_QA_API_URL;
}

/**
 * Build-time validation gate. Call from app.config.js or a prebuild hook.
 * Throws if core-qa env vars are misconfigured, silently passes for non-QA.
 */
export function validateCoreQaBuildGate(): void {
  const envName = String(process.env.EXPO_PUBLIC_ENV_NAME || '').trim().toLowerCase();

  // Only enforce QA-specific gates when explicitly building for core-qa.
  if (envName !== 'core-qa') return;

  const apiUrl = String(process.env.EXPO_PUBLIC_API_URL || '').trim();
  if (apiUrl !== CORE_QA_API_URL) {
    throw new Error(
      `core-qa build requires EXPO_PUBLIC_API_URL="${CORE_QA_API_URL}", got "${apiUrl || '(empty)'}"`,
    );
  }

  // Payment and review gates must be off for core-qa builds.
  const promptPay = String(process.env.EXPO_PUBLIC_PROMPTPAY_ENABLED || '').trim().toLowerCase();
  if (promptPay === 'true' || promptPay === '1') {
    throw new Error('core-qa build requires EXPO_PUBLIC_PROMPTPAY_ENABLED to be false or unset');
  }

  const demoMode = String(process.env.EXPO_PUBLIC_DEMO_MODE || '').trim().toLowerCase();
  if (demoMode === 'true' || demoMode === '1') {
    throw new Error('core-qa build requires EXPO_PUBLIC_DEMO_MODE to be false or unset');
  }

  const reviewMode = String(process.env.EXPO_PUBLIC_REVIEW_MODE || '').trim().toLowerCase();
  if (reviewMode === 'true' || reviewMode === '1') {
    throw new Error('core-qa build requires EXPO_PUBLIC_REVIEW_MODE to be false or unset');
  }
}
