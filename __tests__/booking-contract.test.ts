import {
  assertCompleteBookingRequest,
  normalizeBookingPaymentStatus,
} from '@/utils/booking-contract';

describe('booking API boundary', () => {
  test('maps backend completed payment state to the mobile paid state', () => {
    expect(normalizeBookingPaymentStatus('completed')).toBe('paid');
    expect(normalizeBookingPaymentStatus('successful')).toBe('paid');
    expect(normalizeBookingPaymentStatus('processing')).toBe('processing');
    expect(normalizeBookingPaymentStatus('refunded')).toBe('restitution_pending');
    expect(normalizeBookingPaymentStatus('restituted')).toBe('restituted');
  });

  test('requires a concrete experience identifier before submission or demo fallback', () => {
    expect(() => assertCompleteBookingRequest({
      companionId: 'guide-id',
      date: '2026-08-10',
      startTime: '09:00',
      duration: 120,
    })).toThrow('A guided experience is required');

    expect(() => assertCompleteBookingRequest({
      companionId: 'guide-id',
      serviceId: 'experience-id',
      date: '2026-08-10',
      startTime: '09:00',
      duration: 120,
    })).not.toThrow();
  });
});
