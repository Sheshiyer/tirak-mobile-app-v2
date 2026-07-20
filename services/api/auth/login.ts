import { logger } from '@/utils/logger';
import axios from "axios";
import { apiUrl } from '@/constants/api';

// TypeScript interface for login data
interface LoginData {
  identifier: string;
  password: string;
}

// Response interface matching actual backend response
interface LoginResponse {
  success: boolean;
  message: string;
  data?: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    user: {
    id: string;
    name: string;
    email: string;
      userType: string;
      phone?: string;
      emailVerified?: boolean;
      phoneVerified?: boolean;
      status?: string;
    };
  };
}

export const login = async (userData: LoginData): Promise<LoginResponse> => {
  try {
    // logger.log("userData", userData);
    const response = await axios.post(apiUrl('/api/auth/login'), userData);
    
    return response.data;
  } catch (error) {
    // Handle different error types
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.response?.data?.error || "Login failed";
      logger.warn("Login request failed:", {
        status: error.response?.status,
        message,
      });
      throw new Error(message);
    }
    
    logger.warn("Login request failed:", error);
    throw new Error("Network error occurred");
  }
};
