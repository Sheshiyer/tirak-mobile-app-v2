---
phase: 01-local-promptpay-pending-checkout
plan: 02
subsystem: payments-ui
tags: [react-native, promptpay, ios-27, accessibility, zustand, local-fixture]

requires:
  - phase: 01-01
    provides: Contract-safe PromptPay client and persisted server-owned charge session
provides:
  - Cash-preserving capability-gated PromptPay checkout UI
  - Server-authoritative pending charge presentation and truthful confirmation state
  - iOS 27 simulator, accessibility, deep-link, and human UAT evidence
affects: [02-payment-status-recovery, booking-checkout, ios-scene-lifecycle]

tech-stack:
  added: []
  patterns: [fail-closed local capability, financial-state retention, explicit native-to-js link acknowledgement]

key-files:
  created: [constants/payment-capabilities.ts, components/booking/payment/PromptPayPendingCard.tsx, scripts/promptpay-contract-mock.mjs, ios/Tirak/SceneDelegate.swift]
  modified: [components/booking/BookingWizard.tsx, components/booking/steps/PaymentSelectionStep.tsx, components/booking/steps/BookingConfirmationStep.tsx, stores/payment-store.ts, stores/booking-store.ts, app/api/payment/payment.ts, locales/en.json, locales/th.json]

key-decisions:
  - "PromptPay remains visible only for the exact development loopback capability; cash remains the stable path."
  - "Booking confirmation, charge creation, pending payment, settlement, and restitution remain distinct states."
  - "Pending or indeterminate payment truth survives navigation, relaunch, and authentication boundaries until safely resolved."
  - "Custom-scheme runtime proof is claimed; universal links remain explicitly unclaimed without entitlement and URL authority."

patterns-established:
  - "Server-truth rendering: amount, currency, expiry, charge reference, and lifecycle derive from validated responses."
  - "Financial retention: live or uncertain sessions cannot be discarded, replaced, or retried unsafely."
  - "Evidence boundaries: simulator fixtures prove local rendering only, never provider, staging, payment, or settlement."

requirements-completed: [CAP-01, CASH-01, CASH-02, FLOW-01, FLOW-02, UI-01, UI-02, UI-03, A11Y-01, TEST-02, TEST-03]

duration: 11d elapsed across recovery sessions
completed: 2026-09-12
---

# Phase 1 Plan 02: Local PromptPay Pending Checkout Summary

**Cash-preserving local PromptPay checkout with server-owned pending truth, retained financial state, iOS 27 runtime proof, and approved accessibility behavior**

## Performance

- **Duration:** 11 days elapsed across interrupted recovery sessions
- **Started:** 2026-09-01T00:31:07+05:30
- **Completed:** 2026-09-12T04:55:00+05:30
- **Tasks:** 4
- **Files reviewed:** 43 source, test, and native integration files plus 11 screenshots and one evidence receipt

## Accomplishments

- Added cash-first payment selection with PromptPay exposed only under the exact development loopback capability and confirmed-booking eligibility.
- Rendered creating, pending, indeterminate, paid, failed, expired, and restitution states without local settlement authority or unsafe method switching.
- Preserved live/unknown financial sessions across navigation, relaunch, reset, logout, and user changes; safe retry is limited to failed or expired attempts for the same booking.
- Added English and Thai copy, Dynamic Type reachability, radio/button/progress semantics, error focus, and product-owner-approved VoiceOver behavior.
- Adopted the iOS 27 scene lifecycle and proved exact cold/warm custom-scheme preservation and JavaScript acknowledgement in one process.
- Captured all seven required iOS 27 visual scenarios plus optional Thai evidence using a disposable, non-provider loopback fixture.

## Task Commits

1. **Tests and base checkout integration** — `13ff180`, `c92a12b`, `b2ce3f5`, `6997c7d`
2. **iOS 27 scene lifecycle and runtime linking** — `97972cb`, `7941235`, `bdd43b9`
3. **Payment truth, lifecycle, accessibility, and isolation remediation** — `1bb7a89`, `467c5a7`, `048b9e9`
4. **Independent convergence reviews** — `d6a5a8b`, `fbaa7c5`, `b505fe7`

Evidence, UAT, this summary, and security verification are committed only after the human checkpoint.

## Verification Evidence

- Full Jest: 13/13 suites and 212/212 tests passed on the integrated source.
- TypeScript, locale JSON parsing, static scene lifecycle/acknowledgement, and `git diff --check` passed.
- Xcode 27 produced an iOS 27 Release simulator build with embedded JavaScript.
- One process recorded terminated-cold and warm custom-scheme delivery through native preservation and exact JavaScript acknowledgement.
- The iOS 27 visual receipt records seven required scenarios plus optional Thai at 1320 x 2868 with SHA-256 hashes.
- Human UAT passed 8/8 checks, including Accessibility Large and interactive VoiceOver reading order/control semantics.
- Final deep review covered 43 files and recorded zero critical, warning, or informational findings.

## Files Created/Modified

- `constants/payment-capabilities.ts` — Exact development-loopback capability predicate.
- `components/booking/steps/PaymentSelectionStep.tsx` — Cash-first method, lock, retry, and pending-state interaction.
- `components/booking/payment/PromptPayPendingCard.tsx` — Validated server-field pending presentation without fabricated values.
- `components/booking/steps/BookingConfirmationStep.tsx` — Separate booking and payment truth.
- `stores/payment-store.ts` — Retained lifecycle, authentication isolation, safe retry, and duplicate protection.
- `app/api/payment/payment.ts` — Strict response decoding, timeouts, and conservative error classification.
- `scripts/promptpay-contract-mock.mjs` — Loopback-only non-provider fixture with request allowlisting.
- `ios/Tirak/SceneDelegate.swift` and native bridge files — iOS 27 scene link preservation and acknowledgement.
- `locales/en.json`, `locales/th.json` — Payment-specific truthful localized copy.
- `evidence/01-02-simulator.md` — Redacted simulator provenance, screenshot hashes, observations, and limits.
- `01-UAT.md` — Persistent 8/8 product-owner acceptance record.

## Decisions Made

- Treat a confirmed booking and pending payment as independent truths; neither implies settlement.
- Retain financial state whenever a charge may exist, even when this blocks navigation or a replacement booking.
- Use server fields for charge display and fail PromptPay closed for explicit non-THB currency.
- Keep the missing production booking currency and stable `BOOKING_ALREADY_PAID` code as backend authority gates.
- Claim only the custom-scheme path actually exercised; defer universal links until Associated Domains and a real URL exist.

## Deviations from Plan

### Auto-fixed Issues

- Replaced the original narrow pending model with the complete currently observable lifecycle and restitution state matrix.
- Removed fabricated empty-chat fallback behavior discovered after restoring the Jest baseline.
- Added iOS 27 UIScene adoption and retained link acknowledgement because the original application delegate path did not establish cold delivery.
- Used iPhone 17 Pro Max on iOS 27.0 because the exact iPhone 17 Pro simulator was not installed.
- Used a supported Expo development-client session and deterministic real-store harness for visual state capture; the harness was removed afterward.

**Impact:** These changes were required for financial truth, native runtime correctness, and verifiable accessibility. No provider, backend, Tirak Plus, deployment, release, or production scope was added.

## Threat Flags

- **Capability leakage:** Closed by development, exact flag, HTTP loopback host, and port 8787 checks.
- **Duplicate or replacement charge:** Closed by synchronous request latches, lifecycle locks, retained session identity, and restricted retry.
- **False settlement claim:** Closed by the explicit state matrix, pending-only copy, and absence of a public local paid mutation.
- **Cross-user financial residue:** Closed by centralized authentication invalidation and persisted-session version checks.
- **Fixture/provider crossover:** Closed by loopback binding, provider-environment refusal, request-key allowlisting, and no outbound client.
- **Sensitive QR or credential logging:** Closed by allowlisted coarse logs and non-scannable synthetic evidence.

## Issues Encountered

- The requested iPhone 17 Pro simulator destination was unavailable; the installed iPhone 17 Pro Max with the same iOS 27 runtime was recorded as an explicit deviation.
- The app-process HTTP request was not observed during deterministic visual capture. The screenshots prove real component/store rendering; a separate loopback POST proves only the fixture contract.
- Sentry upload was not authorized/configured and was allowed to fail during local build verification; no upload is claimed.
- Universal links could not be tested without an Associated Domains entitlement and real URL.

## User Setup Required

None for Phase 1. Provider, staging, production, and universal-link configuration remain outside this phase.

## Next Phase Readiness

- The local cash/PromptPay pending slice and human UAT are ready for Phase 1 security and completion verification.
- Phase 2 may add server-authoritative refresh and recovery only after preserving the same lifecycle and duplicate-charge invariants.
- Production expansion remains blocked on canonical backend currency, a stable already-paid machine code, and separately authorized provider/staging work.

---
*Phase: 01-local-promptpay-pending-checkout*
*Completed: 2026-09-12*
