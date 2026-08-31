import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  createPromptPayCharge,
  PaymentClientError,
  type PaymentErrorKind,
  type PromptPayCharge,
} from '@/app/api/payment/payment';
import { secureStorage } from '@/utils/secure-storage';

export type PaymentMethod = 'cash' | 'promptpay';
export type PaymentPhase = 'idle' | 'creating' | 'pending' | 'error';

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
            const pending = ['creating', 'indeterminate', 'pending'].includes(charge.attemptStatus);
            set({
              charge,
              phase: pending ? 'pending' : 'error',
              errorKind: pending ? null : 'unknown',
            });
            return charge;
          })
          .catch((error: unknown) => {
            const errorKind = error instanceof PaymentClientError ? error.kind : 'unknown';
            if (
              requestSessionVersion === paymentSessionVersion &&
              get().booking?.id === booking.id
            ) {
              set({ charge: null, phase: 'error', errorKind });
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
        return {
          ...currentState,
          booking: persisted.booking ?? null,
          selectedMethod: persisted.selectedMethod ?? null,
          charge: persisted.charge ?? null,
          phase: persisted.charge ? 'pending' : 'idle',
          errorKind: null,
        };
      },
    },
  ),
);
