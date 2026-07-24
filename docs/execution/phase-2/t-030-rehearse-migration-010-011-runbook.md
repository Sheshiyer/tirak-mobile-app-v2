# T-030 — Rehearse Migrations 010 + 011 · Execution Runbook

Status: **DRAFT FOR HUMAN REVIEW — NOT YET EXECUTED**
Prepared: 2026-07-24
Task: GitHub issue `Sheshiyer/tirak-mobile-app-v2#30`
Owner: Data owner / backend executor (human gates embedded)
Estimate: 4 hours
Dependencies: T-026 ✅ (recovery chain proven), T-028 ✅ (artifacts merged-ready, commit `7d93746`), T-029 ✅ execution PASS — **PR #19 still OPEN** (all T-029 evidence lives on branch `codex/tirak-omise/w2.1/t-029-rehearse-migration-008`, head `9d334be`)
Contract: `tirak-payments-v1`
Execution repo: `Tirak/Backend/tirak-backend-alpha01` (branch from the T-029 merge commit — see Stage 0 dependency note)
Final evidence destination: `docs/execution/phase-2/t-030-*` in the backend repo (this file is the review draft, same pattern as T-029)

## ⚠️ Renumbering note — 009 → 010 (read first)

Issue #30 is titled "[T-030] Rehearse additive migration 009". **The title is stale.**
`009_booking_scoped_chat.sql` is quarantined: it performs a destructive legacy rename, is
hard-coded in `scripts/migrations/verify-lineage.mjs` `QUARANTINED_NAMES`, and is
documented as quarantined in the backend `docs/contracts/tirak-payments-v1/migration-strategy.md`.
The actual rehearsal targets are **`010_booking_chat_expansion.sql`** (additive chat) and,
per the approved amendment below, **`011_payment_restitutions.sql`**. Any reference to
"009" in the issue, branch names, or ISA ledger entries refers to this quarantined file
and must be read as the 010/011 lineage rehearsed here. The quarantined file is never
copied, applied, or read by this runbook.

## Approved scope amendment — 011 folded into T-030

Approved by the human owner on **2026-07-24**: fold `011_payment_restitutions.sql` into
T-030's disposable rehearsal target. This is the "one-line scope amendment at T-030
kickoff" recommended by T-029's wave-planning note. Justification: 010 and 011 are
additive siblings per the migration-strategy dependency graph (both require
baseline + 008 first; either may apply before the other), so one disposable DB validates
both and T-031 then validates the complete lineage. The acceptance→evidence mapping below
is extended with restitution probes accordingly.

## Authority boundary

Published under the recorded T-024 human approval. Rehearsal mutations touch **only** the
disposable rehearsal database. Prohibited: any write to `tirak-staging` or production,
application-schema migration on active staging (that is T-032→W2.2 scope), secret mutation,
live Omise activity, App Store submission.

Two explicit human gates (same discipline as T-026/T-029):

- **GATE 1 (before Stage C):** authorize creation of exactly one disposable rehearsal D1
  `tirak-t030-rehearsal` (APAC) and application of the canonical baseline + 008 + 010 + 011 to it.
- **GATE 2 (before Stage E):** authorize deletion of the rehearsal database (or explicit
  quarantine with owner + review date).

## Inputs frozen by T-028/T-029

| Artifact | Identity |
| --- | --- |
| Baseline | `migrations/baseline/canonical-baseline.sql`, sha256 `b6532c80e5eeb6b481c26f5ad12f58043f8ad77587ea503527f6cb94e47cf33f` (regeneration via `node scripts/migrations/generate-canonical-baseline.mjs` must match; drift = abort) |
| Payments | `migrations/008_omise_promptpay_payments.sql` (already rehearsed in T-029; reapplied here as lineage prerequisite) |
| Chat | `migrations/010_booking_chat_expansion.sql` (additive; zero legacy data copy) |
| Restitutions | `migrations/011_payment_restitutions.sql` (additive sibling; per approved amendment) |
| Contract surface | `contracts/tirak-payments-v1/target-schema.sql`: `payment_restitutions` lines 48–78, `booking_chat_rooms` lines 80–89, `booking_chat_messages` lines 91–103, chat indexes 105–107 |
| Contract manifest hash | `target-schema.sql` sha256 `08acab5dd1f9b8d308d4944349129d9d032dc2a081517db0a2e33235f698b9c9` |
| Ledger rule | baseline recorded as exactly one `d1_migrations` row and first; 008 must precede 010/011; 010/011 sibling order flexible; expected post-apply ledger **exactly 4 rows** |

### Migration 010 — expected objects

- `booking_chat_rooms`: `booking_id TEXT NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE`; `customer_id` / `supplier_id` FK → `users(id)`; `status` CHECK IN (`'active','closed','archived'`)
- `booking_chat_messages`: `room_id` FK ON DELETE CASCADE; `sender_id` FK → `users(id)`; `message_type` CHECK IN (`'text','image','system'`); `delivered_at`, `read_at`; `reply_to_id` self-FK
- Indexes: `idx_booking_chat_rooms_customer`, `idx_booking_chat_rooms_supplier`, `idx_booking_chat_messages_room_time(room_id, created_at)`
- Header guarantees: zero legacy data copy; never renames/drops/alters/reads legacy `chat_rooms`/`chat_messages`; all statements `IF NOT EXISTS`; ends with `PRAGMA foreign_key_check`

### Migration 011 — expected objects

- `payment_restitutions`: `payment_attempt_id TEXT NOT NULL UNIQUE REFERENCES payment_attempts(id)`; `provider_charge_id TEXT NOT NULL UNIQUE`; `amount_satang` CHECK > 0; `currency` CHECK = `'THB'`; `reason NOT NULL`; `recipient_reference`, `evidence_uri`; `approver_user_id` FK → `users(id)`; `status` CHECK IN (`'restitution_pending','restituted','restitution_failed'`); `requested_at` / `approved_at` / `completed_at` / `failed_at`; `failure_reason`
- Table-level lifecycle CHECK: pending ⇒ terminal timestamps NULL; restituted ⇒ `recipient_reference` + `evidence_uri` + approver + `approved_at` + `completed_at` NOT NULL and `failed_at` NULL; restitution_failed ⇒ `evidence_uri` + approver + `approved_at` + `failed_at` + `failure_reason` NOT NULL and `completed_at` NULL
- Indexes: `idx_payment_restitutions_booking(booking_id, requested_at DESC)`, `idx_payment_restitutions_customer(customer_id, requested_at DESC)`

### Lineage / ledger rules (`scripts/migrations/verify-lineage.mjs`)

- Approved names: `canonical-baseline.sql`, `008_omise_promptpay_payments.sql`, `010_booking_chat_expansion.sql`, `011_payment_restitutions.sql`
- Baseline exactly one row and first; 008 must precede 010/011; 010/011 sibling order flexible
- Baseline marker tables `users`, `bookings`, `chat_rooms`, `chat_messages` must exist (missing legacy chat = forbidden legacy-rename signature)
- `TABLES_BY_MIGRATION`: 008 → {`payment_attempts`, `payment_webhook_events`}; 010 → {`booking_chat_rooms`, `booking_chat_messages`}; 011 → {`payment_restitutions`}
- Usage: `node scripts/migrations/verify-lineage.mjs <schema-dump.json> <ledger-dump.json>` — exit 0 pass, 1 refuse-and-escalate, 2 usage/IO

## Acceptance criteria (issue #30) → evidence mapping

Issue acceptance (verbatim): *"No ambiguous legacy history is copied; eligible bookings
create one room; old Worker reads and writes remain safe during compatibility window"*.
Validation (verbatim): *"Schema, legacy-preservation, dual-Worker, uniqueness, and
row-count probes"*.

| Acceptance | Evidence artifact |
| --- | --- |
| Chat + restitution tables on rehearsal target | post-apply `sqlite_schema` dump vs `target-schema.sql` (surface-diff harness, 14 objects) |
| Tables, indexes, constraints, ledger entries match contract | schema assertion report + `d1_migrations` dump (`verify-lineage.mjs` exit 0, exactly 4 rows) |
| No ambiguous legacy history is copied | legacy-preservation probes: `chat_rooms`/`chat_messages` exist with original DDL and zero rows |
| Eligible bookings create one room | fixture probe: exactly one `booking_chat_rooms` row per booking; second INSERT on same `booking_id` rejected by UNIQUE |
| Old Worker reads/writes remain safe during compatibility window | dual-Worker probes (`legacy-chat.test.ts` harness patterns): legacy reads/writes valid; new Worker touches only `booking_chat_*` |
| Restitution integrity (011 amendment) | restitution probes: duplicate `payment_attempt_id` / `provider_charge_id` rejected; lifecycle-CHECK negatives rejected; positive controls accepted |
| Schema assertions and foreign-key check | `PRAGMA foreign_key_check` → zero rows |
| Row-count validation | row-count manifest: all tables zero rows except fixtures + `d1_migrations` (4 rows) |

---

## Stage 0 — Preconditions (offline)

```bash
cd Tirak/Backend/tirak-backend-alpha01
git checkout main && git pull --ff-only origin main
# DEPENDENCY: requires PR #19 (T-029) merged to main.
# If PR #19 is still OPEN at execution time, branch explicitly from its head instead:
#   git checkout -b codex/tirak-omise/w2.1/t-030-rehearse-migration-010-011 9d334be
# and record the branch-from decision in the ledger.
git checkout -b codex/tirak-omise/w2.1/t-030-rehearse-migration-010-011
node scripts/migrations/generate-canonical-baseline.mjs   # regenerate; hash MUST equal b6532c80…
test -f .env.tirak-staging && [ "$(stat -f '%Lp' .env.tirak-staging)" = "600" ]
```

Abort if: baseline hash drift (means 001–008 changed), credential checks fail, tree dirty,
or neither PR #19 merged nor an explicit branch-from-`9d334be` plan is recorded.

## Stage A — Fresh recovery point on active staging (read-only; T-026 chain)

```bash
export CLOUDFLARE_ACCOUNT_ID=$(sed -n 's/^TIRAK_CLOUDFLARE_ACCOUNT_ID=//p' .env.tirak-staging)
export CLOUDFLARE_API_TOKEN=$(sed -n 's/^TIRAK_CLOUDFLARE_API_TOKEN=//p' .env.tirak-staging)   # token never echoed
npm run staging:preflight && npm run staging:discover   # + npm run staging:verify (strict)
# expected fingerprint (SUCCESSOR value, human-confirmed during T-029):
#   3b57299a2a7cadc048243a18aeae8cc6d568b548eacf3edcfaa5ddbc24eef7cc
TS=$(date -u +%Y%m%dT%H%M%SZ); mkdir -p evidence/t030
npx wrangler d1 info tirak-staging --json > evidence/t030/d1-info-pre.json
npx wrangler d1 time-travel info tirak-staging --json > evidence/t030/bookmark-pre.json
npx wrangler d1 export tirak-staging --remote --output evidence/t030/tirak-staging-pre-$TS.sql
sha256sum evidence/t030/* > evidence/t030/checksums.sha256
```

Pinned account `2c0c96c68f0ee73b6d980054557bca5b`; staging D1 `tirak-staging` uuid
`5132c8cc-8f23-4dd2-94d1-9d53edb92888`.

**Fingerprint mini-gate (carried from T-029):** the expected value is the SUCCESSOR
fingerprint `3b57299a2a7cadc048243a18aeae8cc6d568b548eacf3edcfaa5ddbc24eef7cc`
(historical note: the T-025/T-026 value `52431d70…f10` is superseded — do not use it).
Because the fingerprint binds local migration lineage, it may shift again once PR #19
merges. If the computed fingerprint differs from `3b57299a…` **only** because of that
lineage change, pause for the pre-flight human fingerprint re-confirmation (a third
mini-gate) before Stage A proceeds. Any other drift, or non-pristine staging → abort and
escalate.

## ⛔ GATE 1 — Human approval required

> "T-030 requests authority to create exactly one disposable D1 database named
> `tirak-t030-rehearsal` in the pinned staging account (`primary_location_hint: apac`)
> and to apply the canonical baseline and migrations 008, 010, and 011 to it.
> No other mutation is requested. Active staging is never written. The rehearsal DB
> will be deleted or quarantined under GATE 2."

## Stage B — Rehearsal target + isolated apply roots

```bash
npx wrangler d1 create tirak-t030-rehearsal            # record database_id; primary_location_hint: apac
mkdir -p rehearsal/t030/migrations rehearsal/t030/migrations-baseline
cp migrations/baseline/canonical-baseline.sql rehearsal/t030/migrations-baseline/
cp migrations/008_omise_promptpay_payments.sql rehearsal/t030/migrations/
cp migrations/010_booking_chat_expansion.sql rehearsal/t030/migrations/
cp migrations/011_payment_restitutions.sql rehearsal/t030/migrations/
```

Isolated apply roots under `rehearsal/t030/`: `migrations-baseline/` holds the baseline
copy only; `migrations/` holds copies of 008, 010, 011 **only** — quarantined 004/009 are
unreachable. Two dedicated configs (never the repo `wrangler.toml`, whose `migrations/`
root contains quarantined files):

- `rehearsal/t030/wrangler.baseline.toml` → `migrations_dir = "./migrations-baseline"`, rehearsal `database_id`
- `rehearsal/t030/wrangler.lineage.toml` → `migrations_dir = "./migrations"` (008 + 010 + 011), rehearsal `database_id`

## Stage C — Apply (rehearsal DB only)

```bash
npx wrangler d1 migrations apply tirak-t030-rehearsal --remote --config rehearsal/t030/wrangler.baseline.toml
npx wrangler d1 migrations apply tirak-t030-rehearsal --remote --config rehearsal/t030/wrangler.lineage.toml
```

Baseline root first, then lineage root. A single lineage-root apply covering 008 → 010 → 011
is acceptable: wrangler applies pending migrations in filename order, and the verifier
permits flexible 010/011 sibling order after 008.

Expected ledger afterwards (**exactly 4 rows**): `canonical-baseline.sql`,
`008_omise_promptpay_payments.sql`, `010_booking_chat_expansion.sql`,
`011_payment_restitutions.sql`. Any deviation — including any quarantined filename
appearing in the ledger — → stop, capture, escalate (no retry without diagnosing;
partial-failure evidence is preserved append-only).

## Stage D — Verification (read-only against rehearsal)

1. **Schema surface:** dump `sqlite_schema` (minus system tables) and assert exact DDL
   match vs `target-schema.sql` using the existing surface-diff harness
   (`tests/migrations/schema-surface.test.ts`, invoked `npx vitest run tests/migrations/`)
   against the live dump — the 14 objects: `payment_attempts`, `payment_webhook_events`,
   `idx_payment_attempts_customer`, `idx_payment_attempts_charge`,
   `idx_payment_webhook_events_charge`, `uq_payment_attempt_active_booking`,
   `booking_chat_rooms`, `booking_chat_messages`, `idx_booking_chat_rooms_customer`,
   `idx_booking_chat_rooms_supplier`, `idx_booking_chat_messages_room_time`,
   `payment_restitutions`, `idx_payment_restitutions_booking`,
   `idx_payment_restitutions_customer`.
2. `PRAGMA foreign_key_check;` → zero rows.
3. **Legacy-preservation probes:** legacy `chat_rooms`/`chat_messages` exist with original
   DDL and contain zero rows (no copy); seed a booking fixture and assert exactly one
   `booking_chat_rooms` row per booking; a second INSERT with the same `booking_id` must
   fail UNIQUE (booking-scoped uniqueness probe).
4. **Dual-Worker compatibility probes:** reuse `tests/migrations/legacy-chat.test.ts`
   harness patterns against the live rehearsal dump — old Worker reads/writes against
   legacy tables remain valid; new Worker reads/writes `booking_chat_*` without touching
   legacy.
5. **Restitution probes (011 amendment):** duplicate `payment_attempt_id` rejected
   (UNIQUE); duplicate `provider_charge_id` rejected; lifecycle-CHECK negatives — e.g.
   status `restituted` without `evidence_uri`/approver/`completed_at` rejected;
   `restitution_pending` with `completed_at` set rejected; positive controls for each
   terminal state with complete fields accepted.
6. `d1_migrations` dump → `node scripts/migrations/verify-lineage.mjs <schema.json> <ledger.json>`
   → must exit 0 (exactly 4 rows; baseline first, then 008, then 010/011).
7. **Row-count manifest:** all tables zero rows except fixtures + `d1_migrations` (4 rows).

## ⛔ GATE 2 — Human approval required

Option A (preferred): `npx wrangler d1 delete tirak-t030-rehearsal --skip-confirmation`,
verify absence via `d1 list`, post-teardown discovery fingerprint unchanged.
Option B: quarantine with owner + review date recorded in the ledger.

## Stage E — Evidence closure

- `docs/execution/phase-2/t-030-rehearsal-evidence.md` + `t-030-rehearsal-ledger.json`
- `evidence/t030/` artifact bundle (pre/post dumps, apply transcripts sanitized, probe
  outputs, `checksums.sha256`)
- Scoped commit → PR to `Sheshiyer/tirak-backend-alpha01` (PR #15–#19 pattern) → evidence
  comment on issue `Sheshiyer/tirak-mobile-app-v2#30`
- Branch: `codex/tirak-omise/w2.1/t-030-rehearse-migration-010-011`. Note: the
  branch-worktree manifest still carries the stale `…-additive-migration-009` name —
  manifest drift to reconcile at wave close.

## Abort triggers

- Fingerprint drift on active staging (beyond the PR-#19 lineage shift adjudicated by the
  Stage A mini-gate); staging no longer pristine
- Baseline hash ≠ `b6532c80…` after regeneration
- Any apply error, partial ledger write, or unexpected ledger row — including any
  quarantined filename appearing in the ledger
- FK violations
- Duplicate-active-room or duplicate-restitution probe accepted; any lifecycle-CHECK
  negative accepted
- Any command transcript showing a write target other than the rehearsal DB

## Drift register

| Item | State | Disposition |
| --- | --- | --- |
| Stale "009" naming | Issue #30 title, ISA ledger entries, and branch-worktree manifest all say "009"/"additive-migration-009" while the quarantined `009_booking_scoped_chat.sql` is forbidden | Rehearse 010/011 per this runbook; reconcile manifest + ledger naming at wave close |
| PR #19 merge dependency | T-029 execution PASS but PR #19 OPEN; evidence on branch head `9d334be` | Stage 0 requires PR #19 merged to main OR explicit branch-from-`9d334be` plan recorded in ledger |
| Discovery fingerprint | Successor value `3b57299a…eef7cc` human-confirmed during T-029; supersedes `52431d70…f10`; may shift again when PR #19 merges (fingerprint binds local lineage) | Stage A mini-gate: human re-confirmation if drift is attributable only to the lineage change; otherwise abort |
| ISA ISC-153–155 ledger | Still unchecked at T-030 kickoff | Verify before wave close; do not treat this runbook as closing them |
