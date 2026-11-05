# Plan 01-02 Simulator Evidence

Status: pending human visual approval

## Epistemic scope

This is Tirak traveler-app source, local loopback-fixture, and iOS Simulator UI proof only. It is not Omise/provider proof, staging proof, webhook proof, a real payment, or end-to-end payment proof. Tirak Plus was not changed.

The fixture was bound only to `127.0.0.1:8787`, made no provider calls, returned a deliberately non-scannable image, and logged only request method, path, and body-key names. Screenshots contain no token, Authorization value, provider payload, secret, real QR, or real customer data.

## Verification receipts

- TypeScript: `npx tsc --noEmit` exited 0.
- Full Jest suite: 8 suites passed, 64 tests passed, 0 snapshots.
- Local fixture success: authorized `POST /api/payments/charges` returned HTTP 200 with the nine allowlisted `tirak-payments-v1` fields and pending state.
- Local fixture rejection: a body containing `amount` returned HTTP 400; a request without authorization returned HTTP 401.
- Fixture image: `GET /fixture/pending.png` returned HTTP 200, `image/png`, 1404 bytes.
- iOS build: `xcodebuild` for the existing Tirak workspace and iPhone 17 Pro iOS 27 destination, with `CODE_SIGNING_ALLOWED=NO` and the original Pod directory supplied read-only, ended with `** BUILD SUCCEEDED **`.
- Runtime UI proof: the app launched and rendered on the installed iOS 18.5 fallback simulator named `Tirak Phase 1 iPhone 16 Pro`.
- Accessibility correction: commit `b2ce3f5` caps decorative step/chip growth, lets shared buttons grow with text, and stacks checkout footer actions at accessibility font scales.
- Temporary evidence route and temporary XCUITest target were removed before final verification.

## Screenshot index

| Scenario | Evidence | Observation |
| --- | --- | --- |
| 1. Capability off | [01-capability-off-cash-only.png](./01-capability-off-cash-only.png) | Cash remains selected and actionable; PromptPay is absent between the cash card and safety card. |
| 2. Capability on, booking unconfirmed | [02-capability-on-unconfirmed.png](./02-capability-on-unconfirmed.png) | PromptPay is visible but disabled with the confirmed-booking eligibility explanation; cash continuation remains available. |
| 3. Confirmed before request | [03-confirmed-before-request.png](./03-confirmed-before-request.png) | PromptPay can be selected only after confirmed booking truth is stored; no pending or paid claim is shown before a request. |
| 4. Creating / duplicate blocked | [04-creating-duplicate-blocked.png](./04-creating-duplicate-blocked.png) | Payment methods are locked and both the QR action and footer show an in-flight state, preventing a duplicate request. |
| 5. Pending server truth | [05a-pending-status.png](./05a-pending-status.png), [05-pending-qr-server-fields.png](./05-pending-qr-server-fields.png) | The UI says `Payment pending`, uses server amount/currency, states that server/provider confirmation is required, and shows only the non-scannable fixture image, expiry, and shortened reference. It never says paid or complete. |
| 6. Step 7 truthful confirmation | [06-step7-truthful-confirmation.png](./06-step7-truthful-confirmation.png) | Step 7 distinguishes `Booking confirmed` from `PromptPay payment pending` and uses a pending clock rather than a paid-success icon. |
| 7. Accessibility Large | [07-large-dynamic-type.png](./07-large-dynamic-type.png) | At iOS Accessibility Large, pending status and amount reflow, decorative progress/chips remain bounded, footer actions stack, and control labels remain fully visible. The screen remains vertically scrollable for the enlarged body and QR. |

All PNG files are 1206 x 2622 simulator captures.

## iOS 27 runtime blocker

The user-provided crash report and the local iOS 27 launch attempts terminate on the main thread with `EXC_BREAKPOINT (SIGTRAP)` in `___UIApplicationEvaluateRuntimeIssueForNoSceneLifecycleAdoption_block_invoke`, pointing through `AppDelegate.swift`. The current app has no `UIApplicationSceneManifest`; iOS 27 requires UIScene lifecycle adoption. This is a pre-existing native compatibility blocker, not a PromptPay regression.

Adding only a plist scene manifest was not attempted because Expo reports that a plist-only workaround can replace the crash with a blank screen. The iOS 18.5 simulator was therefore used for the visual checkpoint while the iOS 27 incompatibility remains explicitly open.

## Approval gate

Do not create `01-02-SUMMARY.md`, commit this evidence, or mark Phase 1 complete until the human checkpoint approves these screenshots and the stated fallback/blocker.
