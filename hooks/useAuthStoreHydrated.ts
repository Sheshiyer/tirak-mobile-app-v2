import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/stores/auth-store';

// Deduplicate concurrent consumers while restoration is in flight. A later
// mount validates again instead of trusting a permanently cached readiness bit.
let restoration: Promise<void> | null = null;
function restoreAuthSession(): Promise<void> {
  if (!restoration) {
    restoration = (async () => {
      if (!useAuthStore.persist.hasHydrated()) await useAuthStore.persist.rehydrate();
      if (!useAuthStore.persist.hasHydrated()) throw new Error('Authentication storage has not hydrated');
      await useAuthStore.getState().validateToken();
    })().finally(() => { restoration = null; });
  }
  return restoration;
}

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
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);
  const onboarded = useAuthStore((state) => state.onboarded);

  useEffect(() => {
    let mounted = true;
    // Persistence and token-backed identity restoration must both finish before
    // route guards can classify this browser session as authenticated/anonymous.
    void restoreAuthSession().then(() => {
      if (mounted) setIsHydrated(true);
    }).catch(error => {
      console.error('Unable to restore authentication', error);
    });
    return () => { mounted = false; };
  }, []);

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
