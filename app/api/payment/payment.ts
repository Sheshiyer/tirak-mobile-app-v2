import axios from 'axios';

import { apiUrl } from '@/constants/api';
import { secureStorage } from '@/utils/secure-storage';

export type PaymentErrorKind =
  | 'disabled'
  | 'unauthorized'
  | 'booking-not-found'
  | 'booking-not-payable'
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

const isNullableString = (value: unknown): value is string | null =>
  value === null || typeof value === 'string';

function parseCharge(value: unknown): PromptPayCharge {
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
    || typeof candidate.currency !== 'string'
    || (candidate.expiresAt !== undefined && typeof candidate.expiresAt !== 'string')
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

function mapRequestError(error: unknown): PaymentClientError {
  if (error instanceof PaymentClientError) return error;
  if (!axios.isAxiosError(error)) return new PaymentClientError('unknown');
  if (!error.response) return new PaymentClientError('network');

  const status = error.response.status;
  const text = responseText(error.response.data);
  if (status === 401 || status === 403) return new PaymentClientError('unauthorized');
  if (status === 404) return new PaymentClientError('booking-not-found');
  if (text.includes('payment_creation_disabled') || (status === 503 && text.includes('disabled'))) {
    return new PaymentClientError('disabled');
  }
  if (text.includes('creation in progress') || text.includes('already in progress')) {
    return new PaymentClientError('in-progress');
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
        },
      );

      if (response.data?.success !== true) throw new PaymentClientError('unknown');
      return parseCharge(response.data.data);
    } catch (error) {
      throw mapRequestError(error);
    }
  });
}
