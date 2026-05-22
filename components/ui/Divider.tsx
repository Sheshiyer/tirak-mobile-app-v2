import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { designTokens } from '@/constants/design-tokens';

interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  thickness?: number;
  color?: string;
  style?: ViewStyle;
  margin?: keyof typeof designTokens.spacing.scale | number;
  variant?: 'default' | 'coral' | 'subtle';
}

export const Divider: React.FC<DividerProps> = ({
  orientation = 'horizontal',
  thickness = 1,
  color,
  style,
  margin = 'md',
  variant = 'default',
}) => {
  const marginValue = typeof margin === 'number' ? margin : designTokens.spacing.scale[margin as keyof typeof designTokens.spacing.scale];

  const getColor = () => {
    if (color) return color;

    switch (variant) {
      case 'coral':
        return designTokens.colors.semantic.accent + '40'; // coral with opacity
      case 'subtle':
        return designTokens.colors.semantic.accent;
      default:
        return designTokens.colors.semantic.border;
    }
  };

  const dividerStyle = orientation === 'horizontal'
    ? {
        height: thickness,
        width: '100%',
        marginVertical: marginValue,
      }
    : {
        width: thickness,
        height: '100%',
        marginHorizontal: marginValue,
      };

  return (
    <View
      style={[
        styles.divider,
        dividerStyle as ViewStyle,
        { backgroundColor: getColor() },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  divider: {
    backgroundColor: designTokens.colors.semantic.border,
  },
});