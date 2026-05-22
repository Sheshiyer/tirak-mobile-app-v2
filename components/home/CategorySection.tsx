import * as React from 'react';
import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  AccessibilityInfo,
  Platform,
  Pressable,
  LayoutAnimation,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient, LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import { Card } from '@/components/ui/Card';
import { designTokens } from '@/constants/design-tokens';
import { ChevronDown } from 'lucide-react-native';
import { homeCategories } from '@/constants/home-categories';
import { useTranslation } from 'react-i18next';
// Enhanced TypeScript interfaces with comprehensive accessibility
interface Category {
  id: string;
  name: string;
  icon: any;
  isPrimary?: boolean; // For progressive disclosure
  accessibilityLabel?: string;
  description?: string; // For enhanced accessibility
}

interface CategorySectionProps {
  mainCategories: Category[];
  allCategories: Category[];
  onCategoryPress?: (categoryId: string) => void;
  testID?: string;
  showExpandedIndicator?: boolean;
}

// Enhanced constants for responsive layout and premium UX
const { width: screenWidth } = Dimensions.get('window');

// Mathematical layout system for perfect 4-icons-per-row
const LAYOUT_CONFIG = {
  itemsPerRow: 3,
  containerPadding: designTokens.spacing.scale.lg,
  itemSpacing: designTokens.spacing.scale.sm,
  expandedSpacing: designTokens.spacing.scale.md,
  premiumPadding: designTokens.spacing.scale.xl,
} as const;

// Calculate exact dimensions for perfect layout
const CONTAINER_HORIZONTAL_PADDING = LAYOUT_CONFIG.containerPadding * 2;
const AVAILABLE_WIDTH = screenWidth - CONTAINER_HORIZONTAL_PADDING;
const TOTAL_ITEM_SPACING = LAYOUT_CONFIG.itemSpacing * (LAYOUT_CONFIG.itemsPerRow - 1);
const ITEM_WIDTH = (AVAILABLE_WIDTH - TOTAL_ITEM_SPACING) / LAYOUT_CONFIG.itemsPerRow;
const ITEM_WIDTH_PERCENTAGE = (ITEM_WIDTH / AVAILABLE_WIDTH) * 100;

// Accessibility and touch target constants
const TOUCH_TARGETS = {
  minimum: 44,    // iOS HIG minimum
  optimal: 48,    // Material Design optimal
  premium: 52,    // Premium feel for expanded state
} as const;

// Simple background colors for categories
const categoryColors = [
  '#F0F0FF', // Travel - Light purple
  '#FFE5EC', // Nightlife - Light pink
  '#E5FFE5', // Cinema - Light green
  '#FFF5E5', // Holiday - Light orange
  '#E5FFF5', // Wellness - Light mint
  '#F5E5FF', // Explorer - Light lavender
  '#F0E5FF', // Private - Light violet
  '#FFF0E5', // Events - Light peach
  '#E5F5FF', // Sports - Light blue
];

// Compose the categories array for the homepage
const homepageCategories: Category[] = homeCategories;

export const CategorySection: React.FC<Partial<CategorySectionProps>> = ({
   mainCategories,
  allCategories,
  onCategoryPress,
  testID = 'category-section',
  showExpandedIndicator = true,
}) => {
  const [categoriesExpanded, setCategoriesExpanded] = useState(false);
  const dropdownAnimation = useRef(new Animated.Value(0)).current;
  const scaleAnimations = useRef<{ [key: string]: Animated.Value }>({}).current;
  const opacityAnimations = useRef<{ [key: string]: Animated.Value }>({}).current;
  const { t } = useTranslation();
  
  // Use the translated categories passed from parent, fallback to homepageCategories
  const displayCategories = allCategories || homepageCategories;

  // Staggered entry animation on mount
  useEffect(() => {
    displayCategories.forEach((cat, i) => {
      if (!scaleAnimations[cat.id]) scaleAnimations[cat.id] = new Animated.Value(0.7);
      if (!opacityAnimations[cat.id]) opacityAnimations[cat.id] = new Animated.Value(0);
      Animated.parallel([
        Animated.timing(scaleAnimations[cat.id], {
          toValue: 1,
          duration: 400,
          delay: i * 80,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnimations[cat.id], {
          toValue: 1,
          duration: 400,
          delay: i * 80,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [displayCategories, scaleAnimations, opacityAnimations]);

  // Enhanced category press handler with haptic feedback
  const handleCategoryPress = useCallback((categoryId: string, categoryName: string) => {
    // Haptic feedback for premium feel
    if (Platform.OS === 'ios') {
      // Note: In production, add haptic feedback here
      // HapticFeedback.impactAsync(HapticFeedback.ImpactFeedbackStyle.Light);
    }

    // Custom handler or default navigation
    if (onCategoryPress) {
      onCategoryPress(categoryId);
    } else {
      router.push(`/search?category=${categoryId}`);
    }

    // Announce to screen readers
    AccessibilityInfo.announceForAccessibility(`Selected ${categoryName} category`);

    // Auto-collapse if expanded for better UX
    if (categoriesExpanded) {
      toggleCategoriesDropdown();
    }
  }, [onCategoryPress, categoriesExpanded]);

  // Enhanced animation with organic motion and layout animation
  const toggleCategoriesDropdown = useCallback(() => {
    const toValue = categoriesExpanded ? 0 : 1;

    // Configure layout animation for smooth transitions
    LayoutAnimation.configureNext({
      duration: designTokens.animation.duration.normal,
      create: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
      update: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.scaleXY,
      },
    });

    setCategoriesExpanded(!categoriesExpanded);

    // Organic motion with cubic-bezier easing
    Animated.timing(dropdownAnimation, {
      toValue,
      duration: designTokens.animation.duration.normal,
      useNativeDriver: false,
      // Organic easing curve for natural feel
    }).start();

    // Announce state change to screen readers
    AccessibilityInfo.announceForAccessibility(
      categoriesExpanded ? 'Categories collapsed' : 'Categories expanded'
    );
  }, [categoriesExpanded, dropdownAnimation]);

  // Enhanced interpolations for smooth animations
  const chevronRotation = dropdownAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
    extrapolate: 'clamp',
  });

  // Enhanced category item renderer with simple background colors
  const renderCategoryItem = useCallback((category: Category, index: number) => {
    if (!scaleAnimations[category.id]) scaleAnimations[category.id] = new Animated.Value(1);
    if (!opacityAnimations[category.id]) opacityAnimations[category.id] = new Animated.Value(1);
    const backgroundColor = categoryColors[index % categoryColors.length];
    
    return (
      <Animated.View
        key={category.id}
        style={[
          styles.categoryItem,
          {
            transform: [{ scale: scaleAnimations[category.id] }],
            opacity: opacityAnimations[category.id],
          },
        ]}
      >
        <Pressable
          style={styles.categoryTouchable}
          onPress={() => {
            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            router.push(`/search?category=${category.id}`);
          }}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={category.accessibilityLabel || `${category.name} category`}
          accessibilityHint={`Tap to browse ${category.name} category`}
          testID={`category-${category.id}`}
        >
          <View style={[styles.categoryContainer, { backgroundColor }]}>
            {typeof category.icon === 'string' ? (
              <Text style={styles.categoryEmoji}>{category.icon}</Text>
            ) : (
              <Image source={category.icon} style={styles.categoryImage} resizeMode="contain" />
            )}
            <Text style={styles.categoryName}>{category.name}</Text>
          </View>
        </Pressable>
      </Animated.View>
    );
  }, [onCategoryPress, scaleAnimations, opacityAnimations]);

  return (
    <Card style={styles.sectionCard} padding="lg" shadow="md">
      <Pressable
        style={styles.sectionHeader}
        onPress={() => setCategoriesExpanded(!categoriesExpanded)}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Categories section"
        accessibilityHint={categoriesExpanded ? "Tap to collapse categories" : "Tap to expand categories"}
        accessibilityState={{ expanded: categoriesExpanded }}
      >
        <Text style={styles.sectionTitle}>{t('userHome.categories')}</Text>
      </Pressable>
      <View style={styles.categoriesContainer}>
        <View style={styles.categoriesGrid}>
          {displayCategories.map(renderCategoryItem)}
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  // Enhanced section card with premium styling
  sectionCard: {
    marginBottom: designTokens.spacing.scale.sm,
    backgroundColor: designTokens.colors.semantic.surface,
    borderRadius: designTokens.borderRadius.components.card,
    overflow: 'hidden', // For gradient overlays
  },

  // Enhanced section header with better touch targets
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: designTokens.spacing.scale.lg,
    minHeight: TOUCH_TARGETS.minimum,
    paddingVertical: designTokens.spacing.scale.xs,
  },

  sectionTitle: {
    ...designTokens.typography.styles.subheading,
    color: designTokens.colors.semantic.text,
  },

  // Enhanced categories container with premium spacing
  categoriesContainer: {
    marginBottom: designTokens.spacing.scale.sm,
  },
  categoriesContainerExpanded: {
    marginBottom: designTokens.spacing.scale.lg,
  },

  // Mathematical grid layout for perfect 4-icons-per-row
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: designTokens.spacing.scale.sm,
    paddingVertical: 0,
    paddingBottom: designTokens.spacing.scale.sm,
  },
  categoriesGridExpanded: {
    justifyContent: 'space-between',
    paddingHorizontal: LAYOUT_CONFIG.premiumPadding, // Premium spacing
    paddingVertical: designTokens.spacing.scale.md,
    paddingBottom: designTokens.spacing.scale.xl,
  },
  // Enhanced category items with mathematical precision
  categoryItem: {
    width: '33.33%',
    alignItems: 'center',
    marginBottom: 8,
    minHeight: 90,
    paddingVertical: 2,
    paddingHorizontal: 2,
    position: 'relative',
  },
  categoryItemExpanded: {
    width: `${ITEM_WIDTH_PERCENTAGE}%`,
    marginBottom: designTokens.spacing.scale.xl, // Enhanced spacing for premium feel
    minHeight: 140, // More height for expanded state
    paddingVertical: designTokens.spacing.scale.sm,
    paddingHorizontal: designTokens.spacing.scale.xs,
  },

  // Enhanced touch targets with premium accessibility
  categoryTouchable: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    flex: 1,
    minHeight: TOUCH_TARGETS.minimum,
    paddingVertical: designTokens.spacing.scale.xs,
    borderRadius: designTokens.borderRadius.lg,
    overflow: 'hidden', // For gradient overlays
    position: 'relative',
  },
  categoryImage: {
    width: 32,
    height: 32,
    borderRadius: designTokens.borderRadius.sm,
  },

  // Gradient overlay for hover animations
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: designTokens.borderRadius.lg,
    zIndex: 1,
  },
  gradientBackground: {
    flex: 1,
    borderRadius: designTokens.borderRadius.lg,
  },

  // Enhanced icon styling with premium touch targets
  categoryIcon: {
    width: TOUCH_TARGETS.optimal,
    height: TOUCH_TARGETS.optimal,
    borderRadius: designTokens.borderRadius.xxl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: designTokens.spacing.scale.sm,
    borderWidth: 1,
    borderColor: designTokens.colors.semantic.border + '30',
    ...designTokens.shadows.sm,
    zIndex: 2, // Above gradient overlay
  },
  categoryIconExpanded: {
    width: TOUCH_TARGETS.premium,
    height: TOUCH_TARGETS.premium,
    marginBottom: designTokens.spacing.scale.md, // Enhanced spacing
    borderWidth: 1.5,
    borderColor: designTokens.colors.semantic.border + '40',
    ...designTokens.shadows.md,
  },

  // Enhanced typography with better readability
  categoryName: {
    fontSize: 12,
    color: designTokens.colors.semantic.text,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: designTokens.typography.families.caption,
    marginTop: 8,
    lineHeight: 16,
    letterSpacing: 0.2,
    zIndex: 2,
    paddingHorizontal: 2,
  },
  categoryNameExpanded: {
    fontSize: designTokens.typography.sizes.caption,
    lineHeight: 18,
    letterSpacing: 0.2,
    marginTop: 0,
    paddingHorizontal: 4, // More padding for expanded state
  },

  // Enhanced emoji styling with better shadows
  categoryEmoji: {
    fontSize: 24,
    zIndex: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.08)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  categoryEmojiExpanded: {
    fontSize: 26,
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },

  // Enhanced progressive disclosure indicator
  expandedIndicator: {
    alignItems: 'center',
    paddingTop: designTokens.spacing.scale.md,
    paddingBottom: designTokens.spacing.scale.sm,
    marginTop: designTokens.spacing.scale.xs,
    borderTopWidth: 1,
    borderTopColor: designTokens.colors.semantic.border + '20',
  },
  expandedIndicatorText: {
    fontSize: designTokens.typography.sizes.caption,
    color: designTokens.colors.semantic.textSecondary,
    fontFamily: designTokens.typography.families.caption,
    fontWeight: designTokens.typography.weights.medium,
    opacity: 0.8,
  },

  // Simple category container
  categoryContainer: {
    width: 70,
    height: 70,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
});
