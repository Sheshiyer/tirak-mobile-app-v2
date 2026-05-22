import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Star } from 'lucide-react-native';
import { designTokens } from '@/constants/design-tokens';

interface RatingProps {
  value: number;
  maxRating?: number;
  size?: number;
  readonly?: boolean;
  showValue?: boolean;
  showCount?: boolean;
  count?: number;
  onRatingChange?: (rating: number) => void;
  style?: ViewStyle;
  starColor?: string;
  emptyStarColor?: string;
}

export const Rating: React.FC<RatingProps> = ({
  value,
  maxRating = 5,
  size = 16,
  readonly = true,
  showValue = false,
  showCount = false,
  count,
  onRatingChange,
  style,
  starColor = designTokens.colors.semantic.accent,
  emptyStarColor = designTokens.colors.semantic.border,
}) => {
  const handleStarPress = (rating: number) => {
    if (!readonly && onRatingChange) {
      onRatingChange(rating);
    }
  };

  const renderStar = (index: number) => {
    const isFilled = index < Math.floor(value);
    const isHalfFilled = index < value && index >= Math.floor(value);
    
    return (
      <TouchableOpacity
        key={index}
        onPress={() => handleStarPress(index + 1)}
        disabled={readonly}
        style={styles.starButton}
      >
        <Star
          size={size}
          color={isFilled || isHalfFilled ? starColor : emptyStarColor}
          fill={isFilled || isHalfFilled ? starColor : 'transparent'}
        />
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.starsContainer}>
        {Array.from({ length: maxRating }, (_, index) => renderStar(index))}
      </View>
      
      {(showValue || showCount) && (
        <View style={styles.textContainer}>
          {showValue && (
            <Text style={styles.valueText}>
              {value.toFixed(1)}
            </Text>
          )}
          {showCount && count !== undefined && (
            <Text style={styles.countText}>
              ({count.toLocaleString()})
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starButton: {
    marginRight: 2,
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: designTokens.spacing.scale.sm,
  },
  valueText: {
    fontSize: designTokens.typography.sizes.small,
    fontWeight: '500',
    color: designTokens.colors.semantic.text,
    marginRight: designTokens.spacing.scale.xs,
  },
  countText: {
    fontSize: designTokens.typography.sizes.small,
    color: designTokens.colors.semantic.textSecondary,
  },
});