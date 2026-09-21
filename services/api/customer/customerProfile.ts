import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { handleApiError } from '@/utils/api-errors';
import { apiUrl } from '@/constants/api';
import { logger } from '@/utils/logger';
import { getDemoModeEnabled } from '@/utils/demo-mode';

// Optionally import getAuthToken if you use auth
import { getAuthToken } from '../companion/companion';

// Types
export interface CustomerProfile {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'companion';
  verified: boolean;
  profileImage?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  preferences: {
    language: string;
    currency: string;
    notifications: {
      push: boolean;
      email: boolean;
      sms: boolean;
    };
  };
  createdAt: string;
  updatedAt: string;
}

export interface CustomerProfileResponse {
  success: boolean;
  data: CustomerProfile;
  message?: string;
}

const isRemoteImageUrl = (value: unknown): value is string => {
  return typeof value === 'string' && /^https?:\/\//i.test(value.trim());
};

// GET /users/profile
export const fetchCustomerProfile = async (): Promise<CustomerProfileResponse> => {
  const token = await getAuthToken?.();
  try {
    const response = await axios.get(apiUrl('/api/users/profile'), {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    });
    return response.data;
  } catch (error) {
    handleApiError(error);
    const statusCode = axios.isAxiosError(error) ? error.response?.status : undefined;
    if (await getDemoModeEnabled()) {
      // Return demo data for unauthorized during review
      return {
        success: true,
        data: {
          id: 'demo_customer_001',
          name: 'Test Customer',
          email: 'test.customer.tirak@gmail.com',
          role: 'customer',
          verified: true,
          profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1000&auto=format&fit=crop',
          phone: '+66812345678',
          bio: 'Travel enthusiast exploring Thailand with local guides.',
          preferences: {
            language: 'en',
            currency: 'THB',
            notifications: { push: true, email: true, sms: false },
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      } as CustomerProfileResponse;
    }
    throw error;
  }
};

export const useCustomerProfile = (options?: any) => {
  return useQuery({
    queryKey: ['customerProfile'],
    queryFn: fetchCustomerProfile,
    ...options,
  });
};

// PUT /users/profile
export const updateCustomerProfile = async (payload: any): Promise<CustomerProfileResponse> => {
  const token = await getAuthToken?.();
  const authHeaders: any = {
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
  try {
    const { id, profileImage, ...profileUpdates } = payload;
    let storedProfileImage = isRemoteImageUrl(profileImage) ? profileImage : undefined;

    if (profileImage && !storedProfileImage) {
      if (!id) throw new Error('A signed-in user is required to upload a profile photo.');
      const formData = new FormData();
      formData.append('file', {
        uri: profileImage,
        name: 'profile.jpg',
        type: 'image/jpeg',
      } as any);
      const upload = await axios.post(apiUrl(`/api/users/${id}/avatar`), formData, {
        headers: { ...authHeaders, 'Content-Type': 'multipart/form-data' },
      });
      storedProfileImage = upload.data?.data?.imageUrl;
      if (!isRemoteImageUrl(storedProfileImage)) {
        throw new Error('The server did not return a public profile image URL.');
      }
    }

    const updatePayload = {
      ...profileUpdates,
      ...(storedProfileImage ? { profileImage: storedProfileImage } : {}),
    };
    const response = await axios.put(apiUrl('/api/users/profile'), updatePayload, {
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
    });
    return {
      ...response.data,
      data: {
        ...profileUpdates,
        ...response.data?.data,
        ...(storedProfileImage ? { profileImage: storedProfileImage } : {}),
      },
    };
  } catch (error) {
    const statusCode = axios.isAxiosError(error) ? error.response?.status : undefined;
    if (await getDemoModeEnabled()) {
      logger.warn('Customer profile update backend unavailable; using local profile fallback', {
        status: statusCode,
      });
      return {
        success: true,
        data: {
          id: payload.id || 'demo_customer_001',
          name: payload.name || 'Test Customer',
          email: payload.email || 'test.customer.tirak@gmail.com',
          role: 'customer',
          verified: true,
          profileImage: payload.profileImage,
          phone: payload.phone,
          dateOfBirth: payload.dateOfBirth,
          preferences: {
            language: 'en',
            currency: 'THB',
            notifications: { push: true, email: true, sms: false },
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        message: 'Profile updated locally for preview testing',
      };
    }

    console.error('Error updating customer profile:', error);
    if (axios.isAxiosError(error)) console.error('Axios error response:', error.response?.data);
    throw error;
  }
};

export const useUpdateCustomerProfile = (options?: any) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateCustomerProfile,
    ...options,
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({ queryKey: ['customerProfile'] });
      if (options && options.onSuccess) options.onSuccess(data, variables, context);
    },
  });
};
