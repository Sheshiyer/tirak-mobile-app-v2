import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { 
  Calendar, 
  Star, 
  DollarSign, 
  MessageSquare, 
  Eye, 
  CheckCircle,
  Clock,
  ChevronRight
} from 'lucide-react-native';
import { designTokens, componentTokens } from '@/constants/design-tokens';
import { ProfileImage } from '@/components/ui/ProfileImage';
import { SupplierActivity } from '@/mocks/supplier-data';

interface RecentActivityFeedProps {
  activities: SupplierActivity[];
  onActivityPress?: (activity: SupplierActivity) => void;
  maxItems?: number;
}

export const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({
  activities,
  onActivityPress,
  maxItems = 6,
}) => {
  const displayActivities = activities.slice(0, maxItems);

  const getActivityIcon = (type: SupplierActivity['type']) => {
    const iconProps = { size: 20, color: designTokens.colors.semantic.surface };
    
    switch (type) {
      case 'booking_request':
        return <Calendar {...iconProps} />;
      case 'booking_confirmed':
        return <CheckCircle {...iconProps} />;
      case 'booking_completed':
        return <CheckCircle {...iconProps} />;
      case 'review_received':
        return <Star {...iconProps} />;
      case 'profile_view':
        return <Eye {...iconProps} />;
      case 'message_received':
        return <MessageSquare {...iconProps} />;
      case 'payment_received':
        return <DollarSign {...iconProps} />;
      default:
        return <Clock {...iconProps} />;
    }
  };

  const getActivityIconBackground = (type: SupplierActivity['type']) => {
    switch (type) {
      case 'booking_request':
        return [designTokens.colors.reference.purple, '#9B4DFF'];
      case 'booking_confirmed':
        return ['#4ECDC4', '#44A08D'];
      case 'booking_completed':
        return ['#4ECDC4', '#44A08D'];
      case 'review_received':
        return ['#FFB347', '#FF8C42'];
      case 'profile_view':
        return [designTokens.colors.reference.pink, '#FF9A7B'];
      case 'message_received':
        return [designTokens.colors.reference.purple, '#9B4DFF'];
      case 'payment_received':
        return ['#4ECDC4', '#44A08D'];
      default:
        return [designTokens.colors.semantic.textSecondary, designTokens.colors.semantic.textSecondary];
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

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US');
  };

  const handleActivityPress = (activity: SupplierActivity) => {
    if (onActivityPress) {
      onActivityPress(activity);
    }
  };

  if (displayActivities.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Clock size={48} color={designTokens.colors.semantic.textSecondary} />
        <Text style={styles.emptyStateText}>No recent activity</Text>
        <Text style={styles.emptyStateSubtext}>
          Your recent bookings, reviews, and interactions will appear here
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {displayActivities.map((activity) => (
          <TouchableOpacity
            key={activity.id}
            style={[
              styles.activityItem,
              activity.actionRequired && styles.activityItemUrgent
            ]}
            onPress={() => handleActivityPress(activity)}
            activeOpacity={0.7}
          >
            <View style={styles.activityContent}>
              <View style={styles.activityHeader}>
                <View 
                  style={[
                    styles.activityIcon,
                    { backgroundColor: getActivityIconBackground(activity.type)[0] }
                  ]}
                >
                  {getActivityIcon(activity.type)}
                </View>
                
                <View style={styles.activityInfo}>
                  <View style={styles.activityTitleRow}>
                    <Text style={styles.activityTitle}>{activity.title}</Text>
                    <Text style={styles.activityTime}>
                      {formatTimestamp(activity.timestamp)}
                    </Text>
                  </View>
                  
                  <Text style={styles.activityDescription}>
                    {activity.description}
                  </Text>
                  
                  {activity.customerName && (
                    <View style={styles.customerInfo}>
                      <ProfileImage
                        uri={activity.customerImage}
                        size={24}
                        showBadge={false}
                      />
                      <Text style={styles.customerName}>{activity.customerName}</Text>
                    </View>
                  )}
                  
                  {activity.amount && (
                    <Text style={styles.activityAmount}>
                      ฿{formatCurrency(activity.amount)}
                    </Text>
                  )}
                  
                  {activity.rating && (
                    <View style={styles.ratingContainer}>
                      <Star 
                        size={14} 
                        color={designTokens.colors.reference.purple} 
                        fill={designTokens.colors.reference.purple} 
                      />
                      <Text style={styles.ratingText}>{activity.rating}/5</Text>
                    </View>
                  )}
                </View>
              </View>
              
              {activity.actionRequired && (
                <View style={styles.actionIndicator}>
                  <Text style={styles.actionText}>Action Required</Text>
                </View>
              )}
            </View>
            
            <ChevronRight 
              size={16} 
              color={designTokens.colors.semantic.textSecondary} 
            />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    gap: designTokens.spacing.scale.sm,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: designTokens.spacing.scale.xl,
    paddingHorizontal: designTokens.spacing.scale.lg,
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
  activityItem: {
    ...componentTokens.card.default,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: designTokens.spacing.scale.md,
    paddingHorizontal: designTokens.spacing.scale.lg,
  },
  activityItemUrgent: {
    borderLeftWidth: 3,
    borderLeftColor: designTokens.colors.semantic.accent,
  },
  activityContent: {
    flex: 1,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: designTokens.spacing.scale.md,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: designTokens.spacing.scale.xs,
  },
  activityTitle: {
    ...componentTokens.text.body,
    fontWeight: designTokens.typography.weights.semibold,
    flex: 1,
    marginRight: designTokens.spacing.scale.sm,
  },
  activityTime: {
    ...componentTokens.text.caption,
    color: designTokens.colors.semantic.textSecondary,
  },
  activityDescription: {
    ...componentTokens.text.caption,
    marginBottom: designTokens.spacing.scale.xs,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: designTokens.spacing.scale.xs,
  },
  customerName: {
    ...componentTokens.text.caption,
    marginLeft: designTokens.spacing.scale.xs,
    fontWeight: designTokens.typography.weights.medium,
  },
  activityAmount: {
    ...componentTokens.text.body,
    fontWeight: designTokens.typography.weights.semibold,
    color: designTokens.colors.semantic.primary,
    marginBottom: designTokens.spacing.scale.xs,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
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
});
