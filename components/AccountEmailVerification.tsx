import { useTranslation } from 'react-i18next';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { Mail, ChevronRight } from 'lucide-react-native';
import { useAuthStore } from '@/stores/auth-store';
import { designTokens } from '@/constants/design-tokens';

export function AccountEmailVerification() {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  return (
    <TouchableOpacity accessibilityRole="button" style={styles.row} onPress={() => router.push('/auth/verify-email')}>
      <Mail size={22} color={designTokens.colors.semantic.primary} />
      <View style={styles.content}>
        <Text style={styles.title}>{user?.verified ? t('settingsFlow.emailVerified') : t('settingsFlow.verifyEmail')}</Text>
        <Text style={styles.description}>{user?.verified ? t('settingsFlow.emailConfirmed') : t('settingsFlow.emailCode')}</Text>
      </View>
      <ChevronRight size={20} color={designTokens.colors.semantic.textSecondary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  content: { flex: 1 },
  title: { color: designTokens.colors.semantic.text, fontWeight: '500', fontSize: 16 },
  description: { color: designTokens.colors.semantic.textSecondary, fontSize: 14, marginTop: 2 },
});
