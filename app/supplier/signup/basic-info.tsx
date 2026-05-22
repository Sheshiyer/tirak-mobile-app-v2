import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { designTokens, componentTokens } from '@/constants/design-tokens';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { FormField } from '@/components/ui/FormField';
import { RadialGradient } from '@/components/ui/RadialGradient';
import { Heading, Subheading, Body, Caption } from '@/components/ui/Typography';
import { useSupplierStore } from '@/stores/supplier-store';

// TypeScript interfaces for Step 1: Basic Information Collection
interface BasicInfoFormData {
  firstName: string;
  lastName: string;
  displayName: string;
  phone: string;
  email: string;
  bio: string;
}

interface ValidationErrors {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  phone?: string;
  email?: string;
  bio?: string;
}

export default function BasicInfoScreen() {
  const router = useRouter();
  const { signupData, updateSignupData } = useSupplierStore();

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Animation values for organic motion
  const shakeAnimation = new Animated.Value(0);
  const fadeAnimation = new Animated.Value(1);

  const handleChange = (field: keyof BasicInfoFormData, value: string) => {
    updateSignupData({
      basicInfo: {
        ...signupData.basicInfo,
        [field]: value,
      },
    });

    // Clear error when field is edited with organic animation
    if (errors[field]) {
      Animated.timing(fadeAnimation, {
        toValue: 0,
        duration: designTokens.animation.duration.fast,
        useNativeDriver: true,
      }).start(() => {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
        Animated.timing(fadeAnimation, {
          toValue: 1,
          duration: designTokens.animation.duration.fast,
          useNativeDriver: true,
        }).start();
      });
    }
  };
  
  // Enhanced validation with cultural tourism context
  const validate = (): boolean => {
    const newErrors: ValidationErrors = {};

    // First name validation
    if (!signupData.basicInfo.firstName.trim()) {
      newErrors.firstName = 'First name is required for your Local Guide profile';
    } else if (signupData.basicInfo.firstName.length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters';
    }

    // Last name validation
    if (!signupData.basicInfo.lastName.trim()) {
      newErrors.lastName = 'Last name is required for verification';
    } else if (signupData.basicInfo.lastName.length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters';
    }

    // Display name validation (what customers see)
    if (!signupData.basicInfo.displayName.trim()) {
      newErrors.displayName = 'Display name is required - this is how customers will see you';
    } else if (signupData.basicInfo.displayName.length < 3) {
      newErrors.displayName = 'Display name must be at least 3 characters';
    }

    // Thai phone number validation
    if (!signupData.basicInfo.phone.trim()) {
      newErrors.phone = 'Phone number is required for customer contact';
    } else {
      const phoneDigits = signupData.basicInfo.phone.replace(/\D/g, '');
      if (!/^(0[689]\d{8}|66[689]\d{8})$/.test(phoneDigits)) {
        newErrors.phone = 'Please enter a valid Thai phone number (08x, 09x, or +66)';
      }
    }

    // Email validation
    if (!signupData.basicInfo.email.trim()) {
      newErrors.email = 'Email is required for account verification';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signupData.basicInfo.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Bio validation with cultural tourism focus
    if (!signupData.basicInfo.bio.trim()) {
      newErrors.bio = 'Bio is required - tell customers about your local expertise';
    } else if (signupData.basicInfo.bio.length < 50) {
      newErrors.bio = `Bio should be at least 50 characters (${signupData.basicInfo.bio.length}/50)`;
    } else if (signupData.basicInfo.bio.length > 300) {
      newErrors.bio = `Bio cannot exceed 300 characters (${signupData.basicInfo.bio.length}/300)`;
    }

    // Trigger shake animation if there are errors
    if (Object.keys(newErrors).length > 0) {
      Animated.sequence([
        Animated.timing(shakeAnimation, {
          toValue: 10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnimation, {
          toValue: -10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnimation, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleNext = () => {
    if (validate()) {
      updateSignupData({ step: 2 });
      router.push('/supplier/signup/verification');
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleFocus = (field: string) => {
    setFocusedField(field);
  };

  const handleBlur = () => {
    setFocusedField(null);
  };

  // Character count for bio with color coding
  const getBioCharacterCount = () => {
    const length = signupData.basicInfo.bio.length;
    const isError = length > 300;
    const isWarning = length > 250;

    return {
      text: `${length}/300 characters`,
      color: isError
        ? designTokens.colors.semantic.error
        : isWarning
          ? designTokens.colors.semantic.warning
          : designTokens.colors.semantic.textSecondary
    };
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <RadialGradient style={styles.background} />

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Heading style={styles.title}>Basic Information</Heading>
            <Body style={styles.subtitle}>
              Tell us about yourself as a Local Guide. This information helps customers understand your expertise and background.
            </Body>

            <ProgressBar
              currentStep={1}
              totalSteps={8}
              variant="gradient"
              showLabels={false}
            />
          </View>
          
          <Animated.View
            style={[
              styles.form,
              {
                transform: [{ translateX: shakeAnimation }],
                opacity: fadeAnimation,
              }
            ]}
          >
            <FormField
              label="First Name"
              placeholder="Enter your first name"
              value={signupData.basicInfo.firstName}
              onChangeText={(text) => handleChange('firstName', text)}
              error={errors.firstName}
              autoCapitalize="words"
              autoComplete="name"
              required
              onFocus={() => handleFocus('firstName')}
              onBlur={handleBlur}
              style={focusedField === 'firstName' ? styles.focusedField : undefined}
            />

            <FormField
              label="Last Name"
              placeholder="Enter your last name"
              value={signupData.basicInfo.lastName}
              onChangeText={(text) => handleChange('lastName', text)}
              error={errors.lastName}
              autoCapitalize="words"
              autoComplete="name"
              required
              onFocus={() => handleFocus('lastName')}
              onBlur={handleBlur}
              style={focusedField === 'lastName' ? styles.focusedField : undefined}
            />

            <View style={styles.fieldContainer}>
              <FormField
                label="Display Name"
                placeholder="How you want to be known to customers"
                value={signupData.basicInfo.displayName}
                onChangeText={(text) => handleChange('displayName', text)}
                error={errors.displayName}
                autoCapitalize="words"
                required
                onFocus={() => handleFocus('displayName')}
                onBlur={handleBlur}
                style={focusedField === 'displayName' ? styles.focusedField : undefined}
              />
              <Caption style={styles.helperText}>
                This will be visible to customers on your Local Guide profile
              </Caption>
            </View>

            <FormField
              label="Phone Number"
              placeholder="Enter your Thai phone number (08x, 09x, or +66)"
              value={signupData.basicInfo.phone}
              onChangeText={(text) => handleChange('phone', text)}
              error={errors.phone}
              keyboardType="phone-pad"
              autoComplete="tel"
              required
              onFocus={() => handleFocus('phone')}
              onBlur={handleBlur}
              style={focusedField === 'phone' ? styles.focusedField : undefined}
            />

            <FormField
              label="Email Address"
              placeholder="Enter your email address"
              value={signupData.basicInfo.email}
              onChangeText={(text) => handleChange('email', text)}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              required
              onFocus={() => handleFocus('email')}
              onBlur={handleBlur}
              style={focusedField === 'email' ? styles.focusedField : undefined}
            />

            <View style={styles.fieldContainer}>
              <FormField
                label="Bio - Tell Your Story"
                placeholder="Share your local expertise, cultural knowledge, and what makes you a great guide. Mention your favorite places, languages you speak, and unique experiences you offer."
                value={signupData.basicInfo.bio}
                onChangeText={(text) => handleChange('bio', text)}
                error={errors.bio}
                multiline
                numberOfLines={6}
                maxLength={300}
                required
                onFocus={() => handleFocus('bio')}
                onBlur={handleBlur}
                style={focusedField === 'bio' ? styles.focusedField : undefined}
              />
              <Caption style={[styles.characterCount, { color: getBioCharacterCount().color }]}>
                {getBioCharacterCount().text}
              </Caption>
            </View>
          </Animated.View>

          <View style={styles.actions}>
            <Button
              title="Continue"
              onPress={handleNext}
              style={styles.nextButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: designTokens.colors.semantic.background,
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: designTokens.spacing.scale.lg,
  },
  header: {
    marginBottom: designTokens.spacing.scale.xl,
  },
  title: {
    ...componentTokens.text.heading,
    marginBottom: designTokens.spacing.scale.sm,
  },
  subtitle: {
    ...componentTokens.text.body,
    color: designTokens.colors.semantic.textSecondary,
    marginBottom: designTokens.spacing.scale.lg,
    lineHeight: designTokens.typography.lineHeights.normal * designTokens.typography.sizes.body,
  },
  form: {
    ...componentTokens.card.default,
    gap: designTokens.spacing.scale.lg,
  },
  fieldContainer: {
    gap: designTokens.spacing.scale.sm,
  },
  focusedField: {
    borderColor: designTokens.colors.semantic.accent,
    borderWidth: 2,
    shadowColor: designTokens.colors.semantic.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  helperText: {
    ...componentTokens.text.caption,
    marginTop: designTokens.spacing.scale.xs,
  },
  characterCount: {
    ...componentTokens.text.caption,
    textAlign: 'right',
    marginTop: designTokens.spacing.scale.xs,
  },
  actions: {
    marginTop: designTokens.spacing.scale.xl,
    marginBottom: designTokens.spacing.scale.lg,
    gap: designTokens.spacing.scale.md,
  },
  nextButton: {
    minHeight: 44, // Accessibility compliance
    borderRadius: designTokens.borderRadius.components.button,
    ...designTokens.shadows.md,
  },
});