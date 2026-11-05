# Tirak production backend — reviewed change proposal

**Status: owner approved. Backup restored and verified; 28 schema statements applied; guarded ledger 17 → 24; two review accounts suspended. All five bookings and original fields preserved. Core deployment awaits Worker-scope sign-in. No charges or deletions performed.**

[Live execution receipt](live-backend-execution-20261013.json). The proposal details below describe the pre-change inventory and approved inputs.
Mobile 1.5.4 signed artifacts are ready for acceptance, but public release is held by the production schema/data and real-account/device gates below.

## Verified target

- Cloudflare account: `2c0c96c68f0ee73b6d980054557bca5b`.
- Isolated Wrangler credential profile: `tirak`; sign-in succeeded. Inherited credentials and dotenv tokens are excluded.
- Existing default Worker: `tirak-backend.tirak-court.workers.dev`.
- Existing D1: `tirak-development` / `60443346-c480-4975-962e-bd4daf4a37a8`.
- Do not substitute `--env production`: that selects a separate database and different email configuration.
- Health/public health return 200; chat requires authentication. Every successful live inventory query reports `rows_written: 0` and `changed_db: false`.

## Live inventory

| Surface | Observed |
|---|---:|
| Users | 34 |
| Guide profiles | 17 |
| Guide services | 2 |
| Bookings | 5 |
| Payment attempts | 0 |
| Current booking chat rooms/messages | 0 / 0 |
| Explicitly known review accounts | 2 |
| Synthetic `demo_*` user IDs | 0 |
| Synthetic `demo_booking_*` IDs | 0 |

The two explicit review accounts were identified by the exact existing code allowlist of review IDs/emails, not by display names or broad email patterns. Current IDs differ from old hard-coded fixture IDs:

- Review traveler: `f18cd5ee-963f-48f4-8965-9741b6afb516` (active customer).
- Review guide: `34b53bda-1908-49d4-8950-373c39a5eeed` (active supplier).

All five bookings reference the review guide; two reference the review traveler, while three belong to other customer accounts. The two confirmed bookings are dated May 22–23, 2026; three pending bookings are dated May 22–28, 2026. No future booking was found in this selected set. Do not assume those other accounts or their history are disposable.

Direct dependencies also include one customer profile, one supplier profile, two services, six availability rows, legacy pair chat/history, notifications, a referral account and activity summaries. Counts in `live-fixture-impact-20261013.json` are per relation and must not be summed as unique rows.

## Schema reconciliation — concrete prepared artifact

The live ledger includes historical migrations through 019. Metadata proves Core additions are missing: onboarding idempotency/payload/status-token/application-data fields, evidence/interest/cohort tables, booking idempotency, supplier interests, booking payment status/location, and supporting indexes.

Several later migration fields already exist through historical drift. Blindly applying 020–026 would fail on nine duplicate-column ALTERs:

- Customer date of birth and gender (023).
- Six booking preference/experience fields (025).
- User notification preferences (026).

Prepared [exact reconciliation SQL](PROPOSED-backend-core-reconciliation-20261013.sql) contains **28 statements**, rehearsed successfully on an empty local SQLite database built from the actual live schema metadata. Existing columns are skipped. No live rows were exported or modified for that rehearsal; it proves DDL compatibility, not a restored full-data backup.

See `backend-migration-rehearsal-20261013.json` and `live-schema-metadata-20261013.json`. Before applying, re-read the live schema and compare it to this reviewed snapshot. Abort and regenerate if it changed. Do not run blanket migration wrappers or the quarantined historical chain. Apply the separately reviewed [guarded ledger reconciliation](PROPOSED-backend-core-ledger-20261013.sql) only after every schema change is read back. It adds exactly seven verified-equivalent 020–026 entries while preserving the 17 existing rows. Local probes verify it inserts zero before schema application, seven afterward, and zero on replay. Until that ledger read-back passes, generic migration apply is prohibited.

## Prepared backend source

- Application source: Core `ea58fcb`, isolated on `codex/store-backend-candidate-20261013`.
- Only additional source-worktree change is a test clock repair: the dashboard chat test now uses SQLite's current UTC date instead of assuming October 5 remains today.
- Full **57 files / 722 tests passed**; TypeScript passed.
- Production-default Wrangler dry-run bundle passed under the isolated profile. Actual deployment was not invoked.
- Default production flags remain `PAYMENT_MODE=disabled`, `PROMPTPAY_ENABLED=false`, `PAYMENT_PRODUCTION_POLICY_WRITES_ENABLED=false`; existing Resend selection and resource bindings are retained.
- Current deployed Worker version was not independently read through the Workers API under the D1-only OAuth grant. Source tests are not a live-version claim.

## Recommended review-data treatment

Suspend the two exact review accounts, preserving all existing booking/history records and other accounts. Backend authentication already checks the current database account status on each request, so suspension rejects existing account JWTs on subsequent requests. Mobile also refuses known review identities and no longer manufactures demo results.

Prepared [suspension SQL](PROPOSED-review-account-suspension-20261013.sql) guards exact IDs, roles, active status and the explicit review email allowlist. Expected write count is exactly two. [Exact rollback SQL](PROPOSED-review-account-rollback-20261013.sql) restores only their captured active status under fresh owner authorization; it must not undo unrelated later status changes. No service, booking, message, notification, payment or other-user row is deleted. No account reclassification by name is proposed.

Suspension removes these accounts from active use; it is **not** a claim that historical review data has been physically erased. Physical deletion requires a separately reviewed dependency/preservation plan and owner confirmation concerning the three other customer accounts. The safer proposal retains audit/history integrity.

## Approval scope proposed

1. Create an owner-protected fresh D1 backup and verify restoration locally before any mutation. Keep private rows/credential hashes outside Git, logs and chat.
2. Re-check schema/counts; apply only the reviewed reconciliation against this exact D1. Verify missing columns/indexes/tables and unchanged existing user/booking/service/payment counts. Reconcile ledger truthfully.
3. Promote the tested Core Worker source to the **existing default Worker**, preserving bindings, Resend and disabled payment flags. Obtain deployment-specific scoped access separately; the current verification wrapper does not permit deployment.
4. Suspend only the two reviewed accounts with the exact guarded SQL; read back two suspended states and preserved counts/history. Do not delete data.
5. Verify health, real guide onboarding, booking persistence and two-party REST/WebSocket chat with owner-permissioned real accounts, then installed-device/visual acceptance. Do not create arbitrary new demo accounts or message unrelated users.
6. Only after acceptance, submit the specific signed build IDs to TestFlight/Play internal testing and complete public store review gates.

Rollback: retain the current Worker version for immediate code rollback. Additive schema changes can remain while rolling code back; do not drop columns/tables or restore an older full database over new legitimate writes casually. Document any partial application and regenerate missing-only reconciliation before retrying.

Live mutation/deployment permission is required by the backend operating contract (`AGENTS.md`: external deployment state requires a separate owner-approved task) and because the existing database contains other users' booking history. The present work completed the reversible preparation and read-only evidence first.
