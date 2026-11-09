import { logger } from '@/utils/logger';
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, SafeAreaView, Alert, TouchableOpacity, Linking, Platform, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { RadialGradient } from '@/components/ui/RadialGradient';
import { Card } from '@/components/ui/Card';
import { Heading, Subheading, Body, Caption } from '@/components/ui/Typography';
import { designTokens } from '@/constants/design-tokens';
import { useBookingQuery, useUpdateBookingStatus } from '@/services/api/booking/booking';
import { ProfileImage } from '@/components/ui/ProfileImage';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/auth-store';
import { useCurrencyConversion } from '@/utils/currency';
import { createOrGetRoom } from '@/utils/chat-api';
import { ArrowLeft, CalendarPlus, CheckCircle, Clock, MessageCircle, XCircle } from 'lucide-react-native';
import { toPaymentDisplay } from '@/utils/payment-display';
import { bookingDateTimeToInstant, calendarUtcDate, CORE_BOOKING_TIME_ZONE } from '@/utils/booking-timezone';

const BookingDetailsScreen = () => {
  const { user, isAuthenticated } = useAuthStore();
  const isCompanion = user?.userType === 'companion' || user?.userType === 'supplier';
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading, error } = useBookingQuery(id);
  const updateStatusMutation = useUpdateBookingStatus();
  const [cancelling, setCancelling] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [openingChat, setOpeningChat] = useState(false);
  const [confirmation, setConfirmation] = useState<'cancel' | 'reject' | null>(null);
  const [feedback, setFeedback] = useState('');
  const actionBusy = useRef(false);
  const showFeedback = (title: string, message: string) => {
    if (Platform.OS === 'web') setFeedback(`${title}: ${message}`);
    else Alert.alert(title, message);
  };
  const [now, setNow] = useState(() => new Date());
  // Currency hook must be before early returns (React rules)
  const usdTotal = useCurrencyConversion(data?.data?.booking?.totalAmount);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  const cancellationPolicy = 'Cancel this Tirak booking?\n\nFree cancellation applies 48h+ before the experience. Within 48h, the guide cancellation policy may apply.';
  const performCancellation = async () => {
    if (actionBusy.current || !isAuthenticated || isCompanion || !['pending', 'confirmed'].includes(data?.data?.booking?.status || '')) return;
    actionBusy.current = true;
    setCancelling(true); setFeedback('');
    try {
      await updateStatusMutation.mutateAsync({ id: id as string, statusData: { status: 'cancelled' } });
      setConfirmation(null);
      showFeedback('Booking cancelled', 'This Tirak booking has been cancelled.');
      if (Platform.OS !== 'web') router.back();
    } catch (err: any) {
      showFeedback('Could not cancel booking', err?.message || 'Please try again or contact support.');
    } finally { actionBusy.current = false; setCancelling(false); }
  };
  const handleCancelBooking = () => {
    if (actionBusy.current) return;
    setFeedback('');
    if (Platform.OS === 'web') { setConfirmation('cancel'); return; }
    Alert.alert('Cancel booking', cancellationPolicy, [
      { text: 'Keep booking', style: 'cancel' },
      { text: 'Cancel booking', style: 'destructive', onPress: performCancellation },
    ]);
  };

  if (isLoading) {
    return (
      <RadialGradient variant="appBackground" style={styles.container}>
        <SafeAreaView style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <ActivityIndicator size="large" color={designTokens.colors.semantic.primary} />
        <Text style={styles.loadingText}>Loading Tirak booking...</Text>
        </SafeAreaView>
      </RadialGradient>
    );
  }

  if (error || !data?.success) {
    return (
      <RadialGradient variant="appBackground" style={styles.container}>
        <Text style={styles.errorText}>We could not load this booking.</Text>
        <Button title="Go back" onPress={() => router.back()} />
      </RadialGradient>
    );
  }

  const booking = data.data.booking;
  const customer = booking.customer;
  const service = booking.service ? booking.service : (booking as any).experience;
  const companion = booking.companion;
  const experience = (booking as any).experience;
  const timeline = booking.timeline || [];
  const displayPerson = isCompanion ? customer : companion;
  const displayFallback = isCompanion ? companion : customer;
  const displayName = displayPerson?.name || displayFallback?.name || (isCompanion ? 'Traveler' : 'Local Guide');
  const displayImage = displayPerson?.profileImage || displayFallback?.profileImage || '';
  const timeZone = booking.timeZone || booking.timezone || CORE_BOOKING_TIME_ZONE;
  let startAt: Date | null = null;
  let endAt: Date | null = null;
  try {
    startAt = bookingDateTimeToInstant(booking.date, booking.startTime, timeZone);
    endAt = bookingDateTimeToInstant(booking.date, booking.endTime, timeZone);
  } catch { /* Keep booking history readable when schedule metadata is invalid. */ }
  const countdownMs = startAt ? Math.max(0, startAt.getTime() - now.getTime()) : 0;
  const isActiveBooking = booking.status === 'confirmed' || booking.status === 'in_progress';
  const canAddToCalendar = Boolean(startAt && endAt && endAt > startAt);
  const countdownDays = Math.floor(countdownMs / (1000 * 60 * 60 * 24));
  const countdownHours = Math.floor((countdownMs / (1000 * 60 * 60)) % 24);
  const countdownMinutes = Math.floor((countdownMs / (1000 * 60)) % 60);
  const countdownText = !startAt ? 'Schedule unavailable' : countdownMs > 0
    ? `${countdownDays}d ${countdownHours}h ${countdownMinutes}m`
    : 'Start time reached';
  const isPendingCompanionRequest = isCompanion && booking.status === 'pending';

  const formatBookingStatus = () => {
    switch (booking.status) {
      case 'pending':
        return isCompanion ? 'Pending approval' : 'Waiting for guide approval';
      case 'confirmed':
        return 'Confirmed';
      case 'in_progress':
        return 'In progress';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return booking.status;
    }
  };

  const paymentDisplay = toPaymentDisplay(booking.payment ?? {
    method: booking.paymentMethod?.type,
    status: booking.paymentStatus,
  });

  const handleAddToCalendar = async () => {
    if (!isActiveBooking || !startAt || !endAt || !canAddToCalendar) return;
    const title = encodeURIComponent(`Tirak: ${service?.name || experience?.name || 'Local guide booking'}`);
    const details = encodeURIComponent(`Booking with ${displayName}. ${paymentDisplay.collectionNote}`);
    const location = encodeURIComponent([booking.meetingPoint, booking.location].filter(Boolean).join(', '));
    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${calendarUtcDate(startAt)}/${calendarUtcDate(endAt)}&ctz=${encodeURIComponent(timeZone)}&details=${details}&location=${location}`;

    try {
      await Linking.openURL(calendarUrl);
    } catch (error) {
      logger.warn('Unable to open calendar link', error);
      showFeedback('Calendar unavailable', 'We could not open the calendar event link on this device.');
    }
  };

  const handleMessage = async () => {
    if (actionBusy.current || !isAuthenticated || !isActiveBooking) return;
    actionBusy.current = true;
    setOpeningChat(true);
    setFeedback('');
    try {
      const roomId = await createOrGetRoom(booking.id);
      if (!roomId) {
        showFeedback('Could not open chat', 'Check your connection and try again.');
        return;
      }
      router.push(`/chat/${encodeURIComponent(roomId)}`);
    } finally {
      actionBusy.current = false;
      setOpeningChat(false);
    }
  };

  const handleApproveBooking = async () => {
    if (actionBusy.current) return;
    actionBusy.current = true; setFeedback('');
    setUpdatingStatus(true);
    try {
      await updateStatusMutation.mutateAsync({
        id: id as string,
        statusData: { status: 'confirmed' },
      });
      showFeedback('Booking approved', 'The traveler will see this booking as confirmed.');
    } catch (error: any) {
      showFeedback('Unable to approve booking', error?.message || 'Please try again.');
    } finally {
      actionBusy.current = false; setUpdatingStatus(false);
    }
  };

  const performRejection = async () => {
    if (actionBusy.current || !isAuthenticated || !isPendingCompanionRequest) return;
    actionBusy.current = true;
    setUpdatingStatus(true); setFeedback('');
    try {
      await updateStatusMutation.mutateAsync({ id: id as string, statusData: { status: 'cancelled', reason: 'Guide declined the booking request.' } });
      setConfirmation(null);
      showFeedback('Booking rejected', 'The traveler will see that this request was rejected.');
    } catch (error: any) {
      showFeedback('Unable to reject booking', error?.message || 'Please try again.');
    } finally { actionBusy.current = false; setUpdatingStatus(false); }
  };
  const handleRejectBooking = () => {
    if (actionBusy.current) return;
    setFeedback('');
    if (Platform.OS === 'web') { setConfirmation('reject'); return; }
    Alert.alert('Reject booking request', 'Reject this request? The traveler will be notified.', [
      { text: 'Keep', style: 'cancel' },
      { text: 'Reject', style: 'destructive', onPress: performRejection },
    ]);
  };

  return (
    <RadialGradient variant="appBackground" style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={22} color={designTokens.colors.semantic.text} />
        </TouchableOpacity>

        {feedback ? <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.actionFeedback}>{feedback}</Text> : null}
        <Card style={styles.card}>
          {/* Customer & Companion Info */}
          <Subheading>{!isCompanion ? 'Local Guide' : 'Traveler'}</Subheading>
          <View style={styles.headerRow}>
            <ProfileImage uri={displayImage} size={64} />
            <View style={styles.headerText}>
              <Heading>{displayName}</Heading>
              <Caption>{isCompanion ? 'Traveler' : 'Local Guide'}</Caption>
            </View>
          </View>
          {/* <Subheading>Companion</Subheading>
          <View style={styles.headerRow}>
            <ProfileImage uri={companion?.profileImage || ''} size={64} />
            <View style={styles.headerText}>
              <Heading>{companion?.name || 'Unknown Companion'}</Heading>
              <Caption>{companion?.phone || ''}</Caption>
            </View>
          </View> */}

          {/* Status & Service/Experience */}
          <View style={styles.section}>
            <Subheading>Status</Subheading>
            <Body>{formatBookingStatus()}</Body>
          </View>
          {isPendingCompanionRequest && (
            <View style={styles.approvalActions}>
              <TouchableOpacity
                style={[styles.approvalButton, styles.rejectButton]}
                onPress={handleRejectBooking}
                disabled={updatingStatus}
                accessibilityRole="button"
                accessibilityLabel="Reject booking request"
              >
                <XCircle size={18} color={designTokens.colors.semantic.error} />
                <Text style={styles.rejectButtonText}>Reject</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.approvalButton, styles.approveButton]}
                onPress={handleApproveBooking}
                disabled={updatingStatus}
                accessibilityRole="button"
                accessibilityLabel="Approve booking request"
              >
                <CheckCircle size={18} color={designTokens.colors.semantic.surface} />
                <Text style={styles.approveButtonText}>
                  {updatingStatus ? 'Updating...' : 'Approve'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.section}>
            <Subheading>Experience</Subheading>
            <Body>{service?.name || experience?.name || 'N/A'}</Body>
          </View>

          {/* Date, Time, Location, Meeting Point */}
          <View style={styles.section}>
            <Subheading>{booking.status === 'pending' ? 'Requested date' : 'Date'}</Subheading>
            <Body>{booking.date.split('T')[0]}</Body>
          </View>
          <View style={styles.section}>
            <Subheading>{`Time (${timeZone === CORE_BOOKING_TIME_ZONE ? 'Thailand' : timeZone})`}</Subheading>
            <Body>{booking.startTime} - {booking.endTime} ({booking.duration} mins)</Body>
          </View>

          {isActiveBooking && (
            <View style={styles.countdownCard}>
              <View style={styles.countdownHeader}>
                <Clock size={18} color={designTokens.colors.semantic.primary} />
                <Subheading style={styles.countdownTitle}>
                  {isCompanion ? 'Experience starts in' : 'Your guide starts in'}
                </Subheading>
              </View>
              <Heading style={styles.countdownValue}>{countdownText}</Heading>
              <Caption style={styles.countdownDetail}>
                {booking.date.split('T')[0]} at {booking.startTime} ({timeZone})
              </Caption>
              <View style={styles.detailActions}>
                <TouchableOpacity
                  style={styles.messageButton}
                  onPress={handleMessage}
                  disabled={openingChat}
                  accessibilityRole="button"
                  accessibilityLabel="Message"
                  accessibilityState={{ busy: openingChat, disabled: openingChat }}
                >
                  <MessageCircle size={18} color={designTokens.colors.semantic.surface} />
                  <Text style={styles.messageButtonText}>{openingChat ? 'Opening chat…' : 'Message'}</Text>
                </TouchableOpacity>
                <TouchableOpacity accessibilityRole="button" accessibilityLabel="Add booking to calendar" accessibilityState={{ disabled: !canAddToCalendar }} disabled={!canAddToCalendar} style={styles.calendarButton} onPress={handleAddToCalendar}>
                  <CalendarPlus size={18} color={designTokens.colors.semantic.primary} />
                  <Text style={styles.calendarButtonText}>Add to Calendar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          <View style={styles.section}>
            <Subheading>Location</Subheading>
            <Body>{booking.location || 'N/A'}</Body>
          </View>
          <View style={styles.section}>
            <Subheading>Meeting Point</Subheading>
            <Body>{booking.meetingPoint || 'N/A'}</Body>
          </View>

          {/* Payment & Fees */}
          <View style={styles.section}>
            <Subheading>Payment</Subheading>
            <Body>{paymentDisplay.status}</Body>
            <Caption style={styles.cashNote}>{paymentDisplay.method}</Caption>
          </View>
          
          <View style={styles.section}>
            <Subheading>Guide Rate</Subheading>
            <Body>฿{booking.totalAmount?.toLocaleString() || 'N/A'}{usdTotal ? ` (${usdTotal})` : ''}</Body>
            <Caption style={styles.cashNote}>{paymentDisplay.collectionNote}</Caption>
          </View>

          {/* Preferences & Special Requests */}
          <View style={styles.section}>
            <Subheading>Special Requests</Subheading>
            <Body>{booking.specialRequests || 'N/A'}</Body>
          </View>
          <View style={styles.section}>
            <Subheading>Preferred Languages</Subheading>
            <Body>{Array.isArray((booking as any).preferredLanguages) && (booking as any).preferredLanguages.length > 0 ? (booking as any).preferredLanguages.join(', ') : 'N/A'}</Body>
          </View>
          <View style={styles.section}>
            <Subheading>Dietary Restrictions</Subheading>
            <Body>{Array.isArray((booking as any).dietaryRestrictions) && (booking as any).dietaryRestrictions.length > 0 ? (booking as any).dietaryRestrictions.join(', ') : 'N/A'}</Body>
          </View>
          <View style={styles.section}>
            <Subheading>Accessibility Needs</Subheading>
            <Body>{Array.isArray((booking as any).accessibilityNeeds) && (booking as any).accessibilityNeeds.length > 0 ? (booking as any).accessibilityNeeds.join(', ') : 'N/A'}</Body>
          </View>

          {/* Timeline */}
          <View style={styles.section}>
            <Subheading>Timeline</Subheading>
            {Array.isArray(timeline) && timeline.length > 0 ? (
              timeline.map((item: any, idx: number) => (
                <Body key={idx}>{item.status.charAt(0).toUpperCase() + item.status.slice(1)}: {item.timestamp.split('T')[1].split(':').slice(0, 2).join(':')}</Body>
              ))
            ) : (
              <Body>N/A</Body>
            )}
          </View>

          {/* Cancel booking — only for travellers, only for active bookings */}
          {!isCompanion && ['pending', 'confirmed'].includes(booking.status) && (
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancelBooking}
                disabled={cancelling}
                accessibilityRole="button"
                accessibilityLabel="Cancel this booking"
              >
                <Body style={styles.cancelButtonText}>
                  {cancelling ? 'Cancelling...' : 'Cancel booking'}
                </Body>
              </TouchableOpacity>
              <Caption style={styles.cancelHint}>
                Review cancellation terms before cancelling close to the start time.
              </Caption>
            </View>
          )}
        </Card>
      </ScrollView>
      {Platform.OS === 'web' && <Modal visible={confirmation !== null} transparent animationType="fade" onRequestClose={() => { if (!actionBusy.current) setConfirmation(null); }}>
        <View style={styles.confirmOverlay}>
          <View accessibilityViewIsModal accessibilityLabel={confirmation === 'reject' ? 'Reject booking request' : 'Cancel booking'} style={styles.confirmCard}>
            <Text accessibilityRole="header" style={styles.confirmTitle}>{confirmation === 'reject' ? 'Reject booking request?' : 'Cancel this booking?'}</Text>
            <Text style={styles.confirmBody}>{confirmation === 'reject' ? 'Reject this request? The traveler will see that the booking request was rejected.' : cancellationPolicy}</Text>
            {feedback ? <Text accessibilityRole="alert" style={styles.actionFeedback}>{feedback}</Text> : null}
            {(cancelling || updatingStatus) ? <Text accessibilityLiveRegion="polite" style={styles.confirmBody}>Updating booking…</Text> : null}
            <TouchableOpacity accessibilityRole="button" accessibilityLabel={confirmation === 'reject' ? 'Keep request' : 'Keep booking'} disabled={cancelling || updatingStatus} style={styles.keepButton} onPress={() => setConfirmation(null)}><Text style={styles.keepText}>{confirmation === 'reject' ? 'Keep request' : 'Keep booking'}</Text></TouchableOpacity>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel={confirmation === 'reject' ? 'Confirm rejection' : 'Confirm cancellation'} accessibilityState={{ disabled: cancelling || updatingStatus, busy: cancelling || updatingStatus }} disabled={cancelling || updatingStatus} style={styles.confirmButton} onPress={confirmation === 'reject' ? performRejection : performCancellation}><Text style={styles.confirmButtonText}>{cancelling || updatingStatus ? 'Updating…' : confirmation === 'reject' ? 'Reject request' : 'Cancel booking'}</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>}
    </RadialGradient>
  );
};

const styles = StyleSheet.create({
  confirmOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: 'rgba(30,20,40,0.45)' },
  confirmCard: { width: '100%', maxWidth: 480, backgroundColor: designTokens.colors.semantic.surface, borderRadius: 20, padding: 24, gap: 16 },
  confirmTitle: { fontSize: 24, lineHeight: 32, fontWeight: '700', color: designTokens.colors.semantic.text },
  confirmBody: { fontSize: 15, lineHeight: 23, color: designTokens.colors.semantic.textSecondary },
  actionFeedback: { fontSize: 14, lineHeight: 22, color: designTokens.colors.semantic.text, padding: 16 },
  keepButton: { minHeight: 48, borderWidth: 1, borderColor: designTokens.colors.semantic.border, borderRadius: 12, padding: 12, alignItems: 'center', justifyContent: 'center' },
  keepText: { color: designTokens.colors.semantic.text, fontWeight: '600' },
  confirmButton: { minHeight: 48, backgroundColor: designTokens.colors.semantic.error, borderRadius: 12, padding: 12, alignItems: 'center', justifyContent: 'center' },
  confirmButtonText: { color: designTokens.colors.semantic.surface, fontWeight: '600', textAlign: 'center' },
  container: {
    flex: 1,
  },
  loadingText: {
    marginTop: 16,
    color: designTokens.colors.semantic.primary,
    fontSize: 16,
    fontWeight: '500',
  },
  errorText: {
    color: designTokens.colors.semantic.error,
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 16,
  },
  scrollContent: {
    padding: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: designTokens.colors.semantic.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  card: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: designTokens.colors.semantic.surface,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerText: {
    marginLeft: 16,
  },
  section: {
    marginBottom: 16,
  },
  approvalActions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  approvalButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  rejectButton: {
    backgroundColor: designTokens.colors.semantic.surface,
    borderWidth: 1.5,
    borderColor: designTokens.colors.semantic.error,
  },
  approveButton: {
    backgroundColor: designTokens.colors.semantic.primary,
  },
  rejectButtonText: {
    color: designTokens.colors.semantic.error,
    fontWeight: '700',
  },
  approveButtonText: {
    color: designTokens.colors.semantic.surface,
    fontWeight: '700',
  },
  countdownCard: {
    backgroundColor: designTokens.colors.semantic.primary + '10',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: designTokens.colors.semantic.primary + '30',
  },
  countdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  countdownTitle: {
    flex: 1,
  },
  countdownValue: {
    color: designTokens.colors.semantic.primary,
    marginBottom: 4,
  },
  countdownDetail: {
    color: designTokens.colors.semantic.textSecondary,
    marginBottom: 12,
  },
  detailActions: {
    flexDirection: 'row',
    gap: 10,
  },
  messageButton: {
    flex: 0.9,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: designTokens.colors.semantic.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  messageButtonText: {
    color: designTokens.colors.semantic.surface,
    fontWeight: '700',
  },
  calendarButton: {
    flex: 1.25,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: designTokens.colors.semantic.primary,
    backgroundColor: designTokens.colors.semantic.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  calendarButtonText: {
    color: designTokens.colors.semantic.primary,
    fontWeight: '700',
    fontSize: 12,
    flexShrink: 1,
  },
  cashNote: {
    color: designTokens.colors.semantic.textSecondary,
    marginTop: 4,
  },
  cancelButton: {
    borderWidth: 1.5,
    borderColor: designTokens.colors.semantic.error,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButtonText: {
    color: designTokens.colors.semantic.error,
    fontWeight: '600',
  },
  cancelHint: {
    textAlign: 'center',
    marginTop: 6,
    color: designTokens.colors.semantic.textSecondary,
  },
});

export default BookingDetailsScreen; 
