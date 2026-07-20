import { execFileSync, spawnSync } from 'node:child_process';
import { chmodSync, copyFileSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const publisher = resolve(root, 'scripts/release/publish-phase1-github.mjs');
const repository = 'Sheshiyer/tirak-mobile-app-v2';
const confirmation = 'T-024_APPROVED_GITHUB_PUBLICATION';
const sourceMap = resolve(root, 'docs/orchestration/phase-1/github-issue-map.json');
const sourceManifest = resolve(root, 'docs/execution/phase-1/t-024-phase1-readiness-manifest.json');
const sourceApproval = resolve(root, 'docs/execution/phase-1/t-024-human-approval.md');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function invoke(args, env = {}) {
  return spawnSync(process.execPath, [publisher, ...args], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, ...env },
  });
}

function expectFailure(name, args, pattern, env = {}) {
  const result = invoke(args, env);
  assert(result.status !== 0, `${name} unexpectedly succeeded`);
  assert(pattern.test(`${result.stdout}\n${result.stderr}`), `${name} failed for an unexpected reason: ${result.stderr}`);
}

function makeFixture(directory) {
  const map = resolve(directory, 'map.json');
  const manifest = resolve(directory, 'manifest.json');
  const approval = resolve(directory, 'approval.md');
  const plannedMap = JSON.parse(readFileSync(sourceMap, 'utf8'));
  plannedMap.publication = {
    state: 'planned_not_created',
    authorizationGate: plannedMap.publication.authorizationGate,
    githubMutated: false,
  };
  plannedMap.labels = plannedMap.labels.map(({ url: _url, ...label }) => ({ ...label, state: 'planned_not_created' }));
  plannedMap.milestones = plannedMap.milestones.map(({ milestoneNumber: _number, url: _url, ...milestone }) => ({ ...milestone, state: 'planned_not_created' }));
  plannedMap.waveSummaries = plannedMap.waveSummaries.map((wave) => ({ ...wave, state: 'planned_not_created' }));
  plannedMap.issues = plannedMap.issues.map(({ issueUrl: _url, ...issue }) => ({
    ...issue,
    issueNumber: null,
    publishState: 'planned_not_created',
  }));
  writeFileSync(map, JSON.stringify(plannedMap));
  copyFileSync(sourceManifest, manifest);
  copyFileSync(sourceApproval, approval);
  return { map, manifest, approval };
}

const fakeGhSource = String.raw`#!/usr/bin/env node
const fs = require('node:fs');
const args = process.argv.slice(2);
const statePath = process.env.FAKE_GH_STATE;
const logPath = process.env.FAKE_GH_LOG;
const scenario = process.env.FAKE_GH_SCENARIO || 'normal';
fs.appendFileSync(logPath, JSON.stringify(args) + '\n');
if (args[0] === 'auth') { fs.writeFileSync(1, 'authenticated\n'); process.exit(0); }
if (scenario === 'api-failure') { process.stderr.write('simulated API failure\n'); process.exit(42); }
let state = fs.existsSync(statePath) ? JSON.parse(fs.readFileSync(statePath, 'utf8')) : { labels: [], milestones: [], issues: [] };
const endpoint = args.find((value) => value.startsWith('repos/'));
const methodIndex = args.indexOf('--method');
const method = methodIndex === -1 ? 'GET' : args[methodIndex + 1];
const input = args.includes('--input') ? JSON.parse(fs.readFileSync(0, 'utf8')) : null;
function output(value) { fs.writeFileSync(1, JSON.stringify(value)); }
function save(value) { fs.writeFileSync(statePath, JSON.stringify(state)); output(value); }
if (endpoint === 'repos/Sheshiyer/tirak-mobile-app-v2') {
  const full_name = scenario === 'wrong-remote' ? 'Attacker/wrong-repo' : 'Sheshiyer/tirak-mobile-app-v2';
  output({ full_name, archived: false, disabled: false }); process.exit(0);
}
if (endpoint.includes('/labels?')) { output([state.labels]); process.exit(0); }
if (endpoint.includes('/milestones?state=open')) { output([state.milestones.filter((item) => item.state !== 'closed')]); process.exit(0); }
if (endpoint.includes('/milestones?state=closed')) { output([state.milestones.filter((item) => item.state === 'closed')]); process.exit(0); }
if (endpoint.includes('/issues?')) {
  const issues = scenario === 'task-collision'
    ? [{ number: 9001, title: '[T-001] Conflicting title', body: '', labels: [], milestone: null }]
    : state.issues;
  output([issues]); process.exit(0);
}
if (method === 'POST' && endpoint.endsWith('/labels')) {
  const value = { ...input, url: 'https://api.github.test/labels/' + encodeURIComponent(input.name) };
  state.labels.push(value); save(value); process.exit(0);
}
if (method === 'POST' && endpoint.endsWith('/milestones')) {
  const value = { ...input, number: state.milestones.length + 1, state: 'open', html_url: 'https://github.test/milestones/' + (state.milestones.length + 1) };
  state.milestones.push(value); save(value); process.exit(0);
}
if (method === 'POST' && endpoint.endsWith('/issues')) {
  const number = state.issues.length + 1001;
  const milestone = state.milestones.find((item) => item.number === input.milestone) || null;
  const value = { ...input, number, milestone, labels: input.labels.map((name) => ({ name })), html_url: 'https://github.test/issues/' + number };
  state.issues.push(value); save(value); process.exit(0);
}
if (method === 'PATCH' && /\/issues\/\d+$/.test(endpoint)) {
  const number = Number(endpoint.split('/').pop());
  const index = state.issues.findIndex((item) => item.number === number);
  if (index === -1) process.exit(44);
  const milestone = state.milestones.find((item) => item.number === input.milestone) || null;
  state.issues[index] = { ...state.issues[index], ...input, milestone, labels: input.labels.map((name) => ({ name })) };
  save(state.issues[index]); process.exit(0);
}
process.stderr.write('unsupported fake gh call: ' + args.join(' ') + '\n'); process.exit(43);
`;

try {
  const directory = mkdtempSync(resolve(tmpdir(), 'tirak-github-publisher-'));
  const fixture = makeFixture(directory);
  const fakeGh = resolve(directory, 'gh');
  const statePath = resolve(directory, 'state.json');
  const logPath = resolve(directory, 'gh.log');
  writeFileSync(fakeGh, fakeGhSource);
  chmodSync(fakeGh, 0o755);
  writeFileSync(logPath, '');

  const baseArgs = ['--repo', repository, '--map', fixture.map, '--approval-manifest', fixture.manifest, '--approval-record', fixture.approval];
  const dryRun = invoke(baseArgs);
  assert(dryRun.status === 0, `dry-run failed: ${dryRun.stderr}`);
  const dryRunResult = JSON.parse(dryRun.stdout);
  assert(dryRunResult.status === 'DRY_RUN' && dryRunResult.githubMutations === 0 && dryRunResult.issues === 80, 'dry-run summary drift');
  assert(readFileSync(logPath, 'utf8') === '', 'dry-run invoked GitHub unexpectedly');

  const pendingManifest = JSON.parse(readFileSync(fixture.manifest, 'utf8'));
  pendingManifest.status = 'PENDING_HUMAN_T024_APPROVAL';
  writeFileSync(fixture.manifest, JSON.stringify(pendingManifest));
  expectFailure('missing approval', baseArgs, /approval is not recorded/);
  copyFileSync(sourceManifest, fixture.manifest);

  expectFailure('wrong repository', ['--repo', 'attacker/wrong-repo'], /repository identity mismatch/);
  expectFailure('missing execution confirmation', ['--execute', ...baseArgs], /requires --confirm/);

  const partialMap = JSON.parse(readFileSync(fixture.map, 'utf8'));
  partialMap.issues[0].issueNumber = 17;
  writeFileSync(fixture.map, JSON.stringify(partialMap));
  expectFailure('partial map', baseArgs, /ambiguous partial publication state/);
  makeFixture(directory);

  const fakeEnv = { FAKE_GH_STATE: statePath, FAKE_GH_LOG: logPath, FAKE_GH_SCENARIO: 'api-failure' };
  expectFailure('API failure', ['--execute', '--confirm', confirmation, '--gh-bin', fakeGh, ...baseArgs], /simulated API failure/, fakeEnv);

  expectFailure(
    'authenticated repository mismatch',
    ['--execute', '--confirm', confirmation, '--gh-bin', fakeGh, ...baseArgs],
    /authenticated GitHub repository mismatch/,
    { ...fakeEnv, FAKE_GH_SCENARIO: 'wrong-remote' },
  );

  writeFileSync(statePath, JSON.stringify({ labels: [], milestones: [], issues: [] }));
  expectFailure(
    'stable task collision',
    ['--execute', '--confirm', confirmation, '--gh-bin', fakeGh, ...baseArgs],
    /T-001 title collision/,
    { ...fakeEnv, FAKE_GH_SCENARIO: 'task-collision' },
  );
  const collisionLog = readFileSync(logPath, 'utf8').trim().split('\n').map((line) => JSON.parse(line));
  assert(!collisionLog.some((args) => args.includes('POST') || args.includes('PATCH')), 'collision preflight allowed a mutation');

  writeFileSync(logPath, '');
  writeFileSync(statePath, JSON.stringify({ labels: [], milestones: [], issues: [] }));
  const executeArgs = ['--execute', '--confirm', confirmation, '--gh-bin', fakeGh, ...baseArgs];
  const first = invoke(executeArgs, { ...fakeEnv, FAKE_GH_SCENARIO: 'normal' });
  assert(first.status === 0, `fake publication failed: ${first.stderr}`);
  const firstResult = JSON.parse(first.stdout);
  assert(firstResult.counts.labelsCreated === 58, 'expected 58 label creations');
  assert(firstResult.counts.milestonesCreated === 5, 'expected five milestone creations');
  assert(firstResult.counts.issuesCreated === 80, 'expected 80 issue creations');
  const publishedMap = JSON.parse(readFileSync(fixture.map, 'utf8'));
  assert(publishedMap.publication.state === 'published' && publishedMap.issues.every((issue) => Number.isInteger(issue.issueNumber)), 'published map is incomplete');

  const remoteState = JSON.parse(readFileSync(statePath, 'utf8'));
  remoteState.issues[0].labels.push({ name: 'human:triage' });
  writeFileSync(statePath, JSON.stringify(remoteState));
  writeFileSync(logPath, '');
  const second = invoke(executeArgs, { ...fakeEnv, FAKE_GH_SCENARIO: 'normal' });
  assert(second.status === 0, `idempotent rerun failed: ${second.stderr}`);
  const secondResult = JSON.parse(second.stdout);
  assert(secondResult.counts.labelsReused === 58 && secondResult.counts.milestonesReused === 5 && secondResult.counts.issuesReused === 80, 'idempotent rerun did not reuse all objects');
  const secondLog = readFileSync(logPath, 'utf8').trim().split('\n').filter(Boolean).map((line) => JSON.parse(line));
  assert(!secondLog.some((args) => args.includes('POST') || args.includes('PATCH')), 'idempotent rerun performed a mutation');
  const finalRemoteState = JSON.parse(readFileSync(statePath, 'utf8'));
  assert(finalRemoteState.issues[0].labels.some((label) => label.name === 'human:triage'), 'idempotent rerun removed an unrelated human label');

  execFileSync(process.execPath, [publisher, ...baseArgs], { cwd: root, stdio: 'ignore' });
  console.log(JSON.stringify({
    status: 'PASS',
    dryRunGitHubCalls: 0,
    negativeFixtures: 7,
    fakeLabelsCreated: 58,
    fakeMilestonesCreated: 5,
    fakeIssuesCreated: 80,
    idempotentSecondRunMutations: 0,
    realGitHubMutations: 0,
  }, null, 2));
} catch (error) {
  console.error(`Phase 1 GitHub publisher verification: FAIL\n${error.message}`);
  process.exitCode = 1;
}
