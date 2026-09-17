# Requirements: Tirak mobile PromptPay checkout

**Defined:** 2026-08-31
**Core Value:** Travelers can see a truthful PromptPay checkout state without giving the mobile app payment authority.

## v1 Requirements

### Frozen contract and state ownership

- [x] **PAY-01**: Charge creation sends exactly `bookingId` and `method: "promptpay"` to `POST /api/payments/charges`.
- [x] **PAY-02**: The app models `contractVersion`, nullable `chargeId`, `paymentStatus`, `attemptStatus`, nullable `qrCodeUrl`, `amountSatang`, `displayTotalThb`, `currency`, and optional `expiresAt` from the server response.
- [x] **PAY-03**: Disabled, unauthorized, non-payable, validation, network, and unknown error envelopes map to stable traveler-safe error states.
- [x] **PAY-04**: The client accepts only `{ success: true, data: <tirak-payments-v1 charge> }`, unwraps the inner `data`, treats nullable `chargeId`/`qrCodeUrl` and optional `expiresAt` safely, and rejects missing or false success envelopes.
- [x] **SAFE-01**: Mobile source, storage, fixtures, logs, and analytics contain no Omise secret, webhook secret, provider credential, QR payload, card field, or client-supplied charge amount/currency.
- [x] **SAFE-02**: Logout and authenticated-user change clear payment state. Booking reset and confirmation exit clear only safe sessions; unresolved creating, pending, or indeterminate sessions remain bound to their original user and booking, survive relaunch, and cannot be replaced or exposed to another traveler.

### Local pending checkout

- [x] **CAP-01**: PromptPay is visible only when the explicit local-test capability is true and the API base URL resolves to the disposable loopback worker.
- [x] **CASH-01**: Cash remains visible in every Phase 1 PromptPay state.
- [x] **CASH-02**: Cash selection is disabled while PromptPay is creating, in progress, pending, indeterminate, network-unknown, or otherwise unknown.
- [x] **FLOW-01**: The app records the created booking before payment selection and refuses PromptPay charge creation unless that server booking is `confirmed`.
- [x] **FLOW-02**: The booking wizard renders payment selection as Step 6 and booking/payment confirmation as Step 7, with an integration test proving summary to payment to confirmation navigation.
- [x] **UI-01**: A created PromptPay charge displays the server THB total, currency, and pending state; QR image, expiry, and charge identifier render only when those server fields are present.
- [x] **UI-02**: PromptPay copy explains backend confirmation and never repeats cash-only instructions.
- [x] **UI-03**: Booking confirmation distinguishes booking creation, booking confirmation, cash payment, and PromptPay pending without claiming payment success.
- [x] **A11Y-01**: Payment choices expose accessible labels, roles, selected/disabled state, 44-point minimum targets, and announced loading/error/pending changes.

### Local proof

- [x] **TEST-01**: Unit tests prove charge creation omits every forbidden request field and preserves the frozen response fields.
- [x] **TEST-02**: Component/state tests cover hidden PromptPay, unconfirmed-disabled PromptPay, duplicate-submit prevention, cash fallback, and pending QR copy.
- [x] **TEST-03**: An iOS 27 Simulator run against a disposable local mock captures the cash path and a confirmed-booking PromptPay pending path without a real or staging charge.

### Status and recovery

- [ ] **STAT-01**: Pending state refreshes through authenticated `GET /api/payments/charges/:chargeId` and renders only the returned server state.
- [ ] **STAT-02**: Recovery is available only for an indeterminate attempt and sends exactly `bookingId` plus `chargeId`.
- [ ] **STAT-03**: Successful, failed, expired, and indeterminate states have distinct truthful copy and actions.
- [ ] **STAT-04**: Expiry removes the usable QR affordance without marking the payment successful or silently creating another charge.
- [ ] **TEST-04**: Automated and simulator tests cover pending, successful, failed, expired, and indeterminate/recovery transitions.

### Staging acceptance

- [ ] **ACC-01**: Staging charge creation remains blocked until signed-webhook proof, a confirmed THB booking, the exact staging URL, and a time-bounded human authorization are recorded.
- [ ] **ACC-02**: One authorized staging charge is matched across provider retrieval, signed webhook convergence, backend status, and mobile status.
- [ ] **ACC-03**: The staging payment-creation override is returned to disabled after the controlled test.
- [ ] **EVID-01**: Acceptance evidence contains no secret values, authorization tokens, or QR payload content.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Tirak Plus changes | Separate nested repository and product |
| Supplier signup PromptPay mock | Unrelated actor and non-Omise mock |
| Admin or companion payment UI | Traveler checkout is the approved surface |
| Card or bank-transfer checkout | Frozen backend contract supports PromptPay only |
| Backend contract mutation | Mobile consumes `tirak-payments-v1` as-is |
| Staging/production enablement during Phase 1 or 2 | Separate release-owner gate |
| Provider dashboard or secret changes | External operator authority |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| PAY-01 | Phase 1 | Complete |
| PAY-02 | Phase 1 | Complete |
| PAY-03 | Phase 1 | Complete |
| PAY-04 | Phase 1 | Complete |
| SAFE-01 | Phase 1 | Complete |
| SAFE-02 | Phase 1 | Complete |
| CAP-01 | Phase 1 | Complete |
| CASH-01 | Phase 1 | Complete |
| CASH-02 | Phase 1 | Complete |
| FLOW-01 | Phase 1 | Complete |
| FLOW-02 | Phase 1 | Complete |
| UI-01 | Phase 1 | Complete |
| UI-02 | Phase 1 | Complete |
| UI-03 | Phase 1 | Complete |
| A11Y-01 | Phase 1 | Complete |
| TEST-01 | Phase 1 | Complete |
| TEST-02 | Phase 1 | Complete |
| TEST-03 | Phase 1 | Complete |
| STAT-01 | Phase 2 | Pending |
| STAT-02 | Phase 2 | Pending |
| STAT-03 | Phase 2 | Pending |
| STAT-04 | Phase 2 | Pending |
| TEST-04 | Phase 2 | Pending |
| ACC-01 | Phase 3 | Blocked |
| ACC-02 | Phase 3 | Blocked |
| ACC-03 | Phase 3 | Blocked |
| EVID-01 | Phase 3 | Blocked |

**Coverage:**
- v1 requirements: 27 total
- Mapped to phases: 27
- Unmapped: 0

---
*Requirements defined: 2026-08-31*
*Last updated: 2026-09-12 after Phase 1 completion*
