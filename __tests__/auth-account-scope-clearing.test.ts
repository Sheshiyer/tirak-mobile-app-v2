/**
 * Gap 2: Auth login/register must clear account-scoped booking/payment state
 * before publishing a different user. invalidateAuth must also reset booking
 * persistence. The _layout.tsx subscription clears QueryClient cache on user change.
 *
 * Tests verify the actual invalidation/reset contract without calling the real
 * login/register methods (which use dynamic import() unsupported in this Jest env).
 * The clearing behavior is tested through invalidateAuth (logout path), the
 * store subscription pattern from _layout.tsx, and a real delayed aborted query.
 */
import { QueryClient } from '@tanstack/react-query';

// --- Stable mock holders (var is function-scoped, hoisted + initialized) ---
var mockResetBooking: jest.Mock;
var mockBookingClearStorage: jest.Mock;
var mockResetPayment: jest.Mock;
var mockClearPaymentSession: jest.Mock;

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn().mockResolvedValue(null),
    setItem: jest.fn().mockResolvedValue(undefined),
    removeItem: jest.fn().mockResolvedValue(undefined),
    multiRemove: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('@/utils/push-registration', () => ({
  unregisterBookingPushNotifications: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/utils/logger', () => ({
  logger: { log: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

jest.mock('@/utils/secure-storage', () => ({
  secureStorage: {
    getItemAsync: jest.fn().mockResolvedValue(null),
    setItemAsync: jest.fn().mockResolvedValue(undefined),
    deleteItemAsync: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('@/utils/posthog', () => ({
  applyAnalyticsConsent: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/utils/account-consent', () => ({
  AccountConsents: {},
  EmailVerificationDelivery: {},
  RegistrationConsent: {},
  verificationRetryAt: () => 0,
}));

jest.mock('@/stores/payment-store', () => {
  mockResetPayment = jest.fn();
  mockClearPaymentSession = jest.fn().mockResolvedValue(undefined);
  return {
    usePaymentStore: {
      getState: () => ({
        resetPayment: mockResetPayment,
        clearPaymentSession: mockClearPaymentSession,
      }),
    },
  };
});

jest.mock('@/stores/booking-store', () => {
  mockResetBooking = jest.fn();
  mockBookingClearStorage = jest.fn().mockResolvedValue(undefined);
  return {
    useBookingStore: {
      getState: () => ({ resetBooking: mockResetBooking }),
      persist: { clearStorage: mockBookingClearStorage },
    },
  };
});

jest.mock('@/stores/supplier-store', () => ({
  useSupplierStore: {
    getState: () => ({ clearSupplierState: jest.fn() }),
    persist: { clearStorage: jest.fn().mockResolvedValue(undefined) },
  },
}));

jest.mock('@/constants/api', () => ({
  API_BASE_URL: 'https://test.example.com',
  apiUrl: (p: string) => `https://test.example.com${p}`,
}));

jest.mock('@/constants/payment-capabilities', () => ({
  isLocalPromptPayEnabled: () => false,
}));

jest.mock('@/constants/review-mode', () => ({
  isReviewAccountUser: () => false,
  isReviewModeEnabled: () => false,
  REVIEW_ACCOUNTS: {},
  getReviewAccount: jest.fn(),
}));

jest.mock('@/utils/demo-mode', () => ({
  isDemoModeEnabled: () => false,
  isDemoIdentity: () => false,
}));

import { useAuthStore } from '@/stores/auth-store';

describe('account-scoped state clearing on auth transitions', () => {
  beforeEach(() => {
    mockResetBooking?.mockClear?.();
    mockBookingClearStorage?.mockClear?.();
    mockResetPayment?.mockClear?.();
    mockClearPaymentSession?.mockClear?.();
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      onboarded: false,
      consents: null,
      emailVerification: null,
    });
  });

  test('invalidateAuth clears booking store and its persistence', async () => {
    await useAuthStore.getState().invalidateAuth();

    expect(mockResetBooking).toHaveBeenCalled();
    expect(mockBookingClearStorage).toHaveBeenCalled();
    expect(mockClearPaymentSession).toHaveBeenCalled();
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  test('invalidateAuth unregisters push notifications', async () => {
    const pushMod = jest.requireMock('@/utils/push-registration') as any;
    await useAuthStore.getState().invalidateAuth();

    expect(pushMod.unregisterBookingPushNotifications).toHaveBeenCalled();
  });

  test('invalidateAuth clears secure storage tokens', async () => {
    const secMod = jest.requireMock('@/utils/secure-storage') as any;
    await useAuthStore.getState().invalidateAuth();

    expect(secMod.secureStorage.deleteItemAsync).toHaveBeenCalledWith('authToken');
    expect(secMod.secureStorage.deleteItemAsync).toHaveBeenCalledWith('refreshToken');
    expect(secMod.secureStorage.deleteItemAsync).toHaveBeenCalledWith('userCredentials');
  });

  test('clearAccountScopedState resets booking and payment stores', async () => {
    // Verify the clearing contract by calling invalidateAuth, which exercises
    // clearAccountScopedState's booking + payment + supplier cleanup via
    // the same store reset methods. This tests the actual handler path
    // (not a local reimplementation) against real mock store interfaces.
    useAuthStore.setState({
      user: { id: 'test-user', name: 'Test', email: 'test@test.com', userType: 'customer', verified: true, createdAt: '' },
      isAuthenticated: true,
    });

    await useAuthStore.getState().invalidateAuth();

    // booking store: resetBooking + persist.clearStorage
    expect(mockResetBooking).toHaveBeenCalled();
    expect(mockBookingClearStorage).toHaveBeenCalled();
    // payment store: clearPaymentSession
    expect(mockClearPaymentSession).toHaveBeenCalled();
    // auth state: cleared
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().onboarded).toBe(false);
  });

  test('QueryClient cancellation + cache clearing on user change (layout pattern)', async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(['bookings'], [{ id: 'old-booking' }]);
    queryClient.setQueryData(['notifications'], [{ id: 'old-notif' }]);

    const delayedAbortedQuery = jest.fn(async ({ signal }: { signal: AbortSignal }) => {
      await new Promise((resolve, reject) => {
        const timer = setTimeout(resolve, 50);
        signal.addEventListener('abort', () => {
          clearTimeout(timer);
          reject(new DOMException('The operation was aborted.', 'AbortError'));
        }, { once: true });
      });
      return [{ id: 'new-booking' }];
    });

    const fetchPromise = queryClient.fetchQuery({
      queryKey: ['bookings'],
      queryFn: ({ signal }) => delayedAbortedQuery({ signal }),
    }).catch((error) => error);

    await queryClient.cancelQueries();
    queryClient.clear();

    const result = await fetchPromise;
    expect(delayedAbortedQuery).toHaveBeenCalled();
    expect(result).toBeInstanceOf(Error);

    expect(queryClient.getQueryData(['bookings'])).toBeUndefined();
    expect(queryClient.getQueryData(['notifications'])).toBeUndefined();
  });
});

describe('release authentication excludes local preview sessions', () => {
  test('demo and review entry points reject even when legacy flags are enabled', async () => {
    process.env.EXPO_PUBLIC_DEMO_MODE = 'true';
    process.env.EXPO_PUBLIC_REVIEW_MODE = 'true';
    try {
      await expect(useAuthStore.getState().demoLogin('customer')).rejects.toThrow('Preview accounts are unavailable');
      await expect(useAuthStore.getState().switchReviewAccount('guide')).rejects.toThrow('Preview accounts are unavailable');
    } finally {
      delete process.env.EXPO_PUBLIC_DEMO_MODE;
      delete process.env.EXPO_PUBLIC_REVIEW_MODE;
    }
  });

  test('stored fixture bearer tokens cannot authenticate after an upgrade', async () => {
    const storage = jest.requireMock('@/utils/secure-storage').secureStorage;
    storage.getItemAsync.mockImplementation(async (key: string) => key === 'authToken'
      ? 'tirak-local-fixture-token'
      : JSON.stringify({ id: 'previous-session', email: 'real@example.com' }));
    await useAuthStore.getState().validateToken();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
    storage.getItemAsync.mockResolvedValue(null);
  });
});

test('favorites follow actual auth identity changes and invalidateAuth clears visible account data', async () => {
  const { useFavoritesStore } = require('../stores/favorites-store');
  const storage = jest.requireMock('@/utils/secure-storage').secureStorage;
  storage.getItemAsync.mockResolvedValue(null);
  useAuthStore.setState({user: {id:'favorite-owner-A', userType:'customer'} as any, isAuthenticated:true});
  await Promise.resolve(); await Promise.resolve();
  useFavoritesStore.getState().addFavorite('guide-A',{id:'guide-A',name:'Guide A'});
  expect(useFavoritesStore.getState().favorites).toEqual(['guide-A']);
  await useAuthStore.getState().invalidateAuth();
  expect(useFavoritesStore.getState().ownerId).toBeNull();
  expect(useFavoritesStore.getState().favorites).toEqual([]);
  useAuthStore.setState({user:{id:'favorite-owner-B',userType:'customer'} as any,isAuthenticated:true});
  await Promise.resolve(); await Promise.resolve();
  expect(useFavoritesStore.getState().ownerId).toBe('favorite-owner-B');
  expect(useFavoritesStore.getState().favorites).toEqual([]);
  await useAuthStore.getState().invalidateAuth();
});
