import React, { act } from 'react';

interface TestNode {
  props: Record<string, any>;
  findAllByType: (type: string | React.ComponentType) => TestNode[];
}
interface MountedScreen {
  root: TestNode;
  update: (element: React.ReactElement) => void;
  unmount: () => void;
}
// The repository already ships this renderer but not its optional @types package.
const TestRenderer = require('react-test-renderer') as { create: (element: React.ReactElement) => MountedScreen };

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn() };
const mockState = { user: { id: 'real-user', userType: 'customer', verified: false }, logout: jest.fn() };
let mockHydrated = true;

jest.mock('react-native', () => ({
  Modal: 'Modal', View: 'View', Text: 'Text', ScrollView: 'ScrollView', TouchableOpacity: 'TouchableOpacity', Switch: 'Switch', ActivityIndicator: 'ActivityIndicator',
  StyleSheet: { create: (styles: unknown) => styles },
  Alert: { alert: jest.fn() }, Linking: { openURL: jest.fn() }, Platform: { OS: 'web', select: (values: Record<string, unknown>) => values.web ?? values.default },
}));
jest.mock('react-native-safe-area-context', () => ({ SafeAreaView: 'SafeAreaView' }));
jest.mock('expo-router', () => ({ router: mockRouter, useRouter: () => mockRouter, Redirect: 'Redirect' }));
jest.mock('expo-constants', () => ({ __esModule: true, default: { expoConfig: { version: 'test' } } }));
jest.mock('lucide-react-native', () => Object.fromEntries(['User', 'Bell', 'Shield', 'CreditCard', 'HelpCircle', 'LogOut', 'ChevronRight', 'Globe', 'Contact2', 'ChevronLeft', 'Trash2', 'Gift', 'Smartphone', 'Mail', 'Star', 'FileText'].map((name) => [name, name])));
jest.mock('@/stores/auth-store', () => ({ useAuthStore: (selector?: (state: typeof mockState) => unknown) => selector ? selector(mockState) : mockState }));
jest.mock('@/hooks/useAuthStoreHydrated', () => ({ useAuthStoreHydrated: () => ({ user: mockState.user, isHydrated: mockHydrated }) }));
jest.mock('@/stores/supplier-store', () => ({ useSupplierStore: () => ({ setIsSupplier: jest.fn() }) }));
jest.mock('@/utils/secure-storage', () => ({ secureStorage: {getItemAsync:jest.fn().mockResolvedValue('test-token')} }));
jest.mock('@/utils/logger', () => ({ logger: { log: jest.fn() } }));
jest.mock('@/constants/api', () => ({ API_BASE_URL: 'http://account.test' }));
jest.mock('@/components/ui/Card', () => ({ Card: 'Card' }));
jest.mock('@/components/ui/RadialGradient', () => ({ RadialGradient: 'RadialGradient' }));
jest.mock('@/components/AccountPrivacyPreferences', () => ({ AccountPrivacyPreferences: 'AccountPrivacyPreferences' }));
jest.mock('@/services/api/notifications/notifications', () => ({ useNotificationPreferences: () => ({}), useUpdateNotificationPreferences: () => ({ mutate: jest.fn() }) }));
jest.mock('@/services/api/auth/delete', () => ({ deleteCompanionAccount: jest.fn(), deleteSupplierAccount: jest.fn(), deleteUserAccount: jest.fn() }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key === 'settings.privacyPolicy' ? 'Privacy Policy' : key }) }));

const CustomerSettings = require('@/app/(app)/settings').default;
const GroupedSupplierSettings = require('@/app/(supplier)/settings/index').default;
const ExplicitSupplierSettings = require('@/app/supplier/settings/index').default;
let mounted: MountedScreen | undefined;
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
const originalConsoleError = console.error;
let consoleError: jest.SpyInstance;
beforeAll(() => {
  consoleError = jest.spyOn(console, 'error').mockImplementation((...args) => {
    if (String(args[0]).startsWith('react-test-renderer is deprecated.')) return;
    originalConsoleError(...args);
  });
});
afterAll(() => consoleError.mockRestore());

function findButton(label: string) {
  return mounted!.root.findAllByType('TouchableOpacity' as any).find((node) =>
    node.findAllByType('Text' as any).some((text) => text.props.children === label));
}

beforeEach(() => {
  jest.clearAllMocks();
  Object.defineProperty(window,'location',{value:{href:'/settings'},configurable:true});
  mockHydrated = true;
  mockState.user = { id: 'real-user', userType: 'customer', verified: false };
});
afterEach(() => { if (mounted) act(() => mounted!.unmount()); mounted = undefined; });

test.each([['traveler',CustomerSettings,'Delete Account'],['guide',GroupedSupplierSettings,'settings.deleteAccount']])('%s closure opens in-app without deleting before confirmation', (_role,Screen,label)=>{
  if (_role === 'guide') mockState.user.userType='companion';
  act(()=>{mounted=TestRenderer.create(<Screen/>);});
  act(()=>findButton(label)!.props.onPress());
  expect(mounted!.root.findAllByType('Modal' as any)[0].props.visible).toBe(true);
  expect(require('@/services/api/auth/delete').deleteCompanionAccount).not.toHaveBeenCalled();
  expect(mockState.logout).not.toHaveBeenCalled();
  act(()=>findButton('Keep account')!.props.onPress());
  expect(mounted!.root.findAllByType('Modal' as any)[0].props.visible).toBe(false);
});

test.each(['supplier','companion'])('%s closes only its existing account endpoint before logout',async(role)=>{
 mockState.user.userType=role;
 const api=require('@/services/api/auth/delete');
 const endpoint=role==='supplier'?api.deleteSupplierAccount:api.deleteCompanionAccount;
 endpoint.mockResolvedValue({success:true});mockState.logout.mockResolvedValue(undefined);
 act(()=>{mounted=TestRenderer.create(<GroupedSupplierSettings/>);});
 act(()=>findButton('settings.deleteAccount')!.props.onPress());
 await act(async()=>findButton('Confirm close account')!.props.onPress());
 expect(endpoint).toHaveBeenCalledWith('real-user');expect(api.deleteUserAccount).not.toHaveBeenCalled();
 expect(mockState.logout).toHaveBeenCalledTimes(1);expect(window.location.href).toBe('/auth');
});
test('guide API refusal retains the dialog and authenticated account for retry',async()=>{
 mockState.user.userType='companion';require('@/services/api/auth/delete').deleteCompanionAccount.mockResolvedValue({success:false,message:'Please retry later.'});
 act(()=>{mounted=TestRenderer.create(<GroupedSupplierSettings/>);});
 act(()=>findButton('settings.deleteAccount')!.props.onPress());
 await act(async()=>findButton('Confirm close account')!.props.onPress());
 expect(mounted!.root.findAllByType('Text' as any).some(node=>node.props.children==='Please retry later.')).toBe(true);
 expect(mockState.logout).not.toHaveBeenCalled();expect(mockRouter.replace).not.toHaveBeenCalled();
});
test('traveler closes its existing user endpoint and logs out only after success',async()=>{
 const originalFetch=global.fetch;global.fetch=jest.fn().mockResolvedValue({ok:true});mockState.logout.mockResolvedValue(undefined);
 act(()=>{mounted=TestRenderer.create(<CustomerSettings/>);});
 act(()=>findButton('Delete Account')!.props.onPress());
 expect(global.fetch).not.toHaveBeenCalled();
 await act(async()=>findButton('Confirm close account')!.props.onPress());
 expect(global.fetch).toHaveBeenCalledWith('http://account.test/api/users/real-user',expect.objectContaining({method:'DELETE',headers:{Authorization:'Bearer test-token'}}));
 expect(mockState.logout).toHaveBeenCalledTimes(1);expect(window.location.href).toBe('/auth');global.fetch=originalFetch;
});
test('traveler request failure keeps the account signed in and shows retryable feedback',async()=>{
 const originalFetch=global.fetch;global.fetch=jest.fn().mockResolvedValue({ok:false});
 act(()=>{mounted=TestRenderer.create(<CustomerSettings/>);});act(()=>findButton('Delete Account')!.props.onPress());
 await act(async()=>findButton('Confirm close account')!.props.onPress());
 expect(mockState.logout).not.toHaveBeenCalled();expect(window.location.href).toBe('/settings');
 expect(mounted!.root.findAllByType('Text' as any).some(node=>String(node.props.children).includes('Unable to close your account'))).toBe(true);
 global.fetch=originalFetch;
});
test('native traveler retains its Alert confirmation without issuing a request',()=>{
 const {Platform,Alert}=require('react-native');Platform.OS='ios';
 act(()=>{mounted=TestRenderer.create(<CustomerSettings/>);});act(()=>findButton('Delete Account')!.props.onPress());
 expect(Alert.alert).toHaveBeenCalledWith('Delete Account',expect.any(String),expect.arrayContaining([expect.objectContaining({text:'Cancel',style:'cancel'}),expect.objectContaining({text:'Delete Account',onPress:expect.any(Function)})]));
 expect(mounted!.root.findAllByType('Modal' as any)[0].props.visible).toBe(false);expect(mockState.logout).not.toHaveBeenCalled();Platform.OS='web';
});
