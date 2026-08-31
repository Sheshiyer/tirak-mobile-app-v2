jest.mock('react-native', () => ({
  DeviceEventEmitter: { addListener: jest.fn() },
  Platform: { OS: 'web' },
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

jest.mock('@/utils/secure-storage', () => ({
  secureStorage: {
    getItemAsync: jest.fn().mockResolvedValue(null),
    setItemAsync: jest.fn().mockResolvedValue(undefined),
    deleteItemAsync: jest.fn().mockResolvedValue(undefined),
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
    usePaymentStore.getState().resetPayment();
    useAuthStore.setState({ user: null, isAuthenticated: false, isLoading: false, error: null, onboarded: false });
  });

  test('booking reset removes the prior payment session', () => {
    seedPaymentForUserA();
    useBookingStore.getState().resetBooking();
    expect(usePaymentStore.getState()).toMatchObject({ booking: null, charge: null, selectedMethod: null });
  });

  test('logout removes the prior payment session', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    seedPaymentForUserA();
    await useAuthStore.getState().logout();
    expect(usePaymentStore.getState()).toMatchObject({ booking: null, charge: null, selectedMethod: null });
    consoleError.mockRestore();
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
