jest.mock('react-native', () => ({ Platform: { OS: 'web' } }));
jest.mock('axios', () => ({ post: jest.fn(), put: jest.fn(), isAxiosError: () => false }));
jest.mock('@tanstack/react-query', () => ({ useQuery: jest.fn(), useMutation: jest.fn(), useQueryClient: jest.fn() }));
jest.mock('../utils/api-errors', () => ({ handleApiError: (error: any) => error }));
jest.mock('../constants/api', () => ({ apiUrl: (path: string) => 'https://core.test'+path }));
jest.mock('../utils/demo-mode', () => ({ getDemoModeEnabled: async () => false }));
jest.mock('../services/api/companion/companion', () => ({ getAuthToken: async () => 'synthetic-test-token' }));
import axios from 'axios';
import { Platform } from 'react-native';
import { updateCustomerProfile } from '../services/api/customer/customerProfile';
const originalFormData = globalThis.FormData;
const originalFetch = globalThis.fetch;
let parts: any[];
beforeEach(() => {
  jest.clearAllMocks(); parts=[]; (Platform as any).OS='web';
  globalThis.FormData = class { append(...args:any[]) { parts.push(args); } } as any;
  (axios.post as jest.Mock).mockResolvedValue({data:{data:{imageUrl:'https://images.test/avatar.png'}}});
  (axios.put as jest.Mock).mockResolvedValue({data:{success:true,data:{id:'traveler-1'}}});
});
afterAll(() => { globalThis.FormData=originalFormData; globalThis.fetch=originalFetch; });
it('uploads a real browser image Blob, lets browser set boundary and persists returned URL', async () => {
  const blob = new Blob(['synthetic image'],{type:'image/png'});
  globalThis.fetch = jest.fn().mockResolvedValue({ ok:true, blob: async () => blob });
  const result = await updateCustomerProfile({id:'traveler-1',name:'Traveler',profileImage:'blob:chosen'});
  expect(parts[0]).toEqual(['file',blob,'profile.png']);
  expect((axios.post as jest.Mock).mock.calls[0][2].headers['Content-Type']).toBeUndefined();
  expect((axios.put as jest.Mock).mock.calls[0][1].profileImage).toBe('https://images.test/avatar.png');
  expect(result.data.profileImage).toBe('https://images.test/avatar.png');
});
it('fails honestly when chosen image cannot be read and never submits profile', async () => {
  globalThis.fetch = jest.fn().mockResolvedValue({ok:false});
  await expect(updateCustomerProfile({id:'traveler-1',profileImage:'blob:expired'})).rejects.toThrow();
  expect(axios.post).not.toHaveBeenCalled(); expect(axios.put).not.toHaveBeenCalled();
});
it('preserves native URI multipart upload without browser fetch', async () => {
  (Platform as any).OS='ios'; globalThis.fetch=jest.fn();
  await updateCustomerProfile({id:'traveler-1',profileImage:'file:///photo.jpg'});
  expect(parts[0][1]).toEqual({uri:'file:///photo.jpg',name:'profile.jpg',type:'image/jpeg'});
  expect(globalThis.fetch).not.toHaveBeenCalled();
});
