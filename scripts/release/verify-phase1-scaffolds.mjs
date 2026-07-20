import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildArtifacts } from './generate-phase1-scaffolds.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const artifactRoot = resolve(root, 'docs/orchestration/phase-1');

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

function verifyGeneratedArtifacts() {
  const expected = buildArtifacts();
  for (const [name, artifact] of Object.entries(expected)) {
    const actual = readJson(name);
    assert(JSON.stringify(actual) === JSON.stringify(artifact), `${name} drifted from the plan-derived generator`);
  }
  return expected;
}

function verifyIssueMap(map) {
  exactIds(map.issues, 'id', 'issue map');
  assert(map.publication.state === 'planned_not_created', 'issue map publication state is unsafe');
  assert(map.publication.githubMutated === false, 'issue map claims GitHub mutation');
  assert(map.publication.authorizationGate === 'T-024 human approval', 'issue map lost T-024 gate');
  assert(map.milestones.length === 5, 'issue map must contain five phase milestones');
  assert(map.waveSummaries.length === 13, 'issue map must contain thirteen wave summaries');
  for (const issue of map.issues) {
    assert(issue.issueNumber === null && issue.publishState === 'planned_not_created', `${issue.id} was marked published`);
    assert(issue.labels.length >= 7, `${issue.id} has incomplete labels`);
    assert(issue.body.deliverable && issue.body.acceptance && issue.body.validation, `${issue.id} has an incomplete body`);
  }
}

function verifyVcs(manifest) {
  exactIds(manifest.mappings, 'taskId', 'VCS manifest');
  assert(manifest.worktreesCreated === false, 'VCS manifest claims worktrees already exist');
  assert(manifest.authorizationGate === 'T-024 human approval', 'VCS manifest lost T-024 gate');
  const branches = manifest.mappings.map((entry) => entry.branch);
  const worktrees = manifest.mappings.map((entry) => entry.worktree);
  assert(new Set(branches).size === 80, 'branch collision detected');
  assert(new Set(worktrees).size === 80, 'worktree path collision detected');
  assert(manifest.mappings.every((entry) => entry.created === false), 'a task was marked as created before T-024');
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
  verifyVcs(artifacts['branch-worktree-manifest.json']);
  verifyLocks(artifacts['lock-zone-ownership.json']);
  verifyEvidence(artifacts['wave-evidence-matrix.json']);
  verifyWorkerPackets();
  console.log(JSON.stringify({
    status: 'PASS',
    tasks: 80,
    phases: 5,
    waves: 13,
    branches: 80,
    worktreesCreated: 0,
    githubMutations: 0,
    lockAssignments: artifacts['lock-zone-ownership.json'].assignments.length,
    evidenceRows: 80,
    workerPacketFiles: 6,
    authorizationGate: 'T-024 human approval',
  }, null, 2));
} catch (error) {
  console.error(`Phase 1 scaffold verification: FAIL\n${error.message}`);
  process.exitCode = 1;
}
