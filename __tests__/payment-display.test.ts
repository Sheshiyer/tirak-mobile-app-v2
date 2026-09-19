import { toPaymentDisplay } from '@/utils/payment-display';

describe('server-owned booking payment copy', () => {
  test('missing payment facts do not invent a method or collection', () => {
    expect(toPaymentDisplay()).toEqual({
      method: 'Payment method not recorded',
      status: 'Payment details will be confirmed with your booking.',
      collectionNote: 'Tirak has not recorded a payment instruction for this booking.',
    });
  });

  test.each(['paid', 'succeeded', 'cash_collected'])('only recorded completion %s displays paid', (status) => {
    expect(toPaymentDisplay({ status }).status).toBe('Paid');
  });

  test.each(['pending', 'processing', 'failed', 'refunded', 'restitution_pending', 'restitution_failed', 'requires_action'])('%s never displays paid', (status) => {
    expect(toPaymentDisplay({ method: 'promptpay', status }).status).not.toBe('Paid');
  });

  test('cash selection alone never claims cash was collected', () => {
    expect(toPaymentDisplay({ method: 'cash' })).toEqual({
      method: 'Cash', status: 'Payment status pending',
      collectionNote: 'Payment is not marked complete until Tirak records a confirmed status.',
    });
  });
});
