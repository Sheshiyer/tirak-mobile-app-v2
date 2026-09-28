# Tirak Core mobile repair — local receipt

Date: 2026-09-28. Base: `6aedf64eb34a75bb7a9af9f849c968337c31b1f3`. Scope: Tirak Core mobile only; connected backend additions must ship before this client. No push, deployment, OTA publication, provider activation, real email, or push test was performed.

## Changed behavior

- Owner experiences use `/api/companions/:id/experiences` and never fall back to public profile lookup or ordinary-account fake success. Archive requires explicit confirmation and invalidates owner/public/analytics caches. Inactive unarchived entries remain editable; archived entries follow the backend's exclusion rule. Earlier local drafts remain recoverable and unpublished until the owner deliberately submits them. Explicit review previews persist removal without reseeding and validate storage readback.
- Grouped weekly availability settings and the legacy settings redirect now load/save the server contract for Asia/Bangkok, with supported weekdays/hours only. Date exception picker serializes selected clock values without UTC shifts. Errors retain edits and never report saved.
- Service selection preserves fractional hours so 90-minute and 100-minute experiences reach the request as exactly 90 and 100 minutes. Availability requires contiguous coverage, excludes reserved gaps, and blocks continuing with a stale unavailable selection. Client duration is 30–1439 whole minutes within one day, currency is fixed THB, and keyword count is capped at 20.
- Statistics/owner profile/experience/settings caches are identity scoped. Unavailable analytics remain null and display unavailable; cash figures are not presented as verified earnings. Booking/service changes invalidate affected statistics and availability.
- Forgot-password UX describes a neutral request outcome, retains current `{identifier}` and `{token,newPassword}` API fields, and accepts only a single nonempty reset token parameter. English/Thai strings distinguish request receipt from inbox delivery.
- Native iOS entitlements declare `aps-environment` via `APS_ENVIRONMENT`, development in Debug and production in Release. Token registration checks HTTP/application success. Cleanup records are durably written before server registration; storage rejection makes no server write. Registration/removal are serialized and generation checked across logout/account changes, with retained cleanup receipts for rotated tokens. Logout attempts authenticated removal before clearing credentials.

## Verification

- `bun install --frozen-lockfile`: successful, worktree-local dependencies.
- `bun run typecheck`: passed.
- `bun run test:ci --silent`: **34 suites, 378 tests passed**, including API failures, owner isolation, preview persistence, archive confirmation, settings save/retry, 90-minute request continuity, blocked-slot gaps, nullable metrics, reset privacy/fields, push ownership sequencing/storage failure, existing cash/review/payment guards.
- `EXPO_PUBLIC_DEMO_MODE=false EXPO_PUBLIC_REVIEW_MODE=false EXPO_PUBLIC_PROMPTPAY_ENABLED=false bunx expo export --platform ios --output-dir dist/repair-ios`: passed; final Hermes bundle `entry-00a359ab77c9e0fb9372bf262b9e858f.hbc` (9.87 MB). Initial attempt with an absolute `/tmp` output directory was rejected by Expo; corrected to the required project subdirectory.
- `xcodebuild -project ios/Tirak.xcodeproj -scheme Tirak -showBuildSettings -configuration Debug` and Release: both exited 0. Readback shows `CODE_SIGN_ENTITLEMENTS=Tirak/Tirak.entitlements`, `PRODUCT_BUNDLE_IDENTIFIER=com.tirak.pineapple`, and development/production APS values respectively.
- `plutil -lint ios/Tirak/Tirak.entitlements`: passed.
- `git diff --check`: passed.

## Rail receipt and limits

`noesis-execute` returned exit 0 with only duplicated scan narration and no edits; it was rejected as unusable. The allowlisted `antigravity-claude-sonnet-5` attempt in its own Claude worktree timed out after 180 seconds without a result or edits. No resolved provider/model output is claimed. Implementation used the documented in-session fallback. The generated external worktree was preserved.

A JavaScript export and build-settings readback do not prove a newly signed binary or provisioning entitlement. New signed iOS build, provider credentials/capability verification and physical foreground/background/terminated push/tap checks remain required. Offline logout may fail to remove a remote token; this is explicitly unconfirmed, its receipt is retained, and authenticated registration on a new account transfers token ownership server-side. Real inbox delivery/reset completion and connected admin/backend acceptance remain separate server/operator/device receipts.
