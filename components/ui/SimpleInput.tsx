import React from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps } from 'react-native';
import { designTokens } from '@/constants/design-tokens';

interface SimpleInputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  disabled?: boolean;
}

export const SimpleInput: React.FC<SimpleInputProps> = ({
  label,
  error,
  helperText,
  disabled,
  ...props
}) => {
  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>{label}</Text>
      )}
      
      <TextInput
        style={styles.input}
        placeholderTextColor={designTokens.colors.semantic.textSecondary}
        {...props}
        editable={!disabled}
      />
      
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : helperText ? (
        <Text style={styles.helper}>{helperText}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    color: designTokens.colors.semantic.text,
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    backgroundColor: designTokens.colors.semantic.surface,
    borderRadius: designTokens.borderRadius.lg,
    paddingHorizontal: designTokens.spacing.scale.md,
    height: 50,
    borderWidth: 1,
    borderColor: designTokens.colors.semantic.border,
    color: designTokens.colors.semantic.text,
    fontSize: 16,
  },
  error: {
    color: designTokens.colors.semantic.error,
    marginTop: 4,
    fontSize: 12,
  },
  helper: {
    color: designTokens.colors.semantic.textSecondary,
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
  },
});
