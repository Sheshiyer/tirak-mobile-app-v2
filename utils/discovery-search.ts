import type { CompanionSearchParams } from '@/services/api/companion/companion';
const categories = new Set(['all', 'travel', 'nightlife', 'cinema', 'holiday', 'wellness', 'explorer', 'private', 'events', 'sports']);
const languages = new Set(['th', 'en', 'zh', 'ja', 'ko', 'ru', 'de', 'fr']);
const scalar = (value: unknown) => typeof value === 'string' ? value : '';
export function readDiscoveryRoute(params: { category?: unknown; search?: unknown }) {
  const category = scalar(params.category);
  return { category: categories.has(category) ? category : 'all', search: scalar(params.search).trim().slice(0, 200) };
}
export function validateDiscoveryPrice(min: string, max: string): string | null {
  const valid = (value: string) => !value.trim() || (/^\d+(\.\d{1,2})?$/.test(value.trim()) && Number.isFinite(Number(value)));
  if (!valid(min) || !valid(max)) return 'Enter a valid price of zero or more (up to two decimal places).';
  if (min.trim() && max.trim() && Number(min) > Number(max)) return 'Maximum price must be at least the minimum price.';
  return null;
}
export function buildDiscoverySearch(state: { search: string; category: string; location: string; minPrice: string; maxPrice: string; languages: string[]; verified: boolean; sort: string }): CompanionSearchParams {
  const params: CompanionSearchParams = {};
  if (state.search.trim()) params.search = state.search.trim();
  if (categories.has(state.category) && state.category !== 'all') params.category = state.category;
  if (['Bangkok', 'Phuket', 'Chiang Mai', 'Pattaya'].includes(state.location)) params.location = state.location;
  if (!validateDiscoveryPrice(state.minPrice, state.maxPrice)) {
    if (state.minPrice.trim()) params.minPrice = Number(state.minPrice);
    if (state.maxPrice.trim()) params.maxPrice = Number(state.maxPrice);
  }
  const codes = [...new Set(state.languages.filter(language => languages.has(language)))];
  if (codes.length) params.languages = codes;
  if (state.verified) params.verified = true;
  const sorts: Record<string, Pick<CompanionSearchParams, 'sortBy' | 'sortOrder'>> = {
    price: { sortBy: 'price', sortOrder: 'asc' }, price_high: { sortBy: 'price', sortOrder: 'desc' },
    rating: { sortBy: 'rating', sortOrder: 'desc' }, reviews: { sortBy: 'reviews', sortOrder: 'desc' },
  };
  return { ...params, ...(sorts[state.sort] || { sortBy: 'rating', sortOrder: 'desc' }) };
}
