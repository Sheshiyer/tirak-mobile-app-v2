# T-061 Mobile Dependency Remediation Evidence

Status: **PARTIAL-RELEASE REMEDIATION PASS — T-061 REMAINS OPEN**

Date: 2026-08-01
Task: T-061 — secret, dependency, and checkout-tracking audit
Authority: owner-signed `payment-park-and-resequencing-record.md` §5.2, which
releases the secret and dependency portions while deferring checkout tracking.

## Execution identity

- Repository: `Sheshiyer/tirak-mobile-app-v2`
- Base commit: `694a8afc6d83fd3456ddab53e864f1b284ad3a1e`
- Branch: `codex/tirak-omise/w4.1/t-061-run-secret-dependency-and-checkout-tracking-audi`
- Worktree: `/Volumes/madara/2026/twc-vault/01-Projects/thoughtseed/Tirak/.worktrees/mobile/t-061-run-secret-dependency-and-checkout-tracking-audi`

## Change

The fresh T-061 registry audit identified Axios `1.16.1` as a direct runtime
high-severity dependency finding. The isolated task worktree updates the
declared and locked dependency to Axios `1.19.0`, the registry's `latest` tag at
execution time. Its transitive `form-data` dependency moves from `4.0.5` to
`4.0.6`.

The release gate intentionally hashes both package files. Its provided reviewed
integration command regenerated only
`docs/execution/phase-1/mobile-release-hashes.json` after the dependency change.

Changed artifact SHA-256 values:

| Artifact | SHA-256 |
|---|---|
| `package.json` | `4a6310d26b55033dc1032231e22727605c7a5912e7b5b90fe554ca62d1fba55f` |
| `package-lock.json` | `1347070db9098c1c38a88607ec0d40132d3f412ca50326dd020f7acecbba982e` |
| `docs/execution/phase-1/mobile-release-hashes.json` | `a01bd4b2c85b033d7f8b4ca1bd122c8a044622db8b524dc49d9d166293e92ede` |

## Verification

| Probe | Result |
|---|---|
| `npm view axios version dist-tags --json` | `latest=1.19.0` |
| `npm audit --omit=dev --json` | Axios absent; `form-data` absent; zero direct high/critical findings |
| `npm ls axios form-data --all` | Axios `1.19.0`; `form-data` `4.0.6` |
| `npx --no-install tsc --noEmit` | PASS |
| `npm test -- --runInBand` | 9/9 suites; 52/52 tests PASS |
| `TIRAK_BACKEND_ROOT=... npm run release:verify-contracts` | PASS; 15 immutable cross-repository contract artifacts checked |
| `env -u TIRAK_BACKEND_ROOT npm run release:verify-contracts` | PASS from the manifest-defined mobile worktree fallback |
| `CI=true npm run release:verify-phase1-scaffolds -- --structural-only` | PASS; all 80 tasks, 13 waves, 114 lock assignments, and T-024 authorization retained |
| `npm run release:verify-mobile` | PASS; 135 built files; local build tree `b6f1677b6a402283249b4ec42bc841a6ec452b9c5cc453ac322f1bf5a7400a3e` |
| `npm run release:verify-mobile:negative` | PASS; all 10 unsafe fixtures fail closed |
| `git diff --check` | PASS |

No payment secret or `.env` content was printed, copied, or changed. The native
OmniRoute launcher reported loading environment-file paths, but exposed no
values. No EAS build, Cloudflare deployment, Omise request, payment enablement,
production mutation, or App Store action occurred.

## Required-check CI portability repair

The first pull-request run, GitHub Actions run
[`30705781800`](https://github.com/Sheshiyer/tirak-mobile-app-v2/actions/runs/30705781800),
failed before reaching the Axios validation. `release:verify-contracts` tried to
start `git` with a backend working directory that does not exist on a runner
which checked out only the mobile repository, so Node surfaced
`spawnSync git ENOENT`.

The repair does not bypass the contract gate:

- the workflow checks out the public backend repository with full history into
  `.ci/tirak-backend-alpha01` and supplies that exact path through
  `TIRAK_BACKEND_ROOT`;
- explicit missing roots fail closed with a descriptive error;
- local main-checkout and manifest-worktree layouts remain supported when the
  environment override is absent;
- every immutable contract commit, tree, parent, binary diff, ancestor, and
  artifact hash check remains unchanged;
- the historical Phase-1 scaffold check has an explicit `--structural-only`
  mode for CI, but that mode requires `CI=true` and skips only machine-local
  worktree existence and local-branch liveness checks; the local default still
  performs both checks.

The regression suite was observed failing before each production change and
passing afterward. Its final five cases cover the explicit backend checkout,
missing-root fail-closed behavior, workflow wiring, CI-only structural
verification, and rejection of structural-only mode outside CI.

## Independent non-Codex review

Temperance routed the accepted reviews through OmniRoute without a Sol-family
attempt:

| Review | Model | Plan / correlation | Result |
|---|---|---|---|
| Partial-scope adjudication | `antigravity/gemini-3.1-pro-high` | `rp_85433dbee28ad11f` / `tc_exec_1785596798333_89759_3159532213_task_0_t061-scope-adjudication-retry` | GO for dependency remediation; NO-GO for full T-061 closure |
| Dependency and hash diff | `antigravity/gemini-3.1-pro-high` | `rp_b96be89154b8b800` / `tc_exec_1785597369949_21690_588232609_task_0_t061-mobile-dependency-diff-review` | PASS |
| Post-change governance retry | `antigravity/gemini-3.1-pro-high` | `rp_e0e180037714f0db` / `tc_exec_1785597590449_31599_1385629136_task_0_t061-mobile-governance-review-retry` | PASS |
| CI gate-integrity audit | `no-think/gh/claude-sonnet-5` | session `db06f6ed-04e1-4c64-abd6-4358166a2ffe` / result `f39cfaca-77b0-4b63-9019-0ec799093086` | PASS; no blocker |
| CI portability audit | `no-think/antigravity/claude-sonnet-5` | session `8355a305-fa16-4f3f-a332-3b61e66f59a8` / result `5ad4405e-6588-43e7-bd26-2bad12d6a2f4` | PASS; no blocker |

One Laguna post-change governance attempt timed out without a final answer and
was rejected rather than promoted. Reviewer language claiming that passing
tests "guarantee" safety is also not relied upon; the durable claim is limited
to the exact probes and task boundary recorded above.

The first CI-review retry through `antigravity/gemini-3.1-pro-high` was also
rejected: plan `rp_7f157c05ff49959a` produced one failed compaction handoff and
one interrupted non-verdict. The accepted native non-Codex reviews both found
no blocker. Their useful CI-only flag hardening was implemented; their optional
shallow-clone suggestion was not, because the immutable verifier needs the
historical manifest commit and its parent to be available.

## Residual scope and rollback

- T-061 remains open because checkout tracking is explicitly deferred until the
  payment-flow redesign is decided and re-frozen.
- Backend Hono `4.12.19` still has a direct high-severity advisory. It was not
  changed here because the frozen task manifest assigns T-061 to the mobile
  repository and no supplemental backend worktree is recorded.
- Remaining mobile advisories are transitive Expo/React Native build or runtime
  graph findings and require compatibility-scoped follow-up; this patch makes no
  blanket `npm audit fix --force` change.
- Rollback is a normal `git revert` of the eventual T-061 remediation commit;
  no persistent external state was created.
