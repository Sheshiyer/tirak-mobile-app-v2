import { create } from 'zustand';
import { secureStorage } from '@/utils/secure-storage';

export interface FavoriteCompanion {
  id: string;
  name: string;
  displayName?: string;
  profileImage?: string;
  image?: string;
  location?: string;
  rating?: number;
  reviewCount?: number;
  reviews?: number;
  price?: number;
  services?: string[];
  languages?: string[];
  verified?: boolean;
  online?: boolean;
  category?: string;
  categories?: string[];
}

export interface FavoritesState {
  ownerId: string | null;
  isHydrated: boolean;
  bindOwner: (ownerId: string | null) => Promise<void>;
  favorites: string[];
  favoriteCompanions: Record<string, FavoriteCompanion>;
  addFavorite: (id: string, companion?: FavoriteCompanion) => void;
  removeFavorite: (id: string) => void;
  toggleFavorite: (companion: FavoriteCompanion) => void;
  upsertFavoriteCompanion: (companion: FavoriteCompanion) => void;
  isFavorite: (id: string) => boolean;
}

// Favorites are device-local, separated by signed-in account. Never import
// legacy unowned favorites because their account ownership cannot be proven.
// Hex keeps every owner distinct and uses SecureStore-safe key characters.
const storageKey = (owner: string) => `tirak-favorites-${owner.split('').map(char => char.charCodeAt(0).toString(16).padStart(4, '0')).join('')}`;
let ownerGeneration = 0;

export const useFavoritesStore = create<FavoritesState>()((set, get) => {
  const persistCurrent = () => {
    const { ownerId, favorites, favoriteCompanions } = get();
    if (ownerId) void secureStorage.setItemAsync(storageKey(ownerId), JSON.stringify({ favorites, favoriteCompanions }));
  };
  return {
    ownerId: null,
    isHydrated: false,
    favorites: [],
    favoriteCompanions: {},
    bindOwner: async ownerId => {
      if (get().ownerId === ownerId && get().isHydrated) return;
      const generation = ++ownerGeneration;
      set({ ownerId, favorites: [], favoriteCompanions: {}, isHydrated: !ownerId });
      if (!ownerId) return;
      try {
        const serialized = await secureStorage.getItemAsync(storageKey(ownerId));
        if (generation !== ownerGeneration) return;
        const stored = serialized ? JSON.parse(serialized) : null;
        const favorites: string[] = Array.isArray(stored?.favorites)
          ? stored.favorites.filter((id: unknown): id is string => typeof id === 'string') : [];
        const companions = stored?.favoriteCompanions && typeof stored.favoriteCompanions === 'object' ? stored.favoriteCompanions : {};
        const favoriteCompanions: Record<string, FavoriteCompanion> = {};
        for (const id of favorites) {
          if (companions[id]?.id === id) favoriteCompanions[id] = companions[id];
        }
        set({ favorites, favoriteCompanions, isHydrated: true });
      } catch {
        if (generation === ownerGeneration) set({ favorites: [], favoriteCompanions: {}, isHydrated: true });
      }
    },
    addFavorite: (id, companion) => {
      if (!get().ownerId || !get().isHydrated) return;
      set(state => ({
        favorites: state.favorites.includes(id) ? state.favorites : [...state.favorites, id],
        favoriteCompanions: companion ? { ...state.favoriteCompanions, [id]: { ...companion, id } } : state.favoriteCompanions,
      }));
      persistCurrent();
    },
    removeFavorite: id => {
      if (!get().ownerId || !get().isHydrated) return;
      set(state => {
        const favoriteCompanions = { ...state.favoriteCompanions };
        delete favoriteCompanions[id];
        return { favorites: state.favorites.filter(value => value !== id), favoriteCompanions };
      });
      persistCurrent();
    },
    toggleFavorite: companion => {
      if (get().isFavorite(companion.id)) get().removeFavorite(companion.id);
      else get().addFavorite(companion.id, companion);
    },
    upsertFavoriteCompanion: companion => {
      if (!get().ownerId || !get().isHydrated || !get().favorites.includes(companion.id)) return;
      set(state => ({ favoriteCompanions: { ...state.favoriteCompanions, [companion.id]: { ...state.favoriteCompanions[companion.id], ...companion } } }));
      persistCurrent();
    },
    isFavorite: id => get().favorites.includes(id),
  };
});
