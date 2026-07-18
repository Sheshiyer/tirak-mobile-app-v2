const mockGetItemAsync = jest.fn<Promise<string | null>, [string]>();
const mockPost = jest.fn();
const mockGet = jest.fn();

jest.mock('@/utils/secure-storage', () => ({
  secureStorage: { getItemAsync: mockGetItemAsync },
}));

jest.mock('@/constants/api', () => ({
  apiUrl: (path: string) => `https://payments.test${path}`,
}));

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    post: mockPost,
    get: mockGet,
    isAxiosError: (error: unknown) => Boolean((error as any)?.isAxiosError),
  },
}));

const {
  createPromptPayCharge,
  fetchPromptPayCharge,
} = require('@/app/api/payments/payments');

describe('PromptPay payment API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetItemAsync.mockResolvedValue('token-123');
  });

  test('creates a charge with the exact safe server-authoritative payload', async () => {
    mockPost.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          chargeId: 'charge-1',
          status: 'pending',
          amount: 180000,
          currency: 'THB',
          expiresAt: '2026-07-18T12:30:00.000Z',
          qrCode: 'https://cdn.omise.co/qr/charge-1.png',
        },
      },
    });

    await expect(createPromptPayCharge('booking-1')).resolves.toEqual(
      expect.objectContaining({
        id: 'charge-1',
        status: 'pending',
        qrCodeUrl: 'https://cdn.omise.co/qr/charge-1.png',
      }),
    );

    expect(mockPost).toHaveBeenCalledWith(
      'https://payments.test/api/payments/charges',
      { bookingId: 'booking-1', method: 'promptpay' },
      {
        headers: {
          Accept: 'application/json',
          Authorization: 'Bearer token-123',
          'Content-Type': 'application/json',
        },
      },
    );
    expect(JSON.stringify(mockPost.mock.calls[0][1])).not.toMatch(/amount|secret|card/i);
  });

  test('refreshes a charge and normalizes a paid response', async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          chargeId: 'charge-1',
          status: 'successful',
          qrCode: 'https://cdn.omise.co/qr/charge-1.png',
        },
      },
    });

    await expect(fetchPromptPayCharge('charge-1')).resolves.toEqual(
      expect.objectContaining({ id: 'charge-1', status: 'paid' }),
    );
    expect(mockGet).toHaveBeenCalledWith(
      'https://payments.test/api/payments/charges/charge-1',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer token-123' }),
      }),
    );
  });

  test('fails closed without auth and does not send a request', async () => {
    mockGetItemAsync.mockResolvedValueOnce(null);

    await expect(createPromptPayCharge('booking-1')).rejects.toThrow(
      'Please log in again to pay for this booking.',
    );
    expect(mockPost).not.toHaveBeenCalled();
  });

  test('maps API failures without losing the confirmed booking', async () => {
    mockPost.mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 503, data: { message: 'PromptPay is temporarily unavailable' } },
      message: 'Request failed',
    });

    await expect(createPromptPayCharge('booking-1')).rejects.toThrow(
      'PromptPay is temporarily unavailable',
    );
  });
});
