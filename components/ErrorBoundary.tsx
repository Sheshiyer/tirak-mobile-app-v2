import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { designTokens } from '@/constants/design-tokens';
import { AlertCircle, RefreshCw } from 'lucide-react-native';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // Log the error
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // For Android production builds, add extra logging
    if (Platform.OS === 'android' && !__DEV__) {
      console.error('Android Production Error:', {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
      });
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <AlertCircle 
              size={48} 
              color={designTokens.colors.semantic.error || '#FF3B30'} 
              style={styles.icon}
            />
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.message}>
              {__DEV__ 
                ? `Error: ${this.state.error?.message || 'Unknown error'}`
                : 'We encountered an unexpected error. Please try again.'
              }
            </Text>
            <TouchableOpacity 
              style={styles.retryButton} 
              onPress={this.handleRetry}
              activeOpacity={0.8}
            >
              <RefreshCw 
                size={20} 
                color={designTokens.colors.semantic.surface || '#FFFFFF'} 
                style={styles.retryIcon}
              />
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: designTokens.colors.semantic.background || '#F8F9FA',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    maxWidth: 300,
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: designTokens.colors.semantic.text || '#000000',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: designTokens.colors.semantic.textSecondary || '#666666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: designTokens.colors.semantic.primary || '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryIcon: {
    marginRight: 8,
  },
  retryText: {
    color: designTokens.colors.semantic.surface || '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

// Convenience wrapper for common use cases
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) => {
  return React.forwardRef<any, P>((props, ref) => (
    <ErrorBoundary fallback={fallback}>
      {React.createElement(Component as React.ComponentType<any>, { ...props, ref })}
    </ErrorBoundary>
  ));
};
