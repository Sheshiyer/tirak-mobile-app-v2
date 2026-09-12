---
phase: 01-local-promptpay-pending-checkout
plan: 01
subsystem: payments
tags: [react-native, zustand, axios, promptpay, contract-testing]

requires:
  - phase: planning
    provides: tirak-payments-v1 request, response, and state contracts
provides:
  - Authenticated contract-safe PromptPay charge client
  - Server-authoritative payment session store with duplicate-submit protection
  - Booking and user session isolation for pending payment state
affects: [01-02-checkout-ui, payment-selection, booking-confirmation]

tech-stack:
  added: []
  patterns: [response allowlisting, secure partial persistence, session-version invalidation]

key-files:
  created: [app/api/payment/payment.ts, stores/payment-store.ts]
  modified: [stores/auth-store.ts, stores/booking-store.ts, jest.config.js]

key-decisions:
  - "The client sends only bookingId and method; amount, currency, and provider authority remain server-owned."
  - "Authentication invalidation increments a session version so stale asynchronous responses cannot restore another user's state; unresolved financial truth remains bound to its original booking."
  - "Only booking, selected method, and allowlisted charge fields are persisted through secure storage."

patterns-established:
  - "Server-owned payment truth: the store has no public paid or successful mutation."
  - "Cross-session isolation: logout and user changes invalidate payment state; safe booking resets clear, while unresolved sessions remain identity-bound until resolution."

requirements-completed: [PAY-01, PAY-02, PAY-03, PAY-04, SAFE-01, SAFE-02, TEST-01]

duration: 32min
completed: 2026-09-01
---

# Phase 1 Plan 01: Payment Boundary Summary

**Authenticated PromptPay contract client with secure, server-authoritative pending state and cross-session invalidation**

## Performance

- **Duration:** 32 min
- **Started:** 2026-08-31T18:29:00Z
- **Completed:** 2026-08-31T19:01:20Z
- **Tasks:** 3
- **Files modified:** 9

## Accomplishments

- Froze the mobile request to `{ bookingId, method: 'promptpay' }` and allowlisted the nine `tirak-payments-v1` response fields.
- Added confirmed-booking eligibility, one-promise duplicate-submit protection, safe error kinds, and no local paid/success action.
- Cleared payment state across logout and user identity changes, cleared safe booking sessions, and retained unresolved sessions only under their original identity, including regressions for late responses and replacement attempts.

## Task Commits

1. **Task 1: Failing frozen-contract and session tests** - `c195390` (test)
2. **Task 2: Typed client and guarded session store** - `2c2f6c4` (feat)
3. **Task 3: Restore pre-existing full-suite chat fixture expectation** - `df128cc` (fix)

**Plan metadata:** recorded by the summary commit following this file.

## RED/GREEN Evidence

- RED: `npx jest __tests__/payment-api.test.ts __tests__/payment-store.test.ts __tests__/payment-session-reset.test.ts --runInBand` exited non-zero because `app/api/payment/payment` and `stores/payment-store` did not yet exist.
- GREEN: the same focused command passed 3 suites and 25 tests.
- Regression: `npm test -- --runInBand` passed 5 suites and 36 tests; `npx tsc --noEmit` exited 0.
- Safety scan found no Omise secret identifiers, card/CVV fields, local paid setters, or Authorization/QR logging in the changed payment/session files.
- The isolated worktree has no `ios/Podfile` or `ios/Podfile.lock` diff. The original checkout's user-owned iOS diff hash remained `728c18c6cdfe1b4f7eddc40b496974dc4f713cade6aec478db792ee425c51cba`.

## Files Created/Modified

- `app/api/payment/payment.ts` - Authenticated charge creation, contract parsing, response allowlisting, and safe error taxonomy.
- `stores/payment-store.ts` - Secure payment session, confirmed-booking guard, duplicate-submit lock, and stale-session protection.
- `stores/booking-store.ts` - Clears payment state when the booking flow resets.
- `stores/auth-store.ts` - Clears payment state on logout and authenticated-user transitions.
- `__tests__/payment-api.test.ts` - Frozen request/response and backend-error coverage.
- `__tests__/payment-store.test.ts` - Eligibility, idempotent in-flight behavior, and server-truth coverage.
- `__tests__/payment-session-reset.test.ts` - Booking/user isolation and late-response invalidation coverage.
- `jest.config.js` - Enables the existing React Native Jest transform and `__DEV__` test runtime.
- `utils/chat-api.ts` - Restores the existing demo-room fallback expected by the repository's pre-existing chat test.

## Decisions Made

- A late request may still resolve to its original caller, but it cannot write to a payment session invalidated by reset, booking change, logout, or user change.
- Definite and uncertain failures remain separate stable error kinds so the UI can permit cash only when no charge may exist.
- Provider credentials, provider SDKs, payment amount authority, polling, terminal success, and staging behavior remain outside this mobile phase.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Invalidated stale asynchronous charge responses**
- **Found during:** Task 2 semantic review
- **Issue:** A request started before logout could resolve afterward and restore the prior user's charge state.
- **Fix:** Added session-version invalidation plus an explicit late-response regression.
- **Files modified:** `stores/payment-store.ts`, `__tests__/payment-session-reset.test.ts`
- **Verification:** Focused suite passes, including the reset-before-resolution case.
- **Committed in:** `2c2f6c4`

**2. [Rule 3 - Blocking] Repaired the repository's Jest React Native transform**
- **Found during:** Task 3 full-suite verification
- **Issue:** The pre-existing Jest configuration did not transform React Native and did not define `__DEV__`.
- **Fix:** Added the narrow React Native transform exception and test-only `__DEV__` global.
- **Files modified:** `jest.config.js`
- **Verification:** Full Jest suite and TypeScript both exit 0.
- **Committed in:** `2c2f6c4`

**3. [Rule 1 - Bug] Restored the existing empty-room demo fallback**
- **Found during:** Task 3 full-suite verification after the Jest blocker was removed
- **Issue:** `getRooms()` returned an empty array while the repository's existing test and demo fixture require `demoRooms` when the API returns no items.
- **Fix:** Return `demoRooms` only when the API item list is absent or empty.
- **Files modified:** `utils/chat-api.ts`
- **Verification:** The pre-existing chat suite and the complete 36-test suite pass.
- **Committed in:** `df128cc`

---

**Total deviations:** 3 auto-fixed (1 missing critical, 1 blocking, 1 bug)
**Impact on plan:** The first closes a payment-session safety race; the other two restore the repository's intended test baseline. No package, provider, backend, Tirak Plus, iOS dependency, or deployment state changed.

## Issues Encountered

- The mandated Forge production-coder dispatch timed out before making edits or commits. The authorized work continued in the isolated worktree with the same tests and gates; no partial subagent state existed.
- External Advisor review remained unavailable because its OAuth session had expired. No credential workaround or installation was attempted.

## User Setup Required

None - no external service or provider configuration was performed.

## Next Phase Readiness

- Plan 01-02 can consume the guarded payment client/store for the additive traveler checkout UI.
- Simulator proof must remain a disposable loopback fixture; it will not constitute Omise/provider, staging, or end-to-end payment proof.

---
*Phase: 01-local-promptpay-pending-checkout*
*Completed: 2026-09-01*
