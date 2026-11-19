# Tirak mobile and PWA

Read `.planning/PROJECT.md` and `.planning/STATE.md` for the current Core release-preparation scope. The enclosing Tirak project container's `ISA.md` owns acceptance; its `.planning/specs/001-tirak-core-stability/` packet owns the finite Core milestone.

Work in an isolated branch/worktree. Preserve concurrent changes, signed-release sources, recovery snapshots and historical worktrees. Use the existing scoped CLI profiles and verification tools. Existing local-job migration is intentional: do not restore retired GitHub Actions or infer a passing job from their removal.

The current package prepares source and local evidence for review. Coordinate pushes, draft PRs and backlog writes through the main coordinator. Deployment, migration execution, EAS builds/OTAs, store actions, provider/account changes, payment enablement and support delivery retain separate owner gates.

Keep native runtime identity and session pool unchanged. Alchemy describes the work; it does not choose another model. Read a specific source or skill on demand; no operating-mode prompt or startup protocol is required.

Historical PromptPay material under `.planning/phases/` is held context; private receipts and old pickup packets remain in the separate recovery worktree. It is not the current roadmap or execution authority. Keep source tests, disposable browser proof, hosted artifacts, signing/channel evidence and owner physical acceptance distinct.

# Agent operating contract

Repository: `tirak-mobile-app-v2`

<!-- temperance:project-rail:start -->
## Temperance project rail

This repository is registered with **Temperance Engine** as a project rail.
Host runtime (models, OmniRoute, OpenCode plugins) lives under `~/.temperance_engine`
and `~/.config/opencode`; this repo owns planning and acceptance.

| Concern | Authority |
|---|---|
| Models / failover / budgets | Host OmniRoute + temperance combos |
| Planning spine | `.planning/` (GSD) + `temperance-next-wave` |
| Human roadmap | one GitHub Project per repo (`temperance-gh-plan`) |
| Acceptance | `ISA.md` when present |
| Session loop | `/gsd:goal` → `.temperance/goal.json` (not a second planner) |
| Handoff (if present) | `.project/HANDOFF.md` |
| Parallel execute | `noesis-execute` / `temperance-batch` |

`/gsd:*` binds the mode. A card only on a bare first prompt with no saved session/cwd mode.

### Auto next-wave

When an agent session starts in this cwd, enrich injects `dispatch: NEXT-WAVE …`.
The injected next-wave is a proposal only. Do not dispatch until a matching
approval receipt has been atomically claimed by the swarm control ledger.

```bash
temperance-next-wave --cwd .
temperance-project-init --cwd . --check
manifest-bridge init --cwd .
manifest-bridge sync --cwd .
temperance-swarm-dispatch --request .planning/swarm-claim.json --dry-run
```

Manifest: `.temperance/project.json` (schema temperance.project.v1)
<!-- temperance:project-rail:end -->

