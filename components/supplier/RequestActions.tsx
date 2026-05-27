import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  Animated,
} from 'react-native';
import {
  CheckCircle,
  X,
  Clock,
  Star,
  MessageSquare,
  Calendar,
  DollarSign,
  AlertTriangle,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Heading, Subheading, Body, Caption } from '@/components/ui/Typography';
import { designTokens, componentTokens } from '@/constants/design-tokens';
import { BookingRequest } from '@/types/supplier-request';

interface RequestActionsProps {
  request: BookingRequest;
  onAccept: (requestId: string) => void;
  onDecline: (requestId: string) => void;
  disabled?: boolean;
}

interface AcceptConfirmationModalProps {
  visible: boolean;
  request: BookingRequest;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

const AcceptConfirmationModal: React.FC<AcceptConfirmationModalProps> = ({
  visible,
  request,
  onConfirm,
  onCancel,
  loading = false,
}) => {
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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Card style={styles.confirmationCard} padding={0}>
            {/* Header */}
            <LinearGradient
              colors={[designTokens.colors.semantic.success, '#4CAF50']}
              style={styles.confirmationHeader}
            >
              <CheckCircle size={32} color={designTokens.colors.semantic.surface} />
              <Heading style={styles.confirmationTitle}>Approve Traveler Request</Heading>
              <Caption style={styles.confirmationSubtitle}>
                Review the time, place, and guide rate before approving.
              </Caption>
            </LinearGradient>

            {/* Content */}
            <View style={styles.confirmationContent}>
              {/* Traveler Info */}
              <View style={styles.confirmationSection}>
                <View style={styles.sectionHeader}>
                  <MessageSquare size={16} color={designTokens.colors.semantic.primary} />
                  <Subheading style={styles.sectionTitle}>Traveler</Subheading>
                </View>
                <Body style={styles.sectionValue}>{request.customerName}</Body>
                {request.isRepeatCustomer && (
                  <Caption style={styles.repeatBadge}>Repeat Traveler</Caption>
                )}
              </View>

              {/* Experience Details */}
              <View style={styles.confirmationSection}>
                <View style={styles.sectionHeader}>
                  <Star size={16} color={designTokens.colors.semantic.primary} />
                  <Subheading style={styles.sectionTitle}>Experience</Subheading>
                </View>
                <Body style={styles.sectionValue}>{request.serviceName}</Body>
                <Caption style={styles.sectionSubtext}>{request.serviceCategory}</Caption>
              </View>

              {/* Date & Time */}
              <View style={styles.confirmationSection}>
                <View style={styles.sectionHeader}>
                  <Calendar size={16} color={designTokens.colors.semantic.primary} />
                  <Subheading style={styles.sectionTitle}>Date & Time</Subheading>
                </View>
                <Body style={styles.sectionValue}>
                  {formatDate(request.requestedDate)}
                </Body>
                <Caption style={styles.sectionSubtext}>
                  {formatTime(request.requestedTime)} • {request.duration} hours
                </Caption>
              </View>

              {/* Pricing */}
              <View style={styles.confirmationSection}>
                <View style={styles.sectionHeader}>
                  <DollarSign size={16} color={designTokens.colors.semantic.primary} />
                  <Subheading style={styles.sectionTitle}>Guide Rate</Subheading>
                </View>
                <Heading style={styles.priceValue}>
                  {formatCurrency(request.totalAmount)}
                </Heading>
                <Caption style={styles.sectionSubtext}>
                  Paid in cash directly to you unless another arrangement is shown.
                </Caption>
              </View>

              {/* Special Requests */}
              {request.specialRequests && (
                <View style={styles.confirmationSection}>
                  <Subheading style={styles.sectionTitle}>Special Requests</Subheading>
                  <View style={styles.requestsBox}>
                    <Body style={styles.requestsText}>"{request.specialRequests}"</Body>
                  </View>
                </View>
              )}

              {/* Important Notes */}
              <View style={styles.importantNotes}>
                <AlertTriangle size={16} color={designTokens.colors.semantic.warning} />
                <View style={styles.notesContent}>
                  <Caption style={styles.notesTitle}>Important:</Caption>
                  <Caption style={styles.notesText}>
                    • You are committing to this booking once approved{'\n'}
                    • The traveler will be notified immediately{'\n'}
                    • Cancellation may affect guide trust signals
                  </Caption>
                </View>
              </View>
            </View>

            {/* Actions */}
            <View style={styles.confirmationActions}>
              <Button
                title="Cancel"
                onPress={onCancel}
                variant="outline"
                style={styles.cancelButton}
                disabled={loading}
              />
              <Button
                title={loading ? "Approving..." : "Approve Booking"}
                onPress={onConfirm}
                style={styles.acceptButton}
                loading={loading}
              />
            </View>
          </Card>
        </View>
      </View>
    </Modal>
  );
};

export const RequestActions: React.FC<RequestActionsProps> = ({
  request,
  onAccept,
  onDecline,
  disabled = false,
}) => {
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);

  const handleAcceptPress = () => {
    setShowAcceptModal(true);
  };

  const handleAcceptConfirm = async () => {
    setIsAccepting(true);

    try {
      await Promise.resolve(onAccept(request.id));
      setShowAcceptModal(false);
    } finally {
      setIsAccepting(false);
    }
  };

  const handleDeclinePress = () => {
    onDecline(request.id);
  };

  const isPending = request.status === 'pending';
  const isUrgent = request.urgency === 'urgent' || request.urgency === 'high';

  if (!isPending) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Urgency Indicator */}
      {isUrgent && (
        <View style={styles.urgencyIndicator}>
          <Clock size={14} color={designTokens.colors.semantic.accent} />
          <Caption style={styles.urgencyText}>
            {request.urgency.toUpperCase()} PRIORITY - Respond quickly
          </Caption>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <Button
          title="Decline"
          onPress={handleDeclinePress}
          variant="outline"
          style={[styles.actionButton, styles.declineButton]}
          textStyle={styles.declineButtonText}
          disabled={disabled}
        />

        <Button
          title="Accept"
          onPress={handleAcceptPress}
          style={[styles.actionButton, styles.acceptButton]}
          disabled={disabled}
        />
      </View>

      {/* Quick Stats */}
      <View style={styles.quickStats}>
        <View style={styles.statItem}>
          <DollarSign size={14} color={designTokens.colors.semantic.success} />
          <Caption style={styles.statText}>
            ฿{request.totalAmount.toLocaleString()}
          </Caption>
        </View>
        
        <View style={styles.statItem}>
          <Clock size={14} color={designTokens.colors.semantic.primary} />
          <Caption style={styles.statText}>
            {request.duration}h service
          </Caption>
        </View>
        
        {request.isRepeatCustomer && (
          <View style={styles.statItem}>
            <Star size={14} color={designTokens.colors.semantic.warning} />
            <Caption style={styles.statText}>
              Repeat customer
            </Caption>
          </View>
        )}
      </View>

      {/* Accept Confirmation Modal */}
      <AcceptConfirmationModal
        visible={showAcceptModal}
        request={request}
        onConfirm={handleAcceptConfirm}
        onCancel={() => setShowAcceptModal(false)}
        loading={isAccepting}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: designTokens.colors.semantic.surface,
    paddingHorizontal: designTokens.spacing.scale.md,
    paddingVertical: designTokens.spacing.scale.md,
    ...componentTokens.card.shadow,
  },
  urgencyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: designTokens.colors.semantic.accent + '20',
    paddingHorizontal: designTokens.spacing.scale.sm,
    paddingVertical: designTokens.spacing.scale.xs,
    borderRadius: componentTokens.button.borderRadius,
    marginBottom: designTokens.spacing.scale.md,
    alignSelf: 'center',
  },
  urgencyText: {
    marginLeft: designTokens.spacing.scale.xs,
    color: designTokens.colors.semantic.accent,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: designTokens.spacing.scale.sm,
    marginBottom: designTokens.spacing.scale.md,
  },
  actionButton: {
    flex: 1,
  },
  declineButton: {
    borderColor: designTokens.colors.semantic.error,
  },
  declineButtonText: {
    color: designTokens.colors.semantic.error,
  },
  acceptButton: {
    backgroundColor: designTokens.colors.semantic.success,
    flex: 2, // Make accept button larger
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: designTokens.spacing.scale.lg,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    marginLeft: designTokens.spacing.scale.xs,
    color: designTokens.colors.semantic.textSecondary,
    fontWeight: '500',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: designTokens.spacing.scale.md,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
  },
  confirmationCard: {
    maxHeight: '90%',
  },
  confirmationHeader: {
    alignItems: 'center',
    paddingVertical: designTokens.spacing.scale.lg,
    paddingHorizontal: designTokens.spacing.scale.md,
  },
  confirmationTitle: {
    color: designTokens.colors.semantic.surface,
    marginTop: designTokens.spacing.scale.sm,
    marginBottom: designTokens.spacing.scale.xs,
    textAlign: 'center',
  },
  confirmationSubtitle: {
    color: designTokens.colors.semantic.surface + 'CC',
    textAlign: 'center',
  },
  confirmationContent: {
    padding: designTokens.spacing.scale.md,
  },
  confirmationSection: {
    marginBottom: designTokens.spacing.scale.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: designTokens.spacing.scale.xs,
  },
  sectionTitle: {
    marginLeft: designTokens.spacing.scale.xs,
    color: designTokens.colors.semantic.textSecondary,
  },
  sectionValue: {
    fontWeight: '500',
    marginBottom: 2,
  },
  sectionSubtext: {
    color: designTokens.colors.semantic.textSecondary,
  },
  repeatBadge: {
    color: designTokens.colors.semantic.accent,
    fontWeight: '600',
    marginTop: 2,
  },
  priceValue: {
    color: designTokens.colors.semantic.success,
    marginBottom: 2,
  },
  requestsBox: {
    backgroundColor: designTokens.colors.semantic.surface + '80',
    padding: designTokens.spacing.scale.sm,
    borderRadius: componentTokens.card.borderRadius,
    marginTop: designTokens.spacing.scale.xs,
  },
  requestsText: {
    fontStyle: 'italic',
    color: designTokens.colors.semantic.textSecondary,
  },
  importantNotes: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: designTokens.colors.semantic.warning + '20',
    padding: designTokens.spacing.scale.sm,
    borderRadius: componentTokens.card.borderRadius,
    marginTop: designTokens.spacing.scale.sm,
  },
  notesContent: {
    marginLeft: designTokens.spacing.scale.sm,
    flex: 1,
  },
  notesTitle: {
    color: designTokens.colors.semantic.warning,
    fontWeight: '600',
    marginBottom: designTokens.spacing.scale.xs,
  },
  notesText: {
    color: designTokens.colors.semantic.textSecondary,
    lineHeight: 16,
  },
  confirmationActions: {
    flexDirection: 'row',
    gap: designTokens.spacing.scale.sm,
    padding: designTokens.spacing.scale.md,
    borderTopWidth: 1,
    borderTopColor: designTokens.colors.semantic.border,
  },
  cancelButton: {
    flex: 1,
  },
});
