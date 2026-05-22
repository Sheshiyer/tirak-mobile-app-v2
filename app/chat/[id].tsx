import { logger } from '@/utils/logger';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useAuthStore } from '@/stores/auth-store';
import {
  getRoomDetail,
  sendMessage as sendChatMessage,
  createOrGetRoom,
  isUUID,
  getAuthToken,
  BACKEND_URL,
  type ChatMessage as BackendChatMessage,
  type OtherParty,
} from '@/utils/chat-api';
import { ProfileImage } from '@/components/ui/ProfileImage';
import { RadialGradient } from '@/components/ui/RadialGradient';
import { Body, Caption } from '@/components/ui/Typography';
import { designTokens, componentTokens } from '@/constants/design-tokens';
import {
  ArrowLeft,
  MoreVertical,
  Check,
  CheckCheck,
  Languages,
} from 'lucide-react-native';

// Import new chat components
import { ImageMessage } from '@/components/chat/ImageMessage';
import { VoiceMessage } from '@/components/chat/VoiceMessage';
import { TranslationToggle } from '@/components/chat/TranslationToggle';
import { ChatSettings } from '@/components/chat/ChatSettings';
import { EnhancedMessageInput } from '@/components/chat/EnhancedMessageInput';
import { useTranslation } from 'react-i18next';
import { isTestCompanionId } from '@/utils/companion-display';

// TypeScript interfaces for type safety
interface Message {
  id: string;
  text?: string;
  sender: 'user' | 'companion';
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
  type: 'text' | 'image' | 'voice' | 'location' | 'booking';
  images?: string[];
  voiceDuration?: number;
  audioUrl?: string;
}

interface ChatHeaderProps {
  companion: any; // Use proper companion type from mocks
  onBack: () => void;
  onMore: () => void;
}

interface MessageBubbleProps {
  message: Message;
  isUser: boolean;
}

interface TypingIndicatorProps {
  companion: any;
  visible: boolean;
}

// Component: Typing Indicator with organic motion
const TypingIndicator: React.FC<TypingIndicatorProps> = ({ companion, visible }) => {
  if (!visible) return null;

  return (
    <View style={styles.typingContainer}>
      <ProfileImage
        uri={companion.image}
        size="small"
      />
      <View style={styles.typingBubble}>
        <View style={styles.typingDots}>
          <View style={[styles.typingDot, styles.typingDot1]} />
          <View style={[styles.typingDot, styles.typingDot2]} />
          <View style={[styles.typingDot, styles.typingDot3]} />
        </View>
      </View>
    </View>
  );
};

export default function ChatScreen() {
  const { id, starter } = useLocalSearchParams<{ id: string; starter?: string }>();
  const { user } = useAuthStore();
  const [roomId, setRoomId] = useState<string | null>(null);
  const [otherParty, setOtherParty] = useState<OtherParty | null>(null);
  const [message, setMessage] = useState(starter ? decodeURIComponent(starter) : '');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [chatError, setChatError] = useState<string | null>(null);
  const [showTranslation, setShowTranslation] = useState(false);
  const [translationEnabled, setTranslationEnabled] = useState(false);
  const [showChatSettings, setShowChatSettings] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { t } = useTranslation();

  // Map backend message shape to local Message interface
  const backendMsgToLocal = useCallback((msg: BackendChatMessage): Message => ({
    id: msg.id,
    text: msg.content ?? undefined,
    sender: msg.isOwn ? 'user' : 'companion',
    timestamp: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    status: 'delivered',
    type: (msg.type === 'image' ? 'image' : 'text') as Message['type'],
    images: msg.imageUrl ? [msg.imageUrl] : undefined,
  }), []);

  // Connect WebSocket for real-time messages and typing indicators
  const connectWS = useCallback((rId: string, userId: string, token: string) => {
    const wsUrl =
      `wss://${BACKEND_URL.replace(/^https?:\/\//, '')}/api/chat/rooms/${rId}/ws` +
      `?userId=${encodeURIComponent(userId)}&token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data as string);
        if (data.type === 'new_message' && data.message && !data.message.isOwn) {
          setMessages(prev => [...prev, backendMsgToLocal(data.message)]);
        }
        if (data.type === 'typing_start') {
          setIsTyping(true);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
        }
        if (data.type === 'typing_stop') {
          setIsTyping(false);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        }
      } catch {
        // Ignore parse errors
      }
    };
  }, [backendMsgToLocal]);

  // Initialise chat: resolve room ID then load messages
  const initChat = useCallback(async () => {
    setIsLoading(true);
    setChatError(null);
    const rawId = typeof id === 'string' ? id : Array.isArray(id) ? id[0] : '';

    if (!rawId) {
      setChatError('We could not find this conversation.');
      setIsLoading(false);
      return;
    }

    if (rawId.startsWith('demo_room_')) {
      setRoomId(rawId);
      const roomDetail = await getRoomDetail(rawId);
      if (roomDetail) {
        setOtherParty(roomDetail.otherParty);
        setMessages(roomDetail.messages.map(backendMsgToLocal));
      } else {
        setChatError('We could not load this conversation. Check your connection and try again.');
      }
      setIsLoading(false);
      return;
    }

    if (!isUUID(rawId) || isTestCompanionId(rawId)) {
      // rawId is a known preview participant ID from a profile/search screen.
      const newRoomId = await createOrGetRoom(rawId);
      if (newRoomId) {
        router.replace(`/chat/${newRoomId}`);
      } else {
        setChatError('This chat is not available yet. Please try from Messages or the companion profile.');
        setIsLoading(false);
      }
      return;
    }

    // UUIDs can be either room IDs from Messages or participant IDs from profiles.
    // Try room detail first; if that misses, create/get the room for that participant.
    const roomDetail = await getRoomDetail(rawId);
    if (roomDetail) {
      setRoomId(rawId);
      setOtherParty(roomDetail.otherParty);
      setMessages(roomDetail.messages.map(backendMsgToLocal));
      setIsLoading(false);

      const token = await getAuthToken();
      if (token && user?.id) {
        connectWS(rawId, user.id, token);
      }
    } else {
      const newRoomId = await createOrGetRoom(rawId);
      if (newRoomId) {
        router.replace(`/chat/${newRoomId}`);
      } else {
        setChatError('This chat is not available yet. Please try from Messages or the companion profile.');
        setIsLoading(false);
      }
    }
  }, [id, user, backendMsgToLocal, connectWS]);

  useEffect(() => {
    initChat();
    return () => {
      wsRef.current?.close();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [initChat]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const handleBack = () => {
    router.back();
  };

  const handleSend = async () => {
    if (!message.trim() || !roomId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const optimisticId = `opt-${Date.now()}`;
    const optimistic: Message = {
      id: optimisticId,
      text: message.trim(),
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
      type: 'text',
    };

    setMessages(prev => [...prev, optimistic]);
    const textToSend = message.trim();
    setMessage('');

    const sent = await sendChatMessage(roomId, textToSend);
    if (sent) {
      setMessages(prev =>
        prev.map(m =>
          m.id === optimisticId ? { ...backendMsgToLocal(sent), id: optimisticId } : m
        )
      );
    }
  };

  const handleTranslationToggle = (enabled: boolean) => {
    setTranslationEnabled(enabled);
    // logger.log('Translation:', enabled ? 'enabled' : 'disabled');
  };

  const handleLanguageSelect = (source: string, target: string) => {
    // logger.log('Language selection:', source, 'to', target);
  };
  
  // Component: Message Bubble with design tokens
  const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isUser }) => (
    <View style={[styles.messageContainer, isUser ? styles.userMessageContainer : styles.companionMessageContainer]}>
      <View style={[styles.messageBubble, isUser ? styles.userMessageBubble : styles.companionMessageBubble]}>
        <Body style={[styles.messageText, isUser ? styles.userMessageText : styles.companionMessageText]}>
          {message.text}
        </Body>
      </View>

      <View style={[styles.messageFooter, isUser ? styles.userMessageFooter : styles.companionMessageFooter]}>
        <Caption style={styles.messageTime}>{message.timestamp}</Caption>

        {isUser && (
          <View style={styles.messageStatus}>
            {message.status === 'sent' && <Check size={14} color={designTokens.colors.semantic.textSecondary} />}
            {message.status === 'delivered' && <CheckCheck size={14} color={designTokens.colors.semantic.textSecondary} />}
            {message.status === 'read' && <CheckCheck size={14} color={designTokens.colors.semantic.accent} />}
          </View>
        )}
      </View>
    </View>
  );

  const renderMessageItem = ({ item }: { item: Message }) => {
    const isUser = item.sender === 'user';

    switch (item.type) {
      case 'image':
        return (
          <ImageMessage
            images={item.images || []}
            isUser={isUser}
            timestamp={item.timestamp}
            status={item.status}
          />
        );
      case 'voice':
        return (
          <VoiceMessage
            duration={item.voiceDuration || 0}
            isUser={isUser}
            timestamp={item.timestamp}
            status={item.status}
            audioUrl={item.audioUrl}
          />
        );
      case 'text':
      default:
        return <MessageBubble message={item} isUser={isUser} />;
    }
  };
  
  // Component: Chat Header with design tokens - Consistent with Home Page
  const ChatHeader: React.FC<ChatHeaderProps> = ({ companion, onBack, onMore }) => (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={24} color={designTokens.colors.semantic.text} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.profileButton}
          accessibilityRole="button"
          accessibilityLabel={`View ${companion.name} profile`}
        >
          <ProfileImage
            uri={companion.image}
            size="small"
          />
          <View style={styles.profileInfo}>
            <Body style={styles.profileName}>{companion.name}</Body>
          </View>
        </TouchableOpacity>

        <View style={styles.headerActions}>
          {/* <TouchableOpacity
            style={[
              styles.headerActionButton,
              showTranslation && styles.headerActionButtonActive,
            ]}
            onPress={() => setShowTranslation(!showTranslation)}
            accessibilityRole="button"
            accessibilityLabel={t('chat.toggleTranslation')}
          >
            <Languages size={20} color={
              showTranslation
                ? designTokens.colors.semantic.primaryContrast
                : designTokens.colors.semantic.text
            } />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerActionButton}
            onPress={() => setShowChatSettings(true)}
            accessibilityRole="button"
            accessibilityLabel={t('chat.chatSettings')}
          >
            <MoreVertical size={20} color={designTokens.colors.semantic.text} />
          </TouchableOpacity> */}
        </View>
      </View>
    </View>
  );

  // Derive a companion-compatible object from the real otherParty for header/settings
  const companionForHeader = {
    id: otherParty?.id ?? '',
    name: otherParty?.name ?? 'Chat',
    image: otherParty?.image ?? '',
    rating: 0,
    reviews: 0,
    location: 'Thailand',
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={designTokens.colors.semantic.accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (chatError) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.errorContainer}>
          <Body style={styles.errorTitle}>Chat unavailable</Body>
          <Caption style={styles.errorMessage}>{chatError}</Caption>
          <TouchableOpacity style={styles.errorButton} onPress={initChat}>
            <Body style={styles.errorButtonText}>Try again</Body>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryErrorButton} onPress={() => router.replace('/messages')}>
            <Caption style={styles.secondaryErrorText}>Back to messages</Caption>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ChatHeader
          companion={companionForHeader}
          onBack={handleBack}
          onMore={() => {}}
        />

        <View style={styles.chatContainer}>
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessageItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.messagesList}
          />

          <TypingIndicator companion={companionForHeader} visible={isTyping} />
        </View>

        {/* Translation Toggle */}
        {showTranslation && (
          <TranslationToggle
            isEnabled={translationEnabled}
            onToggle={handleTranslationToggle}
            onLanguageSelect={handleLanguageSelect}
          />
        )}

        <EnhancedMessageInput
          message={message}
          onMessageChange={setMessage}
          onSend={handleSend}
          disabled={!roomId}
        />

        {/* Chat Settings Modal */}
        <ChatSettings
          visible={showChatSettings}
          onClose={() => setShowChatSettings(false)}
          companion={companionForHeader}
          onViewProfile={() => setShowChatSettings(false)}
          onMute={() => {}}
          onBlock={() => {}}
          onReport={() => {}}
          onArchive={() => {}}
          onDelete={() => {}}
          onStarConversation={() => {}}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Styles using design tokens for consistency and maintainability
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: designTokens.colors.semantic.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardContainer: {
    flex: 1,
  },
  header: {
    paddingTop: designTokens.spacing.scale.lg,
    paddingBottom: designTokens.spacing.scale.md,
    paddingHorizontal: designTokens.spacing.scale.lg,
    backgroundColor: designTokens.colors.semantic.surface,
    borderBottomWidth: 1,
    borderBottomColor: designTokens.colors.semantic.border,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.scale.sm,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: designTokens.colors.semantic.background,
    ...designTokens.shadows.sm,
  },
  profileButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.scale.sm,
  },
  profileInfo: {
    gap: 2,
  },
  profileName: {
    ...componentTokens.text.body,
    fontWeight: '600',
    color: designTokens.colors.semantic.text,
  },
  headerActions: {
    flexDirection: 'row',
    gap: designTokens.spacing.scale.sm,
  },
  headerActionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: designTokens.colors.semantic.background,
    ...designTokens.shadows.sm,
  },
  headerActionButtonActive: {
    backgroundColor: designTokens.colors.semantic.primary,
  },
  chatContainer: {
    flex: 1,
    backgroundColor: designTokens.colors.semantic.background,
  },
  messagesList: {
    padding: designTokens.spacing.scale.md,
    paddingBottom: designTokens.spacing.scale.lg,
    gap: designTokens.spacing.scale.md,
  },
  messageContainer: {
    maxWidth: '80%',
    gap: designTokens.spacing.scale.xs,
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
  },
  companionMessageContainer: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    borderRadius: designTokens.borderRadius.components.card,
    paddingHorizontal: designTokens.spacing.scale.md,
    paddingVertical: designTokens.spacing.scale.sm,
  },
  userMessageBubble: {
    backgroundColor: designTokens.colors.semantic.primary,
    borderBottomRightRadius: 4,
    ...designTokens.shadows.sm,
  },
  companionMessageBubble: {
    backgroundColor: designTokens.colors.semantic.surface,
    borderBottomLeftRadius: 4,
    ...designTokens.shadows.md,
  },
  messageText: {
    ...componentTokens.text.body,
  },
  userMessageText: {
    color: designTokens.colors.components.button.text,
  },
  companionMessageText: {
    color: designTokens.colors.semantic.text,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: designTokens.spacing.scale.sm,
    gap: designTokens.spacing.scale.xs,
  },
  userMessageFooter: {
    justifyContent: 'flex-end',
  },
  companionMessageFooter: {
    justifyContent: 'flex-start',
  },
  messageTime: {
    ...componentTokens.text.caption,
    color: designTokens.colors.semantic.textSecondary,
  },
  messageStatus: {
    // No additional margin needed due to gap in parent
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: designTokens.spacing.scale.md,
    marginBottom: designTokens.spacing.scale.md,
    gap: designTokens.spacing.scale.sm,
  },
  typingBubble: {
    backgroundColor: designTokens.colors.semantic.surface,
    borderRadius: designTokens.borderRadius.components.card,
    borderBottomLeftRadius: 4,
    paddingHorizontal: designTokens.spacing.scale.md,
    paddingVertical: designTokens.spacing.scale.sm,
    ...designTokens.shadows.md,
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.scale.xs,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: designTokens.colors.semantic.accent, // Coral accent for typing dots
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
  inputContainer: {
    backgroundColor: designTokens.colors.semantic.surface,
    borderTopWidth: 1,
    borderTopColor: designTokens.colors.semantic.border,
    padding: designTokens.spacing.scale.sm,
    gap: designTokens.spacing.scale.sm,
  },
  inputActions: {
    flexDirection: 'row',
    gap: designTokens.spacing.scale.xs,
  },
  inputActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: designTokens.colors.semantic.background,
    borderRadius: 24,
    paddingHorizontal: designTokens.spacing.scale.md,
    paddingVertical: designTokens.spacing.scale.sm,
    gap: designTokens.spacing.scale.sm,
    ...designTokens.shadows.sm,
  },
  textInput: {
    flex: 1,
    ...componentTokens.text.body,
    maxHeight: 100,
    color: designTokens.colors.semantic.text,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    ...designTokens.shadows.sm,
  },
  sendButtonDisabled: {
    backgroundColor: 'transparent',
  },
  sendButtonActive: {
    backgroundColor: designTokens.colors.semantic.accent, // Coral accent for send button
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: designTokens.spacing.scale.lg,
    backgroundColor: designTokens.colors.semantic.background,
  },
  errorTitle: {
    fontWeight: '700',
    marginBottom: designTokens.spacing.scale.sm,
    textAlign: 'center',
  },
  errorMessage: {
    color: designTokens.colors.semantic.textSecondary,
    textAlign: 'center',
    marginBottom: designTokens.spacing.scale.lg,
  },
  errorButton: {
    minHeight: 44,
    paddingHorizontal: designTokens.spacing.scale.lg,
    borderRadius: designTokens.borderRadius.components.button,
    backgroundColor: designTokens.colors.semantic.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: designTokens.spacing.scale.sm,
  },
  errorButtonText: {
    color: designTokens.colors.semantic.primaryContrast,
    fontWeight: '600',
  },
  secondaryErrorButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: designTokens.spacing.scale.lg,
  },
  secondaryErrorText: {
    color: designTokens.colors.semantic.primary,
    fontWeight: '600',
  },
});
