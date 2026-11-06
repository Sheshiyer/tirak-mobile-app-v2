import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { RadialGradient } from '@/components/ui/RadialGradient';
import { Card } from '@/components/ui/Card';
import { CompanionCard } from '@/components/ui/CompanionCard';
import { designTokens } from '@/constants/design-tokens';
import { Heart, Search, Filter, Grid3X3, List } from 'lucide-react-native';
import { FavoriteCompanion, useFavoritesStore } from '@/stores/favorites-store';
import { useQueries } from '@tanstack/react-query';
import { fetchCompanionById } from '@/services/api/companion/companion';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/auth-store';
import { isDemoModeEnabled } from '@/utils/demo-mode';
import { isDemoCompanion } from '@/utils/companion-display';
import { validateDiscoveryPrice } from '@/utils/discovery-search';

export default function FavoritesScreen() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { width: viewportWidth } = useWindowDimensions();
  const [parentWidth, setParentWidth] = useState<number | null>(null);
  const availableWidth = Math.min(viewportWidth, parentWidth || viewportWidth, 1170);
  const columns = viewMode === 'list' ? 1 : availableWidth >= 900 ? 3 : availableWidth >= 600 ? 2 : 1;
  const cardWidth = Math.max(1, Math.min(viewMode === 'grid' ? 360 : 720, (availableWidth - 40 - (columns - 1) * 12) / columns));
  const measureParent = (event: { nativeEvent: { layout: { width: number } } }) => {
    const measured = event.nativeEvent.layout.width;
    if (measured > 0) setParentWidth(measured);
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [priceFilter, setPriceFilter] = useState({ min: '', max: '' });
  const [draftMin, setDraftMin] = useState('');
  const [draftMax, setDraftMax] = useState('');
  const priceError = validateDiscoveryPrice(draftMin, draftMax);
  const hasPriceFilter = !!priceFilter.min.trim() || !!priceFilter.max.trim();
  const resetPrices = () => { setDraftMin(''); setDraftMax(''); setPriceFilter({ min: '', max: '' }); };
  const clearSearchAndFilters = () => { setSearchQuery(''); resetPrices(); };
  const favoriteIds = useFavoritesStore((s) => s.favorites);
  const favoriteCompanions = useFavoritesStore((s) => s.favoriteCompanions);
  const { t } = useTranslation();
  const user = useAuthStore(state => state.user);
  const demoEnabled = isDemoModeEnabled(user);
  // Use useQueries to fetch all favorite companions by ID
  const favoriteQueries = useQueries({
    queries: favoriteIds.map((id) => ({
      queryKey: ['companion', id, user?.id || 'public', demoEnabled],
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

  const savedFavorites = favoriteIds
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
    .filter(companion => demoEnabled || !isDemoCompanion(companion));
  const favorites = savedFavorites.filter((companion) => {
      const query = searchQuery.trim().toLowerCase();
      if (hasPriceFilter) {
        if (!Number.isFinite(companion.price) || companion.price <= 0) return false;
        if (priceFilter.min.trim() && companion.price < Number(priceFilter.min)) return false;
        if (priceFilter.max.trim() && companion.price > Number(priceFilter.max)) return false;
      }
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
  
  const hasSearchNoMatch = savedFavorites.length > 0 && (searchQuery.trim() !== '' || hasPriceFilter) && favorites.length === 0;
  const clearLabel = hasPriceFilter ? 'Clear filters' : t('search.clearSearch');

  const renderEmptyState = () => (
    <Card style={styles.emptyStateCard} padding={40}>
      <View style={styles.emptyStateIcon}>
        <Heart size={40} color={designTokens.colors.semantic.accent} />
      </View>
      <Text style={styles.emptyStateTitle}>{hasSearchNoMatch ? searchQuery.trim() ? `${t('search.noResultsFor')} “${searchQuery.trim()}”` : 'No saved guides match these prices' : t('favorites.noFavorites')}</Text>
      <Text style={styles.emptyStateText}>
        {hasSearchNoMatch ? t('search.noCompanionsFound') : t('favorites.noFavoritesDescription')}
      </Text>
      <TouchableOpacity 
        style={styles.exploreButton}
        accessibilityRole="button"
        accessibilityLabel={hasSearchNoMatch ? clearLabel : t('favorites.exploreCompanions')}
        onPress={() => hasSearchNoMatch ? clearSearchAndFilters() : router.push('/search')}
      >
        <Text style={styles.exploreButtonText}>{hasSearchNoMatch ? clearLabel : t('favorites.exploreCompanions')}</Text>
      </TouchableOpacity>
    </Card>
  );
  
  if (isLoading) {
    return (
      <RadialGradient variant="appBackground" style={styles.container}>
        <View style={styles.header} onLayout={measureParent}>
          <Text style={styles.headerTitle}>{t('favorites.favorites')}</Text>
        <Text style={{ color: designTokens.colors.semantic.textSecondary, marginTop: 8 }}>{t('favorites.deviceOnly')}</Text>
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
      <View style={styles.header} onLayout={measureParent}>
        <Text style={styles.headerTitle}>{t('favorites.favorites')}</Text>
        <Text style={{ color: designTokens.colors.semantic.textSecondary, marginTop: 8 }}>{t('favorites.deviceOnly')}</Text>
        
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
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Filter saved guides" accessibilityState={{ expanded: showFilters, selected: hasPriceFilter }} style={styles.filterButton} onPress={() => { if (!showFilters) { setDraftMin(priceFilter.min); setDraftMax(priceFilter.max); } setShowFilters(!showFilters); }}>
              <Filter size={20} color={designTokens.colors.semantic.primary} />
            </TouchableOpacity>
          </View>
        </Card>
        {showFilters && (
          <Card style={styles.filterPanel} padding={16}>
            <Text accessibilityRole="header" style={styles.resultsCount}>Starting experience price (THB)</Text>
            <Text style={styles.filterDescription}>Filter saved starting prices. Guides without a price are excluded when a price bound is set.</Text>
            <View style={styles.priceFields}>
              <View style={styles.priceField}><Text>Minimum (฿)</Text><TextInput accessibilityLabel="Minimum saved guide price" keyboardType="numeric" value={draftMin} onChangeText={setDraftMin} placeholder="No minimum" style={styles.priceInput} /></View>
              <View style={styles.priceField}><Text>Maximum (฿)</Text><TextInput accessibilityLabel="Maximum saved guide price" keyboardType="numeric" value={draftMax} onChangeText={setDraftMax} placeholder="No maximum" style={styles.priceInput} /></View>
            </View>
            {priceError && <Text accessibilityRole="alert" style={styles.filterError}>{priceError}</Text>}
            <View style={styles.priceFields}>
              <TouchableOpacity accessibilityRole="button" accessibilityLabel="Reset favorite price filters" style={styles.filterAction} onPress={resetPrices}><Text style={styles.filterActionText}>Reset</Text></TouchableOpacity>
              <TouchableOpacity accessibilityRole="button" accessibilityLabel="Apply favorite price filters" accessibilityState={{ disabled: !!priceError }} disabled={!!priceError} style={[styles.filterAction, priceError && { opacity: 0.5 }]} onPress={() => { if (!priceError) { setPriceFilter({ min: draftMin.trim(), max: draftMax.trim() }); setShowFilters(false); } }}><Text style={styles.filterActionText}>Apply filters</Text></TouchableOpacity>
            </View>
          </Card>
        )}
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
                  accessibilityRole="button" accessibilityLabel="Grid view" accessibilityState={{ selected: viewMode === 'grid' }} onPress={() => setViewMode('grid')}
                >
                  <Grid3X3 size={18} color={viewMode === 'grid' ? designTokens.colors.semantic.surface : designTokens.colors.semantic.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.viewButton, viewMode === 'list' && styles.viewButtonActive]}
                  accessibilityRole="button" accessibilityLabel="List view" accessibilityState={{ selected: viewMode === 'list' }} onPress={() => setViewMode('list')}
                >
                  <List size={18} color={viewMode === 'list' ? designTokens.colors.semantic.surface : designTokens.colors.semantic.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>
          </Card>
          
          <FlatList
            style={{ width: '100%', minWidth: 0 }}
            extraData={{ availableWidth, cardWidth }}
            data={favorites}
            renderItem={({ item }) =>
              item ? (
              <View testID={`favorite-card-${item.id}`} style={{ width: cardWidth, maxWidth: cardWidth, minWidth: 0 }}>
              <CompanionCard
                companion={item}
                viewMode={viewMode}
                onPress={() => handleCompanionPress(item.id)}
                onFavorite={() => handleFavorite(item.id)}
              />
              </View>
              ) : null
            }
            keyExtractor={(item) => item?.id}
            columnWrapperStyle={columns > 1 ? { gap: 12 } : undefined}
            numColumns={columns}
            key={`${viewMode}-${columns}-${Math.round(availableWidth)}`} // Invalidate web list geometry after a resize.
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
  filterPanel: { width: '100%', maxWidth: 600, alignSelf: 'center', gap: 12 },
  filterDescription: { color: designTokens.colors.semantic.textSecondary, lineHeight: 22 },
  priceFields: { flexDirection: 'row', gap: 12 },
  priceField: { flex: 1, minWidth: 0, gap: 8 },
  priceInput: { minHeight: 48, borderWidth: 1, borderColor: designTokens.colors.semantic.border, borderRadius: 12, paddingHorizontal: 10, width: '100%', minWidth: 0, color: designTokens.colors.semantic.text },
  filterError: { color: designTokens.colors.semantic.error },
  filterAction: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: designTokens.colors.semantic.primary },
  filterActionText: { color: designTokens.colors.semantic.primaryContrast, fontWeight: '600' },
  container: {
    flex: 1,
    width: '100%',
    maxWidth: 1170,
    minWidth: 0,
    alignSelf: 'center',
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
    minWidth: 0,
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
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
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
