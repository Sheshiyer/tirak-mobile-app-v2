import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Bell, Mail, Smartphone } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { designTokens } from '@/constants/design-tokens';
import { RadialGradient } from '@/components/ui/RadialGradient';
import { Button } from '@/components/ui/Button';
import { useNotificationPreferences, useUpdateNotificationPreferences } from '@/services/api/notifications/notifications';

type Preferences = { push: boolean; email: boolean; sms: boolean };
const validPreferences = (value: any): value is Preferences => value && ['push', 'email', 'sms'].every(key => typeof value[key] === 'boolean');

export default function NotificationSettings() {
  const query = useNotificationPreferences();
  const update = useUpdateNotificationPreferences();
  const { t } = useTranslation();
  const serverPreferences = query.data?.success === true && validPreferences(query.data.data?.preferences) ? query.data.data.preferences : null;
  const [draft, setDraft] = useState<Preferences | null>(null);
  const [feedback, setFeedback] = useState('');
  const [failed, setFailed] = useState(false);
  useEffect(() => { if (serverPreferences) setDraft(serverPreferences); }, [serverPreferences]);
  const preferences = draft || serverPreferences;
  const change = (key: keyof Preferences, value: boolean) => {
    if (!preferences || update.isPending) return;
    const before = preferences;
    setDraft({ ...before, [key]: value });
    setFeedback(''); setFailed(false);
    const rollback = () => { setDraft(before); setFailed(true); setFeedback(t('notificationSettings.saveError')); };
    update.mutate({ [key]: value }, {
      onSuccess: response => {
        if (response.success !== true || !validPreferences(response.data?.preferences)) { rollback(); return; }
        setDraft(response.data.preferences); setFeedback(t('notificationSettings.saved'));
      },
      onError: rollback,
    });
  };
  const rows = [
    { key: 'push' as const, label: t('settingsFlow.pushAlerts'), description: t('settingsFlow.pushDescription'), icon: Smartphone },
    { key: 'email' as const, label: t('settingsFlow.emailAlerts'), description: t('settingsFlow.emailDescription'), icon: Mail },
    { key: 'sms' as const, label: t('notificationSettings.sms'), description: t('notificationSettings.smsDescription'), icon: Bell },
  ];
  return <RadialGradient variant="appBackground" style={styles.container}>
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel={t('language.back')} style={styles.back} onPress={() => router.canGoBack() ? router.back() : router.replace('/settings')}><ArrowLeft size={22} color={designTokens.colors.semantic.text} /></TouchableOpacity>
          <View style={{ flex: 1 }}><Text accessibilityRole="header" style={styles.title}>{t('settings.manageNotifications')}</Text><Text style={styles.description}>{t('settings.manageNotificationsDescription')}</Text></View>
        </View>
        {query.isLoading ? <View style={styles.card}><ActivityIndicator accessibilityLabel={t('notificationSettings.loading')} /><Text style={styles.description}>{t('notificationSettings.loading')}</Text></View>
          : query.error || !preferences ? <View style={styles.card}><Text accessibilityRole="alert" style={styles.error}>{t('notificationSettings.loadError')}</Text><Button title={t('notificationSettings.retry')} variant="outline" onPress={() => { void query.refetch(); }} /></View>
          : <View style={styles.card}>
            {rows.map(({ key, label, description, icon: Icon }) => <View key={key} style={styles.row}><View style={styles.icon}><Icon size={20} color={designTokens.colors.semantic.primary} /></View><View style={{ flex: 1 }}><Text style={styles.label}>{label}</Text><Text style={styles.description}>{description}</Text></View><Switch accessibilityLabel={label} disabled={update.isPending} value={preferences[key]} onValueChange={value => change(key, value)} trackColor={{ false: designTokens.colors.semantic.border, true: designTokens.colors.semantic.primary }} /></View>)}
            {update.isPending ? <Text accessibilityLiveRegion="polite" style={styles.description}>{t('notificationSettings.saving')}</Text> : null}
            {feedback ? <Text accessibilityRole={failed ? 'alert' : undefined} accessibilityLiveRegion="polite" style={failed ? styles.error : styles.description}>{feedback}</Text> : null}
            <Text style={styles.note}>{t('notificationSettings.note')}</Text>
          </View>}
      </ScrollView>
    </SafeAreaView>
  </RadialGradient>;
}
const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flexGrow: 1, width: '100%', maxWidth: 720, alignSelf: 'center', padding: 24, paddingBottom: 40, gap: 24 },
  header: { flexDirection: 'row', gap: 16, alignItems: 'flex-start' },
  back: { width: 44, height: 44, borderRadius: 22, backgroundColor: designTokens.colors.semantic.surface, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, lineHeight: 32, fontWeight: '700', color: designTokens.colors.semantic.text, marginBottom: 8 },
  card: { backgroundColor: designTokens.colors.semantic.surface, borderRadius: 16, borderWidth: 1, borderColor: designTokens.colors.semantic.border, padding: 16, gap: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 88, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: designTokens.colors.semantic.border },
  icon: { width: 36, height: 36, borderRadius: 12, backgroundColor: designTokens.colors.semantic.primary + '10', alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 16, lineHeight: 24, fontWeight: '600', color: designTokens.colors.semantic.text },
  description: { fontSize: 14, lineHeight: 20, color: designTokens.colors.semantic.textSecondary },
  note: { fontSize: 13, lineHeight: 20, color: designTokens.colors.semantic.textSecondary },
  error: { fontSize: 14, lineHeight: 20, color: designTokens.colors.semantic.error },
});
