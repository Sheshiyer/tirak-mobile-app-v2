import { logger } from '@/utils/logger';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import translation files
import en from '../locales/en.json';
import th from '../locales/th.json';

// Check if we're in a browser environment (not during SSR)
const isBrowser = typeof window !== 'undefined';
// Check if localStorage is available (web) vs AsyncStorage (native)
const hasLocalStorage = isBrowser && typeof localStorage !== 'undefined';

// Safe storage getter
const getStoredLanguage = async (): Promise<string | null> => {
  if (!isBrowser) {
    return null; // Server-side: no storage access
  }

  try {
    if (hasLocalStorage) {
      // Use localStorage for web
      return localStorage.getItem('user-language');
    } else {
      // Use AsyncStorage for native (only if available)
      try {
        return await AsyncStorage.getItem('user-language');
      } catch {
        // AsyncStorage might not be available in some web contexts
        return null;
      }
    }
  } catch (error) {
    // Silently fail during SSR or if storage is unavailable
    if (isBrowser) {
      logger.log('Error reading language from storage:', error);
    }
    return null;
  }
};

// Safe storage setter
const setStoredLanguage = async (lng: string): Promise<void> => {
  if (!isBrowser) {
    return; // Server-side: skip storage
  }

  try {
    if (hasLocalStorage) {
      // Use localStorage for web
      localStorage.setItem('user-language', lng);
    } else {
      // Use AsyncStorage for native (only if available)
      try {
        await AsyncStorage.setItem('user-language', lng);
      } catch {
        // AsyncStorage might not be available in some web contexts
        // Silently fail
      }
    }
  } catch (error) {
    // Silently fail during SSR or if storage is unavailable
    if (isBrowser) {
      logger.log('Error saving language to storage:', error);
    }
  }
};

// Custom language detector for React Native and Web
const RNLanguageDetector = {
  type: 'languageDetector' as const,
  async: true,
  detect: async (callback: (lng: string) => void) => {
    try {
      // Try to get language from storage first
      const savedLanguage = await getStoredLanguage();
      if (savedLanguage) {
        callback(savedLanguage);
        return;
      }
      
      // Fallback to browser language or default
      if (isBrowser && navigator?.language) {
        const browserLang = navigator.language.split('-')[0];
        if (browserLang === 'th' || browserLang === 'en') {
          callback(browserLang);
          return;
        }
      }
      
      // Default fallback
      callback('en');
    } catch (error) {
      logger.log('Error detecting language:', error);
      callback('en'); // fallback to English
    }
  },
  init: () => {},
  cacheUserLanguage: async (lng: string) => {
    await setStoredLanguage(lng);
  },
};

const resources = {
  en: {
    translation: en,
  },
  th: {
    translation: th,
  },
};

i18n
  .use(RNLanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    // Disable debug logs during static export/build to reduce noise
    debug: false, // Set to __DEV__ if you need debug logs during development
    
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    
    // Namespace configuration
    defaultNS: 'translation',
    ns: ['translation'],
    
    // Cache configuration
    cache: {
      enabled: true,
    },
    
    // Detection options (removed asyncStorage cache for SSR compatibility)
    detection: {
      // Only use in-memory cache during SSR
      caches: isBrowser ? ['localStorage'] : [],
    },
  });

export default i18n;

// Helper function to change language
export const changeLanguage = async (languageCode: string) => {
  try {
    await i18n.changeLanguage(languageCode);
    await setStoredLanguage(languageCode);
  } catch (error) {
    logger.log('Error changing language:', error);
  }
};

// Helper function to get current language
export const getCurrentLanguage = () => {
  return i18n.language || 'en';
};

// Helper function to get available languages
export const getAvailableLanguages = () => {
  return Object.keys(resources);
};
