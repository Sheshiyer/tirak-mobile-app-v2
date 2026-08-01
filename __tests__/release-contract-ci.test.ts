import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = path.resolve(__dirname, '..');
const resolverUrl = pathToFileURL(path.join(root, 'scripts/release/resolve-backend-root.mjs')).href;

const runResolver = (mobileRoot: string, configuredRoot: string) => spawnSync(
  process.execPath,
  [
    '--input-type=module',
    '--eval',
    `import { resolveBackendRoot } from ${JSON.stringify(resolverUrl)}; process.stdout.write(resolveBackendRoot(${JSON.stringify(mobileRoot)}, ${JSON.stringify(configuredRoot)}));`,
  ],
  { encoding: 'utf8' },
);

describe('release contract CI repository resolution', () => {
  test('honors the explicit backend checkout path', () => {
    const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tirak-contract-root-'));
    const backendRoot = path.join(fixtureRoot, 'backend');
    fs.mkdirSync(backendRoot);

    try {
      const result = runResolver(root, backendRoot);

      expect(result.status).toBe(0);
      expect(result.stdout).toBe(path.resolve(backendRoot));
    } finally {
      fs.rmSync(fixtureRoot, { recursive: true, force: true });
    }
  });

  test('fails closed with an actionable error for a missing explicit checkout', () => {
    const missingRoot = path.join(os.tmpdir(), 'tirak-contract-root-does-not-exist');
    const result = runResolver(root, missingRoot);

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('backend repository root not found');
    expect(result.stderr).toContain('TIRAK_BACKEND_ROOT');
  });

  test('checks out the public backend repository for the contract gate', () => {
    const workflow = fs.readFileSync(path.join(root, '.github/workflows/release-gate.yml'), 'utf8');

    expect(workflow).toContain('repository: Sheshiyer/tirak-backend-alpha01');
    expect(workflow).toContain('path: .ci/tirak-backend-alpha01');
    expect(workflow).toMatch(/TIRAK_BACKEND_ROOT:\s+\$\{\{\s*github\.workspace\s*\}\}\/\.ci\/tirak-backend-alpha01/u);
    expect(workflow).toContain('npm run release:verify-phase1-scaffolds -- --structural-only');
    expect(workflow).toContain("CI: 'true'");
  });

  test('can verify scaffold structure without machine-local historical worktrees', () => {
    const result = spawnSync(
      process.execPath,
      ['scripts/release/verify-phase1-scaffolds.mjs', '--structural-only'],
      { cwd: root, encoding: 'utf8', env: { ...process.env, CI: 'true' } },
    );

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('"liveWorktreesVerified": false');
  });

  test('rejects structural-only mode outside CI', () => {
    const result = spawnSync(
      process.execPath,
      ['scripts/release/verify-phase1-scaffolds.mjs', '--structural-only'],
      { cwd: root, encoding: 'utf8', env: { ...process.env, CI: 'false' } },
    );

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('--structural-only requires CI=true');
  });

  test('excludes tests from repositories checked out under .ci', () => {
    const fixtureRoot = path.join(root, '.ci', 'tirak-jest-foreign-fixture');
    const fixtureTest = path.join(fixtureRoot, 'tests', 'foreign.test.ts');
    fs.mkdirSync(path.dirname(fixtureTest), { recursive: true });
    fs.writeFileSync(fixtureTest, "test('foreign suite', () => undefined);\n");

    try {
      const result = spawnSync(
        process.execPath,
        [path.join(root, 'node_modules/jest/bin/jest.js'), '--listTests', '--runInBand'],
        { cwd: root, encoding: 'utf8' },
      );

      expect(result.status).toBe(0);
      expect(result.stdout).not.toContain(fixtureTest);
    } finally {
      fs.rmSync(fixtureRoot, { recursive: true, force: true });
    }
  });
});
