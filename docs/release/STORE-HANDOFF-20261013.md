# Tirak 1.5.4 — cash-only store handoff

Release candidate: `codex/store-release-20261013`, based on October 5 Core commit `d2469a6`. Use this worktree, not the older `tirak-mobile-app-v2` checkout. This document is a build and acceptance handoff, not a claim of public release.

## Production blocker — read before submitting

Owner approved backup, schema repair, Core deployment and suspension on October 13. The backup restored with integrity OK and zero foreign-key violations. All 28 additive schema statements succeeded; the guarded migration ledger now has 24 entries. Exactly two review accounts are suspended. All five bookings and every original booking field were verified unchanged against the backup. See [execution receipt](live-backend-execution-20261013.json). Core deployment remains pending: the isolated Worker-scope Cloudflare authorization link expired. The owner deferred authenticated chat verification and requested this handoff. Installed-device acceptance remains pending. contact@tirak.app is not registered in the live app.

## What changed

- Removed root CORE QA badge and dashboard Demo tag.
- Cash-only checkout: no new PromptPay QR/payment actions; existing financial locks remain for pending, uncertain, paid, or restitution states.
- Disabled runtime demo/review capabilities regardless of old environment flags; preview login refuses and persisted fixture credentials are invalidated.
- Disabled fake development booking fallback and local experience mutations. Real API failures remain failures.
- Removed synthetic guide availability; known fixture chat parties remain filtered.
- Preserved real Core guide application, idempotent retries, experience management, booking recovery and account-scoped cache cleanup.
- Updated marketing/native/runtime version to 1.5.4. Production builds use the live HTTPS backend and reject QA endpoint/demo/review/payment flags.
- Added `release-apk` using production environment/backend/channel; production Android uses AAB. Removed passwordless review build profile and OTA review channel option.
- Android compile/target SDK now 36. Store description and review notes now describe cash and real accounts.

## Evidence and release gates

| Check | Evidence / status |
|---|---|
| Regression | 41 suites, 438 tests passed; TypeScript passed |
| Bundle proof | Android and iOS production Hermes exports passed, under ignored `proof-exports/store-20261013` |
| Health | `/health` 200; `/api/public/health` 200 with database/cache/storage healthy |
| Chat auth boundary | `/api/chat/rooms` without token returns 401 |
| Public catalog | `/api/public/categories?limit=1` returns empty list; previously observed public suppliers also empty. This does not prove live DB has no fixtures. |
| Cloudflare access | Isolated profile `tirak` signed in successfully; read-only live D1 queries verified |
| Live data inventory | 34 users, 5 preserved bookings, 2 known review accounts suspended; schema reconciled through 026. |
| Authenticated chat | Deferred by owner for this handoff; not verified in production | 
| Visual verification | Interceptor installed, no extension connected; required screenshots pending |
| Installed devices | Pending fresh install, real-account flows and push delivery |
| Public release | Held until backend/device acceptance and store metadata completion |

Follow-up IDs: `FOLLOWUP-CF-AUTH`, `FOLLOWUP-DB-INVENTORY`, `FOLLOWUP-TWO-USER-CHAT`, `FOLLOWUP-VISUAL`, `FOLLOWUP-DEVICE`, `FOLLOWUP-NATIVE-ARTIFACT`, `FOLLOWUP-STORE-SUBMIT`.

## Verified native downloads

| File | Version/build | Download | SHA256 |
|---|---|---|---|
| IPA | 1.5.4 (21) | [Download](https://expo.dev/artifacts/eas/XzbpgG_SRY0ni_t9M8VH_DmPmXpWJEt-0SXukTmoDQE.ipa) | 68963537e5d5e3a029520892517515f5c2ae50d3466e6e9cce2fe00d6af539c5 |
| APK | 1.5.4 (13) | [Download](https://expo.dev/artifacts/eas/6vWnDL_AW6TQcummfJtr0rs9hV-D5BPru52_J5x4FYY.apk) | 3776ca88e7005b91dd0eab10fc46560d67e2b0c3434029b292395d0d44dfcbec |
| AAB | 1.5.4 (14) | [Download](https://expo.dev/artifacts/eas/BqGVaq_p2qOoZwpTP2p-BPzR8tBvCuMBBjuYJxkBNf0.aab) | 854bf5aeafbca2e5d9b849fd8b3392e379470b928eeefdbac51a732c788d6f32 |

Local files are under ignored artifacts/store-release-20261013. APK v2 signature and signed content digest passed; certificate matches previous Tirak build. APK/AAB target API36, have 40 compatible 64-bit native libraries; APK also passes 16KB ZIP alignment. AAB CMS signature, signed manifest and 1,808 entry digests passed. Actual APK/IPA bundles use production API, omit the QA API/badge marker, and contain the existing-charge warning. These are artifact checks, not installed-device proof.

## Native candidate receipts

- IPA 1.5.4 (21): [build 63e45b9a-1ac9-470c-814d-b1abb2eb56df](https://expo.dev/accounts/thoughtseedlabs-2/projects/tirak-companion-marketplace/builds/63e45b9a-1ac9-470c-814d-b1abb2eb56df), status at last check **FINISHED**.
- APK 1.5.4 (13): [build 84bd71b5-5ec2-49cd-bd20-b366c40e009c](https://expo.dev/accounts/thoughtseedlabs-2/projects/tirak-companion-marketplace/builds/84bd71b5-5ec2-49cd-bd20-b366c40e009c), status at last check **FINISHED**.
- AAB 1.5.4 (14): [build 6444a65d-32fe-43cd-a858-233754dbfcc4](https://expo.dev/accounts/thoughtseedlabs-2/projects/tirak-companion-marketplace/builds/6444a65d-32fe-43cd-a858-233754dbfcc4), status at last check **IN_QUEUE**.

IPA download: [Tirak 1.5.4 (21)](https://expo.dev/artifacts/eas/XzbpgG_SRY0ni_t9M8VH_DmPmXpWJEt-0SXukTmoDQE.ipa). Local copy: artifacts/store-release-20261013/Tirak-1.5.4-21.ipa. SHA256: 68963537e5d5e3a029520892517515f5c2ae50d3466e6e9cce2fe00d6af539c5.

Actual IPA inspection passed: codesign --verify --deep --strict; com.tirak.pineapple; version/build 1.5.4/21; iphoneos26.5 SDK; App Store distribution profile/team BS6SZR4929; matching production APNs; get-task-allow false; production API present; QA API/badge absent; existing-charge warning present in bundled Hermes code. See ipa-1.5.4-21-verified.json. Installation and push delivery are still pending.

Build status is refreshed in store-candidate-20261013.json. Earlier queued builds listed there are superseded and must not be submitted. Code was uploaded as a dirty release candidate from d2469a6; console Git commit metadata alone is not the entire source snapshot.

## Cloudflare sign-in and profile named tirak

From this release worktree:

```sh
bun scripts/wrangler-tirak.ts ../tirak-backend-release-readiness login
```

Open the fresh `dash.cloudflare.com/oauth2/auth` URL printed by Wrangler immediately and complete approval in the same computer/browser. The callback is `http://localhost:8976/oauth/callback`; URLs expire quickly. The script names local credential storage `tirak` under the user configuration directory; it does not rename the Cloudflare account.

Wrangler 4.93 has no native `--profile`. This wrapper isolates credentials using XDG configuration, removes inherited Cloudflare token variables, avoids backend dotenv credential discovery, and refuses legacy `~/.wrangler` storage if present because it overrides XDG. Do not use broad existing credentials as a shortcut.

Requested OAuth scopes: `account:read`, `user:read`, `d1:write`; Wrangler also adds `offline_access`. D1 OAuth offers no read-only scope. The wrapper restricts queries to single SELECTs, but the OAuth grant itself remains write-capable and is not restricted to one account/resource by the local name. For stricter enforcement, the owner can instead create a resource-restricted D1 read API token named `tirak` in [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens), bound to the Tirak account; do not paste it into chat or commit it.

Verify the login:

```sh
bun scripts/wrangler-tirak.ts ../tirak-backend-release-readiness whoami
```

Account pinned in backend config: `2c0c96c68f0ee73b6d980054557bca5b`.
Live Worker: `tirak-backend.tirak-court.workers.dev`.
Its default D1 binding is `tirak-development` / `60443346-c480-4975-962e-bd4daf4a37a8` despite the Worker reporting production. `--env production` selects a different database (`tirak-mobile-production`); do not switch by name alone.

Inventory the schema first (metadata only):

```sh
bun scripts/wrangler-tirak.ts ../tirak-backend-release-readiness d1 execute tirak-development --remote --command "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name" --json
```

Then inspect required table columns with SELECTs from SQLite metadata functions, confirm chat rooms/messages/tickets and Core application/evidence tables plus migrations 020/021. Review aggregate counts for known fixture IDs/emails from backend `publicCompanionIdentity.ts` and the seed script. Do not dump personal rows. Prepare an exact cleanup report separating fixtures from legitimate guide/booking history. Deleting live records is not part of the inspection step.

## Build prerequisites

- Expo account has Owner access to `thoughtseedlabs-2`; EAS project ID `ba0d6f3e-ed4c-4aaf-8cff-aa2fdb253cc5`.
- Bundle/application ID: `com.tirak.pineapple`; existing Apple app ID `6748445775`.
- Apple team `BS6SZR4929`, existing remote distribution certificate/provisioning profile; Android existing upload keystore must be reused.
- Bun 1.3.5 and EAS CLI; `bunx eas-cli login` if session expires. Do not create a new EAS project/app ID or signing key.
- Production backend URL is pinned in profile env and is public configuration. Secrets stay in EAS production environment and remote credential storage.
- Keep all demo, review and PromptPay flags false. Production gate refuses unsafe overrides.
- Full local Xcode is unavailable on this host (CommandLineTools selected); cloud EAS builds handle native compilation. Bundle export alone is not an IPA/APK.

## Preflight and repeatable build process

```sh
bun install --frozen-lockfile
bun run typecheck
bun run test:ci
git diff --check
```

Resolve any failure before treating a build as accepted. Record exact Git base, dirty diff or final commit, artifact hash, build ID and environment. Do not submit an older 1.5.3 Core QA binary as this release.

### IPA / TestFlight / App Store

```sh
bunx eas-cli build --platform ios --profile production --freeze-credentials --non-interactive
```

This produces the signed `.ipa`; download from the successful build's artifact link. Verify version 1.5.4, unique build number, bundle ID, provisioning team, distribution APNs entitlement and production API/config in actual output. Apple requires Xcode 26+ and iOS 26+ SDK for uploads since April 28, 2026; confirm the build log records an accepted SDK.

After acceptance, upload this specific build, not an ambiguous latest build:

```sh
bunx eas-cli submit --platform ios --profile production --id IOS_BUILD_ID
```

Submission uploads to App Store Connect/TestFlight; it does not publish the app. In [App Store Connect](https://appstoreconnect.apple.com/apps/6748445775), wait for processing, complete export compliance, assign internal testers, install and test. External testing may require beta review. Select the verified build for version 1.5.4, complete metadata and App Review Information, then submit for review and release only after owner sign-off.

An App Store IPA cannot be installed by simply opening it on an iPhone. Use TestFlight; ad-hoc distribution requires registered device provisioning and a different internal build.

### APK / Android installation

```sh
bunx eas-cli build --platform android --profile release-apk --freeze-credentials --non-interactive
```

Download `.apk` from the finished build. Verify package, versionCode, non-debuggable flag, SHA256, certificate continuity and SDK target 36. Install on an Android test device, permitting installation for the download source if needed; with Android tooling, `adb install -r FILE.apk`. Do not uninstall a real user's app merely to bypass a signing mismatch because that can delete local data.

Native `android/app/build.gradle` retains Expo's local debug signing placeholder; cloud EAS injects the remote release key. Do not ship a raw locally debug-signed Gradle release as production.

### AAB / Google Play

```sh
bunx eas-cli build --platform android --profile production --freeze-credentials --non-interactive
```

The output is `.aab`, intended for Play distribution. APK is for direct installation. New/update submissions require API 36 since August 31, 2026. Verify native 16 KB page-size compatibility and Play pre-launch reports for all included libraries on the finished artifact.

Upload the AAB to the existing [Play Console](https://play.google.com/console) app's internal testing track first. Configure Play App Signing using the existing app/upload key. First submission may require manual Play upload; subsequent EAS Submit requires an authorized Google service-account credential. No Play service-account credential was configured in this run.

After device acceptance, complete store listing, data safety, account-deletion URLs, app-access reviewer instructions, content rating, countries/pricing and policy checks. Promote the exact tested bundle through the required testing track and production review.

## Native device acceptance before submission

Use permissioned real traveler/guide accounts; old test/review fixture accounts are intentionally rejected.

1. Fresh install, startup/onboarding, English and Thai, large text, sign-in/out and cross-account isolation.
2. Registration, real verification inbox delivery, code confirmation, recovery link completion/expiry/reuse, account deletion.
3. Browse real published guides; empty catalog is truthful but insufficient to review a marketplace journey. Check profiles, favorites, services and real availability.
4. Traveler requests a cash booking with correct quote/date/time; guide sees and confirms the same persisted booking. Retry after network interruption must not create duplicates. Confirmation must never say payment received.
5. Both parties open that confirmed/in-progress booking chat. Send unique messages each way, verify live socket receipt, reload and verify server persistence. Offline failure retains draft; reconnect causes no duplicate. Third account cannot read/send; logout invalidates socket and clears room state.
6. Guide weekly availability/settings save/reopen; owner experience create/edit/archive without destroying historical bookings; analytics real success and truthful failure.
7. Allow native push, confirm backend device registration and an actually delivered notification, then logout and verify token ownership cleanup.
8. Cold deep links, background/foreground, offline recovery, Android back navigation and iOS scene launch.

## Store copy and review materials

Use `docs/app-store-metadata.md` updated for cash-only. Privately supply real reviewer credentials in each console, never in Git. Remove previous screenshots with QA badges, fake QR or passwordless demo access. Capture current iPhone/Android screenshots after Interceptor/native device acceptance. Verify privacy/support/legal URLs are public and correct; reconcile Apple App Privacy and Google Data Safety with chat, location, images, notifications, Sentry and opt-in analytics. Review age ratings against actual user-generated chat/content rather than blindly copying old answers.

## Additional verification

Latest local Core source passed 113 focused tests. Full verification found a hard-coded October 5 “today” fixture in the admin dashboard test; an isolated test-only clock correction now passes all 722 tests across 57 files plus TypeScript and the default-production Wrangler dry-run bundle. Application source remains ea58fcb. This is source regression evidence, not evidence that the live default Worker runs that code/schema. Privacy, terms and support URLs returned HTTP200 after redirect to www.tirak.app; visual/content verification remains pending.

## Independent review

Review caught and corrected a cash-only migration edge case: existing unresolved electronic charges now show a do-not-pay-again warning and no cash instructions. Four additional regressions cover creating/pending/indeterminate/network-error states. The read-only reviewer confirmed resolution. External Advisor and Cato runtimes were unavailable; no cross-vendor audit is claimed.

## Official references checked October 13, 2026

- [Expo build for stores](https://docs.expo.dev/deploy/build-project/)
- [Expo submit iOS](https://docs.expo.dev/submit/ios/)
- [Apple upload requirements](https://developer.apple.com/news/upcoming-requirements/?id=02032026a)
- [Google Play API requirements](https://support.google.com/googleplay/android-developer/answer/11926878?hl=en-sg)
