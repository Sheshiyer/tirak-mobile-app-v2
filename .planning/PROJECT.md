# Tirak mobile PromptPay checkout

## What This Is

A Tirak-mobile-only integration of the frozen `tirak-payments-v1` PromptPay contract into the traveler booking flow. The work starts with a local disposable backend and iOS Simulator proof. Tirak Plus, supplier signup, admin surfaces, deployment, provider configuration, and payment enablement remain outside this project.

## Core Value

Travelers can see a truthful PromptPay checkout state without giving the mobile app payment authority.

## Goal

Expose the existing server-authoritative Omise test-sandbox PromptPay workflow in the Tirak traveler booking UI while keeping cash available and keeping provider credentials, charge amount, currency, and settlement truth on the backend.

## Current Truth

- Phase 1 is complete on the isolated clean recovery branch with 8/8 human UAT checks and 11/11 plan-time threats closed.
- The traveler booking flow preserves cash and adds PromptPay only for the exact development loopback capability.
- Step 6 renders payment selection and Step 7 renders separate booking/payment confirmation truth.
- Confirmed local bookings can request one server-issued pending charge; the UI renders validated server amount, currency, expiry, reference, and QR fields.
- Creating, pending, indeterminate, paid, failed, expired, and restitution states retain distinct behavior without a public local paid mutation.
- Live or uncertain payment sessions persist across navigation and relaunch and cannot be replaced by another booking or user.
- `app/supplier/signup/payment.tsx` is an unrelated supplier-signup mock and is not a source or target for this integration.
- The frozen backend contract is `../backend/tirak-backend-alpha01/contracts/tirak-payments-v1/payment-api.json`.
- Charge creation accepts only `bookingId` and `method: "promptpay"`.
- The server derives amount and currency from an authenticated, owned, confirmed booking.
- QR display represents a pending attempt, never successful payment.
- The disposable local worker enables PromptPay. Staging and production keep `promptPayEnabled: false`.
- iOS 27 custom-scheme cold/warm delivery is proven; universal links remain unclaimed without entitlement and URL authority.
- The original authoring checkout and its pre-existing iOS dependency edits remain preserved outside the clean recovery branch.

## Requirements

### Validated

- The mobile repository, not the Tirak Plus repository, is the only implementation target.
- Cash remains visible throughout the PromptPay work and selectable whenever no PromptPay charge can exist.
- Mobile requests never contain provider secrets, amount, currency, or card fields.
- Payment status shown to the traveler comes from the backend response.
- Local iOS Simulator evidence is required before any external acceptance activity.

### Completed locally

- Phase 1 source, tests, iOS runtime evidence, visual evidence, UAT, and security verification are committed locally on the isolated recovery branch.
- The complete suite passes 13/13 suites and 216/216 tests; TypeScript and locale parsing pass.

### Planned and held

- Phase 2 status refresh and indeterminate recovery are not yet planned or implemented.
- Backend currency, stable already-paid code, universal-link entitlement, provider/staging activity, deployment, merge, and release remain separate authority gates.

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
| 2026-09-12 | Retain any live or uncertain payment session across navigation and relaunch | Discarding or replacing unresolved financial truth could create duplicate-payment risk |
| 2026-09-12 | Separate booking confirmation from payment confirmation and settlement | A confirmed booking and a visible QR do not prove payment or settlement |
| 2026-09-12 | Claim custom-scheme runtime only; keep universal links unclaimed | Associated Domains and an authorized real URL do not yet exist |
| 2026-09-12 | Complete Phase 1 from local evidence only | Human UAT and security verification passed without provider, staging, deployment, or release actions |

---
*Last updated: 2026-09-12 after Phase 1 completion*
