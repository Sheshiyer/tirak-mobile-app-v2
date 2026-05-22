# Tirak Mobile App - Visual-Informed Implementation Specification

## Project Overview
Build a comprehensive companion booking mobile application for iOS and Android with dual user journeys (Customers and Suppliers) targeting the Thai market.

## Brand Identity Implementation (Visual-Confirmed)
**Logo & Branding:**
- Tirak butterfly-heart logo symbol with organic curves
- Color palette: Pink (#ffacac, #ff7979, #ffdfdf) + Purple (#583c87, #6f4caa) + White (#ffffff)
- Typography: Clean, geometric sans-serif with bold headers
- Tagline: "Private connections. Trusted moments."

**Visual Design System:**
- **Primary backgrounds:** Organic radial pink-to-purple gradients (NOT linear)
- **Container pattern:** White cards with subtle shadows floating over gradients
- **Button style:** Purple (#6f4caa) with rounded corners and white text
- **Profile images:** Circular format throughout app
- **Text hierarchy:** Bold white text on gradients, dark text on white cards
- **Navigation:** Bottom tab bar with custom purple icons

## Complete Screen Implementation (37 Screens)

### 🟩 Universal Onboarding & Authentication (6 Screens)

#### 1. Splash Screen
- **Background:** Organic radial gradient from pink to purple
- Centered Tirak butterfly logo with fade-in animation
- White tagline text below logo with proper spacing
- Language selector dropdown fixed at bottom (white background)

#### 2. Language Selector (Full-screen Modal)
- **Background:** White with subtle gradient header
- Flag + Language name list layout with clean typography
- Purple highlight for current selection with checkmark
- Purple "Continue" button at bottom

#### 3. Welcome Screen
- **Background:** Organic gradient background
- Three prominent white card buttons with shadows:
  - "Continue as Customer" with 👤 icon
  - "Join as Supplier" with 💼 icon  
  - "Login" link in smaller purple text
- Generous vertical spacing between cards

#### 4. Login/Signup Modal
- **White card modal** over gradient background
- Tabbed interface with purple accent (Login/Signup tabs)
- **Login Tab:** Social login buttons in white cards
- **Signup Tab:** Form fields with subtle borders and icons
- Purple primary buttons for actions

#### 5. OTP Verification Screen
- **Background:** Gradient with white card container
- Large, individual circular digit input fields
- Auto-advance cursor with purple highlights
- Purple "Resend OTP" button with countdown timer

#### 6. Terms & Conditions Acceptance
- White card layout over gradient
- Checkbox with purple accent when selected
- Purple "Continue" button (disabled until acceptance)

### 🟦 Customer Journey Screens (15 Screens)

#### 7. Home/Explore Screen
**Visual Structure:**
- **Background:** Organic gradient throughout
- **Header:** White search bar with purple filter button
- **Content:** White card sections with rounded corners

**Top Section:**
- Search bar in white pill with shadow and 🔍 icon
- Purple filter button with white icon

**Featured Suppliers Section:**
- White card container with "Featured Suppliers" header
- Horizontal carousel of supplier cards (white backgrounds)
- Each card: Circular profile image, name, region, category tags
- Purple online status badges

**Categories Section:**
- White card with "Main Categories" header
- 3x3 grid of category cards with purple icons and white backgrounds
- Categories: ✈️ Travel, 🍸 Nightlife, 🎬 Cinema, 🏖 Holiday, 🧖 Wellness, 🏙 Explorer, 🔒 Private, 🎉 Events, 🏋 Sports

**Near You Section:**
- Grid layout of supplier profile cards
- Circular profile images with star ratings overlay

**Bottom Navigation:**
- Fixed bottom tab bar with purple accent on active tab
- Icons: Home, Favorites, Bookings, Chat, Profile

#### 8. Filter Modal (Comprehensive)
- **White modal** sliding up from bottom
- **Header:** Purple with white "Filter" text and close X
- **Sections in white cards:**
  - Region selection with Thailand map visual
  - Price range slider with purple accents
  - Category chips with purple selection state
  - Language multi-select
  - Availability date picker with purple highlights
- Purple "Apply" button at bottom

#### 9. Search Results Screen
- **Background:** Gradient with white card containers
- Grid layout toggle in purple
- Supplier cards in white with shadows
- Purple sort/filter chips showing active filters
- Infinite scroll loading with purple indicators

#### 10. Supplier Profile Screen
- **Background:** Gradient transitioning to white
- **Header:** Full-width image carousel with dots indicator
- **Content:** White card sections with shadows
- **Profile info:** Circular image, name, verification badge, language flags
- **Availability:** Purple calendar highlights for available dates
- **Purple "Chat Now" button** sticky at bottom
- Reviews in white card format with star ratings

#### 11. Chat Screen
- **Header:** Gradient background with circular profile image
- **Messages:** Standard bubble layout over white background
- **Input:** White bar with purple send button
- Translation and attachment icons in purple

#### 12. Chat List Screen
- **Background:** White with gradient header
- Conversation items in white cards
- Circular profile images with unread badges in purple
- Swipe actions with purple accents

#### 13. Customer Profile Screen
- **Background:** Gradient transitioning to white
- **Header:** Large circular profile image with edit overlay
- **Content:** White card sections for profile information
- Purple edit buttons and form accents

#### 14. Favorites Screen
- Grid layout of white supplier cards over gradient background
- Purple heart icons for favorited status
- Empty state with purple illustration

#### 15. Side Drawer Menu (Visual Reference)
- **Background:** Organic gradient from top to bottom
- **Header:** Circular profile image with white user name and phone
- **Menu items:** White text with icons in vertical list
- **Sections:** Profile, Chat History, Payments, Bookings, Privacy & Policy, Help Center, Settings
- **Logout:** Separate section at bottom with exit icon

#### 16. Customer Settings Screen
- White background with gradient header
- Grouped list with purple chevron arrows
- Icons for each setting category

#### 17. Privacy Settings Screen
- White cards with toggle switches in purple
- Descriptive text for each privacy option

#### 18. Support/Help Screen
- White card layout with purple accent buttons
- FAQ sections expandable with purple arrows

#### 19. Ratings & Reviews Screen
- White cards for review display
- Purple star rating system
- Photo upload with purple camera button

#### 20. Search/Browse Results
- Consistent with main search results layout
- Breadcrumb chips in purple

#### 21. Notifications Center
- White cards over gradient background
- Purple notification badges and timestamps

### 🟨 Supplier Journey Screens (16 Screens)

#### 22-29. Supplier Signup Process (8-step Multi-screen Flow)
**Visual Pattern for All Steps:**
- **Background:** Gradient with white card containers
- **Header:** Purple progress indicator with step numbers
- **Content:** White form cards with purple accent buttons
- **Navigation:** Purple "Next" buttons, subtle "Back" links

**Step 1 - Basic Info:**
- White card form with icon-prefixed input fields
- Purple form validation indicators

**Step 2 - ID Verification:**
- Camera interface with purple capture button
- White preview cards for uploaded documents

**Step 3 - Upload Photos:**
- Gallery grid with purple add/edit buttons
- Drag-to-reorder with visual feedback

**Step 4 - Select Categories:**
- Multi-select tiles with purple selection state
- Grid layout matching customer category display

**Step 5 - Services & Pricing:**
- White cards for each service with purple edit buttons
- Add service in purple with plus icon

**Step 6 - Regions:**
- Map-based selection with purple highlights
- Multi-select capability with confirmation badges

**Step 7 - Availability (Visual Reference):**
- **Calendar:** Purple header with month navigation
- **Date grid:** White background with purple highlights for selected dates
- **Time slots:** Circular purple buttons for available times
- **Today/Tomorrow sections:** Purple time indicators

**Step 8 - Subscription Payment:**
- PromptPay QR code in white card
- Purple confirmation checkboxes

#### 30. Supplier Dashboard
- **Background:** Gradient with white card tiles
- **Status cards:** Green/yellow/red indicators for profile status
- **Action tiles:** Purple icons with white backgrounds
- **Stats:** Purple accent numbers and charts

#### 31. Edit Supplier Profile
- **Background:** White with gradient header
- **Photo management:** Circular images with purple edit overlays
- **Form sections:** White cards with purple save buttons

#### 32. Manage Services Screen
- **Background:** White with purple header
- **Service list:** White cards with purple edit/delete buttons
- **Add service:** Purple floating action button

#### 33. Set Availability Screen
- Matches customer availability view with purple calendar highlights
- Time slot management with purple selection indicators

#### 34. Subscription Management Screen
- **Background:** White cards over gradient
- **Status indicators:** Purple badges for active subscriptions
- **Payment history:** White cards with purple timestamps

#### 35. Supplier Settings Screen
- Matches customer settings with grouped purple chevron navigation
- Additional supplier-specific options in consistent white card format

#### 36. Supplier Chat Interface
- Same visual design as customer chat
- Additional purple menu options for supplier controls

#### 37. Payment History Screen
- White cards with purple status indicators
- Download buttons in purple accent color

## Technical Requirements

### Visual Component System
- **Gradient Component:** Custom radial gradient backgrounds with configurable pink-to-purple transitions
- **Card Component:** White containers with consistent shadow and border radius
- **Button Component:** Purple primary, white secondary, with proper hover/press states
- **Profile Image:** Circular component with edit overlay and loading states
- **Tab Navigation:** Custom bottom tabs with purple accent animations

### Platform Implementation
- **React Native:** 0.72+ with Expo or CLI
- **Gradient Library:** react-native-linear-gradient for custom radial effects
- **Navigation:** React Navigation 6 with custom tab bar styling
- **State Management:** Redux Toolkit with proper purple loading indicators
- **Animation:** Reanimated 3 for smooth 60fps gradient transitions

### Design System Integration
- **Color tokens:** Exact hex values for pink/purple gradient stops
- **Typography scale:** Bold headers, medium body text, light captions
- **Spacing system:** Consistent padding/margins matching visual references
- **Shadow system:** Elevation levels for floating white cards
- **Border radius:** Consistent rounding for cards, buttons, images

### Performance Requirements
- Smooth gradient rendering without performance degradation
- Optimized image loading for circular profile components
- Efficient calendar rendering with purple highlight animations
- Fast chat bubble layout with proper memory management

### Localization Implementation
- **Thai language:** Right-to-left text support in white cards
- **Cultural design:** Thai naming conventions in profile displays
- **Currency formatting:** THB with proper Thai number formatting
- **Date formatting:** Thai Buddhist calendar integration

This refined specification now accurately reflects the actual visual design language seen in the Tirak app screenshots, ensuring implementation matches the intended artistic gradient backgrounds, white card containers, purple accent system, and overall visual hierarchy.