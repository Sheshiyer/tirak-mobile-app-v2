# Changelog

## [Unreleased]

### Changed
- Removed Enhanced Profile from quick actions in CompanionDashboard

### Fixed
- **CRITICAL FIX: Category Section Translation Issue**: Fixed category names not being translated in CategorySection component
  - Issue: Category names (Travel, Nightlife, Cinema, etc.) were showing in English instead of Thai
  - Root cause: CategorySection component was using hardcoded mockCategories instead of translated categories from parent
  - Solution: Updated CategorySection to use allCategories prop with translated names from parent component
  - Added proper mapping of translated categories with blob SVGs for visual consistency
  - Category names now properly display in selected language (English/Thai)
- **UX IMPROVEMENT: Fixed Home Screen Flash on App Reload**: Eliminated bad UX of showing home screen briefly before redirecting to onboarding
  - Issue: App was showing home screen for few milliseconds before redirecting to onboarding when no user was logged in
  - Root cause: Authentication state hydration delay caused flash of wrong screen
  - Solution: Added loading states and redirect logic to prevent home screen from showing when not authenticated
  - Reduced splash screen timer from 2500ms to 1500ms for faster navigation
  - Added redirect mechanism in app layout to handle unauthenticated users gracefully
  - Improved loading states to show proper feedback during authentication checks

### Fixed
- **CRITICAL FIX: Registration Success Being Treated as Error**: Fixed auth store registration logic
  - Issue: Successful registration API response was being thrown as error due to strict conditional check
  - Root cause: `if (response.success && response.user)` failed when `response.user` was missing/falsy
  - Solution: Changed condition to only check `response.success` and added null-safe user object creation
  - Added fallback values for user data when API response doesn't include complete user object
  - Registration now properly succeeds and navigates to app instead of showing "Registration successful" as error
- **CRITICAL FIX: Invalid JSX Syntax in Home Screen**: Fixed const declaration inside JSX conditional
  - Issue: `const transformedCompanions` was declared inside JSX conditional expression `{isCompanion && (...)}`
  - Root cause: Invalid JavaScript syntax - can't declare variables inside JSX conditional expressions
  - Solution: Moved `transformedCompanions` declaration outside JSX using React.useMemo
  - Variable now properly available for both companion and customer screen rendering
- **OPTIMIZATION: Conditional API Fetching for Featured Companions**: Fixed unnecessary API calls for companions
  - Issue: Featured companions API was being called for all users, including companions who don't need this data
  - Root cause: No conditional logic in API hook calls based on user type
  - Solution: Replaced `useFeaturedCompanions()` with custom `useQuery` hook that includes `enabled: !isCompanion`
  - API now only fetches when user is a customer, saving bandwidth and preventing unnecessary requests for companion users
- Fixed bottom navigation bar indicator alignment: AnimatedTabBar now uses dynamic tab and indicator widths based on the number of tabs, ensuring the active indicator is always centered and properly sized regardless of tab count or label changes.
- Fixed navigation crashes in CompanionDashboard quick action buttons by using correct route paths without /index suffix
- Fixed route structure consistency across supplier sections
- Fixed navigation route paths in CompanionDashboard quick actions to match the existing route structure:
  - Set Availability: /supplier/availability/index
  - Experiences: /supplier/services/index
  - Analytics: /supplier/dashboard/index

### Added
- **NEW: One-time login authentication flow with role-based UI rendering**
  - Updated User type interface to use `userType` instead of `role` for consistency with backend API
  - Fixed login and registration to automatically authenticate users and navigate to main app
  - Added proper companion dashboard rendering based on `userType === 'companion'`
  - Updated auth store to use real API endpoints instead of mock data for login
  - Fixed type consistency across all auth-related components and APIs
  - **FIXED: Navigation issue after login/registration** - Updated both screens to use auth store instead of direct API calls
  - Removed duplicate navigation calls that were causing conflicts between API utilities and auth store
  - **FIXED: App refresh navigation** - Updated splash screen to check authentication state and navigate appropriately
  - Authenticated users now go directly to app, bypassing onboarding on refresh
  - **FIXED: Auth screen demo login navigation** - Removed setTimeout conflicts and streamlined navigation flow
  - **CRITICAL FIX: Navigation on failed authentication** - Fixed bug where app navigated to home screen even when login/registration failed
  - **ROOT CAUSE**: Auth store was not throwing errors on failure, so UI try/catch blocks never caught failures
  - **SOLUTION**: Updated auth store to throw errors on authentication failure so UI components can properly handle them
  - Login and registration now only navigate on successful authentication, staying on auth screens to display errors on failure

- **NEW: Comprehensive Companion API with React Query integration** (`app/api/companion/companion.ts`)
  - Implemented full companion search API with all specified query parameters
  - Added proper TypeScript interfaces for all API responses and data structures
  - Integrated authentication with automatic token retrieval from SecureStore
  - Added proper Content-Type and Accept headers for API requests
  - Created React Query hooks for efficient data fetching and caching:
    - `useCompanionsQuery()` - General companion search with custom parameters
    - `useFeaturedCompanions()` - Pre-configured for featured companions
    - `useCompanionsByCategory()` - Search by specific category
    - `useCompanionsByLocation()` - Search by location with distance sorting
  - Implemented intelligent retry logic (no retry on auth errors, 3 retries for network errors)
  - Added 5-minute stale time and 10-minute garbage collection for optimal performance
  - Added React Query provider to app layout for global state management

- **NEW: Featured Companions API Integration** (`app/(app)/index.tsx`)
  - Replaced mock data with real API calls using `useFeaturedCompanions()` hook
  - Added data transformation layer to map API response to existing UI interface
  - Implemented proper loading states and error handling in FeaturedCompanionsSection
  - Added comprehensive error display with user-friendly messages
  - Maintained backward compatibility with existing Companion interface

- Zod form validation to login screen (`app/auth/login.tsx`)
  - Added `zod` dependency to package.json
  - Implemented `loginSchema` with email and password validation
  - Added TypeScript types using `z.infer<typeof loginSchema>`
  - Replaced manual validation with Zod schema validation
  - Added proper error handling for Zod validation errors
  - Fixed forgot password route issue (temporarily disabled navigation)

- Enhanced registration form with additional user fields (`app/auth/register.tsx`)
  - Implemented `registerSchema` with comprehensive validation
  - Added name validation (2-50 characters)
  - Added email validation with proper format checking
  - **NEW: Added contact number field with phone format validation**
  - **NEW: Added date of birth field with DateTimePicker component**
  - **NEW: Added gender selection with dropdown interface**
  - Added password validation (6-100 characters)
  - Added password confirmation validation with custom refine rule
  - Added TypeScript types using `z.infer<typeof registerSchema>`
  - Replaced manual validation with Zod schema validation
  - Added proper error handling for Zod validation errors
  - Added `@react-native-community/datetimepicker` dependency for date selection
  - Implemented custom dropdown for gender selection with options: Male, Female, Other, Prefer not to say
  - Added age validation (minimum 18 years old) for date of birth
  - Added phone number regex validation for contact number field

- **NEW: Proper API integration for user registration** (`app/api/auth/register.ts`)
  - Fixed TypeScript interfaces with proper `RegisterData` and `RegisterResponse` types
  - Added comprehensive error handling with axios error types
  - Implemented secure token storage using `expo-secure-store`
  - Added proper parameter handling instead of hardcoded data
  - Added `@tanstack/react-query` dependency for future API state management

- **NEW: Enhanced auth store integration** (`stores/auth-store.ts`)
  - Updated registration function to accept additional user fields
  - Integrated real API calls instead of mock data
  - Added proper data transformation (Date to ISO string format)
  - Enhanced error handling with specific error messages
  - Added support for contact number, date of birth, and gender in user registration

### Changed
- Login form now uses structured form data instead of separate state variables
- Register form now uses structured form data instead of separate state variables
- Improved error handling with proper TypeScript types
- Enhanced user experience with automatic error clearing on input

### Technical Details
- Email validation: Required field with proper email format
- Password validation: Required field with minimum 6 characters
- Name validation: Required field with 2-50 character limits
- Password confirmation: Custom refine rule to ensure passwords match
- Real-time error clearing when user starts typing
- Proper TypeScript integration with Zod schema inference

## [Latest] - 2025-01-30

### Added
- **Companion API Integration**: Complete companion search API with React Query
  - Comprehensive TypeScript interfaces for all API responses
  - Authentication integration with automatic token retrieval
  - Multiple search hooks: general search, featured companions, by category, by location
  - Performance optimizations: 5-minute stale time, smart retry logic
- **Featured Companions Real Data**: Replaced mock data with live API integration
  - Data transformation layer for API-to-UI interface mapping
  - Loading states with skeleton cards
  - Error handling with user-friendly messages
  - Empty state handling
- **Search Page API Integration**: Replaced mock companion data with real API calls
  - Dynamic search parameters built from user filters (category, location, price, languages)
  - Real-time API calls when filters change
  - Proper sort mapping: price (asc/desc), rating, reviews, distance, relevance
  - Data transformation from API format to existing UI interface
  - Updated TypeScript types for companion card rendering
- **Search Page Shimmer Loading**: Enhanced loading experience with animated shimmer effects
  - Created `SearchShimmer` component with grid and list view support
  - Animated shimmer placeholders for images, text, and UI elements
  - Maintains view mode consistency during loading (grid/list toggle works while loading)
  - Shows category chips and results header during loading for better UX
  - Added empty state handling for when no companions are found

### Fixed
- **Backend API Compatibility**: Temporary workaround for query parameter validation
  - Backend expects typed values but receives URL strings
  - Filtered out problematic parameters (rating, available, verified, limit) until backend fix
  - Added detailed logging for debugging API calls
  - TODO: Remove workaround when backend properly handles string-to-type conversion

### Technical
- Added @tanstack/react-query@5.81.2 for API state management
- Created comprehensive companion API client with error handling
- Implemented React Query provider in app layout
- Updated search page to use `useCompanionsQuery` hook with dynamic parameters

## [Latest Changes]

### Enhanced Companion Dashboard with Real Booking Data and Status Management
- **Real-time Booking Integration**: Replaced mock data with live API calls
  - Integrated `useBookingsQuery` to fetch recent bookings (last 5)
  - Real-time booking status updates with `useUpdateBookingStatus`
  - Automatic data refresh after status changes
- **Interactive Booking Management**: Quick actions for booking status updates
  - Confirm/Cancel buttons for pending bookings
  - Visual status indicators with color-coded badges
  - One-tap status updates with optimistic UI feedback
- **Enhanced Booking Display**: Comprehensive booking information
  - Smart date formatting (Today, Tomorrow, or specific dates)
  - Service names, customer information, and location details
  - Payment status and booking timeline information
- **Status Management System**: Complete booking lifecycle support
  - Status badge variants (success, warning, error, info)
  - Status-specific action buttons (confirm, cancel)
  - Proper error handling for status update failures
- **Improved User Experience**: Better loading and error states
  - Loading shimmer for booking data fetch
  - Error states with retry functionality
  - Empty state with helpful guidance for new companions
  - "View All" navigation to full bookings page
- **Visual Enhancements**: Modern UI with interactive elements
  - Quick action buttons with icon indicators
  - Responsive layout with proper spacing
  - Smooth animations and hover states
  - Color-coded status system for instant recognition
- **Authentication Handling**: Proper auth token management for booking API
  - Added authentication check before making booking API calls
  - Implemented demo mode with mock data for unauthenticated users
  - Added demo badge indicator for non-authenticated state
  - Enhanced error handling for missing authentication tokens
  - Graceful fallback to demo data when API authentication fails
- **CRITICAL FIX: Token Validation on App Startup**: Fixed authentication state detection
  - Added `validateToken()` function to auth store to check for existing tokens
  - Integrated token validation in `useAuthStoreHydrated` hook on app startup
  - Store user credentials in SecureStore during login/register for persistence
  - Properly sync auth store state with actual token presence in SecureStore
  - Fixed issue where app showed as unauthenticated despite having valid tokens
- **CRITICAL FIX: Token Storage Mismatch**: Fixed authentication token storage
  - Backend returns `accessToken` but booking API looks for `authToken`
  - Updated auth store to properly store `accessToken` as `authToken` in SecureStore
  - Added proper token storage for both login and register flows
  - Enhanced debugging logs to track token validation process
- **Fixed useInsertionEffect Warning**: Resolved React 18 warning in auth hydration
  - Used requestAnimationFrame to defer token validation until after render cycle
  - Added ref pattern to avoid dependency issues in useEffect
  - Prevents "useInsertionEffect must not schedule updates" warning
- **Fixed Empty State Display**: Fixed recent bookings empty state not showing
  - Updated empty state condition to show for both authenticated and unauthenticated users
  - Added contextual empty state messages based on authentication status
  - Properly displays empty state when no bookings are available
  - **CRITICAL FIX**: Handle 401 authentication errors properly in empty state logic
  - Show empty state when API calls fail with authentication errors instead of blank content
  - Added specific error messages for authentication failures vs no bookings
  - Prevent showing error state for 401 errors (show empty state instead)

### Implemented Comprehensive Logout System
- **Enhanced Auth Store Logout**: Complete logout function with proper cleanup
  - Clears authentication tokens from SecureStore (`authToken`, `refreshToken`, `userCredentials`)
  - Resets all auth state including `onboarded` status
  - Clears user-specific data from all stores (booking, supplier)
  - Removes all persisted data from AsyncStorage
  - Proper error handling with fallback state clearing

### Complete Bookings Page API Integration
- **Real-time Booking Data**: Integrated booking API with hybrid data support
  - Replaced mock data with live API calls using `useBookingsQuery`
  - Maintains fallback to mock data for demo purposes when API unavailable
  - Comprehensive data mapping between API and UI interfaces
- **Enhanced Booking Cards**: Dynamic data mapping for both API and mock data
  - Helper functions to handle different data structures (API vs mock)
  - Proper companion information mapping (name, image, rating, verification)
  - Service data mapping with fallback handling
  - Booking details mapping (price, time, location, duration)
- **Loading and Error States**: Professional UX with comprehensive state handling
  - Loading shimmer while fetching booking data
  - Error states with retry functionality for failed API calls
  - Pull-to-refresh integration with actual API refetch
  - Contextual error messages for different failure scenarios
- **Statistics and Filtering**: Real-time stats based on actual booking data
  - Dynamic calculation of total, upcoming, and completed bookings
  - Tab filtering works with both API and mock data
  - Sorting functionality enhanced for hybrid data support
- **Authentication Integration**: Secure API calls with proper token handling
  - Authentication-aware API calls with automatic token inclusion
  - Graceful fallback to demo mode for unauthenticated users
  - Proper error handling for authentication failures
- **Multi-Store Data Clearing**: Automatic cleanup of related stores
  - Resets booking store data and current booking flow
  - Clears supplier profile, stats, and signup data
  - Removes persisted storage keys for all stores
- **Logout Utility Functions**: Multiple logout options for different contexts
  - `useLogout()`: Hook-based logout with React Query cache clearing
  - `simpleLogout()`: Fallback logout for non-React contexts
  - `performGlobalLogout()`: Smart logout that detects available context
- **React Query Integration**: Comprehensive cache management
  - Clears all cached queries and mutations
  - Cancels ongoing API requests
  - Removes cached data to prevent data leaks between users
- **Robust Error Handling**: Ensures logout completes even with errors
  - Graceful handling of missing tokens or storage items
  - Fallback navigation to auth screen
  - Comprehensive logging for debugging
- **Security Improvements**: Complete data isolation between sessions
  - Prevents data persistence between different user sessions
  - Clears sensitive information from all storage locations
  - Ensures fresh app state for new user login

### Added Comprehensive Booking API with React Query Integration
- **Complete Booking API Implementation**: Full CRUD operations for booking management
  - `createBooking()`: Create new bookings with companion, service, and payment details
  - `fetchBookings()`: Get bookings list with filtering and pagination
  - `fetchBookingById()`: Get detailed booking information including timeline
  - `updateBookingStatus()`: Update booking status (confirm, cancel, complete)
- **TypeScript Interfaces**: Comprehensive type definitions for all booking data
  - `CreateBookingRequest`: Booking creation payload with validation
  - `Booking`: Complete booking entity with all relationships
  - `BookingListItem`: Optimized booking data for list views
  - `BookingStatus` & `PaymentStatus`: Type-safe status enums
  - `BookingCompanion`, `BookingService`, `PaymentMethod`: Related entity types
- **React Query Hooks**: Optimized data fetching and caching
  - `useCreateBooking()`: Mutation hook for booking creation with auto-invalidation
  - `useBookingsQuery()`: Query hook with filtering, pagination, and caching
  - `useBookingQuery()`: Individual booking details with optimized refetch
  - `useUpdateBookingStatus()`: Status update mutation with cache invalidation
- **Convenience Hooks**: Pre-configured hooks for common use cases
  - `usePendingBookings()`, `useConfirmedBookings()`, `useCompletedBookings()`
  - `useBookingsWithPagination()`: Paginated booking lists
  - Status-specific filtering hooks for different booking states
- **Advanced Features**:
  - Authentication token integration with secure storage
  - Comprehensive error handling with specific retry logic
  - Optimized caching strategies (1-2 min stale time, 3-5 min garbage collection)
  - Automatic query invalidation on mutations for real-time updates
  - Proper TypeScript support throughout all functions and hooks

### Updated Companion Profile Page with API Integration and Shimmer Effects
- **API Integration**: Replaced mock data with real API calls
  - Integrated `useCompanionQuery` for fetching companion details
  - Integrated `useCompanionWeeklyAvailability` for availability data
  - Added proper error handling and loading states
- **Advanced Shimmer Loading Component**: 
  - Created dedicated `CompanionProfileShimmer` component with animated shimmer effects
  - Implemented `ShimmerBox` with LinearGradient and Animated API for smooth transitions
  - Realistic layout placeholders matching actual companion profile structure
  - Shimmer effects for header, profile card, tabs, availability, and additional content sections
  - Optimized animations with proper timing and opacity interpolation
  - Loading shimmer for availability dates while data is fetching
- **Data Structure Updates**:
  - Updated property names to match API interface (`profileImage` vs `image`)
  - Support for both `displayName` and `name` properties
  - Handle services as both strings and objects with proper type checking
  - Updated review structure to match API (`user.name`, `comment` vs `text`)
  - Conditional rendering for verified badge based on API data
- **Enhanced Error Handling**:
  - Comprehensive error states with user-friendly messages
  - Fallback to mock availability data when API is unavailable
  - Proper TypeScript typing for all API responses
- **Performance Improvements**:
  - Optimized re-renders with proper data transformation
  - Efficient availability data mapping from API format
  - Maintained existing UI/UX while improving data reliability

### Added Companion Details and Availability API Functions
- **New TypeScript Interfaces**: Added comprehensive type definitions for companion details and availability
  - `CompanionService`: Service details with pricing and duration
  - `CompanionDetails`: Full companion profile with services, reviews, and availability
  - `CompanionAvailability`: Weekly schedule and exceptions
  - `CompanionReview`: Review data with user information
  - `AvailabilityTimeSlot`: Time slot availability with pricing
  - `DayAvailability`: Daily availability with time slots
- **New API Functions**:
  - `fetchCompanionById()`: Get complete companion details by ID
  - `fetchCompanionAvailability()`: Get availability for date range
  - `getCompanionWeeklyAvailability()`: Get next 7 days availability
  - `getCompanionMonthlyAvailability()`: Get full month availability
  - `getCompanionAvailabilityRange()`: Get custom date range availability
- **New React Query Hooks**:
  - `useCompanionQuery()`: Hook for companion details with caching
  - `useCompanionAvailabilityQuery()`: Hook for availability data
  - `useCompanionWeeklyAvailability()`: Hook for weekly availability (booking flows)
  - `useCompanionMonthlyAvailability()`: Hook for monthly availability (calendar views)
- **Features**:
  - Proper error handling with specific retry logic
  - Authentication token support
  - Optimized caching strategies (2min for details, 1min for availability)
  - Automatic refetch on window focus for availability data
  - Enabled/disabled query logic based on required parameters 

- Integrated customer API into the search screen (`app/(app)/search.tsx`).
  - If the user is not a companion or supplier, the screen fetches and displays customers using the same UI as companions.
  - Unified loading, error, and empty states for both companions and customers.
  - Added a transform function to map customer data to the companion card UI. 

- Fix: Expo Router navigation crash on physical devices in CompanionDashboard quick actions by adding trailing slashes and casting router.push paths to 'any' for /supplier/availability/ and /supplier/dashboard/. 
- Fix: Android navigation crashes by enabling route configuration in supplier layout and correcting navigation paths 
- Fix: Android release build navigation by updating app.json and metro.config.js with proper route bundling configuration 
- Fix: Navigation structure by updating supplier layout configuration and ensuring exact route paths match 