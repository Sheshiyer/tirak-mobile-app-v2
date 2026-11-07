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
jest.mock('@/utils/secure-storage', () => ({ secureStorage: {} }));
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
const surfaces = [
  ['customer settings', CustomerSettings],
  ['grouped /settings', GroupedSupplierSettings],
] as const;

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
  mockHydrated = true;
  mockState.user = { id: 'real-user', userType: 'customer', verified: false };
});
afterEach(() => { if (mounted) act(() => mounted!.unmount()); mounted = undefined; });

describe.each(surfaces)('%s account controls', (_name, Screen) => {
  test.each(['customer', 'supplier', 'companion'])('provides verification and saved privacy controls for %s', (role) => {
    mockState.user.userType = role;
    act(() => { mounted = TestRenderer.create(<Screen />); });
    expect(mounted!.root.findAllByType('AccountPrivacyPreferences' as any)).toHaveLength(1);
    const verify = findButton('settingsFlow.verifyEmail');
    expect(verify).toBeDefined();
    act(() => verify!.props.onPress());
    expect(mockRouter.push).toHaveBeenCalledWith('/auth/verify-email');
    act(() => findButton('Privacy Policy')!.props.onPress());
    expect(mockRouter.push).toHaveBeenCalledWith('/auth/legal?type=privacy');
    act(() => findButton('settings.termsOfService')!.props.onPress());
    expect(mockRouter.push).toHaveBeenCalledWith('/auth/legal?type=terms');
  });

  test('shows confirmed email status from the authenticated account', () => {
    mockState.user.verified = true;
    act(() => { mounted = TestRenderer.create(<Screen />); });
    expect(findButton('settingsFlow.emailVerified')).toBeDefined();
    expect(findButton('settingsFlow.verifyEmail')).toBeUndefined();
  });
});

test('a cold grouped settings route waits for hydration then renders customer settings directly', () => {
  mockHydrated = false;
  act(() => { mounted = TestRenderer.create(<GroupedSupplierSettings />); });
  expect(mounted!.root.findAllByType('ActivityIndicator' as any)).toHaveLength(1);
  mockHydrated = true;
  act(() => mounted!.update(<GroupedSupplierSettings />));
  expect(mounted!.root.findAllByType(CustomerSettings)).toHaveLength(1);
  expect(mockRouter.replace).not.toHaveBeenCalled();
});


describe('explicit legacy supplier settings URL',()=>{
  test.each(['customer','supplier','companion'])('redirects a hydrated %s to its canonical settings',role=>{
    mockState.user.userType=role;
    act(()=>{mounted=TestRenderer.create(<ExplicitSupplierSettings/>);});
    const redirects=mounted!.root.findAllByType('Redirect' as any);
    expect(redirects).toHaveLength(1);
    expect(redirects[0].props.href).toBe(role==='customer'?'/(app)/settings':'/(supplier)/settings');
    expect(mounted!.root.findAllByType('AccountPrivacyPreferences' as any)).toHaveLength(0);
  });
  test('waits for hydration without rendering another account settings surface',()=>{
    mockHydrated=false;act(()=>{mounted=TestRenderer.create(<ExplicitSupplierSettings/>);});
    expect(mounted!.root.findAllByType('ActivityIndicator' as any)).toHaveLength(1);
    expect(mounted!.root.findAllByType('Redirect' as any)).toHaveLength(0);
    expect(mounted!.root.findAllByType('AccountPrivacyPreferences' as any)).toHaveLength(0);
  });
  test('sends a signed-out visitor to authentication',()=>{
    mockState.user=null as any;act(()=>{mounted=TestRenderer.create(<ExplicitSupplierSettings/>);});
    expect(mounted!.root.findAllByType('Redirect' as any)[0].props.href).toBe('/auth');
    expect(mockState.logout).not.toHaveBeenCalled();
  });
});

test.each([['traveler',CustomerSettings,'Delete Account'],['guide',GroupedSupplierSettings,'settings.deleteAccount']])('%s exposes the real closure confirmation and Keep account dismisses without mutation',(_role,Screen,label)=>{
  if(_role==='guide')mockState.user.userType='companion';
  act(()=>{mounted=TestRenderer.create(<Screen/>);});
  expect(mounted!.root.findAllByType('Modal' as any)[0].props.visible).toBe(false);
  act(()=>findButton(label)!.props.onPress());
  expect(mounted!.root.findAllByType('Modal' as any)[0].props.visible).toBe(true);
  const confirm=findButton('Confirm close account');expect(confirm?.props.accessibilityRole).toBe('button');
  act(()=>findButton('Keep account')!.props.onPress());
  expect(mounted!.root.findAllByType('Modal' as any)[0].props.visible).toBe(false);
  expect(mockState.logout).not.toHaveBeenCalled();
  const api=require('@/services/api/auth/delete');
  expect(api.deleteUserAccount).not.toHaveBeenCalled();expect(api.deleteCompanionAccount).not.toHaveBeenCalled();expect(api.deleteSupplierAccount).not.toHaveBeenCalled();
});
