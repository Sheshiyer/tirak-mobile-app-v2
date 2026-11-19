import { logger } from '@/utils/logger';
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Linking,
} from 'react-native';
import { 
  CheckCircle, 
  Calendar, 
  Clock, 
  MapPin, 
  MessageCircle,
  Home,
  CalendarPlus,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProfileImage } from '@/components/ui/ProfileImage';
import { useBookingStore } from '@/stores/booking-store';
import { useToast } from '@/stores/toast-store';
import { designTokens } from '@/constants/design-tokens';
import { CompanionData } from '@/types/companion';
import { useTranslation } from 'react-i18next';
import { deriveBookingPaymentPhase, usePaymentStore } from '@/stores/payment-store';
import { bookingDateTimeToInstant, calendarUtcDate, CORE_BOOKING_TIME_ZONE } from '@/utils/booking-timezone';
import { createOrGetRoom } from '@/utils/chat-api';
import {
  formatBookingDate,
  formatBookingTime,
  formatBookingTotal,
} from '@/components/booking/booking-format';

interface BookingConfirmationStepProps {
  onPrevious: () => void;
}

const bookingHeadingKeys: Record<string, string> = {
  pending: 'payments.bookingRequestSent',
  confirmed: 'payments.bookingConfirmed',
  in_progress: 'userHome.companion.inProgress',
  cancelled: 'userHome.companion.cancelled',
  completed: 'userHome.companion.completed',
};

export const BookingConfirmationStep: React.FC<BookingConfirmationStepProps> = ({
  onPrevious,
}) => {
  const { bookingData, resetBooking } = useBookingStore();
  const [animationValue] = useState(new Animated.Value(0));
  const [now, setNow] = useState(() => new Date());
  const [openingChat, setOpeningChat] = useState(false);
  const chatOpening = useRef(false);
  const toast = useToast();
  const { t, i18n } = useTranslation();
  const language = i18n?.resolvedLanguage || i18n?.language || 'en';
  const {
    booking,
    selectedMethod,
    charge,
    phase,
    errorKind,
    releasePaymentSessionIfSafe,
  } = usePaymentStore();

  useEffect(() => {
    // Start success animation
    Animated.sequence([
      Animated.timing(animationValue, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Early return if no companion data
  if (!bookingData.companionData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{t('bookingConfirmation.noCompanionData')}</Text>
      </View>
    );
  }

  const handleViewBookings = () => {
    releasePaymentSessionIfSafe();
    resetBooking();
    router.push('/bookings');
  };

  const handleBackToHome = () => {
    releasePaymentSessionIfSafe();
    resetBooking();
    router.push('/(app)');
  };

  const bookingId = booking?.id || null;
  const companion = bookingData.companionData;
  const service = bookingData.service;
  const dateTime = bookingData.dateTime;
  const location = bookingData.location;
  const payment = bookingData.payment;
  const effectivePaymentMethod = selectedMethod || payment?.method || 'cash';
  const isBookingPending = booking?.status === 'pending';
  const isBookingConfirmed = booking?.status === 'confirmed' || booking?.status === 'in_progress';
  const bookingPhase = booking ? deriveBookingPaymentPhase(booking.paymentStatus) : 'idle';
  const paymentPhase = phase === 'idle' && bookingPhase !== 'idle' ? bookingPhase : phase;
  const paymentErrorKind = errorKind;
  const isPromptPayMethod = effectivePaymentMethod === 'promptpay';
  const alreadyPaid = paymentPhase === 'paid' || paymentErrorKind === 'already-paid';
  const restitutionLocked = [
    'restitution_pending',
    'restituted',
    'restitution_failed',
  ].includes(paymentPhase);
  const paymentConfirmed = alreadyPaid && !restitutionLocked;
  const isPromptPayUncertain = isPromptPayMethod && (
    paymentPhase === 'indeterminate'
    || (paymentPhase === 'error'
      && ['in-progress', 'indeterminate', 'network', 'unknown'].includes(paymentErrorKind || ''))
  );
  const statusHeading = t(bookingHeadingKeys[booking?.status ?? ''] ?? 'bookingConfirmation.statusUnavailable');
  let paymentStateCopy = isPromptPayMethod
    ? t('payments.promptPayPendingState')
    : t('payments.cashState');

  if (paymentPhase === 'restitution_pending') {
    paymentStateCopy = t('payments.restitutionPendingState');
  } else if (paymentPhase === 'restituted') {
    paymentStateCopy = t('payments.restitutedState');
  } else if (paymentPhase === 'restitution_failed') {
    paymentStateCopy = t('payments.restitutionFailedState');
  } else if (alreadyPaid) {
    paymentStateCopy = paymentErrorKind === 'already-paid'
      ? t('payments.alreadyPaidState')
      : t('payments.paidState');
  } else if (isPromptPayUncertain) {
    paymentStateCopy = t('payments.uncertainOutcome');
  } else if (paymentPhase === 'failed') {
    paymentStateCopy = t('payments.failedState');
  } else if (paymentPhase === 'expired') {
    paymentStateCopy = t('payments.expiredState');
  }
  const pendingPresentation = !isBookingConfirmed || (isPromptPayMethod && !paymentConfirmed);
  let startsAt: Date | null = null;
  let endsAt: Date | null = null;
  if (dateTime) {
    try {
      startsAt = bookingDateTimeToInstant(dateTime.date, dateTime.time);
      endsAt = bookingDateTimeToInstant(dateTime.date, dateTime.endTime);
    } catch { /* Missing or invalid schedules cannot be added to the calendar. */ }
  }
  const canAddToCalendar = Boolean(startsAt && endsAt && endsAt > startsAt);
  const countdownMs = startsAt ? Math.max(0, startsAt.getTime() - now.getTime()) : 0;
  const countdownDays = Math.floor(countdownMs / (1000 * 60 * 60 * 24));
  const countdownHours = Math.floor((countdownMs / (1000 * 60 * 60)) % 24);
  const countdownMinutes = Math.floor((countdownMs / (1000 * 60)) % 60);
  const countdownText = startsAt
    ? countdownMs > 0
      ? t('bookingConfirmation.countdown', {
          days: countdownDays,
          hours: countdownHours,
          minutes: countdownMinutes,
        })
      : t('bookingConfirmation.startTimeReached')
    : t('bookingConfirmation.datePending');

  const handleAddToCalendar = async () => {
    if (!isBookingConfirmed || !startsAt || !endsAt || !canAddToCalendar) return;
    const title = encodeURIComponent(t('bookingConfirmation.calendarTitle', {
      service: service?.name || t('bookingConfirmation.localGuideBooking'),
      guide: companion.name,
    }));
    const details = encodeURIComponent(t('bookingConfirmation.calendarDetails', {
      paymentState: paymentStateCopy,
    }));
    const locationText = encodeURIComponent([location?.meetingPoint, location?.area].filter(Boolean).join(', '));
    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${calendarUtcDate(startsAt)}/${calendarUtcDate(endsAt)}&ctz=${encodeURIComponent(CORE_BOOKING_TIME_ZONE)}&details=${details}&location=${locationText}`;

    try {
      await Linking.openURL(calendarUrl);
    } catch (error) {
      logger.warn('Unable to open calendar link', error);
      toast.error(t('bookingConfirmation.calendarOpenFailed'));
    }
  };

  const handleMessageCompanion = async () => {
    if (!bookingId || !isBookingConfirmed || chatOpening.current) return;
    chatOpening.current = true;
    setOpeningChat(true);
    try {
      const roomId = await createOrGetRoom(bookingId);
      if (roomId) router.push(`/chat/${encodeURIComponent(roomId)}`);
      else toast.error(t('bookingConfirmation.chatUnavailable'));
    } finally {
      chatOpening.current = false;
      setOpeningChat(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Booking and payment truth */}
        <Animated.View 
          style={[
            styles.successContainer,
            {
              opacity: animationValue,
              transform: [{
                scale: animationValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1],
                }),
              }],
            },
          ]}
        >
          {isBookingConfirmed && !pendingPresentation ? (
            <View style={styles.successIcon} accessibilityLabel={t('bookingConfirmation.confirmedStatusA11y')}>
              <CheckCircle size={64} color={designTokens.colors.semantic.success} />
            </View>
          ) : isBookingPending || isBookingConfirmed ? (
            <View style={styles.pendingStatusIcon} accessibilityLabel={t('bookingConfirmation.pendingStatusA11y')}>
              <Clock size={48} color={designTokens.colors.semantic.warning} />
            </View>
          ) : null}
          <Text style={[
            styles.successTitle,
            pendingPresentation && styles.pendingTitle,
          ]}>
            {statusHeading}
          </Text>
          {(isBookingConfirmed || isBookingPending || isPromptPayMethod) && (
            <Text style={styles.successSubtitle}>{paymentStateCopy}</Text>
          )}
          {isBookingPending && (
            <Text style={styles.successSubtitle}>{t('bookingConfirmation.awaitingGuide')}</Text>
          )}
          {bookingId && (
            <View style={styles.bookingIdContainer}>
              <Text style={styles.bookingIdLabel}>{t('bookingConfirmation.bookingId')}:</Text>
              <Text style={styles.bookingIdValue}>{bookingId}</Text>
            </View>
          )}
        </Animated.View>

        {dateTime && (
          <Card style={styles.countdownCard} padding={16}>
            <View style={styles.countdownHeader}>
              <Calendar size={20} color={designTokens.colors.semantic.primary} />
              <Text style={styles.countdownTitle}>
                {t(isBookingConfirmed ? 'bookingConfirmation.startsIn' : isBookingPending ? 'bookingConfirmation.requestedDate' : 'bookingConfirmation.dateInThailand')}
              </Text>
            </View>
            {isBookingConfirmed && <Text style={styles.countdownValue}>{countdownText}</Text>}
            <Text style={styles.countdownDetail}>
              {t('bookingConfirmation.dateAtTime', {
                date: formatBookingDate(dateTime.date, language),
                time: formatBookingTime(dateTime.time, language),
              })}
            </Text>
            {isBookingConfirmed && (
              <Button
                title={t('bookingConfirmation.addToCalendar')}
                variant="outline"
                onPress={handleAddToCalendar}
                disabled={!canAddToCalendar}
                style={styles.calendarButton}
                leftIcon={<CalendarPlus size={18} color={designTokens.colors.semantic.primary} />}
                fullWidth
              />
            )}
          </Card>
        )}

        {/* Companion Contact Info */}
        <Card style={styles.sectionCard} padding={16}>
          <Text style={styles.sectionTitle}>{t('bookingConfirmation.companion')}</Text>
          
          <View style={styles.companionSection}>
            <ProfileImage
              uri={companion.image}
              size="large"
            />
            <View style={styles.companionInfo}>
              <Text style={styles.companionName}>{companion.name}</Text>
              <View style={styles.companionDetails}>
                <View style={styles.detailRow}>
                  <MapPin size={14} color={designTokens.colors.semantic.textSecondary} />
                  <Text style={styles.detailText}>{companion.location}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.ratingText}>⭐ {companion.rating}/5</Text>
                  {typeof companion.reviews === 'number' && (
                  <Text style={styles.reviewsText}>({t('bookingConfirmation.reviewCount', { count: companion.reviews })})</Text>
                  )}
                </View>
              </View>
              
              {isBookingConfirmed && (
                <View style={styles.contactButtons}>
                  <TouchableOpacity
                    style={styles.contactButton}
                    onPress={handleMessageCompanion}
                    disabled={openingChat}
                    accessibilityRole="button"
                    accessibilityLabel={t('bookingConfirmation.messageGuideA11y')}
                    accessibilityState={{ busy: openingChat, disabled: openingChat }}
                  >
                    <MessageCircle size={18} color={designTokens.colors.semantic.surface} />
                    <Text style={styles.contactButtonText}>{t('bookingConfirmation.message')}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </Card>

        {/* Booking Details Summary */}
        <Card style={styles.sectionCard} padding={16}>
          <Text style={styles.sectionTitle}>{t('bookingConfirmation.bookingDetails')}</Text>
          
          <View style={styles.bookingDetails}>
            {service && (
            <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>{t('bookingConfirmation.service')}</Text>
                <Text style={styles.detailSectionValue}>{service.name}</Text>
                {service.description && (
                  <Text style={styles.detailSectionSubvalue}>{service.description}</Text>
                )}
            </View>
            )}
            
            {dateTime && (
            <View style={styles.detailSection}>
              <View style={styles.detailRow}>
                <Calendar size={16} color={designTokens.colors.semantic.primary} />
                <Text style={styles.detailSectionTitle}>{t('bookingConfirmation.dateTime')}</Text>
              </View>
              <Text style={styles.detailSectionValue}>
                  {formatBookingDate(dateTime.date, language)}
              </Text>
              <Text style={styles.detailSectionSubvalue}>
                  {formatBookingTime(dateTime.time, language)} - {formatBookingTime(dateTime.endTime, language)}
              </Text>
            </View>
            )}
            
            {location && (
            <View style={styles.detailSection}>
              <View style={styles.detailRow}>
                <MapPin size={16} color={designTokens.colors.semantic.primary} />
                <Text style={styles.detailSectionTitle}>{t('bookingConfirmation.meetingPoint')}</Text>
              </View>
                <Text style={styles.detailSectionValue}>{location.area}</Text>
                <Text style={styles.detailSectionSubvalue}>{location.meetingPoint}</Text>
            </View>
            )}
            
            {payment && (
              <>
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>{t('bookingConfirmation.paymentMethod')}</Text>
              <Text style={styles.detailSectionValue}>
                    {effectivePaymentMethod === 'cash' ? t('bookingConfirmation.cashPayment') :
                     effectivePaymentMethod === 'promptpay' ? t('bookingConfirmation.promptPay') :
                 t('bookingConfirmation.bankTransfer')}
              </Text>
            </View>
            
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>{t('bookingConfirmation.totalAmount')}</Text>
              <Text style={styles.totalAmount}>
                    {(isPromptPayMethod && charge
                      ? `${charge.displayTotalThb.toLocaleString(language)} ${charge.currency}`
                      : formatBookingTotal(payment.totalAmount, language))}
              </Text>
            </View>
              </>
            )}
          </View>
        </Card>

        {isBookingConfirmed && (
          <Card style={styles.sectionCard} padding={16}>
            <Text style={styles.sectionTitle}>{t('bookingConfirmation.whatsNext')}</Text>
            <View style={styles.nextSteps}>
              <View style={styles.stepItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>{t('bookingConfirmation.prepareForYourExperience')}</Text>
                  <Text style={styles.stepDescription}>
                    {restitutionLocked
                      ? t('bookingConfirmation.prepareForYourExperienceRestitutionDescription')
                      : alreadyPaid
                        ? t('bookingConfirmation.prepareForYourExperiencePaidDescription')
                        : isPromptPayMethod
                          ? t('bookingConfirmation.prepareForYourExperiencePromptPayDescription')
                          : t('bookingConfirmation.prepareForYourExperienceDescription')}
                  </Text>
                </View>
              </View>
              <View style={styles.stepItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>{t('bookingConfirmation.meetAtTheLocation')}</Text>
                  <Text style={styles.stepDescription}>
                    {t('bookingConfirmation.meetAtTheLocationDescription')}
                  </Text>
                </View>
              </View>
            </View>
          </Card>
        )}

      </ScrollView>

      {/* Enhanced CTA Footer */}
      <View style={styles.footer}>
        <View style={styles.ctaContainer}>
          <Button
            title={t('bookingConfirmation.bookings')}
            onPress={handleViewBookings}
            variant="outline"
            style={styles.bookingsButton}
          />
          <Button
            title={t('bookingConfirmation.backToHome')}
            onPress={handleBackToHome}
            style={styles.homeButton}
            leftIcon={<Home size={18} color={designTokens.colors.semantic.surface} />}
          />
        </View>
      </View>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: designTokens.spacing.scale.xl,
    gap: designTokens.spacing.scale.lg,
  },
  errorText: {
    ...designTokens.typography.styles.body,
    color: designTokens.colors.semantic.error,
    textAlign: 'center',
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: designTokens.spacing.scale['2xl'],
  },
  successIcon: {
    marginBottom: designTokens.spacing.scale.xl,
    ...designTokens.shadows.lg,
  },
  pendingStatusIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: designTokens.spacing.scale.xl,
    backgroundColor: `${designTokens.colors.semantic.warning}18`,
  },
  successTitle: {
    ...designTokens.typography.styles.heading,
    fontSize: designTokens.typography.sizes.xlarge,
    color: designTokens.colors.semantic.success,
    textAlign: 'center',
    marginBottom: designTokens.spacing.scale.sm,
  },
  pendingTitle: {
    color: designTokens.colors.semantic.text,
  },
  successSubtitle: {
    ...designTokens.typography.styles.body,
    color: designTokens.colors.semantic.textSecondary,
    textAlign: 'center',
    marginBottom: designTokens.spacing.scale.xl,
    lineHeight: designTokens.typography.lineHeights.normal * designTokens.typography.sizes.body,
  },
  bookingIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.scale.sm,
    paddingHorizontal: designTokens.spacing.scale.lg,
    paddingVertical: designTokens.spacing.scale.md,
    backgroundColor: designTokens.colors.semantic.primary + '12',
    borderRadius: designTokens.borderRadius.components.button,
    borderWidth: 1,
    borderColor: designTokens.colors.semantic.primary + '30',
    ...designTokens.shadows.sm,
  },
  bookingIdLabel: {
    ...designTokens.typography.styles.caption,
    color: designTokens.colors.semantic.textSecondary,
  },
  bookingIdValue: {
    ...designTokens.typography.styles.caption,
    fontWeight: designTokens.typography.weights.bold,
    color: designTokens.colors.semantic.primary,
  },
  sectionCard: {
    marginBottom: designTokens.spacing.scale.lg,
    borderRadius: designTokens.borderRadius.components.card,
    ...designTokens.shadows.md,
  },
  countdownCard: {
    marginBottom: designTokens.spacing.scale.lg,
    borderRadius: designTokens.borderRadius.components.card,
    borderWidth: 1,
    borderColor: designTokens.colors.semantic.primary + '30',
    ...designTokens.shadows.md,
  },
  countdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.scale.sm,
    marginBottom: designTokens.spacing.scale.sm,
  },
  countdownTitle: {
    ...designTokens.typography.styles.caption,
    color: designTokens.colors.semantic.textSecondary,
    fontWeight: designTokens.typography.weights.semibold,
  },
  countdownValue: {
    ...designTokens.typography.styles.heading,
    color: designTokens.colors.semantic.primary,
    fontSize: designTokens.typography.sizes.xlarge,
    marginBottom: designTokens.spacing.scale.xs,
  },
  countdownDetail: {
    ...designTokens.typography.styles.caption,
    color: designTokens.colors.semantic.textSecondary,
    marginBottom: designTokens.spacing.scale.md,
  },
  calendarButton: {
    // borderColor: designTokens.colors.semantic.primary,
    // borderWidth: 1,
    backgroundColor: designTokens.colors.semantic.surface,
  },
  sectionTitle: {
    ...designTokens.typography.styles.subheading,
    color: designTokens.colors.semantic.text,
    marginBottom: designTokens.spacing.scale.lg,
    fontSize: designTokens.typography.sizes.large,
  },
  companionSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: designTokens.spacing.scale.lg,
  },
  companionInfo: {
    flex: 1,
  },
  companionName: {
    ...designTokens.typography.styles.subheading,
    color: designTokens.colors.semantic.text,
    marginBottom: designTokens.spacing.scale.xs,
    fontSize: designTokens.typography.sizes.large,
  },
  companionDetails: {
    gap: designTokens.spacing.scale.xs,
    marginBottom: designTokens.spacing.scale.lg,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.scale.xs,
    minHeight: 24, // Better touch target
  },
  detailText: {
    ...designTokens.typography.styles.caption,
    color: designTokens.colors.semantic.textSecondary,
  },
  ratingText: {
    ...designTokens.typography.styles.caption,
    color: designTokens.colors.semantic.text,
    fontWeight: designTokens.typography.weights.medium,
  },
  reviewsText: {
    ...designTokens.typography.styles.caption,
    color: designTokens.colors.semantic.textSecondary,
  },
  contactButtons: {
    flexDirection: 'row',
    gap: designTokens.spacing.scale.sm,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: designTokens.spacing.scale.xs,
    paddingVertical: designTokens.spacing.scale.sm,
    paddingHorizontal: designTokens.spacing.scale.md,
    backgroundColor: designTokens.colors.semantic.primary,
    borderRadius: designTokens.borderRadius.components.button,
    minHeight: 44, // Accessibility touch target
    flex: 1,
    shadowColor: designTokens.shadows.sm.shadowColor,
    shadowOffset: designTokens.shadows.sm.shadowOffset,
    shadowOpacity: designTokens.shadows.sm.shadowOpacity,
    shadowRadius: designTokens.shadows.sm.shadowRadius,
    elevation: designTokens.shadows.sm.elevation,
  },
  contactButtonText: {
    ...designTokens.typography.styles.caption,
    fontWeight: designTokens.typography.weights.medium,
    color: designTokens.colors.semantic.surface,
  },
  bookingDetails: {
    gap: designTokens.spacing.scale.xl,
  },
  detailSection: {
    gap: designTokens.spacing.scale.xs,
    paddingVertical: designTokens.spacing.scale.sm,
  },
  detailSectionTitle: {
    ...designTokens.typography.styles.caption,
    fontWeight: designTokens.typography.weights.semibold,
    color: designTokens.colors.semantic.text,
  },
  detailSectionValue: {
    ...designTokens.typography.styles.body,
    color: designTokens.colors.semantic.text,
    fontWeight: designTokens.typography.weights.medium,
  },
  detailSectionSubvalue: {
    ...designTokens.typography.styles.caption,
    color: designTokens.colors.semantic.textSecondary,
    lineHeight: designTokens.typography.lineHeights.normal * designTokens.typography.sizes.caption,
  },
  totalAmount: {
    ...designTokens.typography.styles.subheading,
    fontWeight: designTokens.typography.weights.bold,
    color: designTokens.colors.semantic.primary,
    fontSize: designTokens.typography.sizes.large,
  },
  nextSteps: {
    gap: designTokens.spacing.scale.xl,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: designTokens.spacing.scale.lg,
    paddingVertical: designTokens.spacing.scale.sm,
  },
  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: designTokens.colors.semantic.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...designTokens.shadows.md,
  },
  stepNumberText: {
    ...designTokens.typography.styles.caption,
    fontWeight: designTokens.typography.weights.bold,
    color: designTokens.colors.semantic.surface,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    ...designTokens.typography.styles.body,
    fontWeight: designTokens.typography.weights.semibold,
    color: designTokens.colors.semantic.text,
    marginBottom: designTokens.spacing.scale.xs,
  },
  stepDescription: {
    ...designTokens.typography.styles.caption,
    color: designTokens.colors.semantic.textSecondary,
    lineHeight: designTokens.typography.lineHeights.normal * designTokens.typography.sizes.caption,
  },
  footer: {
    padding: designTokens.spacing.scale.lg,
    backgroundColor: designTokens.colors.semantic.surface,
    borderTopWidth: 1,
    borderTopColor: designTokens.colors.semantic.border,
    shadowColor: designTokens.shadows.lg.shadowColor,
    shadowOffset: designTokens.shadows.lg.shadowOffset,
    shadowOpacity: designTokens.shadows.lg.shadowOpacity,
    shadowRadius: designTokens.shadows.lg.shadowRadius,
    elevation: designTokens.shadows.lg.elevation,
  },
  ctaContainer: {
    flexDirection: 'row',
    gap: designTokens.spacing.scale.md,
    alignItems: 'center',
  },
  bookingsButton: {
    flex: 1,
    // borderColor: designTokens.colors.semantic.primary,
    // borderWidth: 2,
    backgroundColor: 'transparent'
  },
  homeButton: {
    flex: 1.5, // Give more prominence to primary action
    
  },
});
