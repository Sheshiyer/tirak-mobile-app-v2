# Core connected mobile QA candidate

This source connects the individual-guide wizard to the Core application API and preserves an immutable original payload/UUID for uncertain retries. Receipt, application status and private evidence are recoverable. Application approval provisions a pending guide account and 30-day trial; account activation, profile verification and service publication remain separate steps.

Bookings retain their original attempt and key. Conflict recovery requires an explicit user choice rather than automatic resubmission. An absent booking receipt displays No booking available and emits no success animation, sound or haptic. Confirmation/completion does not imply payment; Core payment integration remains disabled.

Owner and public experience pagination carry the actual page/limit contract. Account switching cancels in-flight queries and clears scoped data before a new identity renders. Test identity is not inferred from a display name. A visible QA badge identifies the isolated Core environment.

The core-qa EAS profile explicitly targets the dedicated Core QA API, channel core-qa, version 1.5.3 and runtime 1.5.3-core-qa. The wired eas-build-post-install hook validates that environment and stamps narrow native marketing/runtime fields while preserving remotely assigned build numbers, signing, APNs and update-channel wiring. Local proof exports are excluded from Git and EAS inputs.

Parent verification passed TypeScript and 452 tests across 40 suites. An actual production iOS Metro/Hermes export with dotenv disabled and explicit QA public variables produced a 9,909,346-byte bundle, SHA-256 6566c5ae1a86519a51fc81dbf38d5e4d4887d62f6a79aea5a0e24787015f9f9c. Inspection confirms the dedicated QA API URL and environment marker in emitted code. Native fixture tests preserve build numbers/APNs while applying the hook. This establishes source/bundle proof, not a signed build, hosted journey or physical-device acceptance. Those remain release gates.
