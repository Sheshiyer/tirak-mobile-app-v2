import { execFileSync } from 'node:child_process';
import { readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildArtifacts } from './generate-phase1-scaffolds.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const expectedRepository = 'Sheshiyer/tirak-mobile-app-v2';
const requiredConfirmation = 'T-024_APPROVED_GITHUB_PUBLICATION';
const approvalStatement = 'I approve the T-024 Phase 1 readiness gate and authorize the planned GitHub issue publication, isolated branches/worktrees, and evidence-gated staging-only Phase 2 work beginning at T-025. This does not authorize production mutation, live Omise charging, App Store submission, or bypassing later human gates.';
const defaultMapPath = resolve(root, 'docs/orchestration/phase-1/github-issue-map.json');
const defaultManifestPath = resolve(root, 'docs/execution/phase-1/t-024-phase1-readiness-manifest.json');
const defaultApprovalPath = resolve(root, 'docs/execution/phase-1/t-024-human-approval.md');

function fail(message) {
  throw new Error(message);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function parseArguments(argv) {
  const args = {
    execute: false,
    repo: null,
    confirm: null,
    ghBin: 'gh',
    mapPath: defaultMapPath,
    manifestPath: defaultManifestPath,
    approvalPath: defaultApprovalPath,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === '--execute') args.execute = true;
    else if (token === '--repo') args.repo = argv[++index];
    else if (token === '--confirm') args.confirm = argv[++index];
    else if (token === '--gh-bin') args.ghBin = argv[++index];
    else if (token === '--map') args.mapPath = resolve(argv[++index]);
    else if (token === '--approval-manifest') args.manifestPath = resolve(argv[++index]);
    else if (token === '--approval-record') args.approvalPath = resolve(argv[++index]);
    else fail(`unknown argument: ${token}`);
  }

  assert(args.repo, '--repo OWNER/REPO is required even for dry-run');
  assert(args.repo === expectedRepository, `repository identity mismatch: expected ${expectedRepository}`);
  if (args.execute) {
    assert(args.confirm === requiredConfirmation, `--execute requires --confirm ${requiredConfirmation}`);
  } else {
    assert(args.confirm === null, '--confirm is invalid without --execute');
  }
  return args;
}

function readJson(path, label) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    fail(`${label} is unreadable or invalid JSON: ${error.message}`);
  }
}

function verifyApproval(manifestPath, approvalPath) {
  const manifest = readJson(manifestPath, 'T-024 approval manifest');
  const record = readFileSync(approvalPath, 'utf8');
  assert(manifest.status === 'APPROVED_HUMAN_T024', 'T-024 approval is not recorded');
  assert(manifest.humanApproval?.taskId === 'T-024', 'T-024 approval task identity drift');
  assert(manifest.humanApproval?.statement === approvalStatement, 'T-024 approval statement drift');
  assert(record.includes(`> ${approvalStatement}`), 'T-024 approval record does not contain the exact statement');
  for (const authority of [
    'planned GitHub issue publication',
    'isolated branches and worktrees',
    'evidence-gated staging-only Phase 2 work beginning at T-025',
  ]) {
    assert(manifest.humanApproval.authorizes?.includes(authority), `T-024 approval is missing authority: ${authority}`);
  }
  for (const withheld of [
    'production mutation',
    'live Omise charging',
    'App Store submission',
    'bypassing later human gates',
  ]) {
    assert(manifest.humanApproval.withholds?.includes(withheld), `T-024 approval lost exclusion: ${withheld}`);
  }
}

function stableProjection(map) {
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

function verifyMap(map) {
  const expected = buildArtifacts()['github-issue-map.json'];
  assert(JSON.stringify(stableProjection(map)) === JSON.stringify(stableProjection(expected)), 'GitHub issue map drifted from the frozen Phase 1 plan');
  assert(map.publication?.authorizationGate === 'T-024 human approval', 'GitHub issue map lost the T-024 gate');
  assert(map.milestones.length === 5, 'GitHub issue map must contain five milestones');
  assert(map.labels.length > 0, 'GitHub issue map contains no labels');
  assert(map.issues.length === 80, 'GitHub issue map must contain 80 issues');

  const states = new Set(map.issues.map((issue) => issue.publishState));
  const numbers = map.issues.filter((issue) => Number.isInteger(issue.issueNumber)).length;
  if (map.publication.state === 'planned_not_created') {
    assert(map.publication.githubMutated === false, 'planned map claims a GitHub mutation');
    assert(states.size === 1 && states.has('planned_not_created') && numbers === 0, 'planned map contains ambiguous partial publication state');
    assert(map.issues.every((issue) => issue.issueUrl === undefined), 'planned map contains an issue URL');
    assert(map.labels.every((label) => label.state === 'planned_not_created' && label.url === undefined), 'planned map contains ambiguous label publication state');
    assert(map.milestones.every((milestone) => milestone.state === 'planned_not_created' && milestone.milestoneNumber === undefined && milestone.url === undefined), 'planned map contains ambiguous milestone publication state');
    assert(map.waveSummaries.every((wave) => wave.state === 'planned_not_created'), 'planned map contains ambiguous wave publication state');
  } else if (map.publication.state === 'published') {
    assert(map.publication.githubMutated === true, 'published map does not record GitHub mutation');
    assert(map.publication.repository === expectedRepository, 'published map repository identity drift');
    assert(states.size === 1 && states.has('published') && numbers === 80, 'published map is incomplete or ambiguous');
    assert(new Set(map.issues.map((issue) => issue.issueNumber)).size === 80, 'published map contains duplicate issue numbers');
    assert(map.issues.every((issue) => typeof issue.issueUrl === 'string' && issue.issueUrl.length > 0), 'published map contains a missing issue URL');
    assert(map.labels.every((label) => label.state === 'published' && typeof label.url === 'string' && label.url.length > 0), 'published map contains an incomplete label');
    assert(map.milestones.every((milestone) => milestone.state === 'published' && Number.isInteger(milestone.milestoneNumber) && typeof milestone.url === 'string' && milestone.url.length > 0), 'published map contains an incomplete milestone');
    assert(map.waveSummaries.every((wave) => wave.state === 'published'), 'published map contains an unpublished wave');
    assert(typeof map.publication.publishedAt === 'string' && map.publication.publishedAt.length > 0, 'published map timestamp is missing');
    assert(map.publication.counts?.labels === map.labels.length, 'published map label count drift');
    assert(map.publication.counts?.milestones === map.milestones.length, 'published map milestone count drift');
    assert(map.publication.counts?.issues === map.issues.length, 'published map issue count drift');
  } else {
    fail(`unsupported publication state: ${map.publication.state}`);
  }
}

function run(command, args, options = {}) {
  try {
    return execFileSync(command, args, {
      cwd: root,
      encoding: 'utf8',
      input: options.input,
      env: process.env,
      maxBuffer: 100 * 1024 * 1024,
      stdio: options.input === undefined ? ['ignore', 'pipe', 'pipe'] : ['pipe', 'pipe', 'pipe'],
    }).trim();
  } catch (error) {
    const stderr = error.stderr?.toString().trim();
    fail(`${command} ${args.join(' ')} failed${stderr ? `: ${stderr}` : ''}`);
  }
}

function gh(args, ghBin, input) {
  const output = run(ghBin, args, { input });
  if (!output) return null;
  try {
    return JSON.parse(output);
  } catch (error) {
    fail(`GitHub API returned invalid JSON for ${args.join(' ')}: ${error.message}`);
  }
}

function ghApi(ghBin, method, endpoint, body) {
  const args = ['api'];
  if (method !== 'GET') args.push('--method', method);
  args.push(endpoint);
  if (body !== undefined) args.push('--input', '-');
  return gh(args, ghBin, body === undefined ? undefined : JSON.stringify(body));
}

function ghPages(ghBin, endpoint) {
  const pages = gh(['api', '--paginate', '--slurp', endpoint], ghBin);
  assert(Array.isArray(pages) && pages.every(Array.isArray), `GitHub pagination shape is ambiguous for ${endpoint}`);
  return pages.flat();
}

function verifyRemoteIdentity(ghBin, repository) {
  run(ghBin, ['auth', 'status', '--hostname', 'github.com']);
  const remoteUrl = run('git', ['remote', 'get-url', 'origin']);
  const allowedRemotes = new Set([
    `https://github.com/${repository}.git`,
    `https://github.com/${repository}`,
    `git@github.com:${repository}.git`,
    `ssh://git@github.com/${repository}.git`,
  ]);
  assert(allowedRemotes.has(remoteUrl), `origin remote identity mismatch: ${remoteUrl}`);
  const remote = ghApi(ghBin, 'GET', `repos/${repository}`);
  assert(remote?.full_name === repository, `authenticated GitHub repository mismatch: ${remote?.full_name ?? 'missing'}`);
  assert(remote?.archived !== true && remote?.disabled !== true, 'target GitHub repository is archived or disabled');
}

function indexUnique(entries, keyOf, label) {
  const index = new Map();
  for (const entry of entries) {
    const key = keyOf(entry);
    if (!index.has(key)) index.set(key, []);
    index.get(key).push(entry);
  }
  for (const [key, matches] of index) {
    assert(matches.length === 1, `${label} collision for ${key}`);
  }
  return new Map([...index].map(([key, matches]) => [key, matches[0]]));
}

function labelColor(name) {
  if (name.startsWith('area:')) return '1f6feb';
  if (name.startsWith('phase:')) return '8250df';
  if (name.startsWith('wave:')) return '0969da';
  if (name.startsWith('swarm:')) return '5319e7';
  if (name.startsWith('status:')) return 'fbca04';
  if (name.startsWith('vcs:')) return '6f42c1';
  if (name.startsWith('lock:')) return 'd73a4a';
  return '0e8a16';
}

function renderIssueBody(issue) {
  const dependencies = issue.dependencies.length === 0 ? 'None' : issue.dependencies.join(', ');
  return [
    `<!-- tirak-phase1-task:${issue.id} contract:tirak-payments-v1 -->`,
    `# ${issue.id} — ${issue.title.replace(/^\[T-\d{3}\]\s*/, '')}`,
    '',
    '## Assignment',
    '',
    `- Phase milestone: ${issue.milestone}`,
    `- Wave: ${issue.wave}`,
    `- Swarm: ${issue.swarm}`,
    `- Owner: ${issue.owner}`,
    `- Estimate: ${issue.estimatedHours} hours`,
    `- Dependencies: ${dependencies}`,
    '',
    '## Deliverable',
    '',
    issue.body.deliverable,
    '',
    '## Acceptance',
    '',
    issue.body.acceptance,
    '',
    '## Validation',
    '',
    issue.body.validation,
    '',
    '## Authority boundary',
    '',
    'Published under the recorded T-024 human approval. Production mutation, live Omise charging, App Store submission, and bypassing later human gates remain prohibited.',
    '',
  ].join('\n');
}

function loadRemoteState(ghBin, repository) {
  const labels = ghPages(ghBin, `repos/${repository}/labels?per_page=100`);
  const openMilestones = ghPages(ghBin, `repos/${repository}/milestones?state=open&per_page=100`);
  const closedMilestones = ghPages(ghBin, `repos/${repository}/milestones?state=closed&per_page=100`);
  const issues = ghPages(ghBin, `repos/${repository}/issues?state=all&per_page=100`);
  return { labels, milestones: [...openMilestones, ...closedMilestones], issues };
}

function preflightCollisions(map, remote) {
  const exactLabels = indexUnique(remote.labels, (entry) => entry.name, 'label');
  const lowerLabels = indexUnique(remote.labels, (entry) => entry.name.toLowerCase(), 'case-insensitive label');
  for (const label of map.labels) {
    const lower = lowerLabels.get(label.name.toLowerCase());
    assert(!lower || lower.name === label.name, `case-only label collision for ${label.name}`);
  }

  const exactMilestones = indexUnique(remote.milestones, (entry) => entry.title, 'milestone');
  const lowerMilestones = indexUnique(remote.milestones, (entry) => entry.title.toLowerCase(), 'case-insensitive milestone');
  for (const milestone of map.milestones) {
    const lower = lowerMilestones.get(milestone.title.toLowerCase());
    assert(!lower || lower.title === milestone.title, `case-only milestone collision for ${milestone.title}`);
  }

  const taskMatches = new Map(map.issues.map((issue) => [issue.id, []]));
  for (const issue of remote.issues) {
    const match = /^\[(T-\d{3})\]/.exec(issue.title ?? '');
    if (match && taskMatches.has(match[1])) taskMatches.get(match[1]).push(issue);
  }
  for (const issue of map.issues) {
    const matches = taskMatches.get(issue.id);
    assert(matches.length <= 1, `multiple GitHub objects claim stable task ID ${issue.id}`);
    if (matches.length === 1) {
      assert(!matches[0].pull_request, `${issue.id} collides with a pull request`);
      assert(matches[0].title === issue.title, `${issue.id} title collision: ${matches[0].title}`);
    }
  }
  return { exactLabels, exactMilestones, taskMatches };
}

function publish(map, ghBin, repository) {
  const remote = loadRemoteState(ghBin, repository);
  const indexes = preflightCollisions(map, remote);
  const counts = { labelsCreated: 0, labelsReused: 0, milestonesCreated: 0, milestonesReused: 0, issuesCreated: 0, issuesUpdated: 0, issuesReused: 0 };

  const labelResults = new Map();
  for (const planned of map.labels) {
    let label = indexes.exactLabels.get(planned.name);
    if (!label) {
      label = ghApi(ghBin, 'POST', `repos/${repository}/labels`, {
        name: planned.name,
        color: labelColor(planned.name),
        description: `Tirak Omise orchestration: ${planned.name}`,
      });
      assert(label?.name === planned.name, `GitHub created an unexpected label for ${planned.name}`);
      counts.labelsCreated += 1;
    } else counts.labelsReused += 1;
    labelResults.set(planned.name, label);
  }

  const milestoneResults = new Map();
  for (const planned of map.milestones) {
    let milestone = indexes.exactMilestones.get(planned.title);
    if (!milestone) {
      milestone = ghApi(ghBin, 'POST', `repos/${repository}/milestones`, {
        title: planned.title,
        description: `Tirak Omise ${planned.id} execution milestone`,
      });
      assert(Number.isInteger(milestone?.number) && milestone.title === planned.title, `GitHub created an unexpected milestone for ${planned.id}`);
      counts.milestonesCreated += 1;
    } else counts.milestonesReused += 1;
    milestoneResults.set(planned.id, milestone);
  }

  const issueResults = new Map();
  for (const planned of map.issues) {
    const body = renderIssueBody(planned);
    const milestone = milestoneResults.get(planned.milestone);
    assert(Number.isInteger(milestone?.number), `${planned.id} milestone number is missing`);
    const desired = { title: planned.title, body, labels: planned.labels, milestone: milestone.number };
    let issue = indexes.taskMatches.get(planned.id)[0];
    if (!issue) {
      issue = ghApi(ghBin, 'POST', `repos/${repository}/issues`, desired);
      assert(Number.isInteger(issue?.number) && issue.title === planned.title, `GitHub created an unexpected issue for ${planned.id}`);
      counts.issuesCreated += 1;
    } else {
      const existingLabels = (issue.labels ?? []).map((entry) => typeof entry === 'string' ? entry : entry.name);
      const mergedLabels = [...new Set([...existingLabels, ...desired.labels])];
      const matches = issue.title === desired.title
        && issue.body === desired.body
        && desired.labels.every((name) => existingLabels.includes(name))
        && issue.milestone?.number === desired.milestone;
      if (!matches) {
        issue = ghApi(ghBin, 'PATCH', `repos/${repository}/issues/${issue.number}`, { ...desired, labels: mergedLabels });
        assert(Number.isInteger(issue?.number) && issue.title === planned.title, `GitHub updated ${planned.id} ambiguously`);
        counts.issuesUpdated += 1;
      } else counts.issuesReused += 1;
    }
    issueResults.set(planned.id, issue);
  }

  const publishedAt = map.publication.publishedAt ?? new Date().toISOString();
  const result = structuredClone(map);
  result.publication = {
    ...result.publication,
    state: 'published',
    githubMutated: true,
    repository,
    publishedAt,
    counts: { labels: result.labels.length, milestones: result.milestones.length, issues: result.issues.length },
  };
  result.labels = result.labels.map((label) => ({ ...label, state: 'published', url: labelResults.get(label.name).url ?? null }));
  result.milestones = result.milestones.map((milestone) => ({
    ...milestone,
    state: 'published',
    milestoneNumber: milestoneResults.get(milestone.id).number,
    url: milestoneResults.get(milestone.id).html_url ?? null,
  }));
  result.waveSummaries = result.waveSummaries.map((wave) => ({ ...wave, state: 'published' }));
  result.issues = result.issues.map((issue) => ({
    ...issue,
    issueNumber: issueResults.get(issue.id).number,
    issueUrl: issueResults.get(issue.id).html_url ?? null,
    publishState: 'published',
  }));
  verifyMap(result);
  return { result, counts };
}

function atomicWriteJson(path, value) {
  const temporary = `${path}.tmp-${process.pid}`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx' });
  renameSync(temporary, path);
}

function main() {
  const args = parseArguments(process.argv.slice(2));
  verifyApproval(args.manifestPath, args.approvalPath);
  const map = readJson(args.mapPath, 'GitHub issue map');
  verifyMap(map);

  if (!args.execute) {
    console.log(JSON.stringify({
      status: 'DRY_RUN',
      repository: args.repo,
      approval: 'APPROVED_HUMAN_T024',
      mapState: map.publication.state,
      labels: map.labels.length,
      milestones: map.milestones.length,
      issues: map.issues.length,
      githubApiCalls: 0,
      githubMutations: 0,
      executeCommandRequires: `--execute --confirm ${requiredConfirmation}`,
      withheld: ['production mutation', 'live Omise charging', 'App Store submission', 'bypassing later human gates'],
    }, null, 2));
    return;
  }

  verifyRemoteIdentity(args.ghBin, args.repo);
  const { result, counts } = publish(map, args.ghBin, args.repo);
  atomicWriteJson(args.mapPath, result);
  console.log(JSON.stringify({
    status: 'PUBLISHED',
    repository: args.repo,
    counts,
    mapPath: args.mapPath,
    productionMutations: 0,
    liveOmiseCharges: 0,
    appStoreMutations: 0,
  }, null, 2));
}

try {
  main();
} catch (error) {
  console.error(`Phase 1 GitHub publisher: FAIL\n${error.message}`);
  process.exitCode = 1;
}
