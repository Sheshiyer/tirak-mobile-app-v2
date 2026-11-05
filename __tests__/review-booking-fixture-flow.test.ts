import { useReviewBookingFixtureStore } from '@/stores/review-booking-fixture-store';

describe('production refuses local review bookings', () => {
  const original = process.env.EXPO_PUBLIC_REVIEW_MODE;
  afterEach(() => {
    if (original === undefined) delete process.env.EXPO_PUBLIC_REVIEW_MODE;
    else process.env.EXPO_PUBLIC_REVIEW_MODE = original;
    useReviewBookingFixtureStore.getState().reset();
  });
  test.each(['true', 'TRUE', 'false', undefined])('refuses every fixture operation for legacy flag %p', flag => {
    if (flag === undefined) delete process.env.EXPO_PUBLIC_REVIEW_MODE;
    else process.env.EXPO_PUBLIC_REVIEW_MODE = flag;
    const store = useReviewBookingFixtureStore.getState();
    expect(() => store.createAsCustomer()).toThrow('Review booking fixtures are not enabled');
    expect(() => store.acceptAsGuide()).toThrow('Review booking fixtures are not enabled');
    expect(() => store.getForAccount('customer')).toThrow('Review booking fixtures are not enabled');
    expect(() => store.getForAccount('guide')).toThrow('Review booking fixtures are not enabled');
    expect(useReviewBookingFixtureStore.getState().booking).toBeNull();
  });
});
