---
phase: 01-local-promptpay-pending-checkout
verified: 2026-09-11T23:59:02Z
status: passed
score: 18/18 must-haves verified
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 17/18
  gaps_closed:
    - "Direct booking reset now calls releasePaymentSessionIfSafe(): safe state clears while creating, pending, and indeterminate state remains attached to the original booking."
    - "Charge-less persisted creating state now rehydrates conservatively as indeterminate, rejects duplicate transport, and rejects replacement by another booking."
  gaps_remaining: []
  regressions: []
deferred:
  - truth: "Authenticated server status refresh and indeterminate recovery"
    addressed_in: "Phase 2"
    evidence: "Phase 2 goal and success criteria explicitly cover GET status refresh, terminal outcomes, expiry, and recovery without duplicate creation."
  - truth: "Provider/staging convergence, deployment, release, and settlement proof"
    addressed_in: "Phase 3 / external release authority"
    evidence: "Phase 3 is owner-gated and requires provider retrieval plus signed-webhook convergence; Phase 1 is intentionally local-only."
---

# Phase 1: Local PromptPay Pending Checkout Verification Report

**Phase Goal:** In a disposable local environment, a traveler with an owned confirmed booking can choose PromptPay, request one server-issued charge, and see its pending QR, server amount, currency, and expiry without weakening the cash path.
**Verified:** 2026-09-11T23:59:02Z
**Verified HEAD:** `16af95adcd0cfe0a5d5212a489e75829b941de18`
**Status:** passed
**Re-verification:** Yes — after SAFE-02 implementation and test closure

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Cash remains visible, selectable before charge creation, and locked whenever a PromptPay charge may exist. | VERIFIED | Cash renders independently of capability gating. State-derived locks cover creating, pending, indeterminate, network/unknown, paid, and restitution states. Component tests and accepted UAT tests 1-5 pass. |
| 2 | PromptPay appears only for the exact disposable local capability and cannot create a charge before a confirmed booking is stored. | VERIFIED | `payment-capabilities.ts` requires development mode, exact `true`, HTTP loopback, and port 8787. `payment-store.ts:194-212` independently refuses ineligible/unconfirmed bookings before transport. |
| 3 | Charge creation sends exactly `bookingId` and `method: "promptpay"`, validates the success envelope, and exposes only allowlisted server fields. | VERIFIED | The typed client has the two-key POST and strict `tirak-payments-v1` response decoder; contract-driven API tests prove forbidden-field omission, state-pair validation, nullable handling, and safe errors. |
| 4 | QR presentation remains server-authoritative pending truth and cannot become paid through a local UI mutation. | VERIFIED | The pending card reads decoded charge data, nullable fields render conditionally, and the store exposes no paid/status setter. Component/state tests and UAT tests 5-6 pass. |
| 5 | The local pending journey has automated, simulator, accessibility, and visual proof without a real or staging charge. | VERIFIED (local scope) | Fresh full run passes 13/13 suites and 216/216 tests; TypeScript and locale checks pass. All 11 evidence PNG hashes match the receipt and remain 1320x2868. UAT is 8/8 and Security records 11/11 threats closed. |
| 6 | Logout and authenticated-user change clear payment state and persisted payment storage. | VERIFIED | Central auth invalidation clears memory and storage; login/register/demo/update/rehydration identity changes reset payment state. Tests cover logout, missing/corrupt credentials, storage failure, unauthorized events, user A to user B, and late-response invalidation. |
| 7 | Booking reset and confirmation exit clear safe payment sessions but retain unresolved creating, pending, and indeterminate sessions. | VERIFIED | `booking-store.ts:465-471` calls `releasePaymentSessionIfSafe()` before resetting form state. The reset matrix proves paid clears while creating/pending/indeterminate remain. Confirmation handlers apply the same release policy; component tests prove paid clears and pending remains. |
| 8 | Unresolved state remains bound to the original booking across relaunch and cannot authorize a duplicate or replacement charge. | VERIFIED | `payment-store.ts:183-192` rejects create calls from creating/indeterminate/pending state. `persist.merge()` maps charge-less creating to locked indeterminate at `:304-323`. Tests prove creating and indeterminate rehydrate locked, make zero transport calls, and reject booking replacement; pending replacement is separately covered. |

**Score:** 18/18 Phase 1 requirements verified.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `app/api/payment/payment.ts` | Typed authenticated strict payment client | VERIFIED | Substantive, imported by the payment store, exact request body, strict response allowlist, and stable safe errors. |
| `stores/payment-store.ts` | Persisted server-owned lifecycle and duplicate/replacement guards | VERIFIED | Runtime and rehydrated unresolved states remain locked; safe release, auth clearing, retry restrictions, and canonical response parsing are wired. |
| `stores/booking-store.ts` | Direct booking reset coordinates safe payment release | VERIFIED | Imports the payment store and calls `releasePaymentSessionIfSafe()` before resetting booking-form data. |
| `stores/auth-store.ts` | Logout and identity changes invalidate payment state | VERIFIED | Central in-memory/persisted cleanup plus all identity-transition guards are present and tested. |
| `BookingConfirmationStep.tsx` | Truthful confirmation and safe exit policy | VERIFIED | Reads server-backed payment state and calls safe release before both exit paths. |
| `BookingSummaryStep.tsx` | Store confirmed booking before payment; block unresolved replacement | VERIFIED | Booking truth is validated and stored before navigation; retained-session checks prevent new submission/replacement. |
| `PaymentSelectionStep.tsx` | Cash-first, capability-gated PromptPay flow | VERIFIED | Store/API/action/error/a11y wiring is substantive and tested. |
| `PromptPayPendingCard.tsx` | Pending server-field presentation | VERIFIED | SDK reported a missing literal `Payment pending`, but source correctly uses `t('payments.pendingHeading')`; EN/TH locale keys, component tests, and screenshots verify the rendered text. |
| `BookingWizard.tsx` | Reachable Step 6 payment and Step 7 confirmation | VERIFIED | Explicit cases 6/7 and passing integration flow. |
| `scripts/promptpay-contract-mock.mjs` | Loopback-only non-provider fixture | VERIFIED | Exact-body allowlist, provider-environment refusal, synthetic non-scannable image, and no outbound provider primitive. |
| Phase 1 tests | Contract, lifecycle, UI, accessibility, and flow proofs | VERIFIED | Fresh full execution: 13 suites and 216 tests pass. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `payment-store.ts` | `payment.ts` | `createPromptPayCharge(booking.id)` | WIRED | Direct import/call; response writes only to the matching session version and booking. |
| `payment.ts` | `/api/payments/charges` | authenticated POST | WIRED | Exact endpoint/body, bearer transport, strict response handling. |
| `booking-store.ts` | `payment-store.ts` | safe release during direct reset | WIRED | Explicit import and `releasePaymentSessionIfSafe()` call at reset. |
| `BookingConfirmationStep.tsx` | `payment-store.ts` | safe release before exit | WIRED | Both exit paths call the release policy before form reset/navigation. |
| `auth-store.ts` | payment memory/storage | invalidation on logout/auth change | WIRED | Central cleanup and identity-transition guards are tested. |
| persisted payment state | rehydrated lifecycle lock | `partialize()` -> `persist.merge()` | WIRED | Charge-backed state revalidates through the strict parser; charge-less creating becomes indeterminate and cannot create/rebind. |
| retained payment state | next booking | `isPaymentSessionRetained()` + `setBooking()` | WIRED | Creating, pending, and indeterminate runtime state refuses replacement; rehydrated creating/indeterminate and pending are behavior-tested. |
| booking summary | payment selection | `setBooking()` before `onNext()` | WIRED | Integration test proves summary -> Step 6 -> Step 7. |

### Data-Flow Trace

| Artifact | Data | Source | Produces real scoped data | Status |
|----------|------|--------|---------------------------|--------|
| `PaymentSelectionStep.tsx` | booking, method, phase, error, charge | persisted payment store and strict client | Yes in code/tests. Screenshots seed the real store, so they remain rendering evidence rather than HTTP E2E evidence. | FLOWING |
| `PromptPayPendingCard.tsx` | amount, currency, QR, expiry, reference | allowlisted `tirak-payments-v1` charge | Yes; no client recalculation or invented nullable field. | FLOWING |
| `BookingConfirmationStep.tsx` | booking/payment truth and exit policy | booking + payment stores | Yes; booking and payment truth remain separate and safe release is state-derived. | FLOWING |
| payment persistence | unresolved lifecycle | secure storage `partialize` -> `merge` | Yes; creating, pending, and indeterminate restore to locked canonical states and retain original booking identity. | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Focused lifecycle/checkout suite | preserved Jest binary with `payment-api`, `payment-store`, `payment-session-reset`, and `PromptPayCheckout`, `--runInBand` | 4 suites, 150 tests, exit 0 | PASS |
| Full regression suite | preserved Jest binary, `--runInBand` | 13 suites, 216 tests, exit 0 | PASS |
| TypeScript | temporary exact dependency symlink; `tsc --noEmit`; link removed | exit 0 | PASS |
| Locale JSON | parse `locales/en.json` and `locales/th.json` | `locale-json-pass` | PASS |
| Native scene contract | `bash ios/scripts/verify-scene-lifecycle.sh` | scene and JavaScript-acknowledged cold-link contract verified | PASS |
| Plan artifact/link checks | `gsd-sdk query verify.artifacts/key-links` for both plans | 01-01: 5/5 artifacts and 4/4 links; 01-02: 5/5 links and 7/8 literal artifacts | PASS with one localization false positive |
| Evidence integrity | `shasum -a 256` and `file` over evidence PNGs | all 11 hashes match receipt; all are 1320x2868 PNG | PASS |
| Debt/sensitive-source scan | `rg` over Phase 1 production/test files | no debt marker, provider secret/card field, local paid setter, or Authorization/QR logging match | PASS |

The first TypeScript attempt lacked a local dependency resolution path because this isolated worktree intentionally has no `node_modules`; it was an environment setup failure, not a compiler result. The repeated check used the preserved dependency tree through a temporary symlink, exited 0, and the symlink was removed.

### Probe Execution

No probe was declared by either Phase 1 plan and no conventional `probe-*.sh` exists. Probe execution is not applicable.

### Requirements Coverage

| Requirement | Plan | Status | Evidence |
|-------------|------|--------|----------|
| PAY-01 | 01-01 | SATISFIED | Exact two-key POST and contract-driven forbidden-field assertion. |
| PAY-02 | 01-01 | SATISFIED | Nine frozen response fields modeled, decoded, persisted, rendered, and tested. |
| PAY-03 | 01-01 | SATISFIED | Stable traveler-safe error taxonomy covers every required branch. |
| PAY-04 | 01-01 | SATISFIED | Strict success envelope, inner allowlist, nullable safety, and invalid-envelope rejection. |
| SAFE-01 | 01-01 | SATISFIED | No client charge authority, provider secret, QR payload logging, card field, or sensitive persistence. |
| SAFE-02 | 01-01 | SATISFIED | Safe reset/exit clears; creating/pending/indeterminate retention, conservative relaunch, duplicate/replacement rejection, and logout/user clearing are implemented and tested. |
| CAP-01 | 01-02 | SATISFIED | Exact local-only capability predicate and fail-closed tests. |
| CASH-01 | 01-02 | SATISFIED | Cash remains rendered in every Phase 1 state. |
| CASH-02 | 01-02 | SATISFIED | Method switching locks for every live/uncertain state. |
| FLOW-01 | 01-02 | SATISFIED | Confirmed stored booking required before transport. |
| FLOW-02 | 01-02 | SATISFIED | Step 6 payment and Step 7 confirmation integration proof. |
| UI-01 | 01-02 | SATISFIED | Pending server total/currency and conditional QR/expiry/reference. |
| UI-02 | 01-02 | SATISFIED | Method-specific backend-confirmation copy. |
| UI-03 | 01-02 | SATISFIED | Booking and payment truth remain distinct. |
| A11Y-01 | 01-02 | SATISFIED | Automated semantics plus accepted VoiceOver UAT. |
| TEST-01 | 01-01 | SATISFIED | Contract-driven request/response tests pass. |
| TEST-02 | 01-02 | SATISFIED | Capability, eligibility, duplicate, cash fallback, pending UI, and lifecycle tests pass. |
| TEST-03 | 01-02 | SATISFIED (local scope) | iOS 27 local fixture/screenshots are intact and human-accepted; no app-process POST was observed and no E2E claim is made. |

No Phase 1 requirement is orphaned. Phase 2 STAT requirements and Phase 3 ACC/EVID requirements are correctly mapped later and are not Phase 1 failures.

### Anti-Patterns Found

No blocker or warning anti-pattern was found in the Phase 1 files. The re-scan found no unreferenced TBD/FIXME/XXX marker, provider secret/card field, local paid mutation, or Authorization/QR logging.

### Human Verification

No human verification remains. Visual appearance, Accessibility Large reachability, and VoiceOver reading order/control behavior are recorded as 8/8 passed in `01-UAT.md`.

### External Authority Gates and Non-Claims

- No provider, staging, production, deployment, merge, release, or settlement proof exists or is inferred.
- The screenshot harness exercised real components/store state, but no in-app HTTP request was observed during capture. The independent loopback POST verifies only the fixture contract; it is not mobile E2E proof.
- The visual/contract targets at current HEAD are byte-identical to evidence source `b505fe750f2b9369234d369a74555f0522a51c6b`; later changes are lifecycle state/tests and evidence/planning artifacts.
- No universal-link proof exists. Only the separately recorded custom-scheme behavior may be claimed.
- Production backend currency and a stable `BOOKING_ALREADY_PAID` machine code remain future authority gates.
- Phase 2 owns authenticated status refresh, terminal transitions, expiry, and indeterminate recovery. Phase 3 remains explicitly owner-gated.

### Gaps Summary

No Phase 1 local-scope gap remains. The former SAFE-02 blockers are closed in both implementation and tests at HEAD `16af95a`: safe reset now releases, all unresolved Phase 1 states are retained, charge-less creating relaunches as locked uncertainty, duplicate/replacement attempts are rejected, and auth transitions clear old-user state. The phase goal is achieved within its explicitly local boundary.

---

_Verified: 2026-09-11T23:59:02Z_
_Verifier: the agent (gsd-verifier)_
