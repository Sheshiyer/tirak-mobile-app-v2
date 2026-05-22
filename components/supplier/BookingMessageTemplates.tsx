import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
} from 'react-native';
import {
  MessageSquare,
  Clock,
  MapPin,
  Calendar,
  Star,
  AlertTriangle,
  Send,
  X,
  CheckCircle,
  Info,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Heading, Subheading, Body, Caption } from '@/components/ui/Typography';
import { designTokens, componentTokens } from '@/constants/design-tokens';
import { BookingRequest } from '@/types/supplier-request';

interface MessageTemplate {
  id: string;
  category: string;
  title: string;
  description: string;
  template: string;
  icon: React.ReactNode;
  variables: string[];
}

interface BookingMessageTemplatesProps {
  visible: boolean;
  onClose: () => void;
  onSendMessage: (message: string) => void;
  request: BookingRequest;
}

const MESSAGE_TEMPLATES: MessageTemplate[] = [
  {
    id: 'booking_confirmation',
    category: 'confirmation',
    title: 'Booking Confirmation',
    description: 'Confirm booking details with customer',
    template: 'Hi {customerName}! I\'m excited to confirm your {serviceName} booking for {date} at {time}. I\'ll meet you at {meetingPoint}. Looking forward to showing you around!',
    icon: <CheckCircle size={20} color="#4CAF50" />,
    variables: ['customerName', 'serviceName', 'date', 'time', 'meetingPoint'],
  },
  {
    id: 'pre_booking_info',
    category: 'information',
    title: 'Pre-Booking Information',
    description: 'Share important details before the booking',
    template: 'Hello {customerName}! Just a few quick details for our {serviceName} tomorrow: Please bring comfortable walking shoes and a water bottle. The weather looks great! Any questions before we meet?',
    icon: <Info size={20} color="#2196F3" />,
    variables: ['customerName', 'serviceName'],
  },
  {
    id: 'meeting_reminder',
    category: 'reminder',
    title: 'Meeting Reminder',
    description: 'Remind customer about upcoming booking',
    template: 'Hi {customerName}! This is a friendly reminder about our {serviceName} tomorrow at {time}. I\'ll be at {meetingPoint} wearing a blue shirt. See you soon!',
    icon: <Clock size={20} color="#FF9800" />,
    variables: ['customerName', 'serviceName', 'time', 'meetingPoint'],
  },
  {
    id: 'location_details',
    category: 'logistics',
    title: 'Location Details',
    description: 'Provide detailed meeting location info',
    template: 'Hi {customerName}! For our meeting at {meetingPoint}, look for the main entrance near the {landmark}. I\'ll be there 10 minutes early. My phone number is {phone} if you need to reach me.',
    icon: <MapPin size={20} color="#9C27B0" />,
    variables: ['customerName', 'meetingPoint', 'landmark', 'phone'],
  },
  {
    id: 'weather_update',
    category: 'update',
    title: 'Weather Update',
    description: 'Share weather-related recommendations',
    template: 'Hello {customerName}! The weather forecast shows {weather} for our {serviceName}. I recommend bringing {recommendation}. We can adjust our itinerary if needed!',
    icon: <AlertTriangle size={20} color="#FF5722" />,
    variables: ['customerName', 'weather', 'serviceName', 'recommendation'],
  },
  {
    id: 'special_requests',
    category: 'customization',
    title: 'Special Requests Follow-up',
    description: 'Address customer\'s special requests',
    template: 'Hi {customerName}! I\'ve noted your special requests for {specialRequests}. I\'ve made arrangements to accommodate this during our {serviceName}. You\'re going to love it!',
    icon: <Star size={20} color="#FFC107" />,
    variables: ['customerName', 'specialRequests', 'serviceName'],
  },
  {
    id: 'thank_you',
    category: 'follow_up',
    title: 'Thank You Message',
    description: 'Post-booking thank you and feedback request',
    template: 'Thank you for choosing me for your {serviceName}, {customerName}! I hope you had an amazing experience. I\'d be grateful if you could leave a review. Hope to see you again soon!',
    icon: <MessageSquare size={20} color="#E91E63" />,
    variables: ['customerName', 'serviceName'],
  },
];

export const BookingMessageTemplates: React.FC<BookingMessageTemplatesProps> = ({
  visible,
  onClose,
  onSendMessage,
  request,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [customMessage, setCustomMessage] = useState('');
  const [step, setStep] = useState<'select' | 'customize' | 'preview'>('select');

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
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

  const replaceVariables = (template: string): string => {
    const variables: { [key: string]: string } = {
      customerName: request.customerName,
      serviceName: request.serviceName,
      date: formatDate(request.requestedDate),
      time: formatTime(request.requestedTime),
      meetingPoint: request.meetingPoint,
      specialRequests: request.specialRequests || 'your preferences',
      phone: '+66 XX XXX XXXX', // Placeholder
      landmark: 'main entrance', // Placeholder
      weather: 'sunny skies', // Placeholder
      recommendation: 'sunscreen and a hat', // Placeholder
    };

    let result = template;
    Object.entries(variables).forEach(([key, value]) => {
      result = result.replace(new RegExp(`{${key}}`, 'g'), value);
    });
    return result;
  };

  const handleTemplateSelect = (template: MessageTemplate) => {
    setSelectedTemplate(template);
    setCustomMessage(replaceVariables(template.template));
    setStep('customize');
  };

  const handleSend = () => {
    onSendMessage(customMessage);
    onClose();
    // Reset state
    setSelectedTemplate(null);
    setCustomMessage('');
    setStep('select');
  };

  const handleBack = () => {
    if (step === 'customize') {
      setStep('select');
      setSelectedTemplate(null);
      setCustomMessage('');
    } else {
      onClose();
    }
  };

  const renderTemplateSelection = () => (
    <View style={styles.content}>
      <View style={styles.header}>
        <Heading style={styles.title}>Quick Message Templates</Heading>
        <Caption style={styles.subtitle}>
          Choose a template to send to {request.customerName}
        </Caption>
      </View>

      {/* Booking Summary */}
      <Card style={styles.bookingSummary} padding={12}>
        <Body style={styles.summaryText}>
          {request.serviceName} • {formatDate(request.requestedDate)} at {formatTime(request.requestedTime)}
        </Body>
        <Caption style={styles.summaryLocation}>
          Meeting at {request.meetingPoint}
        </Caption>
      </Card>

      <ScrollView style={styles.templatesList} showsVerticalScrollIndicator={false}>
        {MESSAGE_TEMPLATES.map((template) => (
          <TouchableOpacity
            key={template.id}
            style={styles.templateItem}
            onPress={() => handleTemplateSelect(template)}
          >
            <View style={styles.templateIcon}>
              {template.icon}
            </View>
            <View style={styles.templateContent}>
              <Subheading style={styles.templateTitle}>{template.title}</Subheading>
              <Body style={styles.templateDescription}>{template.description}</Body>
              <Caption style={styles.templatePreview} numberOfLines={2}>
                {replaceVariables(template.template)}
              </Caption>
            </View>
            <View style={styles.templateArrow}>
              <Text style={styles.arrowText}>›</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderCustomizeStep = () => (
    <View style={styles.content}>
      <View style={styles.header}>
        <Heading style={styles.title}>Customize Message</Heading>
        <Caption style={styles.subtitle}>
          Edit your message before sending to {request.customerName}
        </Caption>
      </View>

      <View style={styles.selectedTemplateBanner}>
        <View style={styles.templateIcon}>
          {selectedTemplate?.icon}
        </View>
        <View style={styles.bannerContent}>
          <Body style={styles.bannerTitle}>{selectedTemplate?.title}</Body>
          <Caption style={styles.bannerDescription}>{selectedTemplate?.description}</Caption>
        </View>
      </View>

      <View style={styles.messageSection}>
        <Body style={styles.messageLabel}>Your Message:</Body>
        <TextInput
          style={styles.messageInput}
          value={customMessage}
          onChangeText={setCustomMessage}
          multiline
          numberOfLines={6}
          placeholder="Type your message..."
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
          <Body style={styles.previewText}>{customMessage}</Body>
        </View>
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
          </View>
        </View>

        {/* Content */}
        {step === 'select' && renderTemplateSelection()}
        {step === 'customize' && renderCustomizeStep()}

        {/* Footer */}
        {step === 'customize' && (
          <View style={styles.footer}>
            <Button
              title="Send Message"
              onPress={handleSend}
              disabled={!customMessage.trim()}
              style={styles.sendButton}
              icon={<Send size={16} color={designTokens.colors.semantic.surface} />}
            />
          </View>
        )}
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
  bookingSummary: {
    marginBottom: designTokens.spacing.scale.md,
    backgroundColor: designTokens.colors.semantic.surface + '20',
  },
  summaryText: {
    color: designTokens.colors.semantic.surface,
    fontWeight: '600',
    marginBottom: designTokens.spacing.scale.xs,
  },
  summaryLocation: {
    color: designTokens.colors.semantic.surface + 'CC',
  },
  templatesList: {
    flex: 1,
  },
  templateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: designTokens.colors.semantic.surface,
    padding: designTokens.spacing.scale.md,
    borderRadius: componentTokens.card.borderRadius,
    marginBottom: designTokens.spacing.scale.sm,
    ...componentTokens.card.shadow,
  },
  templateIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: designTokens.colors.semantic.surface + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: designTokens.spacing.scale.md,
  },
  templateContent: {
    flex: 1,
  },
  templateTitle: {
    marginBottom: designTokens.spacing.scale.xs,
  },
  templateDescription: {
    color: designTokens.colors.semantic.textSecondary,
    marginBottom: designTokens.spacing.scale.xs,
  },
  templatePreview: {
    color: designTokens.colors.semantic.textSecondary,
    fontStyle: 'italic',
    backgroundColor: designTokens.colors.semantic.surface + '80',
    padding: designTokens.spacing.scale.xs,
    borderRadius: 4,
  },
  templateArrow: {
    marginLeft: designTokens.spacing.scale.sm,
  },
  arrowText: {
    fontSize: 24,
    color: designTokens.colors.semantic.textSecondary,
  },
  selectedTemplateBanner: {
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
  },
  footer: {
    paddingHorizontal: designTokens.spacing.scale.md,
    paddingBottom: designTokens.spacing.scale.xl,
  },
  sendButton: {
    backgroundColor: designTokens.colors.semantic.success,
  },
});
