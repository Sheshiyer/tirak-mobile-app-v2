# T-001 Inventory Delta — Re-verification (2026-07-23)

Status: classified; no files reverted
Captured: 2026-07-23 21:55–22:00 local
Repository: `tirak-mobile-app-v2` (mobile)
Branch: `codex/tirak-omise/p1-w1.1/mobile-baseline`
HEAD SHA: `297704b0eb508d863fa0a7cfe7df2b3e6392da82` (`docs(release): record pending T-025 identity blocker`)
Parent SHA: `dffa481b92853aebe1788fe975a91307d777e784`
Merge base with `origin/main`: `d4b8aa4b004b72ade40f53b5fc85e3cbe77cb431` (branch is 18 commits ahead, 0 behind)
Supersedes: none — this is a delta on top of `t-001-mobile-baseline-inventory.md` (captured 2026-07-19 on `public/main`)

## Why this delta exists

The original T-001 inventory classified the integration diff at wave start. Since then the
branch absorbed the W1.1–W1.3 execution commits (18 commits: baseline preservation, contract
freezes, delivery scaffolds, T-024 readiness + GitHub publication evidence, T-025 blocker
record). This delta re-verifies that the *current* working tree still satisfies the T-001
acceptance criteria: every modified and untracked path is classified; no file is reverted.

## Snapshot (current tree)

- 1 tracked modification: `ISA.md` (+30 / −6).
- 2 untracked status entries representing 15 files: `.agents/` (9 files), `.playwright-mcp/` (6 files).
- No staged files at capture time. Stash count: 0.
- `git diff --check` passed.
- Inventory hash (sorted `git diff --name-status` + `git ls-files --others --exclude-standard`, sha256):
  `3d12fbd1980ba62fbd5b055386a5f107bbc1aa4e6cac47750feca508c673fdd4`
- Working tree object hash (`git write-tree`): `15522357bac95df480c37d519e1b2ef89af73e23`

## Classification of current uncommitted paths

| Path | Classification | Disposition |
| --- | --- | --- |
| `ISA.md` (M) | Execution system of record / plan-ISA ledger | **Release input — must be committed.** Content: ISC-148 check-off, T-025 completion ledger entries (2026-07-20/21), human authorization record for backend PR merge. Carried forward to T-003-style scoped commit on this branch. |
| `.agents/**` (9 files) | Derived agent tooling state (integration-expo skill + PostHog wizard cache) | **User-owned exclusion** — matches the frozen exclusion list in the original inventory. Never staged; preserved on disk. |
| `.playwright-mcp/**` (6 files) | Ephemeral browser automation logs/captures (telemetry) | **User-owned exclusion** — matches the frozen exclusion list. Never staged; preserved on disk. |

No plan/ISA/config/assets/mocks/telemetry path outside the table above is present in the
uncommitted diff. All previously classified release inputs are already committed on this branch.

## Drift vs. original inventory

- Capture branch then: `public/main` @ 0 ahead / 0 behind. Now: wave branch 18 ahead of `origin/main`.
- The 53 tracked modifications + 29 untracked files from the original capture are committed
  (W1.1–W1.3 evidence under `docs/execution/phase-1/` confirms).
- Local `main` and `dev` have no merge base with this branch — legacy line; authoritative
  upstream is `origin/main`.

## Blockers carried forward

- `ISA.md` ledger update is uncommitted; T-026+ work should not fan out until it lands in a
  scoped commit (per T-003 acceptance pattern: secret scan, diff audit, exclusions respected).
- GitHub issues T-001…T-080 remain `status:planned-not-created` on the tracker despite local
  execution through T-025; issue-state reconciliation is pending human approval.

## Reproduction commands

```sh
git status --short
git diff --numstat
git diff --check
git ls-files --others --exclude-standard
git rev-list --left-right --count origin/main...HEAD
{ git diff --name-status; echo 'UNTRACKED:'; git ls-files --others --exclude-standard; } | sort | sha256sum
git write-tree
```
