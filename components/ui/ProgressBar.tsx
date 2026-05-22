import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { designTokens } from '@/constants/design-tokens';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  labels?: string[];
  showLabels?: boolean;
  variant?: 'default' | 'gradient';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  currentStep,
  totalSteps,
  labels = [],
  showLabels = false,
  variant = 'gradient',
}) => {
  const animationValues = useRef(
    Array.from({ length: totalSteps }, () => new Animated.Value(0))
  ).current;

  const gradientAnimations = useRef(
    Array.from({ length: totalSteps - 1 }, () => new Animated.Value(0))
  ).current;

  const pulseAnimations = useRef(
    Array.from({ length: totalSteps }, () => new Animated.Value(1))
  ).current;

  useEffect(() => {
    // Animate circles with staggered timing
    const circleAnimations = animationValues.map((anim, index) => {
      if (index + 1 <= currentStep) {
        return Animated.timing(anim, {
          toValue: 1,
          duration: 600,
          delay: index * 100,
          easing: Easing.bezier(0.25, 0.46, 0.45, 0.94), // Cubic bezier for organic feel
          useNativeDriver: true,
        });
      } else {
        return Animated.timing(anim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        });
      }
    });

    // Animate connecting lines with fluid physics
    const lineAnimations = gradientAnimations.map((anim, index) => {
      if (index + 1 < currentStep) {
        return Animated.timing(anim, {
          toValue: 1,
          duration: 800,
          delay: (index + 1) * 150,
          easing: Easing.bezier(0.4, 0.0, 0.2, 1), // Material design easing
          useNativeDriver: false, // Width animation requires native driver false
        });
      } else {
        return Animated.timing(anim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: false,
        });
      }
    });

    // Pulse animation for current step
    const currentStepPulse = currentStep <= totalSteps ?
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimations[currentStep - 1], {
            toValue: 1.15,
            duration: 1000,
            easing: Easing.bezier(0.4, 0.0, 0.6, 1),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimations[currentStep - 1], {
            toValue: 1,
            duration: 1000,
            easing: Easing.bezier(0.4, 0.0, 0.6, 1),
            useNativeDriver: true,
          }),
        ])
      ) : null;

    // Execute animations
    Animated.parallel([
      ...circleAnimations,
      ...lineAnimations,
    ]).start();

    if (currentStepPulse) {
      currentStepPulse.start();
    }

    // Cleanup pulse animation
    return () => {
      if (currentStepPulse) {
        currentStepPulse.stop();
      }
    };
  }, [currentStep]);

  return (
    <View style={styles.container}>
      <View style={styles.progressContainer}>
        {Array.from({ length: totalSteps }).map((_, index) => {
          const isActive = index + 1 <= currentStep;
          const isCurrent = index + 1 === currentStep;
          const isLast = index === totalSteps - 1;

          return (
            <View key={index} style={styles.stepContainer}>
              <Animated.View
                style={[
                  styles.circleWrapper,
                  {
                    transform: [
                      { scale: isCurrent ? pulseAnimations[index] : 1 },
                      {
                        scale: animationValues[index].interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.7, 1],
                        }),
                      },
                    ],
                    opacity: animationValues[index],
                  },
                ]}
              >
                {variant === 'gradient' && isActive ? (
                  <LinearGradient
                    colors={designTokens.gradients.primary}
                    style={[styles.circle, styles.gradientCircle]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.stepNumber}>{index + 1}</Text>
                  </LinearGradient>
                ) : (
                  <View
                    style={[
                      styles.circle,
                      isActive ? styles.activeCircle : styles.inactiveCircle,
                    ]}
                  >
                    {isActive && <Text style={styles.stepNumber}>{index + 1}</Text>}
                  </View>
                )}
              </Animated.View>

              {!isLast && (
                <View style={styles.lineContainer}>
                  <View style={styles.lineBackground} />
                  {variant === 'gradient' && index + 1 < currentStep && (
                    <Animated.View
                      style={[
                        styles.lineOverlay,
                        {
                          width: gradientAnimations[index].interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0%', '100%'],
                          }),
                        },
                      ]}
                    >
                      <LinearGradient
                        colors={designTokens.gradients.primary}
                        style={styles.gradientLine}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      />
                    </Animated.View>
                  )}
                </View>
              )}
            </View>
          );
        })}
      </View>

      {showLabels && labels.length > 0 && (
        <View style={styles.labelsContainer}>
          {labels.map((label, index) => (
            <Text
              key={index}
              style={[
                styles.label,
                index + 1 === currentStep && styles.activeLabel,
              ]}
              numberOfLines={1}
            >
              {label}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: designTokens.spacing.scale.lg,
    paddingVertical: designTokens.spacing.scale.md,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: designTokens.spacing.scale.md,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    maxWidth: 60, // Constrain width for better centering
  },
  circleWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    ...designTokens.shadows.md,
  },
  gradientCircle: {
    borderWidth: 2,
    borderColor: designTokens.colors.semantic.surface,
  },
  activeCircle: {
    backgroundColor: designTokens.colors.semantic.accent,
    borderWidth: 2,
    borderColor: designTokens.colors.semantic.surface,
  },
  inactiveCircle: {
    backgroundColor: designTokens.colors.semantic.border,
    borderWidth: 1,
    borderColor: designTokens.colors.semantic.border,
  },
  stepNumber: {
    ...designTokens.typography.styles.caption,
    color: designTokens.colors.semantic.surface,
    fontWeight: designTokens.typography.weights.bold,
    fontSize: designTokens.typography.sizes.small,
  },
  lineContainer: {
    flex: 1,
    height: 4,
    marginHorizontal: designTokens.spacing.scale.xs,
    position: 'relative',
    borderRadius: designTokens.borderRadius.components.chip,
    overflow: 'hidden',
  },
  lineBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: designTokens.colors.semantic.border,
    borderRadius: designTokens.borderRadius.components.chip,
  },
  lineOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    borderRadius: designTokens.borderRadius.components.chip,
    overflow: 'hidden',
  },
  gradientLine: {
    flex: 1,
    borderRadius: designTokens.borderRadius.components.chip,
  },
  labelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: designTokens.spacing.scale.sm,
    paddingHorizontal: designTokens.spacing.scale.md,
  },
  label: {
    ...designTokens.typography.styles.caption,
    color: designTokens.colors.semantic.textSecondary,
    textAlign: 'center',
    flex: 1,
    fontSize: designTokens.typography.sizes.small,
  },
  activeLabel: {
    color: designTokens.colors.semantic.accent,
    fontWeight: designTokens.typography.weights.semibold,
  },
});