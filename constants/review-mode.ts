import type { User } from '@/types/auth';

export type ReviewAccountKey = 'customer' | 'guide';

export interface ReviewAccount {
  key: ReviewAccountKey;
  label: string;
  description: string;
  user: User;
}

const FIXTURE_CREATED_AT = '2026-01-01T00:00:00.000Z';

export const REVIEW_ACCOUNTS: Readonly<Record<ReviewAccountKey, ReviewAccount>> = {
  customer: {
    key: 'customer',
    label: 'Traveler review account',
    description: 'Browse guides and walk through a cash booking without a real payment.',
    user: {
      id: 'demo_customer_001',
      name: 'Alex Johnson',
      email: 'review.customer@tirak.app',
      userType: 'customer',
      verified: true,
      bio: 'Travel enthusiast exploring Thailand through local cultural experiences.',
      location: 'Bangkok, Thailand',
      createdAt: FIXTURE_CREATED_AT,
    },
  },
  guide: {
    key: 'guide',
    label: 'Guide review account',
    description: 'Review the guide profile, bookings, messages, and provider-facing screens.',
    user: {
      id: 'demo_companion_001',
      name: 'Siriporn Nakamura',
      email: 'review.guide@tirak.app',
      userType: 'companion',
      verified: true,
      bio: 'Experienced local guide sharing Thai culture with visitors from around the world.',
      location: 'Bangkok, Thailand',
      createdAt: FIXTURE_CREATED_AT,
    },
  },
};

export const REVIEW_ACCOUNT_LIST: readonly ReviewAccount[] = [
  REVIEW_ACCOUNTS.customer,
  REVIEW_ACCOUNTS.guide,
];

/** Exact, build-time opt-in. Mixed case and truthy-looking values stay disabled. */
export function isReviewModeEnabled(
  flag: string | undefined = process.env.EXPO_PUBLIC_REVIEW_MODE,
): boolean {
  return flag === 'true';
}

export function getReviewAccount(key: ReviewAccountKey): ReviewAccount {
  return REVIEW_ACCOUNTS[key];
}

export function isReviewAccountUser(user: Pick<User, 'id'> | null | undefined): boolean {
  return REVIEW_ACCOUNT_LIST.some((account) => account.user.id === user?.id);
}
