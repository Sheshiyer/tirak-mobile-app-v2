import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  createPromptPayCharge,
  parsePromptPayCharge,
  PaymentClientError,
  type PaymentErrorKind,
  type PromptPayCharge,
} from '@/app/api/payment/payment';
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
  paymentStatus: string;
}

interface PaymentState {
  booking: PaymentBooking | null;
  selectedMethod: PaymentMethod | null;
  charge: PromptPayCharge | null;
  phase: PaymentPhase;
  errorKind: PaymentErrorKind | null;
  setBooking: (booking: PaymentBooking) => void;
  selectMethod: (method: PaymentMethod) => void;
  createCharge: () => Promise<PromptPayCharge>;
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

const terminalBookingPaymentStatuses = new Set([
  'paid',
  'completed',
  'refunded',
  'restitution_pending',
  'restituted',
  'restitution_failed',
]);

export const usePaymentStore = create<PaymentState>()(
  persist(
    (set, get) => ({
      ...initialPaymentState,

      setBooking: (booking) => {
        const currentBookingId = get().booking?.id;
        if (currentBookingId && currentBookingId !== booking.id) {
          paymentSessionVersion += 1;
          inFlightCharge = null;
          set({ ...initialPaymentState, booking });
          return;
        }
        set({ booking });
      },

      selectMethod: (selectedMethod) => set({ selectedMethod }),

      createCharge: () => {
        if (inFlightCharge) return inFlightCharge;

        const booking = get().booking;
        if (booking && terminalBookingPaymentStatuses.has(booking.paymentStatus.trim().toLowerCase())) {
          set({ charge: null, phase: 'paid', errorKind: 'already-paid' });
          return Promise.reject(new PaymentClientError('already-paid'));
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
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<PaymentState>;
        if (!persisted.charge) {
          return {
            ...currentState,
            booking: persisted.booking ?? null,
            selectedMethod: persisted.selectedMethod ?? null,
            charge: null,
            phase: 'idle',
            errorKind: null,
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
