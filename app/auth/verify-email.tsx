import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { RadialGradient } from '@/components/ui/RadialGradient';
import { designTokens } from '@/constants/design-tokens';
import { useAuthStore } from '@/stores/auth-store';
import { AccountRequestError, requestEmailVerification, verifyEmail } from '@/utils/account-api';
import { isVerificationCode } from '@/utils/account-consent';

export default function VerifyEmailScreen() {
  const { user, emailVerification, setEmailVerification, updateUser } = useAuthStore();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState<'send' | 'verify' | null>(null);
  const [error, setError] = useState('');
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const remaining = Math.max(0, Math.ceil(((emailVerification?.retryAt || 0) - now) / 1000));
  const continueToProfile = () => router.replace(user?.userType === 'companion' || user?.userType === 'supplier' ? '/supplier/profile/edit' : '/(app)/profile/edit');

  async function sendCode() {
    if (busy || remaining > 0) return;
    setBusy('send');
    setError('');
    try {
      const delivery = await requestEmailVerification();
      setEmailVerification(delivery);
      if (delivery.emailVerified === true) updateUser({ verified: true });
      setNow(Date.now());
    } catch (error) {
      if (error instanceof AccountRequestError && error.retryAfterSeconds) {
        setEmailVerification({ deliveryStatus: emailVerification?.deliveryStatus || 'unavailable', retryAfterSeconds: error.retryAfterSeconds });
      }
      setError(error instanceof Error ? error.message : 'Unable to send your code. Please try again.');
    } finally {
      setBusy(null);
    }
  }

  async function confirmCode() {
    if (busy || !isVerificationCode(code)) return;
    setBusy('verify');
    setError('');
    try {
      const result = await verifyEmail(code);
      if (result.emailVerified !== true) throw new Error('Email verification was not confirmed. Please try again.');
      updateUser({ verified: true });
      setCode('');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to verify your email. Please try again.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <RadialGradient variant="appBackground" style={styles.container}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>{user?.verified ? 'Email verified' : 'Verify your email'}</Text>
          {!user ? (
            <><Text style={styles.body}>Sign in to verify the email address on your account.</Text><Button title="Sign in" onPress={() => router.replace('/auth/login')} /></>
          ) : user.verified ? (
            <><Text style={styles.body}>Your email address has been confirmed.</Text><Button title="Continue to your profile" onPress={continueToProfile} /></>
          ) : (
            <>
              <Text style={styles.body}>{user.email}</Text>
              <Text accessibilityLiveRegion="polite" style={styles.body}>
                {emailVerification?.deliveryStatus === 'sent'
                  ? 'We sent a six-digit verification code to your email. Check your inbox and spam folder.'
                  : emailVerification?.deliveryStatus === 'unavailable'
                    ? 'Your account is ready, but we could not send the verification email right now. You can retry or continue to your profile and verify later in Settings.'
                    : 'Send a verification code to confirm this email address.'}
              </Text>
              <TextInput accessibilityLabel="Six-digit verification code" value={code} onChangeText={(value) => setCode(value.replace(/\D/g, '').slice(0, 6))} keyboardType="number-pad" textContentType="oneTimeCode" autoComplete="one-time-code" maxLength={6} placeholder="000000" style={styles.input} />
              {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
              <Button title="Verify email" loading={busy === 'verify'} disabled={!!busy || !isVerificationCode(code)} onPress={confirmCode} />
              <Button title={remaining > 0 ? `Resend code in ${remaining}s` : 'Send verification code'} variant="outline" loading={busy === 'send'} disabled={!!busy || remaining > 0} onPress={sendCode} />
              <Button title="Continue to your profile — verify later" variant="text" disabled={!!busy} onPress={continueToProfile} />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </RadialGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingTop: 72, gap: 20, maxWidth: 560, alignSelf: 'center', width: '100%' },
  title: { fontSize: 28, fontWeight: '700', color: designTokens.colors.semantic.text },
  body: { fontSize: 16, lineHeight: 24, color: designTokens.colors.semantic.textSecondary },
  input: { borderWidth: 1, borderColor: designTokens.colors.semantic.border, borderRadius: 12, padding: 16, fontSize: 24, letterSpacing: 8, color: designTokens.colors.semantic.text },
  error: { color: designTokens.colors.semantic.error, fontSize: 14 },
});
