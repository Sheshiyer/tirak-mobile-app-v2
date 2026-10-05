# Mobile App Issue Triage

## Review and native delivery — 2026-10-05

**All six reported causes have repairs in the candidate, but all six are not yet verified end to end on physical devices.** The signed Android APK is ready to install. The iOS 1.5.2 (18) build finished and EAS confirms its TestFlight submission **FINISHED** with no submission error. Apple processing, tester assignment and installation have not been independently observed.

| Reported issue | Repair and evidence | Status / remaining test |
| --- | --- | --- |
| 1. Availability settings loops back to calendar | Settings now opens the real grouped weekly settings screen. Weekly rules and dated overrides persist through the repaired backend; rendered-screen and persistence tests pass. | Implemented and tested. On device, change one slot, save, reopen and confirm it persists. |
| 2. Experiences cannot be removed | Owner create/edit/archive API and confirmation UI are implemented. Archiving removes an experience from active listings while retaining booking history. Authorization and history regression tests pass. | Implemented and tested. Create a clearly labeled test experience, edit it, archive it and confirm existing bookings remain. |
| 3. Guide 404 looks like an empty experience list | Owner management uses the authenticated owner path; public discovery stays restricted. Request failures propagate instead of being silently converted to an empty list. | Implemented and tested. Current anonymous review-guide request correctly returns 404. Authenticated owner/cross-account UI checks remain pending. |
| 4. Supplier analytics HTTP 400 | Static `/stats` route precedes UUID `/:id` routes. Owner aggregation and response contracts are repaired and tested. | Implemented and tested. Current unauthenticated call returns 401, confirming the guard rather than the old routing 400. Successful authenticated analytics still needs device/account proof. |
| 5. Verification/reset emails absent | Resend is deployed. The authorized connectivity email was provider-reported delivered and confirmed in the recipient inbox on September 28. Reset page currently returns 200; failure/expiry/single-use contracts are tested. | Transport verified. Actual verification-code and password-reset completion through an inbox remain pending. The chosen review accounts are already email-verified, so they cannot prove a fresh registration journey. |
| 6. iOS APNs entitlement error | Finished 1.5.2 (18) IPA and embedded App Store profile both contain production `aps-environment` and matching Tirak team/bundle identifiers. Token ownership/logout/race tests pass. | Signed artifact verified. Install from TestFlight, allow notifications and verify token registration plus real delivered push on the iPhone. |

## Installable builds

### Android — ready to test

- [Download native APK](https://expo.dev/artifacts/eas/sueSFtgPbDn-NBn37EMSk16uIiaqo-c_9glA3tC5RQQ.apk)
- Version **1.5.2**, build/versionCode **8**, package `com.tirak.pineapple`; Android 7.0/API24 or later; ARM64/ARMv7/x86/x86_64 native libraries.
- APK v2 signature and signed content digest verified; non-debuggable release app with bundled React Native JavaScript. Size: 102,019,526 bytes.
- SHA256: `38cb989ce5520374bb07a034e16ca2335a86f9634cfe0d81e3278c61f5825086`.
- [EAS build receipt](https://expo.dev/accounts/thoughtseedlabs-2/projects/tirak-companion-marketplace/builds/ea8145c5-3e54-44a3-b153-4a618c8dc429), source `ce312916`.
- Open the download on the Android phone and install. If Android asks, allow installation for the browser/file manager used to open this APK. Existing installation updates depend on its signing certificate matching this release certificate.

### iOS — TestFlight upload completed

- Version **1.5.2 (18)**; [finished iOS build](https://expo.dev/accounts/thoughtseedlabs-2/projects/tirak-companion-marketplace/builds/2bb8a2b2-a325-4414-975a-24a782e6add2), source `58e97df`.
- [Successful EAS TestFlight submission](https://expo.dev/accounts/thoughtseedlabs-2/projects/tirak-companion-marketplace/submissions/a7e69160-b580-43a9-a115-0eac7b8b0d9a), status freshly read as `FINISHED`, no error, existing App Store Connect app `6748445775`.
- Open TestFlight on the iPhone and select Tirak **1.5.2 (18)**. If it is absent, check the existing app in App Store Connect for Apple processing and tester/group assignment. EAS submission success does not prove those later states.
- Signed push entitlement/profile match already verified. Built with `iphoneos26.5` SDK.

## Suggested device pass

Use the existing App Store test accounts selected by the owner: Guide `test.companion.tirak@gmail.com`, Traveler `test.customer.tirak@gmail.com`. Use their existing credentials privately. The September 28 live baseline was two guide services, five bookings and six weekly availability rows; preserve those records.

1. Sign in as Guide and open Availability → Settings; save/reopen a slot, then restore the original value.
2. Create/edit/archive one clearly labeled test experience; confirm it disappears from active services and existing booking history remains.
3. Confirm owner profile/services load and analytics opens without routing 400. Sign in as Traveler to verify owner-only management is unavailable.
4. Request recovery for an owner-accessible test inbox, verify receipt and have the owner complete password entry. Confirm the reset link cannot be reused. Fresh email-verification acceptance needs an owner-approved unverified identity; none was created in this review.
5. On the iPhone, allow notifications; verify registration and an actual delivered notification. On Android, check notification behavior as part of the same device pass.

## Current verification and preservation

- Mobile candidate is clean at `db67032` (submission configuration follow-up); current TypeScript and **34 suites /379 tests pass**. Android `ce312916` and iOS `58e97df` contain the same functional Core repair; later changes concern iOS signing and submission metadata.
- Backend repair source is deployed on retained Worker `tirak-backend` / D1 `tirak-development`; version `ec46c7ab-b96a-4ba2-a907-53849c0f50dc` remains active at 100%. Current health/reset-page checks pass. Previous backend suite: **44 files /507 tests**; no new backend code changed in this review.
- Payments, demo mode and review-mode shortcuts are disabled in both QA build profiles. Review fixture public hiding and booking history safeguards remain enforced.
- No new build was necessary: the previously queued repair builds finished and are the verified native deliverables. No public App Store release was performed.
- Detailed receipt: [native delivery evidence](native-delivery-20261005.json).
