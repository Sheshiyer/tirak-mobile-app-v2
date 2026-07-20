# Shared Contract — `tirak-payments-v1`

## Product invariant

The purchasable object is a bounded, named guided travel experience. Tirak never sells access to a person's company, dating, companionship, adult services, gifts, tips, subscriptions, or open-ended time.

## Frozen implementation boundary

- Use the exact API, state, schema, environment, mobile, and fixture artifacts listed in `docs/contracts/tirak-payments-v1/contract-manifest.json`.
- The server owns booking identity, amount in satang, THB currency, customer ownership, and payment truth.
- Only provider-retrieved `successful` can produce paid state.
- Cancellation never implies a provider refund. Off-provider restitution uses its own immutable ledger.
- Chat is booking-scoped logistics after confirmation; no general or pre-booking social chat is released.
- Reviewer paid fixtures require a real verified Omise PromptPay charge and may never be produced with a manual paid-state edit.
- Prohibited adult, dating, escort, hookup, private-category, and compensated-companionship data is rejected at ingestion and removed from persisted release caches; UI-only seed hiding is invalid.

## Authority

This contract is approved only for local T-017–T-023 implementation. `T-024 human approval` is required before fanout, GitHub publication, branch/worktree creation, staging access, or deployment. Later production and submission gates remain independent.

## Drift rule

If a task needs to change an API route, state transition, amount unit, D1 ownership rule, environment identity, fixture provenance rule, or product invariant, stop. Reopen the owning contract task and do not patch around the conflict.
