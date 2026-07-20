# T-017–T-023 Local Delivery Scaffold Evidence

Status: **IMPLEMENTED LOCALLY; FINAL CROSS-REPOSITORY RE-VERIFY PENDING**

Generated: `2026-07-20`

Authority: local T-017–T-023 implementation under the accepted `tirak-payments-v1` boundary. No fanout, GitHub publication, branch/worktree creation, staging access, or deployment occurred.

## Task results

| Task | Result | Evidence |
| --- | --- | --- |
| T-017 | PASS | `github-issue-map.json` deterministically maps all 80 tasks to five planned milestones, thirteen planned wave summaries, labels, issue bodies, and dependencies; every issue remains `planned_not_created` with a null issue number |
| T-018 | PASS | `branch-worktree-manifest.json` maps all 80 tasks to unique `codex/tirak-omise/...` branches and unique worktree paths; every mapping is `created: false` and gated by T-024 |
| T-019 | PASS | `lock-zone-ownership.json` assigns all tasks across seven zones with 114 serialized assignments, wave sequence, prior handoff, owner, and activation rule; no zone/wave sequence collides |
| T-020 | PASS | mobile gate runs 47 Jest tests, TypeScript, Expo public config, exact-input hashes, dependency/copy audits, source/route scans, and a full web export; nine negative fixtures exit nonzero |
| T-021 | PASS | backend `npm run release:verify` passes TypeScript, 186 tests, target/static audit, disposable restore, eight negative failures, isolated positive pipeline, and placeholder refusal; zero external commands execute |
| T-022 | PASS | `wave-evidence-matrix.json` covers T-001–T-080 and all thirteen waves with evidence types, trusted producers, acceptance probe, rollback flag, and human-approval flag |
| T-023 | PASS | six worker packet files freeze the contract, assignment, validator, forbidden-fix, and handoff requirements; the completeness verifier checks every prohibited workaround |

## Root-cause correction discovered by T-020

The first full Expo export failed even though unit tests passed. Client API modules under `app/api/**` were being compiled as navigable Expo Router screens, the public detail deep link remained `/companion/[id]`, and retired supplier subscription/payment redirects still occupied route space. The release gate corrected the ingestion point:

- API clients moved to `services/api/**` and all imports were updated.
- The public detail route is now `/experiences/[id]`.
- Retired supplier subscription and payment-history routes were removed.
- The Expo slug now says `tirak-guided-experiences`.
- PWA asset copying now fails closed instead of swallowing missing-output errors.

Internal compatibility type and backend field names may remain where the frozen contract requires them; they are no longer public deep-link or Expo route surfaces.

## Automated scaffold result

`npm run release:verify-phase1-scaffolds` reports:

- 80 tasks
- 5 phases
- 13 waves
- 80 unique branches
- 0 worktrees created
- 0 GitHub mutations
- 114 serialized lock assignments
- 80 task evidence rows
- 6 worker packet files
- authorization gate: `T-024 human approval`

## Mobile negative matrix

The following fixtures each exit nonzero: prohibited source copy, retired route, contract drift, environment mismatch, dependency drift, artifact-hash drift, test failure, type failure, and prohibited built-output copy.

## Remaining gate

T-024 requires a clean committed cross-repository re-run, an independent review, a no-deploy integration manifest, and explicit human approval. Until that gate closes, the generated branch/worktree and GitHub objects remain plans only.
