import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  createPromptPayCharge,
  parsePromptPayCharge,
  PaymentClientError,
  type PaymentErrorKind,
  type PromptPayCharge,
} from '@/services/api/payment/payment';
import type { PaymentStatus } from '@/services/api/booking/booking';
import { secureStorage } from '@/utils/secure-storage';

export type PaymentMethod = 'cash' | 'promptpay';
export type PaymentPhase =
  | 'idle'
  | 'creating'
  | 'pending'
  | 'indeterminate'
  | 'paid'
  | 'failed'
  | 'expired'
  | 'restitution_pending'
  | 'restituted'
  | 'restitution_failed'
  | 'error';

export interface PaymentBooking {
  id: string;
  status: string;
  paymentStatus: PaymentStatus;
  currency?: string;
}

interface PaymentState {
  booking: PaymentBooking | null;
  selectedMethod: PaymentMethod | null;
  charge: PromptPayCharge | null;
  phase: PaymentPhase;
  errorKind: PaymentErrorKind | null;
  setBooking: (booking: PaymentBooking) => boolean;
  selectMethod: (method: PaymentMethod) => void;
  createCharge: () => Promise<PromptPayCharge>;
  retryCharge: () => Promise<PromptPayCharge>;
  releasePaymentSessionIfSafe: () => boolean;
  resetPayment: () => void;
  clearPaymentSession: () => Promise<void>;
}

const initialPaymentState = {
  booking: null,
  selectedMethod: null,
  charge: null,
  phase: 'idle' as const,
  errorKind: null,
};

const securePersistStorage = {
  getItem: (name: string) => secureStorage.getItemAsync(name),
  setItem: (name: string, value: string) => secureStorage.setItemAsync(name, value),
  removeItem: (name: string) => secureStorage.deleteItemAsync(name),
};

let inFlightCharge: Promise<PromptPayCharge> | null = null;
let paymentSessionVersion = 0;

export function derivePaymentPhase(charge: PromptPayCharge): Exclude<PaymentPhase, 'idle' | 'error'> {
  const pair = `${charge.attemptStatus}:${charge.paymentStatus}`;
  switch (pair) {
    case 'creating:processing': return 'creating';
    case 'indeterminate:processing': return 'indeterminate';
    case 'pending:pending': return 'pending';
    case 'successful:paid': return 'paid';
    case 'successful:restitution_pending': return 'restitution_pending';
    case 'successful:restituted': return 'restituted';
    case 'successful:restitution_failed': return 'restitution_failed';
    case 'failed:failed': return 'failed';
    case 'expired:failed': return 'expired';
    default: throw new PaymentClientError('unknown');
  }
}

export function deriveBookingPaymentPhase(status: PaymentStatus): PaymentPhase {
  switch (status) {
    case 'pending': return 'idle';
    case 'processing': return 'indeterminate';
    case 'paid': return 'paid';
    case 'failed': return 'failed';
    case 'refunded': return 'restitution_pending';
    case 'restitution_pending': return 'restitution_pending';
    case 'restituted': return 'restituted';
    case 'restitution_failed': return 'restitution_failed';
  }
}

const UNCERTAIN_ERROR_KINDS = new Set<PaymentErrorKind>([
  'in-progress',
  'indeterminate',
  'network',
  'unknown',
]);

const DEFINITE_NO_CHARGE_ERROR_KINDS = new Set<PaymentErrorKind>([
  'disabled',
  'unauthorized',
  'booking-not-found',
  'booking-not-payable',
]);

export function isPaymentNavigationLocked({
  phase,
  errorKind,
}: Pick<PaymentState, 'phase' | 'errorKind'>): boolean {
  return phase === 'creating'
    || phase === 'pending'
    || phase === 'indeterminate'
    || (phase === 'error' && errorKind !== null && UNCERTAIN_ERROR_KINDS.has(errorKind));
}

export function isPaymentMethodLocked(
  state: Pick<PaymentState, 'phase' | 'errorKind'>,
): boolean {
  return isPaymentNavigationLocked(state)
    || state.phase === 'paid'
    || state.phase === 'restitution_pending'
    || state.phase === 'restituted'
    || state.phase === 'restitution_failed';
}

function canReleasePaymentSession(state: Pick<PaymentState, 'phase' | 'errorKind'>): boolean {
  if (['idle', 'paid', 'failed', 'expired', 'restituted'].includes(state.phase)) return true;
  return state.phase === 'error'
    && state.errorKind !== null
    && DEFINITE_NO_CHARGE_ERROR_KINDS.has(state.errorKind);
}

export function isPaymentSessionRetained(
  state: Pick<PaymentState, 'phase' | 'errorKind'>,
): boolean {
  return !canReleasePaymentSession(state);
}

export const usePaymentStore = create<PaymentState>()(
  persist(
    (set, get) => ({
      ...initialPaymentState,

      setBooking: (booking) => {
        const currentState = get();
        const currentBookingId = currentState.booking?.id;
        if (currentBookingId && currentBookingId !== booking.id) {
          if (isPaymentSessionRetained(currentState)) return false;
          paymentSessionVersion += 1;
          inFlightCharge = null;
          const phase = deriveBookingPaymentPhase(booking.paymentStatus);
          set({
            ...initialPaymentState,
            booking,
            phase,
            errorKind: phase === 'indeterminate' ? 'indeterminate' : null,
          });
          return true;
        }
        const bookingPhase = deriveBookingPaymentPhase(booking.paymentStatus);
        if (bookingPhase === 'idle' && currentBookingId === booking.id) {
          set({ booking });
        } else {
          set({
            booking,
            phase: bookingPhase,
            errorKind: bookingPhase === 'indeterminate' ? 'indeterminate' : null,
            ...(currentBookingId === booking.id ? {} : { charge: null, selectedMethod: null }),
          });
        }
        return true;
      },

      selectMethod: (selectedMethod) => set({ selectedMethod }),

      createCharge: () => {
        if (inFlightCharge) return inFlightCharge;

        const currentState = get();
        if (currentState.phase === 'creating' || currentState.phase === 'indeterminate') {
          if (currentState.phase === 'creating') {
            set({ phase: 'indeterminate', errorKind: 'indeterminate' });
          }
          return Promise.reject(new PaymentClientError('indeterminate'));
        }
        if (currentState.phase === 'pending') {
          return Promise.reject(new PaymentClientError('in-progress'));
        }

        const booking = currentState.booking;
        if (booking) {
          const bookingPhase = deriveBookingPaymentPhase(booking.paymentStatus);
          if (bookingPhase === 'indeterminate') {
            set({ phase: bookingPhase, errorKind: 'indeterminate' });
            return Promise.reject(new PaymentClientError('indeterminate'));
          }
          if (isPaymentMethodLocked({ phase: bookingPhase, errorKind: null })) {
            set({ phase: bookingPhase, errorKind: 'already-paid' });
            return Promise.reject(new PaymentClientError('already-paid'));
          }
          if (booking.currency !== undefined && booking.currency.trim().toUpperCase() !== 'THB') {
            set({ phase: 'error', errorKind: 'booking-not-payable' });
            return Promise.reject(new PaymentClientError('booking-not-payable'));
          }
        }
        if (!booking || booking.status !== 'confirmed') {
          return Promise.reject(new PaymentClientError('booking-not-payable'));
        }

        set({ phase: 'creating', errorKind: null });
        const requestSessionVersion = paymentSessionVersion;
        const request = createPromptPayCharge(booking.id)
          .then((charge) => {
            if (
              requestSessionVersion !== paymentSessionVersion ||
              get().booking?.id !== booking.id
            ) {
              return charge;
            }
            set({
              charge,
              phase: derivePaymentPhase(charge),
              errorKind: null,
            });
            return charge;
          })
          .catch((error: unknown) => {
            const errorKind = error instanceof PaymentClientError ? error.kind : 'unknown';
            if (
              requestSessionVersion === paymentSessionVersion &&
              get().booking?.id === booking.id
            ) {
              const phase: PaymentPhase = errorKind === 'already-paid'
                ? 'paid'
                : errorKind === 'indeterminate'
                  ? 'indeterminate'
                  : 'error';
              set({ charge: null, phase, errorKind });
            }
            throw error instanceof PaymentClientError ? error : new PaymentClientError('unknown');
          });

        const trackedRequest = request.finally(() => {
          if (inFlightCharge === trackedRequest) {
            inFlightCharge = null;
          }
        });
        inFlightCharge = trackedRequest;
        return trackedRequest;
      },

      retryCharge: () => {
        const state = get();
        if (state.phase !== 'failed' && state.phase !== 'expired') {
          return Promise.reject(new PaymentClientError('in-progress'));
        }
        if (!state.booking) {
          return Promise.reject(new PaymentClientError('booking-not-payable'));
        }

        paymentSessionVersion += 1;
        inFlightCharge = null;
        set({ charge: null, phase: 'idle', errorKind: null });
        return get().createCharge();
      },

      releasePaymentSessionIfSafe: () => {
        if (!canReleasePaymentSession(get())) return false;
        get().resetPayment();
        return true;
      },

      resetPayment: () => {
        paymentSessionVersion += 1;
        inFlightCharge = null;
        set(initialPaymentState);
      },

      clearPaymentSession: async () => {
        get().resetPayment();
        await usePaymentStore.persist.clearStorage();
      },
    }),
    {
      name: 'tirak-payment-session',
      storage: createJSONStorage(() => securePersistStorage),
      partialize: (state) => ({
        booking: state.booking,
        selectedMethod: state.selectedMethod,
        charge: state.charge,
        phase: state.phase,
        errorKind: state.errorKind,
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<PaymentState>;
        if (!persisted.charge) {
          const bookingPhase = persisted.booking
            ? deriveBookingPaymentPhase(persisted.booking.paymentStatus)
            : 'idle';
          const persistedPhase = persisted.phase === 'creating'
            || persisted.phase === 'indeterminate'
            ? 'indeterminate'
            : (persisted.phase === 'error'
              && persisted.errorKind !== null
              && persisted.errorKind !== undefined
              && UNCERTAIN_ERROR_KINDS.has(persisted.errorKind))
            ? persisted.phase
            : bookingPhase;
          return {
            ...currentState,
            booking: persisted.booking ?? null,
            selectedMethod: persisted.selectedMethod ?? null,
            charge: null,
            phase: persistedPhase,
            errorKind: persistedPhase === 'indeterminate'
              ? (persisted.errorKind ?? 'indeterminate')
              : persistedPhase === 'error'
                ? (persisted.errorKind ?? 'unknown')
                : null,
          };
        }

        try {
          const charge = parsePromptPayCharge(persisted.charge);
          return {
            ...currentState,
            booking: persisted.booking ?? null,
            selectedMethod: persisted.selectedMethod ?? null,
            charge,
            phase: derivePaymentPhase(charge),
            errorKind: null,
          };
        } catch {
          return {
            ...currentState,
            booking: persisted.booking ?? null,
            selectedMethod: persisted.selectedMethod ?? null,
            charge: null,
            phase: 'error',
            errorKind: 'unknown',
          };
        }
      },
    },
  ),
);
