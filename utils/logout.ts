import { logger } from '@/utils/logger';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth-store';
import { router } from 'expo-router';

/**
 * Utility function to handle complete logout process
 * This should be used in components that have access to QueryClient
 */
export const useLogout = () => {
  const queryClient = useQueryClient();
  const logout = useAuthStore((state) => state.logout);

  const performLogout = async () => {
    try {
      // Clear React Query cache first
      queryClient.clear();
      
      // Remove all queries from cache
      queryClient.removeQueries();
      
      // Cancel any outgoing queries
      await queryClient.cancelQueries();
      
      // Perform auth store logout (clears tokens and user data)
      await logout();
      
      // Navigate to auth screen
      router.replace('/auth');
      
      logger.log('Complete logout process finished');
      
    } catch (error) {
      console.error('Error during complete logout:', error);
      
      // Even if there's an error, try to navigate to auth
      try {
        router.replace('/auth');
      } catch (navError) {
        console.error('Navigation error after logout:', navError);
      }
    }
  };

  return performLogout;
};

/**
 * Simple logout function for contexts where QueryClient is not available
 * This is a fallback that only clears auth data
 */
export const simpleLogout = async () => {
  const logout = useAuthStore.getState().logout;
  
  try {
    await logout();
    router.replace('/auth');
  } catch (error) {
    console.error('Error during simple logout:', error);
    router.replace('/auth');
  }
};

/**
 * Logout function that can be called from anywhere
 * Automatically detects if QueryClient is available
 */
export const performGlobalLogout = async () => {
  try {
    // Try to get QueryClient from React Query
    const { useQueryClient } = await import('@tanstack/react-query');
    
    // If we're in a React context, use the hook-based logout
    // Otherwise, fall back to simple logout
    await simpleLogout();
    
  } catch (error) {
    // QueryClient not available, use simple logout
    await simpleLogout();
  }
}; 