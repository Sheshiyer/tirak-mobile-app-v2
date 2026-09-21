import { create } from 'zustand';

import { REVIEW_ACCOUNTS, isReviewModeEnabled, type ReviewAccountKey } from '@/constants/review-mode';
import type { Booking, BookingListItem, CreateBookingRequest } from '@/services/api/booking/booking';

export const REVIEW_BOOKING_ID = 'review_booking_bangkok_001' as const;

export type ReviewBookingStatus = 'requested' | 'accepted';
export type ReviewPaymentStatus = 'not_charged';

export interface ReviewBookingFixture {
  id: typeof REVIEW_BOOKING_ID;
  customerId: 'demo_customer_001';
  guideId: 'demo_companion_001';
  experienceId: string;
  experienceName: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  location: string;
  totalAmount: number;
  status: ReviewBookingStatus;
  createdAt: '2026-01-01T00:00:00.000Z';
  acceptedAt: '2026-01-01T00:05:00.000Z' | null;
  payment: {
    method: 'cash';
    status: ReviewPaymentStatus;
    authority: 'review_fixture';
    providerChargeId: null;
  };
}

interface ReviewBookingFixtureState {
  booking: ReviewBookingFixture | null;
  createAsCustomer: (input?: Partial<CreateBookingRequest>) => ReviewBookingFixture;
  acceptAsGuide: () => ReviewBookingFixture;
  getForAccount: (account: ReviewAccountKey) => ReviewBookingFixture | null;
  reset: () => void;
}

export function createRequestedReviewBooking(
  input: Partial<CreateBookingRequest> = {},
): ReviewBookingFixture {
  return {
    id: REVIEW_BOOKING_ID,
    customerId: 'demo_customer_001',
    guideId: 'demo_companion_001',
    experienceId: input.serviceId || 'review_experience_bangkok_001',
    experienceName: 'Bangkok Old Town Culture Walk',
    date: input.date || '2099-10-15',
    startTime: input.startTime || '09:00',
    endTime: input.endTime || '12:00',
    duration: input.duration || 180,
    location: input.location || 'Bangkok Old Town',
    totalAmount: 1800,
    status: 'requested',
    createdAt: '2026-01-01T00:00:00.000Z',
    acceptedAt: null,
    payment: {
      method: 'cash',
      status: 'not_charged',
      authority: 'review_fixture',
      providerChargeId: null,
    },
  };
}

/**
 * Project fixture truth into the existing booking-list contract. The public
 * payment status stays pending because cash has not been collected; the
 * fixture's `not_charged` payment object remains the authoritative detail.
 */
export function reviewBookingToListItem(booking: ReviewBookingFixture): BookingListItem {
  const customer = REVIEW_ACCOUNTS.customer.user;
  const guide = REVIEW_ACCOUNTS.guide.user;

  return {
    id: booking.id,
    companion: {
      id: guide.id,
      name: guide.name,
      profileImage: guide.profileImage || '',
      rating: 5,
    },
    customer: {
      id: customer.id,
      name: customer.name,
      profileImage: customer.profileImage || '',
      phone: '',
      rating: 5,
    },
    service: {
      id: booking.experienceId,
      name: booking.experienceName,
      description: 'A review-safe cultural walk fixture with no provider charge.',
      price: 1800,
    },
    date: booking.date,
    startTime: booking.startTime,
    endTime: booking.endTime,
    duration: booking.duration,
    location: booking.location,
    status: booking.status === 'accepted' ? 'confirmed' : 'pending',
    totalAmount: booking.totalAmount,
    currency: 'THB',
    paymentStatus: 'pending',
    createdAt: booking.createdAt,
  };
}

export function reviewBookingToBooking(booking: ReviewBookingFixture): Booking {
  const listItem = reviewBookingToListItem(booking);
  return {
    ...listItem,
    companionId: listItem.companion.id,
    customerId: listItem.customer.id,
    meetingPoint: booking.location,
    serviceFee: 0,
    paymentMethod: { id: 'cash', type: 'cash' },
    timeline: [
      {
        status: listItem.status,
        timestamp: booking.acceptedAt || booking.createdAt,
        note: booking.status === 'accepted'
          ? 'Guide approved the review booking.'
          : 'Traveler created the review booking.',
      },
    ],
    updatedAt: booking.acceptedAt || booking.createdAt,
  };
}

function requireReviewMode(): void {
  if (!isReviewModeEnabled()) {
    throw new Error('Review booking fixtures are not enabled in this build');
  }
}

export const useReviewBookingFixtureStore = create<ReviewBookingFixtureState>()((set, get) => ({
  booking: null,

  createAsCustomer: (input) => {
    requireReviewMode();
    const booking = createRequestedReviewBooking(input);
    set({ booking });
    return booking;
  },

  acceptAsGuide: () => {
    requireReviewMode();
    const current = get().booking;
    if (!current || current.guideId !== REVIEW_ACCOUNTS.guide.user.id) {
      throw new Error('The guide review account has no booking request to accept');
    }

    const booking: ReviewBookingFixture = {
      ...current,
      status: 'accepted',
      acceptedAt: '2026-01-01T00:05:00.000Z',
      // Role transitions never manufacture payment success on the client.
      payment: current.payment,
    };
    set({ booking });
    return booking;
  },

  getForAccount: (account) => {
    requireReviewMode();
    const booking = get().booking;
    if (!booking) return null;

    const accountId = REVIEW_ACCOUNTS[account].user.id;
    return booking.customerId === accountId || booking.guideId === accountId
      ? booking
      : null;
  },

  reset: () => set({ booking: null }),
}));
