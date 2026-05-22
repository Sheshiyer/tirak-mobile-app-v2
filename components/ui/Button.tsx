import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacityProps,
  ViewStyle,
  TextStyle,
  StyleProp,
  View,
  ColorValue,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { designTokens } from '@/constants/design-tokens';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'coral' | 'outline' | 'coralOutline' | 'text' | 'white' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  fullWidth?: boolean;
  size?: 'small' | 'medium' | 'large';
  icon?: React.ReactNode;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  textStyle,
  fullWidth = false,
  size = 'medium',
  icon,
  leftIcon,
  rightIcon,
  onPressIn: externalPressIn,
  onPressOut: externalPressOut,
  ...props
}) => {
  const pressScale = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  const handlePressIn = (e: any) => {
    pressScale.value = withSpring(0.96, { damping: 15, stiffness: 400 });
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    externalPressIn?.(e);
  };

  const handlePressOut = (e: any) => {
    pressScale.value = withSpring(1, { damping: 15, stiffness: 400 });
    externalPressOut?.(e);
  };
  const sizeStyles = {
    small: {
      minHeight: 44,
      paddingHorizontal: designTokens.spacing.scale.md,
      fontSize: designTokens.typography.sizes.caption,
      borderRadius: designTokens.borderRadius.components.button,
    },
    medium: {
      minHeight: 50,
      paddingHorizontal: designTokens.spacing.scale.lg,
      fontSize: designTokens.typography.sizes.body,
      borderRadius: designTokens.borderRadius.components.button,
    },
    large: {
      minHeight: 56,
      paddingHorizontal: designTokens.spacing.scale.xl,
      fontSize: designTokens.typography.sizes.large,
      borderRadius: designTokens.borderRadius.components.button,
    },
  };

  const currentSize = sizeStyles[size];
  const isPrimary = variant === 'primary';
  const isCoral = variant === 'coral';
  const isSecondary = variant === 'secondary';
  const isOutline = variant === 'outline';
  const isText = variant === 'text';
  const isWhite = variant === 'white';
  const isGhost = variant === 'ghost';

  const getButtonStyle = () => {
    const baseStyle = {
      height: currentSize.minHeight,
      minHeight: currentSize.minHeight,
      maxHeight: currentSize.minHeight,
      paddingHorizontal: currentSize.paddingHorizontal,
      borderRadius: currentSize.borderRadius,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    };

    switch (variant) {
      case 'secondary':
        return {
          ...baseStyle,
          ...styles.secondaryButton,
          // shadowColor: designTokens.shadows.sm.shadowColor,
          // shadowOffset: designTokens.shadows.sm.shadowOffset,
          // shadowOpacity: designTokens.shadows.sm.shadowOpacity,
          // shadowRadius: designTokens.shadows.sm.shadowRadius,
          // elevation: designTokens.shadows.sm.elevation,
        };
      case 'coral':
        return {
          ...baseStyle,
          ...styles.coralButton,
          // shadowColor: designTokens.shadows.sm.shadowColor,
          // shadowOffset: designTokens.shadows.sm.shadowOffset,
          // shadowOpacity: designTokens.shadows.sm.shadowOpacity,
          // shadowRadius: designTokens.shadows.sm.shadowRadius,
          // elevation: designTokens.shadows.sm.elevation,
        };
      case 'outline':
        return { ...baseStyle, ...styles.outlineButton };
      case 'coralOutline':
        return { ...baseStyle, ...styles.coralOutlineButton };
      case 'text':
        return { ...baseStyle, ...styles.textButton };
      case 'white':
        return {
          ...baseStyle,
          ...styles.whiteButton,
          // shadowColor: designTokens.shadows.md.shadowColor,
          // shadowOffset: designTokens.shadows.md.shadowOffset,
          // shadowOpacity: designTokens.shadows.md.shadowOpacity,
          // shadowRadius: designTokens.shadows.md.shadowRadius,
          // elevation: designTokens.shadows.md.elevation,
        };
      case 'ghost':
        return { ...baseStyle, ...styles.ghostButton };
      default:
        return {
          ...baseStyle,
          // shadowColor: designTokens.shadows.sm.shadowColor,
          // shadowOffset: designTokens.shadows.sm.shadowOffset,
          // shadowOpacity: designTokens.shadows.sm.shadowOpacity,
          // shadowRadius: designTokens.shadows.sm.shadowRadius,
          // elevation: designTokens.shadows.sm.elevation,
        };
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'outline':
        return designTokens.colors.semantic.primary;
      case 'coralOutline':
        return designTokens.colors.semantic.accent;
      case 'text':
        return designTokens.colors.semantic.primary;
      case 'white':
        return designTokens.colors.semantic.primary;
      case 'ghost':
        return designTokens.colors.semantic.textSecondary;
      default:
        return designTokens.colors.semantic.surface;
    }
  };

  const renderContent = () => (
    <View style={styles.contentContainer}>
      {(leftIcon || icon) && !loading && (
        <View style={{ marginRight: designTokens.spacing.scale.xs }}>
          {leftIcon || icon}
        </View>
      )}
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <Text
          style={[
            styles.text,
            {
              fontSize: currentSize.fontSize,
              color: getTextColor(),
            },
            textStyle,
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit={false}
          ellipsizeMode="tail"
        >
          {title}
        </Text>
      )}
      {rightIcon && !loading && (
        <View style={{ marginLeft: designTokens.spacing.scale.xs }}>
          {rightIcon}
        </View>
      )}
    </View>
  );

  if (isPrimary || isCoral) {
    const gradientColors = isCoral ? designTokens.gradients.accent : designTokens.gradients.primary;

    return (
      <Animated.View style={[fullWidth && styles.fullWidth, pressStyle, style]}>
        <TouchableOpacity
          style={[
            styles.button,
            getButtonStyle(),
            fullWidth && styles.fullWidth,
            disabled && styles.disabled,
            Platform.OS === 'web' && styles.webButton,
          ]}
          disabled={disabled || loading}
          activeOpacity={1}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          {...props}
        >
          <LinearGradient
            colors={gradientColors as [ColorValue, ColorValue, ...ColorValue[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.gradient,
              { borderRadius: currentSize.borderRadius },
              fullWidth && styles.fullWidth,
              Platform.OS === 'web' && styles.webGradient,
            ]}
          >
            {renderContent()}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[fullWidth && styles.fullWidth, pressStyle, style]}>
      <TouchableOpacity
        style={[
          styles.button,
          getButtonStyle(),
          fullWidth && styles.fullWidth,
          disabled && styles.disabled,
          Platform.OS === 'web' && styles.webButton,
        ]}
        disabled={disabled || loading}
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        {...props}
      >
        {renderContent()}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    flexShrink: 0,
  },
  webButton: {
    cursor: 'pointer' as any,
    userSelect: 'none' as any,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradient: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  webGradient: {
    pointerEvents: 'none' as any,
  },
  secondaryButton: {
    backgroundColor: designTokens.colors.semantic.secondary,
  },
  coralButton: {
    backgroundColor: designTokens.colors.semantic.accent,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: designTokens.colors.semantic.primary,
  },
  coralOutlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: designTokens.colors.semantic.accent,
  },
  textButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
  },
  whiteButton: {
    backgroundColor: designTokens.colors.semantic.surface,
  },
  ghostButton: {
    backgroundColor: designTokens.colors.semantic.primary + '15',
  },
  text: {
    ...designTokens.typography.styles.body,
    fontWeight: designTokens.typography.weights.semibold,
    textAlign: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.6,
  },
});
