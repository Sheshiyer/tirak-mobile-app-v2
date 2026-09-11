---
phase: 01-local-promptpay-pending-checkout
reviewed: 2026-09-11T19:22:44Z
depth: deep
files_reviewed: 36
files_reviewed_list:
  - __tests__/BookingAccessibility.test.tsx
  - __tests__/BookingSummaryContracts.test.tsx
  - __tests__/BookingWizardPaymentFlow.test.tsx
  - __tests__/PromptPayCheckout.test.tsx
  - __tests__/booking-format.test.ts
  - __tests__/chat-api.test.ts
  - __tests__/payment-api.test.ts
  - __tests__/payment-capabilities.test.ts
  - __tests__/payment-session-reset.test.ts
  - __tests__/payment-store.test.ts
  - app/api/booking/booking.ts
  - app/api/payment/payment.ts
  - components/booking/BookingStepFooter.tsx
  - components/booking/BookingWizard.tsx
  - components/booking/booking-format.ts
  - components/booking/payment/PromptPayPendingCard.tsx
  - components/booking/steps/BookingConfirmationStep.tsx
  - components/booking/steps/BookingSummaryStep.tsx
  - components/booking/steps/PaymentSelectionStep.tsx
  - components/ui/Button.tsx
  - components/ui/ProgressBar.tsx
  - constants/payment-capabilities.ts
  - ios/Tirak.xcodeproj/project.pbxproj
  - ios/Tirak/AppDelegate.swift
  - ios/Tirak/Info.plist
  - ios/Tirak/SceneDelegate.swift
  - ios/scripts/verify-scene-lifecycle.sh
  - ios/scripts/verify-scene-link-runtime.sh
  - jest.config.js
  - locales/en.json
  - locales/th.json
  - scripts/promptpay-contract-mock.mjs
  - stores/auth-store.ts
  - stores/booking-store.ts
  - stores/payment-store.ts
  - utils/chat-api.ts
findings:
  critical: 2
  warning: 4
  info: 0
  total: 6
status: issues_found
---

# Phase 01: Code Review Report

**Reviewed:** 2026-09-11T19:22:44Z
**Depth:** deep
**Files Reviewed:** 36
**Diff:** `6b378929^..7941235`
**Status:** issues_found

## Narrative Findings (AI reviewer)

## Summary

This review traced the complete Phase 01 source diff and the current payment, booking, authentication, persistence, chat, accessibility, localization, and iOS link-delivery call chains. The integrated head materially resolves most of the original report: strict payment decoding, request timeout handling, charge-level state-matrix derivation and rehydration, centralized auth invalidation, synchronous booking-submit deduplication, localized copy, shared-control accessibility semantics, and removal of fabricated chat data are now supported by source and tests.

Two financial-state blockers remain. Canonical booking-level payment states are not represented consistently and can still unlock cash or be collapsed to `paid`; separately, a pending or indeterminate attempt can be abandoned and erased through normal wizard navigation. Four warnings remain around quote currency authority, terminal retry behavior, method-card accessibility/error focus, and the lack of a reliable JS-readiness boundary for cold scene links.

The supplied integrated receipts are: 11/11 Jest suites and 140/140 tests passing; `npx tsc --noEmit`, locale parsing, `git diff --check`, and the static scene contract passing; an Xcode 27/iOS 27 Debug build passing; and terminated plus warm custom-scheme native receipts passing. These receipts do not establish human visual/Dynamic Type/VoiceOver acceptance. Universal-link runtime remains explicitly unexecuted because this target has no Associated Domains entitlement or real test URL.

## Prior Finding Disposition

- **CR-01 — partially resolved.** The API now recognizes an already-paid response and the UI locks known `paid`/`completed`/`refunded` bookings. Booking-level processing and restitution states remain inconsistent; see CR-04.
- **CR-02 — partially resolved.** Charge responses and persisted charges now derive all nine frozen matrix phases through one function. Booking-level status handling still collapses distinct restitution states; see CR-04.
- **CR-03 — resolved.** `utils/chat-api.ts` no longer contains demo rooms/messages or fake-send behavior; authenticated empty results remain empty.
- **WR-01 — resolved.** The charge decoder validates version, positive safe-integer amount, exact THB display total, legal state pairs, and ISO expiry.
- **WR-02 — resolved.** Charge creation has a bounded timeout and maps ambiguous timeout/network outcomes conservatively.
- **WR-03 — resolved.** Missing, corrupt, expired, unauthorized, logout, and identity-change paths use centralized auth invalidation and clear the payment session.
- **WR-04 — resolved.** Booking submit now has a same-render synchronous latch plus disabled/loading UI coverage.
- **WR-05 — partially resolved.** The visible summary no longer invents group/add-on prices, but the returned booking currency is still absent and locally relabeled as THB; see WR-05 below.
- **WR-06 — resolved in source.** Phase copy and accessibility strings are present in English and Thai and date/amount formatting uses the active locale. Human translation and visual acceptance remain a gate, not a source finding.
- **WR-07 — partially resolved.** Button, progress, terms checkbox, and radio state semantics are implemented. Method-card accessible names and error focus remain incomplete; see WR-10.
- **WR-08 — open.** Native preservation and delivery receipts improve evidence, but delivery is still synchronized to native mount rather than JS listener readiness; see WR-08.

## Critical Issues

### CR-04: Booking-level payment truth can unlock cash and collapse restitution into paid

**Classification:** BLOCKER
**File:** `/Volumes/madara/2026/Projects/thoughtseed/tirak/.worktrees/tirak-mobile-phase1-clean/app/api/booking/booking.ts:70-92`
**File:** `/Volumes/madara/2026/Projects/thoughtseed/tirak/.worktrees/tirak-mobile-phase1-clean/stores/payment-store.ts:79-86`
**File:** `/Volumes/madara/2026/Projects/thoughtseed/tirak/.worktrees/tirak-mobile-phase1-clean/stores/payment-store.ts:109-113`
**File:** `/Volumes/madara/2026/Projects/thoughtseed/tirak/.worktrees/tirak-mobile-phase1-clean/components/booking/steps/PaymentSelectionStep.tsx:151-166`
**File:** `/Volumes/madara/2026/Projects/thoughtseed/tirak/.worktrees/tirak-mobile-phase1-clean/components/booking/steps/PaymentSelectionStep.tsx:238-276`
**File:** `/Volumes/madara/2026/Projects/thoughtseed/tirak/.worktrees/tirak-mobile-phase1-clean/__tests__/payment-store.test.ts:142-149`
**Issue:** The booking API type admits only `pending | paid | refunded`, while the payment store accepts arbitrary booking payment strings. Checkout locks booking-level `paid`, `completed`, and `refunded`, but ignores `processing`, `restitution_pending`, `restituted`, and `restitution_failed` until a charge attempt is made. A confirmed booking in one of those states can therefore select cash and continue. If PromptPay is selected instead, `createCharge` maps all three restitution outcomes to `phase: 'paid'` plus `already-paid`, destroying whether money is being returned, was returned, or restitution failed. The parameterized test codifies that collapse instead of preserving the financial state.

**Fix:** Define one canonical booking payment-status union shared with the backend contract. Derive booking-level lock and presentation state before rendering or creating a charge: `processing` must remain uncertain/locked, and each restitution state must remain distinct. Never translate restitution to paid. Add UI/store tests for every public booking status, including assertions that cash cannot be selected for processing or restitution states and that each status survives unchanged.

### CR-05: Normal wizard navigation can erase a financially live or unknown attempt

**Classification:** BLOCKER
**File:** `/Volumes/madara/2026/Projects/thoughtseed/tirak/.worktrees/tirak-mobile-phase1-clean/components/booking/steps/PaymentSelectionStep.tsx:353-360`
**File:** `/Volumes/madara/2026/Projects/thoughtseed/tirak/.worktrees/tirak-mobile-phase1-clean/components/booking/BookingWizard.tsx:95-103`
**File:** `/Volumes/madara/2026/Projects/thoughtseed/tirak/.worktrees/tirak-mobile-phase1-clean/components/booking/steps/BookingConfirmationStep.tsx:80-87`
**File:** `/Volumes/madara/2026/Projects/thoughtseed/tirak/.worktrees/tirak-mobile-phase1-clean/stores/booking-store.ts:465-471`
**File:** `/Volumes/madara/2026/Projects/thoughtseed/tirak/.worktrees/tirak-mobile-phase1-clean/stores/payment-store.ts:93-99`
**File:** `/Volumes/madara/2026/Projects/thoughtseed/tirak/.worktrees/tirak-mobile-phase1-clean/stores/payment-store.ts:160-168`
**File:** `/Volumes/madara/2026/Projects/thoughtseed/tirak/.worktrees/tirak-mobile-phase1-clean/__tests__/payment-session-reset.test.ts:99-103`
**Issue:** The payment footer never disables Previous, including while a charge is `creating`, `pending`, or `indeterminate`. Returning to summary permits another booking submission; assigning its different booking ID resets the previous payment state. Continuing to confirmation and choosing either exit action calls `resetBooking`, which unconditionally clears the persisted payment session even when the UI says the booking should be checked later. The current reset test requires this unconditional deletion. A charge that exists or may exist can consequently lose its recovery identity, and the user can start a second booking/payment attempt.

**Fix:** Separate wizard-form cleanup from payment-attempt retention. Block backward navigation while creation is in flight or the outcome is pending/unknown; preserve a booking-keyed financial session when leaving confirmation; and clear it only after a proved no-charge result, a safely settled/restituted lifecycle, or explicit account isolation. Add end-to-end store/screen tests proving pending and indeterminate attempts survive exit/relaunch and cannot be replaced by a new booking.

## Warnings

### WR-05: The booking response still has no authoritative currency and is relabeled as THB

**Classification:** WARNING
**File:** `/Volumes/madara/2026/Projects/thoughtseed/tirak/.worktrees/tirak-mobile-phase1-clean/app/api/booking/booking.ts:73-95`
**File:** `/Volumes/madara/2026/Projects/thoughtseed/tirak/.worktrees/tirak-mobile-phase1-clean/components/booking/steps/BookingSummaryStep.tsx:194-215`
**File:** `/Volumes/madara/2026/Projects/thoughtseed/tirak/.worktrees/tirak-mobile-phase1-clean/stores/booking-store.ts:67-79`
**Issue:** The improvement to use the server's `totalAmount` removes the earlier local add-on/group arithmetic mismatch, but the booking response contains no currency and the client hard-codes `currency: 'THB'` without runtime validation. Any non-THB service total—or malformed response total—will be stored and rendered as THB, while the PromptPay contract correctly rejects non-THB charges. The current THB fixture does not prove the general booking boundary.

**Fix:** This requires backend-authority coordination: include an explicit currency in the canonical create-booking response, decode both amount and currency at runtime, and persist that quote unchanged. Fail PromptPay closed unless the authoritative currency is THB; do not infer THB locally. Add malformed, missing-currency, and non-THB response tests.

### WR-08: Deferred cold links are released before JS listener readiness is established

**Classification:** WARNING
**File:** `/Volumes/madara/2026/Projects/thoughtseed/tirak/.worktrees/tirak-mobile-phase1-clean/ios/Tirak/AppDelegate.swift:34-38`
**File:** `/Volumes/madara/2026/Projects/thoughtseed/tirak/.worktrees/tirak-mobile-phase1-clean/ios/Tirak/AppDelegate.swift:87-126`
**File:** `/Volumes/madara/2026/Projects/thoughtseed/tirak/.worktrees/tirak-mobile-phase1-clean/ios/Tirak/SceneDelegate.swift:18-30`
**File:** `/Volumes/madara/2026/Projects/thoughtseed/tirak/.worktrees/tirak-mobile-phase1-clean/ios/scripts/verify-scene-link-runtime.sh:17-57`
**Issue:** Cold scene links are now preserved until `RCTContentDidAppearNotification`, then emitted one main-queue turn later. That notification proves native React content mounted, not that the JS `Linking.addEventListener` effect is registered. The verifier only observes native “preserved” and “delivered” log lines; it never asserts that JS received the URL or navigated to the intended route. A slow JS bundle/effect can therefore still miss the one-shot event even though the new native receipt passes.

**Fix:** Use an explicit JS-ready handshake or a bridge-backed initial-URL queue that retains the scene link until JS consumes it, then acknowledge and clear it. Extend the runtime verifier to assert a JS-side URL/route receipt for terminated and warm launches. Once Associated Domains and a real URL exist, run the same assertion for universal links; that missing external prerequisite is tracked as an acceptance gap rather than a code defect.

### WR-09: Failed and expired PromptPay states advertise retry but provide no retry transition

**Classification:** WARNING
**File:** `/Volumes/madara/2026/Projects/thoughtseed/tirak/.worktrees/tirak-mobile-phase1-clean/components/booking/steps/PaymentSelectionStep.tsx:185-210`
**File:** `/Volumes/madara/2026/Projects/thoughtseed/tirak/.worktrees/tirak-mobile-phase1-clean/components/booking/steps/PaymentSelectionStep.tsx:280-341`
**Issue:** `failed` and `expired` render terminal copy that tells the user to try PromptPay again or create a new QR, but the create button is rendered only for `idle` and the retry button only for `error`. Switching to cash and back does not reset the store phase. The user can choose cash and continue, but cannot perform the retry the screen promises.

**Fix:** Add an explicit safe retry action for `failed`/`expired` that clears only the obsolete charge and returns the same booking to `idle`, then invokes idempotent charge creation. Alternatively change the copy to omit retry. Add interaction tests that exercise the button and prove a second request is impossible for pending, indeterminate, paid, or restitution states.

### WR-10: Method accessible names omit critical status/reason text and errors receive no focus

**Classification:** WARNING
**File:** `/Volumes/madara/2026/Projects/thoughtseed/tirak/.worktrees/tirak-mobile-phase1-clean/components/booking/steps/PaymentSelectionStep.tsx:35-45`
**File:** `/Volumes/madara/2026/Projects/thoughtseed/tirak/.worktrees/tirak-mobile-phase1-clean/components/booking/steps/PaymentSelectionStep.tsx:68-118`
**File:** `/Volumes/madara/2026/Projects/thoughtseed/tirak/.worktrees/tirak-mobile-phase1-clean/components/booking/steps/PaymentSelectionStep.tsx:238-276`
**File:** `/Volumes/madara/2026/Projects/thoughtseed/tirak/.worktrees/tirak-mobile-phase1-clean/components/booking/steps/PaymentSelectionStep.tsx:307-323`
**Issue:** The real radio controls now expose role, selected, and disabled state, but their explicit accessible labels contain only the method name. That suppresses the visible PromptPay “local test” badge and the helper explaining why a method is unavailable/locked from the control's accessible name. When charge creation fails, the live region announces changed text but focus is not moved to the error/recovery action, so screen-reader users can remain at the triggering button without reliable recovery context.

**Fix:** Compose localized method labels/hints from method, local-test status, and the active availability/lock reason. Give the error heading a ref and programmatically focus it after failure (or implement an equivalent tested focus contract). Exercise the real component with Thai and English accessibility-name/state assertions plus an error-focus test.

## Acceptance and Authority Gates (not counted as findings)

- Human visual review, Dynamic Type review, Thai-language quality review, and VoiceOver traversal/focus approval have not occurred. Automated semantics and locale parity do not replace those gates.
- Universal-link runtime verification is skipped because the app has no Associated Domains entitlement and no real test URL. This external prerequisite must be supplied before universal-link acceptance can close.
- No provider, staging, deployment, release, or backend contract mutation is authorized or evidenced by this local Phase 01 review. WR-05 specifically requires a canonical backend response change before the mobile boundary can be complete.

---

_Reviewed: 2026-09-11T19:22:44Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: deep_
