# Omise PromptPay Architecture for Tirak

Last updated: 2026-07-18

## Scope

This release adds PromptPay checkout for a confirmed real-world guided experience. It does not add saved cards, card-number capture, Apple Pay, Google Pay, guide payouts, subscriptions, tips, gifts, digital unlocks, or live production secrets.

The App Review account should contain separate confirmed-unpaid and paid bookings. Reviewers can inspect the QR and final paid state without completing PromptPay or using a reviewer-only production bypass.

## Trust Boundary

The Expo app may send only:

```json
{
  "bookingId": "booking-id",
  "method": "promptpay"
}
```

The Cloudflare Worker is authoritative for the authenticated traveler, booking ownership, booking state, total amount, THB currency, payment eligibility, active-attempt idempotency, and final status. The client never sends an amount, Omise secret, webhook secret, card number, CVC/CVV, or expiry.

## Eligibility

A charge can be created only when:

- The booking exists and belongs to the authenticated traveler.
- The booking status is exactly `confirmed`.
- The booking is not cancelled, declined, completed, or expired.
- The booking is not already paid.
- The target is a guided experience, not a subscription or digital feature.

## Amount Model

Booking amounts are stored and interpreted according to the existing D1 price contract, then converted exactly once to Omise minor units. For THB, `1,000.00` THB must become `100000` satang. Tests pin this conversion and reject ambiguous or non-finite values.

## Create Flow

1. Authenticate the Tirak user.
2. Load the booking plus service price from D1.
3. Verify ownership and exact `confirmed` state.
4. Reuse any active payment attempt for that booking.
5. Create a PromptPay source and charge with Omise using the Worker secret.
6. Persist the provider charge ID, method, integer amount, currency, QR URI, and `pending` status.
7. Return only safe checkout data to Expo.

The booking-bound active attempt is the creation-idempotency key. A client retry after a network timeout must not create a second provider charge. A definite Omise 4xx response moves the attempt to `failed`; a network error, provider 5xx response, or invalid successful response moves it to `indeterminate` and blocks blind charge creation.

## Mobile Flow

1. A confirmed booking shows **Pay for this experience**.
2. Expo requests the booking-bound PromptPay charge.
3. The screen displays experience title, server total, status, and QR image.
4. The traveler completes payment in a banking app.
5. The traveler can refresh status; the app never self-declares success.
6. Failure or expiry leaves the booking intact and offers an explicit retry only while it remains confirmed.

## Completion and Webhook Flow

PromptPay is asynchronous. The webhook endpoint is public to Omise but does not trust its body as payment truth.

1. Read the exact raw request bytes.
2. Read `Omise-Signature` and `Omise-Signature-Timestamp`.
3. Reject timestamps outside the configured replay window.
4. Base64-decode the Worker webhook secret and verify HMAC-SHA256 over `<timestamp>.<rawBody>` using Web Crypto.
5. Accept a match against either comma-separated signature during Omise's secret-rotation window.
6. Extract only the charge identifier needed for retrieval.
7. Retrieve that charge independently from Omise with the secret key.
8. Verify charge ID, amount, currency, and booking metadata against the local attempt.
9. Reconcile from the retrieved Omise status, never the webhook-declared status.
10. Apply final transitions idempotently and acknowledge authentic duplicates without repeating work.

An authenticated status GET uses the same independent retrieval and ownership checks, providing a recovery path when webhook delivery is delayed. When a charge-creation result is indeterminate, support first locates the Omise charge by the server-set `booking_id` metadata. The authenticated booking owner can then submit that exact charge identifier to `POST /api/payments/charges/recover`; the Worker performs only an Omise GET and will bind the charge only after verifying ownership, charge ID, amount, THB currency, booking metadata, and PromptPay source. Recovery never creates a charge.

## State Rules

| Provider result | Payment attempt | Booking payment state | Retry |
| --- | --- | --- | --- |
| pending | pending | pending | reuse active attempt |
| provider outcome unknown | indeterminate | processing | block blind retry; recover exact charge |
| successful | completed | completed | no |
| failed | failed | failed/unpaid | explicit new attempt if booking still confirmed |
| expired | expired | expired/unpaid | explicit new attempt if booking still confirmed |

No webhook or client message changes the experience-delivery state to completed.

## Secret Configuration

Production secrets must be added through Cloudflare secret management, never committed:

- `OMISE_SECRET_KEY`
- `OMISE_WEBHOOK_SECRET`

The Omise dashboard webhook URL and production credential rollout are deployment operations requiring separate authorization and verification.

## Required Release Tests

- Server amount authority and tampered-request rejection
- `1000 THB → 100000 satang`
- Booking ownership and exact confirmed-state gate
- Duplicate create makes one provider charge
- Raw card fields rejected
- Missing configuration returns 503
- Safe QR response and secret non-disclosure
- Status GET ownership and independent retrieval
- Valid raw-body signature accepted; mutated body and bad signature rejected
- Stale timestamp rejected
- Webhook-declared status ignored
- Replay/final-state idempotency
- Authentic webhook processing failures can be reclaimed and retried
- Indeterminate network/5xx outcome blocks duplicate creation
- Exact-charge recovery validates owner, amount, THB, metadata, and source
- Final local attempts still reject provider identity or amount mismatches
- Failed/expired attempt leaves booking unpaid and retryable
- Mobile confirmed-only CTA, safe request payload, QR render, refresh, and failure branch

An `indeterminate` attempt fails closed instead of repeating the provider request. Before production, Tirak operations must have a reconciliation runbook that locates the exact charge through Omise metadata and coordinates authenticated recovery. If no Omise charge exists, an operator must explicitly resolve the attempt before another checkout can begin; automatically creating another charge would risk a duplicate payment after a network timeout.

## Deployment Preflight

Do not apply the migration blindly to production. Back up the target D1 database, inspect `PRAGMA table_info(bookings)`, and confirm it contains `customer_id`, `status`, `total_amount`, `currency`, and `payment_status` before enabling the routes. The repository's historical fresh-database migration replay is not clean because the two legacy `004_*` migrations overlap an earlier bookings schema; migration `008_omise_promptpay_payments.sql` itself applies and passes foreign-key probes against the initial schema, but the exact target D1 must be dry-run and verified separately.

After the dry run, confirm both `payment_attempts` and `payment_webhook_events` exist, then configure Worker secrets and the Omise dashboard webhook. None of these production actions were performed by this change.
