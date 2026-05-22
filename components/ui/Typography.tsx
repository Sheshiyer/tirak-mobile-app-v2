import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { designTokens } from '@/constants/design-tokens';

interface TypographyProps extends TextProps {
  variant?: 'heading' | 'subheading' | 'body' | 'caption';
  level?: number;
  color?: string;
  align?: 'left' | 'center' | 'right';
  children: React.ReactNode;
}

export const Typography: React.FC<TypographyProps> = ({
  variant = 'body',
  color = designTokens.colors.semantic.text,
  align = 'left',
  style,
  children,
  ...props
}) => {
  const getVariantStyle = () => {
    switch (variant) {
      case 'heading':
        return designTokens.typography.styles.heading;
      case 'subheading':
        return designTokens.typography.styles.subheading;
      case 'caption':
        return designTokens.typography.styles.caption;
      default:
        return designTokens.typography.styles.body;
    }
  };

  return (
    <Text
      style={[
        styles.base,
        getVariantStyle(),
        { color, textAlign: align },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
};

// Convenience components for common use cases
export const Heading: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="heading" {...props} />
);

export const Subheading: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="subheading" {...props} />
);

export const Body: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="body" {...props} />
);

export const Caption: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="caption" {...props} />
);

const styles = StyleSheet.create({
  base: {
    // Base text styles
  },
});
