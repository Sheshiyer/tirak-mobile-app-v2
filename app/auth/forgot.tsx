import { logger } from '@/utils/logger';
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Image, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { z } from 'zod';

import { Logo } from '@/components/ui/Logo';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { designTokens } from '@/constants/design-tokens';
import { ArrowLeft } from 'lucide-react-native';
import { useAuthStore } from '@/stores/auth-store';
import { SimpleInput } from '@/components/ui/SimpleInput';
import { useTranslation } from 'react-i18next';
import { requestPasswordReset, PasswordResetError } from '@/app/api/auth/password-reset';

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  
  // Zod schema for forgot password form validation
  const forgotPasswordSchema = z.object({
    identifier: z
      .string()
      .min(1, t('login.emailRequired')),
  });

  type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
  
  const [formData, setFormData] = useState<ForgotPasswordFormData>({
    identifier: '',
  });
  const [errors, setErrors] = useState<Partial<ForgotPasswordFormData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);
  const animatedValue = useRef(new Animated.Value(0)).current;

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
      forgotPasswordSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<ForgotPasswordFormData> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as keyof ForgotPasswordFormData] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const handleInputChange = (field: keyof ForgotPasswordFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    // Clear success and error states when user starts typing
    if (success) setSuccess(false);
    if (error) setError('');
  };

  const handleForgotPassword = async () => {
    if (validateForm()) {
      try {
        setIsLoading(true);
        setError('');
        
        const response = await requestPasswordReset(formData.identifier);

        logger.log('Response:', response);
        
        if (response.success) {
          setSuccess(true);
          // In production, the user would receive a deep link via email/SMS like:
          // tirak://reset-password?token=09da5821-16ac-4187-8910-e984ce1e81d3
          
        //   logger.log('Reset link sent! User will receive deep link via email/SMS');
        //   logger.log('Example link format: tirak://reset-password?token=09da5821-16ac-4187-8910-e984ce1e81d3');
          
        //   // For demo purposes, auto-navigate after 3 seconds
        //   // In production, user would tap the link in their email
        //   setTimeout(() => {
        //     const mockToken = '09da5821-16ac-4187-8910-e984ce1e81d3';
        //     router.push(`/auth/new?token=${mockToken}`);
        //   }, 3000);
        }
      } catch (err) {
        console.error('Password reset request error:', err);
        const resetError = err as PasswordResetError;
        setError(resetError.message || t('login.passwordResetError'));
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleBack = () => {
    router.back();
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
            <Text style={styles.title}>{t('login.resetPassword')}</Text>
            <Text style={styles.subtitle}>{t('login.resetPasswordDescription')}</Text>
          </View>
          
          <View style={styles.form}>
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
            
            {success && (
              <View style={styles.successContainer}>
                <Text style={styles.successText}>{t('login.resetLinkSent')}</Text>
              </View>
            )}
            
            <SimpleInput
              label={t('login.email')}
              placeholder={t('login.emailPlaceholder')}
              value={formData.identifier}
              onChangeText={(text) => handleInputChange('identifier', text)}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.identifier}
            />
            
            <Button
              title={success ? t('login.redirecting') : t('login.reset')}
              onPress={handleForgotPassword}
              loading={isLoading}
              fullWidth
              style={styles.button}
              disabled={success}
            />
            
            {/* Temporary test button for deep link */}
            {/* <Button
              title="Test Deep Link (Dev Only)"
              onPress={() => {
                const testToken = '405f6eb0-bf20-4742-9dce-3ec3276a4fae';
                logger.log('Testing deep link with token:', testToken);
                router.push(`/auth/new?token=${testToken}`);
              }}
              fullWidth
              style={[styles.button, { backgroundColor: 'orange', marginTop: 10 }]}
            /> */}
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
  successContainer: {
    backgroundColor: '#E8F5E8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  successText: {
    color: designTokens.colors.semantic.success,
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