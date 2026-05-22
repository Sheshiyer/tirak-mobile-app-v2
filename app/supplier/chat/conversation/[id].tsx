import { logger } from '@/utils/logger';
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Send,
  MoreVertical,
  Star,
  Calendar,
  MapPin,
  Clock,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react-native';
import { RadialGradient } from '@/components/ui/RadialGradient';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Heading, Subheading, Body, Caption } from '@/components/ui/Typography';
import { designTokens, componentTokens } from '@/constants/design-tokens';

interface Message {
  id: string;
  senderId: string;
  senderType: 'customer' | 'supplier';
  content: string;
  timestamp: string;
  type: 'text' | 'image' | 'booking' | 'system';
  status: 'sent' | 'delivered' | 'read';
  attachments?: {
    type: 'image' | 'document';
    url: string;
    name: string;
  }[];
  bookingData?: {
    serviceId: string;
    serviceName: string;
    date: string;
    time: string;
    guests: number;
    price: number;
    status: 'pending' | 'confirmed' | 'cancelled';
  };
}

interface ConversationData {
  id: string;
  customerId: string;
  customerName: string;
  customerAvatar: string;
  serviceInquiry?: string;
  bookingStatus?: string;
  customerRating?: number;
  messages: Message[];
}

export default function ConversationScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Mock conversation data
  const [conversation] = useState<ConversationData>({
    id: id as string,
    customerId: 'cust-001',
    customerName: 'Sarah Johnson',
    customerAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150',
    serviceInquiry: 'Bangkok Street Food Adventure',
    bookingStatus: 'inquiry',
    customerRating: 4.8,
    messages: [
      {
        id: 'msg-001',
        senderId: 'cust-001',
        senderType: 'customer',
        content: 'Hi! I\'m interested in the Bangkok Street Food tour for next weekend. Is it available?',
        timestamp: '10:30 AM',
        type: 'text',
        status: 'read',
      },
      {
        id: 'msg-002',
        senderId: 'supplier-001',
        senderType: 'supplier',
        content: 'Hello Sarah! Thank you for your interest. Yes, we have availability for next weekend. Which day would work better for you - Saturday or Sunday?',
        timestamp: '10:32 AM',
        type: 'text',
        status: 'read',
      },
      {
        id: 'msg-003',
        senderId: 'cust-001',
        senderType: 'customer',
        content: 'Saturday would be perfect! How many people can join the tour?',
        timestamp: '10:35 AM',
        type: 'text',
        status: 'read',
      },
      {
        id: 'msg-004',
        senderId: 'supplier-001',
        senderType: 'supplier',
        content: 'Great choice! Our tours can accommodate up to 8 people. How many will be in your group?',
        timestamp: '10:37 AM',
        type: 'text',
        status: 'read',
      },
      {
        id: 'msg-005',
        senderId: 'cust-001',
        senderType: 'customer',
        content: 'It will be 4 people - me and 3 friends. What\'s the total cost?',
        timestamp: '10:40 AM',
        type: 'text',
        status: 'read',
      },
      {
        id: 'msg-006',
        senderId: 'supplier-001',
        senderType: 'supplier',
        content: 'Perfect! For 4 people, the total would be ฿4,800 (฿1,200 per person). This includes all food tastings, drinks, and a local guide. Would you like me to send you a booking confirmation?',
        timestamp: '10:42 AM',
        type: 'text',
        status: 'delivered',
      },
      {
        id: 'msg-007',
        senderId: 'system',
        senderType: 'supplier',
        content: 'Booking request sent',
        timestamp: '10:43 AM',
        type: 'booking',
        status: 'sent',
        bookingData: {
          serviceId: 'svc-001',
          serviceName: 'Bangkok Street Food Adventure',
          date: '2024-12-28',
          time: '10:00 AM',
          guests: 4,
          price: 4800,
          status: 'pending',
        },
      },
    ],
  });

  const handleSendMessage = () => {
    if (messageText.trim()) {
      // In a real app, this would send the message to the API
      logger.log('Sending message:', messageText);
      setMessageText('');
      
      // Scroll to bottom after sending
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const handleBookingAction = (action: 'confirm' | 'modify' | 'decline', bookingId: string) => {
    Alert.alert(
      `${action.charAt(0).toUpperCase() + action.slice(1)} Booking`,
      `Are you sure you want to ${action} this booking?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: action.charAt(0).toUpperCase() + action.slice(1), onPress: () => {
          logger.log(`${action} booking:`, bookingId);
        }},
      ]
    );
  };

  const getMessageStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <CheckCircle size={12} color={designTokens.colors.semantic.textSecondary} />;
      case 'delivered': return <CheckCircle size={12} color={designTokens.colors.semantic.primary} />;
      case 'read': return <CheckCircle size={12} color={designTokens.colors.semantic.success} />;
      default: return null;
    }
  };

  const MessageBubble = ({ message }: { message: Message }) => {
    const isSupplier = message.senderType === 'supplier';
    
    if (message.type === 'booking' && message.bookingData) {
      return (
        <View style={[styles.messageContainer, styles.bookingMessageContainer]}>
          <Card style={styles.bookingCard} padding={16}>
            <View style={styles.bookingHeader}>
              <Calendar size={20} color={designTokens.colors.semantic.primary} />
              <Subheading style={styles.bookingTitle}>Booking Request</Subheading>
            </View>
            
            <View style={styles.bookingDetails}>
              <View style={styles.bookingDetail}>
                <Body style={styles.bookingDetailLabel}>Service:</Body>
                <Body style={styles.bookingDetailValue}>{message.bookingData.serviceName}</Body>
              </View>
              <View style={styles.bookingDetail}>
                <Body style={styles.bookingDetailLabel}>Date:</Body>
                <Body style={styles.bookingDetailValue}>
                  {new Date(message.bookingData.date).toLocaleDateString()}
                </Body>
              </View>
              <View style={styles.bookingDetail}>
                <Body style={styles.bookingDetailLabel}>Time:</Body>
                <Body style={styles.bookingDetailValue}>{message.bookingData.time}</Body>
              </View>
              <View style={styles.bookingDetail}>
                <Body style={styles.bookingDetailLabel}>Guests:</Body>
                <Body style={styles.bookingDetailValue}>{message.bookingData.guests} people</Body>
              </View>
              <View style={styles.bookingDetail}>
                <Body style={styles.bookingDetailLabel}>Total:</Body>
                <Body style={[styles.bookingDetailValue, styles.bookingPrice]}>
                  ฿{message.bookingData.price.toLocaleString()}
                </Body>
              </View>
            </View>

            {message.bookingData.status === 'pending' && (
              <View style={styles.bookingActions}>
                <Button
                  title="Decline"
                  onPress={() => handleBookingAction('decline', message.id)}
                  variant="outline"
                  style={styles.bookingActionButton}
                />
                <Button
                  title="Modify"
                  onPress={() => handleBookingAction('modify', message.id)}
                  variant="outline"
                  style={styles.bookingActionButton}
                />
                <Button
                  title="Confirm"
                  onPress={() => handleBookingAction('confirm', message.id)}
                  style={styles.bookingActionButton}
                />
              </View>
            )}
            
            <Caption style={styles.messageTimestamp}>{message.timestamp}</Caption>
          </Card>
        </View>
      );
    }

    return (
      <View style={[
        styles.messageContainer,
        isSupplier ? styles.supplierMessageContainer : styles.customerMessageContainer
      ]}>
        <View style={[
          styles.messageBubble,
          isSupplier ? styles.supplierBubble : styles.customerBubble
        ]}>
          <Body style={[
            styles.messageText,
            isSupplier ? styles.supplierMessageText : styles.customerMessageText
          ]}>
            {message.content}
          </Body>
          
          <View style={styles.messageFooter}>
            <Caption style={[
              styles.messageTimestamp,
              isSupplier ? styles.supplierTimestamp : styles.customerTimestamp
            ]}>
              {message.timestamp}
            </Caption>
            {isSupplier && getMessageStatusIcon(message.status)}
          </View>
        </View>
      </View>
    );
  };

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
          
          <View style={styles.customerInfo}>
            <View style={styles.customerAvatar}>
              <Text style={styles.customerAvatarText}>
                {conversation.customerName.split(' ').map(n => n[0]).join('')}
              </Text>
            </View>
            
            <View style={styles.customerDetails}>
              <View style={styles.customerNameRow}>
                <Subheading style={styles.customerName}>{conversation.customerName}</Subheading>
                {conversation.customerRating && (
                  <View style={styles.ratingContainer}>
                    <Star size={14} color="#FFD700" fill="#FFD700" />
                    <Caption style={styles.rating}>{conversation.customerRating}</Caption>
                  </View>
                )}
              </View>
              {conversation.serviceInquiry && (
                <Caption style={styles.serviceInquiry}>{conversation.serviceInquiry}</Caption>
              )}
            </View>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.actionButton}>
              <MoreVertical size={20} color={designTokens.colors.semantic.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {conversation.messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        
        {isTyping && (
          <View style={styles.typingIndicator}>
            <View style={styles.typingBubble}>
              <View style={styles.typingDots}>
                <View style={styles.typingDot} />
                <View style={styles.typingDot} />
                <View style={styles.typingDot} />
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Message Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputContainer}
      >
        <SafeAreaView edges={['bottom']} style={styles.inputSafeArea}>
          <View style={styles.inputRow}>
            <View style={styles.textInputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="Type a message..."
                value={messageText}
                onChangeText={setMessageText}
                multiline
                maxLength={1000}
                placeholderTextColor={designTokens.colors.semantic.textSecondary}
              />
            </View>
            
            <TouchableOpacity
              style={[
                styles.sendButton,
                messageText.trim() && styles.sendButtonActive
              ]}
              onPress={handleSendMessage}
              disabled={!messageText.trim()}
            >
              <Send size={20} color={
                messageText.trim() 
                  ? designTokens.colors.semantic.surface 
                  : designTokens.colors.semantic.textSecondary
              } />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </RadialGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: designTokens.colors.semantic.surface,
    borderBottomWidth: 1,
    borderBottomColor: designTokens.colors.semantic.border,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: designTokens.spacing.scale.md,
    paddingVertical: designTokens.spacing.scale.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: designTokens.colors.semantic.surface + '80',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: designTokens.spacing.scale.md,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  customerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: designTokens.colors.semantic.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: designTokens.spacing.scale.sm,
    position: 'relative',
  },
  customerAvatarText: {
    color: designTokens.colors.semantic.surface,
    fontWeight: '600',
    fontSize: 16,
  },
  customerDetails: {
    flex: 1,
  },
  customerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  customerName: {
    flex: 1,
    fontWeight: '600',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: designTokens.spacing.scale.sm,
  },
  rating: {
    marginLeft: designTokens.spacing.scale.xs,
    color: designTokens.colors.semantic.textSecondary,
    fontWeight: '500',
  },
  serviceInquiry: {
    color: designTokens.colors.semantic.primary,
    fontWeight: '500',
    fontSize: 12,
  },
  headerActions: {
    flexDirection: 'row',
    gap: designTokens.spacing.scale.xs,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: designTokens.colors.semantic.surface + '80',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: designTokens.spacing.scale.md,
    paddingBottom: designTokens.spacing.scale.lg,
  },
  messageContainer: {
    marginBottom: designTokens.spacing.scale.md,
  },
  customerMessageContainer: {
    alignItems: 'flex-start',
  },
  supplierMessageContainer: {
    alignItems: 'flex-end',
  },
  bookingMessageContainer: {
    alignItems: 'center',
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 20,
    paddingHorizontal: designTokens.spacing.scale.md,
    paddingVertical: designTokens.spacing.scale.sm,
  },
  customerBubble: {
    backgroundColor: designTokens.colors.semantic.surface,
    borderBottomLeftRadius: 4,
  },
  supplierBubble: {
    backgroundColor: designTokens.colors.semantic.primary,
    borderBottomRightRadius: 4,
  },
  messageText: {
    lineHeight: 20,
    marginBottom: designTokens.spacing.scale.xs,
  },
  customerMessageText: {
    color: designTokens.colors.semantic.text,
  },
  supplierMessageText: {
    color: designTokens.colors.semantic.surface,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  messageTimestamp: {
    fontSize: 11,
    marginRight: designTokens.spacing.scale.xs,
  },
  customerTimestamp: {
    color: designTokens.colors.semantic.textSecondary,
  },
  supplierTimestamp: {
    color: designTokens.colors.semantic.surface + 'CC',
  },
  bookingCard: {
    width: '90%',
    marginBottom: 0,
  },
  bookingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: designTokens.spacing.scale.md,
  },
  bookingTitle: {
    marginLeft: designTokens.spacing.scale.sm,
    color: designTokens.colors.semantic.primary,
  },
  bookingDetails: {
    marginBottom: designTokens.spacing.scale.md,
  },
  bookingDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: designTokens.spacing.scale.sm,
  },
  bookingDetailLabel: {
    color: designTokens.colors.semantic.textSecondary,
  },
  bookingDetailValue: {
    fontWeight: '500',
  },
  bookingPrice: {
    color: designTokens.colors.semantic.success,
    fontWeight: '600',
    fontSize: 16,
  },
  bookingActions: {
    flexDirection: 'row',
    gap: designTokens.spacing.scale.sm,
    marginBottom: designTokens.spacing.scale.md,
  },
  bookingActionButton: {
    flex: 1,
  },
  typingIndicator: {
    alignItems: 'flex-start',
    marginBottom: designTokens.spacing.scale.md,
  },
  typingBubble: {
    backgroundColor: designTokens.colors.semantic.surface,
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    paddingHorizontal: designTokens.spacing.scale.md,
    paddingVertical: designTokens.spacing.scale.sm,
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: designTokens.colors.semantic.textSecondary,
  },
  inputContainer: {
    backgroundColor: designTokens.colors.semantic.surface,
    borderTopWidth: 1,
    borderTopColor: designTokens.colors.semantic.border,
  },
  inputSafeArea: {
    paddingHorizontal: designTokens.spacing.scale.md,
    paddingVertical: designTokens.spacing.scale.sm,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: designTokens.spacing.scale.sm,
  },
  textInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: designTokens.colors.semantic.surface + '80',
    borderRadius: 20,
    paddingHorizontal: designTokens.spacing.scale.md,
    paddingVertical: designTokens.spacing.scale.sm,
    maxHeight: 100,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: designTokens.colors.semantic.text,
    maxHeight: 80,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: designTokens.colors.semantic.textSecondary + '40',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonActive: {
    backgroundColor: designTokens.colors.semantic.primary,
  },
});
