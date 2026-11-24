import {
  FALLBACK_TAXONOMY,
  normalizeTaxonomyResponse,
  resolveTaxonomyLabels,
} from '@/services/api/public/taxonomy';
import { buildApplicationPayload } from '@/services/api/supplier/applications';
import type { SupplierSignupData } from '@/types/supplier';

describe('normalizeTaxonomyResponse', () => {
  const rows = [
    { id: 'r1', name: { en: 'Bangkok', th: 'กรุงเทพมหานคร' }, countryCode: 'TH', sortOrder: 1 },
    { id: 'r2', name: { en: 'Chiang Mai', th: null }, countryCode: 'TH', sortOrder: 2 },
    { id: 'r2', name: { en: 'Duplicate' } },
    { id: '', name: { en: 'No id' } },
  ];

  it('reads the paginated envelope returned on a cache miss', () => {
    const body = { success: true, data: { items: rows, pagination: {} } };
    expect(normalizeTaxonomyResponse(body, 'regions')).toEqual([
      { id: 'r1', name: 'Bangkok' },
      { id: 'r2', name: 'Chiang Mai' },
    ]);
  });

  it('reads the raw cached object returned on a KV cache hit', () => {
    const body = { regions: rows, pagination: {} };
    expect(normalizeTaxonomyResponse(body, 'regions', 'th')).toEqual([
      { id: 'r1', name: 'กรุงเทพมหานคร' },
      { id: 'r2', name: 'Chiang Mai' },
    ]);
  });

  it('returns an empty list for unexpected bodies', () => {
    expect(normalizeTaxonomyResponse(null, 'categories')).toEqual([]);
    expect(normalizeTaxonomyResponse({ success: false }, 'categories')).toEqual([]);
  });
});

describe('resolveTaxonomyLabels', () => {
  it('prefers live options, then remembered labels, then the bundled list', () => {
    const bundled = FALLBACK_TAXONOMY.categories[0];
    expect(
      resolveTaxonomyLabels(
        ['live', 'remembered', bundled.id, 'unknown'],
        'categories',
        [{ id: 'live', name: 'Food walks' }],
        { remembered: 'Temples' },
      ),
    ).toEqual(['Food walks', 'Temples', bundled.name, 'unknown']);
  });
});

describe('application payload categories', () => {
  it('sends category labels instead of selection ids', () => {
    const data = {
      step: 8,
      idVerification: { idCardFront: null, idCardBack: null, selfieWithId: null },
      photos: [],
      services: [],
      regions: ['r1'],
      languages: [],
      interests: [],
      availability: { weeklySchedule: {}, unavailableDates: [] },
      applicationReceipt: null,
      idempotencyKey: null,
      basicInfo: {
        firstName: 'Ann',
        lastName: 'Guide',
        displayName: 'Ann',
        phone: '+66800000000',
        email: 'ann@example.com',
        bio: 'Local guide',
      },
      categories: ['cat-uuid-1'],
    } as unknown as SupplierSignupData;
    const payload = buildApplicationPayload(data, ['Bangkok'], ['Street food']);
    expect(payload.categories).toEqual([{ name: 'Street food', memberCount: 1 }]);
  });
});
