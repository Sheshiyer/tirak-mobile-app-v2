import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, Animated, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from './Card';
import { designTokens } from '@/constants/design-tokens';

interface ShimmerBoxProps {
  width: number | string;
  height: number;
  style?: ViewStyle;
  borderRadius?: number;
}

const ShimmerBox: React.FC<ShimmerBoxProps> = ({ 
  width, 
  height, 
  style, 
  borderRadius = 8 
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const startAnimation = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: false,
          }),
          Animated.timing(animatedValue, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: false,
          }),
        ])
      ).start();
    };

    startAnimation();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={[{ width: width as any, height, borderRadius, overflow: 'hidden' }, style]}>
      <Animated.View style={{ flex: 1, opacity }}>
        <LinearGradient
          colors={['#E1E9EE', '#F7F8F8', '#E1E9EE']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
    </View>
  );
};

const CompanionProfileShimmer: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Header shimmer */}
      <View style={styles.header}>
        <ShimmerBox 
          width="100%" 
          height={300} 
          borderRadius={0}
          style={styles.headerShimmer}
        />
        
        <View style={styles.headerOverlay}>
          <ShimmerBox width={44} height={44} borderRadius={22} />
          <View style={styles.headerActions}>
            <ShimmerBox width={44} height={44} borderRadius={22} />
            <ShimmerBox width={44} height={44} borderRadius={22} />
          </View>
        </View>
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile card shimmer */}
        <Card style={styles.profileCard} padding={20}>
          <View style={styles.profileHeader}>
            <View style={styles.profileInfo}>
              <ShimmerBox width="80%" height={28} style={styles.marginBottom12} />
              <ShimmerBox width="60%" height={16} style={styles.marginBottom8} />
              <ShimmerBox width="70%" height={16} />
            </View>
            <ShimmerBox width={80} height={80} borderRadius={40} />
          </View>
          
          <ShimmerBox 
            width={120} 
            height={32} 
            borderRadius={16} 
            style={styles.marginBottom16} 
          />
          <ShimmerBox width="40%" height={32} style={styles.marginBottom16} />
          <ShimmerBox 
            width={160} 
            height={48} 
            borderRadius={24} 
            style={styles.centerButton} 
          />
        </Card>
        
        {/* Tabs shimmer */}
        <Card style={styles.tabsCard} padding={0}>
          <View style={styles.tabsHeader}>
            <ShimmerBox width="33%" height={48} borderRadius={0} />
            <ShimmerBox width="33%" height={48} borderRadius={0} />
            <ShimmerBox width="33%" height={48} borderRadius={0} />
          </View>
          <View style={styles.tabContent}>
            <ShimmerBox width="100%" height={20} style={styles.marginBottom12} />
            <ShimmerBox width="100%" height={80} style={styles.marginBottom16} />
            <ShimmerBox width="100%" height={20} style={styles.marginBottom8} />
            <ShimmerBox width="80%" height={20} style={styles.marginBottom16} />
            
            {/* Languages/Services list shimmer */}
            <View style={styles.listShimmer}>
              {Array.from({ length: 4 }).map((_, i) => (
                <View key={i} style={styles.listItem}>
                  <ShimmerBox width={24} height={24} borderRadius={12} />
                  <ShimmerBox width="70%" height={16} />
                </View>
              ))}
            </View>
          </View>
        </Card>
        
        {/* Availability shimmer */}
        <Card style={styles.availabilityCard} padding={20}>
          <ShimmerBox width="50%" height={24} style={styles.marginBottom8} />
          <ShimmerBox width="70%" height={16} style={styles.marginBottom16} />
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.datesShimmer}>
              {Array.from({ length: 7 }).map((_, i) => (
                <ShimmerBox 
                  key={i} 
                  width={60} 
                  height={80} 
                  borderRadius={12} 
                />
              ))}
            </View>
          </ScrollView>
          
          <ShimmerBox 
            width="60%" 
            height={40} 
            borderRadius={8} 
            style={styles.calendarButtonShimmer} 
          />
        </Card>
        
        {/* Additional content shimmer */}
        <Card style={styles.additionalCard} padding={20}>
          <ShimmerBox width="40%" height={20} style={styles.marginBottom16} />
          <View style={styles.additionalContent}>
            {Array.from({ length: 3 }).map((_, i) => (
              <View key={i} style={styles.additionalItem}>
                <ShimmerBox width={60} height={60} borderRadius={8} />
                <View style={styles.additionalText}>
                  <ShimmerBox width="100%" height={16} style={styles.marginBottom8} />
                  <ShimmerBox width="80%" height={14} />
                </View>
              </View>
            ))}
          </View>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: designTokens.colors.semantic.background,
  },
  header: {
    height: 300,
    position: 'relative',
  },
  headerShimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  headerOverlay: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: designTokens.spacing.scale.lg,
    zIndex: 10,
  },
  headerActions: {
    flexDirection: 'row',
    gap: designTokens.spacing.scale.sm,
  },
  content: {
    flex: 1,
    marginTop: -30,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: designTokens.colors.semantic.background,
  },
  profileCard: {
    marginHorizontal: designTokens.spacing.scale.lg,
    marginBottom: designTokens.spacing.scale.md,
    borderRadius: designTokens.borderRadius.components.card,
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: designTokens.spacing.scale.md,
  },
  profileInfo: {
    flex: 1,
    marginRight: designTokens.spacing.scale.md,
  },
  tabsCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  tabsHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: designTokens.colors.semantic.border,
  },
  tabContent: {
    padding: 20,
  },
  listShimmer: {
    gap: 12,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  availabilityCard: {
    marginHorizontal: designTokens.spacing.scale.lg,
    marginBottom: designTokens.spacing.scale.md,
    borderRadius: designTokens.borderRadius.components.card,
  },
  datesShimmer: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 12,
  },
  calendarButtonShimmer: {
    alignSelf: 'center',
    marginTop: 16,
  },
  additionalCard: {
    marginHorizontal: designTokens.spacing.scale.lg,
    marginBottom: designTokens.spacing.scale.xl,
    borderRadius: designTokens.borderRadius.components.card,
  },
  additionalContent: {
    gap: 16,
  },
  additionalItem: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  additionalText: {
    flex: 1,
  },
  // Utility styles
  marginBottom8: {
    marginBottom: 8,
  },
  marginBottom12: {
    marginBottom: 12,
  },
  marginBottom16: {
    marginBottom: 16,
  },
  centerButton: {
    alignSelf: 'center',
  },
});

export default CompanionProfileShimmer; 