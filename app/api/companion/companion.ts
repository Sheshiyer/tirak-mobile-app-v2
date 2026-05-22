import { logger } from '@/utils/logger';
import axios from "axios";
import { useQuery } from '@tanstack/react-query';
import { secureStorage } from '@/utils/secure-storage';
import { API_BASE_URL, apiUrl } from '@/constants/api';

export const BASE_URL = API_BASE_URL;
const LOCAL_AVAILABILITY_KEY = 'tirak-local-availability';

// TypeScript interfaces for the API
export interface CompanionSearchParams {
  search?: string;
  category?: string;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  languages?: string[];
  available?: boolean;
  verified?: boolean;
  page?: number;
  limit?: number;
  sortBy?: "rating" | "price" | "distance" | "reviews";
  sortOrder?: "asc" | "desc";
}

export interface Companion {
  id: string;
  name: string;
  displayName: string;
  profileImage: string;
  gallery: string[];
  location: string;
  rating: number;
  reviewCount: number;
  price: number;
  services: string[];
  languages: string[];
  verified: boolean;
  online: boolean;
  categories: string[];
  bio?: string;
  age?: number;
  responseTime: string;
  completionRate: number;
  distance?: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface FilterOption {
  id: string;
  name: string;
  count: number;
}

export interface Filters {
  categories: FilterOption[];
  locations: FilterOption[];
  priceRange: {
    min: number;
    max: number;
  };
  languages: FilterOption[];
}

export interface CompanionSearchResponse {
  success: boolean;
  data: {
    companions: Companion[];
    pagination: Pagination;
    filters: Filters;
  };
  message?: string;
}

const buildCompanionQueryParams = (params: CompanionSearchParams = {}): URLSearchParams => {
  const queryParams = new URLSearchParams();

  const appendValue = (key: string, value?: string | number | boolean | string[]) => {
    if (value === undefined || value === null || value === '') return;
    if (Array.isArray(value)) {
      if (value.length > 0) queryParams.append(key, value.join(','));
      return;
    }
    queryParams.append(key, String(value));
  };

  // The live Worker currently validates some numeric/boolean query params before
  // coercion. Keep list reads to the string-backed filters it accepts.
  appendValue('search', params.search?.trim());
  if (params.category && params.category !== 'all') appendValue('category', params.category);
  if (params.location && params.location !== 'All Locations') appendValue('location', params.location);
  appendValue('languages', params.languages);
  appendValue('sortBy', params.sortBy);
  appendValue('sortOrder', params.sortOrder);

  return queryParams;
};

// New interfaces for companion details
export interface CompanionService {
  id: string;
  name: string;
  description: string;
  price: number;
  currency?: string;
  duration: string;
  category: string;
}

export interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
  price?: number;
}

export interface WeeklySchedule {
  monday: TimeSlot[];
  tuesday: TimeSlot[];
  wednesday: TimeSlot[];
  thursday: TimeSlot[];
  friday: TimeSlot[];
  saturday: TimeSlot[];
  sunday: TimeSlot[];
}

export interface AvailabilityException {
  date: string;
  available: boolean;
  reason?: string;
}

export interface CompanionAvailability {
  weeklySchedule: WeeklySchedule;
  exceptions: AvailabilityException[];
}

export interface CompanionReviewUser {
  id: string;
  name: string;
  profileImage?: string;
}

export interface CompanionReview {
  id: string;
  user: CompanionReviewUser;
  rating: number;
  comment: string;
  date: string;
  verified: boolean;
}

export interface CompanionDetails {
  id: string;
  name: string;
  displayName: string;
  profileImage: string;
  gallery: string[];
  location: string;
  rating: number;
  reviewCount: number;
  price: number;
  currency?: string;
  services: CompanionService[];
  experiences?: Array<CompanionService & {
    title?: string;
    durationMinutes?: number;
    keywords?: string[];
  }>;
  languages: string[];
  verified: boolean;
  online: boolean;
  lastSeen?: string;
  categories: string[];
  bio: string;
  age: number;
  responseTime: string;
  completionRate: number;
  joinedDate: string;
  availability: CompanionAvailability;
  reviews: CompanionReview[];
}

export interface CompanionDetailsResponse {
  success: boolean;
  data: CompanionDetails;
  message?: string;
}

// Availability-specific interfaces
export interface AvailabilityTimeSlot {
  start: string;
  end: string;
  available: boolean;
  price?: number;
}

export interface DayAvailability {
  date: string;
  available: boolean;
  slots: TimeSlot[];
}

export interface AvailabilityParams {
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface AvailabilityResponse {
  success: boolean;
  message: string;
  data: {
    availability: DayAvailability[];
  };
}

const readLocalAvailability = async (): Promise<Record<string, DayAvailability[]>> => {
  try {
    const stored = await secureStorage.getItemAsync(LOCAL_AVAILABILITY_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    logger.warn('Failed to read local availability cache:', error);
    return {};
  }
};

const writeLocalAvailability = async (availability: Record<string, DayAvailability[]>) => {
  try {
    await secureStorage.setItemAsync(LOCAL_AVAILABILITY_KEY, JSON.stringify(availability));
  } catch (error) {
    logger.warn('Failed to write local availability cache:', error);
  }
};

const expandAvailabilityParams = (params: AvailabilityParams): DayAvailability[] => {
  const start = new Date(`${params.startDate}T00:00:00`);
  const end = new Date(`${params.endDate}T00:00:00`);
  const days: DayAvailability[] = [];

  for (let cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
    const date = cursor.toISOString().split('T')[0];
    days.push({
      date,
      available: params.isAvailable,
      slots: [
        {
          start: params.startTime,
          end: params.endTime,
          available: params.isAvailable,
        },
      ],
    });
  }

  return days;
};

export const saveCompanionAvailability = async (
  id: string,
  slots: AvailabilityParams[]
): Promise<AvailabilityResponse> => {
  const localStore = await readLocalAvailability();
  const existing = localStore[id] || [];
  const nextDays = slots.flatMap(expandAvailabilityParams);
  const nextDates = new Set(nextDays.map(day => day.date));
  const merged = [
    ...existing.filter(day => !nextDates.has(day.date)),
    ...nextDays,
  ].sort((a, b) => a.date.localeCompare(b.date));

  try {
    const token = await getAuthToken();
    const response = await axios.post(apiUrl(`/api/companions/${id}/availability`), slots, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    });
    localStore[id] = merged;
    await writeLocalAvailability(localStore);
    return response.data;
  } catch (error) {
    if (__DEV__ || (axios.isAxiosError(error) && [404, 405, 501].includes(error.response?.status || 0))) {
      localStore[id] = merged;
      await writeLocalAvailability(localStore);
      return {
        success: true,
        message: 'Availability saved locally for preview',
        data: { availability: merged },
      };
    }
    throw error;
  }
};

// Helper function to get auth token
export const getAuthToken = async (): Promise<string | null> => {
  try {
    const token = await secureStorage.getItemAsync("authToken");
    // logger.log('token', token);  
    return token;
  } catch (error) {
    console.error("Error getting auth token:", error);
    return null;
  }
};

// Main API function to fetch companions
export const fetchCompanions = async (params: CompanionSearchParams = {}): Promise<CompanionSearchResponse> => {
  const token = await getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
  const queryParams = buildCompanionQueryParams(params);
  const queryString = queryParams.toString();
  const url = apiUrl(`/api/companions${queryString ? `?${queryString}` : ''}`);

  try {
    const response = await axios.get(url, {
      headers,
    });
    
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status;
      if (statusCode === 400 && queryString) {
        logger.warn('Companion list query rejected; retrying without filters', {
          url,
          status: statusCode,
          data: error.response?.data,
        });
        const response = await axios.get(apiUrl('/api/companions'), { headers });
        return response.data;
      }

      logger.warn('Error fetching companions', {
        status: statusCode,
        data: error.response?.data,
        url,
      });
      const errorMessage = error.response?.data?.message || "Failed to fetch companions";
      throw new Error(errorMessage);
    }
    
    throw new Error("Network error occurred while fetching companions");
  }
};

// React Query hook for fetching companions
export const useCompanionsQuery = (params: CompanionSearchParams = {}) => {
  return useQuery({
    queryKey: ['companions', params],
    queryFn: () => fetchCompanions(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: (failureCount: number, error: Error) => {
      // Don't retry on authentication errors
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        return false;
      }
      // Retry up to 3 times for other errors
      return failureCount < 3;
    },
  });
};

// React Query hook for featured companions (top-rated)
export const useFeaturedCompanions = () => {
  return useCompanionsQuery({
    // Remove problematic parameters that cause backend validation errors
    // verified: true,
    // available: true, 
    // rating: 4.5,
    sortBy: 'rating',
    sortOrder: 'desc',
    // limit: 10,
  });
};

// Hook for companions by category
export const useCompanionsByCategory = (category: string) => {
  return useCompanionsQuery({
    category,
    verified: true,
    available: true,
    sortBy: "rating",
    sortOrder: "desc",
    limit: 20,
  });
};

// Hook for companions by location
export const useCompanionsByLocation = (location: string) => {
  return useCompanionsQuery({
    location,
    verified: true,
    available: true,
    sortBy: "distance",
    sortOrder: "asc",
    limit: 20,
  });
};

// Legacy configuration object (for manual usage)
export const useCompanions = (params: CompanionSearchParams = {}) => {
  return {
    queryKey: ['companions', params],
    queryFn: () => fetchCompanions(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    refetchOnWindowFocus: false,
    retry: (failureCount: number, error: Error) => {
      // Don't retry on authentication errors
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        return false;
      }
      // Retry up to 3 times for other errors
      return failureCount < 3;
    },
  };
};

// Predefined search functions for common use cases
export const searchCompanionsByCategory = (category: string, additionalParams: Partial<CompanionSearchParams> = {}) => {
  return fetchCompanions({
    category,
    verified: true,
    available: true,
    sortBy: "rating",
    sortOrder: "desc",
    limit: 20,
    ...additionalParams,
  });
};

export const searchCompanionsByLocation = (location: string, additionalParams: Partial<CompanionSearchParams> = {}) => {
  return fetchCompanions({
    location,
    verified: true,
    available: true,
    sortBy: "distance",
    sortOrder: "asc",
    limit: 20,
    ...additionalParams,
  });
};

export const searchFeaturedCompanions = (additionalParams: Partial<CompanionSearchParams> = {}) => {
  return fetchCompanions({
    verified: true,
    available: true,
    rating: 4.5,
    sortBy: "rating",
    sortOrder: "desc",
    limit: 10,
    ...additionalParams,
  });
};

// Convenience functions for companion details and availability
export const getCompanionDetails = (id: string) => {
  return fetchCompanionById(id);
};

// Get companion availability for the next 7 days
export const getCompanionWeeklyAvailability = (id: string, startDate?: string) => {
  const start = startDate || new Date().toISOString().split('T')[0]; // Today if not provided
  const endDate = new Date(start);
  endDate.setDate(endDate.getDate() + 6); // 7 days total
  
  return fetchCompanionAvailability(id, {
    startDate: start,
    endDate: endDate.toISOString().split('T')[0],
    startTime: '00:00',
    endTime: '23:59',
    isAvailable: true,
  });
};

// Get companion availability for a specific month
export const getCompanionMonthlyAvailability = (id: string, year: number, month: number, startTime: string, endTime: string) => {
  const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
  const endDate = new Date(year, month, 0).toISOString().split('T')[0]; // Last day of month
  
  return fetchCompanionAvailability(id, {
    startDate,
    endDate,
    startTime,
    endTime,
    isAvailable: true,
  });
};

// Get companion availability for a custom date range
export const getCompanionAvailabilityRange = (id: string, startDate: string, endDate: string, startTime: string, endTime: string) => {
  return fetchCompanionAvailability(id, {
    startDate,
    endDate,
    startTime: '00:00',
    endTime: '23:59',
    isAvailable: true,
  });
};

// React Query hook for weekly availability (commonly used in booking flows)
export const useCompanionWeeklyAvailability = (id: string, startTime: string, endTime: string, startDate?: string) => {
  const start = startDate || new Date().toISOString().split('T')[0];
  const endDate = new Date(start);
  endDate.setDate(endDate.getDate() + 6);
  
  return useCompanionAvailabilityQuery(id, {
    startDate: start,
    endDate: endDate.toISOString().split('T')[0],
    startTime,
    endTime,
    isAvailable: true,
  });
};

// React Query hook for monthly availability (calendar view)
export const useCompanionMonthlyAvailability = (id: string, year: number, month: number, startTime: string, endTime: string ) => {
  const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
  const endDate = new Date(year, month, 0).toISOString().split('T')[0];
  
  return useCompanionAvailabilityQuery(id, {
    startDate,
    endDate,
    startTime,
    endTime,
    isAvailable: true,
  });
};

// API function to fetch companion details by ID
export const fetchCompanionById = async (id: string): Promise<CompanionDetailsResponse> => {
  try {
    // Get authentication token
    const token = await getAuthToken();
    
    const url = apiUrl(`/api/companions/${id}`);
    
    // logger.log("Fetching companion details from:", url);
    
    // Make API request with authentication
    const response = await axios.get(url, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    });

    // logger.log("Companion details API response:", response.data);
    
    return response.data;
  } catch (error) {
    console.error("Error fetching companion details:", error);
    
    // Handle different error types
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.message || "Failed to fetch companion details";
      throw new Error(errorMessage);
    }
    
    throw new Error("Network error occurred while fetching companion details");
  }
};

// API function to fetch companion availability
export const fetchCompanionAvailability = async (id: string, params: AvailabilityParams): Promise<AvailabilityResponse> => {
  try {
    // Get authentication token
    const token = await getAuthToken();
    
    // Build query string
    const queryParams = new URLSearchParams();
    queryParams.append('startDate', params.startDate);
    queryParams.append('endDate', params.endDate);
    
    const queryString = queryParams.toString();
    const url = apiUrl(`/api/companions/${id}/availability?${queryString}`);
    
    // logger.log("Fetching companion availability from:", url);
    
    // Make API request with authentication
    const response = await axios.get(url, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    });

    // logger.log("Companion availability API response:", response.data);
    
    const localStore = await readLocalAvailability();
    const localAvailability = localStore[id] || [];
    if (__DEV__ && localAvailability.length > 0) {
      const remoteAvailability = response.data?.data?.availability || [];
      const remoteDates = new Set(remoteAvailability.map((day: DayAvailability) => day.date));
      return {
        ...response.data,
        data: {
          availability: [
            ...remoteAvailability,
            ...localAvailability.filter(day => !remoteDates.has(day.date)),
          ],
        },
      };
    }

    return response.data;
  } catch (error) {
    // Handle different error types
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        logger.warn("Companion availability not found - using empty availability fallback");
        const localStore = await readLocalAvailability();
        return {
          success: true,
          message: "No backend availability found",
          data: {
            availability: localStore[id] || [],
          },
        };
      }

      if (__DEV__) {
        const localStore = await readLocalAvailability();
        return {
          success: true,
          message: "Using local availability fallback",
          data: {
            availability: localStore[id] || [],
          },
        };
      }

      console.error("Error fetching companion availability:", error);
      const errorMessage = error.response?.data?.message || "Failed to fetch companion availability";
      throw new Error(errorMessage);
    }
    
    console.error("Error fetching companion availability:", error);
    throw new Error("Network error occurred while fetching companion availability");
  }
};

// React Query hook for fetching companion details by ID
export const useCompanionQuery = (id: string) => {
  return useQuery({
    queryKey: ['companion', id],
    queryFn: () => fetchCompanionById(id),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    enabled: !!id, // Only run query if ID is provided
    retry: (failureCount: number, error: Error) => {
      // Don't retry on authentication errors or 404s
      if (error.message.includes('401') || error.message.includes('404') || error.message.includes('Unauthorized')) {
        return false;
      }
      // Retry up to 2 times for other errors
      return failureCount < 2;
    },
  });
};

// React Query hook for fetching companion availability
export const useCompanionAvailabilityQuery = (id: string, params: AvailabilityParams) => {
  return useQuery({
    queryKey: ['companionAvailability', id, params],
    queryFn: () => fetchCompanionAvailability(id, params),
    staleTime: 1 * 60 * 1000, // 1 minute (availability changes frequently)
    gcTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
    enabled: !!(id && params.startDate && params.endDate), // Only run if all required params are provided
    retry: (failureCount: number, error: Error) => {
      // Don't retry on authentication errors or 404s
      if (error.message.includes('401') || error.message.includes('404') || error.message.includes('Unauthorized')) {
        return false;
      }
      // Retry up to 2 times for other errors
      return failureCount < 2;
    },
  });
};
