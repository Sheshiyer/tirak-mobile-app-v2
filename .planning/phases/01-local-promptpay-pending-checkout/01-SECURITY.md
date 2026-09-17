---
phase: 01-local-promptpay-pending-checkout
slug: local-promptpay-pending-checkout
status: verified
threats_open: 0
asvs_level: 1
block_on: high
register_authored_at_plan_time: true
created: 2026-09-12
verified: 2026-09-12
verified_commit: 16af95adcd0cfe0a5d5212a489e75829b941de18
---

# Phase 01 — Security

> Threat-model-anchored verification for the local PromptPay pending-checkout recovery. This audit verifies only the threats declared in `01-01-PLAN.md` and `01-02-PLAN.md`; it does not claim a general vulnerability assessment, provider integration, staging parity, production readiness, or settlement proof.

---

## Audit Scope and Configuration

- **Input state:** State A re-audit — this security file was re-verified after the SAFE-02/D-14 implementation at `16af95adcd0cfe0a5d5212a489e75829b941de18`.
- **Register origin:** Plan-time threat models in `01-01-PLAN.md` and `01-02-PLAN.md`.
- **Security enforcement:** Enabled by default because `.planning/config.json` does not disable it.
- **ASVS level:** 1, the configured/default opportunistic verification level.
- **Blocking threshold:** High, the configured/default GSD threshold.
- **Implementation authority:** Read-only. No implementation file was modified by this audit.
- **Normalization:** The prose threat models did not assign IDs. This file assigns stable Phase 01 IDs and combines only exact overlaps between the two plan registers.

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Persisted mobile session → authenticated Tirak backend | The mobile client retrieves the bearer token from secure storage and requests charge creation using an owned booking identifier. Phase 01 crosses this boundary. | Bearer token, booking ID, fixed payment method; high sensitivity |
| Authenticated Tirak backend → payment provider | Backend/provider authority owns amount, currency, charge creation, and terminal payment truth. Phase 01 mobile and its local fixture do not cross this boundary. | Provider credentials, charge authority, settlement state; excluded from Phase 01 |
| Environment configuration → capability predicate | Development mode, an exact feature flag, and an exact loopback URL decide whether local PromptPay UI can render. | Non-secret capability configuration |
| Booking response → persisted eligibility/session | Validated booking identity, status, payment status, and optional currency enter the payment store and control whether a charge may be requested. | Booking ownership/status and financial lifecycle state; sensitive |
| Payment response → persisted/rendered state | A strict decoder converts the backend envelope into allowlisted charge fields used by the store and UI. | Charge ID, QR URL, amount, currency, expiry, attempt/payment status; sensitive |
| Loopback fixture → simulator evidence | A non-provider HTTP fixture supplies deterministic pending data and a non-scannable image for local visual evidence. | Synthetic booking/charge identifiers and synthetic QR-like image; local only |

## Threat Register

| Threat ID | STRIDE category | Component | Disposition | Declared mitigation and verification evidence | Status |
|-----------|-----------------|-----------|-------------|-----------------------------------------------|--------|
| T-01-01 | Tampering | Charge request boundary | mitigate | Client amount/currency authority is absent: `createPromptPayCharge` accepts only `bookingId` and posts only `{ bookingId, method: 'promptpay' }` (`app/api/payment/payment.ts:202-216`). The response decoder validates positive safe-integer satang, THB display consistency, and exact THB currency (`app/api/payment/payment.ts:110-147`). Contract tests assert the two-key body and every forbidden field is absent (`__tests__/payment-api.test.ts:79-111`). | closed |
| T-01-02 | Information Disclosure / Tampering | Cross-booking persisted payment state | mitigate | Direct `resetBooking()` invokes the state-derived safe-release policy before clearing form state (`stores/booking-store.ts:465-471`; `stores/payment-store.ts:130-140`, `271-285`). Safe states clear, while creating, pending, and indeterminate remain identity-bound. A different booking cannot replace any retained session (`stores/payment-store.ts:148-175`), and booking submission is blocked while one exists (`components/booking/steps/BookingSummaryStep.tsx:124-127`, `157-160`, `216-224`). Tests prove safe settled release, unresolved reset retention, and pending/indeterminate replacement refusal (`__tests__/payment-session-reset.test.ts:99-141`; `__tests__/payment-store.test.ts:198-235`). | closed |
| T-01-03 | Information Disclosure | Cross-user payment state | mitigate | Central auth invalidation clears in-memory and persisted payment state together with credentials (`stores/auth-store.ts:55-70`); login, registration, demo login, user update, and token rehydration reset on identity change (`stores/auth-store.ts:100`, `160`, `298`, `324`, `347`). Tests cover logout, missing/corrupt credentials, storage failure, unauthorized events, identity transition, and late-response invalidation (`__tests__/payment-session-reset.test.ts:143-240`). | closed |
| T-01-04 | Tampering / Denial of Service | Charge creation, restoration, and retry | mitigate | Runtime creating shares its single in-flight promise; restored creating/indeterminate is rejected as uncertain and pending is rejected as already in progress before any transport (`stores/payment-store.ts:180-216`). Charge-less persisted creating is conservatively rehydrated as indeterminate with the original booking identity (`stores/payment-store.ts:298-324`). Retry remains limited to failed/expired attempts for the same booking (`stores/payment-store.ts:256-269`). Tests prove one concurrent invocation, prohibit unsafe retry, and prove restored creating/indeterminate makes zero client calls and rejects replacement (`__tests__/payment-store.test.ts:54-68`, `251-334`). | closed |
| T-01-05 | Spoofing / Tampering | Payment status and traveler-facing truth | mitigate | The decoder accepts only the frozen status pairs (`app/api/payment/payment.ts:68-97`, `110-147`), and store phases derive exclusively from a validated response or server booking status (`stores/payment-store.ts:67-93`, `214-245`). The store interface exposes no paid/success setter (`stores/payment-store.ts:35-48`), verified by `__tests__/payment-store.test.ts:336-341`. Pending UI renders `Payment pending` from decoded server fields (`components/booking/payment/PromptPayPendingCard.tsx:31-79`), while confirmation separates booking and payment state (`components/booking/steps/BookingConfirmationStep.tsx:99-147`, `214-230`). | closed |
| T-01-06 | Information Disclosure | Authorization, QR, logs, and evidence | mitigate | The payment client and store contain no logging calls. The fixture logs only method, path, and sorted body-key names (`scripts/promptpay-contract-mock.mjs:123-127`), not authorization, token, request values, response body, or QR content. The fixture creates a non-scannable image in-process (`scripts/promptpay-contract-mock.mjs:38-72`). The evidence receipt records hashes and coarse synthetic fields, states that no provider secret/real charge was used, and labels the proof local-only (`evidence/01-02-simulator.md:40-61`, `63-69`). A fresh negative scan found no Authorization/Bearer/QR/secret/token/raw-body/raw-response logging in payment and fixture files. | closed |
| T-01-07 | Information Disclosure | Payment error handling | mitigate | Backend failures are reduced to a finite safe error-kind taxonomy with fixed user-safe messages (`app/api/payment/payment.ts:6-66`); raw Axios objects are inspected only inside the mapper and never retained or rethrown (`app/api/payment/payment.ts:150-200`, `220-224`). Tests cover mapped HTTP/network/timeout outcomes and missing authentication without exposing raw detail (`__tests__/payment-api.test.ts:163-203`). | closed |
| T-01-08 | Elevation of Privilege | Local capability gate | mitigate | PromptPay requires `isDev === true`, exact lowercase flag `true`, HTTP, exact loopback host, port 8787, and no path/query/hash/userinfo (`constants/payment-capabilities.ts:7-28`). The UI calls this predicate before rendering PromptPay (`components/booking/steps/PaymentSelectionStep.tsx:152-156`, `305-325`). Tests cover both allowed loopbacks and nine fail-closed cases, including production mode and non-loopback hosts (`__tests__/payment-capabilities.test.ts:3-23`). | closed |
| T-01-09 | Elevation of Privilege / Tampering | Booking eligibility for charge creation | mitigate | The store derives server booking payment state, rejects locked or non-THB bookings, and rejects absent/unconfirmed bookings before the charge client call (`stores/payment-store.ts:183-216`). The UI separately requires confirmed status and eligible currency (`components/booking/steps/PaymentSelectionStep.tsx:157-177`, `216-234`). Tests prove unconfirmed booking produces zero charge-client calls (`__tests__/payment-store.test.ts:44-52`). | closed |
| T-01-10 | Denial of Service | Existing cash checkout | mitigate | Cash is rendered outside the PromptPay capability conditional and remains the first method (`components/booking/steps/PaymentSelectionStep.tsx:290-305`). Method locking is state-derived and definite no-charge errors re-enable cash (`components/booking/steps/PaymentSelectionStep.tsx:169-193`, `242-244`, `355-370`). Component tests prove cash exists when capability is off, unconfirmed, creating, uncertain, pending, and after definite failure (`__tests__/PromptPayCheckout.test.tsx:252-288`, `341-374`). Human UAT passed cash-only, eligibility, lock, and pending scenarios (`01-UAT.md`, tests 1-5). | closed |
| T-01-11 | Elevation of Privilege / Tampering | Local contract fixture | mitigate | The fixture imports only Node's inbound HTTP server and zlib, refuses provider-looking environment variables, binds to `127.0.0.1:8787`, validates bearer fixture authentication, caps request size, and allowlists the exact two request keys (`scripts/promptpay-contract-mock.mjs:1-13`, `84-138`, `168-174`). A fresh negative scan found no outbound client primitive or provider endpoint. The runtime receipt records loopback-only listening, provider-environment guard success, key-only logging, and no provider traffic (`evidence/01-02-simulator.md:56-61`). | closed |

*Status: open · closed*  
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

## Plan-Time Threat Coverage

The normalized register covers every threat named by the two authoritative plan-time models:

| Plan | Declared threat | Threat ref |
|------|-----------------|------------|
| 01-01 | Client amount tampering | T-01-01 |
| 01-01 | Stale charge leakage between bookings/users | T-01-02, T-01-03 |
| 01-01 | Duplicate charge creation | T-01-04 |
| 01-01 | Optimistic paid state | T-01-05 |
| 01-01 | Authorization/QR logging | T-01-06 |
| 01-01 | Unsafe error detail | T-01-07 |
| 01-02 | Feature flag leaking to staging/production | T-01-08 |
| 01-02 | Unconfirmed booking charge | T-01-09 |
| 01-02 | Duplicate request | T-01-04 |
| 01-02 | Cash regression | T-01-10 |
| 01-02 | Fake paid claim | T-01-05 |
| 01-02 | Mock accidentally calling a provider | T-01-11 |
| 01-02 | QR/secret capture | T-01-06 |
| 01-02 | Cross-user stale state | T-01-03 |

## Summary Threat Flags

All six `01-02-SUMMARY.md` threat flags map to the plan-time register; there are no unregistered flags.

| Summary threat flag | Existing threat mapping | Result |
|---------------------|-------------------------|--------|
| Capability leakage | T-01-08 | informational; mapped and closed |
| Duplicate or replacement charge | T-01-02, T-01-04 | informational; mapped and closed |
| False settlement claim | T-01-05 | informational; mapped and closed |
| Cross-user financial residue | T-01-03 | informational; mapped and closed |
| Fixture/provider crossover | T-01-11 | informational; mapped and closed |
| Sensitive QR or credential logging | T-01-06 | informational; mapped and closed |

## Unregistered Flags

None.

## Accepted Risks Log

No accepted risks. All plan-time threats have `mitigate` disposition and direct implementation evidence; no threat was closed by acceptance or transfer.

## Verification Receipts

| Check | Current result | Scope |
|-------|----------------|-------|
| Focused SAFE-02/security suites at `16af95a` | PASS — 4/4 suites, 150/150 tests | Payment request/decoder, payment store, session isolation, traveler checkout; executed during this re-audit |
| Full regression at `16af95a` | PASS — 13/13 suites, 216/216 tests | Executed during this re-audit; independently recorded in `01-VERIFICATION.md` |
| Payment client/store logging scan | PASS — no logging calls | `app/api/payment/payment.ts`, `stores/payment-store.ts` |
| Sensitive logging scan | PASS — no Authorization, Bearer, QR, secret, token, raw request body, or raw response logging | Payment client/store and local fixture |
| Fixture egress scan | PASS — no outbound client primitive | `scripts/promptpay-contract-mock.mjs` |
| Provider endpoint/secret scan | PASS — no provider endpoint or provider secret identifier | Payment client/store and local fixture |
| Local paid-mutation scan | PASS — no `markPaid`, `setSuccessful`, or `setChargeStatus` action | Payment and booking production files |
| Charge-authority scan | PASS — no charge call site passes amount or currency | App, stores, and booking components |

The focused tests were executed from this exact worktree with the preserved dependency installation supplied through `NODE_PATH`; no dependency or implementation file was created or changed.

## Security Audit Trail

| Audit Date | Target | Threats Total | Closed | Open | Run By |
|------------|--------|---------------|--------|------|--------|
| 2026-09-12 | `b505fe7` initial audit | 11 | 11 | 0 | gsd-security-auditor |
| 2026-09-12 | `16af95a` SAFE-02/D-14 re-audit | 11 | 11 | 0 | gsd-security-auditor |

## Authority Boundaries and Non-Claims

- No provider, staging, production, deployment, release, settlement, or backend mutation was exercised or inferred.
- The simulator fixture proves local rendering and fixture-contract behavior only; the evidence receipt explicitly records that no app-process POST receipt was observed.
- Production booking currency, a stable backend `BOOKING_ALREADY_PAID` code, and universal-link entitlement/runtime remain external authority gates, not plan-time threat failures in this mobile Phase 01 audit.
- Product-owner visual and VoiceOver acceptance is recorded separately in `01-UAT.md`; it is not used as a substitute for implementation evidence above.
- The goal-level verifier independently records 18/18 must-haves satisfied at `16af95a` in `01-VERIFICATION.md`; this security re-audit still relies on the implementation and focused test evidence above for threat closure.

## Sign-Off

- [x] All plan-time threats have a disposition.
- [x] Every `mitigate` disposition has implementation evidence at the declared boundary.
- [x] Summary threat flags are mapped; no unregistered flag remains.
- [x] Accepted risks log is complete: no accepted risks.
- [x] `threats_open: 0` confirmed.
- [x] `status: verified` set in frontmatter.

**Approval:** verified 2026-09-12 by gsd-security-auditor
