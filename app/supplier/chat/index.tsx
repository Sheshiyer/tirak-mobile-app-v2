import { logger } from '@/utils/logger';
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  MessageCircle,
  Search,
  Filter,
  MoreVertical,
  Clock,
  CheckCircle,
  AlertCircle,
  Star,
  Calendar,
  Settings,
  Bell,
  Archive,
} from 'lucide-react-native';
import { RadialGradient } from '@/components/ui/RadialGradient';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Heading, Subheading, Body, Caption } from '@/components/ui/Typography';
import { designTokens, componentTokens } from '@/constants/design-tokens';
import { getRooms, formatRelativeTime, type ChatRoom } from '@/utils/chat-api';

interface ChatConversation {
  id: string;
  customerId: string;
  customerName: string;
  customerAvatar: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  status: 'active' | 'pending' | 'archived';
  priority: 'high' | 'medium' | 'low';
  serviceInquiry?: string;
  bookingStatus?: 'inquiry' | 'confirmed' | 'completed' | 'cancelled';
  customerRating?: number;
  responseTime: number; // hours
  isOnline: boolean;
}

interface ChatStats {
  totalConversations: number;
  unreadMessages: number;
  averageResponseTime: number;
  customerSatisfaction: number;
  activeChats: number;
  pendingInquiries: number;
  todayMessages: number;
  weeklyGrowth: number;
}

export default function ChatDashboardScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'unread' | 'pending' | 'archived'>('all');

  const [conversations, setConversations] = useState<ChatConversation[]>([]);

  useEffect(() => {
    let mounted = true;
    getRooms().then((rooms: ChatRoom[]) => {
      if (!mounted) return;
      setConversations(rooms.map((room) => ({
        id: room.id,
        customerId: room.otherParty.id,
        customerName: room.otherParty.name || 'Traveler',
        customerAvatar: room.otherParty.image || '',
        lastMessage: room.lastMessage?.content || 'No messages yet',
        lastMessageTime: formatRelativeTime(room.lastActivity),
        unreadCount: 0,
        status: room.status === 'archived' ? 'archived' : 'active',
        priority: 'medium',
        serviceInquiry: undefined,
        bookingStatus: room.status === 'active' ? 'confirmed' : 'inquiry',
        responseTime: 0,
        isOnline: false,
      })));
    });
    return () => {
      mounted = false;
    };
  }, []);

  const chatStats = useMemo<ChatStats>(() => ({
    totalConversations: conversations.length,
    unreadMessages: conversations.reduce((sum, item) => sum + item.unreadCount, 0),
    averageResponseTime: 0,
    customerSatisfaction: 0,
    activeChats: conversations.filter(item => item.status === 'active').length,
    pendingInquiries: conversations.filter(item => item.status === 'pending').length,
    todayMessages: conversations.filter(item => item.lastMessageTime === 'just now' || item.lastMessageTime.includes('min') || item.lastMessageTime.includes('hour')).length,
    weeklyGrowth: 0,
  }), [conversations]);

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         conv.serviceInquiry?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = selectedFilter === 'all' || 
                         (selectedFilter === 'unread' && conv.unreadCount > 0) ||
                         (selectedFilter === 'pending' && conv.status === 'pending') ||
                         (selectedFilter === 'archived' && conv.status === 'archived');
    
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return designTokens.colors.semantic.success;
      case 'pending': return designTokens.colors.semantic.warning;
      case 'archived': return designTokens.colors.semantic.textSecondary;
      default: return designTokens.colors.semantic.textSecondary;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return designTokens.colors.semantic.error;
      case 'medium': return designTokens.colors.semantic.warning;
      case 'low': return designTokens.colors.semantic.success;
      default: return designTokens.colors.semantic.textSecondary;
    }
  };

  const getBookingStatusColor = (status?: string) => {
    switch (status) {
      case 'inquiry': return designTokens.colors.semantic.primary;
      case 'confirmed': return designTokens.colors.semantic.success;
      case 'completed': return designTokens.colors.semantic.accent;
      case 'cancelled': return designTokens.colors.semantic.error;
      default: return designTokens.colors.semantic.textSecondary;
    }
  };

  const handleChatPress = (conversation: ChatConversation) => {
    const normalizedName = conversation.customerName.trim().toLowerCase();
    const reviewRoomId = normalizedName === 'test.customer.tirak' || normalizedName === 'test customer'
      ? 'demo_room_test_customer'
      : conversation.id;

    router.push(`/chat/${reviewRoomId}`);
  };

  const handleArchiveChat = (chatId: string) => {
    Alert.alert(
      'Archive Conversation',
      'Are you sure you want to archive this conversation?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Archive', onPress: () => logger.log('Archiving chat:', chatId) }, 
      ]
    );
  };

  const StatCard = ({ 
    icon, 
    title, 
    value, 
    subtitle, 
    trend 
  }: {
    icon: React.ReactNode;
    title: string;
    value: string;
    subtitle?: string;
    trend?: number;
  }) => (
    <Card style={styles.statCard} padding={12}>
      <View style={styles.statHeader}>
        <View style={styles.statIcon}>
          {icon}
        </View>
        {trend !== undefined && (
          <Caption style={[
            styles.statTrend,
            { color: trend > 0 ? designTokens.colors.semantic.success : designTokens.colors.semantic.error }
          ]}>
            {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
          </Caption>
        )}
      </View>
      
      <Subheading style={styles.statValue}>{value}</Subheading>
      <Caption style={styles.statTitle}>{title}</Caption>
      {subtitle && (
        <Caption style={styles.statSubtitle}>{subtitle}</Caption>
      )}
    </Card>
  );

  const ConversationCard = ({ conversation }: { conversation: ChatConversation }) => (
    <TouchableOpacity
      style={styles.conversationCard}
      onPress={() => handleChatPress(conversation)}
    >
      <View style={styles.conversationHeader}>
        <View style={styles.customerInfo}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {conversation.customerName.split(' ').map(n => n[0]).join('')}
              </Text>
            </View>
            {conversation.isOnline && <View style={styles.onlineIndicator} />}
          </View>
          
          <View style={styles.customerDetails}>
            <View style={styles.customerNameRow}>
              <Body style={styles.customerName}>{conversation.customerName}</Body>
              {conversation.customerRating && (
                <View style={styles.ratingContainer}>
                  <Star size={12} color="#FFD700" fill="#FFD700" />
                  <Caption style={styles.rating}>{conversation.customerRating}</Caption>
                </View>
              )}
            </View>
            
            {conversation.serviceInquiry && (
              <Caption style={styles.serviceInquiry}>{conversation.serviceInquiry}</Caption>
            )}
          </View>
        </View>

        <View style={styles.conversationMeta}>
          <Caption style={styles.timestamp}>{conversation.lastMessageTime}</Caption>
          {conversation.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>{conversation.unreadCount}</Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.moreButton}
            onPress={() => handleArchiveChat(conversation.id)}
          >
            <MoreVertical size={16} color={designTokens.colors.semantic.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <Body style={styles.lastMessage} numberOfLines={2}>
        {conversation.lastMessage}
      </Body>

      <View style={styles.conversationFooter}>
        <View style={styles.statusIndicators}>
          <View style={[
            styles.statusDot,
            { backgroundColor: getStatusColor(conversation.status) }
          ]} />
          <Caption style={styles.statusText}>{conversation.status.toUpperCase()}</Caption>
          
          {conversation.bookingStatus && (
            <>
              <View style={[
                styles.statusDot,
                { backgroundColor: getBookingStatusColor(conversation.bookingStatus) }
              ]} />
              <Caption style={styles.statusText}>
                {conversation.bookingStatus.toUpperCase()}
              </Caption>
            </>
          )}
        </View>

        <View style={styles.responseTime}>
          <Clock size={12} color={designTokens.colors.semantic.textSecondary} />
          <Caption style={styles.responseTimeText}>
            {conversation.responseTime}h avg response
          </Caption>
        </View>
      </View>
    </TouchableOpacity>
  );

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
            <Heading style={styles.title}>Customer Chat</Heading>
            <Caption style={styles.subtitle}>Manage customer conversations</Caption>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={() => router.push('/supplier/chat/settings')}
            >
              <Bell size={20} color={designTokens.colors.semantic.primary} />
              {chatStats.unreadMessages > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationCount}>
                    {chatStats.unreadMessages > 9 ? '9+' : chatStats.unreadMessages}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => router.push('/supplier/chat/settings')}
            >
              <Settings size={20} color={designTokens.colors.semantic.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search and Filters */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Search size={20} color={designTokens.colors.semantic.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search conversations..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={designTokens.colors.semantic.textSecondary}
            />
          </View>
          
          <TouchableOpacity style={styles.filterButton}>
            <Filter size={20} color={designTokens.colors.semantic.primary} />
          </TouchableOpacity>
        </View>

        {/* Filter Chips */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filterChips}
          contentContainerStyle={styles.filterChipsContent}
        >
          {[
            { key: 'all', label: 'All', count: conversations.length },
            { key: 'unread', label: 'Unread', count: conversations.filter(c => c.unreadCount > 0).length },
            { key: 'pending', label: 'Pending', count: conversations.filter(c => c.status === 'pending').length },
            { key: 'archived', label: 'Archived', count: 0 },
          ].map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterChip,
                selectedFilter === filter.key && styles.filterChipActive
              ]}
              onPress={() => setSelectedFilter(filter.key as any)}
            >
              <Text style={[
                styles.filterChipText,
                selectedFilter === filter.key && styles.filterChipTextActive
              ]}>
                {filter.label} ({filter.count})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Stats Overview */}
        <View style={styles.statsGrid}>
          <StatCard
            icon={<MessageCircle size={16} color={designTokens.colors.semantic.primary} />}
            title="Total Chats"
            value={chatStats.totalConversations.toString()}
            trend={chatStats.weeklyGrowth}
          />
          
          <StatCard
            icon={<AlertCircle size={16} color={designTokens.colors.semantic.warning} />}
            title="Unread"
            value={chatStats.unreadMessages.toString()}
            subtitle="Need response"
          />
          
          <StatCard
            icon={<Clock size={16} color={designTokens.colors.semantic.accent} />}
            title="Avg Response"
            value={`${chatStats.averageResponseTime}h`}
            subtitle="Response time"
          />
          
          <StatCard
            icon={<Star size={16} color="#FFD700" />}
            title="Satisfaction"
            value={chatStats.customerSatisfaction.toString()}
            subtitle="Customer rating"
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Button
            title="Bulk Actions"
            onPress={() => router.push('/supplier/chat')}
            variant="outline"
            style={styles.quickActionButton}
            icon={<Archive size={16} color={designTokens.colors.semantic.primary} />}
          />
          <Button
            title="Templates"
            onPress={() => router.push('/supplier/chat/templates')}
            variant="outline"
            style={styles.quickActionButton}
            icon={<MessageCircle size={16} color={designTokens.colors.semantic.primary} />}
          />
        </View>

        {/* Conversations List */}
        <View style={styles.conversationsSection}>
          <View style={styles.conversationsHeader}>
            <Subheading style={styles.conversationsTitle}>
              Conversations ({filteredConversations.length})
            </Subheading>
          </View>
          
          {filteredConversations.length > 0 ? (
            <View style={styles.conversationsList}>
              {filteredConversations.map((conversation) => (
                <ConversationCard key={conversation.id} conversation={conversation} />
              ))}
            </View>
          ) : (
            <Card style={styles.emptyState} padding={24}>
              <MessageCircle size={48} color={designTokens.colors.semantic.textSecondary} />
              <Body style={styles.emptyStateText}>No conversations found</Body>
              <Caption style={styles.emptyStateSubtext}>
                {searchQuery ? 'Try adjusting your search terms' : 'New conversations will appear here'}
              </Caption>
            </Card>
          )}
        </View>
      </ScrollView>
    </RadialGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: 'transparent',
    paddingHorizontal: designTokens.spacing.scale.md,
    paddingBottom: designTokens.spacing.scale.sm,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: designTokens.spacing.scale.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: designTokens.colors.semantic.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: designTokens.spacing.scale.md,
    ...componentTokens.card.shadow,
  },
  headerTitle: {
    flex: 1,
  },
  title: {
    marginBottom: designTokens.spacing.scale.xs,
  },
  subtitle: {
    color: designTokens.colors.semantic.textSecondary,
  },
  headerActions: {
    flexDirection: 'row',
    gap: designTokens.spacing.scale.xs,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: designTokens.colors.semantic.surface,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    ...componentTokens.card.shadow,
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: designTokens.colors.semantic.error,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationCount: {
    color: designTokens.colors.semantic.surface,
    fontSize: 10,
    fontWeight: '600',
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: designTokens.colors.semantic.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...componentTokens.card.shadow,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.scale.sm,
    marginBottom: designTokens.spacing.scale.md,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: designTokens.colors.semantic.surface,
    borderRadius: 24,
    paddingHorizontal: designTokens.spacing.scale.md,
    paddingVertical: designTokens.spacing.scale.sm,
    ...componentTokens.card.shadow,
  },
  searchInput: {
    flex: 1,
    marginLeft: designTokens.spacing.scale.sm,
    fontSize: 16,
    color: designTokens.colors.semantic.text,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: designTokens.colors.semantic.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...componentTokens.card.shadow,
  },
  filterChips: {
    marginBottom: designTokens.spacing.scale.sm,
  },
  filterChipsContent: {
    paddingRight: designTokens.spacing.scale.md,
  },
  filterChip: {
    backgroundColor: designTokens.colors.semantic.surface,
    paddingHorizontal: designTokens.spacing.scale.md,
    paddingVertical: designTokens.spacing.scale.sm,
    borderRadius: 20,
    marginRight: designTokens.spacing.scale.sm,
    ...componentTokens.card.shadow,
  },
  filterChipActive: {
    backgroundColor: designTokens.colors.semantic.primary,
  },
  filterChipText: {
    color: designTokens.colors.semantic.text,
    fontWeight: '500',
    fontSize: 14,
  },
  filterChipTextActive: {
    color: designTokens.colors.semantic.surface,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: designTokens.spacing.scale.md,
    paddingTop: 0,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: designTokens.spacing.scale.sm,
    marginBottom: designTokens.spacing.scale.lg,
  },
  statCard: {
    width: '48%',
    marginBottom: 0,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: designTokens.spacing.scale.sm,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: designTokens.colors.semantic.surface + '80',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statTrend: {
    fontSize: 11,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: designTokens.spacing.scale.xs,
  },
  statTitle: {
    color: designTokens.colors.semantic.textSecondary,
    marginBottom: designTokens.spacing.scale.xs,
  },
  statSubtitle: {
    color: designTokens.colors.semantic.textSecondary,
    fontSize: 11,
  },
  quickActions: {
    flexDirection: 'row',
    gap: designTokens.spacing.scale.md,
    marginBottom: designTokens.spacing.scale.lg,
  },
  quickActionButton: {
    flex: 1,
  },
  conversationsSection: {
    marginBottom: designTokens.spacing.scale.xl,
  },
  conversationsHeader: {
    marginBottom: designTokens.spacing.scale.md,
  },
  conversationsTitle: {
    marginBottom: designTokens.spacing.scale.xs,
  },
  conversationsList: {
    gap: designTokens.spacing.scale.sm,
  },
  conversationCard: {
    backgroundColor: designTokens.colors.semantic.surface,
    borderRadius: componentTokens.card.borderRadius,
    padding: designTokens.spacing.scale.md,
    ...componentTokens.card.shadow,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: designTokens.spacing.scale.sm,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: designTokens.spacing.scale.sm,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: designTokens.colors.semantic.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: designTokens.colors.semantic.surface,
    fontWeight: '600',
    fontSize: 16,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: designTokens.colors.semantic.success,
    borderWidth: 2,
    borderColor: designTokens.colors.semantic.surface,
  },
  customerDetails: {
    flex: 1,
  },
  customerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: designTokens.spacing.scale.xs,
  },
  customerName: {
    fontWeight: '600',
    flex: 1,
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
  },
  conversationMeta: {
    alignItems: 'flex-end',
    gap: designTokens.spacing.scale.xs,
  },
  timestamp: {
    color: designTokens.colors.semantic.textSecondary,
  },
  unreadBadge: {
    backgroundColor: designTokens.colors.semantic.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadCount: {
    color: designTokens.colors.semantic.surface,
    fontSize: 11,
    fontWeight: '600',
  },
  moreButton: {
    padding: designTokens.spacing.scale.xs,
  },
  lastMessage: {
    color: designTokens.colors.semantic.textSecondary,
    marginBottom: designTokens.spacing.scale.sm,
    lineHeight: 20,
  },
  conversationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: designTokens.spacing.scale.sm,
    borderTopWidth: 1,
    borderTopColor: designTokens.colors.semantic.border,
  },
  statusIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.scale.xs,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    color: designTokens.colors.semantic.textSecondary,
    fontSize: 10,
    fontWeight: '600',
  },
  responseTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  responseTimeText: {
    marginLeft: designTokens.spacing.scale.xs,
    color: designTokens.colors.semantic.textSecondary,
    fontSize: 11,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: designTokens.spacing.scale.xl,
  },
  emptyStateText: {
    marginTop: designTokens.spacing.scale.md,
    marginBottom: designTokens.spacing.scale.sm,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    textAlign: 'center',
    color: designTokens.colors.semantic.textSecondary,
  },
});
