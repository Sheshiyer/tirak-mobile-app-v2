# T-008 Baseline Verifier Evidence

Status: automated integrity verification passed; human approval remains pending

Verified: `2026-07-18T21:19:38Z`

## Verifier identity

| Artifact | Identity |
| --- | --- |
| verifier commit | `5a4bf9fef3679cb90218fed2b253879be05488b3` |
| verifier tree | `c7f8eaf9a9f69312639d3387fce28b6eac9a770e` |
| `scripts/release/verify-baseline-manifest.mjs` SHA-256 | `e7c4bc1d59aad1976e299b4471bb459f592c7061b4f1dbf0b9c28a1b781cf264` |
| `package.json` SHA-256 | `b2e6fd2439bf8e038a5b2e456eb7cb1fe34fa34553463ba8c205a8a478903be4` |

## Command

```sh
npm run release:verify-baseline
```

## Passing assertions

- All three repositories are on their declared Phase 1 baseline branches.
- Each baseline commit exists, has the declared parent and tree, and is an ancestor of the current branch.
- Each parent-to-baseline binary diff reproduces the manifest SHA-256.
- Seven evidence/control files reproduce from their baseline Git objects and match the manifest hashes.
- Manifest commit `c1a059f5d7c1c2e804deb3ef38c794b09efae47c` has the declared tree and artifact hash and remains an ancestor of mobile HEAD.
- The frozen plan contains 80 unique, twelve-field tasks and 145 resolved prior-only dependency edges.
- Backend and wiki snapshots are clean.
- All fifteen mobile exclusions match their file hashes and byte-sorted aggregate hash.
- Mobile status contains exactly the fifteen declared exclusions and no tracked or undeclared change.

## Result

```json
{
  "status": "PASS",
  "gate": "T-008 pre-approval recovery baseline",
  "evidenceFiles": 7,
  "exclusions": 15,
  "planTasks": 80,
  "dependencyEdges": 145,
  "humanApproval": "PENDING"
}
```

## Negative bootstrap proof

Before the verifier was committed, the same command exited nonzero because `package.json` and the verifier itself were undeclared working-tree changes. The first implementation also exposed a collation mismatch: JavaScript `localeCompare` did not reproduce the byte order used by the original `sort -z` manifest producer. Replacing it with `Buffer.compare` reproduced the committed aggregate hash. A strict post-commit run then passed.

This evidence strengthens the recovery packet; it does not satisfy the separate human-approval condition in `T-008` and authorizes no fanout, GitHub publication, staging, or deployment.
