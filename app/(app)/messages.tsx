import { logger } from '@/utils/logger';
import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, TextInput, Animated } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/auth-store';
import { getRooms, formatRelativeTime, type ChatRoom } from '@/utils/chat-api';
import { Card } from '@/components/ui/Card';
import { ProfileImage } from '@/components/ui/ProfileImage';
import { RadialGradient } from '@/components/ui/RadialGradient';
import { Heading, Body, Caption } from '@/components/ui/Typography';
import { designTokens, componentTokens } from '@/constants/design-tokens';
import { Search } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
// TypeScript interfaces for type safety and component architecture
interface ConversationParticipant {
  id: string;
  name: string;
  image: string;
  role: 'customer' | 'companion';
  online: boolean;
  lastSeen?: string;
}

interface Conversation {
  id: string;
  companionName: string;
  companionImage: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  online: boolean;
  isTyping: boolean;
  participants?: ConversationParticipant[];
  bookingId?: string;
}

interface ConversationItemProps {
  conversation: Conversation;
  onPress?: () => void;
}

interface TypingIndicatorProps {
  visible: boolean;
}

interface SearchHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

// Mock data shown only when API returns no conversations
const mockConversations: Conversation[] = [];
const MESSAGE_PREVIEW_LIMIT = 30;

const toTitleCase = (value: string): string => {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
};

const formatFirstName = (name?: string | null): string => {
  const normalized = (name || '').trim();
  if (!normalized) return 'Traveler';

  const withoutEmailDomain = normalized.split('@')[0];
  const firstToken = withoutEmailDomain
    .split(/[\s._-]+/)
    .find(Boolean);

  return toTitleCase(firstToken || normalized);
};

const truncatePreview = (message: string): string => {
  const normalized = message.replace(/\s+/g, ' ').trim();
  if (normalized.length <= MESSAGE_PREVIEW_LIMIT) return normalized;
  return `${normalized.slice(0, MESSAGE_PREVIEW_LIMIT - 3).trimEnd()}...`;
};

const formatLastMessagePreview = (room: ChatRoom): string => {
  const content = room.lastMessage?.content?.trim();
  if (!content) return 'No messages yet';

  const senderName = (room.lastMessage as any)?.senderName;
  const senderId = (room.lastMessage as any)?.senderId;
  const isOwn =
    Boolean((room.lastMessage as any)?.isOwn) ||
    senderName === 'You' ||
    senderId === 'user_current';

  return truncatePreview(`${isOwn ? 'You: ' : ''}${content}`);
};

// Component: Typing Indicator with organic motion
const TypingIndicator: React.FC<TypingIndicatorProps> = ({ visible }) => {
  const { t } = useTranslation();
    if (!visible) return null;

  return (
    <View style={styles.typingIndicator}>
      <View style={styles.typingDots}>
        <View style={[styles.typingDot, styles.typingDot1]} />
        <View style={[styles.typingDot, styles.typingDot2]} />
        <View style={[styles.typingDot, styles.typingDot3]} />
      </View>
      <Caption style={styles.typingText}>{t('chat.typing')}</Caption>
    </View>
  );
};

// Component: Conversation Item with design token integration
const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  onPress,
}) => {
  const { t } = useTranslation();
  return (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Conversation with ${conversation.companionName}`}
      accessibilityHint={t('chat.tapToOpenChat')}
    >
      <Card style={styles.conversationCard}>
        <View style={styles.conversationContent}>
          <View style={styles.avatarContainer}>
            <ProfileImage
              uri={conversation.companionImage}
              size="medium"
              online={conversation.online}
            />
            {conversation.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Caption style={styles.unreadCount}>
                  {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                </Caption>
              </View>
            )}
          </View>

          <View style={styles.messageContent}>
            <View style={styles.messageHeader}>
              <Body style={styles.companionName} numberOfLines={1}>
                {conversation.companionName}
              </Body>
              <Caption style={styles.timestamp}>{conversation.timestamp}</Caption>
            </View>

            <View style={styles.messagePreview}>
              {conversation.isTyping ? (
                <TypingIndicator visible={conversation.isTyping} />
              ) : (
                <Caption
                  style={[
                    styles.lastMessage,
                    conversation.unreadCount > 0 && styles.unreadMessage
                  ]}
                  numberOfLines={1}
                >
                  {conversation.lastMessage}
                </Caption>
              )}
            </View>
          </View>

        </View>
      </Card>
    </TouchableOpacity>
  );
};

// Component: Search Header with design tokens
const SearchHeader: React.FC<SearchHeaderProps> = ({ searchQuery, onSearchChange }) => {
  const { t } = useTranslation();
  return (
  <View style={styles.header}>
    <Heading style={styles.headerTitle}>{t('chat.messages')}</Heading>

    <Card style={styles.searchCard}>
      <View style={styles.searchContainer}>
        <Search size={20} color={designTokens.colors.semantic.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('chat.searchConversations')}
          placeholderTextColor={designTokens.colors.semantic.textSecondary}
          value={searchQuery}
          onChangeText={onSearchChange}
          accessibilityLabel={t('chat.searchConversations')}
          accessibilityHint={t('chat.typeToSearchThroughConversations')}
        />
      </View>
    </Card>
  </View>
  );
};

// Component: Empty State with design tokens
const EmptyState: React.FC<{ searchQuery: string }> = ({ searchQuery }) => {
  const { t } = useTranslation();
  return (
  <Card style={styles.emptyState}>
    <Body style={styles.emptyStateTitle}>{t('chat.noConversationsFound')}</Body>
    <Caption style={styles.emptyStateText}>
      {searchQuery
        ? `${t('chat.noConversationsMatch')} "${searchQuery}"`
        : `${t('chat.startChattingWithCompanions')} ${t('chat.seeConversationsHere')}`
      }
    </Caption>
  </Card>
  );
};

export default function MessagesScreen() {
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations);
  const [searchQuery, setSearchQuery] = useState('');
  const { t } = useTranslation();

  const fetchRooms = useCallback(async () => {
    const rooms = await getRooms();
    if (rooms.length > 0) {
      setConversations(
        rooms.map((room: ChatRoom) => ({
          id: room.id,
          companionName: formatFirstName(room.otherParty.name),
          companionImage: room.otherParty.image ?? '',
          lastMessage: formatLastMessagePreview(room),
          timestamp: formatRelativeTime(room.lastMessage?.timestamp || room.lastActivity),
          unreadCount: 0,
          online: false,
          isTyping: false,
        }))
      );
    }
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const filteredConversations = conversations.filter(conversation =>
    conversation.companionName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <RadialGradient variant="appBackground" style={styles.container}>
      <SearchHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {filteredConversations.length > 0 ? (
          filteredConversations.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              onPress={() => {
                // Navigate to chat screen with companion ID
                // logger.log('Navigate to chat:', conversation.id);
                router.push(`/chat/${conversation.id}`);
              }}
            />
          ))
        ) : (
          <EmptyState searchQuery={searchQuery} />
        )}
      </ScrollView>
    </RadialGradient>
  );
}

// Styles using design tokens for consistency and maintainability
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: designTokens.spacing.scale.lg,
    paddingTop: designTokens.spacing.scale.lg,
    paddingBottom: designTokens.spacing.scale.md,
    gap: designTokens.spacing.scale.md,
  },
  headerTitle: {
    ...componentTokens.text.heading,
    color: designTokens.colors.semantic.text,
  },
  searchCard: {
    borderRadius: designTokens.borderRadius.components.input * 3, // More rounded for search
    overflow: 'hidden',
    ...designTokens.shadows.sm,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: designTokens.spacing.scale.md,
    paddingVertical: designTokens.spacing.components.button.paddingVertical,
    gap: designTokens.spacing.scale.sm,
  },
  searchInput: {
    flex: 1,
    ...designTokens.typography.styles.body,
    color: designTokens.colors.semantic.text,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: designTokens.spacing.scale.lg,
    paddingBottom: designTokens.spacing.scale.lg,
    gap: designTokens.spacing.components.list.itemSpacing,
  },
  conversationItem: {
    marginBottom: designTokens.spacing.scale.xs,
  },
  conversationCard: {
    ...componentTokens.card.default,
    padding: designTokens.spacing.scale.md,
    overflow: 'hidden',
  },
  conversationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.scale.sm,
  },
  avatarContainer: {
    position: 'relative',
  },
  unreadBadge: {
    position: 'absolute',
    top: -designTokens.spacing.scale.xs,
    right: -designTokens.spacing.scale.xs,
    backgroundColor: designTokens.colors.semantic.accent, // Coral accent for notifications
    borderRadius: designTokens.borderRadius.full,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: designTokens.colors.semantic.surface,
    ...designTokens.shadows.sm,
  },
  unreadCount: {
    ...designTokens.typography.styles.caption,
    color: designTokens.colors.components.button.text,
    fontSize: 11,
    fontWeight: '600',
  },
  messageContent: {
    flex: 1,
    gap: designTokens.spacing.scale.xs,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: designTokens.spacing.scale.sm,
  },
  companionName: {
    ...componentTokens.text.body,
    fontWeight: '600',
    color: designTokens.colors.semantic.text,
    flex: 1,
  },
  timestamp: {
    ...componentTokens.text.caption,
    color: designTokens.colors.semantic.textSecondary,
    flexShrink: 0,
  },
  messagePreview: {
    minHeight: 20,
    justifyContent: 'center',
  },
  lastMessage: {
    ...componentTokens.text.caption,
    color: designTokens.colors.semantic.textSecondary,
  },
  unreadMessage: {
    color: designTokens.colors.semantic.text,
    fontWeight: '500',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.scale.xs,
  },
  typingDots: {
    flexDirection: 'row',
    gap: 2,
  },
  typingDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: designTokens.colors.semantic.accent, // Coral accent for typing indicator
  },
  typingDot1: {
    opacity: 0.4,
  },
  typingDot2: {
    opacity: 0.7,
  },
  typingDot3: {
    opacity: 1,
  },
  typingText: {
    ...componentTokens.text.caption,
    color: designTokens.colors.semantic.accent,
    fontStyle: 'italic',
  },
  emptyState: {
    ...componentTokens.card.default,
    alignItems: 'center',
    marginTop: designTokens.spacing.scale['2xl'],
    padding: designTokens.spacing.scale['2xl'],
    gap: designTokens.spacing.scale.sm,
  },
  emptyStateTitle: {
    ...componentTokens.text.subheading,
    color: designTokens.colors.semantic.text,
    textAlign: 'center',
  },
  emptyStateText: {
    ...componentTokens.text.caption,
    color: designTokens.colors.semantic.textSecondary,
    textAlign: 'center',
    lineHeight: designTokens.typography.lineHeights.relaxed * designTokens.typography.sizes.caption,
  },
});
