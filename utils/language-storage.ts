import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
const key = 'user-language';
export async function getStoredLanguage(): Promise<string | null> {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(key);
  }
  return AsyncStorage.getItem(key);
}
export async function setStoredLanguage(language: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(key, language);
    return;
  }
  await AsyncStorage.setItem(key, language);
}
