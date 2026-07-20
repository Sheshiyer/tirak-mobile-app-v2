# Task Handoff — `<TASK_ID>`

## Identity

- Repository / branch / worktree: `<VALUES>`
- Base / final commit / tree: `<SHAS>`
- Lock zone released: `<ZONE>`
- Next owner and activation sequence: `<OWNER_AND_SEQUENCE>`

## What changed

- Files: `<PATHS>`
- Contract impact: `<NONE_OR_REOPENED_TASK>`
- Schema/environment impact: `<NONE_OR_EXACT_DETAILS>`
- User-facing impact: `<EXACT_BEHAVIOR>`

## Evidence

- Positive commands and results: `<COMMANDS>`
- Negative fixtures and results: `<FAILURE_MATRIX>`
- Exact artifact hashes: `<HASHES>`
- Runtime/provider/device proof: `<LINKS_OR_DEFERRED_TASK>`
- Rollback or abort proof: `<RESULT>`
- `git diff --check`: `<PASS|FAIL>`
- Independent validator verdict: `<PASS|CONCERNS|FAIL>`

## Residual state

- Known risks: `<RISKS>`
- Follow-ups: `<TASK_IDS>`
- Forbidden-fix review: `<NONE_FOUND_OR_DETAILS>`
- Uncommitted or user-owned files preserved: `<PATHS>`

Ownership transfers only after the evidence is readable, the validator accepts it, and the next owner confirms the exact base. A message saying “implemented” without evidence is not a handoff.
