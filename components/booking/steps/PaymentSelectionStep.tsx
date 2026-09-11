import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  AlertCircle,
  Banknote,
  CheckCircle,
  CreditCard,
  LockKeyhole,
  Smartphone,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { PromptPayPendingCard } from '@/components/booking/payment/PromptPayPendingCard';
import { BookingStepFooter } from '@/components/booking/BookingStepFooter';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { API_BASE_URL } from '@/constants/api';
import { designTokens } from '@/constants/design-tokens';
import { isLocalPromptPayEnabled } from '@/constants/payment-capabilities';
import { useBookingStore, type BookingPayment } from '@/stores/booking-store';
import { usePaymentStore, type PaymentMethod } from '@/stores/payment-store';
import { formatBookingTotal } from '@/components/booking/booking-format';

interface PaymentSelectionStepProps {
  onNext: () => void;
  onPrevious: () => void;
}

interface MethodCardProps {
  id: PaymentMethod;
  title: string;
  body: string;
  accessibilityLabel: string;
  selected: boolean;
  disabled: boolean;
  onPress: () => void;
  icon: React.ComponentType<{ size: number; color: string }>;
  badge?: string;
  helper?: string;
}

const DEFINITE_NO_CHARGE_ERRORS = new Set([
  'disabled',
  'unauthorized',
  'booking-not-found',
  'booking-not-payable',
]);

const UNCERTAIN_ERRORS = new Set([
  'in-progress',
  'indeterminate',
  'network',
  'unknown',
]);

const RESTITUTION_PHASES = new Set([
  'restitution_pending',
  'restituted',
  'restitution_failed',
]);

const MethodCard: React.FC<MethodCardProps> = ({
  id,
  title,
  body,
  accessibilityLabel,
  selected,
  disabled,
  onPress,
  icon: Icon,
  badge,
  helper,
}) => (
  <TouchableOpacity
    accessibilityRole="radio"
    accessibilityLabel={accessibilityLabel}
    accessibilityState={{ selected, disabled }}
    activeOpacity={disabled ? 1 : 0.8}
    disabled={disabled}
    onPress={onPress}
    style={[
      styles.methodCard,
      selected && styles.methodCardSelected,
      disabled && !selected && styles.methodCardDisabled,
    ]}
  >
    <View style={styles.methodHeader}>
      <View style={styles.methodIcon}>
        <Icon
          size={24}
          color={designTokens.colors.semantic.primary}
        />
      </View>
      <View style={styles.methodCopy}>
        <View style={styles.methodTitleRow}>
          <Text style={styles.methodTitle}>
            {title}
          </Text>
          {badge ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.methodBody}>
          {body}
        </Text>
        {helper ? (
          <Text style={styles.methodHelper}>
            {helper}
          </Text>
        ) : null}
      </View>
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected ? (
          <CheckCircle size={20} color={designTokens.colors.semantic.primary} />
        ) : null}
      </View>
    </View>
  </TouchableOpacity>
);

export const PaymentSelectionStep: React.FC<PaymentSelectionStepProps> = ({
  onNext,
  onPrevious,
}) => {
  const { t, i18n } = useTranslation();
  const language = i18n?.resolvedLanguage || i18n?.language || 'en';
  const { updatePayment, calculateTotal } = useBookingStore();
  const {
    booking,
    selectedMethod,
    charge,
    phase,
    errorKind,
    selectMethod,
    createCharge,
  } = usePaymentStore();

  const promptPayVisible = isLocalPromptPayEnabled({
    flag: process.env.EXPO_PUBLIC_PROMPTPAY_ENABLED,
    apiBaseUrl: API_BASE_URL,
    isDev: __DEV__,
  });
  const paymentPhase = phase as string;
  const paymentErrorKind = errorKind as string | null;
  const promptPayEligible = booking?.status === 'confirmed';
  const alreadyPaid = paymentPhase === 'paid'
    || paymentErrorKind === 'already-paid'
    || ['paid', 'completed', 'refunded'].includes(booking?.paymentStatus || '');
  const restitutionLocked = RESTITUTION_PHASES.has(paymentPhase);
  const financiallyClosed = alreadyPaid || restitutionLocked;
  const uncertain = paymentPhase === 'indeterminate'
    || (paymentPhase === 'error'
      && paymentErrorKind !== null
      && UNCERTAIN_ERRORS.has(paymentErrorKind));
  const definiteNoCharge = paymentPhase === 'error'
    && errorKind !== null
    && DEFINITE_NO_CHARGE_ERRORS.has(errorKind);
  const methodSwitchLocked = ['creating', 'pending'].includes(paymentPhase) || uncertain || financiallyClosed;
  const totalAmount = calculateTotal();

  const saveMethod = (method: PaymentMethod) => {
    if (methodSwitchLocked) return;
    if (method === 'promptpay' && !promptPayEligible) return;

    selectMethod(method);
    const paymentData: BookingPayment = {
      method,
      amount: totalAmount,
      serviceFee: 0,
      totalAmount,
      currency: 'THB',
      terms: false,
    };
    updatePayment(paymentData);
  };

  const handleCreateQr = () => {
    if (selectedMethod !== 'promptpay' || !promptPayEligible || paymentPhase === 'creating' || financiallyClosed) return;
    void createCharge().catch(() => undefined);
  };

  const canContinue = financiallyClosed
    || (!financiallyClosed && selectedMethod === 'cash')
    || (selectedMethod === 'promptpay' && (paymentPhase === 'pending' || uncertain || financiallyClosed));
  const actionTitle = paymentPhase === 'creating'
    ? t('payments.creatingQr')
    : t('payments.createPromptPayQr');
  const terminalStateCopy = paymentPhase === 'restitution_pending'
    ? t('payments.restitutionPendingState')
    : paymentPhase === 'restituted'
      ? t('payments.restitutedState')
      : paymentPhase === 'restitution_failed'
        ? t('payments.restitutionFailedState')
        : paymentErrorKind === 'already-paid' || (alreadyPaid && paymentPhase !== 'paid')
          ? t('payments.alreadyPaidState')
          : paymentPhase === 'paid'
            ? t('payments.paidState')
            : paymentPhase === 'failed'
              ? t('payments.failedState')
              : paymentPhase === 'expired'
                ? t('payments.expiredState')
                : t('payments.uncertainOutcome');

  return (
    <View style={styles.container}>
      <ScrollView
        accessibilityLabel={t('payments.checkoutA11y')}
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{t('payments.stepHeading')}</Text>
          <Text style={styles.subtitle}>
            {t('payments.stepBody')}
          </Text>
        </View>

        <Card style={styles.amountCard} padding={16}>
          <View style={styles.amountHeader}>
            <CreditCard size={20} color={designTokens.colors.semantic.primary} />
            <Text style={styles.sectionTitle}>{t('payments.summaryHeading')}</Text>
          </View>
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>{t('payments.guideRate')}</Text>
            <Text style={styles.amountValue}>{formatBookingTotal(totalAmount, language)}</Text>
          </View>
        </Card>

        <View style={styles.methods} accessibilityRole="radiogroup">
          <MethodCard
            id="cash"
            title={t('payments.cashTitle')}
            body={financiallyClosed ? t('payments.alternatePaymentUnavailablePaid') : t('payments.cashBody')}
            accessibilityLabel={t('payments.cashMethodA11y')}
            selected={selectedMethod === 'cash'}
            disabled={methodSwitchLocked}
            onPress={() => saveMethod('cash')}
            icon={Banknote}
            badge={t('payments.recommended')}
            helper={financiallyClosed
              ? t('payments.paymentLockedHelper')
              : methodSwitchLocked
                ? t('payments.lockedCashHelper')
                : undefined}
          />

          {promptPayVisible ? (
            <MethodCard
              id="promptpay"
              title={t('payments.promptPayTitle')}
              body={financiallyClosed
                ? t('payments.alternatePaymentUnavailablePaid')
                : t('payments.promptPayBody')}
              accessibilityLabel={t('payments.promptPayMethodA11y')}
              selected={selectedMethod === 'promptpay'}
              disabled={!promptPayEligible || methodSwitchLocked}
              onPress={() => saveMethod('promptpay')}
              icon={Smartphone}
              badge={t('payments.localTest')}
              helper={!promptPayEligible
                ? t('payments.ineligible')
                : financiallyClosed
                  ? t('payments.paymentLockedHelper')
                  : methodSwitchLocked
                  ? t('payments.lockedCashHelper')
                  : undefined}
            />
          ) : null}
        </View>

        {selectedMethod === 'promptpay' && paymentPhase === 'idle' ? (
          <Card style={styles.actionCard} padding={16}>
            <View style={styles.noticeRow}>
              <LockKeyhole size={20} color={designTokens.colors.semantic.info} />
              <Text style={styles.noticeText}>
                {t('payments.serverChargeNotice')}
              </Text>
            </View>
            <Button
              title={actionTitle}
              onPress={handleCreateQr}
              disabled={!promptPayEligible}
              fullWidth
            />
          </Card>
        ) : null}

        {selectedMethod === 'promptpay' && paymentPhase === 'creating' ? (
          <Card style={styles.actionCard} padding={16}>
            <View style={styles.noticeRow} accessibilityLiveRegion="polite">
              <Smartphone size={20} color={designTokens.colors.semantic.primary} />
              <Text style={styles.noticeText}>{t('payments.creatingQr')}</Text>
            </View>
            <Button title={actionTitle} onPress={handleCreateQr} loading disabled fullWidth />
          </Card>
        ) : null}

        {selectedMethod === 'promptpay' && paymentPhase === 'error' && !financiallyClosed ? (
          <Card style={styles.errorCard} padding={16}>
            <View style={styles.noticeRow} accessibilityLiveRegion="polite">
              <AlertCircle size={20} color={designTokens.colors.semantic.error} />
              <Text style={styles.errorText}>
                {uncertain
                  ? t('payments.uncertainOutcome')
                  : errorKind === 'disabled'
                    ? t('payments.disabledError')
                    : t('payments.noChargeError')}
              </Text>
            </View>
            {definiteNoCharge && errorKind !== 'disabled' ? (
              <Button title={t('common.tryAgain')} onPress={handleCreateQr} variant="outline" fullWidth />
            ) : null}
          </Card>
        ) : null}

        {selectedMethod === 'promptpay' && paymentPhase === 'pending' && charge ? (
          <PromptPayPendingCard charge={charge} />
        ) : null}

        {(financiallyClosed || (selectedMethod === 'promptpay'
          && ['failed', 'expired', 'indeterminate'].includes(paymentPhase))) ? (
          <Card style={alreadyPaid ? styles.successCard : styles.errorCard} padding={16}>
            <View style={styles.noticeRow} accessibilityLiveRegion="polite">
              {alreadyPaid
                ? <CheckCircle size={20} color={designTokens.colors.semantic.success} />
                : <AlertCircle size={20} color={designTokens.colors.semantic.error} />}
              <Text style={alreadyPaid ? styles.noticeText : styles.errorText}>
                {terminalStateCopy}
              </Text>
            </View>
          </Card>
        ) : null}

        {!financiallyClosed ? <Card style={styles.securityCard} padding={16}>
          <View style={styles.noticeRow}>
            <AlertCircle size={20} color={designTokens.colors.semantic.accent} />
            <Text style={styles.sectionTitle}>{t('payments.safetyHeading')}</Text>
          </View>
          <Text style={styles.securityText}>
            {t('payments.safetyBody')}
          </Text>
        </Card> : null}

        <BookingStepFooter
          onPrevious={onPrevious}
          onNext={onNext}
          nextTitle={t('payments.continue')}
          nextDisabled={!canContinue}
          loading={paymentPhase === 'creating'}
          showPrevious
          showNext
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: designTokens.colors.semantic.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: designTokens.spacing.scale.lg,
  },
  contentContainer: {
    paddingBottom: designTokens.spacing.scale.xl,
  },
  header: {
    alignItems: 'center',
    paddingVertical: designTokens.spacing.scale.xl,
  },
  title: {
    ...designTokens.typography.styles.heading,
    color: designTokens.colors.semantic.text,
    textAlign: 'center',
  },
  subtitle: {
    ...designTokens.typography.styles.body,
    color: designTokens.colors.semantic.textSecondary,
    textAlign: 'center',
    marginTop: designTokens.spacing.scale.sm,
  },
  amountCard: {
    marginBottom: designTokens.spacing.scale.xl,
    backgroundColor: designTokens.colors.semantic.surface,
  },
  amountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.scale.sm,
    marginBottom: designTokens.spacing.scale.md,
  },
  sectionTitle: {
    ...designTokens.typography.styles.subheading,
    color: designTokens.colors.semantic.text,
  },
  amountRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: designTokens.spacing.scale.md,
  },
  amountLabel: {
    ...designTokens.typography.styles.body,
    color: designTokens.colors.semantic.textSecondary,
  },
  amountValue: {
    ...designTokens.typography.styles.subheading,
    color: designTokens.colors.semantic.text,
  },
  methods: {
    gap: designTokens.spacing.scale.lg,
    marginBottom: designTokens.spacing.scale.xl,
  },
  methodCard: {
    minHeight: 80,
    padding: designTokens.spacing.scale.lg,
    borderWidth: 2,
    borderColor: designTokens.colors.semantic.border,
    borderRadius: designTokens.borderRadius.components.card,
    backgroundColor: designTokens.colors.semantic.surface,
  },
  methodCardSelected: {
    borderColor: designTokens.colors.semantic.primary,
    backgroundColor: `${designTokens.colors.semantic.primary}0D`,
  },
  methodCardDisabled: {
    borderColor: designTokens.colors.semantic.textSecondary,
    backgroundColor: designTokens.colors.semantic.surface,
  },
  methodHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: designTokens.spacing.scale.md,
  },
  methodIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${designTokens.colors.semantic.primary}14`,
  },
  methodCopy: {
    flex: 1,
  },
  methodTitleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: designTokens.spacing.scale.sm,
  },
  methodTitle: {
    ...designTokens.typography.styles.subheading,
    color: designTokens.colors.semantic.text,
  },
  methodBody: {
    ...designTokens.typography.styles.body,
    color: designTokens.colors.semantic.textSecondary,
    marginTop: designTokens.spacing.scale.xs,
  },
  methodHelper: {
    ...designTokens.typography.styles.caption,
    color: designTokens.colors.semantic.textSecondary,
    marginTop: designTokens.spacing.scale.sm,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: designTokens.spacing.scale.sm,
    paddingVertical: designTokens.spacing.scale.xs,
    borderRadius: 999,
    backgroundColor: designTokens.colors.semantic.accent,
  },
  badgeText: {
    ...designTokens.typography.styles.caption,
    fontSize: designTokens.typography.sizes.small,
    fontWeight: designTokens.typography.weights.semibold,
    color: designTokens.colors.semantic.text,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: designTokens.colors.semantic.border,
  },
  radioSelected: {
    borderColor: designTokens.colors.semantic.primary,
  },
  actionCard: {
    marginBottom: designTokens.spacing.scale.xl,
    backgroundColor: designTokens.colors.semantic.surface,
  },
  errorCard: {
    marginBottom: designTokens.spacing.scale.xl,
    borderWidth: 1,
    borderColor: designTokens.colors.semantic.error,
    backgroundColor: designTokens.colors.semantic.surface,
  },
  successCard: {
    marginBottom: designTokens.spacing.scale.xl,
    borderWidth: 1,
    borderColor: designTokens.colors.semantic.success,
    backgroundColor: designTokens.colors.semantic.surface,
  },
  noticeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: designTokens.spacing.scale.sm,
    marginBottom: designTokens.spacing.scale.md,
  },
  noticeText: {
    flex: 1,
    ...designTokens.typography.styles.body,
    color: designTokens.colors.semantic.text,
  },
  errorText: {
    flex: 1,
    ...designTokens.typography.styles.body,
    color: designTokens.colors.semantic.error,
  },
  securityCard: {
    marginBottom: designTokens.spacing.scale.xl,
    backgroundColor: designTokens.colors.semantic.surface,
  },
  securityText: {
    ...designTokens.typography.styles.caption,
    color: designTokens.colors.semantic.textSecondary,
  },
});
