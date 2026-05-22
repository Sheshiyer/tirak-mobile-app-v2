import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { designTokens } from '@/constants/design-tokens';
import { MapPin, Star, Heart, MessageCircle, Camera } from 'lucide-react-native';
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
  onMessage?: () => void;
}

export const CompanionCard: React.FC<CompanionCardProps> = ({
  companion,
  viewMode = 'grid',
  onPress,
  onFavorite,
  onMessage,
}) => {
  const store = useFavoritesStore();
  const isFavorite = store.isFavorite(companion.id);
  const { toggleFavorite } = store;
  const { t } = useTranslation();

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
    if (companion.image) {
      return (
        <Image
          source={{ uri: companion.image }}
          style={styles.listImage}
          contentFit="cover"
          contentPosition="top center"
        />
      );
    }
    return (
      <LinearGradient colors={['#A85CF9', '#FFBAA0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.listImage}>
        <Camera size={24} color="rgba(255,255,255,0.7)" />
      </LinearGradient>
    );
  };

  const renderGridImage = () => {
    if (companion.image) {
      return (
        <Image
          source={{ uri: companion.image }}
          style={styles.gridImage}
          contentFit="cover"
          contentPosition="top center"
        />
      );
    }
    return (
      <LinearGradient colors={['#A85CF9', '#FFBAA0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.gridImage, styles.imagePlaceholder]}>
        <Camera size={28} color="rgba(255,255,255,0.7)" />
      </LinearGradient>
    );
  };

  if (viewMode === 'list') {
    return (
      <TouchableOpacity style={styles.listCard} onPress={onPress}>
        <View style={styles.listImageWrapper}>
          {renderListImage()}
        </View>
        <View style={styles.listContent}>
          <View style={styles.listHeader}>
            <Text style={styles.companionName}>{companion.name}</Text>
            <View style={styles.priceContainer}>
              {formatPrice(companion.price) ? (
                <>
                  <Text style={styles.price}>{formatPrice(companion.price)}</Text>
                  <Text style={styles.priceUnit}>/{t('companionDetails.day')}</Text>
                </>
              ) : (
                <Text style={styles.priceContact}>Request guide rate</Text>
              )}
            </View>
          </View>
          
          <View style={styles.locationContainer}>
            <MapPin size={14} color={designTokens.colors.semantic.textSecondary} />
            <Text style={styles.locationText}>{companion.location}</Text>
            {companion.online && <View style={styles.onlineIndicator} />}
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
            {companion.services.slice(0, 2).map((service, index) => (
              <View key={index} style={styles.serviceTag}>
                <Text style={styles.serviceText}>{service}</Text>
              </View>
            ))}
            {companion.services.length > 2 && (
              <Text style={styles.moreServices}>+{companion.services.length - 2} {t('common.more')}</Text>
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
          <TouchableOpacity style={styles.actionButton} onPress={onMessage}>
            <MessageCircle size={20} color={designTokens.colors.semantic.primary} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.gridCard} onPress={onPress}>
      <View style={styles.imageContainer}>
        {renderGridImage()}
        {companion.online && <View style={styles.onlineIndicatorGrid} />}
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
        <Text style={styles.companionName} numberOfLines={1}>{companion.name}</Text>
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
              <Text style={styles.priceUnit}>/{t('companionDetails.day')}</Text>
            </>
          ) : (
            <Text style={styles.priceContact}>Request guide rate</Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.primaryCta}
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={`View ${companion.name} guide profile`}
        >
          <Text style={styles.primaryCtaText}>View guide</Text>
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
    height: 240,
  },
  onlineIndicatorGrid: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: designTokens.colors.semantic.accent,
    borderWidth: 2,
    borderColor: designTokens.colors.semantic.surface,
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
  companionName: {
    fontSize: 16,
    fontWeight: '600',
    color: designTokens.colors.semantic.text,
    flex: 1,
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
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: designTokens.colors.semantic.accent,
    marginLeft: 8,
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
