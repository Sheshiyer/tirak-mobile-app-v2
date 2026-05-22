import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { designTokens } from '@/constants/design-tokens';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'coral' | 'coralLight' | 'success' | 'error' | 'warning' | 'info' | 'neutral';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  style?: ViewStyle;
  textStyle?: TextStyle;
  outline?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  style,
  textStyle,
  outline = false,
}) => {
  const sizeStyles = {
    xs: {
      paddingHorizontal: designTokens.spacing.scale.xs,
      paddingVertical: designTokens.spacing.scale.xs / 4,
      fontSize: 10,
      borderRadius: designTokens.borderRadius.sm,
    },
    sm: {
      paddingHorizontal: designTokens.spacing.scale.sm,
      paddingVertical: designTokens.spacing.scale.xs / 2,
      fontSize: designTokens.typography.sizes.caption,
      borderRadius: designTokens.borderRadius.sm,
    },
    md: {
      paddingHorizontal: designTokens.spacing.scale.md,
      paddingVertical: designTokens.spacing.scale.xs,
      fontSize: designTokens.typography.sizes.small,
      borderRadius: designTokens.borderRadius.md,
    },
    lg: {
      paddingHorizontal: designTokens.spacing.scale.lg,
      paddingVertical: designTokens.spacing.scale.sm,
      fontSize: designTokens.typography.sizes.base,
      borderRadius: designTokens.borderRadius.lg,
    },
  };

  const currentSize = sizeStyles[size] || sizeStyles.md; // Fallback to 'md' if size is invalid

  const getVariantStyles = () => {
    const variants = {
      primary: {
        backgroundColor: outline ? 'transparent' : designTokens.colors.semantic.primary,
        borderColor: designTokens.colors.semantic.primary,
        color: outline ? designTokens.colors.semantic.primary : designTokens.colors.semantic.surface,
      },
      secondary: {
        backgroundColor: outline ? 'transparent' : designTokens.colors.semantic.secondary,
        borderColor: designTokens.colors.semantic.secondary,
        color: outline ? designTokens.colors.semantic.secondary : designTokens.colors.semantic.surface,
      },
      coral: {
        backgroundColor: outline ? 'transparent' : designTokens.colors.semantic.accent,
        borderColor: designTokens.colors.semantic.accent,
        color: outline ? designTokens.colors.semantic.accent : designTokens.colors.semantic.surface,
      },
      coralLight: {
        backgroundColor: outline ? 'transparent' : designTokens.colors.semantic.background,
        borderColor: designTokens.colors.semantic.accent,
        color: outline ? designTokens.colors.semantic.accent : designTokens.colors.semantic.text,
      },
      success: {
        backgroundColor: outline ? 'transparent' : designTokens.colors.semantic.success,
        borderColor: designTokens.colors.semantic.success,
        color: outline ? designTokens.colors.semantic.success : designTokens.colors.semantic.surface,
      },
      error: {
        backgroundColor: outline ? 'transparent' : designTokens.colors.semantic.error,
        borderColor: designTokens.colors.semantic.error,
        color: outline ? designTokens.colors.semantic.error : designTokens.colors.semantic.surface,
      },
      warning: {
        backgroundColor: outline ? 'transparent' : designTokens.colors.semantic.accent,
        borderColor: designTokens.colors.semantic.accent,
        color: outline ? designTokens.colors.semantic.accent : designTokens.colors.semantic.surface,
      },
      info: {
        backgroundColor: outline ? 'transparent' : designTokens.colors.semantic.info,
        borderColor: designTokens.colors.semantic.info,
        color: outline ? designTokens.colors.semantic.info : designTokens.colors.semantic.surface,
      },
      neutral: {
        backgroundColor: outline ? 'transparent' : designTokens.colors.semantic.background,
        borderColor: designTokens.colors.semantic.border,
        color: outline ? designTokens.colors.semantic.textSecondary : designTokens.colors.semantic.text,
      },
    };

    return variants[variant];
  };

  const variantStyles = getVariantStyles();

  return (
    <View
      style={[
        styles.badge,
        {
          paddingHorizontal: currentSize.paddingHorizontal,
          paddingVertical: currentSize.paddingVertical,
          borderRadius: currentSize.borderRadius,
          backgroundColor: variantStyles.backgroundColor,
          borderWidth: outline ? 1 : 0,
          borderColor: variantStyles.borderColor,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            fontSize: currentSize.fontSize,
            color: variantStyles.color,
          },
          textStyle,
        ]}
      >
        {children}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontWeight: '500',
    textAlign: 'center',
  },
});