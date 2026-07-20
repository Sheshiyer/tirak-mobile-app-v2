# Independent Validator Packet — `<TASK_ID>`

## Independence

The validator did not author the implementation under review. Validate the committed artifact against the exact plan acceptance text, `tirak-payments-v1`, lock ownership, evidence matrix, and environment identity.

## Validation sequence

1. Read the task row, dependency evidence, executor packet, diff, and handoff.
2. Confirm the commit descends from the approved base and touches no path outside the owned lock zone.
3. Run every named positive command; record command, exit code, and output.
4. Run every named negative fixture and prove the gate exits nonzero.
5. Read back config, schema, routes, units, and state mappings rather than trusting prose.
6. Check built or deployed artifacts when the task claims runtime behavior.
7. Re-run the prohibited-content, secret, drift, and `git diff --check` gates.
8. Confirm rollback or abort evidence is executable and target-specific.

## Verdict

- `PASS`: all acceptance clauses have direct evidence and no contract drift exists.
- `CONCERNS`: only owned, non-critical, time-bounded risks remain and the required human owner accepts them.
- `FAIL`: any missing evidence, false success, target ambiguity, contract drift, unsafe content, payment-truth error, or forbidden fix.

The validator may not convert missing external proof into a pass. Record the named deferred task or fail the current gate.
