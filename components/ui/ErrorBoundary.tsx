import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { designTokens } from '@/constants/design-tokens';
import { AlertTriangle, RefreshCw } from 'lucide-react-native';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; retry: () => void }>;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  retry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} retry={this.retry} />;
      }

      return <DefaultErrorFallback error={this.state.error} retry={this.retry} />;
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error?: Error;
  retry: () => void;
}

export const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({ error, retry }) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <AlertTriangle size={48} color={designTokens.colors.semantic.error} />
      </View>
      
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.message}>
        We encountered an unexpected error. Please try again.
      </Text>
      
      {__DEV__ && error && (
        <View style={styles.errorDetails}>
          <Text style={styles.errorTitle}>Error Details:</Text>
          <Text style={styles.errorText}>{error.message}</Text>
        </View>
      )}
      
      <TouchableOpacity style={styles.retryButton} onPress={retry}>
        <RefreshCw size={20} color={designTokens.colors.semantic.surface} />
        <Text style={styles.retryText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );
};

export const NetworkErrorFallback: React.FC<ErrorFallbackProps> = ({ retry }) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <AlertTriangle size={48} color={designTokens.colors.semantic.warning} />
      </View>
      
      <Text style={styles.title}>Connection Error</Text>
      <Text style={styles.message}>
        Please check your internet connection and try again.
      </Text>
      
      <TouchableOpacity style={styles.retryButton} onPress={retry}>
        <RefreshCw size={20} color={designTokens.colors.semantic.surface} />
        <Text style={styles.retryText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: designTokens.spacing.scale.xl,
    backgroundColor: designTokens.colors.semantic.background,
  },
  iconContainer: {
    marginBottom: designTokens.spacing.scale.lg,
  },
  title: {
    fontSize: designTokens.typography.sizes.large,
    fontWeight: designTokens.typography.weights.bold,
    color: designTokens.colors.semantic.text,
    marginBottom: designTokens.spacing.scale.md,
    textAlign: 'center',
  },
  message: {
    fontSize: designTokens.typography.sizes.body,
    color: designTokens.colors.semantic.textSecondary,
    textAlign: 'center',
    lineHeight: designTokens.typography.lineHeights.relaxed * designTokens.typography.sizes.body,
    marginBottom: designTokens.spacing.scale.xl,
  },
  errorDetails: {
    backgroundColor: designTokens.colors.semantic.surface,
    padding: designTokens.spacing.scale.md,
    borderRadius: 8,
    marginBottom: designTokens.spacing.scale.xl,
    width: '100%',
  },
  errorTitle: {
    fontSize: designTokens.typography.sizes.small,
    fontWeight: designTokens.typography.weights.semibold,
    color: designTokens.colors.semantic.error,
    marginBottom: designTokens.spacing.scale.sm,
  },
  errorText: {
    fontSize: designTokens.typography.sizes.small,
    color: designTokens.colors.semantic.textSecondary,
    fontFamily: 'monospace',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: designTokens.colors.semantic.primary,
    paddingHorizontal: designTokens.spacing.scale.lg,
    paddingVertical: designTokens.spacing.scale.md,
    borderRadius: 8,
    gap: designTokens.spacing.scale.sm,
  },
  retryText: {
    fontSize: designTokens.typography.sizes.body,
    fontWeight: designTokens.typography.weights.medium,
    color: designTokens.colors.semantic.surface,
  },
});