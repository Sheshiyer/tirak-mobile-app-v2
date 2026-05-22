import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { ColorValue } from 'react-native';
import { designTokens } from '@/constants/design-tokens';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'gradient' | 'coral' | 'purple';
  color?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  variant = 'default',
  color = designTokens.colors.semantic.primary,
}) => {
  const getGradientColors = () => {
    switch (variant) {
      case 'coral':
        return [designTokens.colors.semantic.accent, designTokens.colors.semantic.secondary];
      case 'purple':
        return [designTokens.colors.semantic.primary, designTokens.colors.semantic.secondary];
      case 'gradient':
        return [designTokens.colors.semantic.accent, designTokens.colors.semantic.primary];
      default:
        return null;
    }
  };

  const getAccentColor = () => {
    switch (variant) {
      case 'coral':
        return designTokens.colors.semantic.accent;
      case 'purple':
        return designTokens.colors.semantic.primary;
      default:
        return color;
    }
  };

  const isGradientVariant = variant !== 'default';
  const gradientColors = getGradientColors();
  const accentColor = getAccentColor();

  const cardContent = (
    <>
      <View style={styles.content}>
        <Text style={[styles.title, isGradientVariant && styles.titleGradient]}>{title}</Text>
        <View style={styles.valueContainer}>
          <Text style={[styles.value, isGradientVariant && styles.valueGradient]}>{value}</Text>
          {trend && (
            <View style={[
              styles.trendContainer,
              { backgroundColor: trend.isPositive ? designTokens.colors.semantic.accent + '20' : designTokens.colors.semantic.error + '20' }
            ]}>
              <Text style={[
                styles.trendValue,
                { color: trend.isPositive ? designTokens.colors.semantic.accent : designTokens.colors.semantic.error }
              ]}>
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </Text>
            </View>
          )}
        </View>
        {subtitle && <Text style={[styles.subtitle, isGradientVariant && styles.subtitleGradient]}>{subtitle}</Text>}
      </View>
      {icon && (
        <View style={[
          styles.iconContainer,
          isGradientVariant && styles.iconContainerGradient,
          { backgroundColor: isGradientVariant ? 'rgba(255,255,255,0.2)' : designTokens.colors.semantic.background }
        ]}>
          {icon}
        </View>
      )}
    </>
  );

  if (isGradientVariant && gradientColors) {
    return (
      <LinearGradient
        colors={gradientColors as [ColorValue, ColorValue]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.container, styles.gradientContainer]}
      >
        {cardContent}
      </LinearGradient>
    );
  }

  return (
    <View style={[styles.container, { borderLeftColor: accentColor }]}>
      {cardContent}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: designTokens.colors.semantic.surface,
    borderRadius: designTokens.borderRadius.lg,
    padding: designTokens.spacing.scale.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderLeftWidth: 4,
    shadowColor: designTokens.colors.semantic.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gradientContainer: {
    backgroundColor: 'transparent',
    borderLeftWidth: 0,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: designTokens.typography.sizes.small,
    color: designTokens.colors.semantic.textSecondary,
    marginBottom: designTokens.spacing.scale.xs,
    fontWeight: '500',
  },
  titleGradient: {
    color: designTokens.colors.semantic.surface,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.scale.xs,
  },
  value: {
    fontSize: designTokens.typography.sizes.large,
    fontWeight: '700',
    color: designTokens.colors.semantic.text,
  },
  valueGradient: {
    color: designTokens.colors.semantic.surface,
  },
  subtitle: {
    fontSize: designTokens.typography.sizes.xs,
    color: designTokens.colors.semantic.textSecondary,
    marginTop: designTokens.spacing.scale.xs,
  },
  subtitleGradient: {
    color: 'rgba(255,255,255,0.8)',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: designTokens.colors.semantic.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainerGradient: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  trendContainer: {
    paddingHorizontal: designTokens.spacing.scale.xs,
    paddingVertical: 4,
    borderRadius: designTokens.borderRadius.md,
  },
  trendValue: {
    fontSize: designTokens.typography.sizes.xs,
    fontWeight: designTokens.typography.weights.bold,
  },
});
