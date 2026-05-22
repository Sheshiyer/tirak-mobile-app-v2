import React from 'react';
import { View, ViewStyle, StyleSheet, StyleProp } from 'react-native';
import { designTokens } from '@/constants/design-tokens';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padding?: keyof typeof designTokens.spacing.scale | number;
  shadow?: keyof typeof designTokens.shadows;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  padding = 'md',
  shadow = 'md',
}) => {
  const paddingValue = typeof padding === 'number' 
    ? padding 
    : designTokens.spacing.scale[padding];

  return (
    <View
      style={[
        styles.card,
        designTokens.shadows[shadow],
        { padding: paddingValue },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: designTokens.colors.semantic.surface,
    borderRadius: designTokens.borderRadius.components.card,
    borderWidth: 1,
    borderColor: designTokens.colors.semantic.border,
  },
});
