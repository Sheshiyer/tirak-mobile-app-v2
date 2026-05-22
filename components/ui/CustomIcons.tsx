import React from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Home,
  Search,
  Calendar,
  MessageCircle,
  Heart,
  User,
} from 'lucide-react-native';

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

// Enhanced Home Icon with custom styling
export const CustomHomeIcon: React.FC<IconProps> = ({
  size = 24,
  color = '#000',
  strokeWidth = 2
}) => (
  <View style={[styles.iconWrapper, { width: size, height: size }]}>
    <Home
      size={size}
      color={color}
      strokeWidth={strokeWidth}
    />
  </View>
);

// Enhanced Search Icon with custom styling
export const CustomSearchIcon: React.FC<IconProps> = ({
  size = 24,
  color = '#000',
  strokeWidth = 2
}) => (
  <View style={[styles.iconWrapper, { width: size, height: size }]}>
    <Search
      size={size}
      color={color}
      strokeWidth={strokeWidth}
    />
  </View>
);

// Enhanced Calendar Icon with custom styling
export const CustomCalendarIcon: React.FC<IconProps> = ({
  size = 24,
  color = '#000',
  strokeWidth = 2
}) => (
  <View style={[styles.iconWrapper, { width: size, height: size }]}>
    <Calendar
      size={size}
      color={color}
      strokeWidth={strokeWidth}
    />
  </View>
);

// Enhanced Heart Icon with custom styling
export const CustomHeartIcon: React.FC<IconProps> = ({
  size = 24,
  color = '#000',
  strokeWidth = 2
}) => (
  <View style={[styles.iconWrapper, { width: size, height: size }]}>
    <Heart
      size={size}
      color={color}
      strokeWidth={strokeWidth}
    />
  </View>
);

// Enhanced Profile Icon with custom styling
export const CustomProfileIcon: React.FC<IconProps> = ({
  size = 24,
  color = '#000',
  strokeWidth = 2
}) => (
  <View style={[styles.iconWrapper, { width: size, height: size }]}>
    <User
      size={size}
      color={color}
      strokeWidth={strokeWidth}
    />
  </View>
);

// Icon mapping for easy access
export const CustomIcons = {
  home: CustomHomeIcon,
  search: CustomSearchIcon,
  calendar: CustomCalendarIcon,
  heart: CustomHeartIcon,
  profile: CustomProfileIcon,
};

export type CustomIconName = keyof typeof CustomIcons;

const styles = StyleSheet.create({
  iconWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
