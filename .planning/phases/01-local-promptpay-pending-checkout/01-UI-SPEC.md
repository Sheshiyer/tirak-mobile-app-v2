---
phase: 01-local-promptpay-pending-checkout
status: approved-with-inline-review
approved_by: product-owner
approved_at: 2026-08-31
agent_verification: unavailable-missing-gsd-ui-agents
---

# UI Design Contract: Local PromptPay pending checkout

## Intent

Extend the existing Tirak traveler booking wizard without restyling it. Cash remains the stable default. PromptPay is an additive local-test method whose UI makes booking state, charge creation, and payment status visibly distinct.

## Scope

### Included

- Traveler booking steps 5 through 7 in `tirak-mobile-app-v2`.
- Local-only PromptPay capability, confirmed-booking eligibility, charge creation loading/error, and pending QR display.
- Method/status-aware confirmation copy.
- English and Thai payment strings introduced by this phase.
- iOS Simulator inspection at standard and large Dynamic Type.

### Excluded

- Tirak Plus, supplier signup, admin, and companion surfaces.
- Card, bank transfer, saved methods, history, refunds, and subscriptions.
- Polling, terminal status, indeterminate recovery, staging, production, deployment, credentials, and provider dashboards.

## Existing Design System

| Concern | Contract |
|---------|----------|
| Components | Reuse `Card`, `Button`, `BookingStepFooter`, `TouchableOpacity`, and React Native `Image`; add no UI dependency |
| Tokens | Use `constants/design-tokens.ts`; no raw brand color when a semantic token exists |
| Typography | `Garet-Heavy` headings, `ProximaNova-Semibold` section labels, system body/caption styles |
| Corners | Cards 16, buttons 12, chips 20 from token definitions |
| Elevation | Existing `designTokens.shadows.md` for selectable payment cards; no stronger elevation |
| Motion | No new decorative animation; request feedback uses state changes and existing button loading behavior |

## Information Architecture

### Step 5: Review booking

- Keep booking review and terms acceptance.
- Label pre-charge money as “Estimated guide rate” rather than provider-authoritative payment total.
- On successful booking mutation, store `id`, `status`, `paymentStatus`, and server totals before advancing.
- Do not create a charge in this step.

### Step 6: Choose payment

Order is fixed:

1. Heading and short instruction.
2. Booking-status notice when PromptPay is locally enabled but the booking is not confirmed.
3. Payment method cards: Cash first, PromptPay second when capability permits.
4. Selected-method detail panel.
5. PromptPay request/error/pending panel when applicable.
6. Method-specific safety note.
7. Wizard footer.

### Step 7: Booking and payment state

- Lead with the booking result, not a universal success claim.
- Cash: show “Booking request sent” or “Booking confirmed” from booking status, then “Pay your guide in cash.”
- PromptPay pending: show “Booking confirmed” and “PromptPay payment pending”; do not use a success icon or “Paid.”
- Use the server charge identifier as secondary reference text, never as the primary heading.

## Component Contract

### Cash method card

- Always rendered.
- Enabled before charge creation and after a definite no-charge failure.
- Disabled while a PromptPay charge may exist; show “Wait for payment status before changing methods.”
- Minimum height 80 and interactive target at least 44 by 44 points.
- Accessible role `radio`; selected state exposed through `accessibilityState`.
- Selected detail copy remains cash-specific.

### PromptPay method card

- Render only when `EXPO_PUBLIC_PROMPTPAY_ENABLED === "true"` and the API base is `http://localhost:8787` or `http://127.0.0.1:8787`.
- Show a “Local test” badge.
- If booking status is not `confirmed`, render disabled with helper text “PromptPay becomes available when this booking is confirmed.”
- Accessible label includes method, local-test status, and availability reason.

### PromptPay pending card

- Render only after validating `{ success: true, data: <tirak-payments-v1 charge> }` and unwrapping the inner `data` object.
- Show `Payment pending`, server `displayTotalThb` plus `currency`, formatted `expiresAt`, masked/shortened `chargeId`, and the image at `qrCodeUrl`.
- Because the contract permits nullable `chargeId` and `qrCodeUrl` and an omitted `expiresAt`, render a locked pending/uncertain status without a broken image, fake charge reference, or fabricated expiry whenever one is unavailable.
- QR image target is 224 by 224 points when space permits, centered inside a surface card.
- QR accessible label is “PromptPay QR for the pending booking payment”; never expose encoded QR content.
- Supporting copy: “Scan with your banking app. Tirak confirms payment only after the server receives the provider update.”
- Do not show a local “I paid” or success control.

## Interaction and State Matrix

| State | PromptPay card | Primary action | Required copy | Cash |
|-------|----------------|----------------|---------------|------|
| Capability off | Hidden | Cash `Continue` | Cash instructions only | Enabled |
| Capability on, booking pending | Visible, disabled | Cash `Continue` | “Available after your guide confirms” | Enabled |
| Capability on, booking confirmed | Visible, enabled | `Create PromptPay QR` after selection | Local-test and server-authority note | Enabled |
| Charge creating | Selected, locked | Disabled, label `Creating QR...` | Announce loading | Still visible; method switching disabled until request settles |
| Definite no-charge error | Selected | `Try again` | Problem plus safe retry path | Enabled after request settles |
| In progress or uncertain outcome | Selected, locked | `Continue` | “Payment status is uncertain. Do not pay again or switch methods.” | Visible, disabled |
| Charge pending | Selected, locked | `Continue` | `Payment pending`; server amount/currency/expiry | Visible, disabled |

## Copywriting Contract

| Element | English copy |
|---------|--------------|
| Step heading | Choose a payment method |
| Step body | Select how you want to handle payment for this booking. |
| Cash title | Cash |
| Cash body | Pay your local guide directly in cash. |
| PromptPay title | PromptPay |
| PromptPay body | Pay with a Thai banking app after your guide confirms the booking. |
| Local badge | Local test |
| Ineligible helper | PromptPay becomes available when this booking is confirmed. |
| PromptPay CTA | Create PromptPay QR |
| Loading | Creating QR... |
| Pending heading | Payment pending |
| Pending body | Scan with your banking app. Tirak confirms payment only after the server receives the provider update. |
| Definite no-charge error | We could not create the PromptPay QR. No charge was created. Try again or choose cash. |
| Uncertain outcome | Payment status is uncertain. Do not pay again or switch methods. Check this booking later. |
| Locked cash helper | Wait for payment status before changing methods. |
| Disabled error | PromptPay is unavailable in this environment. Choose cash. |
| Booking pending confirmation heading | Booking request sent |
| Confirmed booking heading | Booking confirmed |
| Cash payment state | Pay your guide in cash. |
| PromptPay payment state | PromptPay payment pending. |

Thai translations must preserve the same distinctions: booking request, confirmed booking, cash payment, QR creation, and payment pending. Translators must not replace “pending” with “paid” or “complete.”

## Typography

| Role | Token | Use |
|------|-------|-----|
| Step heading | `designTokens.typography.styles.heading` | One per step |
| Section heading | `designTokens.typography.styles.subheading` | Payment and pending-card labels |
| Body | `designTokens.typography.styles.body` | Instructions and state explanations |
| Caption | `designTokens.typography.styles.caption` | Local-test badge, expiry, charge reference |
| Amount | 24 point, weight 700, semantic text | Server amount in pending card only |

## Color

| Role | Token | Usage |
|------|-------|-------|
| Dominant | `semantic.background` / `semantic.surface` | Page and cards |
| Selection | `semantic.primary` | Selected border, radio, primary CTA |
| Pending | `semantic.warning` | Pending icon/badge and status emphasis |
| Informational | `semantic.info` | Booking eligibility notice |
| Error | `semantic.error` | Error icon/text only |
| Success | `semantic.success` | Reserved for server-returned successful state in Phase 2; not used for pending QR |

No state may rely on color alone. Every badge or border state requires text and an icon or accessibility state.

## Spacing and Layout

- Page horizontal padding: `spacing.scale.lg`.
- Section separation: `spacing.scale.xl`.
- Card padding: 16.
- Card internal gap: 12.
- Method cards: minimum height 80; full-width stacked layout.
- QR block: 24 padding above/below, 16 between amount, QR, expiry, and explanatory copy.
- Content must scroll without placing the footer over QR or error copy on 390 by 844 points.
- At large Dynamic Type, method titles and helper copy wrap; badges move below titles rather than truncate state text.

## Accessibility

- Payment methods use radio semantics and expose `selected` and `disabled` through `accessibilityState`.
- Loading, error, and pending headings use `accessibilityLiveRegion="polite"` where supported.
- QR has a descriptive label but no raw payload value.
- All interactive controls meet a 44-point target.
- Focus moves to the first error heading after a failed charge request when platform APIs permit.
- VoiceOver order follows visual order: method, eligibility, action, payment state, footer.
- Validate normal and large Dynamic Type; no required payment-status text may be clipped.

## Privacy and Logging

- Never log authorization headers, QR image contents, provider secrets, or full request/response objects.
- Analytics may record method `cash` or `promptpay`, booking ID, and coarse attempt state only after existing analytics privacy rules are checked.
- Screenshots may show synthetic booking/charge identifiers and a non-functional test QR; they may not contain secrets, tokens, or a real payment QR payload.

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| Existing repository components | `Card`, `Button`, `BookingStepFooter` | Already present; inspect current source before modification |
| Third-party registry | None | No registry or package installation authorized |

## Visual Verification Contract

Capture iOS 27 Simulator evidence for:

1. Capability off: cash-only payment step.
2. Capability on with unconfirmed booking: cash enabled, PromptPay disabled with explanation.
3. Confirmed local booking before request: PromptPay selectable and CTA visible.
4. Request loading: duplicate action blocked.
5. Pending response: QR, server amount/currency, expiry, and pending explanation visible without a paid/success claim.
6. Step 7: booking and payment status are separate and truthful.
7. Large Dynamic Type: no clipped method/state copy.

## Checker Sign-Off

- [x] Dimension 1 Copywriting: PASS (inline contract review)
- [x] Dimension 2 Visuals: PASS (existing design-system reuse specified)
- [x] Dimension 3 Color: PASS (semantic tokens and non-color cues specified)
- [x] Dimension 4 Typography: PASS (existing token roles specified)
- [x] Dimension 5 Spacing: PASS (exact layout and target constraints specified)
- [x] Dimension 6 Registry Safety: PASS (no new registry or package)

**Approval:** Product-owner approved 2026-08-31. GSD UI researcher/checker verification did not run because those UI agents are not registered in this Codex runtime; runtime installation/registration remains a separate authorization gate.
