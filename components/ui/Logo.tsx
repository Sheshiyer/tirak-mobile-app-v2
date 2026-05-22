import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { designTokens } from '@/constants/design-tokens';

interface LogoProps {
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  showText?: boolean;
  variant?: 'light' | 'dark';
}

export const Logo: React.FC<LogoProps> = ({ 
  size = 'medium',
  showText = true,
  variant = 'light',
}) => {
  const sizeMap = {
    small: { logo: 30, text: 20 },
    medium: { logo: 50, text: 32 },
    large: { logo: 70, text: 42 },
    xlarge: { logo: 100, text: 56 },
  };
  
  const { logo: logoSize, text: textSize } = sizeMap[size];
  const textColor = variant === 'light' ? designTokens.colors.semantic.surface : designTokens.colors.semantic.primary;
  
  return (
    <View style={styles.container}>
      <View style={[styles.logoContainer, { width: logoSize, height: logoSize }]}>
        <LinearGradient
          colors={[designTokens.colors.semantic.secondary, designTokens.colors.semantic.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradient, { borderRadius: logoSize * 0.3 }]}
        >
          <View style={styles.logoInner}>
            {/* Butterfly/Heart symbol */}
            <View style={[styles.wing, styles.leftWing]} />
            <View style={[styles.wing, styles.rightWing]} />
            <View style={styles.center} />
          </View>
        </LinearGradient>
      </View>
      
      {showText && (
        <Text style={[styles.logoText, { fontSize: textSize, color: textColor }]}>
          tirak
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  logoContainer: {
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: designTokens.colors.semantic.surface,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  gradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoInner: {
    width: '70%',
    height: '70%',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  wing: {
    position: 'absolute',
    width: '45%',
    height: '60%',
    backgroundColor: designTokens.colors.semantic.surface,
    borderRadius: 20,
    opacity: 0.9,
  },
  leftWing: {
    left: '5%',
    top: '10%',
    transform: [{ rotate: '-15deg' }],
  },
  rightWing: {
    right: '5%',
    top: '10%',
    transform: [{ rotate: '15deg' }],
  },
  center: {
    width: '20%',
    height: '30%',
    backgroundColor: designTokens.colors.semantic.surface,
    borderRadius: 10,
    opacity: 0.9,
  },
  logoText: {
    fontWeight: '700',
    letterSpacing: 1,
  },
});