import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const mobileRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const backendRoot = resolve(mobileRoot, '../../Backend/tirak-backend-alpha01');
const wikiRoot = resolve(mobileRoot, '../../tirakwiki/wikiv2-tirakapp');

const repositories = [
  {
    name: 'mobile',
    root: mobileRoot,
    branch: 'codex/tirak-omise/p1-w1.1/mobile-baseline',
    parent: 'd4b8aa4b004b72ade40f53b5fc85e3cbe77cb431',
    baseline: '3c0ecbf4218992857bc4de180311d8d892205436',
    tree: 'd120908234cdaebda2f99e64b0ced6001643a9bc',
    diffSha256: '92ecd5c89afbc48f639273cf7e85f55d8750b714d469b4d825442b26c0a51d5c',
  },
  {
    name: 'backend',
    root: backendRoot,
    branch: 'codex/tirak-omise/p1-w1.1/backend-baseline',
    parent: '9ea989b3e0d53661ab371de8825dd961cc11176d',
    baseline: 'ffadf78200b54d0bc986b5d711184705dc68269c',
    tree: 'a36e48f22f64caaeade9e23735e362b60e51e00a',
    diffSha256: '4dd2c1a10bd33dfd2e68868679229f19abb990e39bc07056b941bd4d60787fd2',
  },
  {
    name: 'wiki',
    root: wikiRoot,
    branch: 'codex/tirak-omise/p1-w1.1/wiki-baseline',
    parent: '1303dc72e466cb710875e35c81bb11c7a4574908',
    baseline: '7b5baee7a7f24f032b12ee6a7bf62a68a97c672e',
    tree: 'a0dbdb57cffc1a929e6c2a013dc24ad32d64192f',
    diffSha256: '9d6e9992c284947147fafe79a9fbc9e7b59c4ba20aad9a28ebbdf87b77402ea1',
  },
];

const evidence = [
  {
    repository: 'mobile',
    path: 'docs/execution/phase-1/t-001-mobile-baseline-inventory.md',
    sha256: '63449f4e387e9954c15689af86afe1e2f0cbb6d360029b4a272457af1d08809b',
  },
  {
    repository: 'mobile',
    path: 'docs/execution/phase-1/t-002-mobile-baseline-evidence.md',
    sha256: 'fc8ed988bf39e8a8bc233f2e73e47d43f68a52efde610f0bfe066f81c6a66224',
  },
  {
    repository: 'backend',
    path: 'docs/execution/phase-1/t-004-backend-baseline-inventory.md',
    sha256: '0d1c73d999094ea55a59baf3e99db8b68c89ce812bba80074cc0b3dea139e934',
  },
  {
    repository: 'backend',
    path: 'docs/execution/phase-1/t-005-backend-baseline-evidence.md',
    sha256: '510be2e2210bea02f2eac62133bdcdc9bde441d1b3c94b0409efb78c6eb527f3',
  },
  {
    repository: 'wiki',
    path: 'tirak-wiki/docs/execution/phase-1/t-007-wiki-baseline-evidence.md',
    sha256: '8fc8bd85d1be6747c59dcc9a98cfad54241bf9c4de9da4f5d382b8678d954320',
  },
  {
    repository: 'mobile',
    path: 'ISA.md',
    sha256: 'cc78f98ba8b65765e52ce6f13193ca289822e56c0c805ad14bdc51aedf1fb962',
  },
  {
    repository: 'mobile',
    path: 'docs/plans/2026-07-18-tirak-omise-production-swarm-plan.md',
    sha256: '90250e2538419b5016b8309e0b906c1e39e5b04288ff64ec7a0a7a2538be1668',
  },
];

const exclusions = [
  ['.agents/skills/integration-expo/.posthog-wizard', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'],
  ['.agents/skills/integration-expo/SKILL.md', 'd1d05ad0ec7b9d55b15e3a534bfbc5f3a201abbb6b21993690b0a2b97f5bfa25'],
  ['.agents/skills/integration-expo/references/EXAMPLE.md', '897a3ec94323ce2f02bfef8945d93c1a4e3eb061f8d2209004b2baf659355cb7'],
  ['.agents/skills/integration-expo/references/basic-integration-1.0-begin.md', '71f51f887bb8f681a4e3a22a9b4727704656ac9e195675a5a7cd49014fd41953'],
  ['.agents/skills/integration-expo/references/basic-integration-1.1-edit.md', '7ea7f812386df46df43c7a56c144a8f864afbec2a019593997712ba0e77b6010'],
  ['.agents/skills/integration-expo/references/basic-integration-1.2-revise.md', 'b14360bf600e3a1c4e85b558410cfbc2430f54745aa12b6059fefb1a33134333'],
  ['.agents/skills/integration-expo/references/basic-integration-1.3-conclude.md', '86efac92c33902c7f42f4064c02ac0a1ecdfa29e2fbb4135b3877910f95a6ce6'],
  ['.agents/skills/integration-expo/references/identify-users.md', '60f0c4fbbccb413de4443090712dca70b4fcb3de816d1800811be0d1342d5915'],
  ['.agents/skills/integration-expo/references/react-native.md', 'c290ddbb8b0fdf083dd63586c37ad43a295ce9f581f11544394ed8294ddd837b'],
  ['.playwright-mcp/console-2026-05-25T14-27-30-915Z.log', 'b37b2506f0b1e380bcd3205df72ddfa161e0f0d117e4dac99e008025eb866493'],
  ['.playwright-mcp/console-2026-05-26T07-30-10-951Z.log', '73cb8739d51975e6fde4edcc2ebc8d816c83ee5f892ee140629a8fe71813ce8d'],
  ['.playwright-mcp/console-2026-05-26T07-45-40-176Z.log', '4ddbdab075832e4fcb486047427e0c795546c84a2e033d487bd5bbba3cd03c40'],
  ['.playwright-mcp/page-2026-05-25T14-27-33-223Z.yml', '8475946f909ba6ad5cc64469fca1ed18cb4d4373f1f2256dcd18847359c6e501'],
  ['.playwright-mcp/page-2026-05-26T07-30-13-497Z.yml', '8475946f909ba6ad5cc64469fca1ed18cb4d4373f1f2256dcd18847359c6e501'],
  ['.playwright-mcp/page-2026-05-26T07-45-41-524Z.yml', '8475946f909ba6ad5cc64469fca1ed18cb4d4373f1f2256dcd18847359c6e501'],
];

const manifest = {
  commit: 'c1a059f5d7c1c2e804deb3ef38c794b09efae47c',
  tree: '294f04d989ac1bfef876ccdab11f6c9fcca64076',
  path: 'docs/execution/phase-1/t-008-cross-repository-baseline-manifest.md',
  sha256: 'bb73332e21f4d45493eae89906b895c5e34654293994cb19979203f882251db7',
  exclusionsSha256: '547a40b8d899108d8ae7f19c749fd63124e9913058a277c2782dd17c613c75b0',
};

const approval = {
  commit: '3a1fa2b05fa25b1559f896df2577b6ea207ef453',
  tree: '319aceb3338fe7c7021e35e57f190939c48eea14',
  manifestSha256: '5b29b001b87789110d351eb213a4d9fee3c7934c12708d8534453c2b893237c3',
};

const gitOptions = (root) => ({
  cwd: root,
  encoding: 'buffer',
  maxBuffer: 100 * 1024 * 1024,
  stdio: ['ignore', 'pipe', 'pipe'],
});

function git(root, args) {
  return execFileSync('git', args, gitOptions(root));
}

function gitText(root, args) {
  return git(root, args).toString('utf8').trim();
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${expected}, received ${actual}`);
  }
}

function assertAncestor(root, ancestor) {
  try {
    git(root, ['merge-base', '--is-ancestor', ancestor, 'HEAD']);
  } catch {
    throw new Error(`${ancestor} is not an ancestor of ${root} HEAD`);
  }
}

function hashGitPath(repository, commit, path) {
  return sha256(git(repository.root, ['show', `${commit}:${path}`]));
}

function verifyRepository(repository) {
  assertEqual(gitText(repository.root, ['branch', '--show-current']), repository.branch, `${repository.name} branch`);
  assertEqual(gitText(repository.root, ['rev-parse', `${repository.baseline}^`]), repository.parent, `${repository.name} parent`);
  assertEqual(gitText(repository.root, ['rev-parse', `${repository.baseline}^{tree}`]), repository.tree, `${repository.name} tree`);
  assertEqual(
    sha256(git(repository.root, ['diff', '--binary', repository.parent, repository.baseline])),
    repository.diffSha256,
    `${repository.name} binary diff`,
  );
  assertAncestor(repository.root, repository.baseline);
}

function verifyEvidence() {
  for (const item of evidence) {
    const repository = repositories.find((candidate) => candidate.name === item.repository);
    assertEqual(hashGitPath(repository, repository.baseline, item.path), item.sha256, `${item.repository}:${item.path}`);
  }
}

function verifyExclusions() {
  const sorted = [...exclusions].sort(([left], [right]) => Buffer.compare(Buffer.from(left), Buffer.from(right)));
  const listing = sorted
    .map(([path, expectedHash]) => {
      const actualHash = sha256(readFileSync(resolve(mobileRoot, path)));
      assertEqual(actualHash, expectedHash, `excluded ${path}`);
      return `${actualHash}  ${path}\n`;
    })
    .join('');
  assertEqual(sha256(listing), manifest.exclusionsSha256, 'exclusion listing');

  const expectedStatus = sorted.map(([path]) => `?? ${path}`);
  const actualStatus = gitText(mobileRoot, ['status', '--porcelain=v1', '--untracked-files=all'])
    .split('\n')
    .filter(Boolean)
    .sort();
  assertEqual(JSON.stringify(actualStatus), JSON.stringify(expectedStatus), 'mobile declared status');
}

function verifyCleanRepository(repository) {
  const status = gitText(repository.root, ['status', '--porcelain=v1', '--untracked-files=all']);
  assertEqual(status, '', `${repository.name} status`);
}

function verifyManifestCommit() {
  assertEqual(gitText(mobileRoot, ['rev-parse', `${manifest.commit}^{tree}`]), manifest.tree, 'manifest tree');
  assertEqual(hashGitPath(repositories[0], manifest.commit, manifest.path), manifest.sha256, 'manifest artifact');
  assertAncestor(mobileRoot, manifest.commit);
}

function verifyApprovalCommit() {
  assertEqual(gitText(mobileRoot, ['rev-parse', `${approval.commit}^{tree}`]), approval.tree, 'approval tree');
  assertEqual(hashGitPath(repositories[0], approval.commit, manifest.path), approval.manifestSha256, 'approved manifest artifact');
  assertAncestor(mobileRoot, approval.commit);
}

function verifyPlanGraph() {
  const planPath = evidence.find((item) => item.path.includes('/plans/'));
  const plan = git(repositories[0].root, ['show', `${repositories[0].baseline}:${planPath.path}`]).toString('utf8');
  const rows = plan
    .split('\n')
    .filter((line) => /^\| T-\d{3} \|/.test(line))
    .map((line) => line.split('|').slice(1, -1).map((cell) => cell.trim()));
  const identifiers = rows.map((row) => row[0]);
  assertEqual(String(rows.length), '80', 'plan task count');
  assertEqual(String(new Set(identifiers).size), '80', 'plan unique task count');
  if (rows.some((row) => row.length !== 12 || row.some((cell) => cell.length === 0))) {
    throw new Error('plan contains a row without twelve populated fields');
  }

  let edges = 0;
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    const dependencies = rows[rowIndex][6] === '—'
      ? []
      : [...rows[rowIndex][6].matchAll(/T-\d{3}/g)].map(([identifier]) => identifier);
    for (const dependency of dependencies) {
      edges += 1;
      const dependencyIndex = identifiers.indexOf(dependency);
      if (dependencyIndex < 0 || dependencyIndex >= rowIndex) {
        throw new Error(`${identifiers[rowIndex]} has invalid dependency ${dependency}`);
      }
    }
  }
  assertEqual(String(edges), '145', 'plan dependency edge count');
}

try {
  repositories.forEach(verifyRepository);
  verifyEvidence();
  verifyManifestCommit();
  verifyApprovalCommit();
  verifyPlanGraph();
  verifyCleanRepository(repositories[1]);
  verifyCleanRepository(repositories[2]);
  verifyExclusions();
  console.log(JSON.stringify({
    status: 'PASS',
    gate: 'T-008 pre-approval recovery baseline',
    repositories: repositories.map(({ name, baseline, tree }) => ({ name, baseline, tree })),
    evidenceFiles: evidence.length,
    exclusions: exclusions.length,
    planTasks: 80,
    dependencyEdges: 145,
    humanApproval: 'APPROVED',
    approvalCommit: approval.commit,
    authorizedBoundary: 'local T-009 through T-023 only',
  }, null, 2));
} catch (error) {
  console.error(`T-008 baseline verification: FAIL\n${error.message}`);
  process.exitCode = 1;
}
