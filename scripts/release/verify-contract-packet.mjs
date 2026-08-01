import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveBackendRoot } from './resolve-backend-root.mjs';

const mobileRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const backendRoot = resolveBackendRoot(mobileRoot);
const manifestPath = 'docs/contracts/tirak-payments-v1/contract-manifest.json';
const evidencePath = 'docs/execution/phase-1/t-009-t-016-contract-evidence.md';
const crosswalkPath = 'docs/contracts/tirak-payments-v1/blocker-ingestion-crosswalk.md';
const manifest = JSON.parse(readFileSync(resolve(mobileRoot, manifestPath), 'utf8'));

const roots = { mobile: mobileRoot, backend: backendRoot };

function git(repository, args) {
  return execFileSync('git', args, {
    cwd: roots[repository],
    encoding: 'buffer',
    maxBuffer: 100 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function gitText(repository, args) {
  return git(repository, args).toString('utf8').trim();
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) throw new Error(`${label}: expected ${expected}, received ${actual}`);
}

function assertAncestor(repository, commit) {
  try {
    git(repository, ['merge-base', '--is-ancestor', commit, 'HEAD']);
  } catch {
    throw new Error(`${repository} contract commit ${commit} is not an ancestor of HEAD`);
  }
}

function verifyRepository(repository) {
  const expected = manifest.repositories[repository];
  assertEqual(gitText(repository, ['rev-parse', `${expected.commit}^{tree}`]), expected.tree, `${repository} contract tree`);
  assertEqual(gitText(repository, ['rev-parse', `${expected.commit}^`]), expected.parent, `${repository} contract parent`);
  assertEqual(
    sha256(git(repository, ['diff', '--binary', expected.parent, expected.commit])),
    expected.binaryDiffSha256,
    `${repository} contract diff`,
  );
  assertAncestor(repository, expected.commit);
}

function verifyArtifacts() {
  for (const artifact of manifest.artifacts) {
    const commit = manifest.repositories[artifact.repository].commit;
    const content = git(artifact.repository, ['show', `${commit}:${artifact.path}`]);
    assertEqual(sha256(content), artifact.sha256, `${artifact.repository}:${artifact.path}`);
  }
}

function verifyPacketShape() {
  assertEqual(manifest.contractVersion, 'tirak-payments-v1', 'contract version');
  assertEqual(String(manifest.artifacts.length), '15', 'artifact count');
  assertEqual(manifest.status, 'APPROVED_HUMAN_T016', 'T-016 status');
  assertEqual(manifest.approval?.task, 'T-016', 'T-016 approval task');
  assertEqual(manifest.approval?.receivedAt, '2026-07-20T13:03:25Z', 'T-016 approval timestamp');
  if (!manifest.approval?.statement.includes('I accept tirak-payments-v1')) {
    throw new Error('T-016 approval statement is missing');
  }
  assertEqual(
    manifest.authorizedBoundary,
    'local T-017 through T-023 only; no fanout, GitHub publication, staging, or deployment',
    'T-016 authorized boundary',
  );

  const evidence = readFileSync(resolve(mobileRoot, evidencePath), 'utf8');
  for (let task = 9; task <= 16; task += 1) {
    const identifier = `T-${String(task).padStart(3, '0')}`;
    if (!evidence.includes(`| ${identifier} |`)) throw new Error(`missing ${identifier} evidence row`);
  }
  if (!evidence.includes('Human owner: accepts') || !evidence.includes('- [x] Human owner')) {
    throw new Error('T-016 human approval is not visibly recorded');
  }
  if (!evidence.includes('This does not authorize fanout, GitHub publication, staging, or deployment.')) {
    throw new Error('T-016 approval boundary is not visibly recorded');
  }

  const crosswalk = readFileSync(resolve(mobileRoot, crosswalkPath), 'utf8');
  const rows = crosswalk.split('\n').filter((line) => line.startsWith('| ') && !line.includes('---') && !line.startsWith('| Root blocker'));
  assertEqual(String(rows.length), '8', 'blocker crosswalk row count');
  if (!crosswalk.includes('zero unknown enforcement locations')) {
    throw new Error('crosswalk does not declare zero unknown enforcement locations');
  }
}

try {
  verifyRepository('mobile');
  verifyRepository('backend');
  verifyArtifacts();
  verifyPacketShape();
  console.log(JSON.stringify({
    status: 'PASS',
    contractVersion: manifest.contractVersion,
    mobileCommit: manifest.repositories.mobile.commit,
    backendCommit: manifest.repositories.backend.commit,
    artifacts: manifest.artifacts.length,
    blockerControls: 8,
    backendValidation: manifest.validation.backendTests,
    mobileValidation: manifest.validation.mobileTests,
    humanT016Approval: 'APPROVED',
    authorizedBoundary: manifest.authorizedBoundary,
  }, null, 2));
} catch (error) {
  console.error(`T-016 contract packet verification: FAIL\n${error.message}`);
  process.exitCode = 1;
}
