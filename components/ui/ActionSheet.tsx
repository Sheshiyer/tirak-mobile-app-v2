import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { Modal } from 'react-native';
import { colors, spacing, typography } from '@/constants/colors';
import { X } from 'lucide-react-native';

interface ActionSheetOption {
  id: string;
  label: string;
  onPress: () => void;
  destructive?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
}

interface ActionSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  options: ActionSheetOption[];
  cancelLabel?: string;
}

const { height: screenHeight } = Dimensions.get('window');

export const ActionSheet: React.FC<ActionSheetProps> = ({
  visible,
  onClose,
  title,
  options,
  cancelLabel = 'Cancel',
}) => {
  const translateY = React.useRef(new Animated.Value(screenHeight)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: screenHeight,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleOptionPress = (option: ActionSheetOption) => {
    if (!option.disabled) {
      option.onPress();
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ translateY }],
            },
          ]}
        >
          <View style={styles.handle} />
          
          {title && (
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X size={24} color={colors.textLight} />
              </TouchableOpacity>
            </View>
          )}
          
          <View style={styles.content}>
            {options.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.option,
                  option.disabled && styles.optionDisabled,
                ]}
                onPress={() => handleOptionPress(option)}
                disabled={option.disabled}
              >
                {option.icon && (
                  <View style={styles.optionIcon}>
                    {option.icon}
                  </View>
                )}
                <Text
                  style={[
                    styles.optionText,
                    option.destructive && styles.optionTextDestructive,
                    option.disabled && styles.optionTextDisabled,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity style={styles.cancelOption} onPress={onClose}>
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  container: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34, // Safe area bottom
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.gray300,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    flex: 1,
  },
  closeButton: {
    padding: spacing.sm,
    marginRight: -spacing.sm,
  },
  content: {
    paddingTop: spacing.md,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  optionDisabled: {
    opacity: 0.5,
  },
  optionIcon: {
    marginRight: spacing.md,
  },
  optionText: {
    fontSize: typography.sizes.base,
    color: colors.text,
    flex: 1,
  },
  optionTextDestructive: {
    color: colors.error,
  },
  optionTextDisabled: {
    color: colors.textLight,
  },
  cancelOption: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
    backgroundColor: colors.surfaceSecondary,
  },
  cancelText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    color: colors.textLight,
    textAlign: 'center',
  },
});