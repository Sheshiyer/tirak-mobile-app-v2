import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { designTokens } from '@/constants/design-tokens';

const { width } = Dimensions.get('window');

interface SearchShimmerProps {
  viewMode?: 'grid' | 'list';
  count?: number;
}

interface ShimmerCardProps {
  viewMode: 'grid' | 'list';
  style?: ViewStyle;
}

const ShimmerCard: React.FC<ShimmerCardProps> = ({ viewMode, style }) => {
  const shimmerAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const startShimmer = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: false,
          }),
          Animated.timing(shimmerAnimation, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: false,
          }),
        ])
      ).start();
    };

    startShimmer();
  }, [shimmerAnimation]);

  const shimmerOpacity = shimmerAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  if (viewMode === 'list') {
    return (
      <View style={[styles.listCard, style]}>
        {/* Image placeholder */}
        <Animated.View style={[styles.listImage, { opacity: shimmerOpacity }]}>
          <LinearGradient
            colors={['#f0f0f0', '#e0e0e0', '#f0f0f0']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
        </Animated.View>

        {/* Content placeholder */}
        <View style={styles.listContent}>
          {/* Name placeholder */}
          <Animated.View style={[styles.listTitle, { opacity: shimmerOpacity }]}>
            <LinearGradient
              colors={['#f0f0f0', '#e0e0e0', '#f0f0f0']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </Animated.View>

          {/* Location placeholder */}
          <Animated.View style={[styles.listSubtitle, { opacity: shimmerOpacity }]}>
            <LinearGradient
              colors={['#f0f0f0', '#e0e0e0', '#f0f0f0']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </Animated.View>

          {/* Rating placeholder */}
          <Animated.View style={[styles.listRating, { opacity: shimmerOpacity }]}>
            <LinearGradient
              colors={['#f0f0f0', '#e0e0e0', '#f0f0f0']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </Animated.View>

          {/* Services placeholder */}
          <View style={styles.listServices}>
            <Animated.View style={[styles.serviceChip, { opacity: shimmerOpacity }]}>
              <LinearGradient
                colors={['#f0f0f0', '#e0e0e0', '#f0f0f0']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </Animated.View>
            <Animated.View style={[styles.serviceChip, { opacity: shimmerOpacity }]}>
              <LinearGradient
                colors={['#f0f0f0', '#e0e0e0', '#f0f0f0']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </Animated.View>
          </View>
        </View>

        {/* Price placeholder */}
        <View style={styles.listPrice}>
          <Animated.View style={[styles.priceText, { opacity: shimmerOpacity }]}>
            <LinearGradient
              colors={['#f0f0f0', '#e0e0e0', '#f0f0f0']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </Animated.View>
        </View>
      </View>
    );
  }

  // Grid view
  return (
    <View style={[styles.gridCard, style]}>
      {/* Image placeholder */}
      <Animated.View style={[styles.gridImage, { opacity: shimmerOpacity }]}>
        <LinearGradient
          colors={['#f0f0f0', '#e0e0e0', '#f0f0f0']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
      </Animated.View>

      {/* Content placeholder */}
      <View style={styles.gridContent}>
        {/* Name placeholder */}
        <Animated.View style={[styles.gridTitle, { opacity: shimmerOpacity }]}>
          <LinearGradient
            colors={['#f0f0f0', '#e0e0e0', '#f0f0f0']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
        </Animated.View>

        {/* Location placeholder */}
        <Animated.View style={[styles.gridSubtitle, { opacity: shimmerOpacity }]}>
          <LinearGradient
            colors={['#f0f0f0', '#e0e0e0', '#f0f0f0']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
        </Animated.View>

        {/* Rating placeholder */}
        <Animated.View style={[styles.gridRating, { opacity: shimmerOpacity }]}>
          <LinearGradient
            colors={['#f0f0f0', '#e0e0e0', '#f0f0f0']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
        </Animated.View>

        {/* Price placeholder */}
        <Animated.View style={[styles.gridPrice, { opacity: shimmerOpacity }]}>
          <LinearGradient
            colors={['#f0f0f0', '#e0e0e0', '#f0f0f0']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
        </Animated.View>
      </View>
    </View>
  );
};

export const SearchShimmer: React.FC<SearchShimmerProps> = ({ 
  viewMode = 'grid', 
  count = 6 
}) => {
  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, index) => (
        <ShimmerCard
          key={index}
          viewMode={viewMode}
          style={viewMode === 'grid' ? styles.gridCardSpacing : styles.listCardSpacing}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  // List view styles
  listCard: {
    width: '100%',
    height: 120,
    backgroundColor: designTokens.colors.semantic.surface,
    borderRadius: designTokens.borderRadius.components.card,
    flexDirection: 'row',
    overflow: 'hidden',
    ...designTokens.shadows.md,
  },
  listCardSpacing: {
    marginBottom: 16,
  },
  listImage: {
    width: 100,
    height: '100%',
    backgroundColor: '#f0f0f0',
  },
  listContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  listTitle: {
    width: '80%',
    height: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginBottom: 8,
  },
  listSubtitle: {
    width: '60%',
    height: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginBottom: 8,
  },
  listRating: {
    width: '50%',
    height: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginBottom: 8,
  },
  listServices: {
    flexDirection: 'row',
    gap: 8,
  },
  serviceChip: {
    width: 60,
    height: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
  },
  listPrice: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  priceText: {
    width: 50,
    height: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
  },

  // Grid view styles
  gridCard: {
    width: (width - 60) / 2, // Account for padding and gap
    backgroundColor: designTokens.colors.semantic.surface,
    borderRadius: designTokens.borderRadius.components.card,
    overflow: 'hidden',
    ...designTokens.shadows.md,
  },
  gridCardSpacing: {
    margin: 5,
  },
  gridImage: {
    width: '100%',
    height: 150,
    backgroundColor: '#f0f0f0',
  },
  gridContent: {
    padding: 12,
  },
  gridTitle: {
    width: '90%',
    height: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginBottom: 8,
  },
  gridSubtitle: {
    width: '70%',
    height: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginBottom: 8,
  },
  gridRating: {
    width: '50%',
    height: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginBottom: 8,
  },
  gridPrice: {
    width: '60%',
    height: 14,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
  },
});

export default SearchShimmer; 