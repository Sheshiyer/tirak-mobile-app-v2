import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { designTokens } from '@/constants/design-tokens';
import { Button } from '@/components/ui/Button';
import { RadialGradient } from '@/components/ui/RadialGradient';
import { Logo } from '@/components/ui/Logo';
import { Tagline } from '@/components/ui/Tagline';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useSupplierStore } from '@/stores/supplier-store';
import { usePostHog } from 'posthog-react-native';

export default function SupplierSignup() {
  const router = useRouter();
  const posthog = usePostHog();
  const resetSignupData = useSupplierStore((state) => state.resetSignupData);

  React.useEffect(() => {
    // Reset signup data when entering the signup flow
    resetSignupData();
  }, [resetSignupData]);

  const handleStart = () => {
    posthog.capture('supplier_signup_started');
    router.push('/supplier/signup/basic-info');
  };

  return (
    <SafeAreaView style={styles.container}>
      <RadialGradient style={styles.background} />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Image source={require('@/assets/images/tirak.png')} style={styles.logo} />
        </View>
        
        <View style={styles.card}>
          <Text style={styles.title}>Become a Tirak Supplier</Text>
          
          <Text style={styles.description}>
            Join our platform and connect with customers looking for your services.
            Complete the following steps to create your supplier profile.
          </Text>
          
          <ProgressBar
            currentStep={1}
            totalSteps={8}
            showLabels={true}
            labels={[
              'Start',
              'Info',
              'Verify',
              'Photos',
              'Categories',
              'Services',
              'Regions',
              'Schedule',
            ]}
          />
          
          <View style={styles.stepsContainer}>
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Basic Information</Text>
                <Text style={styles.stepDescription}>
                  Provide your personal details and contact information
                </Text>
              </View>
            </View>
            
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>ID Verification</Text>
                <Text style={styles.stepDescription}>
                  Upload your ID card for verification purposes
                </Text>
              </View>
            </View>
            
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Upload Photos</Text>
                <Text style={styles.stepDescription}>
                  Add photos to showcase your services to potential customers
                </Text>
              </View>
            </View>
            
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>4</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Select Categories</Text>
                <Text style={styles.stepDescription}>
                  Choose categories that best describe your services
                </Text>
              </View>
            </View>
            
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>5</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Services & Pricing</Text>
                <Text style={styles.stepDescription}>
                  Define your services and set your pricing
                </Text>
              </View>
            </View>
            
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>6</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Service Regions</Text>
                <Text style={styles.stepDescription}>
                  Select the regions where you offer your services
                </Text>
              </View>
            </View>
            
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>7</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Set Availability</Text>
                <Text style={styles.stepDescription}>
                  Define your weekly schedule and availability
                </Text>
              </View>
            </View>
            
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>8</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Subscription Payment</Text>
                <Text style={styles.stepDescription}>
                  Choose a subscription plan and complete payment
                </Text>
              </View>
            </View>
          </View>
          
          <Button
            title="Start Registration"
            onPress={handleStart}
            style={styles.button}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginVertical: 24,
  },
  tagline: {
    marginTop: 8,
    color: 'white',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  stepsContainer: {
    marginTop: 24,
    marginBottom: 32,
  },
  stepItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: designTokens.colors.semantic.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: designTokens.colors.semantic.text,
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: designTokens.colors.semantic.textSecondary,
    lineHeight: 20,
  },
  button: {
    marginTop: 16,
  },
  logo: {
    width: 100,
    height: 100,
  },
});