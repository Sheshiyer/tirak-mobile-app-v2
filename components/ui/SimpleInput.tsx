import React from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps } from 'react-native';
import { designTokens } from '@/constants/design-tokens';

interface SimpleInputProps extends TextInputProps {
  label?: string;
  error?: string;
  disabled?: boolean;
}

export const SimpleInput: React.FC<SimpleInputProps> = ({
  label,
  error,
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
      
      {error && (
        <Text style={styles.error}>{error}</Text>
      )}
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
}); 