import React, { useMemo, useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { useAuthStoreHydrated } from '@/hooks/useAuthStoreHydrated';
import { RadialGradient } from '@/components/ui/RadialGradient';
import { SearchHeader } from '@/components/home/SearchHeader';
import { CategorySection } from '@/components/home/CategorySection';
import { FeaturedCompanionsSection } from '@/components/home/FeaturedCompanionsSection';
// import { PopularExperiencesSection } from '@/components/home/PopularExperiencesSection';
import { CompanionDashboard } from '@/components/home/CompanionDashboard';
import { designTokens } from '@/constants/design-tokens';
import { useFeaturedCompanions, Companion as APICompanion } from '@/app/api/companion/companion';
import { Companion } from '@/types/companion';
import { useTranslation } from 'react-i18next';
import { SoundManager } from '@/utils/sound-manager';
import {
  getCompanionDisplayName,
  getCompanionGallery,
  getCompanionImage,
  getCompanionLocation,
  getCompanionServices,
} from '@/utils/companion-display';

// Helper function to transform API companion data to match existing interface
const transformAPICompanion = (apiCompanion: APICompanion): Companion => {
  const services = getCompanionServices(apiCompanion);

  return {
    id: apiCompanion.id,
    name: getCompanionDisplayName(apiCompanion),
    age: apiCompanion.age || 25, // Default age if not provided
    location: getCompanionLocation(apiCompanion),
    rating: (apiCompanion.rating as any)?.average ?? apiCompanion.rating ?? 0,
    reviews: (apiCompanion.rating as any)?.count ?? apiCompanion.reviewCount ?? 0,
    price: apiCompanion.price ?? 0,
    image: getCompanionImage(apiCompanion),
    services,
    languages: apiCompanion.languages || [],
    verified: apiCompanion.verified,
    online: apiCompanion.online,
    category: apiCompanion.categories?.[0] || services[0] || 'general',
    bio: apiCompanion.bio,
    gallery: getCompanionGallery(apiCompanion),
  };
};

// TypeScript interfaces

interface PopularExperience {
  id: string;
  title: string;
  category: string;
  price: number;
  duration: string;
  rating: number;
  image: string;
  location: string;
}

type Category = {
  id: string;
  name: string;
  icon: string;
  color: string;
  blob?: any;
};

// Main categories (displayed in single row) - Enhanced with unique icons




export default function HomeScreen() {
  const { t } = useTranslation();

  const mainCategories = [
    { id: 'travel', name: t('userHome.travelPartner'), icon: '✈️', color: designTokens.colors.semantic.primary },
    { id: 'nightlife', name: t('userHome.nightlife'), icon: '🌆', color: designTokens.colors.semantic.warning },
    { id: 'cinema', name: t('userHome.cinema'), icon: '🎬', color: designTokens.colors.semantic.accent },
  ] as any;
  
  // All categories — consistent emoji icons with brand colors
  const allCategories = [
    { id: 'travel', name: t('userHome.travelPartner'), icon: '✈️', color: designTokens.colors.semantic.primary },
    { id: 'nightlife', name: t('userHome.nightlife'), icon: '🌃', color: designTokens.colors.semantic.warning },
    { id: 'cinema', name: t('userHome.cinema'), icon: '🎬', color: designTokens.colors.semantic.accent },
    { id: 'holiday', name: t('userHome.holiday'), icon: '🏖️', color: designTokens.colors.semantic.secondary },
    { id: 'wellness', name: t('userHome.wellness'), icon: '🧘', color: designTokens.colors.semantic.success },
    { id: 'explorer', name: t('userHome.explorer'), icon: '🏙️', color: designTokens.colors.semantic.primary },
    { id: 'private', name: t('userHome.private'), icon: '💎', color: designTokens.colors.semantic.textSecondary },
    { id: 'events', name: t('userHome.events'), icon: '🎉', color: designTokens.colors.semantic.error },
    { id: 'sports', name: t('userHome.sports'), icon: '⚽', color: designTokens.colors.semantic.surface },
  ] as any;
  // Call all hooks first, unconditionally
  const { user, isHydrated } = useAuthStoreHydrated();
  const { data: featuredCompanionsData, isLoading: companionsLoading, error: companionsError, refetch } = useFeaturedCompanions();
  const [refreshing, setRefreshing] = useState(false);

  console.log('user', user);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    SoundManager.play('pullRefresh');
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // Derived state using useMemo
  const isCompanion = useMemo(() => {
    return user?.userType === 'companion' || user?.userType === 'supplier';
  }, [user?.userType]);

  const transformedCompanions = useMemo(() => {
    const items = (featuredCompanionsData?.data as any)?.items || (featuredCompanionsData?.data as any)?.companions;
    if (!items) return [];
    return items.map(transformAPICompanion);
  }, [featuredCompanionsData]);

  // Navigation handlers with error handling
  const handleSeeAllCompanions = useCallback(() => {
    try {
      router.push('/search');
    } catch (error) {
      console.error('Navigation error:', error);
    }
  }, []);

  const handleSeeAllExperiences = useCallback(() => {
    try {
      router.push('/search?type=experiences');
    } catch (error) {
      console.error('Navigation error:', error);
    }
  }, []);

  // Render loading state - prevent flash of home screen when not authenticated
  if (!isHydrated || !user) {
    return (
      <RadialGradient variant="appBackground" style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={designTokens.colors.semantic.primary} />
      </RadialGradient>
    );
  }

  const refreshControl = (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={handleRefresh}
      tintColor={designTokens.colors.semantic.primary}
      colors={[designTokens.colors.semantic.primary]}
    />
  );

  // Render content based on user type
  const content = isCompanion && user ? (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      refreshControl={refreshControl}
    >
      <SearchHeader userName={user.name} isCompanion={true} />
      <CompanionDashboard userName={user.name} />
    </ScrollView>
  ) : (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      refreshControl={refreshControl}
    >
      <SearchHeader userName={user?.name} isCompanion={false} />
      <View style={styles.content}>
        <CategorySection
          mainCategories={mainCategories}
          allCategories={allCategories}
        />
        <FeaturedCompanionsSection
          companions={transformedCompanions}
          onSeeAll={handleSeeAllCompanions}
          loading={companionsLoading}
          error={companionsError}
          onRetry={refetch}
        />
      </View>
    </ScrollView>
  );

  return (
    <RadialGradient variant="appBackground" style={styles.container}>
      {content}
    </RadialGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: designTokens.spacing.scale.xl,
  },
  content: {
    paddingHorizontal: designTokens.spacing.scale.lg,
    gap: designTokens.spacing.scale.lg,
  },
});
