import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import colors, { borderRadius, typography } from '@/constants/colors';

interface AvatarProps {
  uri?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  style?: ViewStyle;
  showBorder?: boolean;
  borderColor?: string;
  online?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({
  uri,
  name,
  size = 'md',
  style,
  showBorder = false,
  borderColor = colors.white,
  online = false,
}) => {
  const sizeMap = {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 48,
    xl: 56,
    '2xl': 64,
  };

  const avatarSize = sizeMap[size];
  const borderWidth = showBorder ? 2 : 0;
  const onlineIndicatorSize = avatarSize * 0.25;

  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getFontSize = () => {
    switch (size) {
      case 'xs':
        return typography.sizes.xs;
      case 'sm':
        return typography.sizes.sm;
      case 'md':
        return typography.sizes.base;
      case 'lg':
        return typography.sizes.lg;
      case 'xl':
        return typography.sizes.xl;
      case '2xl':
        return typography.sizes['2xl'];
      default:
        return typography.sizes.base;
    }
  };

  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.avatar,
          {
            width: avatarSize,
            height: avatarSize,
            borderRadius: avatarSize / 2,
            borderWidth,
            borderColor,
          },
        ]}
      >
        {uri ? (
          <Image
            source={{ uri }}
            style={[
              styles.image,
              {
                width: avatarSize - borderWidth * 2,
                height: avatarSize - borderWidth * 2,
                borderRadius: (avatarSize - borderWidth * 2) / 2,
              },
            ]}
            contentFit="cover"
          />
        ) : (
          <View
            style={[
              styles.placeholder,
              {
                width: avatarSize - borderWidth * 2,
                height: avatarSize - borderWidth * 2,
                borderRadius: (avatarSize - borderWidth * 2) / 2,
              },
            ]}
          >
            <Text
              style={[
                styles.initials,
                {
                  fontSize: getFontSize(),
                },
              ]}
            >
              {getInitials(name)}
            </Text>
          </View>
        )}
      </View>
      
      {online && (
        <View
          style={[
            styles.onlineIndicator,
            {
              width: onlineIndicatorSize,
              height: onlineIndicatorSize,
              borderRadius: onlineIndicatorSize / 2,
              right: -2,
              bottom: -2,
            },
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  avatar: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    backgroundColor: colors.neutral200,
  },
  placeholder: {
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: colors.white,
    fontWeight: typography.weights.semibold,
  },
  onlineIndicator: {
    position: 'absolute',
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.white,
  },
});