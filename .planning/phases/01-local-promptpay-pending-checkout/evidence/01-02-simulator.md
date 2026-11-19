# Phase 01 iOS 27 visual checkpoint

Status: all seven required visual scenarios captured and visually inspected; human approval remains required.

## Provenance and destination

- Source: `b505fe750f2b9369234d369a74555f0522a51c6b` in `/Volumes/madara/2026/Projects/thoughtseed/tirak/.worktrees/tirak-mobile-phase1-clean`.
- Native app: genuine `Debug-iphonesimulator` build, bundle identifier `com.tirak.pineapple`, build `1`, reused from `/private/tmp/tirak-ios27-integration/Build/Products/Debug-iphonesimulator/Tirak.app`.
- Xcode: `27.0` (`27A5228h`) from `/Applications/Xcode-beta.app/Contents/Developer`.
- Simulator: iPhone 17 Pro Max, iOS 27.0, UUID `0D876AD0-B481-42E3-87E8-DBC779B1469B`.
- Destination deviation: the requested exact iPhone 17 Pro simulator was not installed; the installed iPhone 17 Pro Max was used explicitly.
- CocoaPods provenance: physical `Pods` and generated `build` copied from `/private/tmp/tirak-ios-final-env-retired.hIgcvl`; its `Pods/Manifest.lock` byte-matched this worktree's `ios/Podfile.lock`. No dependency root from another worktree was used.
- Metro module dependency: only `node_modules` was temporarily symlinked from `/Volumes/madara/2026/Projects/thoughtseed/tirak/tirak-mobile-app-v2/node_modules`.

## Runtime configuration

The installed Debug app was opened through Expo Dev Launcher's documented URL:

`tirak://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081`

Metro ran from the exact clean worktree in development-client mode with a cleared cache. The capability-on session used:

`EXPO_PUBLIC_API_URL=http://127.0.0.1:8787 EXPO_PUBLIC_PROMPTPAY_ENABLED=true EXPO_PUBLIC_EVIDENCE_HARNESS=true npx expo start --dev-client --localhost --clear`

Metro reported a successful iOS bundle of 4,339 modules. Capability-off was not simulated in store state: Metro was stopped, its cache cleared, and restarted with exact `EXPO_PUBLIC_PROMPTPAY_ENABLED=false`; the documented development-client URL was then reopened before capture. No embedded bundle or Metro-less file URL was used for these screenshots.

## Scenario verdicts

| Scenario | Verdict | Observed truth |
|---|---|---|
| 01 capability off | PASS | Cash card and Continue action are complete; PromptPay is absent. |
| 02 capability on, unconfirmed | PASS | Cash remains complete and selected; PromptPay is visible, disabled, and says it becomes available after booking confirmation. |
| 03 confirmed before request | PASS | PromptPay is selected; `Create PromptPay QR` is visible; there is no pending, paid, or completed-payment claim. |
| 04 creating | PASS | Cash and PromptPay both show the method-switch lock reason; creating action is disabled/loading; Back and Continue are visibly disabled/loading in the same capture. |
| 05 pending | PASS | The paired captures show cash fully disabled, `Payment pending`, server amount/currency `1,800 THB`, non-scannable fixture, expiry, reference, and enabled continuation. No paid/completed claim appears. |
| 06 step 7 | PASS | `Booking confirmed` is separate from `PromptPay payment pending`; the icon is a pending clock, not a payment-success checkmark. |
| 07 Accessibility Large | PASS | Accessibility Large was enabled. The top, status, and footer captures together show the complete state remains scroll-reachable; status/reference/safety copy and both footer actions are visible without footer occlusion. The footer reflows vertically at this size. |
| 08 Thai | PASS (optional) | Deterministic in-app language switching rendered Thai payment methods, lock copy, pending heading, amount, and explanatory copy. |

## Screenshots

All PNGs are fresh iOS 27 captures at 1320 × 2868 pixels.

- [01 capability off — cash only](/Volumes/madara/2026/Projects/thoughtseed/tirak/.worktrees/tirak-mobile-phase1-clean/.planning/phases/01-local-promptpay-pending-checkout/evidence/01-capability-off-cash-only.png) — SHA-256 `6cbf49ea34c41e4b237b0438e789aed31311864b6e9ff60b3a32fca63153551e`
- [02 capability on — unconfirmed](/Volumes/madara/2026/Projects/thoughtseed/tirak/.worktrees/tirak-mobile-phase1-clean/.planning/phases/01-local-promptpay-pending-checkout/evidence/02-capability-on-unconfirmed.png) — SHA-256 `a9249815604b5e243aad7f1dbb94d8c30d1d61da200fa3f9e356f0610c515516`
- [03 confirmed before request](/Volumes/madara/2026/Projects/thoughtseed/tirak/.worktrees/tirak-mobile-phase1-clean/.planning/phases/01-local-promptpay-pending-checkout/evidence/03-confirmed-before-request.png) — SHA-256 `82f67ccfb942ddf88dcc920c463fcc23a1c88d9d24abdacd4e6b7e2951b9e1fe`
- [04 creating — duplicate blocked](/Volumes/madara/2026/Projects/thoughtseed/tirak/.worktrees/tirak-mobile-phase1-clean/.planning/phases/01-local-promptpay-pending-checkout/evidence/04-creating-duplicate-blocked.png) — SHA-256 `d8bf05981ea3c53e2b8739ca8a71ba62c19d519803225ed6cb88584edc3bee2b`
- [05 pending — QR and server fields](/Volumes/madara/2026/Projects/thoughtseed/tirak/.worktrees/tirak-mobile-phase1-clean/.planning/phases/01-local-promptpay-pending-checkout/evidence/05-pending-qr-server-fields.png) — SHA-256 `d6ce4ab1b1054c7e69b42f9e069db7c026083e40735e37e175365231c8b98070`
- [05a pending — cash and status](/Volumes/madara/2026/Projects/thoughtseed/tirak/.worktrees/tirak-mobile-phase1-clean/.planning/phases/01-local-promptpay-pending-checkout/evidence/05a-pending-status.png) — SHA-256 `883b19806a4e5d82e49f9df2363bf952fcb463a7cb102cf9c2bcb5be41db21f0`
- [06 truthful booking confirmation](/Volumes/madara/2026/Projects/thoughtseed/tirak/.worktrees/tirak-mobile-phase1-clean/.planning/phases/01-local-promptpay-pending-checkout/evidence/06-step7-truthful-confirmation.png) — SHA-256 `3776943a54838524d2f4e1385377196274e8a098b364a28f001b03012b31f063`
- [07 Accessibility Large — top](/Volumes/madara/2026/Projects/thoughtseed/tirak/.worktrees/tirak-mobile-phase1-clean/.planning/phases/01-local-promptpay-pending-checkout/evidence/07-large-dynamic-type.png) — SHA-256 `bf2f68e2fdc70a425e829d433d3661544ef0bde66bc5a8dd1b321003c22853b6`
- [07a Accessibility Large — pending status](/Volumes/madara/2026/Projects/thoughtseed/tirak/.worktrees/tirak-mobile-phase1-clean/.planning/phases/01-local-promptpay-pending-checkout/evidence/07a-large-dynamic-type-scrolled-status.png) — SHA-256 `17a36afd14faf77aa4fa96c5294bf2105f0865601f06eb561e409139b50616aa`
- [07b Accessibility Large — footer](/Volumes/madara/2026/Projects/thoughtseed/tirak/.worktrees/tirak-mobile-phase1-clean/.planning/phases/01-local-promptpay-pending-checkout/evidence/07b-large-dynamic-type-scrolled-footer.png) — SHA-256 `2c604f14584a2c21b63a630be2f74d644939d965aa9c249e641b20dbf4792ba6`
- [08 Thai pending](/Volumes/madara/2026/Projects/thoughtseed/tirak/.worktrees/tirak-mobile-phase1-clean/.planning/phases/01-local-promptpay-pending-checkout/evidence/08-thai-pending.png) — SHA-256 `841f8c41c077c6e2963c5b2cb08740cdbb26e73ee08ce3a4d24051502256aed4`

## Mock and network receipt

- Only `scripts/promptpay-contract-mock.mjs` listened on `127.0.0.1:8787`. Its own provider-environment guard passed, so no `OMISE_*`, `OPN_*`, `STRIPE_*`, or `PAYMENT_PROVIDER_*` variable was present.
- The loopback contract receipt was `HTTP/1.1 200 OK`, `Cache-Control: no-store`, with request log `{"method":"POST","path":"/api/payments/charges","bodyKeys":["bookingId","method"]}`.
- Parsed response receipt: `success=true`, `contractVersion=tirak-payments-v1`, `chargeId=chrg_local_fixture_0001`, `paymentStatus=pending`, `attemptStatus=pending`, `amountSatang=180000`, `displayTotalThb=1800`, `currency=THB`, QR host `127.0.0.1:8787`.
- The fixture image is generated by the local mock and intentionally non-scannable. No provider traffic, secret, or real charge was used.

## Explicit limits

- The visual harness deterministically seeded the real Zustand booking/payment stores and rendered the real Phase 01 components. It was temporary and is not part of the evidence artifact.
- Scenario 05 attempted the real store/API path after writing the local fixture token, but no app-process POST receipt was observed. The UI capture therefore proves rendering and state truth, not an end-to-end in-app HTTP request. The independent loopback contract receipt above proves only the mock contract.
- Initial scroll positions were applied by a temporary optional component prop because Maestro could not start on this host without a Java runtime. This proves each state is renderable and reachable; it does not prove a human swipe gesture.
- VoiceOver traversal was not exercised and remains human-required. No VoiceOver claim is made.
- Simulator screenshots prove the displayed local Debug runtime only. They do not prove App Store packaging, provider integration, real payment, deployment, settlement, or human acceptance.
- The simulator content-size category was restored to `large` after Accessibility Large capture.
