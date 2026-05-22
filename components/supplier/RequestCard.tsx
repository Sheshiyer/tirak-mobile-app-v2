import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  MessageSquare,
  CheckCircle,
  X,
  Eye,
  AlertTriangle,
  Star,
  Shield
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { designTokens, componentTokens } from '@/constants/design-tokens';
import { ProfileImage } from '@/components/ui/ProfileImage';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Heading, Subheading, Body, Caption } from '@/components/ui/Typography';
import { CommunicationTools } from './CommunicationTools';
import { BookingRequest } from '@/types/supplier-request';

interface RequestCardProps {
  request: BookingRequest;
  onAccept?: (requestId: string) => void;
  onDecline?: (requestId: string) => void;
  onViewDetails?: (requestId: string) => void;
  onMessage?: (customerId: string) => void;
  onSendMessage?: (message: string) => void;
}

export const RequestCard: React.FC<RequestCardProps> = ({
  request,
  onAccept,
  onDecline,
  onViewDetails,
  onMessage,
  onSendMessage,
}) => {
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

  const getUrgencyLabel = (urgency: BookingRequest['urgency']) => {
    switch (urgency) {
      case 'urgent':
        return 'URGENT';
      case 'high':
        return 'HIGH';
      case 'medium':
        return 'MEDIUM';
      case 'low':
        return 'LOW';
      default:
        return '';
    }
  };

  const getStatusColor = (status: BookingRequest['status']) => {
    switch (status) {
      case 'pending':
        return designTokens.colors.semantic.warning;
      case 'accepted':
        return designTokens.colors.semantic.success;
      case 'declined':
        return designTokens.colors.semantic.error;

      case 'expired':
        return designTokens.colors.semantic.textSecondary;
      case 'cancelled':
        return designTokens.colors.semantic.error;
      default:
        return designTokens.colors.semantic.textSecondary;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
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
      return `${hours}h ${minutes}m left`;
    } else if (minutes > 0) {
      return `${minutes}m left`;
    } else {
      return 'Expired';
    }
  };

  const isPending = request.status === 'pending';
  const isUrgent = request.urgency === 'urgent' || request.urgency === 'high';

  return (
    <Card style={[styles.container, isUrgent && styles.urgentContainer]} padding={0}>
      {/* Urgency Banner */}
      {isUrgent && (
        <LinearGradient
          colors={[designTokens.colors.semantic.accent, '#FF8A80']}
          style={styles.urgencyBanner}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <AlertTriangle size={14} color={designTokens.colors.semantic.surface} />
          <Caption style={styles.urgencyText}>
            {getUrgencyLabel(request.urgency)} PRIORITY
          </Caption>
          <Caption style={styles.expiryText}>
            {getTimeUntilExpiry()}
          </Caption>
        </LinearGradient>
      )}

      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.customerInfo}>
            <ProfileImage
              uri={request.customerImage}
              size="medium"
              style={styles.customerImage}
            />
            <View style={styles.customerDetails}>
              <View style={styles.nameRow}>
                <Subheading style={styles.customerName}>{request.customerName}</Subheading>
                {request.customerVerified && (
                  <Shield size={16} color={designTokens.colors.semantic.success} />
                )}
                {request.isRepeatCustomer && (
                  <Star size={14} color={designTokens.colors.semantic.warning} fill={designTokens.colors.semantic.warning} />
                )}
              </View>
              <View style={styles.ratingRow}>
                <Star size={12} color="#FFD700" fill="#FFD700" />
                <Caption style={styles.ratingText}>
                  {request.customerRating} ({request.customerReviewCount} reviews)
                </Caption>
                {request.isRepeatCustomer && (
                  <Caption style={styles.repeatText}>• Repeat Customer</Caption>
                )}
              </View>
            </View>
          </View>

          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) + '20' }]}>
              <Text style={[styles.statusText, { color: getStatusColor(request.status) }]}>
                {request.status.replace('_', ' ').toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        {/* Service Details */}
        <View style={styles.serviceSection}>
          <Subheading style={styles.serviceName}>{request.serviceName}</Subheading>
          <Caption style={styles.serviceCategory}>{request.serviceCategory}</Caption>
        </View>

        {/* Booking Details */}
        <View style={styles.detailsSection}>
          <View style={styles.detailRow}>
            <Calendar size={16} color={designTokens.colors.semantic.primary} />
            <Body style={styles.detailText}>
              {formatDate(request.requestedDate)} at {formatTime(request.requestedTime)}
            </Body>
          </View>

          <View style={styles.detailRow}>
            <Clock size={16} color={designTokens.colors.semantic.primary} />
            <Body style={styles.detailText}>
              {request.duration} hours • {request.groupSize} {request.groupSize === 1 ? 'person' : 'people'}
            </Body>
          </View>

          <View style={styles.detailRow}>
            <MapPin size={16} color={designTokens.colors.semantic.primary} />
            <Body style={styles.detailText} numberOfLines={1}>
              {request.meetingPoint} • {request.distance}km away
            </Body>
          </View>
        </View>

        {/* Special Requests Preview */}
        {request.specialRequests && (
          <View style={styles.requestsSection}>
            <Body style={styles.requestsText} numberOfLines={2}>
              "{request.specialRequests}"
            </Body>
          </View>
        )}

        {/* Pricing */}
        <View style={styles.pricingSection}>
          <View style={styles.priceRow}>
            <Body style={styles.priceLabel}>Total Amount:</Body>
            <Subheading style={styles.priceAmount}>
              {formatCurrency(request.totalAmount)}
            </Subheading>
          </View>
        </View>

        {/* Communication Tools */}
        {(isPending || request.status === 'accepted') && onSendMessage && (
          <View style={styles.communicationSection}>
            <CommunicationTools
              request={request}
              onSendMessage={onSendMessage}
              compact={true}
            />
          </View>
        )}

        {/* Action Buttons */}
        {isPending && (
          <View style={styles.actionsSection}>
            <View style={styles.quickActions}>
              <TouchableOpacity
                style={styles.iconAction}
                onPress={() => onMessage?.(request.customerId)}
              >
                <MessageSquare size={20} color={designTokens.colors.semantic.primary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.iconAction}
                onPress={() => onViewDetails?.(request.id)}
              >
                <Eye size={20} color={designTokens.colors.semantic.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.mainActions}>
              <Button
                title="Decline"
                onPress={() => onDecline?.(request.id)}
                variant="outline"
                style={styles.declineButton}
                textStyle={styles.declineButtonText}
              />
              <Button
                title="Accept"
                onPress={() => onAccept?.(request.id)}
                style={styles.acceptButton}
              />
            </View>
          </View>
        )}

        {/* Non-pending status actions */}
        {!isPending && (
          <View style={styles.viewDetailsSection}>
            <Button
              title="View Details"
              onPress={() => onViewDetails?.(request.id)}
              variant="outline"
              style={styles.viewDetailsButton}
            />
          </View>
        )}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: designTokens.spacing.scale.md,
    overflow: 'hidden',
  },
  urgentContainer: {
    borderWidth: 1,
    borderColor: designTokens.colors.semantic.accent + '40',
  },
  urgencyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: designTokens.spacing.scale.md,
    paddingVertical: designTokens.spacing.scale.xs,
  },
  urgencyText: {
    color: designTokens.colors.semantic.surface,
    fontWeight: '600',
    flex: 1,
    marginLeft: designTokens.spacing.scale.xs,
  },
  expiryText: {
    color: designTokens.colors.semantic.surface,
    fontWeight: '500',
  },
  content: {
    padding: designTokens.spacing.scale.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: designTokens.spacing.scale.md,
  },
  customerInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  customerImage: {
    marginRight: designTokens.spacing.scale.sm,
  },
  customerDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: designTokens.spacing.scale.xs,
  },
  customerName: {
    marginRight: designTokens.spacing.scale.xs,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: designTokens.spacing.scale.xs,
    color: designTokens.colors.semantic.textSecondary,
  },
  repeatText: {
    marginLeft: designTokens.spacing.scale.xs,
    color: designTokens.colors.semantic.warning,
    fontWeight: '500',
  },
  statusContainer: {
    alignItems: 'flex-end',
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
  serviceSection: {
    marginBottom: designTokens.spacing.scale.md,
  },
  serviceName: {
    marginBottom: designTokens.spacing.scale.xs,
  },
  serviceCategory: {
    color: designTokens.colors.semantic.textSecondary,
  },
  detailsSection: {
    marginBottom: designTokens.spacing.scale.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: designTokens.spacing.scale.sm,
  },
  detailText: {
    marginLeft: designTokens.spacing.scale.sm,
    flex: 1,
  },
  requestsSection: {
    backgroundColor: designTokens.colors.semantic.surface + '80',
    padding: designTokens.spacing.scale.sm,
    borderRadius: componentTokens.card.borderRadius,
    marginBottom: designTokens.spacing.scale.md,
  },
  requestsText: {
    fontStyle: 'italic',
    color: designTokens.colors.semantic.textSecondary,
  },
  pricingSection: {
    marginBottom: designTokens.spacing.scale.md,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    color: designTokens.colors.semantic.textSecondary,
  },
  priceAmount: {
    color: designTokens.colors.semantic.primary,
    fontWeight: '600',
  },
  communicationSection: {
    borderTopWidth: 1,
    borderTopColor: designTokens.colors.semantic.border,
    paddingTop: designTokens.spacing.scale.md,
    marginBottom: designTokens.spacing.scale.md,
  },
  actionsSection: {
    borderTopWidth: 1,
    borderTopColor: designTokens.colors.semantic.border,
    paddingTop: designTokens.spacing.scale.md,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: designTokens.spacing.scale.md,
  },
  iconAction: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: designTokens.colors.semantic.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: designTokens.spacing.scale.sm,
    ...componentTokens.card.shadow,
  },
  mainActions: {
    flexDirection: 'row',
    gap: designTokens.spacing.scale.sm,
  },
  declineButton: {
    flex: 1,
    borderColor: designTokens.colors.semantic.error,
  },
  declineButtonText: {
    color: designTokens.colors.semantic.error,
  },
  acceptButton: {
    flex: 1,
  },
  viewDetailsSection: {
    borderTopWidth: 1,
    borderTopColor: designTokens.colors.semantic.border,
    paddingTop: designTokens.spacing.scale.md,
  },
  viewDetailsButton: {
    width: '100%',
  },
});
