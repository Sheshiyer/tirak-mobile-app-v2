# Customer PWA deployment preparation — 2026-10-22

Source: isolated `release/customer-pwa-20261022` worktree based on store release commit d2469a6, with its existing tracked working-tree release delta copied without modifying the original checkout. The untracked API transport regression test was copied explicitly. No native release evidence or secrets were copied.

PWA changes: exported HTML manifest and Apple touch-icon metadata; stable manifest id; removal of unsupported share target and unsupported certified-guide wording; production Core environment pinned in Vercel config; web secure storage skips browser access during static rendering.

Production API: https://tirak-backend.tirak-court.workers.dev/api
Environment: production. Demo, enable-demo, review and PromptPay flags false. Existing service worker registration remains disabled, with existing registrations removed at runtime. No offline claim.

Verification: TypeScript passes. 27 tests pass across four focused suites (SSR storage, API transport, auth account-scope clearing, release configuration). Production Expo export succeeds with 91 static HTML routes. Root HTML references manifest and Apple touch icon. Exported manifest id/start/scope `/`, standalone display. Main entry bundle `entry-6eb80c5c680afdd38f65e518a9f72082.js`, 6,698,978 bytes, contains selected production API.

Artifact: `dist/`. This receipt covers build/source only. Deployment, actual inbox delivery, new account registration, dashboard browser flows and physical iPhone installation remain independently required.
