---
task: "Execute the Tirak Omise production and App Store rollout"
slug: 20260718-160132_tirak-apple-omise-realignment
project: Tirak
effort: comprehensive
effort_source: auto
phase: execute
progress: 128/204
mode: interactive
iteration: 3
started: 2026-07-18T10:31:32Z
updated: 2026-07-20T14:02:43Z
---

## Problem

Apple rejected Tirak 1.0.0 under Guideline 1.1.4 because the reviewed product appeared to facilitate compensated dating or companionship. The current repository now describes a travel marketplace in top-level metadata, but the shipped application, backend contract, mocks, route names, translation keys, and source wiki retain the earlier companion-first ontology: person-first browsing, a `private` category, cash paid directly to a person, profile-led chat, "date" fixtures, and language about monetized human connection.

The payment surface is also incomplete. The booking wizard skips its payment step, the live checkout copy says payment is direct cash to the guide, and the backend's legacy payment-method endpoint accepts raw card details even though no real processor is connected. Tirak needs one coherent travel-only model plus a safe Omise integration that anchors every payment to a named guided experience and never lets raw card data touch Tirak infrastructure.

## Vision

An App Reviewer can open Tirak and immediately understand one product: travelers discover specific guided cultural experiences in Thailand, request an itinerary from a verified local guide, pay Tirak for that booked real-world travel service, coordinate only trip logistics, then review the completed experience. No path, phrase, image, fixture, category, or payment behavior invites a companionship interpretation.

For travelers, the flow feels calmer because it answers "what am I booking?" before "who is leading it?" The euphoric surprise is that removing the ambiguous companion layer makes the booking experience both more compliant and more useful: the guide becomes evidence of expertise, while the itinerary remains the purchasable product.

## Out of Scope

- The main Tirak app does not offer adult, romantic, dating, escort, hookup, nightlife-hostess, or compensated-companionship services.
- The main Tirak app does not include a `private` service category, even when "private" could mean a one-party tour; safer terms are "small-group" or "custom itinerary."
- The main Tirak app does not sell open-ended access to a person, unstructured hangouts, gifts, tips, or pay-by-the-hour companionship.
- Tirak Plus or any separately governed adult/private product is not linked, promoted, deep-linked, or discoverable from the main app.
- This iteration does not implement guide payouts, marketplace split settlements, saved cards, subscriptions, Apple Pay, or Google Pay.
- Production secrets and live Omise charging are not configured until the environment, migration, reconciliation, rollback, and human go/no gates pass.
- This iteration does not rename every internal database column in one destructive migration; public language and new contracts move to `guide` / `experience` while compatibility is preserved deliberately.

## Principles

- The thing being purchased is a bounded guided travel experience, never a person's company.
- Product structure communicates intent more strongly than a rebuttal letter; flow, data, copy, media, and payments must all tell the same story.
- Every paid booking identifies an experience, itinerary, date, duration, public meeting point, price, and cancellation terms.
- Chat is a logistics tool attached to a booking or experience inquiry, not a social-discovery surface.
- The server is authoritative for booking ownership, amount, currency, and payment status.
- Raw card numbers and CVC values never pass through Tirak servers, logs, analytics, queues, or databases.
- Payment completion is established by Omise verification, not by trusting the mobile client or an unverified webhook body.
- Compatibility aliases may remain internally during migration, but App Store-facing strings and seed data may not expose the retired model.
- A missing credential produces a clear unavailable state; it never degrades to fake payment success.

## Constraints

- The mobile app remains Expo SDK 53 with Expo Router and React Native 0.79.
- The API remains a Hono Cloudflare Worker backed by D1, queues, R2, KV, and Durable Objects.
- Apple Guideline 1.1.4 and Guideline 1.2 moderation controls are hard product constraints.
- Apple permits external payment methods for physical goods or services consumed outside the app under Guideline 3.1.3(e); Tirak checkout must remain scoped to real-world guided experiences.
- Omise secret keys and webhook secrets live only in Cloudflare Worker secrets.
- Omise public keys may be embedded in clients only for token/source creation.
- Amounts sent to Omise use integer currency subunits.
- PromptPay completion is asynchronous and must be confirmed through a verified `charge.complete` flow or an authenticated charge retrieval.
- Existing uncommitted user files under `.agents/` and `.playwright-mcp/` must not be overwritten or reverted.
- Production deployment and App Store submission remain blocked until `T-072` records explicit human go/no authority; this execution request authorizes the ordered preparatory repository, GitHub, staging, and validation work.

## Goal

Produce an evidence-backed App Store remediation and product-flow orientation, remove the main app's reachable private/compensated-companionship signals, and implement a test-first Omise PromptPay checkout foundation across the Expo client and Cloudflare backend. The resulting code must bind charges to authenticated bookings, derive amounts server-side, keep secrets server-side, verify asynchronous completion, and expose no false-success path.

For the production-planning iteration, produce an execution-ready Swarm Architect plan that safely promotes the validated local foundation through baseline stabilization, contract freeze, staging, payment operations, mobile and device validation, App Store evidence, production cutover, and monitored rollback. The plan must be decomposed into exactly 80 schema-complete tasks with explicit ownership, dependencies, collision boundaries, and proof requirements.

For the execution iteration, complete `T-001` through `T-080` in dependency order and record tool-verifiable evidence for each task. Completion means the exact production archive uses the verified production backend and fixtures, survives iPhone/iPad reviewer flows, is submitted with an evidence-backed Guideline 1.1.4 response, and remains healthy through the monitored closeout window.

## Criteria

### Product and Apple-risk audit

- [x] ISC-1: The remediation document names the reviewed App Store submission ID `e9ae59e6-a4df-4ac8-b003-87e9ff9ab523`.
- [x] ISC-2: The remediation document maps the rejection to Apple Guideline 1.1.4.
- [x] ISC-3: The remediation document distinguishes copy risk from structural flow risk.
- [x] ISC-4: The remediation document lists every reachable traveler flow in sequence.
- [x] ISC-5: The remediation document lists every reachable guide flow in sequence.
- [x] ISC-6: The remediation document identifies the source wiki as a conflicting source of truth.
- [x] ISC-7: The remediation document explains why person-first discovery implies compensated companionship.
- [x] ISC-8: The remediation document explains why direct cash language amplifies Apple risk.
- [x] ISC-9: The remediation document provides a reviewer test script for the resubmitted build.
- [x] ISC-10: The remediation document provides a concise App Review reply draft.

### Travel-only ontology

- [DEFERRED-VERIFY: TIRAK-IOS-QA-1] ISC-11: Anti: the traveler home screen contains no `private` category entry.
- [x] ISC-12: Anti: English traveler-facing translations contain no category label keyed as `private`.
- [x] ISC-13: Anti: Thai traveler-facing translations contain no category label keyed as `private`.
- [x] ISC-14: Anti: production-reachable source contains no "Evening Dinner Date" fixture.
- [x] ISC-15: Anti: booking summary contains no "Paid in cash directly to your guide" copy.
- [x] ISC-16: Anti: legal copy does not disclaim direct payment disputes between traveler and guide.
- [DEFERRED-VERIFY: TIRAK-IOS-QA-1] ISC-17: Home discovery labels verified people as `Local guides`.
- [DEFERRED-VERIFY: TIRAK-IOS-QA-1] ISC-18: Home commerce labels listings as `Guided experiences`.
- [DEFERRED-VERIFY: TIRAK-IOS-QA-1] ISC-19: Profile CTA names the selected guided experience before booking begins.
- [DEFERRED-VERIFY: TIRAK-IOS-QA-1] ISC-20: Booking summary labels the priced item `Guided experience`.
- [DEFERRED-VERIFY: TIRAK-IOS-QA-1] ISC-21: Booking confirmation labels the price `Experience total`.
- [DEFERRED-VERIFY: TIRAK-IOS-QA-1] ISC-22: Booking chat guidance limits conversation to itinerary logistics.
- [DEFERRED-VERIFY: TIRAK-IOS-QA-1] ISC-23: Public meeting-point language remains present in booking.
- [x] ISC-24: App metadata retains the primary category `Travel`.
- [x] ISC-25: The app description explicitly excludes dating and companionship services.
- [x] ISC-26: The retired `assets/images/private.png` asset is not referenced by app code.

### Coherent booking flow

- [DEFERRED-VERIFY: TIRAK-IOS-QA-1] ISC-27: Antecedent: a traveler selects a concrete experience before selecting payment.
- [DEFERRED-VERIFY: TIRAK-IOS-QA-1] ISC-28: Booking request creation completes before any Omise charge is created.
- [DEFERRED-VERIFY: TIRAK-IOS-QA-1] ISC-29: Payment UI is available only for a persisted booking identifier.
- [DEFERRED-VERIFY: TIRAK-IOS-QA-1] ISC-29.1: Payment UI is available only when booking status is `confirmed`.
- [DEFERRED-VERIFY: TIRAK-IOS-QA-1] ISC-30: Payment UI names the booked experience.
- [DEFERRED-VERIFY: TIRAK-IOS-QA-1] ISC-31: Payment UI displays the server-authoritative THB total.
- [DEFERRED-VERIFY: TIRAK-IOS-QA-1] ISC-32: Booking confirmation distinguishes `requested` from `paid` status.
- [DEFERRED-VERIFY: TIRAK-IOS-QA-1] ISC-33: A payment failure leaves the booking intact for retry.
- [x] ISC-34: A duplicate payment action cannot create a second local payment attempt for the same active booking.

### Omise backend safety

- [x] ISC-35: Backend environment typing includes `OMISE_SECRET_KEY` without a default value.
- [x] ISC-36: Backend environment typing includes `OMISE_WEBHOOK_SECRET` without a default value.
- [x] ISC-37: Anti: backend request schemas accept no raw card number field.
- [x] ISC-38: Anti: backend request schemas accept no CVC or CVV field.
- [x] ISC-39: `POST /api/payments/charges` requires authentication.
- [x] ISC-40: `POST /api/payments/charges` accepts a booking ID.
- [x] ISC-41: `POST /api/payments/charges` rejects unsupported payment methods.
- [x] ISC-42: `POST /api/payments/charges` reads amount from the booking row.
- [x] ISC-43: `POST /api/payments/charges` verifies the booking belongs to the authenticated traveler.
- [x] ISC-44: `POST /api/payments/charges` rejects cancelled bookings.
- [x] ISC-45: `POST /api/payments/charges` rejects already-paid bookings.
- [x] ISC-46: PromptPay charge creation sends integer satang to Omise.
- [x] ISC-47: PromptPay charge creation sends `currency=thb` to Omise.
- [x] ISC-48: PromptPay charge metadata includes the Tirak booking ID.
- [x] ISC-49: Omise Basic authentication is derived from the Worker secret at request time.
- [x] ISC-50: Omise network failure returns a non-success API envelope.
- [x] ISC-51: Missing Omise configuration returns HTTP 503.
- [x] ISC-52: The API response exposes the Omise charge ID.
- [x] ISC-53: The API response exposes the PromptPay QR image URI.
- [x] ISC-54: The API response never exposes the Omise secret key.
- [x] ISC-55: Payment attempt rows persist booking ID plus Omise charge ID.
- [x] ISC-56: Payment attempt rows persist `pending` before customer authorization.
- [x] ISC-57: `GET /api/payments/charges/:id` requires authentication.
- [x] ISC-58: Charge status retrieval verifies ownership through the booking.
- [x] ISC-59: Charge status retrieval reconciles against Omise before returning `paid`.
- [x] ISC-60: Payment reconciliation updates the booking payment status to `completed` only for a successful Omise charge.

### Webhook and data integrity

- [x] ISC-61: `POST /api/payments/webhooks/omise` is reachable without Tirak JWT authentication.
- [x] ISC-62: Webhook verification uses the raw request body.
- [x] ISC-63: Webhook verification reads `Omise-Signature`.
- [x] ISC-64: Webhook verification reads `Omise-Signature-Timestamp`.
- [x] ISC-65: Webhook verification rejects timestamps outside the replay window.
- [x] ISC-66: Webhook verification uses HMAC-SHA256.
- [x] ISC-67: Webhook completion retrieves the charge from Omise before changing local status.
- [x] ISC-68: A verified failed charge persists `failed` without marking the booking paid.
- [x] ISC-69: Replayed completion events leave an already-final payment unchanged.

### Mobile checkout and verification

- [DEFERRED-VERIFY: TIRAK-IOS-QA-1] ISC-70: The Expo client can request a PromptPay charge for a booking.
- [DEFERRED-VERIFY: TIRAK-IOS-QA-1] ISC-71: The PromptPay screen renders the returned QR image URI.
- [x] ISC-72: Automated tests cover the payment happy path plus at least one authorization failure.

### Release-blocking adversarial probes

- [x] ISC-73: Exactly 1,000 THB is converted once to exactly 100,000 satang for Omise.
- [x] ISC-74: Retrying charge creation with the same booking returns the active attempt without creating a second Omise charge.
- [x] ISC-75: Charge creation rejects cancelled, completed, declined, and expired bookings.
- [x] ISC-76: Expired or failed PromptPay attempts leave the booking unpaid and eligible for an explicit retry.
- [x] ISC-77: The PromptPay API cannot purchase a supplier subscription or any digital feature unlock.
- [DEFERRED-VERIFY: TIRAK-LIVE-CONTENT-AUDIT-1] ISC-78: The release audit covers app copy, i18n, mocks, App Store metadata, screenshots, review notes, wiki, and notification/email copy.
- [x] ISC-79: Webhook reconciliation ignores webhook-declared payment status and trusts only the independently retrieved Omise charge.
- [DEFERRED-VERIFY: TIRAK-IOS-QA-1] ISC-80: Chat initiation is unavailable before a booking exists and is limited to itinerary logistics.
- [x] ISC-81: The canonical wiki states that Tirak sells named guided experiences rather than time, company, dates, or human connection.

### Production integration swarm plan

- [x] ISC-82: A durable production-integration plan exists under `docs/plans/`.
- [x] ISC-83: The plan records a deeply detailed production-hardening discovery profile.
- [x] ISC-84: The plan separates confirmed facts from stated assumptions.
- [x] ISC-85: The plan records mobile, backend, wiki, vendor, platform, and authorization constraints.
- [x] ISC-86: The plan defines planner, mobile, backend, validation, and release ownership.
- [x] ISC-87: The plan identifies shared-file lock zones and their serialized owners.
- [x] ISC-88: The plan contains a top-level phase map with explicit exit gates.
- [x] ISC-89: Phase 1 contains at least three waves.
- [x] ISC-90: Every wave contains at least two single-concern swarms.
- [x] ISC-91: The plan contains exactly 80 stable task IDs.
- [x] ISC-92: Every task contains every required field from the Swarm Architect task schema.
- [x] ISC-93: Every task ID is unique.
- [x] ISC-94: Every declared task dependency resolves to an existing task ID.
- [x] ISC-95: The task dependency graph contains no cycle.
- [x] ISC-96: Anti: no parallel implementation wave begins before contract freeze passes.
- [x] ISC-97: The frozen contract packet defines payment API request and response shapes.
- [x] ISC-98: The frozen contract packet defines D1 payment and chat schema expectations.
- [x] ISC-99: The frozen contract packet defines Cloudflare and Expo environment expectations.
- [x] ISC-100: The frozen contract packet defines mobile booking, checkout, and chat boundaries.
- [x] ISC-101: Validation evidence is named before each build or rollout wave starts.
- [x] ISC-102: Implementation tasks map to one owner, branch, and worktree.
- [x] ISC-103: The first wave blocks new worktrees until current dirty changes become an approved baseline.
- [x] ISC-104: The plan contains a dedicated resolution gate for legacy migration `004`.
- [x] ISC-105: The migration wave records D1 Time Travel or equivalent rollback evidence before writes.
- [x] ISC-106: Test and live Omise credentials remain separated and never enter Git history.
- [x] ISC-107: The plan includes dashboard webhook configuration plus signed delivery verification.
- [x] ISC-108: The plan includes an operator runbook for `indeterminate` payment recovery.
- [x] ISC-109: The plan defines payment, webhook, database, and mobile observability signals.
- [x] ISC-110: The plan creates confirmed-unpaid and legitimately paid reviewer bookings without a bypass.
- [x] ISC-111: The plan audits App Store Connect, screenshots, CMS, email, push, support, privacy, and legal surfaces.
- [x] ISC-112: The plan validates the exact signed archive on iPhone and iPad presentation.
- [x] ISC-113: The plan contains explicit deploy, abort, Worker rollback, and D1 recovery criteria.
- [x] ISC-114: GitHub issue synchronization is specified without mutating GitHub during planning.
- [x] ISC-115: Fresh worker sessions receive shared-contract, bootstrap, validation, and handoff packets.
- [x] ISC-116: The plan contains risk triggers and specific fallback actions.
- [x] ISC-117: Anti: the plan does not broaden checkout beyond bounded real-world guided experiences.
- [x] ISC-118: Anti: no plan task restores private, dating, adult, escort, or companionship surfaces.
- [x] ISC-119: Anti: guide payouts, split settlements, saved cards, subscriptions, Apple Pay, and Google Pay remain out of scope.
- [x] ISC-120: The plan cites current primary Apple, Omise, and Cloudflare guidance.
- [x] ISC-121: A machine probe validates task count, required fields, dependencies, and acyclicity.
- [x] ISC-122: An independent advisor challenges the dependency and release sequencing.
- [x] ISC-123: ReReadCheck confirms the delivered artifact is a detailed plan for this integration.

### Production plan execution

- [x] ISC-124: `T-001` mobile integration diff inventory passes its frozen acceptance and validation fields.
- [x] ISC-125: `T-002` mobile baseline proof passes its frozen acceptance and validation fields.
- [x] ISC-126: `T-003` mobile baseline commit passes its frozen acceptance and validation fields.
- [x] ISC-127: `T-004` backend integration diff inventory passes its frozen acceptance and validation fields.
- [x] ISC-128: `T-005` backend and migration baseline proof passes its frozen acceptance and validation fields.
- [x] ISC-129: `T-006` backend baseline commit passes its frozen acceptance and validation fields.
- [x] ISC-130: `T-007` canonical wiki baseline passes its frozen acceptance and validation fields.
- [x] ISC-131: `T-008` cross-repository baseline manifest passes its frozen acceptance and validation fields.
- [x] ISC-132: `T-009` payment HTTP and route contract passes its frozen acceptance and validation fields.
- [x] ISC-133: `T-010` payment and cancellation state mapping passes its frozen acceptance and validation fields.
- [x] ISC-134: `T-011` target D1 schema contract passes its frozen acceptance and validation fields.
- [x] ISC-135: `T-012` legacy migration strategy passes its frozen acceptance and validation fields.
- [x] ISC-136: `T-013` environment and rollout-mode contract passes its frozen acceptance and validation fields.
- [x] ISC-137: `T-014` mobile checkout boundary passes its frozen acceptance and validation fields.
- [x] ISC-138: `T-015` reviewer fixture and clean-seed provenance passes its frozen acceptance and validation fields.
- [x] ISC-139: `T-016` shared contract packet approval passes its frozen acceptance and validation fields.
- [x] ISC-140: `T-017` GitHub milestone and issue map passes its frozen acceptance and validation fields.
- [x] ISC-141: `T-018` branch and worktree manifest passes its frozen acceptance and validation fields.
- [x] ISC-142: `T-019` lock-zone ownership ledger passes its frozen acceptance and validation fields.
- [x] ISC-143: `T-020` mobile CI release gate passes its frozen acceptance and validation fields.
- [x] ISC-144: `T-021` fail-closed backend delivery gate passes its frozen acceptance and validation fields.
- [x] ISC-145: `T-022` wave evidence matrix passes its frozen acceptance and validation fields.
- [x] ISC-146: `T-023` worker bootstrap packets pass their frozen acceptance and validation fields.
- [x] ISC-147: `T-024` Phase 1 readiness gate passes its frozen acceptance and validation fields.
- [ ] ISC-148: `T-025` staging D1 identity ledger passes its frozen acceptance and validation fields.
- [ ] ISC-149: `T-026` staging recovery point passes its frozen acceptance and validation fields.
- [ ] ISC-150: `T-027` staging schema inspection passes its frozen acceptance and validation fields.
- [ ] ISC-151: `T-028` migration lineage and chat expansion pass their frozen acceptance and validation fields.
- [ ] ISC-152: `T-029` migration 008 rehearsal passes its frozen acceptance and validation fields.
- [ ] ISC-153: `T-030` additive migration 009 rehearsal passes its frozen acceptance and validation fields.
- [ ] ISC-154: `T-031` migration integrity and recovery validation passes its frozen acceptance and validation fields.
- [ ] ISC-155: `T-032` staging migration go/no-go passes its frozen acceptance and validation fields.
- [ ] ISC-156: `T-033` payment environment and kill-switch guard passes its frozen acceptance and validation fields.
- [ ] ISC-157: `T-034` staging Omise secret provisioning passes its frozen acceptance and validation fields.
- [ ] ISC-158: `T-035` staging webhook registration passes its frozen acceptance and validation fields.
- [ ] ISC-159: `T-036` staging Worker deployment passes its frozen acceptance and validation fields.
- [ ] ISC-160: `T-037` staging PromptPay happy path passes its frozen acceptance and validation fields.
- [ ] ISC-161: `T-038` failure, cancellation, kill-switch, and recovery matrix passes its frozen acceptance and validation fields.
- [ ] ISC-162: `T-039` payment and webhook telemetry passes its frozen acceptance and validation fields.
- [ ] ISC-163: `T-040` dashboards and alert thresholds pass their frozen acceptance and validation fields.
- [ ] ISC-164: `T-041` scheduled reconciliation and stale-attempt leasing pass their frozen acceptance and validation fields.
- [ ] ISC-165: `T-042` indeterminate recovery runbook passes its frozen acceptance and validation fields.
- [ ] ISC-166: `T-043` cancellation interlock and restitution operations pass their frozen acceptance and validation fields.
- [ ] ISC-167: `T-044` staging backend and operations gate passes its frozen acceptance and validation fields.
- [ ] ISC-168: `T-045` EAS staging environment passes its frozen acceptance and validation fields.
- [ ] ISC-169: `T-046` mobile payment API contract passes its frozen acceptance and validation fields.
- [ ] ISC-170: `T-047` checkout lifecycle UI passes its frozen acceptance and validation fields.
- [ ] ISC-171: `T-048` booking-scoped iOS WebSocket chat passes its frozen acceptance and validation fields.
- [ ] ISC-172: `T-049` accessibility, localization, privacy, and failure copy pass their frozen acceptance and validation fields.
- [ ] ISC-173: `T-050` signed internal EAS build passes its frozen acceptance and validation fields.
- [ ] ISC-174: `T-051` iPhone reviewer journey passes its frozen acceptance and validation fields.
- [ ] ISC-175: `T-052` iPad Air reviewer journey passes its frozen acceptance and validation fields.
- [ ] ISC-176: `T-053` PromptPay banking handoff passes its frozen acceptance and validation fields.
- [ ] ISC-177: `T-054` mobile interruption and abuse matrix passes its frozen acceptance and validation fields.
- [ ] ISC-178: `T-055` signed-device validation gate passes its frozen acceptance and validation fields.
- [ ] ISC-179: `T-056` least-privilege reviewer account and fixture set pass their frozen acceptance and validation fields.
- [ ] ISC-180: `T-057` confirmed-unpaid reviewer booking passes its frozen acceptance and validation fields.
- [ ] ISC-181: `T-058` legitimately paid reviewer booking passes its frozen acceptance and validation fields.
- [ ] ISC-182: `T-059` live distribution-surface audit passes its frozen acceptance and validation fields.
- [ ] ISC-183: `T-060` App Review evidence packet passes its frozen acceptance and validation fields.
- [ ] ISC-184: `T-061` secret, dependency, and checkout-tracking audit passes its frozen acceptance and validation fields.
- [ ] ISC-185: `T-062` auth, ownership, and rate-limit adversarial test passes its frozen acceptance and validation fields.
- [ ] ISC-186: `T-063` webhook tamper, replay, and rotation drill passes its frozen acceptance and validation fields.
- [ ] ISC-187: `T-064` reconciliation and restitution drill passes its frozen acceptance and validation fields.
- [ ] ISC-188: `T-065` privacy and log-redaction verification passes its frozen acceptance and validation fields.
- [ ] ISC-189: `T-066` security and financial signoff passes its frozen acceptance and validation fields.
- [ ] ISC-190: `T-067` release version and commit manifest pass their frozen acceptance and validation fields.
- [ ] ISC-191: `T-068` App Store screenshots and metadata pass their frozen acceptance and validation fields.
- [ ] ISC-192: `T-069` category, age, privacy, legal, and support fields pass their frozen acceptance and validation fields.
- [ ] ISC-193: `T-070` exact release-candidate regression passes its frozen acceptance and validation fields.
- [ ] ISC-194: `T-071` App Review reply and review notes pass their frozen acceptance and validation fields.
- [ ] ISC-195: `T-072` production and submission go/no-go passes its frozen acceptance and validation fields.
- [ ] ISC-196: `T-073` cutover bridge and production recovery point pass their frozen acceptance and validation fields.
- [ ] ISC-197: `T-074` approved production migration set passes its frozen acceptance and validation fields.
- [ ] ISC-198: `T-075` disabled production Worker and live webhook pass their frozen acceptance and validation fields.
- [ ] ISC-199: `T-076` controlled production charge and reviewer fixtures pass their frozen acceptance and validation fields.
- [ ] ISC-200: `T-077` exact production archive device-validation and submission pass their frozen acceptance and validation fields.
- [ ] ISC-201: `T-078` App Review monitoring and evidence responses pass their frozen acceptance and validation fields.
- [ ] ISC-202: `T-079` seventy-two-hour payment and platform watch passes its frozen acceptance and validation fields.
- [ ] ISC-203: `T-080` rollout closeout and operational handoff pass their frozen acceptance and validation fields.

## Test Strategy

| ISC | Type | Check | Threshold | Tool |
| --- | --- | --- | --- | --- |
| ISC-1–10 | document audit | required rejection, flow, reply, and reviewer-script sections | 10/10 present | `rg` against remediation markdown |
| ISC-11–16 | anti-copy audit | retired category plus compensated-companionship phrases absent from shipping surfaces | zero matches in named files | `rg -n -i` |
| ISC-17–25 | copy contract | travel-specific labels exist in rendered-source strings | one expected match per criterion | Jest plus `rg` |
| ISC-26 | asset reference | private image has no source references | zero references | `rg` |
| ISC-27–34 | booking flow | persisted booking precedes checkout with retry-safe behavior | integration tests pass | Jest |
| ISC-35–38 | secret/card boundary | env types exist; raw card schema fields absent | four binary probes pass | TypeScript plus `rg` |
| ISC-39–60 | payment API | authenticated server-authoritative charge lifecycle | route test suite passes | Vitest with fake Omise fetch |
| ISC-61–69 | webhook integrity | signature, replay, retrieval, idempotency behavior | webhook test suite passes | Vitest plus Web Crypto |
| ISC-70–72 | mobile integration | client request, QR render, failure branch | Jest suite passes | Jest / React Native Testing Library |
| ISC-73–81 | adversarial release gate | minor units, idempotency, state, rail separation, content reach, payload trust | 9/9 probes pass | Vitest, Jest, `rg`, manual artifact audit |
| ISC-82–90 | plan structure | required sections, phases, waves, swarms, and discovery profile exist | all structural checks pass | Markdown parser plus `rg` |
| ISC-91–95 | task graph | count, schema fields, unique IDs, resolved dependencies, and acyclicity | exactly 80 valid tasks | Node validation script |
| ISC-96–101 | contract-first gate | API, schema, env, UI, and evidence contracts precede parallel build | freeze wave precedes build waves | plan dependency audit |
| ISC-102–109 | delivery safety | ownership, baseline, migrations, credentials, webhook, recovery, and telemetry are explicit | all eight controls present | plan parser plus inspection |
| ISC-110–116 | release operations | reviewer fixtures, content/device audits, rollback, GitHub, bootstraps, and fallback are explicit | all seven controls present | plan parser plus inspection |
| ISC-117–120 | scope and sources | prohibited scope absent and primary guidance cited | four of four pass | `rg` plus link audit |
| ISC-121–123 | final validation | machine validator, advisor review, and re-read complete | three of three pass | Node, advisor, ReReadCheck |
| ISC-124–203 | plan execution | each frozen `T-001`–`T-080` row has direct task evidence and a passing wave gate | 80/80 task rows pass | repository commands, CI, Cloudflare, Omise, EAS, device, App Store, and human approvals |

## Features

```yaml
- name: AppStoreRiskAudit
  description: Evidence-backed mapping from Apple rejection to current flow, source copy, and resubmission guidance
  satisfies: [ISC-1, ISC-2, ISC-3, ISC-4, ISC-5, ISC-6, ISC-7, ISC-8, ISC-9, ISC-10]
  depends_on: []
  parallelizable: true

- name: TravelOnlyOntology
  description: Remove retired private and compensated-companionship signals from user-facing app surfaces
  satisfies: [ISC-11, ISC-12, ISC-13, ISC-14, ISC-15, ISC-16, ISC-17, ISC-18, ISC-19, ISC-20, ISC-21, ISC-22, ISC-23, ISC-24, ISC-25, ISC-26]
  depends_on: [AppStoreRiskAudit]
  parallelizable: false

- name: BookingPaymentStateMachine
  description: Persist booking request before checkout and preserve retry-safe payment state
  satisfies: [ISC-27, ISC-28, ISC-29, ISC-29.1, ISC-30, ISC-31, ISC-32, ISC-33, ISC-34]
  depends_on: [TravelOnlyOntology]
  parallelizable: false

- name: OmiseWorkerIntegration
  description: Server-authoritative PromptPay charge creation, persistence, retrieval, and reconciliation
  satisfies: [ISC-35, ISC-36, ISC-37, ISC-38, ISC-39, ISC-40, ISC-41, ISC-42, ISC-43, ISC-44, ISC-45, ISC-46, ISC-47, ISC-48, ISC-49, ISC-50, ISC-51, ISC-52, ISC-53, ISC-54, ISC-55, ISC-56, ISC-57, ISC-58, ISC-59, ISC-60]
  depends_on: [BookingPaymentStateMachine]
  parallelizable: true

- name: OmiseWebhookIntegrity
  description: Signature-verified asynchronous completion with independent Omise retrieval and idempotent updates
  satisfies: [ISC-61, ISC-62, ISC-63, ISC-64, ISC-65, ISC-66, ISC-67, ISC-68, ISC-69]
  depends_on: [OmiseWorkerIntegration]
  parallelizable: false

- name: PromptPayMobileCheckout
  description: Authenticated booking-bound charge request plus QR presentation and status refresh
  satisfies: [ISC-70, ISC-71, ISC-72]
  depends_on: [OmiseWorkerIntegration]
  parallelizable: false

- name: ProductionIntegrationPlan
  description: Contract-first phase, wave, swarm, task, ownership, and dependency plan for safe production rollout
  satisfies: [ISC-82, ISC-83, ISC-84, ISC-85, ISC-86, ISC-87, ISC-88, ISC-89, ISC-90, ISC-91, ISC-92, ISC-93, ISC-94, ISC-95, ISC-96, ISC-97, ISC-98, ISC-99, ISC-100, ISC-101, ISC-102, ISC-103, ISC-104, ISC-105, ISC-106, ISC-107, ISC-108, ISC-109, ISC-110, ISC-111, ISC-112, ISC-113, ISC-114, ISC-115, ISC-116, ISC-117, ISC-118, ISC-119, ISC-120, ISC-121, ISC-122, ISC-123]
  depends_on: [AppStoreRiskAudit, TravelOnlyOntology, BookingPaymentStateMachine, OmiseWorkerIntegration, OmiseWebhookIntegrity, PromptPayMobileCheckout]
  parallelizable: false

- name: ProductionExecutionPhase1
  description: Preserve baselines, freeze contracts, and establish trusted delivery scaffolding
  satisfies: [ISC-124, ISC-125, ISC-126, ISC-127, ISC-128, ISC-129, ISC-130, ISC-131, ISC-132, ISC-133, ISC-134, ISC-135, ISC-136, ISC-137, ISC-138, ISC-139, ISC-140, ISC-141, ISC-142, ISC-143, ISC-144, ISC-145, ISC-146, ISC-147]
  depends_on: [ProductionIntegrationPlan]
  parallelizable: false

- name: ProductionExecutionPhase2
  description: Prove staging data, Omise, telemetry, reconciliation, and financial operations
  satisfies: [ISC-148, ISC-149, ISC-150, ISC-151, ISC-152, ISC-153, ISC-154, ISC-155, ISC-156, ISC-157, ISC-158, ISC-159, ISC-160, ISC-161, ISC-162, ISC-163, ISC-164, ISC-165, ISC-166, ISC-167]
  depends_on: [ProductionExecutionPhase1]
  parallelizable: false

- name: ProductionExecutionPhase3
  description: Validate mobile, devices, reviewer fixtures, content, and evidence
  satisfies: [ISC-168, ISC-169, ISC-170, ISC-171, ISC-172, ISC-173, ISC-174, ISC-175, ISC-176, ISC-177, ISC-178, ISC-179, ISC-180, ISC-181, ISC-182, ISC-183]
  depends_on: [ProductionExecutionPhase2]
  parallelizable: false

- name: ProductionExecutionPhase4
  description: Close security, privacy, financial, release-candidate, and App Review gates
  satisfies: [ISC-184, ISC-185, ISC-186, ISC-187, ISC-188, ISC-189, ISC-190, ISC-191, ISC-192, ISC-193, ISC-194, ISC-195]
  depends_on: [ProductionExecutionPhase3]
  parallelizable: false

- name: ProductionExecutionPhase5
  description: Perform authorized production cutover, exact archive submission, monitoring, and handoff
  satisfies: [ISC-196, ISC-197, ISC-198, ISC-199, ISC-200, ISC-201, ISC-202, ISC-203]
  depends_on: [ProductionExecutionPhase4]
  parallelizable: false
```

## Decisions

- 2026-07-18 16:01: E4 was selected because the task crosses product semantics, App Store safety, Expo UX, Cloudflare API design, payment security, and two persistent repositories.
- 2026-07-18 16:01: The E4 soft floor of 128 ISCs is intentionally undercut at 73. The current deliverable has 73 nameable binary probes; manufacturing 55 additional probes would reduce signal without changing the safety or completion boundary.
- 2026-07-18 16:01: PromptPay is the first mobile payment method because Omise documents a complete client/server asynchronous flow for Thailand without exposing card data. Card charging remains backend-token-ready only after an official/native client tokenization path is chosen.
- 2026-07-18 16:01: Payment follows booking persistence and guide confirmation. Charging before acceptance may require refunding an unavailable experience, so pending requests expose neither payment nor chat.
- 2026-07-18 16:01: Internal `companion` compatibility names are not all destructively renamed in this iteration. User-facing ontology, seed content, new payment contracts, and review evidence are the compliance boundary; a separate schema migration can remove internal aliases safely.
- 2026-07-18 16:09: refined: ISC-29 split into persisted-booking existence and ISC-29.1 confirmed-booking eligibility. A real itinerary must be accepted before Tirak asks the traveler to pay.
- 2026-07-18 16:18: Advisor review added ISC-73–81 for exact satang conversion, create idempotency, terminal states, digital-purchase rail separation, distribution-surface copy, webhook payload distrust, booking-scoped chat, and canonical wiki truth.
- 2026-07-18 18:32: refined: The second iteration plans production promotion rather than further local feature expansion. Swarm Architect governs an exactly 80-task contract-first rollout, while deployment, GitHub mutation, secret configuration, and App Store submission remain execution-time actions requiring explicit authority.
- 2026-07-19 02:23: refined: The third iteration executes the frozen eighty-task plan. Repository, GitHub, staging, and validation actions are in scope; production cutover and App Store submission remain blocked until the explicit `T-072` human go/no gate.
- 2026-07-19 02:23: E5 was selected because achieving the whole plan spans three repositories, Cloudflare, Omise, EAS, Apple review, production money movement, device proof, and a seventy-two-hour monitoring window. The 204 natural ISCs remain below the 256 soft floor because each new execution criterion maps exactly to one frozen task row rather than manufacturing duplicate probes.
- 2026-07-19 02:24: The mandatory E5 Interview workflow inspected all twelve sections and produced an empty question queue; existing user instructions and the frozen plan already populate every section beyond the thin threshold.
- 2026-07-19 02:40: Root-cause analysis located five ingestion failures that Phase 1 must close before fanout: provenance was added after multi-repository edits, migrations `001` and `004` encode incompatible lineage, deploy and backup tooling can report false success, seed/import paths still admit companionship categories, and booking cancellation is not coupled to payment restitution.
- 2026-07-19 02:40: ❌ DEAD END: Tried an interpolated secret scanner chained to branch creation — regex escaping failed and the shell continued without fail-fast, creating branches before that invocation’s scan; no commit occurred, and separate corrected scans passed. Do not chain safety gates without explicit failure control.

## Changelog

- 2026-07-18 | conjectured: Rewriting visible labels to "Local Guide" and "Guided Experience" would be sufficient to resolve the Apple rejection
  refuted by: repository audit found a reachable private category, direct-cash payment language, person-first routes, date-themed fixtures, and a companion-first source wiki despite safe top-level metadata
  learned: Apple-risk is generated by the whole product system; copy changes cannot counteract a flow that still sells access to a person
  criterion now: ISC-3 plus ISC-11–34 require structural flow, ontology, and payment changes rather than a rebuttal-only resubmission

- 2026-07-18 | conjectured: Creating an Omise charge immediately after persisting a booking request would be an acceptable checkout sequence
  refuted by: the guide can still decline or be unavailable, forcing refunds while presenting payment as compensation before a concrete itinerary is accepted
  learned: payment eligibility is a booking-state transition, not merely the presence of a booking identifier
  criterion now: ISC-29.1 requires `confirmed` status before payment UI becomes available

- 2026-07-18 | conjectured: Idempotent webhook reconciliation alone prevents duplicate payment attempts
  refuted by: a client retry after a charge-creation network timeout can create a second Omise source and charge before any webhook is processed
  learned: idempotency must exist at both charge creation and asynchronous reconciliation boundaries
  criterion now: ISC-74 requires a stable booking-bound active attempt to be returned on retry without a second provider call

- 2026-07-18 | conjectured: Independently green mobile and backend suites prove their shared booking and chat contracts
  refuted by: adversarial re-audit found incompatible paid-state names, WebSocket authentication and envelope shapes, and an optional mobile service identifier despite green layer-specific suites
  learned: cross-layer seams require explicit contract tests in addition to each repository's internal regression suite
  criterion now: ISC-29.1, ISC-32, and ISC-80 are backed by shared normalization, mandatory service assertions, authenticated socket headers, and envelope-mapping probes

- 2026-07-18 | conjectured: The validated local implementation could move directly into ordinary staging promotion
  refuted by: production planning found dirty repository baselines, false-green deploy and backup tooling, legacy migration divergence, a destructive chat cutover, objectionable seed data, cancellation races, and missing exact-archive review proof
  learned: payment promotion starts with provenance, frozen contracts, trusted tools, additive data evolution, financial operations, and evidence gates before deployment
  criterion now: ISC-82–123 define the complete contract-first execution boundary

- 2026-07-19 | conjectured: A manually checked list of baseline hashes was sufficient integrity evidence for the recovery approval gate
  refuted by: the executable verifier initially disagreed with the exclusion aggregate because JavaScript locale collation did not reproduce the original byte-sorted manifest producer
  learned: recovery manifests require a rerunnable fail-closed verifier that reproduces the original byte ordering and rejects every undeclared repository change
  criterion now: ISC-131 includes `npm run release:verify-baseline`, its negative bootstrap proof, and its clean-tree PASS while retaining separate human approval

## Verification

- Mobile: Jest `7/7` suites and `39/39` tests pass; `npx tsc --noEmit` and `git diff --check` pass.
- Backend: Vitest `9/9` files and `157/157` tests pass; `npm run typecheck` and `git diff --check` pass. The inherited parent-tsconfig warning about `astro/tsconfigs/strict` remains non-fatal.
- Omise: focused route suite passes `26/26`, including server-owned amount, `1,000 THB → 100,000 satang`, create idempotency, indeterminate recovery, raw-body HMAC verification, signature rotation, replay control, independently retrieved truth, and failed-event reclaim.
- Booking/chat: traveler self-confirmation is rejected, paid state survives serialization, `serviceId` is mandatory, participants are booking-derived, legacy general conversations and unscoped `/ws` are unmounted, and migration 009 makes rooms booking-unique.
- Migrations: `001_initial_schema.sql + 008_omise_promptpay_payments.sql + 009_booking_scoped_chat.sql` applies with `PRAGMA foreign_key_check` clean. The repository-wide historical chain still stops in `004_mobile_app_features.sql` at missing `companion_id`; production migration remains blocked pending target-schema backup and dry run.
- Wiki: `3/3` allowlist tests pass, the RAG corpus contains exactly four current contract documents, and the Astro build produces 17 pages. Browser QA passed all five defined stories, including 404 for a legacy person-first route.
- Rendered wiki evidence: `tirak-wiki-home-full.png`, `tirak-wiki-product-overview-full.png`, `tirak-wiki-positioning-full.png`, `tirak-wiki-messaging-framework-full.png`, and `tirak-wiki-legacy-companion-persona-404.png` under the task visualization directory.
- Advisor: pre-build and post-build reviews were run. A post-build webhook-secret objection conflicted with the current official Omise documentation; exact Base64-decoded-secret, malformed-signature, rotation, stale, and future-timestamp tests were added and pass.
- Cato: the required role was attempted twice, but this runtime rejected both `Cato` and `cato` as unknown agent types. A separate read-only adversarial verifier was used as fallback; two FAIL cycles identified nine cross-route and cross-layer gaps, and its final re-audit returned PASS after correction.
- Deferred mobile proof: `TIRAK-IOS-QA-1` must validate the exact signed archive on iPhone and iPad-compatible presentation against the reviewer script.
- Deferred live proof: `TIRAK-LIVE-CONTENT-AUDIT-1` must inspect App Store Connect fields, uploaded screenshots, review credentials, remote listings/CMS, push/email templates, support URLs, and privacy/legal endpoints.
- Planning structure (ISC-82–90): `docs/plans/2026-07-18-tirak-omise-production-swarm-plan.md` contains discovery, constraints, ownership, five phases, thirteen waves, serialized lock zones, and at least two swarms per wave.
- Planning graph (ISC-91–95): the final Node probe reports 80 unique sequential tasks, twelve populated fields each, 143 resolved prior-only dependency edges, and an acyclic wave-monotonic graph.
- Frozen contracts (ISC-96–101): the plan freezes API units/routes, booking/payment/restitution states, D1/payment/chat schemas, environment/secret/kill-switch behavior, mobile gates, fixture provenance, and predeclared evidence.
- Delivery safety (ISC-102–109): the plan assigns one owner/branch/worktree per task, blocks workers until baseline approval, serializes D1 writers, repairs legacy `004`, replaces destructive `009` with additive expansion, proves recovery, and defines telemetry/reconciliation/runbooks.
- Release evidence (ISC-110–116): production unpaid/legitimately-paid fixtures, live-surface audits, exact-build iPhone/iPad validation, deploy/abort/rollback criteria, non-mutating GitHub mapping, worker packets, and risk fallbacks are task-gated.
- Scope and authority (ISC-117–120): bounded guided experiences remain the only commerce surface; private/adult/companionship, payouts, saved cards, subscriptions, Apple Pay, and Google Pay remain excluded; primary Apple, Omise, and Cloudflare guidance is cited.
- Independent validation (ISC-121–123): two advisor gates and two SystemsThinking audits challenged the plan; four migration/fixture/archive/restitution defects were corrected; final re-audit returned PASS and ReReadCheck matched the requested filesystem skill, detailed plan, and Omise/App Store integration scope.
- Phase 1 baseline inventory and proof (ISC-124–125, ISC-127–128): mobile Jest 7/7 and TypeScript pass; backend Vitest 9/9 and TypeScript pass; both staged secret scans and diff checks pass; the backend evidence preserves the seven-error historical migration replay plus red seed, tooling, and restitution probes.
- Phase 1 immutable recovery points (ISC-126, ISC-129–130): mobile `3c0ecbf4218992857bc4de180311d8d892205436`, backend `ffadf78200b54d0bc986b5d711184705dc68269c`, and wiki `7b5baee7a7f24f032b12ee6a7bf62a68a97c672e` are local no-deploy commits with verified parent, tree, and binary-diff hashes.
- Phase 1 manifest gate (ISC-131 pending): `docs/execution/phase-1/t-008-cross-repository-baseline-manifest.md` binds all repository identities, evidence/control hashes, fifteen mobile exclusions, deterministic wiki output, and six blocker classes. Human approval is still required and grants no fanout, publication, staging, or deployment authority.
- T-008 pre-approval verification: manifest commit `c1a059f5d7c1c2e804deb3ef38c794b09efae47c`, tree `294f04d989ac1bfef876ccdab11f6c9fcca64076`, and manifest SHA-256 `bb73332e21f4d45493eae89906b895c5e34654293994cb19979203f882251db7` were derived after commit; backend and wiki are clean, and mobile has only the fifteen declared untracked exclusions. ReReadCheck confirms the full rollout remains active while T-008 approval is the current authorized boundary.
- T-008 executable integrity proof: verifier commit `5a4bf9fef3679cb90218fed2b253879be05488b3` adds `npm run release:verify-baseline`; the committed-tree run passes three repository identities and binary diffs, seven evidence/control hashes, the immutable manifest artifact, the 80-task/145-edge graph, fifteen exclusion hashes, and exact repository status. Human approval remains pending.
- T-008 human approval (ISC-131): at `2026-07-19T02:57:19Z`, the human owner explicitly approved the three recovery baselines and immutable manifest while acknowledging that approval does not authorize fanout, staging, or deployment. Local T-009–T-023 work is now authorized; T-024 retains the separate fanout and external-mutation gate.
- T-009–T-013 backend contracts (ISC-132–136): backend commit `b6a418568088e5cb85cf5ba97240ff83b49382ad` freezes four allowed payment routes, explicit satang/THB responses, state/cancellation truth, a disposable-introspected target schema, permission boundaries, target-ledger migration selection, additive booking chat, and fail-closed environment modes. Typecheck and 10/10 files with 186/186 tests pass.
- T-014–T-015 mobile and provenance contracts (ISC-137–138): mobile commit `6f71cb29e973c61348cfaa42b63a45290760ccca` requires `tirak-payments-v1`, rejects ambiguous responses, keeps cancellation distinct from restitution, allows payment/chat only at valid booking states, and scans seven fixture-ingestion surfaces. Typecheck and 8/8 suites with 47/47 tests pass.
- T-016 pre-approval packet (ISC-139 pending): `npm run release:verify-contracts` passes two immutable contract commits, fifteen artifact hashes, eight blocker-to-ingestion controls, and all recorded validation counts. Planner, backend, mobile, and automated validator signoffs pass; explicit human contract acceptance remains required.
- T-016 human approval (ISC-139): at `2026-07-20T13:03:25Z`, the human owner accepted `tirak-payments-v1` as the shared implementation boundary for local T-017–T-023 work and explicitly withheld fanout, GitHub publication, staging, and deployment authority. T-024 remains the separate external-mutation gate.
- T-017–T-023 local delivery scaffolds (ISC-140–146): mobile commit `de61658c4f80df62ebc2eac7aa98a7e1df51ee18` and backend commit `ac2ae8ea3b16de3ff3573d996e3ec67f1cef0aa6` provide the deterministic 80-task issue/VCS map, 114 serialized lock assignments, 80-row evidence matrix, six worker packets, a full Expo release gate with ten deliberate failures, and a backend delivery gate with eight deliberate failures plus disposable recovery. Mobile 47/47 and backend 186/186 tests pass; zero GitHub, worktree, staging, deployment, or external-worker actions occurred.
- T-024 pre-approval packet (ISC-147 pending): `docs/execution/phase-1/t-024-phase1-readiness.md` and its JSON manifest freeze fifteen critical artifacts across the three repositories. The machine verifier confirms all upstream gates and unlaunched state; independent human review and explicit authority expansion remain required.
- T-024 human approval (ISC-147): at `2026-07-20T13:39:45Z`, the human release owner accepted the frozen Phase 1 readiness packet and authorized planned GitHub issue publication, isolated branches/worktrees, and evidence-gated staging-only Phase 2 work beginning at T-025. Production mutation, live Omise charging, App Store submission, and bypassing later human gates remain explicitly prohibited.
- T-024 bounded publication (ISC-147): at `2026-07-20T13:58:48.769Z`, the gated publisher created 58 planned labels, five planned milestones, and 80 task issues in `Sheshiyer/tirak-mobile-app-v2`. Remote read-back found issues `#1` through `#80`; an immediate idempotent rerun reused all 143 objects with zero creations or updates. No push, deployment, production, live Omise, or App Store mutation occurred.
- T-025 staging identity discovery (ISC-148 pending): backend branch `codex/tirak-omise/w2.1/t-025-resolve-staging-resource-identities-and-ledger` at commit `04b4d15ceb18b1b92290195b9ad708e4791c89f8` adds a fail-closed read-only collector, evidence ledger, and ten negative fixtures. Authenticated Wrangler membership does not include pinned account `2c0c96c68f0ee73b6d980054557bca5b`, so discovery halted after one redacted `whoami` query with zero resource, SQL, production, mutation, deployment, secret, or Omise commands. T-025 remains pending human-correct account authentication and fingerprint confirmation; T-026 stays blocked.
- T-024 GitHub publisher proof (ISC-147): the default dry-run reports 58 labels, five milestones, 80 issues, zero API calls, and zero mutations. A stateful fake-GitHub run creates all 143 objects, then reuses every object with zero POST/PATCH operations while preserving an unrelated human label; seven negative fixtures fail closed. No real GitHub mutation was executed by this implementation task.
