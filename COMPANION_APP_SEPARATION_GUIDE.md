# Companion App Separation Guide

## Overview
Due to critical Android APK crashes in the main app, this document outlines the complete separation of companion/supplier functionality into a dedicated companion app. The main app will focus on customer functionality only.

## User Type Validation
The current validation logic that needs to be implemented:

```typescript
// Current validation in main app
const isCompanion = useMemo(() => {
  return user?.userType === 'companion' || user?.userType === 'supplier';
}, [user?.userType]);
```

## 🏗️ Core Architecture Components

### 1. Authentication & User Management
**Files to Copy:**
- `stores/auth-store.ts` - Complete auth state management
- `utils/auth.ts` - Auth utilities and token management
- `stores/supplier-store.ts` - Supplier-specific state management

**Key Features:**
- User type validation (`companion` | `supplier`)
- Token-based authentication with SecureStore
- Registration flow for companions
- Demo login functionality
- Profile management

### 2. API Layer
**Files to Copy:**
- `app/api/companion/companion.ts` - Core companion API functions
- `app/api/companion/stats.ts` - Supplier statistics API
- `app/api/bookings/bookings.ts` - Booking management API
- `docs/api-schema.md` - API documentation reference

**Key API Endpoints:**
```typescript
// Companion Management
GET /companions
GET /companions/{id}
POST /companions/{id}/availability
GET /companions/{id}/availability

// Booking Management  
GET /bookings
POST /bookings
PUT /bookings/{id}/status
GET /bookings/{id}

// Statistics & Analytics
GET /supplier/stats
GET /supplier/analytics
GET /supplier/earnings
```

### 3. Complete Navigation Structure
**Essential App Structure for Companion App:**
```
app/
├── _layout.tsx                    # Root navigation
├── splash.tsx                     # Splash screen
├── onboarding/
│   └── index.tsx                  # Onboarding flow
├── auth/
│   ├── index.tsx                  # Auth landing
│   ├── login.tsx                  # Login screen
│   └── register.tsx               # Registration
├── (app)/                         # Main app (authenticated)
│   ├── _layout.tsx                # Tab navigation + drawer
│   ├── index.tsx                  # Dashboard (companion view)
│   ├── bookings.tsx               # Booking management
│   ├── booking/
│   │   └── [id].tsx               # Booking details
│   ├── messages.tsx               # Message list
│   ├── chat/
│   │   └── [id].tsx               # Chat interface
│   ├── search.tsx                 # Search other companions
│   ├── notifications.tsx          # Notifications
│   ├── profile.tsx                # Profile view
│   └── settings.tsx               # App settings
├── (supplier)/                    # Supplier-specific features
│   ├── _layout.tsx
│   ├── availability/
│   │   ├── index.tsx
│   │   └── add-slot.tsx
│   ├── services/
│   │   └── index.tsx
│   ├── analytics/
│   │   └── index.tsx
│   ├── profile/
│   │   └── index.tsx
│   └── settings/
│       └── index.tsx
├── supplier/                      # Supplier onboarding
│   ├── dashboard/
│   │   └── index.tsx
│   ├── signup/
│   │   ├── availability.tsx
│   │   ├── photos.tsx
│   │   └── [other signup steps]
│   └── chat/                      # Supplier chat features
│       ├── _layout.tsx
│       ├── index.tsx
│       ├── conversation/[id].tsx
│       ├── templates/
│       └── settings.tsx
└── companion/
    └── [id].tsx                   # View other companions
```

## � Essential Screens & Components

### 1. Core App Screens (Required from Main App)

#### **Authentication Flow**
- `app/splash.tsx` - Splash screen with logo animation
- `app/onboarding/index.tsx` - Onboarding carousel for new users
- `app/auth/index.tsx` - Authentication landing page
- `app/auth/login.tsx` - Login form
- `app/auth/register.tsx` - Registration form

#### **Main App Layout**
- `app/(app)/_layout.tsx` - Tab navigation with drawer
  - **Tab Configuration for Companions:**
    ```typescript
    const TAB_ROUTES = [
      { name: "index", label: "Dashboard", icon: { name: "Home" } },
      { name: "search", label: "Network", icon: { name: "Search" } },
      { name: "bookings", label: "Bookings", icon: { name: "Calendar" } },
      { name: "messages", label: "Messages", icon: { name: "MessageCircle" } },
      { name: "favorites", label: "Saved", icon: { name: "Heart" } },
    ];
    ```
  - **Side Drawer Navigation** with companion-specific menu items
  - **Custom Header** with role-based UI (`isCompanion` validation)

#### **Dashboard & Home**
- `app/(app)/index.tsx` - Main dashboard (shows CompanionDashboard for companions)
- `components/home/CompanionDashboard.tsx` - Companion-specific dashboard
- `components/home/SearchHeader.tsx` - Header with user greeting

#### **Booking Management**
- `app/(app)/bookings.tsx` - Booking list with filtering and status management
- `app/(app)/booking/[id].tsx` - Detailed booking view
- `app/booking/new.tsx` - New booking creation
- `app/booking/confirmation.tsx` - Booking confirmation screen
- `components/booking/BookingWizard.tsx` - Multi-step booking process

#### **Communication**
- `app/(app)/messages.tsx` - Message list with search functionality
- `app/chat/[id].tsx` - Chat interface with real-time messaging
- `app/supplier/chat/` - Supplier-specific chat features:
  - `_layout.tsx` - Chat navigation
  - `index.tsx` - Chat dashboard
  - `conversation/[id].tsx` - Individual conversations
  - `templates/` - Message templates
  - `settings.tsx` - Chat settings

#### **Profile & Settings**
- `app/(app)/profile.tsx` - Profile view and editing
- `app/(app)/settings.tsx` - App settings and preferences
- `app/(app)/notifications.tsx` - Notification center

### 2. Companion-Specific Features

#### **Availability Management**
- `app/(supplier)/availability/index.tsx` - Availability calendar
- `app/(supplier)/availability/add-slot.tsx` - Add time slots

#### **Service Management**
- `app/(supplier)/services/index.tsx` - Service catalog management

#### **Analytics Dashboard**
- `app/(supplier)/analytics/index.tsx` - Performance analytics

#### **Profile Management**
- `app/(supplier)/profile/index.tsx` - Supplier profile editing

## �📱 UI Components

### 1. Dashboard Components
**Primary Component:**
- `components/home/CompanionDashboard.tsx` - Main dashboard with:
  - Today's overview (bookings, rating, weekly stats)
  - Quick actions (Set Availability, Experiences, Analytics, Profile)
  - Recent bookings management
  - Status update functionality

**Supporting Components:**
- `components/supplier/RecentActivityFeed.tsx`
- `components/supplier/EarningsChart.tsx` 
- `components/supplier/PerformanceMetrics.tsx`
- `components/supplier/NotificationCenter.tsx`
- `components/supplier/RequestAnalytics.tsx`

### 2. Booking Management
**Components:**
- Booking list with status management
- Booking confirmation/cancellation
- Customer communication interface
- Booking history and analytics

**Status Types:**
```typescript
type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';
```

### 3. Availability Management
**Components:**
- Weekly schedule editor
- Time slot management
- Availability calendar view
- Bulk availability updates

**Key Features:**
- Date/time picker integration
- Recurring availability patterns
- Special availability exceptions
- Real-time availability updates

### 4. Analytics & Performance
**Components:**
- Revenue tracking and charts
- Performance metrics dashboard
- Request analytics
- Response time monitoring
- Customer feedback analysis

**Metrics Tracked:**
- Total requests and acceptance rate
- Response time distribution
- Revenue and booking value trends
- Customer satisfaction ratings

## 🔧 Technical Implementation

### 1. Safe Icon System
**Current Implementation:**
```typescript
// Safe Lucide icon components with error boundaries
const SafeCalendarIcon = () => (
  <ErrorBoundary fallback={<View style={{ width: 24, height: 24, backgroundColor: SAFE_COLORS.primary, borderRadius: 12 }} />}>
    <Calendar size={24} color={SAFE_COLORS.primary} />
  </ErrorBoundary>
);
```

**Required Icons:**
- Calendar (availability)
- Settings (profile/settings)
- TrendingUp (analytics)
- Plus (add new items)
- Clock (time management)
- CheckCircle/XCircle (status indicators)

### 2. Error Handling
**ViewManager Safety:**
- React Native Fabric disabled (`newArchEnabled: false`)
- Error boundaries around all icon components
- ViewManagerSafeWrapper for critical components
- Fallback UI for component failures

### 3. State Management
**Zustand Stores:**
- `useAuthStore` - Authentication state
- `useSupplierStore` - Supplier profile and signup data
- `useBookingStore` - Booking management
- `useToastStore` - User notifications

## 📊 Data Models

### 1. Companion/Supplier Profile
```typescript
interface SupplierProfile {
  id: string;
  name: string;
  displayName: string;
  email: string;
  phone: string;
  profileImage: string;
  gallery: string[];
  location: string;
  bio: string;
  services: SupplierService[];
  availability: SupplierAvailability;
  stats: SupplierStats;
  verified: boolean;
  rating: number;
  reviewCount: number;
}
```

### 2. Booking Management
```typescript
interface Booking {
  id: string;
  customerId: string;
  companionId: string;
  serviceId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  totalAmount: number;
  customerName: string;
  customerImage?: string;
  location: string;
  notes?: string;
}
```

### 3. Availability System
```typescript
interface AvailabilityTimeSlot {
  start: string;
  end: string;
  available: boolean;
  price?: number;
}

interface SupplierAvailability {
  weeklySchedule: Record<string, AvailabilityTimeSlot[]>;
  exceptions: AvailabilityException[];
  timezone: string;
}
```

## 🚀 Quick Actions Implementation

### 1. Set Availability
**Route:** `/(supplier)/availability`
**Features:**
- Weekly schedule management
- Add/edit time slots
- Bulk availability updates
- Calendar integration

### 2. Experiences/Services
**Route:** `/(supplier)/services`
**Features:**
- Service catalog management
- Pricing configuration
- Service descriptions and photos
- Category management

### 3. Analytics
**Route:** `/(supplier)/analytics`
**Features:**
- Performance dashboard
- Revenue tracking
- Request analytics
- Customer feedback

### 4. Profile
**Route:** `/(supplier)/profile`
**Features:**
- Profile information editing
- Photo gallery management
- Verification status
- Account settings

## 🔐 Security Considerations

### 1. Authentication
- JWT token-based authentication
- Secure token storage with expo-secure-store
- Token refresh mechanism
- User type validation on all routes

### 2. Data Protection
- Sensitive data encryption
- Secure API communication
- User permission validation
- Data access logging

## 📱 Platform-Specific Considerations

### 1. Android Optimizations
- React Native Fabric disabled for stability
- ViewManager crash prevention
- Memory optimization for large datasets
- Background task management

### 2. iOS Optimizations
- Native navigation patterns
- iOS-specific UI guidelines
- Push notification handling
- App Store compliance

## 🧪 Testing Strategy

### 1. Component Testing
- Error boundary testing
- Icon component safety
- Navigation flow testing
- State management validation

### 2. Integration Testing
- API endpoint testing
- Authentication flow testing
- Booking workflow testing
- Real-time data synchronization

### 3. Performance Testing
- Memory usage monitoring
- Crash prevention validation
- Load testing for high booking volumes
- Network connectivity handling

## 📋 Migration Checklist

### Phase 1: Core Setup
- [ ] Copy authentication system
- [ ] Set up companion-specific navigation
- [ ] Implement basic dashboard
- [ ] Configure API layer

### Phase 2: Feature Implementation
- [ ] Availability management
- [ ] Booking system
- [ ] Analytics dashboard
- [ ] Profile management

### Phase 3: Testing & Optimization
- [ ] Comprehensive testing
- [ ] Performance optimization
- [ ] Security audit
- [ ] User acceptance testing

### Phase 4: Deployment
- [ ] App store preparation
- [ ] Production deployment
- [ ] User migration strategy
- [ ] Support documentation

## 🔄 Data Synchronization

### 1. Real-time Updates
- WebSocket connections for live booking updates
- Push notifications for new requests
- Automatic data refresh mechanisms
- Offline data caching

### 2. Conflict Resolution
- Optimistic updates with rollback
- Server-side conflict resolution
- User notification for conflicts
- Data consistency validation

## 📦 Dependencies & Packages

### 1. Core Dependencies
```json
{
  "dependencies": {
    "@expo/vector-icons": "^14.1.0",
    "@react-native-async-storage/async-storage": "2.1.2",
    "@react-native-community/datetimepicker": "8.4.1",
    "@react-navigation/native": "^7.1.6",
    "@tanstack/react-query": "^5.81.2",
    "axios": "^1.10.0",
    "expo": "^53.0.4",
    "expo-linear-gradient": "~14.1.5",
    "expo-router": "~5.0.3",
    "expo-secure-store": "^14.2.3",
    "lucide-react-native": "^0.475.0",
    "react": "19.0.0",
    "react-native": "0.79.1",
    "zustand": "^5.0.5"
  }
}
```

### 2. Configuration Files
**app.json:**
```json
{
  "expo": {
    "name": "Tirak Companion",
    "slug": "tirak-companion-app",
    "newArchEnabled": false,
    "android": {
      "package": "com.tirak.companion",
      "enableProguardInReleaseBuilds": false,
      "enableHermes": true
    }
  }
}
```

## 🎨 Design System (Use Existing Design Tokens)

### 1. Import Design System
```typescript
import { designTokens, componentTokens } from '@/constants/design-tokens';
```

### 2. Color System
**Use the existing semantic color system:**
```typescript
// Primary colors from design tokens
designTokens.colors.semantic.primary      // Main brand purple (#A85CF9)
designTokens.colors.semantic.secondary    // Main brand pink (#FFBAA0)
designTokens.colors.semantic.accent       // Coral accent color
designTokens.colors.semantic.background   // Main background
designTokens.colors.semantic.surface      // Card surfaces
designTokens.colors.semantic.text         // Primary text
designTokens.colors.semantic.textSecondary // Secondary text
designTokens.colors.semantic.success      // Success state
designTokens.colors.semantic.error        // Error state

// Component-specific colors
designTokens.colors.components.button.primary
designTokens.colors.components.card.background
designTokens.colors.components.navigation.active
```

### 3. Typography System
**Use the strategic font system:**
```typescript
// Typography styles (ready-to-use)
designTokens.typography.styles.heading     // Garet-Heavy 24px for titles
designTokens.typography.styles.subheading  // ProximaNova-Semibold 18px for sections
designTokens.typography.styles.body        // System font 16px for content
designTokens.typography.styles.caption     // System font 14px for details

// Component tokens for text
componentTokens.text.heading
componentTokens.text.subheading
componentTokens.text.body
componentTokens.text.caption
```

### 4. Spacing & Layout
**Use consistent spacing scale:**
```typescript
// Spacing scale
designTokens.spacing.scale.xs    // 4px
designTokens.spacing.scale.sm    // 8px
designTokens.spacing.scale.md    // 16px
designTokens.spacing.scale.lg    // 24px
designTokens.spacing.scale.xl    // 32px

// Component-specific spacing
designTokens.spacing.components.card.padding
designTokens.spacing.components.button.paddingHorizontal
designTokens.spacing.components.list.itemSpacing
```

### 5. Border Radius & Shadows
```typescript
// Border radius
designTokens.borderRadius.components.button  // 12px
designTokens.borderRadius.components.card    // 16px
designTokens.borderRadius.components.input   // 8px

// Shadows
designTokens.shadows.sm
designTokens.shadows.md
designTokens.shadows.lg
```

### 6. Animation System
```typescript
// Animation presets
designTokens.animation.presets.fadeIn
designTokens.animation.presets.slideUp
designTokens.animation.presets.bounce

// Duration and easing
designTokens.animation.duration.fast    // 150ms
designTokens.animation.duration.normal  // 300ms
designTokens.animation.easing.organic   // Organic motion curve
```

### 7. Component Styling Examples
```typescript
// Button styling
const buttonStyle = {
  ...componentTokens.button.primary,
  // Additional custom styles
};

// Card styling
const cardStyle = {
  ...componentTokens.card.default,
  // Additional custom styles
};

// Text styling
const headingStyle = {
  ...componentTokens.text.heading,
  // Additional custom styles
};
```

## 🔄 Real-time Features

### 1. Live Booking Updates
```typescript
// WebSocket connection for real-time updates
const useBookingUpdates = () => {
  useEffect(() => {
    const ws = new WebSocket(`${WS_URL}/bookings`);
    ws.onmessage = (event) => {
      const update = JSON.parse(event.data);
      // Update booking state
    };
    return () => ws.close();
  }, []);
};
```

### 2. Push Notifications
- New booking requests
- Booking status changes
- Customer messages
- Payment confirmations

## 🛠️ Development Tools

### 1. Testing Setup
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};
```

### 2. Metro Configuration
```javascript
// metro.config.js - Optimized for ViewManager stability
const config = getDefaultConfig(__dirname);
config.resolver.platforms = ['ios', 'android', 'native', 'web'];
config.transformer.minifierConfig = {
  keep_fnames: true,
  mangle: { keep_fnames: true }
};
```

## 📱 App Store Metadata

### 1. App Information
- **Name:** Tirak Companion - Cultural Guide Dashboard
- **Description:** Professional dashboard for cultural guides and companions in Thailand
- **Keywords:** cultural guide, companion, booking management, Thailand tourism
- **Category:** Business/Travel

### 2. Screenshots Required
- Dashboard overview
- Booking management
- Availability calendar
- Analytics dashboard
- Profile management

## 🚨 Critical Fixes Applied

### 1. Android Crash Prevention
- **React Native Fabric disabled** (`newArchEnabled: false`)
- **ViewManagerSafeWrapper** for critical components
- **Error boundaries** around all Lucide icons
- **Safe fallback rendering** for component failures

### 2. Memory Management
- Optimized image loading and caching
- Efficient state management with Zustand
- Proper cleanup of event listeners
- Background task optimization

This separation will create a focused, stable companion app that addresses the Android crash issues while providing a superior experience for companion users.
