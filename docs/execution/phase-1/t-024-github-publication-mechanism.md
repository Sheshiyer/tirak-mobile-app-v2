# T-024 GitHub Publication Mechanism

Status: **IMPLEMENTED AND LOCALLY VERIFIED — REAL GITHUB MUTATION NOT EXECUTED**

## Purpose

`scripts/release/publish-phase1-github.mjs` safely projects the frozen Phase 1 map into the authenticated `Sheshiyer/tirak-mobile-app-v2` repository after the recorded T-024 approval. It creates or reuses 58 labels, five milestones, and 80 issues. Default invocation is a zero-network dry-run.

## Safety boundary

Real publication requires all of the following:

1. the exact `APPROVED_HUMAN_T024` manifest and approval statement;
2. `--execute` plus `--confirm T-024_APPROVED_GITHUB_PUBLICATION`;
3. the exact `--repo Sheshiyer/tirak-mobile-app-v2` identity;
4. an exact matching `origin` remote;
5. authenticated GitHub CLI access whose repository API returns the same canonical identity;
6. an unchanged plan-derived issue-map projection;
7. a complete, non-ambiguous map state.

Before its first mutation, the publisher retrieves every existing label, open and closed milestone, and issue/PR. Case-only label or milestone collisions, duplicate names, duplicate task IDs, mismatched stable task titles, task-ID pull requests, malformed pagination, wrong repository identity, and API failures terminate nonzero. Stable `[T-NNN]` issue identities are reused, and only drifted known issues are updated. Unrelated human-added issue labels are preserved. The map is atomically replaced only after all GitHub operations succeed.

## Commands

Safe local plan, with no GitHub API calls:

```bash
npm run release:github:plan
```

Local fake-provider and negative verification:

```bash
npm run release:verify-github-publisher
```

Authorized real publication is deliberately incomplete unless the operator adds the exact confirmation:

```bash
npm run release:github:publish -- --confirm T-024_APPROVED_GITHUB_PUBLICATION
```

This implementation task did **not** run the real publication command. It performed no push, deployment, production access, live Omise operation, or App Store mutation.

## Verification result

- Dry-run: 58 labels, five milestones, 80 issues, zero GitHub API calls.
- Fake-provider first run: 58 labels, five milestones, and 80 issues created.
- Idempotent fake-provider rerun: all 143 objects reused with zero POST/PATCH operations.
- Seven negative fixtures reject missing approval, wrong CLI repository, missing confirmation, partial map state, API failure, authenticated repository mismatch, and stable task-title collision.
- TypeScript, 8/8 Jest suites, 47/47 tests, scaffold verification, secret scan, and `git diff --check` pass.

## Recovery and idempotency

Remote objects are detected before mutation. If an API call fails after an earlier creation succeeded, the local map remains unchanged; the next invocation rediscovers that exact stable object and safely resumes. If discovery finds more than one candidate or a stable ID with a different title, it refuses to guess. A fully published rerun reuses every object and performs zero POST/PATCH calls when remote state already matches.
