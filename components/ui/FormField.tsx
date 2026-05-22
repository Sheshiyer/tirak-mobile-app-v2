import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { designTokens, componentTokens } from '@/constants/design-tokens';
import { Eye, EyeOff, AlertCircle } from 'lucide-react-native';

interface FormFieldProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?: 'name' | 'email' | 'password' | 'username' | 'tel' | 'off';
  multiline?: boolean;
  numberOfLines?: number;
  maxLength?: number;
  editable?: boolean;
  required?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onFocus?: () => void;
  onBlur?: () => void;
  style?: any;
  inputStyle?: any;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  autoComplete = 'off',
  multiline = false,
  numberOfLines = 1,
  maxLength,
  editable = true,
  required = false,
  leftIcon,
  rightIcon,
  onFocus,
  onBlur,
  style,
  inputStyle,
}) => {
  const [isSecure, setIsSecure] = React.useState(secureTextEntry);
  const [isFocused, setIsFocused] = React.useState(false);

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  const toggleSecureEntry = () => {
    setIsSecure(!isSecure);
  };

  const hasError = !!error;
  const showPasswordToggle = secureTextEntry && !rightIcon;

  return (
    <View style={[styles.container, style]}>
      {label && (
        <View style={styles.labelContainer}>
          <Text style={styles.label}>
            {label}
            {required && <Text style={styles.required}> *</Text>}
          </Text>
        </View>
      )}
      
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputContainerFocused,
          hasError && styles.inputContainerError,
          !editable && styles.inputContainerDisabled,
        ]}
      >
        {leftIcon && (
          <View style={styles.leftIconContainer}>
            {leftIcon}
          </View>
        )}
        
        <TextInput
          style={[
            styles.input,
            multiline && styles.inputMultiline,
            leftIcon && styles.inputWithLeftIcon,
            (rightIcon || showPasswordToggle) && styles.inputWithRightIcon,
            inputStyle,
          ]}
          placeholder={placeholder}
          placeholderTextColor={designTokens.colors.semantic.textSecondary}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={isSecure}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          multiline={multiline}
          numberOfLines={numberOfLines}
          maxLength={maxLength}
          editable={editable}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
        
        {showPasswordToggle && (
          <TouchableOpacity
            style={styles.rightIconContainer}
            onPress={toggleSecureEntry}
          >
            {isSecure ? (
              <Eye size={20} color={designTokens.colors.semantic.textSecondary} />
            ) : (
              <EyeOff size={20} color={designTokens.colors.semantic.textSecondary} />
            )}
          </TouchableOpacity>
        )}

        {rightIcon && !showPasswordToggle && (
          <View style={styles.rightIconContainer}>
            {rightIcon}
          </View>
        )}
      </View>

      {hasError && (
        <View style={styles.errorContainer}>
          <AlertCircle size={16} color={designTokens.colors.semantic.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: designTokens.spacing.scale.md,
  },
  labelContainer: {
    marginBottom: designTokens.spacing.scale.sm,
  },
  label: {
    ...designTokens.typography.styles.subheading,
    fontSize: designTokens.typography.sizes.caption,
    color: designTokens.colors.semantic.text,
  },
  required: {
    color: designTokens.colors.semantic.error,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: designTokens.colors.semantic.surface,
    borderWidth: 1,
    borderColor: designTokens.colors.semantic.border,
    borderRadius: designTokens.borderRadius.components.input,
    paddingHorizontal: designTokens.spacing.scale.md,
    minHeight: 44, // Accessibility compliance
  },
  inputContainerFocused: {
    borderColor: designTokens.colors.semantic.accent,
    backgroundColor: designTokens.colors.semantic.surface,
    borderWidth: 2,
    shadowColor: designTokens.colors.semantic.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  inputContainerError: {
    borderColor: designTokens.colors.semantic.error,
  },
  inputContainerDisabled: {
    backgroundColor: designTokens.colors.semantic.border,
    opacity: 0.6,
  },
  input: {
    flex: 1,
    ...designTokens.typography.styles.body,
    color: designTokens.colors.semantic.text,
    paddingVertical: designTokens.spacing.scale.sm,
  },
  inputMultiline: {
    paddingVertical: designTokens.spacing.scale.md,
    textAlignVertical: 'top',
    minHeight: 120,
  },
  inputWithLeftIcon: {
    marginLeft: designTokens.spacing.scale.sm,
  },
  inputWithRightIcon: {
    marginRight: designTokens.spacing.scale.sm,
  },
  leftIconContainer: {
    marginRight: designTokens.spacing.scale.sm,
  },
  rightIconContainer: {
    marginLeft: designTokens.spacing.scale.sm,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: designTokens.spacing.scale.sm,
    gap: designTokens.spacing.scale.sm,
  },
  errorText: {
    ...designTokens.typography.styles.caption,
    color: designTokens.colors.semantic.error,
    flex: 1,
  },
});
