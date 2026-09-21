import { apiUrl } from '@/constants/api';
// Keep API helpers outside app/ so Expo Router does not treat them as screens.
import { secureStorage } from '@/utils/secure-storage';
import { AccountConsents, EmailVerificationDelivery, isVerificationCode } from '@/utils/account-consent';

export class AccountRequestError extends Error {
  constructor(message: string, public retryAfterSeconds?: number) {
    super(message);
    this.name = 'AccountRequestError';
  }
}

async function accountRequest<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const token = await secureStorage.getItemAsync('authToken');
  if (!token) throw new Error('Please sign in to manage your account.');
  const response = await fetch(apiUrl(path), {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    const retryAfter = Number(response.headers.get('Retry-After')) || result.data?.retryAfterSeconds;
    throw new AccountRequestError(result.message || result.error || 'Unable to update your account. Please try again.', retryAfter);
  }
  return result.data as T;
}

export const getAccountConsents = () => accountRequest<AccountConsents>('/api/users/me/consents');

export const saveAccountConsents = (preferences: Pick<AccountConsents, 'marketingOptIn' | 'analyticsOptIn'>) =>
  accountRequest<AccountConsents>('/api/users/me/consents', 'PUT', preferences);

export const requestEmailVerification = () =>
  accountRequest<EmailVerificationDelivery>('/api/auth/email-verification/request', 'POST');

export function verifyEmail(code: string) {
  if (!isVerificationCode(code)) return Promise.reject(new Error('Enter the six-digit code from your email.'));
  return accountRequest<{ emailVerified: true }>('/api/auth/verify-email', 'POST', { code });
}
