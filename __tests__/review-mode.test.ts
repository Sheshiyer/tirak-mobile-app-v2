import {
  getReviewAccount,
  isReviewAccountUser,
  isReviewModeEnabled,
  REVIEW_ACCOUNT_LIST,
} from '@/constants/review-mode';

describe('app review mode contract', () => {
  test('stays disabled even with the former opt-in flag', () => {
    expect(isReviewModeEnabled('true')).toBe(false);
  });

  test('publishes deterministic password-free customer and guide identities', () => {
    expect(REVIEW_ACCOUNT_LIST.map(({ key, user }) => ({
      key,
      id: user.id,
      role: user.userType,
      createdAt: user.createdAt,
    }))).toEqual([
      {
        key: 'customer',
        id: 'demo_customer_001',
        role: 'customer',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      {
        key: 'guide',
        id: 'demo_companion_001',
        role: 'companion',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ]);

    expect(isReviewAccountUser(getReviewAccount('customer').user)).toBe(true);
    expect(isReviewAccountUser({ id: 'real-user' })).toBe(false);
  });
});
