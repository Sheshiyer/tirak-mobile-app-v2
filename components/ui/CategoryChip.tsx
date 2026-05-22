import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, ViewStyle } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { designTokens } from '@/constants/design-tokens';

interface CategoryChipProps {
  title: string;
  icon?: string | React.ReactNode;
  iconComponent?: LucideIcon;
  selected?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  size?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'coral' | 'purple';
}

export const CategoryChip: React.FC<CategoryChipProps> = ({
  title,
  icon,
  iconComponent: IconComponent,
  selected = false,
  onPress,
  style,
  size = 'medium',
  variant = 'default',
}) => {
  const sizeStyles = {
    small: { paddingHorizontal: designTokens.spacing.scale.xs, paddingVertical: 4, fontSize: designTokens.typography.sizes.xs },
    medium: { paddingHorizontal: designTokens.spacing.scale.sm, paddingVertical: designTokens.spacing.scale.xs, fontSize: designTokens.typography.sizes.sm },
    large: { paddingHorizontal: designTokens.spacing.scale.md, paddingVertical: designTokens.spacing.scale.sm, fontSize: designTokens.typography.sizes.base },
  };

  const getVariantStyles = () => {
    if (selected) {
      switch (variant) {
        case 'coral':
          return {
            backgroundColor: designTokens.colors.semantic.accent,
            borderColor: designTokens.colors.semantic.accent,
          };
        case 'purple':
          return {
            backgroundColor: designTokens.colors.semantic.primary,
            borderColor: designTokens.colors.semantic.primary,
          };
        default:
          return {
            backgroundColor: designTokens.colors.semantic.accent,
            borderColor: designTokens.colors.semantic.accent,
          };
      }
    } else {
      switch (variant) {
        case 'coral':
          return {
            backgroundColor: designTokens.colors.semantic.accent + '20',
            borderColor: designTokens.colors.semantic.accent,
          };
        case 'purple':
          return {
            backgroundColor: designTokens.colors.semantic.surface,
            borderColor: designTokens.colors.semantic.primary,
          };
        default:
          return {
            backgroundColor: designTokens.colors.semantic.surface,
            borderColor: designTokens.colors.semantic.border,
          };
      }
    }
  };

  const getTextColor = () => {
    if (selected) {
      return designTokens.colors.semantic.surface;
    } else {
      switch (variant) {
        case 'coral':
          return designTokens.colors.semantic.accent;
        case 'purple':
          return designTokens.colors.semantic.primary;
        default:
          return designTokens.colors.semantic.text;
      }
    }
  };

  const variantStyles = getVariantStyles();
  const textColor = getTextColor();

  return (
    <TouchableOpacity
      style={[
        styles.chip,
        variantStyles,
        sizeStyles[size],
        style,
      ]}
      onPress={onPress}
    >
      {IconComponent ? (
        <View style={styles.iconWrapper}>
          <IconComponent size={14} color={textColor} />
        </View>
      ) : icon && typeof icon === 'string' ? (
        <Text style={[styles.icon, { color: textColor }]}>{icon}</Text>
      ) : icon ? (
        <View style={styles.iconWrapper}>{icon}</View>
      ) : null}
      <Text
        style={[
          styles.text,
          { fontSize: sizeStyles[size].fontSize, color: textColor },
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: designTokens.borderRadius.full,
    borderWidth: 1,
    ...designTokens.shadows.xs,
  },
  icon: {
    fontSize: 16,
    marginRight: designTokens.spacing.scale.xs,
  },
  iconWrapper: {
    marginRight: designTokens.spacing.scale.xs,
  },
  text: {
    fontWeight: designTokens.typography.weights.medium,
  },
});