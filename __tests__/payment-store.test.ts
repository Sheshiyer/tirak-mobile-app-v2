const mockCreatePromptPayCharge = jest.fn();

jest.mock('@/app/api/payment/payment', () => {
  class PaymentClientError extends Error {
    kind: string;

    constructor(...mockArgs: string[]) {
      super('Safe payment error');
      this.name = 'PaymentClientError';
      this.kind = mockArgs[0];
    }
  }
  return {
    createPromptPayCharge: (...args: unknown[]) => mockCreatePromptPayCharge(...args),
    PaymentClientError,
  };
});

jest.mock('@/utils/secure-storage', () => ({
  secureStorage: {
    getItemAsync: jest.fn().mockResolvedValue(null),
    setItemAsync: jest.fn().mockResolvedValue(undefined),
    deleteItemAsync: jest.fn().mockResolvedValue(undefined),
  },
}));

import { usePaymentStore } from '@/stores/payment-store';

const pendingCharge = {
  contractVersion: 'tirak-payments-v1' as const,
  chargeId: 'chrg_local_12345678',
  paymentStatus: 'pending',
  attemptStatus: 'pending',
  qrCodeUrl: 'http://127.0.0.1:8787/fixture/pending.png',
  amountSatang: 180000,
  displayTotalThb: 1800,
  currency: 'THB',
  expiresAt: '2026-09-01T01:00:00.000Z',
};

describe('payment session store', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    usePaymentStore.getState().resetPayment();
  });

  test('refuses charge creation until the stored booking is confirmed', async () => {
    usePaymentStore.getState().setBooking({ id: 'booking-1', status: 'pending', paymentStatus: 'pending' });
    usePaymentStore.getState().selectMethod('promptpay');

    await expect(usePaymentStore.getState().createCharge()).rejects.toMatchObject({
      kind: 'booking-not-payable',
    });
    expect(mockCreatePromptPayCharge).not.toHaveBeenCalled();
  });

  test('returns one in-flight promise and invokes the client once', async () => {
    let resolveCharge!: (value: typeof pendingCharge) => void;
    mockCreatePromptPayCharge.mockReturnValueOnce(
      new Promise((resolve) => { resolveCharge = resolve; }),
    );
    usePaymentStore.getState().setBooking({ id: 'booking-1', status: 'confirmed', paymentStatus: 'pending' });

    const first = usePaymentStore.getState().createCharge();
    const second = usePaymentStore.getState().createCharge();

    expect(second).toBe(first);
    expect(mockCreatePromptPayCharge).toHaveBeenCalledTimes(1);
    resolveCharge(pendingCharge);
    await expect(first).resolves.toEqual(pendingCharge);
  });

  test('stores the server pending response verbatim', async () => {
    mockCreatePromptPayCharge.mockResolvedValueOnce(pendingCharge);
    usePaymentStore.getState().setBooking({ id: 'booking-1', status: 'confirmed', paymentStatus: 'pending' });

    await usePaymentStore.getState().createCharge();

    expect(usePaymentStore.getState()).toMatchObject({
      phase: 'pending',
      charge: pendingCharge,
      errorKind: null,
    });
  });

  test('changing booking identity clears the prior charge session', () => {
    usePaymentStore.setState({
      booking: { id: 'booking-a', status: 'confirmed', paymentStatus: 'pending' },
      selectedMethod: 'promptpay',
      charge: pendingCharge,
      phase: 'pending',
    });

    usePaymentStore.getState().setBooking({ id: 'booking-b', status: 'confirmed', paymentStatus: 'pending' });

    expect(usePaymentStore.getState()).toMatchObject({
      booking: { id: 'booking-b' },
      selectedMethod: null,
      charge: null,
      phase: 'idle',
    });
  });

  test('exposes no local successful or paid mutation', () => {
    const actions = usePaymentStore.getState() as unknown as Record<string, unknown>;
    expect(actions.markPaid).toBeUndefined();
    expect(actions.setSuccessful).toBeUndefined();
    expect(actions.setChargeStatus).toBeUndefined();
  });
});
