import React from 'react';
import { render } from '@testing-library/react-native';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import en from '@/locales/en.json';
import th from '@/locales/th.json';
let mockLocale: 'en' | 'th' = 'en';
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string, options: { price: string }) => {
  const resource = require(mockLocale === 'th' ? '../locales/th.json' : '../locales/en.json');
  return resource.companionDetails.fromPrice.replace('{{price}}', options.price);
} }) }));
import { GuideStartingPrice } from '@/components/ui/GuideStartingPrice';

it.each(['en', 'th'] as const)('renders localized minimum experience pricing without an invented daily rate (%s)', locale => {
  mockLocale = locale;
  const screen = render(<GuideStartingPrice amount="฿1" />);
  expect(screen.getByText((locale === 'th' ? th : en).companionDetails.fromPrice.replace('{{price}}', '฿1'))).toBeTruthy();
  expect(screen.queryByText(/\/day|\/hour|ต่อวัน|ต่อชั่วโมง/)).toBeNull();
});
it('uses the same minimum price contract for guide header and both card variants', () => {
  const detail = readFileSync(join(__dirname, '../app/companion/[id].tsx'), 'utf8');
  const card = readFileSync(join(__dirname, '../components/ui/CompanionCard.tsx'), 'utf8');
  expect((detail.match(/<GuideStartingPrice /g) || []).length).toBe(1);
  expect((card.match(/<GuideStartingPrice /g) || []).length).toBe(2);
  expect(detail).not.toContain("/{t('companionDetails.day')}");
  expect(card).not.toContain("/{t('companionDetails.day')}");
});
