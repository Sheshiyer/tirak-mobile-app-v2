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
let mockPreferences:any;
const mockRefetch=jest.fn();
let mockStats:any;
let mockReferral:any;
const mockMutate=jest.fn();

jest.mock('react-native', () => ({
  Modal: 'Modal', View: 'View', Text: 'Text', ScrollView: 'ScrollView', TouchableOpacity: 'TouchableOpacity', Switch: 'Switch', ActivityIndicator: 'ActivityIndicator',
  StyleSheet: { create: (styles: unknown) => styles },
  Alert: { alert: jest.fn() }, Linking: { openURL: jest.fn() }, Platform: { OS: 'web', select: (values: Record<string, unknown>) => values.web ?? values.default },
}));
jest.mock('react-native-safe-area-context', () => ({ SafeAreaView: 'SafeAreaView' }));
jest.mock('expo-router', () => ({ router: mockRouter, useRouter: () => mockRouter, Redirect: 'Redirect' }));
jest.mock('expo-constants', () => ({ __esModule: true, default: { expoConfig: { version: 'test' } } }));
jest.mock('lucide-react-native', () => Object.fromEntries(['User', 'Bell', 'Shield', 'CreditCard', 'HelpCircle', 'LogOut', 'ChevronRight', 'Globe', 'Contact2', 'ChevronLeft', 'Trash2', 'Gift', 'Smartphone', 'Mail', 'Star', 'FileText','ArrowLeft','Calendar','Users','DollarSign','Settings','MessageSquare','Clock','TrendingUp','Award','Edit','Coins','Share2'].map((name) => [name, name])));
jest.mock('@/stores/auth-store', () => ({ useAuthStore: (selector?: (state: typeof mockState) => unknown) => selector ? selector(mockState) : mockState }));
jest.mock('@/hooks/useAuthStoreHydrated', () => ({ useAuthStoreHydrated: () => ({ user: mockState.user, isHydrated: mockHydrated }) }));
jest.mock('@/stores/supplier-store', () => ({ useSupplierStore: () => ({ setIsSupplier: jest.fn() }) }));
jest.mock('@/utils/secure-storage', () => ({ secureStorage: {getItemAsync:jest.fn().mockResolvedValue('test-token')} }));
jest.mock('@/utils/logger', () => ({ logger: { log: jest.fn() } }));
jest.mock('@/constants/api', () => ({ API_BASE_URL: 'http://account.test' }));
jest.mock('@/components/ui/Card', () => ({ Card: 'Card' }));
jest.mock('@/components/ui/RadialGradient', () => ({ RadialGradient: 'RadialGradient' }));
jest.mock('@/components/AccountPrivacyPreferences', () => ({ AccountPrivacyPreferences: 'AccountPrivacyPreferences' }));
jest.mock('@/services/api/notifications/notifications', () => ({ useNotificationPreferences: () => mockPreferences, useUpdateNotificationPreferences: () => ({ mutate: mockMutate,isPending:false }) }));
jest.mock('@/services/api/companion/stats',()=>({useSupplierStats:()=>mockStats}));
jest.mock('@/services/api/referrals/referrals',()=>({useReferralAccount:()=>mockReferral,useApplyReferralCode:()=>({mutate:mockMutate,isPending:false})}));
jest.mock('expo-linear-gradient',()=>({LinearGradient:'LinearGradient'}));
jest.mock('@/components/ui/ProfileImage',()=>({ProfileImage:'ProfileImage'}));
jest.mock('@/components/supplier/RecentActivityFeed',()=>({RecentActivityFeed:'RecentActivityFeed'}));
jest.mock('@/components/supplier/NotificationCenter',()=>({NotificationCenter:'NotificationCenter'}));
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
  mockPreferences={isLoading:false,error:null,refetch:mockRefetch,data:{success:true,data:{preferences:{push:false,email:true}}}};
  mockStats={isLoading:false,error:new Error('offline'),refetch:mockRefetch};
  mockReferral={isLoading:false,error:new Error('offline'),refetch:mockRefetch};
  mockHydrated = true;
  mockState.user = { id: 'real-user', userType: 'customer', verified: false };
});
afterEach(() => { if (mounted) act(() => mounted!.unmount()); mounted = undefined; });


const Analytics=require('@/app/(supplier)/analytics/index').default;
const Referrals=require('@/app/referrals').default;
function named(label:string){return mounted!.root.findAllByType('TouchableOpacity' as any).find(node=>node.props.accessibilityLabel===label)!;}
test('guide loading/error hides assumed values, retries GET and restores server switches',()=>{
 mockState.user.userType='companion';mockPreferences={isLoading:true,refetch:mockRefetch};
 act(()=>{mounted=TestRenderer.create(<GroupedSupplierSettings/>);});expect(mounted!.root.findAllByType('Switch' as any)).toHaveLength(0);
 mockPreferences={isLoading:false,error:new Error('offline'),refetch:mockRefetch};act(()=>mounted!.update(<GroupedSupplierSettings/>));
 expect(mounted!.root.findAllByType('Switch' as any)).toHaveLength(0);act(()=>named('Retry notification preferences').props.onPress());expect(mockRefetch).toHaveBeenCalledTimes(1);
 mockPreferences={isLoading:false,error:null,refetch:mockRefetch,data:{success:true,data:{preferences:{push:false,email:true}}}};act(()=>mounted!.update(<GroupedSupplierSettings/>));
 expect(mounted!.root.findAllByType('Switch' as any).map(node=>node.props.value)).toEqual([false,true]);
 act(()=>mounted!.root.findAllByType('Switch' as any)[0].props.onValueChange(true));expect(mockMutate).toHaveBeenCalledWith({push:true},expect.anything());
});
test.each([['traveler',CustomerSettings,'Contact Support'],['guide',GroupedSupplierSettings,'settings.contactSupport']])('%s mailto failure is visible and selectable',async(role,Screen,label)=>{
 if(role==='guide')mockState.user.userType='companion';require('react-native').Linking.openURL.mockRejectedValueOnce(new Error('no handler'));
 act(()=>{mounted=TestRenderer.create(<Screen/>);});await act(async()=>findButton(label)!.props.onPress());
 const feedback=mounted!.root.findAllByType('Text' as any).find(node=>node.props.accessibilityRole==='alert'&&String(node.props.children).includes('Unable to open your email app'));
 expect(feedback?.props.selectable).toBe(true);expect(String(feedback?.props.children)).toContain('support@tirak.app');expect(require('react-native').Alert.alert).not.toHaveBeenCalled();
});
test('feedback opens a composition with the support recipient and subject',async()=>{
 require('react-native').Linking.openURL.mockResolvedValue(undefined);act(()=>{mounted=TestRenderer.create(<CustomerSettings/>);});
 await act(async()=>findButton('Send app feedback')!.props.onPress());expect(require('react-native').Linking.openURL).toHaveBeenCalledWith('mailto:support@tirak.app?subject=Tirak%20app%20feedback');expect(require('react-native').Alert.alert).not.toHaveBeenCalled();
});
test('analytics Retry actually refetches instead of navigating to itself',()=>{
 act(()=>{mounted=TestRenderer.create(<Analytics/>);});act(()=>named('Retry analytics').props.onPress());expect(mockRefetch).toHaveBeenCalledTimes(1);expect(mockRouter.replace).not.toHaveBeenCalled();
});
test('referrals error offers a working query retry',()=>{
 act(()=>{mounted=TestRenderer.create(<Referrals/>);});act(()=>named('Retry rewards').props.onPress());expect(mockRefetch).toHaveBeenCalledTimes(1);
});

test('analytics restores real zero data and Back falls home when history is unavailable',()=>{
 mockStats={isLoading:false,error:null,refetch:mockRefetch,data:{success:true,data:{user:{name:'Guide',status:'active',totalReviews:0},data:{averageRating:null,totalBookings:0,profileViews:null,totalEarnings:null,thisMonthEarnings:null,completedBookings:0,cancelledBookings:0,responseRate:null}}}};
 act(()=>{mounted=TestRenderer.create(<Analytics/>);});expect(named('Retry analytics')).toBeUndefined();act(()=>named('Go back').props.onPress());expect(mockRouter.replace).toHaveBeenCalledWith('/(app)');
});
test('native mailto failure keeps the existing Alert fallback',async()=>{
 const {Platform,Linking,Alert}=require('react-native');Platform.OS='ios';Linking.openURL.mockRejectedValueOnce(new Error('no handler'));
 act(()=>{mounted=TestRenderer.create(<CustomerSettings/>);});await act(async()=>findButton('Contact Support')!.props.onPress());
 expect(Alert.alert).toHaveBeenCalledWith('Unable to open link','Email support@tirak.app');Platform.OS='web';
});
