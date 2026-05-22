import { logger } from '@/utils/logger';
import React, { memo } from 'react';
import { View, Platform } from 'react-native';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface SafeIconProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  size?: number;
  color?: string;
}

/**
 * SafeIcon wrapper to prevent ViewManagerDelegate crashes with lucide-react-native icons
 * Especially important for Android production builds where ViewManager can be null
 */
const SafeIconComponent: React.FC<SafeIconProps> = ({ 
  children, 
  fallback, 
  size = 24, 
  color = '#000' 
}) => {
  // For Android production, add extra safety
  if (Platform.OS === 'android' && !__DEV__) {
    return (
      <ErrorBoundary
        fallback={fallback || (
          <View 
            style={{ 
              width: size, 
              height: size, 
              backgroundColor: color + '20',
              borderRadius: size / 4 
            }} 
          />
        )}
        onError={(error) => {
          logger.warn('SafeIcon error (Android):', error.message);
        }}
      >
        <View style={{ width: size, height: size }}>
          {children}
        </View>
      </ErrorBoundary>
    );
  }

  // For iOS and development, use simpler wrapper
  return (
    <ErrorBoundary
      fallback={fallback || (
        <View 
          style={{ 
            width: size, 
            height: size, 
            backgroundColor: color + '20',
            borderRadius: size / 4 
          }} 
        />
      )}
    >
      {children}
    </ErrorBoundary>
  );
};

export const SafeIcon = memo(SafeIconComponent);

// Higher-order component for wrapping icons
export const withSafeIcon = <P extends object>(
  IconComponent: React.ComponentType<P>,
  defaultSize: number = 24
) => {
  return memo(React.forwardRef<any, P & { size?: number; color?: string }>((props, ref) => {
    const { size = defaultSize, color = '#000', ...iconProps } = props;
    
    return (
      <SafeIcon size={size} color={color}>
        <IconComponent {...(iconProps as P)} ref={ref} />
      </SafeIcon>
    );
  }));
};
