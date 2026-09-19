import fs from 'node:fs';
import path from 'node:path';

const root = path.join(__dirname, '..');
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');
const config = JSON.parse(read('app.json')).expo;
const eas = JSON.parse(read('eas.json'));
const resolveConfig = require('../app.config.js');

describe('release delivery boundaries', () => {
  test('dynamic and both native configs use the existing project and fingerprint runtime', () => {
    const resolved = resolveConfig({ config });
    const url = `https://u.expo.dev/${config.extra.eas.projectId}`;
    expect(resolved.updates.url).toBe(url);
    expect(resolved.runtimeVersion).toEqual({ policy: 'fingerprint' });
    const android = read('android/app/src/main/AndroidManifest.xml');
    expect(android).toContain('android:name="expo.modules.updates.ENABLED" android:value="true"');
    expect(android).toContain(`android:name="expo.modules.updates.EXPO_UPDATE_URL" android:value="${url}"`);
    expect(android).toContain('android:name="expo.modules.updates.EXPO_RUNTIME_VERSION" android:value="@string/expo_runtime_version"');
    expect(read('android/app/src/main/res/values/strings.xml'))
      .toMatch(/name="expo_runtime_version"[^>]*>file:fingerprint</);
    const ios = read('ios/Tirak/Supporting/Expo.plist');
    expect(ios).toMatch(/<key>EXUpdatesEnabled<\/key>\s*<true\/>/);
    expect(ios).toContain(`<string>${url}</string>`);
    expect(ios).toMatch(/<key>EXUpdatesRuntimeVersion<\/key>\s*<string>file:fingerprint<\/string>/);
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

  test('OTA workflow selects an explicit environment and guards production main', () => {
    const workflow = read('.github/workflows/eas-update.yml');
    expect(workflow).toContain("inputs.channel == 'production' && github.ref != 'refs/heads/main'");
    expect(workflow).toContain('--environment "$EAS_ENVIRONMENT"');
    expect(workflow).toContain('EXPO_PUBLIC_PROMPTPAY_ENABLED: "false"');
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
