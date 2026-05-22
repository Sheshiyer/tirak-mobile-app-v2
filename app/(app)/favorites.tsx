import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { RadialGradient } from '@/components/ui/RadialGradient';
import { Card } from '@/components/ui/Card';
import { CompanionCard } from '@/components/ui/CompanionCard';
import { designTokens } from '@/constants/design-tokens';
import { Heart, Search, Filter, Grid3X3, List } from 'lucide-react-native';
import { FavoriteCompanion, useFavoritesStore } from '@/stores/favorites-store';
import { useQueries } from '@tanstack/react-query';
import { fetchCompanionById } from '@/app/api/companion/companion';
import { useTranslation } from 'react-i18next';

export default function FavoritesScreen() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const favoriteIds = useFavoritesStore((s) => s.favorites);
  const favoriteCompanions = useFavoritesStore((s) => s.favoriteCompanions);
  const { t } = useTranslation();
  // Use useQueries to fetch all favorite companions by ID
  const favoriteQueries = useQueries({
    queries: favoriteIds.map((id) => ({
      queryKey: ['companion', id],
      queryFn: () => fetchCompanionById(id),
      enabled: !!id,
    })),
  });

  const isLoading = favoriteIds.length > 0 && favoriteQueries.some((q, index) => q.isLoading && !favoriteCompanions[favoriteIds[index]]);

  const normalizeFavorite = (favorite: FavoriteCompanion) => ({
    id: favorite.id,
    name: favorite.displayName || favorite.name || 'Local Guide',
    age: 0,
    location: favorite.location || 'Thailand',
    rating: favorite.rating || 0,
    reviews: favorite.reviewCount ?? favorite.reviews ?? 0,
    price: favorite.price || 0,
    image: favorite.profileImage || favorite.image || '',
    services: Array.isArray(favorite.services) ? favorite.services : [],
    languages: Array.isArray(favorite.languages) ? favorite.languages : [],
    verified: Boolean(favorite.verified),
    online: Boolean(favorite.online),
    category: favorite.category || favorite.categories?.[0] || 'general',
  });

  const favorites = favoriteIds
    .map((id, index) => {
      const apiCompanion = favoriteQueries[index]?.data?.data;
      const savedCompanion = favoriteCompanions[id];
      if (apiCompanion) {
        return normalizeFavorite({
          ...savedCompanion,
          ...apiCompanion,
          id: apiCompanion.id || id,
          name: apiCompanion.displayName || apiCompanion.name || savedCompanion?.name || 'Local Guide',
          image: apiCompanion.profileImage || savedCompanion?.image,
          profileImage: apiCompanion.profileImage || savedCompanion?.profileImage,
          reviews: Array.isArray(apiCompanion.reviews) ? apiCompanion.reviews.length : savedCompanion?.reviews,
          reviewCount: apiCompanion.reviewCount ?? savedCompanion?.reviewCount,
          services: apiCompanion.services?.map(service => service.name || 'Service') || savedCompanion?.services || [],
        });
      }

      return savedCompanion ? normalizeFavorite(savedCompanion) : null;
    })
    .filter((companion): companion is NonNullable<typeof companion> => Boolean(companion))
    .filter((companion) => {
      const query = searchQuery.trim().toLowerCase();
      if (!query) return true;
      return [companion.name, companion.location, companion.category, ...companion.services]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query));
    });
  
  const handleCompanionPress = (id: string) => {
    router.push(`/companion/${id}`);
  };
  
  const handleFavorite = (id: string) => {
    useFavoritesStore.getState().removeFavorite(id);
  };
  
  const handleMessage = (id: string) => {
    router.push(`/chat/${id}`);
  };
  
  const renderEmptyState = () => (
    <Card style={styles.emptyStateCard} padding={40}>
      <View style={styles.emptyStateIcon}>
        <Heart size={40} color={designTokens.colors.semantic.accent} />
      </View>
      <Text style={styles.emptyStateTitle}>{t('favorites.noFavorites')}</Text>
      <Text style={styles.emptyStateText}>
        {t('favorites.noFavoritesDescription')}
      </Text>
      <TouchableOpacity 
        style={styles.exploreButton}
        onPress={() => router.push('/search')}
      >
        <Text style={styles.exploreButtonText}>{t('favorites.exploreCompanions')}</Text>
      </TouchableOpacity>
    </Card>
  );
  
  if (isLoading) {
    return (
      <RadialGradient variant="appBackground" style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('favorites.favorites')}</Text>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={designTokens.colors.semantic.primary} />
          <Text>{t('favorites.loading')}</Text>
        </View>
      </RadialGradient>
    );
  }
  
  return (
    <RadialGradient variant="appBackground" style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('favorites.favorites')}</Text>
        
        <Card style={styles.searchCard} padding={0}>
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Search size={20} color={designTokens.colors.semantic.textSecondary} />
              <TextInput
                placeholder={t('favorites.searchFavorites')}
                placeholderTextColor={designTokens.colors.semantic.textSecondary}
                style={styles.searchPlaceholder}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            <TouchableOpacity style={styles.filterButton}>
              <Filter size={20} color={designTokens.colors.semantic.primary} />
            </TouchableOpacity>
          </View>
        </Card>
      </View>
      
      {favorites.length > 0 ? (
        <>
          <Card style={styles.resultsHeader} padding={16}>
            <View style={styles.resultsHeaderContent}>
              <Text style={styles.resultsCount}>
                  {favorites.length} {t('favorites.favorites')}
              </Text>
              <View style={styles.viewToggle}>
                <TouchableOpacity
                  style={[styles.viewButton, viewMode === 'grid' && styles.viewButtonActive]}
                  onPress={() => setViewMode('grid')}
                >
                  <Grid3X3 size={18} color={viewMode === 'grid' ? designTokens.colors.semantic.surface : designTokens.colors.semantic.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.viewButton, viewMode === 'list' && styles.viewButtonActive]}
                  onPress={() => setViewMode('list')}
                >
                  <List size={18} color={viewMode === 'list' ? designTokens.colors.semantic.surface : designTokens.colors.semantic.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>
          </Card>
          
          <FlatList
            data={favorites}
            renderItem={({ item }) =>
              item ? (
              <CompanionCard
                companion={item}
                viewMode={viewMode}
                onPress={() => handleCompanionPress(item.id)}
                onFavorite={() => handleFavorite(item.id)}
                onMessage={() => handleMessage(item.id)}
              />
              ) : null
            }
            keyExtractor={(item) => item?.id}
            numColumns={viewMode === 'grid' ? 2 : 1}
            key={viewMode} // Force re-render when view mode changes
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        </>
      ) : (
        renderEmptyState()
      )}
    </RadialGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    gap: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: designTokens.colors.semantic.text,
  },
  searchCard: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchPlaceholder: {
    color: designTokens.colors.semantic.textSecondary,
    marginLeft: 10,
    fontSize: 16,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(111, 76, 170, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultsHeader: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  resultsHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultsCount: {
    fontSize: 16,
    fontWeight: '600',
    color: designTokens.colors.semantic.text,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: designTokens.colors.semantic.border,
    borderRadius: 20,
    padding: 2,
  },
  viewButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
  },
  viewButtonActive: {
    backgroundColor: designTokens.colors.semantic.primary,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  emptyStateCard: {
    margin: 20,
    alignItems: 'center',
  },
  emptyStateIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 121, 121, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: designTokens.colors.semantic.text,
    marginBottom: 12,
  },
  emptyStateText: {
    fontSize: 16,
    color: designTokens.colors.semantic.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  exploreButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: designTokens.colors.semantic.primary,
    borderRadius: 25,
  },
  exploreButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: designTokens.colors.semantic.surface,
  },
});
