---
schema: thoughtseed.isa.v1
seed: false
effort: comprehensive
phase: execute
progress: 32/42-active-release
mode: algorithm
started: 2026-08-31T18:35:41Z
updated: 2026-10-13
generated_by: temperance-hands ready
generated_at: 2026-08-22T10:59:02Z
normalized_at: 2026-08-31T00:00:00Z
project: tirak-mobile-app-v2
active_scope: release-readiness-20261013
---

## Problem

Current release scope (2026-10-13): review latest work, remove QA labels and demo payment navigation, eliminate runtime test/demo fallbacks, verify authenticated chat and backend with a separately scoped Wrangler profile named `tirak`, and prepare signed-build/store handoff evidence. Existing payment milestone criteria remain historical and are not silently marked satisfied.

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

The 2026-10-13 user instruction authorizes this release cleanup directly in this Codex workspace and read-only backend verification; it supersedes the older mobile-only execution restriction and supplier-payment exclusion for this scope. Preserve existing work; do not deploy, submit, make charges, or delete live data as an implicit cleanup. Never expose credentials.

- Execute lock: Superset plus Claude through OmniRoute for Hands execution; Codex App remains cockpit/babysit.
- Do not install missing GSD agents without separate authorization.
- Phase 1 source edits and end-of-phase Git commits are authorized; merge, deploy, payment enablement, provider activity, and GSD-agent installation still require separate authorization.
- Preserve the pre-existing `ios/Podfile` and `ios/Podfile.lock` changes.
- Mobile charge creation accepts no amount, currency, card, tip, gift, subscription, or beneficiary input.
- Local PromptPay UI requires development mode, exact flag `true`, HTTP loopback host, and port `8787`.
- Staging and production PromptPay creation remain disabled until a human release owner authorizes a bounded acceptance run.
- Phase 1 proves pending checkout only; terminal states and recovery remain Phase 2.

## Goal

Active release goal: production-only mobile behavior, evidence-backed backend/chat acceptance, reproducible IPA/APK/AAB instructions and concrete build readiness. Store submission and live-data deletion require a concrete reviewed result; do not claim signed artifacts, clean live data, or end-to-end chat without actual probes.

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

### Release readiness (2026-10-13)

- [x] ISC-68: Latest implementation review records concrete findings and release blockers.
- [ ] ISC-69: No QA badge is rendered by the application root.
- [x] ISC-70: Runtime demo mode cannot be enabled by an environment variable.
- [x] ISC-71: Demo chat send cannot report a successful server message.
- [x] ISC-72: Known fixture guides are excluded from public guide responses.
- [ ] ISC-73: Known demo bookings are excluded from production booking lists.
- [ ] ISC-74: Demo payment routes cannot render fake collection or success UI.
- [ ] ISC-75: Cash booking confirmation does not claim payment received.
- [x] ISC-76: Guide availability is not fabricated for test identities.
- [x] ISC-77: Production API configuration requires an HTTPS backend URL.
- [x] ISC-78: WebSocket URL uses the protocol corresponding to HTTP/HTTPS.
- [x] ISC-79: Focused chat regression tests pass.
- [x] ISC-80: Full Jest regression suite passes.
- [x] ISC-81: TypeScript check passes.
- [x] ISC-82: Android production bundle export passes.
- [x] ISC-83: iOS production bundle export passes.
- [x] ISC-84: App identifiers agree across Expo and native release configuration.
- [x] ISC-85: EAS production profile selects production environment and store distribution.
- [x] ISC-86: An explicit APK profile uses production configuration.
- [x] ISC-87: Store handoff documents IPA signing and TestFlight submission.
- [x] ISC-88: Store handoff documents APK testing and AAB Play submission.
- [x] ISC-89: Wrangler named profile login and minimal read scopes are documented from actual CLI.
- [x] ISC-90: Wrangler account sign-in URL is generated for tirak without exposing auth secrets.
- [x] ISC-91: Backend health responds with documented status and body.
- [x] ISC-92: Backend schema readiness for chat is verified with scoped access.
- [x] ISC-93: Live test/demo data inventory is recorded without deleting legitimate users.
- [ ] ISC-94: Two real accounts exchange a persisted chat message end to end.
- [ ] ISC-95: Native installed-app critical user flows pass.
- [ ] ISC-96: Interceptor screenshots verify affected UI routes.
- [x] ISC-97: Anti: no live data deletion, deployment, provider charge, or store submission occurs implicitly.
- [x] ISC-98: Build handoff distinguishes exports from signed installable artifacts.
- [x] ISC-99: Any blocked release acceptance has a named follow-up and truthful evidence.

### Live promotion and native artifact acceptance

- [ ] ISC-100: Live production Core schema matches the release candidate contracts.
- [ ] ISC-101: The two reviewed fixture accounts are suspended under approved guarded scope.
- [x] ISC-102: Signed IPA passes the native identity, APNs and embedded production configuration inspection.
- [x] ISC-103: Signed APK passes signature, content digest, target SDK and native alignment inspection.
- [x] ISC-104: Signed AAB passes CMS, signed-manifest and entry-digest inspection.
- [x] ISC-105: Full backend regression suite passes.
- [x] ISC-106: Guarded migration ledger reconciliation passes local precondition and replay probes.
- [ ] ISC-107: Approved Core backend version is verified on the existing default Worker.
- [x] ISC-108: Production-default Core Worker dry-run bundle exits zero.
- [x] ISC-109: Backend TypeScript check exits zero.

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

| Release feature | Satisfies | Depends on | Parallelizable |
|---|---|---|---|
| Latest-work audit | ISC-68 | none | true |
| UI cleanup | ISC-69, ISC-74..76, ISC-96 | audit | true |
| Demo/chat boundaries | ISC-70..73, ISC-79 | audit | true |
| Build/store handoff | ISC-77..78, ISC-80..88, ISC-98 | cleanup | false |
| Scoped backend acceptance | ISC-89..95 | authenticated scoped account | false |
| Release evidence | ISC-97, ISC-99 | all features | false |

| Name | Description | Satisfies | Depends on | Parallelizable |
|------|-------------|-----------|------------|----------------|
| planning-spine | Parser-readable project, requirements, roadmap, state, context, UI contract, and plans | ISC-1..ISC-9, ISC-55..ISC-59 | [] | false |
| payment-boundary | Typed authenticated request, success-envelope allowlist, errors, and isolated guarded session state | ISC-10..ISC-27, ISC-66..ISC-67 | [planning-spine] | false |
| local-capability | Exact development/loopback gate and isolated contract mock | ISC-28..ISC-35 | [payment-boundary] | false |
| traveler-pending-ui | Reachable cash-first selection, confirmed-booking eligibility, method lock, pending QR, truthful confirmation | ISC-36..ISC-49, ISC-64..ISC-65 | [payment-boundary, local-capability] | false |
| simulator-proof | Automated regression, iOS build, screenshots, and human visual gate | ISC-50..ISC-54 | [traveler-pending-ui] | false |

Sequential execution is intentional: each feature consumes the previous feature's types or truth boundary, and parallel writers would overlap shared booking/payment files. One read-only audit may run after artifacts are stable.

## Decisions

- 2026-10-13 OWNER APPROVED: fresh backup + restore verification, exact schema/ledger reconciliation, existing Core Worker deployment, suspension of two explicit review accounts while preserving all booking history, then chat verification and final native/store handoff. This supersedes held live promotion gates only for the exact reviewed scope; no deletion, payment enablement or store submission is authorized.

- 2026-10-13 refined: isolated tirak sign-in succeeded; read-only live D1 queries found34 users,5bookings,2known active review accounts and17migration ledger entries through019. All successful inventory receipts report rows_written0.
- 2026-10-13 refined: known review account UUIDs changed from old hard-coded fixtures; identified actual accounts by exact explicit review email allowlist. Guide links all5bookings, including3othercustomer accounts. No broad test-name inference or live deletion.
- 2026-10-13 prepared exact28statement additive reconciliation with9existingcolumn skips and guarded7entry ledger reconciliation. Local live-schema rehearsal, before-schema refusal and replay idempotence pass. Actual live application and Core promotion require owner approval.
- 2026-10-13 proposed two-account suspension preserves history; exact guarded SQL and owner-authorized rollback saved. This does not physically erase historical fixture data.
- 2026-10-13 all3native candidates finished. IPA21, APK13 andAAB14 downloaded/hash-verified; actual signatures/identities verified; Androidtarget36 and40native64bitlibraries16KBcompatible. Store submission not performed.
- 2026-10-13 isolated backend candidate fromea58fcb repaired test-only hard-coded todaydate;722tests57files/types/defaultproductiondryrun pass. Backend application code unchanged.

- 2026-10-13 refined: ISC-73 remains pending live inventory. Local demo gates are closed, but server-returned historical test bookings are not proved absent and financial history is not silently erased.

- 2026-10-13 refined: actual latest source is d2469a6, October 5 Core QA work; release candidate branch codex/store-release-20261013 isolates cleanup from original and existing dirty native worktrees. Current acceptance ledger is this file in release worktree.
- 2026-10-13 Interview answer: user selected cash-only for this release. No payment integration work or real charges required.

- 2026-10-13 refined: current user release scope supersedes old Phase 1 exclusions; old criteria remain stable for historical traceability.
- 2026-10-13 ISA Interview workflow started: user asked whether cash-only release or verified online payments are required; independent audit continues pending answer.
- 2026-10-13 Eight thinking lenses: FirstPrinciples distinguishes exports from signed binaries; SystemsThinking closes central demo ingestion; RootCauseAnalysis traces fake success to fallback paths; Science compares env-gating, removal, and server-backed replacements with negative probes; IterativeDepth adds fresh-install, cross-user cache, deep-link, and signing checks; ContextSearch reviews prior handoff and git history; ISA maps explicit asks to evidence; ReReadCheck gates final release claims.
- 2026-10-13 E5 soft ISC floor relaxed: 32 release criteria plus 67 historical criteria cover the approved surfaces; speculative or duplicate criteria would hide missing empirical evidence.
- 2026-10-13 Forge invoked but unavailable (missing ForgeContext and prescribed CLI); separate worker owns UI cleanup. Three independent workers cover UI, data/chat, and backend audit; no nested worker delegation.
- 2026-10-13 Visual preflight: interceptor open http://127.0.0.1:8081 returned no extensions connected; UI proof cannot pass until connection restored (FOLLOWUP-VISUAL).

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

- Conjectured: migrations020–026 could be applied as a simple pending chain.
- Refuted by: live metadata contains9latercolumns already present while itsledgerstops019.
- Learned: reconcile missing schema and guard ledger writes againstactualfeatures; never blindly replay historical ALTERs.
- Criterion now: ISC-100,ISC-106,ISC-107.
- Conjectured: removing known review accounts would only remove isolated demo data.
- Refuted by: live FK inventory links the reviewguide to5bookings,3withothercustomeraccounts.
- Learned: preservehistory,proposeexact suspension,requireownerapprovalforlivechanges.
- Criterion now: ISC-93,ISC-101.


- Conjectured: disabling new PromptPay UI was sufficient for a cash-only release.
- Refuted by: independent review found unresolved existing charges still received cash instructions.
- Learned: remove payment creation while retaining debt/payment truth and no-double-payment warnings for returning sessions.
- Criterion now: ISC-74..75 require hidden new payment actions and preserved existing-charge warnings; visual proof remains pending.


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

### Final authorized preparation evidence

- ISC-90..93: tirak OAuth successful; SELECT-only live table/migration/count/FK impact receipts. Chat rooms/messages/ticket tables exist, but actual current booking chat room/message counts0/0 and Core020–026 surfaces missing. Inventory complete; readiness/clean-data claims remain blocked.
- ISC-102: ipa-1.5.4-21-verified.json; codesign --verify --deep --strict exit0; team/bundle/APNs/distribution profile match; production API present,QA API/badge absent,warning present.
- ISC-103: apk-1.5.4-13-verified.json; v2signature/contentdigest pass, previous certificate matches, manifesttarget36/nondebug,40native64bitlibs16KB ELF+ZIPaligned. Production API present,QA API/badge absent,warning present.
- ISC-104: aab-1.5.4-14-verified.json; OpenSSL CMSverification successful, signedmanifestdigest and1808entrydigests pass, target36,40compatible64bitlibs.
- ISC-105,ISC-109: isolated backend full57files/722tests andtsc exit0.
- ISC-106: local live-schema metadata rehearsal28DDLstatements pass; ledger17before,24after,0preconditionwrites,0replaywrites. Proposed SQL not executed live.
- ISC-108: isolatedprofile Wranglerdefaultproductiondeploy --dry-run bundles and exitswithoutdeployment. Flags disabled,pinneddefaultresources retained.
- ISC-100,ISC-101,ISC-107: AWAITING-OWNER-APPROVAL, reviewed artifacts in PRODUCTION-BACKEND-REVIEW-20261013.md. Backup+exactschema+ledger+Corepromotion+twoaccount suspension preservinghistory; no live writes.
- ISC-94..96: FOLLOWUP-TWO-USER-CHAT / FOLLOWUP-DEVICE / FOLLOWUP-VISUAL remain pending. Real permissioned accounts and installeddevice/browser access required;438mobile/722backendtests do not substitute.


### Active release evidence, 2026-10-13

- ISC-68: reviewed latest d2469a6 plus native-delivery/Core receipts; older checkout restored clean after preliminary edits were transferred/adapted.
- ISC-70..73: demo/review/auth refusal and chat filtering regression suites passed; booking production tests reject fabricated fallback, including legacy flags. This establishes client behavior, not live database cleanliness.
- ISC-76: DateTimePickerStep no synthetic test-ID availability; booking schedule tests pass.
- ISC-77..78: api-transport tests cover HTTPS -> WSS on native/web, API suffix normalization, unsafe production URL rejection.
- ISC-79..81: full Jest 41 suites /438 tests passed, TypeScript exit zero (logs in local release evidence); git diff --check exit zero.
- ISC-82..83: final production Android/iOS Hermes exports succeeded with explicit live backend and dotenv disabled. Exports are not signed artifacts.
- ISC-84..86: Expo/native identifiers com.tirak.pineapple and version 1.5.4 align; release-config tests verify production environment/store/AAB and production-configured APK.
- ISC-87..89, ISC-98..99: STORE-HANDOFF-20261013.md read back; full IPA/APK/AAB/signing/reviewer/console steps and named blockers. Wrangler CLI scopes/help inspected. Wrapper refuses destructive query before launching Wrangler.
- ISC-90: isolated tirak OAuth URL generated; callback timed out without authorization. FOLLOWUP-CF-AUTH required; no credential reuse.
- ISC-91: live health 200, public health 200 with DB/cache/storage healthy, public config200, unauth chat401. Public categories empty; not a clean-data claim.
- ISC-97: no backend deployment, SQL mutation, charge, OTA update or store submission executed. EAS builds are authorized candidate compilation only.
- ISC-69, ISC-74..75: source/component regressions pass for badge absence, no new QR actions, cash confirmation, unresolved-charge no-double-payment warning; visual evidence remains DEFERRED-VERIFY (FOLLOWUP-VISUAL).
- ISC-92..96: DEFERRED-VERIFY: FOLLOWUP-CF-AUTH -> FOLLOWUP-DB-INVENTORY / FOLLOWUP-TWO-USER-CHAT; FOLLOWUP-DEVICE and FOLLOWUP-VISUAL require real account/device/browser access. No release-ready claim.
- External Advisor failed with process exit1 at both commitment boundaries. Cato invoked and skipped because its nested Codex subprocess violates repository instructions. Independent read-only reviewer found P1 unresolved-charge cash instructions; corrected with EN/TH warning and four regressions; reviewer confirms P1 resolved. This is not a cross-vendor GPT-5.4 audit.


- Planning verification passed: Phase 1 resolves, both plan frontmatters/structures validate, and coverage is 18/18 requirements plus 14/14 decisions.
- Implementation verification pending execution of Phase 1 plans.
- GSD UI researcher/checker verification was unavailable because those agents are not registered in this Codex runtime. Bundled planner/checker instructions exist, but their registered GSD agent runner was unavailable; an independent read-only audit passed all five corrected blocker areas.
- External Advisor review unavailable in the planning turn because its OAuth session expired.
- External Advisor was retried before execution and remained unavailable because its OAuth session was expired; no credential or authority workaround was attempted.
- Provider and staging verification intentionally not attempted.

### Live execution checkpoint — October 13

Owner explicitly authorized backup/schema/Core deployment/two-account suspension. Full private D1 backup restored: integrity OK, zero FK violations. Applied 28 additive schema statements. Combined guarded ledger query hit D1 compound SELECT limit without writes; seven individually guarded inserts succeeded, ledger read-back 24. Exactly two review accounts suspended; users remain 34. Post-change full export compared all original fields of all five bookings to pre-change backup: identical. Receipt: docs/release/live-backend-execution-20261013.json. Worker deployment still awaits isolated Worker-scope OAuth. contact@tirak.app is not registered; real-account chat and device/browser acceptance remain pending. Earlier no-live-write evidence describes the prior checkpoint only.

### Owner handoff direction

Owner deferred authenticated production chat verification for now and requested the handoff. Owner confirmed Worker-scope OAuth link expired. Core deployment remains unperformed; signed artifacts and database preservation receipts delivered with these limitations. No production chat or public-release acceptance claimed.
