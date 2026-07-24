# T-030 Runbook Drafting — Orchestrator Plan (Temperance Engine Algorithm flow)

Prepared: 2026-07-24 · Mode: agent swarm

## Observe ✅
- T-029 runbook pattern absorbed (`t-029-rehearse-migration-008-runbook.md`).
- GitHub research: issue #30 (mobile-app-v2), PR #19 OPEN (evidence branch-only), 010/011 DDL inventory, contract surface `target-schema.sql` lines 48–107, `verify-lineage.mjs` ledger rules, fingerprint successor `3b57299a…f7cc`.
- Local research: ISA W2.1 ledger, swarm plan line 280, issue map, branch-worktree manifest, lessons.md chat-schema lesson, T-026 credential/recovery pattern.

## Think — decisions baked into the runbook
1. **009→010 renumbering:** issue #30 title / manifest branch / ISA ISC-153 say "009"; the quarantined `009_booking_scoped_chat.sql` is forbidden. Runbook rehearses `010_booking_chat_expansion.sql` and states the mismatch explicitly.
2. **011 scope amendment:** owner approved 2026-07-24 ("yes proceed") → 011 folded into T-030's disposable target; recorded as the one-line kickoff amendment; acceptance mapping extended with restitution uniqueness + lifecycle-CHECK probes.
3. **Fingerprint:** Stage A expects `3b57299a2a7cadc048243a18aeae8cc6d568b548eacf3edcfaa5ddbc24eef7cc`; pre-flight human re-confirmation gate retained (fingerprint may shift again after PR #19 merge).
4. **PR #19 unmerged:** Stage 0 requires PR #19 merged to main, else explicit branch-from-`9d334be` plan.
5. Rehearsal DB `tirak-t030-rehearsal` (APAC); isolated apply roots `rehearsal/t030/` (baseline root + lineage root with 008/010/011 only, quarantined unreachable).
6. Ledger expectation: exactly 4 rows — baseline, 008, 010, 011 (010/011 sibling order flexible, 008 must precede both).

## Build
- Worker `Writer_T030_Runbook` (coder): draft `docs/execution/phase-2/t-030-rehearse-migration-010-011-runbook.md` in the mobile repo, mirroring T-029 structure (0/A/B/C/D/E + 2 human gates + abort triggers + evidence closure).

## Verify
- Worker `Reviewer_T030_Gate` (plan): binary gate — structure parity with T-029, every hash/identifier verbatim-correct, acceptance→evidence mapping covers issue #30 + 011 amendment, no stale constants (52431d70…, "009"), gates/abort triggers complete.

## Learn
- Report drift register (stale 009 titles, ISA ledger gap, PR #19 merge dependency) to owner with the draft.
