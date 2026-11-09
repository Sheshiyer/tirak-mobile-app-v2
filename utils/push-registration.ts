import { apiUrl } from '@/constants/api';
import { secureStorage } from '@/utils/secure-storage';
import { logger } from '@/utils/logger';

const REGISTRATION_KEY = 'tirak-push-registration';
interface Registration { userId: string; token: string; previousTokens?: string[] }
// Serialize ownership changes so a late old-user response cannot overwrite a new registration.
let sessionGeneration = 0;
export const getPushSessionGeneration = () => sessionGeneration;
let operation: Promise<unknown> = Promise.resolve();
function serial<T>(run: () => Promise<T>): Promise<T> {
  const next = operation.then(run, run);
  operation = next.catch(() => {});
  return next;
}
async function pushRequest(options: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try { return await fetch(apiUrl('/api/notifications/push-token'), { ...options, signal: controller.signal }); }
  finally { clearTimeout(timer); }
}
async function currentIdentity(): Promise<string | undefined> {
  const stored = await secureStorage.getItemAsync('userCredentials');
  return stored ? JSON.parse(stored)?.id : undefined;
}
export function registerBookingPushToken(userId: string, token: string, deviceType: string, appVersion?: string, expectedGeneration = sessionGeneration): Promise<boolean> {
  return serial(async () => {
    const authToken = await secureStorage.getItemAsync('authToken');
    if (expectedGeneration !== sessionGeneration || !authToken || await currentIdentity() !== userId) return false;
    // Persist the cleanup receipt BEFORE the external write. A storage failure cannot orphan a server token.
    const previousRaw = await secureStorage.getItemAsync(REGISTRATION_KEY);
    const previous: Registration | null = previousRaw ? JSON.parse(previousRaw) : null;
    const previousTokens = previous?.userId === userId
      ? [...new Set([previous.token, ...(previous.previousTokens || [])])].filter(value => value !== token) : [];
    const serialized = JSON.stringify({ userId, token, previousTokens });
    await secureStorage.setItemAsync(REGISTRATION_KEY, serialized);
    if (await secureStorage.getItemAsync(REGISTRATION_KEY) !== serialized) throw new Error('Push cleanup receipt could not be stored');
    const response = await pushRequest({
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
      body: JSON.stringify({ token, deviceType, deviceInfo: { appVersion, platform: deviceType } }),
    });
    if (!response.ok) throw new Error('Push registration was rejected');
    const body = await response.json();
    if (body?.success !== true) throw new Error('Push registration did not succeed');
    return true;
  });
}
/** Best effort on logout: failed delivery cleanup remains distinguishable from confirmed removal. */
export function unregisterBookingPushNotifications(): Promise<boolean> {
  sessionGeneration += 1;
  return serial(async () => {
    try {
      const stored = await secureStorage.getItemAsync(REGISTRATION_KEY);
      if (!stored) return true;
      const registration: Registration = JSON.parse(stored);
      const authToken = await secureStorage.getItemAsync('authToken');
      if (!authToken || await currentIdentity() !== registration.userId) return false;
      for (const token of new Set([registration.token, ...(registration.previousTokens || [])])) {
        const response = await pushRequest({
          method: 'DELETE', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
          body: JSON.stringify({ token }),
        });
        if (!response.ok || (await response.json())?.success !== true) throw new Error('Push removal was rejected');
      }
      await secureStorage.deleteItemAsync(REGISTRATION_KEY);
      return true;
    } catch {
      // Never log the token or a network error that may embed its request body.
      logger.warn('[Notifications] Push removal could not be confirmed');
      return false;
    }
  });
}
