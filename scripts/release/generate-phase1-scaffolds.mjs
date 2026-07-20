import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const planPath = 'docs/plans/2026-07-18-tirak-omise-production-swarm-plan.md';
const outputRoot = resolve(root, 'docs/orchestration/phase-1');
const generatedAt = '2026-07-20T13:03:25Z';

const phaseNames = {
  P1: 'Phase 1 — Baseline and contract freeze',
  P2: 'Phase 2 — Staging backend, data, and Omise',
  P3: 'Phase 3 — Mobile and reviewer experience',
  P4: 'Phase 4 — Release hardening',
  P5: 'Phase 5 — Production and submission',
};

const zoneDefinitions = {
  'release-orchestration': {
    ownerRole: 'release integrator',
    paths: ['docs/orchestration/**', 'docs/execution/**', 'ISA.md'],
  },
  'mobile-release-config': {
    ownerRole: 'mobile integration owner',
    paths: ['package.json', 'package-lock.json', 'app.json', 'app.config.js', 'eas.json', 'constants/api.ts'],
  },
  'backend-runtime-config': {
    ownerRole: 'backend integration owner',
    paths: ['package.json', 'package-lock.json', 'wrangler.toml', 'src/index.ts', 'scripts/**'],
  },
  'd1-migration-ledger': {
    ownerRole: 'data migration owner',
    paths: ['migrations/**', 'contracts/tirak-payments-v1/target-schema.sql'],
  },
  'payment-shared-contracts': {
    ownerRole: 'payment contract owner',
    paths: ['contracts/tirak-payments-v1/**', 'src/routes/payments.ts', 'services/api/payments/payments.ts', 'utils/booking-state.ts'],
  },
  'wiki-corpus': {
    ownerRole: 'content review owner',
    paths: ['src/content/docs/**', 'src/data/**', 'public/**'],
  },
  'store-assets': {
    ownerRole: 'App Store asset owner',
    paths: ['docs/app-store-*.md', 'App Store Connect metadata', 'review screenshots and notes'],
  },
};

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
}

function parsePlan(plan) {
  return plan
    .split('\n')
    .filter((line) => /^\| T-\d{3} \|/.test(line))
    .map((line) => {
      const cells = line.split('|').slice(1, -1).map((cell) => cell.trim());
      if (cells.length !== 12) throw new Error(`task row has ${cells.length} columns: ${line}`);
      const [id, phaseWaveSwarm, title, area, owner, hours, dependencies, deliverable, acceptance, validation, vcs, lock] = cells;
      const [phase, wave, swarm] = phaseWaveSwarm.split('/').map((value) => value.trim());
      return {
        id,
        phase,
        wave,
        swarm,
        title,
        area,
        owner,
        hours: Number(hours),
        dependencies: dependencies === '—' ? [] : [...dependencies.matchAll(/T-\d{3}/g)].map(([value]) => value),
        deliverable,
        acceptance,
        validation,
        vcs,
        lock: lock === 'yes',
      };
    });
}

function repositoryFor(task) {
  if (task.id === 'T-007' || /wiki|corpus|content-review/i.test(task.swarm)) return 'wiki';
  if (['backend', 'data', 'infra'].includes(task.area)) return 'backend';
  return 'mobile';
}

function zonesFor(task) {
  const zones = new Set();
  const number = Number(task.id.slice(2));
  const repository = repositoryFor(task);

  if (repository === 'wiki') zones.add('wiki-corpus');
  else if (task.area === 'data') zones.add('d1-migration-ledger');
  else if (repository === 'backend') zones.add('backend-runtime-config');
  else if (task.area === 'frontend') zones.add('mobile-release-config');
  else zones.add('release-orchestration');

  if ([9, 10, 14, 33, 34, 35, 37, 38, 39, 41, 42, 43, 46, 47, 61, 63, 64, 65, 75, 76, 79].includes(number)) {
    zones.add('payment-shared-contracts');
  }
  if (number >= 57 && [57, 58, 59, 60, 67, 68, 69, 70, 71, 72, 77, 78, 80].includes(number)) {
    zones.add('store-assets');
  }

  return [...zones].sort();
}

function evidenceTypesFor(task) {
  const text = `${task.deliverable} ${task.acceptance} ${task.validation}`.toLowerCase();
  const types = new Set(['task_artifact', 'command_log']);
  if (/test|typecheck|ci|lint|build/.test(text)) types.add('automated_check');
  if (/schema|sql|d1|migration|row|database/.test(text)) types.add('schema_or_data_output');
  if (/screenshot|video|recording|device|iphone|ipad/.test(text)) types.add('visual_evidence');
  if (/metric|alert|dashboard|telemetry|crash/.test(text)) types.add('metric_or_alert');
  if (/omise|provider|charge|promptpay|webhook/.test(text)) types.add('provider_record');
  if (/approval|human|go\/no-go|signoff/.test(text)) types.add('human_approval');
  if (/rollback|restore|recovery|backup/.test(text)) types.add('rollback_proof');
  return [...types].sort();
}

function producersFor(task) {
  const text = `${task.validation} ${task.deliverable}`.toLowerCase();
  const producers = new Set(['release evidence recorder']);
  const repository = repositoryFor(task);
  if (/test|typecheck|ci|build|lint/.test(text)) producers.add(repository === 'backend' ? 'npm run release:verify' : 'npm run release:verify-mobile');
  if (/git|sha|diff|commit|branch|worktree/.test(text)) producers.add('git read-only inspection');
  if (/schema|sql|d1|migration|row|database/.test(text)) producers.add('Wrangler D1 or disposable SQLite probe');
  if (/omise|provider|charge|promptpay|webhook/.test(text)) producers.add('Omise dashboard/API evidence plus server retrieval');
  if (/screenshot|video|device|iphone|ipad/.test(text)) producers.add('exact-build signed-device capture');
  if (/metric|alert|dashboard|telemetry|crash/.test(text)) producers.add('configured observability platform export');
  if (/app store|review|submission|testflight/.test(text)) producers.add('App Store Connect or TestFlight record');
  if (/approval|human|go\/no-go|signoff/.test(text)) producers.add('human release-owner statement');
  return [...producers].sort();
}

function buildIssueMap(tasks, planSha256) {
  const phases = [...new Set(tasks.map((task) => task.phase))];
  const waves = [...new Set(tasks.map((task) => task.wave))];
  const labels = new Set(['tirak-omise', 'status:planned-not-created']);
  for (const task of tasks) {
    labels.add(`phase:${task.phase.toLowerCase()}`);
    labels.add(`wave:${task.wave.toLowerCase()}`);
    labels.add(`swarm:${task.swarm}`);
    labels.add(`area:${task.area}`);
    labels.add(`vcs:${task.vcs}`);
    if (task.lock) labels.add('lock:exclusive');
  }

  return {
    schemaVersion: 1,
    generatedAt,
    source: { path: planPath, sha256: planSha256 },
    publication: {
      state: 'planned_not_created',
      authorizationGate: 'T-024 human approval',
      githubMutated: false,
    },
    milestones: phases.map((phase) => ({
      id: phase,
      title: phaseNames[phase],
      state: 'planned_not_created',
    })),
    labels: [...labels].sort().map((name) => ({ name, state: 'planned_not_created' })),
    waveSummaries: waves.map((wave) => {
      const waveTasks = tasks.filter((task) => task.wave === wave);
      return {
        id: wave,
        phase: waveTasks[0].phase,
        taskIds: waveTasks.map((task) => task.id),
        taskCount: waveTasks.length,
        estimatedHours: waveTasks.reduce((sum, task) => sum + task.hours, 0),
        state: 'planned_not_created',
      };
    }),
    issues: tasks.map((task) => ({
      id: task.id,
      issueNumber: null,
      title: `[${task.id}] ${task.title}`,
      milestone: task.phase,
      wave: task.wave,
      swarm: task.swarm,
      labels: [
        'tirak-omise',
        'status:planned-not-created',
        `phase:${task.phase.toLowerCase()}`,
        `wave:${task.wave.toLowerCase()}`,
        `swarm:${task.swarm}`,
        `area:${task.area}`,
        `vcs:${task.vcs}`,
        ...(task.lock ? ['lock:exclusive'] : []),
      ],
      dependencies: task.dependencies,
      owner: task.owner,
      estimatedHours: task.hours,
      body: {
        deliverable: task.deliverable,
        acceptance: task.acceptance,
        validation: task.validation,
        authorityBoundary: 'No GitHub mutation before T-024 human approval.',
      },
      publishState: 'planned_not_created',
    })),
  };
}

function buildVcsManifest(tasks, planSha256) {
  return {
    schemaVersion: 1,
    generatedAt,
    source: { path: planPath, sha256: planSha256 },
    authorizationGate: 'T-024 human approval',
    worktreesCreated: false,
    mappings: tasks.map((task) => {
      const repository = repositoryFor(task);
      const slug = slugify(task.title);
      return {
        taskId: task.id,
        repository,
        implementationTask: !['product', 'qa'].includes(task.area) || task.vcs !== 'baseline',
        branch: `codex/tirak-omise/${task.wave.toLowerCase()}/${task.id.toLowerCase()}-${slug}`,
        worktree: `/Volumes/madara/2026/twc-vault/01-Projects/thoughtseed/Tirak/.worktrees/${repository}/${task.id.toLowerCase()}-${slug}`,
        baseGate: task.dependencies.length === 0 ? 'approved repository baseline' : task.dependencies.join(', '),
        mergeGate: `${task.wave} wave close`,
        created: false,
      };
    }),
  };
}

function buildLockLedger(tasks, planSha256) {
  const assignments = [];
  for (const task of tasks) {
    for (const zoneId of zonesFor(task)) {
      assignments.push({
        zoneId,
        taskId: task.id,
        wave: task.wave,
        owner: task.owner,
      });
    }
  }

  for (const zoneId of Object.keys(zoneDefinitions)) {
    const zoneAssignments = assignments.filter((entry) => entry.zoneId === zoneId);
    const waves = [...new Set(zoneAssignments.map((entry) => entry.wave))];
    for (const wave of waves) {
      const serial = zoneAssignments.filter((entry) => entry.wave === wave).sort((a, b) => a.taskId.localeCompare(b.taskId));
      serial.forEach((entry, index) => {
        entry.sequence = index + 1;
        entry.handoffFrom = index === 0 ? null : serial[index - 1].taskId;
        entry.activationRule = index === 0
          ? 'wave prerequisite evidence accepted'
          : `${serial[index - 1].taskId} evidence accepted and ownership released`;
      });
    }
  }

  return {
    schemaVersion: 1,
    generatedAt,
    source: { path: planPath, sha256: planSha256 },
    rule: 'One active owner per lock zone; assignments execute in wave sequence order.',
    zones: Object.entries(zoneDefinitions).map(([id, definition]) => ({ id, ...definition })),
    assignments: assignments.sort((a, b) => a.zoneId.localeCompare(b.zoneId) || a.wave.localeCompare(b.wave) || a.sequence - b.sequence),
  };
}

function buildEvidenceMatrix(tasks, planSha256) {
  const waves = [...new Set(tasks.map((task) => task.wave))];
  return {
    schemaVersion: 1,
    generatedAt,
    source: { path: planPath, sha256: planSha256 },
    trustRule: 'Evidence is accepted only from the named producer against the exact task commit, environment, or archive.',
    tasks: tasks.map((task) => ({
      taskId: task.id,
      phase: task.phase,
      wave: task.wave,
      requiredEvidence: evidenceTypesFor(task),
      trustedProducers: producersFor(task),
      acceptanceProbe: task.validation,
      rollbackEvidenceRequired: /rollback|restore|recovery|backup/i.test(`${task.deliverable} ${task.acceptance} ${task.validation}`),
      humanApprovalRequired: /approval|human|go\/no-go|signoff/i.test(`${task.deliverable} ${task.acceptance} ${task.validation}`),
    })),
    waves: waves.map((wave) => ({
      wave,
      taskIds: tasks.filter((task) => task.wave === wave).map((task) => task.id),
      closeProducer: 'release integrator wave-close verifier plus human approval when declared',
    })),
  };
}

export function buildArtifacts() {
  const plan = readFileSync(resolve(root, planPath), 'utf8');
  const tasks = parsePlan(plan);
  if (tasks.length !== 80) throw new Error(`expected 80 tasks, found ${tasks.length}`);
  const planSha256 = sha256(plan);
  return {
    'github-issue-map.json': buildIssueMap(tasks, planSha256),
    'branch-worktree-manifest.json': buildVcsManifest(tasks, planSha256),
    'lock-zone-ownership.json': buildLockLedger(tasks, planSha256),
    'wave-evidence-matrix.json': buildEvidenceMatrix(tasks, planSha256),
  };
}

function writeArtifacts() {
  mkdirSync(outputRoot, { recursive: true });
  for (const [name, artifact] of Object.entries(buildArtifacts())) {
    const outputPath = resolve(outputRoot, name);
    let next = artifact;
    if (existsSync(outputPath) && ['github-issue-map.json', 'branch-worktree-manifest.json'].includes(name)) {
      const current = JSON.parse(readFileSync(outputPath, 'utf8'));
      const approval = JSON.parse(readFileSync(resolve(root, 'docs/execution/phase-1/t-024-phase1-readiness-manifest.json'), 'utf8'));
      if (name === 'branch-worktree-manifest.json') {
        const currentByTask = new Map(current.mappings.map((entry) => [entry.taskId, entry]));
        next = {
          ...artifact,
          worktreesCreated: current.worktreesCreated,
          mappings: artifact.mappings.map((entry) => ({
            ...entry,
            created: currentByTask.get(entry.taskId)?.created ?? false,
          })),
        };
      } else {
        const currentMilestones = new Map(current.milestones.map((entry) => [entry.id, entry]));
        const currentLabels = new Map(current.labels.map((entry) => [entry.name, entry]));
        const currentWaves = new Map(current.waveSummaries.map((entry) => [entry.id, entry]));
        const currentIssues = new Map(current.issues.map((entry) => [entry.id, entry]));
        next = {
          ...artifact,
          publication: current.publication,
          milestones: artifact.milestones.map((entry) => ({ ...entry, state: currentMilestones.get(entry.id)?.state ?? entry.state })),
          labels: artifact.labels.map((entry) => ({ ...entry, state: currentLabels.get(entry.name)?.state ?? entry.state })),
          waveSummaries: artifact.waveSummaries.map((entry) => ({ ...entry, state: currentWaves.get(entry.id)?.state ?? entry.state })),
          issues: artifact.issues.map((entry) => ({
            ...entry,
            issueNumber: currentIssues.get(entry.id)?.issueNumber ?? null,
            publishState: currentIssues.get(entry.id)?.publishState ?? entry.publishState,
          })),
        };
      }
      const hasOperationalState = name === 'branch-worktree-manifest.json'
        ? next.worktreesCreated || next.mappings.some((entry) => entry.created)
        : next.publication.githubMutated || next.issues.some((entry) => entry.publishState !== 'planned_not_created');
      if (hasOperationalState && approval.status !== 'APPROVED_HUMAN_T024') {
        throw new Error(`${name} has operational state without T-024 approval`);
      }
    }
    writeFileSync(outputPath, `${JSON.stringify(next, null, 2)}\n`);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  writeArtifacts();
}
