import type { BookingStatus, PaymentStatus } from '@/app/api/booking/booking';

export type BookingExperienceLabel =
  | 'requested'
  | 'confirmed'
  | 'paid'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface BookingExperienceState {
  label: BookingExperienceLabel;
  canPay: boolean;
  canChat: boolean;
}

/**
 * Single state gate for traveler CTAs. Payment is intentionally narrower than
 * chat: only a backend-confirmed, unpaid booking can start PromptPay.
 */
export function getBookingExperienceState(
  bookingStatus: BookingStatus,
  paymentStatus: PaymentStatus,
): BookingExperienceState {
  const canChat = ['confirmed', 'in_progress'].includes(bookingStatus);
  const canPay = bookingStatus === 'confirmed' && paymentStatus === 'pending';

  if (bookingStatus === 'cancelled') {
    return { label: 'cancelled', canPay: false, canChat: false };
  }

  if (paymentStatus === 'paid') {
    return { label: 'paid', canPay: false, canChat };
  }

  if (bookingStatus === 'pending') {
    return { label: 'requested', canPay: false, canChat: false };
  }

  if (bookingStatus === 'confirmed') {
    return { label: 'confirmed', canPay, canChat: true };
  }

  return { label: bookingStatus, canPay: false, canChat };
}

export function getBookingExperienceLabel(state: BookingExperienceState): string {
  switch (state.label) {
    case 'requested':
      return 'Requested';
    case 'confirmed':
      return 'Confirmed · payment available';
    case 'paid':
      return 'Paid';
    case 'in_progress':
      return 'In progress';
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
  }
}
