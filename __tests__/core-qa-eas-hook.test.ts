const fs = require('fs');
const os = require('os');
const path = require('path');

const repoRoot = path.join(__dirname, '..');

const {
  stampIosInfoPlist,
  stampIosProject,
  stampExpoPlist,
  stampAndroidBuildGradle,
  stampAndroidStrings,
  versionToCode,
  run,
} = require('../eas-hooks/core-qa-prebuild');

const SAMPLE_INFO_PLIST = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>CFBundleDisplayName</key>
    <string>Tirak</string>
    <key>CFBundleShortVersionString</key>
    <string>1.5.2</string>
    <key>CFBundleVersion</key>
    <string>42</string>
  </dict>
</plist>`;

const SAMPLE_PBXPROJ = `// !$*UTF8*$!
MARKETING_VERSION = 1.5.2;
CURRENT_PROJECT_VERSION = 42;
MARKETING_VERSION = 1.5.2;
CURRENT_PROJECT_VERSION = 84;
`;

const SAMPLE_EXPO_PLIST = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>EXUpdatesRuntimeVersion</key>
    <string>1.5.2</string>
    <key>EXUpdatesURL</key>
    <string>https://u.expo.dev/test</string>
  </dict>
</plist>`;

const SAMPLE_GRADLE = `apply plugin: "com.android.application"

android {
    defaultConfig {
        applicationId "com.tirak.app"
        versionCode 4201
        versionName "1.5.2"
        minSdkVersion rootProject.ext.minSdkVersion
    }
}`;

const SAMPLE_STRINGS = `<resources>
  <string name="app_name">Tirak</string>
  <string name="expo_runtime_version">file:fingerprint</string>
</resources>`;

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'core-qa-hook-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('core-qa prebuild hook — native file stamping', () => {
  test('stampIosInfoPlist updates marketing version and preserves build number', () => {
    const plistPath = path.join(tmpDir, 'ios', 'Tirak');
    fs.mkdirSync(plistPath, { recursive: true });
    const filePath = path.join(plistPath, 'Info.plist');
    fs.writeFileSync(filePath, SAMPLE_INFO_PLIST, 'utf8');

    stampIosInfoPlist('1.5.3', tmpDir);

    const result = fs.readFileSync(filePath, 'utf8');
    expect(result).toContain('<string>1.5.3</string>');
    expect(result).toContain('<string>42</string>');
  });

  test('stampIosProject updates MARKETING_VERSION and preserves CURRENT_PROJECT_VERSION', () => {
    const projectDir = path.join(tmpDir, 'ios', 'Tirak.xcodeproj');
    fs.mkdirSync(projectDir, { recursive: true });
    const filePath = path.join(projectDir, 'project.pbxproj');
    fs.writeFileSync(filePath, SAMPLE_PBXPROJ, 'utf8');

    stampIosProject(tmpDir);

    const result = fs.readFileSync(filePath, 'utf8');
    expect(result).toContain('MARKETING_VERSION = 1.5.3;');
    expect(result).toContain('CURRENT_PROJECT_VERSION = 42;');
    expect(result).toContain('CURRENT_PROJECT_VERSION = 84;');
  });

  test('stampExpoPlist updates runtime version preserving other keys', () => {
    const plistDir = path.join(tmpDir, 'ios', 'Tirak', 'Supporting');
    fs.mkdirSync(plistDir, { recursive: true });
    const filePath = path.join(plistDir, 'Expo.plist');
    fs.writeFileSync(filePath, SAMPLE_EXPO_PLIST, 'utf8');

    stampExpoPlist('1.5.3-core-qa', tmpDir);

    const result = fs.readFileSync(filePath, 'utf8');
    expect(result).toContain('<string>1.5.3-core-qa</string>');
    expect(result).toContain('https://u.expo.dev/test');
  });

  test('stampAndroidBuildGradle updates versionName and preserves versionCode', () => {
    const gradleDir = path.join(tmpDir, 'android', 'app');
    fs.mkdirSync(gradleDir, { recursive: true });
    const filePath = path.join(gradleDir, 'build.gradle');
    fs.writeFileSync(filePath, SAMPLE_GRADLE, 'utf8');

    stampAndroidBuildGradle('1.5.3', tmpDir);

    const result = fs.readFileSync(filePath, 'utf8');
    expect(result).toContain('versionName "1.5.3"');
    expect(result).toContain('versionCode 4201');
    expect(result).toContain('applicationId "com.tirak.app"');
  });

  test('stampAndroidStrings updates expo_runtime_version', () => {
    const stringsDir = path.join(tmpDir, 'android', 'app', 'src', 'main', 'res', 'values');
    fs.mkdirSync(stringsDir, { recursive: true });
    const filePath = path.join(stringsDir, 'strings.xml');
    fs.writeFileSync(filePath, SAMPLE_STRINGS, 'utf8');

    stampAndroidStrings('1.5.3-core-qa', tmpDir);

    const result = fs.readFileSync(filePath, 'utf8');
    expect(result).toContain('<string name="expo_runtime_version">1.5.3-core-qa</string>');
  });

  test('required native files fail loudly when missing', () => {
    expect(() => stampIosInfoPlist('1.5.3', tmpDir)).toThrow(/required file missing/);
    expect(() => stampIosProject(tmpDir)).toThrow(/required file missing/);
    expect(() => stampExpoPlist('1.5.3-core-qa', tmpDir)).toThrow(/required file missing/);
    expect(() => stampAndroidBuildGradle('1.5.3', tmpDir)).toThrow(/required file missing/);
    expect(() => stampAndroidStrings('1.5.3-core-qa', tmpDir)).toThrow(/required file missing/);
  });

  test('versionToCode still matches semver helper contract', () => {
    expect(versionToCode('1.5.2')).toBe(10502);
    expect(versionToCode('1.5.3')).toBe(10503);
  });
});

describe('core-qa prebuild hook — env validation', () => {
  const savedEnv: Record<string, string | undefined> = {};
  const ENV_KEYS = ['EXPO_PUBLIC_ENV_NAME', 'EXPO_PUBLIC_API_URL', 'EXPO_PUBLIC_DEMO_MODE', 'EXPO_PUBLIC_PROMPTPAY_ENABLED', 'EXPO_PUBLIC_REVIEW_MODE'];

  function setEnv(vars: Record<string, string | undefined>) {
    for (const k of ENV_KEYS) {
      savedEnv[k] = process.env[k];
      delete process.env[k];
    }
    for (const [k, v] of Object.entries(vars)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }

  afterEach(() => {
    for (const k of ENV_KEYS) {
      if (savedEnv[k] === undefined) delete process.env[k];
      else process.env[k] = savedEnv[k];
    }
  });

  test('non-QA build is a no-op', () => {
    setEnv({ EXPO_PUBLIC_ENV_NAME: 'production' });
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    expect(() => run(tmpDir)).not.toThrow();
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('non-QA build'));
    spy.mockRestore();
  });

  test('core-qa build fails on missing or wrong API URL', () => {
    setEnv({ EXPO_PUBLIC_ENV_NAME: 'core-qa', EXPO_PUBLIC_API_URL: '' });
    expect(() => run(tmpDir)).toThrow(/EXPO_PUBLIC_API_URL/);

    setEnv({ EXPO_PUBLIC_ENV_NAME: 'core-qa', EXPO_PUBLIC_API_URL: 'https://wrong.workers.dev/api' });
    expect(() => run(tmpDir)).toThrow(/EXPO_PUBLIC_API_URL/);
  });

  test('core-qa build fails if demo, promptpay, or review modes are enabled', () => {
    setEnv({ EXPO_PUBLIC_ENV_NAME: 'core-qa', EXPO_PUBLIC_API_URL: 'https://tirak-core-qa-20261005.tirak-court.workers.dev/api', EXPO_PUBLIC_DEMO_MODE: 'true' });
    expect(() => run(tmpDir)).toThrow(/EXPO_PUBLIC_DEMO_MODE/);

    setEnv({ EXPO_PUBLIC_ENV_NAME: 'core-qa', EXPO_PUBLIC_API_URL: 'https://tirak-core-qa-20261005.tirak-court.workers.dev/api', EXPO_PUBLIC_PROMPTPAY_ENABLED: 'true' });
    expect(() => run(tmpDir)).toThrow(/EXPO_PUBLIC_PROMPTPAY_ENABLED/);

    setEnv({ EXPO_PUBLIC_ENV_NAME: 'core-qa', EXPO_PUBLIC_API_URL: 'https://tirak-core-qa-20261005.tirak-court.workers.dev/api', EXPO_PUBLIC_REVIEW_MODE: 'true' });
    expect(() => run(tmpDir)).toThrow(/EXPO_PUBLIC_REVIEW_MODE/);
  });

  test('core-qa build succeeds and stamps all required fixture files', () => {
    setEnv({
      EXPO_PUBLIC_ENV_NAME: 'core-qa',
      EXPO_PUBLIC_API_URL: 'https://tirak-core-qa-20261005.tirak-court.workers.dev/api',
    });

    fs.mkdirSync(path.join(tmpDir, 'ios', 'Tirak', 'Supporting'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, 'ios', 'Tirak.xcodeproj'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, 'android', 'app', 'src', 'main', 'res', 'values'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, 'ios', 'Tirak', 'Info.plist'), SAMPLE_INFO_PLIST, 'utf8');
    fs.writeFileSync(path.join(tmpDir, 'ios', 'Tirak.xcodeproj', 'project.pbxproj'), SAMPLE_PBXPROJ, 'utf8');
    fs.writeFileSync(path.join(tmpDir, 'ios', 'Tirak', 'Supporting', 'Expo.plist'), SAMPLE_EXPO_PLIST, 'utf8');
    fs.writeFileSync(path.join(tmpDir, 'android', 'app', 'build.gradle'), SAMPLE_GRADLE, 'utf8');
    fs.writeFileSync(path.join(tmpDir, 'android', 'app', 'src', 'main', 'res', 'values', 'strings.xml'), SAMPLE_STRINGS, 'utf8');

    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    expect(() => run(tmpDir)).not.toThrow();
    spy.mockRestore();

    expect(fs.readFileSync(path.join(tmpDir, 'ios', 'Tirak', 'Info.plist'), 'utf8')).toContain('<string>42</string>');
    expect(fs.readFileSync(path.join(tmpDir, 'ios', 'Tirak.xcodeproj', 'project.pbxproj'), 'utf8')).toContain('MARKETING_VERSION = 1.5.3;');
    expect(fs.readFileSync(path.join(tmpDir, 'ios', 'Tirak', 'Supporting', 'Expo.plist'), 'utf8')).toContain('<string>1.5.3-core-qa</string>');
    expect(fs.readFileSync(path.join(tmpDir, 'android', 'app', 'build.gradle'), 'utf8')).toContain('versionCode 4201');
    expect(fs.readFileSync(path.join(tmpDir, 'android', 'app', 'src', 'main', 'res', 'values', 'strings.xml'), 'utf8')).toContain('1.5.3-core-qa');
  });

  test('core-qa build on copied prebuild fixtures preserves remote-owned build numbers and push entitlements', () => {
    setEnv({
      EXPO_PUBLIC_ENV_NAME: 'core-qa',
      EXPO_PUBLIC_API_URL: 'https://tirak-core-qa-20261005.tirak-court.workers.dev/api',
    });

    const fixtureCopies = [
      ['ios/Tirak/Info.plist', 'ios/Tirak/Info.plist'],
      ['ios/Tirak/Supporting/Expo.plist', 'ios/Tirak/Supporting/Expo.plist'],
      ['ios/Tirak.xcodeproj/project.pbxproj', 'ios/Tirak.xcodeproj/project.pbxproj'],
      ['ios/Tirak/Tirak.entitlements', 'ios/Tirak/Tirak.entitlements'],
      ['ios/Tirak/Tirak.Debug.entitlements', 'ios/Tirak/Tirak.Debug.entitlements'],
      ['android/app/build.gradle', 'android/app/build.gradle'],
      ['android/app/src/main/res/values/strings.xml', 'android/app/src/main/res/values/strings.xml'],
      ['android/app/src/main/AndroidManifest.xml', 'android/app/src/main/AndroidManifest.xml'],
    ];

    for (const [source, dest] of fixtureCopies) {
      const srcPath = path.join(repoRoot, source);
      const destPath = path.join(tmpDir, dest);
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      fs.copyFileSync(srcPath, destPath);
    }

    const infoBefore = fs.readFileSync(path.join(tmpDir, 'ios', 'Tirak', 'Info.plist'), 'utf8');
    const expoBefore = fs.readFileSync(path.join(tmpDir, 'ios', 'Tirak', 'Supporting', 'Expo.plist'), 'utf8');
    const projectBefore = fs.readFileSync(path.join(tmpDir, 'ios', 'Tirak.xcodeproj', 'project.pbxproj'), 'utf8');
    const gradleBefore = fs.readFileSync(path.join(tmpDir, 'android', 'app', 'build.gradle'), 'utf8');
    const manifestBefore = fs.readFileSync(path.join(tmpDir, 'android', 'app', 'src', 'main', 'AndroidManifest.xml'), 'utf8');
    const prodEntitlementsBefore = fs.readFileSync(path.join(tmpDir, 'ios', 'Tirak', 'Tirak.entitlements'), 'utf8');
    const debugEntitlementsBefore = fs.readFileSync(path.join(tmpDir, 'ios', 'Tirak', 'Tirak.Debug.entitlements'), 'utf8');

    run(tmpDir);

    const infoAfter = fs.readFileSync(path.join(tmpDir, 'ios', 'Tirak', 'Info.plist'), 'utf8');
    const expoAfter = fs.readFileSync(path.join(tmpDir, 'ios', 'Tirak', 'Supporting', 'Expo.plist'), 'utf8');
    const projectAfter = fs.readFileSync(path.join(tmpDir, 'ios', 'Tirak.xcodeproj', 'project.pbxproj'), 'utf8');
    const gradleAfter = fs.readFileSync(path.join(tmpDir, 'android', 'app', 'build.gradle'), 'utf8');
    const stringsAfter = fs.readFileSync(path.join(tmpDir, 'android', 'app', 'src', 'main', 'res', 'values', 'strings.xml'), 'utf8');
    const manifestAfter = fs.readFileSync(path.join(tmpDir, 'android', 'app', 'src', 'main', 'AndroidManifest.xml'), 'utf8');
    const prodEntitlementsAfter = fs.readFileSync(path.join(tmpDir, 'ios', 'Tirak', 'Tirak.entitlements'), 'utf8');
    const debugEntitlementsAfter = fs.readFileSync(path.join(tmpDir, 'ios', 'Tirak', 'Tirak.Debug.entitlements'), 'utf8');

    expect(infoAfter).toContain('<key>CFBundleShortVersionString</key>');
    expect(infoAfter).toContain('<string>1.5.3</string>');
    expect(infoAfter).toContain('<key>CFBundleVersion</key>');
    expect(infoAfter).toContain('<string>1</string>');
    expect(infoAfter.replace('<string>1.5.3</string>', '<string>1.5.2</string>')).toBe(infoBefore);

    expect(expoAfter).toContain('<string>1.5.3-core-qa</string>');
    expect(expoAfter).toContain('<string>https://u.expo.dev/ba0d6f3e-ed4c-4aaf-8cff-aa2fdb253cc5</string>');
    expect(expoAfter.replace('<string>1.5.3-core-qa</string>', '<string>1.5.2</string>')).toBe(expoBefore);

    expect(projectAfter).toContain('MARKETING_VERSION = 1.5.3;');
    expect(projectAfter).toContain('CURRENT_PROJECT_VERSION = 1;');
    expect(projectAfter.replace(/MARKETING_VERSION = 1\.5\.3;/g, 'MARKETING_VERSION = 1.5.2;')).toBe(projectBefore);

    expect(gradleAfter).toContain('versionName "1.5.3"');
    expect(gradleAfter).toContain('versionCode 1');
    expect(gradleAfter.replace('versionName "1.5.3"', 'versionName "1.5.2"')).toBe(gradleBefore);

    expect(stringsAfter).toContain('<string name="expo_runtime_version">1.5.3-core-qa</string>');
    expect(manifestAfter).toBe(manifestBefore);
    expect(manifestAfter).toContain('expo.modules.updates.EXPO_UPDATE_URL');
    expect(prodEntitlementsAfter).toBe(prodEntitlementsBefore);
    expect(debugEntitlementsAfter).toBe(debugEntitlementsBefore);
    expect(prodEntitlementsAfter).toContain('<string>production</string>');
    expect(debugEntitlementsAfter).toContain('<string>development</string>');
  });
});
