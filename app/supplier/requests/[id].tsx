import { logger } from '@/utils/logger';
import React from 'react';
import { usePostHog } from 'posthog-react-native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  MessageSquare,
  Star,
  Shield,
  CheckCircle,
  X,
  AlertTriangle,
  Heart,
  Eye,
  DollarSign,
  Navigation,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { RadialGradient } from '@/components/ui/RadialGradient';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProfileImage } from '@/components/ui/ProfileImage';
import { Heading, Subheading, Body, Caption } from '@/components/ui/Typography';
import { RequestActions } from '@/components/supplier/RequestActions';
import { CommunicationTools } from '@/components/supplier/CommunicationTools';
import { designTokens, componentTokens } from '@/constants/design-tokens';
import { useBookingQuery, useUpdateBookingStatus } from '@/app/api/booking/booking';
import { BookingRequest } from '@/types/supplier-request';
import { bookingToRequest } from '@/utils/booking-request-adapter';

export default function RequestDetailScreen() {
  const router = useRouter();
  const posthog = usePostHog();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading } = useBookingQuery(id || '');
  const updateStatusMutation = useUpdateBookingStatus();
  const request = data?.data?.booking ? bookingToRequest(data.data.booking) : null;

  if (isLoading) {
    return (
      <RadialGradient variant="appBackground" style={styles.container}>
        <SafeAreaView style={styles.loadingContainer}>
          <Body>Loading request details...</Body>
        </SafeAreaView>
      </RadialGradient>
    );
  }

  if (!request) {
    return (
      <RadialGradient variant="appBackground" style={styles.container}>
        <SafeAreaView style={styles.errorContainer}>
          <Subheading>Request not found</Subheading>
          <Button title="Go Back" onPress={() => router.back()} />
        </SafeAreaView>
      </RadialGradient>
    );
  }

  const handleAcceptRequest = (requestId: string) => {
    logger.log('Accepting request:', requestId);
    updateStatusMutation.mutate(
      { id: requestId, statusData: { status: 'confirmed' } },
      {
        onSuccess: () => {
          posthog.capture('booking_request_accepted', {
            booking_id: requestId,
            service_name: request?.serviceName,
            total_amount: request?.totalAmount,
          });
          Alert.alert('Success', 'Booking request accepted!', [
            { text: 'OK', onPress: () => router.replace('/supplier/requests') }
          ]);
        },
        onError: (error) => {
          Alert.alert('Error', error.message || 'Failed to accept booking request.');
        },
      }
    );
  };

  const handleDeclineRequest = (requestId: string) => {
    posthog.capture('booking_request_declined', {
      booking_id: requestId,
      service_name: request?.serviceName,
    });
    router.push(`/supplier/requests/${requestId}/decline`);
  };

  const handleSendMessage = (message: string) => {
    // In a real app, this would send the message through the chat system
    logger.log('Sending message:', message);
    router.push(`/chat/${request.customerId}`);
  };

  const handleMessageCustomer = () => {
    router.push(`/chat/${request.customerId}`);
  };

  const handleNavigateToLocation = () => {
    const query = encodeURIComponent(request.meetingPoint);
    const url = `https://maps.google.com/?q=${query}`;
    Linking.openURL(url);
  };

  const getUrgencyColor = (urgency: BookingRequest['urgency']) => {
    switch (urgency) {
      case 'urgent':
        return designTokens.colors.semantic.error;
      case 'high':
        return designTokens.colors.semantic.accent;
      case 'medium':
        return designTokens.colors.semantic.warning;
      case 'low':
        return designTokens.colors.semantic.success;
      default:
        return designTokens.colors.semantic.textSecondary;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatCurrency = (amount: number) => {
    return `฿${amount.toLocaleString()}`;
  };

  const getTimeUntilExpiry = () => {
    const now = new Date();
    const expiry = new Date(request.expiresAt);
    const diff = expiry.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m left to respond`;
    } else if (minutes > 0) {
      return `${minutes}m left to respond`;
    } else {
      return 'Request expired';
    }
  };

  const isPending = request.status === 'pending';
  const isUrgent = request.urgency === 'urgent' || request.urgency === 'high';

  return (
    <RadialGradient variant="appBackground" style={styles.container}>
      {/* Header */}
      <SafeAreaView edges={['top']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={designTokens.colors.semantic.text} />
          </TouchableOpacity>
          
          <View style={styles.headerTitle}>
            <Subheading>Request Details</Subheading>
            <Caption style={styles.requestId}>#{request.id.toUpperCase()}</Caption>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleMessageCustomer}
            >
              <MessageSquare size={20} color={designTokens.colors.semantic.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Urgency Banner */}
        {isUrgent && isPending && (
          <LinearGradient
            colors={[designTokens.colors.semantic.accent, '#FF8A80']}
            style={styles.urgencyBanner}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <AlertTriangle size={16} color={designTokens.colors.semantic.surface} />
            <Text style={styles.urgencyText}>
              {request.urgency.toUpperCase()} PRIORITY • {getTimeUntilExpiry()}
            </Text>
          </LinearGradient>
        )}
      </SafeAreaView>

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Customer Profile Section */}
        <Card style={styles.section} padding={16}>
          <View style={styles.sectionHeader}>
            <Subheading style={styles.sectionTitle}>Customer Information</Subheading>
          </View>
          
          <View style={styles.customerProfile}>
            <ProfileImage
              uri={request.customerImage}
              size="large"
              style={styles.customerImage}
            />
            
            <View style={styles.customerDetails}>
              <View style={styles.customerNameRow}>
                <Heading style={styles.customerName}>{request.customerName}</Heading>
                {request.customerVerified && (
                  <Shield size={20} color={designTokens.colors.semantic.success} />
                )}
                {request.isRepeatCustomer && (
                  <Star size={18} color={designTokens.colors.semantic.warning} fill={designTokens.colors.semantic.warning} />
                )}
              </View>
              
              <View style={styles.customerStats}>
                <View style={styles.statItem}>
                  <Star size={14} color="#FFD700" fill="#FFD700" />
                  <Body style={styles.statText}>
                    {request.customerRating} ({request.customerReviewCount} reviews)
                  </Body>
                </View>
                
                <View style={styles.statItem}>
                  <Calendar size={14} color={designTokens.colors.semantic.textSecondary} />
                  <Body style={styles.statText}>
                    Joined {new Date(request.customerJoinDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </Body>
                </View>
              </View>

              {request.isRepeatCustomer && (
                <View style={styles.repeatCustomerBadge}>
                  <Heart size={14} color={designTokens.colors.semantic.accent} />
                  <Caption style={styles.repeatCustomerText}>
                    Repeat Customer • {request.previousBookings} previous booking{request.previousBookings !== 1 ? 's' : ''}
                  </Caption>
                </View>
              )}
            </View>
          </View>
        </Card>

        {/* Service Details Section */}
        <Card style={styles.section} padding={16}>
          <View style={styles.sectionHeader}>
            <Subheading style={styles.sectionTitle}>Service Details</Subheading>
            <View style={[styles.statusBadge, { backgroundColor: getUrgencyColor(request.urgency) + '20' }]}>
              <Text style={[styles.statusText, { color: getUrgencyColor(request.urgency) }]}>
                {request.urgency.toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.serviceInfo}>
            <Heading style={styles.serviceName}>{request.serviceName}</Heading>
            <Caption style={styles.serviceCategory}>{request.serviceCategory}</Caption>
          </View>

          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Calendar size={20} color={designTokens.colors.semantic.primary} />
              <View style={styles.detailContent}>
                <Body style={styles.detailLabel}>Date & Time</Body>
                <Subheading style={styles.detailValue}>
                  {formatDate(request.requestedDate)}
                </Subheading>
                <Body style={styles.detailSubValue}>
                  {formatTime(request.requestedTime)} • {request.duration} hours
                </Body>
              </View>
            </View>

            <View style={styles.detailItem}>
              <Users size={20} color={designTokens.colors.semantic.primary} />
              <View style={styles.detailContent}>
                <Body style={styles.detailLabel}>Group Size</Body>
                <Subheading style={styles.detailValue}>
                  {request.groupSize} {request.groupSize === 1 ? 'person' : 'people'}
                </Subheading>
                <Body style={styles.detailSubValue}>{request.groupComposition}</Body>
              </View>
            </View>

            <View style={styles.detailItem}>
              <MapPin size={20} color={designTokens.colors.semantic.primary} />
              <View style={styles.detailContent}>
                <Body style={styles.detailLabel}>Meeting Location</Body>
                <Subheading style={styles.detailValue}>{request.meetingLocation}</Subheading>
                <TouchableOpacity 
                  style={styles.locationLink}
                  onPress={handleNavigateToLocation}
                >
                  <Body style={styles.detailSubValue}>{request.meetingPoint}</Body>
                  <Navigation size={14} color={designTokens.colors.semantic.primary} />
                </TouchableOpacity>
                <Caption style={styles.distanceText}>
                  {request.distance}km away • {request.travelTime} min travel
                </Caption>
              </View>
            </View>
          </View>
        </Card>

        {/* Special Requests Section */}
        {(request.specialRequests || request.dietaryRestrictions.length > 0 || request.accessibilityNeeds.length > 0) && (
          <Card style={styles.section} padding={16}>
            <View style={styles.sectionHeader}>
              <Subheading style={styles.sectionTitle}>Special Requests</Subheading>
            </View>

            {request.specialRequests && (
              <View style={styles.requestItem}>
                <MessageSquare size={16} color={designTokens.colors.semantic.primary} />
                <View style={styles.requestContent}>
                  <Body style={styles.requestLabel}>Customer Message:</Body>
                  <Body style={styles.requestText}>"{request.specialRequests}"</Body>
                </View>
              </View>
            )}

            {request.languagePreference && (
              <View style={styles.requestItem}>
                <View style={styles.requestContent}>
                  <Body style={styles.requestLabel}>Language Preference:</Body>
                  <Body style={styles.requestValue}>{request.languagePreference}</Body>
                </View>
              </View>
            )}

            {request.dietaryRestrictions.length > 0 && (
              <View style={styles.requestItem}>
                <View style={styles.requestContent}>
                  <Body style={styles.requestLabel}>Dietary Restrictions:</Body>
                  <Body style={styles.requestValue}>
                    {request.dietaryRestrictions.map(restriction => 
                      restriction.charAt(0).toUpperCase() + restriction.slice(1)
                    ).join(', ')}
                  </Body>
                </View>
              </View>
            )}

            {request.accessibilityNeeds.length > 0 && (
              <View style={styles.requestItem}>
                <View style={styles.requestContent}>
                  <Body style={styles.requestLabel}>Accessibility Needs:</Body>
                  <Body style={styles.requestValue}>
                    {request.accessibilityNeeds.map(need => 
                      need.replace('_', ' ').charAt(0).toUpperCase() + need.replace('_', ' ').slice(1)
                    ).join(', ')}
                  </Body>
                </View>
              </View>
            )}
          </Card>
        )}

        {/* Pricing Section */}
        <Card style={styles.section} padding={16}>
          <View style={styles.sectionHeader}>
            <Subheading style={styles.sectionTitle}>Pricing Details</Subheading>
          </View>

          <View style={styles.pricingBreakdown}>
            <View style={styles.priceRow}>
              <Body style={styles.priceLabel}>Base Service Fee:</Body>
              <Body style={styles.priceValue}>{formatCurrency(request.basePrice)}</Body>
            </View>
            
            <View style={styles.priceRow}>
              <Body style={styles.priceLabel}>Platform Fee (12%):</Body>
              <Body style={styles.priceValue}>{formatCurrency(request.serviceFee)}</Body>
            </View>
            
            <View style={[styles.priceRow, styles.totalRow]}>
              <Subheading style={styles.totalLabel}>Total Amount:</Subheading>
              <Heading style={styles.totalValue}>{formatCurrency(request.totalAmount)}</Heading>
            </View>
          </View>
        </Card>



        {/* Communication Tools Section */}
        <CommunicationTools
          request={request}
          onSendMessage={handleSendMessage}
        />

        {/* Decline Reason Section (if applicable) */}
        {request.declineReason && (
          <Card style={styles.section} padding={16}>
            <View style={styles.sectionHeader}>
              <Subheading style={styles.sectionTitle}>Decline Reason</Subheading>
              <View style={styles.declineBadge}>
                <Text style={styles.declineText}>DECLINED</Text>
              </View>
            </View>

            <View style={styles.declineDetails}>
              <Body style={styles.declineCategory}>
                {request.declineReason.category.replace('_', ' ').toUpperCase()}
              </Body>
              <Body style={styles.declineMessage}>"{request.declineReason.message}"</Body>
            </View>
          </Card>
        )}
      </ScrollView>

      {/* Action Buttons */}
      {isPending && (
        <SafeAreaView edges={['bottom']}>
          <RequestActions
            request={request}
            onAccept={handleAcceptRequest}
            onDecline={handleDeclineRequest}
          />
        </SafeAreaView>
      )}
    </RadialGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: designTokens.spacing.scale.md,
  },
  header: {
    backgroundColor: 'transparent',
    paddingHorizontal: designTokens.spacing.scale.md,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: designTokens.spacing.scale.sm,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: designTokens.colors.semantic.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...componentTokens.card.shadow,
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  requestId: {
    color: designTokens.colors.semantic.textSecondary,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: designTokens.spacing.scale.sm,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: designTokens.colors.semantic.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...componentTokens.card.shadow,
  },
  urgencyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: designTokens.spacing.scale.md,
    paddingVertical: designTokens.spacing.scale.sm,
    borderRadius: componentTokens.card.borderRadius,
    marginBottom: designTokens.spacing.scale.sm,
  },
  urgencyText: {
    color: designTokens.colors.semantic.surface,
    fontWeight: '600',
    marginLeft: designTokens.spacing.scale.sm,
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: designTokens.spacing.scale.md,
    paddingBottom: designTokens.spacing.scale.xl,
  },
  section: {
    marginBottom: designTokens.spacing.scale.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: designTokens.spacing.scale.md,
  },
  sectionTitle: {
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: designTokens.spacing.scale.sm,
    paddingVertical: designTokens.spacing.scale.xs,
    borderRadius: componentTokens.button.borderRadius,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  customerProfile: {
    flexDirection: 'row',
  },
  customerImage: {
    marginRight: designTokens.spacing.scale.md,
  },
  customerDetails: {
    flex: 1,
  },
  customerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: designTokens.spacing.scale.sm,
    gap: designTokens.spacing.scale.xs,
  },
  customerName: {
    flex: 1,
  },
  customerStats: {
    marginBottom: designTokens.spacing.scale.sm,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: designTokens.spacing.scale.xs,
  },
  statText: {
    marginLeft: designTokens.spacing.scale.xs,
    color: designTokens.colors.semantic.textSecondary,
  },
  repeatCustomerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: designTokens.colors.semantic.accent + '20',
    paddingHorizontal: designTokens.spacing.scale.sm,
    paddingVertical: designTokens.spacing.scale.xs,
    borderRadius: componentTokens.button.borderRadius,
    alignSelf: 'flex-start',
  },
  repeatCustomerText: {
    marginLeft: designTokens.spacing.scale.xs,
    color: designTokens.colors.semantic.accent,
    fontWeight: '500',
  },
  serviceInfo: {
    marginBottom: designTokens.spacing.scale.md,
  },
  serviceName: {
    marginBottom: designTokens.spacing.scale.xs,
  },
  serviceCategory: {
    color: designTokens.colors.semantic.textSecondary,
  },
  detailsGrid: {
    gap: designTokens.spacing.scale.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  detailContent: {
    marginLeft: designTokens.spacing.scale.sm,
    flex: 1,
  },
  detailLabel: {
    color: designTokens.colors.semantic.textSecondary,
    marginBottom: designTokens.spacing.scale.xs,
  },
  detailValue: {
    marginBottom: designTokens.spacing.scale.xs,
  },
  detailSubValue: {
    color: designTokens.colors.semantic.textSecondary,
  },
  locationLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.scale.xs,
    marginBottom: designTokens.spacing.scale.xs,
  },
  distanceText: {
    color: designTokens.colors.semantic.textSecondary,
    fontStyle: 'italic',
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: designTokens.spacing.scale.md,
  },
  requestContent: {
    marginLeft: designTokens.spacing.scale.sm,
    flex: 1,
  },
  requestLabel: {
    color: designTokens.colors.semantic.textSecondary,
    marginBottom: designTokens.spacing.scale.xs,
  },
  requestText: {
    fontStyle: 'italic',
    backgroundColor: designTokens.colors.semantic.surface + '80',
    padding: designTokens.spacing.scale.sm,
    borderRadius: componentTokens.card.borderRadius,
  },
  requestValue: {
    fontWeight: '500',
  },
  pricingBreakdown: {
    gap: designTokens.spacing.scale.sm,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    color: designTokens.colors.semantic.textSecondary,
  },
  priceValue: {
    fontWeight: '500',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: designTokens.colors.semantic.border,
    paddingTop: designTokens.spacing.scale.sm,
    marginTop: designTokens.spacing.scale.sm,
  },
  totalLabel: {
    color: designTokens.colors.semantic.text,
  },
  totalValue: {
    color: designTokens.colors.semantic.primary,
  },
  declineBadge: {
    backgroundColor: designTokens.colors.semantic.error + '20',
    paddingHorizontal: designTokens.spacing.scale.sm,
    paddingVertical: designTokens.spacing.scale.xs,
    borderRadius: componentTokens.button.borderRadius,
  },
  declineText: {
    color: designTokens.colors.semantic.error,
    fontSize: 11,
    fontWeight: '600',
  },
  declineDetails: {
    gap: designTokens.spacing.scale.sm,
  },
  declineCategory: {
    color: designTokens.colors.semantic.error,
    fontWeight: '600',
  },
  declineMessage: {
    fontStyle: 'italic',
    backgroundColor: designTokens.colors.semantic.surface + '80',
    padding: designTokens.spacing.scale.sm,
    borderRadius: componentTokens.card.borderRadius,
  },

});
