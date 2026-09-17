import {
  REVIEW_BOOKING_ID,
  reviewBookingToListItem,
  useReviewBookingFixtureStore,
} from '@/stores/review-booking-fixture-store';

describe('shared app review booking fixture', () => {
  const originalReviewMode = process.env.EXPO_PUBLIC_REVIEW_MODE;

  beforeEach(() => {
    process.env.EXPO_PUBLIC_REVIEW_MODE = 'true';
    useReviewBookingFixtureStore.getState().reset();
  });

  afterAll(() => {
    process.env.EXPO_PUBLIC_REVIEW_MODE = originalReviewMode;
  });

  test('customer creation is visible to the guide and guide acceptance is visible to the customer', () => {
    const customerCreated = useReviewBookingFixtureStore.getState().createAsCustomer();
    expect(customerCreated).toMatchObject({
      id: 'review_booking_bangkok_001',
      customerId: 'demo_customer_001',
      guideId: 'demo_companion_001',
      status: 'requested',
      payment: {
        method: 'cash',
        status: 'not_charged',
        authority: 'review_fixture',
        providerChargeId: null,
      },
    });

    const guideView = useReviewBookingFixtureStore.getState().getForAccount('guide');
    expect(guideView).toEqual(customerCreated);

    const guideAccepted = useReviewBookingFixtureStore.getState().acceptAsGuide();
    expect(guideAccepted).toMatchObject({
      status: 'accepted',
      acceptedAt: '2026-01-01T00:05:00.000Z',
    });

    const customerView = useReviewBookingFixtureStore.getState().getForAccount('customer');
    expect(customerView).toEqual(guideAccepted);
  });

  test('role transitions preserve review-fixture no-charge payment truth', () => {
    const requested = useReviewBookingFixtureStore.getState().createAsCustomer();
    const paymentTruth = requested.payment;

    useReviewBookingFixtureStore.getState().getForAccount('guide');
    const accepted = useReviewBookingFixtureStore.getState().acceptAsGuide();
    useReviewBookingFixtureStore.getState().getForAccount('customer');

    expect(accepted.payment).toBe(paymentTruth);
    expect(accepted.payment).toEqual({
      method: 'cash',
      status: 'not_charged',
      authority: 'review_fixture',
      providerChargeId: null,
    });
  });

  test('projects the shared fixture into the Bookings screen without inventing payment success', () => {
    const requested = useReviewBookingFixtureStore.getState().createAsCustomer({
      companionId: 'demo_companion_001',
      serviceId: 'review_experience_bangkok_001',
      date: '2099-11-20',
      startTime: '10:00',
      endTime: '13:00',
      duration: 180,
      location: 'Bangkok Old Town',
    });
    expect(reviewBookingToListItem(requested)).toMatchObject({
      id: REVIEW_BOOKING_ID,
      date: '2099-11-20',
      startTime: '10:00',
      status: 'pending',
      paymentStatus: 'pending',
      companion: { id: 'demo_companion_001' },
      customer: { id: 'demo_customer_001' },
    });

    const accepted = useReviewBookingFixtureStore.getState().acceptAsGuide();
    expect(reviewBookingToListItem(accepted)).toMatchObject({
      id: REVIEW_BOOKING_ID,
      status: 'confirmed',
      paymentStatus: 'pending',
    });
    expect(accepted.payment).toMatchObject({
      status: 'not_charged',
      authority: 'review_fixture',
      providerChargeId: null,
    });
  });

  test('fixture actions fail closed outside an exact review build', () => {
    process.env.EXPO_PUBLIC_REVIEW_MODE = 'TRUE';

    expect(() => useReviewBookingFixtureStore.getState().createAsCustomer()).toThrow(
      'Review booking fixtures are not enabled in this build',
    );
    expect(useReviewBookingFixtureStore.getState().booking).toBeNull();
  });
});
