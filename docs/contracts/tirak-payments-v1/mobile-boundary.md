# Tirak Payments v1 Mobile Boundary

Status: frozen for local cross-layer validation; no build or deployment authority

## Booking and navigation

- A concrete guided-experience `serviceId` is mandatory before booking submission.
- `pending` means request submitted: no PromptPay CTA and no chat.
- Only a guide-confirmed booking can expose PromptPay and booking-scoped logistics chat.
- `failed` permits an explicit retry only while the booking remains confirmed.
- `creating`, `indeterminate`, or public `processing` blocks blind retry.
- `paid` comes only from server/provider reconciliation; mobile never writes it.
- Experience completion and payment settlement remain different state axes.

## Charge response

The app accepts only `contractVersion: "tirak-payments-v1"` with a positive integer `amountSatang`, positive `displayTotalThb`, `currency: "THB"`, `chargeId`, explicit `paymentStatus` and `attemptStatus`, and an optional QR/expiry. Unversioned responses and ambiguous `amount` fields fail closed.

## Cancellation and restitution

Cancellation never implies refund. The public states are `restitution_pending`, `restituted`, and `restitution_failed`; the UI calls these resolution transfers because PromptPay cannot be refunded through Omise. Paid or unresolved attempts require the separate operational case path before ordinary cancellation.

## Release-surface language

The signed release must contain none of the following:

- private/adult categories or imagery;
- dating, escort, hookup, compensated-companionship, direct-cash, gift, tip, or person-for-time language;
- pre-booking or person-scoped chat;
- saved PromptPay contact or raw-card collection;
- a paid reviewer fixture created by local state mutation.

Every checkout screen must name the guided experience, booking, THB total, payment state, expiry, and logistics-only context.
