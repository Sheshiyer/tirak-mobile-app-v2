# Phase 1: Local PromptPay pending checkout - Context

**Gathered:** 2026-08-31
**Status:** Ready for execution planning

<domain>
## Phase Boundary

Deliver one local traveler slice in `tirak-mobile-app-v2`: after the booking API has returned an owned confirmed booking, the traveler can retain cash or create one PromptPay charge against the disposable loopback worker and see the server-issued pending QR. This phase does not poll to a terminal state, recover indeterminate charges, alter the backend contract, touch Tirak Plus, use the supplier payment mock, enable staging/production, deploy, or perform provider-side operations.

</domain>

<decisions>
## Implementation Decisions

### Repository and actor

- **D-01:** Modify only `tirak-mobile-app-v2` traveler booking files; do not change Tirak Plus, supplier signup, admin, or companion payment surfaces.
- **D-02:** Preserve cash as a visible payment method for every Phase 1 state.

### Capability and booking order

- **D-03:** Show PromptPay only when `EXPO_PUBLIC_PROMPTPAY_ENABLED` is exactly `true` and `API_BASE_URL` is an HTTP loopback URL on port `8787`; any other combination hides it.
- **D-04:** Store the booking returned from the existing booking mutation before payment selection; refuse charge creation unless that record has `status === "confirmed"`.

### Contract and authority

- **D-05:** `createPromptPayCharge(bookingId)` sends exactly `{ bookingId, method: "promptpay" }`; it has no amount, currency, card, tip, gift, subscription, or beneficiary input.
- **D-06:** Persist and render charge identity, status, QR URL, amount, currency, and expiry only from the `tirak-payments-v1` response.
- **D-07:** QR display is always a pending payment state; no client timer, scan event, navigation event, or optimistic update may mark it successful.

### Traveler experience

- **D-08:** Use method-specific copy: cash describes direct guide payment; PromptPay describes server confirmation and never repeats cash-only instructions.
- **D-09:** Prevent duplicate booking or charge submission while a request is in flight and expose a retry only after a safe failure response.
- **D-10:** Verify the cash and confirmed-booking pending-QR paths on an iOS 27 Simulator against a disposable local mock, with no staging or real charge.
- **D-11:** Disable cash selection and all method switching once PromptPay is creating, in progress, pending, indeterminate, network-unknown, or otherwise unknown; re-enable cash only after a definite no-charge outcome.
- **D-12:** Repair the current wizard switch so Step 6 renders `PaymentSelectionStep` and Step 7 renders `BookingConfirmationStep`; prove the summary-to-payment-to-confirmation path in an integration test.
- **D-13:** Accept only the backend success envelope `{ success: true, data: charge }`; unwrap and allowlist `data`, and render nullable QR/charge fields without a broken image or invented identity.
- **D-14:** Clear the payment session on booking reset, logout, authenticated-user change, and confirmation exit so payment truth cannot leak across travelers or bookings.

### Implementer Discretion

- Exact names of internal hooks and selectors, provided the public contract and state boundaries above remain intact.
- Whether the pending QR is a dedicated component or a focused subcomponent of the payment step, provided it is testable and accessible.

</decisions>

<specifics>
## Specific Ideas

- The pre-charge amount already shown in the booking wizard is an estimate; after charge creation, label and render the server's `displayTotalThb` and `currency` as authoritative.
- Use “Create PromptPay QR” rather than “Pay now.”
- Use “Payment pending” for the QR state and explain that Tirak confirms payment only after the server receives the provider update.
- An unconfirmed booking may show why PromptPay is unavailable only when the local capability is enabled; cash must still work.
- Bundled GSD instruction files exist, but UI agents are not registered in this Codex runtime. Planner/checker were not invoked through a registered GSD agent runner; inline schema checks and an independent read-only audit must not be described as GSD agent approval.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Payment contract

- `../backend/tirak-backend-alpha01/contracts/tirak-payments-v1/payment-api.json` - Exact routes, request shapes, response fields, forbidden fields, and error envelope.
- `../backend/tirak-backend-alpha01/contracts/tirak-payments-v1/state-matrix.json` - Attempt-to-public-state rules and confirmed-booking requirement.
- `../backend/tirak-backend-alpha01/contracts/tirak-payments-v1/environment-matrix.json` - Local enabled environment and disabled staging/production truth.

### Existing mobile flow

- `components/booking/BookingWizard.tsx` - Declares seven labels but currently routes Step 6 directly to confirmation and never renders the imported payment step; Phase 1 must repair this mismatch.
- `components/booking/steps/BookingSummaryStep.tsx` - Existing booking mutation and duplicate-submit guard.
- `components/booking/steps/PaymentSelectionStep.tsx` - Cash path and commented PromptPay affordance.
- `components/booking/steps/BookingConfirmationStep.tsx` - Existing confirmation copy that must become method/status aware.
- `stores/booking-store.ts` - Persisted booking-form state; client-calculated totals must not become provider authority.
- `app/api/booking/booking.ts` - Existing Bearer-token and API error conventions.
- `constants/design-tokens.ts` - Existing color, spacing, radius, typography, and motion primitives.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `Card`, `Button`, and `BookingStepFooter` already define the booking flow's component language.
- `designTokens` and `componentTokens` provide the required visual primitives; no new UI registry or component package is needed.
- `secureStorage`, `apiUrl`, and the booking API module establish authentication and URL patterns.
- Jest plus Testing Library are already present; no test dependency installation is required.

### Established Patterns

- React Query owns network mutation state; Zustand persists cross-step booking form state.
- Existing test files live under `__tests__/` and use Jest module mocks.
- The intended booking flow is Step 5 summary/creation, Step 6 payment selection, and Step 7 confirmation; the current `renderStep` switch stops at case 6 and skips payment selection, so this route must be repaired and integration-tested.

### Integration Points

- Capture the successful booking response into persisted booking state in `BookingSummaryStep` before `onNext()`.
- Read that stored booking identity/status from `PaymentSelectionStep` before charge creation.
- Store the server charge session separately from client-calculated booking price fields.
- Render method/status-aware copy in `BookingConfirmationStep` without mutating server payment status.

</code_context>

<deferred>
## Deferred Ideas

- Authenticated status refresh, terminal outcomes, QR expiry behavior, and indeterminate recovery belong to Phase 2.
- Any staging charge, test override, signed webhook proof, or provider retrieval belongs to separately authorized Phase 3.
- Card payments, bank transfer, refund/restitution UI, history, saved methods, Tirak Plus, supplier signup, admin, and companion surfaces are out of scope.

</deferred>

---
*Phase: 01-local-promptpay-pending-checkout*
*Context gathered: 2026-08-31 after product-owner approval*
