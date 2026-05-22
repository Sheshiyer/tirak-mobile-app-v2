import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { designTokens } from '@/constants/design-tokens';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { WeeklySchedule } from '@/components/ui/WeeklySchedule';
import { useSupplierStore } from '@/stores/supplier-store';

export default function AvailabilityScreen() {
  const router = useRouter();
  const { signupData, updateSignupData } = useSupplierStore();
  
  const [error, setError] = useState<string | null>(null);
  
  const handleUpdateSchedule = (weeklySchedule: any) => {
    updateSignupData({
      availability: {
        ...signupData.availability,
        weeklySchedule,
      },
    });
    setError(null);
  };
  
  const validate = () => {
    // Check if at least one day has time slots
    const hasTimeSlots = Object.values(signupData.availability.weeklySchedule).some(
      (slots) => slots.length > 0
    );
    
    if (!hasTimeSlots) {
      setError('Please set your availability for at least one day');
      return false;
    }
    
    setError(null);
    return true;
  };
  
  const handleNext = () => {
    if (validate()) {
      updateSignupData({ step: 8 });
      router.push('/supplier/signup/payment');
    }
  };
  
  const handleBack = () => {
    router.back();
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Set Availability</Text>
          <Text style={styles.subtitle}>
            Define your weekly schedule and availability. This helps customers know when you're available for bookings.
          </Text>
          
          <ProgressBar
            currentStep={8}
            totalSteps={8}
          />
        </View>
        
        <View style={styles.form}>
          <WeeklySchedule
            schedule={signupData.availability.weeklySchedule}
            onChange={handleUpdateSchedule}
          />
          
          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}
          
          <View style={styles.infoContainer}>
            <Text style={styles.infoTitle}>Availability Tips:</Text>
            <View style={styles.tipItem}>
              <View style={styles.tipBullet} />
              <Text style={styles.tipText}>Set realistic hours that you can consistently maintain</Text>
            </View>
            <View style={styles.tipItem}>
              <View style={styles.tipBullet} />
              <Text style={styles.tipText}>Consider peak hours when customers are likely to book</Text>
            </View>
            <View style={styles.tipItem}>
              <View style={styles.tipBullet} />
              <Text style={styles.tipText}>You can update your availability anytime after registration</Text>
            </View>
            <View style={styles.tipItem}>
              <View style={styles.tipBullet} />
              <Text style={styles.tipText}>Remember to include travel time between bookings</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.actions}>
          <Button
            title="Back"
            onPress={handleBack}
            variant="outline"
            style={styles.backButton}
          />
          <Button
            title="Next"
            onPress={handleNext}
            style={styles.nextButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: designTokens.colors.semantic.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: designTokens.colors.semantic.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: designTokens.colors.semantic.textSecondary,
    marginBottom: 16,
    lineHeight: 22,
  },
  form: {
    backgroundColor: designTokens.colors.semantic.surface,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  errorText: {
    color: designTokens.colors.semantic.error,
    fontSize: 14,
    marginTop: 16,
  },
  infoContainer: {
    marginTop: 24,
    backgroundColor: designTokens.colors.semantic.background,
    borderRadius: 8,
    padding: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: designTokens.colors.semantic.text,
    marginBottom: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: designTokens.colors.semantic.primary,
    marginRight: 8,
  },
  tipText: {
    fontSize: 14,
    color: designTokens.colors.semantic.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 24,
    marginBottom: 16,
    gap: 12,
  },
  backButton: {
    flex: 1,
  },
  nextButton: {
    flex: 1,
  },
});