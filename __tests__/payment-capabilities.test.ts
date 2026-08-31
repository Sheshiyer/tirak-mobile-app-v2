import { isLocalPromptPayEnabled } from '@/constants/payment-capabilities';

describe('local PromptPay capability', () => {
  test.each([
    'http://localhost:8787',
    'http://127.0.0.1:8787',
  ])('enables only the approved development loopback: %s', (apiBaseUrl) => {
    expect(isLocalPromptPayEnabled({ flag: 'true', apiBaseUrl, isDev: true })).toBe(true);
  });

  test.each([
    [{ flag: undefined, apiBaseUrl: 'http://127.0.0.1:8787', isDev: true }, 'missing flag'],
    [{ flag: 'TRUE', apiBaseUrl: 'http://127.0.0.1:8787', isDev: true }, 'mixed-case flag'],
    [{ flag: 'true', apiBaseUrl: 'https://127.0.0.1:8787', isDev: true }, 'HTTPS'],
    [{ flag: 'true', apiBaseUrl: 'http://192.168.1.10:8787', isDev: true }, 'non-loopback host'],
    [{ flag: 'true', apiBaseUrl: 'http://127.0.0.1:3000', isDev: true }, 'wrong port'],
    [{ flag: 'true', apiBaseUrl: 'not a URL', isDev: true }, 'invalid URL'],
    [{ flag: 'true', apiBaseUrl: 'http://127.0.0.1:8787/api', isDev: true }, 'extra path'],
    [{ flag: 'true', apiBaseUrl: 'http://127.0.0.1:8787?mode=test', isDev: true }, 'query parameters'],
    [{ flag: 'true', apiBaseUrl: 'http://127.0.0.1:8787', isDev: false }, 'production mode'],
  ])('fails closed for $1', (input, _label) => {
    expect(isLocalPromptPayEnabled(input)).toBe(false);
  });
});
