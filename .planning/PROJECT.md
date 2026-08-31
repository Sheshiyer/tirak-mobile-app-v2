# Tirak mobile PromptPay checkout

## What This Is

A Tirak-mobile-only integration of the frozen `tirak-payments-v1` PromptPay contract into the traveler booking flow. The work starts with a local disposable backend and iOS Simulator proof. Tirak Plus, supplier signup, admin surfaces, deployment, provider configuration, and payment enablement remain outside this project.

## Core Value

Travelers can see a truthful PromptPay checkout state without giving the mobile app payment authority.

## Goal

Expose the existing server-authoritative Omise test-sandbox PromptPay workflow in the Tirak traveler booking UI while keeping cash available and keeping provider credentials, charge amount, currency, and settlement truth on the backend.

## Current Truth

- The traveler booking flow presents cash only; the PromptPay definition in `components/booking/steps/PaymentSelectionStep.tsx` is commented out.
- The wizard declares seven steps but its current switch routes Step 6 to confirmation and never renders the imported payment-selection step.
- `app/supplier/signup/payment.tsx` is an unrelated supplier-signup mock and is not a source or target for this integration.
- The frozen backend contract is `../backend/tirak-backend-alpha01/contracts/tirak-payments-v1/payment-api.json`.
- Charge creation accepts only `bookingId` and `method: "promptpay"`.
- Successful charge responses are wrapped as `{ success: true, data: charge }`; charge ID and QR URL may be null, and expiry may be omitted.
- The server derives amount and currency from an authenticated, owned, confirmed booking.
- QR display represents a pending attempt, never successful payment.
- The disposable local worker enables PromptPay. Staging and production keep `promptPayEnabled: false`.
- The current Git checkout contains pre-existing iOS dependency edits in `ios/Podfile` and `ios/Podfile.lock`; this planning work must not rewrite or discard them.

## Requirements

### Validated

- The mobile repository, not the Tirak Plus repository, is the only implementation target.
- Cash remains visible throughout the PromptPay work and selectable whenever no PromptPay charge can exist.
- Mobile requests never contain provider secrets, amount, currency, or card fields.
- Payment status shown to the traveler comes from the backend response.
- Local iOS Simulator evidence is required before any external acceptance activity.

### Planned and held

- Parser-readable `.planning/` artifacts, the approved UI contract, and two test-first Phase 1 plans are prepared.
- Source implementation and the Git commit policy require separate authorization before either execution plan runs.
- Missing GSD UI-agent runtime registration remains a separate authorization gate.

## Safety Boundary

- No Omise secret or webhook value may enter the app, logs, screenshots, fixtures, or planning artifacts.
- No client-calculated amount or currency may be sent to charge creation.
- No QR render, timer, local scan, or navigation event may mark a payment successful.
- No staging or production payment flag may be changed under this roadmap without a fresh human authorization.
- No deployment, provider-side mutation, real charge, Git commit, or GSD-agent installation is implied by planning approval.

## Out of Scope

| Item | Reason |
|------|--------|
| Tirak Plus | Separate nested repository and product surface |
| Supplier signup payment mock | Unrelated mock flow with different actor and purpose |
| Admin or companion payment tooling | Traveler checkout is the approved surface |
| Card and bank-transfer methods | Not present in `tirak-payments-v1` |
| Backend contract changes | Mobile integrates the frozen contract |
| Staging/production enablement | Separate owner authorization and runtime gate |
| Omise credentials or dashboard changes | Provider authority remains external |

## Key Decisions

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-08-31 | Normalize the roadmap into three vertical user slices | Avoid horizontal contract/API/UI phases |
| 2026-08-31 | Phase 1 is local-only and capability-gated | The environment matrix authorizes only the disposable local worker |
| 2026-08-31 | Booking creation and server confirmation precede charge creation | The backend contract derives truth from an owned confirmed booking |
| 2026-08-31 | Cash remains visible; method switching locks whenever a PromptPay charge may exist | Preserve the cash path without creating double-payment risk |
| 2026-08-31 | Missing GSD UI agents are not registered in this Codex runtime during the planning pass | Runtime installation/registration remains a separate authorization gate; bundled planner/checker instructions exist but their registered runner was unavailable |
| 2026-08-31 | Planning approval does not authorize source execution or commits | The default GSD execution workflow creates commits, so execution policy must be explicit |

---
*Last updated: 2026-08-31 after product-owner design approval*
