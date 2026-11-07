/**
 * Gap 3: QA badge utils must use direct static process.env reads (not indexed
 * access) so Metro can inline them. Build gate must fail on misconfigured QA URL
 * and require payment/review gates off for core-qa, while preserving ordinary
 * production builds.
 */
import { CORE_QA_API_URL, isCoreQaEnvironment, validateCoreQaBuildGate } from '@/utils/qa-env';

const CORE_QA_URL = CORE_QA_API_URL;

describe('QA environment detection (static reads)', () => {
  const savedEnv: Record<string, string | undefined> = {};

  function setEnv(vars: Record<string, string | undefined>) {
    for (const [k, v] of Object.entries(vars)) {
      savedEnv[k] = process.env[k];
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }

  afterEach(() => {
    // Restore original env
    for (const [k, v] of Object.entries(savedEnv)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  });

  test('detects core-qa via EXPO_PUBLIC_ENV_NAME=core-qa', () => {
    setEnv({ EXPO_PUBLIC_ENV_NAME: 'core-qa', EXPO_PUBLIC_API_URL: CORE_QA_URL });
    expect(isCoreQaEnvironment()).toBe(true);
  });

  test('detects core-qa via EXPO_PUBLIC_ENV_NAME=qa (case insensitive)', () => {
    setEnv({ EXPO_PUBLIC_ENV_NAME: 'QA', EXPO_PUBLIC_API_URL: '' });
    expect(isCoreQaEnvironment()).toBe(true);
  });

  test('detects core-qa via exact API URL match', () => {
    setEnv({ EXPO_PUBLIC_ENV_NAME: '', EXPO_PUBLIC_API_URL: CORE_QA_URL });
    expect(isCoreQaEnvironment()).toBe(true);
  });

  test('rejects partial URL substring matches — only exact URL qualifies', () => {
    setEnv({
      EXPO_PUBLIC_ENV_NAME: '',
      EXPO_PUBLIC_API_URL: 'https://tirak-core-qa-staging.tirak-court.workers.dev',
    });
    expect(isCoreQaEnvironment()).toBe(false);
  });

  test('returns false for ordinary production env', () => {
    setEnv({
      EXPO_PUBLIC_ENV_NAME: 'production',
      EXPO_PUBLIC_API_URL: 'https://tirak-backend.tirak-court.workers.dev',
    });
    expect(isCoreQaEnvironment()).toBe(false);
  });

  test('returns false when env vars are unset', () => {
    setEnv({ EXPO_PUBLIC_ENV_NAME: undefined, EXPO_PUBLIC_API_URL: undefined });
    expect(isCoreQaEnvironment()).toBe(false);
  });
});

describe('core-qa build gate validation', () => {
  const savedEnv: Record<string, string | undefined> = {};
  const QA_VARS = [
    'EXPO_PUBLIC_ENV_NAME',
    'EXPO_PUBLIC_API_URL',
    'EXPO_PUBLIC_DEMO_MODE',
    'EXPO_PUBLIC_PROMPTPAY_ENABLED',
    'EXPO_PUBLIC_REVIEW_MODE',
  ];

  function setEnv(vars: Record<string, string | undefined>) {
    for (const k of QA_VARS) {
      savedEnv[k] = process.env[k];
      delete process.env[k];
    }
    for (const [k, v] of Object.entries(vars)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }

  afterEach(() => {
    for (const k of QA_VARS) {
      if (savedEnv[k] === undefined) delete process.env[k];
      else process.env[k] = savedEnv[k];
    }
  });

  test('passes with correct core-qa config', () => {
    setEnv({
      EXPO_PUBLIC_ENV_NAME: 'core-qa',
      EXPO_PUBLIC_API_URL: CORE_QA_URL,
    });
    expect(() => validateCoreQaBuildGate()).not.toThrow();
  });

  test('fails if API URL is wrong for core-qa', () => {
    setEnv({
      EXPO_PUBLIC_ENV_NAME: 'core-qa',
      EXPO_PUBLIC_API_URL: 'https://wrong-url.workers.dev',
    });
    expect(() => validateCoreQaBuildGate()).toThrow(/EXPO_PUBLIC_API_URL/);
  });

  test('fails if API URL is empty for core-qa', () => {
    setEnv({
      EXPO_PUBLIC_ENV_NAME: 'core-qa',
      EXPO_PUBLIC_API_URL: '',
    });
    expect(() => validateCoreQaBuildGate()).toThrow(/EXPO_PUBLIC_API_URL/);
  });

  test('fails if payment gate is enabled for core-qa', () => {
    setEnv({
      EXPO_PUBLIC_ENV_NAME: 'core-qa',
      EXPO_PUBLIC_API_URL: CORE_QA_URL,
      EXPO_PUBLIC_PROMPTPAY_ENABLED: 'true',
    });
    expect(() => validateCoreQaBuildGate()).toThrow(/EXPO_PUBLIC_PROMPTPAY_ENABLED/);
  });

  test('fails if demo mode is enabled for core-qa', () => {
    setEnv({
      EXPO_PUBLIC_ENV_NAME: 'core-qa',
      EXPO_PUBLIC_API_URL: CORE_QA_URL,
      EXPO_PUBLIC_DEMO_MODE: 'true',
    });
    expect(() => validateCoreQaBuildGate()).toThrow(/EXPO_PUBLIC_DEMO_MODE/);
  });

  test('fails if review mode is enabled for core-qa', () => {
    setEnv({
      EXPO_PUBLIC_ENV_NAME: 'core-qa',
      EXPO_PUBLIC_API_URL: CORE_QA_URL,
      EXPO_PUBLIC_REVIEW_MODE: 'true',
    });
    expect(() => validateCoreQaBuildGate()).toThrow(/EXPO_PUBLIC_REVIEW_MODE/);
  });

  test('silently passes for non-QA builds regardless of other env vars', () => {
    setEnv({
      EXPO_PUBLIC_ENV_NAME: 'production',
      EXPO_PUBLIC_API_URL: 'https://anything.example.com',
      EXPO_PUBLIC_PROMPTPAY_ENABLED: 'true',
      EXPO_PUBLIC_REVIEW_MODE: 'true',
    });
    expect(() => validateCoreQaBuildGate()).not.toThrow();
  });
});
