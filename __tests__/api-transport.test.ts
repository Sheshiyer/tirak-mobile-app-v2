jest.mock('expo/virtual/env', () => ({ get env() { return process.env; } }));

describe('release API transport', () => {
  const devGlobal = globalThis as typeof globalThis & { __DEV__: boolean };

  const previousUrl = process.env.EXPO_PUBLIC_API_URL;
  const previousDev = devGlobal.__DEV__;
  afterEach(() => {
    if (previousUrl === undefined) delete process.env.EXPO_PUBLIC_API_URL;
    else process.env.EXPO_PUBLIC_API_URL = previousUrl;
    devGlobal.__DEV__ = previousDev;
    jest.resetModules();
  });

  test.each([
    ['https://backend.example/api', 'https://backend.example', 'wss://backend.example/api/chat/ws'],
    ['https://backend.example/api/', 'https://backend.example', 'wss://backend.example/api/chat/ws'],
    ['http://localhost:8787/api', 'http://localhost:8787', 'ws://localhost:8787/api/chat/ws'],
  ])('preserves secure socket transport and strips API suffix for %s', (url, base, socket) => {
    process.env.EXPO_PUBLIC_API_URL = url;
    devGlobal.__DEV__ = true;
    jest.resetModules();
    const api = require('../constants/api');
    expect(api.API_BASE_URL).toBe(base);
    expect(api.apiUrl('/api/chat/rooms')).toBe(`${base}/api/chat/rooms`);
    expect(api.wsUrl('/api/chat/ws')).toBe(socket);
  });

  test.each(['http://backend.example/api', 'https://user:secret@backend.example/api', 'https://backend.example/api?token=private', 'https://backend.example/api#token'])('release rejects unsafe API URL %s', url => {
    process.env.EXPO_PUBLIC_API_URL = url;
    devGlobal.__DEV__ = false;
    jest.resetModules();
    expect(() => require('../constants/api')).toThrow('Production API must use HTTPS');
  });
});
