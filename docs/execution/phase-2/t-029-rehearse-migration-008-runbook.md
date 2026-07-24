# T-029 — Rehearse Migration 008 · Execution Runbook

Status: **EXECUTED 2026-07-23 — ALL STAGES PASS, GATES 1+2 APPROVED (teardown Option A)**
Prepared: 2026-07-24
Executed evidence: backend repo `Sheshiyer/tirak-backend-alpha01` PR #19 (merged 2026-07-24, merge commit `a095da7`) — `docs/execution/phase-2/t-029-rehearsal-evidence.md` + `t-029-rehearsal-ledger.json`, `evidence/t029/` bundle
Task: GitHub issue `Sheshiyer/tirak-mobile-app-v2#29`
Owner: Data owner / backend executor (human gates embedded)
Estimate: 4 hours
Dependencies: T-026 ✅ (recovery chain proven), T-028 ✅ (artifacts merged-ready, commit `7d93746`)
Contract: `tirak-payments-v1`
Execution repo: `Tirak/Backend/tirak-backend-alpha01` (branch from the T-028 merge commit)
Final evidence destination: `docs/execution/phase-2/t-029-*` in the backend repo

## Authority boundary

Published under the recorded T-024 human approval. Rehearsal mutations touch **only** the
disposable rehearsal database. Prohibited: any write to `tirak-staging` or production,
application-schema migration on active staging (that is T-032→W2.2 scope), secret mutation,
live Omise activity, App Store submission.

Two explicit human gates (same discipline as T-026):

- **GATE 1 (before Stage C):** authorize creation of exactly one disposable rehearsal D1
  `tirak-t029-rehearsal` and application of the canonical baseline + 008 to it.
- **GATE 2 (before Stage E):** authorize deletion of the rehearsal database (or explicit
  quarantine with owner + review date).

## Inputs frozen by T-028

| Artifact | Identity |
| --- | --- |
| Baseline | `migrations/baseline/canonical-baseline.sql`, sha256 `b6532c80e5eeb6b481c26f5ad12f58043f8ad77587ea503527f6cb94e47cf33f` |
| Payments | `migrations/008_omise_promptpay_payments.sql` (contract-corrected) |
| Ledger rule | baseline recorded as exactly one `d1_migrations` row (`canonical-baseline.sql`), then `008_omise_promptpay_payments.sql` |
| Contract surface | `contracts/tirak-payments-v1/target-schema.sql` (`payment_attempts`, `payment_webhook_events`) |

## Acceptance criteria (issue #29) → evidence mapping

| Acceptance | Evidence artifact |
| --- | --- |
| Payment attempt + webhook event tables on rehearsal target | post-apply `sqlite_schema` dump vs `target-schema.sql` |
| Tables, indexes, constraints, ledger entry match contract | schema assertion report + `d1_migrations` dump |
| Schema assertions and foreign-key check | `PRAGMA foreign_key_check` + negative probes (duplicate active attempt rejected) |

---

## Stage 0 — Preconditions (offline)

```bash
cd Tirak/Backend/tirak-backend-alpha01
git checkout main && git pull --ff-only origin main   # requires PR #16/#17/#18 merged or rebase plan
git checkout -b codex/tirak-omise/w2.1/t-029-rehearse-migration-008
node scripts/migrations/generate-canonical-baseline.mjs   # regenerate; hash MUST equal b6532c80…
test -f .env.tirak-staging && [ "$(stat -f '%Lp' .env.tirak-staging)" = "600" ]
```

Abort if: baseline hash drift (means 001–007 changed), credential checks fail, tree dirty.

## Stage A — Fresh recovery point on active staging (read-only; T-026 chain)

```bash
export CLOUDFLARE_ACCOUNT_ID=$(sed -n 's/^TIRAK_CLOUDFLARE_ACCOUNT_ID=//p' .env.tirak-staging)
export CLOUDFLARE_API_TOKEN=$(sed -n 's/^TIRAK_CLOUDFLARE_API_TOKEN=//p' .env.tirak-staging)
npm run staging:preflight && npm run staging:discover   # fingerprint must equal 52431d70…f10
TS=$(date -u +%Y%m%dT%H%M%SZ); mkdir -p evidence/t029
npx wrangler d1 info tirak-staging --json > evidence/t029/d1-info-pre.json
npx wrangler d1 time-travel info tirak-staging --json > evidence/t029/bookmark-pre.json
npx wrangler d1 export tirak-staging --remote --output evidence/t029/tirak-staging-pre-$TS.sql
sha256sum evidence/t029/* > evidence/t029/checksums.sha256
```

Fingerprint drift or non-empty staging → abort and escalate (staging should still be pristine).

## ⛔ GATE 1 — Human approval required

> "T-029 requests authority to create exactly one disposable D1 database named
> `tirak-t029-rehearsal` in the pinned staging account (APAC) and to apply the canonical
> baseline and migration 008 to it. No other mutation is requested. Active staging is
> never written. The rehearsal DB will be deleted or quarantined under GATE 2."

## Stage B — Rehearsal target + isolated apply roots

```bash
npx wrangler d1 create tirak-t029-rehearsal            # record database_id
mkdir -p rehearsal/t029/migrations rehearsal/t029/migrations-baseline
cp migrations/baseline/canonical-baseline.sql rehearsal/t029/migrations-baseline/
cp migrations/008_omise_promptpay_payments.sql rehearsal/t029/migrations/
```

Two dedicated configs (never the repo `wrangler.toml`, whose `migrations/` root contains
quarantined files):

- `rehearsal/t029/wrangler.baseline.toml` → `migrations_dir = "./migrations-baseline"`, rehearsal `database_id`
- `rehearsal/t029/wrangler.payments.toml` → `migrations_dir = "./migrations"` (008 only), rehearsal `database_id`

## Stage C — Apply (rehearsal DB only)

```bash
npx wrangler d1 migrations apply tirak-t029-rehearsal --remote --config rehearsal/t029/wrangler.baseline.toml
npx wrangler d1 migrations apply tirak-t029-rehearsal --remote --config rehearsal/t029/wrangler.payments.toml
```

Expected ledger afterwards (exactly 2 rows, this order): `canonical-baseline.sql`,
`008_omise_promptpay_payments.sql`. Any deviation → stop, capture, escalate (no retry
without diagnosing; partial-failure evidence is preserved append-only).

## Stage D — Verification (read-only against rehearsal)

1. Schema dump (`sqlite_schema` minus system tables) → assert `payment_attempts` +
   `payment_webhook_events` DDL exactly matches `target-schema.sql` (reuse the
   `tests/migrations` surface-diff harness against live dump).
2. `PRAGMA foreign_key_check;` → zero rows.
3. Negative probe: insert two active (`pending`) attempts for one booking → second must
   fail on `uq_payment_attempt_active_booking`; positive control after terminal transition.
4. `d1_migrations` dump → run `node scripts/migrations/verify-lineage.mjs <schema.json> <ledger.json>`
   → must exit 0 (baseline one row, then 008, nothing else).
5. Row-count manifest: all tables zero rows except `d1_migrations` (2 rows).

## ⛔ GATE 2 — Human approval required

Option A (preferred): `npx wrangler d1 delete tirak-t029-rehearsal --skip-confirmation`,
verify absence via `d1 list`, post-teardown discovery fingerprint unchanged.
Option B: quarantine with owner + review date recorded in the ledger.

## Stage E — Evidence closure

- `docs/execution/phase-2/t-029-rehearsal-evidence.md` + `t-029-rehearsal-ledger.json`
- `evidence/t029/` artifact bundle (pre/post dumps, apply transcripts sanitized, checksums)
- Scoped commit → PR (PR #15–#18 pattern) → issue #29 comment

## Abort triggers

- Fingerprint drift on active staging; staging no longer pristine
- Baseline hash ≠ `b6532c80…` after regeneration
- Any apply error, partial ledger write, or unexpected ledger row
- FK violations or negative-probe acceptance of a duplicate active attempt
- Any command transcript showing a write target other than the rehearsal DB

## Wave-planning note (flag to release owner)

T-029 covers 008 only; T-030 covers chat (010). **`011_payment_restitutions.sql` has no
explicit rehearsal task** — recommend folding its rehearsal into T-030's rehearsal target
(same disposable DB, additive sibling per the strategy's dependency graph) so T-031
validates the complete lineage. Requires a one-line scope amendment at T-030 kickoff.
