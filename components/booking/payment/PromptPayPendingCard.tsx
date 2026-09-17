import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Clock3, QrCode } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import type { PromptPayCharge } from '@/app/api/payment/payment';
import { Card } from '@/components/ui/Card';
import { designTokens } from '@/constants/design-tokens';

interface PromptPayPendingCardProps {
  charge: PromptPayCharge;
}

const formatExpiry = (expiresAt: string, locale: string): string | null => {
  const expiry = new Date(expiresAt);
  if (Number.isNaN(expiry.getTime())) return null;
  return expiry.toLocaleString(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const shortenChargeId = (chargeId: string): string => {
  if (chargeId.length <= 14) return chargeId;
  return `${chargeId.slice(0, 9)}…${chargeId.slice(-4)}`;
};

export const PromptPayPendingCard: React.FC<PromptPayPendingCardProps> = ({ charge }) => {
  const { t, i18n } = useTranslation();
  const language = i18n?.resolvedLanguage || i18n?.language || 'en';
  const locale = language?.toLowerCase().startsWith('th') ? 'th-TH' : 'en-US';
  const expiry = charge.expiresAt ? formatExpiry(charge.expiresAt, locale) : null;

  return (
    <Card style={styles.card} padding={16}>
      <View style={styles.statusRow} accessibilityLiveRegion="polite">
        <View style={styles.pendingIcon}>
          <Clock3 size={22} color={designTokens.colors.semantic.warning} />
        </View>
        <View style={styles.statusCopy}>
          <Text style={styles.heading}>{t('payments.pendingHeading')}</Text>
          <Text style={styles.amount}>
            {charge.displayTotalThb.toLocaleString(locale)} {charge.currency}
          </Text>
        </View>
      </View>

      <Text style={styles.body}>
        {t('payments.pendingBody')}
      </Text>

      {charge.qrCodeUrl ? (
        <View style={styles.qrFrame}>
          <Image
            source={{ uri: charge.qrCodeUrl }}
            style={styles.qrImage}
            resizeMode="contain"
            accessibilityRole="image"
            accessibilityLabel={t('payments.pendingQrA11y')}
          />
        </View>
      ) : (
        <View style={styles.unavailableRow} accessibilityLiveRegion="polite">
          <QrCode size={20} color={designTokens.colors.semantic.warning} />
          <Text style={styles.unavailableText}>
            {t('payments.qrUnavailable')}
          </Text>
        </View>
      )}

      <View style={styles.metadata}>
        {expiry ? <Text style={styles.metadataText}>{t('payments.expires')} {expiry}</Text> : null}
        {charge.chargeId ? (
          <Text style={styles.metadataText}>{t('payments.chargeReference')} {shortenChargeId(charge.chargeId)}</Text>
        ) : null}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: designTokens.spacing.scale.xl,
    borderWidth: 1,
    borderColor: designTokens.colors.semantic.warning,
    backgroundColor: designTokens.colors.semantic.surface,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.scale.md,
    marginBottom: designTokens.spacing.scale.md,
  },
  pendingIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${designTokens.colors.semantic.warning}18`,
  },
  statusCopy: {
    flex: 1,
  },
  heading: {
    ...designTokens.typography.styles.subheading,
    color: designTokens.colors.semantic.text,
  },
  amount: {
    marginTop: designTokens.spacing.scale.xs,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: designTokens.typography.weights.bold,
    color: designTokens.colors.semantic.text,
  },
  body: {
    ...designTokens.typography.styles.body,
    color: designTokens.colors.semantic.textSecondary,
    marginBottom: designTokens.spacing.scale.lg,
  },
  qrFrame: {
    alignSelf: 'center',
    width: 256,
    maxWidth: '100%',
    paddingVertical: designTokens.spacing.scale.xl,
    paddingHorizontal: designTokens.spacing.scale.lg,
    alignItems: 'center',
    borderRadius: designTokens.borderRadius.components.card,
    backgroundColor: '#FFFFFF',
  },
  qrImage: {
    width: 224,
    height: 224,
  },
  unavailableRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: designTokens.spacing.scale.sm,
    padding: designTokens.spacing.scale.md,
    borderRadius: designTokens.borderRadius.components.card,
    backgroundColor: `${designTokens.colors.semantic.warning}12`,
  },
  unavailableText: {
    flex: 1,
    ...designTokens.typography.styles.caption,
    color: designTokens.colors.semantic.text,
  },
  metadata: {
    gap: designTokens.spacing.scale.xs,
    marginTop: designTokens.spacing.scale.lg,
  },
  metadataText: {
    ...designTokens.typography.styles.caption,
    color: designTokens.colors.semantic.textSecondary,
  },
});
