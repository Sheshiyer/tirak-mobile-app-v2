// Bump these only when the corresponding user-visible policy text changes.
export const POLICY_VERSION = '2026-09-19' as const;

export interface AccountConsents {
  marketingOptIn: boolean;
  analyticsOptIn: boolean;
  termsVersion: string | null;
  privacyVersion: string | null;
}

export interface RegistrationConsent {
  policyAcceptance: { termsVersion: typeof POLICY_VERSION; privacyVersion: typeof POLICY_VERSION };
  marketingOptIn: boolean;
  analyticsOptIn: boolean;
}

export interface EmailVerificationDelivery {
  deliveryStatus: 'sent' | 'unavailable';
  retryAfterSeconds: number;
  emailVerified?: true;
}

export function isVerificationCode(code: string): boolean {
  return /^\d{6}$/.test(code);
}

export function verificationRetryAt(seconds: number, now = Date.now()): number {
  return now + Math.max(0, Number.isFinite(seconds) ? seconds : 60) * 1000;
}
