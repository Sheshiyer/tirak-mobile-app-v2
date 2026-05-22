import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal as RNModal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
  Platform,
  ScrollView,
} from 'react-native';
import { X } from 'lucide-react-native';
import { designTokens } from '@/constants/design-tokens';

const { height: screenHeight } = Dimensions.get('window');

export interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  position?: 'center' | 'bottom';
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  animationType?: 'slide' | 'fade';
  style?: any;
}

export const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  title,
  children,
  size = 'medium',
  position = 'center',
  showCloseButton = true,
  closeOnBackdrop = true,
  animationType = 'slide',
  style,
}) => {
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      if (animationType === 'slide') {
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 100,
            friction: 8,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      }
    } else {
      if (animationType === 'slide') {
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: screenHeight,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 0.9,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }),
        ]).start();
      }
    }
  }, [visible, animationType]);

  const handleBackdropPress = () => {
    if (closeOnBackdrop) {
      onClose();
    }
  };

  const getModalStyle = () => {
    const baseStyle: any[] = [styles.modal];
    
    switch (size) {
      case 'small':
        baseStyle.push(styles.modalSmall);
        break;
      case 'medium':
        baseStyle.push(styles.modalMedium);
        break;
      case 'large':
        baseStyle.push(styles.modalLarge);
        break;
      case 'fullscreen':
        baseStyle.push(styles.modalFullscreen);
        break;
    }

    if (position === 'bottom') {
      baseStyle.push(styles.modalBottom);
    }

    return baseStyle;
  };

  const getAnimatedStyle = () => {
    if (animationType === 'slide' && position === 'bottom') {
      return {
        transform: [{ translateY: slideAnim }],
      };
    } else if (animationType === 'fade') {
      return {
        transform: [{ scale: scaleAnim }],
        opacity: fadeAnim,
      };
    }
    return {};
  };

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
        <TouchableWithoutFeedback onPress={handleBackdropPress}>
          <View style={styles.backdropTouchable} />
        </TouchableWithoutFeedback>
        
        <Animated.View style={[getModalStyle(), getAnimatedStyle(), style]}>
          {title && (
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              {showCloseButton && (
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={onClose}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <X size={24} color={designTokens.colors.semantic.surface} />
                </TouchableOpacity>
              )}
            </View>
          )}
          
          <View style={styles.content}>
            {children}
          </View>
        </Animated.View>
      </Animated.View>
    </RNModal>
  );
};

export const BottomSheet: React.FC<Omit<ModalProps, 'position' | 'animationType'>> = (props) => {
  return <Modal {...props} position="bottom" animationType="slide" />;
};

export const AlertModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  type?: 'info' | 'warning' | 'error' | 'success';
}> = ({
  visible,
  onClose,
  title,
  message,
  confirmText = 'OK',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  type = 'info',
}) => {
  const handleConfirm = () => {
    onConfirm?.();
    onClose();
  };

  const handleCancel = () => {
    onCancel?.();
    onClose();
  };

  const getTypeColor = () => {
    switch (type) {
      case 'warning':
        return designTokens.colors.semantic.accent;
      case 'error':
        return designTokens.colors.semantic.error;
      case 'success':
        return designTokens.colors.semantic.success;
      default:
        return designTokens.colors.semantic.primary;
    }
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      size="small"
      showCloseButton={false}
      closeOnBackdrop={false}
    >
      <View style={styles.alertContent}>
        <Text style={[styles.alertTitle, { color: getTypeColor() }]}>{title}</Text>
        <Text style={styles.alertMessage}>{message}</Text>
        
        <View style={styles.alertActions}>
          {onCancel && (
            <TouchableOpacity style={styles.alertButton} onPress={handleCancel}>
              <Text style={styles.alertButtonTextSecondary}>{cancelText}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.alertButton, styles.alertButtonPrimary, { backgroundColor: getTypeColor() }]}
            onPress={handleConfirm}
          >
            <Text style={styles.alertButtonTextPrimary}>{confirmText}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdropTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modal: {
    backgroundColor: designTokens.colors.semantic.surface,
    borderRadius: designTokens.borderRadius.xl,
    maxHeight: screenHeight * 0.9,
    ...designTokens.shadows.xl,
  },
  modalSmall: {
    width: '80%',
    maxWidth: 320,
  },
  modalMedium: {
    width: '90%',
    maxWidth: 480,
  },
  modalLarge: {
    width: '95%',
    maxWidth: 640,
  },
  modalFullscreen: {
    width: '100%',
    height: '100%',
    borderRadius: 0,
    maxHeight: '100%',
  },
  modalBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    borderTopLeftRadius: designTokens.borderRadius.xl,
    borderTopRightRadius: designTokens.borderRadius.xl,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: designTokens.spacing.scale.lg,
    borderBottomWidth: 1,
    borderBottomColor: designTokens.colors.semantic.border,
    backgroundColor: designTokens.colors.semantic.primary,
    borderTopLeftRadius: designTokens.borderRadius.xl,
    borderTopRightRadius: designTokens.borderRadius.xl,
  },
  title: {
    fontSize: designTokens.typography.sizes.large,
    fontWeight: '600',
    color: designTokens.colors.semantic.surface,
    flex: 1,
  },
  closeButton: {
    padding: designTokens.spacing.scale.xs,
  },
  content: {
    flex: 1,
  },
  alertContent: {
    padding: designTokens.spacing.scale.lg,
  },
  alertTitle: {
    fontSize: designTokens.typography.sizes.large,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: designTokens.spacing.scale.md,
  },
  alertMessage: {
    fontSize: designTokens.typography.sizes.body,
    color: designTokens.colors.semantic.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: designTokens.spacing.scale.lg,
  },
  alertActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: designTokens.spacing.scale.md,
  },
  alertButton: {
    paddingHorizontal: designTokens.spacing.scale.lg,
    paddingVertical: designTokens.spacing.scale.md,
    borderRadius: designTokens.borderRadius.lg,
    minWidth: 80,
    alignItems: 'center',
  },
  alertButtonPrimary: {
    backgroundColor: designTokens.colors.semantic.accent,
  },
  alertButtonTextPrimary: {
    fontSize: designTokens.typography.sizes.body,
    fontWeight: '500',
    color: designTokens.colors.semantic.surface,
  },
  alertButtonTextSecondary: {
    fontSize: designTokens.typography.sizes.body,
    fontWeight: '500',
    color: designTokens.colors.semantic.textSecondary,
  },
});
