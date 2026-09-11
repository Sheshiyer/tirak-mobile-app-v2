import {
  formatBookingDate,
  formatBookingTime,
  formatBookingTotal,
  normalizeBookingLocale,
} from '@/components/booking/booking-format';

describe('booking locale formatting', () => {
  test.each([
    ['en-US', 'en-US'],
    ['th', 'th-TH'],
    ['th-TH', 'th-TH'],
    [undefined, 'en-US'],
  ] as const)('normalizes %s to %s', (language, expected) => {
    expect(normalizeBookingLocale(language)).toBe(expected);
  });

  test('formats THB totals using the active Thai locale', () => {
    expect(formatBookingTotal(1800, 'th')).toContain('1,800');
    expect(formatBookingTotal(1800, 'th')).toContain('฿');
  });

  test('formats booking dates and times using Thai locale conventions', () => {
    expect(formatBookingDate('2026-09-02', 'th')).toMatch(/กันยายน|ก.ย./);
    expect(formatBookingTime('10:30', 'th')).toMatch(/10:30/);
  });
});
