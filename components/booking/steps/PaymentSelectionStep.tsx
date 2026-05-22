import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { 
  CreditCard, 
  Banknote, 
  Smartphone, 
  AlertCircle,
  CheckCircle,
  Info,
} from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BookingStepFooter } from '../BookingStepFooter';
import { useBookingStore, BookingPayment } from '@/stores/booking-store';
import { designTokens, componentTokens } from '@/constants/design-tokens';
import { formatTravelerCurrency } from '@/utils/currency';

interface PaymentSelectionStepProps {
  onNext: () => void;
  onPrevious: () => void;
}

const PAYMENT_METHODS = [
  {
    id: 'cash',
    name: 'Cash Payment',
    description: 'Pay directly to your local guide in cash',
    icon: Banknote,
    recommended: true,
    details: [
      'Most flexible payment method',
      'No additional fees',
      'Immediate transaction',
      'Widely accepted everywhere',
    ],
    steps: [
      'Note the total amount shown above',
      'Prepare exact change or small bills before your experience',
      'Pay your guide at the start of the experience',
      'Ask for a receipt or written confirmation if needed',
    ],
    instructions: 'Bring exact amount or small bills for easy transaction.',
  },
  // {
  //   id: 'promptpay',
  //   name: 'PromptPay QR',
  //   description: 'Scan QR code to pay via Thai banking app',
  //   icon: Smartphone,
  //   recommended: false,
  //   details: [
  //     'Instant digital payment',
  //     'Secure bank transfer',
  //     'No cash handling needed',
  //     'Transaction record available',
  //   ],
  //   instructions: 'QR code will be provided by your companion at meeting.',
  // },
  // {
  //   id: 'bank_transfer',
  //   name: 'Bank Transfer',
  //   description: 'Direct transfer to companion\'s bank account',
  //   icon: CreditCard,
  //   recommended: false,
  //   details: [
  //     'Secure bank-to-bank transfer',
  //     'Full transaction record',
  //     'No cash required',
  //     'May take time to process',
  //   ],
  //   instructions: 'Bank details will be shared after booking confirmation.',
  // },
];

export const PaymentSelectionStep: React.FC<PaymentSelectionStepProps> = ({
  onNext,
  onPrevious,
}) => {
  const { bookingData, updatePayment, calculateTotal } = useBookingStore();
  const [selectedMethod, setSelectedMethod] = useState<string>(
    bookingData.payment?.method || ''
  );

  const totalAmount = calculateTotal();
  const serviceFee = 0;
  const baseAmount = totalAmount;

  const handleMethodSelect = (methodId: string) => {
    setSelectedMethod(methodId);
    
    const paymentData: BookingPayment = {
      method: methodId as 'cash' | 'promptpay' | 'bank_transfer',
      amount: baseAmount,
      serviceFee: serviceFee,
      totalAmount: totalAmount,
      currency: 'THB',
      terms: false,
    };
    
    updatePayment(paymentData);
  };

  const handleNext = () => {
    if (!selectedMethod) {
      Alert.alert('Payment Method Required', 'Please select a payment method to continue.');
      return;
    }
    onNext();
  };

  const PaymentMethodCard: React.FC<{ method: typeof PAYMENT_METHODS[0] }> = ({ method }) => {
    const isSelected = selectedMethod === method.id;
    const IconComponent = method.icon;

    return (
      <TouchableOpacity
        style={[
          styles.paymentMethodCard,
          isSelected && styles.selectedPaymentMethodCard,
        ]}
        onPress={() => handleMethodSelect(method.id)}
      >
        <View style={styles.methodHeader}>
          <View style={styles.methodIcon}>
            <IconComponent 
              size={24} 
              color={isSelected 
                ? designTokens.colors.semantic.surface 
                : designTokens.colors.semantic.primary
              } 
            />
          </View>
          
          <View style={styles.methodInfo}>
            <View style={styles.methodTitleRow}>
              <Text style={[
                styles.methodName,
                isSelected && styles.selectedMethodName,
              ]}>
                {method.name}
              </Text>
              {method.recommended && (
                <View style={styles.recommendedBadge}>
                  <Text style={styles.recommendedText}>Recommended</Text>
                </View>
              )}
            </View>
            <Text style={[
              styles.methodDescription,
              isSelected && styles.selectedMethodDescription,
            ]}>
              {method.description}
            </Text>
          </View>

          <View style={[
            styles.selectionIndicator,
            isSelected && styles.selectedIndicator,
          ]}>
            {isSelected && (
              <CheckCircle size={20} color={designTokens.colors.semantic.surface} />
            )}
          </View>
        </View>

        {isSelected && (
          <View style={styles.methodDetails}>
            <View style={styles.detailsList}>
              {method.details.map((detail, index) => (
                <View key={index} style={styles.detailItem}>
                  <Text style={styles.detailBullet}>•</Text>
                  <Text style={styles.detailText}>{detail}</Text>
                </View>
              ))}
            </View>
            
            <View style={styles.instructionsContainer}>
              <View style={styles.instructionsHeader}>
                <Info size={16} color={designTokens.colors.semantic.accent} />
                <Text style={styles.instructionsTitle}>How to pay:</Text>
              </View>
              {'steps' in method && (method as any).steps ? (
                (method as any).steps.map((step: string, i: number) => (
                  <View key={i} style={styles.instructionStep}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>{i + 1}</Text>
                    </View>
                    <Text style={styles.stepText}>{step}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.instructionsText}>{method.instructions}</Text>
              )}
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Choose Payment Method</Text>
          <Text style={styles.subtitle}>
            Select how you'd like to pay your local guide
          </Text>
        </View>

        {/* Payment Amount Summary */}
        <Card style={styles.amountCard} padding={16}>
          <View style={styles.amountHeader}>
            <CreditCard size={20} color={designTokens.colors.semantic.primary} />
            <Text style={styles.amountTitle}>Payment Summary</Text>
          </View>
          
          <View style={styles.amountDetails}>
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>Service Amount</Text>
              <Text style={styles.amountValue}>{formatTravelerCurrency(baseAmount, 'THB')}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.totalAmountRow}>
              <Text style={styles.totalAmountLabel}>Total to Pay</Text>
              <Text style={styles.totalAmountValue}>{formatTravelerCurrency(totalAmount, 'THB')}</Text>
            </View>
          </View>
        </Card>

        {/* Payment Methods */}
        <View style={styles.methodsContainer}>
          {PAYMENT_METHODS.map((method) => (
            <PaymentMethodCard key={method.id} method={method} />
          ))}
        </View>

        {/* Payment Security Notice */}
        <Card style={styles.securityCard} padding={16}>
          <View style={styles.securityHeader}>
            <AlertCircle size={20} color={designTokens.colors.semantic.accent} />
            <Text style={styles.securityTitle}>Payment Security</Text>
          </View>
          
          <View style={styles.securityContent}>
            <Text style={styles.securityText}>
              • All payments are handled directly between you and your local guide
            </Text>
            <Text style={styles.securityText}>
              • We do not store or process your payment information
            </Text>
            <Text style={styles.securityText}>
              • For disputes, please contact our support team
            </Text>
            <Text style={styles.securityText}>
              • Always verify the amount before making payment
            </Text>
          </View>
        </Card>

        {/* Payment Terms */}
        <Card style={styles.termsCard} padding={16}>
          <Text style={styles.termsTitle}>Payment Terms</Text>
          <View style={styles.termsContent}>
            <Text style={styles.termsText}>
              • Payment is due at the start of your service
            </Text>
            <Text style={styles.termsText}>
              • Cancellation policy applies as per terms and conditions
            </Text>
            <Text style={styles.termsText}>
              • Refunds are processed according to our refund policy
            </Text>
            <Text style={styles.termsText}>
              • Additional expenses (meals, transport, etc.) are separate
            </Text>
          </View>
        </Card>
      </ScrollView>

      <BookingStepFooter
        onPrevious={onPrevious}
        onNext={handleNext}
        nextTitle="Continue"
        nextDisabled={!selectedMethod}
        showPrevious={true}
        showNext={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: designTokens.colors.semantic.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: designTokens.spacing.scale.lg,
  },
  header: {
    paddingVertical: designTokens.spacing.scale.xl,
    alignItems: 'center',
  },
  title: {
    ...designTokens.typography.styles.heading,
    color: designTokens.colors.semantic.text,
    textAlign: 'center',
    marginBottom: designTokens.spacing.scale.sm,
  },
  subtitle: {
    ...designTokens.typography.styles.body,
    color: designTokens.colors.semantic.textSecondary,
    textAlign: 'center',
    lineHeight: designTokens.typography.lineHeights.normal * designTokens.typography.sizes.body,
  },
  amountCard: {
    marginBottom: designTokens.spacing.scale.xl,
    backgroundColor: designTokens.colors.semantic.surface,
    borderRadius: designTokens.borderRadius.components.card,
    borderWidth: 1,
    borderColor: designTokens.colors.semantic.primary + '20',
    ...designTokens.shadows.md,
  },
  amountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.scale.sm,
    marginBottom: designTokens.spacing.scale.md,
  },
  amountTitle: {
    ...designTokens.typography.styles.subheading,
    color: designTokens.colors.semantic.text,
  },
  amountDetails: {
    gap: designTokens.spacing.scale.sm,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 32, // Better touch target
  },
  amountLabel: {
    ...designTokens.typography.styles.caption,
    color: designTokens.colors.semantic.textSecondary,
  },
  amountValue: {
    ...designTokens.typography.styles.caption,
    fontWeight: designTokens.typography.weights.medium,
    color: designTokens.colors.semantic.text,
  },
  divider: {
    height: 1,
    backgroundColor: designTokens.colors.semantic.border,
    marginVertical: designTokens.spacing.scale.md,
  },
  totalAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: designTokens.spacing.scale.sm,
    minHeight: 44, // Better touch target
  },
  totalAmountLabel: {
    ...designTokens.typography.styles.subheading,
    color: designTokens.colors.semantic.text,
    fontSize: designTokens.typography.sizes.body,
  },
  totalAmountValue: {
    ...designTokens.typography.styles.heading,
    color: designTokens.colors.semantic.primary,
    fontSize: designTokens.typography.sizes.large,
  },
  methodsContainer: {
    gap: designTokens.spacing.scale.lg,
    marginBottom: designTokens.spacing.scale.xl,
  },
  paymentMethodCard: {
    borderWidth: 2,
    borderColor: designTokens.colors.semantic.border,
    borderRadius: designTokens.borderRadius.components.card,
    backgroundColor: designTokens.colors.semantic.surface,
    overflow: 'hidden',
    minHeight: 44, // Accessibility touch target
    ...designTokens.shadows.sm,
  },
  selectedPaymentMethodCard: {
    borderColor: designTokens.colors.semantic.primary,
    backgroundColor: designTokens.colors.semantic.primary,
    ...designTokens.shadows.md,
    transform: [{ scale: 1.02 }],
  },
  methodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: designTokens.spacing.scale.lg,
    minHeight: 80, // Better touch target for payment methods
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: designTokens.colors.semantic.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: designTokens.spacing.scale.md,
  },
  methodInfo: {
    flex: 1,
  },
  methodTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.scale.sm,
    marginBottom: designTokens.spacing.scale.xs,
  },
  methodName: {
    ...designTokens.typography.styles.subheading,
    color: designTokens.colors.semantic.text,
    fontSize: designTokens.typography.sizes.body,
  },
  selectedMethodName: {
    color: designTokens.colors.semantic.surface,
  },
  recommendedBadge: {
    paddingHorizontal: designTokens.spacing.scale.sm,
    paddingVertical: designTokens.spacing.scale.xs,
    backgroundColor: designTokens.colors.semantic.accent,
    borderRadius: designTokens.borderRadius.components.button,
    ...designTokens.shadows.sm,
  },
  recommendedText: {
    ...designTokens.typography.styles.caption,
    fontWeight: designTokens.typography.weights.semibold,
    color: designTokens.colors.semantic.surface,
    fontSize: designTokens.typography.sizes.small,
  },
  methodDescription: {
    ...designTokens.typography.styles.caption,
    color: designTokens.colors.semantic.textSecondary,
    lineHeight: designTokens.typography.lineHeights.normal * designTokens.typography.sizes.caption,
  },
  selectedMethodDescription: {
    color: designTokens.colors.semantic.surface + 'CC',
  },
  selectionIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: designTokens.colors.semantic.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...designTokens.shadows.sm,
  },
  selectedIndicator: {
    borderColor: designTokens.colors.semantic.surface,
    backgroundColor: designTokens.colors.semantic.surface,
    ...designTokens.shadows.md,
  },
  methodDetails: {
    borderTopWidth: 1,
    borderTopColor: designTokens.colors.semantic.surface + '30',
    padding: designTokens.spacing.scale.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  detailsList: {
    marginBottom: designTokens.spacing.scale.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: designTokens.spacing.scale.xs,
  },
  detailBullet: {
    ...designTokens.typography.styles.caption,
    color: designTokens.colors.semantic.surface,
    marginRight: designTokens.spacing.scale.sm,
    marginTop: 2,
  },
  detailText: {
    flex: 1,
    ...designTokens.typography.styles.caption,
    color: designTokens.colors.semantic.surface + 'DD',
    lineHeight: designTokens.typography.lineHeights.normal * designTokens.typography.sizes.caption,
  },
  instructionsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: designTokens.borderRadius.components.card,
    padding: designTokens.spacing.scale.md,
    borderWidth: 1,
    borderColor: designTokens.colors.semantic.surface + '30',
  },
  instructionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.scale.xs,
    marginBottom: designTokens.spacing.scale.xs,
  },
  instructionsTitle: {
    ...designTokens.typography.styles.caption,
    fontWeight: designTokens.typography.weights.semibold,
    color: designTokens.colors.semantic.surface,
  },
  instructionsText: {
    ...designTokens.typography.styles.caption,
    color: designTokens.colors.semantic.surface + 'DD',
    lineHeight: designTokens.typography.lineHeights.normal * designTokens.typography.sizes.caption,
  },
  instructionStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 8,
  },
  stepNumber: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: designTokens.colors.semantic.accent,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  stepNumberText: {
    fontSize: 11,
    fontWeight: '700',
    color: designTokens.colors.semantic.surface,
  },
  stepText: {
    flex: 1,
    ...designTokens.typography.styles.caption,
    color: designTokens.colors.semantic.surface + 'DD',
    lineHeight: 18,
  },
  securityCard: {
    marginBottom: designTokens.spacing.scale.lg,
    backgroundColor: designTokens.colors.semantic.surface,
    borderRadius: designTokens.borderRadius.components.card,
    borderWidth: 1,
    borderColor: designTokens.colors.semantic.accent + '20',
    ...designTokens.shadows.md,
  },
  securityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.scale.sm,
    marginBottom: designTokens.spacing.scale.md,
  },
  securityTitle: {
    ...designTokens.typography.styles.subheading,
    color: designTokens.colors.semantic.text,
    fontSize: designTokens.typography.sizes.body,
  },
  securityContent: {
    gap: designTokens.spacing.scale.xs,
  },
  securityText: {
    ...designTokens.typography.styles.caption,
    color: designTokens.colors.semantic.textSecondary,
    lineHeight: designTokens.typography.lineHeights.normal * designTokens.typography.sizes.caption,
  },
  termsCard: {
    marginBottom: designTokens.spacing.scale.xl,
    borderRadius: designTokens.borderRadius.components.card,
    ...designTokens.shadows.md,
  },
  termsTitle: {
    ...designTokens.typography.styles.subheading,
    color: designTokens.colors.semantic.text,
    marginBottom: designTokens.spacing.scale.md,
    fontSize: designTokens.typography.sizes.body,
  },
  termsContent: {
    gap: designTokens.spacing.scale.xs,
  },
  termsText: {
    ...designTokens.typography.styles.caption,
    color: designTokens.colors.semantic.textSecondary,
    lineHeight: designTokens.typography.lineHeights.normal * designTokens.typography.sizes.caption,
  },
  footer: {
    padding: designTokens.spacing.scale.lg,
    backgroundColor: designTokens.colors.semantic.surface,
    borderTopWidth: 1,
    borderTopColor: designTokens.colors.semantic.border,
    ...designTokens.shadows.sm,
  },
  footerButtons: {
    flexDirection: 'row',
    gap: designTokens.spacing.scale.md,
  },
  previousButton: {
    flex: 1,
  },
  nextButton: {
    flex: 2,
  },
});
