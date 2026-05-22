import { logger } from '@/utils/logger';
import React, { memo, useState, useEffect } from 'react';
import { View, Platform, ViewStyle, ColorValue } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface SafeLinearGradientProps {
  colors: [ColorValue, ColorValue, ...ColorValue[]] | string[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  style?: ViewStyle;
  children?: React.ReactNode;
}

/**
 * SafeLinearGradient wrapper to prevent ViewManagerDelegate crashes
 * Falls back to solid color background if LinearGradient fails
 */
const SafeLinearGradientComponent: React.FC<SafeLinearGradientProps> = ({
  colors,
  start = { x: 0, y: 0 },
  end = { x: 1, y: 0 },
  style,
  children,
}) => {
  const gradientColors = colors.length >= 2
    ? colors as [ColorValue, ColorValue, ...ColorValue[]]
    : [colors[0] || '#007AFF', colors[0] || '#007AFF'] as [ColorValue, ColorValue];
  const [shouldUseFallback, setShouldUseFallback] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // For Android production, add mounting delay to prevent race conditions
  useEffect(() => {
    if (Platform.OS === 'android' && !__DEV__) {
      const timer = setTimeout(() => {
        setIsReady(true);
      }, 50); // Small delay to ensure ViewManager is ready
      
      return () => clearTimeout(timer);
    } else {
      setIsReady(true);
    }
  }, []);

  const fallbackStyle: ViewStyle = {
    backgroundColor: colors[0] || '#007AFF', // Use first color as fallback
    ...style,
  };

  const handleGradientError = (error: Error) => {
    logger.warn('LinearGradient error, using fallback:', error.message);
    setShouldUseFallback(true);
  };

  // Show fallback immediately if needed
  if (shouldUseFallback || !isReady) {
    return (
      <View style={fallbackStyle}>
        {children}
      </View>
    );
  }

  // For Android production, use extra error boundary
  if (Platform.OS === 'android' && !__DEV__) {
    return (
      <ErrorBoundary
        fallback={
          <View style={fallbackStyle}>
            {children}
          </View>
        }
        onError={handleGradientError}
      >
        <LinearGradient
          colors={gradientColors}
          start={start}
          end={end}
          style={style}
        >
          {children}
        </LinearGradient>
      </ErrorBoundary>
    );
  }

  // For iOS and development
  return (
    <ErrorBoundary
      fallback={
        <View style={fallbackStyle}>
          {children}
        </View>
      }
      onError={handleGradientError}
    >
      <LinearGradient
        colors={gradientColors}
        start={start}
        end={end}
        style={style}
      >
        {children}
      </LinearGradient>
    </ErrorBoundary>
  );
};

export const SafeLinearGradient = memo(SafeLinearGradientComponent);
