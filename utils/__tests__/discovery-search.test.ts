import { buildDiscoverySearch, readDiscoveryRoute, validateDiscoveryPrice } from '../discovery-search';
const defaults = { search: '', category: 'all', location: 'All Locations', minPrice: '', maxPrice: '', languages: [], verified: false, sort: 'relevance' };
it('keeps default discovery unbounded by prices or invented availability', () => {
  expect(buildDiscoverySearch(defaults)).toEqual({ sortBy: 'rating', sortOrder: 'desc' });
});
it('accepts valid home links and discards malformed route parameters', () => {
  expect(readDiscoveryRoute({ category: 'travel', search: ' Bangkok ' })).toEqual({ category: 'travel', search: 'Bangkok' });
  expect(readDiscoveryRoute({ category: ['travel'], search: ['bad'] })).toEqual({ category: 'all', search: '' });
});
it('constructs supported filters using stable language codes and optional bounds', () => {
  expect(buildDiscoverySearch({ ...defaults, search: ' Sue ', category: 'travel', location: 'Bangkok', maxPrice: '900', languages: ['en', 'thai', 'en', 'th'], verified: true, sort: 'price_high' })).toEqual({ search: 'Sue', category: 'travel', location: 'Bangkok', maxPrice: 900, languages: ['en', 'th'], verified: true, sortBy: 'price', sortOrder: 'desc' });
});
it('validates incorrect and inverted price bounds without sending them', () => {
  for (const [min, max] of [['-1', ''], ['abc', ''], ['100', '50'], ['1.333', '']]) {
    expect(validateDiscoveryPrice(min, max)).toBeTruthy();
    expect(buildDiscoverySearch({ ...defaults, minPrice: min, maxPrice: max })).not.toHaveProperty('minPrice');
  }
  expect(validateDiscoveryPrice('0', '20.50')).toBeNull();
});
it('does not submit unsupported distance or newest sorting', () => {
  expect(buildDiscoverySearch({ ...defaults, sort: 'distance' }).sortBy).toBe('rating');
  expect(buildDiscoverySearch({ ...defaults, sort: 'newest' }).sortBy).toBe('rating');
});
