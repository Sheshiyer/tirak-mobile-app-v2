# Non-payment feedback — mobile pickup

Local implementation checkpoint, 2026-09-19. Not deployed or device-certified.

- Signup records separate optional marketing/usage consent and versioned
  terms/privacy acceptance. Email verification supports codes, resend cooldown,
  honest delivery failure and verification later from settings.
- Customer and both supplier settings expose verification, persisted preferences
  and legal links. Cold customer `/settings` uses customer settings even when
  Expo resolves the duplicated supplier-group URL. Signup/legal/reset deep links
  are no longer forced back to onboarding.
- Optional PostHog usage analytics requires explicit persisted consent; logout
  and withdrawal stop capture. Personal identification properties, raw reset
  credentials, query-token tracking and replay are removed/disabled on the
  repaired paths. Existing Sentry error monitoring remains with default PII and
  replay disabled.
- Profile chat resolves an eligible confirmed/in-progress booking. REST sends
  retain failed drafts; socket events match backend payloads and use one-use
  room tickets instead of account tokens in URLs. Account/route changes ignore
  late responses.
- Demo data requires the explicit demo-mode flag and a known review identity.
  Known fixture profiles are filtered; API failures do not manufacture guides,
  availability, distances, statistics or successful actions.
- Existing payment and iOS edits were preserved; no payment release was run.

Verification: 86 Jest tests across 10 suites, `bunx tsc --noEmit`, and
`git diff --check` pass. Android production Hermes export passes (3,898 modules,
9.82 MB), with output under `.expo/court-android-2e0WAB/`. A Hermes export is
not a signed APK, installed Android test or store release.

Supplemental local browser checks verified cold signup, anonymous legal access,
fake-adapter email confirmation, cold settings, and consent save/reload reflected
in the admin contact register. Interceptor is disconnected, so its required
rendering gate remains deferred. Installed-device/two-user messaging checks are
also outstanding.

Cross-repository release authority and exact schema/email/legal prerequisites:
`tirak-backend-alpha01/docs/execution/non-payment-feedback-20260919.md`.
The backend needs approved booking-chat tables, new account migration 015, and
inspection of the isolated customer-profile column compatibility candidate.
Do not claim Court's installed app is updated until deployment, signed release
installation and device verification have actually completed.
