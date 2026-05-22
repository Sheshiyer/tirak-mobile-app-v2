<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the Tirak Expo app. Here is a summary of every change made:

- **`utils/posthog.ts`** (new) — PostHog client singleton configured via `expo-constants` extras. Reads `POSTHOG_PROJECT_TOKEN` and `POSTHOG_HOST` from environment variables at build time.
- **`app.config.js`** (new) — Replaces static `app.json` as the Expo config entry point, forwarding `POSTHOG_PROJECT_TOKEN` and `POSTHOG_HOST` env vars into `Constants.expoConfig.extra`.
- **`.env`** (new) — Contains `POSTHOG_PROJECT_TOKEN` and `POSTHOG_HOST` values (gitignore coverage ensured).
- **`app/_layout.tsx`** — Added `PostHogProvider` wrapping the entire app tree and a `useEffect` in `RootLayoutNav` for manual screen tracking via `posthog.screen(pathname, params)` on every Expo Router navigation.
- **`app/auth/login.tsx`** — On successful login: calls `posthog.identify()` with email + first login date, then captures `user_logged_in`. On error: captures `$exception`.
- **`app/auth/register.tsx`** — On successful registration: calls `posthog.identify()` with name, email, user type, and registration date, then captures `user_registered`. On error: captures `$exception`.
- **`stores/auth-store.ts`** — At the start of `logout()`: captures `user_logged_out` and calls `posthog.reset()` to disassociate the session from the identified user.
- **`app/companion/[id].tsx`** — Fires `companion_profile_viewed` in a `useEffect` once companion data loads, capturing companion ID, name, location, and rating.
- **`components/booking/BookingWizard.tsx`** — Fires `booking_started` when the wizard mounts with a companion ID; fires `booking_step_completed` (with step number and label) on each `handleNext` call.
- **`components/booking/steps/BookingSummaryStep.tsx`** — Fires `booking_submitted` after the booking API call succeeds, capturing booking ID, companion ID, service name, total amount, payment status, and duration.
- **`app/supplier/requests/[id].tsx`** — Fires `booking_request_accepted` on successful supplier acceptance; fires `booking_request_declined` immediately when the decline flow is triggered.
- **`app/(app)/search.tsx`** — Fires `search_performed` with an 800 ms debounce whenever a non-empty search query or filter is active, capturing query text, category, location, and filter state.
- **`app/supplier/signup/index.tsx`** — Fires `supplier_signup_started` when the supplier taps "Start Registration".
- **`app/supplier/subscription/index.tsx`** — Fires `subscription_plan_upgraded` (with from/to plan and direction) on upgrade/downgrade; fires `subscription_cancelled` on cancellation.

## Events

| Event | Description | File |
|---|---|---|
| `user_logged_in` | Fired when a user successfully logs in with email and password | `app/auth/login.tsx` |
| `user_registered` | Fired when a new user successfully completes registration | `app/auth/register.tsx` |
| `user_logged_out` | Fired when a user logs out; also resets PostHog identity | `stores/auth-store.ts` |
| `companion_profile_viewed` | Fired when a customer views a companion's profile — top of the booking funnel | `app/companion/[id].tsx` |
| `booking_started` | Fired when the booking wizard mounts with a companion ID | `components/booking/BookingWizard.tsx` |
| `booking_step_completed` | Fired each time the user advances to the next step in the booking wizard | `components/booking/BookingWizard.tsx` |
| `booking_submitted` | Fired when the customer confirms and submits a booking request | `components/booking/steps/BookingSummaryStep.tsx` |
| `booking_request_accepted` | Fired when a supplier/companion accepts a pending booking request | `app/supplier/requests/[id].tsx` |
| `booking_request_declined` | Fired when a supplier/companion declines a pending booking request | `app/supplier/requests/[id].tsx` |
| `search_performed` | Fired when a customer executes a companion search (query + filters applied) | `app/(app)/search.tsx` |
| `supplier_signup_started` | Fired when a supplier begins the multi-step onboarding flow | `app/supplier/signup/index.tsx` |
| `subscription_plan_upgraded` | Fired when a supplier upgrades or downgrades their subscription plan | `app/supplier/subscription/index.tsx` |
| `subscription_cancelled` | Fired when a supplier initiates subscription cancellation | `app/supplier/subscription/index.tsx` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics dashboard](/dashboard/1609873)
- [Booking Conversion Funnel](/insights/FOFL5V60) — Drop-off from profile view → booking started → booking submitted
- [New Registrations & Logins Over Time](/insights/wBsxCsla) — Daily user acquisition and engagement trends
- [Booking Requests: Accepted vs Declined](/insights/BDG8AZ5r) — Supplier response rate over time
- [Companion Search Activity](/insights/NK2ODzMW) — Volume of traveler searches
- [Supplier Signup & Churn](/insights/ZiVWXnMX) — Weekly supplier pipeline vs cancellations

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/integration-expo/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
