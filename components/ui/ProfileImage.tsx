import React from 'react';
import { View, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { colors } from '@/constants/colors';
import { Edit, User } from 'lucide-react-native';

interface ProfileImageProps {
  uri?: string;
  size?: 'small' | 'medium' | 'large' | 'xlarge' | number;
  editable?: boolean;
  onEdit?: () => void;
  online?: boolean;
  showBadge?: boolean;
  style?: ViewStyle;
}

export const ProfileImage: React.FC<ProfileImageProps> = ({
  uri,
  size = 'medium',
  editable = false,
  onEdit,
  online = false,
  showBadge,
  style,
}) => {
  const sizeMap = {
    small: 40,
    medium: 60,
    large: 80,
    xlarge: 120,
  };

  const imageSize = typeof size === 'number' ? size : sizeMap[size];
  const editButtonSize = imageSize * 0.3;
  
  return (
    <View style={[styles.container, { width: imageSize, height: imageSize }, style]}>
      {uri ? (
        <Image
          source={{ uri }}
          style={[styles.image, { width: imageSize, height: imageSize, borderRadius: imageSize / 2 }]}
          contentFit="cover"
        />
      ) : (
        <View style={[styles.placeholder, { width: imageSize, height: imageSize, borderRadius: imageSize / 2 }]}>
          <User size={imageSize * 0.45} color={colors.textLight} />
        </View>
      )}
      
      {(online || showBadge) && (
        <View
          style={[
            styles.onlineIndicator,
            {
              width: imageSize * 0.25,
              height: imageSize * 0.25,
              borderRadius: (imageSize * 0.25) / 2,
              bottom: imageSize * 0.05,
              right: imageSize * 0.05,
            },
          ]}
        />
      )}
      
      {editable && (
        <TouchableOpacity
          style={[
            styles.editButton,
            {
              width: editButtonSize,
              height: editButtonSize,
              borderRadius: editButtonSize / 2,
              bottom: -editButtonSize * 0.2,
              right: -editButtonSize * 0.2,
            },
          ]}
          onPress={onEdit}
        >
          <Edit size={editButtonSize * 0.5} color={colors.white} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  image: {
    borderWidth: 3,
    borderColor: colors.white,
  },
  placeholder: {
    borderWidth: 3,
    borderColor: colors.white,
    backgroundColor: colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineIndicator: {
    position: 'absolute',
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.white,
  },
  editButton: {
    position: 'absolute',
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
});
