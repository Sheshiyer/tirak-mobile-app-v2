import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { RadialGradient } from '@/components/ui/RadialGradient';
import { designTokens } from '@/constants/design-tokens';
import { Briefcase, Globe, LucideIcon, MapPin, Sparkles, User } from 'lucide-react-native';
import { useAuthStoreHydrated } from '@/hooks/useAuthStoreHydrated';
import { useTranslation } from 'react-i18next';
import { changeLanguage, getCurrentLanguage } from '@/utils/i18n';

type RoleChoiceProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  accent: string;
  delay: number;
  onPress: () => void;
};

function RoleChoice({ title, description, icon: Icon, accent, delay, onPress }: RoleChoiceProps) {
  const float = useRef(new Animated.Value(0)).current;
  const pressScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(float, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 1200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();
    return () => loop.stop();
  }, [delay, float]);

  const animatedIconStyle = {
    opacity: float.interpolate({
      inputRange: [0, 1],
      outputRange: [0.82, 1],
    }),
    transform: [
      {
        translateY: float.interpolate({
          inputRange: [0, 1],
          outputRange: [2, -4],
        }),
      },
      {
        rotate: float.interpolate({
          inputRange: [0, 1],
          outputRange: ['-2deg', '3deg'],
        }),
      },
    ],
  };

  const pressIn = () => {
    Animated.spring(pressScale, {
      toValue: 0.98,
      speed: 28,
      bounciness: 5,
      useNativeDriver: true,
    }).start();
  };

  const pressOut = () => {
    Animated.spring(pressScale, {
      toValue: 1,
      speed: 24,
      bounciness: 7,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={[styles.roleCard, { transform: [{ scale: pressScale }] }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${title}. ${description}`}
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        style={styles.roleButton}
      >
        <View style={[styles.roleIconHalo, { backgroundColor: `${accent}18` }]}>
          <Animated.View style={[styles.roleIcon, animatedIconStyle, { backgroundColor: `${accent}24` }]}>
            <Icon size={24} color={accent} strokeWidth={2.4} />
          </Animated.View>
        </View>
        <View style={styles.roleContent}>
          <Text style={styles.roleTitle}>{title}</Text>
          <Text style={styles.roleDescription}>{description}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function AuthScreen() {
  const { isAuthenticated } = useAuthStoreHydrated();
  const { t } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(getCurrentLanguage());

  const toggleLanguage = async () => {
    const newLang = currentLanguage === 'en' ? 'th' : 'en';
    await changeLanguage(newLang);
    setCurrentLanguage(newLang);
  };

  const handleLogin = () => {
    router.push('/auth/login');
  };

  const handleCustomerSignup = () => {
    router.push('/auth/register?role=customer');
  };

  const handleCompanionSignup = () => {
    router.push({
      pathname: '/auth/register',
      params: { role: 'companion' },
    });
  };

  return (
    <RadialGradient variant="primary" style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.languageToggle} onPress={toggleLanguage}>
          <Globe size={20} color={designTokens.colors.semantic.background} />
          <Text style={styles.languageText}>{currentLanguage === 'en' ? 'TH' : 'EN'}</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.logoContainer}>
          <Image source={require('@/assets/images/tirak-logo.png')} style={styles.logo} />
          <View style={styles.heroCard}>
            <Image source={require('@/assets/images/stroll.png')} style={styles.heroImage} />
            <View style={styles.heroScrim} />
            <View style={styles.heroBadge}>
              <MapPin size={14} color="#FFFFFF" />
              <Text style={styles.heroBadgeText}>Verified Thailand guides</Text>
            </View>
            <View style={styles.heroCaption}>
              <Sparkles size={16} color="#FFFFFF" />
              <Text style={styles.heroCaptionText}>Plan the day with someone who knows the place</Text>
            </View>
          </View>
          <Text style={styles.tagline}>{t('getStarted.tagline')}</Text>
        </View>

        <View style={styles.buttonContainer}>
          {!isAuthenticated && (
            <>
              <RoleChoice
                title={t('getStarted.customer.title')}
                description={t('getStarted.customer.description')}
                icon={User}
                accent={designTokens.colors.semantic.primary}
                delay={0}
                onPress={handleCustomerSignup}
              />

              <RoleChoice
                title={t('getStarted.companion.title')}
                description={t('getStarted.companion.description')}
                icon={Briefcase}
                accent={designTokens.colors.semantic.accent}
                delay={500}
                onPress={handleCompanionSignup}
              />
            </>
          )}

          <Button
            title={t('getStarted.alreadyHaveAnAccount')}
            variant="outline"
            onPress={handleLogin}
            fullWidth
            style={styles.loginButton}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{t('getStarted.byContinuing')}</Text>
          <View style={styles.footerLinks}>
            <TouchableOpacity>
              <Text style={styles.link}>{t('getStarted.termsOfService')}</Text>
            </TouchableOpacity>
            <Text style={styles.footerText}>{t('getStarted.and')}</Text>
            <TouchableOpacity>
              <Text style={styles.link}>{t('getStarted.privacyPolicy')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </RadialGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    zIndex: 10,
    position: 'absolute',
    top: 0,
    right: 0,
    left: 0,
  },
  languageToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: designTokens.colors.semantic.accent,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: designTokens.borderRadius.full,
    gap: 8,
  },
  languageText: {
    color: '#FFFFFF',
    fontWeight: designTokens.typography.weights.semibold,
    fontSize: 14,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 92,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 22,
  },
  tagline: {
    fontSize: 16,
    color: designTokens.colors.semantic.text,
    textAlign: 'center',
    fontWeight: '500',
    marginTop: 14,
    opacity: 0.9,
  },
  heroCard: {
    width: '100%',
    height: 158,
    marginTop: 16,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: designTokens.colors.semantic.surface,
    shadowColor: designTokens.colors.semantic.text,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 22,
    elevation: 5,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(17, 24, 39, 0.18)',
  },
  heroBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    minHeight: 32,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(17, 24, 39, 0.42)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  heroCaption: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroCaptionText: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '700',
    flex: 1,
  },
  buttonContainer: {
    width: '100%',
    gap: 14,
  },
  roleCard: {
    borderRadius: 22,
    backgroundColor: designTokens.colors.semantic.surface,
    shadowColor: designTokens.colors.semantic.text,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.11,
    shadowRadius: 20,
    elevation: 4,
  },
  roleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 94,
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  roleIconHalo: {
    width: 62,
    height: 62,
    borderRadius: 31,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  roleIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleContent: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: designTokens.colors.semantic.text,
    marginBottom: 4,
  },
  roleDescription: {
    fontSize: 14,
    color: designTokens.colors.semantic.textSecondary,
  },
  loginButton: {
    marginTop: 16,
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    color: designTokens.colors.semantic.text,
    fontSize: 14,
    opacity: 0.8,
  },
  footerLinks: {
    flexDirection: 'row',
    marginTop: 4,
    columnGap: 4,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  link: {
    color: designTokens.colors.semantic.text,
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  logo: {
    width: 100,
    height: 100,
  },
});
