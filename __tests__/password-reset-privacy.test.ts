const mockPost = jest.fn();
jest.mock('axios', () => ({ __esModule: true, default: { post: mockPost } }));
jest.mock('@/utils/secure-storage', () => ({ secureStorage: {} }));
jest.mock('@/constants/api', () => ({ API_BASE_URL: 'https://account.test' }));
const { resetPassword, requestPasswordReset } = require('@/app/api/auth/password-reset');

test('reset failures never log the axios request body containing credentials', async () => {
  const log = jest.spyOn(console, 'error').mockImplementation(() => {});
  try {
    mockPost.mockRejectedValue({ config: { data: '{"token":"secret-token","newPassword":"secret-password","identifier":"person@example.test"}' } });
    await expect(resetPassword('secret-token', 'secret-password')).rejects.toMatchObject({ error: 'Network error' });
    await expect(requestPasswordReset('person@example.test')).rejects.toMatchObject({ error: 'Network error' });
    expect(log).not.toHaveBeenCalled();
  } finally {
    log.mockRestore();
  }
});
