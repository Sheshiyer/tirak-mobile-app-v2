# Payment Park & Re-sequencing Record — W2.2+ Payment Wave Parked, Selected P3/P4 Dependencies Severed

Status: **SIGNED — human release owner, 2026-07-26 (session approval)**
Date: 2026-07-26
Authority: human release owner (same authority that froze the plan in T-016 and signed T-024/T-032)

---

## 1. The decision

The human release owner has decided, on 2026-07-25, to **park the entire payment wave as work in progress**, citing:

1. **No current access to the Omise payment system** (dashboard / credentials), which blocks every task whose acceptance requires Omise-side state.
2. **A planned fundamental shift of the payment flow.** Because the frozen contracts (T-009 payment HTTP/route surface, T-010 state mapping, T-013 environment/rollout modes) pinned the Omise PromptPay flow, resuming W2.2 payment tasks as-written after the redesign would execute a superseded design.

This record is the governance instrument for that park. Nothing in the frozen plan is executed out of order without it.

## 2. What is complete and unaffected

Verified against execution evidence, not tracker state:

- **Phase 1 (T-001–T-024): complete.** Evidence: `docs/execution/phase-1/`, T-024 readiness gate closed.
- **W2.1 (T-025–T-032): complete.** Canonical migration lineage is live on `tirak-staging`; all stages PASS; T-032 signed GO (2026-07-24); W2.2 staging application runbook closed EXECUTED-PASS (`docs/execution/phase-2/w2.2-staging-migration-application-runbook.md`).
- **T-033: complete (code side).** Payment environment-mode and kill-switch guard merged to backend `main` as squash commit `693a378` (PR #25, 2026-07-25). Independent verification on the branch before merge: typecheck PASS, 262/262 vitest (incl. 46 new), release gate PASS, negative matrix PASS, staging fixtures PASS. The guard defaults fail-closed (`disabled` floor), so its presence on `main` is inert and safe during the park. Its design (environment-mode ladder + audited KV override + operator toggle) is provider-agnostic and is expected to survive the payment-flow redesign.

## 3. What is parked

Parked as work in progress, **not cancelled**, pending (a) restored Omise access and (b) the payment-flow redesign decision:

| Scope | Tasks | Reason parked |
|---|---|---|
| W2.2 cloud-config remainder | T-034, T-035, T-036 | Omise secrets/webhook require Omise access; T-036 deploy also requires human-provisioned `PAYMENT_CONFIG_KV` namespaces + T-025 ledger amendment (PR #25 owner note 1) |
| W2.2 payment e2e | T-037, T-038 | Requires live Omise test-mode charges against the *current* flow |
| W2.3 telemetry & financial ops | T-039–T-044 | Acceptance requires staging payment infra; design may change with the flow |
| Payment-coupled downstream | T-046, T-047, T-053, T-058, T-063, T-064, T-075, T-076, T-079 | Directly bound to the Omise PromptPay flow being redesigned |

**Hard rule during the park:** no task in this table may be started, and no branch naming a parked task ID may be opened, until §6's resume conditions are met.

## 4. Why re-sequencing is required (dependency analysis)

The frozen plan's dependency graph places payments on the critical path. Verified against `docs/plans/2026-07-18-tirak-omise-production-swarm-plan.md` dependency fields:

- Every P3 task chains into a parked task: T-045 → **T-044**; T-048 → **T-036**; T-049 → **T-047**; T-050 → T-045…T-049; T-056 → **T-044**; W3.2/W3.3 chain through T-050/T-056.
- Every P4 task chains into a parked task or a blocked P3 gate: T-061/T-062 → **T-044**, T-050; T-063 → **T-038**; T-064 → **T-041**–T-043; T-065 → **T-039**, T-059; W4.2 chains through T-055/T-060/T-066.

Conclusion: **zero frozen task IDs in P3/P4 are executable as-written while the payment wave is parked.** The severances in §5 are the minimum set that releases genuinely payment-independent work without touching parked scope.

## 5. Severed dependencies (this amendment)

The following frozen dependency edges are **waived by owner signature on this record**. Each waiver names its risk and its re-confirmation gate.

### 5.1 T-062 — Adversarially test auth, ownership, and rate limits — RELEASED

- **Waived edges:** T-044, T-050.
- **Rationale:** the adversarial matrix exercises existing auth middleware, ownership checks, and rate limiters against fixtures in the backend repo. Neither the staging operations gate nor a signed mobile build is a technical precondition for writing or running these tests.
- **Redesign exposure:** none — auth, ownership, and rate limiting are payment-flow-independent.
- **Risk:** residual environment drift between fixture tests and staging. **Re-confirmed at the T-066 security/financial signoff gate**, which remains fully gated.

### 5.2 T-061 — Secret, dependency, and checkout-tracking audit — PARTIALLY RELEASED

- **Waived edges:** T-044, T-050.
- **Scope split:** the **secret and dependency audit** portions run now (read-only analysis of repos and pipelines). The **checkout-tracking audit portion is deferred** — it audits the payment flow being redesigned and would be wasted work.
- **Risk:** audit drift as code changes during the park. **Re-run in full at T-066.**

### 5.3 T-048 — Validate booking-scoped iOS WebSocket chat — CONDITIONALLY RELEASED

- **Waived edge:** T-036 (staging Worker deploy).
- **Condition precedent:** before any T-048 branch opens, an inspection must establish what chat schema is actually live on staging — the W2.2 application runbook quarantined `009_booking_scoped_chat.sql` from the isolated apply roots, so the booking-scoped chat surface may not exist on staging yet. Validation targets local/dev Worker plus whatever the inspection proves live.
- **Redesign exposure:** low — booking-scoped chat is conceptually independent of the payment rail, but the booking lifecycle boundary may shift with the redesign; findings must be re-validated after it.

### 5.4 Explicitly deferred (NOT released)

- **T-047, T-049 (checkout portions), T-046:** sit directly on the payment flow being redesigned. Starting them now is likely-rework and is refused by this record.
- **T-049 (non-checkout portions):** a11y/localization/privacy/failure copy outside checkout may be proposed as a separate scoped amendment after T-062 completes; not released here.
- **All W3.2/W3.3/W4.2 tasks:** remain chained through T-050/T-055/T-056/T-066 and are untouched.

## 6. Resume conditions for the parked payment wave

The park lifts only when ALL of the following hold:

1. Human release owner confirms restored Omise access.
2. The payment-flow redesign decision is made and the affected frozen contracts (T-009, T-010, T-013) are **re-frozen by amendment** — the parked tasks are re-scoped against the new flow before execution, never executed as-written.
3. The human release owner has provisioned the real `PAYMENT_CONFIG_KV` namespaces, replaced the stand-in ids in `wrangler.toml`, and amended the T-025 staging ledger (precondition for T-036, carried from PR #25).

## 7. Tracker reconciliation

The ISA.md tracker drifted from execution reality during W2.1/W2.2 (records were kept in `docs/execution/` without flipping ISC checkboxes). This record's commit also corrects:

- **ISC-149 → ISC-155** (`T-026`–`T-032`): checked — executed PASS per `docs/execution/phase-2/` runbooks and the T-032 signed GO.
- **ISC-156** (`T-033`): checked — merged PR #25, verification matrix in the PR body.

No other ISC states change. Parked tasks keep their unchecked boxes — parking is not completion.

## 8. Signature

By signing below, the human release owner: (a) ratifies the park in §3, (b) grants the three severances in §5, (c) adopts the resume conditions in §6, (d) ratifies the tracker reconciliation in §7.

- Human release owner: ______________________  Date: __________
