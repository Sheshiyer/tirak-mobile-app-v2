const mockGet = jest.fn();
const mockQuery = jest.fn();
let mockId = 'guide-a';
jest.mock('axios', () => ({ __esModule: true, default: { get: (...args: unknown[]) => mockGet(...args) } }));
jest.mock('@tanstack/react-query', () => ({ useQuery: (options: unknown) => mockQuery(options) }));
jest.mock('@/services/api/companion/companion', () => ({ getAuthToken: async () => 'session' }));
jest.mock('@/services/api/companion/profile', () => ({ fetchCompanionProfile: jest.fn() }));
jest.mock('@/services/api/booking/booking', () => ({ fetchBookings: jest.fn() }));
jest.mock('@/stores/review-booking-fixture-store', () => ({ useReviewBookingFixtureStore: { getState: () => ({}) } }));
jest.mock('@/constants/api', () => ({ apiUrl: (path: string) => path }));
jest.mock('@/utils/logger', () => ({ logger: { warn: jest.fn() } }));
jest.mock('@/utils/demo-mode', () => ({ getDemoModeEnabled: async () => false }));
jest.mock('@/stores/auth-store', () => ({ useAuthStore: Object.assign((selector: any) => selector({ user: { id: mockId } }), { getState: () => ({ user: { id: mockId } }) }) }));
const { fetchSupplierStats, useSupplierStats } = require('@/services/api/companion/stats');
beforeEach(() => { jest.clearAllMocks(); mockId='guide-a'; });
test('unavailable revenue and response metrics remain null', async () => {
  const data = { user:{name:'Guide'}, data:{totalBookings:32, totalEarnings:null, thisMonthEarnings:null, profileViews:null, responseRate:null, responseTime:null, averageRating:null} };
  mockGet.mockResolvedValue({data:{success:true,data}});
  expect((await fetchSupplierStats()).data).toEqual(data);
  expect(mockGet.mock.calls[0][0]).toBe('/api/suppliers/stats');
});
test('ordinary stats failures never derive fake metrics from a first page', async () => {
  mockGet.mockRejectedValue(new Error('outage'));
  await expect(fetchSupplierStats()).rejects.toThrow('outage');
  mockGet.mockResolvedValue({data:{success:false}});
  await expect(fetchSupplierStats()).rejects.toThrow('Invalid statistics response');
});
test('stats cache keys isolate account switches', () => {
  useSupplierStats(); mockId='guide-b'; useSupplierStats();
  expect(mockQuery.mock.calls[0][0].queryKey).toEqual(['supplierStats','guide-a']);
  expect(mockQuery.mock.calls[1][0].queryKey).toEqual(['supplierStats','guide-b']);
});
