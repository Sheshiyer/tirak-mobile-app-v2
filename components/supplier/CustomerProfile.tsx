import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { 
  Star, 
  Shield, 
  Heart, 
  Calendar, 
  MessageSquare,
  Phone,
  Eye,
  TrendingUp,
  Award
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '@/components/ui/Card';
import { ProfileImage } from '@/components/ui/ProfileImage';
import { Heading, Subheading, Body, Caption } from '@/components/ui/Typography';
import { designTokens, componentTokens } from '@/constants/design-tokens';
import { BookingRequest } from '@/types/supplier-request';

interface CustomerProfileProps {
  customer: {
    id: string;
    name: string;
    image: string;
    rating: number;
    reviewCount: number;
    verified: boolean;
    joinDate: string;
    isRepeatCustomer: boolean;
    previousBookings: number;
    lastBookingDate?: string;
    phone?: string;
  };
  onMessage?: (customerId: string) => void;
  onCall?: (phone: string) => void;
  onViewProfile?: (customerId: string) => void;
  showActions?: boolean;
  variant?: 'compact' | 'detailed';
}

export const CustomerProfile: React.FC<CustomerProfileProps> = ({
  customer,
  onMessage,
  onCall,
  onViewProfile,
  showActions = true,
  variant = 'detailed',
}) => {
  const formatJoinDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const formatLastBooking = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
      return `${diffDays} days ago`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months > 1 ? 's' : ''} ago`;
    } else {
      const years = Math.floor(diffDays / 365);
      return `${years} year${years > 1 ? 's' : ''} ago`;
    }
  };

  const getTrustLevel = () => {
    let score = 0;
    if (customer.verified) score += 30;
    if (customer.rating >= 4.5) score += 25;
    if (customer.reviewCount >= 10) score += 20;
    if (customer.isRepeatCustomer) score += 25;
    
    if (score >= 80) return { level: 'Excellent', color: designTokens.colors.semantic.success };
    if (score >= 60) return { level: 'Good', color: designTokens.colors.semantic.primary };
    if (score >= 40) return { level: 'Fair', color: designTokens.colors.semantic.warning };
    return { level: 'New', color: designTokens.colors.semantic.textSecondary };
  };

  const trustLevel = getTrustLevel();

  if (variant === 'compact') {
    return (
      <View style={styles.compactContainer}>
        <ProfileImage
          uri={customer.image}
          size="medium"
          style={styles.compactImage}
        />
        
        <View style={styles.compactDetails}>
          <View style={styles.compactNameRow}>
            <Subheading style={styles.compactName}>{customer.name}</Subheading>
            {customer.verified && (
              <Shield size={16} color={designTokens.colors.semantic.success} />
            )}
            {customer.isRepeatCustomer && (
              <Star size={14} color={designTokens.colors.semantic.warning} fill={designTokens.colors.semantic.warning} />
            )}
          </View>
          
          <View style={styles.compactStats}>
            <Star size={12} color="#FFD700" fill="#FFD700" />
            <Caption style={styles.compactRating}>
              {customer.rating} ({customer.reviewCount})
            </Caption>
            {customer.isRepeatCustomer && (
              <Caption style={styles.compactRepeat}>• Repeat</Caption>
            )}
          </View>
        </View>

        {showActions && (
          <View style={styles.compactActions}>
            <TouchableOpacity
              style={styles.compactActionButton}
              onPress={() => onMessage?.(customer.id)}
            >
              <MessageSquare size={16} color={designTokens.colors.semantic.primary} />
            </TouchableOpacity>
            {customer.phone && (
              <TouchableOpacity
                style={styles.compactActionButton}
                onPress={() => onCall?.(customer.phone!)}
              >
                <Phone size={16} color={designTokens.colors.semantic.primary} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  }

  return (
    <Card style={styles.container} padding={16}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.profileSection}>
          <ProfileImage
            uri={customer.image}
            size="large"
            style={styles.profileImage}
          />
          
          <View style={styles.profileDetails}>
            <View style={styles.nameRow}>
              <Heading style={styles.customerName}>{customer.name}</Heading>
              {customer.verified && (
                <Shield size={20} color={designTokens.colors.semantic.success} />
              )}
            </View>
            
            <View style={styles.trustSection}>
              <View style={[styles.trustBadge, { backgroundColor: trustLevel.color + '20' }]}>
                <Award size={14} color={trustLevel.color} />
                <Text style={[styles.trustText, { color: trustLevel.color }]}>
                  {trustLevel.level} Customer
                </Text>
              </View>
            </View>
          </View>
        </View>

        {showActions && (
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onMessage?.(customer.id)}
            >
              <MessageSquare size={20} color={designTokens.colors.semantic.primary} />
            </TouchableOpacity>
            {customer.phone && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => onCall?.(customer.phone!)}
              >
                <Phone size={20} color={designTokens.colors.semantic.primary} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onViewProfile?.(customer.id)}
            >
              <Eye size={20} color={designTokens.colors.semantic.primary} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Star size={16} color="#FFD700" fill="#FFD700" />
          </View>
          <View style={styles.statContent}>
            <Subheading style={styles.statValue}>{customer.rating}</Subheading>
            <Caption style={styles.statLabel}>Rating</Caption>
            <Caption style={styles.statSubtext}>
              {customer.reviewCount} review{customer.reviewCount !== 1 ? 's' : ''}
            </Caption>
          </View>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Calendar size={16} color={designTokens.colors.semantic.primary} />
          </View>
          <View style={styles.statContent}>
            <Subheading style={styles.statValue}>
              {formatJoinDate(customer.joinDate)}
            </Subheading>
            <Caption style={styles.statLabel}>Member Since</Caption>
            <Caption style={styles.statSubtext}>
              {Math.floor((new Date().getTime() - new Date(customer.joinDate).getTime()) / (1000 * 60 * 60 * 24 * 30))} months
            </Caption>
          </View>
        </View>

        {customer.isRepeatCustomer && (
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Heart size={16} color={designTokens.colors.semantic.accent} />
            </View>
            <View style={styles.statContent}>
              <Subheading style={styles.statValue}>{customer.previousBookings}</Subheading>
              <Caption style={styles.statLabel}>Previous Bookings</Caption>
              {customer.lastBookingDate && (
                <Caption style={styles.statSubtext}>
                  Last: {formatLastBooking(customer.lastBookingDate)}
                </Caption>
              )}
            </View>
          </View>
        )}
      </View>

      {/* Repeat Customer Highlight */}
      {customer.isRepeatCustomer && (
        <LinearGradient
          colors={[designTokens.colors.semantic.accent + '20', designTokens.colors.semantic.primary + '20']}
          style={styles.repeatCustomerBanner}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <TrendingUp size={16} color={designTokens.colors.semantic.accent} />
          <View style={styles.repeatCustomerContent}>
            <Body style={styles.repeatCustomerTitle}>Valued Repeat Customer</Body>
            <Caption style={styles.repeatCustomerText}>
              This customer has booked with you {customer.previousBookings} time{customer.previousBookings !== 1 ? 's' : ''} before
              {customer.lastBookingDate && ` • Last booking ${formatLastBooking(customer.lastBookingDate)}`}
            </Caption>
          </View>
        </LinearGradient>
      )}

      {/* Trust Indicators */}
      <View style={styles.trustIndicators}>
        <Caption style={styles.trustTitle}>Trust Indicators:</Caption>
        <View style={styles.trustItems}>
          {customer.verified && (
            <View style={styles.trustItem}>
              <Shield size={12} color={designTokens.colors.semantic.success} />
              <Caption style={styles.trustItemText}>Verified Identity</Caption>
            </View>
          )}
          {customer.rating >= 4.5 && (
            <View style={styles.trustItem}>
              <Star size={12} color="#FFD700" fill="#FFD700" />
              <Caption style={styles.trustItemText}>High Rating</Caption>
            </View>
          )}
          {customer.reviewCount >= 10 && (
            <View style={styles.trustItem}>
              <MessageSquare size={12} color={designTokens.colors.semantic.primary} />
              <Caption style={styles.trustItemText}>Active Reviewer</Caption>
            </View>
          )}
          {customer.isRepeatCustomer && (
            <View style={styles.trustItem}>
              <Heart size={12} color={designTokens.colors.semantic.accent} />
              <Caption style={styles.trustItemText}>Loyal Customer</Caption>
            </View>
          )}
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  // Compact variant styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: designTokens.spacing.scale.sm,
  },
  compactImage: {
    marginRight: designTokens.spacing.scale.sm,
  },
  compactDetails: {
    flex: 1,
  },
  compactNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: designTokens.spacing.scale.xs,
    gap: designTokens.spacing.scale.xs,
  },
  compactName: {
    flex: 1,
  },
  compactStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactRating: {
    marginLeft: designTokens.spacing.scale.xs,
    color: designTokens.colors.semantic.textSecondary,
  },
  compactRepeat: {
    marginLeft: designTokens.spacing.scale.xs,
    color: designTokens.colors.semantic.accent,
    fontWeight: '500',
  },
  compactActions: {
    flexDirection: 'row',
    gap: designTokens.spacing.scale.xs,
  },
  compactActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: designTokens.colors.semantic.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...componentTokens.card.shadow,
  },

  // Detailed variant styles
  container: {
    marginBottom: designTokens.spacing.scale.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: designTokens.spacing.scale.md,
  },
  profileSection: {
    flexDirection: 'row',
    flex: 1,
  },
  profileImage: {
    marginRight: designTokens.spacing.scale.md,
  },
  profileDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: designTokens.spacing.scale.sm,
    gap: designTokens.spacing.scale.xs,
  },
  customerName: {
    flex: 1,
  },
  trustSection: {
    marginBottom: designTokens.spacing.scale.sm,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: designTokens.spacing.scale.sm,
    paddingVertical: designTokens.spacing.scale.xs,
    borderRadius: componentTokens.button.borderRadius,
    alignSelf: 'flex-start',
  },
  trustText: {
    marginLeft: designTokens.spacing.scale.xs,
    fontWeight: '600',
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
    backgroundColor: designTokens.colors.semantic.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...componentTokens.card.shadow,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: designTokens.spacing.scale.sm,
    marginBottom: designTokens.spacing.scale.md,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: designTokens.colors.semantic.surface + '80',
    padding: designTokens.spacing.scale.sm,
    borderRadius: componentTokens.card.borderRadius,
  },
  statIcon: {
    marginRight: designTokens.spacing.scale.sm,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    marginBottom: 2,
  },
  statLabel: {
    color: designTokens.colors.semantic.textSecondary,
    marginBottom: 2,
  },
  statSubtext: {
    color: designTokens.colors.semantic.textSecondary,
    fontSize: 10,
  },
  repeatCustomerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: designTokens.spacing.scale.sm,
    borderRadius: componentTokens.card.borderRadius,
    marginBottom: designTokens.spacing.scale.md,
  },
  repeatCustomerContent: {
    marginLeft: designTokens.spacing.scale.sm,
    flex: 1,
  },
  repeatCustomerTitle: {
    fontWeight: '600',
    color: designTokens.colors.semantic.accent,
    marginBottom: 2,
  },
  repeatCustomerText: {
    color: designTokens.colors.semantic.textSecondary,
  },
  trustIndicators: {
    borderTopWidth: 1,
    borderTopColor: designTokens.colors.semantic.border,
    paddingTop: designTokens.spacing.scale.sm,
  },
  trustTitle: {
    color: designTokens.colors.semantic.textSecondary,
    marginBottom: designTokens.spacing.scale.xs,
    fontWeight: '500',
  },
  trustItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: designTokens.spacing.scale.sm,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: designTokens.colors.semantic.surface,
    paddingHorizontal: designTokens.spacing.scale.sm,
    paddingVertical: designTokens.spacing.scale.xs,
    borderRadius: componentTokens.button.borderRadius,
  },
  trustItemText: {
    marginLeft: designTokens.spacing.scale.xs,
    color: designTokens.colors.semantic.textSecondary,
    fontWeight: '500',
  },
});
