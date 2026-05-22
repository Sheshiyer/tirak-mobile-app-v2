import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { RadialGradient } from '@/components/ui/RadialGradient';
import { Card } from '@/components/ui/Card';
import { ProfileImage } from '@/components/ui/ProfileImage';
import { designTokens } from '@/constants/design-tokens';
import {
  ArrowLeft,
  Bell,
  Calendar,
  MessageCircle,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Info,
} from 'lucide-react-native';
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '@/app/api/notifications/notifications';
import { useTranslation } from 'react-i18next';

export const options = { headerShown: false };

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const { data, isLoading, error, refetch } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const notifications = data?.data?.notifications || [];
  const unreadCount = data?.data?.unreadCount || 0;
  
  const handleBack = () => {
    router.back();
  };
  
  const handleNotificationPress = (notification: any) => {
    if (!notification.read) {
      markRead.mutate(notification.id);
    }
    // Navigate based on notification type
    switch (notification.type) {
      case 'booking_created':
      case 'booking_request':
      case 'booking_confirmed':
      case 'booking_status_update':
      case 'booking_cancelled':
      case 'booking_reminder':
        if (notification.data?.bookingId) {
          router.push(`/booking/${notification.data.bookingId}` as any);
        } else {
          router.push(`/bookings`);
        }
        break;
      case 'new_message':
        router.push(`/chat/${notification.data.conversationId}`);
        break;
      case 'payment_completed':
        router.push(`/bookings`);
        break;
      case 'review_received':
        router.push(`/bookings`);
        break;
      default:
        // Do nothing for system notifications
        break;
    }
  };
  
  const handleMarkAllAsRead = () => {
    markAllRead.mutate();
  };
  
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking_confirmed':
      case 'booking_request':
      case 'booking_created':
      case 'booking_cancelled':
      case 'booking_status_update':
      case 'booking_reminder':
        return <Calendar size={24} color={designTokens.colors.semantic.surface} />;
      case 'new_message':
        return <MessageCircle size={24} color={designTokens.colors.semantic.surface} />;
      case 'payment_completed':
        return <CreditCard size={24} color={designTokens.colors.semantic.surface} />;
      case 'review_received':
        return <CheckCircle size={24} color={designTokens.colors.semantic.surface} />;
      default:
        return <Bell size={24} color={designTokens.colors.semantic.surface} />;
    }
  };
  
  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'booking_confirmed':
      case 'booking_request':
      case 'booking_created':
      case 'booking_status_update':
        return designTokens.colors.semantic.success;
      case 'booking_cancelled':
        return designTokens.colors.semantic.error;
      case 'booking_reminder':
        return designTokens.colors.semantic.accent;
      case 'new_message':
        return designTokens.colors.semantic.primary;
      case 'payment_completed':
        return designTokens.colors.semantic.warning;
      case 'review_received':
        return designTokens.colors.semantic.primary;
      default:
        return designTokens.colors.semantic.textSecondary;
    }
  };
  
  const renderNotificationItem = ({ item }: { item: any }) => {
    const iconColor = getNotificationColor(item.type);
    return (
      <TouchableOpacity
        style={[styles.notificationItem, !item.read && styles.unreadNotification]}
        onPress={() => handleNotificationPress(item)}
      >
        <View style={[styles.notificationIcon, { backgroundColor: iconColor }]}>
          {getNotificationIcon(item.type)}
        </View>
        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <Text style={styles.notificationTitle}>{item.title}</Text>
            <Text style={styles.notificationTime}>{new Date(item.createdAt).toLocaleString()}</Text>
          </View>
          <Text style={styles.notificationMessage}>{item.message}</Text>
        </View>
        {!item.read && <View style={styles.unreadIndicator} />}
      </TouchableOpacity>
    );
  };
  
  const renderEmptyState = () => (
    <Card style={styles.emptyStateCard} padding={40}>
      <View style={styles.emptyStateIcon}>
        <Bell size={40} color={designTokens.colors.semantic.primary} />
      </View>
      <Text style={styles.emptyStateTitle}>{t('notifications.noNotifications')}</Text>
      <Text style={styles.emptyStateText}>
        {t('notifications.noNotificationsDescription')}
      </Text>
    </Card>
  );
  
  if (isLoading) {
    return (
      <RadialGradient variant="appBackground" style={styles.container}>
        <Text style={styles.headerTitle}>{t('notifications.notifications')}</Text>
        <Text style={{ textAlign: 'center', marginTop: 40 }}>Loading...</Text>
      </RadialGradient>
    );
  }

  if (error) {
    return (
      <RadialGradient variant="appBackground" style={styles.container}>
        <Text style={styles.headerTitle}>{t('notifications.notifications')}</Text>
        <Text style={{ color: designTokens.colors.semantic.error, textAlign: 'center', marginTop: 40 }}>Failed to load notifications.</Text>
        <TouchableOpacity onPress={() => refetch()} style={{ marginTop: 20 }}>
          <Text style={{ color: designTokens.colors.semantic.primary }}>{t('notifications.retry')}</Text>
        </TouchableOpacity>
      </RadialGradient>
    );
  }
  
  return (
    <RadialGradient variant="appBackground" style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ArrowLeft size={24} color={designTokens.colors.semantic.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('notifications.notifications')}</Text>
        <View style={styles.placeholder} />
      </View>
      {notifications.length > 0 && (
        <View style={styles.actionsContainer}>
          {unreadCount > 0 ? (
            <TouchableOpacity 
              style={styles.markAllReadButton}
              onPress={handleMarkAllAsRead}
              disabled={markAllRead.status === 'pending'}
            >
              <CheckCircle size={16} color={designTokens.colors.semantic.primary} />
              <Text style={styles.markAllReadText}>{t('notifications.markAllAsRead')}</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.allReadContainer}>
              <CheckCircle size={16} color={designTokens.colors.semantic.success} />
              <Text style={styles.allReadText}>{t('notifications.allCaughtUp')}</Text>
            </View>
          )}
        </View>
      )}
      {notifications.length > 0 ? (
        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.notificationsList}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        renderEmptyState()
      )}
    </RadialGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: designTokens.colors.semantic.text,
  },
  placeholder: {
    width: 40,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  markAllReadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(111, 76, 170, 0.1)',
  },
  markAllReadText: {
    fontSize: 14,
    color: designTokens.colors.semantic.primary,
    fontWeight: '500',
    marginLeft: 6,
  },
  allReadContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  allReadText: {
    fontSize: 14,
    color: designTokens.colors.semantic.success,
    fontWeight: '500',
    marginLeft: 6,
  },
  notificationsList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  notificationItem: {
    flexDirection: 'row',
    backgroundColor: designTokens.colors.semantic.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: designTokens.colors.semantic.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  unreadNotification: {
    backgroundColor: 'rgba(111, 76, 170, 0.05)',
  },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: designTokens.colors.semantic.text,
    flex: 1,
    marginRight: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: designTokens.colors.semantic.textSecondary,
  },
  notificationMessage: {
    fontSize: 14,
    color: designTokens.colors.semantic.textSecondary,
    lineHeight: 20,
  },
  notificationImageContainer: {
    marginTop: 12,
  },
  unreadIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: designTokens.colors.semantic.primary,
    position: 'absolute',
    top: 16,
    right: 16,
  },
  emptyStateCard: {
    margin: 20,
    alignItems: 'center',
  },
  emptyStateIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(111, 76, 170, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: designTokens.colors.semantic.text,
    marginBottom: 12,
  },
  emptyStateText: {
    fontSize: 16,
    color: designTokens.colors.semantic.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});
