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
    Boolean(user.id?.startsWith('demo_')) || DEMO_IDS.has(user.id || '') || DEMO_EMAILS.has((user.email || '').trim().toLowerCase())
  ));
}

/** Release builds never enable local preview data, regardless of environment. */
export function isDemoModeEnabled(_user?: DemoIdentity | null): boolean { return false; }
export async function getDemoModeEnabled(): Promise<boolean> { return false; }
export async function getReviewModeEnabled(): Promise<boolean> { return false; }
