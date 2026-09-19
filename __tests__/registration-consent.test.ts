const mockPost = jest.fn();
jest.mock('axios', () => ({ __esModule: true, default: { post: mockPost, isAxiosError: jest.fn(() => false) } }));
jest.mock('@/constants/api', () => ({ apiUrl: (path: string) => `https://account.test${path}` }));
jest.mock('@/utils/logger', () => ({ logger: { warn: jest.fn() } }));
const { register } = require('@/app/api/auth/register');

test('registration sends versioned acceptance and preserves delivery failure without claiming verification', async () => {
  const payload = { display_name: 'Traveller', email: 'traveller@example.test', password: 'not-a-real-password', userType: 'customer', policyAcceptance: { termsVersion: '2026-09-19', privacyVersion: '2026-09-19' }, marketingOptIn: false, analyticsOptIn: false };
  mockPost.mockResolvedValue({ data: { success: true, data: { user: { id: 'user-1', email: payload.email, userType: 'customer', emailVerified: false }, accessToken: 'token', refreshToken: 'refresh', emailVerification: { deliveryStatus: 'unavailable', retryAfterSeconds: 60 } } } });
  const result = await register(payload);
  expect(mockPost).toHaveBeenCalledWith('https://account.test/api/auth/register', payload);
  expect(result.user.verified).toBe(false);
  expect(result.emailVerification).toEqual({ deliveryStatus: 'unavailable', retryAfterSeconds: 60 });
});
