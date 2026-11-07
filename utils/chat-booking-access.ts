export interface ChatBookingAccess { canSend: boolean; status: string; message: string | null }
/** Lookup through the existing authorized booking API; a failed lookup is never a closed booking. */
export async function loadChatBookingAccess(bookingId: string | undefined, loadBooking: (id: string) => Promise<any>): Promise<ChatBookingAccess> {
  if (!bookingId) throw new Error('The conversation booking could not be verified.');
  const result = await loadBooking(bookingId);
  const booking = result?.data?.booking;
  if (!result?.success || booking?.id !== bookingId || !['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'].includes(booking?.status)) {
    throw new Error('The conversation booking could not be verified.');
  }
  const canSend = ['confirmed', 'in_progress'].includes(booking.status);
  return { canSend, status: booking.status, message: canSend ? null : booking.status === 'pending'
    ? 'This booking is awaiting confirmation. You can read earlier messages; new messages open after guide confirmation.'
    : `This booking is ${booking.status}. This conversation is read-only; your earlier messages remain available.` };
}
