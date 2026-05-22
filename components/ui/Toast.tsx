import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Info, 
  X,
} from 'lucide-react-native';
import { designTokens } from '@/constants/design-tokens';

const { width: screenWidth } = Dimensions.get('window');

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  onDismiss: (id: string) => void;
  position?: 'top' | 'bottom';
}

const toastConfig = {
  success: {
    icon: CheckCircle,
    backgroundColor: designTokens.colors.semantic.accent,
    borderColor: designTokens.colors.semantic.accent + '40',
  },
  error: {
    icon: XCircle,
    backgroundColor: designTokens.colors.semantic.error,
    borderColor: designTokens.colors.semantic.error + '40',
  },
  warning: {
    icon: AlertCircle,
    backgroundColor: designTokens.colors.semantic.warning,
    borderColor: designTokens.colors.semantic.warning + '40',
  },
  info: {
    icon: Info,
    backgroundColor: designTokens.colors.semantic.primary,
    borderColor: designTokens.colors.semantic.primary + '40',
  },
};

export const Toast: React.FC<ToastProps> = ({
  id,
  type,
  title,
  message,
  duration = 4000,
  onDismiss,
  position = 'top',
}) => {
  const translateY = useRef(new Animated.Value(position === 'top' ? -100 : 100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;
  
  const config = toastConfig[type];
  const IconComponent = config.icon;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
    ]).start();

    // Auto dismiss
    const timer = setTimeout(() => {
      handleDismiss();
    }, duration);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: position === 'top' ? -100 : 100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.9,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss(id);
    });
  };

  return (
    <Animated.View
      style={[
        styles.container,
        position === 'top' ? styles.topPosition : styles.bottomPosition,
        {
          transform: [
            { translateY },
            { scale },
          ],
          opacity,
        },
      ]}
    >
      <View style={[styles.toast, { borderLeftColor: config.backgroundColor }]}>
        <View style={styles.content}>
          <View style={[styles.iconContainer, { backgroundColor: config.backgroundColor + '20' }]}>
            <IconComponent size={20} color={config.backgroundColor} />
          </View>
          
          <View style={styles.textContainer}>
            <Text style={styles.title}>{title}</Text>
            {message && <Text style={styles.message}>{message}</Text>}
          </View>
          
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleDismiss}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={18} color={designTokens.colors.semantic.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: designTokens.spacing.scale.md,
    right: designTokens.spacing.scale.md,
    zIndex: 9999,
  },
  topPosition: {
    top: Platform.OS === 'ios' ? 60 : 40,
  },
  bottomPosition: {
    bottom: Platform.OS === 'ios' ? 100 : 80,
  },
  toast: {
    backgroundColor: designTokens.colors.semantic.surface,
    borderRadius: designTokens.borderRadius.lg,
    borderLeftWidth: 4,
    ...designTokens.shadows.lg,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: designTokens.spacing.scale.md,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: designTokens.borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: designTokens.spacing.scale.sm,
  },
  textContainer: {
    flex: 1,
    marginRight: designTokens.spacing.scale.sm,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: designTokens.colors.semantic.text,
    marginBottom: 2,
  },
  message: {
    fontSize: 14,
    color: designTokens.colors.semantic.textSecondary,
    lineHeight: 20,
  },
  closeButton: {
    padding: 4,
  },
});