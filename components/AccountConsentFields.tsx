import React from 'react';
import { StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { designTokens } from '@/constants/design-tokens';

interface Props {
  accepted: boolean;
  marketingOptIn: boolean;
  analyticsOptIn: boolean;
  onAcceptedChange: (value: boolean) => void;
  onMarketingChange: (value: boolean) => void;
  onAnalyticsChange: (value: boolean) => void;
  error?: string;
}

export function AccountConsentFields(props: Props) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        accessibilityRole="checkbox"
        accessibilityState={{ checked: props.accepted }}
        accessibilityLabel="I agree to the Terms of Service and acknowledge the Privacy Policy"
        onPress={() => props.onAcceptedChange(!props.accepted)}
        style={styles.row}
      >
        <View style={[styles.checkbox, props.accepted && styles.checked]}><Text style={styles.checkmark}>{props.accepted ? '✓' : ''}</Text></View>
        <Text style={styles.label}>I agree to the Terms of Service and acknowledge the Privacy Policy.</Text>
      </TouchableOpacity>
      <View style={styles.links}>
        <TouchableOpacity accessibilityRole="link" onPress={() => router.push('/auth/legal?type=terms')}><Text style={styles.link}>Read Terms of Service</Text></TouchableOpacity>
        <TouchableOpacity accessibilityRole="link" onPress={() => router.push('/auth/legal?type=privacy')}><Text style={styles.link}>Read Privacy Policy</Text></TouchableOpacity>
      </View>
      {props.error ? <Text accessibilityRole="alert" style={styles.error}>{props.error}</Text> : null}
      <View style={styles.row}>
        <Text style={styles.label}>Email me Tirak news and offers (optional).</Text>
        <Switch accessibilityLabel="Marketing emails" value={props.marketingOptIn} onValueChange={props.onMarketingChange} />
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Share optional app usage analytics to help improve Tirak (optional).</Text>
        <Switch accessibilityLabel="Optional usage analytics" value={props.analyticsOptIn} onValueChange={props.onAnalyticsChange} />
      </View>
      <Text style={styles.note}>You can change these optional choices in Settings. Essential account and booking messages are sent separately.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12, marginVertical: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  label: { flex: 1, color: designTokens.colors.semantic.text, fontSize: 14, lineHeight: 21 },
  checkbox: { width: 24, height: 24, borderWidth: 1, borderRadius: 4, borderColor: designTokens.colors.semantic.primary, alignItems: 'center', justifyContent: 'center' },
  checked: { backgroundColor: designTokens.colors.semantic.primary },
  checkmark: { color: '#fff', fontWeight: '700' },
  links: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  link: { color: designTokens.colors.semantic.primary, textDecorationLine: 'underline', fontSize: 14 },
  note: { color: designTokens.colors.semantic.textSecondary, fontSize: 12, lineHeight: 18 },
  error: { color: designTokens.colors.semantic.error, fontSize: 13 },
});
