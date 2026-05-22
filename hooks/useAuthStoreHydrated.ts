import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuthStore } from '@/stores/auth-store';

/**
 * Custom hook to safely access auth store after hydration
 * Prevents useInsertionEffect warnings in React 18
 */
export function useAuthStoreHydrated() {
  const [isHydrated, setIsHydrated] = useState(false);

  const user = useAuthStore((state) => state.user);
  const logoutStore = useAuthStore((state) => state.logout);
  const login = useAuthStore((state) => state.login);
  const register = useAuthStore((state) => state.register);
  const demoLogin = useAuthStore((state) => state.demoLogin);
  const setOnboarded = useAuthStore((state) => state.setOnboarded);
  const clearError = useAuthStore((state) => state.clearError);
  const updateUser = useAuthStore((state) => state.updateUser);
  const validateToken = useAuthStore((state) => state.validateToken);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);
  const onboarded = useAuthStore((state) => state.onboarded);

  // Use ref to store validateToken to avoid dependency issues
  const validateTokenRef = useRef(validateToken);
  validateTokenRef.current = validateToken;

  useEffect(() => {
    // Mark as hydrated after first render
    setIsHydrated(true);
  }, []);

  // Validate token after hydration with proper async handling to avoid useInsertionEffect warnings
  useEffect(() => {
    if (isHydrated) {
      // Use requestAnimationFrame to defer execution until after render
      const frameId = requestAnimationFrame(() => {
        validateTokenRef.current().catch(console.error);
      });
      
      return () => cancelAnimationFrame(frameId);
    }
  }, [isHydrated]);

  // Wrap logout to prevent useInsertionEffect warnings
  const logout = useCallback(() => {
    if (isHydrated) {
      return logoutStore();
    }
    return Promise.resolve();
  }, [isHydrated, logoutStore]);

  return {
    isHydrated,
    user: isHydrated ? user : null,
    logout,
    login,
    register,
    demoLogin,
    setOnboarded,
    clearError,
    updateUser,
    isAuthenticated: isHydrated ? isAuthenticated : false,
    isLoading: isHydrated ? isLoading : true,
    error: isHydrated ? error : null,
    onboarded: isHydrated ? onboarded : false,
  };
}
