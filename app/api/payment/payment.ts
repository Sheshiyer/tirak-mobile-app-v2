import axios from 'axios';

import { apiUrl } from '@/constants/api';
import { secureStorage } from '@/utils/secure-storage';

export type PaymentErrorKind =
  | 'disabled'
  | 'unauthorized'
  | 'booking-not-found'
  | 'booking-not-payable'
  | 'already-paid'
  | 'in-progress'
  | 'indeterminate'
  | 'network'
  | 'unknown';

export type PromptPayAttemptStatus =
  | 'creating'
  | 'indeterminate'
  | 'pending'
  | 'successful'
  | 'failed'
  | 'expired';

export type PromptPayPaymentStatus =
  | 'processing'
  | 'pending'
  | 'paid'
  | 'failed'
  | 'restitution_pending'
  | 'restituted'
  | 'restitution_failed';

export interface PromptPayCharge {
  contractVersion: 'tirak-payments-v1';
  chargeId: string | null;
  paymentStatus: PromptPayPaymentStatus;
  attemptStatus: PromptPayAttemptStatus;
  qrCodeUrl: string | null;
  amountSatang: number;
  displayTotalThb: number;
  currency: string;
  expiresAt?: string;
}

const SAFE_ERROR_MESSAGES: Record<PaymentErrorKind, string> = {
  disabled: 'PromptPay is unavailable in this environment.',
  unauthorized: 'Please log in again before creating a payment.',
  'booking-not-found': 'This booking could not be found.',
  'booking-not-payable': 'This booking is not ready for PromptPay.',
  'already-paid': 'This booking already has a completed or protected payment.',
  'in-progress': 'A PromptPay request is already in progress.',
  indeterminate: 'Payment status is uncertain. Do not create another charge.',
  network: 'The payment service could not be reached.',
  unknown: 'The PromptPay request could not be completed safely.',
};

export class PaymentClientError extends Error {
  readonly kind: PaymentErrorKind;

  constructor(kind: PaymentErrorKind) {
    super(SAFE_ERROR_MESSAGES[kind]);
    this.name = 'PaymentClientError';
    this.kind = kind;
  }
}

const ATTEMPT_STATUSES = new Set<PromptPayAttemptStatus>([
  'creating',
  'indeterminate',
  'pending',
  'successful',
  'failed',
  'expired',
]);

const PAYMENT_STATUSES = new Set<PromptPayPaymentStatus>([
  'processing',
  'pending',
  'paid',
  'failed',
  'restitution_pending',
  'restituted',
  'restitution_failed',
]);

const ALLOWED_STATUS_PAIRS = new Set([
  'creating:processing',
  'indeterminate:processing',
  'pending:pending',
  'successful:paid',
  'successful:restitution_pending',
  'successful:restituted',
  'successful:restitution_failed',
  'failed:failed',
  'expired:failed',
]);

export const PAYMENT_REQUEST_TIMEOUT_MS = 15_000;

const isNullableString = (value: unknown): value is string | null =>
  value === null || typeof value === 'string';

function isFiniteIsoTimestamp(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString() === value;
}

export function parsePromptPayCharge(value: unknown): PromptPayCharge {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new PaymentClientError('unknown');
  }

  const candidate = value as Record<string, unknown>;
  if (
    candidate.contractVersion !== 'tirak-payments-v1'
    || !isNullableString(candidate.chargeId)
    || !PAYMENT_STATUSES.has(candidate.paymentStatus as PromptPayPaymentStatus)
    || !ATTEMPT_STATUSES.has(candidate.attemptStatus as PromptPayAttemptStatus)
    || !isNullableString(candidate.qrCodeUrl)
    || typeof candidate.amountSatang !== 'number'
    || !Number.isSafeInteger(candidate.amountSatang)
    || candidate.amountSatang <= 0
    || typeof candidate.displayTotalThb !== 'number'
    || !Number.isFinite(candidate.displayTotalThb)
    || candidate.displayTotalThb <= 0
    || Math.round(candidate.displayTotalThb * 100) !== candidate.amountSatang
    || Math.abs(candidate.displayTotalThb * 100 - candidate.amountSatang) > 1e-6
    || candidate.currency !== 'THB'
    || !ALLOWED_STATUS_PAIRS.has(`${String(candidate.attemptStatus)}:${String(candidate.paymentStatus)}`)
    || (candidate.expiresAt !== undefined && !isFiniteIsoTimestamp(candidate.expiresAt))
  ) {
    throw new PaymentClientError('unknown');
  }

  return {
    contractVersion: 'tirak-payments-v1',
    chargeId: candidate.chargeId,
    paymentStatus: candidate.paymentStatus as PromptPayPaymentStatus,
    attemptStatus: candidate.attemptStatus as PromptPayAttemptStatus,
    qrCodeUrl: candidate.qrCodeUrl,
    amountSatang: candidate.amountSatang,
    displayTotalThb: candidate.displayTotalThb,
    currency: candidate.currency,
    ...(candidate.expiresAt !== undefined ? { expiresAt: candidate.expiresAt } : {}),
  };
}

function responseText(data: unknown): string {
  if (!data || typeof data !== 'object') return '';
  const value = data as { error?: unknown; message?: unknown };
  return [value.error, value.message]
    .filter((item): item is string => typeof item === 'string')
    .join(' ')
    .toLowerCase();
}

function responseCode(data: unknown): string {
  if (!data || typeof data !== 'object') return '';
  const value = data as { code?: unknown; error?: unknown; reason?: unknown };
  const raw = [value.code, value.error, value.reason]
    .find((item): item is string => typeof item === 'string');
  return (raw || '').trim().toUpperCase().replace(/[\s-]+/g, '_');
}

function mapRequestError(error: unknown): PaymentClientError {
  if (error instanceof PaymentClientError) return error;
  if (!axios.isAxiosError(error)) return new PaymentClientError('unknown');
  if (['ECONNABORTED', 'ETIMEDOUT', 'ERR_CANCELED'].includes(String(error.code || ''))) {
    return new PaymentClientError('indeterminate');
  }
  if (!error.response) return new PaymentClientError('network');

  const status = error.response.status;
  const text = responseText(error.response.data);
  const code = responseCode(error.response.data);
  if (status === 401 || status === 403) return new PaymentClientError('unauthorized');
  if (status === 404) return new PaymentClientError('booking-not-found');
  if (text.includes('payment_creation_disabled') || (status === 503 && text.includes('disabled'))) {
    return new PaymentClientError('disabled');
  }
  if (text.includes('creation in progress') || text.includes('already in progress')) {
    return new PaymentClientError('in-progress');
  }
  if (
    ['BOOKING_ALREADY_PAID', 'ALREADY_PAID', 'PAYMENT_ALREADY_COMPLETED'].includes(code)
    || text.includes('already been paid')
    || text.includes('already paid')
  ) {
    return new PaymentClientError('already-paid');
  }
  if (text.includes('indeterminate') || text.includes('requires recovery') || text.includes('outcome')) {
    return new PaymentClientError('indeterminate');
  }
  if (status === 409 && text.includes('booking is not payable')) {
    return new PaymentClientError('booking-not-payable');
  }
  return new PaymentClientError('unknown');
}

export function createPromptPayCharge(bookingId: string): Promise<PromptPayCharge> {
  return secureStorage.getItemAsync('authToken').then(async (token) => {
    if (!token) throw new PaymentClientError('unauthorized');

    try {
      const response = await axios.post(
        apiUrl('/api/payments/charges'),
        { bookingId, method: 'promptpay' },
        {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          timeout: PAYMENT_REQUEST_TIMEOUT_MS,
        },
      );

      if (response.data?.success !== true) throw new PaymentClientError('unknown');
      return parsePromptPayCharge(response.data.data);
    } catch (error) {
      throw mapRequestError(error);
    }
  });
}
