import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { CheckCircle, QrCode, RefreshCw } from 'lucide-react-native';

import { createPromptPayCharge, fetchPromptPayCharge, type PromptPayCharge } from '@/services/api/payments/payments';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { designTokens } from '@/constants/design-tokens';

interface PromptPayPaymentProps {
  bookingId: string;
  onPaid?: () => void;
}

export const PromptPayPayment: React.FC<PromptPayPaymentProps> = ({ bookingId, onPaid }) => {
  const [charge, setCharge] = useState<PromptPayCharge | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyCharge = (nextCharge: PromptPayCharge) => {
    setCharge(nextCharge);
    setError(null);
    if (nextCharge.status === 'paid') onPaid?.();
  };

  const beginPayment = async () => {
    setIsLoading(true);
    setError(null);
    try {
      applyCharge(await createPromptPayCharge(bookingId));
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'PromptPay is temporarily unavailable.');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshPayment = async () => {
    if (!charge) return;
    setIsLoading(true);
    setError(null);
    try {
      applyCharge(await fetchPromptPayCharge(charge.id));
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Could not refresh payment status.');
    } finally {
      setIsLoading(false);
    }
  };

  if (charge?.status === 'paid') {
    return (
      <Card style={styles.card} padding={18}>
        <View style={styles.titleRow}>
          <CheckCircle size={22} color={designTokens.colors.semantic.success} />
          <Text style={styles.title}>PromptPay complete</Text>
        </View>
        <Text style={styles.body}>This confirmed itinerary is paid. Your booking remains available in Tirak.</Text>
      </Card>
    );
  }

  const needsRetry = charge?.status === 'failed' || charge?.status === 'expired';

  return (
    <Card style={styles.card} padding={18}>
      <View style={styles.titleRow}>
        <QrCode size={22} color={designTokens.colors.semantic.primary} />
        <Text style={styles.title}>PromptPay</Text>
      </View>

      {!charge && !isLoading && (
        <>
          <Text style={styles.body}>
            Tirak creates the QR from your confirmed booking. No amount, card data, or payment secret is sent by this app.
          </Text>
          <Button title="Create PromptPay QR" onPress={beginPayment} fullWidth />
        </>
      )}

      {isLoading && (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={designTokens.colors.semantic.primary} />
          <Text style={styles.body}>{charge ? 'Refreshing payment status…' : 'Creating secure QR…'}</Text>
        </View>
      )}

      {charge?.status === 'pending' && !isLoading && (
        <>
          {charge.qrCodeUrl ? (
            <Image
              source={{ uri: charge.qrCodeUrl }}
              style={styles.qrImage}
              contentFit="contain"
              accessibilityLabel="PromptPay QR code for this confirmed booking"
            />
          ) : (
            <Text style={styles.errorText}>The charge is active, but its QR image is not ready yet.</Text>
          )}
          {charge.expiresAt && (
            <Text style={styles.caption}>QR expires {new Date(charge.expiresAt).toLocaleString()}</Text>
          )}
          <Button
            title="Refresh payment status"
            variant="outline"
            onPress={refreshPayment}
            leftIcon={<RefreshCw size={17} color={designTokens.colors.semantic.primary} />}
            fullWidth
          />
        </>
      )}

      {needsRetry && !isLoading && (
        <>
          <Text style={styles.errorText}>
            {charge.status === 'expired'
              ? 'This QR expired. Your confirmed booking is unchanged.'
              : 'Payment did not complete. Your confirmed booking is unchanged.'}
          </Text>
          <Button title="Create a new QR" onPress={beginPayment} fullWidth />
        </>
      )}

      {error && !isLoading && (
        <>
          <Text style={styles.errorText}>{error} Your booking is still confirmed.</Text>
          <Button title={charge ? 'Try refresh again' : 'Try again'} onPress={charge ? refreshPayment : beginPayment} fullWidth />
        </>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: { marginTop: 4, marginBottom: 18 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  title: { fontSize: 18, fontWeight: '700', color: designTokens.colors.semantic.text },
  body: { flex: 1, fontSize: 14, lineHeight: 20, color: designTokens.colors.semantic.textSecondary, marginBottom: 14 },
  caption: { textAlign: 'center', fontSize: 12, color: designTokens.colors.semantic.textSecondary, marginBottom: 12 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qrImage: { width: 240, height: 240, alignSelf: 'center', marginVertical: 8 },
  errorText: { fontSize: 14, lineHeight: 20, color: designTokens.colors.semantic.error, marginBottom: 12 },
});
