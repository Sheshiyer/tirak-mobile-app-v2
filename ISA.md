---
schema: thoughtseed.isa.v1
seed: false
effort: deep
phase: observe
progress: 0/67
mode: algorithm
started: 2026-08-31T18:35:41Z
updated: 2026-08-31T18:35:41Z
generated_by: temperance-hands ready
generated_at: 2026-08-22T10:59:02Z
normalized_at: 2026-08-31T00:00:00Z
project: tirak-mobile-app-v2
active_scope: tirak-mobile-promptpay-phase-1
---

## Problem

The Tirak mobile traveler checkout is cash-only even though the sibling backend repository exposes a frozen `tirak-payments-v1` PromptPay contract. The mobile booking flow currently stores client-calculated payment values, does not carry the booking mutation result reliably across wizard steps, and uses confirmation copy that can blur booking creation, booking confirmation, and payment completion. A careless integration could send client amount/currency, expose PromptPay against a disabled environment, create duplicate charges, leak sensitive data, or treat a rendered QR as paid.

The repository also needs acceptance truth that survives execution: `.planning/` defines phased work, while this ISA defines falsifiable product, safety, evidence, and workflow criteria.

## Vision

A traveler uses Tirak mobile to create a booking, retains cash as a safe choice, and sees PromptPay only in an explicitly authorized environment. The mobile app creates a charge only for an authenticated owned confirmed booking, renders only backend-returned payment facts, and never claims success without server truth. Local iOS Simulator proof is visibly distinguished from provider, staging, and production proof.

Operators can execute the plan from the Tirak mobile Git root, preserve user-owned changes, and verify each criterion without touching Tirak Plus or unrelated supplier/admin surfaces.

## Out of Scope

- Tirak Plus source or planning artifacts.
- `app/supplier/signup/payment.tsx` and every supplier-signup payment mock.
- Admin or companion payment tooling.
- Card, bank transfer, saved payment methods, history, subscription, beneficiary, refund, or restitution UI.
- Changes to the frozen backend contract.
- Omise dashboard operations, secret retrieval, webhook configuration, or provider mutation.
- Staging/production payment enablement during Phase 1 or Phase 2.
- Deployment, merge, release, DNS, or production cutover.
- Hermes/Phloem company-agent delivery and Codex App acting as a Superset execution worker.

## Principles

- `ISA.md` is the acceptance source of truth; `.planning/` is the execution-plan source of truth.
- Server booking and payment facts outrank client estimates and UI events.
- Cash is preserved before PromptPay is expanded.
- Capabilities fail closed outside an exact authorized environment.
- QR display means pending, not paid.
- Test-fixture proof is labeled as test-fixture proof.
- No secret or authorization value appears in code, logs, screenshots, fixtures, summaries, or memory.
- User-owned dirty state is preserved.
- Execution stays inside the writable Tirak mobile Git root.

## Constraints

- Execute lock: Superset plus Claude through OmniRoute for Hands execution; Codex App remains cockpit/babysit.
- Do not install missing GSD agents without separate authorization.
- Phase 1 source edits and end-of-phase Git commits are authorized; merge, deploy, payment enablement, provider activity, and GSD-agent installation still require separate authorization.
- Preserve the pre-existing `ios/Podfile` and `ios/Podfile.lock` changes.
- Mobile charge creation accepts no amount, currency, card, tip, gift, subscription, or beneficiary input.
- Local PromptPay UI requires development mode, exact flag `true`, HTTP loopback host, and port `8787`.
- Staging and production PromptPay creation remain disabled until a human release owner authorizes a bounded acceptance run.
- Phase 1 proves pending checkout only; terminal states and recovery remain Phase 2.

## Goal

Execute and prove the test-first Phase 1 vertical slice for `tirak-mobile-app-v2` where an owned confirmed local-test booking can create one `tirak-payments-v1` PromptPay charge and render its server-issued pending QR, amount, currency, and expiry while cash remains available, no payment success is invented, and local iOS Simulator evidence is captured without a real or staging charge.

## Criteria

### Workspace and scope

- [ ] **ISC-1:** `ISA.md` contains all twelve required sections. Verify: `rg '^## ' ISA.md` lists Problem through Verification.
- [ ] **ISC-2:** The active implementation root is `tirak-mobile-app-v2`. Verify: `git rev-parse --show-toplevel` ends with `/tirak-mobile-app-v2`.
- [ ] **ISC-3:** `.planning/` remains the GSD planning source. Verify: PROJECT, REQUIREMENTS, ROADMAP, STATE, CONTEXT, UI-SPEC, and PLAN files exist.
- [ ] **ISC-4:** `.temperance/project.json` pins `active_planner` to `isa` or `gsd`. Verify: `jq -r '.active_planner'` matches `isa|gsd`.
- [ ] **ISC-5:** Superset lists the mobile Git root with at least one workspace. Verify: `temperance-superset-sync --check` succeeds for this path.
- [ ] **ISC-6:** No Hermes/Phloem job is launched from this workspace. Verify: execution receipts contain no Hermes/Phloem dispatch.
- [ ] **ISC-7:** Anti: Tirak Plus has no diff from this work. Verify: nested Tirak Plus `git status --short` is unchanged from preflight.
- [ ] **ISC-8:** Supplier signup payment source has no diff. Verify: `git diff -- app/supplier/signup/payment.tsx` is empty.
- [ ] **ISC-9:** Existing iOS dependency diffs are preserved. Verify: before/after hashes for `ios/Podfile` and `ios/Podfile.lock` match.

### Contract and state authority

- [ ] **ISC-10:** The client requires contract version `tirak-payments-v1`. Verify: focused test rejects another version.
- [ ] **ISC-11:** Charge creation targets `/api/payments/charges`. Verify: API test inspects the exact URL.
- [ ] **ISC-12:** Charge request keys equal `bookingId` plus `method`. Verify: API test compares sorted keys.
- [ ] **ISC-13:** Charge method equals `promptpay`. Verify: API test asserts the literal.
- [ ] **ISC-14:** Charge creation has no amount input. Verify: forbidden-field test covers `amount` and `amountSatang`.
- [ ] **ISC-15:** Charge creation has no currency input. Verify: forbidden-field test covers `currency`.
- [ ] **ISC-16:** Charge creation has no card input. Verify: forbidden-field test covers `card`, `cardNumber`, and `cvv`.
- [ ] **ISC-17:** Charge creation uses Bearer authentication. Verify: API test asserts an Authorization header without logging its value.
- [ ] **ISC-18:** Booking ownership remains a backend precondition. Verify: contract reference documents ownership and the mobile plan does not bypass it.
- [ ] **ISC-19:** An unconfirmed stored booking cannot create a charge. Verify: store test observes zero API calls.
- [ ] **ISC-20:** The charge model contains exactly the nine frozen response fields. Verify: TypeScript type plus allowlist test.
- [ ] **ISC-21:** Backend error envelopes map to stable safe client kinds. Verify: focused tests cover disabled, unauthorized, not found, non-payable, in-progress, indeterminate, network, and unknown.
- [ ] **ISC-22:** Production payment code logs no raw request or response. Verify: source search finds no full-object logger call in new payment files.
- [ ] **ISC-23:** Mobile source contains no Omise secret value. Verify: secret-name/value scan returns no new production match.
- [ ] **ISC-24:** QR display cannot set successful state. Verify: store/UI tests expose no local success transition.
- [ ] **ISC-25:** Payment state exposes no public `markPaid` action. Verify: source search returns no such export.
- [ ] **ISC-26:** Two concurrent charge actions produce one client call. Verify: store/UI test asserts call count one.
- [ ] **ISC-27:** A booking-ID change clears the prior charge session. Verify: store test asserts reset behavior.
- [ ] **ISC-66:** The client requires an outer `success === true`, unwraps only `data`, preserves nullable `chargeId`/`qrCodeUrl` and optional `expiresAt`, and rejects missing or false success envelopes. Verify: API tests cover valid and invalid envelope variants.
- [ ] **ISC-67:** Booking reset, logout, authenticated-user change, and confirmation exit clear prior payment state. Verify: a cross-user/session test proves user A's charge is absent for user B.

### Environment and mock safety

- [ ] **ISC-28:** Local capability requires exact flag `true`. Verify: predicate test rejects missing, false, and mixed-case values.
- [ ] **ISC-29:** Local capability requires host `localhost` or `127.0.0.1`. Verify: predicate test rejects non-loopback hosts.
- [ ] **ISC-30:** Local capability requires port `8787`. Verify: predicate test rejects another port.
- [ ] **ISC-31:** Local capability requires development mode. Verify: predicate test rejects production mode.
- [ ] **ISC-32:** Staging remains `promptPayEnabled: false`. Verify: environment matrix is unchanged.
- [ ] **ISC-33:** Production remains `promptPayEnabled: false`. Verify: environment matrix is unchanged.
- [ ] **ISC-34:** The local contract mock makes no outbound request. Verify: source scan plus process/network observation.
- [ ] **ISC-35:** The local contract mock rejects extra charge request fields. Verify: mock test/probe returns a non-success status for an added amount key.

### Traveler UI

- [ ] **ISC-36:** Cash renders in every Phase 1 state. Verify: component matrix covers hidden, disabled, creating, error, uncertain, and pending.
- [ ] **ISC-64:** Cash switching is disabled whenever a PromptPay charge may exist. Verify: component matrix covers creating, in-progress, pending, indeterminate, network, and unknown.
- [ ] **ISC-37:** PromptPay is absent when capability is false. Verify: component test queries by accessible name.
- [ ] **ISC-38:** PromptPay is disabled for an unconfirmed booking. Verify: component test asserts disabled state and helper copy.
- [ ] **ISC-39:** An eligible method exposes `Create PromptPay QR`. Verify: confirmed-booking component test.
- [ ] **ISC-40:** Pending UI uses server `displayTotalThb`. Verify: component fixture value appears while client estimate does not.
- [ ] **ISC-41:** Pending UI renders server expiry only when supplied and fabricates none when omitted. Verify: component tests cover both `expiresAt` variants.
- [ ] **ISC-42:** Pending UI renders a shortened charge reference only when supplied and fabricates none when null. Verify: component tests cover both `chargeId` variants.
- [ ] **ISC-43:** Pending UI says `Payment pending`. Verify: component and simulator evidence.
- [ ] **ISC-44:** Booking and payment status use separate copy. Verify: confirmation-state test matrix.
- [ ] **ISC-45:** PromptPay pending shows no success icon. Verify: component test plus screenshot inspection.
- [ ] **ISC-46:** English payment keys preserve pending versus paid. Verify: JSON parse plus exact-string assertions.
- [ ] **ISC-47:** Thai payment keys preserve pending versus paid. Verify: JSON parse plus bilingual review.
- [ ] **ISC-48:** Payment controls expose role plus selected/disabled state. Verify: Testing Library accessibility queries.
- [ ] **ISC-49:** Required copy is readable at large Dynamic Type. Verify: iOS Simulator screenshot inspection.
- [ ] **ISC-65:** Antecedent: Booking summary advances to payment selection at Step 6 and then booking/payment confirmation at Step 7. Verify: wizard integration test catches the current skipped-payment route and passes after repair.

### Automated and simulator proof

- [ ] **ISC-50:** Focused payment tests exit zero. Verify: named Jest command receipt.
- [ ] **ISC-51:** The full TypeScript check exits zero. Verify: `npx tsc --noEmit` receipt.
- [ ] **ISC-52:** The iPhone 17 Pro iOS 27.0 build exits zero. Verify: `xcodebuild` receipt.
- [ ] **ISC-53:** Evidence covers all seven UI-SPEC scenarios. Verify: evidence index has seven labeled entries.
- [ ] **ISC-54:** Phase 1 creates no real or staging charge. Verify: mock-only process receipt plus explicit evidence statement.

### Planning and authority gates

- [ ] **ISC-55:** Phase 1 has an approved UI-SPEC. Verify: file frontmatter records product-owner approval and agent-verification status.
- [ ] **ISC-56:** GSD resolves Roadmap Phase 1. Verify: `gsd-sdk query roadmap.get-phase 1` returns `found: true`.
- [ ] **ISC-57:** All Phase 1 requirement IDs appear in plan frontmatter. Verify: coverage comparison returns no missing ID.
- [ ] **ISC-58:** Every trackable Phase 1 decision ID appears in a plan. Verify: decision-coverage query passes.
- [ ] **ISC-59:** GSD agent-verification availability is disclosed precisely. Verify: STATE distinguishes absent UI agents from present-but-uninvoked planner/checker instruction files, and UI-SPEC names only unavailable UI checks.
- [ ] **ISC-60:** Git commits are created only under the user's explicit Phase 1 authorization. Verify: the authorization record predates every Phase 1 commit and no merge/deploy/provider commit exists.
- [ ] **ISC-61:** No deployment is performed. Verify: receipts contain no deploy command or deployment ID.
- [ ] **ISC-62:** No provider mutation is performed. Verify: receipts contain no Omise API or dashboard operation.
- [ ] **ISC-63:** Staging acceptance remains a fresh owner gate. Verify: Phase 3 status stays blocked until explicit authorization.

**ISC count:** 67. The E4 soft floor is 128, leaving a 61-criterion shortfall. This ISA is intentionally bounded to one mobile payment milestone plus workspace safety; inventing speculative Tirak-wide criteria would reduce falsifiability. Expand toward 128 only when Phase 2 status/recovery, Phase 3 acceptance, or a broader Tirak product milestone is approved.

## Test Strategy

| ISC range | Type | Primary check | Threshold | Tool |
|-----------|------|---------------|-----------|------|
| ISC-1..ISC-9 | workspace/policy | scope, planner, enrollment, untouched files | all pass | `rg`, `jq`, Git, Temperance checks |
| ISC-10..ISC-27, ISC-66..ISC-67 | unit/source | frozen request/envelope, response, error, store authority and isolation | all focused tests pass | Jest, TypeScript, source assertions |
| ISC-28..ISC-35 | negative/security | fail-closed capability and mock isolation | every negative case refuses | Jest, local probes, process inspection |
| ISC-36..ISC-49, ISC-64..ISC-65 | component/visual | cash, eligibility, switching lock, wizard reachability, pending truth, a11y, localization | all matrix cases pass | Testing Library, iOS Simulator |
| ISC-50..ISC-54 | integration/evidence | tests, typecheck, simulator build, screenshot index | exit 0 plus seven scenarios | Jest, `tsc`, `xcodebuild`, screenshot review |
| ISC-55..ISC-63 | planning/authority | parser coverage and held external gates | no silent gap or unauthorized mutation | `gsd-sdk`, Git, receipts |

Every criterion also carries its own verification sentence above; grouped rows define the execution harness, not a substitute for criterion-level proof.

## Features

| Name | Description | Satisfies | Depends on | Parallelizable |
|------|-------------|-----------|------------|----------------|
| planning-spine | Parser-readable project, requirements, roadmap, state, context, UI contract, and plans | ISC-1..ISC-9, ISC-55..ISC-59 | [] | false |
| payment-boundary | Typed authenticated request, success-envelope allowlist, errors, and isolated guarded session state | ISC-10..ISC-27, ISC-66..ISC-67 | [planning-spine] | false |
| local-capability | Exact development/loopback gate and isolated contract mock | ISC-28..ISC-35 | [payment-boundary] | false |
| traveler-pending-ui | Reachable cash-first selection, confirmed-booking eligibility, method lock, pending QR, truthful confirmation | ISC-36..ISC-49, ISC-64..ISC-65 | [payment-boundary, local-capability] | false |
| simulator-proof | Automated regression, iOS build, screenshots, and human visual gate | ISC-50..ISC-54 | [traveler-pending-ui] | false |

Sequential execution is intentional: each feature consumes the previous feature's types or truth boundary, and parallel writers would overlap shared booking/payment files. One read-only audit may run after artifacts are stable.

## Decisions

- 2026-08-22: Seeded the repository ISA for Hands readiness and planner selection.
- 2026-08-31: Product owner approved Tirak-mobile-only PromptPay design and planning normalization.
- 2026-08-31: Replaced horizontal contract/UI/status phases with vertical local-pending, status/recovery, and owner-gated acceptance phases.
- 2026-08-31: Cash remains visible; switching locks whenever a PromptPay charge may exist.
- 2026-08-31: Booking creation precedes payment selection; charge creation additionally requires server status `confirmed`.
- 2026-08-31: Phase 1 simulator proof uses a non-provider loopback fixture and cannot satisfy provider/staging proof.
- 2026-08-31: The skipped payment-step route, wrapped success envelope, nullable response fields, and cross-user reset behavior are explicit audited plan requirements.
- 2026-08-31: Bundled GSD instruction files exist, but UI agents are not registered in this Codex runtime; planner/checker were not invoked through a registered agent runner.
- 2026-08-31: Git commits, deployment, provider activity, and staging enablement remain held.
- 2026-08-31: The user authorized Tirak-mobile Phase 1 source changes and end-of-phase Git commits; all other held gates remain unchanged.
- 2026-08-31: Eight-lens Observe and First Principles review confirmed the existing boundary: server-owned charge truth, explicit local capability, cross-session reset, wizard reachability, and Tirak Plus/iOS non-interference remain independently necessary; no speculative criteria were added.

## Changelog

- Conjectured: the old four-phase roadmap could be consumed as-is.
- Refuted by: `gsd-sdk query roadmap.get-phase 1` returned `found: false` because the roadmap did not follow the parser schema.
- Learned: normalization must include requirements traceability, phase details, context decisions, UI contract, and executable plans.
- Conjectured: immediate post-booking QR creation was always valid.
- Refuted by: the backend requires an owned booking whose server status is `confirmed`; the existing demo booking is normally `pending`.
- Learned: store booking truth before payment selection and show a truthful eligibility state.
- Conjectured: local simulator rendering could count as Omise end-to-end proof.
- Refuted by: provider credentials and a real/staging charge are outside Phase 1 authorization.
- Learned: use an isolated non-provider fixture and label the evidence boundary.
- Criterion now: ISC-1..ISC-67.

## Verification

- Planning verification passed: Phase 1 resolves, both plan frontmatters/structures validate, and coverage is 18/18 requirements plus 14/14 decisions.
- Implementation verification pending execution of Phase 1 plans.
- GSD UI researcher/checker verification was unavailable because those agents are not registered in this Codex runtime. Bundled planner/checker instructions exist, but their registered GSD agent runner was unavailable; an independent read-only audit passed all five corrected blocker areas.
- External Advisor review unavailable in the planning turn because its OAuth session expired.
- External Advisor was retried before execution and remained unavailable because its OAuth session was expired; no credential or authority workaround was attempted.
- Provider and staging verification intentionally not attempted.
