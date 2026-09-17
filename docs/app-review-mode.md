# App Review Mode

App Review Mode is an explicit build variant for Apple review. It is disabled unless the build environment contains the exact value:

```text
EXPO_PUBLIC_REVIEW_MODE=true
```

Values such as `TRUE`, `1`, or an omitted variable remain disabled. The build also records the boolean in Expo `extra.reviewMode` for release inspection.

The `review` EAS profile sets this flag and explicitly disables the local PromptPay capability. The ordinary `production` profile does not enable review mode.

## Deterministic Accounts

| Role | Fixture key | Stable user ID | Password |
| --- | --- | --- | --- |
| Traveler | `customer` | `demo_customer_001` | None |
| Guide | `guide` | `demo_companion_001` | None |

The sign-in screen exposes both accounts only in an enabled review build. The Profile screen shows the same selector so a reviewer can move between traveler and guide views. Switching accounts clears the persisted booking draft, payment booking, selected payment method, charge, refresh token, and bearer token before the next identity becomes active.

These stable IDs belong to the isolated mobile review adapter. They are not production accounts or backend records. Do not attach production credentials, provider secrets, or personally identifiable test data to them.

The mobile review adapter defines `review_booking_bangkok_001`, linking the traveler and guide IDs to `review_experience_bangkok_001`. In an enabled review build, Explore shows the deterministic Guide, checkout creates that exact shared booking without calling the booking API, and the Bookings screen projects it for both roles. A traveler request is therefore visible to the guide, and a guide approval is visible back to the traveler. Outside review mode, booking screens continue to use the backend as their authority.

Fixture payment truth is explicitly authored by the isolated review adapter: cash, `not_charged`, and no provider charge ID. It is not presented as backend settlement truth, and switching roles cannot turn it into a successful electronic payment.

## Payment Review Path

PromptPay is fail-closed in review mode even when local development payment flags are also present. To inspect checkout without a real payment:

1. Open the Traveler review account.
2. Open Explore, choose the displayed Guide review profile, select an available date, and complete the booking details.
3. Select **Cash** on the payment step.
4. Review the booking confirmation. Cash is paid directly to the guide; no provider charge or QR payment is created.

For the two-role review path, after checkout open Bookings as the Traveler, switch to the Guide from Profile, approve that same request in Bookings, then switch back to the Traveler to see its confirmed state. The review booking remains cash / `not_charged`; it does not call the booking API or create a provider charge. Account switching intentionally discards any unrelated unfinished traveler draft.

## Release Check

- Use App Review Mode only for the review build profile.
- Keep `EXPO_PUBLIC_PROMPTPAY_ENABLED` unset for App Store review.
- Confirm Profile displays the version from Expo runtime configuration.
- Confirm non-review builds contain no review-account UI.
- Provide reviewer instructions in App Store Connect; never commit passwords or provider secrets.
