import { logger } from '@/utils/logger';
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Check, ChevronRight, AlertCircle } from 'lucide-react-native';
import { designTokens } from '@/constants/design-tokens';
import { Button } from '@/components/ui/Button';
import { usePostHog } from 'posthog-react-native';

export default function SubscriptionScreen() {
  const router = useRouter();
  const posthog = usePostHog();

  const [currentPlan, setCurrentPlan] = useState<'basic' | 'premium' | 'pro'>('premium');
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'premium' | 'pro'>(currentPlan);
  
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
  
  const handleSelectPlan = (plan: 'basic' | 'premium' | 'pro') => {
    setSelectedPlan(plan);
  };
  
  const handleUpgrade = () => {
    // In a real app, this would navigate to a payment screen
    logger.log('Upgrade to', selectedPlan);
    const isUpgrade = getPlanPrice(selectedPlan) > getPlanPrice(currentPlan);
    posthog.capture('subscription_plan_upgraded', {
      from_plan: currentPlan,
      to_plan: selectedPlan,
      direction: isUpgrade ? 'upgrade' : 'downgrade',
      new_price: getPlanPrice(selectedPlan),
    });
  };
  
  const handleViewPaymentHistory = () => {
    router.push('/supplier/payments/history');
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Subscription</Text>
          <Text style={styles.subtitle}>
            Manage your subscription plan and payment details.
          </Text>
        </View>
        
        <View style={styles.currentPlanCard}>
          <Text style={styles.currentPlanTitle}>Current Plan</Text>
          <View style={styles.currentPlanDetails}>
            <View>
              <Text style={styles.currentPlanName}>
                {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
              </Text>
              <Text style={styles.currentPlanPrice}>
                ฿{getPlanPrice(currentPlan)}/month
              </Text>
            </View>
            <View style={styles.currentPlanStatus}>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>Active</Text>
              </View>
              <Text style={styles.renewalText}>Renews on June 15, 2025</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.plansSection}>
          <Text style={styles.sectionTitle}>Available Plans</Text>
          
          <View style={styles.plansContainer}>
            <TouchableOpacity
              style={[
                styles.planCard,
                selectedPlan === 'basic' && styles.selectedPlanCard,
                currentPlan === 'basic' && styles.currentPlanCard,
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
                {currentPlan === 'basic' && (
                  <View style={styles.currentPlanBadge}>
                    <Text style={styles.currentPlanBadgeText}>Current</Text>
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
                currentPlan === 'premium' && styles.currentPlanCard,
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
                {currentPlan === 'premium' && (
                  <View style={styles.currentPlanBadge}>
                    <Text style={styles.currentPlanBadgeText}>Current</Text>
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
                currentPlan === 'pro' && styles.currentPlanCard,
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
                {currentPlan === 'pro' && (
                  <View style={styles.currentPlanBadge}>
                    <Text style={styles.currentPlanBadgeText}>Current</Text>
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
        </View>
        
        {selectedPlan !== currentPlan && (
          <View style={styles.upgradeSection}>
            <View style={styles.upgradeInfo}>
              <AlertCircle size={20} color={designTokens.colors.semantic.warning} />
              <Text style={styles.upgradeInfoText}>
                {selectedPlan === 'basic' ? 'Downgrading' : 'Upgrading'} your plan will take effect on your next billing cycle.
              </Text>
            </View>
            <Button
              title={selectedPlan === 'basic' ? 'Downgrade Plan' : 'Upgrade Plan'}
              onPress={handleUpgrade}
              style={styles.upgradeButton}
            />
          </View>
        )}
        
        <TouchableOpacity
          style={styles.paymentHistoryButton}
          onPress={handleViewPaymentHistory}
        >
          <Text style={styles.paymentHistoryText}>View Payment History</Text>
          <ChevronRight size={20} color={designTokens.colors.semantic.primary} />
        </TouchableOpacity>
        
        <View style={styles.cancelSection}>
          <Text style={styles.cancelTitle}>Cancel Subscription</Text>
          <Text style={styles.cancelDescription}>
            If you cancel your subscription, you will lose access to premium features at the end of your current billing cycle.
          </Text>
          <Button
            title="Cancel Subscription"
            onPress={() => {
              // In a real app, this would show a confirmation dialog
              logger.log('Cancel subscription');
              posthog.capture('subscription_cancelled', { current_plan: currentPlan });
            }}
            variant="outline"
            style={styles.cancelButton}
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
    marginTop: 24,
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
  currentPlanCard: {
    backgroundColor: designTokens.colors.semantic.surface,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 24,
  },
  currentPlanTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: designTokens.colors.semantic.text,
    marginBottom: 16,
  },
  currentPlanDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currentPlanName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: designTokens.colors.semantic.primary,
    marginBottom: 4,
  },
  currentPlanPrice: {
    fontSize: 16,
    color: designTokens.colors.semantic.textSecondary,
  },
  currentPlanStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    backgroundColor: designTokens.colors.semantic.success + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  statusText: {
    color: designTokens.colors.semantic.success,
    fontWeight: 'bold',
    fontSize: 12,
  },
  renewalText: {
    fontSize: 12,
    color: designTokens.colors.semantic.textSecondary,
  },
  plansSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: designTokens.colors.semantic.text,
    marginBottom: 16,
  },
  plansContainer: {
    gap: 16,
  },
  planCard: {
    backgroundColor: designTokens.colors.semantic.surface,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: designTokens.colors.semantic.border,
  },
  selectedPlanCard: {
    borderColor: designTokens.colors.semantic.primary,
    backgroundColor: designTokens.colors.semantic.primary + '20',
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
  currentPlanBadge: {
    backgroundColor: designTokens.colors.semantic.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  currentPlanBadgeText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
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
  upgradeSection: {
    backgroundColor: designTokens.colors.semantic.surface,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 24,
  },
  upgradeInfo: {
    flexDirection: 'row',
    backgroundColor: designTokens.colors.semantic.warning + '20',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  upgradeInfoText: {
    fontSize: 14,
    color: designTokens.colors.semantic.warning,
    marginLeft: 8,
    flex: 1,
  },
  upgradeButton: {
    marginTop: 8,
  },
  paymentHistoryButton: {
    backgroundColor: designTokens.colors.semantic.surface,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentHistoryText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: designTokens.colors.semantic.primary,
  },
  cancelSection: {
    backgroundColor: designTokens.colors.semantic.surface,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 24,
  },
  cancelTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: designTokens.colors.semantic.text,
    marginBottom: 8,
  },
  cancelDescription: {
    fontSize: 14,
    color: designTokens.colors.semantic.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  cancelButton: {
    borderColor: designTokens.colors.semantic.error,
  },
});