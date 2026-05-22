import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { designTokens } from '@/constants/design-tokens';
import {
  CustomHomeIcon,
  CustomSearchIcon,
  CustomCalendarIcon,
  CustomHeartIcon,
  CustomProfileIcon,
} from './CustomIcons';
import {
  MessageCircle,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

// Dynamic tab width and indicator width based on tab count
const getTabWidth = (tabCount: number) => width / tabCount;

interface TabItem {
  name: string;
  label: string;
  icon: { name: string };
}

interface AnimatedTabBarProps {
  activeIndex: number;
  onTabPress: (index: number) => void;
  tabs: TabItem[];
}

export const AnimatedTabBar: React.FC<AnimatedTabBarProps> = ({
  activeIndex,
  onTabPress,
  tabs,
}) => {
  const indicatorAnimation = useRef(new Animated.Value(0)).current;
  const scaleAnimation = useRef(new Animated.Value(1)).current;
  const iconScaleAnimations = useRef(
    tabs.map(() => new Animated.Value(1))
  ).current;
  const labelOpacityAnimations = useRef(
    tabs.map(() => new Animated.Value(0))
  ).current;

  const TAB_WIDTH = getTabWidth(tabs.length);
  const INDICATOR_WIDTH = TAB_WIDTH * 0.6; // 60% of tab width for a nice look

  useEffect(() => {
    // Animate indicator position - FIXED: Use transform instead of useNativeDriver for translateX
    Animated.spring(indicatorAnimation, {
      toValue: activeIndex,
      useNativeDriver: false, // Changed to false for translateX animation
      tension: 100,
      friction: 8,
    }).start();

    // Icon scale and label opacity animations
    iconScaleAnimations.forEach((scaleAnim, index) => {
      const opacityAnim = labelOpacityAnimations[index];

      if (index === activeIndex) {
        // Active tab animations
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1.1,
            useNativeDriver: true,
            tension: 150,
            friction: 6,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        // Inactive tab animations
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 150,
            friction: 6,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
      }
    });
  }, [activeIndex, iconScaleAnimations, labelOpacityAnimations]);

  const indicatorTranslateX = indicatorAnimation.interpolate({
    inputRange: tabs.map((_, index) => index),
    outputRange: tabs.map((_, index) => index * TAB_WIDTH + (TAB_WIDTH - INDICATOR_WIDTH) / 2),
    extrapolate: 'clamp',
  });

  const getCustomIcon = (iconName: string) => {
    switch (iconName) {
      case 'Home':
        return CustomHomeIcon;
      case 'Search':
        return CustomSearchIcon;
      case 'Calendar':
        return CustomCalendarIcon;
      case 'Heart':
        return CustomHeartIcon;
      case 'MessageCircle':
        return MessageCircle; // Keep original for messages
      default:
        return CustomHomeIcon;
    }
  };

  const renderTab = (tab: TabItem, index: number) => {
    const isActive = index === activeIndex;
    const IconComponent = getCustomIcon(tab.icon.name || 'Home');

    return (
      <TouchableOpacity
        key={tab.name}
        style={styles.tab}
        onPress={() => {
          if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          onTabPress(index);
        }}
        activeOpacity={0.7}
      >
        <Animated.View
          style={[
            styles.tabContent,
            {
              transform: [{ scale: iconScaleAnimations[index] }],
            },
          ]}
        >
          {/* Text label positioned ABOVE the icon */}
          {isActive && (
            <Animated.Text
              style={[
                styles.tabLabel,
                {
                  opacity: labelOpacityAnimations[index],
                },
              ]}
            >
              {tab.label}
            </Animated.Text>
          )}

          <View style={styles.iconContainer}>
            <IconComponent
              size={24}
              color={isActive ? designTokens.colors.semantic.accent : designTokens.colors.semantic.textSecondary}
              strokeWidth={isActive ? 2.5 : 2}
            />
          </View>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Tab items */}
      <View style={styles.tabsContainer}>
        {tabs.map(renderTab)}
      </View>

      {/* Animated indicator */}
      <Animated.View
        style={[
          styles.indicator,
          {
            width: INDICATOR_WIDTH,
            transform: [{ translateX: indicatorTranslateX }],
          },
        ]}
      >
        <LinearGradient
          colors={[designTokens.colors.semantic.accent, designTokens.colors.semantic.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.indicatorGradient}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: designTokens.colors.semantic.surface,
    borderTopWidth: 0.5,
    borderTopColor: designTokens.colors.semantic.border,
    elevation: 8,
    shadowColor: designTokens.colors.semantic.text,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    height: Platform.OS === 'ios' ? 85 : 70,
    position: 'relative',
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  tabsContainer: {
    flexDirection: 'row',
    height: Platform.OS === 'ios' ? 65 : 70,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    flexDirection: 'column',
  },
  iconContainer: {
    padding: 6,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    color: designTokens.colors.semantic.accent,
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 2,
    textAlign: 'center',
    letterSpacing: 0.3,
    lineHeight: 12,
  },
  indicator: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 22 : 2,
    height: 3,
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  indicatorGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 1.5,
  },
});
