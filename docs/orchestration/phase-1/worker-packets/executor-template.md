# Executor Packet — `<TASK_ID>`

## Assignment

- Title: `<TITLE>`
- Repository: `<MOBILE|BACKEND|WIKI>`
- Approved base commit: `<SHA>`
- Branch: `<FROM_BRANCH_WORKTREE_MANIFEST>`
- Worktree: `<FROM_BRANCH_WORKTREE_MANIFEST>`
- Owned lock zone: `<ZONE>`
- Dependencies with accepted evidence: `<TASK_IDS_AND_LINKS>`
- Deliverable: `<VERBATIM_PLAN_DELIVERABLE>`
- Acceptance: `<VERBATIM_PLAN_ACCEPTANCE>`

## Preflight

- [ ] `T-024 human approval` is recorded before this packet launches a worker.
- [ ] Base SHA, branch, worktree, environment, and repository match the manifests.
- [ ] `tirak-payments-v1` verifier passes without contract drift.
- [ ] Every dependency has evidence from the trusted producer in the wave evidence matrix.
- [ ] No other task owns this lock zone at the current wave sequence.
- [ ] The task needs no edit outside the owned lock zone.

## Implementation rules

1. Work only inside the assigned repository, branch, worktree, and lock zone.
2. Preserve user-owned changes and never rewrite unrelated history.
3. Fix a bad state at its earliest ingestion point when possible.
4. Keep payment, booking, cancellation, restitution, chat, content, and environment truth aligned with `tirak-payments-v1`.
5. Stop on an undocumented schema, target, credential, provider, or contract mismatch.
6. Never perform a forbidden fix from `forbidden-fixes.md`.

## Required probes

- Positive commands: `<EXACT_COMMANDS>`
- Negative fixtures: `<EXACT_FAILURE_PROBES>`
- Source/config read-back: `<FILES_AND_EXPECTED_VALUES>`
- Runtime or external proof: `<PROBE_OR_DEFERRED_TASK>`
- Rollback/abort proof: `<COMMAND_AND_EXPECTED_RESULT>`
- `git diff --check`
- Secret scan scoped to staged changes

## Evidence output

Write evidence to `<TASK_EVIDENCE_PATH>` with exact commit, tree, environment, command, exit code, salient output, artifact hashes, negative-test result, rollback proof, residual risk, and forbidden-fix checklist.
