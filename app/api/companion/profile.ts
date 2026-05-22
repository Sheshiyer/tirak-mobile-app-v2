import { logger } from '@/utils/logger';
import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAuthToken } from './companion';
import { apiUrl } from '@/constants/api';
import { isUnauthorizedError } from '@/utils/api-errors';

// Types
export interface ExperienceStats {
  yearsOfExperience: number;
  totalGuests: number;
  averageRating: number;
  responseTime: string;
}

export interface SocialLinks {
  instagram?: string;
  facebook?: string;
  twitter?: string;
  tiktok?: string;
  website?: string;
  other?: { name: string; url: string }[];
  [key: string]: any;
}

export interface CompanionProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  displayName: string;
  coverPhoto?: string;
  profilePhoto?: string;
  bio?: string;
  socialLinks: SocialLinks;
  dateOfBirth?: string;
  gender?: string;
  location: string;
  languages: string[];
  specialization: string[];
  certifications: string[];
  experienceStats: ExperienceStats;
  createdAt: string;
  updatedAt: string;
}

export interface CompanionProfileResponse {
  success: boolean;
  data: CompanionProfile;
  message: string;
}

export interface CompanionProfileRequest {
  first_name: string;
  last_name: string;
  display_name: string;
  bio?: string;
  social_links?: SocialLinks;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  cover_photo?: string;
  profile_photo?: string;
  location: string;
  languages: string[];
  specialization: string[];
  certifications: string[];
}

const TEST_COMPANION_PROFILE: CompanionProfile = {
  id: '30c6d267-22d1-4cd0-8bdc-46993c14c143',
  userId: '30c6d267-22d1-4cd0-8bdc-46993c14c143',
  firstName: 'Test',
  lastName: 'Companion',
  displayName: 'Test Companion',
  coverPhoto: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop',
  profilePhoto: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?q=80&w=1000&auto=format&fit=crop',
  bio: 'I help travellers experience Bangkok through everyday rituals, local markets, temple etiquette, food stalls, river shortcuts, and small cultural details that make Thailand feel personal.',
  socialLinks: {},
  dateOfBirth: '1995-03-15',
  gender: 'other',
  location: 'Bangkok, Thailand',
  languages: ['English', 'Thai'],
  specialization: ['City walks', 'Food markets', 'Temple etiquette'],
  certifications: ['Tirak verified local guide'],
  experienceStats: {
    yearsOfExperience: 3,
    totalGuests: 156,
    averageRating: 4.8,
    responseTime: '12 min',
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const getDemoCompanionProfile = (overrides?: Partial<CompanionProfile>): CompanionProfileResponse => ({
  success: true,
  data: {
    ...TEST_COMPANION_PROFILE,
    ...overrides,
    socialLinks: overrides?.socialLinks || TEST_COMPANION_PROFILE.socialLinks,
    languages: overrides?.languages || TEST_COMPANION_PROFILE.languages,
    specialization: overrides?.specialization || TEST_COMPANION_PROFILE.specialization,
    certifications: overrides?.certifications || TEST_COMPANION_PROFILE.certifications,
    updatedAt: new Date().toISOString(),
  },
  message: 'Loaded demo companion profile',
});

// GET /companion/profile
export const fetchCompanionProfile = async (): Promise<CompanionProfileResponse> => {
  const token = await getAuthToken();
  // logger.log('BASE_URL:', BASE_URL);
  // logger.log('Auth token:', token);
  try {
    const response = await axios.get(apiUrl('/api/users/companion/profile'), {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    });
    // logger.log('Companion profile API response:', response.data);
    return response.data;
  } catch (error) {
    const statusCode = axios.isAxiosError(error) ? error.response?.status : undefined;
    if (__DEV__ || statusCode === 404 || isUnauthorizedError(error)) {
      logger.log('Companion profile backend unavailable; using local preview profile fallback', {
        status: statusCode,
      });
      return getDemoCompanionProfile();
    }
    console.error('Error fetching companion profile:', error);
    if (axios.isAxiosError(error)) {
      console.error('Axios error response:', error.response?.data);
    }
    throw error;
  }
};

export const useCompanionProfile = () => {
  return useQuery({
    queryKey: ['companionProfile'],
    queryFn: fetchCompanionProfile,
  });
};

// {userType: 'companion' ? useCompanionProfile : useSupplierProfile}


// POST /companion/profile
export const createOrUpdateCompanionProfile = async (payload: any): Promise<CompanionProfileResponse> => {
  const token = await getAuthToken();
  let headers: any = {
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
  let dataToSend = payload;
  let url = apiUrl('/api/users/companion/profile');
  let method = 'PUT';

  if (!(payload instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    dataToSend = JSON.stringify(payload);
  }
  try {
    const response = await axios({
      url,
      method,
      headers,
      data: dataToSend,
    });
    return response.data;
  } catch (error) {
    const statusCode = axios.isAxiosError(error) ? error.response?.status : undefined;
    if (__DEV__ || statusCode === 404 || isUnauthorizedError(error)) {
      if (payload instanceof FormData) {
        const rawData = payload.get('data');
        const parsedData = typeof rawData === 'string' ? JSON.parse(rawData) : {};
        return getDemoCompanionProfile({
          firstName: parsedData.firstName || parsedData.first_name || TEST_COMPANION_PROFILE.firstName,
          lastName: parsedData.lastName || parsedData.last_name || TEST_COMPANION_PROFILE.lastName,
          displayName: parsedData.displayName || parsedData.display_name || TEST_COMPANION_PROFILE.displayName,
          bio: parsedData.bio || TEST_COMPANION_PROFILE.bio,
          location: parsedData.location || TEST_COMPANION_PROFILE.location,
          languages: parsedData.languages || TEST_COMPANION_PROFILE.languages,
          specialization: parsedData.specialization || TEST_COMPANION_PROFILE.specialization,
          certifications: parsedData.certifications || TEST_COMPANION_PROFILE.certifications,
          coverPhoto: parsedData.coverPhoto || parsedData.cover_photo || TEST_COMPANION_PROFILE.coverPhoto,
          profilePhoto: parsedData.profilePhoto || parsedData.profile_photo || TEST_COMPANION_PROFILE.profilePhoto,
          socialLinks: parsedData.socialLinks || parsedData.social_links || TEST_COMPANION_PROFILE.socialLinks,
        });
      }

      return getDemoCompanionProfile({
        firstName: payload.firstName || payload.first_name || TEST_COMPANION_PROFILE.firstName,
        lastName: payload.lastName || payload.last_name || TEST_COMPANION_PROFILE.lastName,
        displayName: payload.displayName || payload.display_name || TEST_COMPANION_PROFILE.displayName,
        bio: payload.bio || TEST_COMPANION_PROFILE.bio,
        location: payload.location || TEST_COMPANION_PROFILE.location,
        languages: payload.languages || TEST_COMPANION_PROFILE.languages,
        specialization: payload.specialization || TEST_COMPANION_PROFILE.specialization,
        certifications: payload.certifications || TEST_COMPANION_PROFILE.certifications,
        coverPhoto: payload.coverPhoto || payload.cover_photo || TEST_COMPANION_PROFILE.coverPhoto,
        profilePhoto: payload.profilePhoto || payload.profile_photo || TEST_COMPANION_PROFILE.profilePhoto,
        socialLinks: payload.socialLinks || payload.social_links || TEST_COMPANION_PROFILE.socialLinks,
      });
    }
    throw error;
  }
};

export const createCompanionProfile = async (payload: CompanionProfileRequest): Promise<CompanionProfileResponse> => {
  try {
    const token = await getAuthToken();
    const response = await axios.post(apiUrl('/api/users/companion/profile'), payload, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error creating or updating companion profile:', error);
    if (axios.isAxiosError(error)) {
      console.error('Axios error response:', error.response?.data);
    }
    throw error;
  }
  };

export const useCreateOrUpdateCompanionProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createOrUpdateCompanionProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplierStats'] });
    },
  });
};
