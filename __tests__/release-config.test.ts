import fs from 'node:fs';
import path from 'node:path';

const root = path.join(__dirname, '..');
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');
const config = JSON.parse(read('app.json')).expo;
const eas = JSON.parse(read('eas.json'));
const resolveConfig = require('../app.config.js');

const RELEASE_ENV_KEYS = [
  'EXPO_PUBLIC_ENV_NAME',
  'EXPO_PUBLIC_API_URL',
  'EXPO_PUBLIC_DEMO_MODE',
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
    expect(ios).toMatch(new RegExp(`<key>EXUpdatesRuntimeVersion<\\/key>\\s*<string>${config.version}<\\/string>`));
  });

  test('the native repair release has a new aligned app and iOS runtime version', () => {
    expect(config.version).toBe('1.5.2');
    expect(JSON.parse(read('package.json')).version).toBe(config.version);
    expect(read('ios/Tirak/Info.plist')).toMatch(new RegExp(`<key>CFBundleShortVersionString<\\/key>\\s*<string>${config.version}<\\/string>`));
    expect(read('ios/Tirak.xcodeproj/project.pbxproj')).toContain(`MARKETING_VERSION = ${config.version};`);
    expect(read('android/app/build.gradle')).toContain(`versionName "${config.version}"`);
  });

  test.each(['development', 'preview', 'production'])('%s uses its own channel and environment with demo/payment gates off', (profile) => {
    expect(eas.build[profile]).toMatchObject({
      channel: profile,
      environment: profile,
      bun: '1.3.5',
      env: { EXPO_PUBLIC_DEMO_MODE: 'false', EXPO_PUBLIC_REVIEW_MODE: 'false', EXPO_PUBLIC_PROMPTPAY_ENABLED: 'false' },
    });
  });

  test('review is isolated and cannot enable payment', () => {
    expect(eas.build.review).toMatchObject({
      channel: 'review', extends: 'production',
      env: { EXPO_PUBLIC_REVIEW_MODE: 'true', EXPO_PUBLIC_PROMPTPAY_ENABLED: 'false' },
    });
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

  test('OTA workflow selects an explicit environment and guards production main', () => {
    const workflow = read('.github/workflows/eas-update.yml');
    expect(workflow).toContain("inputs.channel == 'production' && github.ref != 'refs/heads/main'");
    expect(workflow).toContain('--environment "$EAS_ENVIRONMENT"');
    expect(workflow).toContain('EXPO_PUBLIC_PROMPTPAY_ENABLED: "false"');
    const beforePublish = workflow.split('- name: Publish update')[0];
    expect(beforePublish).not.toContain('EXPO_PUBLIC_REVIEW_MODE:');
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
