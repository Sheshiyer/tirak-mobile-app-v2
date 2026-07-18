import { getBookingExperienceState } from '@/utils/booking-state';

describe('booking experience state gates', () => {
  test.each([
    ['pending', 'pending', 'requested', false, false],
    ['confirmed', 'pending', 'confirmed', true, true],
    ['confirmed', 'paid', 'paid', false, true],
    ['completed', 'paid', 'paid', false, false],
    ['cancelled', 'pending', 'cancelled', false, false],
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
