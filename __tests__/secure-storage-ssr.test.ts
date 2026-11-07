jest.mock('react-native', () => ({ Platform: { OS: 'web' } }));
jest.mock('expo-secure-store', () => ({ getItemAsync: jest.fn(), setItemAsync: jest.fn(), deleteItemAsync: jest.fn() }));
import { secureStorage } from '../utils/secure-storage';

describe('web secure storage during static export', () => {
  it('does not touch browser storage when no browser window exists', async () => {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'window');
    Object.defineProperty(globalThis, 'window', { configurable: true, value: undefined });
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    try {
      await expect(secureStorage.getItemAsync('authToken')).resolves.toBeNull();
      await expect(secureStorage.setItemAsync('authToken', 'synthetic')).resolves.toBeUndefined();
      await expect(secureStorage.deleteItemAsync('authToken')).resolves.toBeUndefined();
      expect(spy).not.toHaveBeenCalled();
    } finally {
      spy.mockRestore();
      if (descriptor) Object.defineProperty(globalThis, 'window', descriptor);
      else Reflect.deleteProperty(globalThis, 'window');
    }
  });
});
