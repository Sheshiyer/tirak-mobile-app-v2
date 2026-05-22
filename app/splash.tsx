import React, { useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, Image, Platform } from 'react-native';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { designTokens } from '@/constants/design-tokens';
import { useAuthStoreHydrated } from '@/hooks/useAuthStoreHydrated';

const { width, height } = Dimensions.get('window');

const PARTICLES = [
  { left: width * 0.15, size: 8, delay: 0 },
  { left: width * 0.5, size: 6, delay: 150 },
  { left: width * 0.8, size: 10, delay: 80 },
];

function Particle({ left, size, delay }: { left: number; size: number; delay: number }) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(0.5, { duration: 400 }));
    translateY.value = withDelay(
      delay,
      withTiming(-height * 0.3, { duration: 800, easing: Easing.out(Easing.quad) })
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          bottom: height * 0.2,
          left,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: designTokens.colors.semantic.primary,
        },
        style,
      ]}
    />
  );
}

export default function SplashScreen() {
  const { isHydrated, isAuthenticated, onboarded } = useAuthStoreHydrated();

  const bgOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.3);
  const logoOpacity = useSharedValue(0);
  const glowScale = useSharedValue(0.5);
  const glowOpacity = useSharedValue(0);
  const word1Opacity = useSharedValue(0);
  const word2Opacity = useSharedValue(0);
  const screenOpacity = useSharedValue(1);

  const navigateAfterSplash = useCallback(() => {
    if (isAuthenticated) {
      router.replace('/(app)');
    } else if (onboarded) {
      router.replace('/auth');
    } else {
      router.replace('/onboarding');
    }
  }, [isAuthenticated, onboarded]);

  // Act sequence — runs once on mount
  useEffect(() => {
    // Act 1 (0–800ms): background blooms in
    bgOpacity.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.quad) });

    // Act 2 (800–1600ms): logo spring-in
    logoScale.value = withDelay(800, withSpring(1, { damping: 12, stiffness: 100 }));
    logoOpacity.value = withDelay(800, withTiming(1, { duration: 400 }));

    // Act 2: glow ring pulse (900–1800ms)
    glowOpacity.value = withDelay(
      900,
      withSequence(
        withTiming(0.45, { duration: 500 }),
        withTiming(0.12, { duration: 400 })
      )
    );
    glowScale.value = withDelay(
      900,
      withTiming(1.5, { duration: 900, easing: Easing.out(Easing.cubic) })
    );

    // Act 3 (1800–2400ms): tagline stagger
    word1Opacity.value = withDelay(1800, withTiming(1, { duration: 350 }));
    word2Opacity.value = withDelay(2150, withTiming(1, { duration: 350 }));
  }, []);

  // Navigation — waits for hydration, minimum 2800ms
  useEffect(() => {
    if (!isHydrated) return;

    const timer = setTimeout(() => {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      screenOpacity.value = withTiming(0, { duration: 400 }, () => {
        runOnJS(navigateAfterSplash)();
      });
    }, 2800);

    return () => clearTimeout(timer);
  }, [isHydrated, isAuthenticated, onboarded]);

  const bgStyle = useAnimatedStyle(() => ({ opacity: bgOpacity.value }));
  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: glowScale.value }],
  }));
  const word1Style = useAnimatedStyle(() => ({ opacity: word1Opacity.value }));
  const word2Style = useAnimatedStyle(() => ({ opacity: word2Opacity.value }));
  const screenStyle = useAnimatedStyle(() => ({ opacity: screenOpacity.value }));

  return (
    <Animated.View style={[styles.container, screenStyle]}>
      {/* Background: karst mountains + gradient overlay */}
      <Animated.View style={[StyleSheet.absoluteFill, bgStyle]}>
        <Image
          source={require('@/assets/images/splash-bg.png')}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
        <View style={[StyleSheet.absoluteFill, styles.overlay]} />
      </Animated.View>

      {/* Act 1: floating particles */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {PARTICLES.map((p, i) => (
          <Particle key={i} {...p} />
        ))}
      </View>

      {/* Act 2: logo + glow ring */}
      <View style={styles.logoContainer}>
        <Animated.View style={[styles.glowRing, glowStyle]} />
        <Animated.View style={logoStyle}>
          <Image
            source={require('@/assets/images/tirak-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>
      </View>

      {/* Act 3: tagline */}
      <View style={styles.taglineRow}>
        <Animated.Text style={[styles.taglineText, word1Style]}>
          Authentic experiences.{'  '}
        </Animated.Text>
        <Animated.Text style={[styles.taglineText, word2Style]}>
          Local moments.
        </Animated.Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#14082A',
  },
  overlay: {
    backgroundColor: 'rgba(20, 8, 42, 0.55)',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  glowRing: {
    position: 'absolute',
    width: 138,
    height: 138,
    borderRadius: 69,
    borderWidth: 2,
    borderColor: designTokens.colors.semantic.primary,
  },
  logo: {
    width: 100,
    height: 100,
  },
  taglineRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  taglineText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.88)',
    fontWeight: '500',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
});
