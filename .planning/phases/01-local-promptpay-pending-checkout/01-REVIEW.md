---
phase: 01-local-promptpay-pending-checkout
reviewed: 2026-09-11T18:23:18Z
depth: standard
files_reviewed: 30
files_reviewed_list:
  - __tests__/BookingWizardPaymentFlow.test.tsx
  - __tests__/PromptPayCheckout.test.tsx
  - __tests__/payment-api.test.ts
  - __tests__/payment-capabilities.test.ts
  - __tests__/payment-session-reset.test.ts
  - __tests__/payment-store.test.ts
  - app/api/booking/booking.ts
  - app/api/payment/payment.ts
  - components/booking/BookingStepFooter.tsx
  - components/booking/BookingWizard.tsx
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
  - jest.config.js
  - locales/en.json
  - locales/th.json
  - scripts/promptpay-contract-mock.mjs
  - stores/auth-store.ts
  - stores/booking-store.ts
  - stores/payment-store.ts
  - utils/chat-api.ts
findings:
  critical: 3
  warning: 8
  info: 0
  total: 11
status: issues_found
---

# Phase 01: Code Review Report

**Reviewed:** 2026-09-11T18:23:18Z  
**Depth:** standard  
**Files Reviewed:** 30  
**Status:** issues_found

## Narrative Findings (AI reviewer)

## Summary

The supplied receipts show 8/8 Jest suites and 67/67 tests passing, a clean TypeScript check, parseable locale JSON, a passing scene-lifecycle shell check, and a successful Xcode 27/iOS 27 simulator build. Those automated receipts do not exercise several contract and state transitions below, and they are not human visual or accessibility approval.

The implementation has three blockers: an already-paid booking can be downgraded into cash-payment instructions, terminal server payment truth is collapsed into an unknown/pending state, and unrelated production chat behavior was changed to fabricate conversations. Eight additional correctness, robustness, localization, accessibility, and lifecycle warnings should be repaired before acceptance.

## Critical Issues

### CR-01: Already-paid bookings are treated as safe to pay again in cash

**Classification:** BLOCKER  
**File:** `/Volumes/madara/2026/Projects/thoughtseed/tirak/.worktrees/tirak-mobile-phase1-clean/app/api/payment/payment.ts:152-154`  
**File:** `/Volumes/madara/2026/Projects/thoughtseed/tirak/.worktrees/tirak-mobile-phase1-clean/components/booking/steps/PaymentSelectionStep.tsx:47-52`  
**File:** `/Volumes/madara/2026/Projects/thoughtseed/tirak/.worktrees/tirak-mobile-phase1-clean/components/booking/steps/PaymentSelectionStep.tsx:143-172`  
**File:** `/Volumes/madara/2026/Projects/thoughtseed/tirak/.worktrees/tirak-mobile-phase1-clean/components/booking/steps/BookingConfirmationStep.tsx:107-120`  
**Issue:** The backend uses the same 409 `Booking is not payable` error label both when a booking is unconfirmed and when its `payment_status` is already `paid`, `completed`, or `refunded`; the latter response includes `This booking has already been paid`. The client collapses every such response into `booking-not-payable`, categorizes it as a definite no-charge outcome, unlocks cash, permits continuation, and then renders cash-payment instructions. A traveler can therefore be told to pay the guide again after the server explicitly reported that the booking was already paid.

**Fix:** Introduce a stable backend/client reason such as `already-paid` (prefer a machine-readable backend code rather than message parsing). Treat it as an authoritative terminal booking-state change: disable all alternate payment actions, refresh the booking, and render paid/restitution-aware copy. Only unlock cash after a response that unambiguously proves no charge exists and the booking remains unpaid.

### CR-02: Successful server payment truth is collapsed into error and later resurrected as pending

**Classification:** BLOCKER  
**File:** `/Volumes/madara/2026/Projects/thoughtseed/tirak/.worktrees/tirak-mobile-phase1-clean/app/api/payment/payment.ts:66-83`  
**File:** `/Volumes/madara/2026/Projects/thoughtseed/tirak/.worktrees/tirak-mobile-phase1-clean/stores/payment-store.ts:13-29`  
**File:** `/Volumes/madara/2026/Projects/thoughtseed/tirak/.worktrees/tirak-mobile-phase1-clean/stores/payment-store.ts:78-91`  
**File:** `/Volumes/madara/2026/Projects/thoughtseed/tirak/.worktrees/tirak-mobile-phase1-clean/stores/payment-store.ts:128-136`  
**File:** `/Volumes/madara/2026/Projects/thoughtseed/tirak/.worktrees/tirak-mobile-phase1-clean/components/booking/steps/BookingConfirmationStep.tsx:107-120`  
**Issue:** The API parser deliberately accepts the contract's terminal `successful`, `failed`, and `expired` attempt states and `paid`/failure payment states. The payment store has no terminal phases: anything other than creating/indeterminate/pending becomes `phase: 'error'` with `errorKind: 'unknown'`. On rehydration, any persisted charge— including a successful, failed, or expired one—is unconditionally restored as `phase: 'pending'`. The confirmation UI then labels every PromptPay selection as pending or uncertain. This discards authoritative financial state returned by the server and can indefinitely lock method switching or misrepresent a paid/failed charge.

**Fix:** Derive the store phase from the validated `(attemptStatus, paymentStatus)` pair and add explicit terminal states, for example `paid`, `failed`, `expired`, and restitution states. Rehydrate through the same derivation function instead of `persisted.charge ? 'pending' : 'idle'`. Add store/UI tests for every pair in `tirak-payments-v1/state-matrix.json`, especially a successful response returned by the idempotent POST endpoint.

### CR-03: Empty or failed chat requests now fabricate conversations and fake successful sends

**Classification:** BLOCKER  
**File:** `/Volumes/madara/2026/Projects/thoughtseed/tirak/.worktrees/tirak-mobile-phase1-clean/utils/chat-api.ts:21-45`  
**File:** `/Volumes/madara/2026/Projects/thoughtseed/tirak/.worktrees/tirak-mobile-phase1-clean/utils/chat-api.ts:128-198`  
**File:** `/Volumes/madara/2026/Projects/thoughtseed/tirak/.worktrees/tirak-mobile-phase1-clean/utils/chat-api.ts:356-360`  
**File:** `/Volumes/madara/2026/Projects/thoughtseed/tirak/.worktrees/tirak-mobile-phase1-clean/utils/chat-api.ts:386-440`  
**Issue:** `apiGet` returns `null` for missing authentication, network errors, non-2xx responses, and unsuccessful envelopes. `getRooms` now substitutes the same mutable `demoRooms` collection for all of those failures and for a legitimate authenticated `{ items: [] }` inbox. Opening one of those rooms returns fabricated messages, and `sendMessage` reports success while mutating only in-memory demo data. This unrelated change is outside the Phase 01 traveler-payment scope and causes production users to see conversations that never happened and messages that were never delivered.

**Fix:** Restore `getRooms` to return the server's array, including an empty array, and surface transport/auth failures separately. If Apple-review fixtures are still required, gate them behind an explicit, fail-closed review capability plus an identified demo account; never infer demo mode from empty data or an error. Keep demo message mutation in a separate adapter that cannot be selected by normal production requests.

## Warnings

### WR-01: The payment boundary accepts contract-invalid currency and amount combinations

**Classification:** WARNING  
**File:** `/Volumes/madara/2026/Projects/thoughtseed/tirak/.worktrees/tirak-mobile-phase1-clean/app/api/payment/payment.ts:88-123`  
**Issue:** `parseCharge` accepts any non-empty string currency, does not require the frozen contract's `THB`, and independently accepts positive `amountSatang` and `displayTotalThb` values even when they disagree. It also accepts impossible attempt/payment pairs such as `successful` plus `pending`. Those values are persisted and rendered as server truth, so a malformed or drifted response can display a materially wrong amount/status while still passing validation.

**Fix:** Validate `currency === 'THB'`, require `displayTotalThb === amountSatang / 100`, validate `expiresAt` as a finite ISO timestamp when present, and enforce the state-matrix pairings. Put these checks in one schema/decoder and add rejection tests for mismatched amounts, currencies, dates, and status pairs.

### WR-02: A stalled charge request can leave checkout locked forever

**Classification:** WARNING  
**File:** `/Volumes/madara/2026/Projects/thoughtseed/tirak/.worktrees/tirak-mobile-phase1-clean/app/api/payment/payment.ts:158-179`  
**File:** `/Volumes/madara/2026/Projects/thoughtseed/tirak/.worktrees/tirak-mobile-phase1-clean/components/booking/steps/PaymentSelectionStep.tsx:143-172`  
**Issue:** The Axios POST has no timeout or cancellation. A loopback fixture, network stack, or server that accepts the connection without responding leaves the store in `creating`, keeps cash and method switching locked, and never reaches the mapped `network`/indeterminate recovery state.

**Fix:** Supply a bounded Axios timeout and an abort signal tied to the screen/session. Map timeout/abort-after-send conservatively to `indeterminate` or `network` according to whether the request may have reached the server, and provide an explicit status-recovery path rather than an endless spinner.

### WR-03: Authentication invalidation does not clear the persisted payment session

**Classification:** WARNING  
**File:** `/Volumes/madara/2026/Projects/thoughtseed/tirak/.worktrees/tirak-mobile-phase1-clean/stores/auth-store.ts:338-373`  
**File:** `/Volumes/madara/2026/Projects/thoughtseed/tirak/.worktrees/tirak-mobile-phase1-clean/stores/payment-store.ts:121-136`  
**Issue:** `validateToken` resets payment only when it parses a valid stored user whose ID differs. Missing credentials, malformed credentials, and secure-storage failures set `isAuthenticated: false` but leave the separately persisted booking, charge ID, QR URL, and amount intact; the payment store will rehydrate any such charge as pending. The isolation tests cover explicit logout and user-ID mutation, but not the normal invalid-token startup paths.

**Fix:** Centralize an awaitable auth-invalidation routine that clears user state, auth/refresh credentials, and `tirak-payment-session`, and invoke it from the parse-error, no-token, exception, unauthorized-event, and explicit logout paths. Add rehydration tests for missing/corrupt credentials with a previously persisted charge.

### WR-04: The booking submit guard still permits a same-render double submission

**Classification:** WARNING  
**File:** `/Volumes/madara/2026/Projects/thoughtseed/tirak/.worktrees/tirak-mobile-phase1-clean/components/booking/steps/BookingSummaryStep.tsx:130-172`  
**File:** `/Volumes/madara/2026/Projects/thoughtseed/tirak/.worktrees/tirak-mobile-phase1-clean/components/booking/steps/BookingSummaryStep.tsx:515-522`  
**Issue:** The handler checks the render-captured `createBookingMutation.isPending`, but the footer remains enabled and is not given a loading state. Two presses before React commits the pending-state rerender can both pass the guard and issue two non-idempotent booking mutations. That can create duplicate bookings before the payment step even though charge creation itself is deduplicated.

**Fix:** Add a synchronous `useRef` submission latch set before any `await`, clear it in `finally`, and pass both `nextDisabled={... || isPending}` and `loading={isPending}` to the footer. The server request should also carry an idempotency key. Add a test that invokes the handler twice before the first mutation settles and asserts one booking call.

### WR-05: Summary, cash checkout, and server booking amounts can describe different purchases

**Classification:** WARNING  
**File:** `/Volumes/madara/2026/Projects/thoughtseed/tirak/.worktrees/tirak-mobile-phase1-clean/components/booking/steps/BookingSummaryStep.tsx:242-255`  
**File:** `/Volumes/madara/2026/Projects/thoughtseed/tirak/.worktrees/tirak-mobile-phase1-clean/components/booking/steps/BookingSummaryStep.tsx:470-487`  
**File:** `/Volumes/madara/2026/Projects/thoughtseed/tirak/.worktrees/tirak-mobile-phase1-clean/stores/booking-store.ts:351-356`  
**File:** `/Volumes/madara/2026/Projects/thoughtseed/tirak/.worktrees/tirak-mobile-phase1-clean/stores/booking-store.ts:489-503`  
**File:** `/Volumes/madara/2026/Projects/thoughtseed/tirak/.worktrees/tirak-mobile-phase1-clean/components/booking/steps/PaymentSelectionStep.tsx:148-163`  
**Issue:** The summary multiplies service price by group size and adds hard-coded add-on prices. `calculateTotal` returns only one base service price, and `prepareBookingRequest` sends neither group size nor add-ons. Payment selection stores that smaller base price for cash, while PromptPay eventually switches to the backend-derived booking amount. For a group/add-on selection, the app can therefore show three incompatible totals and confirm the wrong cash amount.

**Fix:** Define one authoritative booking quote contract. Send the selected priced customizations to the booking API if they are real purchase inputs, persist the returned booking total/currency, and use that value for cash and pre-charge display. If customizations are not bookable, remove their prices from the total instead of presenting them as payable line items.

### WR-06: New checkout and confirmation content bypasses localization

**Classification:** WARNING  
**File:** `/Volumes/madara/2026/Projects/thoughtseed/tirak/.worktrees/tirak-mobile-phase1-clean/components/booking/steps/PaymentSelectionStep.tsx:180-212`  
**File:** `/Volumes/madara/2026/Projects/thoughtseed/tirak/.worktrees/tirak-mobile-phase1-clean/components/booking/steps/PaymentSelectionStep.tsx:235-297`  
**File:** `/Volumes/madara/2026/Projects/thoughtseed/tirak/.worktrees/tirak-mobile-phase1-clean/components/booking/steps/BookingConfirmationStep.tsx:84-99`  
**File:** `/Volumes/madara/2026/Projects/thoughtseed/tirak/.worktrees/tirak-mobile-phase1-clean/components/booking/steps/BookingConfirmationStep.tsx:126-155`  
**File:** `/Volumes/madara/2026/Projects/thoughtseed/tirak/.worktrees/tirak-mobile-phase1-clean/components/booking/steps/BookingConfirmationStep.tsx:202-219`  
**Issue:** Large parts of the new flow are hard-coded in English (`Payment summary`, `Recommended`, safety/retry/continue copy, countdown units, calendar alerts and event text), accessibility labels append English text, and confirmation forces `en-US` date/time formatting. The added Thai locale entries therefore do not produce a Thai checkout or confirmation experience.

**Fix:** Move every user-visible and accessibility string into the locale files, use interpolation/pluralization for countdown values, and format dates/times with the active i18n locale. Add a Thai rendering test that rejects fallback English in the Phase 01 screens.

### WR-07: Core wizard controls and progress lack required accessibility semantics

**Classification:** WARNING  
**File:** `/Volumes/madara/2026/Projects/thoughtseed/tirak/.worktrees/tirak-mobile-phase1-clean/components/ui/Button.tsx:223-277`  
**File:** `/Volumes/madara/2026/Projects/thoughtseed/tirak/.worktrees/tirak-mobile-phase1-clean/components/ui/ProgressBar.tsx:109-210`  
**File:** `/Volumes/madara/2026/Projects/thoughtseed/tirak/.worktrees/tirak-mobile-phase1-clean/components/booking/steps/BookingSummaryStep.tsx:491-511`  
**Issue:** The shared `Button` does not default to `accessibilityRole="button"` and does not expose disabled/busy state; the progress UI has no `progressbar` role or current/min/max value; and the terms control is a visual checkbox with neither checkbox role nor checked state. Component tests replace the real Button with an accessible mock, so the green suite masks the shipped semantics. Screen-reader users cannot reliably identify checkout actions, loading/disabled state, current wizard progress, or whether terms are accepted.

**Fix:** Default Button to role `button` and merge `accessibilityState={{ disabled: disabled || loading, busy: loading }}` with caller state. Give ProgressBar an accessible label/value (`min: 1`, `max: totalSteps`, `now: currentStep`) and hide decorative children. Give the terms touchable `accessibilityRole="checkbox"`, a localized label, and `accessibilityState={{ checked: termsAccepted }}`. Exercise the real components in accessibility tests instead of mocking them away.

### WR-08: Cold-start scene URLs can be emitted before React Native can receive them

**Classification:** WARNING  
**File:** `/Volumes/madara/2026/Projects/thoughtseed/tirak/.worktrees/tirak-mobile-phase1-clean/ios/Tirak/AppDelegate.swift:11-49`  
**File:** `/Volumes/madara/2026/Projects/thoughtseed/tirak/.worktrees/tirak-mobile-phase1-clean/ios/Tirak/SceneDelegate.swift:18-29`  
**File:** `/Volumes/madara/2026/Projects/thoughtseed/tirak/.worktrees/tirak-mobile-phase1-clean/ios/Tirak/SceneDelegate.swift:32-60`  
**File:** `/Volumes/madara/2026/Projects/thoughtseed/tirak/.worktrees/tirak-mobile-phase1-clean/ios/scripts/verify-scene-lifecycle.sh:12-31`  
**Issue:** React Native is started with AppDelegate launch options before the scene connects. A cold-start URL or universal-link activity arrives in `UIScene.ConnectionOptions`, not those saved launch options, and SceneDelegate immediately forwards it as an `RCTLinkingManager` notification. React Native 0.79's linking manager stores no pending notification: `getInitialURL` reads only bridge launch options, while URL events are delivered only to an already-registered observer ([upstream source](https://github.com/facebook/react-native/blob/v0.79.5/packages/react-native/Libraries/LinkingIOS/RCTLinkingManager.mm#L15-L20)). The event can therefore be lost during JS startup. The shell script checks only strings and deployment target, so it cannot detect this lifecycle failure.

**Fix:** Preserve the first scene URL/activity and provide it through the bridge's actual initial-link path, or queue it until React Native's linking observer is ready; do not fire a one-shot notification during bridge startup. Add a native integration test that cold-launches the terminated app through both the custom scheme and a universal link and asserts the intended route, plus warm-link coverage.

---

_Reviewed: 2026-09-11T18:23:18Z_  
_Reviewer: the agent (gsd-code-reviewer)_  
_Depth: standard_
