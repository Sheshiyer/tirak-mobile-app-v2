const mockCreatePromptPayCharge = jest.fn();

jest.mock('@/services/api/payment/payment', () => {
  const actual = jest.requireActual('@/services/api/payment/payment');
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

import {
  deriveBookingPaymentPhase,
  derivePaymentPhase,
  isPaymentMethodLocked,
  usePaymentStore,
} from '@/stores/payment-store';

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

  test.each([
    ['processing', 'indeterminate', 'indeterminate'],
    ['paid', 'paid', 'already-paid'],
    ['refunded', 'restitution_pending', 'already-paid'],
    ['restitution_pending', 'restitution_pending', 'already-paid'],
    ['restituted', 'restituted', 'already-paid'],
    ['restitution_failed', 'restitution_failed', 'already-paid'],
  ] as const)(
    'preserves booking payment state %s as %s and refuses a new charge',
    async (paymentStatus, phase, kind) => {
      usePaymentStore.getState().setBooking({ id: 'booking-1', status: 'confirmed', paymentStatus });
      await expect(usePaymentStore.getState().createCharge()).rejects.toMatchObject({ kind });
      expect(mockCreatePromptPayCharge).not.toHaveBeenCalled();
      expect(usePaymentStore.getState()).toMatchObject({ phase, booking: { paymentStatus } });
    },
  );

  test.each([
    ['pending', 'idle', false],
    ['processing', 'indeterminate', true],
    ['paid', 'paid', true],
    ['failed', 'failed', false],
    ['refunded', 'restitution_pending', true],
    ['restitution_pending', 'restitution_pending', true],
    ['restituted', 'restituted', true],
    ['restitution_failed', 'restitution_failed', true],
  ] as const)('derives booking state %s as %s with lock=%s', (status, phase, locked) => {
    expect(deriveBookingPaymentPhase(status)).toBe(phase);
    expect(isPaymentMethodLocked({ phase, errorKind: null })).toBe(locked);
  });

  test('turns a server already-paid response into authoritative paid store state', async () => {
    const { PaymentClientError } = jest.requireActual('@/services/api/payment/payment');
    mockCreatePromptPayCharge.mockRejectedValueOnce(new PaymentClientError('already-paid'));
    usePaymentStore.getState().setBooking({ id: 'booking-1', status: 'confirmed', paymentStatus: 'pending' });

    await expect(usePaymentStore.getState().createCharge()).rejects.toMatchObject({ kind: 'already-paid' });

    expect(usePaymentStore.getState()).toMatchObject({ phase: 'paid', errorKind: 'already-paid', charge: null });
  });

  test('turns an indeterminate POST outcome into explicit indeterminate store state', async () => {
    const { PaymentClientError } = jest.requireActual('@/services/api/payment/payment');
    mockCreatePromptPayCharge.mockRejectedValueOnce(new PaymentClientError('indeterminate'));
    usePaymentStore.getState().setBooking({ id: 'booking-1', status: 'confirmed', paymentStatus: 'pending' });

    await expect(usePaymentStore.getState().createCharge()).rejects.toMatchObject({ kind: 'indeterminate' });

    expect(usePaymentStore.getState()).toMatchObject({ phase: 'indeterminate', errorKind: 'indeterminate', charge: null });
  });

  test('a different booking cannot replace a pending financial session', () => {
    usePaymentStore.setState({
      booking: { id: 'booking-a', status: 'confirmed', paymentStatus: 'pending' },
      selectedMethod: 'promptpay',
      charge: pendingCharge,
      phase: 'pending',
    });

    usePaymentStore.getState().setBooking({ id: 'booking-b', status: 'confirmed', paymentStatus: 'pending' });

    expect(usePaymentStore.getState()).toMatchObject({
      booking: { id: 'booking-a' },
      selectedMethod: 'promptpay',
      charge: pendingCharge,
      phase: 'pending',
    });
  });

  test('a different booking cannot replace an indeterminate financial session', () => {
    usePaymentStore.setState({
      booking: { id: 'booking-a', status: 'confirmed', paymentStatus: 'pending' },
      selectedMethod: 'promptpay',
      charge: null,
      phase: 'indeterminate',
      errorKind: 'indeterminate',
    });

    expect(usePaymentStore.getState().setBooking({
      id: 'booking-b',
      status: 'confirmed',
      paymentStatus: 'pending',
    })).toBe(false);
    expect(usePaymentStore.getState()).toMatchObject({
      booking: { id: 'booking-a' },
      phase: 'indeterminate',
      errorKind: 'indeterminate',
    });
  });

  test('rejects PromptPay before transport for an explicit non-THB booking', async () => {
    usePaymentStore.getState().setBooking({
      id: 'booking-a',
      status: 'confirmed',
      paymentStatus: 'pending',
      currency: 'USD',
    });

    await expect(usePaymentStore.getState().createCharge()).rejects.toMatchObject({
      kind: 'booking-not-payable',
    });
    expect(mockCreatePromptPayCharge).not.toHaveBeenCalled();
  });

  test.each(['failed', 'expired'] as const)('retries only the obsolete %s attempt for the same booking', async (phase) => {
    const obsoleteCharge = {
      ...pendingCharge,
      attemptStatus: phase,
      paymentStatus: 'failed' as const,
    };
    mockCreatePromptPayCharge.mockResolvedValueOnce(pendingCharge);
    usePaymentStore.setState({
      booking: { id: 'booking-a', status: 'confirmed', paymentStatus: 'failed' },
      selectedMethod: 'promptpay',
      charge: obsoleteCharge,
      phase,
      errorKind: null,
    });

    await expect(usePaymentStore.getState().retryCharge()).resolves.toEqual(pendingCharge);

    expect(mockCreatePromptPayCharge).toHaveBeenCalledTimes(1);
    expect(usePaymentStore.getState()).toMatchObject({
      booking: { id: 'booking-a' },
      charge: pendingCharge,
      phase: 'pending',
    });
  });

  test.each(['creating', 'pending', 'indeterminate', 'paid', 'restitution_pending', 'restituted', 'restitution_failed'] as const)(
    'prohibits retry while payment phase is %s',
    async (phase) => {
      usePaymentStore.setState({
        booking: { id: 'booking-a', status: 'confirmed', paymentStatus: 'pending' },
        selectedMethod: 'promptpay',
        charge: pendingCharge,
        phase,
        errorKind: null,
      });

      await expect(usePaymentStore.getState().retryCharge()).rejects.toMatchObject({ kind: 'in-progress' });
      expect(mockCreatePromptPayCharge).not.toHaveBeenCalled();
      expect(usePaymentStore.getState()).toMatchObject({ phase, charge: pendingCharge });
    },
  );

  test.each(['creating', 'indeterminate'] as const)(
    'rehydrates charge-less %s as locked uncertainty and rejects duplicate or replacement charges',
    async (persistedPhase) => {
      const previousOptions = usePaymentStore.persist.getOptions();
      usePaymentStore.persist.setOptions({
        storage: {
          getItem: async () => ({
            state: {
              booking: { id: 'booking-a', status: 'confirmed', paymentStatus: 'pending' },
              selectedMethod: 'promptpay' as const,
              charge: null,
              phase: persistedPhase,
              errorKind: persistedPhase === 'indeterminate' ? 'indeterminate' as const : null,
            },
          }),
          setItem: async () => undefined,
          removeItem: async () => undefined,
        },
      });

      try {
        await usePaymentStore.persist.rehydrate();
        expect(usePaymentStore.getState()).toMatchObject({
          booking: { id: 'booking-a' },
          phase: 'indeterminate',
          errorKind: 'indeterminate',
        });
        await expect(usePaymentStore.getState().createCharge()).rejects.toMatchObject({
          kind: 'indeterminate',
        });
        expect(mockCreatePromptPayCharge).not.toHaveBeenCalled();
        expect(usePaymentStore.getState().setBooking({
          id: 'booking-b',
          status: 'confirmed',
          paymentStatus: 'pending',
        })).toBe(false);
        expect(usePaymentStore.getState().booking).toMatchObject({ id: 'booking-a' });
      } finally {
        usePaymentStore.persist.setOptions(previousOptions);
      }
    },
  );

  test('exposes no local successful or paid mutation', () => {
    const actions = usePaymentStore.getState() as unknown as Record<string, unknown>;
    expect(actions.markPaid).toBeUndefined();
    expect(actions.setSuccessful).toBeUndefined();
    expect(actions.setChargeStatus).toBeUndefined();
  });
});
