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
  View: 'View', Text: 'Text', ScrollView: 'ScrollView', TouchableOpacity: 'TouchableOpacity', Switch: 'Switch', ActivityIndicator: 'ActivityIndicator',
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
jest.mock('@/app/api/notifications/notifications', () => ({ useNotificationPreferences: () => ({}), useUpdateNotificationPreferences: () => ({ mutate: jest.fn() }) }));
jest.mock('@/app/api/auth/delete', () => ({ deleteCompanionAccount: jest.fn(), deleteSupplierAccount: jest.fn(), deleteUserAccount: jest.fn() }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key === 'settings.privacyPolicy' ? 'Privacy Policy' : key }) }));

const CustomerSettings = require('@/app/(app)/settings').default;
const GroupedSupplierSettings = require('@/app/(supplier)/settings/index').default;
const ExplicitSupplierSettings = require('@/app/supplier/settings/index').default;
const surfaces = [
  ['customer settings', CustomerSettings],
  ['grouped /settings', GroupedSupplierSettings],
  ['explicit /supplier/settings', ExplicitSupplierSettings],
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
    const verify = findButton('Verify your email');
    expect(verify).toBeDefined();
    act(() => verify!.props.onPress());
    expect(mockRouter.push).toHaveBeenCalledWith('/auth/verify-email');
    act(() => findButton('Privacy Policy')!.props.onPress());
    expect(mockRouter.push).toHaveBeenCalledWith('/auth/legal?type=privacy');
    act(() => findButton('Terms of Service')!.props.onPress());
    expect(mockRouter.push).toHaveBeenCalledWith('/auth/legal?type=terms');
  });

  test('shows confirmed email status from the authenticated account', () => {
    mockState.user.verified = true;
    act(() => { mounted = TestRenderer.create(<Screen />); });
    expect(findButton('Email verified')).toBeDefined();
    expect(findButton('Verify your email')).toBeUndefined();
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
