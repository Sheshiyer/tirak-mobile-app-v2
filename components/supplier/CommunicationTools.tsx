import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  MessageSquare,
  Clock,
  MapPin,
  Send,
  Star,
  AlertTriangle,
} from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Subheading, Body, Caption } from '@/components/ui/Typography';
import { BookingMessageTemplates } from './BookingMessageTemplates';
import { designTokens, componentTokens } from '@/constants/design-tokens';
import { BookingRequest } from '@/types/supplier-request';

interface CommunicationToolsProps {
  request: BookingRequest;
  onSendMessage?: (message: string) => void;
  compact?: boolean;
}

interface CommunicationAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
  available: boolean;
  urgent?: boolean;
}

export const CommunicationTools: React.FC<CommunicationToolsProps> = ({
  request,
  onSendMessage,
  compact = false,
}) => {
  const [showTemplates, setShowTemplates] = useState(false);

  const handleMessage = () => {
    if (onSendMessage) {
      setShowTemplates(true);
    }
  };

  const handleSendReminder = () => {
    const reminderMessage = `Hi ${request.customerName}! This is a friendly reminder about our ${request.serviceName} tomorrow. I'll see you at ${request.meetingPoint} at ${request.requestedTime}. Looking forward to it!`;
    
    if (onSendMessage) {
      onSendMessage(reminderMessage);
      Alert.alert('Reminder Sent', 'Your reminder message has been sent to the customer.');
    }
  };

  const handleSendDirections = () => {
    const directionsMessage = `Hi ${request.customerName}! Here are directions to our meeting point: ${request.meetingPoint}. I'll be there 10 minutes early and you can message me here if you need anything.`;
    
    if (onSendMessage) {
      onSendMessage(directionsMessage);
      Alert.alert('Directions Sent', 'Location details have been sent to the customer.');
    }
  };

  const isUpcoming = () => {
    const bookingDate = new Date(request.requestedDate);
    const now = new Date();
    const timeDiff = bookingDate.getTime() - now.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return daysDiff >= 0 && daysDiff <= 2; // Within next 2 days
  };

  const communicationActions: CommunicationAction[] = [
    {
      id: 'message',
      title: 'Send Message',
      description: 'Chat with customer using templates',
      icon: <MessageSquare size={20} color={designTokens.colors.semantic.primary} />,
      action: handleMessage,
      available: true,
    },
    {
      id: 'reminder',
      title: 'Send Reminder',
      description: 'Remind about upcoming booking',
      icon: <Clock size={20} color={designTokens.colors.semantic.warning} />,
      action: handleSendReminder,
      available: isUpcoming() && request.status === 'accepted',
      urgent: isUpcoming(),
    },
    {
      id: 'directions',
      title: 'Send Directions',
      description: 'Share meeting location details',
      icon: <MapPin size={20} color={designTokens.colors.semantic.info} />,
      action: handleSendDirections,
      available: request.status === 'accepted',
    },
  ];

  const availableActions = communicationActions.filter(action => action.available);

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View style={styles.compactActions}>
          <TouchableOpacity
            style={styles.compactActionButton}
            onPress={handleMessage}
          >
            <MessageSquare size={18} color={designTokens.colors.semantic.primary} />
            <Caption style={styles.compactActionText}>Message</Caption>
          </TouchableOpacity>

          {isUpcoming() && request.status === 'accepted' && (
            <TouchableOpacity
              style={[styles.compactActionButton, styles.urgentAction]}
              onPress={handleSendReminder}
            >
              <Clock size={18} color={designTokens.colors.semantic.warning} />
              <Caption style={[styles.compactActionText, styles.urgentActionText]}>
                Remind
              </Caption>
            </TouchableOpacity>
          )}
        </View>

        <BookingMessageTemplates
          visible={showTemplates}
          onClose={() => setShowTemplates(false)}
          onSendMessage={onSendMessage || (() => {})}
          request={request}
        />
      </View>
    );
  }

  return (
    <Card style={styles.container} padding={16}>
      <View style={styles.header}>
        <Subheading style={styles.title}>Communication Tools</Subheading>
        <Caption style={styles.subtitle}>
          Stay in touch with {request.customerName}
        </Caption>
      </View>

      {/* Quick Actions Grid */}
      <View style={styles.actionsGrid}>
        {availableActions.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={[
              styles.actionItem,
              action.urgent && styles.urgentActionItem
            ]}
            onPress={action.action}
          >
            <View style={[
              styles.actionIcon,
              action.urgent && styles.urgentActionIcon
            ]}>
              {action.icon}
              {action.urgent && (
                <View style={styles.urgentBadge}>
                  <AlertTriangle size={10} color={designTokens.colors.semantic.surface} />
                </View>
              )}
            </View>
            <View style={styles.actionContent}>
              <Body style={[
                styles.actionTitle,
                action.urgent && styles.urgentActionTitle
              ]}>
                {action.title}
              </Body>
              <Caption style={styles.actionDescription}>
                {action.description}
              </Caption>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Quick Message Templates Button */}
      <Button
        title="Message Templates"
        onPress={() => setShowTemplates(true)}
        variant="outline"
        style={styles.templatesButton}
        icon={<Send size={16} color={designTokens.colors.semantic.primary} />}
      />

      {/* Booking Status Info */}
      {request.status === 'accepted' && (
        <View style={styles.statusInfo}>
          <Star size={14} color={designTokens.colors.semantic.success} />
          <Caption style={styles.statusText}>
            Booking confirmed • Keep your customer updated
          </Caption>
        </View>
      )}

      {request.status === 'pending' && (
        <View style={styles.statusInfo}>
          <Clock size={14} color={designTokens.colors.semantic.warning} />
          <Caption style={styles.statusText}>
            Pending response • Message customer for questions
          </Caption>
        </View>
      )}

      <BookingMessageTemplates
        visible={showTemplates}
        onClose={() => setShowTemplates(false)}
        onSendMessage={onSendMessage || (() => {})}
        request={request}
      />
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: designTokens.spacing.scale.md,
  },
  header: {
    marginBottom: designTokens.spacing.scale.md,
  },
  title: {
    marginBottom: designTokens.spacing.scale.xs,
  },
  subtitle: {
    color: designTokens.colors.semantic.textSecondary,
  },
  actionsGrid: {
    gap: designTokens.spacing.scale.sm,
    marginBottom: designTokens.spacing.scale.md,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: designTokens.colors.semantic.surface + '80',
    padding: designTokens.spacing.scale.sm,
    borderRadius: componentTokens.card.borderRadius,
  },
  urgentActionItem: {
    backgroundColor: designTokens.colors.semantic.warning + '20',
    borderWidth: 1,
    borderColor: designTokens.colors.semantic.warning + '40',
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: designTokens.colors.semantic.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: designTokens.spacing.scale.md,
    ...componentTokens.card.shadow,
    position: 'relative',
  },
  urgentActionIcon: {
    backgroundColor: designTokens.colors.semantic.warning + '20',
  },
  urgentBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: designTokens.colors.semantic.warning,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    marginBottom: designTokens.spacing.scale.xs,
  },
  urgentActionTitle: {
    color: designTokens.colors.semantic.warning,
    fontWeight: '600',
  },
  actionDescription: {
    color: designTokens.colors.semantic.textSecondary,
  },
  templatesButton: {
    marginBottom: designTokens.spacing.scale.md,
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: designTokens.colors.semantic.surface + '60',
    padding: designTokens.spacing.scale.sm,
    borderRadius: componentTokens.card.borderRadius,
  },
  statusText: {
    marginLeft: designTokens.spacing.scale.sm,
    color: designTokens.colors.semantic.textSecondary,
    fontStyle: 'italic',
  },

  // Compact styles
  compactContainer: {
    marginVertical: designTokens.spacing.scale.sm,
  },
  compactActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: designTokens.spacing.scale.md,
  },
  compactActionButton: {
    alignItems: 'center',
    backgroundColor: designTokens.colors.semantic.surface,
    paddingVertical: designTokens.spacing.scale.sm,
    paddingHorizontal: designTokens.spacing.scale.md,
    borderRadius: componentTokens.card.borderRadius,
    ...componentTokens.card.shadow,
  },
  urgentAction: {
    backgroundColor: designTokens.colors.semantic.warning + '20',
    borderWidth: 1,
    borderColor: designTokens.colors.semantic.warning + '40',
  },
  compactActionText: {
    marginTop: designTokens.spacing.scale.xs,
    color: designTokens.colors.semantic.textSecondary,
    fontWeight: '500',
  },
  urgentActionText: {
    color: designTokens.colors.semantic.warning,
    fontWeight: '600',
  },
});
