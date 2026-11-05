import { isDemoModeEnabled } from '@/utils/demo-mode';
import { useAuthStore } from '@/stores/auth-store';
import type { QueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getAuthToken } from './companion';
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

export interface ExperienceSearchParams {
  page?: number;
  limit?: number;
  signal?: AbortSignal;
}

// Drafts from earlier versions remain on this device; never merge them into server data.
const readLocalExperiences = async (): Promise<Record<string, Experience[]>> => {
  const stored = await secureStorage.getItemAsync(LOCAL_EXPERIENCES_KEY);
  const data = stored ? JSON.parse(stored) : {};
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Invalid local experience drafts');
  return data;
};

export const readExperienceDrafts = async (companionId: string): Promise<Experience[]> => {
  if (useAuthStore.getState().user?.id !== companionId) throw new Error('Only your own drafts are available');
  return (await readLocalExperiences())[companionId] || [];
};

async function headers() {
  const token = await getAuthToken();
  return { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) };
}

function requireSuccess<T extends { success: boolean }>(body: T): T {
  if (body?.success !== true) throw new Error('The experience request failed. Please try again.');
  return body;
}

export async function fetchExperiences(
  companionId: string,
  params: ExperienceSearchParams = {},
): Promise<ExperienceListResponse> {
  if (!companionId) throw new Error('Companion ID is required');
  const queryParams = new URLSearchParams();
  if (params.page !== undefined && params.page !== null) queryParams.append('page', String(params.page));
  if (params.limit !== undefined && params.limit !== null) queryParams.append('limit', String(params.limit));
  const queryString = queryParams.toString();
  const url = apiUrl(`/api/companions/${companionId}/experiences${queryString ? `?${queryString}` : ''}`);

  const response = await axios.get(url, {
    headers: await headers(),
    signal: params.signal,
  });
  const body = requireSuccess<ExperienceListResponse>(response.data);
  if (!Array.isArray(body.data?.items)) throw new Error('Invalid experience response');
  return { ...body, data: { ...body.data, items: body.data.items.filter(item => !/^(test-|demo[-_]|review_experience_|local_experience_)/.test(item.id)) } };
}

export async function createExperience(companionId: string, payload: ExperienceCreateRequest): Promise<ExperienceCreateResponse> {
  const response = await axios.post(apiUrl(`/api/companions/${companionId}/experiences`), payload, { headers: await headers() });
  return requireSuccess(response.data);
}

export async function updateExperience(companionId: string, experienceId: string, payload: ExperienceCreateRequest): Promise<ExperienceCreateResponse> {
  const response = await axios.put(apiUrl(`/api/companions/${companionId}/experiences/${experienceId}`), payload, { headers: await headers() });
  return requireSuccess(response.data);
}

export async function archiveExperience(companionId: string, experienceId: string): Promise<{ success: boolean; data: { experienceId: string; archived: boolean } }> {
  const response = await axios.delete(apiUrl(`/api/companions/${companionId}/experiences/${experienceId}`), { headers: await headers() });
  return requireSuccess(response.data);
}

export async function invalidateExperienceQueries(queryClient: QueryClient, companionId: string) {
  await Promise.all([
    ['experiences', companionId], ['supplierStats', companionId], ['companion', companionId],
    ['companions'], ['companionProfile', companionId], ['companionAvailability', companionId],
  ].map(queryKey => queryClient.invalidateQueries({ queryKey })));
}

export const useExperiences = (
  companionId: string,
  params?: Omit<ExperienceSearchParams, 'signal'>,
) => {
  const user = useAuthStore(state => state.user);
  const queryKey = params !== undefined
    ? ['experiences', companionId, user?.id || 'public', isDemoModeEnabled(user), params]
    : ['experiences', companionId, user?.id || 'public', isDemoModeEnabled(user)];
  return useQuery({
    queryKey,
    queryFn: ({ signal }) => fetchExperiences(companionId, { ...params, signal }),
    enabled: !!companionId,
    retry: false,
  });
};

export const useCreateExperience = (companionId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ExperienceCreateRequest) => createExperience(companionId, payload),
    onSuccess: () => invalidateExperienceQueries(queryClient, companionId),
  });
};

export const useInfiniteExperiences = (
  companionId: string,
  params?: { limit?: number },
) => {
  const user = useAuthStore((state) => state.user);
  const pageSize = Math.min(Math.max(params?.limit || 50, 1), 100);
  return useInfiniteQuery({
    queryKey: ['experiences', companionId, user?.id || 'public', isDemoModeEnabled(user), 'infinite', { limit: pageSize }],
    queryFn: ({ pageParam = 1, signal }) =>
      fetchExperiences(companionId, { page: pageParam as number, limit: pageSize, signal }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const pagination = lastPage?.data?.pagination;
      if (!pagination) return undefined;
      const { page, totalPages } = pagination;
      return page < totalPages ? page + 1 : undefined;
    },
    enabled: !!companionId,
    retry: false,
  });
};
