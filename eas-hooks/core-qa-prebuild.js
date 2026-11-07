#!/usr/bin/env node
/**
 * core-qa-prebuild.js — narrow EAS post-install hook for core-qa native version stamping.
 *
 * Runs only when EXPO_PUBLIC_ENV_NAME=core-qa. Validates the env, then patches:
 *   - ios/Tirak/Info.plist                  (CFBundleShortVersionString only)
 *   - ios/Tirak.xcodeproj/project.pbxproj   (MARKETING_VERSION only)
 *   - ios/Tirak/Supporting/Expo.plist       (EXUpdatesRuntimeVersion)
 *   - android/app/build.gradle              (versionName only)
 *   - android/app/src/main/res/values/strings.xml (expo_runtime_version)
 *
 * Build numbers remain owned by remote EAS auto-increment. Missing required QA
 * target files fail loudly.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CORE_QA_API_URL = 'https://tirak-core-qa-20261005.tirak-court.workers.dev/api';
const QA_VERSION = '1.5.3';
const QA_RUNTIME = '1.5.3-core-qa';

function run(rootOverride) {
  const envName = (process.env.EXPO_PUBLIC_ENV_NAME || '').trim().toLowerCase();
  if (envName !== 'core-qa') {
    console.log('[core-qa-prebuild] non-QA build — skipping.');
    return;
  }

  const apiUrl = (process.env.EXPO_PUBLIC_API_URL || '').trim();
  if (apiUrl !== CORE_QA_API_URL) {
    throw new Error(
      `[core-qa-prebuild] EXPO_PUBLIC_API_URL must be "${CORE_QA_API_URL}", got "${apiUrl || '(empty)'}"`,
    );
  }

  const demoMode = (process.env.EXPO_PUBLIC_DEMO_MODE || '').trim().toLowerCase();
  if (demoMode === 'true' || demoMode === '1') {
    throw new Error('[core-qa-prebuild] EXPO_PUBLIC_DEMO_MODE must be false or unset');
  }

  const promptPay = (process.env.EXPO_PUBLIC_PROMPTPAY_ENABLED || '').trim().toLowerCase();
  if (promptPay === 'true' || promptPay === '1') {
    throw new Error('[core-qa-prebuild] EXPO_PUBLIC_PROMPTPAY_ENABLED must be false or unset');
  }

  const reviewMode = (process.env.EXPO_PUBLIC_REVIEW_MODE || '').trim().toLowerCase();
  if (reviewMode === 'true' || reviewMode === '1') {
    throw new Error('[core-qa-prebuild] EXPO_PUBLIC_REVIEW_MODE must be false or unset');
  }

  const root = rootOverride || ROOT;
  console.log(`[core-qa-prebuild] stamping native files: version=${QA_VERSION} runtime=${QA_RUNTIME}`);

  stampIosInfoPlist(QA_VERSION, root);
  stampIosProject(root);
  stampExpoPlist(QA_RUNTIME, root);
  stampAndroidBuildGradle(QA_VERSION, root);
  stampAndroidStrings(QA_RUNTIME, root);

  console.log('[core-qa-prebuild] done.');
}

function requireFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`[core-qa-prebuild] required file missing: ${path.relative(ROOT, filePath)}`);
  }
}

function stampIosInfoPlist(version, root) {
  const plistPath = path.join(root || ROOT, 'ios', 'Tirak', 'Info.plist');
  requireFile(plistPath);
  let content = fs.readFileSync(plistPath, 'utf8');
  content = replacePlistValue(content, 'CFBundleShortVersionString', version);
  fs.writeFileSync(plistPath, content, 'utf8');
}

function stampIosProject(root) {
  const pbxprojPath = path.join(root || ROOT, 'ios', 'Tirak.xcodeproj', 'project.pbxproj');
  requireFile(pbxprojPath);
  let content = fs.readFileSync(pbxprojPath, 'utf8');
  if (!/MARKETING_VERSION = [^;]+;/m.test(content)) {
    throw new Error('[core-qa-prebuild] MARKETING_VERSION missing from ios/Tirak.xcodeproj/project.pbxproj');
  }
  content = content.replace(/MARKETING_VERSION = [^;]+;/g, `MARKETING_VERSION = ${QA_VERSION};`);
  fs.writeFileSync(pbxprojPath, content, 'utf8');
}

function stampExpoPlist(runtimeVersion, root) {
  const plistPath = path.join(root || ROOT, 'ios', 'Tirak', 'Supporting', 'Expo.plist');
  requireFile(plistPath);
  let content = fs.readFileSync(plistPath, 'utf8');
  content = replacePlistValue(content, 'EXUpdatesRuntimeVersion', runtimeVersion);
  fs.writeFileSync(plistPath, content, 'utf8');
}

function stampAndroidBuildGradle(version, root) {
  const gradlePath = path.join(root || ROOT, 'android', 'app', 'build.gradle');
  requireFile(gradlePath);
  let content = fs.readFileSync(gradlePath, 'utf8');
  if (!/versionName\s+"[^"]*"/m.test(content)) {
    throw new Error('[core-qa-prebuild] versionName missing from android/app/build.gradle');
  }
  content = content.replace(/versionName\s+"[^"]*"/, `versionName "${version}"`);
  fs.writeFileSync(gradlePath, content, 'utf8');
}

function stampAndroidStrings(runtimeVersion, root) {
  const stringsPath = path.join(root || ROOT, 'android', 'app', 'src', 'main', 'res', 'values', 'strings.xml');
  requireFile(stringsPath);
  let content = fs.readFileSync(stringsPath, 'utf8');
  if (!/<string name="expo_runtime_version">[^<]*<\/string>/m.test(content)) {
    throw new Error('[core-qa-prebuild] expo_runtime_version missing from android/app/src/main/res/values/strings.xml');
  }
  content = content.replace(
    /<string name="expo_runtime_version">[^<]*<\/string>/,
    `<string name="expo_runtime_version">${runtimeVersion}</string>`,
  );
  fs.writeFileSync(stringsPath, content, 'utf8');
}

function replacePlistValue(xml, key, value) {
  const pattern = new RegExp(`(<key>${escapeRegex(key)}</key>\\s*<string>)[^<]*(</string>)`);
  if (!pattern.test(xml)) {
    throw new Error(`[core-qa-prebuild] plist key "${key}" missing`);
  }
  return xml.replace(pattern, `$1${value}$2`);
}

function versionToCode(version) {
  return version
    .split('.')
    .map(Number)
    .reduce((code, part, i) => code + part * Math.pow(100, 2 - i), 0);
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = {
  run,
  stampIosInfoPlist,
  stampIosProject,
  stampExpoPlist,
  stampAndroidBuildGradle,
  stampAndroidStrings,
  versionToCode,
  replacePlistValue,
};

if (require.main === module) {
  run();
}
