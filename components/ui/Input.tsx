import React, { useState, useMemo } from 'react';
import { 
  View, 
  TextInput, 
  Text, 
  StyleSheet, 
  TextInputProps,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { designTokens } from '@/constants/design-tokens';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  containerStyle?: ViewStyle;
  labelStyle?: TextStyle;
  inputStyle?: TextStyle;
  errorStyle?: TextStyle;
  hintStyle?: TextStyle;
  variant?: 'default' | 'filled' | 'outlined';
  size?: 'small' | 'medium' | 'large';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  showPasswordToggle?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  hint,
  containerStyle,
  labelStyle,
  inputStyle,
  errorStyle,
  hintStyle,
  variant = 'outlined',
  size = 'medium',
  leftIcon,
  rightIcon,
  showPasswordToggle = false,
  secureTextEntry,
  ...props
}) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(!secureTextEntry);
  const [isFocused, setIsFocused] = useState(false);

  const sizeStyles = useMemo(() => ({
    small: { height: 40, fontSize: designTokens.typography.sizes.small },
    medium: { height: 50, fontSize: designTokens.typography.sizes.body },
    large: { height: 56, fontSize: designTokens.typography.sizes.large },
  }), []);

  const currentSize = sizeStyles[size];

  const inputContainerStyle = useMemo(() => {
    const baseStyle = {
      height: currentSize.height,
      borderRadius: designTokens.borderRadius.lg,
      paddingHorizontal: designTokens.spacing.scale.md,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
    };

    switch (variant) {
      case 'filled':
        return [
          baseStyle,
          {
            backgroundColor: designTokens.colors.semantic.surface,
            borderWidth: 0,
          },
          isFocused && {
            backgroundColor: designTokens.colors.semantic.surface,
            ...designTokens.shadows.sm,
          },
        ];
      case 'outlined':
        return [
          baseStyle,
          {
            backgroundColor: designTokens.colors.semantic.surface,
            borderWidth: 1,
            borderColor: error ? designTokens.colors.semantic.error : isFocused ? designTokens.colors.semantic.primary : designTokens.colors.semantic.border,
          },
          isFocused && designTokens.shadows.sm,
        ];
      default:
        return [
          baseStyle,
          {
            backgroundColor: designTokens.colors.semantic.surface,
            borderBottomWidth: 2,
            borderBottomColor: error ? designTokens.colors.semantic.error : isFocused ? designTokens.colors.semantic.primary : designTokens.colors.semantic.border,
            borderRadius: 0,
          },
        ];
    }
  }, [size, variant, isFocused, error, currentSize.height]);

  const handlePasswordToggle = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { fontSize: designTokens.typography.sizes.small }, labelStyle]}>
          {label}
        </Text>
      )}
      
      <View style={inputContainerStyle}>
        {leftIcon && (
          <View style={styles.iconContainer}>
            {leftIcon}
          </View>
        )}
        
        <TextInput
          style={[
            styles.input,
            { fontSize: currentSize.fontSize },
            inputStyle,
          ]}
          placeholderTextColor={designTokens.colors.semantic.textSecondary}
          secureTextEntry={showPasswordToggle ? !isPasswordVisible : secureTextEntry}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        
        {showPasswordToggle && (
          <TouchableOpacity
            onPress={handlePasswordToggle}
            style={styles.iconContainer}
          >
            {isPasswordVisible ? (
              <EyeOff size={20} color={designTokens.colors.semantic.textSecondary} />
            ) : (
              <Eye size={20} color={designTokens.colors.semantic.textSecondary} />
            )}
          </TouchableOpacity>
        )}
        
        {rightIcon && !showPasswordToggle && (
          <View style={styles.iconContainer}>
            {rightIcon}
          </View>
        )}
      </View>
      
      {error && (
        <Text style={[styles.error, { fontSize: designTokens.typography.sizes.small }, errorStyle]}>
          {error}
        </Text>
      )}
      
      {hint && !error && (
        <Text style={[styles.hint, { fontSize: designTokens.typography.sizes.small }, hintStyle]}>
          {hint}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: designTokens.spacing.scale.md,
    width: '100%',
  },
  label: {
    color: designTokens.colors.semantic.text,
    marginBottom: designTokens.spacing.scale.sm,
    fontWeight: designTokens.typography.weights.medium,
  },
  input: {
    flex: 1,
    color: designTokens.colors.semantic.text,
    fontWeight: designTokens.typography.weights.medium,
  },
  iconContainer: {
    marginHorizontal: designTokens.spacing.scale.sm,
  },
  error: {
    color: designTokens.colors.semantic.error,
    marginTop: designTokens.spacing.scale.xs,
  },
  hint: {
    color: designTokens.colors.semantic.textSecondary,
    marginTop: designTokens.spacing.scale.xs,
  },
});