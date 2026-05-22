import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';
import { useToastStore } from '@/stores/toast-store';
import { designTokens } from '@/constants/design-tokens';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react-native';

const toastConfig = {
  success: {
    icon: CheckCircle,
    backgroundColor: designTokens.colors.semantic.accent,
  },
  error: {
    icon: XCircle,
    backgroundColor: designTokens.colors.semantic.error,
  },
  warning: {
    icon: AlertCircle,
    backgroundColor: designTokens.colors.semantic.warning,
  },
  info: {
    icon: Info,
    backgroundColor: designTokens.colors.semantic.primary,
  },
};

export const SimpleToast: React.FC = () => {
  const { toast, hideToast } = useToastStore();
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (toast) {
      // Show animation
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
      ]).start();
    } else {
      // Hide animation
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -100,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [toast]);

  if (!toast) return null;

  const config = toastConfig[toast.type];
  const IconComponent = config.icon;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity,
        },
      ]}
      pointerEvents="box-none"
    >
      <View style={[styles.toast, { borderLeftColor: config.backgroundColor }]}>
        <View style={[styles.iconContainer, { backgroundColor: config.backgroundColor + '20' }]}>
          <IconComponent size={20} color={config.backgroundColor} />
        </View>
        <Text style={styles.message}>{toast.message}</Text>
        <TouchableOpacity onPress={hideToast} style={styles.closeButton}>
          <X size={18} color={designTokens.colors.semantic.textSecondary} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: designTokens.spacing.scale.md,
    right: designTokens.spacing.scale.md,
    zIndex: 9999,
    pointerEvents: 'box-none',
  },
  toast: {
    backgroundColor: designTokens.colors.semantic.surface,
    borderRadius: designTokens.borderRadius.lg,
    borderLeftWidth: 4,
    padding: designTokens.spacing.scale.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...designTokens.shadows.lg,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: designTokens.borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: designTokens.spacing.scale.sm,
  },
  message: {
    flex: 1,
    fontSize: 14,
    color: designTokens.colors.semantic.text,
    fontWeight: '500',
  },
  closeButton: {
    padding: 4,
    marginLeft: designTokens.spacing.scale.sm,
  },
});

