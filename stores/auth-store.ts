import { logger } from '@/utils/logger';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter, Platform } from 'react-native';
import { User, UserRole } from '@/types/auth';
import { secureStorage } from '@/utils/secure-storage';
import { posthog } from '@/utils/posthog';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  onboarded: boolean;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, userType: UserRole, contactNumber?: string, dateOfBirth?: Date, gender?: string) => Promise<void>;
  demoLogin: (userType: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  setOnboarded: (value: boolean) => void;
  clearError: () => void;
  updateUser: (userData: Partial<User>) => void;
  validateToken: () => Promise<void>;
}

// Helper to format a Date into local YYYY-MM-DD without timezone shifting
const formatDateLocal = (date?: Date): string | undefined => {
  if (!date) return undefined;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      onboarded: false,

      setOnboarded: (value: boolean) => {
        set({ onboarded: value });
      },

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          // Import the real API function
          const { login: loginAPI } = await import('@/app/api/auth/login');
          
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

            // Store user credentials for token validation
            await secureStorage.setItemAsync("userCredentials", JSON.stringify(user));

            set({ user, isAuthenticated: true, onboarded: true, isLoading: false });
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

      register: async (name: string, email: string, password: string, userType: UserRole, contactNumber?: string, dateOfBirth?: Date, gender?: string) => {
        set({ isLoading: true, error: null });
        try {
          // Import the real API function
          const { register: registerAPI } = await import('@/app/api/auth/register');
          
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
          };

          const response = await registerAPI(registrationData);

          if (response.success) {
            // Store tokens if available
            if (response.token) {
              await secureStorage.setItemAsync("authToken", response.token);
            }
            if (response.refreshToken) {
              await secureStorage.setItemAsync("refreshToken", response.refreshToken);
            }

            // Create user object from response
            const user: User = {
              id: response.user?.id || 'temp-id',
              name: response.user?.name || name,
              email: response.user?.email || email,
              userType: (response.user?.userType as UserRole) || userType,
              verified: response.user?.verified || false,
              phone: response.user?.phone || contactNumber,
              // Persist date of birth consistently without UTC conversion
              dateOfBirth: formatDateLocal(dateOfBirth),
              createdAt: new Date().toISOString(),
            };

            // Store user credentials for token validation
            await secureStorage.setItemAsync("userCredentials", JSON.stringify(user));

            set({ user, isAuthenticated: true, onboarded: true, isLoading: false });
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
          posthog.capture('user_logged_out');
          posthog.reset();

          logger.log('[Logout] Starting logout process...');
          
          // IMPORTANT: Clear all storage FIRST before anything else
          // This prevents re-authentication on page reload
          
          // Clear authentication token from secure storage
          await secureStorage.deleteItemAsync("authToken");
          logger.log('[Logout] Cleared authToken');
          
          // Clear refresh token if it exists
          await secureStorage.deleteItemAsync("refreshToken");
          logger.log('[Logout] Cleared refreshToken');
          
          // Clear any other sensitive data from secure storage
          await secureStorage.deleteItemAsync("userCredentials");
          logger.log('[Logout] Cleared userCredentials');
          
          // Clear user state and authentication
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
            onboarded: false, // Reset onboarded status
          });
          
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
          // Even if there's an error, still clear the auth state
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
            onboarded: false,
          });
        }
      },

      clearError: () => {
        set({ error: null });
      },

      demoLogin: async (userType: UserRole) => {
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

          set({ user: demoUser, isAuthenticated: true, onboarded: true, isLoading: false });
        } catch (error) {
          const errorMessage = 'Demo login failed';
          set({ error: errorMessage, isLoading: false });
          throw new Error(errorMessage); // Throw error so UI can catch it
        }
      },

      updateUser: (userData: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          const nextUser = { ...currentUser, ...userData };
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
          
          if (token && userCredentials) {
            try {
              const userData = JSON.parse(userCredentials);
              // If we have both token and user data, consider user authenticated
              set({ 
                user: userData, 
                isAuthenticated: true, 
                isLoading: false 
              });
              // logger.log('Token validation successful - user authenticated:', userData.email);
            } catch (parseError) {
              console.error('Error parsing stored user credentials:', parseError);
              // Clear invalid data
              await secureStorage.deleteItemAsync("authToken").catch(() => {});
              await secureStorage.deleteItemAsync("userCredentials").catch(() => {});
              set({ isAuthenticated: false });
            }
          } else {
            // No token or credentials found
            set({ isAuthenticated: false });
            logger.log('No valid token found - user not authenticated');
          }
        } catch (error) {
          console.error('Error validating token:', error);
          set({ isAuthenticated: false });
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
  DeviceEventEmitter.addListener('auth:unauthorized', () => {
    logger.warn('Auth:unauthorized event received - logging out');
    useAuthStore.getState().logout();
  });
} else if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  window.addEventListener('auth:unauthorized', () => {
    logger.warn('Auth:unauthorized event received - logging out');
    useAuthStore.getState().logout();
  });
}
