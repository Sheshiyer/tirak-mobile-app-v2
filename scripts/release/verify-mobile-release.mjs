import { createHash } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const hashManifestPath = resolve(root, 'docs/execution/phase-1/mobile-release-hashes.json');
const sourceRoots = ['app', 'components', 'constants', 'locales', 'mocks', 'public', 'services'];
const hashedFiles = [
  'app.json',
  'app.config.js',
  'eas.json',
  'package.json',
  'package-lock.json',
  'constants/api.ts',
  'services/api/payments/payments.ts',
  'utils/booking-contract.ts',
  'utils/booking-state.ts',
  '__tests__/booking-experience-guard.test.ts',
  '__tests__/release-provenance.test.ts',
  'scripts/copy-pwa-assets.mjs',
  'scripts/release/verify-mobile-release.mjs',
];

const prohibitedVisible = /Companion Services|Dining Companion|Paid in cash directly|cash\s+(?:directly\s+)?to\s+(?:your\s+|the\s+)?guide|compensated companionship|adult services|escort service|hookup|Evening Dinner Date|private\.png/iu;
const prohibitedBuiltVisible = /Companion Services|Dining Companion|Paid in cash directly|cash\s+(?:directly\s+)?to\s+(?:your\s+|the\s+)?guide|compensated companionship|adult services|escort service|Evening Dinner Date|private\.png/iu;
const prohibitedRoute = /(?:^|\/)(?:private|dating|dates|escort|adult|hookup|companion)(?:\/|$)/iu;
const fixture = process.argv.includes('--fixture') ? process.argv[process.argv.indexOf('--fixture') + 1] : null;
const full = process.argv.includes('--full');
const writeHashes = process.argv.includes('--write-hashes');
const negativeFixtures = process.argv.includes('--negative-fixtures');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function walk(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = resolve(directory, entry.name);
    if (entry.isDirectory()) return walk(target);
    return entry.isFile() ? [target] : [];
  });
}

function read(path) {
  return readFileSync(resolve(root, path), 'utf8');
}

function scanFiles(files, pattern, label) {
  const violations = files.filter((file) => {
    const extension = file.split('.').pop()?.toLowerCase();
    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'ico', 'pdf'].includes(extension)) return false;
    return pattern.test(readFileSync(file, 'utf8'));
  }).map((file) => relative(root, file));
  assert(violations.length === 0, `${label}: ${violations.join(', ')}`);
}

function verifySourceAndRoutes() {
  const sourceFiles = sourceRoots.flatMap((directory) => walk(resolve(root, directory)));
  scanFiles(sourceFiles, prohibitedVisible, 'prohibited release copy');
  if (fixture === 'prohibited-source') throw new Error('prohibited release copy: app/injected-fixture.ts');

  const routes = walk(resolve(root, 'app'))
    .filter((file) => /\.(?:ts|tsx|js|jsx)$/.test(file))
    .map((file) => relative(resolve(root, 'app'), file).replace(/\.(?:ts|tsx|js|jsx)$/, ''));
  const unsafeRoutes = routes.filter((route) => prohibitedRoute.test(route));
  const clientModulesInsideRouter = routes.filter((route) => route.startsWith('api/'));
  if (fixture === 'retired-route') unsafeRoutes.push('private/[id]');
  assert(unsafeRoutes.length === 0, `retired route exposure: ${unsafeRoutes.join(', ')}`);
  assert(clientModulesInsideRouter.length === 0, `client API modules exposed as routes: ${clientModulesInsideRouter.join(', ')}`);
}

function verifyContracts() {
  const payment = read('services/api/payments/payments.ts');
  const bookingState = read('utils/booking-state.ts');
  const contract = JSON.parse(read('docs/contracts/tirak-payments-v1/contract-manifest.json'));
  assert(payment.includes("!== 'tirak-payments-v1'"), 'mobile payment contract version drift');
  assert(payment.includes('amountSatang') && payment.includes('displayTotalThb'), 'explicit amount units are missing');
  assert(!payment.includes('paymentMethodId') && !payment.includes('cardNumber'), 'legacy payment input returned');
  assert(bookingState.includes('restitution_pending') && !bookingState.includes("'refunded'"), 'restitution state drift');
  assert(contract.status === 'APPROVED_HUMAN_T016', 'T-016 contract is not approved');
  if (fixture === 'contract-drift') throw new Error('mobile payment contract version drift');
}

function verifyExpoConfig() {
  const app = JSON.parse(read('app.json')).expo;
  const eas = JSON.parse(read('eas.json'));
  assert(app.name === 'Tirak', 'Expo app name drift');
  assert(app.slug === 'tirak-guided-experiences', 'Expo slug retains retired marketplace language');
  assert(app.scheme === 'tirak', 'deep-link scheme drift');
  assert(app.ios?.bundleIdentifier === 'com.tirak.pineapple', 'iOS bundle identifier drift');
  assert(app.description.toLowerCase().includes('guided cultural experiences'), 'Expo description lost guided-experience framing');
  assert(!prohibitedVisible.test(JSON.stringify(app)), 'Expo config contains prohibited release copy');

  for (const profile of ['preview', 'production']) {
    const url = eas.build?.[profile]?.env?.EXPO_PUBLIC_API_URL;
    if (url !== undefined) {
      assert(/^https:\/\//.test(url), `${profile} API URL must use HTTPS`);
      assert(profile !== 'production' || !/staging|localhost|127\.0\.0\.1/i.test(url), 'production profile points to a non-production API');
    }
  }
  if (fixture === 'environment-mismatch') throw new Error('production profile points to a non-production API');
}

function verifyDependencies() {
  const pkg = JSON.parse(read('package.json'));
  const lock = JSON.parse(read('package-lock.json'));
  const rootLock = lock.packages?.[''];
  assert(rootLock, 'package-lock root metadata is missing');
  for (const field of ['dependencies', 'devDependencies']) {
    for (const [name, version] of Object.entries(pkg[field] || {})) {
      assert(rootLock[field]?.[name] === version, `package-lock drift for ${field}.${name}`);
    }
  }
  assert(pkg.scripts['copy:pwa'] === 'node scripts/copy-pwa-assets.mjs', 'PWA copy command is not fail closed');
  assert(!/\|\|\s*true/.test(JSON.stringify(pkg.scripts)), 'release scripts contain a fail-open || true');
  if (fixture === 'dependency-drift') throw new Error('package-lock drift for dependencies.expo');
}

function currentHashes() {
  return Object.fromEntries(hashedFiles.map((path) => {
    const absolute = resolve(root, path);
    assert(existsSync(absolute), `hash input missing: ${path}`);
    return [path, sha256(readFileSync(absolute))];
  }));
}

function verifyHashes() {
  assert(existsSync(hashManifestPath), 'mobile release hash manifest is missing');
  const expected = JSON.parse(readFileSync(hashManifestPath, 'utf8'));
  const actual = currentHashes();
  if (fixture === 'artifact-hash-drift') actual['app.json'] = '0'.repeat(64);
  assert(JSON.stringify(actual) === JSON.stringify(expected.files), 'mobile release artifact hash drift');
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: 'utf8',
    stdio: options.capture ? 'pipe' : 'inherit',
    env: { ...process.env, ...options.env },
  });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed with exit ${result.status}${result.stderr ? `: ${result.stderr.trim()}` : ''}`);
  }
  return result.stdout || '';
}

function treeHash(directory) {
  const listing = walk(directory).sort().map((file) => `${sha256(readFileSync(file))}  ${relative(directory, file)}\n`).join('');
  return sha256(listing);
}

function runFullGate() {
  if (fixture === 'test-failure') throw new Error('npm test injected failure');
  run('npm', ['test', '--', '--runInBand']);
  if (fixture === 'type-failure') throw new Error('npx tsc injected failure');
  run('npx', ['tsc', '--noEmit']);
  run('npx', ['expo', 'config', '--type', 'public', '--json'], { capture: true });

  const buildRoot = mkdtempSync(resolve(root, '.release-gate-output-'));
  try {
    run('npx', ['expo', 'export', '--platform', 'web', '--output-dir', buildRoot], {
      env: { EXPO_PUBLIC_API_URL: 'https://release-gate.invalid' },
    });
    run(process.execPath, ['scripts/copy-pwa-assets.mjs'], {
      env: {
        TIRAK_PWA_OUTPUT_DIR: fixture === 'copy-failure'
          ? '.release-gate-output-does-not-exist'
          : relative(root, buildRoot),
      },
    });
    const builtFiles = walk(buildRoot);
    scanFiles(builtFiles, prohibitedBuiltVisible, 'prohibited built output copy');
    const lowercaseHookupFiles = builtFiles.filter((file) => {
      const extension = file.split('.').pop()?.toLowerCase();
      if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'ico', 'pdf'].includes(extension)) return false;
      return readFileSync(file, 'utf8').includes('hookup');
    }).map((file) => relative(root, file));
    assert(lowercaseHookupFiles.length === 0, `prohibited built output copy: ${lowercaseHookupFiles.join(', ')}`);
    if (fixture === 'prohibited-output') throw new Error('prohibited built output copy: injected.js');
    assert(builtFiles.length > 0, 'Expo export produced no files');
    return { builtFiles: builtFiles.length, buildTreeSha256: treeHash(buildRoot) };
  } finally {
    rmSync(buildRoot, { recursive: true, force: true });
  }
}

function writeHashManifest() {
  const manifest = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    purpose: 'T-020 mobile release gate inputs; update only through reviewed release integration.',
    files: currentHashes(),
  };
  writeFileSync(hashManifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Wrote ${relative(root, hashManifestPath)}`);
}

function runNegativeMatrix() {
  const fixtures = [
    'prohibited-source',
    'retired-route',
    'contract-drift',
    'environment-mismatch',
    'dependency-drift',
    'artifact-hash-drift',
    'test-failure',
    'type-failure',
    'prohibited-output',
    'copy-failure',
  ];
  const results = [];
  for (const name of fixtures) {
    const args = [fileURLToPath(import.meta.url), '--fixture', name];
    if (['test-failure', 'type-failure', 'prohibited-output', 'copy-failure'].includes(name)) args.push('--full');
    const result = spawnSync(process.execPath, args, { cwd: root, encoding: 'utf8' });
    assert(result.status !== 0, `negative fixture ${name} did not fail closed`);
    results.push({ fixture: name, status: 'EXPECTED_FAILURE', exit: result.status });
  }
  return results;
}

try {
  if (writeHashes) {
    writeHashManifest();
    process.exit(0);
  }

  verifySourceAndRoutes();
  verifyContracts();
  verifyExpoConfig();
  verifyDependencies();
  verifyHashes();
  const build = full ? runFullGate() : null;
  const negatives = negativeFixtures ? runNegativeMatrix() : null;
  console.log(JSON.stringify({
    status: 'PASS',
    gate: 'T-020 mobile release gate',
    mode: full ? 'full' : 'static',
    sourceRoots,
    hashedFiles: hashedFiles.length,
    build,
    negativeFixtures: negatives,
  }, null, 2));
} catch (error) {
  console.error(`T-020 mobile release verification: FAIL\n${error.message}`);
  process.exitCode = 1;
}
