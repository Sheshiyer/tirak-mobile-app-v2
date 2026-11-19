jest.mock('react-native', () => ({
  DeviceEventEmitter: {
    addListener: jest.fn(),
  },
  Platform: { OS: 'ios' },
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn().mockResolvedValue(null),
    setItem: jest.fn().mockResolvedValue(undefined),
    removeItem: jest.fn().mockResolvedValue(undefined),
    multiRemove: jest.fn().mockResolvedValue(undefined),
  },
}));

const mockSecureGetItem = jest.fn<Promise<string | null>, [string]>();
const mockSecureSetItem = jest.fn<Promise<void>, [string, string]>();
const mockSecureDeleteItem = jest.fn<Promise<void>, [string]>();

jest.mock('@/utils/secure-storage', () => ({
  secureStorage: {
    getItemAsync: (key: string) => mockSecureGetItem(key),
    setItemAsync: (key: string, value: string) => mockSecureSetItem(key, value),
    deleteItemAsync: (key: string) => mockSecureDeleteItem(key),
  },
}));

jest.mock('@/utils/posthog', () => ({
  posthog: { capture: jest.fn(), reset: jest.fn() },
  applyAnalyticsConsent: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/stores/supplier-store', () => ({
  useSupplierStore: {
    getState: () => ({
      isSupplier: false,
      setIsSupplier: jest.fn(),
      setProfile: jest.fn(),
      setStats: jest.fn(),
      resetSignupData: jest.fn(),
    }),
  },
}));

jest.mock('@/utils/logger', () => ({
  logger: { log: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

const mockCreatePromptPayCharge = jest.fn();

jest.mock('@/services/api/payment/payment', () => ({
  createPromptPayCharge: (...args: unknown[]) => mockCreatePromptPayCharge(...args),
  PaymentClientError: class PaymentClientError extends Error {
    kind = 'unknown';
  },
}));

jest.mock('@/services/api/booking/booking', () => ({ createBooking: jest.fn() }));
jest.mock('@/constants/api', () => ({ apiUrl: (route: string) => route }));
jest.mock('@/utils/currency', () => ({ convertCurrency: (amount: number) => amount }));

import { usePaymentStore } from '@/stores/payment-store';
import { useBookingStore } from '@/stores/booking-store';
import { useAuthStore } from '@/stores/auth-store';
import { DeviceEventEmitter } from 'react-native';
import { applyAnalyticsConsent } from '@/utils/posthog';

const pendingCharge = {
  contractVersion: 'tirak-payments-v1' as const,
  chargeId: 'chrg_local_12345678',
  paymentStatus: 'pending',
  attemptStatus: 'pending',
  qrCodeUrl: null,
  amountSatang: 180000,
  displayTotalThb: 1800,
  currency: 'THB',
} as const;

const seedPaymentForUserA = () => {
  usePaymentStore.setState({
    booking: { id: 'booking-a', status: 'confirmed', paymentStatus: 'pending' },
    selectedMethod: 'promptpay',
    charge: pendingCharge,
    phase: 'pending',
    errorKind: null,
  });
};

describe('payment session isolation', () => {
  const originalReviewMode = process.env.EXPO_PUBLIC_REVIEW_MODE;

  beforeEach(() => {
    process.env.EXPO_PUBLIC_REVIEW_MODE = originalReviewMode;
    mockCreatePromptPayCharge.mockReset();
    mockSecureGetItem.mockReset().mockResolvedValue(null);
    mockSecureSetItem.mockReset().mockResolvedValue(undefined);
    mockSecureDeleteItem.mockReset().mockResolvedValue(undefined);
    usePaymentStore.getState().resetPayment();
    useAuthStore.setState({ user: null, isAuthenticated: false, isLoading: false, error: null, onboarded: false });
  });

  afterAll(() => {
    process.env.EXPO_PUBLIC_REVIEW_MODE = originalReviewMode;
  });

  test('booking form reset releases a safely settled payment session', () => {
    usePaymentStore.setState({
      booking: { id: 'booking-a', status: 'confirmed', paymentStatus: 'paid' },
      selectedMethod: 'promptpay',
      charge: { ...pendingCharge, attemptStatus: 'successful', paymentStatus: 'paid' },
      phase: 'paid',
      errorKind: null,
    });

    useBookingStore.getState().resetBooking();

    expect(usePaymentStore.getState()).toMatchObject({
      booking: null,
      charge: null,
      selectedMethod: null,
      phase: 'idle',
      errorKind: null,
    });
    expect(useBookingStore.getState().bookingData).toMatchObject({ currentStep: 1, payment: null });
  });

  test.each(['creating', 'pending', 'indeterminate'] as const)(
    'booking form reset retains the original %s financial session',
    (phase) => {
      usePaymentStore.setState({
        booking: { id: 'booking-a', status: 'confirmed', paymentStatus: 'pending' },
        selectedMethod: 'promptpay',
        charge: phase === 'pending' ? pendingCharge : null,
        phase,
        errorKind: phase === 'indeterminate' ? 'indeterminate' : null,
      });

      useBookingStore.getState().resetBooking();

      expect(usePaymentStore.getState()).toMatchObject({
        booking: { id: 'booking-a' },
        charge: phase === 'pending' ? pendingCharge : null,
        selectedMethod: 'promptpay',
        phase,
      });
      expect(useBookingStore.getState().bookingData).toMatchObject({ currentStep: 1, payment: null });
    },
  );

  test('logout removes the prior payment session', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    seedPaymentForUserA();
    await useAuthStore.getState().logout();
    expect(usePaymentStore.getState()).toMatchObject({ booking: null, charge: null, selectedMethod: null });
    expect(mockSecureDeleteItem).toHaveBeenCalledWith('tirak-payment-session');
    consoleError.mockRestore();
  });

  test('missing credentials invalidate auth and remove persisted payment state', async () => {
    seedPaymentForUserA();
    await useAuthStore.getState().validateToken();

    expect(useAuthStore.getState()).toMatchObject({ user: null, isAuthenticated: false, isLoading: false });
    expect(usePaymentStore.getState()).toMatchObject({ booking: null, charge: null, selectedMethod: null });
    expect(mockSecureDeleteItem).toHaveBeenCalledWith('tirak-payment-session');
    expect(mockSecureDeleteItem).toHaveBeenCalledWith('authToken');
    expect(mockSecureDeleteItem).toHaveBeenCalledWith('refreshToken');
    expect(mockSecureDeleteItem).toHaveBeenCalledWith('userCredentials');
  });

  test('auth invalidation also clears the previous account consent and verification state', async () => {
    useAuthStore.setState({
      consents: { marketingOptIn: true, analyticsOptIn: true, termsVersion: '2026-09-19', privacyVersion: '2026-09-19' },
      emailVerification: { deliveryStatus: 'sent', retryAfterSeconds: 60, retryAt: Date.now() + 60000 },
    });
    await useAuthStore.getState().invalidateAuth();
    expect(useAuthStore.getState()).toMatchObject({ consents: null, emailVerification: null, isAuthenticated: false });
    expect(applyAnalyticsConsent).toHaveBeenCalledWith();
  });

  test('corrupt credentials invalidate auth and remove persisted payment state', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    mockSecureGetItem.mockImplementation(async (key) => key === 'authToken' ? 'token-123' : '{bad json');
    seedPaymentForUserA();
    await useAuthStore.getState().validateToken();

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(usePaymentStore.getState().charge).toBeNull();
    expect(mockSecureDeleteItem).toHaveBeenCalledWith('tirak-payment-session');
    consoleError.mockRestore();
  });

  test('secure storage read failure still invalidates memory and attempts every persisted cleanup', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    mockSecureGetItem.mockRejectedValueOnce(new Error('secure storage unavailable'));
    seedPaymentForUserA();
    await useAuthStore.getState().validateToken();

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(usePaymentStore.getState().charge).toBeNull();
    expect(mockSecureDeleteItem).toHaveBeenCalledWith('tirak-payment-session');
    expect(mockSecureDeleteItem).toHaveBeenCalledWith('authToken');
    expect(mockSecureDeleteItem).toHaveBeenCalledWith('refreshToken');
    expect(mockSecureDeleteItem).toHaveBeenCalledWith('userCredentials');
    consoleError.mockRestore();
  });

  test('unauthorized event awaits the same centralized invalidation path', async () => {
    seedPaymentForUserA();
    const addListener = DeviceEventEmitter.addListener as jest.Mock;
    expect(addListener).toHaveBeenCalledWith('auth:unauthorized', expect.any(Function));
    const unauthorizedListener = addListener.mock.calls.find(([event]) => event === 'auth:unauthorized')?.[1];

    await unauthorizedListener();

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(usePaymentStore.getState().charge).toBeNull();
    expect(mockSecureDeleteItem).toHaveBeenCalledWith('tirak-payment-session');
  });

  test('authenticated-user identity change removes user A payment data', () => {
    seedPaymentForUserA();
    useAuthStore.setState({
      user: { id: 'user-a', name: 'A', email: 'a@example.test', userType: 'customer', verified: true, createdAt: '2026-01-01' },
      isAuthenticated: true,
    });

    useAuthStore.getState().updateUser({ id: 'user-b' });

    expect(usePaymentStore.getState()).toMatchObject({ booking: null, charge: null, selectedMethod: null });
  });

  test('legacy review switching is refused even when enabled and preserves the current real session', async () => {
    process.env.EXPO_PUBLIC_REVIEW_MODE = 'true';
    seedPaymentForUserA();
    useBookingStore.getState().goToStep(5);
    useBookingStore.getState().updateRequests({ specialRequests: 'User A private draft' });
    const payment = usePaymentStore.getState();
    const booking = useBookingStore.getState().bookingData;
    await expect(useAuthStore.getState().switchReviewAccount('guide')).rejects.toThrow('Preview accounts are unavailable');
    expect(usePaymentStore.getState()).toBe(payment);
    expect(useBookingStore.getState().bookingData).toBe(booking);
    expect(mockSecureSetItem).not.toHaveBeenCalledWith('userCredentials', expect.stringContaining('demo_companion_001'));
  });

  test('review switching is refused without the legacy flag', async () => {
    delete process.env.EXPO_PUBLIC_REVIEW_MODE;
    await expect(useAuthStore.getState().switchReviewAccount('customer')).rejects.toThrow('Preview accounts are unavailable');
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  test.each([null, 'tirak-local-fixture-token', 'old-token'])('old review credentials are invalidated with bearer %p even when the flag is true', async token => {
    process.env.EXPO_PUBLIC_REVIEW_MODE = 'true';
    mockSecureGetItem.mockImplementation(async key => key === 'authToken' ? token : JSON.stringify({
      id: 'demo_customer_001', name: 'Alex Johnson', email: 'review.customer@tirak.app',
      userType: 'customer', verified: true, createdAt: '2026-01-01T00:00:00.000Z',
    }));
    await useAuthStore.getState().validateToken();
    expect(useAuthStore.getState()).toMatchObject({ user: null, isAuthenticated: false });
    expect(mockSecureDeleteItem).toHaveBeenCalledWith('authToken');
    expect(mockSecureDeleteItem).toHaveBeenCalledWith('refreshToken');
    expect(mockSecureDeleteItem).toHaveBeenCalledWith('userCredentials');
    expect(mockSecureSetItem).not.toHaveBeenCalledWith('authToken', expect.any(String));
  });

  test('a charge resolving after reset cannot restore the prior session', async () => {
    let resolveCharge!: (charge: typeof pendingCharge) => void;
    mockCreatePromptPayCharge.mockReturnValueOnce(
      new Promise<typeof pendingCharge>((resolve) => {
        resolveCharge = resolve;
      }),
    );
    usePaymentStore.getState().setBooking({
      id: 'booking-a',
      status: 'confirmed',
      paymentStatus: 'pending',
    });

    const staleRequest = usePaymentStore.getState().createCharge();
    usePaymentStore.getState().resetPayment();
    resolveCharge(pendingCharge);
    await staleRequest;

    expect(usePaymentStore.getState()).toMatchObject({
      booking: null,
      charge: null,
      selectedMethod: null,
      phase: 'idle',
    });
  });
});
