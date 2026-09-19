import { parsePasswordResetLink, shouldShowStartupSplash } from '@/utils/startup-navigation';

describe('cold-start routing', () => {
  test.each([
    ['/auth/register', 'http://localhost:8082/auth/register'],
    ['/auth/legal', 'http://localhost:8082/auth/legal?type=privacy'],
    ['/auth/verify-email', 'tirak://auth/verify-email'],
    ['/auth/new', 'https://tirak.app/auth/new?token=secret'],
    ['/', 'tirak://reset-password?token=secret'],
    ['/', 'exp://localhost:8081/--/auth/legal?type=terms'],
    ['/', 'https://tirak.app/reset-password?token=secret'],
    ['/messages', 'https://tirak.app/messages'],
  ])('preserves explicit route %s (%s)', (pathname, url) => {
    expect(shouldShowStartupSplash(pathname, url)).toBe(false);
  });

  test.each([null, 'http://localhost:8082/', 'tirak://', 'exp://localhost:8081/--/'])('allows ordinary root startup %s', (url) => {
    expect(shouldShowStartupSplash('/', url)).toBe(true);
  });

  test('does not discard an unknown or malformed explicit link', () => {
    expect(shouldShowStartupSplash('/', 'unknown link')).toBe(false);
  });
});

describe('password reset links', () => {
  test.each(['tirak://reset-password', 'exp://localhost:8081/--/reset-password', 'exp://localhost:8081//reset-password', 'https://tirak.app/reset-password'])('extracts the token from %s without double decoding', (url) => {
    expect(parsePasswordResetLink(`${url}?token=one%2Btwo%26three`)).toEqual({ token: 'one+two&three' });
  });

  test('recognizes an empty reset link so the caller can offer recovery', () => {
    expect(parsePasswordResetLink('tirak://reset-password')).toEqual({ token: null });
  });

  test('does not treat incidental reset-password text as a reset route', () => {
    expect(parsePasswordResetLink('https://tirak.app/auth/legal?ref=reset-password')).toBeNull();
    expect(parsePasswordResetLink('not a URL')).toBeNull();
  });
});
