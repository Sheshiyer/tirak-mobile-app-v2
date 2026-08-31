import fs from 'node:fs';
import path from 'node:path';
import axios from 'axios';

const mockGetItemAsync = jest.fn<Promise<string | null>, [string]>();
const mockPost = jest.fn();

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    post: (...args: unknown[]) => mockPost(...args),
    isAxiosError: (error: unknown) => Boolean((error as { isAxiosError?: boolean })?.isAxiosError),
  },
}));

jest.mock('@/utils/secure-storage', () => ({
  secureStorage: { getItemAsync: (key: string) => mockGetItemAsync(key) },
}));

jest.mock('@/constants/api', () => ({
  apiUrl: (route: string) => `https://payments.test${route}`,
}));

import {
  createPromptPayCharge,
  PaymentClientError,
  type PromptPayCharge,
} from '@/app/api/payment/payment';

const contractPath = [
  path.resolve(__dirname, '../../backend/tirak-backend-alpha01/contracts/tirak-payments-v1/payment-api.json'),
  path.resolve(__dirname, '../../../backend/tirak-backend-alpha01/contracts/tirak-payments-v1/payment-api.json'),
].find((candidate) => fs.existsSync(candidate));

if (!contractPath) throw new Error('tirak-payments-v1 contract fixture was not found');

const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8')) as {
  forbiddenRequestFields: string[];
  routes: Array<{ path: string; responseFields: string[] }>;
};

const charge: PromptPayCharge = {
  contractVersion: 'tirak-payments-v1',
  chargeId: 'chrg_local_12345678',
  paymentStatus: 'pending',
  attemptStatus: 'pending',
  qrCodeUrl: 'http://127.0.0.1:8787/fixture/pending.png',
  amountSatang: 180000,
  displayTotalThb: 1800,
  currency: 'THB',
  expiresAt: '2026-09-01T01:00:00.000Z',
};

const axiosFailure = (status?: number, data?: unknown) => ({
  isAxiosError: true,
  ...(status ? { response: { status, data } } : {}),
});

describe('tirak-payments-v1 charge client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetItemAsync.mockResolvedValue('token-123');
    mockPost.mockResolvedValue({
      data: { success: true, data: charge, message: 'PromptPay charge created' },
    });
  });

  test('posts only bookingId and promptpay with Bearer authentication', async () => {
    await expect(createPromptPayCharge('booking-1')).resolves.toEqual(charge);

    expect(mockPost).toHaveBeenCalledTimes(1);
    const [url, body, config] = mockPost.mock.calls[0];
    expect(url).toBe('https://payments.test/api/payments/charges');
    expect(Object.keys(body).sort()).toEqual(['bookingId', 'method']);
    expect(body).toEqual({ bookingId: 'booking-1', method: 'promptpay' });
    for (const field of contract.forbiddenRequestFields) {
      expect(body).not.toHaveProperty(field);
    }
    expect(config.headers).toMatchObject({
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: 'Bearer token-123',
    });
  });

  test('returns only the frozen response allowlist', async () => {
    mockPost.mockResolvedValueOnce({
      data: {
        success: true,
        data: { ...charge, providerSecret: 'discard-me', nested: { unsafe: true } },
        message: 'PromptPay charge created',
      },
    });

    const result = await createPromptPayCharge('booking-1');
    const responseFields = contract.routes.find((route) => route.path === '/api/payments/charges')?.responseFields;

    expect(Object.keys(result).sort()).toEqual([...responseFields!].sort());
    expect(result).toEqual(charge);
  });

  test('preserves nullable identifiers and omitted expiry without inventing values', async () => {
    const nullableCharge = { ...charge, chargeId: null, qrCodeUrl: null };
    delete (nullableCharge as Partial<PromptPayCharge>).expiresAt;
    mockPost.mockResolvedValueOnce({
      data: { success: true, data: nullableCharge, message: 'PromptPay charge created' },
    });

    await expect(createPromptPayCharge('booking-1')).resolves.toEqual(nullableCharge);
  });

  test.each([
    [{ data: charge }, 'unknown'],
    [{ success: false, data: charge }, 'unknown'],
    [{ success: true, data: { ...charge, contractVersion: 'tirak-payments-v2' } }, 'unknown'],
  ])('rejects an invalid success envelope', async (responseData, kind) => {
    mockPost.mockResolvedValueOnce({ data: responseData });
    await expect(createPromptPayCharge('booking-1')).rejects.toMatchObject({ kind });
  });

  test.each([
    [axiosFailure(401, { message: 'Please log in' }), 'unauthorized'],
    [axiosFailure(404, { message: 'The booking does not exist' }), 'booking-not-found'],
    [axiosFailure(409, { error: 'Booking is not payable', message: 'Only confirmed bookings can be paid' }), 'booking-not-payable'],
    [axiosFailure(409, { error: 'Payment creation in progress' }), 'in-progress'],
    [axiosFailure(409, { error: 'Payment outcome requires recovery' }), 'indeterminate'],
    [axiosFailure(502, { error: 'Payment outcome indeterminate' }), 'indeterminate'],
    [axiosFailure(503, { error: 'PAYMENT_CREATION_DISABLED' }), 'disabled'],
    [axiosFailure(), 'network'],
    [axiosFailure(500, { error: 'unexpected' }), 'unknown'],
  ])('maps backend failures to safe client kinds', async (failure, kind) => {
    mockPost.mockRejectedValueOnce(failure);
    await expect(createPromptPayCharge('booking-1')).rejects.toMatchObject({
      name: 'PaymentClientError',
      kind,
    });
  });

  test('does not call Axios without an authentication token', async () => {
    mockGetItemAsync.mockResolvedValueOnce(null);
    await expect(createPromptPayCharge('booking-1')).rejects.toEqual(
      expect.objectContaining<Partial<PaymentClientError>>({ kind: 'unauthorized' }),
    );
    expect(mockPost).not.toHaveBeenCalled();
  });
});
