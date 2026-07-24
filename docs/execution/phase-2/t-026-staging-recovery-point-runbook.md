# T-026 — Capture and Restore Staging Recovery Point · Execution Runbook

Status: **DRAFT FOR HUMAN REVIEW — NOT YET EXECUTED**
Prepared: 2026-07-23
Task: GitHub issue `Sheshiyer/tirak-mobile-app-v2#26`
Owner: Human release owner plus data owner
Estimate: 2 hours
Dependencies: T-025 ✅ (ACCEPTED 2026-07-21, merged via `tirak-backend-alpha01` PR #15)
Contract: `tirak-payments-v1`
Execution repo: `Tirak/Backend/tirak-backend-alpha01` (branch from `main` @ `1e61c2d`)
Final evidence destination: `docs/execution/phase-2/` in the backend repo (this draft lives in the mobile workspace until execution is authorized)

## Authority boundary

Published under the recorded T-024 human approval. T-025's provisioning authority was
**consumed** — this runbook inherits **zero** mutation authority. Specifically prohibited:
production mutation, live Omise charging, App Store submission, D1 application-schema
migration on staging, secret mutation/rotation, deletion of any resource, and bypassing
later task gates.

Two **explicit human gates** are embedded below and cannot be skipped:

- **GATE 1 (before Stage C):** authorize creation of exactly one disposable rehearsal D1
  database. This is a new provisioning mutation requiring fresh approval.
- **GATE 2 (after Stage D):** authorize deletion of the rehearsal database, or explicitly
  quarantine it. Deletion is a separate authority per the T-025 precedent.

## Frozen staging targets (from T-025 ledger, do not re-derive)

| Resource | Identity |
| --- | --- |
| Account | `2c0c96c68f0ee73b6d980054557bca5b` (pinned) |
| D1 | `tirak-staging` (proven pristine-empty: `num_tables: 0`, `schemaUserVersion: 0`) |
| Worker | `tirak-backend-staging` (inert, `PAYMENT_MODE=disabled`) |
| Discovery fingerprint | `52431d704ca2ea3dbf208785ea6ea09f60c9629a00ea37544ad49b30d04c7f10` |

Credential: owner-only `.env.tirak-staging` (mode `0600`, git-ignored, never printed,
never pasted into chat/issues/logs). The token is read-only scoped
(`D1 Read` etc.) — sufficient for Stages A–B; Stage C creation may require a separately
authorized capability, which is exactly what GATE 1 adjudicates.

## Acceptance criteria (from issue #26) → evidence mapping

| Acceptance | Evidence artifact |
| --- | --- |
| Recovery artifact is timestamped | `t-026-recovery-ledger.json` with ISO-8601 capture timestamps |
| Restoration proven on disposable rehearsal DB / approved empty staging clone | Stage C/D transcripts + post-restore probe results |
| Active staging never overwritten for proof | Command log audit: zero write/restore commands targeting `tirak-staging` |
| `d1 info`, Time Travel/export, disposable restore, checksums, row-count evidence | Per-stage artifacts listed below |

---

## Stage 0 — Local preconditions (no network, no authority needed)

```bash
cd Tirak/Backend/tirak-backend-alpha01
git checkout main && git pull --ff-only origin main
git checkout -b codex/tirak-omise/w2.1/t-026-staging-recovery-point
test -f .env.tirak-staging && [ "$(stat -f '%Lp' .env.tirak-staging)" = "600" ]
git status --porcelain   # must be clean except ignored files
npm ci                   # wrangler ^4.93.0 provides d1 export + time-travel
```

Abort if: `.env.tirak-staging` is tracked/staged, mode is not `0600`, or the tree is dirty.

## Stage A — Read-only preflight and drift check (T-024 authority)

```bash
npm run staging:preflight
npm run staging:discover
```

Pass conditions: token policy class reported, pinned account confirmed, and the
rediscovery fingerprint equals `52431d7…f10`. **Any fingerprint drift aborts the task** —
staging state changed since T-025 and must be explained before proceeding.

## Stage B — Capture the recovery point (read-only)

Wrangler auth without exposing the token (operator-run, token never echoed):

```bash
export CLOUDFLARE_ACCOUNT_ID=2c0c96c68f0ee73b6d980054557bca5b
export CLOUDFLARE_API_TOKEN=$(sed -n 's/^TIRAK_CLOUDFLARE_API_TOKEN=//p' .env.tirak-staging)
```

Capture:

```bash
npx wrangler d1 info tirak-staging --env staging --json \
  > evidence/t026/d1-info.json

npx wrangler d1 time-travel info tirak-staging --env staging --json \
  > evidence/t026/time-travel-bookmark.json     # bookmark = timestamp + min_restorable window

npx wrangler d1 export tirak-staging --env staging --remote \
  --output evidence/t026/tirak-staging-$(date -u +%Y%m%dT%H%M%SZ).sql

sha256sum evidence/t026/*.sql evidence/t026/*.json > evidence/t026/checksums.sha256
```

Row-count manifest: for the T-025-proven pristine-empty DB the manifest is **exactly
empty** (zero user tables) — record this explicitly; a non-empty result means drift → abort.
Also record `schema.sql` introspection (`sqlite_schema` minus `sqlite_%`, `_cf_%`,
`d1_migrations`) to bind "empty" to a reproducible query, not an assumption.

## ⛔ GATE 1 — Human approval required before Stage C

Present to the release owner: capture artifacts, checksums, and this exact statement:

> "T-026 requests authority to create exactly one disposable D1 database named
> `tirak-t026-rehearsal` in the pinned staging account (`primary_location_hint: apac`),
> for restore rehearsal only. No other mutation is requested. The rehearsal DB will be
> deleted or quarantined under GATE 2."

Proceed only after explicit approval. If a read-only-scoped token cannot create D1, that
limitation is reported — **not** bypassed by escalating token scope without approval.

## Stage C — Rehearsal restore (mutation: rehearsal DB only)

```bash
npx wrangler d1 create tirak-t026-rehearsal            # capture returned database_id
npx wrangler d1 execute tirak-t026-rehearsal --remote \
  --file evidence/t026/tirak-staging-<capture-ts>.sql  # import the export
```

Proof of restore (must match Stage B exactly):

```bash
npx wrangler d1 info tirak-t026-rehearsal --json
npx wrangler d1 execute tirak-t026-rehearsal --remote --json \
  --command "SELECT type,name FROM sqlite_schema WHERE name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' AND name != 'd1_migrations' ORDER BY name;"
```

Pass: rehearsal `sqlite_schema` and row-count manifest are byte-identical (empty) to the
capture; `d1 info` reports the rehearsal DB as a distinct `database_id` from `tirak-staging`.
Fail: any mismatch → record, do not retry blindly, escalate to the release owner.

Negative assertion (audited from shell history / transcripts): no command in Stage C
references `tirak-staging` as a write target. Time Travel `restore` is **not** run
against active staging — it is documented as the production-incident path only.

## Stage D — Teardown decision

## ⛔ GATE 2 — Human approval required

Option A (preferred): delete `tirak-t026-rehearsal` (`npx wrangler d1 delete
tirak-t026-rehearsal`) under explicit deletion authority; verify absence via re-discovery.
Option B: quarantine — leave the DB in place, record it in the ledger as
`QUARANTINED_REHEARSAL_ARTIFACT` with a named owner and a review date. It is inert and
unbound (no Worker binding), so Option B carries no runtime risk.

## Stage E — Evidence closure

Write to the backend repo on the T-026 branch:

1. `docs/execution/phase-2/t-026-recovery-point-evidence.md` — narrative + acceptance
   mapping + transcripts (sanitized; no token material, no raw headers).
2. `docs/execution/phase-2/t-026-recovery-ledger.json` — timestamps, checksums,
   bookmark, capture/restore hashes, gate decisions with approver identity, PASS/FAIL
   per acceptance line.
3. Export `.sql` + `checksums.sha256` — store per repo convention (large artifacts may
   stay out of git with hashes recorded in the ledger; follow T-025 ledger precedent).

Validation cross-check against issue #26: every acceptance line maps to a concrete
artifact; `git diff --check` clean; scoped commit; PR to `main` following the PR #15
pattern. **T-026 closure unblocks T-029** (rehearse migration 008).

## Abort triggers (any one → stop, record, escalate)

- Discovery fingerprint ≠ `52431d7…f10`
- `tirak-staging` reports any user table or nonzero row count (drift from pristine-empty)
- Credential file fails ownership/mode/git-ignore checks
- Token policy class changes between Stage A and any later stage
- Any command transcript shows a write target other than the rehearsal DB

## Out of scope for T-026 (later tasks)

- D1 application-schema migration (T-028/T-029/T-030)
- Worker deployment (T-036), webhook registration (T-035), secrets (T-034)
- Token rotation (separate secret-mutation authority)
