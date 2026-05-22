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
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { designTokens, componentTokens } from '@/constants/design-tokens';
import { Clock, Star, MapPin } from 'lucide-react-native';

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = screenWidth * 0.7; // 70% of screen width
const CARD_SPACING = designTokens.spacing.scale.md;

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

interface PopularExperiencesSectionProps {
  experiences: PopularExperience[];
  onSeeAll: () => void;
  loading?: boolean;
}

interface ExperienceCardProps {
  experience: PopularExperience;
  onPress: () => void;
  index: number;
}

// Enhanced Experience Card Component
const EnhancedExperienceCard: React.FC<ExperienceCardProps> = ({
  experience,
  onPress,
  index,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const scaleAnim = new Animated.Value(1);

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
            source={{ uri: experience.image }}
            style={styles.experienceImage}
            contentFit="cover"
            onLoad={() => setImageLoaded(true)}
            transition={300}
          />

          {/* Gradient Overlay */}
          <LinearGradient
            colors={['transparent', 'rgba(0, 0, 0, 0.6)']}
            style={styles.imageOverlay}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />

          {/* Category Badge */}
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{experience.category}</Text>
          </View>

          {/* Duration Badge */}
          <View style={styles.durationBadge}>
            <Clock size={12} color={designTokens.colors.semantic.surface} />
            <Text style={styles.durationText}>{experience.duration}</Text>
          </View>
        </View>

        {/* Content Container */}
        <View style={styles.contentContainer}>
          {/* Title and Location */}
          <View style={styles.titleSection}>
            <Text style={styles.experienceTitle} numberOfLines={2}>
              {experience.title}
            </Text>
            <View style={styles.locationContainer}>
              <MapPin size={12} color={designTokens.colors.semantic.textSecondary} />
              <Text style={styles.locationText} numberOfLines={1}>
                {experience.location}
              </Text>
            </View>
          </View>

          {/* Rating and Price */}
          <View style={styles.bottomSection}>
            <View style={styles.ratingContainer}>
              <Star size={14} color={designTokens.colors.semantic.accent} fill={designTokens.colors.semantic.accent} />
              <Text style={styles.ratingText}>
                {experience.rating}
              </Text>
            </View>

            <View style={styles.priceContainer}>
              <Text style={styles.priceText}>
                ฿{experience.price.toLocaleString()}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Main Popular Experiences Section Component
// export const PopularExperiencesSection: React.FC<PopularExperiencesSectionProps> = ({
//   experiences,
//   onSeeAll,
//   loading = false,
// }) => {
//   const handleExperiencePress = (experienceId: string) => {
//     router.push(`/experience/${experienceId}`);
//   };

//   const renderExperienceCard = ({ item, index }: { item: PopularExperience; index: number }) => (
//     <EnhancedExperienceCard
//       experience={item}
//       onPress={() => handleExperiencePress(item.id)}
//       index={index}
//     />
//   );

//   if (loading) {
//     return (
//       <View style={styles.sectionContainer}>
//         <View style={styles.sectionHeader}>
//           <Text style={styles.sectionTitle}>Popular Experiences</Text>
//         </View>
//         <View style={styles.loadingContainer}>
//           {[1, 2, 3].map((_, index) => (
//             <View key={index} style={styles.skeletonCard} />
//           ))}
//         </View>
//       </View>
//     );
//   }

//   return (
//     <View style={styles.sectionContainer}>
//       <View style={styles.sectionHeader}>
//         <Text style={styles.sectionTitle}>Popular Experiences</Text>
//         <TouchableOpacity onPress={onSeeAll} activeOpacity={0.7} style={styles.seeAllButton}>
//           <Text style={styles.seeAllText}>See All</Text>
//         </TouchableOpacity>
//       </View>

//       <FlatList
//         data={experiences}
//         renderItem={renderExperienceCard}
//         horizontal
//         showsHorizontalScrollIndicator={false}
//         contentContainerStyle={styles.experiencesList}
//         ItemSeparatorComponent={() => <View style={styles.cardSeparator} />}
//         keyExtractor={(item) => item.id}
//         snapToInterval={CARD_WIDTH + CARD_SPACING}
//         decelerationRate="fast"
//         snapToAlignment="start"
//         pagingEnabled={false}
//       />
//     </View>
//   );
// };

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
    paddingHorizontal: designTokens.spacing.scale.lg,
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
    ...componentTokens.text.caption,
    color: designTokens.colors.semantic.accent,
    fontWeight: designTokens.typography.weights.medium,
  },

  // List Container
  experiencesList: {
    paddingLeft: designTokens.spacing.scale.lg,
    paddingRight: designTokens.spacing.scale.lg,
  },
  cardSeparator: {
    width: CARD_SPACING,
  },

  // Card Container
  cardContainer: {
    width: CARD_WIDTH,
  },
  card: {
    backgroundColor: designTokens.colors.components.card.background,
    borderRadius: designTokens.borderRadius.components.card,
    overflow: 'hidden',
    ...designTokens.shadows.md,
  },

  // Image Container
  imageContainer: {
    position: 'relative',
    height: 160,
    backgroundColor: designTokens.colors.semantic.background,
  },
  experienceImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },

  // Badges
  categoryBadge: {
    position: 'absolute',
    top: designTokens.spacing.scale.sm,
    left: designTokens.spacing.scale.sm,
    backgroundColor: designTokens.colors.semantic.primary,
    paddingHorizontal: designTokens.spacing.scale.sm,
    paddingVertical: designTokens.spacing.scale.xs,
    borderRadius: designTokens.borderRadius.components.button,
  },
  categoryText: {
    ...componentTokens.text.caption,
    color: designTokens.colors.components.button.text,
    fontSize: designTokens.typography.sizes.small,
    fontWeight: designTokens.typography.weights.medium,
  },
  durationBadge: {
    position: 'absolute',
    top: designTokens.spacing.scale.sm,
    right: designTokens.spacing.scale.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: designTokens.spacing.scale.sm,
    paddingVertical: designTokens.spacing.scale.xs,
    borderRadius: designTokens.borderRadius.components.button,
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.scale.xs,
  },
  durationText: {
    ...componentTokens.text.caption,
    color: designTokens.colors.semantic.surface,
    fontSize: designTokens.typography.sizes.small,
    fontWeight: designTokens.typography.weights.medium,
  },

  // Content Container
  contentContainer: {
    padding: designTokens.spacing.components.card.padding,
    gap: designTokens.spacing.scale.sm,
  },

  // Title Section
  titleSection: {
    gap: designTokens.spacing.scale.xs,
  },
  experienceTitle: {
    ...componentTokens.text.body,
    color: designTokens.colors.semantic.text,
    fontWeight: designTokens.typography.weights.semibold,
    lineHeight: designTokens.typography.lineHeights.tight * designTokens.typography.sizes.body,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.scale.xs,
  },
  locationText: {
    ...componentTokens.text.caption,
    color: designTokens.colors.semantic.textSecondary,
    flex: 1,
  },

  // Bottom Section
  bottomSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.scale.xs,
  },
  ratingText: {
    ...componentTokens.text.caption,
    color: designTokens.colors.semantic.text,
    fontWeight: designTokens.typography.weights.medium,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceText: {
    ...componentTokens.text.body,
    color: designTokens.colors.semantic.accent,
    fontWeight: designTokens.typography.weights.bold,
    fontSize: designTokens.typography.sizes.large,
  },

  // Loading States
  loadingContainer: {
    flexDirection: 'row',
    paddingHorizontal: designTokens.spacing.scale.lg,
    gap: CARD_SPACING,
  },
  skeletonCard: {
    width: CARD_WIDTH,
    height: 240,
    backgroundColor: designTokens.colors.semantic.background,
    borderRadius: designTokens.borderRadius.components.card,
    opacity: 0.6,
  },
});
