# App Store Connect Metadata — Tirak

Last updated: 2026-07-18

This copy is a release candidate. Confirm that the submitted binary and screenshots match it before use.

## App Name

`Tirak — Thailand Experiences`

## Subtitle

`Guided Local Experiences`

## Promotional Text

`Discover food, culture, market, craft, and city experiences with clear itineraries across Thailand.`

## App Description

Tirak is a marketplace for discovering and booking guided cultural experiences in Thailand.

EXPLORE BY EXPERIENCE

Browse named food walks, temple routes, market visits, cooking activities, neighborhood tours, arts experiences, and other itinerary-based activities. Each listing explains what you will do, where you will go, how long it takes, what is included, and the total experience price.

KNOW YOUR ITINERARY

Review the route, meeting point, duration, group format, accessibility information, inclusions, exclusions, cancellation terms, and service reviews before requesting a date.

VERIFIED LOCAL EXPERTISE

See the responsible local guide's identity, languages, relevant experience, and reviews for completed travel services. Guide information supports the listed activity; bookings are always for a specific guided experience.

CLEAR BOOKING STATUS

Submit a dated booking request and wait for the guide to confirm the itinerary. Secure payment becomes available only after confirmation. Use booking chat for practical details such as the meeting point, timing, dietary needs, accessibility, language preferences, and itinerary questions.

TRAVEL WITH SUPPORT

Tirak includes booking records, reporting and blocking controls, support contact information, payment status, and service reviews tied to completed bookings.

Tirak does not provide dating, companionship, escort, adult, romantic matching, or social-discovery services. Payments are for the named real-world guided experience, never for a person's time or company.

## Keywords

`Thailand travel,guided experience,food tour,temple walk,market tour,cooking class,Bangkok`

## Category

- Primary: Travel
- Do not add a secondary category unless its submitted content is independently reviewed.

## App Review Notes

Use this note only after the binary-wide release gate passes:

> Tirak is a Travel marketplace for specific guided cultural activities in Thailand. In this build, every booking begins from a named experience with an itinerary, destination, date, duration, inclusions, total service price, and responsible local guide. A guide profile supplies credentials for the listed service and is not independently bookable.
>
> The traveler requests a dated itinerary first. Payment is unavailable while the request is pending and becomes available only after the guide confirms that itinerary. Payment is collected by Tirak for the real-world guided travel service. Chat is tied to an existing booking and is labeled for meeting-point, timing, accessibility, dietary, language, and itinerary logistics.
>
> The current build contains no dating, companionship, escort, adult, romantic matching, social discovery, paid-company, general chat, or “available now” people-discovery feature. The former `Private` category and direct-cash flow have been removed.
>
> Review path: (1) open Explore, (2) select a named experience, (3) review its itinerary and guide credentials, (4) submit a dated booking request, (5) open the pre-seeded confirmed booking, (6) inspect the PromptPay QR without needing to complete a Thai-bank payment, (7) open the separate pre-seeded paid booking to inspect the verified paid state and booking-scoped logistics chat, and (8) review reporting, blocking, support, privacy, and cancellation controls.
>
> Test credentials plus the pre-seeded confirmed and paid booking identifiers are supplied privately in App Store Connect. No reviewer-only payment bypass is present in the production binary.

## Screenshot Plan

| Order | Screen | Required visual evidence | Caption |
| --- | --- | --- | --- |
| 1 | Experience discovery | Named activity cards; activity imagery dominates | Guided experiences across Thailand |
| 2 | Experience detail | Itinerary, duration, destination, inclusions | Know the plan before you request |
| 3 | Guide credentials | Credentials and languages below experience context | Local expertise for this itinerary |
| 4 | Pending booking | “Awaiting guide confirmation”; no pay/chat CTA | Request a specific date |
| 5 | Confirmed checkout | Experience title, server total, PromptPay | Pay Tirak for the confirmed experience |
| 6 | Booking chat | Meeting-point and itinerary conversation | Coordinate practical trip details |
| 7 | Safety/support | Report, block, support, cancellation | Clear support for every booking |

Do not submit screenshots whose dominant visual is a portrait carousel, people search, generic chat, hourly availability, romantic/nightlife imagery without a defined activity, or any retired category.

## Suggested Reply to the July 15 Rejection

Hello App Review Team,

Thank you for identifying the concern under Guideline 1.1.4. We reviewed the full product flow and agree that the earlier build could be interpreted as compensated companionship because discovery was too profile-led and some legacy language and payment instructions did not make the purchased travel service sufficiently clear.

We have changed the product rather than relying only on an explanation. The submitted build now begins with named guided experiences and a defined itinerary. Guide information appears as credentials for that activity and is not independently bookable. A traveler must request a specific experience, date, and start time; the guide must confirm that itinerary before payment becomes available. Tirak then collects payment for the confirmed real-world guided travel service. Chat is available only in the booking context for meeting-point, timing, accessibility, dietary, language, and itinerary logistics.

We removed the former `Private` category, direct-cash instructions, person-first booking prompts, pre-booking general chat, date-themed sample content, and compensated-companionship language. The app does not provide dating, companionship, escort, adult, romantic matching, social discovery, or payment for a person's time or company.

Please follow the review path in the App Review Notes. If any specific screen still creates a different impression, please identify it and we will address it immediately.

Thank you,
Tirak Team

## Submission Gate

- [ ] The tested archive is the same build uploaded to App Store Connect.
- [ ] Experience cards, not people cards, dominate discovery and screenshots.
- [ ] No retired category is reachable from navigation, filters, deep links, or fixtures.
- [ ] No pre-booking general chat or “available now” people discovery is reachable.
- [ ] Pending bookings expose neither payment nor chat.
- [ ] Confirmed bookings identify the experience and server-authoritative total.
- [ ] App copy, both locale bundles, mocks, legal pages, notifications, and emails pass the prohibited-language scan.
- [ ] Store name, subtitle, description, keywords, screenshots, review notes, age rating, privacy answers, and category all match the binary.
- [ ] Review credentials work on the review backend and include separate pre-seeded confirmed-unpaid and paid bookings, so a Thai banking app is not required.
- [ ] Privacy policy, support URL, terms, cancellation, reporting, and blocking controls are live.
