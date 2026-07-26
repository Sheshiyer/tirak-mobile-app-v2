# T-048 Precondition — Staging Chat-Schema Inspection

Status: **STATIC INSPECTION COMPLETE — LIVE CONFIRMATION BLOCKED (staging-account access)**
Date: 2026-07-26
Context: condition precedent for T-048 under `payment-park-and-resequencing-record.md` §5.3.

---

## 1. Access check (both channels exhausted, read-only)

| Channel | Result |
|---|---|
| Cloudflare MCP (OAuth) | Token sees only account `9d9d23b27f32e70ae3afb6a1aa2c0f10`; pinned staging account `2c0c96c68f0ee73b6d980054557bca5b` returns **7403 not authorized** |
| Local `wrangler whoami` | Same account `9d9d23b27f32e70ae3afb6a1aa2c0f10`, scopes `account:read` + `user:read` only (no D1 query permission regardless) |

The pinned staging account (T-025 ledger, `HUMAN_CONFIRMED_STAGING_IDENTITIES`) is not reachable from this session. Live schema read requires the human release owner's staging credentials — the same access class as the parked Omise work.

## 2. Static findings (repo evidence, high confidence)

Comparing migration lineage with the code's expectations:

| Source | `chat_rooms` shape | Booking-scoped? |
|---|---|---|
| `migrations/001_initial_schema.sql` (in canonical lineage) | `customer_id`, `supplier_id`, `UNIQUE(customer_id, supplier_id)` — **no `booking_id`** | No |
| `migrations/009_booking_scoped_chat.sql` (**quarantined, never applied** per W2.2 application runbook) | adds `booking_id NOT NULL UNIQUE REFERENCES bookings` | Yes |
| `migrations/010_booking_chat_expansion.sql` (applied) | creates **separate** `booking_chat_rooms` / `booking_chat_messages` | Yes, but different table names |
| `src/routes/chat.ts` (deployed code) | queries `chat_rooms` with `cr.booking_id`, joins `bookings`, inserts `(id, booking_id, customer_id, supplier_id, …)` | Expects the **009 shape** |

**Conclusion (static):** the deployed chat routes expect `chat_rooms.booking_id`, which exists only in the quarantined 009. The applied lineage gives staging the 001 `chat_rooms` (no `booking_id`) plus `booking_chat_*` tables the code never references. If the static read is correct, **every chat route on staging fails at the SQL layer** (no such column: `booking_id`) — and any local validation of T-048 against the 001 shape would validate the wrong surface.

This is exactly the class of drift T-048 exists to catch. It also explains why 009 was quarantined in the first place (legacy `chat_rooms` collision) — resolution needs a lineage decision, not a blind apply: either an additive migration that evolves `chat_rooms` to the 009 shape (with legacy-row handling) or a code change to the `booking_chat_*` tables.

## 3. Blocked live confirmation — runbook for the human release owner

With staging-account credentials (the T-025 token class), run read-only:

```bash
# Account 2c0c96c68f0ee73b6d980054557bca5b, database tirak-staging (5132c8cc-8f23-4dd2-94d1-9d53edb92888)
npx wrangler d1 execute tirak-staging --env staging --remote --json \
  --command "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
npx wrangler d1 execute tirak-staging --env staging --remote --json \
  --command "SELECT sql FROM sqlite_master WHERE name IN ('chat_rooms','chat_messages','booking_chat_rooms','booking_chat_messages')"
```

Acceptance for unblocking T-048: `chat_rooms` on staging exposes `booking_id` (009 shape), OR a lineage amendment is signed choosing the `booking_chat_*` surface and the code is migrated to it. Until then **T-048 remains conditionally parked** — §5.3's condition precedent is NOT met.

## 4. Recommendation

Fold the chat-lineage decision into the payment-flow redesign conversation: both are frozen-contract amendments (T-011 schema contract), both are blocked on the same owner access, and doing them together avoids two re-freeze cycles.
