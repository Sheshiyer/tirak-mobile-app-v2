import type { AvailabilitySettings } from '@/services/api/companion/availability-settings';
const mockAxios = { get: jest.fn(), put: jest.fn() };
const mockQuery = jest.fn();
jest.mock('axios', () => ({ __esModule: true, default: mockAxios }));
jest.mock('@tanstack/react-query', () => ({ useQuery: (options: unknown) => mockQuery(options), useMutation: jest.fn(), useQueryClient: jest.fn() }));
jest.mock('@/services/api/companion/companion', () => ({ getAuthToken: async () => 'session' }));
jest.mock('@/constants/api', () => ({ apiUrl: (path: string) => path }));
jest.mock('@/stores/auth-store', () => ({ useAuthStore: (selector: any) => selector({ user: { id: 'owner' } }) }));
const { saveAvailabilitySettings, fetchAvailabilitySettings, validateAvailabilitySettings, useAvailabilitySettings } = require('@/services/api/companion/availability-settings');
const schedule: AvailabilitySettings = { timeZone: 'Asia/Bangkok', days: [{ dayOfWeek: 1, startTime: '09:15', endTime: '17:45', isAvailable: true }] };
beforeEach(() => jest.clearAllMocks());
test('save and reload preserve recurring days and Thailand clock times', async () => {
  mockAxios.put.mockResolvedValue({ data: { success: true, data: schedule } });
  mockAxios.get.mockResolvedValue({ data: { success: true, data: schedule } });
  expect(await saveAvailabilitySettings('owner', schedule)).toEqual(schedule);
  expect(await fetchAvailabilitySettings('owner')).toEqual(schedule);
  expect(mockAxios.put).toHaveBeenCalledWith('/api/companions/owner/availability/settings', schedule, expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer session' }) }));
});
test.each([{ startTime: '25:00' }, { endTime: '09:15' }, { endTime: '08:00' }, { dayOfWeek: 7 }])('rejects invalid settings before any write: %s', async change => {
  await expect(saveAvailabilitySettings('owner', { ...schedule, days: [{ ...schedule.days[0], ...change }] })).rejects.toThrow();
  expect(mockAxios.put).not.toHaveBeenCalled();
});
test('duplicate weekdays invalid; unset schedule is distinct from unavailable days', () => {
  expect(() => validateAvailabilitySettings({ ...schedule, days: [...schedule.days, ...schedule.days] })).toThrow();
  expect(() => validateAvailabilitySettings({ ...schedule, days: [] })).not.toThrow();
});
test('failure and malformed responses cannot become saved state', async () => {
  mockAxios.put.mockResolvedValue({ data: { success: false } });
  await expect(saveAvailabilitySettings('owner', schedule)).rejects.toThrow();
  mockAxios.get.mockRejectedValue(new Error('offline'));
  await expect(fetchAvailabilitySettings('owner')).rejects.toThrow('offline');
});
test('owner settings queries never run for another account', () => {
  useAvailabilitySettings('other'); expect(mockQuery.mock.calls[0][0].enabled).toBe(false);
  useAvailabilitySettings('owner'); expect(mockQuery.mock.calls[1][0].queryKey).toEqual(['availabilitySettings', 'owner', 'owner']);
});
