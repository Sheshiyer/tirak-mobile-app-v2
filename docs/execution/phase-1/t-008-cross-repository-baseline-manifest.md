# T-008 Cross-Repository Recovery Baseline Manifest

Status: **APPROVED AS A RECOVERY BASELINE**

Generated: `2026-07-18T21:10:52Z`

Purpose: recovery baseline only; this manifest does not authorize fanout, GitHub publication, staging, deployment, production access, or App Store submission.

## Repository identities

| Repository | Branch | Parent commit | Baseline commit | Tree | Parent-to-baseline binary diff SHA-256 | Snapshot |
| --- | --- | --- | --- | --- | --- | --- |
| mobile | `codex/tirak-omise/p1-w1.1/mobile-baseline` | `d4b8aa4b004b72ade40f53b5fc85e3cbe77cb431` | `3c0ecbf4218992857bc4de180311d8d892205436` | `d120908234cdaebda2f99e64b0ced6001643a9bc` | `92ecd5c89afbc48f639273cf7e85f55d8750b714d469b4d825442b26c0a51d5c` | tracked tree clean; 15 user-owned paths declared below |
| backend | `codex/tirak-omise/p1-w1.1/backend-baseline` | `9ea989b3e0d53661ab371de8825dd961cc11176d` | `ffadf78200b54d0bc986b5d711184705dc68269c` | `a36e48f22f64caaeade9e23735e362b60e51e00a` | `4dd2c1a10bd33dfd2e68868679229f19abb990e39bc07056b941bd4d60787fd2` | clean |
| wiki | `codex/tirak-omise/p1-w1.1/wiki-baseline` | `1303dc72e466cb710875e35c81bb11c7a4574908` | `7b5baee7a7f24f032b12ee6a7bf62a68a97c672e` | `a0dbdb57cffc1a929e6c2a013dc24ad32d64192f` | `9d6e9992c284947147fafe79a9fbc9e7b59c4ba20aad9a28ebbdf87b77402ea1` | clean; ignored local Astro cache is not versioned |

The diff hash producer is `git diff --binary HEAD^ HEAD | shasum -a 256`. Commit and tree identities were read from Git after each no-deploy commit.

## Evidence and control-file hashes

| Producer | SHA-256 |
| --- | --- |
| `docs/execution/phase-1/t-001-mobile-baseline-inventory.md` | `63449f4e387e9954c15689af86afe1e2f0cbb6d360029b4a272457af1d08809b` |
| `docs/execution/phase-1/t-002-mobile-baseline-evidence.md` | `fc8ed988bf39e8a8bc233f2e73e47d43f68a52efde610f0bfe066f81c6a66224` |
| backend `docs/execution/phase-1/t-004-backend-baseline-inventory.md` | `0d1c73d999094ea55a59baf3e99db8b68c89ce812bba80074cc0b3dea139e934` |
| backend `docs/execution/phase-1/t-005-backend-baseline-evidence.md` | `510be2e2210bea02f2eac62133bdcdc9bde441d1b3c94b0409efb78c6eb527f3` |
| wiki `tirak-wiki/docs/execution/phase-1/t-007-wiki-baseline-evidence.md` | `8fc8bd85d1be6747c59dcc9a98cfad54241bf9c4de9da4f5d382b8678d954320` |
| `ISA.md` at mobile baseline commit | `cc78f98ba8b65765e52ce6f13193ca289822e56c0c805ad14bdc51aedf1fb962` |
| frozen 80-task plan at mobile baseline commit | `90250e2538419b5016b8309e0b906c1e39e5b04288ff64ec7a0a7a2538be1668` |

The plan graph was revalidated from the committed file: 80 sequential unique tasks, twelve populated fields per task, 145 resolved prior-only dependency edges, ordered and acyclic.

## Declared mobile exclusions

The following user-owned, untracked paths are deliberately absent from the recovery baseline. The SHA-256 of the sorted `SHA-256  path` listing is `547a40b8d899108d8ae7f19c749fd63124e9913058a277c2782dd17c613c75b0`.

| Path | SHA-256 |
| --- | --- |
| `.agents/skills/integration-expo/.posthog-wizard` | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `.agents/skills/integration-expo/SKILL.md` | `d1d05ad0ec7b9d55b15e3a534bfbc5f3a201abbb6b21993690b0a2b97f5bfa25` |
| `.agents/skills/integration-expo/references/EXAMPLE.md` | `897a3ec94323ce2f02bfef8945d93c1a4e3eb061f8d2209004b2baf659355cb7` |
| `.agents/skills/integration-expo/references/basic-integration-1.0-begin.md` | `71f51f887bb8f681a4e3a22a9b4727704656ac9e195675a5a7cd49014fd41953` |
| `.agents/skills/integration-expo/references/basic-integration-1.1-edit.md` | `7ea7f812386df46df43c7a56c144a8f864afbec2a019593997712ba0e77b6010` |
| `.agents/skills/integration-expo/references/basic-integration-1.2-revise.md` | `b14360bf600e3a1c4e85b558410cfbc2430f54745aa12b6059fefb1a33134333` |
| `.agents/skills/integration-expo/references/basic-integration-1.3-conclude.md` | `86efac92c33902c7f42f4064c02ac0a1ecdfa29e2fbb4135b3877910f95a6ce6` |
| `.agents/skills/integration-expo/references/identify-users.md` | `60f0c4fbbccb413de4443090712dca70b4fcb3de816d1800811be0d1342d5915` |
| `.agents/skills/integration-expo/references/react-native.md` | `c290ddbb8b0fdf083dd63586c37ad43a295ce9f581f11544394ed8294ddd837b` |
| `.playwright-mcp/console-2026-05-25T14-27-30-915Z.log` | `b37b2506f0b1e380bcd3205df72ddfa161e0f0d117e4dac99e008025eb866493` |
| `.playwright-mcp/console-2026-05-26T07-30-10-951Z.log` | `73cb8739d51975e6fde4edcc2ebc8d816c83ee5f892ee140629a8fe71813ce8d` |
| `.playwright-mcp/console-2026-05-26T07-45-40-176Z.log` | `4ddbdab075832e4fcb486047427e0c795546c84a2e033d487bd5bbba3cd03c40` |
| `.playwright-mcp/page-2026-05-25T14-27-33-223Z.yml` | `8475946f909ba6ad5cc64469fca1ed18cb4d4373f1f2256dcd18847359c6e501` |
| `.playwright-mcp/page-2026-05-26T07-30-13-497Z.yml` | `8475946f909ba6ad5cc64469fca1ed18cb4d4373f1f2256dcd18847359c6e501` |
| `.playwright-mcp/page-2026-05-26T07-45-41-524Z.yml` | `8475946f909ba6ad5cc64469fca1ed18cb4d4373f1f2256dcd18847359c6e501` |

## Re-proved baseline results

- Mobile: Jest 7/7 suites and 39/39 tests pass; TypeScript, prohibited-copy, staged-secret, and whitespace gates pass.
- Backend: Vitest 9/9 files and 157/157 tests pass; TypeScript, staged-secret, and whitespace gates pass.
- Migration replay: the fresh historical chain deterministically records seven failures in `004_mobile_app_features.sql`; this is a blocker, not a passing production migration proof.
- Wiki: Node 3/3 tests pass; Astro builds 17 pages; two builds have SHA-256 `9cb38573759c081b42a007ae88331c7f1f02aee79c28860bd53c3a8904d44410`; the four-document corpus has SHA-256 `2f48be3a385455874840ca8138216de05aa265eefe2cc1863aa99e1724fcd2c7`; the legacy companion-persona route is absent.

## No-deploy blocker ledger

| Blocker | Earliest closing task | Baseline disposition |
| --- | --- | --- |
| Historical migration lineage fails in legacy `004`; focused `008`/`009` proof is not production evidence | `T-015`, then `T-018`–`T-022` | quarantined; no D1 mutation |
| Current `009` chat migration is destructive | `T-013`, then `T-018` | quarantined; additive expand/backfill/contract required |
| Seed/import paths admit Companion Services and Dining Companion | `T-015`, `T-020`, `T-021` | red negative fixture retained as evidence |
| Deploy and backup scripts reference false or stale commands/resources and can report false success | `T-012`, `T-017`, `T-019`, `T-023` | scripts prohibited from staging or production use |
| Booking cancellation can serialize as refunded without provider-backed restitution evidence | `T-010`, `T-014`, `T-016` | contract freeze required before implementation |
| No live Omise, Cloudflare staging, signed-device, remote-content, or exact-archive evidence exists | `T-025` onward | baseline makes no live-readiness claim |

## Approval record

- [x] Human owner verifies and approves the three baseline commit SHAs and immutable manifest commit `c1a059f5d7c1c2e804deb3ef38c794b09efae47c` as recovery points.
- [x] Human owner acknowledges approval does **not** authorize fanout, staging, or deployment.
- [ ] GitHub publication, production mutation, and App Store submission remain unapproved and outside the T-008 boundary.

Approval received: `2026-07-19T02:57:19Z`

Human statement:

> I approve the T‑008 recovery baseline and acknowledge this does not authorize fanout, staging, or deployment.

`T-008` is closed. Local work in the existing repositories may proceed through `T-023`; `T-024` remains the separate fanout, GitHub/worktree, staging, and deployment readiness gate.
