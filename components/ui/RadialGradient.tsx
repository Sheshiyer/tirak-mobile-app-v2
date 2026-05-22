import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { designTokens } from '@/constants/design-tokens';

interface RadialGradientProps {
  children?: React.ReactNode;
  style?: ViewStyle;
  variant?: 'primary' | 'secondary' | 'background' | 'surface' | 'accent' | 'drawer' | 'appBackground';
  intensity?: 'light' | 'medium' | 'strong';
  position?: 'top' | 'center' | 'bottom' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
}

export const RadialGradient: React.FC<RadialGradientProps> = ({
  children,
  style,
  variant = 'background',
  intensity = 'light',
  position = 'center',
}) => {
  const getGradientColors = () => {
    const intensityMap = {
      light: { opacity: '08', secondaryOpacity: '04' },
      medium: { opacity: '15', secondaryOpacity: '08' },
      strong: { opacity: '25', secondaryOpacity: '12' },
    };
    
    const { opacity, secondaryOpacity } = intensityMap[intensity];
    
    switch (variant) {
      case 'primary':
        return [
          designTokens.colors.semantic.secondary + opacity,
          designTokens.colors.semantic.primary + secondaryOpacity,
          designTokens.colors.semantic.surface,
        ] as const;
      case 'secondary':
        return [
          designTokens.colors.semantic.secondary + opacity,
          designTokens.colors.semantic.accent + secondaryOpacity,
          'transparent',
        ] as const;
      case 'accent':
        return [
          designTokens.colors.semantic.secondary + opacity,
          designTokens.colors.semantic.primary + secondaryOpacity,
          'transparent',
        ] as const;
      case 'surface':
        return [
          designTokens.colors.semantic.background,
          designTokens.colors.semantic.background,
          designTokens.colors.semantic.surface,
        ] as const;
      case 'drawer':
        return [
          designTokens.colors.semantic.secondary,
          designTokens.colors.semantic.primary,
          designTokens.colors.semantic.primary,
        ] as const;
      case 'appBackground':
        return [
          designTokens.colors.semantic.secondary + '50', // Soft pink with 31% opacity
          designTokens.colors.semantic.primary + '35', // Purple with 21% opacity
          designTokens.colors.semantic.primary + '25', // Deep purple with 15% opacity
        ] as const;
      case 'background':
      default:
        return [
          designTokens.colors.semantic.background,
          designTokens.colors.semantic.surface,
          designTokens.colors.semantic.surface,
        ] as const;
    }
  };

  const getGradientStart = () => {
    // For appBackground, use a more organic positioning
    if (variant === 'appBackground') {
      return { x: 0.2, y: 0.1 }; // Start from top-left area for organic flow
    }

    switch (position) {
      case 'top':
        return { x: 0.5, y: 0 };
      case 'bottom':
        return { x: 0.5, y: 1 };
      case 'topLeft':
        return { x: 0, y: 0 };
      case 'topRight':
        return { x: 1, y: 0 };
      case 'bottomLeft':
        return { x: 0, y: 1 };
      case 'bottomRight':
        return { x: 1, y: 1 };
      case 'center':
      default:
        return { x: 0.5, y: 0.5 };
    }
  };

  const getGradientEnd = () => {
    // For appBackground, use a more organic positioning
    if (variant === 'appBackground') {
      return { x: 0.9, y: 0.8 }; // End at bottom-right area for organic flow
    }

    switch (position) {
      case 'top':
        return { x: 0.5, y: 1 };
      case 'bottom':
        return { x: 0.5, y: 0 };
      case 'topLeft':
        return { x: 1, y: 1 };
      case 'topRight':
        return { x: 0, y: 1 };
      case 'bottomLeft':
        return { x: 1, y: 0 };
      case 'bottomRight':
        return { x: 0, y: 0 };
      case 'center':
      default:
        return { x: 1, y: 1 };
    }
  };

  return (
    <LinearGradient
      colors={getGradientColors()}
      start={getGradientStart()}
      end={getGradientEnd()}
      style={[styles.gradient, style]}
    >
      {children}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
});