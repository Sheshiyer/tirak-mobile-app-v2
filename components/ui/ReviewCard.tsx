import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, typography } from '@/constants/colors';
import { Avatar } from '@/components/ui/Avatar';
import { Rating } from '@/components/ui/Rating';
import { MoreHorizontal, ThumbsUp } from 'lucide-react-native';

interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  date: string;
  helpful?: number;
  isHelpful?: boolean;
}

interface ReviewCardProps {
  review: Review;
  onHelpful?: (reviewId: string) => void;
  onMore?: (reviewId: string) => void;
  style?: any;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  onHelpful,
  onMore,
  style,
}) => {
  const handleHelpful = () => {
    onHelpful?.(review.id);
  };

  const handleMore = () => {
    onMore?.(review.id);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Avatar
            uri={review.userAvatar}
            name={review.userName}
            size="md"
          />
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{review.userName}</Text>
            <Text style={styles.date}>{formatDate(review.date)}</Text>
          </View>
        </View>
        
        <View style={styles.headerActions}>
          <Rating value={review.rating} size={14} readonly />
          <TouchableOpacity onPress={handleMore} style={styles.moreButton}>
            <MoreHorizontal size={20} color={colors.textLight} />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.comment}>{review.comment}</Text>

      {(review.helpful !== undefined || onHelpful) && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.helpfulButton,
              review.isHelpful && styles.helpfulButtonActive,
            ]}
            onPress={handleHelpful}
          >
            <ThumbsUp
              size={16}
              color={review.isHelpful ? colors.coral : colors.textLight}
            />
            <Text
              style={[
                styles.helpfulText,
                review.isHelpful && styles.helpfulTextActive,
              ]}
            >
              Helpful {review.helpful ? `(${review.helpful})` : ''}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userDetails: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  userName: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    color: colors.text,
  },
  date: {
    fontSize: typography.sizes.sm,
    color: colors.textLight,
    marginTop: 2,
  },
  headerActions: {
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  moreButton: {
    padding: spacing.sm,
    marginRight: -spacing.sm,
    marginTop: -spacing.sm,
  },
  comment: {
    fontSize: typography.sizes.base,
    color: colors.text,
    lineHeight: typography.lineHeights.relaxed * typography.sizes.base,
    marginBottom: spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  helpfulButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 20,
    backgroundColor: colors.surfaceSecondary,
    gap: spacing.sm,
  },
  helpfulButtonActive: {
    backgroundColor: colors.coral + '20',
  },
  helpfulText: {
    fontSize: typography.sizes.sm,
    color: colors.textLight,
  },
  helpfulTextActive: {
    color: colors.coral,
    fontWeight: typography.weights.medium,
  },
});
