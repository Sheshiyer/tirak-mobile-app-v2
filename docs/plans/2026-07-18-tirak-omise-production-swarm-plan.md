# Tirak Omise Production Integration — Swarm Delivery Plan

Status: structurally validated execution plan
Date: 2026-07-18
Planning method: Swarm Architect, contract-first, wave-boundary integration
Scope: Tirak mobile app, Cloudflare backend, canonical wiki, Omise PromptPay, and App Store resubmission
Authorization boundary: this document does not authorize commits, GitHub mutations, secret changes, deployments, database writes, EAS submissions, or App Store submission.

## 1. Discovery Summary

- **Planning depth:** deeply detailed
- **Delivery mode:** production hardening
- **Release model:** phased rollout with hard go/no-go gates
- **CI/CD expectation:** production-grade validation before promotion
- **Quality bar:** automated tests, device evidence, signed webhook evidence, migration evidence, telemetry, security review, rollback proof, and App Review artifact parity
- **Human team shape:** small squad with one human release owner and four logical agent roles
- **Agent topology:** planner/orchestrator, mobile executor, backend/infra executor, validation reviewer, plus a human credential/release owner
- **Repositories:** `tirak-mobile-app-v2`, `tirak-backend-alpha01`, and `wikiv2-tirakapp`
- **External systems:** Omise test/live accounts, Cloudflare Workers/D1/Durable Objects, EAS/TestFlight, and App Store Connect
- **Current baseline:** mobile is on `public/main`; backend and wiki are on `main`; all contain validated but uncommitted integration changes. Phase 1 runs under exclusive ownership in the existing roots, and no fresh worker, worktree, GitHub issue mutation, or staging mutation may launch until `T-024` passes.
- **Deadline:** not supplied; work advances by evidence gates rather than dates
- **Estimated effort:** approximately 260 execution hours; four to six working weeks with three disjoint execution lanes, excluding vendor enablement and Apple review latency

## 2. Confirmed Facts, Assumptions, and Constraints

### Confirmed facts

- The local PromptPay foundation already creates booking-bound charges, derives THB amount server-side, persists attempts, renders QR data, verifies signed webhooks, retrieves provider truth independently, and supports exact-charge recovery.
- Mobile, backend, and wiki regression suites were green at the end of the local implementation review.
- The repository-wide historical D1 migration chain fails inside legacy `004_mobile_app_features.sql`; migrations `001 + 008 + 009` pass a focused probe.
- Current migration `009` renames active chat tables and is not safely compatible with an old Worker during rollback; production requires an additive expand/contract replacement, with destructive legacy-table retirement deferred beyond this release.
- Current seed data still contains companion-oriented categories that can be exposed by public category routes.
- Current deploy and backup scripts contain stale resource names, false-green checks, and no proven restoration path; they are not approved production tooling.
- The main app must sell a bounded guided travel experience, never time with or access to a person.
- Guide payouts, split settlements, saved cards, subscriptions, Apple Pay, and Google Pay are not implemented in this release.
- App Review needs a confirmed-unpaid booking and a separate legitimately paid booking; a reviewer-only payment bypass is prohibited.

### Assumptions requiring confirmation during execution

- The Omise merchant account can enable PromptPay in both test and live modes.
- A human release owner has Cloudflare, Omise, EAS, App Store Connect, and banking-app access.
- The configured staging Worker and D1 database are safe to mutate after a preflight snapshot.
- Production D1 uses the modern storage subsystem or otherwise has an equivalent tested backup and restoration path.
- The paid reviewer fixture can be created through a real verified PromptPay charge with a small legitimate booking amount.
- Remote CMS, push, email, support, privacy, and legal surfaces are available for audit before archive freeze.

### Hard constraints

- The mobile runtime remains Expo SDK 53, Expo Router, and React Native 0.79.
- The backend remains a Hono Cloudflare Worker with D1 and Durable Objects.
- The client never sends an authoritative amount or receives Omise secrets.
- Payment is available only for a persisted, authenticated, customer-owned, `confirmed` experience booking.
- Booking cancellation and payment settlement are coupled once a QR exists: a booking cannot be represented as refunded without financial evidence, and a provider success cannot silently convert a cancelled booking into an ordinary paid booking.
- Webhook bodies are not payment truth; the corresponding charge is independently retrieved and matched.
- Test and live Omise keys and webhook secrets are environment-separated and stored only as Cloudflare secrets.
- No production migration runs until the actual target schema, migration ledger, recovery bookmark, and rollback limits are recorded.
- Production migration `009` is additive only: legacy chat tables remain available to old Worker versions until the new Worker is proven and all old versions are retired; no drained destructive cutover is permitted in this release.
- No deploy, backup, migration, or release evidence produced by the current scripts is trusted until `T-021` proves fail-closed behavior with deliberate command, health-check, and environment-mismatch failures.
- Existing user changes are preserved. Destructive cleanup, reset, or migration repair is prohibited without explicit human approval.
- Disabling new charges must leave webhooks, authenticated status refresh, and reconciliation online until all pending, creating, and indeterminate attempts settle.
- GitHub issue creation, fresh worktrees, worker dispatch, and staging mutation occur only after the full Phase 1 gate `T-024` passes.

### Known release blockers discovered during planning

- `scripts/seed-data.sql` can still introduce “Companion Services” and “Dining Companion” into public categories.
- The legacy migration history has incompatible table definitions; `CREATE TABLE IF NOT EXISTS` preserves the wrong earlier shapes instead of reconciling them.
- `deploy.sh` calls nonexistent scripts, tolerates failures, omits correct staging targeting, uses stale database names, and raw-executes the migration directory.
- `backup.sh` targets a stale database, exports an incomplete representation, and has no restore proof.
- Staging D1/KV identifiers are placeholders, while `db:migrate:production` and Wrangler refer to different production database names.
- A confirmed booking can currently be cancelled while an active PromptPay QR remains payable; reconciliation can then mark the cancelled booking paid.
- Booking serialization currently risks presenting cancellation as refund even though Omise states that PromptPay charges cannot be voided or refunded through Omise.
- A crashed Worker can leave `creating` attempts stranded; no scheduled reconciler, aging alert, or operator queue currently resolves them.
- All provider reconciliation paths must match metadata, source type, and `livemode` in addition to charge ID, amount, and currency.
- Sentry replay/default PII and PostHog must be disabled or strictly excluded from payment screens.
- Backend ADRs still describe a Tirak Plus companion source of truth; main-app runtime, content, and data isolation need a superseding decision.

### Primary guidance

- Apple permits external payment for physical services consumed outside the app, while Guideline 1.1.4 still prohibits compensated dating or companionship: [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/).
- Omise documents PromptPay as an asynchronous QR flow, including one-request server-side source/charge creation and provider status verification: [PromptPay](https://docs.omise.co/promptpay).
- Omise also states that PromptPay charges cannot be voided or refunded through Omise, making cancellation interlocks and external restitution policy launch requirements: [PromptPay — voids and refunds](https://docs.omise.co/promptpay#voids-and-refunds).
- Omise documents raw-body HMAC-SHA256 signatures, timestamp headers, and separate test/live webhook secrets: [Webhooks](https://docs.omise.co/api-webhooks).
- Omise requires secret keys to stay server-side and recommends HTTPS, monitoring, 2FA, and immediate key rotation after exposure: [Security best practices](https://docs.omise.co/security-best-practices).
- Cloudflare records applied D1 migrations and recommends versioned migration files: [D1 migrations](https://developers.cloudflare.com/d1/reference/migrations/).
- D1 Time Travel provides point-in-time restoration, subject to storage version and retention: [Time Travel](https://developers.cloudflare.com/d1/reference/time-travel/).
- Worker rollback does not revert D1 schema and can fail across incompatible resource changes: [Workers rollbacks](https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/).

## 3. Agent Ownership Model

| Concern | Primary owner | Runtime | Secondary reviewer | Owned surfaces |
| --- | --- | --- | --- | --- |
| Planning, dependencies, contract freeze, GitHub graph | Planner/orchestrator | noesisX primary | Human product owner | Plan, ISA, issue graph, wave close |
| Mobile and EAS integration | Mobile executor | Codex worker | Planner and validation reviewer | Mobile repo except serialized lock zones |
| Worker, D1, Omise, observability, deployment | Backend/infra executor | Copilot or isolated Codex Engineer worker | Planner and validation reviewer | Backend repo and Cloudflare operations |
| Tests, device matrix, adversarial validation | Validation reviewer | Gemini, QATester, or isolated Codex reviewer | Planner | Test assets, reports, screenshots, findings |
| Credentials, merchant actions, App Store submission | Human release owner | Human | Planner/release integrator | Omise, Cloudflare, EAS, banking app, App Store Connect |
| Wave integration and release decision | Release integrator | Primary plus human release owner | Validation reviewer | Integration branches, manifests, go/no-go |

### Collision boundaries

- One implementation task has one owner, one branch, and one worktree.
- Normal branch: `codex/tirak-omise/{phase}-{wave}/{swarm}/{task-id}`.
- Normal worktree: `.worktrees/{task-id}-{owner-agent}` inside the owning repository.
- Phase 1 tasks `T-001` through `T-024` use the three existing roots under exclusive repository-level ownership; new worktrees remain blocked until `T-024` passes.
- D1 mutation always has one writer: migration implementation, rehearsal, staging application, production application, and recovery drills are serialized even when other read-only swarms run concurrently.
- Merges land only at wave boundaries on a named integration branch.
- Contract changes stop dependent swarms and reopen the owning contract task.

### Serialized lock zones

| Lock zone | Exclusive owner | Release rule |
| --- | --- | --- |
| Mobile `package.json`, lockfile, `app.json`, `eas.json`, `constants/api.ts` | Mobile integration swarm | One task at a time; validation reviews the aggregate diff |
| Backend `package.json`, lockfile, `wrangler.toml`, `src/index.ts` | Backend integration swarm | Serialized before staging deploy |
| D1 migrations and migration ledger | Data migration swarm | No parallel SQL edits; checksum after approval |
| Payment API and shared payment states | Payment contract swarm | Freeze before mobile/backend parallelism |
| Wiki allowlist and generated corpus | Content-review swarm | Rebuild only after canonical source approval |
| App Store metadata, screenshots, review notes | Store-assets swarm | Freeze against exact release candidate archive |

## 4. Phase Map

| Phase | Goal | Waves | Effort | Exit gate |
| --- | --- | --- | ---: | --- |
| Phase 1 — Baseline and contract freeze | Turn validated dirty worktrees into an approved immutable baseline and freeze every shared boundary | W1.1, W1.2, W1.3 | 65h | Baseline SHAs, contract packet, CI/evidence matrix, and worker packets approved |
| Phase 2 — Staging backend, data, and Omise | Rehearse schema changes, deploy test-mode payments, and establish operating controls | W2.1, W2.2, W2.3 | 71h | Staging payment lifecycle and recovery drills pass with telemetry |
| Phase 3 — Mobile and reviewer experience | Bind the mobile release candidate to staging and prove the complete reviewer journey on devices | W3.1, W3.2, W3.3 | 57h | Signed internal build, device matrix, legitimate reviewer fixtures, and content audit pass |
| Phase 4 — Release hardening | Challenge security, financial integrity, privacy, and exact App Store artifacts | W4.1, W4.2 | 43h | Security signoff and release-candidate go/no-go pass |
| Phase 5 — Production and submission | Apply reversible production changes, validate and submit the exact archive, and monitor payment and review outcomes | W5.1, W5.2 | 25h | Production fixtures, exact-archive device proof, App Store submission, monitoring window, and closeout evidence complete |

## 5. Detailed Phase 1 Wave and Swarm Layout

### Wave W1.1 — Stabilize the validated baseline

#### Swarm `mobile-baseline`

- **Goal:** inventory, verify, and preserve the mobile integration without losing user changes.
- **Owner:** planner/release integrator under exclusive current-worktree ownership.
- **Inputs:** current mobile diff, ISA, 39-test baseline, TypeScript evidence.
- **Outputs:** scoped baseline commit candidate and exact evidence manifest.
- **Validation:** test, typecheck, prohibited-copy scan, `git diff --check`, file inventory.

#### Swarm `backend-wiki-baseline`

- **Goal:** preserve backend payment/chat/migration work and wiki publishing restrictions as separately reviewable baselines.
- **Owner:** backend executor for Worker; content reviewer for wiki; planner closes the cross-repository manifest.
- **Inputs:** current backend and wiki diffs, 157-test backend result, 17-page wiki build.
- **Outputs:** backend and wiki baseline commit candidates plus cross-repository SHA manifest.
- **Validation:** backend typecheck/tests/migration probes, wiki tests/build/corpus count, whitespace and scope audits.

**Wave exit:** `T-008` records approved recovery-baseline SHAs and proves every current change is recoverable. Contract and delivery-scaffold work continues exclusively in the existing roots; no fresh worker, worktree, GitHub issue, or staging mutation starts before `T-024`.

### Wave W1.2 — Freeze contracts

#### Swarm `payment-data-contracts`

- **Goal:** freeze HTTP shapes, payment states, authoritative amount rules, D1 tables, migration policy, and provider matching.
- **Owner:** backend executor, reviewed by planner and validation reviewer.
- **Outputs:** versioned payment API, state, D1 schema, migration, and recovery contracts.
- **Validation:** contract tests map every state and endpoint to one binary probe.

#### Swarm `product-release-contracts`

- **Goal:** freeze environment modes, mobile gates, reviewer data provenance, and App Store evidence boundaries.
- **Owner:** planner plus mobile executor and human release owner.
- **Outputs:** environment matrix, mobile integration contract, reviewer fixture specification.
- **Validation:** no contract permits client-owned amount, pre-confirmation payment, general chat, fake paid state, or retired product language.

**Wave exit:** `T-016` publishes the shared contract packet. Any later drift reopens the relevant contract task.

### Wave W1.3 — Prepare safe delivery

#### Swarm `orchestration-scaffold`

- **Goal:** map tasks to issues, branches, worktrees, lock zones, and deterministic handoffs.
- **Owner:** planner/orchestrator.
- **Outputs:** issue manifest, VCS manifest, lock ledger, bootstrap packets.
- **Validation:** every implementation task has exactly one owner and disjoint surface.

#### Swarm `validation-scaffold`

- **Goal:** establish CI baselines and name evidence before implementation begins.
- **Owner:** validation reviewer, with mobile and backend executors supplying commands.
- **Outputs:** mobile CI gate, backend CI/migration gate, evidence matrix, Phase 1 readiness verdict.
- **Validation:** all gates run from approved baseline SHAs and fail closed on missing evidence.

**Wave exit:** `T-024` authorizes Phase 2 worker launch; it does not authorize production mutation.

## 6. Frozen Shared Contract Packet

### Payment API

- `POST /api/payments/charges` accepts `{ bookingId, method: "promptpay" }` only.
- `GET /api/payments/charges/:chargeId` authenticates ownership and independently refreshes provider state.
- `POST /api/payments/charges/recover` binds only an exact provider charge that matches owner, booking metadata, amount, THB currency, and PromptPay source.
- `POST /api/payments/webhooks/omise` consumes exact raw bytes, verifies signature and replay window, then retrieves the charge from Omise.
- No request accepts client amount, raw card data, gift, tip, subscription, or arbitrary beneficiary.
- Monetary response fields use explicit units such as `amountSatang` and `displayTotalThb`; an ambiguous `amount` field is not a frozen public contract.
- The release route allowlist excludes saved PromptPay contact references, legacy card/payment-method surfaces, and unreviewed payment-history endpoints unless they receive their own explicit contract and validation.

### Payment and booking states

- Provider `successful` becomes local attempt `completed` and mobile `paid`.
- Provider `pending` remains local/mobile pending.
- Unknown creation outcomes become `indeterminate` and mobile `processing`; blind retry is blocked.
- Provider `failed` or `expired` leaves the booking unpaid and allows an explicit retry only while the booking remains confirmed.
- Payment status never completes the real-world experience delivery state.
- An active QR or unresolved attempt blocks ordinary cancellation until the financial outcome is resolved by policy.
- A cancelled booking never serializes as `refunded` without a separately evidenced restitution record.
- Off-Omise restitution uses its own ledger states `restitution_pending`, `restituted`, and `restitution_failed`; it never rewrites the immutable Omise charge outcome, and reconciliation closes only after amount, recipient, evidence, and approver are recorded.

### D1 schema

- `payment_attempts` is booking- and customer-bound; active-attempt idempotency is enforced locally.
- `payment_webhook_events` provides replay and processing ownership.
- `payment_restitutions` records the external resolution state, amount, recipient reference, evidence location, approver, timestamps, and originating successful charge without representing an Omise refund.
- `chat_rooms` is unique per booking and derives customer/supplier participants from the booking.
- The replacement for migration `009` creates booking-scoped chat tables alongside legacy pair-scoped tables without importing ambiguous history; legacy tables are retained through this release and retired only by a later, separately approved contract migration.
- The actual target schema and `d1_migrations` ledger decide production applicability; filenames alone are insufficient.

### Environment and secret contract

- `EXPO_PUBLIC_API_URL` points each EAS profile to the intended Worker environment.
- `OMISE_SECRET_KEY` and `OMISE_WEBHOOK_SECRET` are Cloudflare secrets, separated between test and live modes.
- A payment environment mode defaults closed and must make accidental live/test mixing observable.
- `PROMPTPAY_ENABLED=false` blocks only new charge creation; status, webhook, and reconciliation paths remain available.
- Missing or invalid mode configuration is equivalent to `PROMPTPAY_ENABLED=false`; only the named human release owner may change the production flag through audited Cloudflare configuration, without a code deploy.
- Disabling charge creation does not abandon in-flight `creating`, `pending`, or `indeterminate` attempts; the scheduled reconciler and operator queue retain ownership until each attempt reaches an evidenced outcome.
- Staging and production webhook endpoints use HTTPS and the matching environment secret.

### Mobile integration boundary

- A concrete `serviceId` is mandatory before booking submission.
- Only a guide-confirmed booking can display PromptPay checkout or booking logistics chat.
- The screen displays server-provided experience title, THB total, QR, expiry/state, and recovery-safe messaging.
- The app cannot self-declare payment success.
- The exact release build contains no private, dating, escort, adult, companionship, direct-cash, or pre-booking chat surface.

### Evidence contract

- Every task attaches at least one automated, log, screenshot, metric, schema, or status-check proof.
- Deployment, backup, migration, and restore proof must name the exact tool version or reviewed command that produced it; output from the pre-`T-021` scripts is inadmissible.
- Each wave closes only after contract drift, lock-zone changes, residual risks, and downstream handoffs are reviewed.
- Missing credentials or external access is a blocker, never a reason to simulate production success.

## 7. Full 80-Task Execution Graph

Field mapping follows the Swarm Architect task schema. `VCS=standard` expands to branch `codex/tirak-omise/{phase}-{wave}/{swarm}/{task-id}` and worktree `.worktrees/{task-id}-{owner-agent}` in the owning repository. `VCS=baseline` means exclusive current-worktree execution until the baseline commit exists. `Lock=yes` serializes the named shared files in the deliverable.

| ID | Phase / Wave / Swarm | Title | Area | Owner role / agent | Hours | Dependencies | Deliverable | Acceptance | Validation | VCS | Lock |
| --- | --- | --- | --- | --- | ---: | --- | --- | --- | --- | --- | --- |
| T-001 | P1 / W1.1 / mobile-baseline | Inventory mobile integration diff | product | Planner / noesisX | 2 | — | Classified mobile release-input inventory with branch, parent SHA, source, derived output, blocker, and user-owned exclusions | Every modified and untracked path is classified; plan/ISA/config/assets/mocks/telemetry are explicit; no file is reverted | `git status`, diff stats, scope review, and inventory hash | baseline | yes |
| T-002 | P1 / W1.1 / mobile-baseline | Re-prove mobile baseline | qa | Validation reviewer / QATester | 2 | T-001 | Mobile baseline evidence bundle | Jest, TypeScript, copy guard, and whitespace checks pass from one tree state | Command logs and test counts | baseline | no |
| T-003 | P1 / W1.1 / mobile-baseline | Preserve mobile baseline commit | frontend | Release integrator / noesisX | 1 | T-002 | Scoped no-deploy mobile recovery-baseline commit and SHA | Staged diff matches inventory, secret scan passes, `.agents` and Playwright state are excluded, and blocker ledger is referenced | Staged secret scan, commit diff audit, tree hash, and SHA record | baseline | yes |
| T-004 | P1 / W1.1 / backend-wiki-baseline | Inventory backend integration diff | product | Planner / noesisX | 2 | — | Classified Worker, seed/public-ingestion, migration, deploy/backup, Wrangler, package-command, notification, test, and documentation inventory | Every backend release input is assigned to integration, derived output, blocker, or explicit exclusion | `git status`, route/seed/config/script/migration audit, diff stats, and inventory hash | baseline | yes |
| T-005 | P1 / W1.1 / backend-wiki-baseline | Re-prove backend and migration baseline | qa | Validation reviewer / isolated reviewer | 3 | T-004 | Backend evidence bundle with exact-tree tests, seven-error historical replay, focused-probe limitation, schema comparison, and destructive-`009` warning | Typecheck and all tests pass; full `004` failure is reproduced; focused migration is labeled non-production evidence; red seed/cancellation/tooling probes are recorded | Vitest, TypeScript, SQLite probes, secret scan, script audit, and diff check | baseline | no |
| T-006 | P1 / W1.1 / backend-wiki-baseline | Preserve backend baseline commit | backend | Release integrator / noesisX | 1 | T-005 | Scoped no-deploy backend recovery-baseline commit and SHA | Commit contains only reviewed backend inputs; secret scan passes; destructive `009` and other known blockers are explicitly quarantined by ledger | Staged secret scan, commit diff audit, tree hash, and SHA record | baseline | yes |
| T-007 | P1 / W1.1 / backend-wiki-baseline | Preserve canonical wiki baseline | product | Content reviewer / Codex worker | 3 | — | No-deploy wiki recovery-baseline commit, four-document corpus manifest, deterministic build hashes, and route evidence | Source allowlist yields exactly four documents; repeated builds match; legacy routes are absent; tracked `node_modules/.astro` cache is removed from version control | Node tests, two-build hashes, corpus hashes/count, Astro build, route probes, staged secret scan, and SHA record | baseline | yes |
| T-008 | P1 / W1.1 / orchestration | Publish cross-repository baseline manifest | product | Planner / noesisX | 2 | T-003, T-006, T-007 | Manifest of parent and baseline SHAs/tree hashes, branches, included/excluded hashes, evidence producers, plan/ISA hashes, and blocker ledger | Human owner approves the manifest as a recovery baseline only; approval does not authorize fan-out, staging, or deployment | SHA/tree/diff-hash verification, clean-or-declared repository snapshots, and human approval | baseline | yes |
| T-009 | P1 / W1.2 / payment-data-contracts | Freeze payment HTTP and route-surface contract | backend | Backend executor / Copilot or Engineer | 3 | T-008 | Versioned endpoint, explicit-unit request/response, error, auth, and release-route contract | Safe PromptPay endpoints are explicit; ambiguous amount units and legacy payment/card/contact routes are removed or blocked | Contract tests and mounted-route audit | standard | no |
| T-010 | P1 / W1.2 / payment-data-contracts | Freeze payment and cancellation state mapping | data | Backend executor / Copilot or Engineer | 2 | T-009 | Provider, attempt, booking, cancellation, restitution, and mobile state table | Every provider and cancellation race has one non-false outcome; cancellation never implies refund | Table-driven invariant tests cover every combination | standard | no |
| T-011 | P1 / W1.2 / payment-data-contracts | Freeze target D1 schema contract | data | Data owner / backend executor | 4 | T-008 | Required columns, tables, constraints, indexes, and authoritative ledger contract | Contract covers bookings, attempts, webhook events, booking chat, and `payment_restitutions` identifiers, amount/currency, reason, approver, evidence, lifecycle, permissions, and duplicate prevention | Schema introspection fixture, permission matrix, and SQL invariant assertions | standard | yes |
| T-012 | P1 / W1.2 / payment-data-contracts | Decide legacy 004 and additive chat 009 strategy | data | Planner plus data owner | 4 | T-011 | Approved baseline-ledger/repair strategy plus mandatory expand-contract chat design | Fresh and existing targets are unambiguous; old and new Workers remain compatible; destructive legacy-table retirement is outside this release | Rehearsal design review and SQL/Worker dependency graph | standard | yes |
| T-013 | P1 / W1.2 / product-release-contracts | Freeze environment, resource identity, and rollout modes | infra | Backend executor / Copilot or Engineer | 3 | T-008 | Test/staging/production Worker, D1, KV, queue, DO, API URL, secret, payment-kill-switch, and authorized-operator matrix | Placeholder/stale resource names cannot deploy; test/live secrets cannot cross; config errors close charge creation; in-flight settlement stays online | Config tests, binding-name audit, wrong-target refusal, and target confirmation | standard | yes |
| T-014 | P1 / W1.2 / product-release-contracts | Freeze mobile booking and checkout boundary | frontend | Mobile executor / Codex | 3 | T-009, T-010 | Mobile state, CTA, navigation, chat, QR, and retry contract | Pending cannot pay/chat; confirmed can pay; only verified paid renders paid | Cross-layer contract tests | standard | no |
| T-015 | P1 / W1.2 / product-release-contracts | Freeze reviewer fixture and clean-seed provenance | product | Planner plus human release owner | 3 | T-009, T-011 | Review-account, guide, experience, unpaid, paid, SQL seed, migration, import, CMS, mock, wiki/RAG, notification, source hash, cache-invalidation, and generation-date specification | Paid fixture requires a real verified provider charge; no bypass exists; adult or companionship data is cleansed at ingestion and persisted caches, never hidden only in UI | End-to-end provenance checklist, prohibited-source/data assertion, cache purge proof design, and provider-receipt requirement | standard | no |
| T-016 | P1 / W1.2 / integration-contracts | Approve shared contract packet | product | Planner / noesisX | 2 | T-010, T-012, T-013, T-014, T-015 | Signed-off contract packet `tirak-payments-v1` plus blocker-to-ingestion-control crosswalk | Every blocker has an earliest enforcement point, owner, negative test, and evidence artifact; planner, executors, validator, and human owner accept the boundary | Contract and causal-control checklist with zero unknown enforcement locations or drift | standard | yes |
| T-017 | P1 / W1.3 / orchestration-scaffold | Design GitHub milestone and issue map | product | Planner / noesisX | 2 | T-016 | Milestones, labels, issue bodies, dependencies, and wave summaries | All 80 tasks map deterministically without creating issues yet | Mapping-schema validation | standard | no |
| T-018 | P1 / W1.3 / orchestration-scaffold | Generate branch and worktree manifest | infra | Planner / noesisX | 2 | T-016 | Unique VCS mapping for every implementation task | No two tasks share a branch or worktree | Duplicate and path-collision probe | standard | no |
| T-019 | P1 / W1.3 / orchestration-scaffold | Publish lock-zone ownership ledger | product | Planner / noesisX | 2 | T-016 | Serialized owners and handoff order for shared files | Every lock-zone edit has one active owner per wave | Ownership matrix inspection | standard | no |
| T-020 | P1 / W1.3 / validation-scaffold | Establish mobile CI release gate | qa | Validation reviewer / Gemini or reviewer | 4 | T-003, T-014, T-016 | Reproducible mobile test, type, prohibited-source/output copy, route/deep-link, Expo export/config, dependency, and build-hash checks | Gate fails on unsafe source or built copy, contract drift, route exposure, environment mismatch, type errors, tests, or artifact-hash drift | CI dry run on baseline SHA with negative fixtures and built-artifact scan | standard | yes |
| T-021 | P1 / W1.3 / validation-scaffold | Establish fail-closed backend CI, deploy, backup, and migration gate | qa | Validation reviewer / Gemini or reviewer | 6 | T-006, T-012, T-013, T-016 | Correct script names, explicit environment/database targets, hard failure propagation, local restorable-backup proof, and target-aware migration checks | Injected command, test, health, target, migration, and restore failures exit nonzero; no raw directory replay or stale target remains | CI dry run, deliberate failure matrix, shell audit, SQLite/D1 disposable fixture, and local restore rehearsal | standard | yes |
| T-022 | P1 / W1.3 / validation-scaffold | Publish wave evidence matrix | qa | Validation reviewer / Gemini or reviewer | 3 | T-016, T-021 | Required automated, log, screenshot, metric, rollback proof, and verified producer per wave | Every task and wave names evidence and its trusted producing command or tool before launch | Matrix coverage and tool-provenance audit against T-001–T-080 | standard | no |
| T-023 | P1 / W1.3 / orchestration-scaffold | Generate worker bootstrap packet templates | product | Planner / noesisX | 4 | T-017, T-018, T-019, T-022 | Shared contract packet, executor packets, validation brief, forbidden-fix list, and handoff template | Packets prohibit raw `004` replay, destructive `009`, legacy fail-open scripts, UI-only seed hiding, serializer-only refund fixes, and edits outside owned zones | Packet completeness and prohibited-pattern checklist | standard | no |
| T-024 | P1 / W1.3 / integration-gate | Close Phase 1 readiness gate | qa | Release integrator / noesisX | 2 | T-020, T-021, T-023 | Phase 2 fan-out verdict and approved no-deploy integration baseline | Immutable baselines, blocker ledger, ingestion controls, contracts, negative CI gates, ownership, packets, and human approval all pass; only then may GitHub/worktrees/staging begin | Wave-close checklist, independent review, and human approval | standard | yes |
| T-025 | P2 / W2.1 / data-migration | Resolve staging resource identities and ledger | data | Data owner / backend executor | 2 | T-024 | Human-confirmed Worker, D1, KV, R2, queue/DLQ, Durable Object, account, storage version, migration ledger, and row-count manifest with corrected `wrangler.toml` | Placeholder or mismatched resource identity refuses execution; operator proves every command targets staging, never production | Wrangler metadata, config read-back, wrong-target refusal, and signed manifest | standard | no |
| T-026 | P2 / W2.1 / data-migration | Capture and restore staging recovery point | data | Human release owner plus data owner | 2 | T-025 | Time Travel bookmark or complete export with corrected target and executable restore instructions | Recovery artifact is timestamped and restoration is proven on a disposable rehearsal database or approved empty staging clone; active staging is never overwritten for proof | `d1 info`, Time Travel/export, disposable restore, checksums, and row-count evidence | standard | no |
| T-027 | P2 / W2.1 / data-migration | Inspect staging booking, payment, and chat schema | data | Data owner / backend executor | 3 | T-025 | Actual `table_info`, indexes, foreign keys, and migration ledger comparison | Every precondition for `008` and `009` is classified pass/fail | Read-only SQL output checked against T-011 | standard | no |
| T-028 | P2 / W2.1 / data-migration | Implement approved migration lineage and additive chat expansion | data | Data owner / backend executor | 6 | T-012, T-027 | Target-aware `004` baseline or repair plus safe additive `009` and restitution-ledger artifact | `004` lineage is deterministic and rehearsal-reversible; existing data remains intact; old and new Workers remain compatible; restitution uniqueness and permissions enforce the frozen contract | Fresh/existing schema, restored-backup replay, idempotency, permission, and dual-Worker compatibility tests | standard | yes |
| T-029 | P2 / W2.1 / data-migration | Rehearse migration 008 | data | Data owner / backend executor | 4 | T-026, T-028 | Payment attempt and webhook event tables on rehearsal target | Tables, indexes, constraints, and ledger entry match contract | Schema assertions and foreign-key check | standard | yes |
| T-030 | P2 / W2.1 / data-migration | Rehearse additive migration 009 | data | Data owner / backend executor | 4 | T-029 | Booking-scoped chat tables beside intact legacy pair tables | No ambiguous legacy history is copied; eligible bookings create one room; old Worker reads and writes remain safe during compatibility window | Schema, legacy-preservation, dual-Worker, uniqueness, and row-count probes | standard | yes |
| T-031 | P2 / W2.1 / migration-validation | Validate migration integrity and recovery | qa | Validation reviewer / isolated reviewer | 4 | T-030 | Independent migration and restore report | Foreign keys, indexes, row counts, ledger, and restore procedure pass | Independent SQL probes and restore rehearsal | standard | no |
| T-032 | P2 / W2.1 / integration-gate | Approve staging migration go/no-go | qa | Release integrator / noesisX | 2 | T-031 | Signed migration decision with abort triggers | Zero unexplained schema drift or unrecoverable operation remains | Wave-close evidence review | standard | yes |
| T-033 | P2 / W2.2 / cloud-config | Implement payment environment-mode and kill-switch guard | backend | Backend executor / Copilot or Engineer | 4 | T-013, T-024 | Fail-closed disabled/test/live handling, audited operator toggle, and in-flight settlement behavior | Missing or mismatched mode cannot create a charge; disabling creation preserves webhook, status, reconciliation, and stale-attempt ownership | Unit, route, config, concurrent-request, and operator-toggle tests | standard | yes |
| T-034 | P2 / W2.2 / cloud-config | Provision staging Omise test secrets | infra | Human release owner | 1 | T-033, T-032 | Cloudflare staging secrets and secret inventory without values | Test keys and webhook secret exist only in staging secret storage | Secret listing metadata and repository secret scan | standard | yes |
| T-035 | P2 / W2.2 / cloud-config | Register staging webhook endpoint | infra | Human release owner plus backend executor | 1 | T-034 | HTTPS staging webhook registered in Omise test mode | Endpoint and webhook secret environment match | Dashboard screenshot and signed delivery log | standard | no |
| T-036 | P2 / W2.2 / cloud-config | Deploy baseline Worker to staging | infra | Backend executor / Copilot or Engineer | 3 | T-032, T-033, T-034 | Versioned staging Worker deployment and bindings manifest | Health, auth, booking, chat, and payment routes answer from expected version | Deployment ID, health probes, route smoke logs | standard | yes |
| T-037 | P2 / W2.2 / payment-e2e | Execute staging PromptPay happy path | qa | Validation reviewer plus human payer | 4 | T-035, T-036 | Confirmed booking, charge, QR, webhook, retrieved success, and paid booking evidence | One provider charge maps to one attempt and one paid booking | API logs, provider charge, D1 rows, screenshots | standard | no |
| T-038 | P2 / W2.2 / payment-e2e | Execute failure, cancellation, kill-switch, and recovery matrix | qa | Validation reviewer / Gemini or reviewer | 5 | T-037 | Failed, expired, duplicate, tampered, replayed, delayed, stranded-creating, cancelled-active-QR, indeterminate, and under-load kill-switch scenarios | No false paid/refunded state, orphan, or duplicate charge; new creation stops while in-flight settlement continues; exact recovery requires metadata/source/livemode match | Adversarial logs, concurrent-request probe, and cross-table state snapshots | standard | no |
| T-039 | P2 / W2.3 / telemetry | Add structured payment and webhook telemetry | backend | Backend executor / Copilot or Engineer | 5 | T-036 | Redacted events for charge create/reuse, webhook verify/process, reconcile, mismatch, and recovery | Events contain correlation IDs and no secrets or sensitive payment data | Unit tests, log sample, redaction scan | standard | no |
| T-040 | P2 / W2.3 / telemetry | Define dashboards and alert thresholds | infra | Backend executor plus validation reviewer | 4 | T-039 | Dashboards and alerts for failure rate, webhook lag, indeterminate age, mismatch, and D1 errors | Each severe condition has owner, threshold, and response link | Synthetic alert tests and dashboard screenshots | standard | no |
| T-041 | P2 / W2.3 / financial-operations | Implement scheduled reconciliation and stale-attempt leasing | backend | Backend executor / Copilot or Engineer | 5 | T-038, T-039 | Idempotent job/report for provider/local mismatch, failed webhooks, aged pending/indeterminate, and stale `creating` attempts | Job cannot create charges; stale work becomes recoverable and every comparison includes metadata/source/livemode | Fixture tests, scheduled-run log, and sample report | standard | no |
| T-042 | P2 / W2.3 / financial-operations | Write indeterminate recovery runbook | product | Operations owner / planner | 4 | T-038, T-041 | Detection, provider lookup, authenticated recovery, escalation, and closure steps | Runbook never creates a new charge before exact outcome resolution | Tabletop exercise with evidence checklist | standard | no |
| T-043 | P2 / W2.3 / financial-operations | Implement cancellation interlock and restitution operations | backend | Backend executor plus product owner | 6 | T-037, T-041 | Active-QR cancellation guard, exceptional-success handling, authoritative restitution-ledger workflow, and manual off-Omise procedure | Reconciliation cannot silently pay a cancelled booking; cancellation never claims refund; role permissions and uniqueness prevent duplicate restitution; customers receive an owned resolution path | State-race, permission, duplicate-restitution, and tabletop restitution tests | standard | no |
| T-044 | P2 / W2.3 / integration-gate | Close staging backend and operations gate | qa | Release integrator / noesisX | 2 | T-032, T-038, T-040, T-042, T-043 | Phase 3 readiness verdict | Migration, payment, telemetry, support, and rollback evidence pass | Wave-close checklist and independent review | standard | yes |
| T-045 | P3 / W3.1 / mobile-config | Configure EAS staging environment | frontend | Mobile executor / Codex | 2 | T-024, T-044 | Internal-build profile using staging API URL and non-secret config | Build points to exact staging Worker and exposes no secret | Config inspection and runtime endpoint proof | standard | yes |
| T-046 | P3 / W3.1 / mobile-workflows | Verify mobile payment API contract | frontend | Mobile executor / Codex | 4 | T-014, T-045 | Client integration tests against staging response and error shapes | Request sends only booking ID/method and handles every frozen state | Jest contract tests and staging API capture | standard | no |
| T-047 | P3 / W3.1 / mobile-workflows | Harden checkout lifecycle UI | frontend | Mobile executor / Codex | 4 | T-010, T-046 | Pending, processing, paid, failed, expired, retry, and recovery-safe screens | UI never self-declares success and prevents duplicate actions | Component tests and screen recordings | standard | no |
| T-048 | P3 / W3.1 / mobile-workflows | Validate booking-scoped iOS WebSocket chat | frontend | Mobile executor / Codex | 4 | T-014, T-036 | Authenticated real-time logistics chat on a confirmed booking | Bearer authentication, event mapping, echo suppression, and booking access pass | Device logs and backend event trace | standard | no |
| T-049 | P3 / W3.1 / mobile-workflows | Harden accessibility, localization, privacy, and failure copy | frontend | Mobile executor / Codex | 4 | T-047 | English/Thai accessible payment states plus checkout telemetry exclusions | VoiceOver, contrast, dynamic type, travel-only wording pass; Sentry replay/default PII and PostHog do not capture payment screens | Accessibility/locale tests, tracker instrumentation probe, screenshots | standard | no |
| T-050 | P3 / W3.1 / mobile-config | Produce signed internal EAS build | infra | Mobile executor plus human release owner | 3 | T-045, T-046, T-047, T-048, T-049 | Versioned iOS internal-distribution build and artifact manifest | Build SHA, API environment, bundle ID, version, and evidence are traceable | EAS build logs and artifact metadata | standard | yes |
| T-051 | P3 / W3.2 / device-matrix | Run iPhone reviewer journey | qa | Validation reviewer / QATester | 3 | T-050 | iPhone screenshots and step-by-step result | Explore through booking, confirmation, QR, paid state, chat, report/support all pass | Device video, screenshots, network logs | standard | no |
| T-052 | P3 / W3.2 / device-matrix | Run iPad Air reviewer journey | qa | Validation reviewer / QATester | 3 | T-050 | iPad Air 11-inch presentation evidence | No clipped, stretched, empty, or misleading screen across reviewer flow | Device/simulator screenshots and assertions | standard | no |
| T-053 | P3 / W3.2 / device-matrix | Validate PromptPay banking handoff workflow | qa | Validation reviewer plus human payer | 4 | T-050, T-037 | Same-device screenshot/import and second-device scan instructions/evidence | QR is readable, expiry is clear, and return/refresh reaches verified status | Banking-app test notes, QR image proof, provider receipt | standard | no |
| T-054 | P3 / W3.2 / resilience | Test mobile interruption and abuse cases | qa | Validation reviewer / Gemini or reviewer | 4 | T-050 | Backgrounding, offline, timeout, duplicate tap, token expiry, and stale QR report | Booking remains safe, retry is explicit, and no duplicate charge appears | Device automation, API logs, D1/provider comparison | standard | no |
| T-055 | P3 / W3.2 / integration-gate | Close signed-device validation gate | qa | Release integrator / noesisX | 2 | T-051, T-052, T-053, T-054 | Device gate verdict and defect ledger | All critical flows pass or block Phase 4 | Evidence index and zero-critical-finding review | standard | yes |
| T-056 | P3 / W3.3 / review-data | Create stable review guide and experiences | data | Product data owner / human plus backend executor | 4 | T-015, T-044 | Review account, guide profile, and named itinerary listings | Listings include route, meeting point, duration, inclusions, exclusions, total, cancellation, and credentials | Read-only API snapshots and copy scan | standard | no |
| T-057 | P3 / W3.3 / review-data | Create confirmed-unpaid reviewer booking | data | Product data owner / human | 2 | T-056 | Future-dated guide-confirmed unpaid booking | Payment CTA is available; booking has no paid status or chat ambiguity | API response, D1 record, mobile screenshot | standard | no |
| T-058 | P3 / W3.3 / review-data | Create legitimately paid reviewer booking | data | Human release owner plus validation reviewer | 3 | T-056, T-037 | Small-value booking paid through Omise and independently verified | Provider receipt, local attempt, and booking paid state all match; no manual status edit | Omise charge, webhook/retrieval logs, D1/mobile proof | standard | no |
| T-059 | P3 / W3.3 / content-review | Audit and harden every live distribution surface | product | Content reviewer / planner plus human | 8 | T-055, T-056 | Audit/fixes for app copy, i18n, `seed-data.sql`, public categories, supplier routes, deep links, CMS, email, push, async booking-state rechecks, support, ADRs, legal, privacy, wiki, and screenshots | Zero reachable retired/private/companionship signal remains; main Tirak runtime/content/data isolation is explicit | Automated scans, role/deep-link crawl, live screenshots, endpoint and seed captures | standard | yes |
| T-060 | P3 / W3.3 / content-review | Assemble App Review evidence packet | product | Planner / noesisX | 3 | T-057, T-058, T-059 | Credentials, booking IDs, reviewer script, navigation path, explanation, and support contact | Reviewer can inspect unpaid QR and verified paid states without a bypass | Dry-run by independent reviewer | standard | no |
| T-061 | P4 / W4.1 / security | Run secret, dependency, and checkout-tracking audit | qa | Validation reviewer / security reviewer | 5 | T-044, T-050 | Secret scan, dependency findings, key-rotation readiness, and payment-screen tracker proof | No keys in code/artifacts/logs/source maps; critical advisories resolve; replay/default PII/analytics remain absent from checkout | Secret scanner, dependency audit, bundle and instrumentation inspection | standard | no |
| T-062 | P4 / W4.1 / security | Adversarially test auth, ownership, and rate limits | qa | Validation reviewer / security reviewer | 5 | T-044, T-050 | Cross-user booking/payment/chat attack report | Unauthorized creation, retrieval, recovery, chat, and transitions fail safely | API adversarial suite and logs | standard | no |
| T-063 | P4 / W4.1 / security | Drill webhook tamper, replay, and rotation | qa | Validation reviewer / security reviewer | 4 | T-038 | Live-like signature rotation and replay report | Mutated, malformed, stale, future, wrong-secret events fail; valid rotation succeeds | Raw-body signed fixtures and event ledger | standard | no |
| T-064 | P4 / W4.1 / financial-integrity | Drill reconciliation and restitution operations | qa | Validation reviewer plus operations owner | 4 | T-041, T-042, T-043 | Tabletop, consecutive scheduled shadow runs, and staging execution of mismatch, indeterminate, and off-Omise restitution-ledger cases | Multiple scheduled cycles reconcile provider, attempt, booking, and restitution ledgers; terminal restitution closes the alert without rewriting provider truth or allowing duplicates | Timed drill, scheduled-run reports, and provider/local/restitution before-after evidence | standard | no |
| T-065 | P4 / W4.1 / security | Verify privacy and log redaction | qa | Validation reviewer / privacy reviewer | 3 | T-039, T-059 | Data-flow and log-redaction report | Secrets, raw card fields, auth tokens, sensitive chat, and unnecessary PII are absent | Log sampling, source scan, privacy checklist | standard | no |
| T-066 | P4 / W4.1 / integration-gate | Close security and financial signoff | qa | Release integrator plus human owner | 2 | T-061, T-062, T-063, T-064, T-065 | Signed security/financial go-no-go | No critical finding or unowned severe residual risk remains | Independent findings review | standard | yes |
| T-067 | P4 / W4.2 / release-gate | Freeze release version and commit manifest | product | Release integrator / noesisX | 2 | T-055, T-060, T-066 | Exact mobile, backend, wiki SHAs, build/version, environment, and evidence index | Every artifact derives from reviewed commits and environments | SHA, build metadata, deployment ID verification | standard | yes |
| T-068 | P4 / W4.2 / store-assets | Produce final App Store screenshots and metadata | product | Content reviewer plus designer/human | 5 | T-059, T-067 | iPhone/iPad screenshots, captions, description, subtitle, keywords, and review notes | Experience imagery dominates; all copy matches exact archive and live data | Screenshot comparison and prohibited-language scan | standard | yes |
| T-069 | P4 / W4.2 / store-assets | Finalize category, age, privacy, legal, and support fields | product | Human release owner plus planner | 3 | T-068 | Completed App Store field matrix and reachable support/legal URLs | Travel category, privacy answers, age rating, and policies match runtime behavior | Field-by-field review and URL probes | standard | no |
| T-070 | P4 / W4.2 / release-gate | Run exact release-candidate regression | qa | Validation reviewer / QATester | 5 | T-067 | Full automated, iPhone, iPad, payment, chat, moderation, and interruption evidence | No critical regression and all reviewer-script steps pass on exact archive | CI, device recordings, API/provider/D1 logs | standard | no |
| T-071 | P4 / W4.2 / store-assets | Finalize App Review reply and review notes | product | Planner plus human release owner | 3 | T-060, T-068, T-069, T-070 | Concise acknowledgment, structural changes, credentials, and exact test path | Every claim is demonstrable in the submitted binary and backend | Independent claim-to-evidence audit | standard | no |
| T-072 | P4 / W4.2 / integration-gate | Hold production and submission go/no-go | product | Human release owner plus release integrator | 2 | T-066, T-071 | Signed decision, window, owners, abort thresholds, and communication plan | All Phase 4 gates pass and production authority is explicit | Go/no-go checklist and approvals | standard | yes |
| T-073 | P5 / W5.1 / data-cutover | Open cutover bridge and capture production recovery point | infra | Human release owner plus data owner | 2 | T-072 | Incident channel, owner roster, D1 identity, Time Travel bookmark/export, active-attempt inventory, and baseline metrics | Correct target and restore command are recorded; no restore is authorized after new payment writes until reconciliation and forward-repair review | Read-only D1/Worker/payment evidence and approval | standard | yes |
| T-074 | P5 / W5.1 / data-cutover | Apply approved production migration set | data | Data owner / backend executor | 3 | T-073 | Target-specific baseline or repair plus `008`, additive `009`, restitution ledger, and post-migration schema | Exact production preconditions match the rehearsed path; each approved step applies once; legacy chat tables remain intact; dual-Worker compatibility, foreign keys, indexes, permissions, and row counts pass | D1 migration output, checksums, legacy-write probe, and independent read-only SQL verification | standard | yes |
| T-075 | P5 / W5.1 / worker-cutover | Deploy production Worker disabled, then configure live webhook | infra | Backend executor plus human release owner | 3 | T-074 | Versioned Worker with new charges disabled, live secrets, live webhook, and config manifest | Health/auth/booking/chat/status/webhook/reconciliation work while charge creation remains closed | Deployment ID, dashboard evidence, signed webhook and disabled-create smoke | standard | yes |
| T-076 | P5 / W5.1 / worker-cutover | Enable controlled production charge and create review fixtures | qa | Validation reviewer plus release integrator | 2 | T-075 | Controlled enablement, clean production review account and experience, separate confirmed-unpaid booking, and one small legitimately paid booking | Future dates, source hashes, provider receipt, local ledgers, and mobile states match; no telemetry spike, duplicate, auth/schema error, manual paid edit, or prohibited seed exists | Provider/local/restitution records, fixture provenance, content scan, logs, alerts, and mobile result | standard | no |
| T-077 | P5 / W5.2 / submission | Build, device-validate, and submit exact production archive | infra | Human release owner plus mobile executor | 6 | T-076 | EAS production archive uploaded to TestFlight, exact-build iPhone/iPad reviewer evidence, then same build submitted in App Store Connect | Archive SHA, version, API environment, production fixture IDs, iPhone flow, and iPad Air presentation match T-067 and T-076; only that validated build enters review | EAS/TestFlight/App Store metadata, artifact hash, device recordings, and production API/provider/D1 traces | standard | yes |
| T-078 | P5 / W5.2 / submission | Monitor App Review and respond with evidence | product | Human release owner plus planner | 2 | T-077 | Review-status log and evidence-backed responses | Any reviewer question is answered without changing product claims or bypassing flow | App Store correspondence record | standard | no |
| T-079 | P5 / W5.2 / monitoring | Run 72-hour payment and platform watch | qa | Operations owner plus validation reviewer | 4 | T-076, T-077 | Payment reconciliation, webhook lag, Worker/D1 errors, mobile crashes, and support report | Thresholds remain green or rollback/escalation triggers execute | Dashboards, alerts, reconciliation reports, crash data | standard | no |
| T-080 | P5 / W5.2 / monitoring | Close rollout and preserve operational handoff | product | Release integrator / noesisX | 3 | T-078, T-079 | Final manifest, issue/PR closure, residual risks, rollback references, runbooks, and retrospective | Every task has evidence and owner; unresolved work becomes explicit follow-up | Full graph audit and human signoff | standard | yes |

## 8. Dependency Rationale

1. **Baseline before branches:** uncommitted validated work cannot be the implicit parent of eighty worker tasks. `T-008` creates a recoverable, reviewable baseline before worktrees exist.
2. **Contracts before parallel build:** mobile and backend previously passed independently while disagreeing on payment states and WebSocket envelopes. `T-016` freezes shared seams before separate executors launch.
3. **Actual schema before migration:** legacy migration `004` proves filenames are not a trustworthy model of target D1. `T-025` through `T-032` inspect and rehearse before staging mutation is accepted.
4. **Staging operations before mobile release:** PromptPay is asynchronous. Webhooks, recovery, telemetry, and support procedures must work before a signed mobile build is treated as release-ready.
5. **Legitimate fixtures before App Review:** the paid reviewer state must originate from an independently verified charge, never a database edit or hidden bypass.
6. **Security before archive freeze:** secrets, ownership, replay, reconciliation, and privacy findings can invalidate screenshots, metadata, and review claims.
7. **Schema cutover before Worker enablement:** Worker code may depend on new tables; migrations apply first under a recovery point, then the matching Worker version deploys.
8. **Worker smoke before archive submission:** App Review must reach the exact production backend throughout review.

### Parallel execution windows

- After `T-008`, mobile/backend/wiki contract analysis can run in parallel on disjoint surfaces.
- After `T-016`, orchestration and CI scaffolding can run in parallel.
- In Phase 2, payment cloud configuration can prepare alongside migration validation but cannot deploy until `T-032` passes.
- In Phase 3, iPhone and iPad testing can run concurrently against the same immutable build; resilience tests use separate bookings/attempts.
- In Phase 4, store assets can prepare while security tests run, but final metadata and archive freeze depend on both.
- Production migrations, Worker deployment, smoke testing, and submission are deliberately serialized.

## 9. Verification Strategy

### Task gate

Every issue must attach at least one named proof: automated tests, command logs, screenshots/video, schema output, metrics/alerts, provider records, CI status, or diff validation. “Implemented” without evidence is not a completion state.

### Wave gates

| Wave | Required proof |
| --- | --- |
| W1.1 | Baseline tests, typechecks, builds, diff inventory, three SHAs, exclusions |
| W1.2 | API/state/schema/env/mobile/fixture contracts and cross-layer tests |
| W1.3 | CI dry runs, issue/VCS/lock manifests, worker packets, evidence coverage |
| W2.1 | D1 identity, recovery point, schema preflight, migration/restore rehearsal |
| W2.2 | Staging deploy, QR, signed webhook, provider retrieval, failure/recovery matrix |
| W2.3 | Redacted telemetry, alert simulations, reconciliation, support/refund drills |
| W3.1 | Signed internal build, environment proof, client contract and chat traces |
| W3.2 | iPhone/iPad recordings, banking workflow, interruption/duplicate tests |
| W3.3 | Reviewer fixtures with provenance, live-content audit, evidence packet dry run |
| W4.1 | Secret/auth/replay/financial/privacy adversarial reports with zero criticals |
| W4.2 | Exact RC regression, store artifact parity, final claims audit, go/no-go |
| W5.1 | Production recovery point, migration ledger, Worker version, live smoke |
| W5.2 | App Store upload, review log, 72-hour dashboards/reconciliation, closeout |

### Machine task-graph probe

The Markdown table is validated by a read-only Node probe that checks exactly 80 task rows, twelve populated columns, unique IDs, resolved dependencies, and dependency order. A task depending only on earlier IDs proves acyclicity for this graph.

### Release pass/fail rule

- **PASS:** every upstream task accepted, evidence attached, zero unresolved contract drift, zero critical security/compliance finding, and human authority recorded.
- **CONDITIONAL:** only non-critical, owned, time-bounded risks remain; release owner explicitly accepts them.
- **FAIL:** missing recovery proof, unknown production schema, credential/environment ambiguity, false payment success, duplicate charge, unverified paid fixture, critical content regression, or exact-archive device failure.

## 10. GitHub Synchronization and Dispatch Strategy

Planning does not mutate GitHub. After `T-024` and human approval:

1. Create one milestone per phase and one tracking issue per wave.
2. Create one issue per task using title `[P#][W#.#][swarm] T-### — title`.
3. Apply `phase:*`, `wave:*`, `swarm:*`, `area:*`, `agent:*`, and `status:*` labels.
4. Copy task deliverable, acceptance, validation, dependencies, branch, worktree, lock zone, and allowed edit surface into each issue.
5. Mark tasks `ready` only when all hard dependencies are `done` and their evidence links exist.
6. Dispatch only dependency-ready tasks with disjoint ownership in the same batch.
7. Every PR references its task, wave, upstream contract version, lock-zone files, and evidence.
8. Post a wave-start comment with baseline and goals; post a wave-close comment with completed/deferred tasks, evidence, drift, residual risk, and next-wave decision.
9. Merge accepted branches into the wave integration branch only at wave close.
10. Delete merged worktrees after the closeout manifest confirms no unpushed changes.

## 11. Worker Bootstrap and Handoff Strategy

Before any fresh CLI worker launches, `T-023` produces:

- `handoff/shared/project-brief.md` — product boundary and current phase/wave.
- `handoff/shared/contracts.md` — frozen API, states, schema, env, UI, and evidence.
- `handoff/shared/validation-gate.md` — exact pass/fail evidence.
- `handoff/mobile/{task}-bootstrap.md` — mobile-owned paths and prohibited backend/lock zones.
- `handoff/backend/{task}-bootstrap.md` — Worker/D1/Omise-owned paths and prohibited mobile/lock zones.
- `handoff/validation/{task}-brief.md` — completion claim, attack surface, evidence, and pass/conditional/fail output.
- `handoff/{task}-completion.md` — files changed, checks run, contract drift, residual risk, and next dependency.

Each worker must receive:

1. role, task ID, issue, branch, and worktree;
2. objective and explicit non-goals;
3. owned and forbidden file surfaces;
4. frozen contract version;
5. expected deliverable and validation evidence;
6. escalation rule for contract or lock-zone changes;
7. clean handback format.

## 12. Risks and Fallback Plan

| Risk | Trigger | Prevention | Fallback |
| --- | --- | --- | --- |
| Validated local work is lost or mixed | Worktrees launch before baseline SHAs | T-001–T-008 exclusive stabilization | Stop dispatch, preserve patches, reconstruct only from reviewed diff/evidence |
| Production D1 differs from assumptions | Missing columns, ledger mismatch, alpha storage, unexpected rows | Read-only target preflight and recovery artifact | Abort migration; build target-specific repair plan; do not force generic chain |
| Legacy `004` remains ambiguous | Fresh/existing rehearsal produces divergent schemas | T-012 and T-028 decision plus tests | Freeze deploy; establish explicit baseline ledger or forward-only repair migration |
| Worker rollback is schema-incompatible | Old Worker cannot read renamed/migrated tables | Additive expand-contract only; retain legacy chat tables throughout this release | Prefer forward fix or compatibility Worker; destructive retirement requires a later approved migration after old versions are gone |
| Deployment automation reports false success | Invalid script names, tolerated failures, stale DB targets, or raw SQL replay | T-021 replaces fail-open scripts and T-025 proves resource identity | Stop automation; run only reviewed explicit commands against confirmed environment |
| Omise PromptPay is not enabled | Merchant dashboard cannot create PromptPay source/charge | Confirm enablement in contract phase | Block live rollout; do not substitute another rail inside this release |
| Test/live credentials cross | Livemode mismatch or unexpected live charge | Environment guard, separate secrets, mode telemetry | Disable payments, rotate keys, reconcile all affected attempts |
| Webhook is delayed or rejected | Lag alert, signature failures, missing event | Status GET, signature tests, alerting | Retrieve exact charge, run authenticated recovery, escalate persistent delivery issues |
| Charge outcome is ambiguous | Provider timeout/5xx after create request | Booking-bound active attempt and `indeterminate` state | Block retry; locate exact provider charge; recover only after full match |
| Duplicate charge | Multiple provider IDs for one active booking | Idempotency contract and duplicate-tap tests | Disable checkout, reconcile, refund duplicate under runbook, preserve evidence |
| Paid cancellation cannot be refunded through Omise | Active QR succeeds after booking cancellation | Cancellation interlock, short expiry, exceptional-success and restitution policy | Stop ordinary cancellation/payment enablement; resolve customer restitution outside Omise with auditable evidence |
| Reviewer cannot complete same-device QR flow | Banking app cannot scan on-screen QR | Screenshot/import guidance and second-device testing | Provide separate legitimately paid booking; never ship a payment bypass |
| Apple still sees companionship framing | Live CMS, screenshots, notification, or route contains retired language | T-059 binary-wide live audit and exact-RC parity | Withdraw/reject build, correct source and artifact, regenerate archive and evidence |
| Reviewer backend changes mid-review | Deployment or fixture expiry after submission | Freeze reviewed Worker/version/data and monitor | Restore stable version/data, notify App Review only with factual evidence |
| Secret or PII leakage | Scanner, log, bundle, or screenshot finding | Secret storage, redaction tests, evidence review | Disable payment, rotate credentials, purge exposed artifacts, investigate scope |
| Checkout tracking captures sensitive context | Sentry replay/default PII or PostHog remains active on payment screens | T-049 and T-061 tracker exclusion probes | Disable tracking/replay on checkout, purge captured sessions where possible, re-audit build |
| App Store rejection repeats | Reviewer cites a specific screen or flow | Evidence-backed reply and reachable script | Capture exact finding, block resubmission, add targeted criterion and regression test |

## 13. Definition of Done

This planning artifact is complete when:

- discovery, assumptions, constraints, ownership, phases, waves, and swarms are explicit;
- exactly 80 schema-complete tasks have unique owners and resolvable dependencies;
- baseline stabilization and contract freeze precede all parallel implementation;
- every wave has validation evidence and a go/no-go owner;
- GitHub and worker dispatch strategies are defined without unauthorized mutation;
- migration, payment, App Review, device, observability, rollback, and support risks have specific controls;
- a machine graph probe and independent advisor review pass.
