import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TextInput, Switch, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/auth-store';
import { useAvailabilitySettings, useSaveAvailabilitySettings, validateAvailabilitySettings, WeeklyDay } from '@/services/api/companion/availability-settings';
import { designTokens } from '@/constants/design-tokens';

export default function AvailabilitySettingsScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const id = useAuthStore(state => state.user?.id) || '';
  const query = useAvailabilitySettings(id);
  const save = useSaveAvailabilitySettings(id);
  const [days, setDays] = useState<WeeklyDay[]>([]);
  const [draftOwnerId, setDraftOwnerId] = useState(id);
  const visibleDays = draftOwnerId === id ? days : [];
  const [message, setMessage] = useState('');
  const [dirty, setDirty] = useState(false);
  useEffect(() => { setDraftOwnerId(id); setDays([]); setDirty(false); setMessage(''); }, [id]);
  useEffect(() => {
    if (query.data && !dirty) setDays(Array.from({ length: 7 }, (_, dayOfWeek) => query.data!.days.find(day => day.dayOfWeek === dayOfWeek) || { dayOfWeek, startTime: '09:00', endTime: '18:00', isAvailable: false }));
  }, [query.data, dirty]);
  const change = (index: number, patch: Partial<WeeklyDay>) => { setDirty(true); setMessage(''); setDays(current => current.map((day, i) => i === index ? { ...day, ...patch } : day)); };
  const submit = async () => {
    try {
      const settings = { timeZone: 'Asia/Bangkok' as const, days };
      validateAvailabilitySettings(settings);
      await save.mutateAsync(settings);
      setDirty(false);
      setMessage(t('availabilitySettings.saved'));
    } catch { setMessage(t('availabilitySettings.saveFailed')); }
  };
  return <SafeAreaView style={styles.page}>
    <TouchableOpacity onPress={() => router.back()} accessibilityRole="button"><Text style={styles.link}>{t('common.back', { defaultValue: 'Back' })}</Text></TouchableOpacity>
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t('availabilitySettings.title')}</Text>
      <Text>{t('availabilitySettings.description')}</Text>
      <Text>{t('availabilitySettings.timeZone')}</Text>
      {!id ? <Text>{t('editServices.pleaseLogInToManageServices')}</Text> : query.isLoading ? <ActivityIndicator /> : query.isError ? <>
        <Text accessibilityRole="alert">{t('availabilitySettings.loadFailed')}</Text>
        <TouchableOpacity onPress={() => query.refetch()}><Text style={styles.link}>{t('common.retry', { defaultValue: 'Retry' })}</Text></TouchableOpacity>
      </> : visibleDays.map((day, index) => {
        const name = new Date(Date.UTC(2026, 8, 27 + day.dayOfWeek)).toLocaleDateString(i18n.language === 'th' ? 'th-TH' : 'en-US', { weekday: 'long', timeZone: 'UTC' });
        return <View key={day.dayOfWeek} style={styles.day}>
          <View style={styles.row}><Text>{name}</Text><Switch accessibilityLabel={name} value={day.isAvailable} disabled={save.isPending} onValueChange={isAvailable => change(index, { isAvailable })} /></View>
          <View style={styles.row}>
            <TextInput accessibilityLabel={`${name} ${t('availabilitySettings.start')}`} style={styles.input} value={day.startTime} editable={!save.isPending && day.isAvailable} maxLength={5} placeholder="09:00" onChangeText={startTime => change(index, { startTime })} />
            <Text>—</Text>
            <TextInput accessibilityLabel={`${name} ${t('availabilitySettings.end')}`} style={styles.input} value={day.endTime} editable={!save.isPending && day.isAvailable} maxLength={5} placeholder="18:00" onChangeText={endTime => change(index, { endTime })} />
          </View>
        </View>;
      })}
      {!!message && <Text accessibilityRole="alert">{message}</Text>}
      {!!query.data && <TouchableOpacity style={styles.button} disabled={!dirty || save.isPending} onPress={submit}>{save.isPending ? <ActivityIndicator /> : <Text>{t('common.save')}</Text>}</TouchableOpacity>}
    </ScrollView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: designTokens.colors.semantic.background },
  content: { padding: 20, gap: 16 }, title: { fontSize: 24, fontWeight: '600' },
  link: { padding: 16, color: designTokens.colors.semantic.primary },
  day: { padding: 12, borderWidth: 1, borderColor: designTokens.colors.semantic.border, borderRadius: 12, gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  input: { flex: 1, padding: 12, borderWidth: 1, borderColor: designTokens.colors.semantic.border, borderRadius: 8 },
  button: { padding: 16, alignItems: 'center', borderRadius: 12, backgroundColor: designTokens.colors.semantic.surface },
});
