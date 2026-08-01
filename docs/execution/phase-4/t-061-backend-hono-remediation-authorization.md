# T-061 Supplemental Backend Hono Remediation Authorization

Status: **READY FOR OWNER DECISION — LOCAL-ONLY AUTHORITY REQUEST**
Prepared: 2026-08-01
Parent task: T-061 secret, dependency, and checkout-tracking audit
Backend repository: `Sheshiyer/tirak-backend-alpha01`

> **This packet requests authority; it does not execute the remediation.** It creates
> no backend branch or worktree, changes no dependency, pushes no commit, opens no
> pull request, mutates no issue, deploys nothing, and makes no Omise, Cloudflare,
> D1, payment, production, EAS, TestFlight, or App Store change.

## 1. Decision requested

Authorize one supplemental **local-only** backend worktree to remove the direct Hono
advisory finding already recorded by the partially released T-061 audit. The proposed
work is deliberately separate from:

- T-061 closure;
- the deferred checkout-tracking audit;
- the parked payment redesign and T-035/T-039–T-044;
- staging or production deployment; and
- publication of a branch or pull request.

Publication remains a second, commit-specific human gate after local evidence exists.

## 2. Why supplemental authority is required

The current frozen records do **not** contain a backend T-061 worktree:

1. `docs/orchestration/phase-1/branch-worktree-manifest.json` maps T-061 only to
   repository `mobile`, branch
   `codex/tirak-omise/w4.1/t-061-run-secret-dependency-and-checkout-tracking-audi`.
2. The owner-signed `docs/execution/phase-2/payment-park-and-resequencing-record.md`
   §5.2 partially releases the secret and dependency audit while deferring checkout
   tracking.
3. Merged mobile PR #82 expressly records backend Hono `4.12.19` as residual and
   leaves it unchanged because no supplemental backend T-061 worktree exists.
4. T-024 authorizes the precomputed branches/worktrees; it does not silently create
   an unlisted backend branch.

Therefore, the broad rollout objective and the mobile remediation precedent are not
treated as authority for a new backend worktree.

## 3. Read-only current-state proof

All probes below were read-only. No credential value was read or recorded.

| Evidence | Result |
| --- | --- |
| Backend `HEAD` | `8d8148d9af19c7a477795b212ddb667a5bac9ab1` |
| Backend `origin/main` | `8d8148d9af19c7a477795b212ddb667a5bac9ab1` |
| Main divergence | `0 0` |
| Declared direct dependency | `hono: ^4.7.11` |
| Locked direct dependency | `hono: 4.12.19` |
| Hono peer consumer | `@hono/zod-validator@0.7.0`, peer `hono >=3.9.0` |
| `@hono/node-server` | absent |
| Frozen local toolchain | Node `26.5.0`; npm `11.17.0`; lockfile version `3` |
| Current npm registry patch | `4.12.33` |
| `npm audit --omit=dev` | one direct high aggregate containing twelve Hono advisory records; fix available |
| OSV query for `hono@4.12.19` | twelve vulnerability IDs |
| OSV query for `hono@4.12.33` | zero vulnerability IDs |
| Existing backend main checkout | dirty with user-owned supplier-onboarding and evidence paths; must not be used |
| Existing T-061 mobile worktree | clean; no backend source or dependency change |

### Advisory inventory

The npm audit records group by first fixed line:

| Patched by | Advisory IDs |
| --- | --- |
| `4.12.21` | `GHSA-xrhx-7g5j-rcj5`, `GHSA-3hrh-pfw6-9m5x`, `GHSA-f577-qrjj-4474`, `GHSA-2gcr-mfcq-wcc3` |
| `4.12.25` | `GHSA-rv63-4mwf-qqc2`, `GHSA-wgpf-jwqj-8h8p`, `GHSA-88fw-hqm2-52qc`, `GHSA-wwfh-h76j-fc44`, `GHSA-j6c9-x7qj-28xf` |
| `4.12.27` | `GHSA-xgm2-5f3f-mvvc`, `GHSA-hvrm-45r6-mjfj`, `GHSA-w62v-xxxg-mg59` |

`GHSA-88fw-hqm2-52qc` is high severity and concerns credentialed wildcard CORS.
The target `4.12.33` is above every recorded patched boundary.

## 4. Runtime-risk review

The upstream `v4.12.19...v4.12.33` compare contains 99 commits. Relevant runtime
surfaces include route mounting, IP normalization, JWT authorization-scheme handling,
CORS, request/body parsing, content-type normalization, multipart cloning, query/header
parsing, validators, cookies, and Cloudflare Worker runtime tests.

Although the proposed repository diff is dependency-only, Hono is the HTTP substrate
for authentication, CORS, routing, validation, and the raw-body Omise webhook path.
“Payment files unchanged” must never be presented as proof that payment behavior is
unchanged.

## 5. Proposed local-only scope

### Exact target

- Base: backend `origin/main` at
  `8d8148d9af19c7a477795b212ddb667a5bac9ab1`.
- Branch: `codex/tirak-omise/w4.1/t-061-backend-hono-remediation`.
- Worktree:
  `/Volumes/madara/2026/twc-vault/01-Projects/thoughtseed/Tirak/.worktrees/backend/t-061-backend-hono-remediation`.
- Dependency intent: raise the declared safe floor from `^4.7.11` to `^4.12.33` and
  resolve the lock to exactly `4.12.33`.

### Allowed files

1. `package.json` — Hono range only.
2. `package-lock.json` — Hono declaration/resolution/integrity only.
3. `docs/security/t-061-backend-hono-remediation-evidence.md` — sanitized local
   evidence only.

The evidence document must use repository-relative paths, redact secret-shaped values,
and must not record the absolute backend checkout or worktree path.

The only dependency files allowed to change are `package.json` and `package-lock.json`;
the evidence document is the sole permitted non-dependency artifact. This distinction
prevents “Hono-only dependency diff” from being misread as excluding required evidence.

No application, test, Worker configuration, migration, secret, environment, payment,
webhook, analytics, or deployment file may change.

### Local procedure

1. Read `origin/main` with `git ls-remote --heads origin refs/heads/main` immediately
   before creating the worktree; require the exact authorized SHA, a clean supplemental
   worktree, and no branch/worktree collision. Record a SHA-256 digest of the existing
   backend main checkout's sanitized `git status --porcelain=v1` output.
2. Run a clean pre-change `npm ci`, peer-tree read-back, npm production audit, OSV
   query, typecheck, targeted runtime tests, full tests, and static release gate using
   exactly Node `26.5.0` and npm `11.17.0`.
3. Change only the Hono range with `apply_patch`, then run
   `npm install --package-lock-only --ignore-scripts --no-audit --no-fund`; record the
   command and npm version. Never run `npm audit fix`.
4. Reject the result if any package other than Hono changes in the manifest or lock.
5. Run `npm ci` from the changed lock and repeat the complete evidence matrix.
6. Run two independent, one-turn, no-tool native non-Codex OmniRoute audits:
   one reviews the produced manifest/lock diff and evidence bundle; the other reviews
   runtime/payment-adjacent risk against the same immutable bundle. The reviewers must
   not see or influence each other's response. Record each verbatim prompt and response
   envelope attribution. Both must approve; disagreement or ambiguity halts.
7. Re-run `git ls-remote --heads origin refs/heads/main` after all gates and immediately
   before committing; stop unless it still returns the exact authorized SHA. Re-hash
   the existing backend main checkout's sanitized status and require an exact match to
   the pre-change digest.
8. Create at most one local commit using `refs T-061`; never use `Fixes`, `Closes`,
   or `Resolves`.
9. Leave the worktree present and unpushed for owner inspection.

## 6. Required local evidence

| Gate | Required result |
| --- | --- |
| Base gate | exact backend SHA above; clean supplemental worktree |
| Non-interference gate | sanitized before/after SHA-256 digests of the existing dirty backend main status are identical; no main-checkout file is staged or changed by this task |
| Toolchain gate | both baseline and post-change evidence use Node `26.5.0`, npm `11.17.0`, and lockfile version `3`; any drift stops execution |
| Baseline gate | any pre-existing red result is recorded before the dependency edit; no regression may be hidden |
| Manifest gate | exactly one dependency range changes: Hono to `^4.12.33` |
| Lock gate | only root Hono declaration plus `node_modules/hono` version/resolution/integrity change |
| Peer gate | `npm ls hono @hono/zod-validator --all` exits zero and shows one deduplicated Hono `4.12.33`, the validator peer satisfied, and no node-server package |
| npm gate | `npm audit --omit=dev --json` reports zero production vulnerabilities |
| OSV gate | exact `hono@4.12.33` query reports zero vulnerability IDs |
| Type gate | `npm run typecheck` matches or improves the clean baseline |
| Targeted runtime gate | `npm exec -- vitest run tests/routes/auth.test.ts tests/routes/release-surface.test.ts tests/utils/validation.test.ts tests/routes/payments.kill-switch.test.ts tests/routes/payments.omise.test.ts tests/security/auth.attacks.test.ts tests/security/ownership.attacks.test.ts tests/security/ratelimit.attacks.test.ts` passes |
| Raw-body falsifiability gate | Within that command, `tests/routes/payments.omise.test.ts` must pass its named valid raw-body/signature, stale/invalid/replay, Base64-secret, and malformed-candidate cases; `tests/routes/payments.kill-switch.test.ts` must pass disabled-creation/available-settlement. A mocked handler that bypasses `app.request(new Request(...))` does not satisfy this gate |
| Full regression gate | `npm run test:run` matches or improves the clean baseline |
| Static release gate | `npm run release:verify:static` passes |
| Negative release gate | `npm run release:verify:negative` passes |
| Bundle gate | record `npm exec -- wrangler --version`, then `npm exec -- wrangler deploy --dry-run --outdir .wrangler/t-061-hono-dry-run` exits zero and creates a local bundle without remote execution |
| Diff gate | `git diff --check` passes; no secret-shaped value; allowed-file set exact |
| Independent audit gate | both native non-Codex verdicts are substantive and unambiguous, contain no unresolved blocker or near-blocker, and record the verbatim prompt, profile, canonical model, gateway/provider attribution, session ID, terminal reason, and cost |
| Review separation gate | both post-change reviewers inspect the actual immutable diff plus evidence bundle independently and approve; the pre-authorization reviews in §10 cannot substitute for either post-change verdict |

No live Omise request, test charge, Cloudflare request, D1 query, staging deploy, or
production probe belongs in this evidence matrix.

The npm registry and OSV checks are explicitly limited to unauthenticated, read-only
requests to `https://registry.npmjs.org/` and `https://api.osv.dev/`. They must not send
an npm token, GitHub token, Cloudflare token, Omise credential, cookie, or custom
authorization header, and they authorize no package publication.

The targeted Vitest path exercises Fetch `Request` objects through Hono's application
adapter but is not a deployed Workers-runtime proof. That limitation is accepted only
for this reversible local dependency commit; any later staging or production proposal
must retain its own separately authorized runtime verification.

## 7. Stop conditions

Stop without committing if any condition occurs:

- remediation requires Hono `4.13.x`, `5.x`, a Node/engine change, or another peer
  dependency update;
- Node, npm, or lockfile version differs from the frozen toolchain above;
- npm or OSV still reports any Hono vulnerability at `4.12.33`;
- the lock changes any package other than Hono;
- an application, test, payment, checkout, Omise, webhook, analytics, secret,
  environment, Wrangler, migration, or deployment file would need modification;
- raw-body signature, auth, CORS/release-surface, validation, adversarial, full-suite,
  static, negative, or dry-run evidence regresses from the clean baseline;
- a scanner or audit produces an unresolved high/critical finding;
- either independent reviewer returns a blocker, unresolved near-blocker, partial or
  ambiguous verdict, missing attribution, or non-substantive response;
- the immediate pre-worktree or immediate pre-commit remote read-back differs from the
  authorized base SHA, or `origin/main` moves after authorization; or
- any push, PR, merge, issue/comment/label mutation, tag, release, package publication,
  CI-triggering action, deployment, or external-service mutation is attempted.

## 8. Rollback and publication boundary

Before publication authority, rollback is local and exact: remove the unpushed
supplemental worktree and branch, returning to the immutable base SHA. No remote state
exists to unwind.

Rollback is not automatic: if the owner directs it, first prove the supplemental
worktree contains no uncommitted file and the existing backend main status digest is
unchanged. Any dirty supplemental state or digest mismatch stops cleanup for inspection;
no force-removal command may run under this packet.

After the local commit passes every gate, a new packet must bind its exact commit/tree,
diff, SHA-256 evidence hashes, audit verdicts, and current base. Only then may the owner decide
whether to authorize push and a draft pull request. Merge and T-061 closure remain later
decisions; checkout tracking still waits for the payment redesign.

## 9. Exact local-only approval statement

To authorize only the proposed reversible local work, the human release owner may send
this exact statement:

> I authorize the supplemental local-only T-061 backend Hono remediation from
> `tirak-backend-alpha01` origin/main
> `8d8148d9af19c7a477795b212ddb667a5bac9ab1`: create exactly one isolated worktree
> and branch named `codex/tirak-omise/w4.1/t-061-backend-hono-remediation`; change
> only the Hono range in `package.json`, the corresponding Hono entries in
> `package-lock.json`, and one sanitized evidence document; update Hono from locked
> `4.12.19` to `4.12.33`; run the stated local audits, runtime/payment-adjacent tests,
> release gates, dry-run bundle, unauthenticated public npm-registry and OSV reads using
> the frozen Node/npm toolchain, and two native non-Codex OmniRoute reviews; and
> create at most one unpushed local commit that references but does not close T-061.
> This does not authorize git push, pull-request creation, merge, issue/comment/label
> mutation, tag or release creation, package publication, CI-triggering action, T-061
> closure, checkout-tracking work, application or test-code changes,
> Omise or Cloudflare requests, charges, webhooks, D1 operations, secrets, environment
> changes, deployments, payment enablement, production/live activity, EAS builds,
> TestFlight, App Store Connect mutation, or App Store submission.

If the base SHA changes before execution, this statement expires and must be renewed
against the new exact base.

## 10. Independent pre-authorization review record

Two one-turn, no-tool native non-Codex OmniRoute reviews inspected the packet's
pre-refinement version before this local commit. Their requested refinements are
incorporated in the current version. Both wrappers completed successfully and returned
substantive verdicts; exit status alone was not treated as approval.

| Review | OmniRoute profile / canonical model | Receipt | Verdict and disposition |
| --- | --- | --- | --- |
| Governance | `no-think/gh/claude-sonnet-5` / `claude-sonnet-5` (`firstParty`) | session `ce1cc50f-0626-496c-93da-d65d8b4a305c`; terminal `completed`; cost `$0.074646`; raw-envelope SHA-256 `e79ade1d7ff2469e967d21c9826715e614f72bd88b1ff7004c355cba6f9e495b` | **APPROVE**. Requested immediate execution-time base re-check, explicit handling for ambiguous reviews, and repository-relative sanitized evidence paths; all are incorporated above. |
| Technical | `no-think/antigravity/claude-sonnet-5` / `claude-sonnet-5` (`firstParty`) | session `ae812fba-d09d-4060-b9dd-b9ae4d4dd478`; terminal `completed`; cost `$0.060060`; raw-envelope SHA-256 `54bce1a5bee60ac5d49b411b670e6bf195df8a986e3a62530db546d74e96c08d` | **APPROVE, no material blocker**. Its raw-body test near-blocker is resolved with exact files, command, and assertions; peer, install, SHA timing, dry-run, SHA-256, and review-record refinements are also incorporated. |

The wrapper did not echo the original inline task prompts into its result envelopes, so
this pre-authorization record does not mislabel a reconstructed prompt as verbatim.
The actual remediation evidence gate above closes that provenance gap by requiring
both future prompts to be recorded verbatim alongside their complete attribution.

## 11. Primary and project evidence

- `docs/execution/phase-1/t-024-human-approval.md`
- `docs/orchestration/phase-1/branch-worktree-manifest.json`
- `docs/execution/phase-2/payment-park-and-resequencing-record.md`
- `docs/execution/phase-4/t-061-mobile-dependency-remediation-evidence.md`
- [T-061 issue](https://github.com/Sheshiyer/tirak-mobile-app-v2/issues/61)
- [Merged mobile remediation PR #82](https://github.com/Sheshiyer/tirak-mobile-app-v2/pull/82)
- [Hono upstream comparison](https://github.com/honojs/hono/compare/v4.12.19...v4.12.33)
- [OSV query API](https://api.osv.dev/v1/query)
- [High CORS advisory](https://github.com/advisories/GHSA-88fw-hqm2-52qc)
