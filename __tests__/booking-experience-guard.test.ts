import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(__dirname, '..');
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');

describe('experience-first traveler surfaces', () => {
  test('does not expose the Private category or its translation keys', () => {
    const sources = [
      'app/(app)/index.tsx',
      'app/(app)/search.tsx',
      'components/home/CategorySection.tsx',
      'constants/home-categories.ts',
      'locales/en.json',
      'locales/th.json',
    ].map(read).join('\n');

    expect(sources).not.toMatch(/\bprivate\b/i);
  });

  test('uses itinerary pricing and removes cash-to-guide and date-themed copy', () => {
    const sources = [
      'app/(app)/booking/[id].tsx',
      'app/(app)/bookings.tsx',
      'app/booking/confirmation.tsx',
      'app/experiences/[id].tsx',
      'components/booking/steps/BookingSummaryStep.tsx',
      'components/booking/steps/BookingConfirmationStep.tsx',
      'components/home/FeaturedCompanionsSection.tsx',
      'components/ui/CompanionCard.tsx',
      'mocks/bookings.ts',
      'mocks/payments.ts',
      'locales/en.json',
    ].map(read).join('\n');

    expect(sources).not.toMatch(/cash\s+(?:directly\s+)?to\s+(?:your\s+|the\s+)?guide/i);
    expect(sources).not.toMatch(/pay(?:ment)?\s+(?:is\s+)?handled\s+in\s+cash/i);
    expect(sources).not.toMatch(/Evening Dinner Date/i);
    expect(sources).not.toMatch(/\/day\b|per\s+(?:hour|person)\b/i);
  });

  test('traveler booking source and mock data expose PromptPay only', () => {
    const sources = [
      'components/booking/steps/PaymentSelectionStep.tsx',
      'stores/booking-store.ts',
      'mocks/bookings.ts',
      'mocks/payments.ts',
    ].map(read).join('\n');

    expect(sources).not.toMatch(/['"]cash['"]|Cash Payment|cash directly/i);
    expect(sources).not.toMatch(/['"]card['"]|bank_transfer|Credit Card/i);
    expect(sources).toContain('promptpay');
  });

  test('guide onboarding contains no fake or external digital-subscription checkout', () => {
    const sources = [
      'app/supplier/signup/index.tsx',
      'app/supplier/signup/payment.tsx',
      'stores/supplier-store.ts',
      'types/supplier.ts',
    ].map(read).join('\n');

    expect(sources).not.toMatch(/Subscription Payment|Complete Payment|paymentComplete/i);
    expect(sources).not.toMatch(/credit_card|bank_transfer|\/month/i);
    expect(sources).toContain('Submit Guide Application');
  });

  test('does not expose a pre-booking chat CTA from discovery or profiles', () => {
    const sources = [
      'app/(app)/search.tsx',
      'app/experiences/[id].tsx',
      'components/home/FeaturedCompanionsSection.tsx',
      'components/ui/CompanionCard.tsx',
    ].map(read).join('\n');

    expect(sources).not.toMatch(/router\.push\(`\/chat\/\$\{companion/i);
    expect(sources).not.toMatch(/chatNow|Request guide rate/i);
  });

  test('booking WebSocket uses authenticated headers and the backend event contract', () => {
    const chat = read('app/chat/[id].tsx');

    expect(chat).toContain('Authorization: `Bearer ${token}`');
    expect(chat).not.toContain('token=${encodeURIComponent(token)}');
    expect(chat).toContain('bookingMessageFromSocketEvent');
    expect(chat).not.toContain("data.type === 'new_message'");
  });

  test('shared empty states direct travelers to experiences rather than people', () => {
    const emptyStates = read('components/ui/EmptyState.tsx');

    expect(emptyStates).not.toMatch(/find companions|browse companions|book a companion/i);
    expect(emptyStates).toContain('guided experiences');
    expect(emptyStates).toContain('confirmed booking');
  });

  test('review and guide-demo surfaces use guide and booking language', () => {
    const sources = [
      'app/supplier/signup/regions.tsx',
      'app/supplier/profile/edit.tsx',
      'services/api/companion/profile.ts',
      'services/api/companion/stats.ts',
      'services/api/booking/booking.ts',
      'mocks/notifications.ts',
      'mocks/supplier-data.ts',
    ].map(read).join('\n');

    expect(sources).not.toMatch(/find companions|Test Companion|Unknown Companion/i);
    expect(sources).not.toMatch(/title:\s*['"]New Message['"]/i);
  });

  test('wizard submits a request before any payment or confirmed-only CTA', () => {
    const wizard = read('components/booking/BookingWizard.tsx');
    const summary = read('components/booking/steps/BookingSummaryStep.tsx');
    const confirmation = read('components/booking/steps/BookingConfirmationStep.tsx');
    const detail = read('app/(app)/booking/[id].tsx');

    expect(wizard).not.toContain('PaymentSelectionStep');
    expect(summary).toContain('setSubmittedBooking(result.data.booking)');
    expect(summary).toContain('Send booking request');
    expect(confirmation).toContain('requested, not confirmed or paid');
    expect(detail).toContain('experienceState.canPay');
    expect(detail).toContain('experienceState.canChat');
  });

  test('discovery sells a named itinerary before the guide identity', () => {
    const featured = read('components/home/FeaturedCompanionsSection.tsx');
    const card = read('components/ui/CompanionCard.tsx');
    const favorites = read('app/(app)/favorites.tsx');
    const search = read('app/(app)/search.tsx');
    const profile = read('app/experiences/[id].tsx');
    const english = read('locales/en.json');

    expect(featured).toContain('companion.services[0]');
    expect(featured).toContain('Led by');
    expect(card).toContain('companion.services[0]');
    expect(card).toContain('Led by');
    expect(english).toContain('Featured Guided Experiences');
    expect(featured).toContain('experienceIndex=0');
    expect(search).toContain('experienceIndex=0');
    expect(favorites).toContain('experienceIndex=0');
    expect(profile).not.toContain('const defaultService = companion.experiences[0]');
    expect(profile).toContain('companion.experiences[selectedExperienceIndex]');
    expect(profile).toContain('selectedExperienceIndex !== null');
  });

  test('traveler discovery uses itinerary dates instead of online presence', () => {
    const discovery = [
      'app/(app)/search.tsx',
      'components/home/FeaturedCompanionsSection.tsx',
      'components/ui/CompanionCard.tsx',
    ].map(read).join('\n');
    const english = read('locales/en.json');
    const thai = read('locales/th.json');

    expect(discovery).not.toMatch(/onlineOnly|onlineIndicator|onlineNow/);
    expect(english).not.toContain('"onlineNow"');
    expect(thai).not.toContain('"onlineNow"');
  });

  test('discovery artwork centers the activity, with guide imagery only as a credential', () => {
    const featured = read('components/home/FeaturedCompanionsSection.tsx');
    const card = read('components/ui/CompanionCard.tsx');

    expect(featured).not.toContain('style={styles.companionImage}');
    expect(card).not.toContain('style={styles.gridImage}');
    expect(featured).toContain('guideAvatar');
    expect(card).toContain('guideAvatar');
  });

  test('Thai traveler copy describes guided experiences and booking-scoped chat', () => {
    const thai = read('locales/th.json');

    expect(thai).not.toMatch(/คู่หู|ผู้ร่วมเดินทาง|เพื่อนร่วมทาง/);
    expect(thai).toContain('ประสบการณ์พร้อมไกด์');
    expect(thai).toContain('ไกด์ท้องถิ่น');
    expect(thai).toContain('แผนการเดินทาง');
    expect(thai).toMatch(/แชท[^\n]*(?:ยืนยัน|การจอง)/);
  });

  test('legal copy states platform support without blanket liability disclaimers', () => {
    const legal = read('app/(app)/legal.tsx');

    expect(legal).not.toMatch(/not responsible for payment disputes/i);
    expect(legal).not.toMatch(/not liable for the actions/i);
    expect(legal).toMatch(/contact Tirak support/i);
  });
});
