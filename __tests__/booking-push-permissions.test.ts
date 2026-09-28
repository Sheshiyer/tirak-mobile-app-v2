const mockNotifications = { setNotificationHandler: jest.fn(), getPermissionsAsync: jest.fn(), requestPermissionsAsync: jest.fn(), getExpoPushTokenAsync: jest.fn() };
const mockRegister = jest.fn();
const mockUnregister = jest.fn();
const mockConstants = { expoConfig: { version: '1.5.1', extra: { eas: { projectId: 'project' } } }, easConfig: null };
jest.mock('react-native', () => ({ Platform: { OS: 'ios' } }));
jest.mock('expo-constants', () => ({ __esModule: true, default: mockConstants }));
jest.mock('expo-notifications', () => mockNotifications);
jest.mock('@/utils/secure-storage', () => ({ secureStorage: {} }));
jest.mock('@/utils/logger', () => ({ logger: { warn: jest.fn() } }));
jest.mock('@/utils/push-registration', () => ({ registerBookingPushToken: (...args: unknown[]) => mockRegister(...args), unregisterBookingPushNotifications: () => mockUnregister(), getPushSessionGeneration: () => 0 }));
const { registerForBookingPushNotifications } = require('@/utils/booking-notifications');
beforeEach(() => { jest.clearAllMocks(); mockNotifications.getPermissionsAsync.mockResolvedValue({status:'granted'}); mockNotifications.getExpoPushTokenAsync.mockResolvedValue({data:'private-token'}); mockRegister.mockResolvedValue(true); mockConstants.expoConfig.extra.eas.projectId='project'; });
test('returns no token when server registration fails', async () => {
  mockRegister.mockRejectedValue(new Error('failed'));
  expect(await registerForBookingPushNotifications({id:'user'})).toBeNull();
});
test('denied permission removes old registration and never fetches an Expo token', async () => {
  mockNotifications.getPermissionsAsync.mockResolvedValue({status:'denied'}); mockNotifications.requestPermissionsAsync.mockResolvedValue({status:'denied'});
  expect(await registerForBookingPushNotifications({id:'user'})).toBeNull();
  expect(mockUnregister).toHaveBeenCalled(); expect(mockNotifications.getExpoPushTokenAsync).not.toHaveBeenCalled();
});
test('missing project configuration or native token failure cannot imply registration', async () => {
  mockConstants.expoConfig.extra.eas.projectId='';
  expect(await registerForBookingPushNotifications({id:'user'})).toBeNull();
  mockConstants.expoConfig.extra.eas.projectId='project'; mockNotifications.getExpoPushTokenAsync.mockRejectedValue(new Error('missing entitlement'));
  expect(await registerForBookingPushNotifications({id:'user'})).toBeNull();
  expect(mockRegister).not.toHaveBeenCalled();
});
test('verified registration passes exact owner and project', async () => {
  expect(await registerForBookingPushNotifications({id:'user'})).toBe('private-token');
  expect(mockNotifications.getExpoPushTokenAsync).toHaveBeenCalledWith({projectId:'project'});
  expect(mockRegister).toHaveBeenCalledWith('user','private-token','ios','1.5.1',0);
});
