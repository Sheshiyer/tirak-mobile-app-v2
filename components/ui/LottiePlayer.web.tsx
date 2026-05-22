import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Check } from 'lucide-react-native';
import { designTokens } from '@/constants/design-tokens';
import type { LottieKey } from './LottiePlayer';

interface LottiePlayerProps {
  name: LottieKey;
  autoPlay?: boolean;
  loop?: boolean;
  style?: ViewStyle;
  speed?: number;
  onAnimationFinish?: () => void;
}

export const LottiePlayer: React.FC<LottiePlayerProps> = ({
  name,
  style,
  onAnimationFinish,
}) => {
  React.useEffect(() => {
    onAnimationFinish?.();
  }, [onAnimationFinish]);

  if (name === 'bookingSuccess') {
    return (
      <View style={[styles.default, styles.success, style]}>
        <Check size={72} color={designTokens.colors.semantic.surface} strokeWidth={3} />
      </View>
    );
  }

  return <View style={[styles.default, styles.placeholder, style]} />;
};

const styles = StyleSheet.create({
  default: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  success: {
    borderRadius: 100,
    backgroundColor: designTokens.colors.semantic.primary,
  },
  placeholder: {
    borderRadius: 16,
    backgroundColor: designTokens.colors.semantic.surface,
  },
});
