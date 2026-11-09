# Tirak Core Android and PWA release preparation

Updated 7 November 2026. This repository owns the shared Android/PWA client. The enclosing Tirak container's `ISA.md` owns acceptance; `.planning/specs/001-tirak-core-stability/` records the accepted Core scope.

## Current outcome

Prepare one reviewable client source that preserves the signup birth-date release fixes and the broader Core booking, chat, guide and notification corrections, adds the rescued guide hero, and retains the deliberate migration away from GitHub Actions. This package does not promote a runtime or create a signed release.

## Connected journeys

- Guides can manage their own unpublished profile and Thailand availability; public discovery remains eligibility-aware and distinguishes empty results from failures.
- Cash booking requests retain their Thailand schedule and history. Chat/calendar actions require confirmed or in-progress status.
- Chat resolves the selected booking, including a second trip between the same people. Terminal rooms keep history read-only.
- Signup starts with a blank birth date, accepts valid pre-1970 dates and preserves the selected calendar day in signup and profile editing.
- Notifications refresh truthful state and open the matching booking. Public reporting cannot display success without a persistence contract.

The API must supply the compatible booking/chat, eligibility and operator contracts before dependent client publication. Shared admin and website source preparation is coordinated separately.

## Acceptance and release evidence

The scoped Android signup source `f0579b2` produced build 18 in Play Internal testing; the owner performs its physical birth-date flow. Scoped PWA `7f446ee` is live. Those releases carry the date correction and do not establish broader Core acceptance.

The new Play Store emulator flow was skipped: no Tirak installation or test is claimed there. Earlier disposable Core browser/debug-emulator evidence retains its own source/runtime scope.

Broader client release still needs exact artifact hashes, runtime and channel identity, signing continuity, store/deployment readback and connected acceptance. ISC-66, ISC-68, ISC-174 and ISC-326.2 remain governed by their own evidence in the container ISA.

Historical pickup documents and private release receipts remain preserved in the separate recovery worktree; the PromptPay phases remain held history. Payment/provider activity, support delivery, campaign writes and public store actions require their existing owner decisions.
