import { useTranslation } from 'react-i18next';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Switch, Text, View } from 'react-native';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/Button';
import { designTokens } from '@/constants/design-tokens';

export function AccountPrivacyPreferences() {
  const { t } = useTranslation();
  const { consents, loadConsents, saveConsents } = useAuthStore();
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [analyticsOptIn, setAnalyticsOptIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try { await loadConsents(); }
    catch { setError(t('settingsFlow.privacyLoadError')); }
    finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);
  useEffect(() => {
    setMarketingOptIn(consents?.marketingOptIn === true);
    setAnalyticsOptIn(consents?.analyticsOptIn === true);
  }, [consents]);

  async function save() {
    setSaving(true);
    setMessage('');
    setError('');
    try {
      await saveConsents({ marketingOptIn, analyticsOptIn });
      setMessage(t('settingsFlow.privacySaved'));
    } catch {
      setError(t('settingsFlow.privacySaveError'));
    } finally { setSaving(false); }
  }

  if (loading) return <ActivityIndicator accessibilityLabel={t('settingsFlow.privacyLoading')} />;
  if (!consents) return <View style={styles.container}><Text style={styles.error}>{error || t('settingsFlow.privacyUnavailable')}</Text><Button title={t('settingsFlow.privacyRetry')} variant="outline" onPress={load} /></View>;
  const unchanged = marketingOptIn === consents.marketingOptIn && analyticsOptIn === consents.analyticsOptIn;

  return (
    <View style={styles.container}>
      <View style={styles.row}><Text style={styles.label}>{t('settingsFlow.marketing')}</Text><Switch accessibilityLabel={t('settingsFlow.marketingLabel')} disabled={saving} value={marketingOptIn} onValueChange={(value) => { setMarketingOptIn(value); setMessage(''); }} /></View>
      <View style={styles.row}><Text style={styles.label}>{t('settingsFlow.analytics')}</Text><Switch accessibilityLabel={t('settingsFlow.analyticsLabel')} disabled={saving} value={analyticsOptIn} onValueChange={(value) => { setAnalyticsOptIn(value); setMessage(''); }} /></View>
      <Text style={styles.note}>{t('settingsFlow.privacyNote')}</Text>
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      {message ? <Text accessibilityLiveRegion="polite" style={styles.note}>{message}</Text> : null}
      <Button title={t('settingsFlow.privacySave')} variant="outline" disabled={unchanged || saving} loading={saving} onPress={save} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16, paddingVertical: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  label: { flex: 1, color: designTokens.colors.semantic.text, fontSize: 14 },
  note: { color: designTokens.colors.semantic.textSecondary, fontSize: 13, lineHeight: 20 },
  error: { color: designTokens.colors.semantic.error, fontSize: 13 },
});
