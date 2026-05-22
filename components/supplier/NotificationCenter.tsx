import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { 
  Bell, 
  Calendar, 
  MessageSquare, 
  DollarSign, 
  Star, 
  AlertCircle,
  X,
  Check
} from 'lucide-react-native';
import { designTokens, componentTokens } from '@/constants/design-tokens';
import { ProfileImage } from '@/components/ui/ProfileImage';

interface Notification {
  id: string;
  type: 'booking' | 'message' | 'payment' | 'review' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  urgent?: boolean;
  customerName?: string;
  customerImage?: string;
  actionRequired?: boolean;
}

interface NotificationCenterProps {
  notifications: Notification[];
  onNotificationPress?: (notification: Notification) => void;
  onMarkAsRead?: (notificationId: string) => void;
  onMarkAllAsRead?: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  onNotificationPress,
  onMarkAsRead,
  onMarkAllAsRead,
}) => {
  const [showAll, setShowAll] = useState(false);
  
  const unreadCount = notifications.filter(n => !n.read).length;
  const urgentCount = notifications.filter(n => n.urgent && !n.read).length;
  const displayNotifications = showAll ? notifications : notifications.slice(0, 5);

  const getNotificationIcon = (type: Notification['type']) => {
    const iconProps = { size: 20, color: designTokens.colors.semantic.surface };
    
    switch (type) {
      case 'booking':
        return <Calendar {...iconProps} />;
      case 'message':
        return <MessageSquare {...iconProps} />;
      case 'payment':
        return <DollarSign {...iconProps} />;
      case 'review':
        return <Star {...iconProps} />;
      case 'system':
        return <AlertCircle {...iconProps} />;
      default:
        return <Bell {...iconProps} />;
    }
  };

  const getNotificationIconBackground = (type: Notification['type'], urgent?: boolean) => {
    if (urgent) {
      return designTokens.colors.semantic.accent;
    }
    
    switch (type) {
      case 'booking':
        return designTokens.colors.reference.purple;
      case 'message':
        return '#4ECDC4';
      case 'payment':
        return '#FFB347';
      case 'review':
        return designTokens.colors.reference.pink;
      case 'system':
        return designTokens.colors.semantic.textSecondary;
      default:
        return designTokens.colors.semantic.primary;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  const handleNotificationPress = (notification: Notification) => {
    if (!notification.read && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
    if (onNotificationPress) {
      onNotificationPress(notification);
    }
  };

  if (notifications.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Bell size={48} color={designTokens.colors.semantic.textSecondary} />
        <Text style={styles.emptyStateText}>No notifications</Text>
        <Text style={styles.emptyStateSubtext}>
          You're all caught up! New notifications will appear here.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.notificationBadgeContainer}>
            <Bell size={20} color={designTokens.colors.semantic.text} />
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>
          <Text style={styles.headerTitle}>Notifications</Text>
        </View>
        
        {unreadCount > 0 && onMarkAllAsRead && (
          <TouchableOpacity
            style={styles.markAllButton}
            onPress={onMarkAllAsRead}
          >
            <Check size={16} color={designTokens.colors.semantic.primary} />
            <Text style={styles.markAllButtonText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Urgent Notifications Alert */}
      {urgentCount > 0 && (
        <View style={styles.urgentAlert}>
          <AlertCircle size={16} color={designTokens.colors.semantic.accent} />
          <Text style={styles.urgentAlertText}>
            {urgentCount} urgent notification{urgentCount > 1 ? 's' : ''} require{urgentCount === 1 ? 's' : ''} attention
          </Text>
        </View>
      )}

      {/* Notifications List */}
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {displayNotifications.map((notification) => (
          <TouchableOpacity
            key={notification.id}
            style={[
              styles.notificationItem,
              !notification.read && styles.notificationItemUnread,
              notification.urgent && styles.notificationItemUrgent
            ]}
            onPress={() => handleNotificationPress(notification)}
            activeOpacity={0.7}
          >
            <View style={styles.notificationContent}>
              <View style={styles.notificationHeader}>
                <View 
                  style={[
                    styles.notificationIcon,
                    { backgroundColor: getNotificationIconBackground(notification.type, notification.urgent) }
                  ]}
                >
                  {getNotificationIcon(notification.type)}
                </View>
                
                <View style={styles.notificationInfo}>
                  <View style={styles.notificationTitleRow}>
                    <Text style={[
                      styles.notificationTitle,
                      !notification.read && styles.notificationTitleUnread
                    ]}>
                      {notification.title}
                    </Text>
                    <Text style={styles.notificationTime}>
                      {formatTimestamp(notification.timestamp)}
                    </Text>
                  </View>
                  
                  <Text style={styles.notificationMessage}>
                    {notification.message}
                  </Text>
                  
                  {notification.customerName && (
                    <View style={styles.customerInfo}>
                      <ProfileImage
                        uri={notification.customerImage}
                        size={20}
                        showBadge={false}
                      />
                      <Text style={styles.customerName}>{notification.customerName}</Text>
                    </View>
                  )}
                </View>
              </View>
              
              {notification.actionRequired && (
                <View style={styles.actionIndicator}>
                  <Text style={styles.actionText}>Action Required</Text>
                </View>
              )}
            </View>
            
            {!notification.read && (
              <View style={styles.unreadIndicator} />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Show More/Less Button */}
      {notifications.length > 5 && (
        <TouchableOpacity
          style={styles.showMoreButton}
          onPress={() => setShowAll(!showAll)}
        >
          <Text style={styles.showMoreButtonText}>
            {showAll ? 'Show Less' : `Show All (${notifications.length})`}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...componentTokens.card.default,
    padding: designTokens.spacing.scale.lg,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: designTokens.spacing.scale.xl,
  },
  emptyStateText: {
    ...componentTokens.text.subheading,
    marginTop: designTokens.spacing.scale.md,
    marginBottom: designTokens.spacing.scale.xs,
  },
  emptyStateSubtext: {
    ...componentTokens.text.caption,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: designTokens.spacing.scale.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationBadgeContainer: {
    position: 'relative',
    marginRight: designTokens.spacing.scale.sm,
  },
  notificationBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: designTokens.colors.semantic.accent,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    ...designTokens.typography.styles.caption,
    color: designTokens.colors.semantic.surface,
    fontSize: 10,
    fontWeight: designTokens.typography.weights.bold,
  },
  headerTitle: {
    ...componentTokens.text.subheading,
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: designTokens.spacing.scale.sm,
    paddingVertical: designTokens.spacing.scale.xs,
  },
  markAllButtonText: {
    ...componentTokens.text.caption,
    color: designTokens.colors.semantic.primary,
    marginLeft: designTokens.spacing.scale.xs,
    fontWeight: designTokens.typography.weights.medium,
  },
  urgentAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${designTokens.colors.semantic.accent}20`,
    borderColor: designTokens.colors.semantic.accent,
    borderWidth: 1,
    borderRadius: designTokens.borderRadius.components.button,
    padding: designTokens.spacing.scale.sm,
    marginBottom: designTokens.spacing.scale.md,
  },
  urgentAlertText: {
    ...componentTokens.text.caption,
    color: designTokens.colors.semantic.accent,
    marginLeft: designTokens.spacing.scale.xs,
    fontWeight: designTokens.typography.weights.medium,
  },
  scrollContent: {
    gap: designTokens.spacing.scale.xs,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: designTokens.colors.semantic.surface,
    borderRadius: designTokens.borderRadius.components.card,
    padding: designTokens.spacing.scale.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  notificationItemUnread: {
    backgroundColor: `${designTokens.colors.semantic.primary}05`,
    borderColor: `${designTokens.colors.semantic.primary}20`,
  },
  notificationItemUrgent: {
    borderColor: designTokens.colors.semantic.accent,
    borderWidth: 1,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notificationIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: designTokens.spacing.scale.md,
  },
  notificationInfo: {
    flex: 1,
  },
  notificationTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: designTokens.spacing.scale.xs,
  },
  notificationTitle: {
    ...componentTokens.text.body,
    flex: 1,
    marginRight: designTokens.spacing.scale.sm,
  },
  notificationTitleUnread: {
    fontWeight: designTokens.typography.weights.semibold,
  },
  notificationTime: {
    ...componentTokens.text.caption,
    color: designTokens.colors.semantic.textSecondary,
  },
  notificationMessage: {
    ...componentTokens.text.caption,
    marginBottom: designTokens.spacing.scale.xs,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerName: {
    ...componentTokens.text.caption,
    marginLeft: designTokens.spacing.scale.xs,
    fontWeight: designTokens.typography.weights.medium,
  },
  actionIndicator: {
    marginTop: designTokens.spacing.scale.sm,
    paddingHorizontal: designTokens.spacing.scale.sm,
    paddingVertical: designTokens.spacing.scale.xs,
    backgroundColor: designTokens.colors.semantic.accent,
    borderRadius: designTokens.borderRadius.components.button,
    alignSelf: 'flex-start',
  },
  actionText: {
    ...designTokens.typography.styles.caption,
    color: designTokens.colors.semantic.surface,
    fontWeight: designTokens.typography.weights.semibold,
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: designTokens.colors.semantic.accent,
    marginLeft: designTokens.spacing.scale.sm,
  },
  showMoreButton: {
    alignItems: 'center',
    paddingVertical: designTokens.spacing.scale.md,
    marginTop: designTokens.spacing.scale.sm,
  },
  showMoreButtonText: {
    ...componentTokens.text.body,
    color: designTokens.colors.semantic.primary,
    fontWeight: designTokens.typography.weights.medium,
  },
});
