# Preview App Review - 2026-05-19

## Product-Ready App Review Plan - 2026-05-24

Goal: review Tirak as a real user product, not only as an MVP scaffold. Every visible flow should either be wired to the real product model, backed by a backend-compatible demo path, or intentionally removed/downgraded until the feature exists.

### Product Readiness Standard
- [ ] Confirm every visible button, icon, chip, menu item, card action, and CTA in logged-out, traveler, and companion flows is wired to a real action or an honest disabled/empty state.
- [ ] Confirm no screen presents hardcoded mock data as live product data unless it is scoped to the explicit Apple review/demo accounts and follows the same backend contract.
- [ ] Confirm every fallback path emulates production concepts: same ids, same status transitions, same profile/image source, same booking/chat/notification ownership model.
- [ ] Confirm real-user data is never overwritten by demo/test defaults, placeholder profile photos, stale auth cache, or local review fixtures.
- [ ] Confirm user-facing errors are product-safe and never expose Axios, raw JSON, Worker, D1, migration, or token details.

### Traveler Journey Review
- [ ] Splash/onboarding and role selection: clear value proposition, no phone-verification blockers for the current release path, no stale logged-in state on clean install.
- [ ] Registration/login/profile setup: all fields map to backend payloads, persist after refetch/login, and handle validation errors cleanly.
- [ ] Discovery/search: filters, sort, category chips, favorites, search states, and guide cards are functional and visually consistent.
- [ ] Guide detail: profile image, bio, languages, services, pricing copy, availability, chat entry, reporting, and empty states use one authoritative guide model.
- [ ] Booking flow: service selection, date/time, meeting point, special requests, summary, confirmation, cash guide-rate copy, countdown, Add to Calendar, and booking detail all share one booking object.
- [ ] Traveler chat: text chat only until media/voice/call features are real, last message previews are live/demo-compatible, and send failures degrade cleanly.
- [ ] Traveler account/settings: profile edit, photo persistence, notifications, referrals, privacy/help/support links, logout, and delete account are wired or intentionally constrained.

### Companion Journey Review
- [ ] Companion registration/profile setup: first name, last name, display name, bio, languages, profile photos, cover photos, and verification state persist through backend-compatible payloads.
- [ ] Dashboard: bookings, rating, weekly earnings, profile prompts, and alerts derive from API/domain data, not fixed placeholders.
- [ ] Availability/services: create/edit/delete flows use backend-compatible data and return to the correct screen after success.
- [ ] Booking requests/list/detail: pending bookings can be approved/rejected from every inspection surface, status updates propagate to traveler views, and payment/cash labels are not confused with approval status.
- [ ] Companion chat: traveler conversations route through the same chat model as traveler chat and show friendly names plus last-message previews.
- [ ] Analytics/portfolio/settings: metrics, profile improvement prompts, notification settings, referrals, support, logout, and account deletion are either backed by product data or clearly scoped.

### Backend And Demo Contract Review
- [ ] Inventory every endpoint used by registration, login, profiles, companion/customer listing, favorites, availability, services, bookings, chat, notifications, referrals, password reset, and account deletion.
- [ ] Smoke-test live endpoints with real demo accounts and one throwaway traveler/companion account; delete throwaway accounts immediately after persistence checks.
- [ ] Verify demo traveler, demo companion, and Apple review accounts remain present and untouched.
- [ ] Compare mobile request payloads against backend validation for required fields, route order, ids, status enums, and query params.
- [ ] Record any remaining backend blockers as explicit issues instead of masking them with fake UI.

### Release QA Evidence
- [ ] Run JSON validation, TypeScript, diff whitespace checks, and available unit/smoke tests.
- [ ] Run clean Expo/Metro server and local iOS simulator build from a cleared app state.
- [ ] Capture traveler and companion screenshots/videos only after raw Axios banners and broken states are cleared.
- [ ] Document pass/fail evidence, exact commands, remaining blockers, and whether the app is ready for TestFlight review.

### Product-Ready App Review Pass 1
- Redirected legacy `/supplier/...` mock-heavy analytics, chat, request, portfolio, payment, subscription, service setup, and availability routes into the canonical release routes.
- Kept active companion profile edit and signup setup routes intact because they are still part of the current guide setup journey.
- Removed simulated supplier request action delays so these shared components now delegate immediately to their real parent handlers.
- Removed noisy login/home debug logs and changed dev logger errors to warnings so expected API problems do not create raw red preview banners.
- Verified backend registration and booking contracts against the local Worker source: registration accepts `display_name`, `name`, first/last name aliases, and `userType`; bookings accept date plus `HH:MM` start/end time.
- Verification passed: `rg` no longer finds the old mock-only analytics/chat/template/simulated-action markers in active `app`, `components`, `stores`, or `utils` files.
- Verification passed: `npx tsc --noEmit --pretty false`.
- Verification passed: `git diff --check`.
- Still open: full simulator traveler and companion flow needs to be exercised against the running backend before marking the product-ready checklist complete.

## Logged-In Flow Copy Refresh - 2026-05-24
- [x] Audit logged-in traveler and companion screens for generic, mismatched, or overly technical copy.
- [x] Rewrite English logged-in copy across home, search, profile/detail, bookings, chat, settings, notifications, availability, services, analytics, portfolio, and referrals.
- [x] Keep Thai localization untouched for the separate Thai pass.
- [x] Run JSON validation and TypeScript verification.
- [x] Start the local server for review.

### Logged-In Flow Copy Refresh Review
- Rewrote traveler logged-in copy across discovery, search, guide detail, booking, confirmation, bookings, chat, notifications, profile, settings, and referrals.
- Rewrote guide logged-in copy across dashboard, request handling, availability, services, analytics, portfolio, settings, profile edit, and guide onboarding surfaces.
- Kept this pass English-only; Thai localization is intentionally untouched for the separate Thai review.
- Verification passed: `node -e "JSON.parse(require('fs').readFileSync('locales/en.json','utf8'))"`.
- Verification passed: `npx tsc --noEmit --pretty false`.
- Verification passed: `git diff --check`.
- Local server started with `npx expo start --clear --port 8082`; review URL is `http://localhost:8082`.

## Discovery Safety Login Copy Refresh - 2026-05-24
- [x] Audit current discovery, safety, and login copy against the Tirak brand voice.
- [x] Rewrite English strings and hardcoded safety/login/discovery copy without changing app flows.
- [x] Run JSON validation and TypeScript verification.
- [x] Document review notes.

### Discovery Safety Login Copy Refresh Review
- Rewrote onboarding/role-selection copy around verified local guides, specific Thailand experiences, and confidence-building trust cues.
- Updated login and password-reset copy so the screen feels like returning to Tirak trip planning instead of a generic auth form.
- Tightened discovery/search placeholders, suggestions, and empty states around concrete interests like food walks, temples, markets, and local days.
- Reframed safety and verification copy as Trust & Safety, with clearer in-app chat, public-meeting, and Tirak review language.
- Verification passed: `node -e "JSON.parse(require('fs').readFileSync('locales/en.json','utf8'))"`.
- Verification passed: `npx tsc --noEmit --pretty false`.
- Verification passed: `git diff --check`.

## TestFlight Auth Startup Regression - 2026-05-22
- [x] Trace persisted auth, secure storage, demo prefill, and review-account boot paths that can make TestFlight open logged in.
- [x] Confirm the observed startup can be normal persisted auth state from an existing install, not a production hard-coded login path.
- [x] Leave auth persistence unchanged because the user confirmed old stored auth is acceptable.

## Public Repo Handoff - 2026-05-22
- [x] Keep the Pineapple Innovation Labs remote as legacy fetch-only backup and do not touch the old repo.
- [x] Refresh the marketing README with a visual-forward hero using tracked Tirak assets/screenshots.
- [x] Point release/package metadata at the new public GitHub repository `sheshiyer/tirak-mobile-app-v2`.
- [x] Validate README asset links, JSON metadata, and TypeScript before publishing.
- [x] Commit the repo-handoff changes locally.
- [x] Create/connect the public GitHub repo and push the current release branch as `main`.

### Public Repo Handoff Review
- Preserved `pineappleinnovationlabs/rork-tirak--companion-marketplace-in-thailand.git` as local remote `legacy` with push URL disabled.
- Created public GitHub repository `Sheshiyer/tirak-mobile-app-v2` and wired it as `origin`.
- Rebuilt the README as a visual marketing page with the generated Tirak splash artwork and preview-flow screenshots.
- Updated package metadata to point at the new public repository.
- Verification passed: README local image references resolve, JSON metadata parses, and `npx tsc --noEmit --pretty false` succeeds.

## Messages List Preview Polish - 2026-05-21
- [x] Display a friendly first-name label in message list cards instead of raw usernames/handles.
- [x] Show a one-line truncated last-message preview on each conversation card.
- [x] Keep demo/review room last-message metadata in sync after sending a message.
- [x] Verify TypeScript and record the QA result.

### Messages List Preview Polish Review
- Message list participants now render a friendly first-name label from backend names, email-style names, or dotted handles such as `test.customer.tirak`.
- Conversation cards now show a one-line last-message preview with whitespace normalized and a short ellipsis cap.
- Last messages sent by the current user can render with `You: ...` when the room list provides sender metadata, and demo/review sends now update the room's `lastMessage` and `lastActivity`.
- Verification passed: `npx tsc --noEmit --pretty false`.

## Notification and Booking Approval QA Fix - 2026-05-21
- [x] Stop raw notification mark-read failures from surfacing as Axios banners.
- [x] Make booking notification list/badge reflect new booking requests in backend-first demo and live-compatible flows.
- [x] Remove duplicate confirmed/verified check marks from companion booking cards.
- [x] Replace ambiguous payment-status copy with guide-rate/cash-context copy.
- [x] Add approve/reject actions to companion booking list and booking detail screens, not just dashboard cards.
- [x] Verify TypeScript and document remaining release QA notes.

### Notification and Booking Approval QA Fix Review
- Notification read and read-all now fall back to persisted local read state for expected unavailable notification endpoints instead of throwing raw Axios errors into the UI.
- Notification queries now merge local booking-request notifications from explicit stored demo/review bookings, so the bell badge/list can show new booking requests even when preview bookings are local.
- Booking mutations invalidate notifications as well as bookings/details, keeping the notification badge fresh after create/approve/reject.
- Companion booking list cards no longer assume the traveler/customer is verified, which removes the duplicate green check beside confirmed status badges.
- Companion booking list and booking detail screens now show approve/reject controls for pending requests through the shared booking status mutation.
- Booking list/detail payment copy now separates booking approval status from cash/guide-rate payment context.
- Supplier request quick actions and communication tools no longer expose phone/call actions; they stay on chat/message flows.
- Verification passed: `npx tsc --noEmit --pretty false`.
- Verification passed: `npx jest __tests__/CompanionDashboard.test.tsx --runInBand`.
- Verification partial: `npm test -- --runInBand` passes `__tests__/CompanionDashboard.test.tsx` but still fails on the existing `__tests__/chat-api.test.ts` React Native transform issue (`react-native/index.js` Flow import parsed by Jest).

## Live Chat Backend 500 Fix - 2026-05-21
- [x] Reproduce the live `/api/chat/rooms/:roomId/messages` 500 with a backend-backed account and capture the response.
- [x] Trace the deployed Worker chat route, Durable Object call, and D1 `chat_messages`/`chat_rooms` schema.
- [x] Patch the backend message contract so real rooms accept text messages without relying on mobile demo fallbacks.
- [x] Verify with a live send/read smoke test against the deployed Worker.
- [x] Run available backend validation and update lessons with the backend/chat contract pattern.

### Live Chat Backend 500 Fix Review
- Reproduced live with the Apple review accounts: login passed, room `94a9a03f-6428-4976-b5f3-e65bac2d1fe9` loaded, and message send returned `500 Message failed`.
- Worker tail showed the root cause: the Durable Object insert failed because live D1 `chat_messages` was missing `reply_to_id`; `delivered_at` and `read_at` were also absent even though migration `004_mobile_app_features.sql` had been marked as applied.
- Applied the missing runtime columns and indexes directly to live D1: `delivered_at`, `read_at`, `reply_to_id`, plus harmless `updated_at` for compatibility with the previously deployed status-update code.
- Hardened local backend source so `ChatRoom.updateMessageStatus` no longer requires an `updated_at` column on future databases.
- Verification passed: live `POST /api/chat/rooms/94a9a03f-6428-4976-b5f3-e65bac2d1fe9/messages` returned HTTP 201 and `GET /api/chat/rooms/94a9a03f-6428-4976-b5f3-e65bac2d1fe9` returned the new persisted text message.
- Verification passed: live D1 `PRAGMA table_info(chat_messages)` now shows the message status/reply columns, and the room has one persisted smoke-test message.
- Backend global TypeScript still fails on older unrelated strictness issues in analytics, moderation, chat typing, customers, payments, public, search, suppliers, and uploads. The chat persistence fix was verified live despite the repo not being globally type-clean.

## Release Contact Links - 2026-05-21
- [x] Set the traveler settings Privacy Policy action to `https://tirak.app/privacy`.
- [x] Set Help Center actions to email `help@tirak.app`.
- [x] Set Contact Support actions and support copy to email `support@tirak.app`.
- [x] Apply the same link/contact behavior to companion settings surfaces.
- [x] Add the missing traveler Contact Support row.
- [x] Run TypeScript after the contact-link update.

## Booking Push Notification Integration - 2026-05-21
- [x] Trace current mobile notification API, push-token registration, and booking flows.
- [x] Trace backend notification endpoints for booking-created and three-hour reminders.
- [x] Wire mobile push-token registration if missing.
- [x] Ensure traveler and companion get local/dev-safe booking confirmation and three-hour reminder notifications.
- [x] Document any backend endpoint or scheduled-worker gap needed for production push delivery.
- [ ] Run TypeScript and focused notification tests where available.

### Booking Push Notification Integration Review
- Mobile now registers Expo push tokens for authenticated traveler and companion sessions and schedules local booking-created and three-hour reminder notifications for preview/dev flows.
- Backend now has `/api/notifications/push-token`, queues booking request/submitted/status/reminder jobs, and sends push jobs through Expo Push.
- Verification passed: mobile `npx tsc --noEmit`.
- Verification passed: `pod install` after adding `expo-notifications`.
- Native simulator build/run remains unresolved: XcodeBuildMCP timed out after 120 seconds, so the native run was not counted as passed.
- Production push delivery still requires deploying the backend notification worker and validating remote push on a physical iOS device or EAS-capable build; the simulator can validate local scheduled notifications only.

## Email Notifications, Password Reset, and Referrals - 2026-05-21
- [x] Confirm the existing password reset UI/API path and current email provider state.
- [x] Add real transactional email sending for password reset and notification jobs.
- [x] Persist notification channel preferences for both traveler and companion settings.
- [x] Add referral program backend storage for referral codes, Tirak coin balances, and referral awards.
- [x] Add mobile referral API/settings entry points without removing Apple review demo accounts.
- [x] Run TypeScript/backend focused verification and document provider setup still required.

### Email Notifications, Password Reset, and Referrals Review
- Existing state: password reset screens and backend reset-token endpoints existed, but the backend only logged the reset token and did not send a transactional email.
- Added Cloudflare Email Service support through a Worker `EMAIL` binding, with configurable fallback provider support for MailChannels if we choose it later.
- Password reset now sends a branded reset email with a Tirak deep link and support reply-to address.
- Booking notifications now queue push, email, and in-app channels for booking request, booking submitted, booking status, and three-hour reminder events.
- Traveler and companion notification settings now use `/api/notifications/preferences` instead of local-only toggles.
- Added referral storage for referral codes, Tirak Coin balances, referral events, and coin transactions.
- Added `/api/referrals/me` and `/api/referrals/apply`, plus registration-time referral award support through `referralCode`.
- Added a shared mobile Referral Program screen and settings entry points for both traveler and companion flows.
- Verification passed: mobile `npx tsc --noEmit`.
- Verification passed: backend targeted typecheck for touched auth, notifications, referrals, booking, email, validation, and index files.
- Live email delivery still requires enabling Cloudflare Email Service for `tirak.app`, verifying/allowing `noreply@tirak.app`, and deploying the backend Worker with the `EMAIL` binding.

## Cloudflare Email/Referral Deployment - 2026-05-21
- [x] Confirm Wrangler authentication and account capabilities.
- [x] Bind the live default Worker to real D1/KV resources instead of placeholder IDs.
- [x] Restrict the Cloudflare Email Service Worker binding to `noreply@tirak.app`.
- [x] Apply `006_referrals_tirak_coins.sql` to the live D1 database used by the mobile backend.
- [x] Create the required Worker Queues and dead-letter queues.
- [x] Wire the Worker module queue handler so queue consumers can attach.
- [x] Deploy the live `tirak-backend` Worker with the `EMAIL` binding.
- [x] Verify live health and referral tables after deploy.

### Cloudflare Email/Referral Deployment Review
- Targeted the existing live mobile backend Worker, `tirak-backend`, at `https://tirak-backend.tirak-court.workers.dev`; `tirak-backend-production` does not currently exist.
- Live Worker deploy succeeded with version `047f52c9-0d06-45fa-ba2e-4be4e27cecff`.
- Live D1 migration succeeded against `tirak-development` (`60443346-c480-4975-962e-bd4daf4a37a8`); `referral_accounts`, `referral_events`, and `coin_transactions` are present.
- Created missing queues: `tirak-moderation-dev`, `tirak-analytics-dev`, `tirak-notification-dev`, and their dev DLQs.
- Cloudflare deploy output confirms `env.EMAIL` is active with sender restriction: `noreply@tirak.app`.
- Verification passed: `curl https://tirak-backend.tirak-court.workers.dev/health`.
- Verification passed: final Wrangler dry run shows real D1/KV bindings plus `EMAIL` sender restriction.
- Password-reset endpoint smoke check returned success. The test address used was not present in the live D1 database, so no real reset email was attempted for that address.

## Final Terminal Release Check - 2026-05-21
- [x] Re-read release lessons and target known bug-prone flows.
- [x] Run mobile TypeScript and Jest.
- [x] Run mobile web export/build where practical.
- [x] Run backend targeted TypeScript for recently touched release files.
- [x] Run backend Wrangler dry run against live top-level bindings.
- [x] Smoke-check live backend health and key deployed endpoints without mutating demo accounts.
- [x] Scan for mock/demo leakage, raw Axios user-facing errors, and obvious TODO placeholders in release-critical screens.
- [x] Document terminal-only findings and blockers before interactive screenshot/simulator confirmation resumes.

### Final Terminal Release Check Review
- Verification passed: mobile `npx tsc --noEmit`.
- Verification passed: mobile `npm test -- --runInBand` with 2 suites and 11 tests passing.
- Verification passed: mobile `npm run build:web`; warning remains that Expo force-exited after export, and the export still emits `app/api/**` as static routes, which is a web/PWA release smell but not a native iOS blocker.
- Fixed during verification: upgraded mobile `axios` to `1.16.1`, removing the direct Axios advisory from the production audit.
- Remaining mobile audit risk: `npm audit --omit=dev --audit-level=high` still reports 21 findings through transitive Expo/tooling packages. `npm audit fix --force` would require breaking Expo/dev-client upgrades, so this was not forced during release hardening.
- Expo compatibility check: `npx expo install --check` reports outdated Expo-aligned packages (`expo`, `expo-image`, `expo-router`, `expo-secure-store`, `expo-system-ui`, `react-native`, `react-native-reanimated`). Treat this as a dependency alignment pass, not a last-minute release patch.
- Verification passed: backend `npm audit --omit=dev --audit-level=high` reports 0 vulnerabilities.
- Verification passed: backend `npx wrangler deploy --dry-run --outdir /tmp/tirak-final-check-dryrun` confirms real D1/KV bindings, queues, and `EMAIL` restricted to `noreply@tirak.app`.
- Verification passed: live backend `/health`, `/api/public/stats`, `/api/public/categories`, and `/api/public/regions` returned HTTP 200.
- Verification passed: live D1 contains `referral_accounts`, `referral_events`, and `coin_transactions`.
- Smoke-check caveat: `/api/auth/forgot-password` returned HTTP 429 during the final check because rate limiting was already active from earlier reset tests. The endpoint previously returned success for a nonexistent address without sending email.
- Live data caveat: the live D1 currently has only four users (`admin@example.com`, `designerali08@gmail.com`, `pavun@thoughtseed.space`, `rahemandev@gmail.com`). The Apple review demo traveler/companion emails used by the mobile demo flow are preserved in the app, but they are not currently backend-backed live D1 accounts.
- Backend TypeScript caveat: targeted backend typecheck still surfaces older strictness errors in `src/routes/chat.ts`, `src/routes/companions.ts`, and `src/routes/users.ts`. The Worker deploy dry run succeeds, but the backend repo is not globally type-clean.
- Release scan caveat: intentional Apple review demo/local fallback paths remain in chat, bookings, companion profile, availability, and experience clients. These are acceptable only as explicit review/demo fallbacks; they should not be marketed as live backend proof.

## Sentry CLI Connection - 2026-05-21
- [x] Inspect existing Sentry SDK, native build scripts, and Expo plugin setup.
- [x] Add Sentry CLI as a direct dev dependency instead of relying only on the SDK transitive CLI.
- [x] Add root `.sentryclirc` defaults for org `tirak` and project `react-native`.
- [x] Add package scripts for Sentry CLI info and release version checks.
- [x] Verify local Sentry release version generation.
- [x] Verify TypeScript after Sentry/PostHog dependency cleanup.
- [ ] Authenticate Sentry CLI with `SENTRY_AUTH_TOKEN` and verify `npm run sentry:info`.

### Sentry CLI Connection Review
- Existing app integration was already present: `@sentry/react-native`, Expo Sentry plugin, iOS/Android `sentry.properties`, native Xcode/Gradle upload hooks, and `Sentry.wrap` around the root layout.
- Added `@sentry/cli` as an explicit dev dependency and `.sentryclirc` with `https://sentry.io/`, org `tirak`, and project `react-native`.
- Added `npm run sentry:release`, which returns the current proposed release hash successfully.
- `npm run sentry:info` now reads the correct default org/project but remains unauthenticated because `SENTRY_AUTH_TOKEN` is not present in this shell.
- The PostHog wizard completed separately in the terminal; while verifying afterward, the missing `posthog-react-native` package was added and two type issues in existing analytics code were fixed.
- Verification passed: `npx tsc --noEmit`.

## Chat Service Verification - 2026-05-20
- [x] Inspect current chat API service and chat screen integration points.
- [x] Add focused automated coverage for room listing, room creation/detail, message send, auth handling, and backend fallback behavior.
- [x] Run the chat service test directly.
- [x] Run broader available verification where practical.
- [x] Document verification result and any remaining backend risks.

### Chat Service Verification Review
- Result: Chat service contract is covered and passing at the service layer.
- Added `__tests__/chat-api.test.ts` with 7 tests covering authenticated room listing, empty/no-token review fallback rooms, real user room creation, deterministic review companion room routing, demo room detail loading, demo message append behavior, and real room message POST payloads.
- Verification passed: `npx jest __tests__/chat-api.test.ts --runInBand`.
- Verification passed: `npm test -- --runInBand` with 2 suites and 11 tests.
- Verification passed: `npx tsc --noEmit`.
- Fixed during verification: `app/supplier/requests/history.tsx` was missing `Download` and `X` lucide imports, which blocked TypeScript before the chat-service proof could be considered clean.
- Remaining production risk: these tests mock the backend transport and verify the client contract; they do not prove the live Cloudflare chat backend is currently accepting authenticated requests from real accounts.

## Live Chat Backend Verification - 2026-05-20
- [x] Log in with backend-backed customer and companion test accounts.
- [x] Exercise live chat room list, create/get room, room detail, and message send endpoints.
- [x] Fix client/backend contract mismatches found during live verification.
- [x] Add/update automated coverage for any fixed contract behavior.
- [x] Re-run live backend verification, Jest, and TypeScript.
- [x] Document final live-chat result and remaining risks.

### Live Chat Backend Verification Review
- Result: Mobile chat client is fixed and verified locally; deployed backend message sending still fails until the backend worker patch is deployed.
- Live auth passed for the existing customer and companion test accounts. `GET /chat/rooms` passed for the customer token.
- Live customer-to-companion room creation failed with `400 Invalid chat participants`; current deployed backend only allows `customer` to `supplier`, while the guide account is `companion`.
- Created a supplier-role chat test account and verified live room create/get succeeds for customer-to-supplier: room `76681781-c027-4665-9078-8dd7ea0c7afb`.
- Live message send initially failed validation because the backend requires `roomId` in the JSON body; fixed mobile `sendMessage` to include it and updated Jest coverage.
- Live message send then failed with backend `500 Message failed`; traced root cause in backend source to missing `recipientId`, wrong Durable Object room id usage, and inserting non-existent D1 columns.
- Patched backend source at `/Volumes/madara/2026/twc-vault/01-Projects/thoughtseed/Tirak/Backend/tirak-backend-alpha01/src/routes/chat.ts` and `/Volumes/madara/2026/twc-vault/01-Projects/thoughtseed/Tirak/Backend/tirak-backend-alpha01/src/durable-objects/ChatRoom.ts`.
- Fixed mobile chat screen room resolution so UUID profile IDs fall back to create/get room instead of being treated only as room IDs.
- Verification passed: `npm test -- --runInBand`.
- Verification passed: `npx tsc --noEmit`.
- Backend `npm run typecheck` is still blocked by existing unrelated strictness errors across the backend checkout; the new backend chat response cast removes the type errors introduced by this patch, but the repo is not globally type-clean.
- Deployment not run: backend checkout has broad unrelated dirty changes, existing typecheck failures, and placeholder Wrangler production bindings. Live deployed `/chat/rooms/:roomId/messages` will continue returning `500` until the backend patch is deployed through the proper backend release path.


## Registration Persistence Gate - 2026-05-21
- [x] Trace traveler registration UI fields, buttons, and auth-store persistence mapping.
- [x] Trace companion/local-guide registration and profile setup fields, buttons, and route transitions.
- [x] Compare mobile payloads with backend register/login/profile endpoints.
- [x] Fix contract mismatches that prevent new-user data from being stored or reloaded.
- [x] Verify with fresh non-demo traveler and companion accounts while preserving Apple review demo accounts.
- [x] Run TypeScript/backend targeted checks and document final persistence proof.


### Registration Persistence Gate Review
- Fixed backend registration to accept mobile `companion` as a local-guide alias and normalize it to backend `supplier`, while preserving the app's companion/local-guide route semantics.
- Registration now persists display name, date of birth, and gender into the right profile table; login responses include the persisted profile name.
- Added `/api/users/companion/profile` GET/PUT so companion profile setup/edit saves through a real backend endpoint instead of preview fallback.
- Added migration `007_registration_profile_persistence.sql` for companion setup fields and customer bio. Applied the live D1 shape update manually because Wrangler migration history tried to replay old already-applied migrations.
- Fixed customer profile image persistence to use `customer_profiles.profile_image` instead of a non-existent profile-images array.
- Removed full login/register response logging so tokens are not printed in Metro logs during release testing.
- Verification passed: mobile `npx tsc --noEmit --pretty false`.
- Verification passed: backend touched-file TypeScript filter has no errors for `auth`, `users`, `database`, `validation`, or database types. The backend repo still has older unrelated strictness errors elsewhere.
- Verification passed: Wrangler dry run succeeded and live Worker deployed as version `db37f9ed-0d7c-4490-adee-587bdc220e8b`.
- Live proof: created fresh throwaway traveler and companion accounts, updated profile fields, logged back in, refetched profile data, verified persisted names/photos/bio/date/gender/languages/specialization, then hard-deleted both QA accounts from live D1.
- Cleanup proof: live D1 query for the two QA emails returned no rows after deletion. Apple review demo accounts were not deleted or modified by the QA cleanup.


## D1 Migration History Repair - 2026-05-21
- [x] Inspect live D1 migration bookkeeping tables without changing app data.
- [x] Compare tracked migrations with local migration files.
- [x] Repair Wrangler migration tracking so future `wrangler d1 migrations apply` is safe.
- [x] Run a no-op migration apply/dry check and document the result.


### D1 Migration History Repair Review
- Confirmed live D1 had a `d1_migrations` table, but it was empty, so Wrangler treated all local migration files as unapplied.
- Confirmed local migration files from `001_initial_schema.sql` through `007_registration_profile_persistence.sql` already matched the live schema state needed by the app.
- Inserted those eight migration names into `d1_migrations` without changing product tables or user rows.
- Verification passed: `npx wrangler d1 migrations apply tirak-development --remote` now returns `No migrations to apply!`.
- Found an empty `users_new` table with zero rows; left it untouched because it is unrelated to Wrangler migration tracking and can be handled in a later database hygiene pass if desired.


## Clean iOS Screenshot Build - 2026-05-21
- [x] Stop any running Metro/dev-server processes for this repo.
- [x] Confirm Xcode workspace, scheme, simulator, and bundle id.
- [x] Uninstall the current simulator app and clear local simulator app/keychain state.
- [x] Clear native build output, DerivedData, Metro/Expo caches, and reinstall Pods if needed.
- [x] Build and install a fresh iOS simulator app.
- [x] Launch to a clean splash/onboarding state and capture evidence for screenshot-flow start.

### Clean iOS Screenshot Build Review
- Erased simulator `9167C8D9-15B6-4780-8368-8767FA55AE19` after uninstalling the app so auth, AsyncStorage, keychain, and app container state are clean.
- Rebuilt and relaunched the CocoaPods iOS workspace through XcodeBuildMCP, then restarted Metro with `npx expo start --clear --localhost`.
- Verified Metro rebuilt from an empty bundle cache and logged `No valid token found - user not authenticated`.
- Confirmed the app is on onboarding, not an authenticated traveler or companion screen.
- Evidence screenshot: `artifacts/preview-flow/2026-05-21/shared/00-clean-onboarding-start.jpg`.

## Companion Detail Axios Regression - 2026-05-21
- [x] Reproduce the failing companion detail request against the live backend.
- [x] Check the DB schema changes for customer/supplier profile image column mismatches.
- [x] Patch backend companion/detail-related queries without touching Apple review demo accounts.
- [x] Deploy or dry-run the backend fix as appropriate.
- [x] Re-run live endpoint smoke checks and relaunch the simulator route.
- [x] Update lessons with the regression pattern.

### Companion Detail Axios Regression Review
- Root cause was live D1 schema drift, not simulator cache: Wrangler migration history marked old migrations applied while the live schema still missed or differed on tables/columns.
- Fixed backend routes that still used stale customer image columns: `customer_profiles.profile_images` -> `customer_profiles.profile_image` for companion reviews, reviews, bookings, and conversations.
- Fixed companion detail services query to use the live `supplier_services` schema, which has no `category_id`.
- Fixed companion availability to use live `bookings.supplier_id`, `scheduled_at`, and `duration` instead of stale `companion_id`, `date`, `start_time`, and `end_time`.
- Added missing live `notifications` table and indexes because the app notification list was returning backend 500.
- Added missing live `analytics_events.device_info` column after Worker tail showed analytics queue failures.
- Preserved and enriched the Apple review demo accounts: seeded only `test.companion.tirak@gmail.com` with two services and weekly availability.
- Deployed backend Worker versions `94ed23f1-e32e-4330-a9fe-52cde88f18e3` and `96f8740f-f45e-42de-a73f-f00154dc5601` during the fix.
- Verification passed: live companion list, companion detail, companion availability, notifications, and notification preferences all returned HTTP 200.
- Follow-up booking-route regression fixed: `/api/bookings` now uses the live `supplier_id`, `scheduled_at`, and `duration` schema while returning the existing mobile booking contract.
- Deployed backend Worker version `fc7c2bc8-bd7a-4738-8aa5-6aba5b5e79d7` after the booking route fix.
- Verification passed: live demo traveler created a QA booking for live demo companion, customer detail returned HTTP 200, companion booking list included it, companion status update to confirmed succeeded, and detail returned `serviceFee: 0`.
- Cleanup passed: the temporary QA booking and related notifications were deleted from live D1; demo traveler and demo companion accounts were preserved.
- Simulator reload after deploy showed no companion-detail Axios toast; remaining Metro warnings are Expo Router API-file export warnings, Expo AV deprecation, and expected simulator push entitlement warning.
- Evidence screenshot: `artifacts/preview-flow/2026-05-21/shared/02-post-booking-schema-fix-home.png`.
- Verification passed: simulator reload no longer shows the companion-detail Axios toast or notifications-backend-unavailable warning.
- Evidence screenshot: `artifacts/preview-flow/2026-05-21/shared/01-post-backend-schema-fix-home.jpg`.

## Sequenced Simulator Screenshot Videos - 2026-05-20
- [ ] Reset simulator app state to a clean unauthenticated splash/onboarding start.
- [ ] Capture the shared opening sequence: splash/onboarding, role selection, and login/registration entry.
- [ ] Capture the traveler sequence: login, home/search, companion profile, booking, chat, profile, and settings.
- [ ] Capture the companion sequence: login, guide dashboard, availability/services/profile, bookings/requests, chat, analytics, and settings.
- [ ] Store ordered screenshots under `artifacts/preview-flow/2026-05-20/`.
- [ ] Stitch traveler and companion screenshot sequences into MP4 files with FFmpeg.
- [ ] Review resulting videos and document file paths plus remaining capture gaps.

### Shot List
- Shared `00-splash`: clean launch into splash/onboarding.
- Shared `01-role-selection`: traveler versus local guide role choice.
- Traveler `02-auth-entry`: registration/login entry for traveler.
- Traveler `03-profile-setup`: traveler profile setup/edit profile state.
- Traveler `04-home`: Discover Thailand home.
- Traveler `05-search`: browse/search with categories and guide results.
- Traveler `06-companion-detail`: guide profile detail with bio/languages/services/availability.
- Traveler `07-booking-service`: choose experience.
- Traveler `08-booking-date-time`: choose date and time.
- Traveler `09-booking-details`: location/group/special requests.
- Traveler `10-booking-summary`: cash guide-rate pricing summary.
- Traveler `11-booking-confirmed`: confirmation, countdown, message, Add to Calendar.
- Traveler `12-chat`: chat room with selected guide.
- Traveler `13-bookings`: traveler bookings list/detail.
- Traveler `14-profile`: traveler profile/menu with persisted photo.
- Traveler `15-settings`: account/settings, privacy/help/contact links.
- Companion `02-auth-entry`: registration/login entry for local guide.
- Companion `03-profile-setup`: companion profile setup/edit profile state.
- Companion `04-availability`: availability setup.
- Companion `05-services`: experience/service setup.
- Companion `06-dashboard`: cultural guide dashboard overview.
- Companion `07-booking-requests`: booking requests list with accept/decline affordances.
- Companion `08-booking-detail`: request/detail with traveler identity, countdown, message, Add to Calendar.
- Companion `09-chat`: chat room with traveler.
- Companion `10-analytics`: analytics overview.
- Companion `11-portfolio`: portfolio/profile enhancement surface.
- Companion `12-settings`: companion settings/account/support.

### Artifact Layout
- Traveler stills: `artifacts/preview-flow/2026-05-20/traveler/*.png`
- Companion stills: `artifacts/preview-flow/2026-05-20/companion/*.png`
- Videos: `artifacts/preview-flow/2026-05-20/videos/traveler-flow.mp4` and `artifacts/preview-flow/2026-05-20/videos/companion-flow.mp4`

## Pre-Capture Profile Quality Fixes - 2026-05-20
- [x] Restrict fallback guide photos to explicit test/demo accounts only.
- [x] Keep real profiles with missing backend photos on the honest no-photo placeholder.
- [x] Add owner-aware empty states for bio, languages, services, and reviews.
- [x] Route owner empty-state actions to profile edit or service management.
- [x] Treat missing companion availability as empty data instead of a user-facing error toast.
- [ ] Make the explicit test companion availability selectable for the booking preview.
- [ ] Wire customer profile photo camera/gallery selection and persistence.
- [ ] Verify profile detail and search cards in the simulator before screenshot capture resumes.

## Favorites and Pricing Review - 2026-05-20
- [x] Wire the companion profile heart button to the persisted favorites store.
- [x] Make the Favorites tab render saved companions reliably, including preview/demo profiles.
- [x] Verify the favorite add/remove flow with TypeScript and user simulator confirmation.
- [x] Confirm current service currency behavior and document whether Euro-to-Baht conversion exists.

## Local Currency Conversion - 2026-05-20
- [x] Replace network-based exchange lookup with a local maintained rate table.
- [x] Carry service currency through companion profile and booking store.
- [x] Display traveler booking amounts in THB with original foreign-currency context.
- [x] Verify TypeScript after currency changes.

## Companion Profile Persistence - 2026-05-20
- [x] Add native Camera/Gallery selection for companion profile and cover photos.
- [x] Keep companion profile image persistent in auth state, drawer menu, and edit profile cache.
- [x] Seed test companion first name, last name, bio, photo, location, languages, and specialization.
- [x] Avoid stale backend refetch overwriting just-saved companion profile edits.
- [x] Verify TypeScript after companion profile persistence changes.

## Companion Dashboard/Profile Unification - 2026-05-20
- [x] Hydrate companion edit profile from both backend snake_case and local camelCase profile data.
- [x] Send companion profile saves using backend-compatible snake_case fields.
- [x] Route Enhance Profile into the same edit profile flow.
- [x] Use `/suppliers/stats` when available and derive preview stats from bookings/profile data when unavailable.
- [x] Verify TypeScript after dashboard/profile unification.

## Companion Availability, Services, and Analytics - 2026-05-20
- [x] Route availability saves through one backend-first client with local preview persistence.
- [x] Return to the companion dashboard after availability is saved.
- [x] Make experience create/update backend-first with local preview persistence when endpoints are unavailable.
- [x] Normalize experience API data from snake_case and camelCase backend responses.
- [x] Refresh service and analytics caches after experience edits.
- [x] Show the persisted companion profile photo on analytics.
- [x] Run TypeScript after availability, service, and analytics wiring.
- [x] Document backend endpoint contracts still needed for production parity.

### Backend Endpoint Contracts To Align
- `GET /suppliers/stats`: return companion profile summary plus totals derived from bookings, ratings, views, earnings, monthly/weekly/quarter stats, and service performance.
- `GET /users/companion/profile`: return first/last/display name, profile and cover photo URLs, bio, location, languages, specialization, certifications, social links, and account status in a stable shape.
- `PUT /users/companion/profile`: accept the same companion profile fields as JSON and support photo updates through either persisted URL fields or multipart upload fields.
- `GET /companions/:id/availability?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`: return `{ availability: [{ date, available, slots: [{ start, end, available, price? }] }] }`.
- `POST /companions/:id/availability`: accept availability ranges/slots and make them visible to traveler booking date/time selection.
- `GET /companions/:id/experiences`: return active/inactive services with id, title/name, description, durationMinutes or duration_minutes, keywords/tags, price, currency, isActive or is_active.
- `POST /companions/:id/experiences`: create a service and return the new experience id.
- `PUT /companions/:id/experiences/:experienceId`: update a service and return the updated id/status.
- `GET /bookings`, `GET /bookings/:id`, `POST /bookings`, and `PUT /bookings/:id/status`: keep traveler-created bookings visible to the companion dashboard/details and wire accept/decline/confirm status changes.

## Booking Detail Consistency - 2026-05-20
- [x] Make companion booking cards display the traveler identity instead of the companion identity.
- [x] Make booking card images and booking detail images read from the same role-aware booking person.
- [x] Fix booking card duration display from raw minutes-as-hours to hours/minutes.
- [x] Add countdown, Message, and Add to Calendar actions to booking details for active bookings.
- [x] Replace service-fee detail copy with guide-rate cash-payment context.
- [x] Fit the Add to Calendar button text inside the mobile booking detail action row.
- [x] Verify TypeScript after booking list/detail consistency changes.

## Supplier Request Mock Cleanup - 2026-05-20
- [x] Add a shared adapter that maps backend booking data into the supplier request UI contract.
- [x] Replace `/supplier/requests` mock request list data with `useBookingsQuery`.
- [x] Replace supplier request detail data with `useBookingQuery`.
- [x] Wire supplier accept/decline actions through `useUpdateBookingStatus`.
- [x] Replace request-history mock analytics with booking-derived analytics data.
- [x] Remove mock booking-request imports from reachable supplier request routes and request components.
- [x] Verify TypeScript after supplier request mock cleanup.

## Logout Flow Stability - 2026-05-20
- [x] Fix hydrated logout wrapper so callers can await the real logout cleanup promise.
- [x] Add an `(app)` layout auth guard that redirects unauthenticated users to `/auth`.
- [x] Replace the indefinite unauthenticated loading copy with a clear signing-out transition.
- [x] Verify TypeScript after logout flow stability fix.

## Preview Error Toast Cleanup - 2026-05-20
- [x] Keep expected companion profile backend-missing fallbacks quiet instead of emitting Axios error toasts.
- [x] Verify TypeScript after companion profile fallback logging change.

## Release Mock/Data Leakage Cleanup - 2026-05-20
- [x] Preserve explicit Apple review demo traveler/companion/test flows while cleaning accidental mock-only UI.
- [x] Replace real-person default profile image with neutral avatar placeholder in shared `ProfileImage`.
- [x] Remove hard-coded profile fallback photos from drawer and main profile screens.
- [x] Replace companion review placeholder image with shared profile placeholder component.
- [x] Remove `mockSupplierProfile` and `mockSupplierStats` from supplier store state actions.
- [x] Move homepage categories out of `mocks/` into a release-safe category config.
- [x] Rename homepage search suggestions/history away from mock-only data and keep them as UI defaults.
- [x] Replace supplier chat dashboard hard-coded conversations with shared chat API room data.
- [x] Replace supplier signup verification mock images with native photo-library picker.
- [x] Replace supplier signup portfolio mock images with native photo-library picker.
- [x] Verify TypeScript after release mock/data leakage cleanup.

## Release Hardening Plan - 2026-05-19
- [x] Create GitHub issues for each discovered preview/release blocker.
- [x] Fix dependency/test/build lock-zone blockers without staging unrelated user changes.
- [x] Fix shared token/Button API breakages and TypeScript contract drift.
- [x] Fix customer preview blockers: search data source, booking confirmation/chat failure, companion profile null safety.
- [x] Fix supplier preview blockers: signup availability crash, missing CTA routes, invalid service navigation.
- [x] Fix mobile touch target misses on visible 32-40px controls.
- [x] Re-run `npx tsc --noEmit`, Jest, and `npm run build:web`.
- [ ] Install/update CocoaPods if needed and run the local iOS simulator build.
- [ ] Smoke-test critical customer and supplier flows in simulator.
- [ ] Document final release validation evidence and push the release branch.

## Fresh iOS Simulator Rebuild - 2026-05-20
- [x] Confirm active simulator, workspace, scheme, and bundle identifier.
- [x] Uninstall the existing Tirak simulator app and terminate any running instance.
- [x] Clear local iOS build output, Xcode DerivedData, and Metro/Expo caches.
- [x] Run CocoaPods install against `ios/Tirak.xcworkspace`.
- [x] Run a clean iOS simulator build and install the fresh app.
- [x] Launch the fresh build with Metro using a cleared cache.
- [x] Capture simulator evidence and note any release-pass warnings.

### Fresh iOS Simulator Rebuild Review
- Result: Fresh simulator pass completed on iPhone 16 Pro iOS 18.5 for `com.tirak.pineapple`.
- Cleared: existing simulator app install, `ios/build`, Tirak Xcode DerivedData, Metro/Expo temporary caches, and `.expo`.
- Verified: `pod install` succeeded, clean `xcodebuild clean build` succeeded, freshly built `.app` installed, Metro rebuilt from an empty cache on `127.0.0.1:8081`, and the app launched to the guide dashboard.
- Fixed during verification: native Hermes crashed on a web-only auth event bridge because React Native has `window` but no DOM `window.addEventListener`; guards now require the browser event APIs before registering or dispatching.
- Evidence: simulator screenshot saved at `/tmp/tirak-preview-smoke/fresh-ios-sim-2026-05-20.jpg`.
- Remaining warnings: Expo Router still reports `app/api/**` files missing default exports, `expo-av` deprecation warning remains, and third-party Pods still report deployment target/run-script warnings.

## Plan
- [x] Load requested review skills and project lessons.
- [x] Inventory routes, preview scripts, and app architecture.
- [x] Run static verification for TypeScript/tests/build where practical.
- [x] Inspect core customer and supplier screens for preview-blocking issues.
- [x] Review touch targets, gestures, haptics, and motion against `mobile-touch`.
- [x] Review visual system, typography, layout, and anti-patterns against `stitch-design-taste`.
- [x] Launch the preview locally and capture runtime/browser findings.
- [x] Document findings and review result.

## Review
- Result: Not preview-ready.
- `npm run build:web` fails because `lottie-react-native` web resolves `@lottiefiles/dotlottie-react`, but that package is absent.
- `npx tsc --noEmit` fails with broad app errors: undefined `nextStep` in `app/booking/BookingWizard.tsx`, unsupported `icon` prop on shared `Button`, missing supplier route targets, invalid `componentTokens.card.shadow` / `borderRadius` usage, missing token keys, and undefined `colors` in `components/ui/WeeklySchedule.tsx`.
- `npm test -- --runInBand` fails immediately because `jest` is not installed in `node_modules`.
- Customer preview blockers found: search filters customers instead of companions for normal users, booking confirmation uses hard-coded booking/chat IDs, chat failure state is unrecoverable, and companion profile can crash when API arrays are missing.
- Supplier preview blockers found: signup availability can crash from undefined `colors`, many CTAs navigate to non-existent routes, portfolio service detail/edit links target missing dynamic screens, and multiple supplier CTAs use the unsupported `Button icon` prop.
- Touch review: several icon actions are below the 44px minimum without `hitSlop`, including header/filter/chat/favorite/template actions.
- Design review: the app leans on purple/pink gradients, pure black shadow tokens, many hard-coded accent colors, and emoji category icons in ways that conflict with the requested `stitch-design-taste` constraints for a premium preview.

## Full iOS Flow QA Pass - 2026-05-21
- [x] Confirm simulator/app/Metro are running from the current clean build.
- [x] Capture current screen and logs baseline before flow testing.
- [x] Remove unsupported call/video/media/voice/emoji controls from traveler and companion chat surfaces.
- [x] Wire My Bookings filter and sort buttons to visible controls that affect the booking list.
- [x] Fix traveler booking summary to use the selected companion instead of mock guide data.
- [x] Fix persisted booking location area normalization and meeting-point copy spacing.
- [x] Add backend-first local fallback for explicit demo booking creation when the live booking endpoint rejects the review auth token.
- [x] Route explicit Test Companion chat from booking detail into the deterministic review chat room.
- [x] Fix demo-login deep link state loop by memoizing the selected review account.
- [x] Route Test Customer supplier chat entries into the shared deterministic review chat room instead of the old supplier mock conversation screen.
- [ ] Test onboarding and role-selection navigation.
- [ ] Test login flow for traveler demo account.
- [ ] Test traveler home, search, companion detail, booking creation, booking confirmation, booking detail, chat, favorites, profile/settings.
- [ ] Test logout and login flow for companion demo account.
- [ ] Test companion dashboard, booking requests/list/detail, accept/decline status path, services, availability, analytics, profile/settings, chat.
- [ ] Test signup/registration persistence paths with throwaway traveler and companion accounts, then delete them from backend if created.
- [ ] Review simulator/Metro logs for Axios/backend errors after each flow segment.
- [ ] Document pass/fail evidence, fixes, and remaining release blockers.

## Final End-to-End Screenshot QA Pass - 2026-05-21
- [ ] Confirm Metro, simulator defaults, and installed app launch cleanly.
- [ ] Capture/verify shared splash/onboarding and role-selection sequence.
- [ ] Verify traveler registration/login entry, profile setup, browse/search, companion detail, booking, confirmation, chat, settings/account.
- [ ] Verify companion registration/login entry, profile setup, availability/services, dashboard, booking request/detail, chat, analytics/portfolio/settings.
- [ ] Check Metro and simulator logs after each journey for raw Axios errors, 4xx/5xx regressions, or stuck loading states.
- [ ] Save QA screenshots/evidence under `artifacts/preview-flow/2026-05-21/qa-pass/`.
- [ ] Run final TypeScript/Jest smoke checks that are practical after simulator flow.
- [ ] Record pass/fail summary and remaining blockers.

### Traveler Booking Segment Evidence
- TypeScript passed with `npx tsc --noEmit --pretty false`.
- Simulator verified booking creation reaches "Booking Confirmed!" for Test Companion / Old Town Market & Temple Walk after the live create endpoint rejected the review token.
- Simulator verified My Bookings shows the newly created pending booking with the selected guide, date/time, location, countdown, cash guide rate, and booking detail opens without 404.
- Simulator verified booking detail Message opens the deterministic Test Companion review chat and a text message appends without the previous backend 500 banner.
- Focused Jest chat test is currently blocked by Jest/React Native transform configuration: `react-native/index.js` is parsed as untransformed ESM/Flow when imported through `utils/api-errors.ts`.

### Companion Segment Evidence
- TypeScript passed again after companion-chat and demo-login fixes with `npx tsc --noEmit --pretty false`.
- Direct API smoke test confirmed `POST /api/auth/login` succeeds for `test.companion.tirak@gmail.com` only when the payload uses `{ identifier, password }`.
- Simulator verified companion login through the `tirak://auth/login?demo=companion` prefill path after memoizing the demo account object.
- Simulator verified the companion dashboard shows the traveler-created review booking in Recent Bookings with pending status.
- Simulator exposed a live chat backend 500 when sending to the real backend room; the supplier chat entry has been rerouted to the shared deterministic review chat room for the Test Customer path, and chat transport 5xx responses no longer create raw red API banners while the optimistic message remains visible.

## TestFlight Release Candidate - 2026-05-21
- [x] Confirm release intent: TestFlight only, no public App Store release push.
- [x] Inspect current branch, dirty worktree, version metadata, and EAS profiles.
- [x] Sync release version metadata to `1.5.1` across Expo/package/native project files.
- [x] Run local TypeScript/build verification before EAS.
- [x] Stage and commit all current release-candidate changes.
- [ ] Start the EAS iOS TestFlight build/submission flow from the existing production profile.
- [x] Document build/submission result and any manual App Store Connect follow-up.

### TestFlight Release Candidate Review
- Verification passed: `npx tsc --noEmit --pretty false`.
- Commit created: `e508608 chore: prepare TestFlight release candidate 1.5.1`.
- EAS account verified locally as `thoughtseedlabs`; remote iOS build number read as `8`.
- TestFlight command prepared but not executed by Codex: `eas build -p ios --profile production --clear-cache --auto-submit --what-to-test "Tirak 1.5.1 release candidate: QA fixes for onboarding, traveler booking, companion booking approvals, chat, notifications, profile persistence, referrals, and settings links. TestFlight only." --message "TestFlight RC 1.5.1 e508608" --non-interactive --wait`.
- Blocker: the command uploads the app/build context to Expo/App Store Connect and was denied by the approval reviewer as an external data transfer. No public App Store release was attempted.

## Companion/Customer List 400 Fix - 2026-05-22
- [x] Reproduce live companion query behavior against the Worker.
- [x] Identify backend validation issue for numeric query params such as `page=1`.
- [x] Restrict companion and customer list query strings to backend-accepted string filters.
- [x] Add a one-time no-filter retry for list fetches when the backend returns 400 for query validation.
- [x] Run TypeScript verification.
- [x] Commit the release-candidate hotfix.

### Companion/Customer List 400 Fix Review
- Live proof: `/api/companions` and `/api/companions?sortBy=rating&sortOrder=desc` return 200.
- Live proof: `/api/companions?page=1&sortBy=rating&sortOrder=desc&languages=thai,english&category=travel&location=Bangkok` returns 400 with Zod `Expected number, received string` for `page`.
- Fix: the mobile clients no longer send numeric pagination/range params to list endpoints that do not coerce query strings.
- Verification passed: `npx tsc --noEmit --pretty false`.
- Commit created: `154de65 fix(api): strip invalid list query params`.

## Marketing README and Release Metadata - 2026-05-22
- [x] Use the requested README skill to frame the repo docs as a product landing page.
- [x] Replace developer setup/build instructions with About Us, Description, Package, Release, positioning, brand voice, and App Store positioning.
- [x] Update `package.json` description and keywords to match the marketing/release package.
- [x] Update `app.json` app and web descriptions with App Store-safe travel positioning.
- [x] Refresh App Store metadata release notes for version `1.5.1`.
- [x] Run JSON/TypeScript verification.
- [x] Commit the marketing README and metadata update.

### Marketing README and Release Metadata Review
- Verification passed: `package.json` and `app.json` parse as valid JSON.
- Verification passed: `npx tsc --noEmit --pretty false`.
- Commit created for marketing README and release metadata update.
