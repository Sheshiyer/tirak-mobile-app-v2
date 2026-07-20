# Forbidden Fixes

The following approaches are release-blocking even if a narrow test passes:

- raw `004` replay against an unknown or existing D1 target
- destructive `009` table replacement, rename, or drop instead of additive booking-chat expansion
- manual iteration over the migration directory instead of the D1 migration ledger
- stale or implicit database, account, Worker, environment, API URL, or credential targets
- warning-only continuation after command, type, test, migration, backup, restore, deploy, or health failure
- UI-only seed hiding while prohibited data remains in SQL, imports, CMS, caches, mocks, notifications, wiki/RAG, or remote content
- serializer-only refund wording that leaves cancellation and financial state coupled incorrectly
- trusting the mobile client or webhook payload alone for paid state
- a manual paid reviewer fixture, provider bypass, or database status edit
- edits outside the owned lock zone or silent changes to a frozen contract
- a backend-only or mobile-only contract change without cross-layer verification
- a deployment, worktree, branch, GitHub issue, or external worker created before `T-024 human approval`

If any forbidden fix appears necessary, stop and reopen the owning contract or readiness task.
