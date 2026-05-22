import { logger } from '@/utils/logger';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, SafeAreaView, Alert, TouchableOpacity, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { RadialGradient } from '@/components/ui/RadialGradient';
import { Card } from '@/components/ui/Card';
import { Heading, Subheading, Body, Caption } from '@/components/ui/Typography';
import { designTokens } from '@/constants/design-tokens';
import { useBookingQuery, useUpdateBookingStatus } from '@/app/api/booking/booking';
import { ProfileImage } from '@/components/ui/ProfileImage';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/auth-store';
import { useCurrencyConversion } from '@/utils/currency';
import { TEST_COMPANION_ID, isTestCompanion } from '@/utils/companion-display';
import { ArrowLeft, CalendarPlus, CheckCircle, Clock, MessageCircle, XCircle } from 'lucide-react-native';

const BookingDetailsScreen = () => {
  const { user, isAuthenticated } = useAuthStore();
  const isCompanion = user?.userType === 'companion' || user?.userType === 'supplier';
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading, error } = useBookingQuery(id);
  const updateStatusMutation = useUpdateBookingStatus();
  const [cancelling, setCancelling] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [now, setNow] = useState(() => new Date());
  // Currency hook must be before early returns (React rules)
  const usdTotal = useCurrencyConversion(data?.data?.booking?.totalAmount);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCancelBooking = () => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking?\n\n• Free cancellation 48h+ before the experience\n• 50% fee applies within 48h\n\nThis action cannot be undone.',
      [
        { text: 'Keep Booking', style: 'cancel' },
        {
          text: 'Cancel Booking',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              await updateStatusMutation.mutateAsync({ id: id as string, statusData: { status: 'cancelled' } });
              Alert.alert('Booking Cancelled', 'Your booking has been cancelled. Refund (if applicable) will be processed within 5–7 business days.');
              router.back();
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to cancel booking. Please try again or contact support.');
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <RadialGradient variant="appBackground" style={styles.container}>
        <SafeAreaView style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <ActivityIndicator size="large" color={designTokens.colors.semantic.primary} />
        <Text style={styles.loadingText}>Loading booking details...</Text>
        </SafeAreaView>
      </RadialGradient>
    );
  }

  if (error || !data?.success) {
    return (
      <RadialGradient variant="appBackground" style={styles.container}>
        <Text style={styles.errorText}>Failed to load booking details.</Text>
        <Button title="Go Back" onPress={() => router.back()} />
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
  const displayName = displayPerson?.name || displayFallback?.name || (isCompanion ? 'Traveller' : 'Local Guide');
  const displayImage = displayPerson?.profileImage || displayFallback?.profileImage || '';
  const startAt = new Date(`${booking.date.split('T')[0]}T${booking.startTime}:00`);
  const endAt = new Date(`${booking.date.split('T')[0]}T${booking.endTime}:00`);
  const countdownMs = Math.max(0, startAt.getTime() - now.getTime());
  const isActiveBooking = ['pending', 'confirmed', 'in_progress'].includes(booking.status);
  const countdownDays = Math.floor(countdownMs / (1000 * 60 * 60 * 24));
  const countdownHours = Math.floor((countdownMs / (1000 * 60 * 60)) % 24);
  const countdownMinutes = Math.floor((countdownMs / (1000 * 60)) % 60);
  const countdownText = countdownMs > 0
    ? `${countdownDays}d ${countdownHours}h ${countdownMinutes}m`
    : 'Starting now';
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

  const getPaymentStatusCopy = () => {
    if (booking.paymentStatus === 'paid') return 'Paid';
    if (booking.status === 'pending') return 'Payment not collected yet';
    return 'Pay guide in cash';
  };

  const formatCalendarDate = (date: Date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const handleAddToCalendar = async () => {
    const title = encodeURIComponent(`Tirak: ${service?.name || experience?.name || 'Local guide booking'}`);
    const details = encodeURIComponent(`Booking with ${displayName}. Payment is handled in cash directly with the guide.`);
    const location = encodeURIComponent([booking.meetingPoint, booking.location].filter(Boolean).join(', '));
    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${formatCalendarDate(startAt)}/${formatCalendarDate(endAt)}&details=${details}&location=${location}`;

    try {
      await Linking.openURL(calendarUrl);
    } catch (error) {
      logger.warn('Unable to open calendar link', error);
      Alert.alert('Calendar unavailable', 'We could not open the calendar event link on this device.');
    }
  };

  const handleMessage = () => {
    const chatTarget = isCompanion
      ? booking.customerId
      : isTestCompanion(booking.companion)
        ? TEST_COMPANION_ID
        : booking.companionId;
    router.push(`/chat/${chatTarget}`);
  };

  const handleApproveBooking = async () => {
    setUpdatingStatus(true);
    try {
      await updateStatusMutation.mutateAsync({
        id: id as string,
        statusData: { status: 'confirmed' },
      });
      Alert.alert('Booking approved', 'The traveler will see this booking as confirmed.');
    } catch (error: any) {
      Alert.alert('Unable to approve booking', error?.message || 'Please try again.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleRejectBooking = () => {
    Alert.alert(
      'Reject booking request',
      'Reject this request? The traveler will be notified.',
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            setUpdatingStatus(true);
            try {
              await updateStatusMutation.mutateAsync({
                id: id as string,
                statusData: {
                  status: 'cancelled',
                  reason: 'Guide declined the booking request.',
                },
              });
              Alert.alert('Booking rejected', 'The traveler will see that this request was rejected.');
            } catch (error: any) {
              Alert.alert('Unable to reject booking', error?.message || 'Please try again.');
            } finally {
              setUpdatingStatus(false);
            }
          },
        },
      ]
    );
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

        <Card style={styles.card}>
          {/* Customer & Companion Info */}
          <Subheading>{!isCompanion ? 'Local Guide' : 'Traveller'}</Subheading>
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
            <Subheading>Service / Experience</Subheading>
            <Body>{service?.name || experience?.name || 'N/A'}</Body>
          </View>

          {/* Date, Time, Location, Meeting Point */}
          <View style={styles.section}>
            <Subheading>Booking Date</Subheading>
            <Body>{booking.date.split('T')[0]}</Body>
          </View>
          <View style={styles.section}>
            <Subheading>Booking Time</Subheading>
            <Body>{booking.startTime} - {booking.endTime} ({booking.duration} mins)</Body>
          </View>

          {isActiveBooking && (
            <View style={styles.countdownCard}>
              <View style={styles.countdownHeader}>
                <Clock size={18} color={designTokens.colors.semantic.primary} />
                <Subheading style={styles.countdownTitle}>
                  {isCompanion ? 'Experience starts in' : 'Your local guide starts in'}
                </Subheading>
              </View>
              <Heading style={styles.countdownValue}>{countdownText}</Heading>
              <Caption style={styles.countdownDetail}>
                {booking.date.split('T')[0]} at {booking.startTime}
              </Caption>
              <View style={styles.detailActions}>
                <TouchableOpacity style={styles.messageButton} onPress={handleMessage}>
                  <MessageCircle size={18} color={designTokens.colors.semantic.surface} />
                  <Text style={styles.messageButtonText}>Message</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.calendarButton} onPress={handleAddToCalendar}>
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
            <Subheading>Payment Status</Subheading>
            <Body>{getPaymentStatusCopy()}</Body>
          </View>
          
          <View style={styles.section}>
            <Subheading>Guide Rate</Subheading>
            <Body>฿{booking.totalAmount?.toLocaleString() || 'N/A'}{usdTotal ? ` (${usdTotal})` : ''}</Body>
            <Caption style={styles.cashNote}>Paid in cash directly to the guide</Caption>
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
                  {cancelling ? 'Cancelling…' : 'Cancel Booking'}
                </Body>
              </TouchableOpacity>
              <Caption style={styles.cancelHint}>
                Free cancellation 48h+ before experience · 50% fee within 48h
              </Caption>
            </View>
          )}
        </Card>
      </ScrollView>
    </RadialGradient>
  );
};

const styles = StyleSheet.create({
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
