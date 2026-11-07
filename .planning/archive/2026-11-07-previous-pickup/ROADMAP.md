# Roadmap: Tirak mobile PromptPay checkout

## Overview

Deliver PromptPay as three vertical traveler outcomes: first a safe local pending-checkout slice, then server-authoritative status and recovery, and finally an explicitly owner-gated staging acceptance exercise. Every phase preserves cash and keeps the app outside provider and settlement authority.

## Phases

- [x] **Phase 1: Local PromptPay pending checkout** - A confirmed local test booking can create and display a server-issued pending PromptPay QR while cash remains available. (completed 2026-09-12)
- [ ] **Phase 2: Payment status and recovery** - The traveler sees server-authoritative transitions, terminal outcomes, and indeterminate recovery.
- [ ] **Phase 3: Owner-gated staging acceptance** - A release owner may authorize one controlled staging proof after backend prerequisites are recorded.

## Phase Details

### Phase 1: Local PromptPay pending checkout
**Goal**: In a disposable local environment, a traveler with an owned confirmed booking can choose PromptPay, request one server-issued charge, and see its pending QR, server amount, currency, and expiry without weakening the cash path.
**Depends on**: Nothing (first phase)
**Requirements**: [PAY-01, PAY-02, PAY-03, PAY-04, SAFE-01, SAFE-02, CAP-01, CASH-01, CASH-02, FLOW-01, FLOW-02, UI-01, UI-02, UI-03, A11Y-01, TEST-01, TEST-02, TEST-03]
**Success Criteria** (what must be TRUE):
  1. Cash remains visible in every state, remains selectable before charge creation, and locks whenever a PromptPay charge may exist.
  2. PromptPay appears only for an explicit local-test capability and refuses charge creation until the stored booking is confirmed.
  3. Charge creation sends exactly `bookingId` and `method: "promptpay"`, validates the success envelope, and displays only allowlisted inner charge fields.
  4. QR display is labeled payment pending and never changes to paid from local UI events.
  5. Focused tests pass and the complete local pending journey is inspected on an iOS 27 Simulator without making a real or staging charge.
**Plans**: 2 plans

Plans:
- [x] 01-01: Add the contract-safe payment client and persisted server-owned charge session with test-first proofs.
- [x] 01-02: Integrate the local capability-gated cash/PromptPay UI and verify the pending journey on iOS Simulator.

**Wave 2** *(executed after Wave 1 completion)*

Cross-cutting constraints:
- The mobile app never sends amount, currency, card data, or provider credentials.
- Payment success is never inferred from QR display, navigation, a timer, or a client event.
- Tirak Plus and the supplier-signup payment mock remain untouched.

### Phase 2: Payment status and recovery
**Goal**: A traveler can refresh a pending charge, see only server-authoritative state transitions, and recover an indeterminate attempt without creating a duplicate charge.
**Depends on**: Phase 1
**Requirements**: [STAT-01, STAT-02, STAT-03, STAT-04, TEST-04]
**Success Criteria** (what must be TRUE):
  1. Pending charge state is refreshed through authenticated `GET /api/payments/charges/:chargeId`.
  2. Only an indeterminate attempt exposes the recover action and sends the frozen recovery request shape.
  3. Successful, failed, expired, and indeterminate UI states match backend truth and provide a clear next action.
  4. Simulator tests exercise the full server-state matrix without local paid-state shortcuts.
**Plans**: TBD

Plans:
- [ ] 02-01: Status polling and terminal-state traveler UI.
- [ ] 02-02: Indeterminate recovery, duplicate-charge protection, and simulator matrix.

### Phase 3: Owner-gated staging acceptance
**Goal**: Produce one evidence-backed staging acceptance result only after the release owner authorizes the temporary test override and all backend safety prerequisites are satisfied.
**Depends on**: Phase 2
**Requirements**: [ACC-01, ACC-02, ACC-03, EVID-01]
**Success Criteria** (what must be TRUE):
  1. The signed webhook proof, confirmed THB booking, staging URL, and time-bounded owner authorization are recorded before charge creation.
  2. One staging test charge converges through provider retrieval and signed webhook truth to the matching mobile state.
  3. The staging payment-creation override is restored to disabled according to the backend runbook.
  4. Evidence contains identifiers and state receipts but no secrets or QR payload data.
**Plans**: TBD

Plans:
- [ ] 03-01: Preflight and separately authorized staging acceptance.

## Progress

**Execution Order:** Phase 1 -> Phase 2 -> Phase 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Local PromptPay pending checkout | 2/2 | Complete | 2026-09-12 |
| 2. Payment status and recovery | 0/2 | Not started | - |
| 3. Owner-gated staging acceptance | 0/1 | Blocked on owner authorization | - |
