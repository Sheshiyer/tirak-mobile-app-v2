import { Platform } from 'react-native';

const ENV_API_URL = process.env.EXPO_PUBLIC_API_URL as string | undefined;

function getBaseUrl(): string {
  if (ENV_API_URL) {
    return ENV_API_URL.endsWith('/api') ? ENV_API_URL.slice(0, -4) : ENV_API_URL;
  }

  if (__DEV__) {
    return 'https://tirak-backend.tirak-court.workers.dev';
  }

  throw new Error(
    'EXPO_PUBLIC_API_URL is not configured. ' +
    'Set it in .env for local development or EAS secrets for production builds.'
  );
}

export const API_BASE_URL = getBaseUrl();

export function apiUrl(path: string): string {
  const separator = path.startsWith('/') ? '' : '/';
  return `${API_BASE_URL}${separator}${path}`;
}

export function wsUrl(path: string): string {
  const base = API_BASE_URL.replace(/^https?/, Platform.OS === 'web' ? 'ws' : 'wss');
  const separator = path.startsWith('/') ? '' : '/';
  return `${base}${separator}${path}`;
}