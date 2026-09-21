import { logger } from '@/utils/logger';
import axios from 'axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchCompanionById, getAuthToken } from './companion';
import { isTestCompanionId } from '@/utils/companion-display';
import { secureStorage } from '@/utils/secure-storage';
import { apiUrl } from '@/constants/api';

const LOCAL_EXPERIENCES_KEY = 'tirak-local-experiences';

// Types
export interface Experience {
  id: string;
  title: string;
  description?: string;
  durationMinutes: number;
  keywords: string[];
  price: number;
  currency: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ExperienceCreateRequest {
  title: string;
  description?: string;
  durationMinutes: number;
  keywords: string[];
  price: number;
  currency: string;
  is_active: boolean;
}

export interface ExperienceCreateResponse {
  success: boolean;
  data: {
    experienceId: string;
    created: boolean;
  };
  message: string;
}

export interface ExperienceListResponse {
  success: boolean;
  data: {
    items: Experience[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  message: string;
}

const testCompanionExperiences: Experience[] = [
  {
    id: 'test-market-temple-walk',
    title: 'Old Town Market & Temple Walk',
    description: 'A relaxed half-day walk through Bangkok food stalls, flower markets, river lanes, and a quiet temple stop with local context.',
    durationMinutes: 180,
    keywords: ['City Tour', 'Culture', 'Food'],
    price: 1800,
    currency: 'THB',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'test-evening-food-trail',
    title: 'Evening Food Trail',
    description: 'Taste street snacks, learn ordering etiquette, and visit a neighborhood night market at an easy traveler pace.',
    durationMinutes: 150,
    keywords: ['Evening', 'Food'],
    price: 1500,
    currency: 'THB',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const readLocalExperiences = async (): Promise<Record<string, Experience[]>> => {
  try {
    const stored = await secureStorage.getItemAsync(LOCAL_EXPERIENCES_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    logger.warn('Failed to read local experiences cache:', error);
    return {};
  }
};

const writeLocalExperiences = async (experiences: Record<string, Experience[]>) => {
  try {
    await secureStorage.setItemAsync(LOCAL_EXPERIENCES_KEY, JSON.stringify(experiences));
  } catch (error) {
    logger.warn('Failed to write local experiences cache:', error);
  }
};

const toExperience = (payload: ExperienceCreateRequest, id?: string): Experience => {
  const now = new Date().toISOString();
  return {
    id: id || `local_experience_${Date.now()}`,
    title: payload.title,
    description: payload.description,
    durationMinutes: payload.durationMinutes,
    keywords: payload.keywords || [],
    price: payload.price,
    currency: payload.currency || 'THB',
    isActive: payload.is_active,
    createdAt: now,
    updatedAt: now,
  };
};

const normalizeExperience = (item: any): Experience => ({
  id: String(item.id || item._id || item.experienceId || `experience_${Date.now()}`),
  title: item.title || item.name || 'Local Experience',
  description: item.description || '',
  durationMinutes: normalizeDurationMinutes(item.durationMinutes ?? item.duration_minutes ?? item.duration),
  keywords: Array.isArray(item.keywords)
    ? item.keywords
    : Array.isArray(item.tags)
      ? item.tags
      : typeof item.category === 'string'
        ? [item.category]
        : [],
  price: Number(item.price ?? 0),
  currency: item.currency || 'THB',
  isActive: Boolean(item.isActive ?? item.is_active ?? true),
  createdAt: item.createdAt || item.created_at || new Date().toISOString(),
  updatedAt: item.updatedAt || item.updated_at || new Date().toISOString(),
});

function normalizeDurationMinutes(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const numeric = Number.parseFloat(value);
    if (!Number.isFinite(numeric)) return 180;
    return value.toLowerCase().includes('hour') ? Math.round(numeric * 60) : Math.round(numeric);
  }
  return 180;
}

const getServiceBackedExperiences = async (companionId: string): Promise<Experience[]> => {
  try {
    const response = await fetchCompanionById(companionId);
    const services = response.data?.services || [];
    return services.map((service: any) => normalizeExperience({
      id: service.id,
      title: service.title || service.name,
      description: service.description,
      duration: service.duration,
      keywords: service.category ? [service.category] : [],
      price: service.price,
      currency: service.currency || 'THB',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
  } catch (error) {
    logger.warn('Failed to load companion services as booking experiences:', error);
    return [];
  }
};

const buildExperienceList = async (companionId: string, remoteItems: Experience[] = []): Promise<ExperienceListResponse> => {
  const localStore = await readLocalExperiences();
  const localItems = localStore[companionId] || [];
  const normalizedRemoteItems = remoteItems.map(normalizeExperience);
  const serviceBackedItems = normalizedRemoteItems.length > 0 ? [] : await getServiceBackedExperiences(companionId);
  const remoteIds = new Set(normalizedRemoteItems.map(item => item.id));
  const baseItems = isTestCompanionId(companionId) ? testCompanionExperiences : [];
  const serviceIds = new Set(serviceBackedItems.map(item => item.id));
  const baseIds = new Set([...remoteIds, ...serviceIds, ...localItems.map(item => item.id)]);
  const items = [
    ...localItems,
    ...normalizedRemoteItems,
    ...serviceBackedItems.filter(item => !remoteIds.has(item.id)),
    ...baseItems.filter(item => !baseIds.has(item.id)),
  ];

  return {
    success: true,
    data: {
      items,
      pagination: {
        page: 1,
        limit: items.length,
        total: items.length,
        totalPages: 1,
      },
    },
    message: localItems.length > 0 ? 'Loaded local and backend experiences' : 'Loaded experiences',
  };
};

const upsertLocalExperience = async (companionId: string, experience: Experience) => {
  const localStore = await readLocalExperiences();
  const existing = localStore[companionId] || [];
  localStore[companionId] = [
    experience,
    ...existing.filter(item => item.id !== experience.id),
  ];
  await writeLocalExperiences(localStore);
};



// POST /companions/:id/experiences
export const createExperience = async (companionId: string, payload: ExperienceCreateRequest): Promise<ExperienceCreateResponse> => {
 try {
  const token = await getAuthToken();
  // logger.log("payload", payload);
  const response = await axios.post(apiUrl(`/api/companions/${companionId}/experiences`), payload, {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
  });

  // logger.log("response", response.data);
  return response.data;
 } catch (error) {
  if (__DEV__ || (axios.isAxiosError(error) && [404, 405, 501].includes(error.response?.status || 0))) {
    const experience = toExperience(payload);
    await upsertLocalExperience(companionId, experience);
    return {
      success: true,
      data: {
        experienceId: experience.id,
        created: true,
      },
      message: 'Experience saved locally for preview',
    };
  }
  console.error('Error creating experience:', error);
  throw error;
 }
};

export const useCreateExperience = (companionId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ExperienceCreateRequest) => createExperience(companionId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experiences', companionId] });
      queryClient.invalidateQueries({ queryKey: ['supplierStats'] });
    },
  });
};

// GET /companions/:id/experiences
export const fetchExperiences = async (companionId: string): Promise<ExperienceListResponse> => {
 try {
  if (!companionId) {
    throw new Error('Companion ID is required');
  }

  // Log the request details
    // logger.log('Fetching experiences for companion:', {
    //   companionId,
    //   url: `${BASE_URL}/companions/${companionId}/experiences`
    // });

  const token = await getAuthToken();
  const response = await axios.get(apiUrl(`/api/companions/${companionId}/experiences`), {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
  });

  // Log the response
  // logger.log('Experiences API response:', response.data);

  const items = response.data?.data?.items || [];
  return await buildExperienceList(companionId, items);
 } catch (error) {
  if (__DEV__ || isTestCompanionId(companionId)) {
    return await buildExperienceList(companionId);
  }
  throw error;
 }
};

export const useExperiences = (companionId: string) => {
  return useQuery({
    queryKey: ['experiences', companionId],
    queryFn: () => fetchExperiences(companionId),
    enabled: !!companionId && companionId !== '',
    retry: false, // Don't retry on validation errors
  });
};

export const updateExperience = async (companionId: string, experienceId: string, payload: ExperienceCreateRequest): Promise<ExperienceCreateResponse> => {
  try {
    const token = await getAuthToken();
    const response = await axios.put(apiUrl(`/api/companions/${companionId}/experiences/${experienceId}`), payload, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    });
    
    return response.data;
  } catch (error) {
    if (__DEV__ || (axios.isAxiosError(error) && [404, 405, 501].includes(error.response?.status || 0))) {
      const experience = toExperience(payload, experienceId);
      await upsertLocalExperience(companionId, experience);
      return {
        success: true,
        data: {
          experienceId: experience.id,
          created: false,
        },
        message: 'Experience updated locally for preview',
      };
    }
    console.error('Error updating experience:', error);
    throw error;
  }
};
