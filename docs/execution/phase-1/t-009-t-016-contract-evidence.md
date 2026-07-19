# T-009–T-016 Shared Contract Packet Evidence

Contract: `tirak-payments-v1`

Status: T-009–T-015 pass; T-016 awaits explicit human contract acceptance

## Immutable implementation points

| Repository | Commit | Tree | Parent-to-commit binary diff SHA-256 |
| --- | --- | --- | --- |
| mobile | `6f71cb29e973c61348cfaa42b63a45290760ccca` | `1834635c3fd043d40e65a9933c756c5e97b298c3` | `981e7d702a41a1dd7bd6965d2fcd3ffd15bc950e2e47f78ec3cf864889b8491c` |
| backend | `b6a418568088e5cb85cf5ba97240ff83b49382ad` | `b76398276cbe4a2bfc71a27d8ccbcf21efeb248f` | `7246751d264b26c5873e3b4fcc8d47df3ba6d90697188e76dcf942b09a5dd3f8` |

Exact artifact hashes are in `docs/contracts/tirak-payments-v1/contract-manifest.json`.

## Task evidence

| Task | Result | Direct evidence |
| --- | --- | --- |
| T-009 | PASS | four-route source audit; strict request schema; explicit `amountSatang`/`displayTotalThb`; legacy payment-method/history code removed; owned status and exact recovery tests |
| T-010 | PASS | table-driven attempt/restitution matrix; impossible restitution rejection; active/successful cancellation interlock; cancellation never changes provider truth or implies refund |
| T-011 | PASS | target schema applies to disposable SQLite; tables, columns, indexes, constraints, foreign keys, and permission matrix introspect cleanly |
| T-012 | PASS | documented target-ledger baseline/repair selector; raw legacy `004` and destructive `009` forbidden; additive booking-chat compatibility graph frozen |
| T-013 | PASS | test/staging/production resource-mode matrix; default-disabled Wrangler vars; key/mode and environment crossover tests; in-flight settlement remains enabled when creation is disabled |
| T-014 | PASS | mobile requires `tirak-payments-v1`, explicit units and THB; pending cannot pay/chat; confirmed failed can retry; processing blocks retry; restitution copy never says Omise refund |
| T-015 | PASS | reviewer fixture provenance covers seven ingestion surfaces, cache invalidation, source hashes, provider receipt, and paid-bypass denial; mobile/backend source tests pass |
| T-016 | PENDING HUMAN | manifest and blocker-ingestion crosswalk are complete; executor and automated validation acceptance pass; human contract acceptance remains required |

## Validation

- Backend `npm run typecheck`: PASS.
- Backend `npm test -- --run`: PASS — 10/10 files, 186/186 tests.
- Mobile `npx tsc --noEmit`: PASS.
- Mobile `npm test -- --runInBand`: PASS — 8/8 suites, 47/47 tests.
- T-008 `npm run release:verify-baseline`: PASS — immutable baselines and approval preserved after both contract commits.
- Staged secret scans and `git diff --check`: PASS before both commits.

## Signoff

- [x] Planner: contract contents match T-009–T-016 and retain the guided-experience-only commerce boundary.
- [x] Backend executor: payment, state, schema, migration, environment, and ingestion contracts implemented locally.
- [x] Mobile executor: checkout, booking state, restitution copy, and fixture provenance implemented locally.
- [x] Automated validator: all type, test, schema, route, state, config, provenance, secret, and whitespace checks pass.
- [ ] Human owner: accepts `tirak-payments-v1` as the shared implementation boundary for T-017–T-023.

This packet authorizes nothing by itself. T-016 remains open until the human owner accepts it; T-024 separately controls fanout, GitHub/worktrees, staging, and deployment.
