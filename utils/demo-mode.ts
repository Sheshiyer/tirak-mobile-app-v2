import { secureStorage } from './secure-storage';

export interface DemoIdentity {
  id?: string | null;
  email?: string | null;
}

const DEMO_IDS = new Set([
  'demo_customer_001',
  'demo_companion_001',
  '30c6d267-22d1-4cd0-8bdc-46993c14c143',
  '4f34d4e0-84f3-4e3c-b443-909ea3905f58',
]);
const DEMO_EMAILS = new Set([
  'demo.customer@tirak.com',
  'demo.companion@tirak.com',
  'test.customer.tirak@gmail.com',
  'test.companion.tirak@gmail.com',
]);

export function isDemoIdentity(user?: DemoIdentity | null): boolean {
  return Boolean(user && (
    DEMO_IDS.has(user.id || '') || DEMO_EMAILS.has((user.email || '').trim().toLowerCase())
  ));
}

/** Preview data requires both a deliberately enabled build and a review identity. */
export function isDemoModeEnabled(user?: DemoIdentity | null): boolean {
  return process.env.EXPO_PUBLIC_ENABLE_DEMO_MODE === 'true' && isDemoIdentity(user);
}

export async function getDemoModeEnabled(): Promise<boolean> {
  if (process.env.EXPO_PUBLIC_ENABLE_DEMO_MODE !== 'true') return false;
  try {
    const stored = await secureStorage.getItemAsync('userCredentials');
    return stored ? isDemoModeEnabled(JSON.parse(stored)) : false;
  } catch {
    return false;
  }
}
