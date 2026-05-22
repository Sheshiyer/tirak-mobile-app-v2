import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Animated } from 'react-native';
import { designTokens } from '@/constants/design-tokens';

export interface LoadingStateProps {
  message?: string;
  size?: 'small' | 'large';
  color?: string;
  style?: any;
  showMessage?: boolean;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  size = 'large',
  color = designTokens.colors.semantic.primary,
  style,
  showMessage = true,
}) => {
  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator 
        size={size} 
        color={color}
        style={styles.spinner}
      />
      {showMessage && (
        <Text style={[styles.message, { color }]}>
          {message}
        </Text>
      )}
    </View>
  );
};

export const LoadingOverlay: React.FC<LoadingStateProps> = (props) => {
  return (
    <View style={styles.overlay}>
      <View style={styles.overlayContent}>
        <LoadingState {...props} />
      </View>
    </View>
  );
};

export const LoadingSpinner: React.FC<{ size?: 'small' | 'large'; color?: string }> = ({
  size = 'small',
  color = designTokens.colors.semantic.primary,
}) => {
  return <ActivityIndicator size={size} color={color} />;
};

export const LoadingDots: React.FC<{ color?: string }> = ({ color = designTokens.colors.semantic.primary }) => {
  const [currentDot, setCurrentDot] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDot((prev) => (prev + 1) % 3);
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.dotsContainer}>
      {[0, 1, 2].map((index) => (
        <View
          key={index}
          style={[
            styles.dot,
            {
              backgroundColor: currentDot === index ? color : designTokens.colors.semantic.border,
            },
          ]}
        />
      ))}
    </View>
  );
};

export const LoadingPulse: React.FC<{ color?: string; size?: number }> = ({
  color = designTokens.colors.semantic.primary,
  size = 40,
}) => {
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    const pulse = () => {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start(() => pulse());
    };

    pulse();
  }, []);

  return (
    <Animated.View
      style={[
        styles.pulse,
        {
          width: size,
          height: size,
          backgroundColor: color + '30',
          transform: [{ scale: pulseAnim }],
        },
      ]}
    >
      <View
        style={[
          styles.pulseInner,
          {
            backgroundColor: color,
          },
        ]}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: designTokens.spacing.scale.md,
  },
  spinner: {
    marginBottom: designTokens.spacing.scale.md,
  },
  message: {
    fontSize: designTokens.typography.sizes.body,
    fontWeight: designTokens.typography.weights.medium,
    textAlign: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: designTokens.colors.semantic.background,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9998,
  },
  overlayContent: {
    backgroundColor: designTokens.colors.semantic.surface,
    borderRadius: 12,
    padding: designTokens.spacing.scale.xl,
    minWidth: 120,
    alignItems: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  pulse: {
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseInner: {
    width: '60%',
    height: '60%',
    borderRadius: 9999,
  },
});