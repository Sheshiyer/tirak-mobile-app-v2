# T-031 — Validate Migration Integrity and Recovery · Execution Runbook

Status: **EXECUTED 2026-07-24 — ALL STAGES PASS, GATES 1+2 APPROVED (teardown Option A)**
Prepared: 2026-07-24
Executed evidence: backend repo `Sheshiyer/tirak-backend-alpha01` PR #21 (open at execution time) — `docs/execution/phase-2/t-031-validation-evidence.md` + `t-031-validation-ledger.json`, `evidence/t031/` bundle
Task: GitHub issue `Sheshiyer/tirak-mobile-app-v2#31` — "[T-031] Validate migration integrity and recovery"
Wave: W2.1 · Swarm: migration-validation
Owner: Validation reviewer / isolated reviewer
Estimate: 4 hours
Dependencies: T-030 ✅ (executed 2026-07-24) — **PR #20 still OPEN** (all T-030 evidence lives on branch `codex/tirak-omise/w2.1/t-030-rehearse-migration-010-011`, head `8f33c51`)
Contract: `tirak-payments-v1`
Execution repo: `Tirak/Backend/tirak-backend-alpha01` (GitHub `Sheshiyer/tirak-backend-alpha01`; branch from the T-030 merge commit — see Stage 0 dependency note)
Final evidence destination: `docs/execution/phase-2/t-031-*` in the backend repo (this file is the review draft, same pattern as T-030)

Deliverable (verbatim): *"Independent migration and restore report"*.
Acceptance (verbatim): *"Foreign keys, indexes, row counts, ledger, and restore procedure pass"*.
Validation (verbatim): *"Independent SQL probes and restore rehearsal"*.

## 🔒 Independence rules — the defining feature of T-031 (read first)

T-031 is isolated-reviewer validation. The validator **does not trust** T-029/T-030
evidence conclusions. T-030's rehearsal report is treated as a *claim*, not a result;
every claim is re-derived from primary artifacts. The rules:

1. **Verify before use.** Before any T-030 artifact is read or restored from, run
   `sha256sum -c evidence/t030/checksums.sha256` from the T-030 evidence bundle. Any
   checksum mismatch → abort (see Abort triggers). The validator never consumes an
   unverified artifact.
2. **Restore from the primary export, never from a rehearsal DB.** All T-030 rehearsal
   databases were deleted under T-030 GATE 2. The only restore input is the primary
   post-apply export (`evidence/t030/tirak-t030-rehearsal-post-20260724T113406Z.sql`).
   The validator must not attempt to locate, resurrect, or shortcut from any rehearsal
   database.
3. **Re-run all probes fresh.** Every probe (foreign keys, indexes, row counts, ledger,
   negatives) is executed by the validator against the restored copy — never copied or
   quoted from T-030 transcripts. T-030 outputs serve only as the cross-check baseline
   (e.g. the row-count manifest the restored DB must match).
4. **Cross-check continuity across tasks.** T-030's pre-staging fingerprint must equal
   T-029's post-teardown fingerprint:
   `3b57299a2a7cadc048243a18aeae8cc6d568b548eacf3edcfaa5ddbc24eef7cc`. This chain of
   custody is re-verified by the validator from the respective evidence bundles, not
   assumed.

If any independence rule cannot be satisfied (missing bundle, missing checksums file,
unverifiable continuity), the runbook stops and escalates — validation without
independence is not validation.

## Authority boundary

Published under the recorded T-024 human approval. Validation mutations touch **only**
the disposable validation database. Prohibited: production mutation, live Omise
charging, App Store submission, staging writes, secret mutation, application-schema
migration on active staging (that is T-032→W2.2 scope), and bypassing later human
gates (per issue #31's own boundary text).

Two explicit human gates (same discipline as T-026/T-029/T-030):

- **GATE 1 (before restore):** authorize creation of exactly one disposable validation
  D1 `tirak-t031-validation` (APAC) and restore of the verified T-030 export into it.
- **GATE 2 (after verification):** authorize deletion of the validation database (or
  explicit quarantine with owner + review date).

## Inputs frozen by T-030

| Artifact | Identity |
| --- | --- |
| Primary restore input | `evidence/t030/tirak-t030-rehearsal-post-20260724T113406Z.sql` — post-apply export of the complete lineage (canonical baseline + 008 + 010 + 011, plus T-030's verification fixtures) |
| Secondary artifact | `evidence/t030/tirak-staging-pre-20260724T113406Z.sql` — pristine staging export (32-byte class artifact, like T-026's); confirms staging untouched |
| Integrity manifest | `evidence/t030/checksums.sha256` — must verify clean via `sha256sum -c` before any T-030 artifact is used |
| Row-count baseline | `evidence/t030/row-count-manifest.json` — restored DB must equal this manifest after validator probe cleanup |
| Continuity fingerprint | `3b57299a2a7cadc048243a18aeae8cc6d568b548eacf3edcfaa5ddbc24eef7cc` — T-030 pre-staging fingerprint == T-029 post-teardown fingerprint |
| Baseline | `node scripts/migrations/generate-canonical-baseline.mjs` regeneration must produce sha256 `b6532c80e5eeb6b481c26f5ad12f58043f8ad77587ea503527f6cb94e47cf33f` (drift = abort) |
| Contract surface | `contracts/tirak-payments-v1/target-schema.sql`; contract manifest hash `08acab5dd1f9b8d308d4944349129d9d032dc2a081517db0a2e33235f698b9c9` |
| Contract objects | 14 objects total, exact DDL match: `payment_attempts`, `payment_webhook_events`, `idx_payment_attempts_customer`, `idx_payment_attempts_charge`, `idx_payment_webhook_events_charge`, `uq_payment_attempt_active_booking`, `booking_chat_rooms`, `booking_chat_messages`, `idx_booking_chat_rooms_customer`, `idx_booking_chat_rooms_supplier`, `idx_booking_chat_messages_room_time`, `payment_restitutions`, `idx_payment_restitutions_booking`, `idx_payment_restitutions_customer` (plus baseline indexes) |
| Ledger rule | Restored `d1_migrations` must contain exactly 4 rows in canonical order: `canonical-baseline.sql`, `008_omise_promptpay_payments.sql`, `010_booking_chat_expansion.sql`, `011_payment_restitutions.sql`; no quarantined names (`004_mobile_app_features.sql`, `009_booking_scoped_chat.sql`) |
| Restore mechanics | T-026 precedent: `npx wrangler d1 execute <db> --remote --file <export.sql>`; documented fallback for large dumps — split into ordered statement chunks **without skipping any statement**, and record per-chunk counts (this is a documented fallback, not improvisation) |
| Restore constraint | `docs/contracts/tirak-payments-v1/migration-strategy.md` line 65 **forbids restore-by-overwrite of staging/production** — the drill runs only on the disposable validation DB |

## Acceptance criteria (issue #31) → evidence mapping

Issue acceptance (verbatim): *"Foreign keys, indexes, row counts, ledger, and restore
procedure pass"*. Validation (verbatim): *"Independent SQL probes and restore rehearsal"*.

| Acceptance keyword | Evidence artifact |
| --- | --- |
| Foreign keys | Fresh `PRAGMA foreign_key_check;` on the restored DB → zero rows; plus independent spot negatives proving enforcement survived restore: duplicate active room for the same booking → must fail `UNIQUE constraint failed: booking_chat_rooms.booking_id`; a `restituted` row missing `evidence_uri`/approver/`completed_at` → must fail the lifecycle CHECK |
| Indexes | Restored `sqlite_schema` index inventory vs contract `contracts/tirak-payments-v1/target-schema.sql`: must include exactly `idx_payment_attempts_customer`, `idx_payment_attempts_charge`, `idx_payment_webhook_events_charge`, `uq_payment_attempt_active_booking`, `idx_booking_chat_rooms_customer`, `idx_booking_chat_rooms_supplier`, `idx_booking_chat_messages_room_time`, `idx_payment_restitutions_booking`, `idx_payment_restitutions_customer` (plus baseline indexes); 14 contract objects total, exact DDL match |
| Row counts | Restored row-count manifest must equal T-030's post-verification manifest (`evidence/t030/row-count-manifest.json`): nonzero only `users` 3, `supplier_services` 1, `bookings` 1, `payment_attempts` 4, `booking_chat_rooms` 1, `booking_chat_messages` 1, `payment_restitutions` 3, `d1_migrations` 4; all other tables 0. If the validator's own spot-negative/positive probes add rows, cleanup must restore these counts before final manifest capture (mirroring T-030's legacy-cleanup discipline) |
| Ledger | `d1_migrations` dump from the **restored** DB → `node scripts/migrations/verify-lineage.mjs <schema.json> <ledger.json>` exit 0; exactly 4 rows in canonical order (`canonical-baseline.sql`, `008_omise_promptpay_payments.sql`, `010_booking_chat_expansion.sql`, `011_payment_restitutions.sql`); no quarantined names (`004_mobile_app_features.sql`, `009_booking_scoped_chat.sql`) |
| Restore procedure | The restore itself is the drill: capture pre-restore state, restore, verify all of the above on the restored copy — proving the documented T-026 chain (capture → export → disposable-restore → verify → teardown) works for the complete migration lineage. Restore-by-overwrite of staging/production is contract-forbidden (migration-strategy.md line 65); the drill runs only on the disposable DB |

---

## Stage 0 — Preconditions (offline)

```bash
cd Tirak/Backend/tirak-backend-alpha01
git checkout main && git pull --ff-only origin main
# DEPENDENCY: requires PR #20 (T-030) merged to main.
# If PR #20 is still OPEN at execution time, branch explicitly from its head instead:
#   git checkout -b codex/tirak-omise/w2.1/t-031-validate-migration-integrity-recovery 8f33c51
# and record the branch-from decision in the ledger.
git checkout -b codex/tirak-omise/w2.1/t-031-validate-migration-integrity-recovery
node scripts/migrations/generate-canonical-baseline.mjs   # regenerate; hash MUST equal b6532c80e5eeb6b481c26f5ad12f58043f8ad77587ea503527f6cb94e47cf33f
test -f .env.tirak-staging && [ "$(stat -f '%Lp' .env.tirak-staging)" = "600" ]
sha256sum -c evidence/t030/checksums.sha256               # INDEPENDENCE RULE 1 — verify before use
```

Abort if: baseline hash drift (regeneration ≠ `b6532c80…f33f`), contract manifest hash
≠ `08acab5d…b9c9`, credential checks fail, tree dirty, any T-030 checksum verification
failure, or neither PR #20 merged nor an explicit branch-from-`8f33c51` plan is recorded.

## Stage A — Fresh capture on active staging (read-only; T-026 chain)

Same capture pattern as T-029/T-030 — staging is observed, never written:

```bash
export CLOUDFLARE_ACCOUNT_ID=$(sed -n 's/^TIRAK_CLOUDFLARE_ACCOUNT_ID=//p' .env.tirak-staging)
export CLOUDFLARE_API_TOKEN=$(sed -n 's/^TIRAK_CLOUDFLARE_API_TOKEN=//p' .env.tirak-staging)   # token never echoed
npm run staging:preflight && npm run staging:discover   # + npm run staging:verify (strict)
# expected fingerprint (SUCCESSOR value, human-confirmed during T-029, carried through T-030):
#   3b57299a2a7cadc048243a18aeae8cc6d568b548eacf3edcfaa5ddbc24eef7cc
TS=$(date -u +%Y%m%dT%H%M%SZ); mkdir -p evidence/t031
npx wrangler d1 info tirak-staging --json > evidence/t031/d1-info-pre.json
npx wrangler d1 time-travel info tirak-staging --json > evidence/t031/bookmark-pre.json
npx wrangler d1 export tirak-staging --remote --output evidence/t031/tirak-staging-pre-$TS.sql
sha256sum evidence/t031/* > evidence/t031/checksums.sha256
```

Pinned account `2c0c96c68f0ee73b6d980054557bca5b`; staging D1 `tirak-staging` uuid
`5132c8cc-8f23-4dd2-94d1-9d53edb92888`; `.env.tirak-staging` mode 0600; sed-export
credential pattern (never echo tokens); transcripts sanitized — the T-026 rule stands:
the one-hour signed export URL is redacted from all captured transcripts.

Staging must still be pristine (`num_tables: 0`). Any non-pristine staging → abort and
escalate.

**Fingerprint mini-gate (carried from T-029/T-030):** `npm run staging:preflight &&
npm run staging:discover` must produce `3b57299a…eef7cc`. PR #20 adds no migration
files, so no drift is expected; the T-030 pre-staging fingerprint must equal the T-029
post-teardown fingerprint (Independence Rule 4). Any drift → **STOP** and escalate.

## ⛔ GATE 1 — Human approval required

> "T-031 requests authority to create exactly one disposable D1 database named
> `tirak-t031-validation` in the pinned staging account (`primary_location_hint: apac`)
> and to restore the verified T-030 post-apply export into it.
> No other mutation is requested. Active staging is never written. The validation DB
> will be deleted or quarantined under GATE 2."

## Stage B — Validation target + restore

```bash
npx wrangler d1 create tirak-t031-validation            # record database_id; primary_location_hint: apac
# Restore from the PRIMARY export only (Independence Rule 2) — checksums already verified in Stage 0:
npx wrangler d1 execute tirak-t031-validation --remote --file evidence/t030/tirak-t030-rehearsal-post-20260724T113406Z.sql
```

**Documented large-dump fallback (T-026 precedent, not improvisation):** if `--file`
rejects a large dump, split the export into ordered statement chunks **without skipping
any statement**, apply the chunks in order, and record per-chunk statement counts in the
ledger. The sum of per-chunk counts must equal the export's total statement count.

Restore capture: record the pre-restore state of the disposable DB (freshly created,
empty) and the post-restore `d1 info` into `evidence/t031/`. Any restore error or any
skipped statement → abort (see Abort triggers); partial-failure evidence is preserved
append-only.

## Stage C — Independent verification, part 1: structural (read-only against restored DB)

All probes below are re-run fresh by the validator against `tirak-t031-validation`
(Independence Rule 3):

1. **Schema surface / indexes:** dump `sqlite_schema` (minus system tables) from the
   restored DB and assert exact DDL match vs `contracts/tirak-payments-v1/target-schema.sql`
   using the existing surface-diff harness (`tests/migrations/schema-surface.test.ts`,
   invoked `npx vitest run tests/migrations/`) — the 14 contract objects including exactly
   `idx_payment_attempts_customer`, `idx_payment_attempts_charge`,
   `idx_payment_webhook_events_charge`, `uq_payment_attempt_active_booking`,
   `idx_booking_chat_rooms_customer`, `idx_booking_chat_rooms_supplier`,
   `idx_booking_chat_messages_room_time`, `idx_payment_restitutions_booking`,
   `idx_payment_restitutions_customer` (plus baseline indexes). Any contract object
   missing or extra → abort.
2. **Foreign keys:** fresh `PRAGMA foreign_key_check;` → zero rows.
3. **Ledger:** `d1_migrations` dump from the restored DB →
   `node scripts/migrations/verify-lineage.mjs <schema.json> <ledger.json>` → must
   exit 0; exactly 4 rows in canonical order (`canonical-baseline.sql`,
   `008_omise_promptpay_payments.sql`, `010_booking_chat_expansion.sql`,
   `011_payment_restitutions.sql`); no quarantined names
   (`004_mobile_app_features.sql`, `009_booking_scoped_chat.sql`).

## Stage D — Independent verification, part 2: behavioral probes + cleanup + manifest

1. **FK-enforcement spot negatives (proving enforcement survived the restore):**
   - Attempt a duplicate active room for the same booking → must fail
     `UNIQUE constraint failed: booking_chat_rooms.booking_id`.
   - Attempt a `restituted` row missing `evidence_uri`/approver/`completed_at` → must
     fail the lifecycle CHECK.
   Any negative probe *accepted* → abort.
2. **Positive controls:** well-formed rows satisfying each constraint are accepted
   (mirroring T-030's positive-control discipline).
3. **Cleanup:** if the validator's own spot-negative/positive probes added rows, remove
   them before final manifest capture — mirroring T-030's legacy-cleanup discipline.
4. **Row-count manifest:** capture a fresh row-count manifest from the restored DB. It
   must equal T-030's post-verification manifest (`evidence/t030/row-count-manifest.json`):
   nonzero only `users` 3, `supplier_services` 1, `bookings` 1, `payment_attempts` 4,
   `booking_chat_rooms` 1, `booking_chat_messages` 1, `payment_restitutions` 3,
   `d1_migrations` 4; all other tables 0. Any mismatch (after cleanup) → abort.
5. **Restore-procedure closure:** Stage A capture + Stage B restore + Stages C–D
   verification on the restored copy together constitute the restore drill — proving the
   documented T-026 chain (capture → export → disposable-restore → verify → teardown)
   works for the complete migration lineage, on the disposable DB only
   (restore-by-overwrite of staging/production is contract-forbidden,
   migration-strategy.md line 65).

## ⛔ GATE 2 — Human approval required

Option A (preferred): `npx wrangler d1 delete tirak-t031-validation --skip-confirmation`,
verify absence via `d1 list`, post-teardown discovery fingerprint unchanged.
Option B: quarantine with owner + review date recorded in the ledger.

## Stage E — Evidence closure

- `docs/execution/phase-2/t-031-validation-evidence.md` + `t-031-validation-ledger.json`
  — together these are the deliverable: the **"independent migration and restore report"**
- `evidence/t031/` artifact bundle (pre/post captures, restore transcript sanitized,
  probe outputs, restored manifest, `checksums.sha256`)
- Scoped commit → PR to `Sheshiyer/tirak-backend-alpha01` (PR #15–#20 pattern) — **do
  not merge; the human closes the PR** → sanitized evidence comment on issue
  `Sheshiyer/tirak-mobile-app-v2#31`
- Branch: `codex/tirak-omise/w2.1/t-031-validate-migration-integrity-recovery`

## Abort triggers

- Checksum verification failure on any T-030 artifact (`sha256sum -c` non-clean)
- Fingerprint drift (mini-gate failure: computed ≠ `3b57299a…eef7cc`)
- Staging non-pristine (`num_tables` ≠ 0)
- Baseline regeneration hash ≠ `b6532c80…f33f`, or contract manifest hash ≠ `08acab5d…b9c9`
- Restore error or any skipped statement (including chunk-count mismatch under the
  documented fallback)
- Any contract object missing or extra on the restored DB
- FK violations (`PRAGMA foreign_key_check` non-empty)
- Any negative probe accepted
- Row-count mismatch vs T-030 manifest (after cleanup)
- Ledger deviation or `verify-lineage.mjs` non-zero exit — including any quarantined
  filename appearing in the ledger
- Any write target other than the disposable validation DB

## Drift register

| Item | State | Disposition |
| --- | --- | --- |
| Stale "009" naming | Issue #30 title, ISA ISC-153, and the branch-worktree manifest all say "009"/"additive-migration-009" while the quarantined `009_booking_scoped_chat.sql` is forbidden; still unreconciled at T-031 kickoff | Validate the 010/011 lineage per this runbook; reconcile manifest + ledger naming at wave close |
| PR #20 merge dependency | T-030 executed 2026-07-24 but PR #20 OPEN; evidence on branch head `8f33c51` | Stage 0 requires PR #20 merged to main OR explicit branch-from-`8f33c51` plan recorded in ledger |
| ISA ISC-149–155 ledger | Still unchecked at T-031 kickoff | Verify before wave close; do not treat this runbook as closing them |
| Token rotation | Full-scope token rotation pending separate authority | Out of T-031 scope; do not mutate secrets under this runbook |
