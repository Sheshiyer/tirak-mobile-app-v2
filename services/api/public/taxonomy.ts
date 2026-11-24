import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiUrl } from '@/constants/api';
import { logger } from '@/utils/logger';
import { mockCategories, mockRegions } from '@/mocks/supplier-data';

/**
 * Guide signup taxonomy (service regions and categories).
 *
 * Source: GET /api/public/regions and GET /api/public/categories on the Worker.
 * The bundled lists remain as an offline/empty-table fallback so signup never
 * dead-ends; selections from either source resolve to human-readable labels
 * before the application is submitted.
 */

export type TaxonomyKind = 'regions' | 'categories';

export interface TaxonomyOption {
  id: string;
  name: string;
  icon?: string;
}

type LocalizedName = string | { en?: string | null; th?: string | null } | null | undefined;

interface RawTaxonomyItem {
  id?: string | number;
  name?: LocalizedName;
  name_en?: string | null;
  name_th?: string | null;
}

export const FALLBACK_TAXONOMY: Record<TaxonomyKind, TaxonomyOption[]> = {
  regions: mockRegions,
  categories: mockCategories,
};

const pickName = (item: RawTaxonomyItem, language: string): string => {
  const wantsThai = language.toLowerCase().startsWith('th');
  const { name } = item;
  if (typeof name === 'string') return name.trim();
  const en = (name && typeof name === 'object' ? name.en : item.name_en) || item.name_en || '';
  const th = (name && typeof name === 'object' ? name.th : item.name_th) || item.name_th || '';
  return String((wantsThai ? th || en : en || th) || '').trim();
};

/**
 * Accepts every shape the public route returns: the paginated envelope
 * (`{ success, data: { items } }`) on a cache miss and the raw cached object
 * (`{ regions | categories, pagination }`) on a KV cache hit.
 */
export const normalizeTaxonomyResponse = (
  body: unknown,
  kind: TaxonomyKind,
  language = 'en',
): TaxonomyOption[] => {
  const root = (body ?? {}) as Record<string, any>;
  const candidates = [root.data?.items, root.data?.[kind], Array.isArray(root.data) ? root.data : undefined, root[kind], root.items];
  const list = candidates.find(Array.isArray) as RawTaxonomyItem[] | undefined;
  if (!list) return [];
  const seen = new Set<string>();
  return list.reduce<TaxonomyOption[]>((acc, item) => {
    const id = item?.id === undefined || item?.id === null ? '' : String(item.id);
    const name = item ? pickName(item, language) : '';
    if (!id || !name || seen.has(id)) return acc;
    seen.add(id);
    acc.push({ id, name });
    return acc;
  }, []);
};

export const fetchPublicTaxonomy = async (kind: TaxonomyKind, language = 'en'): Promise<TaxonomyOption[]> => {
  const response = await axios.get(apiUrl(`/api/public/${kind}`), {
    params: { page: 1, limit: 100 },
    headers: { Accept: 'application/json' },
    timeout: 10000,
  });
  const options = normalizeTaxonomyResponse(response.data, kind, language);
  if (options.length === 0) logger.warn(`Public ${kind} list is empty; signup uses the bundled list`);
  return options;
};

/** Resolve selected ids to labels, preferring live options, then remembered labels, then the bundled list. */
export const resolveTaxonomyLabels = (
  ids: string[],
  kind: TaxonomyKind,
  options: TaxonomyOption[] = [],
  remembered: Record<string, string> = {},
): string[] =>
  ids.map((id) =>
    options.find((o) => o.id === id)?.name ||
    remembered[id] ||
    FALLBACK_TAXONOMY[kind].find((o) => o.id === id)?.name ||
    id,
  );

export const useSignupTaxonomy = (kind: TaxonomyKind) => {
  const { i18n } = useTranslation();
  const language = i18n?.language || 'en';
  const query = useQuery({
    queryKey: ['publicTaxonomy', kind, language],
    queryFn: () => fetchPublicTaxonomy(kind, language),
    staleTime: 30 * 60 * 1000,
    retry: 1,
  });

  const live = query.data ?? [];
  const isFallback = !query.isLoading && live.length === 0;
  return {
    // Empty while loading so a guide cannot pick a bundled id that the live list then replaces.
    options: query.isLoading ? [] : isFallback ? FALLBACK_TAXONOMY[kind] : live,
    isLoading: query.isLoading,
    isFallback,
  };
};
