const mockStore = new Map<string,string>();
const mockDelete = jest.fn(async (key: string) => { mockStore.delete(key); });
const mockFetch = jest.fn();
const mockSet = jest.fn(async (key: string, value: string) => { mockStore.set(key, value); });
jest.mock('@/constants/api', () => ({ apiUrl: (path: string) => path }));
jest.mock('@/utils/logger', () => ({ logger: { warn: jest.fn() } }));
jest.mock('@/utils/secure-storage', () => ({ secureStorage: {
  getItemAsync: async (key: string) => mockStore.get(key) || null,
  setItemAsync: (key: string, value: string) => mockSet(key, value),
  deleteItemAsync: (key: string) => mockDelete(key),
} }));
const { registerBookingPushToken, unregisterBookingPushNotifications, getPushSessionGeneration } = require('@/utils/push-registration');
const ok = () => ({ ok: true, json: async () => ({ success: true }) });
beforeEach(() => { jest.clearAllMocks(); mockStore.clear(); mockStore.set('authToken','session-a'); mockStore.set('userCredentials',JSON.stringify({ id: 'a' })); global.fetch = mockFetch; mockFetch.mockResolvedValue(ok()); });

test.each([{ ok:false, json:async()=>({success:true}) },{ok:true,json:async()=>({success:false})}])('HTTP/application failure is never accepted as registered', async response => {
  mockFetch.mockResolvedValue(response);
  await expect(registerBookingPushToken('a','private-token','ios')).rejects.toThrow();
  expect(mockStore.has('tirak-push-registration')).toBe(true); // Staged cleanup record, not claimed delivery.
});
test('no session and wrong identity cannot register a token', async () => {
  expect(await registerBookingPushToken('b','private-token','ios')).toBe(false);
  mockStore.delete('authToken');
  expect(await registerBookingPushToken('a','private-token','ios')).toBe(false);
  expect(mockFetch).not.toHaveBeenCalled();
});
test('successful registration stores association and logout removes it using old credentials', async () => {
  expect(await registerBookingPushToken('a','private-token','ios','1.5.1')).toBe(true);
  expect(await unregisterBookingPushNotifications()).toBe(true);
  expect(mockFetch.mock.calls[1][1]).toMatchObject({ method:'DELETE', headers:{Authorization:'Bearer session-a'}, body:JSON.stringify({token:'private-token'}) });
  expect(mockStore.has('tirak-push-registration')).toBe(false);
});
test('failed unregister remains unconfirmed and preserves its retry record', async () => {
  await registerBookingPushToken('a','private-token','ios');
  mockFetch.mockRejectedValue(new Error('offline'));
  expect(await unregisterBookingPushNotifications()).toBe(false);
  expect(mockStore.has('tirak-push-registration')).toBe(true);
});
test('old native token retrieval cannot register after logout starts', async () => {
  const generation = getPushSessionGeneration();
  await unregisterBookingPushNotifications();
  expect(await registerBookingPushToken('a','private-token','ios',undefined,generation)).toBe(false);
  expect(mockFetch).not.toHaveBeenCalled();
});
test('unregister never deletes another account association; authenticated new registration transfers it', async () => {
  await registerBookingPushToken('a','private-token','ios');
  mockStore.set('authToken','session-b'); mockStore.set('userCredentials',JSON.stringify({id:'b'}));
  expect(await unregisterBookingPushNotifications()).toBe(false);
  expect(mockFetch).toHaveBeenCalledTimes(1);
  expect(await registerBookingPushToken('b','private-token','ios')).toBe(true);
  expect(JSON.parse(mockStore.get('tirak-push-registration')!).userId).toBe('b');
});
test('logout waits for any in-flight registration before deleting', async () => {
  let release!: (value: unknown) => void;
  mockFetch.mockImplementationOnce(() => new Promise(resolve => { release=resolve; }));
  const registering = registerBookingPushToken('a','private-token','ios');
  await new Promise(resolve => setTimeout(resolve,0));
  const unregistering = unregisterBookingPushNotifications();
  release(ok());
  await registering; expect(await unregistering).toBe(true);
  expect(mockFetch.mock.calls.map(call => call[1].method)).toEqual(['POST','DELETE']);
});

test('storage rejection prevents any server registration', async () => {
  mockSet.mockRejectedValueOnce(new Error('storage unavailable'));
  await expect(registerBookingPushToken('a','private-token','ios')).rejects.toThrow('storage unavailable');
  expect(mockFetch).not.toHaveBeenCalled();
});
