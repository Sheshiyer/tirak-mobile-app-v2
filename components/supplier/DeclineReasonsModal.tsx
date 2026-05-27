import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  Animated,
} from 'react-native';
import {
  X,
  Calendar,
  DollarSign,
  MapPin,
  Users,
  AlertTriangle,
  MessageSquare,
  Clock,
  CheckCircle,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Heading, Subheading, Body, Caption } from '@/components/ui/Typography';
import { designTokens, componentTokens } from '@/constants/design-tokens';

interface DeclineReason {
  id: string;
  category: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  template: string;
  requiresCustomMessage?: boolean;
}

interface DeclineReasonsModalProps {
  visible: boolean;
  onClose: () => void;
  onDecline: (reason: { category: string; message: string }) => void;
  customerName: string;
  serviceName: string;
  requestDate: string;
  requestTime: string;
}

const DECLINE_REASONS: DeclineReason[] = [
  {
    id: 'scheduling_conflict',
    category: 'scheduling_conflict',
    title: 'Scheduling Conflict',
    description: 'I have another booking or commitment at this time',
    icon: <Calendar size={20} color="#FF6B6B" />,
    template: 'Unfortunately, I have another booking at that time. I\'d be happy to suggest alternative dates that work better.',
  },
  {
    id: 'pricing_concern',
    category: 'pricing_concern',
    title: 'Pricing Concern',
    description: 'The offered price doesn\'t meet my requirements',
    icon: <DollarSign size={20} color="#FF8E53" />,
    template: 'Thank you for your interest. The current pricing doesn\'t align with my service rates. I\'d be happy to discuss a counter-offer.',
    requiresCustomMessage: true,
  },
  {
    id: 'location_distance',
    category: 'location_distance',
    title: 'Location Too Far',
    description: 'The meeting location is outside my service area',
    icon: <MapPin size={20} color="#4ECDC4" />,
    template: 'The requested meeting location is outside my current service area. I typically serve areas within [X] km of central Bangkok.',
    requiresCustomMessage: true,
  },
  {
    id: 'group_size',
    category: 'group_size',
    title: 'Group Size Issue',
    description: 'The group size doesn\'t match my service capacity',
    icon: <Users size={20} color="#45B7D1" />,
    template: 'I\'m not able to accommodate a group of this size for this particular service. I typically handle groups of [X] people maximum.',
    requiresCustomMessage: true,
  },
  {
    id: 'service_mismatch',
    category: 'service_mismatch',
    title: 'Service Mismatch',
    description: 'The requested service doesn\'t match my expertise',
    icon: <AlertTriangle size={20} color="#FFA726" />,
    template: 'This request doesn\'t align with my current service offerings. I specialize in [your specialties] and want to ensure you get the best experience.',
    requiresCustomMessage: true,
  },
  {
    id: 'short_notice',
    category: 'short_notice',
    title: 'Too Short Notice',
    description: 'Not enough time to prepare for this booking',
    icon: <Clock size={20} color="#AB47BC" />,
    template: 'This booking is on quite short notice and I need more time to prepare properly. I typically require at least [X] hours notice.',
    requiresCustomMessage: true,
  },
  {
    id: 'personal_reason',
    category: 'personal_reason',
    title: 'Personal Reason',
    description: 'Personal circumstances prevent me from accepting',
    icon: <MessageSquare size={20} color="#66BB6A" />,
    template: 'Due to personal circumstances, I\'m unable to accept this booking at this time. Thank you for understanding.',
  },
];

export const DeclineReasonsModal: React.FC<DeclineReasonsModalProps> = ({
  visible,
  onClose,
  onDecline,
  customerName,
  serviceName,
  requestDate,
  requestTime,
}) => {
  const [selectedReason, setSelectedReason] = useState<DeclineReason | null>(null);
  const [customMessage, setCustomMessage] = useState('');
  const [step, setStep] = useState<'select' | 'message' | 'confirm'>('select');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReasonSelect = (reason: DeclineReason) => {
    setSelectedReason(reason);
    setCustomMessage(reason.template);
    setStep(reason.requiresCustomMessage ? 'message' : 'confirm');
  };

  const handleBack = () => {
    if (step === 'message' || step === 'confirm') {
      setStep('select');
      setSelectedReason(null);
      setCustomMessage('');
    } else {
      onClose();
    }
  };

  const handleSubmit = async () => {
    if (!selectedReason) return;

    setIsSubmitting(true);
    try {
      await Promise.resolve(onDecline({
        category: selectedReason.category,
        message: customMessage || selectedReason.template,
      }));
      onClose();

      // Reset state
      setSelectedReason(null);
      setCustomMessage('');
      setStep('select');
    } finally {
      setIsSubmitting(false);
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

  const renderReasonSelection = () => (
    <View style={styles.content}>
      <View style={styles.header}>
        <Heading style={styles.title}>Decline Request</Heading>
        <Caption style={styles.subtitle}>
          Choose the clearest reason so the traveler understands what happened.
        </Caption>
      </View>

      {/* Request Summary */}
      <Card style={styles.requestSummary} padding={12}>
        <Body style={styles.summaryText}>
          <Text style={styles.customerName}>{customerName}</Text> • {serviceName}
        </Body>
        <Caption style={styles.summaryDetails}>
          {formatDate(requestDate)} at {formatTime(requestTime)}
        </Caption>
      </Card>

      <ScrollView style={styles.reasonsList} showsVerticalScrollIndicator={false}>
        {DECLINE_REASONS.map((reason) => (
          <TouchableOpacity
            key={reason.id}
            style={styles.reasonItem}
            onPress={() => handleReasonSelect(reason)}
          >
            <View style={styles.reasonIcon}>
              {reason.icon}
            </View>
            <View style={styles.reasonContent}>
              <Subheading style={styles.reasonTitle}>{reason.title}</Subheading>
              <Body style={styles.reasonDescription}>{reason.description}</Body>
            </View>
            <View style={styles.reasonArrow}>
              <Text style={styles.arrowText}>›</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderMessageStep = () => (
    <View style={styles.content}>
      <View style={styles.header}>
        <Heading style={styles.title}>Customize Message</Heading>
        <Caption style={styles.subtitle}>
          Edit the message that will be sent to {customerName}
        </Caption>
      </View>

      <View style={styles.selectedReasonBanner}>
        <View style={styles.reasonIcon}>
          {selectedReason?.icon}
        </View>
        <View style={styles.bannerContent}>
          <Body style={styles.bannerTitle}>{selectedReason?.title}</Body>
          <Caption style={styles.bannerDescription}>{selectedReason?.description}</Caption>
        </View>
      </View>

      <View style={styles.messageSection}>
        <Body style={styles.messageLabel}>Message to traveler:</Body>
        <TextInput
          style={styles.messageInput}
          value={customMessage}
          onChangeText={setCustomMessage}
          multiline
          numberOfLines={6}
          placeholder="Write a clear, kind note for the traveler..."
          placeholderTextColor={designTokens.colors.semantic.textSecondary}
          textAlignVertical="top"
        />
        <Caption style={styles.characterCount}>
          {customMessage.length}/500 characters
        </Caption>
      </View>

      <View style={styles.messagePreview}>
        <Caption style={styles.previewLabel}>Preview:</Caption>
        <View style={styles.previewBox}>
          <Body style={styles.previewText}>"{customMessage}"</Body>
        </View>
      </View>
    </View>
  );

  const renderConfirmStep = () => (
    <View style={styles.content}>
      <View style={styles.header}>
        <Heading style={styles.title}>Confirm Decline</Heading>
        <Caption style={styles.subtitle}>
          Please review your decline reason before sending
        </Caption>
      </View>

      <View style={styles.confirmationCard}>
        <View style={styles.confirmHeader}>
          <View style={styles.reasonIcon}>
            {selectedReason?.icon}
          </View>
          <View style={styles.confirmContent}>
            <Subheading style={styles.confirmTitle}>{selectedReason?.title}</Subheading>
            <Caption style={styles.confirmSubtitle}>
          This message will be sent to {customerName}
            </Caption>
          </View>
        </View>

        <View style={styles.messagePreview}>
          <Body style={styles.finalMessage}>"{customMessage || selectedReason?.template}"</Body>
        </View>
      </View>

      <View style={styles.warningBox}>
        <AlertTriangle size={16} color={designTokens.colors.semantic.warning} />
        <Caption style={styles.warningText}>
          This action cannot be undone. The traveler will be notified immediately.
        </Caption>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <LinearGradient
        colors={[designTokens.colors.reference.pink, designTokens.colors.reference.purple]}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.modalHeader}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <X size={24} color={designTokens.colors.semantic.text} />
          </TouchableOpacity>
          
          <View style={styles.stepIndicator}>
            <View style={[styles.stepDot, step !== 'select' && styles.stepDotActive]} />
            <View style={[styles.stepDot, step === 'confirm' && styles.stepDotActive]} />
          </View>
        </View>

        {/* Content */}
        {step === 'select' && renderReasonSelection()}
        {step === 'message' && renderMessageStep()}
        {step === 'confirm' && renderConfirmStep()}

        {/* Footer */}
        <View style={styles.footer}>
          {step === 'message' && (
            <Button
              title="Continue"
              onPress={() => setStep('confirm')}
              disabled={!customMessage.trim()}
              style={styles.continueButton}
            />
          )}
          
          {step === 'confirm' && (
            <Button
              title={isSubmitting ? "Declining..." : "Decline Request"}
              onPress={handleSubmit}
              loading={isSubmitting}
              style={styles.declineButton}
              textStyle={styles.declineButtonText}
            />
          )}
        </View>
      </LinearGradient>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: designTokens.spacing.scale.md,
    paddingTop: designTokens.spacing.scale.xl,
    paddingBottom: designTokens.spacing.scale.md,
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
  stepIndicator: {
    flexDirection: 'row',
    gap: designTokens.spacing.scale.xs,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: designTokens.colors.semantic.surface + '60',
  },
  stepDotActive: {
    backgroundColor: designTokens.colors.semantic.surface,
  },
  content: {
    flex: 1,
    paddingHorizontal: designTokens.spacing.scale.md,
  },
  header: {
    marginBottom: designTokens.spacing.scale.lg,
  },
  title: {
    color: designTokens.colors.semantic.surface,
    marginBottom: designTokens.spacing.scale.xs,
    textAlign: 'center',
  },
  subtitle: {
    color: designTokens.colors.semantic.surface + 'CC',
    textAlign: 'center',
  },
  requestSummary: {
    marginBottom: designTokens.spacing.scale.md,
    backgroundColor: designTokens.colors.semantic.surface + '20',
  },
  summaryText: {
    color: designTokens.colors.semantic.surface,
    marginBottom: designTokens.spacing.scale.xs,
  },
  customerName: {
    fontWeight: '600',
  },
  summaryDetails: {
    color: designTokens.colors.semantic.surface + 'CC',
  },
  reasonsList: {
    flex: 1,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: designTokens.colors.semantic.surface,
    padding: designTokens.spacing.scale.md,
    borderRadius: componentTokens.card.borderRadius,
    marginBottom: designTokens.spacing.scale.sm,
    ...componentTokens.card.shadow,
  },
  reasonIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: designTokens.colors.semantic.surface + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: designTokens.spacing.scale.md,
  },
  reasonContent: {
    flex: 1,
  },
  reasonTitle: {
    marginBottom: designTokens.spacing.scale.xs,
  },
  reasonDescription: {
    color: designTokens.colors.semantic.textSecondary,
  },
  reasonArrow: {
    marginLeft: designTokens.spacing.scale.sm,
  },
  arrowText: {
    fontSize: 24,
    color: designTokens.colors.semantic.textSecondary,
  },
  selectedReasonBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: designTokens.colors.semantic.surface + '20',
    padding: designTokens.spacing.scale.md,
    borderRadius: componentTokens.card.borderRadius,
    marginBottom: designTokens.spacing.scale.lg,
  },
  bannerContent: {
    marginLeft: designTokens.spacing.scale.md,
    flex: 1,
  },
  bannerTitle: {
    color: designTokens.colors.semantic.surface,
    fontWeight: '600',
    marginBottom: designTokens.spacing.scale.xs,
  },
  bannerDescription: {
    color: designTokens.colors.semantic.surface + 'CC',
  },
  messageSection: {
    marginBottom: designTokens.spacing.scale.lg,
  },
  messageLabel: {
    color: designTokens.colors.semantic.surface,
    marginBottom: designTokens.spacing.scale.sm,
    fontWeight: '500',
  },
  messageInput: {
    backgroundColor: designTokens.colors.semantic.surface,
    borderRadius: componentTokens.card.borderRadius,
    padding: designTokens.spacing.scale.md,
    fontSize: 16,
    color: designTokens.colors.semantic.text,
    minHeight: 120,
    marginBottom: designTokens.spacing.scale.xs,
    ...componentTokens.card.shadow,
  },
  characterCount: {
    color: designTokens.colors.semantic.surface + 'CC',
    textAlign: 'right',
  },
  messagePreview: {
    marginBottom: designTokens.spacing.scale.md,
  },
  previewLabel: {
    color: designTokens.colors.semantic.surface + 'CC',
    marginBottom: designTokens.spacing.scale.sm,
  },
  previewBox: {
    backgroundColor: designTokens.colors.semantic.surface + '20',
    padding: designTokens.spacing.scale.md,
    borderRadius: componentTokens.card.borderRadius,
  },
  previewText: {
    color: designTokens.colors.semantic.surface,
    fontStyle: 'italic',
  },
  confirmationCard: {
    backgroundColor: designTokens.colors.semantic.surface,
    borderRadius: componentTokens.card.borderRadius,
    padding: designTokens.spacing.scale.md,
    marginBottom: designTokens.spacing.scale.lg,
    ...componentTokens.card.shadow,
  },
  confirmHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: designTokens.spacing.scale.md,
  },
  confirmContent: {
    marginLeft: designTokens.spacing.scale.md,
    flex: 1,
  },
  confirmTitle: {
    marginBottom: designTokens.spacing.scale.xs,
  },
  confirmSubtitle: {
    color: designTokens.colors.semantic.textSecondary,
  },
  finalMessage: {
    fontStyle: 'italic',
    backgroundColor: designTokens.colors.semantic.surface + '80',
    padding: designTokens.spacing.scale.sm,
    borderRadius: componentTokens.card.borderRadius,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: designTokens.colors.semantic.warning + '20',
    padding: designTokens.spacing.scale.sm,
    borderRadius: componentTokens.card.borderRadius,
  },
  warningText: {
    marginLeft: designTokens.spacing.scale.sm,
    color: designTokens.colors.semantic.warning,
    flex: 1,
  },
  footer: {
    paddingHorizontal: designTokens.spacing.scale.md,
    paddingBottom: designTokens.spacing.scale.xl,
  },
  continueButton: {
    backgroundColor: designTokens.colors.semantic.surface,
  },
  declineButton: {
    backgroundColor: designTokens.colors.semantic.error,
  },
  declineButtonText: {
    color: designTokens.colors.semantic.surface,
  },
});
