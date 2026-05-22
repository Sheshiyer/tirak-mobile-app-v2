import { Booking, BookingListItem, BookingStatus } from '@/app/api/booking/booking';
import { BookingRequest } from '@/types/supplier-request';

type BookingLike = Booking | BookingListItem;

const statusToRequestStatus = (status: BookingStatus): BookingRequest['status'] => {
  switch (status) {
    case 'pending':
      return 'pending';
    case 'cancelled':
      return 'cancelled';
    case 'confirmed':
    case 'completed':
    case 'in_progress':
      return 'accepted';
    default:
      return 'pending';
  }
};

const getUrgency = (date: string): BookingRequest['urgency'] => {
  const diffMs = new Date(date).getTime() - Date.now();
  const diffHours = diffMs / (1000 * 60 * 60);
  if (diffHours <= 24) return 'urgent';
  if (diffHours <= 48) return 'high';
  if (diffHours <= 24 * 7) return 'medium';
  return 'low';
};

const getCustomerVerified = (customer: BookingLike['customer']): boolean =>
  Boolean(
    (customer as any)?.verified ||
    (customer as any)?.isVerified ||
    (customer as any)?.profileVerified
  );

export const bookingToRequest = (booking: BookingLike): BookingRequest => {
  const customer = booking.customer;
  const service = booking.service;
  const requestedDate = booking.date.split('T')[0];
  const createdAt = booking.createdAt || new Date().toISOString();
  const expiresAt = new Date(new Date(createdAt).getTime() + 24 * 60 * 60 * 1000).toISOString();
  const durationHours = Math.max(1, Math.round((booking.duration || 60) / 60));
  const serviceFee = 'serviceFee' in booking ? booking.serviceFee || 0 : 0;

  return {
    id: booking.id,
    customerId: customer?.id || 'unknown_customer',
    customerName: customer?.name || 'Traveler',
    customerImage: customer?.profileImage || '',
    customerRating: customer?.rating || 0,
    customerReviewCount: 0,
    customerVerified: getCustomerVerified(customer),
    customerJoinDate: createdAt,
    serviceId: service?.id || 'service',
    serviceName: service?.name || 'Local Experience',
    serviceCategory: 'Experience',
    requestedDate,
    requestedTime: booking.startTime,
    duration: durationHours,
    groupSize: 1,
    meetingLocation: booking.location || 'Location to be confirmed',
    meetingPoint: ('meetingPoint' in booking && booking.meetingPoint) || booking.location || 'Meeting point to be confirmed',
    area: booking.location || 'Thailand',
    distance: 0,
    travelTime: 0,
    basePrice: Math.max(0, booking.totalAmount - serviceFee),
    serviceFee,
    totalAmount: booking.totalAmount,
    currency: 'THB',
    specialRequests: ('specialRequests' in booking && booking.specialRequests) || '',
    languagePreference: Array.isArray((booking as any).preferredLanguages) ? (booking as any).preferredLanguages.join(', ') : '',
    dietaryRestrictions: Array.isArray((booking as any).dietaryRestrictions) ? (booking as any).dietaryRestrictions : [],
    accessibilityNeeds: Array.isArray((booking as any).accessibilityNeeds) ? (booking as any).accessibilityNeeds : [],
    groupComposition: 'Traveler booking',
    status: statusToRequestStatus(booking.status),
    urgency: getUrgency(requestedDate),
    createdAt,
    expiresAt,
    respondBy: expiresAt,
    hasMessages: false,
    customerPhone: customer?.phone,
    isRepeatCustomer: false,
    previousBookings: 0,
  };
};
