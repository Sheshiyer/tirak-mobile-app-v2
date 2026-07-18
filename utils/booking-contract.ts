export type NormalizedBookingPaymentStatus =
  | 'pending'
  | 'processing'
  | 'paid'
  | 'refunded';

export interface BookingRequestContract {
  companionId?: string;
  serviceId?: string;
  date?: string;
  startTime?: string;
  duration?: number;
}

/** Normalize provider/backend payment states before they reach mobile UI gates. */
export function normalizeBookingPaymentStatus(
  value: unknown,
): NormalizedBookingPaymentStatus {
  const status = String(value || '').trim().toLowerCase();

  if (['paid', 'completed', 'successful', 'succeeded'].includes(status)) {
    return 'paid';
  }

  if (status === 'refunded') {
    return 'refunded';
  }

  if (['processing', 'creating', 'indeterminate'].includes(status)) {
    return 'processing';
  }

  return 'pending';
}

/** Enforce the experience-first booking boundary for live and demo submissions. */
export function assertCompleteBookingRequest(
  booking: BookingRequestContract,
): void {
  if (!booking.serviceId?.trim()) {
    throw new Error('A guided experience is required before booking.');
  }

  if (
    !booking.companionId?.trim()
    || !booking.date?.trim()
    || !booking.startTime?.trim()
    || !booking.duration
  ) {
    throw new Error('Missing required booking fields.');
  }
}
