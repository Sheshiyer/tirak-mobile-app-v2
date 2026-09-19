const mockGetItemAsync = jest.fn();
const mockFetch = jest.fn();
jest.mock('@/utils/secure-storage', () => ({ secureStorage: { getItemAsync: mockGetItemAsync } }));
jest.mock('@/constants/api', () => ({ apiUrl: (path: string) => `https://account.test${path}` }));

const { getAccountConsents, saveAccountConsents, requestEmailVerification, verifyEmail } = require('@/utils/account-api');
const { isVerificationCode, verificationRetryAt } = require('@/utils/account-consent');
global.fetch = mockFetch;

function response(data: unknown, ok = true, retryAfter: string | null = null) {
  return { ok, json: async () => data, headers: { get: () => retryAfter } };
}

describe('account verification and consent API', () => {
  beforeEach(() => { jest.clearAllMocks(); mockGetItemAsync.mockResolvedValue('account-token'); });

  test('requests delivery with a bearer token and respects unavailable delivery', async () => {
    const delivery = { deliveryStatus: 'unavailable', retryAfterSeconds: 60 };
    mockFetch.mockResolvedValue(response({ success: true, data: delivery }));
    await expect(requestEmailVerification()).resolves.toEqual(delivery);
    expect(mockFetch).toHaveBeenCalledWith('https://account.test/api/auth/email-verification/request', expect.objectContaining({ method: 'POST', headers: expect.objectContaining({ Authorization: 'Bearer account-token' }) }));
  });

  test('verifies the exact six-digit code including leading zero', async () => {
    mockFetch.mockResolvedValue(response({ success: true, data: { emailVerified: true } }));
    await expect(verifyEmail('012345')).resolves.toEqual({ emailVerified: true });
    expect(mockFetch).toHaveBeenCalledWith('https://account.test/api/auth/verify-email', expect.objectContaining({ body: JSON.stringify({ code: '012345' }) }));
  });

  test.each(['12345', '1234567', 'abcdef', '123 45', ''])('rejects malformed verification code %s before network', async (code) => {
    await expect(verifyEmail(code)).rejects.toThrow('six-digit');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  test('reports expired or incorrect code without marking the account verified', async () => {
    mockFetch.mockResolvedValue(response({ success: false, message: 'Invalid or expired verification code' }, false));
    await expect(verifyEmail('123456')).rejects.toThrow('Invalid or expired');
  });

  test('keeps the server retry time for rate-limited resend', async () => {
    mockFetch.mockResolvedValue(response({ success: false, message: 'Please wait' }, false, '42'));
    await expect(requestEmailVerification()).rejects.toMatchObject({ name: 'AccountRequestError', retryAfterSeconds: 42 });
  });

  test('does not request account data without authentication', async () => {
    mockGetItemAsync.mockResolvedValue(null);
    await expect(getAccountConsents()).rejects.toThrow('sign in');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  test('persists explicit false opt-ins without implying agreement to new policies', async () => {
    const consents = { marketingOptIn: false, analyticsOptIn: false, termsVersion: null, privacyVersion: null };
    mockFetch.mockResolvedValue(response({ success: true, data: consents }));
    await expect(saveAccountConsents({ marketingOptIn: false, analyticsOptIn: false })).resolves.toEqual(consents);
    expect(mockFetch).toHaveBeenCalledWith('https://account.test/api/users/me/consents', expect.objectContaining({ method: 'PUT', body: '{"marketingOptIn":false,"analyticsOptIn":false}' }));
  });

  test('uses an absolute deadline so resend cooldown survives rerenders', () => {
    expect(verificationRetryAt(60, 1000)).toBe(61000);
    expect(verificationRetryAt(-1, 1000)).toBe(1000);
    expect(isVerificationCode('000001')).toBe(true);
  });
});
