import { getBookingExperienceState } from '@/utils/booking-state';

describe('booking experience state gates', () => {
  test.each([
    ['pending', 'pending', 'requested', false, false],
    ['confirmed', 'pending', 'confirmed', true, true],
    ['confirmed', 'paid', 'paid', false, true],
    ['confirmed', 'processing', 'payment_processing', false, true],
    ['confirmed', 'failed', 'confirmed', true, true],
    ['completed', 'paid', 'paid', false, false],
    ['cancelled', 'pending', 'cancelled', false, false],
    ['cancelled', 'restitution_pending', 'restitution_pending', false, false],
    ['cancelled', 'restituted', 'restituted', false, false],
    ['cancelled', 'restitution_failed', 'restitution_failed', false, false],
  ] as const)(
    '%s / %s resolves to %s',
    (bookingStatus, paymentStatus, label, canPay, canChat) => {
      expect(getBookingExperienceState(bookingStatus, paymentStatus)).toEqual(
        expect.objectContaining({ label, canPay, canChat }),
      );
    },
  );

  test('never enables payment before backend confirmation', () => {
    expect(getBookingExperienceState('pending', 'pending').canPay).toBe(false);
    expect(getBookingExperienceState('in_progress', 'pending').canPay).toBe(false);
  });
});
