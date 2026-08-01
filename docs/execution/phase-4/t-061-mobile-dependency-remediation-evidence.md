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
| `npm test -- --runInBand` | 8/8 suites; 47/47 tests PASS |
| `npm run release:verify-mobile` | PASS; 135 built files; build tree `198b8ddf59826fa2e19b93194b2fc6056e1169b2cb1a6fb06b0ad45d188ff4d2` |
| `npm run release:verify-mobile:negative` | PASS; all 10 unsafe fixtures fail closed |
| `git diff --check` | PASS |

No `.env` value was read or copied. No EAS build, Cloudflare deployment, Omise
request, payment enablement, production mutation, or App Store action occurred.

## Independent non-Codex review

Temperance routed the accepted reviews through OmniRoute without a Sol-family
attempt:

| Review | Model | Plan / correlation | Result |
|---|---|---|---|
| Partial-scope adjudication | `antigravity/gemini-3.1-pro-high` | `rp_85433dbee28ad11f` / `tc_exec_1785596798333_89759_3159532213_task_0_t061-scope-adjudication-retry` | GO for dependency remediation; NO-GO for full T-061 closure |
| Dependency and hash diff | `antigravity/gemini-3.1-pro-high` | `rp_b96be89154b8b800` / `tc_exec_1785597369949_21690_588232609_task_0_t061-mobile-dependency-diff-review` | PASS |
| Post-change governance retry | `antigravity/gemini-3.1-pro-high` | `rp_e0e180037714f0db` / `tc_exec_1785597590449_31599_1385629136_task_0_t061-mobile-governance-review-retry` | PASS |

One Laguna post-change governance attempt timed out without a final answer and
was rejected rather than promoted. Reviewer language claiming that passing
tests "guarantee" safety is also not relied upon; the durable claim is limited
to the exact probes and task boundary recorded above.

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
