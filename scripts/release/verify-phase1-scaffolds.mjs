import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildArtifacts } from './generate-phase1-scaffolds.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const artifactRoot = resolve(root, 'docs/orchestration/phase-1');
const gitCommonDir = execFileSync('git', ['rev-parse', '--git-common-dir'], { cwd: root, encoding: 'utf8' }).trim();
const primaryMobileRoot = dirname(resolve(root, gitCommonDir));
const tirakRoot = resolve(primaryMobileRoot, '../..');
const repositoryRoots = {
  mobile: root,
  backend: resolve(tirakRoot, 'Backend/tirak-backend-alpha01'),
  wiki: resolve(tirakRoot, 'tirakwiki/wikiv2-tirakapp'),
};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function readJson(name) {
  return JSON.parse(readFileSync(resolve(artifactRoot, name), 'utf8'));
}

function exactIds(entries, property, label) {
  const ids = entries.map((entry) => entry[property]);
  const expected = Array.from({ length: 80 }, (_, index) => `T-${String(index + 1).padStart(3, '0')}`);
  assert(JSON.stringify(ids) === JSON.stringify(expected), `${label} does not map T-001 through T-080 exactly once`);
}

function stableIssueMapProjection(map) {
  return {
    schemaVersion: map.schemaVersion,
    generatedAt: map.generatedAt,
    source: map.source,
    publication: { authorizationGate: map.publication?.authorizationGate },
    milestones: map.milestones.map(({ state: _state, milestoneNumber: _number, url: _url, ...milestone }) => milestone),
    labels: map.labels.map(({ state: _state, url: _url, ...label }) => label),
    waveSummaries: map.waveSummaries.map(({ state: _state, ...wave }) => wave),
    issues: map.issues.map(({ issueNumber: _number, issueUrl: _url, publishState: _state, ...issue }) => issue),
  };
}

function verifyGeneratedArtifacts() {
  const expected = buildArtifacts();
  for (const [name, artifact] of Object.entries(expected)) {
    const actual = readJson(name);
    if (name === 'github-issue-map.json') {
      assert(
        JSON.stringify(stableIssueMapProjection(actual)) === JSON.stringify(stableIssueMapProjection(artifact)),
        `${name} operational projection drifted from the plan-derived generator`,
      );
    } else if (name === 'branch-worktree-manifest.json') {
      const normalized = structuredClone(actual);
      normalized.worktreesCreated = false;
      for (const mapping of normalized.mappings) mapping.created = false;
      assert(JSON.stringify(normalized) === JSON.stringify(artifact), `${name} structural fields drifted from the plan-derived generator`);
    } else {
      assert(JSON.stringify(actual) === JSON.stringify(artifact), `${name} drifted from the plan-derived generator`);
    }
  }
  return Object.fromEntries(Object.keys(expected).map((name) => [name, readJson(name)]));
}

function verifyIssueMap(map) {
  exactIds(map.issues, 'id', 'issue map');
  assert(map.publication.authorizationGate === 'T-024 human approval', 'issue map lost T-024 gate');
  assert(map.milestones.length === 5, 'issue map must contain five phase milestones');
  assert(map.waveSummaries.length === 13, 'issue map must contain thirteen wave summaries');
  if (map.publication.state === 'planned_not_created') {
    assert(map.publication.githubMutated === false, 'planned issue map claims GitHub mutation');
    assert(map.issues.every((issue) => issue.issueNumber === null && issue.publishState === 'planned_not_created'), 'planned issue map contains publication residue');
  } else {
    assert(map.publication.state === 'published', 'issue map publication state is unsupported');
    assert(map.publication.githubMutated === true, 'published issue map does not record GitHub mutation');
    assert(map.publication.repository === 'Sheshiyer/tirak-mobile-app-v2', 'published issue map repository identity drift');
    assert(map.labels.every((label) => label.state === 'published'), 'published issue map contains an unpublished label');
    assert(map.milestones.every((milestone) => milestone.state === 'published' && Number.isInteger(milestone.milestoneNumber)), 'published issue map contains an incomplete milestone');
    assert(map.waveSummaries.every((wave) => wave.state === 'published'), 'published issue map contains an unpublished wave');
    assert(map.issues.every((issue) => Number.isInteger(issue.issueNumber) && issue.publishState === 'published'), 'published issue map contains an incomplete issue');
    assert(new Set(map.issues.map((issue) => issue.issueNumber)).size === 80, 'published issue map contains duplicate issue numbers');
  }
  for (const issue of map.issues) {
    assert(issue.labels.length >= 7, `${issue.id} has incomplete labels`);
    assert(issue.body.deliverable && issue.body.acceptance && issue.body.validation, `${issue.id} has an incomplete body`);
  }
}

function verifyVcs(manifest) {
  exactIds(manifest.mappings, 'taskId', 'VCS manifest');
  assert(manifest.authorizationGate === 'T-024 human approval', 'VCS manifest lost T-024 gate');
  const branches = manifest.mappings.map((entry) => entry.branch);
  const worktrees = manifest.mappings.map((entry) => entry.worktree);
  assert(new Set(branches).size === 80, 'branch collision detected');
  assert(new Set(worktrees).size === 80, 'worktree path collision detected');
  const approval = JSON.parse(readFileSync(resolve(root, 'docs/execution/phase-1/t-024-phase1-readiness-manifest.json'), 'utf8'));
  const created = manifest.mappings.filter((entry) => entry.created);
  assert(manifest.worktreesCreated === (created.length > 0), 'VCS manifest worktree aggregate state is inconsistent');
  if (created.length > 0) assert(approval.status === 'APPROVED_HUMAN_T024', 'a task was created without T-024 approval');
  for (const entry of created) {
    assert(existsSync(entry.worktree), `${entry.taskId} declared worktree does not exist`);
    const branch = execFileSync('git', ['branch', '--list', entry.branch], {
      cwd: repositoryRoots[entry.repository],
      encoding: 'utf8',
    }).trim();
    assert(branch.length > 0, `${entry.taskId} declared branch does not exist`);
  }
  return created.length;
}

function verifyLocks(ledger) {
  const zoneIds = new Set(ledger.zones.map((zone) => zone.id));
  const taskIds = new Set(ledger.assignments.map((entry) => entry.taskId));
  assert(taskIds.size === 80, 'lock ledger does not assign every task');
  const seen = new Set();
  for (const entry of ledger.assignments) {
    assert(zoneIds.has(entry.zoneId), `${entry.taskId} references unknown lock zone ${entry.zoneId}`);
    const key = `${entry.zoneId}:${entry.wave}:${entry.sequence}`;
    assert(!seen.has(key), `parallel owner collision at ${key}`);
    seen.add(key);
    assert(entry.owner && entry.activationRule, `${entry.taskId} lock handoff is incomplete`);
  }
}

function verifyEvidence(matrix) {
  exactIds(matrix.tasks, 'taskId', 'evidence matrix');
  assert(matrix.waves.length === 13, 'evidence matrix must cover thirteen waves');
  for (const task of matrix.tasks) {
    assert(task.requiredEvidence.length >= 2, `${task.taskId} has insufficient evidence types`);
    assert(task.trustedProducers.length >= 1, `${task.taskId} has no trusted producer`);
    assert(task.acceptanceProbe.length > 0, `${task.taskId} has no acceptance probe`);
  }
}

function verifyWorkerPackets() {
  const required = [
    'README.md',
    'shared-contract.md',
    'executor-template.md',
    'validator-template.md',
    'forbidden-fixes.md',
    'handoff-template.md',
  ];
  const content = required.map((name) => readFileSync(resolve(artifactRoot, 'worker-packets', name), 'utf8')).join('\n');
  const requirements = [
    'tirak-payments-v1',
    'T-024 human approval',
    'raw `004` replay',
    'destructive `009`',
    'UI-only seed hiding',
    'serializer-only refund',
    'outside the owned lock zone',
    'git diff --check',
    'evidence',
    'rollback',
  ];
  for (const requirement of requirements) {
    assert(content.includes(requirement), `worker packets missing required control: ${requirement}`);
  }
}

try {
  const artifacts = verifyGeneratedArtifacts();
  verifyIssueMap(artifacts['github-issue-map.json']);
  const worktreesCreated = verifyVcs(artifacts['branch-worktree-manifest.json']);
  verifyLocks(artifacts['lock-zone-ownership.json']);
  verifyEvidence(artifacts['wave-evidence-matrix.json']);
  verifyWorkerPackets();
  console.log(JSON.stringify({
    status: 'PASS',
    tasks: 80,
    phases: 5,
    waves: 13,
    branches: 80,
    worktreesCreated,
    githubMutations: artifacts['github-issue-map.json'].publication.githubMutated ? 1 : 0,
    githubPublicationState: artifacts['github-issue-map.json'].publication.state,
    lockAssignments: artifacts['lock-zone-ownership.json'].assignments.length,
    evidenceRows: 80,
    workerPacketFiles: 6,
    authorizationGate: 'T-024 human approval',
  }, null, 2));
} catch (error) {
  console.error(`Phase 1 scaffold verification: FAIL\n${error.message}`);
  process.exitCode = 1;
}
