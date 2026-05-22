import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { 
  Search, 
  Heart, 
  MessageCircle, 
  Calendar, 
  Users, 
  FileText,
  Package,
  Star,
  MapPin,
  Bell,
} from 'lucide-react-native';
import { designTokens } from '@/constants/design-tokens';

export interface EmptyStateProps {
  icon?: React.ComponentType<any>;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: any;
  variant?: 'default' | 'search' | 'favorites' | 'messages' | 'bookings' | 'notifications';
}

const variantConfig = {
  default: {
    icon: Package,
    iconColor: designTokens.colors.semantic.text,
  },
  search: {
    icon: Search,
    iconColor: designTokens.colors.semantic.primary,
  },
  favorites: {
    icon: Heart,
    iconColor: designTokens.colors.semantic.primary,
  },
  messages: {
    icon: MessageCircle,
    iconColor: designTokens.colors.semantic.primary,
  },
  bookings: {
    icon: Calendar,
    iconColor: designTokens.colors.semantic.primary,
  },
  notifications: {
    icon: Bell,
    iconColor: designTokens.colors.semantic.primary,
  },
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: CustomIcon,
  title,
  description,
  actionLabel,
  onAction,
  style,
  variant = 'default',
}) => {
  const config = variantConfig[variant];
  const IconComponent = CustomIcon || config.icon;

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.iconContainer, { backgroundColor: config.iconColor + '20' }]}>
        <IconComponent size={48} color={config.iconColor} />
      </View>
      
      <Text style={styles.title}>{title}</Text>
      
      {description && (
        <Text style={styles.description}>{description}</Text>
      )}
      
      {actionLabel && onAction && (
        <TouchableOpacity style={styles.actionButton} onPress={onAction}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export const SearchEmptyState: React.FC<{ query?: string; onClearSearch?: () => void }> = ({
  query,
  onClearSearch,
}) => {
  return (
    <EmptyState
      variant="search"
      title={query ? `No results for "${query}"` : 'Start your search'}
      description={
        query
          ? 'Try adjusting your search terms or filters'
          : 'Search for companions, services, or locations'
      }
      actionLabel={query ? 'Clear search' : undefined}
      onAction={onClearSearch}
    />
  );
};

export const FavoritesEmptyState: React.FC<{ onBrowse?: () => void }> = ({ onBrowse }) => {
  return (
    <EmptyState
      variant="favorites"
      title="No favorites yet"
      description="Save companions you like to easily find them later"
      actionLabel="Browse companions"
      onAction={onBrowse}
    />
  );
};

export const MessagesEmptyState: React.FC<{ onStartChat?: () => void }> = ({ onStartChat }) => {
  return (
    <EmptyState
      variant="messages"
      title="No messages yet"
      description="Start a conversation with a companion to see your messages here"
      actionLabel="Find companions"
      onAction={onStartChat}
    />
  );
};

export const BookingsEmptyState: React.FC<{ onBook?: () => void }> = ({ onBook }) => {
  return (
    <EmptyState
      variant="bookings"
      title="No bookings yet"
      description="Book a companion to see your appointments here"
      actionLabel="Find companions"
      onAction={onBook}
    />
  );
};

export const NotificationsEmptyState: React.FC = () => {
  return (
    <EmptyState
      variant="notifications"
      title="No notifications"
      description="You're all caught up! New notifications will appear here"
    />
  );
};

export const ReviewsEmptyState: React.FC<{ onWriteReview?: () => void }> = ({ onWriteReview }) => {
  return (
    <EmptyState
      icon={Star}
      title="No reviews yet"
      description="Share your experience to help others make informed decisions"
      actionLabel="Write a review"
      onAction={onWriteReview}
    />
  );
};

export const LocationEmptyState: React.FC<{ onEnableLocation?: () => void }> = ({ onEnableLocation }) => {
  return (
    <EmptyState
      icon={MapPin}
      title="Location access needed"
      description="Enable location services to find companions near you"
      actionLabel="Enable location"
      onAction={onEnableLocation}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: designTokens.spacing.scale.xl,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: designTokens.borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: designTokens.spacing.scale.lg,
  },
  title: {
    fontSize: designTokens.typography.sizes.xlarge,
    fontWeight: '600',
    color: designTokens.colors.semantic.text,
    textAlign: 'center',
    marginBottom: designTokens.spacing.scale.sm,
  },
  description: {
    fontSize: designTokens.typography.sizes.body,
    color: designTokens.colors.semantic.textSecondary,
    textAlign: 'center',
    lineHeight: designTokens.typography.lineHeights.relaxed * designTokens.typography.sizes.body,
    marginBottom: designTokens.spacing.scale.lg,
    maxWidth: 280,
  },
  actionButton: {
    backgroundColor: designTokens.colors.semantic.accent,
    paddingHorizontal: designTokens.spacing.scale.lg,
    paddingVertical: designTokens.spacing.scale.md,
    borderRadius: designTokens.borderRadius.lg,
  },
  actionText: {
    fontSize: designTokens.typography.sizes.body,
    fontWeight: '500',
    color: designTokens.colors.semantic.surface,
  },
});