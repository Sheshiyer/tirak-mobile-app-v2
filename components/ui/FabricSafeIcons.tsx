import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { designTokens } from '@/constants/design-tokens';

interface IconProps {
  size?: number;
  color?: string;
  style?: ViewStyle;
}

/**
 * Fabric-Safe Icon Components
 * 
 * These icons use only native React Native View components with borders and backgrounds
 * to avoid ViewManagerDelegate null pointer exceptions in React Native Fabric.
 * 
 * This completely eliminates the need for third-party icon libraries that may have
 * incompatible ViewManager implementations.
 */

export const FabricSafeCalendarIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = designTokens.colors.semantic.primary || '#007AFF',
  style 
}) => (
  <View style={[{ width: size, height: size }, style]}>
    {/* Calendar body */}
    <View style={[
      styles.calendarBody,
      {
        width: size * 0.8,
        height: size * 0.7,
        borderColor: color,
        top: size * 0.15,
        left: size * 0.1,
      }
    ]} />
    {/* Calendar header */}
    <View style={[
      styles.calendarHeader,
      {
        width: size * 0.8,
        height: size * 0.2,
        backgroundColor: color,
        top: size * 0.05,
        left: size * 0.1,
      }
    ]} />
    {/* Calendar rings */}
    <View style={[
      styles.calendarRing,
      {
        width: size * 0.15,
        height: size * 0.15,
        borderColor: color,
        top: -size * 0.05,
        left: size * 0.2,
      }
    ]} />
    <View style={[
      styles.calendarRing,
      {
        width: size * 0.15,
        height: size * 0.15,
        borderColor: color,
        top: -size * 0.2,
        left: size * 0.65,
      }
    ]} />
  </View>
);

export const FabricSafeSettingsIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = designTokens.colors.semantic.accent || '#FF9500',
  style 
}) => (
  <View style={[{ width: size, height: size }, style]}>
    {/* Gear outer circle */}
    <View style={[
      styles.gearOuter,
      {
        width: size * 0.9,
        height: size * 0.9,
        borderColor: color,
        borderRadius: size * 0.45,
        top: size * 0.05,
        left: size * 0.05,
      }
    ]} />
    {/* Gear inner circle */}
    <View style={[
      styles.gearInner,
      {
        width: size * 0.4,
        height: size * 0.4,
        backgroundColor: color,
        borderRadius: size * 0.2,
        top: -size * 0.25,
        left: size * 0.3,
      }
    ]} />
    {/* Gear teeth */}
    <View style={[
      styles.gearTooth,
      {
        width: size * 0.1,
        height: size * 0.2,
        backgroundColor: color,
        top: -size * 0.85,
        left: size * 0.45,
      }
    ]} />
    <View style={[
      styles.gearTooth,
      {
        width: size * 0.2,
        height: size * 0.1,
        backgroundColor: color,
        top: -size * 0.7,
        left: size * 0.8,
      }
    ]} />
  </View>
);

export const FabricSafeTrendingUpIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = designTokens.colors.semantic.success || '#34C759',
  style 
}) => (
  <View style={[{ width: size, height: size }, style]}>
    {/* Trending line */}
    <View style={[
      styles.trendingLine,
      {
        width: size * 0.8,
        height: size * 0.05,
        backgroundColor: color,
        top: size * 0.6,
        left: size * 0.1,
        transform: [{ rotate: '-15deg' }],
      }
    ]} />
    {/* Arrow head */}
    <View style={[
      styles.arrowHead,
      {
        width: size * 0.2,
        height: size * 0.2,
        borderTopColor: color,
        borderRightColor: color,
        top: size * 0.3,
        left: size * 0.7,
        transform: [{ rotate: '45deg' }],
      }
    ]} />
    {/* Data points */}
    <View style={[
      styles.dataPoint,
      {
        width: size * 0.1,
        height: size * 0.1,
        backgroundColor: color,
        borderRadius: size * 0.05,
        top: size * 0.5,
        left: size * 0.2,
      }
    ]} />
    <View style={[
      styles.dataPoint,
      {
        width: size * 0.1,
        height: size * 0.1,
        backgroundColor: color,
        borderRadius: size * 0.05,
        top: size * 0.3,
        left: size * 0.5,
      }
    ]} />
  </View>
);

export const FabricSafePlusIcon: React.FC<IconProps> = ({ 
  size = 20, 
  color = designTokens.colors.semantic.surface || '#FFFFFF',
  style 
}) => (
  <View style={[{ width: size, height: size }, style]}>
    {/* Horizontal line */}
    <View style={[
      styles.plusHorizontal,
      {
        width: size * 0.6,
        height: size * 0.1,
        backgroundColor: color,
        top: size * 0.45,
        left: size * 0.2,
      }
    ]} />
    {/* Vertical line */}
    <View style={[
      styles.plusVertical,
      {
        width: size * 0.1,
        height: size * 0.6,
        backgroundColor: color,
        top: size * 0.2,
        left: size * 0.45,
      }
    ]} />
  </View>
);

export const FabricSafeClockIcon: React.FC<IconProps> = ({ 
  size = 48, 
  color = designTokens.colors.semantic.textSecondary || '#666666',
  style 
}) => (
  <View style={[{ width: size, height: size }, style]}>
    {/* Clock circle */}
    <View style={[
      styles.clockCircle,
      {
        width: size * 0.9,
        height: size * 0.9,
        borderColor: color,
        borderRadius: size * 0.45,
        top: size * 0.05,
        left: size * 0.05,
      }
    ]} />
    {/* Hour hand */}
    <View style={[
      styles.clockHand,
      {
        width: size * 0.05,
        height: size * 0.25,
        backgroundColor: color,
        top: size * 0.25,
        left: size * 0.475,
      }
    ]} />
    {/* Minute hand */}
    <View style={[
      styles.clockHand,
      {
        width: size * 0.03,
        height: size * 0.35,
        backgroundColor: color,
        top: size * 0.15,
        left: size * 0.485,
      }
    ]} />
    {/* Center dot */}
    <View style={[
      styles.clockCenter,
      {
        width: size * 0.08,
        height: size * 0.08,
        backgroundColor: color,
        borderRadius: size * 0.04,
        top: size * 0.46,
        left: size * 0.46,
      }
    ]} />
  </View>
);

export const FabricSafeCheckCircleIcon: React.FC<IconProps> = ({ 
  size = 16, 
  color = designTokens.colors.semantic.success || '#34C759',
  style 
}) => (
  <View style={[{ width: size, height: size }, style]}>
    {/* Circle */}
    <View style={[
      styles.checkCircle,
      {
        width: size,
        height: size,
        borderColor: color,
        borderRadius: size / 2,
      }
    ]} />
    {/* Checkmark */}
    <View style={[
      styles.checkMark,
      {
        width: size * 0.3,
        height: size * 0.05,
        backgroundColor: color,
        top: size * 0.5,
        left: size * 0.2,
        transform: [{ rotate: '45deg' }],
      }
    ]} />
    <View style={[
      styles.checkMark,
      {
        width: size * 0.5,
        height: size * 0.05,
        backgroundColor: color,
        top: size * 0.35,
        left: size * 0.35,
        transform: [{ rotate: '-45deg' }],
      }
    ]} />
  </View>
);

export const FabricSafeXCircleIcon: React.FC<IconProps> = ({ 
  size = 16, 
  color = designTokens.colors.semantic.error || '#FF3B30',
  style 
}) => (
  <View style={[{ width: size, height: size }, style]}>
    {/* Circle */}
    <View style={[
      styles.xCircle,
      {
        width: size,
        height: size,
        borderColor: color,
        borderRadius: size / 2,
      }
    ]} />
    {/* X mark */}
    <View style={[
      styles.xMark,
      {
        width: size * 0.5,
        height: size * 0.05,
        backgroundColor: color,
        top: size * 0.475,
        left: size * 0.25,
        transform: [{ rotate: '45deg' }],
      }
    ]} />
    <View style={[
      styles.xMark,
      {
        width: size * 0.5,
        height: size * 0.05,
        backgroundColor: color,
        top: size * 0.425,
        left: size * 0.25,
        transform: [{ rotate: '-45deg' }],
      }
    ]} />
  </View>
);

const styles = StyleSheet.create({
  // Calendar styles
  calendarBody: {
    position: 'absolute',
    borderWidth: 1.5,
    borderRadius: 2,
  },
  calendarHeader: {
    position: 'absolute',
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  calendarRing: {
    position: 'absolute',
    borderWidth: 1.5,
    borderRadius: 50,
  },
  
  // Settings gear styles
  gearOuter: {
    position: 'absolute',
    borderWidth: 2,
  },
  gearInner: {
    position: 'absolute',
  },
  gearTooth: {
    position: 'absolute',
  },
  
  // Trending styles
  trendingLine: {
    position: 'absolute',
  },
  arrowHead: {
    position: 'absolute',
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderColor: 'transparent',
  },
  dataPoint: {
    position: 'absolute',
  },
  
  // Plus styles
  plusHorizontal: {
    position: 'absolute',
  },
  plusVertical: {
    position: 'absolute',
  },
  
  // Clock styles
  clockCircle: {
    position: 'absolute',
    borderWidth: 2,
  },
  clockHand: {
    position: 'absolute',
  },
  clockCenter: {
    position: 'absolute',
  },
  
  // Check circle styles
  checkCircle: {
    borderWidth: 1.5,
  },
  checkMark: {
    position: 'absolute',
  },
  
  // X circle styles
  xCircle: {
    borderWidth: 1.5,
  },
  xMark: {
    position: 'absolute',
  },
});
