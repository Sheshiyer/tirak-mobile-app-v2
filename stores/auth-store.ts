import { logger } from '@/utils/logger';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter, Platform } from 'react-native';
import { User, UserRole } from '@/types/auth';
import { secureStorage } from '@/utils/secure-storage';
import { usePaymentStore } from '@/stores/payment-store';
import { useBookingStore } from '@/stores/booking-store';
import { API_BASE_URL } from '@/constants/api';
import { isLocalPromptPayEnabled } from '@/constants/payment-capabilities';
import {
  getReviewAccount,
  isReviewAccountUser,
  isReviewModeEnabled,
  type ReviewAccountKey,
} from '@/constants/review-mode';
import { applyAnalyticsConsent } from '@/utils/posthog';
import { AccountConsents, EmailVerificationDelivery, RegistrationConsent, verificationRetryAt } from '@/utils/account-consent';
import { isDemoModeEnabled, isDemoIdentity } from '@/utils/demo-mode';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  onboarded: boolean;
  consents: AccountConsents | null;
  emailVerification: (EmailVerificationDelivery & { retryAt: number }) | null;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, userType: UserRole, contactNumber?: string, dateOfBirth?: Date, gender?: string, consent?: RegistrationConsent) => Promise<void>;
  demoLogin: (userType: UserRole) => Promise<void>;
  switchReviewAccount: (account: ReviewAccountKey) => Promise<void>;
  logout: () => Promise<void>;
  setOnboarded: (value: boolean) => void;
  clearError: () => void;
  updateUser: (userData: Partial<User>) => void;
  validateToken: () => Promise<void>;
  invalidateAuth: () => Promise<void>;
  loadConsents: () => Promise<void>;
  saveConsents: (preferences: Pick<AccountConsents, 'marketingOptIn' | 'analyticsOptIn'>) => Promise<void>;
  setEmailVerification: (delivery: EmailVerificationDelivery) => void;
}

// Helper to format a Date into local YYYY-MM-DD without timezone shifting
const formatDateLocal = (date?: Date): string | undefined => {
  if (!date) return undefined;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

async function clearAccountScopedState(): Promise<void> {
  await usePaymentStore.getState().clearPaymentSession();
  useBookingStore.getState().resetBooking();
  await useBookingStore.persist.clearStorage();
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      onboarded: false,
      consents: null,
      emailVerification: null,

      setEmailVerification: (delivery) => set({ emailVerification: { ...delivery, retryAt: verificationRetryAt(delivery.retryAfterSeconds) } }),

      loadConsents: async () => {
        const userId = get().user?.id;
        if (!userId || isDemoIdentity(get().user)) return;
        const { getAccountConsents } = await import('@/utils/account-api');
        try {
          const consents = await getAccountConsents();
          if (get().user?.id !== userId) return;
          set({ consents });
          await applyAnalyticsConsent(userId, consents.analyticsOptIn === true);
        } catch (error) {
          if (get().user?.id === userId) {
            set({ consents: null });
            await applyAnalyticsConsent();
          }
          throw error;
        }
      },

      saveConsents: async (preferences) => {
        const userId = get().user?.id;
        if (!userId) throw new Error('Please sign in to save your preferences.');
        // A withdrawal takes effect on this device immediately, even offline.
        if (!preferences.analyticsOptIn) await applyAnalyticsConsent();
        const { saveAccountConsents } = await import('@/utils/account-api');
        const consents = await saveAccountConsents(preferences);
        if (get().user?.id !== userId) return;
        set({ consents });
        await applyAnalyticsConsent(userId, consents.analyticsOptIn === true);
      },

      setOnboarded: (value: boolean) => {
        set({ onboarded: value });
      },

      invalidateAuth: async () => {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
          onboarded: false,
          consents: null,
          emailVerification: null,
        });

        const cleanup = (operation: () => Promise<void>) => Promise.resolve().then(operation);
        await Promise.allSettled([
          cleanup(() => applyAnalyticsConsent()),
          cleanup(() => usePaymentStore.getState().clearPaymentSession()),
          cleanup(() => secureStorage.deleteItemAsync('authToken')),
          cleanup(() => secureStorage.deleteItemAsync('refreshToken')),
          cleanup(() => secureStorage.deleteItemAsync('userCredentials')),
        ]);
      },

      login: async (email: string, password: string) => {
        await applyAnalyticsConsent();
        set({ isLoading: true, error: null, consents: null, emailVerification: null });
        try {
          // Import the real API function
          const { login: loginAPI } = await import('@/services/api/auth/login');
          
          const response = await loginAPI({
            identifier: email,
            password
          });

          if (response.success && response.data && response.data.user) {
            // Store tokens in secure storage
            await secureStorage.setItemAsync("authToken", response.data.accessToken);
            await secureStorage.setItemAsync("refreshToken", response.data.refreshToken);

            // Create user object from response
            const user: User = {
              id: response.data.user.id,
              name: response.data.user.name || response.data.user.email?.split('@')[0] || 'User',
              email: response.data.user.email,
              userType: response.data.user.userType as UserRole,
              verified: response.data.user.emailVerified || false,
              phone: response.data.user.phone,
              createdAt: new Date().toISOString(),
            };

            if (get().user?.id !== user.id) usePaymentStore.getState().resetPayment();

            // Store user credentials for token validation
            await secureStorage.setItemAsync("userCredentials", JSON.stringify(user));

            set({ user, isAuthenticated: true, onboarded: true, isLoading: false });
            await get().loadConsents().catch(() => {});
          } else {
            const errorMessage = response.message || 'Login failed';
            set({ error: errorMessage, isLoading: false });
            throw new Error(errorMessage); // Throw error so UI can catch it
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Login failed';
          set({ error: errorMessage, isLoading: false });
          throw error; // Re-throw the error so UI can catch it
        }
      },

      register: async (name: string, email: string, password: string, userType: UserRole, contactNumber?: string, dateOfBirth?: Date, gender?: string, consent?: RegistrationConsent) => {
        await applyAnalyticsConsent();
        set({ isLoading: true, error: null, consents: null, emailVerification: null });
        try {
          // Import the real API function
          const { register: registerAPI } = await import('@/services/api/auth/register');
          
          // Prepare the registration data
          const registrationData = {
            display_name: name,
            email,
            password,
            userType: userType as "customer" | "companion" | "supplier", // Ensure proper typing
            phone: contactNumber,
            // Format as local YYYY-MM-DD to avoid timezone-induced off-by-one
            dateOfBirth: formatDateLocal(dateOfBirth),
            gender: gender as "male" | "female" | "other" | "prefer_not_to_say" | undefined,
            ...consent,
          };

          const response = await registerAPI(registrationData);

          if (response.success && response.token && response.user?.id) {
            // Store tokens if available
            if (response.token) {
              await secureStorage.setItemAsync("authToken", response.token);
            }
            if (response.refreshToken) {
              await secureStorage.setItemAsync("refreshToken", response.refreshToken);
            }

            // Create user object from response
            const user: User = {
              id: response.user.id,
              name: response.user?.name || name,
              email: response.user?.email || email,
              userType: (response.user?.userType as UserRole) || userType,
              verified: response.user?.verified || false,
              phone: response.user?.phone || contactNumber,
              // Persist date of birth consistently without UTC conversion
              dateOfBirth: formatDateLocal(dateOfBirth),
              createdAt: new Date().toISOString(),
            };

            if (get().user?.id !== user.id) usePaymentStore.getState().resetPayment();

            // Store user credentials for token validation
            await secureStorage.setItemAsync("userCredentials", JSON.stringify(user));

            set({ user, isAuthenticated: true, onboarded: true, isLoading: false });
            get().setEmailVerification(response.emailVerification || { deliveryStatus: 'unavailable', retryAfterSeconds: 0 });
            await get().loadConsents().catch(() => {});
          } else {
            const errorMessage = response.message || 'Registration failed';
            set({ error: errorMessage, isLoading: false });
            throw new Error(errorMessage); // Throw error so UI can catch it
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Registration failed';
          set({ error: errorMessage, isLoading: false });
          throw error; // Re-throw the error so UI can catch it
        }
      },

      logout: async () => {
        try {
          set({ isLoading: true });
          await applyAnalyticsConsent();

          logger.log('[Logout] Starting logout process...');
          
          // IMPORTANT: Clear all storage FIRST before anything else
          // This prevents re-authentication on page reload
          
          await get().invalidateAuth();
          logger.log('[Logout] Cleared authentication and payment session');
          
          // Clear other stores that contain user-specific data
          // Import and reset booking store
          const { useBookingStore } = await import('./booking-store');
          useBookingStore.getState().resetBooking();
          
          // Import and reset supplier store if user was a supplier
          const { useSupplierStore } = await import('./supplier-store');
          const supplierStore = useSupplierStore.getState();
          if (supplierStore.isSupplier) {
            supplierStore.setIsSupplier(false);
            supplierStore.setProfile(null);
            supplierStore.setStats(null);
            supplierStore.resetSignupData();
          }
          
          // Clear AsyncStorage of all persisted data
          // CRITICAL: Clear AsyncStorage BEFORE any navigation to prevent re-authentication
          logger.log('[Logout] Clearing AsyncStorage...');
          try {
            await AsyncStorage.multiRemove([
              'tirak-auth-storage',
              'tirak-booking-storage',
              'tirak-supplier-storage',
            ]);
            logger.log('[Logout] AsyncStorage cleared via multiRemove');
          } catch (storageError) {
            logger.warn('[Logout] AsyncStorage.multiRemove failed, trying individual removes:', storageError);
            // Fallback: try removing individually
            await AsyncStorage.removeItem('tirak-auth-storage');
            await AsyncStorage.removeItem('tirak-booking-storage');
            await AsyncStorage.removeItem('tirak-supplier-storage');
            logger.log('[Logout] AsyncStorage cleared via individual removes');
          }
          
          // For web: Also clear localStorage directly as a safety measure
          if (typeof window !== 'undefined' && window.localStorage) {
            try {
              // Clear all storage keys including tokens
              window.localStorage.removeItem('authToken');
              window.localStorage.removeItem('refreshToken');
              window.localStorage.removeItem('userCredentials');
              window.localStorage.removeItem('tirak-auth-storage');
              window.localStorage.removeItem('tirak-booking-storage');
              window.localStorage.removeItem('tirak-supplier-storage');
              window.localStorage.removeItem('tirak-payment-session');
              logger.log('[Logout] localStorage cleared directly');
            } catch (localStorageError) {
              logger.warn('[Logout] localStorage clear failed:', localStorageError);
            }
          }
          
          // Clear React Query cache if available
          try {
            // This will be available if the app has been initialized with QueryClient
            const { QueryClient } = await import('@tanstack/react-query');
            // Note: We can't directly access the QueryClient instance from here
            // The app should handle clearing the cache after logout
          } catch (error) {
            // React Query might not be available in all contexts
          }
          
          logger.log('Logout completed successfully');
          
        } catch (error) {
          console.error('Error during logout:', error);
          await get().invalidateAuth();
        }
      },

      clearError: () => {
        set({ error: null });
      },

      demoLogin: async (userType: UserRole) => {
        const demoIdentity = { id: userType === 'companion' ? 'demo_companion_001' : 'demo_customer_001' };
        if (!isDemoModeEnabled(demoIdentity)) throw new Error('Demo mode is not enabled in this build. Please sign in to your account.');
        await applyAnalyticsConsent();
        set({ isLoading: true, error: null });
        try {
          // Simulate network delay for realistic demo experience
          await new Promise(resolve => setTimeout(resolve, 800));

          // Create demo user based on userType
          const demoUser: User = userType === 'companion' ? {
            id: 'demo_companion_001',
            name: 'Siriporn Nakamura',
            email: 'demo.companion@tirak.com',
            userType: 'companion',
            verified: true,
            profileImage: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?q=80&w=1000&auto=format&fit=crop',
            bio: 'Experienced tour guide and cultural enthusiast. I love sharing the beauty of Thailand with visitors from around the world.',
            location: 'Bangkok, Thailand',
            phone: '+66 81 234 5678',
            dateOfBirth: '1995-03-15',
            createdAt: new Date().toISOString(),
          } : {
            id: 'demo_customer_001',
            name: 'Alex Johnson',
            email: 'demo.customer@tirak.com',
            userType: 'customer',
            verified: true,
            profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=1000&auto=format&fit=crop',
            bio: 'Travel enthusiast exploring Thailand. Looking for authentic local experiences and cultural connections.',
            location: 'Bangkok, Thailand',
            phone: '+66 81 987 6543',
            dateOfBirth: '1988-07-22',
            createdAt: new Date().toISOString(),
          };

          if (get().user?.id !== demoUser.id) usePaymentStore.getState().resetPayment();
          await secureStorage.deleteItemAsync('authToken');
          await secureStorage.deleteItemAsync('refreshToken');
          await secureStorage.setItemAsync('userCredentials', JSON.stringify(demoUser));
          if (
            userType === 'customer'
            && isLocalPromptPayEnabled({
              flag: process.env.EXPO_PUBLIC_PROMPTPAY_ENABLED,
              apiBaseUrl: API_BASE_URL,
              isDev: __DEV__,
              reviewMode: isReviewModeEnabled(),
            })
          ) {
            await secureStorage.setItemAsync('authToken', 'tirak-local-fixture-token');
          }
          set({ user: demoUser, isAuthenticated: true, onboarded: true, isLoading: false, consents: null, emailVerification: null });
        } catch (error) {
          const errorMessage = 'Demo login failed';
          set({ error: errorMessage, isLoading: false });
          throw new Error(errorMessage); // Throw error so UI can catch it
        }
      },

      switchReviewAccount: async (accountKey: ReviewAccountKey) => {
        set({ isLoading: true, error: null });

        if (!isReviewModeEnabled()) {
          const errorMessage = 'App review accounts are not enabled in this build';
          set({ isLoading: false, error: errorMessage });
          throw new Error(errorMessage);
        }

        try {
          await applyAnalyticsConsent();
          const reviewAccount = getReviewAccount(accountKey);
          const reviewUser = { ...reviewAccount.user };

          await clearAccountScopedState();
          await Promise.all([
            secureStorage.deleteItemAsync('authToken'),
            secureStorage.deleteItemAsync('refreshToken'),
          ]);
          await secureStorage.setItemAsync('userCredentials', JSON.stringify(reviewUser));

          set({
            user: reviewUser,
            isAuthenticated: true,
            onboarded: true,
            isLoading: false,
            error: null,
            consents: null,
            emailVerification: null,
          });
        } catch (error) {
          const errorMessage = error && typeof error === 'object' && 'message' in error
            ? String(error.message)
            : 'Unable to switch app review account';
          set({ isLoading: false, error: errorMessage });
          throw new Error(errorMessage);
        }
      },

      updateUser: (userData: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          const nextUser = { ...currentUser, ...userData };
          if (currentUser.id !== nextUser.id) usePaymentStore.getState().resetPayment();
          set({ user: nextUser });
          secureStorage.setItemAsync("userCredentials", JSON.stringify(nextUser)).catch((error) => {
            logger.warn('Failed to persist updated user credentials', error);
          });
        }
      },

      validateToken: async () => {
        try {
          // Check if there's a stored auth token
          const token = await secureStorage.getItemAsync("authToken");
          const userCredentials = await secureStorage.getItemAsync("userCredentials");
          
          // logger.log('Token validation - token exists:', !!token);
          // logger.log('Token validation - credentials exist:', !!userCredentials);
          
          if (userCredentials) {
            try {
              const userData = JSON.parse(userCredentials);
              if (!userData || typeof userData !== 'object' || typeof userData.id !== 'string' || !userData.id) {
                throw new Error('Stored user credentials are invalid');
              }
              const isEnabledReviewAccount = isReviewModeEnabled() && isReviewAccountUser(userData);
              const isEnabledDemoAccount = isDemoModeEnabled(userData);
              if (userData.id.startsWith('demo_') && !isEnabledReviewAccount && !isEnabledDemoAccount) {
                await get().invalidateAuth();
                return;
              }
              if (!token && !isEnabledReviewAccount && !isEnabledDemoAccount) {
                await get().invalidateAuth();
                logger.log('No valid token found - user not authenticated');
                return;
              }
              if (get().user?.id !== userData.id) {
                usePaymentStore.getState().resetPayment();
                await applyAnalyticsConsent();
                set({ consents: null, emailVerification: null });
              }
              // If we have both token and user data, consider user authenticated
              set({ 
                user: userData, 
                isAuthenticated: true, 
                isLoading: false 
              });
              if (!get().consents) await get().loadConsents().catch(() => {});
              // logger.log('Token validation successful - user authenticated:', userData.email);
            } catch (parseError) {
              console.error('Error parsing stored user credentials:', parseError);
              await get().invalidateAuth();
            }
          } else {
            await get().invalidateAuth();
            logger.log('No valid token found - user not authenticated');
          }
        } catch (error) {
          console.error('Error validating token:', error);
          await get().invalidateAuth();
        }
      },
    }),
    {
      name: 'tirak-auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      skipHydration: false,
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        onboarded: state.onboarded,
      }),
    }
  )
);

// Listen for unauthorized events from browser API calls.
if (Platform.OS !== 'web') {
  DeviceEventEmitter.addListener('auth:unauthorized', async () => {
    if (isReviewModeEnabled() && isReviewAccountUser(useAuthStore.getState().user)) return;
    logger.warn('Auth:unauthorized event received - logging out');
    await useAuthStore.getState().invalidateAuth();
  });
} else if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  window.addEventListener('auth:unauthorized', async () => {
    if (isReviewModeEnabled() && isReviewAccountUser(useAuthStore.getState().user)) return;
    logger.warn('Auth:unauthorized event received - logging out');
    await useAuthStore.getState().invalidateAuth();
  });
}
