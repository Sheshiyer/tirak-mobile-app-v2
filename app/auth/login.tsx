import { logger } from '@/utils/logger';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Image, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { z } from 'zod';

import { Logo } from '@/components/ui/Logo';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { designTokens } from '@/constants/design-tokens';
import { ArrowLeft } from 'lucide-react-native';
import { useAuthStore } from '@/stores/auth-store';
import { SimpleInput } from '@/components/ui/SimpleInput';
import { useTranslation } from 'react-i18next';
import { SoundManager } from '@/utils/sound-manager';
import { usePostHog } from 'posthog-react-native';

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export default function LoginScreen() {
  const { t } = useTranslation();
  const posthog = usePostHog();
  const { demo } = useLocalSearchParams<{ demo?: string }>();
  const demoAccount = useMemo(() => {
    if (!__DEV__) return undefined;
    const accounts: Record<string, { email: string }> = {
      customer: { email: 'test.customer.tirak@gmail.com' },
      companion: { email: 'test.companion.tirak@gmail.com' },
    };
    return (demo === 'customer' || demo === 'companion') ? accounts[demo] : undefined;
  }, [demo]);
  
  // Zod schema for login form validation
  const loginSchema = z.object({
    email: z
      .string()
      .min(1, t('login.emailRequired'))
      .email(t('login.emailInvalid')),
    password: z
      .string()
      .min(1, t('login.passwordRequired'))
      .min(6, t('login.passwordMin')),
  });

  type LoginFormData = z.infer<typeof loginSchema>;
  
  const [formData, setFormData] = useState<LoginFormData>({
    email: demoAccount?.email ?? '',
    password: '',
  });
  const [errors, setErrors] = useState<Partial<LoginFormData>>({});
  const { login, demoLogin, isLoading, error: authError } = useAuthStore();
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (demoAccount) {
      setFormData({
        email: demoAccount.email,
        password: '',
      });
    }
  }, [demoAccount]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 10000,
          easing: Easing.linear,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 10000,
          easing: Easing.linear,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, [animatedValue]);

  // Create a slow diagonal pan effect
  const startX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -1],
  });
  const startY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -1],
  });
  const endX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2],
  });
  const endY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2],
  });

  const validateForm = (): boolean => {
    try {
      loginSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<LoginFormData> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as keyof LoginFormData] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const handleInputChange = (field: keyof LoginFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleLogin = async () => {
    if (validateForm()) {
      try {
        await login(formData.email, formData.password);
        posthog.identify(formData.email, {
          $set: { email: formData.email },
          $set_once: { first_login_date: new Date().toISOString() },
        });
        posthog.capture('user_logged_in', { email: formData.email });
        SoundManager.play('loginSuccess');
        router.replace('/(app)');
      } catch (err) {
        logger.warn('Login failed:', err instanceof Error ? err.message : err);
        posthog.capture('$exception', {
          $exception_list: [{ type: (err as Error).name, value: (err as Error).message }],
          $exception_source: 'login',
        });
        // Don't navigate on error - stay on login screen to show error
      }
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleForgotPassword = () => {
    // TODO: Create forgot password screen
    // logger.log('Forgot password pressed');
    router.push('/auth/forgot');
  };

  const handleDemoLogin = async () => {
    try {
      setIsDemoLoading(true);
      await demoLogin('customer');
      SoundManager.play('loginSuccess');
      router.replace('/(app)');
    } catch (error) {
      logger.warn('Demo login failed:', error instanceof Error ? error.message : error);
      // Don't navigate on error - stay on login screen to show error
    } finally {
      setIsDemoLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <AnimatedLinearGradient
        colors={[
          `${designTokens.colors.semantic.primary}70`,
          `${designTokens.colors.reference.lightPink}60`,
          `${designTokens.colors.semantic.secondary}70`,
          `${designTokens.colors.reference.lightPink}60`,
          `${designTokens.colors.semantic.primary}70`,
        ]}
        start={{ x: startX, y: startY }}
        end={{ x: endX, y: endY }}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <ArrowLeft size={24} color={designTokens.colors.semantic.text} />
          </TouchableOpacity>
          
          <View style={styles.header}>
            <Image source={require('@/assets/images/tirak.png')} style={styles.logo} />
            <Text style={styles.title}>{t('login.welcomeBack')}</Text>
            <Text style={styles.subtitle}>{t('login.signInToYourAccount')}</Text>
          </View>
          
          <View style={styles.form}>
            {authError && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{authError}</Text>
              </View>
            )}
            
            <SimpleInput
              label={t('login.email')}
              placeholder={t('login.emailPlaceholder')}
              value={formData.email}
              onChangeText={(text) => handleInputChange('email', text)}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />
            
            <SimpleInput
              label={t('login.password')}
              placeholder={t('login.passwordPlaceholder')}
              value={formData.password}
              onChangeText={(text) => handleInputChange('password', text)}
              secureTextEntry
              error={errors.password}
            />
            
            <TouchableOpacity 
              style={styles.forgotPassword}
              onPress={handleForgotPassword}
            >
              <Text style={styles.forgotPasswordText}>{t('login.forgotPassword')}</Text>
            </TouchableOpacity>
            
            <Button
              title={t('login.login')}
              onPress={handleLogin}
              loading={isLoading}
              fullWidth
              style={styles.button}
            />

            
          </View>
          
          <View style={styles.footer}>
            <Text style={styles.footerText}>{t('login.dontHaveAnAccount')} </Text>
            <TouchableOpacity onPress={() => router.push('/auth/register')}>
              <Text style={styles.footerLink}>{t('login.signUp')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </AnimatedLinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 60,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: designTokens.colors.semantic.text,
    marginTop: 20,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: designTokens.colors.semantic.text,
  },
  form: {
    width: '100%',
    marginBottom: 20,
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: designTokens.colors.semantic.error,
    fontSize: 14,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: designTokens.colors.semantic.accent,
    fontSize: 14,
    fontWeight: '500',
  },
  button: {
    marginTop: 10,
  },
  demoButton: {
    marginTop: 16,
    borderColor: designTokens.colors.semantic.accent,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 'auto',
    paddingVertical: 20,
  },
  footerText: {
    color: designTokens.colors.semantic.text,
    fontSize: 14,
  },
  footerLink: {
    color: designTokens.colors.semantic.primary,
    fontSize: 14,
    fontWeight: '500',
    },
    logo: {
      width: 100,
      height: 100,
    },
});
