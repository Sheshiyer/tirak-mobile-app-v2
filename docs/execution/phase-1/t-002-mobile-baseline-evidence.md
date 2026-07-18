# T-002 Mobile Baseline Evidence

Status: automated baseline and staged secret scan passed
Parent SHA: `d4b8aa4b004b72ade40f53b5fc85e3cbe77cb431`

## Toolchain

- Git `2.50.1 (Apple Git-155)`
- Node `v26.5.0`
- npm `11.17.0`

## Exact-tree proof

| Probe | Result |
| --- | --- |
| `npm test -- --runInBand` | PASS — 7/7 suites, 39/39 tests, 0 snapshots |
| `npx tsc --noEmit` | PASS — exit 0 |
| `git diff --check` | PASS — no whitespace errors |
| prohibited-copy scan across `app`, `components`, `constants`, `locales`, `mocks`, `public`, `app.json` | PASS — zero matches for `Evening Dinner Date`, direct-cash copy, `private.png`, private category key, escort, hookup, adult-services, or compensated-companionship phrases |
| staged secret-signature scan | PASS — no Omise key, bearer token, Sentry DSN, PostHog key, or Cloudflare token signature in 69 staged files |

Passing suites include booking contract, booking experience guard, booking state, payment API, chat API, WebSocket mapping, and existing dashboard regression coverage.

## Scope assertion

The evidence applies to the exact dirty tree classified by `t-001-mobile-baseline-inventory.md`. It proves a reproducible recovery baseline only. It does not prove staging connectivity, live Omise behavior, signed-device behavior, production content, or App Store acceptance.

## Commands

```sh
npm test -- --runInBand
npx tsc --noEmit
rg -n -i 'Evening Dinner Date|Paid in cash directly|private\.png|"private"\s*:' app components constants locales mocks public app.json
rg -n -i 'escort|hookup|adult services|compensated companionship' app components constants locales mocks public app.json
git diff --check
```
