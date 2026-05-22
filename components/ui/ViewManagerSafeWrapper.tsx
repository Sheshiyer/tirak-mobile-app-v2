import { logger } from '@/utils/logger';
import React, { Component, ReactNode } from 'react';
import { View, Platform } from 'react-native';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface ViewManagerSafeWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
}

interface ViewManagerSafeWrapperState {
  hasViewManagerError: boolean;
  retryCount: number;
}

/**
 * ViewManagerSafeWrapper
 * 
 * A specialized wrapper component designed to prevent React Native ViewManagerDelegate
 * null pointer exceptions that occur during view preallocation in the Fabric renderer.
 * 
 * This component provides multiple layers of protection:
 * 1. Error boundary for ViewManager crashes
 * 2. Platform-specific handling for Android production builds
 * 3. Retry mechanism for transient ViewManager issues
 * 4. Fallback rendering when ViewManager is unavailable
 */
export class ViewManagerSafeWrapper extends Component<
  ViewManagerSafeWrapperProps,
  ViewManagerSafeWrapperState
> {
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private maxRetries = 3;

  constructor(props: ViewManagerSafeWrapperProps) {
    super(props);
    this.state = {
      hasViewManagerError: false,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ViewManagerSafeWrapperState> {
    // Check if this is a ViewManager-related error
    const isViewManagerError = 
      error.message?.includes('ViewManagerDelegate') ||
      error.message?.includes('setProperty') ||
      error.message?.includes('null object reference') ||
      error.stack?.includes('ViewManager') ||
      error.stack?.includes('SurfaceMountingManager');

    if (isViewManagerError) {
      return { hasViewManagerError: true };
    }

    return {};
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // Log ViewManager-specific errors with detailed context
    if (this.state.hasViewManagerError) {
      console.error('ViewManagerSafeWrapper caught ViewManager error:', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        platform: Platform.OS,
        version: Platform.Version,
        isDev: __DEV__,
        retryCount: this.state.retryCount,
        timestamp: new Date().toISOString(),
      });

      // Call the onError callback if provided
      if (this.props.onError) {
        this.props.onError(error, errorInfo);
      }

      // Attempt retry for transient ViewManager issues
      this.attemptRetry();
    }
  }

  componentWillUnmount() {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }
  }

  private attemptRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      // Clear any existing timer
      if (this.retryTimer) {
        clearTimeout(this.retryTimer);
      }

      // Schedule retry with exponential backoff
      const retryDelay = Math.pow(2, this.state.retryCount) * 100; // 100ms, 200ms, 400ms
      
      this.retryTimer = setTimeout(() => {
        logger.log(`ViewManagerSafeWrapper: Attempting retry ${this.state.retryCount + 1}/${this.maxRetries}`);
        
        this.setState(prevState => ({
          hasViewManagerError: false,
          retryCount: prevState.retryCount + 1,
        }));
      }, retryDelay);
    } else {
      logger.warn('ViewManagerSafeWrapper: Max retries exceeded, using fallback rendering');
    }
  };

  private renderFallback = (): ReactNode => {
    // Use provided fallback or default safe fallback
    if (this.props.fallback) {
      return this.props.fallback;
    }

    // Default fallback: simple View that doesn't require ViewManager
    return (
      <View
        style={{
          minWidth: 24,
          minHeight: 24,
          backgroundColor: 'transparent',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {/* Render a simple placeholder that doesn't use any ViewManager */}
        <View
          style={{
            width: 16,
            height: 16,
            backgroundColor: '#E0E0E0',
            borderRadius: 8,
          }}
        />
      </View>
    );
  };

  render() {
    // If we've had a ViewManager error and exceeded retries, show fallback
    if (this.state.hasViewManagerError && this.state.retryCount >= this.maxRetries) {
      return this.renderFallback();
    }

    // For Android production builds, add extra protection
    if (Platform.OS === 'android' && !__DEV__) {
      return (
        <ErrorBoundary
          fallback={this.renderFallback()}
          onError={(error, errorInfo) => {
            // Check for ViewManager errors specifically
            const isViewManagerError = 
              error.message?.includes('ViewManagerDelegate') ||
              error.message?.includes('setProperty') ||
              error.stack?.includes('ViewManager');

            if (isViewManagerError) {
              console.error('Android ViewManager error detected:', error.message);
              this.setState({ hasViewManagerError: true });
            }

            if (this.props.onError) {
              this.props.onError(error, errorInfo);
            }
          }}
        >
          <View style={{ flex: 1 }}>
            {this.props.children}
          </View>
        </ErrorBoundary>
      );
    }

    // For iOS and development, use standard error boundary
    return (
      <ErrorBoundary
        fallback={this.renderFallback()}
        onError={this.props.onError}
      >
        {this.props.children}
      </ErrorBoundary>
    );
  }
}

/**
 * Hook version for functional components
 */
export const useViewManagerSafe = (onError?: (error: Error, errorInfo: any) => void) => {
  const wrapComponent = React.useCallback((
    children: ReactNode,
    fallback?: ReactNode
  ) => (
    <ViewManagerSafeWrapper
      fallback={fallback}
      onError={onError}
    >
      {children}
    </ViewManagerSafeWrapper>
  ), [onError]);

  return { wrapComponent };
};

/**
 * HOC version for class components
 */
export const withViewManagerSafe = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: ReactNode
) => {
  return React.forwardRef<any, P>((props, ref) => (
    <ViewManagerSafeWrapper fallback={fallback}>
      {React.createElement(WrappedComponent as React.ComponentType<any>, { ...props, ref })}
    </ViewManagerSafeWrapper>
  ));
};
