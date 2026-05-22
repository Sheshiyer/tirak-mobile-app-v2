import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { designTokens, componentTokens } from '@/constants/design-tokens';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { MultiSelect } from '@/components/ui/MultiSelect';
import { RadialGradient } from '@/components/ui/RadialGradient';
import { Heading, Subheading, Body, Caption } from '@/components/ui/Typography';
import { useSupplierStore } from '@/stores/supplier-store';
import { mockCategories } from '@/mocks/supplier-data';

export default function CategoriesScreen() {
  const router = useRouter();
  const { signupData, updateSignupData } = useSupplierStore();

  const [error, setError] = useState<string | null>(null);

  // Animation values for organic motion
  const shakeAnimation = useRef(new Animated.Value(0)).current;
  const selectionAnimation = useRef(new Animated.Value(0)).current;
  
  const handleSelectCategory = (categoryId: string) => {
    // Trigger selection animation
    Animated.sequence([
      Animated.timing(selectionAnimation, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(selectionAnimation, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    const isSelected = signupData.categories.includes(categoryId);
    let newCategories: string[];

    if (isSelected) {
      // Remove category if already selected
      newCategories = signupData.categories.filter(id => id !== categoryId);
    } else {
      // Add category if not already selected (max 3)
      if (signupData.categories.length >= 3) {
        setError('You can select up to 3 Cultural Guide specialties');
        // Trigger shake animation for error
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
        return;
      }
      newCategories = [...signupData.categories, categoryId];
    }

    updateSignupData({ categories: newCategories });
    setError(null);
  };
  
  const validate = () => {
    if (signupData.categories.length === 0) {
      setError('Please select at least one Cultural Guide specialty to showcase your expertise');
      // Trigger shake animation for error
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
      return false;
    }

    setError(null);
    return true;
  };

  const handleNext = () => {
    if (validate()) {
      updateSignupData({ step: 5 });
      router.push('/supplier/signup/services');
    }
  };

  const handleBack = () => {
    router.back();
  };
  
  return (
    <RadialGradient variant="appBackground" style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <Animated.ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          style={{ transform: [{ translateX: shakeAnimation }] }}
        >
          <View style={styles.header}>
            <Heading level={1} style={styles.title}>
              Cultural Guide Specialties
            </Heading>
            <Subheading style={styles.subtitle}>
              Choose up to 3 specialties that showcase your expertise as a Local Cultural Guide. This helps travelers find the perfect guide for their interests.
            </Subheading>

            <ProgressBar
              currentStep={4}
              totalSteps={8}
              variant="gradient"
            />
          </View>

          <View style={styles.form}>
            <Animated.View
              style={[
                styles.multiSelectContainer,
                { transform: [{ scale: selectionAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 0.98]
                })}] }
              ]}
            >
              <MultiSelect
                options={mockCategories}
                selectedIds={signupData.categories}
                onSelect={handleSelectCategory}
                title="Cultural Guide Specialties"
                gridLayout={true}
              />
            </Animated.View>

            {error && (
              <Body style={styles.errorText}>{error}</Body>
            )}

            <View style={styles.infoContainer}>
              <Subheading level={3} style={styles.infoTitle}>
                Why specialties matter:
              </Subheading>
              <Body style={styles.infoText}>
                Your specialties help travelers find the perfect Cultural Guide for their interests. Choose areas where you have deep knowledge and can provide authentic Thai cultural experiences.
              </Body>
            </View>

            <View style={styles.selectedContainer}>
              <Subheading level={3} style={styles.selectedTitle}>
                Your selected specialties:
              </Subheading>
              {signupData.categories.length > 0 ? (
                <View style={styles.selectedCategoriesContainer}>
                  {signupData.categories.map(categoryId => {
                    const category = mockCategories.find(c => c.id === categoryId);
                    return (
                      <View key={categoryId} style={styles.selectedCategory}>
                        {category?.icon && (
                          <Text style={styles.selectedCategoryIcon}>{category.icon}</Text>
                        )}
                        <Caption style={styles.selectedCategoryName}>{category?.name}</Caption>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <Caption style={styles.noSelectionText}>No specialties selected yet</Caption>
              )}
            </View>
          </View>

          <View style={styles.actions}>
            <Button
              title="Back"
              onPress={handleBack}
              variant="coralOutline"
              style={styles.backButton}
              size="large"
            />
            <Button
              title="Continue"
              onPress={handleNext}
              variant="coral"
              style={styles.nextButton}
              size="large"
            />
          </View>
        </Animated.ScrollView>
      </SafeAreaView>
    </RadialGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: designTokens.spacing.scale.lg,
    paddingTop: designTokens.spacing.scale.xl,
  },
  header: {
    marginBottom: designTokens.spacing.scale.xl,
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: designTokens.spacing.scale.sm,
    color: designTokens.colors.semantic.text,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: designTokens.spacing.scale.lg,
    color: designTokens.colors.semantic.textSecondary,
    lineHeight: 22,
  },
  form: {
    backgroundColor: designTokens.colors.semantic.surface,
    borderRadius: 16,
    padding: designTokens.spacing.scale.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: designTokens.spacing.scale.lg,
  },
  multiSelectContainer: {
    marginBottom: designTokens.spacing.scale.md,
  },
  errorText: {
    color: designTokens.colors.semantic.error,
    marginTop: designTokens.spacing.scale.sm,
  },
  infoContainer: {
    marginTop: designTokens.spacing.scale.xl,
    backgroundColor: designTokens.colors.semantic.primary + '08',
    borderRadius: 12,
    padding: designTokens.spacing.scale.lg,
    borderWidth: 1,
    borderColor: designTokens.colors.semantic.primary + '15',
  },
  infoTitle: {
    marginBottom: designTokens.spacing.scale.sm,
    color: designTokens.colors.semantic.text,
  },
  infoText: {
    color: designTokens.colors.semantic.textSecondary,
    lineHeight: 20,
  },
  selectedContainer: {
    marginTop: designTokens.spacing.scale.xl,
  },
  selectedTitle: {
    marginBottom: designTokens.spacing.scale.md,
    color: designTokens.colors.semantic.text,
  },
  selectedCategoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: designTokens.spacing.scale.sm,
  },
  selectedCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: designTokens.colors.semantic.accent + '15',
    paddingHorizontal: designTokens.spacing.scale.md,
    paddingVertical: designTokens.spacing.scale.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: designTokens.colors.semantic.accent,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedCategoryIcon: {
    fontSize: 16,
    marginRight: designTokens.spacing.scale.xs,
  },
  selectedCategoryName: {
    color: designTokens.colors.semantic.accent,
    fontWeight: '600',
  },
  noSelectionText: {
    color: designTokens.colors.semantic.textSecondary,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    marginTop: designTokens.spacing.scale.xl,
    marginBottom: designTokens.spacing.scale.lg,
    gap: designTokens.spacing.scale.md,
    paddingHorizontal: designTokens.spacing.scale.sm,
  },
  backButton: {
    flex: 1,
  },
  nextButton: {
    flex: 1,
  },
});