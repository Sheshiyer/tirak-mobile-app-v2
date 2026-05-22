import axios from 'axios';
import { DeviceEventEmitter, Platform } from 'react-native';
import { logger } from '@/utils/logger';

// Global error handler for API responses
export const handleApiError = (error: any): void => {
  const status = axios.isAxiosError(error) ? error.response?.status : error?.response?.status;
  const message = axios.isAxiosError(error)
    ? error.response?.data?.message || error.message
    : error?.response?.data?.message || error?.message;

  if (status) {
    
    // Handle 401 Unauthorized - Token expired or invalid
    if (status === 401) {
      logger.warn('API 401 Unauthorized - Token expired or invalid');
      // Emit event for auth store to handle logout
      // This avoids circular dependencies
      if (Platform.OS !== 'web') {
        DeviceEventEmitter.emit('auth:unauthorized');
      } else if (
        typeof window !== 'undefined' &&
        typeof window.dispatchEvent === 'function' &&
        typeof CustomEvent === 'function'
      ) {
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      }
      return;
    }
    
    // Handle 403 Forbidden
    if (status === 403) {
      logger.warn('API 403 Forbidden:', message);
      return;
    }
    
    // Handle 404 Not Found
    if (status === 404) {
      logger.log('API 404 Not Found:', message);
      return;
    }
    
    // Log other errors
    logger.error('API Error:', status, message);
  } else {
    logger.error('Non-API Error:', error);
  }
};

// Check if error is 401
export const isUnauthorizedError = (error: any): boolean => {
  return axios.isAxiosError(error) && error.response?.status === 401;
};
