const ENV_API_URL = process.env.EXPO_PUBLIC_API_URL as string | undefined;

function getBaseUrl(): string {
  if (ENV_API_URL) {
    const url = new URL(ENV_API_URL);
    if (!__DEV__ && (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash)) throw new Error('Production API must use HTTPS without credentials or query parameters.');
    const normalized = ENV_API_URL.replace(/\/+$/, '');
    return normalized.endsWith('/api') ? normalized.slice(0, -4) : normalized;
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
  const base = API_BASE_URL.replace(/^https:/, 'wss:').replace(/^http:/, 'ws:');
  const separator = path.startsWith('/') ? '' : '/';
  return `${base}${separator}${path}`;
}