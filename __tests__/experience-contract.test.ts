const mockAxios = { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() };
const mockStorage = new Map<string, string>();
const mockWrite = jest.fn(async (key: string, value: string) => { mockStorage.set(key, value); });
let mockUser = { id: 'owner-1' };
let mockDemo = false;
const mockQuery = jest.fn();
jest.mock('axios', () => ({ __esModule: true, default: mockAxios }));
jest.mock('@tanstack/react-query', () => ({ useQuery: (options: unknown) => mockQuery(options), useMutation: jest.fn(), useQueryClient: jest.fn() }));
jest.mock('@/services/api/companion/companion', () => ({ getAuthToken: async () => 'session' }));
jest.mock('@/constants/api', () => ({ apiUrl: (path: string) => path }));
jest.mock('@/utils/demo-mode', () => ({ getDemoModeEnabled: async () => mockDemo, isDemoModeEnabled: () => mockDemo }));
jest.mock('@/stores/auth-store', () => ({ useAuthStore: Object.assign((selector: any) => selector({ user: mockUser }), { getState: () => ({ user: mockUser }) }) }));
jest.mock('@/utils/secure-storage', () => ({ secureStorage: { getItemAsync: async (key: string) => mockStorage.get(key) || null, setItemAsync: (...args: [string, string]) => mockWrite(...args) } }));
const { createExperience, updateExperience, archiveExperience, fetchExperiences, readExperienceDrafts, invalidateExperienceQueries, useExperiences } = require('@/services/api/companion/experience');
const payload = { title: 'Canal walk', description: 'A three hour cultural walk', durationMinutes: 180, keywords: ['Culture'], price: 1800, currency: 'THB', is_active: true };
beforeEach(() => { jest.clearAllMocks(); mockWrite.mockImplementation(async (key, value) => { mockStorage.set(key, value); }); mockStorage.clear(); mockUser = { id: 'owner-1' }; mockDemo = false; });

test.each([404, 405, 501, 500])('ordinary development and release users propagate HTTP %s without writing drafts', async status => {
  const failure = { response: { status } };
  for (const method of Object.values(mockAxios)) method.mockRejectedValue(failure);
  for (const development of [true, false]) {
    (global as any).__DEV__ = development;
    await expect(createExperience('owner-1', payload)).rejects.toBe(failure);
    await expect(updateExperience('owner-1', 'service-1', payload)).rejects.toBe(failure);
    await expect(archiveExperience('owner-1', 'service-1')).rejects.toBe(failure);
    await expect(fetchExperiences('owner-1')).rejects.toBe(failure);
  }
  expect(mockWrite).not.toHaveBeenCalled();
});

test('a valid empty owner list stays empty while old drafts remain recoverable and unpublished', async () => {
  mockStorage.set('tirak-local-experiences', JSON.stringify({ 'owner-1': [{ id: 'old-local', title: 'Draft' }] }));
  mockAxios.get.mockResolvedValue({ data: { success: true, data: { items: [], pagination: { total: 0 } } } });
  expect((await fetchExperiences('owner-1')).data.items).toEqual([]);
  expect(await readExperienceDrafts('owner-1')).toHaveLength(1);
  expect(mockAxios.get).toHaveBeenCalledTimes(1);
  expect(mockAxios.get.mock.calls[0][0]).toBe('/api/companions/owner-1/experiences');
  await expect(readExperienceDrafts('other-owner')).rejects.toThrow('own drafts');
});

test('false success and malformed list fail explicitly', async () => {
  mockAxios.post.mockResolvedValue({ data: { success: false } });
  mockAxios.get.mockResolvedValue({ data: { success: true, data: {} } });
  await expect(createExperience('owner-1', payload)).rejects.toThrow();
  await expect(fetchExperiences('owner-1')).rejects.toThrow('Invalid experience response');
});

test('archive uses the authenticated canonical service route and invalidates all views', async () => {
  mockAxios.delete.mockResolvedValue({ data: { success: true, data: { experienceId: 'service-1', archived: true } } });
  await expect(archiveExperience('owner-1', 'service-1')).resolves.toMatchObject({ data: { archived: true } });
  expect(mockAxios.delete).toHaveBeenCalledWith('/api/companions/owner-1/experiences/service-1', { headers: expect.objectContaining({ Authorization: 'Bearer session' }) });
  const client = { invalidateQueries: jest.fn().mockResolvedValue(undefined) };
  await invalidateExperienceQueries(client as any, 'owner-1');
  for (const key of [['experiences','owner-1'], ['supplierStats','owner-1'], ['companions'], ['companion','owner-1'], ['companionProfile','owner-1']]) expect(client.invalidateQueries).toHaveBeenCalledWith({ queryKey: key });
});

test('explicit guide review archive is persistent, idempotent, and cannot resurrect seeded fixtures', async () => {
  mockDemo = true; mockUser = { id: 'demo_companion_001' };
  const initial = await fetchExperiences(mockUser.id);
  expect(initial.data.items).toHaveLength(1);
  const id = initial.data.items[0].id;
  await archiveExperience(mockUser.id, id);
  await archiveExperience(mockUser.id, id);
  expect((await fetchExperiences(mockUser.id)).data.items).toEqual([]);
  expect(mockAxios.delete).not.toHaveBeenCalled();
  expect(mockStorage.get('tirak-local-experiences')).toContain('[]');
});

test('a review traveler cannot change guide fixtures and storage failure cannot appear saved', async () => {
  mockDemo = true; mockUser = { id: 'demo_customer_001' };
  await expect(createExperience('demo_companion_001', payload)).rejects.toThrow('Only the guide');
  mockUser = { id: 'demo_companion_001' };
  mockWrite.mockRejectedValue(new Error('Storage unavailable'));
  await expect(createExperience(mockUser.id, payload)).rejects.toThrow('Storage unavailable');
});

test('queries differ across authenticated viewer identity', () => {
  useExperiences('guide'); mockUser = { id: 'other' }; useExperiences('guide');
  expect(mockQuery.mock.calls[0][0].queryKey).toEqual(['experiences', 'guide', 'owner-1', false]);
  expect(mockQuery.mock.calls[1][0].queryKey).toEqual(['experiences', 'guide', 'other', false]);
});
