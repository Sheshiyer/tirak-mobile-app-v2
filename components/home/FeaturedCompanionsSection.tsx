import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Animated,
  Dimensions,
  Platform
} from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { designTokens, componentTokens } from '@/constants/design-tokens';
import { MapPin, Heart, MessageCircle, Star, Verified, Send } from 'lucide-react-native';
import { Companion } from '@/types/companion';
import { useTranslation } from 'react-i18next';
import { useFavoritesStore } from '@/stores/favorites-store';

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = screenWidth * 0.75; // 75% of screen width
const CARD_SPACING = designTokens.spacing.scale.md;

interface FeaturedCompanionsSectionProps {
  companions: Companion[];
  onSeeAll: () => void;
  loading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
}

interface CompanionCardProps {
  companion: Companion;
  onPress: () => void;
  onFavorite: () => void;
  onMessage: () => void;
  index: number;
}

// Enhanced Companion Card Component
const EnhancedCompanionCard: React.FC<CompanionCardProps> = ({
  companion,
  onPress,
  onFavorite,
  onMessage,
  index,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const scaleAnim = new Animated.Value(1);
  const { t } = useTranslation();
  const isFavorite = useFavoritesStore((state) => state.isFavorite(companion.id));
  const displayPrice = companion.price && companion.price > 0
    ? `฿${companion.price.toLocaleString()}`
    : 'Request guide rate';
  const showReviews = companion.reviews > 0;
  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      tension: 300,
      friction: 8,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 8,
    }).start();
  };

  // Calculate distance (mock data)
  const distance = `${(Math.random() * 10 + 1).toFixed(1)} km`;

  return (
    <Animated.View
      style={[
        styles.cardContainer,
        { transform: [{ scale: scaleAnim }] }
      ]}
    >
      <TouchableOpacity
        style={styles.card}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        {/* Image Container with Overlay Elements */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: companion.image }}
            style={styles.companionImage}
            contentFit="cover"
            onLoad={() => setImageLoaded(true)}
            transition={300}
          />

          {/* Gradient Overlay */}
          <LinearGradient
            colors={['transparent', 'rgba(0, 0, 0, 0.7)']}
            style={styles.imageOverlay}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />

          {/* Online Status Indicator */}
          {companion.online && (
            <View style={styles.onlineIndicator}>
              <View style={styles.onlineDot} />
            </View>
          )}

          {/* Verification Badge */}
          {companion.verified && (
            <View style={styles.verificationBadge}>
              <Verified size={16} color={designTokens.colors.semantic.surface} fill={designTokens.colors.semantic.accent} />
            </View>
          )}

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={onFavorite}
              activeOpacity={0.8}
            >
              <Heart
                size={18}
                color={designTokens.colors.semantic.surface}
                fill={isFavorite ? designTokens.colors.semantic.accent : 'transparent'}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={onMessage}
              activeOpacity={0.8}
            >
              <MessageCircle size={18} color={designTokens.colors.semantic.surface} />
            </TouchableOpacity>
          </View>
        </View>
        {/* Content Container */}
        <View style={styles.contentContainer}>
          {/* Name and Location */}
          <View style={styles.headerInfo}>
            <Text style={styles.companionName} numberOfLines={1}>
              {companion.name}
            </Text>
            <View style={styles.locationRow}>
              <MapPin size={12} color={designTokens.colors.semantic.textSecondary} />
              <Text style={styles.locationText} numberOfLines={1}>
                {companion.location} • {distance}
              </Text>
            </View>
          </View>

          {/* Rating and Reviews */}
          <View style={styles.ratingContainer}>
            <View style={styles.ratingRow}>
              <Star size={14} color={showReviews ? designTokens.colors.semantic.accent : designTokens.colors.semantic.textSecondary} fill={showReviews ? designTokens.colors.semantic.accent : 'transparent'} />
              <Text style={styles.ratingText}>
                {companion.rating}
              </Text>
              <Text style={styles.reviewsText}>
                {showReviews ? `(${companion.reviews} reviews)` : 'New guide'}
              </Text>
            </View>
          </View>

          {/* Services */}
          <View style={styles.servicesContainer}>
            {companion.services.slice(0, 2).map((service, index) => (
              <View key={index} style={styles.serviceChip}>
                <Text style={styles.serviceText}>{service}</Text>
              </View>
            ))}
            {companion.services.length > 2 && (
              <Text style={styles.moreServices}>+{companion.services.length - 2}</Text>
            )}
          </View>

          {companion.price > 0 ? (
            <View style={styles.priceContainer}>
              <Text style={styles.priceText}>{displayPrice}</Text>
              <Text style={styles.priceUnit}>/day</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.rateRequestButton}
              onPress={onMessage}
              activeOpacity={0.85}
            >
              <Send size={14} color={designTokens.colors.semantic.primary} />
              <Text style={styles.rateRequestText}>{displayPrice}</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Main Featured Companions Section Component
export const FeaturedCompanionsSection: React.FC<FeaturedCompanionsSectionProps> = ({
  companions,
  onSeeAll,
  loading = false,
  error,
  onRetry,
}) => {
  const { t } = useTranslation();


  const handleCompanionPress = (companionId: string) => {
    router.push(`/companion/${companionId}`);
  };

  const handleFavorite = (companion: Companion) => {
    useFavoritesStore.getState().toggleFavorite({
      id: companion.id,
      name: companion.name,
      image: companion.image,
      profileImage: companion.image,
      location: companion.location,
      rating: companion.rating,
      reviews: companion.reviews,
      reviewCount: companion.reviews,
      price: companion.price,
      services: companion.services,
      languages: companion.languages,
      verified: companion.verified,
      online: companion.online,
      category: companion.category,
      categories: companion.category ? [companion.category] : [],
    });
  };

  const handleMessage = (companionId: string) => {
    // TODO: Navigate to chat
    router.push(`/chat/${companionId}`);
  };

  const renderCompanionCard = ({ item, index }: { item: Companion; index: number }) => (
    <EnhancedCompanionCard
      companion={item}
      onPress={() => handleCompanionPress(item.id)}
      onFavorite={() => handleFavorite(item)}
      onMessage={() => handleMessage(item.id)}
      index={index}
    />
  );

  // Handle error state
  if (error) {
    return (
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('userHome.featuredCompanions')}</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{t('userHome.failedToLoadCompanions')}</Text>
          <Text style={styles.errorSubtext}>{error.message}</Text>
          {onRetry && (
            <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
              <Text style={styles.retryButtonText}>{t('userHome.tryAgain')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('userHome.featuredCompanions')}</Text>
        </View>
        <View style={styles.loadingContainer}>
          {[1, 2, 3].map((_, index) => (
            <View key={index} style={styles.skeletonCard} />
          ))}
        </View>
      </View>
    );
  }

  // Handle empty or invalid data
  if (!companions || companions.length === 0) {
    // logger.warn('FeaturedCompanionsSection: No companions data provided');
    return (
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('userHome.featuredCompanions')}</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{t('userHome.noCompanions')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t('userHome.featuredCompanions')}</Text>
        <TouchableOpacity onPress={onSeeAll} activeOpacity={0.7} style={styles.seeAllButton}>
          <Text style={styles.seeAllText}>{t('userHome.seeAll')}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={companions}
        renderItem={renderCompanionCard}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.companionsList}
        ItemSeparatorComponent={() => <View style={styles.cardSeparator} />}
        keyExtractor={(item, index) => `companion-${item.id}-${index}`}
        style={styles.flatListContainer}
        removeClippedSubviews={false}
        initialNumToRender={4}
        maxToRenderPerBatch={4}
        windowSize={10}
        snapToInterval={CARD_WIDTH + CARD_SPACING}
        decelerationRate="fast"
        snapToAlignment="start"
        getItemLayout={(data, index) => ({
          length: CARD_WIDTH + CARD_SPACING,
          offset: (CARD_WIDTH + CARD_SPACING) * index,
          index,
        })}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  // Section Container
  sectionContainer: {
    marginBottom: designTokens.spacing.scale.lg,
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: designTokens.spacing.scale.lg,
    paddingHorizontal: designTokens.spacing.scale.md,
  },
  sectionTitle: {
    ...componentTokens.text.subheading,
    color: designTokens.colors.semantic.text,
  },
  seeAllButton: {
    paddingVertical: designTokens.spacing.scale.xs,
    paddingHorizontal: designTokens.spacing.scale.sm,
  },
  seeAllText: {
    ...designTokens.typography.styles.caption,
    color: designTokens.colors.semantic.accent,
    fontWeight: designTokens.typography.weights.medium,
  },

  // List Container
  flatListContainer: {
    minHeight: 340,
  },
  companionsList: {
    paddingLeft: designTokens.spacing.scale.md,
    paddingRight: designTokens.spacing.scale.md,
    minHeight: 340,
  },
  cardSeparator: {
    width: CARD_SPACING,
  },

  // Card Container
  cardContainer: {
    width: CARD_WIDTH,
    minHeight: 330,
  },
  card: {
    backgroundColor: designTokens.colors.semantic.surface,
    borderRadius: designTokens.borderRadius.components.card,
    overflow: 'hidden',
    minHeight: 330,
    ...designTokens.shadows.md,
  },

  // Image Container
  imageContainer: {
    position: 'relative',
    height: 200,
    width: '100%',
  },
  companionImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },

  // Status Indicators
  onlineIndicator: {
    position: 'absolute',
    top: designTokens.spacing.scale.sm,
    left: designTokens.spacing.scale.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: designTokens.borderRadius.full,
    padding: designTokens.spacing.scale.xs,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: designTokens.colors.semantic.accent,
  },
  verificationBadge: {
    position: 'absolute',
    top: designTokens.spacing.scale.sm,
    right: designTokens.spacing.scale.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: designTokens.borderRadius.full,
    padding: designTokens.spacing.scale.xs,
  },

  // Quick Actions
  quickActions: {
    position: 'absolute',
    bottom: designTokens.spacing.scale.md,
    right: designTokens.spacing.scale.md,
    flexDirection: 'row',
    gap: designTokens.spacing.scale.sm,
  },
  actionButton: {
    width: 44,
    height: 44,
    backgroundColor: 'rgba(28, 23, 38, 0.55)',
    borderRadius: designTokens.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    ...Platform.select({
      ios: {
        shadowColor: designTokens.colors.semantic.text,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },

  // Content Container
  contentContainer: {
    paddingHorizontal: designTokens.spacing.scale.md,
    paddingTop: designTokens.spacing.scale.md,
    paddingBottom: designTokens.spacing.scale.lg,
  },

  // Header Info
  headerInfo: {
    marginBottom: designTokens.spacing.scale.sm,
  },
  companionName: {
    ...designTokens.typography.styles.body,
    fontWeight: designTokens.typography.weights.semibold,
    color: designTokens.colors.semantic.text,
    marginBottom: designTokens.spacing.scale.xs,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.scale.xs,
  },
  locationText: {
    ...designTokens.typography.styles.caption,
    color: designTokens.colors.semantic.textSecondary,
    flex: 1,
  },

  // Rating
  ratingContainer: {
    marginBottom: designTokens.spacing.scale.sm,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.scale.xs,
  },
  ratingText: {
    ...designTokens.typography.styles.caption,
    fontWeight: designTokens.typography.weights.medium,
    color: designTokens.colors.semantic.text,
  },
  reviewsText: {
    ...designTokens.typography.styles.caption,
    color: designTokens.colors.semantic.textSecondary,
  },

  // Services
  servicesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: designTokens.spacing.scale.xs,
    marginBottom: designTokens.spacing.scale.sm,
  },
  serviceChip: {
    backgroundColor: designTokens.colors.semantic.accent + '15',
    borderColor: designTokens.colors.semantic.accent + '30',
    borderWidth: 1,
    borderRadius: designTokens.borderRadius.components.button,
    paddingHorizontal: designTokens.spacing.scale.sm,
    paddingVertical: designTokens.spacing.scale.xs,
  },
  serviceText: {
    ...designTokens.typography.styles.caption,
    fontSize: designTokens.typography.sizes.small,
    color: designTokens.colors.semantic.accent,
    fontWeight: designTokens.typography.weights.medium,
  },
  moreServices: {
    ...designTokens.typography.styles.caption,
    fontSize: designTokens.typography.sizes.small,
    color: designTokens.colors.semantic.textSecondary,
    fontStyle: 'italic',
    alignSelf: 'center',
  },

  // Price
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'flex-start',
    marginTop: designTokens.spacing.scale.xs,
  },
  priceText: {
    fontSize: designTokens.typography.sizes.body,
    fontWeight: designTokens.typography.weights.semibold,
    color: designTokens.colors.semantic.text,
  },
  priceContactText: {
    fontSize: designTokens.typography.sizes.caption,
    fontStyle: 'italic',
    fontWeight: designTokens.typography.weights.medium,
    color: designTokens.colors.semantic.textSecondary,
  },
  rateRequestButton: {
    minHeight: 44,
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: designTokens.spacing.scale.xs,
    marginTop: designTokens.spacing.scale.xs,
    paddingHorizontal: designTokens.spacing.scale.md,
    borderRadius: designTokens.borderRadius.components.button,
    backgroundColor: designTokens.colors.semantic.primary + '12',
    borderWidth: 1,
    borderColor: designTokens.colors.semantic.primary + '24',
  },
  rateRequestText: {
    fontSize: designTokens.typography.sizes.caption,
    fontWeight: designTokens.typography.weights.semibold,
    color: designTokens.colors.semantic.primary,
  },
  priceUnit: {
    ...designTokens.typography.styles.caption,
    color: designTokens.colors.semantic.textSecondary,
    marginLeft: designTokens.spacing.scale.xs,
  },

  // Loading States
  loadingContainer: {
    flexDirection: 'row',
    paddingHorizontal: designTokens.spacing.scale.md,
    gap: CARD_SPACING,
  },
  skeletonCard: {
    width: CARD_WIDTH,
    height: 300,
    backgroundColor: designTokens.colors.semantic.border,
    borderRadius: designTokens.borderRadius.components.card,
    opacity: 0.6,
  },

  // Empty State
  emptyContainer: {
    paddingHorizontal: designTokens.spacing.scale.md,
    paddingVertical: designTokens.spacing.scale.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...designTokens.typography.styles.body,
    color: designTokens.colors.semantic.textSecondary,
    textAlign: 'center',
  },

  // Error State
  errorContainer: {
    paddingHorizontal: designTokens.spacing.scale.md,
    paddingVertical: designTokens.spacing.scale.xl,
    alignItems: 'center',
  },
  errorText: {
    ...designTokens.typography.styles.body,
    color: designTokens.colors.semantic.error,
    textAlign: 'center',
    marginBottom: designTokens.spacing.scale.sm,
  },
  errorSubtext: {
    ...designTokens.typography.styles.caption,
    color: designTokens.colors.semantic.textSecondary,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: designTokens.spacing.scale.md,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
    backgroundColor: designTokens.colors.semantic.primary,
  },
  retryButtonText: {
    color: designTokens.colors.semantic.surface,
    ...designTokens.typography.styles.body,
    fontWeight: '600',
  },
});
