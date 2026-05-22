import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Check, AlertCircle } from 'lucide-react-native';
import { designTokens } from '@/constants/design-tokens';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useSupplierStore } from '@/stores/supplier-store';

export default function PaymentScreen() {
  const router = useRouter();
  const { signupData, updateSignupData, submitSignup } = useSupplierStore();
  
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'premium' | 'pro'>(
    signupData.subscription.plan
  );
  const [paymentMethod, setPaymentMethod] = useState<'promptpay' | 'credit_card' | 'bank_transfer'>(
    signupData.subscription.paymentMethod
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleSelectPlan = (plan: 'basic' | 'premium' | 'pro') => {
    setSelectedPlan(plan);
    updateSignupData({
      subscription: {
        ...signupData.subscription,
        plan,
      },
    });
  };
  
  const handleSelectPaymentMethod = (method: 'promptpay' | 'credit_card' | 'bank_transfer') => {
    setPaymentMethod(method);
    updateSignupData({
      subscription: {
        ...signupData.subscription,
        paymentMethod: method,
      },
    });
  };
  
  const handleCompletePayment = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Update subscription data
      updateSignupData({
        subscription: {
          ...signupData.subscription,
          paymentComplete: true,
        },
      });
      
      // Submit signup data
      const success = await submitSignup();
      
      if (success) {
        router.push('/supplier/signup/success');
      } else {
        setError('Failed to complete registration. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleBack = () => {
    router.back();
  };
  
  const getPlanPrice = (plan: 'basic' | 'premium' | 'pro') => {
    switch (plan) {
      case 'basic':
        return 499;
      case 'premium':
        return 999;
      case 'pro':
        return 1999;
      default:
        return 0;
    }
  };
  
  const getPlanFeatures = (plan: 'basic' | 'premium' | 'pro') => {
    const features = {
      basic: [
        'Profile listing',
        'Up to 5 photos',
        'Basic analytics',
        'In-app messaging',
        'Standard support',
      ],
      premium: [
        'Everything in Basic',
        'Up to 10 photos',
        'Featured in search results',
        'Advanced analytics',
        'Priority support',
      ],
      pro: [
        'Everything in Premium',
        'Unlimited photos',
        'Top placement in search',
        'Comprehensive analytics',
        'Dedicated support',
        'Custom profile customization',
      ],
    };
    
    return features[plan];
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Subscription Payment</Text>
          <Text style={styles.subtitle}>
            Choose a subscription plan and complete payment to activate your supplier account.
          </Text>
          
          <ProgressBar
            currentStep={8}
            totalSteps={8}
          />
        </View>
        
        <View style={styles.form}>
          <Text style={styles.sectionTitle}>Select a Plan</Text>
          
          <View style={styles.plansContainer}>
            <TouchableOpacity
              style={[
                styles.planCard,
                selectedPlan === 'basic' && styles.selectedPlanCard,
              ]}
              onPress={() => handleSelectPlan('basic')}
            >
              <View style={styles.planHeader}>
                <Text style={styles.planName}>Basic</Text>
                {selectedPlan === 'basic' && (
                  <View style={styles.selectedPlanCheck}>
                    <Check size={16} color="white" />
                  </View>
                )}
              </View>
              <Text style={styles.planPrice}>฿{getPlanPrice('basic')}/month</Text>
              <View style={styles.planFeatures}>
                {getPlanFeatures('basic').map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <View style={styles.featureBullet} />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.planCard,
                selectedPlan === 'premium' && styles.selectedPlanCard,
              ]}
              onPress={() => handleSelectPlan('premium')}
            >
              <View style={styles.planHeader}>
                <Text style={styles.planName}>Premium</Text>
                {selectedPlan === 'premium' && (
                  <View style={styles.selectedPlanCheck}>
                    <Check size={16} color="white" />
                  </View>
                )}
              </View>
              <Text style={styles.planPrice}>฿{getPlanPrice('premium')}/month</Text>
              <View style={styles.planFeatures}>
                {getPlanFeatures('premium').map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <View style={styles.featureBullet} />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.planCard,
                selectedPlan === 'pro' && styles.selectedPlanCard,
              ]}
              onPress={() => handleSelectPlan('pro')}
            >
              <View style={styles.planHeader}>
                <Text style={styles.planName}>Pro</Text>
                {selectedPlan === 'pro' && (
                  <View style={styles.selectedPlanCheck}>
                    <Check size={16} color="white" />
                  </View>
                )}
              </View>
              <Text style={styles.planPrice}>฿{getPlanPrice('pro')}/month</Text>
              <View style={styles.planFeatures}>
                {getPlanFeatures('pro').map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <View style={styles.featureBullet} />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.sectionTitle}>Payment Method</Text>
          
          <View style={styles.paymentMethodsContainer}>
            <TouchableOpacity
              style={[
                styles.paymentMethodCard,
                paymentMethod === 'promptpay' && styles.selectedPaymentMethod,
              ]}
              onPress={() => handleSelectPaymentMethod('promptpay')}
            >
              <Text style={styles.paymentMethodName}>PromptPay</Text>
              {paymentMethod === 'promptpay' && (
                <View style={styles.selectedPaymentCheck}>
                  <Check size={16} color="white" />
                </View>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.paymentMethodCard,
                paymentMethod === 'credit_card' && styles.selectedPaymentMethod,
              ]}
              onPress={() => handleSelectPaymentMethod('credit_card')}
            >
              <Text style={styles.paymentMethodName}>Credit Card</Text>
              {paymentMethod === 'credit_card' && (
                <View style={styles.selectedPaymentCheck}>
                  <Check size={16} color="white" />
                </View>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.paymentMethodCard,
                paymentMethod === 'bank_transfer' && styles.selectedPaymentMethod,
              ]}
              onPress={() => handleSelectPaymentMethod('bank_transfer')}
            >
              <Text style={styles.paymentMethodName}>Bank Transfer</Text>
              {paymentMethod === 'bank_transfer' && (
                <View style={styles.selectedPaymentCheck}>
                  <Check size={16} color="white" />
                </View>
              )}
            </TouchableOpacity>
          </View>
          
          {paymentMethod === 'promptpay' && (
            <View style={styles.promptpayContainer}>
              <Text style={styles.promptpayTitle}>Scan QR Code to Pay</Text>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80' }}
                style={styles.qrCode}
                resizeMode="contain"
              />
              <Text style={styles.promptpayAmount}>
                Amount: ฿{getPlanPrice(selectedPlan)}
              </Text>
              <Text style={styles.promptpayRef}>
                Reference: TIRAK-{Date.now().toString().slice(-6)}
              </Text>
            </View>
          )}
          
          {error && (
            <View style={styles.errorContainer}>
              <AlertCircle size={20} color={designTokens.colors.semantic.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.actions}>
          <Button
            title="Back"
            onPress={handleBack}
            variant="outline"
            style={styles.backButton}
          />
          <Button
            title="Complete Payment"
            onPress={handleCompletePayment}
            style={styles.nextButton}
            loading={isLoading}
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
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: designTokens.colors.semantic.text,
    marginBottom: 16,
    marginTop: 8,
  },
  plansContainer: {
    marginBottom: 24,
  },
  planCard: {
    backgroundColor: designTokens.colors.semantic.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: designTokens.colors.semantic.border,
  },
  selectedPlanCard: {
    borderColor: designTokens.colors.semantic.primary,
    backgroundColor: designTokens.colors.semantic.background,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: designTokens.colors.semantic.text,
  },
  selectedPlanCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: designTokens.colors.semantic.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  planPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: designTokens.colors.semantic.primary,
    marginBottom: 16,
  },
  planFeatures: {
    marginTop: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: designTokens.colors.semantic.primary,
    marginRight: 8,
  },
  featureText: {
    fontSize: 14,
    color: designTokens.colors.semantic.textSecondary,
  },
  paymentMethodsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  paymentMethodCard: {
    backgroundColor: designTokens.colors.semantic.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: designTokens.colors.semantic.border,
    minWidth: 100,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedPaymentMethod: {
    borderColor: designTokens.colors.semantic.primary,
    backgroundColor: designTokens.colors.semantic.primary + '20',
  },
  paymentMethodName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: designTokens.colors.semantic.text,
  },
  selectedPaymentCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: designTokens.colors.semantic.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  promptpayContainer: {
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: designTokens.colors.semantic.surface,
    borderRadius: 12,
    padding: 16,
  },
  promptpayTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: designTokens.colors.semantic.text,
    marginBottom: 16,
  },
  qrCode: {
    width: 200,
    height: 200,
    marginBottom: 16,
  },
  promptpayAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: designTokens.colors.semantic.primary,
    marginBottom: 8,
  },
  promptpayRef: {
    fontSize: 14,
    color: designTokens.colors.semantic.textSecondary,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: designTokens.colors.semantic.error + '20',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  errorText: {
    color: designTokens.colors.semantic.error,
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
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