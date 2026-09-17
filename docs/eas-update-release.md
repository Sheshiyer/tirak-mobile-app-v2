# Expo OTA release guide

Tirak uses EAS Update channels that match its native build profiles. The app is linked to the existing EAS project ID in `app.json`; do not run `eas init` or replace that ID unless the Expo project is intentionally migrated again.

This repository uses Bun as its package manager. `bun.lock` is authoritative; the former npm lockfile was removed so GitHub Actions and EAS Build cannot infer conflicting package managers.

| Build profile | Update channel | Review mode | PromptPay |
| --- | --- | --- | --- |
| `development` | `development` | off | off |
| `preview` | `preview` | off | off |
| `review` | `review` | on | off |
| `production` | `production` | off | off |

The fingerprint runtime policy prevents an update from loading on a binary whose native dependency/config fingerprint differs. Installing or changing native modules still requires a new EAS Build before publishing updates for that runtime.

This repository checks in `ios/` and `android/`, so the update URL, enabled flag, and fingerprint sentinel are mirrored in the native Expo configuration. Keep those native values aligned with `app.config.js` if the EAS project is migrated.

## One-time GitHub setup

1. In the Expo account that owns the configured EAS project, create a robot or personal access token with only the access needed to publish updates.
2. Add it to the GitHub repository as the Actions secret `EXPO_TOKEN`.
3. Confirm the repository default branch is `main` and protect it with the `Mobile CI` check.
4. From a trusted local session, run `bunx eas-cli project:info` and confirm the returned project ID matches `app.json`.

No Expo credentials belong in source, workflow inputs, logs, or `EXPO_PUBLIC_*` variables.

## Build before updating

Each installed binary only follows the channel embedded by its build profile. Create a new binary after this configuration change and whenever the runtime fingerprint changes:

```bash
bunx eas-cli build --profile preview --platform ios
bunx eas-cli build --profile review --platform ios
bunx eas-cli build --profile production --platform ios
```

Publishing an OTA update does not submit a binary to App Store Connect.

## Publish through GitHub

Open **Actions → Publish EAS Update → Run workflow**, select `preview`, `review`, or `production`, and optionally enter a short release-note prefix. The workflow always runs typechecking and the full Jest suite first. It adds the selected Git ref and full commit SHA to the EAS update message.

Production publishing is rejected unless the workflow is dispatched from `main`. The review channel always compiles with review mode on; preview and production compile with it off. PromptPay remains disabled on all three OTA channels until the separately controlled payment release gate is approved.

Start with `preview`, install the matching preview binary, and validate the customer and provider paths. Then publish the same reviewed commit to `review` for the App Review build or to `production` for production binaries. EAS updates cannot cross runtime fingerprints, so a native change may require separate publishes after each new build is installed.

## Rollback

Use the Expo dashboard or EAS CLI to republish a previously verified update to the affected channel. Record the affected channel, update group, commit SHA, reason, and verification result in the release notes. Do not use a production rollback to bypass the `main`-branch guard.
