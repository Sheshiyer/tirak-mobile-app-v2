import { logger } from '@/utils/logger';
import * as SecureStore from "expo-secure-store";
import { router } from 'expo-router';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  userType: string;
  verified?: boolean;
  createdAt?: string;
}

interface AuthResponse {
  success: boolean;
  message: string;
  user?: AuthUser;
  token?: string;
  refreshToken?: string;
}

export const handleAuthSuccess = async (response: AuthResponse) => {
  if (response.success && response.token && response.refreshToken && response.user) {
    // Store authentication data
    await SecureStore.setItemAsync("authToken", response.token);
    await SecureStore.setItemAsync("refreshToken", response.refreshToken);
    await SecureStore.setItemAsync("user", JSON.stringify(response.user));
    
    logger.log("Auth success - navigating to app...");
    
    // Navigate to main app
    router.replace('/(app)');
    
    return true;
  }
  return false;
};

export const clearAuthData = async () => {
  try {
    await SecureStore.deleteItemAsync("authToken");
    await SecureStore.deleteItemAsync("refreshToken");
    await SecureStore.deleteItemAsync("user");
  } catch (error) {
    console.error("Error clearing auth data:", error);
  }
};

export const getStoredAuthData = async () => {
  try {
    const token = await SecureStore.getItemAsync("authToken");
    const refreshToken = await SecureStore.getItemAsync("refreshToken");
    const userString = await SecureStore.getItemAsync("user");
    
    if (token && refreshToken && userString) {
      return {
        token,
        refreshToken,
        user: JSON.parse(userString) as AuthUser,
      };
    }
  } catch (error) {
    console.error("Error getting stored auth data:", error);
  }
  
  return null;
}; 