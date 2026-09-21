import { logger } from '@/utils/logger';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { getAuthToken } from '../companion/companion';
import { apiUrl } from '@/constants/api';

// Types
export interface Customer {
  id: string;
  email: string;
  phone: string;
  displayName: string;
  profileImage: string;
  status: string;
  loyaltyPoints: number;
  emailVerified: boolean;
  phoneVerified: boolean;
  preferredLanguage: string;
  createdAt: string;
  lastLoginAt: string;
  preferences: Record<string, any>;
}

export interface CustomerListResponse {
  success: boolean;
  data: Customer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message: string;
}

export interface CustomerQueryParams {
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

const buildCustomerQueryParams = (params: CustomerQueryParams = {}): URLSearchParams => {
  const queryParams = new URLSearchParams();

  const appendValue = (key: string, value?: string) => {
    if (value === undefined || value === null || value === '') return;
    queryParams.append(key, value);
  };

  // The live Worker currently rejects numeric pagination query params as
  // strings. Keep this list endpoint to string-only filters and let the backend
  // apply its default pagination.
  appendValue('search', params.search?.trim());
  appendValue('status', params.status);
  appendValue('sortBy', params.sortBy);
  appendValue('sortOrder', params.sortOrder);

  return queryParams;
};

export interface CustomerProfile {
  id: string;
  displayName: string;
  profileImage: string;
  loyaltyPoints: number;
  preferences: Record<string, any>;
  memberSince: string;
  statistics: {
    totalBookings: number;
    completedBookings: number;
    pendingBookings: number;
    cancelledBookings: number;
    favoriteSuppliers: number;
  };
  language: string;
  emailVerified: boolean;
  phoneVerified: boolean;
}

export interface CustomerProfileResponse {
  success: boolean;
  data: CustomerProfile;
  message: string;
}

// GET /customers/all
export const fetchCustomers = async (params: CustomerQueryParams = {}): Promise<CustomerListResponse> => {
  const token = await getAuthToken();
  const queryParams = buildCustomerQueryParams(params);
  const queryString = queryParams.toString();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
  const url = apiUrl(`/api/customers/all${queryString ? `?${queryString}` : ''}`);

 try {
    // logger.log('url:', url); 
    const response = await axios.get(url, {
      headers,
    });
    return response.data;
 } catch (error) {
  if (axios.isAxiosError(error)) {
    const statusCode = error.response?.status;
    if (statusCode === 400 && queryString) {
      logger.warn('Customer list query rejected; retrying without filters', {
        url,
        status: statusCode,
        data: error.response?.data,
      });
      const response = await axios.get(apiUrl('/api/customers/all'), { headers });
      return response.data;
    }

    logger.warn('Error fetching customers', {
      status: statusCode,
      data: error.response?.data,
      url,
    });
  } else {
    logger.warn('Error fetching customers', error);
  }
  throw error;
 }  
};

export const useCustomers = (params: CustomerQueryParams = {}) => {
  return useQuery({
    queryKey: ['customers', params],
    queryFn: () => fetchCustomers(params),
  });
};

// GET /customers/:id
export const fetchCustomerProfile = async (id: string): Promise<CustomerProfileResponse> => {
try {
    const token = await getAuthToken();
  const url = apiUrl(`/api/customers/${id}`);
  const response = await axios.get(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
  });
  return response.data;
} catch (error) {
  console.error('Error fetching customer profile:', error);
  throw error;
}
};

export const useCustomerProfile = (id: string) => {
  return useQuery({
    queryKey: ['customer', id],
    queryFn: () => fetchCustomerProfile(id),
    enabled: !!id,
  });
};
