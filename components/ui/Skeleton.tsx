import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { designTokens } from '@/constants/design-tokens';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  style?: StyleProp<ViewStyle>;
  borderRadius?: number;
  animated?: boolean;
  variant?: 'default' | 'gradient';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  style,
  borderRadius: customBorderRadius = designTokens.borderRadius.md,
  animated = true,
  variant = 'gradient',
}) => {
  const opacity = useRef(new Animated.Value(0.3)).current;
  const sizeStyle = { width, height } as ViewStyle;

  useEffect(() => {
    if (animated) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.3,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    }
  }, [animated]);

  if (variant === 'gradient') {
    return (
      <Animated.View
        style={[
          {
            ...sizeStyle,
            borderRadius: customBorderRadius,
            opacity: animated ? opacity : 0.3,
            overflow: 'hidden',
          },
          style,
        ]}
      >
        <LinearGradient
          colors={[designTokens.colors.semantic.accent + '40', designTokens.colors.semantic.background, designTokens.colors.semantic.accent + '40']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientSkeleton}
        />
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          ...sizeStyle,
          borderRadius: customBorderRadius,
          opacity: animated ? opacity : 0.3,
        },
        style,
      ]}
    />
  );
};

interface SkeletonTextProps {
  lines?: number;
  style?: ViewStyle;
  lineHeight?: number;
  lastLineWidth?: string;
}

export const SkeletonText: React.FC<SkeletonTextProps> = ({
  lines = 3,
  style,
  lineHeight = 20,
  lastLineWidth = '60%',
}) => {
  return (
    <View style={[styles.textContainer, style]}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          height={lineHeight}
          width={index === lines - 1 ? lastLineWidth : '100%'}
          style={{ marginBottom: index < lines - 1 ? 8 : 0 }}
        />
      ))}
    </View>
  );
};

interface SkeletonCardProps {
  style?: ViewStyle;
  showAvatar?: boolean;
  showImage?: boolean;
  imageHeight?: number;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  style,
  showAvatar = false,
  showImage = false,
  imageHeight = 200,
}) => {
  return (
    <View style={[styles.card, style]}>
      {showImage && (
        <Skeleton
          height={imageHeight}
          style={{ marginBottom: 16 }}
          borderRadius={designTokens.borderRadius.lg}
        />
      )}
      
      {showAvatar && (
        <View style={styles.avatarRow}>
          <Skeleton
            width={40}
            height={40}
            borderRadius={20}
            style={{ marginRight: 12 }}
          />
          <View style={{ flex: 1 }}>
            <Skeleton height={16} width="60%" style={{ marginBottom: 8 }} />
            <Skeleton height={14} width="40%" />
          </View>
        </View>
      )}
      
      <SkeletonText lines={3} />
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: designTokens.colors.semantic.background,
  },
  gradientSkeleton: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  textContainer: {
    width: '100%',
  },
  card: {
    backgroundColor: designTokens.colors.semantic.surface,
    padding: designTokens.spacing.scale.md,
    borderRadius: designTokens.borderRadius.xl,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: designTokens.spacing.scale.md,
  },
});
