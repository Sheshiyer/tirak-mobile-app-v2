/**
 * Secure Storage Wrapper
 * Uses SecureStore on native platforms and localStorage on web
 */
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const isWeb = Platform.OS === 'web';

export const secureStorage = {
  async getItemAsync(key: string): Promise<string | null> {
    if (isWeb) {
      try {
        return localStorage.getItem(key);
      } catch (error) {
        console.error('Error reading from localStorage:', error);
        return null;
      }
    } else {
      return await SecureStore.getItemAsync(key);
    }
  },

  async setItemAsync(key: string, value: string): Promise<void> {
    if (isWeb) {
      try {
        localStorage.setItem(key, value);
      } catch (error) {
        console.error('Error writing to localStorage:', error);
      }
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  },

  async deleteItemAsync(key: string): Promise<void> {
    if (isWeb) {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.error('Error deleting from localStorage:', error);
      }
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  },
};
