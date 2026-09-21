import { BookingPaymentReadModel } from '@/types/payment';

export type PaymentDisplay = {
  method: string;
  status: string;
  collectionNote: string;
};

const titleCase = (value: string) => value
  .split(/[_\s-]+/)
  .filter(Boolean)
  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
  .join(' ');

/** Converts optional server facts into safe, provider-neutral customer copy. */
export const toPaymentDisplay = (payment?: BookingPaymentReadModel | null): PaymentDisplay => {
  const status = payment?.status?.trim();
  const method = payment?.method?.trim();

  if (!status && !method) {
    return {
      method: 'Payment method not recorded',
      status: 'Payment details will be confirmed with your booking.',
      collectionNote: 'Tirak has not recorded a payment instruction for this booking.',
    };
  }

  const normalizedStatus = status?.toLowerCase();
  const recordedComplete = normalizedStatus === 'paid'
    || normalizedStatus === 'succeeded'
    || normalizedStatus === 'cash_collected';

  if (normalizedStatus === 'requires_action') {
    return {
      method: method ? titleCase(method) : 'Payment method pending',
      status: 'Payment action required',
      collectionNote: 'Complete the payment action supplied by Tirak before it can be recorded.',
    };
  }

  if (normalizedStatus === 'processing') {
    return {
      method: method ? titleCase(method) : 'Payment method pending',
      status: 'Payment processing',
      collectionNote: 'Tirak is waiting for a confirmed payment result.',
    };
  }

  return {
    method: method ? titleCase(method) : 'Payment method pending',
    status: recordedComplete ? 'Paid' : status ? titleCase(status) : 'Payment status pending',
    collectionNote: recordedComplete
      ? 'Payment is recorded by Tirak.'
      : 'Payment is not marked complete until Tirak records a confirmed status.',
  };
};
