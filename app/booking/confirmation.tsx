import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { RadialGradient } from '@/components/ui/RadialGradient';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LottiePlayer } from '@/components/ui/LottiePlayer';
import { SoundManager } from '@/utils/sound-manager';
import { designTokens } from '@/constants/design-tokens';
import { Calendar, MessageCircle, Home } from 'lucide-react-native';
import { useBookingStore } from '@/stores/booking-store';
import { usePaymentStore, deriveBookingPaymentPhase } from '@/stores/payment-store';
import { formatBookingDate, formatBookingTime, formatBookingTotal } from '@/components/booking/booking-format';
import { useTranslation } from 'react-i18next';

export default function BookingConfirmationScreen() {
  const { bookingData } = useBookingStore();
  const { booking, selectedMethod, phase, errorKind } = usePaymentStore();
  const { t, i18n } = useTranslation();
  const language = i18n?.resolvedLanguage || i18n?.language || 'en';

  // Real receipt data from payment store, or honest fallback
  const bookingId = booking?.id ?? null;
  const hasReceipt = bookingId !== null;

  React.useEffect(() => {
    if (!hasReceipt) {
      return;
    }
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }, 300);
    }
    SoundManager.play('bookingSuccess');
  }, [hasReceipt]);

  const handleViewBooking = () => router.push('/bookings');
  const handleMessageCompanion = () => router.push('/messages');
  const handleBackToHome = () => router.push('/(app)');

  const companionName = bookingData.companionData?.name ?? null;
  const bookingDate = bookingData.dateTime?.date ?? null;
  const bookingTime = bookingData.dateTime?.time ?? null;
  const duration = bookingData.service?.duration ?? null;
  const location = bookingData.location?.area ?? null;
  const totalAmount = bookingData.bookingQuote?.totalAmount ?? null;
  const currency = bookingData.bookingQuote?.currency ?? booking?.currency ?? 'THB';
  const effectiveMethod = selectedMethod || bookingData.payment?.method || null;

  const bookingPhase = booking ? deriveBookingPaymentPhase(booking.paymentStatus) : 'idle';
  const effectivePhase = phase === 'idle' && bookingPhase !== 'idle' ? bookingPhase : phase;

  let paymentLabel: string;
  if (!hasReceipt) {
    paymentLabel = t('bookingConfirmation.noReceipt', 'No payment receipt available');
  } else if (effectivePhase === 'paid') {
    paymentLabel = effectiveMethod === 'promptpay'
      ? t('bookingConfirmation.paidPromptPay', 'Paid via PromptPay')
      : t('bookingConfirmation.paidCash', 'Pay cash directly to your guide');
  } else if (effectivePhase === 'pending' || effectivePhase === 'creating') {
    paymentLabel = t('bookingConfirmation.paymentPending', 'Payment pending');
  } else if (effectivePhase === 'failed' || effectivePhase === 'expired') {
    paymentLabel = t('bookingConfirmation.paymentFailed', 'Payment was not completed');
  } else {
    paymentLabel = t('bookingConfirmation.paymentUnavailable', 'Payment status unavailable');
  }

  return (
    <RadialGradient variant="primary" style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {hasReceipt ? (
          <View style={styles.successIcon}>
            <LottiePlayer
              name="bookingSuccess"
              autoPlay
              loop={false}
              style={{ width: 120, height: 120 }}
            />
          </View>
        ) : null}

        <Text style={styles.title}>{hasReceipt ? 'Guide Request Sent' : 'No booking available'}</Text>
        <Text style={styles.subtitle}>
          {hasReceipt
            ? 'Your Tirak guide has the details. Keep chat open for meeting-point updates.'
            : 'We could not confirm a booking receipt for this request. Check your bookings before trying again.'}
        </Text>

        <Card style={styles.bookingCard} padding={20}>
          <Text style={styles.bookingTitle}>{hasReceipt ? 'Request Details' : 'No booking available'}</Text>

          <View style={styles.bookingDetail}>
            <Text style={styles.detailLabel}>Booking ID</Text>
            <Text style={styles.detailValue}>
              {bookingId ?? '—'}
            </Text>
          </View>

          <View style={styles.bookingDetail}>
            <Text style={styles.detailLabel}>Local Guide</Text>
            <Text style={styles.detailValue}>
              {companionName ?? '—'}
            </Text>
          </View>

          <View style={styles.bookingDetail}>
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailValue}>
              {bookingDate ? formatBookingDate(bookingDate, language) : '—'}
            </Text>
          </View>

          <View style={styles.bookingDetail}>
            <Text style={styles.detailLabel}>Time</Text>
            <Text style={styles.detailValue}>
              {bookingTime ? formatBookingTime(bookingTime) : '—'}
            </Text>
          </View>

          {duration != null && (
            <View style={styles.bookingDetail}>
              <Text style={styles.detailLabel}>Duration</Text>
              <Text style={styles.detailValue}>
                {duration >= 60 ? `${Math.floor(duration / 60)} hour${duration >= 120 ? 's' : ''}` : `${duration} min`}
              </Text>
            </View>
          )}

          {location && (
            <View style={styles.bookingDetail}>
              <Text style={styles.detailLabel}>Location</Text>
              <Text style={styles.detailValue}>{location}</Text>
            </View>
          )}

          <View style={styles.divider} />

          {totalAmount != null && (
            <View style={styles.bookingDetail}>
              <Text style={styles.detailLabel}>Guide Rate</Text>
              <Text style={styles.totalValue}>
                {formatBookingTotal(totalAmount, currency)}
              </Text>
            </View>
          )}

          <View style={styles.bookingDetail}>
            <Text style={styles.detailLabel}>Payment</Text>
            <Text style={styles.detailValue}>{paymentLabel}</Text>
          </View>
        </Card>

        <Card style={styles.nextStepsCard} padding={20}>
          <Text style={styles.nextStepsTitle}>Next steps</Text>

          <View style={styles.stepItem}>
            <View style={styles.stepIcon}>
              <Calendar size={24} color={designTokens.colors.semantic.primary} />
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Add to Calendar</Text>
              <Text style={styles.stepDescription}>
                Save the time so your Tirak day is easy to find later.
              </Text>
            </View>
          </View>

          <View style={styles.stepItem}>
            <View style={styles.stepIcon}>
              <MessageCircle size={24} color={designTokens.colors.semantic.primary} />
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Message your guide</Text>
              <Text style={styles.stepDescription}>
                Confirm the meeting point, pace, food needs, and anything your guide should know.
              </Text>
            </View>
          </View>
        </Card>

        <View style={styles.actionsContainer}>
          <Button
            title="View Booking"
            variant="white"
            onPress={handleViewBooking}
            fullWidth
            style={styles.actionButton}
            icon={<Calendar size={18} color={designTokens.colors.semantic.primary} />}
          />

          <Button
            title="Message Guide"
            variant="white"
            onPress={handleMessageCompanion}
            fullWidth
            style={styles.actionButton}
            icon={<MessageCircle size={18} color={designTokens.colors.semantic.primary} />}
          />

          <Button
            title="Back to Home"
            variant="primary"
            onPress={handleBackToHome}
            fullWidth
            style={styles.actionButton}
            icon={<Home size={18} color={designTokens.colors.semantic.surface} />}
          />
        </View>
      </ScrollView>
    </RadialGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: 'center',
  },
  successIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: designTokens.colors.semantic.surface,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: designTokens.colors.semantic.surface,
    opacity: 0.9,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  bookingCard: {
    width: '100%',
    marginBottom: 16,
  },
  bookingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: designTokens.colors.semantic.text,
    marginBottom: 16,
  },
  bookingDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: designTokens.colors.semantic.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    color: designTokens.colors.semantic.text,
    fontWeight: '500',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: designTokens.colors.semantic.primary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: designTokens.colors.semantic.success,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: designTokens.colors.semantic.border,
    marginVertical: 16,
  },
  nextStepsCard: {
    width: '100%',
    marginBottom: 24,
  },
  nextStepsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: designTokens.colors.semantic.text,
    marginBottom: 16,
  },
  stepItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  stepIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(111, 76, 170, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: designTokens.colors.semantic.text,
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: designTokens.colors.semantic.textSecondary,
    lineHeight: 20,
  },
  actionsContainer: {
    width: '100%',
    gap: 12,
  },
  actionButton: {
    marginBottom: 0,
  },
});
