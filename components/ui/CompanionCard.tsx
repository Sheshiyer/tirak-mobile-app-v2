import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { designTokens } from '@/constants/design-tokens';
import { Map, MapPin, Star, Heart, Camera } from 'lucide-react-native';
import { useFavoritesStore } from '@/stores/favorites-store';
import { useTranslation } from 'react-i18next';
interface Companion {
  id: string;
  name: string;
  age: number;
  location: string;
  rating: number;
  reviews: number;
  price: number;
  image: string;
  services: string[];
  languages: string[];
  verified: boolean;
  online: boolean;
  category: string;
}

interface CompanionCardProps {
  companion: Companion;
  viewMode?: 'grid' | 'list';
  onPress?: () => void;
  onFavorite?: () => void;
}

export const CompanionCard: React.FC<CompanionCardProps> = ({
  companion,
  viewMode = 'grid',
  onPress,
  onFavorite,
}) => {
  const store = useFavoritesStore();
  const isFavorite = store.isFavorite(companion.id);
  const { toggleFavorite } = store;
  const { t } = useTranslation();
  const experienceTitle = companion.services[0] || 'Guided Thailand Itinerary';

  const formatPrice = (price: number) => {
    if (!price || price === 0) return null;
    return `฿${price.toLocaleString()}`;
  };

  const handleFavoritePress = () => {
    toggleFavorite({
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
    onFavorite?.();
  };

  const renderListImage = () => {
    return (
      <LinearGradient colors={['#7048E8', '#FF8A65']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.listImage, styles.activityArtwork]}>
        <Map size={34} color="rgba(255,255,255,0.9)" />
      </LinearGradient>
    );
  };

  const renderGridImage = () => {
    return (
      <LinearGradient colors={['#7048E8', '#FF8A65']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.gridImage, styles.activityArtwork]}>
        <Map size={52} color="rgba(255,255,255,0.9)" />
      </LinearGradient>
    );
  };

  const renderGuideCredential = () => (
    <View style={styles.guideCredential}>
      {companion.image ? (
        <Image source={{ uri: companion.image }} style={styles.guideAvatar} contentFit="cover" />
      ) : (
        <View style={[styles.guideAvatar, styles.guideAvatarFallback]}>
          <Camera size={12} color={designTokens.colors.semantic.textSecondary} />
        </View>
      )}
      <Text style={styles.guideName} numberOfLines={1}>Led by {companion.name}</Text>
    </View>
  );

  if (viewMode === 'list') {
    return (
      <TouchableOpacity style={styles.listCard} onPress={onPress}>
        <View style={styles.listImageWrapper}>
          {renderListImage()}
        </View>
        <View style={styles.listContent}>
          <View style={styles.listHeader}>
            <View style={styles.titleBlock}>
              <Text style={styles.experienceTitle} numberOfLines={2}>{experienceTitle}</Text>
              {renderGuideCredential()}
            </View>
            <View style={styles.priceContainer}>
              {formatPrice(companion.price) ? (
                <>
                  <Text style={styles.price}>{formatPrice(companion.price)}</Text>
                  <Text style={styles.priceUnit}> itinerary total</Text>
                </>
              ) : (
                <Text style={styles.priceContact}>See itinerary options</Text>
              )}
            </View>
          </View>
          
          <View style={styles.locationContainer}>
            <MapPin size={14} color={designTokens.colors.semantic.textSecondary} />
            <Text style={styles.locationText}>{companion.location}</Text>
          </View>
          
          <View style={styles.ratingContainer}>
            {companion.reviews && companion.reviews > 0 ? (
              <>
                <Star size={14} color="#FFD700" fill="#FFD700" />
                <Text style={styles.ratingText}>
                  {typeof companion.rating === 'number' ? companion.rating : ''}
                  {` (${companion.reviews} ${t('companionDetails.reviews').toLowerCase()})`}
                </Text>
              </>
            ) : (
              <Text style={styles.newGuideText}>New guide</Text>
            )}
          </View>
          
          <View style={styles.servicesContainer}>
            {companion.services.slice(1, 3).map((service, index) => (
              <View key={index} style={styles.serviceTag}>
                <Text style={styles.serviceText}>{service}</Text>
              </View>
            ))}
            {companion.services.length > 3 && (
              <Text style={styles.moreServices}>+{companion.services.length - 3} {t('common.more')}</Text>
            )}
          </View>
        </View>
        
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleFavoritePress}
          >
            <Heart
              color={isFavorite ? 'red' : 'gray'}
              fill={isFavorite ? 'red' : 'none'}
              size={20}
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.gridCard} onPress={onPress}>
      <View style={styles.imageContainer}>
        {renderGridImage()}
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={handleFavoritePress}
        >
          <Heart
            color={isFavorite ? 'red' : 'gray'}
            fill={isFavorite ? 'red' : 'none'}
            size={20}
          />
        </TouchableOpacity>
      </View>
      
      <View style={styles.gridContent}>
        <Text style={styles.experienceTitle} numberOfLines={2}>{experienceTitle}</Text>
        {renderGuideCredential()}
        <View style={styles.locationContainer}>
          <MapPin size={12} color={designTokens.colors.semantic.textSecondary} />
          <Text style={styles.locationText}>{companion.location}</Text>
        </View>
        
        <View style={styles.ratingContainer}>
          {companion.reviews && companion.reviews > 0 ? (
            <>
              <Star size={12} color={designTokens.colors.semantic.accent} fill={designTokens.colors.semantic.accent} />
              <Text style={styles.ratingText}>
                {typeof companion.rating === 'number' ? companion.rating : ''}
                {` (${companion.reviews})`}
              </Text>
            </>
          ) : (
            <Text style={styles.newGuideText}>New guide</Text>
          )}
        </View>
        
        <View style={styles.priceContainer}>
          {formatPrice(companion.price) ? (
            <>
              <Text style={styles.price}>{formatPrice(companion.price)}</Text>
              <Text style={styles.priceUnit}> itinerary total</Text>
            </>
          ) : (
            <Text style={styles.priceContact}>See itinerary options</Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.primaryCta}
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={`View ${experienceTitle} itinerary led by ${companion.name}`}
        >
          <Text style={styles.primaryCtaText}>View itinerary</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Grid view styles
  gridCard: {
    flex: 1,
    backgroundColor: designTokens.colors.semantic.surface,
    borderRadius: 12,
    margin: 5,
    shadowColor: designTokens.colors.semantic.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: 150,
  },
  activityArtwork: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridContent: {
    padding: 12,
  },
  // List view styles
  listCard: {
    flexDirection: 'row',
    backgroundColor: designTokens.colors.semantic.surface,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: designTokens.colors.semantic.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    overflow: 'hidden',
  },
  listImage: {
    width: 100,
    height: 120,
  },
  listContent: {
    flex: 1,
    padding: 12,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleBlock: {
    flex: 1,
    marginRight: 8,
  },
  experienceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: designTokens.colors.semantic.text,
  },
  guideName: {
    fontSize: 12,
    color: designTokens.colors.semantic.textSecondary,
    flex: 1,
  },
  guideCredential: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  guideAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  guideAvatarFallback: {
    backgroundColor: designTokens.colors.semantic.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationText: {
    fontSize: 12,
    color: designTokens.colors.semantic.textSecondary,
    marginLeft: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 12,
    color: designTokens.colors.semantic.text,
    marginLeft: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  primaryCta: {
    minHeight: 44,
    borderRadius: designTokens.borderRadius.components.button,
    backgroundColor: designTokens.colors.semantic.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  primaryCtaText: {
    color: designTokens.colors.semantic.primaryContrast,
    fontSize: 14,
    fontWeight: '700',
  },
  price: {
    fontSize: 16,
    fontWeight: '600',
    color: designTokens.colors.semantic.accent,
  },
  priceUnit: {
    fontSize: 12,
    color: designTokens.colors.semantic.textSecondary,
    marginLeft: 2,
  },
  servicesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  serviceTag: {
    backgroundColor: designTokens.colors.semantic.accent + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  serviceText: {
    fontSize: 10,
    color: designTokens.colors.semantic.accent,
    fontWeight: '500',
  },
  moreServices: {
    fontSize: 10,
    color: designTokens.colors.semantic.textSecondary,
    fontStyle: 'italic',
  },
  cardActions: {
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: designTokens.colors.semantic.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
  },
  listImageWrapper: {
    width: 100,
    height: 120,
    overflow: 'hidden',
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  priceContact: {
    fontSize: 12,
    color: designTokens.colors.semantic.textSecondary,
    fontStyle: 'italic',
  },
  newGuideText: {
    fontSize: 11,
    color: designTokens.colors.semantic.primary,
    fontWeight: '500',
    backgroundColor: designTokens.colors.semantic.primary + '15',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
});
