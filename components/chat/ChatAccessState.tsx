import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { designTokens } from '@/constants/design-tokens';

export function ChatAccessState({ bookingRequired, message, onPrimary, onBack }: {
  bookingRequired: boolean;
  message: string;
  onPrimary: () => void;
  onBack: () => void;
}) {
  return (
    <View style={styles.page}>
      <View style={styles.card}>
        <Text style={styles.eyebrow}>TIRAK CONVERSATIONS</Text>
        <Text accessibilityRole="header" style={styles.title}>{bookingRequired ? 'Chat opens after confirmation' : 'We could not open this chat'}</Text>
        <Text accessibilityRole={bookingRequired ? undefined : 'alert'} style={styles.message}>{message}</Text>
        <TouchableOpacity accessibilityRole="button" style={styles.primary} onPress={onPrimary}>
          <Text style={styles.primaryText}>{bookingRequired ? 'View bookings' : 'Try again'}</Text>
        </TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" style={styles.secondary} onPress={onBack}>
          <Text style={styles.secondaryText}>Back to messages</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  page: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 32, backgroundColor: designTokens.colors.semantic.background },
  card: { width: '100%', maxWidth: 520, padding: 28, borderRadius: 24, backgroundColor: designTokens.colors.semantic.surface, borderWidth: 1, borderColor: designTokens.colors.semantic.border, ...designTokens.shadows.sm },
  eyebrow: { color: designTokens.colors.semantic.primary, fontSize: 11, fontWeight: '700', letterSpacing: 1.3, marginBottom: 14 },
  title: { fontSize: 26, lineHeight: 33, fontWeight: '700', color: designTokens.colors.semantic.text, marginBottom: 14, flexShrink: 1 },
  message: { fontSize: 16, lineHeight: 25, color: designTokens.colors.semantic.textSecondary, marginBottom: 24, flexShrink: 1 },
  primary: { minHeight: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: designTokens.colors.semantic.primary, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12 },
  primaryText: { color: designTokens.colors.semantic.primaryContrast, fontSize: 16, fontWeight: '700' },
  secondary: { minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: 8, paddingHorizontal: 12, paddingVertical: 12 },
  secondaryText: { color: designTokens.colors.semantic.primary, fontSize: 15, fontWeight: '600' },
});
