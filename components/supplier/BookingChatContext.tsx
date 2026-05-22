import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {
  MessageSquare,
  Calendar,
  MapPin,
  Clock,
  Users,
  Star,
  Phone,
  Navigation,
  AlertTriangle,
  CheckCircle,
  X,
  Send,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProfileImage } from '@/components/ui/ProfileImage';
import { Heading, Subheading, Body, Caption } from '@/components/ui/Typography';
import { BookingMessageTemplates } from './BookingMessageTemplates';
import { designTokens, componentTokens } from '@/constants/design-tokens';
import { BookingRequest } from '@/types/supplier-request';

interface BookingChatContextProps {
  request: BookingRequest;
  onSendMessage: (message: string) => void;
  onCall?: (phone: string) => void;
  onNavigate?: (location: string) => void;
  onViewBookingDetails?: () => void;
}

interface QuickResponse {
  id: string;
  text: string;
  icon: React.ReactNode;
  category: 'confirmation' | 'logistics' | 'timing' | 'general';
}

const QUICK_RESPONSES: QuickResponse[] = [
  {
    id: 'confirm_meeting',
    text: 'Perfect! I\'ll see you at the meeting point.',
    icon: <CheckCircle size={16} color="#4CAF50" />,
    category: 'confirmation',
  },
  {
    id: 'running_late',
    text: 'I\'m running about 10 minutes late. Sorry for the delay!',
    icon: <Clock size={16} color="#FF9800" />,
    category: 'timing',
  },
  {
    id: 'location_help',
    text: 'I\'m at the meeting point. Look for someone in a blue shirt!',
    icon: <MapPin size={16} color="#2196F3" />,
    category: 'logistics',
  },
  {
    id: 'weather_update',
    text: 'The weather looks great for our tour today!',
    icon: <Star size={16} color="#FFC107" />,
    category: 'general',
  },
  {
    id: 'contact_info',
    text: 'Here\'s my phone number if you need to reach me: +66 XX XXX XXXX',
    icon: <Phone size={16} color="#9C27B0" />,
    category: 'logistics',
  },
  {
    id: 'thank_you',
    text: 'Thank you for booking with me! Looking forward to our tour.',
    icon: <MessageSquare size={16} color="#E91E63" />,
    category: 'general',
  },
];

export const BookingChatContext: React.FC<BookingChatContextProps> = ({
  request,
  onSendMessage,
  onCall,
  onNavigate,
  onViewBookingDetails,
}) => {
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

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

  const getStatusColor = (status: BookingRequest['status']) => {
    switch (status) {
      case 'pending':
        return designTokens.colors.semantic.warning;
      case 'accepted':
        return designTokens.colors.semantic.success;
      case 'declined':
        return designTokens.colors.semantic.error;
      default:
        return designTokens.colors.semantic.textSecondary;
    }
  };

  const getStatusText = (status: BookingRequest['status']) => {
    switch (status) {
      case 'pending':
        return 'Pending Response';
      case 'accepted':
        return 'Confirmed';
      case 'declined':
        return 'Declined';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const filteredQuickResponses = selectedCategory === 'all' 
    ? QUICK_RESPONSES 
    : QUICK_RESPONSES.filter(response => response.category === selectedCategory);

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'confirmation', label: 'Confirm' },
    { id: 'logistics', label: 'Location' },
    { id: 'timing', label: 'Timing' },
    { id: 'general', label: 'General' },
  ];

  return (
    <View style={styles.container}>
      {/* Booking Context Header */}
      <Card style={styles.bookingHeader} padding={16}>
        <View style={styles.headerContent}>
          <View style={styles.customerSection}>
            <ProfileImage
              uri={request.customerImage}
              size="medium"
              style={styles.customerImage}
            />
            <View style={styles.customerInfo}>
              <Subheading style={styles.customerName}>{request.customerName}</Subheading>
              <View style={styles.statusRow}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) + '20' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(request.status) }]}>
                    {getStatusText(request.status)}
                  </Text>
                </View>
                {request.isRepeatCustomer && (
                  <Caption style={styles.repeatBadge}>Repeat Customer</Caption>
                )}
              </View>
            </View>
          </View>

          <View style={styles.actionButtons}>
            {request.customerPhone && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => onCall?.(request.customerPhone!)}
              >
                <Phone size={18} color={designTokens.colors.semantic.primary} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onNavigate?.(request.meetingPoint)}
            >
              <Navigation size={18} color={designTokens.colors.semantic.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Booking Details */}
        <View style={styles.bookingDetails}>
          <View style={styles.detailRow}>
            <Star size={14} color={designTokens.colors.semantic.primary} />
            <Body style={styles.detailText}>{request.serviceName}</Body>
          </View>
          
          <View style={styles.detailRow}>
            <Calendar size={14} color={designTokens.colors.semantic.primary} />
            <Body style={styles.detailText}>
              {formatDate(request.requestedDate)} at {formatTime(request.requestedTime)}
            </Body>
          </View>
          
          <View style={styles.detailRow}>
            <MapPin size={14} color={designTokens.colors.semantic.primary} />
            <Body style={styles.detailText} numberOfLines={1}>
              {request.meetingPoint}
            </Body>
          </View>
          
          <View style={styles.detailRow}>
            <Users size={14} color={designTokens.colors.semantic.primary} />
            <Body style={styles.detailText}>
              {request.groupSize} {request.groupSize === 1 ? 'person' : 'people'} • {request.duration}h
            </Body>
          </View>
        </View>

        {/* Special Requests */}
        {request.specialRequests && (
          <View style={styles.specialRequests}>
            <Caption style={styles.requestsLabel}>Special Requests:</Caption>
            <Body style={styles.requestsText} numberOfLines={2}>
              "{request.specialRequests}"
            </Body>
          </View>
        )}

        {/* View Details Button */}
        <TouchableOpacity
          style={styles.viewDetailsButton}
          onPress={onViewBookingDetails}
        >
          <Body style={styles.viewDetailsText}>View Full Booking Details</Body>
          <Text style={styles.viewDetailsArrow}>›</Text>
        </TouchableOpacity>
      </Card>

      {/* Communication Tools */}
      <Card style={styles.communicationTools} padding={16}>
        <View style={styles.toolsHeader}>
          <Subheading style={styles.toolsTitle}>Quick Communication</Subheading>
        </View>

        {/* Message Templates Button */}
        <Button
          title="Message Templates"
          onPress={() => setShowTemplates(true)}
          variant="outline"
          style={styles.templatesButton}
          icon={<MessageSquare size={16} color={designTokens.colors.semantic.primary} />}
        />

        {/* Quick Response Categories */}
        <View style={styles.categoriesSection}>
          <Caption style={styles.categoriesLabel}>Quick Responses:</Caption>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesScroll}
            contentContainerStyle={styles.categoriesContent}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryChip,
                  selectedCategory === category.id && styles.categoryChipActive
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <Text style={[
                  styles.categoryChipText,
                  selectedCategory === category.id && styles.categoryChipTextActive
                ]}>
                  {category.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Quick Responses */}
        <ScrollView 
          style={styles.quickResponsesList}
          showsVerticalScrollIndicator={false}
        >
          {filteredQuickResponses.map((response) => (
            <TouchableOpacity
              key={response.id}
              style={styles.quickResponseItem}
              onPress={() => onSendMessage(response.text)}
            >
              <View style={styles.responseIcon}>
                {response.icon}
              </View>
              <Body style={styles.responseText} numberOfLines={2}>
                {response.text}
              </Body>
              <Send size={14} color={designTokens.colors.semantic.primary} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Card>

      {/* Message Templates Modal */}
      <BookingMessageTemplates
        visible={showTemplates}
        onClose={() => setShowTemplates(false)}
        onSendMessage={onSendMessage}
        request={request}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: designTokens.spacing.scale.md,
  },
  bookingHeader: {
    marginBottom: 0,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: designTokens.spacing.scale.md,
  },
  customerSection: {
    flexDirection: 'row',
    flex: 1,
  },
  customerImage: {
    marginRight: designTokens.spacing.scale.sm,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    marginBottom: designTokens.spacing.scale.xs,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.scale.sm,
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
  repeatBadge: {
    color: designTokens.colors.semantic.accent,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: designTokens.spacing.scale.xs,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: designTokens.colors.semantic.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...componentTokens.card.shadow,
  },
  bookingDetails: {
    gap: designTokens.spacing.scale.sm,
    marginBottom: designTokens.spacing.scale.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    marginLeft: designTokens.spacing.scale.sm,
    flex: 1,
  },
  specialRequests: {
    backgroundColor: designTokens.colors.semantic.surface + '80',
    padding: designTokens.spacing.scale.sm,
    borderRadius: componentTokens.card.borderRadius,
    marginBottom: designTokens.spacing.scale.md,
  },
  requestsLabel: {
    color: designTokens.colors.semantic.textSecondary,
    marginBottom: designTokens.spacing.scale.xs,
    fontWeight: '500',
  },
  requestsText: {
    fontStyle: 'italic',
    color: designTokens.colors.semantic.textSecondary,
  },
  viewDetailsButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: designTokens.spacing.scale.sm,
    borderTopWidth: 1,
    borderTopColor: designTokens.colors.semantic.border,
  },
  viewDetailsText: {
    color: designTokens.colors.semantic.primary,
    fontWeight: '500',
  },
  viewDetailsArrow: {
    fontSize: 18,
    color: designTokens.colors.semantic.primary,
  },
  communicationTools: {
    marginBottom: 0,
  },
  toolsHeader: {
    marginBottom: designTokens.spacing.scale.md,
  },
  toolsTitle: {
    marginBottom: designTokens.spacing.scale.xs,
  },
  templatesButton: {
    marginBottom: designTokens.spacing.scale.md,
  },
  categoriesSection: {
    marginBottom: designTokens.spacing.scale.md,
  },
  categoriesLabel: {
    color: designTokens.colors.semantic.textSecondary,
    marginBottom: designTokens.spacing.scale.sm,
    fontWeight: '500',
  },
  categoriesScroll: {
    marginBottom: designTokens.spacing.scale.sm,
  },
  categoriesContent: {
    paddingRight: designTokens.spacing.scale.md,
  },
  categoryChip: {
    backgroundColor: designTokens.colors.semantic.surface,
    paddingHorizontal: designTokens.spacing.scale.md,
    paddingVertical: designTokens.spacing.scale.sm,
    borderRadius: 16,
    marginRight: designTokens.spacing.scale.sm,
    ...componentTokens.card.shadow,
  },
  categoryChipActive: {
    backgroundColor: designTokens.colors.semantic.primary,
  },
  categoryChipText: {
    color: designTokens.colors.semantic.text,
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: designTokens.colors.semantic.surface,
  },
  quickResponsesList: {
    maxHeight: 200,
  },
  quickResponseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: designTokens.colors.semantic.surface + '80',
    padding: designTokens.spacing.scale.sm,
    borderRadius: componentTokens.card.borderRadius,
    marginBottom: designTokens.spacing.scale.sm,
  },
  responseIcon: {
    marginRight: designTokens.spacing.scale.sm,
  },
  responseText: {
    flex: 1,
    marginRight: designTokens.spacing.scale.sm,
  },
});
