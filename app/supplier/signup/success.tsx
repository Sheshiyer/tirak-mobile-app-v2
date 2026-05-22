import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Check } from 'lucide-react-native';
import { designTokens } from '@/constants/design-tokens';
import { Button } from '@/components/ui/Button';
import { RadialGradient } from '@/components/ui/RadialGradient';
import { useSupplierStore } from '@/stores/supplier-store';

export default function SuccessScreen() {
  const router = useRouter();
  const { fetchProfile, fetchStats } = useSupplierStore();
  
  useEffect(() => {
    // Fetch supplier profile and stats
    fetchProfile();
    fetchStats();
  }, [fetchProfile, fetchStats]);
  
  const handleGoToDashboard = () => {
    router.push('/supplier/dashboard');
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <RadialGradient style={styles.background} />
      
      <View style={styles.content}>
        <View style={styles.successIconContainer}>
          <Check size={48} color="white" />
        </View>
        
        <Text style={styles.title}>Registration Complete!</Text>
        
        <Text style={styles.message}>
          Congratulations! Your supplier account has been created successfully. You can now start managing your services and accepting bookings.
        </Text>
        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>What's Next?</Text>
          
          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Complete Your Profile</Text>
              <Text style={styles.stepDescription}>
                Add more details to make your profile stand out
              </Text>
            </View>
          </View>
          
          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Set Up Your Services</Text>
              <Text style={styles.stepDescription}>
                Review and refine your service offerings
              </Text>
            </View>
          </View>
          
          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Manage Your Availability</Text>
              <Text style={styles.stepDescription}>
                Update your schedule to maximize bookings
              </Text>
            </View>
          </View>
          
          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>4</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Start Receiving Bookings</Text>
              <Text style={styles.stepDescription}>
                Respond to customer inquiries and bookings
              </Text>
            </View>
          </View>
        </View>
        
        <Button
          title="Go to Dashboard"
          onPress={handleGoToDashboard}
          style={styles.button}
        />
      </View>
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
  content: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: designTokens.colors.semantic.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: 'white',
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 24,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: designTokens.colors.semantic.text,
    marginBottom: 16,
  },
  stepItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: designTokens.colors.semantic.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
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
    width: '100%',
  },
});