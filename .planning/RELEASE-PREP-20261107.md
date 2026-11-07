# Core client preparation — 7 November 2026

## Reconciliation

The isolated branch starts from Core `fae29c2`. Remote main was freshly read as `05c6b03`. Merge `e5f0ac0` retains its deliberate deletion of both GitHub workflows, explicitly resolving the `eas-update.yml` modify/delete conflict to deletion. Hero-only cherry-pick `77f0166` carries `b6ea256` without the held payment line.

The old pickup documents are preserved byte-for-byte under `archive/2026-11-07-previous-pickup/`. Current pickup refers to the container ISA and Core Spec Kit. No replacement local-job execution is inferred from workflow deletion.

## Verification

The combined local integration tree passed TypeScript and all 633 Jest tests across 81 suites. Focused release configuration passed 12 tests; seven date, booking and chat suites passed 61 tests in both Bangkok and Los Angeles time. An obsolete retired-workflow assertion was replaced with direct production/release-apk gate coverage.

The first export attempt used an unsupported external output path. An ignored in-project output path then exposed Metro dependency-symlink resolution. These are tooling attempts, not completed export/visual evidence. Final export, visual and hash verification will bind to the separate sanitized publication commit after private receipts are excluded from its history. The coordinator retains the private mapping and final verification receipt.

## Broader release work still required

- Produce a separately authorized signed Android candidate and PWA deployment/export from the final prepared commit.
- Record exact source and artifact hashes; app version, Android version code, package, API origin, runtime and update channel; signing continuity and Play/deployment identity.
- Existing app version is 1.5.4. EAS uses remote app-version sourcing and production auto-increment; do not claim a future build number or reuse build 18 evidence for the broader source.
- Verify Android timezone booking, booking-specific chat, terminal history, keyboard/insets and notification links on that signed artifact; verify the matching hosted PWA and operator record.
- Retain owner physical build 18 birth-date acceptance separately. No Tirak installation or testing occurred in the skipped Play Store emulator flow.

No EAS build, OTA, deployment, store action, account/provider change, migration, payment enablement or support delivery is performed by this source preparation.
