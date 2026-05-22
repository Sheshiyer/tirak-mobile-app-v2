import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, TouchableOpacity, Animated, Platform } from 'react-native';
import ReAnimated, { useSharedValue, useAnimatedStyle, withSpring, withDelay, withSequence, withTiming } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Button } from '@/components/ui/Button';
import { RadialGradient } from '@/components/ui/RadialGradient';
import { Card } from '@/components/ui/Card';
import { designTokens } from '@/constants/design-tokens';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

type SlideData = {
  id: string;
  title: string;
  description: string;
  image: number;
};

const IMAGE_SPRING = { damping: 20, stiffness: 120, mass: 0.8 };
const TEXT_SPRING = { damping: 24, stiffness: 160 };

const SlideItem = React.memo(function SlideItem({ item, isActive }: { item: SlideData; isActive: boolean }) {
  const imageOpacity = useSharedValue(0);
  const imageY = useSharedValue(50);
  const imageScale = useSharedValue(0.92);
  const textOpacity = useSharedValue(0);
  const textY = useSharedValue(30);

  useEffect(() => {
    if (isActive) {
      imageOpacity.value = withSpring(1, IMAGE_SPRING);
      imageY.value = withSpring(0, IMAGE_SPRING);
      imageScale.value = withSequence(
        withTiming(1.03, { duration: 200 }),
        withSpring(1, { damping: 14, stiffness: 150 })
      );
      textOpacity.value = withDelay(120, withSpring(1, TEXT_SPRING));
      textY.value = withDelay(120, withSpring(0, TEXT_SPRING));
    } else {
      imageOpacity.value = 0;
      imageY.value = 50;
      imageScale.value = 0.92;
      textOpacity.value = 0;
      textY.value = 30;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  const imageAnimStyle = useAnimatedStyle(() => ({
    opacity: imageOpacity.value,
    transform: [
      { translateY: imageY.value },
      { scale: imageScale.value },
    ],
  }));

  const textAnimStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textY.value }],
  }));

  return (
    <View style={styles.slide}>
      <ReAnimated.View style={imageAnimStyle}>
        <View style={styles.imageOuter}>
          <View style={styles.imageCard}>
            <Image source={item.image} style={styles.image} contentFit="cover" />
            <LinearGradient
              colors={['rgba(255,255,255,0.18)', 'rgba(255,255,255,0.04)', 'transparent']}
              locations={[0, 0.4, 0.7]}
              style={styles.glossOverlay}
            />
            <View style={styles.embossBorder} />
          </View>
        </View>
      </ReAnimated.View>

      <ReAnimated.View style={textAnimStyle}>
        <Card style={styles.textCard} padding={24}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </Card>
      </ReAnimated.View>
    </View>
  );
});

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const { t } = useTranslation();

  const onboardingData = useMemo<SlideData[]>(() => [
    {
      id: '1',
      title: t('onboarding.findYourPerfectCompanion'),
      description: t('onboarding.findYourPerfectCompanionDescription'),
      image: require('../../assets/images/stroll.png'),
    },
    {
      id: '2',
      title: t('onboarding.safeAndTrustedConnections'),
      description: t('onboarding.safeAndTrustedConnectionsDescription'),
      image: require('../../assets/images/island.png'),
    },
    {
      id: '3',
      title: t('onboarding.becomeACompanion'),
      description: t('onboarding.becomeACompanionDescription'),
      image: require('../../assets/images/shared.png'),
    },
  ], [t]);

  const handleNext = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (currentIndex < onboardingData.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      flatListRef.current?.scrollToOffset({ offset: nextIndex * width, animated: true });
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.replace('/auth');
  };

  const handleSkip = () => handleComplete();

  const renderItem = useCallback(
    ({ item, index }: { item: SlideData; index: number }) => (
      <SlideItem item={item} isActive={index === currentIndex} />
    ),
    [currentIndex]
  );

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {onboardingData.map((_, index) => {
        const opacity = scrollX.interpolate({
          inputRange: [(index - 1) * width, index * width, (index + 1) * width],
          outputRange: [0.3, 1, 0.3],
          extrapolate: 'clamp',
        });
        const scale = scrollX.interpolate({
          inputRange: [(index - 1) * width, index * width, (index + 1) * width],
          outputRange: [0.8, 1.2, 0.8],
          extrapolate: 'clamp',
        });
        return (
          <Animated.View
            key={index}
            style={[
              styles.dot,
              {
                opacity,
                transform: [{ scale }],
                backgroundColor: index === currentIndex ? designTokens.colors.semantic.text : 'gray',
              },
            ]}
          />
        );
      })}
    </View>
  );

  return (
    <RadialGradient variant="primary" style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image source={require('../../assets/images/tirak.png')} style={styles.logo} />
        </View>
        <TouchableOpacity onPress={handleSkip}>
          <Text style={styles.skipText}>{t('onboarding.skip')}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={onboardingData}
        renderItem={renderItem}
        extraData={currentIndex}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / width);
          if (index !== currentIndex && Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          setCurrentIndex(index);
        }}
      />

      {renderDots()}

      <View style={styles.footer}>
        <Button
          title={currentIndex === onboardingData.length - 1 ? t('onboarding.getStarted') : t('onboarding.next')}
          onPress={handleNext}
          style={styles.button}
          fullWidth
          variant="secondary"
        />
      </View>
    </RadialGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  skipText: {
    fontSize: 16,
    color: designTokens.colors.semantic.text,
    fontWeight: '500',
    opacity: 0.8,
  },
  slide: {
    width,
    alignItems: 'center',
    paddingHorizontal: 20,
    flex: 1,
    justifyContent: 'center',
  },
  imageOuter: {
    width: Math.min(width * 0.85, 480),
    aspectRatio: 4 / 3,
    marginBottom: 30,
    alignSelf: 'center',
    borderRadius: 28,
    ...designTokens.shadows.lg,
    shadowOpacity: 0.2,
  },
  imageCard: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: designTokens.colors.semantic.surface,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  glossOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '55%',
    borderRadius: 28,
  },
  embossBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  textCard: {
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: designTokens.colors.semantic.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: designTokens.colors.semantic.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 30,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 6,
    backgroundColor: designTokens.colors.semantic.text,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  button: {
    marginTop: 20,
  },
  logo: {
    width: 40,
    height: 40,
  },
  logoContainer: {
    width: 50,
    height: 50,
    padding: 10,
    borderRadius: 10,
    backgroundColor: designTokens.colors.semantic.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
