import React from 'react';
import { render } from '@testing-library/react-native';
let mockLocale = 'en';
jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('expo-image', () => ({ Image: () => null }));
jest.mock('expo-linear-gradient', () => ({ LinearGradient: ({ children }: any) => children }));
jest.mock('lucide-react-native', () => Object.fromEntries(['MapPin', 'Heart', 'MessageCircle', 'Star', 'Verified', 'Send', 'Camera'].map(key => [key, () => null])));
jest.mock('@/stores/favorites-store', () => ({ useFavoritesStore: (selector: any) => selector({ isFavorite: () => false }) }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string, params: any) => key === 'companionDetails.fromPrice' ? `${mockLocale === 'th' ? 'เริ่มต้น' : 'From'} ${params.price}` : key }) }));
import { FeaturedCompanionsSection } from '@/components/home/FeaturedCompanionsSection';
const guide = { id: 'real-guide', name: 'Local Guide', age: 0, location: 'Bangkok', rating: 0, reviews: 0, price: 1, image: '', services: ['Local experiences'], languages: ['en'], verified: true, online: false, category: 'travel' };
it.each(['en', 'th'])('home featured guide shows the localized minimum experience amount, never a daily rate (%s)', locale => {
  mockLocale = locale;
  const screen = render(<FeaturedCompanionsSection companions={[guide]} onSeeAll={jest.fn()} />);
  expect(screen.getByText(`${locale === 'th' ? 'เริ่มต้น' : 'From'} ฿1`)).toBeTruthy();
  expect(screen.queryByText(/\/day|\/hour|ต่อวัน|ต่อชั่วโมง/)).toBeNull();
});
it('keeps an unknown guide price as a request rather than inventing a minimum amount', () => {
  const screen = render(<FeaturedCompanionsSection companions={[{ ...guide, price: 0 }]} onSeeAll={jest.fn()} />);
  expect(screen.getByText('Request guide rate')).toBeTruthy();
  expect(screen.queryByText(/฿0/)).toBeNull();
});
