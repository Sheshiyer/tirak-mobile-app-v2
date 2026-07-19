export type NormalizedBookingPaymentStatus =
  | 'pending'
  | 'processing'
  | 'paid'
  | 'failed'
  | 'restitution_pending'
  | 'restituted'
  | 'restitution_failed';

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

  if (status === 'restituted') return 'restituted';
  if (status === 'restitution_failed') return 'restitution_failed';
  if (status === 'restitution_pending' || status === 'refunded') return 'restitution_pending';

  if (['processing', 'creating', 'indeterminate'].includes(status)) {
    return 'processing';
  }

  if (['failed', 'expired'].includes(status)) return 'failed';

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
