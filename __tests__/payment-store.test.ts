const mockCreatePromptPayCharge = jest.fn();

jest.mock('@/app/api/payment/payment', () => {
  const actual = jest.requireActual('@/app/api/payment/payment');
  return {
    ...actual,
    createPromptPayCharge: (...args: unknown[]) => mockCreatePromptPayCharge(...args),
  };
});

jest.mock('@/utils/secure-storage', () => ({
  secureStorage: {
    getItemAsync: jest.fn().mockResolvedValue(null),
    setItemAsync: jest.fn().mockResolvedValue(undefined),
    deleteItemAsync: jest.fn().mockResolvedValue(undefined),
  },
}));

import { derivePaymentPhase, usePaymentStore } from '@/stores/payment-store';

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
} as const;

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

  test.each([
    ['creating', 'processing', 'creating'],
    ['indeterminate', 'processing', 'indeterminate'],
    ['pending', 'pending', 'pending'],
    ['successful', 'paid', 'paid'],
    ['successful', 'restitution_pending', 'restitution_pending'],
    ['successful', 'restituted', 'restituted'],
    ['successful', 'restitution_failed', 'restitution_failed'],
    ['failed', 'failed', 'failed'],
    ['expired', 'failed', 'expired'],
  ] as const)(
    'derives %s/%s as %s from canonical payment truth',
    (attemptStatus, paymentStatus, phase) => {
      expect(derivePaymentPhase({ ...pendingCharge, attemptStatus, paymentStatus })).toBe(phase);
    },
  );

  test('stores a successful idempotent POST response as paid', async () => {
    const paidCharge = {
      ...pendingCharge,
      attemptStatus: 'successful' as const,
      paymentStatus: 'paid' as const,
    };
    mockCreatePromptPayCharge.mockResolvedValueOnce(paidCharge);
    usePaymentStore.getState().setBooking({ id: 'booking-1', status: 'confirmed', paymentStatus: 'pending' });

    await usePaymentStore.getState().createCharge();

    expect(usePaymentStore.getState()).toMatchObject({
      phase: 'paid',
      charge: paidCharge,
      errorKind: null,
    });
  });

  test('rehydrates a paid charge through the same canonical phase derivation', async () => {
    const paidCharge = {
      ...pendingCharge,
      attemptStatus: 'successful' as const,
      paymentStatus: 'paid' as const,
    };
    const previousOptions = usePaymentStore.persist.getOptions();
    usePaymentStore.persist.setOptions({
      storage: {
        getItem: async () => ({
          state: {
            booking: { id: 'booking-1', status: 'confirmed', paymentStatus: 'paid' },
            selectedMethod: 'promptpay' as const,
            charge: paidCharge,
          },
        }),
        setItem: async () => undefined,
        removeItem: async () => undefined,
      },
    });

    try {
      await usePaymentStore.persist.rehydrate();
      expect(usePaymentStore.getState()).toMatchObject({ phase: 'paid', charge: paidCharge });
    } finally {
      usePaymentStore.persist.setOptions(previousOptions);
    }
  });

  test.each(['paid', 'completed', 'refunded', 'restitution_pending', 'restituted', 'restitution_failed'])(
    'refuses a new charge for locally known terminal booking state %s',
    async (paymentStatus) => {
      usePaymentStore.getState().setBooking({ id: 'booking-1', status: 'confirmed', paymentStatus });
      await expect(usePaymentStore.getState().createCharge()).rejects.toMatchObject({ kind: 'already-paid' });
      expect(mockCreatePromptPayCharge).not.toHaveBeenCalled();
      expect(usePaymentStore.getState()).toMatchObject({ phase: 'paid', errorKind: 'already-paid' });
    },
  );

  test('turns a server already-paid response into authoritative paid store state', async () => {
    const { PaymentClientError } = jest.requireActual('@/app/api/payment/payment');
    mockCreatePromptPayCharge.mockRejectedValueOnce(new PaymentClientError('already-paid'));
    usePaymentStore.getState().setBooking({ id: 'booking-1', status: 'confirmed', paymentStatus: 'pending' });

    await expect(usePaymentStore.getState().createCharge()).rejects.toMatchObject({ kind: 'already-paid' });

    expect(usePaymentStore.getState()).toMatchObject({ phase: 'paid', errorKind: 'already-paid', charge: null });
  });

  test('turns an indeterminate POST outcome into explicit indeterminate store state', async () => {
    const { PaymentClientError } = jest.requireActual('@/app/api/payment/payment');
    mockCreatePromptPayCharge.mockRejectedValueOnce(new PaymentClientError('indeterminate'));
    usePaymentStore.getState().setBooking({ id: 'booking-1', status: 'confirmed', paymentStatus: 'pending' });

    await expect(usePaymentStore.getState().createCharge()).rejects.toMatchObject({ kind: 'indeterminate' });

    expect(usePaymentStore.getState()).toMatchObject({ phase: 'indeterminate', errorKind: 'indeterminate', charge: null });
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
