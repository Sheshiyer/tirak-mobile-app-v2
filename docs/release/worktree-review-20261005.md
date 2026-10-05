# Tirak Core branch and worktree review — 2026-10-05

Completed Core mobile/backend repairs are descendants of current remote main. The admin read-contract slice is rebased onto canonical admin main and remains a draft source-only contract. Older payment governance/provider-policy PRs remain separate. Local dirty recovery/operator/payment evidence is preserved and is not release-ready. No worktree or branch is deleted before confirmed merge.

| Checkout | Branch | State | Disposition |
|---|---|---|---|
| `.worktrees/tirak-admin-lint-fix` | `codex/admin-lint-cleanup` | clean | Merged, patch-equivalent or historical baseline; retain pending PR merge |
| `.worktrees/tirak-admin-release-readiness` | `codex/tirak-admin-release-readiness` | clean | Different admin repository; preserve separately, excluded from Core |
| `.worktrees/tirak-backend-release-readiness` | `codex/tirak-backend-release-readiness` | clean | Merged, patch-equivalent or historical baseline; retain pending PR merge |
| `.worktrees/tirak-core-admin-truth-contract` | `codex/tirak-core-admin-truth-contract` | WIP | Commit, rebase, validate and publish isolated draft contract PR |
| `.worktrees/tirak-core-api-repair-20260928` | `codex/tirak-core-api-repair-20260928` | clean | Publish integrated Core backend repair PR |
| `.worktrees/tirak-core-comms-repair-20260928` | `codex/tirak-core-comms-repair-20260928` | clean | Superseded by integrated backend repair; retain until merge |
| `.worktrees/tirak-core-mobile-repair-20260928` | `codex/tirak-core-mobile-repair-20260928` | clean | Publish Core mobile repair PR |
| `.worktrees/tirak-mobile-ios-runtime-fix` | `codex/ios-runtime-app-version` | clean | Merged, patch-equivalent or historical baseline; retain pending PR merge |
| `.worktrees/tirak-mobile-p1-financial-lifecycle-fix` | `codex/tirak-mobile-p1-financial-lifecycle-fix` | clean | Merged, patch-equivalent or historical baseline; retain pending PR merge |
| `.worktrees/tirak-mobile-p1-ios27-gap` | `codex/tirak-mobile-p1-ios27-gap` | clean | Merged, patch-equivalent or historical baseline; retain pending PR merge |
| `.worktrees/tirak-mobile-p1-js-link-readiness-fix` | `codex/tirak-mobile-p1-js-link-readiness-fix` | clean | Merged, patch-equivalent or historical baseline; retain pending PR merge |
| `.worktrees/tirak-mobile-p1-native-chat-reviewfix` | `codex/tirak-mobile-p1-native-chat-reviewfix` | clean | Merged, patch-equivalent or historical baseline; retain pending PR merge |
| `.worktrees/tirak-mobile-p1-payment-reviewfix` | `codex/tirak-mobile-p1-payment-reviewfix` | clean | Merged, patch-equivalent or historical baseline; retain pending PR merge |
| `.worktrees/tirak-mobile-p1-ui-gap` | `codex/tirak-mobile-p1-ui-gap` | clean | Merged, patch-equivalent or historical baseline; retain pending PR merge |
| `.worktrees/tirak-mobile-p1-ui-reviewfix` | `codex/tirak-mobile-p1-ui-reviewfix` | clean | Merged, patch-equivalent or historical baseline; retain pending PR merge |
| `.worktrees/tirak-mobile-phase1` | `gsd/phase-1-local-promptpay-pending-checkout` | WIP | Unfinished planning/simulator evidence; retain WIP |
| `.worktrees/tirak-mobile-phase1-clean` | `gsd/phase-1-local-promptpay-pending-checkout-clean` | clean | Merged, patch-equivalent or historical baseline; retain pending PR merge |
| `.worktrees/tirak-release-readiness` | `codex/fix-review-ota-test-env` | clean | Merged, patch-equivalent or historical baseline; retain pending PR merge |
| `admin-webapp/tirak-admin-command-center` | `main` | WIP | Different admin repository; preserve separately, excluded from Core |
| `admin-webapp/tirak-admin-release-20260919` | `codex/release-court-feedback` | clean | Merged, patch-equivalent or historical baseline; retain pending PR merge |
| `backend/tirak-backend-alpha01` | `main` | WIP | Recovered unborn duplicate; preserve, no canonical PR |
| `backend/tirak-backend-release-20260919` | `codex/release-court-feedback` | WIP | Preserve generated/nested checkout state |
| `tirak-mobile-app-v2` | `codex/court-feedback-snapshot-20260919` | WIP | Historical snapshot plus operator/bun WIP; preserve |
| `tirak-mobile-release-20260919` | `codex/court-release-20260919` | clean | Merged, patch-equivalent or historical baseline; retain pending PR merge |

## Known limitation

The owner experience client currently displays the first page (up to50 active experiences). Review found this existing contract limit is nonblocking for the reported fixture but requires pagination follow-up for owners exceeding50. No device or inbox acceptance is inferred from unit tests.
