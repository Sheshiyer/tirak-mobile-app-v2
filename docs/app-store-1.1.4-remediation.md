# Tirak App Store Guideline 1.1.4 Remediation

Last updated: 2026-07-18
Submission: `e9ae59e6-a4df-4ac8-b003-87e9ff9ab523`
Reviewed build: 1.0.0 (8) (16)
Review date: 2026-07-15
Review device: iPad Air 11-inch (M3)

## Executive Finding

Apple rejected the app under Guideline 1.1.4 because the product appeared to encourage or facilitate compensated dating or companionship. The rejection is understandable from the reviewed product model.

The problem was not limited to one word. Tirak combined a person-first discovery flow, personality-led profiles, availability and rates, chat before a concrete booking, a retired `Private` category, direct-cash instructions, and sample “date” content. The supplied wiki explicitly described paid human connection, genuine hangouts, vibe matching, friendship, and travelers booking a person. Together those elements made the purchased object appear to be access to a person even where some labels said “guide” or “experience.”

The remediation therefore changes the product structure, source of truth, language, fixtures, payment boundary, and reviewer evidence. A rebuttal without those changes is not sufficient.

## Why the Original Reply Did Not Resolve the Issue

The July 15 reply said Tirak was a guided-travel marketplace, but the reviewed interface could still communicate a different model. App Review evaluates the binary and the reachable journey, not the team’s intended interpretation.

Copy risk and structural-flow risk are distinct:

- **Copy risk:** `Private`, companion, date-themed fixtures, direct cash, human connection, and person/time language.
- **Structural risk:** browse people → compare personality and availability → chat → choose time → compensate that person.

Changing “companion” to “local guide” does not neutralize the second sequence. The safe structure is browse a named experience → inspect itinerary and credentials → request a date → guide confirms → pay Tirak for that real-world service → use booking-scoped logistics chat.

Direct-cash language amplified the issue because “pay directly to your guide” made the transaction look like compensation to an individual. Tirak checkout must instead identify the named guided experience, booking, total, and marketplace receipt.

## Conflicting Source of Truth

The supplied `wikiv2-tirakapp` repository was a root cause, not merely stale documentation. Its former foundation called Tirak a companion-first marketplace and promoted human connection, genuine hangouts, personality matching, pre-booking chat, friendship, and provider-controlled rates.

The governing wiki documents dated 2026-07-18 now define Tirak as an experience-first guided-travel marketplace. Older audience and generated campaign documents are explicitly historical and are not approved for publication or release content until regenerated. They must not be linked from App Store review notes.

## Current Traveler Flow

1. The traveler opens **Explore** and sees named guided experiences.
2. The traveler filters by destination, activity, date, duration, language, accessibility, or group format.
3. The traveler opens an experience and reviews itinerary, route, meeting point, duration, inclusions, exclusions, total price, cancellation terms, and guide credentials.
4. The traveler requests that experience for a specific date and start time.
5. Tirak persists a `pending` booking; no payment or general chat is available.
6. The local guide accepts or declines the dated itinerary.
7. A `confirmed` booking becomes eligible for PromptPay checkout.
8. Tirak derives the amount from the server-side booking and creates a booking-bound Omise charge.
9. The traveler scans the PromptPay QR; Tirak independently verifies payment before marking the booking paid.
10. Booking chat opens for meeting-point, timing, accessibility, dietary, language, group, and itinerary logistics.
11. After delivery, the traveler reviews the guided experience.

## Current Local Guide Flow

The guide operational surface is governed separately from traveler discovery:

1. Complete identity and service-provider onboarding.
2. Create a named guided activity with itinerary, location, duration, inclusions, exclusions, group size, accessibility, total price, and cancellation terms.
3. Submit the listing for marketplace review.
4. Receive a dated booking request for that experience.
5. Accept only when the listed itinerary can be delivered at the requested date and time.
6. Coordinate practical details inside the booking.
7. Deliver the listed travel service.
8. Mark service completion; payout operations remain separate from the traveler-facing flow and this PromptPay release.
9. Receive a service review tied to the completed booking.

The main traveler app does not expose a supplier network, people search, open availability feed, or general-purpose person-to-person messaging.

## Enforced Product Boundaries

- Booking creation requires an explicit service/experience identifier; the API no longer silently chooses the first guide service.
- Only the assigned guide can move a pending request to `confirmed`; a traveler cannot self-confirm to unlock payment or chat.
- Each chat room belongs to exactly one confirmed or in-progress booking, and participants are derived from that booking.
- The legacy general-conversation API and unscoped presence WebSocket are not mounted in the release Worker.
- A stored paid/completed payment state survives booking serialization and cannot be replaced with a default pending value.
- Supplier onboarding submits a guide application and does not sell a subscription or digital unlock.

## Retired Surfaces

- The `Private` category in home, filters, locales, fixtures, campaigns, and screenshots
- Dating, companionship, adult, romantic, escort, or social-discovery framing
- Person-first browsing as the primary commerce path
- “Chat now” before a booking exists
- “Available now/tonight” person discovery
- Open-ended hourly-person pricing
- Direct cash payment to an individual
- “Evening Dinner Date” and similar sample content
- Friendship, chemistry, vibe, loneliness, or connection as a paid outcome
- Main-app links or promotion for any separate adult/private product

## Reviewer Test Script

Prepare one traveler review account with a pre-seeded `confirmed` unpaid booking and a separate pre-seeded paid booking. Put credentials and booking identifiers only in App Store Connect. This lets App Review inspect both the QR flow and the verified paid state without a Thai banking app; do not ship a reviewer-only payment bypass.

1. Open **Explore** and confirm the first screen is organized around activity cards.
2. Open **Chinatown Street Food Walk** or another named experience.
3. Inspect the itinerary, meeting point, duration, inclusions, exclusions, total price, cancellation terms, guide credentials, and completed-service reviews.
4. Start a new dated request and verify the resulting state is **Awaiting guide confirmation** with no payment or chat CTA.
5. Open the pre-seeded confirmed booking and verify the experience title, itinerary, date, total, and **Pay for this experience** CTA.
6. Open PromptPay checkout and verify the QR belongs to that booking and that no card details or editable amount are requested.
7. Open the separate pre-seeded paid booking and verify that only its server-verified record shows **Paid**.
8. Open booking chat and verify the helper text and sample exchange concern meeting point and itinerary logistics.
9. Open report, block, support, privacy, cancellation, and legal pages.
10. Search navigation and filters and verify there is no retired category, people-discovery mode, or general chat.

## App Review Reply Draft

Hello App Review Team,

Thank you for identifying the concern under Guideline 1.1.4. We reviewed the full product flow and agree that the earlier build could be interpreted as compensated companionship because discovery was too profile-led and some legacy language and payment instructions did not make the purchased travel service sufficiently clear.

We have changed the product rather than relying only on an explanation. The submitted build now begins with named guided experiences and a defined itinerary. Guide information appears as credentials for that activity and is not independently bookable. A traveler must request a specific experience, date, and start time; the guide must confirm that itinerary before payment becomes available. Tirak then collects payment for the confirmed real-world guided travel service. Chat is available only in the booking context for meeting-point, timing, accessibility, dietary, language, and itinerary logistics.

We removed the former `Private` category, direct-cash instructions, person-first booking prompts, pre-booking general chat, date-themed sample content, and compensated-companionship language. The app does not provide dating, companionship, escort, adult, romantic matching, social discovery, or payment for a person’s time or company.

Please follow the review path in the App Review Notes. If any specific screen still creates a different impression, please identify it and we will address it immediately.

Thank you,
Tirak Team

## Binary-Wide Release Gate

- App source, locale bundles, fixtures, deep links, notifications, emails, legal pages, and backend seed responses pass the prohibited-language and retired-category scan.
- Store metadata, screenshot captions, review notes, age rating, privacy answers, category, and support links match the submitted binary.
- Activity imagery dominates screenshots; portraits appear only as guide credentials within experience context.
- Pending bookings expose neither payment nor chat.
- Confirmed bookings name the itinerary and server-authoritative total.
- PromptPay cannot buy subscriptions, digital features, gifts, tips, or open-ended person time.
- The review account plus separate confirmed-unpaid and paid seeded bookings work on the exact review backend without a Thai banking app.
- The latest archive is tested on iPhone and iPad-compatible presentation before submission.

## Residual Work Outside This Code Review

App Store Connect fields, uploaded screenshots, remote CMS/listing data, push/email systems, support URLs, and production test credentials cannot be proven from this repository alone. The release owner must audit those live artifacts before resubmission. An `indeterminate` payment attempt after an ambiguous provider outcome deliberately fails closed; operations needs a reconciliation runbook before live rollout so support can identify and recover the exact charge without issuing a second one. The historical D1 migration chain also has overlapping legacy `004_*` schemas, so production requires a backup, target-schema preflight, and migration dry run before the new payment and booking-scoped chat migrations are applied.
