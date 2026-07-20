# Tirak Worker Bootstrap Packets

Status: locally prepared; dispatch is blocked until `T-024 human approval`.

These templates turn the frozen eighty-task plan into deterministic execution packets without creating GitHub issues, branches, worktrees, deployments, or staging mutations. A worker receives only the packet for its task plus the shared contract and current evidence references.

## Packet assembly order

1. Attach `shared-contract.md` unchanged.
2. Copy `executor-template.md` for the assigned task and fill every placeholder.
3. Attach `forbidden-fixes.md` unchanged.
4. Give `validator-template.md` to an independent validator.
5. Require `handoff-template.md` before ownership changes or integration.

## Dispatch boundary

No worker is launched from these files. Branch/worktree creation, GitHub publication, external fanout, staging access, or deployment requires the separate `T-024 human approval`. Production and App Store submission require later gates, including `T-072`.

## Completeness rule

A packet is invalid if it omits the task acceptance text, dependency evidence, owned lock zone, exact validation commands, prohibited fixes, rollback/abort instructions, or evidence destinations.
