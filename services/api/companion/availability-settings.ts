import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiUrl } from '@/constants/api';
import { getAuthToken } from './companion';
import { useAuthStore } from '@/stores/auth-store';

export interface WeeklyDay { dayOfWeek: number; startTime: string; endTime: string; isAvailable: boolean }
export interface AvailabilitySettings { timeZone: 'Asia/Bangkok'; days: WeeklyDay[] }
export function validateAvailabilitySettings(settings: AvailabilitySettings): void {
  const days = new Set<number>();
  if (settings.timeZone !== 'Asia/Bangkok' || !Array.isArray(settings.days) || settings.days.length > 7) throw new Error('Invalid weekly schedule');
  for (const day of settings.days) {
    if (!Number.isInteger(day.dayOfWeek) || day.dayOfWeek < 0 || day.dayOfWeek > 6 || days.has(day.dayOfWeek)
      || typeof day.isAvailable !== 'boolean' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(day.startTime)
      || !/^([01]\d|2[0-3]):[0-5]\d$/.test(day.endTime) || day.endTime <= day.startTime) throw new Error('Use unique days and an end time later than the start time (HH:mm)');
    days.add(day.dayOfWeek);
  }
}
async function headers() {
  const token = await getAuthToken();
  if (!token) throw new Error('Please sign in to manage availability');
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}
function parseResponse(body: { success: boolean; data: AvailabilitySettings }): AvailabilitySettings {
  if (body?.success !== true || !body.data) throw new Error('Could not load or save availability');
  validateAvailabilitySettings(body.data);
  return body.data;
}
export async function fetchAvailabilitySettings(id: string): Promise<AvailabilitySettings> {
  const response = await axios.get(apiUrl(`/api/companions/${id}/availability/settings`), { headers: await headers() });
  return parseResponse(response.data);
}
export async function saveAvailabilitySettings(id: string, settings: AvailabilitySettings): Promise<AvailabilitySettings> {
  validateAvailabilitySettings(settings);
  const response = await axios.put(apiUrl(`/api/companions/${id}/availability/settings`), settings, { headers: await headers() });
  return parseResponse(response.data);
}
export function useAvailabilitySettings(id: string) {
  const userId = useAuthStore(state => state.user?.id);
  return useQuery({ queryKey: ['availabilitySettings', id, userId], queryFn: () => fetchAvailabilitySettings(id), enabled: !!id && id === userId, retry: false });
}
export function useSaveAvailabilitySettings(id: string) {
  const client = useQueryClient();
  return useMutation({ mutationFn: (settings: AvailabilitySettings) => saveAvailabilitySettings(id, settings), onSuccess: async () => {
    await Promise.all([client.invalidateQueries({ queryKey: ['availabilitySettings', id] }), client.invalidateQueries({ queryKey: ['companionAvailability', id] })]);
  } });
}
