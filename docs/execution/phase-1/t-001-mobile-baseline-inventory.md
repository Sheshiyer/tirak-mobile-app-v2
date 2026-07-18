# T-001 Mobile Baseline Inventory

Status: classified; no files reverted
Captured: 2026-07-19 02:21–02:34 IST
Repository: `tirak-mobile-app-v2`
Branch: `public/main`
Parent SHA: `d4b8aa4b004b72ade40f53b5fc85e3cbe77cb431`
Upstream divergence: `0 ahead / 0 behind`

## Snapshot

- 53 tracked modifications.
- 16 untracked status entries representing 29 files.
- No staged files at capture time.
- `git diff --check` passed.

## Included release inputs

| Classification | Paths | Purpose |
| --- | --- | --- |
| Mobile routes and screens | `app/**` | Experience-first discovery, booking-state, payment, and booking-scoped chat flows |
| Shared UI | `components/**` | Guided-experience language, booking steps, PromptPay presentation, and safe empty states |
| Client contracts | `utils/**`, `stores/**`, `types/**`, `constants/**` | Booking normalization, payment API, WebSocket envelopes, state guards, and category allowlist |
| Tests | `__tests__/**` | Booking, payment, chat, copy, and regression evidence |
| Product data | `mocks/**`, `locales/**` | Travel-only fixtures and English/Thai copy |
| Release configuration | `app.json`, `public/manifest.json`, `public/index.html.backup` | Travel category and release-facing product identity |
| Product documentation | `README.md`, `mobile-app-scope.md`, `docs/**` | App Review remediation, metadata, architecture, execution plan, and evidence |
| Execution system of record | `ISA.md` | Stable criteria and verification ledger for the rollout |

The included untracked project files are `ISA.md`, five new test files, `app/api/payments/payments.ts`, `components/payments/PromptPayPayment.tsx`, three remediation/architecture/plan documents, and three booking/chat contract utilities. Phase 1 evidence files under this directory are also included.

## Explicit user-owned exclusions

| Paths | Reason | Handling |
| --- | --- | --- |
| `.agents/**` | Local skill and PostHog-wizard state is not application release input | Never staged by this baseline |
| `.playwright-mcp/**` | Local browser logs and page captures are ephemeral operator state | Never staged by this baseline |

These exclusions are preserved on disk and are not reverted, deleted, or rewritten.

## Known blockers carried forward

- This is a no-deploy recovery baseline, not a release candidate.
- Production migration lineage, staging resource identity, fail-closed delivery automation, live content, cancellation/restitution, and exact archive evidence remain gated by later tasks.
- No Omise, Cloudflare, EAS, or App Store secret is added by this inventory.

## Reproduction commands

```sh
git status --short
git diff --stat
git diff --name-status
git ls-files --others --exclude-standard
git diff --check
git rev-parse HEAD
git rev-list --left-right --count HEAD...@{upstream}
```
