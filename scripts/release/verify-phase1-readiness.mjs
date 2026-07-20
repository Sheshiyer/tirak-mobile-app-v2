import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const mobileRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const roots = {
  mobile: mobileRoot,
  backend: resolve(mobileRoot, '../../Backend/tirak-backend-alpha01'),
  wiki: resolve(mobileRoot, '../../tirakwiki/wikiv2-tirakapp'),
};
const manifest = JSON.parse(readFileSync(resolve(mobileRoot, 'docs/execution/phase-1/t-024-phase1-readiness-manifest.json'), 'utf8'));
const full = process.argv.includes('--full');
const approvalStatement = 'I approve the T-024 Phase 1 readiness gate and authorize the planned GitHub issue publication, isolated branches/worktrees, and evidence-gated staging-only Phase 2 work beginning at T-025. This does not authorize production mutation, live Omise charging, App Store submission, or bypassing later human gates.';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function git(repository, args, encoding = 'utf8') {
  return execFileSync('git', args, { cwd: roots[repository], encoding, maxBuffer: 100 * 1024 * 1024 });
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function run(command, args, cwd) {
  execFileSync(command, args, { cwd, stdio: 'inherit', env: process.env, maxBuffer: 100 * 1024 * 1024 });
}

function verifyRepositories() {
  for (const [repository, identity] of Object.entries(manifest.repositories)) {
    assert(git(repository, ['rev-parse', `${identity.commit}^{tree}`]).trim() === identity.tree, `${repository} tree drift`);
    try {
      git(repository, ['merge-base', '--is-ancestor', identity.commit, 'HEAD']);
    } catch {
      throw new Error(`${repository} readiness commit is not an ancestor of HEAD`);
    }
  }
  assert(git('backend', ['status', '--porcelain=v1', '--untracked-files=all']).trim() === '', 'backend repository is not clean');
  assert(git('wiki', ['status', '--porcelain=v1', '--untracked-files=all']).trim() === '', 'wiki repository is not clean');
}

function verifyArtifacts() {
  for (const artifact of manifest.artifacts) {
    const commit = manifest.repositories[artifact.repository].commit;
    const content = git(artifact.repository, ['show', `${commit}:${artifact.path}`], 'buffer');
    assert(sha256(content) === artifact.sha256, `${artifact.repository}:${artifact.path} hash drift`);
  }
}

function verifyUnlaunchedState() {
  const issueMap = JSON.parse(git('mobile', ['show', `${manifest.repositories.mobile.commit}:docs/orchestration/phase-1/github-issue-map.json`]));
  const vcs = JSON.parse(git('mobile', ['show', `${manifest.repositories.mobile.commit}:docs/orchestration/phase-1/branch-worktree-manifest.json`]));
  assert(issueMap.publication.githubMutated === false, 'issue map claims GitHub mutation');
  assert(issueMap.issues.every((issue) => issue.issueNumber === null && issue.publishState === 'planned_not_created'), 'an issue is marked published');
  assert(vcs.worktreesCreated === false && vcs.mappings.every((mapping) => mapping.created === false), 'a worktree is marked created');
  for (const mapping of vcs.mappings) {
    const branch = git(mapping.repository, ['branch', '--list', mapping.branch]).trim();
    assert(branch === '', `planned branch already exists: ${mapping.branch}`);
    assert(!existsSync(mapping.worktree), `planned worktree already exists: ${mapping.worktree}`);
  }
}

function runGates() {
  run('npm', ['run', 'release:verify-baseline'], mobileRoot);
  run('npm', ['run', 'release:verify-contracts'], mobileRoot);
  run('npm', ['run', 'release:verify-phase1-scaffolds'], mobileRoot);
  run('node', ['scripts/release/verify-mobile-release.mjs'], mobileRoot);
  run('node', ['scripts/verify-release-gate.mjs'], roots.backend);
  if (full) {
    run('npm', ['run', 'release:verify-mobile'], mobileRoot);
    run('npm', ['run', 'release:verify-mobile:negative'], mobileRoot);
    run('npm', ['run', 'release:verify'], roots.backend);
  }
}

try {
  assert(['PENDING_HUMAN_T024_APPROVAL', 'APPROVED_HUMAN_T024'].includes(manifest.status), 'T-024 status drift');
  assert(manifest.contractVersion === 'tirak-payments-v1', 'contract version drift');
  const approved = manifest.status === 'APPROVED_HUMAN_T024';
  if (approved) {
    assert(manifest.humanApproval?.taskId === 'T-024', 'T-024 approval task identity drift');
    assert(manifest.humanApproval?.statement === approvalStatement, 'T-024 approval statement drift');
    assert(typeof manifest.humanApproval?.approvedAt === 'string' && manifest.humanApproval.approvedAt.length > 0, 'T-024 approval timestamp missing');
    assert(manifest.humanApproval?.withholds?.includes('production mutation'), 'production exclusion missing');
    assert(manifest.humanApproval?.withholds?.includes('live Omise charging'), 'live Omise exclusion missing');
    assert(manifest.humanApproval?.withholds?.includes('App Store submission'), 'App Store exclusion missing');
    assert(manifest.humanApproval?.withholds?.includes('bypassing later human gates'), 'later-gate exclusion missing');
  } else {
    assert(manifest.humanApproval === null, 'T-024 approval was recorded unexpectedly');
  }
  verifyRepositories();
  verifyArtifacts();
  verifyUnlaunchedState();
  runGates();
  console.log(JSON.stringify({
    status: approved ? 'APPROVED_HUMAN_T024' : 'READY_FOR_HUMAN_T024_APPROVAL',
    repositories: manifest.repositories,
    artifacts: manifest.artifacts.length,
    mode: full ? 'full' : 'standard',
    githubMutations: 0,
    plannedBranchesCreated: 0,
    plannedWorktreesCreated: 0,
    stagingCommandsExecuted: 0,
    deploymentsExecuted: 0,
    humanT024Approval: approved ? 'APPROVED' : 'PENDING',
  }, null, 2));
} catch (error) {
  console.error(`T-024 readiness verification: FAIL\n${error.message}`);
  process.exitCode = 1;
}
