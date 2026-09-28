import { getDemoModeEnabled, isDemoModeEnabled } from '@/utils/demo-mode';
import { useAuthStore } from '@/stores/auth-store';
import type { QueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getAuthToken } from './companion';
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

const localAdapterEnabled = async (companionId: string) =>
  await getDemoModeEnabled() && (isTestCompanionId(companionId) || companionId === 'demo_companion_001');

const reviewExperiences = (): Experience[] => [{
  ...testCompanionExperiences[0], id: 'review_experience_bangkok_001',
  title: 'Bangkok Old Town Culture Walk',
}];

async function previewItems(companionId: string): Promise<Experience[]> {
  const store = await readLocalExperiences();
  // An existing empty list is intentional; archived fixtures must not be reseeded.
  return store[companionId] ?? (companionId === 'demo_companion_001' ? reviewExperiences() : testCompanionExperiences);
}

async function savePreviewItems(companionId: string, items: Experience[]): Promise<void> {
  const store = await readLocalExperiences();
  store[companionId] = items;
  const serialized = JSON.stringify(store);
  await secureStorage.setItemAsync(LOCAL_EXPERIENCES_KEY, serialized);
  if (await secureStorage.getItemAsync(LOCAL_EXPERIENCES_KEY) !== serialized) throw new Error('Unable to persist local review experiences');
}

async function headers() {
  const token = await getAuthToken();
  return { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) };
}

function requireSuccess<T extends { success: boolean }>(body: T): T {
  if (body?.success !== true) throw new Error('The experience request failed. Please try again.');
  return body;
}

const toExperience = (payload: ExperienceCreateRequest, id: string): Experience => ({
  id, title: payload.title, description: payload.description,
  durationMinutes: payload.durationMinutes, keywords: payload.keywords,
  price: payload.price, currency: payload.currency, isActive: payload.is_active,
  createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
});

async function savePreview(companionId: string, payload: ExperienceCreateRequest, id?: string): Promise<ExperienceCreateResponse> {
  if (useAuthStore.getState().user?.id !== companionId) throw new Error('Only the guide can manage these experiences');
  const items = await previewItems(companionId);
  const experience = toExperience(payload, id || `local_experience_${Date.now()}`);
  await savePreviewItems(companionId, [experience, ...items.filter(item => item.id !== experience.id)]);
  return { success: true, data: { experienceId: experience.id, created: !id }, message: 'Saved in local review only' };
}

export async function fetchExperiences(companionId: string): Promise<ExperienceListResponse> {
  if (!companionId) throw new Error('Companion ID is required');
  if (await localAdapterEnabled(companionId)) {
    const items = (await previewItems(companionId)).filter(item => useAuthStore.getState().user?.id === companionId || item.isActive);
    return { success: true, data: { items, pagination: { page: 1, limit: items.length, total: items.length, totalPages: 1 } }, message: 'Local review experiences' };
  }
  const response = await axios.get(apiUrl(`/api/companions/${companionId}/experiences`), { headers: await headers() });
  const body = requireSuccess<ExperienceListResponse>(response.data);
  if (!Array.isArray(body.data?.items)) throw new Error('Invalid experience response');
  return body;
}

export async function createExperience(companionId: string, payload: ExperienceCreateRequest): Promise<ExperienceCreateResponse> {
  if (await localAdapterEnabled(companionId)) return savePreview(companionId, payload);
  const response = await axios.post(apiUrl(`/api/companions/${companionId}/experiences`), payload, { headers: await headers() });
  return requireSuccess(response.data);
}

export async function updateExperience(companionId: string, experienceId: string, payload: ExperienceCreateRequest): Promise<ExperienceCreateResponse> {
  if (await localAdapterEnabled(companionId)) return savePreview(companionId, payload, experienceId);
  const response = await axios.put(apiUrl(`/api/companions/${companionId}/experiences/${experienceId}`), payload, { headers: await headers() });
  return requireSuccess(response.data);
}

export async function archiveExperience(companionId: string, experienceId: string): Promise<{ success: boolean; data: { experienceId: string; archived: boolean } }> {
  if (await localAdapterEnabled(companionId)) {
    if (useAuthStore.getState().user?.id !== companionId) throw new Error('Only the guide can manage these experiences');
    await savePreviewItems(companionId, (await previewItems(companionId)).filter(item => item.id !== experienceId));
    return { success: true, data: { experienceId, archived: true } };
  }
  const response = await axios.delete(apiUrl(`/api/companions/${companionId}/experiences/${experienceId}`), { headers: await headers() });
  return requireSuccess(response.data);
}

export async function invalidateExperienceQueries(queryClient: QueryClient, companionId: string) {
  await Promise.all([
    ['experiences', companionId], ['supplierStats', companionId], ['companion', companionId],
    ['companions'], ['companionProfile', companionId], ['companionAvailability', companionId],
  ].map(queryKey => queryClient.invalidateQueries({ queryKey })));
}

export const useExperiences = (companionId: string) => {
  const user = useAuthStore(state => state.user);
  return useQuery({
    queryKey: ['experiences', companionId, user?.id || 'public', isDemoModeEnabled(user)],
    queryFn: () => fetchExperiences(companionId), enabled: !!companionId, retry: false,
  });
};

export const useCreateExperience = (companionId: string) => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (payload: ExperienceCreateRequest) => createExperience(companionId, payload),
    onSuccess: () => invalidateExperienceQueries(queryClient, companionId) });
};
