---
phase: 01-local-promptpay-pending-checkout
reviewed: 2026-09-12T00:08:03Z
depth: deep
files_reviewed: 43
files_reviewed_list:
  - __tests__/BookingAccessibility.test.tsx
  - __tests__/BookingSummaryContracts.test.tsx
  - __tests__/BookingWizardPaymentFlow.test.tsx
  - __tests__/PromptPayCheckout.test.tsx
  - __tests__/booking-financial-contract.test.ts
  - __tests__/booking-format.test.ts
  - __tests__/chat-api.test.ts
  - __tests__/payment-api.test.ts
  - __tests__/payment-capabilities.test.ts
  - __tests__/payment-session-reset.test.ts
  - __tests__/payment-store.test.ts
  - __tests__/scene-link-consumption.test.ts
  - app/_layout.tsx
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
  - ios/Tirak/SceneLinkModule.h
  - ios/Tirak/SceneLinkModule.m
  - ios/Tirak/Tirak-Bridging-Header.h
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
  - utils/scene-link-consumption.ts
findings:
  critical: 0
  warning: 0
  info: 0
  total: 0
status: clean
---

# Phase 01: Code Review Report

**Reviewed:** 2026-09-12T00:08:03Z
**Depth:** deep
**Files Reviewed:** 43
**Diff:** `6b378929^..16af95adcd0cfe0a5d5212a489e75829b941de18`
**Status:** clean

## Narrative Findings (AI reviewer)

## Summary

The final integrated Phase 01 source diff, including the four-file SAFE-02 closure at exact HEAD `16af95adcd0cfe0a5d5212a489e75829b941de18`, was reviewed at deep cross-file depth across the booking response boundary, payment state matrix, persisted session lifecycle, direct reset and confirmation exits, duplicate/replacement guards, navigation, authentication isolation, localization, accessibility, chat transport, and iOS scene-link bridge. Every prior Critical and Warning finding has current source evidence of remediation. No remaining Phase 01 code defect was found.

All reviewed files meet the Phase 01 quality and safety standards. Exact-HEAD receipts report 13/13 Jest suites and 216/216 tests passing, including the focused SAFE-02/security run at 4/4 suites and 150/150 tests; `npx tsc --noEmit`, locale parsing, the static scene verifier, and `git diff --check` passing; an Xcode 27/iOS 27 Release build with an embedded JavaScript bundle and loopback `EXPO_PUBLIC_API_URL` passing; terminated-cold plus warm custom-scheme native and JavaScript-consumption receipts in one process; 18/18 verifier must-haves satisfied; 11/11 plan-time threats closed; and 8/8 human UAT checks accepted.

## Finding Disposition

### Original review

- **CR-01 — resolved.** Already-paid responses are recognized before generic not-payable handling, and known paid/restitution booking states lock alternate payment actions. The exact current backend message remains supported while the stable machine code is held as a backend contract gate.
- **CR-02 — resolved.** The frozen nine-pair charge matrix derives distinct creating, pending, indeterminate, paid, failed, expired, and restitution phases. Rehydration validates persisted charges and uses the same derivation.
- **CR-03 — resolved.** Production chat no longer substitutes fabricated rooms/messages or fake successful sends for empty and failed requests.
- **WR-01 — resolved.** The charge decoder validates the frozen version, fields, positive safe-integer amount, THB display consistency, legal state pairs, and ISO expiry.
- **WR-02 — resolved.** Charge creation has a bounded timeout and conservatively maps post-send timeout/cancellation outcomes to indeterminate.
- **WR-03 — resolved.** Centralized authentication invalidation clears in-memory and persisted payment state for missing/corrupt credentials, storage failure, unauthorized events, logout, and user identity change.
- **WR-04 — resolved.** Booking submission has a synchronous latch plus disabled/busy UI state, preventing same-render duplicate mutations.
- **WR-05 — resolved for the authorized local phase.** Server `totalAmount` is runtime-validated and used consistently; explicit response currency is preserved; explicit non-THB currency disables PromptPay before transport; and the charge boundary remains server-owned. Because the current booking response omits currency, expansion beyond the exact loopback THB fixture remains a backend-authority gate below.
- **WR-06 — resolved in source.** English and Thai Phase 01 strings are complete and parseable, and locale-aware amount/date formatting is used. Human language and visual approval remains separate.
- **WR-07 — resolved.** Shared buttons, progress, terms checkbox, payment radios, disabled/busy/selected state, and decorative-child hiding expose real accessibility semantics.
- **WR-08 — resolved for custom schemes.** A native registry retains the exact cold scene link until JavaScript handles and acknowledges it. The runtime verifier requires an embedded JS bundle and observes native preservation plus JS cold/warm consumption. Universal-link execution remains a separately unclaimed entitlement/URL gate.

### Remediation re-review

- **CR-04 — resolved.** The booking response exposes the canonical public payment-status union. Booking-level status maps to a distinct phase, locks processing/paid/restitution states before charge creation, preserves restitution truth, and is covered across store and UI matrices.
- **CR-05 — resolved.** Creating, pending, and indeterminate states block backward/close navigation. Form reset no longer deletes payment truth; confirmation exit releases only safe sessions; retained sessions survive exit/rehydration and prevent replacement by a new booking.
- **WR-05 — resolved within scope; external dependency retained.** Missing booking-response currency is not represented as server truth. The THB fallback is bounded to the local review flow, PromptPay remains hidden outside the exact development/loopback/port/flag capability, explicit non-THB values fail closed, and the backend owns amount/currency validation for charge creation.
- **WR-08 — resolved for the exercised custom-scheme path.** Cold delivery no longer depends on a one-turn listener timing assumption; JS reads a bridge-backed pending item and clears only its exact ID after handling. Native and JS receipts were observed in one PID for terminated and warm custom-scheme launches.
- **WR-09 — resolved.** Failed and expired attempts expose a same-booking retry that clears only obsolete charge state. Retry is refused for creating, pending, indeterminate, paid, and restitution phases.
- **WR-10 — resolved in source.** Localized accessible names include method, local-test status, and active lock/unavailability reason; errors receive programmatic accessibility focus; English/Thai semantics are covered by component tests.

### Final SAFE-02 re-review

- **SAFE-02 / D-14 direct-reset gap — resolved.** `resetBooking()` now invokes the shared state-derived release policy before clearing booking-form data. Paid, failed, expired, restituted, and definite-no-charge sessions may release; creating, pending, indeterminate, uncertain-error, and unresolved restitution sessions remain bound to the original booking.
- **Restored creating uncertainty — resolved.** Persistence maps a charge-less `creating` snapshot to `indeterminate` while retaining booking identity. `createCharge()` rejects restored creating/indeterminate and pending phases before transport, so relaunch cannot issue a duplicate request.
- **Replacement and auth isolation — resolved.** `setBooking()` refuses a different booking while any unresolved session is retained. Authentication invalidation and user-identity changes still clear payment memory and persisted storage, preventing one user's retained financial state from crossing to another user.
- **Regression scan — clean.** The final four-file change does not reopen CR-01 through CR-05 or WR-01 through WR-10. The reset matrix, rehydration matrix, duplicate/replacement guards, and existing checkout/auth tests exercise the changed call paths.

## External Authority and Acceptance Gates (not findings)

- **Booking-response currency:** the production backend still omits authoritative currency from the create-booking response. Phase 01 remains truthful because PromptPay is available only against the exact authorized loopback fixture and the server validates the charge amount/currency. A canonical response currency is required before broadening this UI to staging or production.
- **Already-paid machine code:** the production backend still lacks a stable `BOOKING_ALREADY_PAID` code. The client supports the current response text and future code, but staging/production enablement must remain held until the backend makes the reason contractual and the client/backend pair is re-verified.
- **Universal links:** no Associated Domains entitlement or real test URL exists, so universal-link runtime is explicitly unclaimed. Custom-scheme proof does not satisfy this gate.
- **Human acceptance:** Phase 01 visual, Accessibility Large, and VoiceOver checks are recorded as 8/8 accepted in `01-UAT.md`. This local acceptance does not imply provider, staging, production, release, or settlement approval.
- **Lifecycle authority:** no provider, staging, production, deployment, release, or backend mutation is authorized or evidenced by this mobile review.
- **Mobile HTTP E2E:** screenshot evidence uses real components and store state, while the independent loopback POST proves only the fixture contract. No in-app mobile-process POST receipt exists, so mobile HTTP E2E remains explicitly unclaimed.
- **Phase 2 recovery:** authenticated status refresh, terminal transitions, expiry, and indeterminate recovery remain Phase 2 responsibilities; their absence is not a Phase 01 local source defect.

---

_Reviewed: 2026-09-12T00:08:03Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: deep_
