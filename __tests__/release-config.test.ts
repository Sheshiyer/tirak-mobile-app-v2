import fs from 'node:fs';
import path from 'node:path';

const root = path.join(__dirname, '..');
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');
const config = JSON.parse(read('app.json')).expo;
const eas = JSON.parse(read('eas.json'));
const resolveConfig = require('../app.config.js');

const RELEASE_ENV_KEYS = [
  'EAS_BUILD_PROFILE',
  'EXPO_PUBLIC_ENV_NAME',
  'EXPO_PUBLIC_API_URL',
  'EXPO_PUBLIC_DEMO_MODE',
  'EXPO_PUBLIC_ENABLE_DEMO_MODE',
  'EXPO_PUBLIC_REVIEW_MODE',
  'EXPO_PUBLIC_PROMPTPAY_ENABLED',
];

function withEnv<T>(overrides: Record<string, string | undefined>, run: () => T): T {
  const previous = new Map<string, string | undefined>();
  for (const key of RELEASE_ENV_KEYS) {
    previous.set(key, process.env[key]);
    delete process.env[key];
  }
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }

  try {
    return run();
  } finally {
    for (const key of RELEASE_ENV_KEYS) {
      const value = previous.get(key);
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

describe('release delivery boundaries', () => {
  test('delivery config keeps Android fingerprinted and gives iOS a deterministic app-version runtime', () => {
    const resolved = withEnv({}, () => resolveConfig({ config }));
    const url = `https://u.expo.dev/${config.extra.eas.projectId}`;
    expect(resolved.updates.url).toBe(url);
    expect(resolved.runtimeVersion).toEqual({ policy: 'fingerprint' });
    expect(resolved.ios.runtimeVersion).toBe(config.version);
    const android = read('android/app/src/main/AndroidManifest.xml');
    expect(android).toContain('android:name="expo.modules.updates.ENABLED" android:value="true"');
    expect(android).toContain(`android:name="expo.modules.updates.EXPO_UPDATE_URL" android:value="${url}"`);
    expect(android).toContain('android:name="expo.modules.updates.EXPO_RUNTIME_VERSION" android:value="@string/expo_runtime_version"');
    expect(read('android/app/src/main/res/values/strings.xml'))
      .toMatch(/name="expo_runtime_version"[^>]*>file:fingerprint</);
    const ios = read('ios/Tirak/Supporting/Expo.plist');
    expect(ios).toMatch(/<key>EXUpdatesEnabled<\/key>\s*<true\/>/);
    expect(ios).toContain(`<string>${url}</string>`);
    expect(ios.match(/<key>EXUpdatesRuntimeVersion<\/key>\s*<string>([^<]+)<\/string>/)?.[1]).toBe(config.version);
  });

  test('the package and all native marketing versions match the Expo app version', () => {
    expect(config.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(JSON.parse(read('package.json')).version).toBe(config.version);
    expect(read('ios/Tirak/Info.plist').match(/<key>CFBundleShortVersionString<\/key>\s*<string>([^<]+)<\/string>/)?.[1])
      .toBe(config.version);
    const marketingVersions = [...read('ios/Tirak.xcodeproj/project.pbxproj').matchAll(/\bMARKETING_VERSION = ([^;]+);/g)]
      .map((match) => match[1]);
    expect(new Set(marketingVersions)).toEqual(new Set([config.version]));
    expect(read('android/app/build.gradle').match(/^\s*versionName "([^"]+)"/m)?.[1]).toBe(config.version);
  });

  test.each(['development', 'preview', 'production'])('%s uses its own channel and environment with demo/payment gates off', (profile) => {
    expect(eas.build[profile]).toMatchObject({
      channel: profile,
      environment: profile,
      bun: '1.3.5',
      env: { EXPO_PUBLIC_DEMO_MODE: 'false', EXPO_PUBLIC_REVIEW_MODE: 'false', EXPO_PUBLIC_PROMPTPAY_ENABLED: 'false' },
    });
  });

  test('review profile is retired and release APK uses production configuration', () => {
    expect(eas.build.review).toBeUndefined();
    expect(eas.build.production.distribution).toBe('store');
    expect(eas.build.production.android.buildType).toBe('app-bundle');
    expect(eas.cli.appVersionSource).toBe('remote');
    expect(eas.build.production.autoIncrement).toBe(true);
    expect(eas.build['release-apk']).toMatchObject({ extends: 'production', environment: 'production', channel: 'production', android: { buildType: 'apk' } });
  });

  test('production gate rejects a QA backend or preview flags', () => {
    expect(() => withEnv({ EXPO_PUBLIC_ENV_NAME: 'production', EXPO_PUBLIC_API_URL: 'https://tirak-core-qa-20261005.tirak-court.workers.dev/api' }, () => resolveConfig({ config }))).toThrow('Release requires');
    expect(() => withEnv({ EXPO_PUBLIC_ENV_NAME: 'production', EXPO_PUBLIC_API_URL: eas.build.production.env.EXPO_PUBLIC_API_URL, EXPO_PUBLIC_REVIEW_MODE: 'true' }, () => resolveConfig({ config }))).toThrow('Cash-only');
    const resolved = withEnv(eas.build.production.env, () => resolveConfig({ config }));
    expect(resolved.version).toBe(config.version);
    expect(resolved.extra.reviewMode).toBe(false);
  });

  test('core-qa build profile isolates API URL and disables demo/review/payment gates', () => {
    expect(eas.build['core-qa']).toMatchObject({
      channel: 'core-qa',
      environment: 'preview',
      autoIncrement: true,
      android: { buildType: 'apk' },
      env: {
        EXPO_PUBLIC_API_URL: 'https://tirak-core-qa-20261005.tirak-court.workers.dev/api',
        EXPO_PUBLIC_ENV_NAME: 'core-qa',
        EXPO_PUBLIC_DEMO_MODE: 'false',
        EXPO_PUBLIC_REVIEW_MODE: 'false',
        EXPO_PUBLIC_PROMPTPAY_ENABLED: 'false',
      },
    });
  });

  test('EAS post-install hook is wired through package.json and targets the narrow QA stamper', () => {
    const scripts = JSON.parse(read('package.json')).scripts;
    expect(scripts['eas-build-post-install']).toBe('node ./eas-hooks/core-qa-prebuild.js');
    expect(read('eas-hooks/core-qa-prebuild.js')).toContain('non-QA build — skipping.');
  });

  test('release build profiles enforce the production gate even without an environment label', () => {
    for (const profile of ['production', 'release-apk']) {
      const releaseEnv = { ...eas.build.production.env, EAS_BUILD_PROFILE: profile, EXPO_PUBLIC_ENV_NAME: undefined };
      expect(() => withEnv({ ...releaseEnv, EXPO_PUBLIC_API_URL: 'https://preview.example.test/api' }, () => resolveConfig({ config })))
        .toThrow('Release requires');
      expect(() => withEnv({ ...releaseEnv, EXPO_PUBLIC_ENABLE_DEMO_MODE: 'true' }, () => resolveConfig({ config })))
        .toThrow('Cash-only');
      expect(withEnv(releaseEnv, () => resolveConfig({ config })).extra.reviewMode).toBe(false);
    }
  });

  test('Bun is authoritative and uploads exclude local secrets and raw evidence', () => {
    expect(fs.existsSync(path.join(root, 'bun.lock'))).toBe(true);
    expect(fs.existsSync(path.join(root, 'package-lock.json'))).toBe(false);
    const ignored = read('.easignore').split(/\r?\n/);
    for (const entry of ['.env', '.env.*', 'credentials.json', 'sentry.json', '.superset/', '.temperance/', '.worktrees/', 'evidence/', 'rehearsal/']) {
      expect(ignored).toContain(entry);
    }
  });
});


describe('tracked iOS push capability', () => {
  test('native target entitlements select development versus distribution APNs', () => {
    expect(read('ios/Tirak/Tirak.entitlements')).toContain('<key>aps-environment</key>');
    expect(read('ios/Tirak/Tirak.entitlements')).toContain('<string>production</string>');
    expect(read('ios/Tirak/Tirak.Debug.entitlements')).toContain('<string>development</string>');
    expect(read('ios/Tirak/Tirak.entitlements')).not.toContain('$(');
    expect(read('ios/Tirak/Tirak.Debug.entitlements')).not.toContain('$(');
    const project = read('ios/Tirak.xcodeproj/project.pbxproj');
    expect(project).toContain('CODE_SIGN_ENTITLEMENTS = Tirak/Tirak.Debug.entitlements;');
    expect(project).toContain('CODE_SIGN_ENTITLEMENTS = Tirak/Tirak.entitlements;');
  });
});
