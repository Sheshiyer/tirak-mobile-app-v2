# Project State

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-09-12)

**Core value:** Travelers can see a truthful PromptPay checkout state without giving the mobile app payment authority.
**Current focus:** Tirak 1.5.4 cash-only release; owner-approved schema repair and account suspension completed; Core deployment awaits isolated Worker-scope login. Payment Phase 2 is deferred by the current cash-only decision.

## Current Position

Scope: Cash-only store release readiness, 2026-10-13.
Source candidate: codex/store-release-20261013 from d2469a6.
Status: Source cleanup and signed artifacts verified. Backup restored, schema reconciled, two review accounts suspended, all booking history verified unchanged. Core deploy awaits Cloudflare Worker access; real chat/device acceptance pending.
Acceptance: ISA.md active release criteria, plus docs/release/STORE-HANDOFF-20261013.md.
Native artifacts: IPA 1.5.4 (21), APK 1.5.4 (13), AAB 1.5.4 (14), all finished and inspected.
Verification: mobile 438 tests / 41 suites and TypeScript; isolated Core backend 722 tests / 57 files and TypeScript + production dry-run.
Live findings: schema drift after 019; 34 users, 5 bookings and 2 review accounts. Exact 28-statement schema reconciliation + 7 guarded ledger entries + two-account suspension/rollback prepared. No live writes/deploy/submission.
Next: owner reviews docs/release/PRODUCTION-BACKEND-REVIEW-20261013.md and approves backup/reconciliation/Core promotion/suspension preserving history. Then verify real-account chat, native devices and Interceptor screenshots before store submission.

## Performance Metrics

**Velocity:**
- Total plans completed: 2
- Average duration: n/a
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Local PromptPay pending checkout | 2 | 2 | multi-session recovery |

**Recent Trend:** Phase 1 completed locally; Phase 2 remains unplanned.

## Accumulated Context

### Decisions

- Phase 1 is a local-only vertical checkout slice; Tirak Plus and supplier signup remain untouched.
- Cash remains visible, and payment-method switching locks whenever a PromptPay charge may exist.
- Booking status, charge attempt, payment status, settlement, and restitution remain distinct server-owned truths.
- Live or uncertain payment sessions survive navigation and relaunch and cannot be replaced or retried unsafely.
- Custom-scheme cold/warm delivery is proven; universal links remain explicitly unclaimed.

### Pending Todos

- Discuss and plan Phase 2 server-authoritative status refresh and indeterminate recovery.

### Blockers/Concerns

- Production booking creation must expose authoritative currency before PromptPay broadens beyond the exact loopback THB fixture.
- The backend needs a stable `BOOKING_ALREADY_PAID` machine code before staging/production pairing.
- Universal links require an Associated Domains entitlement and a real authorized URL; custom-scheme evidence does not satisfy that gate.
- Staging and production keep PromptPay creation disabled; provider, deployment, release, and backend mutation remain separately owner-gated.
- The original authoring checkout and its user-owned iOS dependency diffs remain preserved outside this clean recovery branch.
- GSD specialist registration and external Advisor availability remain runtime concerns, not reasons to weaken completion evidence.

## Deferred Items

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| Payment lifecycle | Status polling and indeterminate recovery | Phase 2 | Phase 1 planning |
| External acceptance | Controlled staging charge | Owner-gated Phase 3 | Phase 1 planning |

## Session Continuity

Last session: 2026-09-12
Stopped at: Phase 1 complete; Phase 2 ready for discussion and planning.
Resume file: None

## Release continuity — 2026-10-13

Use the dedicated store release worktree and ISA, not the older mobile checkout or Phase 2 payment plan. The original mobile checkout was restored clean after adapting preliminary edits onto the latest Core source. No automatic swarm dispatch, merge or publication is authorized by this checkpoint.
