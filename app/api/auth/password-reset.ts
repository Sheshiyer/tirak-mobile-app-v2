import axios from 'axios';
import { secureStorage } from '@/utils/secure-storage';
import { API_BASE_URL as BASE_URL } from '@/constants/api';

// Types for the password reset API
export interface ForgotPasswordRequest {
  identifier: string; // email or phone number
}

export interface ForgotPasswordResponse {
  success: boolean;
  data: {
    sent: boolean;
  };
  message: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  data: {
    reset: boolean;
  };
  message: string;
}

export interface PasswordResetError {
  success: false;
  error: string;
  message: string;
}

/**
 * Request a password reset for a user
 * @param identifier - Email address or phone number
 * @returns Promise<ForgotPasswordResponse>
 */
export const requestPasswordReset = async (identifier: string): Promise<ForgotPasswordResponse> => {
  try {
    const response = await axios.post<ForgotPasswordResponse>(
      `${BASE_URL}/api/auth/forgot-password`,
      { identifier },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    return response.data;
  } catch (error: any) {
    console.error('Password reset request error:', error);
    
    // Handle axios error response
    if (error.response?.data) {
      throw error.response.data as PasswordResetError;
    }
    
    // Handle network or other errors
    throw {
      success: false,
      error: 'Network error',
      message: 'Unable to connect to the server. Please check your internet connection.',
    } as PasswordResetError;
  }
};

/**
 * Reset password using a valid reset token
 * @param token - Reset token received via email/SMS
 * @param newPassword - New password (minimum 8 characters)
 * @returns Promise<ResetPasswordResponse>
 */
export const resetPassword = async (token: string, newPassword: string): Promise<ResetPasswordResponse> => {
  try {
    const response = await axios.post<ResetPasswordResponse>(
      `${BASE_URL}/api/auth/reset-password`,
      { 
        token, 
        newPassword 
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    return response.data;
  } catch (error: any) {
    console.error('Password reset error:', error);
    
    // Handle axios error response
    if (error.response?.data) {
      throw error.response.data as PasswordResetError;
    }
    
    // Handle network or other errors
    throw {
      success: false,
      error: 'Network error',
      message: 'Unable to connect to the server. Please check your internet connection.',
    } as PasswordResetError;
  }
};

/**
 * Store reset token temporarily for the reset password flow
 * @param token - Reset token to store
 */
export const storeResetToken = async (token: string): Promise<void> => {
  try {
    await secureStorage.setItemAsync('resetToken', token);
  } catch (error) {
    console.error('Error storing reset token:', error);
  }
};

/**
 * Retrieve stored reset token
 * @returns Promise<string | null>
 */
export const getStoredResetToken = async (): Promise<string | null> => {
  try {
    return await secureStorage.getItemAsync('resetToken');
  } catch (error) {
    console.error('Error retrieving reset token:', error);
    return null;
  }
};

/**
 * Clear stored reset token after successful password reset
 */
export const clearResetToken = async (): Promise<void> => {
  try {
    await secureStorage.deleteItemAsync('resetToken');
  } catch (error) {
    console.error('Error clearing reset token:', error);
  }
};
