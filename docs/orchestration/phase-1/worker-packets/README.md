# Tirak Worker Bootstrap Packets

Status: active for bounded dispatch under the recorded `T-024 human approval`.

These templates turn the frozen eighty-task plan into deterministic execution packets without creating GitHub issues, branches, worktrees, deployments, or staging mutations. A worker receives only the packet for its task plus the shared contract and current evidence references.

## Packet assembly order

1. Attach `shared-contract.md` unchanged.
2. Copy `executor-template.md` for the assigned task and fill every placeholder.
3. Attach `forbidden-fixes.md` unchanged.
4. Give `validator-template.md` to an independent validator.
5. Require `handoff-template.md` before ownership changes or integration.

## Dispatch boundary

Every launch must prove the exact T-024 approval recorded in `docs/execution/phase-1/t-024-human-approval.md`, use its assigned isolated branch/worktree, honor dependency and lock-zone gates, and remain staging-only. Production mutation, live Omise charging, App Store submission, and bypassing later gates remain prohibited, including the separate `T-072` production boundary.

## Completeness rule

A packet is invalid if it omits the task acceptance text, dependency evidence, owned lock zone, exact validation commands, prohibited fixes, rollback/abort instructions, or evidence destinations.
