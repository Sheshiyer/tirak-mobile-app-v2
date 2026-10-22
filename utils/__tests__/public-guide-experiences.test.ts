import { normalizePublicGuideExperiences, publicExperienceToBookingService } from '../public-guide-experiences';
const service = { id: '980f9159-3fe5-43b3-9311-47ff1a52e273', name: 'Bangkok test walk', description: 'Internal flow test', price: 1, duration: '0.5 hours', category: 'Travel' };
it('maps real Core services into displayed and booked half-hour experiences', () => {
  const items = normalizePublicGuideExperiences({ services: [service] });
  expect(items).toEqual([{ ...service, title: service.name, duration: undefined, durationMinutes: 30, currency: 'THB' }].map(({ duration, ...item }) => item));
  expect(publicExperienceToBookingService(items[0])).toEqual({ id: service.id, name: service.name, description: service.description, price: 1, currency: 'THB', duration: 0.5, category: 'Travel' });
});
it('preserves experience shape, currency and duration without duplicating services', () => {
  const item = { id: 'real', title: 'Museum', description: '', price: 20, durationMinutes: 90, currency: 'USD', category: 'Art' };
  expect(normalizePublicGuideExperiences({ experiences: [item], services: [service] })).toEqual([{ ...item, name: 'Museum' }]);
});
it('does not fabricate services or durations from malformed records', () => {
  expect(normalizePublicGuideExperiences({ services: [{ ...service, duration: 'unknown' }, { ...service, price: NaN }, { ...service, id: '' }, { ...service, name: '' }] })).toEqual([]);
  expect(normalizePublicGuideExperiences({})).toEqual([]);
});
it('uses real services when the experiences field is empty', () => {
  expect(normalizePublicGuideExperiences({ experiences: [], services: [service] })[0].durationMinutes).toBe(30);
});
