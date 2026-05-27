import { logger } from '@/utils/logger';
import axios from "axios";
import { apiUrl } from '@/constants/api';

// TypeScript interface for registration data
interface RegisterData {
  display_name: string;
  email: string;
  password: string;
  userType: "customer" | "companion" | "supplier";
  phone?: string;
  dateOfBirth?: string;
  gender?: "male" | "female" | "other" | "prefer_not_to_say";
  referralCode?: string;
}

// Response interface
interface RegisterResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    name: string;
    email: string;
    userType: string;
    verified?: boolean;
    createdAt?: string;
    phone?: string;
  };
  token?: string; // mapped from accessToken
  refreshToken?: string;
}

export const register = async (userData: RegisterData): Promise<RegisterResponse> => {
  try {
    const response = await axios.post(apiUrl('/api/auth/register'), userData);

    const api = response.data;

    // Map backend shape { success, data: { user, accessToken, refreshToken }, message }
    if (api && api.data) {
      const mapped: RegisterResponse = {
        success: api.success,
        message: api.message,
        user: api.data.user
          ? {
              id: api.data.user.id,
              name: api.data.user.name ?? '',
              email: api.data.user.email,
              userType: api.data.user.userType,
              verified: api.data.user.emailVerified ?? api.data.user.verified ?? false,
              createdAt: api.data.user.createdAt,
              phone: api.data.user.phone,
            }
          : undefined,
        token: api.data.accessToken,
        refreshToken: api.data.refreshToken,
      };
      return mapped;
    }

    // Fallback to original shape if already mapped by backend
    return api as RegisterResponse;
  } catch (error) {
    // Handle different error types
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.response?.data?.error || "Registration failed";
      logger.warn("Registration request failed:", {
        status: error.response?.status,
        message,
      });
      throw new Error(message);
    }
    
    logger.warn("Registration request failed:", error);
    throw new Error("Network error occurred");
  }
};
