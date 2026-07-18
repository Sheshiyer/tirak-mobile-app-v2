# Tirak Main App Scope

Last updated: 2026-07-18

## Product Boundary

The Tirak main app is a Travel marketplace for named, itinerary-based guided activities in Thailand. It does not provide dating, companionship, escort, adult, romantic matching, social discovery, or payment for a person's time or company.

The `Private` category and the earlier person-first marketplace specification are retired. Supplier operations belong in a separately reviewed supplier product; they are not a traveler-facing discovery mode in the main app.

## Purchasable Unit

The only purchasable unit is a **guided experience** with:

- Activity title and category
- Travel or cultural outcome
- Itinerary or route
- Destination and meeting point
- Date, start time, and duration
- Group size and accessibility details
- Inclusions and exclusions
- Total experience price in THB
- Cancellation and refund terms
- Responsible local guide and service reviews

Guide profiles provide credentials and trust signals for their listed experiences. A guide profile is never independently bookable.

## Traveler Flow

1. **Explore** — Browse named experiences by destination, activity, date, language, duration, and accessibility.
2. **Experience details** — Review itinerary, inclusions, total price, cancellation terms, and guide credentials.
3. **Booking request** — Select a specific date and supply group and accessibility details.
4. **Await confirmation** — Tirak persists the request as `pending`; payment and chat are unavailable.
5. **Guide confirmation** — The guide accepts the dated itinerary; status becomes `confirmed`.
6. **PromptPay checkout** — Tirak creates a booking-bound Omise charge using a server-derived THB total.
7. **Payment verification** — Tirak independently verifies the charge before marking the booking `paid`.
8. **Logistics chat** — Booking-scoped chat is available for meeting point, timing, dietary, accessibility, language, and itinerary details.
9. **Completion and review** — The traveler reviews the delivered guided service.

## Main Navigation

- Explore
- Saved experiences
- Bookings
- Messages for eligible bookings
- Profile and support

There is no people-discovery tab, “available now” people list, general chat, supplier network, or retired category route.

## Supported Categories

- Culture and heritage
- Food and drink tours
- Markets and neighborhoods
- Cooking and craft workshops
- Nature and outdoor activities
- Wellness activities with a defined service scope
- Arts, museums, and architecture
- Family-friendly activities
- Ticketed local events with a defined itinerary

## Language System

Use: traveler, local guide, guided experience, itinerary, experience price, booking request, confirmed booking, meeting point, booking chat.

Do not use as product language: companion, date, hangout, vibe matching, human connection, friendship, paid company, hourly person rate, available tonight, direct cash payment, adult, escort, or `Private` as a category.

## Payment Boundary

PromptPay is used only for the confirmed real-world guided experience. The app sends only the booking identifier and payment method. Amount and currency are server-authoritative. Secret keys and raw card details never enter the Expo client.

Subscriptions and digital feature unlocks are outside this PromptPay rail and outside this release scope.

## Safety Boundary

- Listings and reviews are reportable.
- Users can block abusive accounts.
- Support contact information is published.
- Chat is tied to a booking and constrained to logistics.
- Service reviews follow completed bookings.
- Payment and booking state transitions are auditable.

## Release Gate

Every screen, fixture, locale, screenshot, notification, email, legal page, and App Store field must make the named itinerary—not access to a person—the product.
