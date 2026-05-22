import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { designTokens } from '@/constants/design-tokens';

interface TaglineProps {
  size?: 'small' | 'medium' | 'large';
  variant?: 'light' | 'dark';
}

export const Tagline: React.FC<TaglineProps> = ({ 
  size = 'medium',
  variant = 'dark',
}) => {
  const fontSize = size === 'small' ? 12 : size === 'medium' ? 16 : 20;
  const color = variant === 'light' ? designTokens.colors.semantic.surface : designTokens.colors.semantic.primary;
  
  return (
    <Text style={[styles.tagline, { fontSize, color }]}>
      Authentic experiences. Local moments.
    </Text>
  );
};

const styles = StyleSheet.create({
  tagline: {
    textAlign: 'center',
    fontWeight: '500',
    opacity: 0.9,
  },
});