import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LockKeyhole } from 'lucide-react-native';

import { BookingStepFooter } from '../BookingStepFooter';
import { Card } from '@/components/ui/Card';
import { designTokens } from '@/constants/design-tokens';

interface PaymentSelectionStepProps {
  onNext: () => void;
  onPrevious: () => void;
}

/**
 * Compatibility screen retained for old navigation references.
 * New booking requests never render this step: checkout becomes available from
 * booking details only after a guide confirms the named itinerary.
 */
export const PaymentSelectionStep: React.FC<PaymentSelectionStepProps> = ({
  onPrevious,
}) => (
  <View style={styles.container}>
    <Card style={styles.card} padding={24}>
      <LockKeyhole size={28} color={designTokens.colors.semantic.primary} />
      <Text style={styles.title}>Payment follows confirmation</Text>
      <Text style={styles.body}>
        Send the booking request first. When the guide confirms the named
        itinerary, secure PromptPay checkout appears in Booking Details.
      </Text>
    </Card>
    <BookingStepFooter
      onPrevious={onPrevious}
      onNext={() => undefined}
      showPrevious
      showNext={false}
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: designTokens.colors.semantic.background,
    padding: designTokens.spacing.scale.lg,
  },
  card: {
    alignItems: 'center',
    gap: designTokens.spacing.scale.md,
  },
  title: {
    ...designTokens.typography.styles.heading,
    color: designTokens.colors.semantic.text,
    textAlign: 'center',
  },
  body: {
    ...designTokens.typography.styles.body,
    color: designTokens.colors.semantic.textSecondary,
    textAlign: 'center',
  },
});
