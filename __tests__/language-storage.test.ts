jest.mock('react-native', () => ({ Platform: { OS: 'web' } }));
jest.mock('@react-native-async-storage/async-storage', () => ({ getItem: jest.fn(), setItem: jest.fn() }));
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStoredLanguage, setStoredLanguage } from '../utils/language-storage';
const mockValues = new Map<string,string>();
beforeEach(() => {
  (Platform as any).OS = 'web'; mockValues.clear(); jest.clearAllMocks();
  Object.defineProperty(globalThis, 'window', { configurable:true, value:{ localStorage:{ getItem:(key:string)=>mockValues.get(key)||null, setItem:(key:string,value:string)=>mockValues.set(key,value) } } });
});
afterEach(() => { Reflect.deleteProperty(globalThis,'window'); });
it('persists en to th and back to en and reads the stored value on next load', async () => {
  await setStoredLanguage('th'); await expect(getStoredLanguage()).resolves.toBe('th');
  await setStoredLanguage('en'); await expect(getStoredLanguage()).resolves.toBe('en');
});
it('propagates browser write failure so save UI cannot report success', async () => {
  window.localStorage.setItem = () => { throw new Error('Storage blocked'); };
  await expect(setStoredLanguage('th')).rejects.toThrow('Storage blocked');
});
it('skips browser storage in web SSR', async () => {
  Reflect.deleteProperty(globalThis,'window');
  await expect(getStoredLanguage()).resolves.toBeNull(); await setStoredLanguage('th');
  expect(AsyncStorage.setItem).not.toHaveBeenCalled();
});
it('uses native AsyncStorage when no browser window exists', async () => {
  (Platform as any).OS = 'ios'; Reflect.deleteProperty(globalThis,'window');
  (AsyncStorage.getItem as jest.Mock).mockResolvedValue('th');
  await setStoredLanguage('th'); await expect(getStoredLanguage()).resolves.toBe('th');
  expect(AsyncStorage.setItem).toHaveBeenCalledWith('user-language','th');
});
it('provides matching English/Thai keys for settings additions and save feedback', () => {
  const en = require('../locales/en.json'), th = require('../locales/th.json');
  for (const section of ['settingsFlow','language']) {
    expect(Object.keys(en[section]).sort()).toEqual(Object.keys(th[section]).sort());
    for (const value of Object.values(th[section])) expect(typeof value === 'string' && value.length > 0).toBe(true);
  }
});
