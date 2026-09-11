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

jest.mock('@/app/api/payment/payment', () => ({
  createPromptPayCharge: (...args: unknown[]) => mockCreatePromptPayCharge(...args),
  PaymentClientError: class PaymentClientError extends Error {
    kind = 'unknown';
  },
}));

jest.mock('@/app/api/booking/booking', () => ({ createBooking: jest.fn() }));
jest.mock('@/constants/api', () => ({ apiUrl: (route: string) => route }));
jest.mock('@/utils/currency', () => ({ convertCurrency: (amount: number) => amount }));

import { usePaymentStore } from '@/stores/payment-store';
import { useBookingStore } from '@/stores/booking-store';
import { useAuthStore } from '@/stores/auth-store';
import { DeviceEventEmitter } from 'react-native';

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
  beforeEach(() => {
    mockCreatePromptPayCharge.mockReset();
    mockSecureGetItem.mockReset().mockResolvedValue(null);
    mockSecureSetItem.mockReset().mockResolvedValue(undefined);
    mockSecureDeleteItem.mockReset().mockResolvedValue(undefined);
    usePaymentStore.getState().resetPayment();
    useAuthStore.setState({ user: null, isAuthenticated: false, isLoading: false, error: null, onboarded: false });
  });

  test('booking form reset preserves the pending financial session', () => {
    seedPaymentForUserA();
    useBookingStore.getState().resetBooking();
    expect(usePaymentStore.getState()).toMatchObject({
      booking: { id: 'booking-a' },
      charge: pendingCharge,
      selectedMethod: 'promptpay',
      phase: 'pending',
    });
    expect(useBookingStore.getState().bookingData).toMatchObject({ currentStep: 1, payment: null });
  });

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
