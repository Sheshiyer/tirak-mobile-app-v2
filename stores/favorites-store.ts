import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';

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
  favorites: string[];
  favoriteCompanions: Record<string, FavoriteCompanion>;
  addFavorite: (id: string, companion?: FavoriteCompanion) => void;
  removeFavorite: (id: string) => void;
  toggleFavorite: (companion: FavoriteCompanion) => void;
  upsertFavoriteCompanion: (companion: FavoriteCompanion) => void;
  isFavorite: (id: string) => boolean;
}

// SecureStore adapter for Zustand
const zustandSecureStorage = {
  getItem: async (name: string) => {
    const value = await SecureStore.getItemAsync(name);
    return value ? JSON.parse(value) : null;
  },
  setItem: async (name: string, value: any) => {
    await SecureStore.setItemAsync(name, JSON.stringify(value));
  },
  removeItem: async (name: string) => {
    await SecureStore.deleteItemAsync(name);
  },
};

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],
      favoriteCompanions: {},
      addFavorite: (id, companion) =>
        set((state) => ({
          favorites: state.favorites.includes(id)
            ? state.favorites
            : [...state.favorites, id],
          favoriteCompanions: companion
            ? {
                ...state.favoriteCompanions,
                [id]: {
                  ...(state.favoriteCompanions[id] || {}),
                  ...companion,
                  id,
                },
              }
            : state.favoriteCompanions,
        })),
      removeFavorite: (id) =>
        set((state) => {
          const nextCompanions = { ...state.favoriteCompanions };
          delete nextCompanions[id];
          return {
            favorites: state.favorites.filter((favId) => favId !== id),
            favoriteCompanions: nextCompanions,
          };
        }),
      toggleFavorite: (companion) => {
        if (get().isFavorite(companion.id)) {
          get().removeFavorite(companion.id);
        } else {
          get().addFavorite(companion.id, companion);
        }
      },
      upsertFavoriteCompanion: (companion) =>
        set((state) => ({
          favoriteCompanions: {
            ...state.favoriteCompanions,
            [companion.id]: {
              ...(state.favoriteCompanions[companion.id] || {}),
              ...companion,
            },
          },
        })),
      isFavorite: (id) => get().favorites.includes(id),
    }),
    {
      name: 'favorites-storage',
      storage: zustandSecureStorage,
    }
  )
); 
