import axios from 'axios';

import { apiUrl } from '@/constants/api';
import { secureStorage } from '@/utils/secure-storage';

export type PromptPayChargeStatus = 'pending' | 'processing' | 'paid' | 'failed' | 'expired';

export interface PromptPayCharge {
  id: string;
  status: PromptPayChargeStatus;
  qrCodeUrl: string | null;
  expiresAt: string | null;
  amountSatang: number;
  displayTotalThb: number;
  currency: 'THB';
}

const getAuthHeaders = async () => {
  const token = await secureStorage.getItemAsync('authToken');
  if (!token) {
    throw new Error('Please log in again to pay for this booking.');
  }

  return {
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

const readNested = (value: any, ...paths: string[][]): unknown => {
  for (const path of paths) {
    let current = value;
    for (const key of path) current = current?.[key];
    if (current !== undefined && current !== null) return current;
  }
  return null;
};

const normalizeStatus = (status: unknown): PromptPayChargeStatus => {
  const normalized = String(status || '').toLowerCase();
  if (['paid', 'successful', 'succeeded', 'complete', 'completed'].includes(normalized)) return 'paid';
  if (['processing', 'creating', 'indeterminate'].includes(normalized)) return 'processing';
  if (['expired', 'cancelled', 'canceled'].includes(normalized)) return 'expired';
  if (['failed', 'failure', 'reversed'].includes(normalized)) return 'failed';
  return 'pending';
};

export const normalizePromptPayCharge = (response: any): PromptPayCharge => {
  const payload = response?.data?.charge
    ?? response?.data
    ?? response?.charge
    ?? response;
  const id = readNested(payload, ['id'], ['chargeId'], ['charge_id']);

  if (!id) throw new Error('The payment service returned an invalid charge.');
  if (readNested(payload, ['contractVersion']) !== 'tirak-payments-v1') {
    throw new Error('The payment service contract is incompatible with this app build.');
  }

  const qrCodeUrl = readNested(
    payload,
    ['qrCode'],
    ['qrCodeUrl'],
    ['qr_code_url'],
    ['source', 'scannableCode', 'image', 'downloadUri'],
    ['source', 'scannable_code', 'image', 'download_uri'],
    ['source', 'scannable_code', 'image', 'downloadUri'],
    ['qr', 'imageUrl'],
    ['qr', 'image_uri'],
  );
  const expiresAt = readNested(payload, ['expiresAt'], ['expires_at']);
  const amountSatang = readNested(payload, ['amountSatang']);
  const displayTotalThb = readNested(payload, ['displayTotalThb']);
  const currency = readNested(payload, ['currency']);
  if (!Number.isSafeInteger(amountSatang) || Number(amountSatang) <= 0) {
    throw new Error('The payment service returned an invalid amount.');
  }
  if (typeof displayTotalThb !== 'number' || displayTotalThb <= 0 || currency !== 'THB') {
    throw new Error('The payment service returned an invalid display total.');
  }

  return {
    id: String(id),
    status: normalizeStatus(readNested(payload, ['paymentStatus'], ['attemptStatus'])),
    qrCodeUrl: qrCodeUrl ? String(qrCodeUrl) : null,
    expiresAt: expiresAt ? String(expiresAt) : null,
    amountSatang: Number(amountSatang),
    displayTotalThb,
    currency: 'THB',
  };
};

const paymentError = (error: unknown): Error => {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      return new Error('Please log in again to pay for this booking.');
    }
    return new Error(
      error.response?.data?.message
      || error.response?.data?.error
      || error.message
      || 'PromptPay is temporarily unavailable.',
    );
  }
  return error instanceof Error ? error : new Error('PromptPay is temporarily unavailable.');
};

export async function createPromptPayCharge(bookingId: string): Promise<PromptPayCharge> {
  if (!bookingId) throw new Error('A confirmed booking is required before payment.');

  try {
    const headers = await getAuthHeaders();
    const response = await axios.post(
      apiUrl('/api/payments/charges'),
      { bookingId, method: 'promptpay' },
      { headers },
    );
    return normalizePromptPayCharge(response.data);
  } catch (error) {
    throw paymentError(error);
  }
}

export async function fetchPromptPayCharge(chargeId: string): Promise<PromptPayCharge> {
  if (!chargeId) throw new Error('A payment charge is required to refresh status.');

  try {
    const headers = await getAuthHeaders();
    const response = await axios.get(
      apiUrl(`/api/payments/charges/${encodeURIComponent(chargeId)}`),
      { headers },
    );
    return normalizePromptPayCharge(response.data);
  } catch (error) {
    throw paymentError(error);
  }
}
