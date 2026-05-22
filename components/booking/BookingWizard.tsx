import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ScrollView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { RadialGradient } from '@/components/ui/RadialGradient';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useBookingStore } from '@/stores/booking-store';
import { designTokens } from '@/constants/design-tokens';
import { ArrowLeft, User, Calendar, Briefcase } from 'lucide-react-native';
import { usePostHog } from 'posthog-react-native';

// Import step components (we'll create these next)
import { ServiceSelectionStep } from './steps/ServiceSelectionStep';
import { DateTimePickerStep } from './steps/DateTimePickerStep';
import { LocationSelectionStep } from './steps/LocationSelectionStep';
import { SpecialRequestsStep } from './steps/SpecialRequestsStep';
import { BookingSummaryStep } from './steps/BookingSummaryStep';
import { PaymentSelectionStep } from './steps/PaymentSelectionStep';
import { BookingConfirmationStep } from './steps/BookingConfirmationStep';

interface BookingWizardProps {
  companionId?: string;
  initialStep?: number;
}

const STEP_LABELS = [
  'Service',
  'Date & Time',
  'Location',
  'Requests',
  'Summary',
  'Payment',
  'Confirmation',
];

export const BookingWizard: React.FC<BookingWizardProps> = ({
  companionId,
  initialStep = 1,
}) => {
  const { companionId: paramCompanionId } = useLocalSearchParams();
  const posthog = usePostHog();
  const {
    bookingData,
    isLoading,
    error,
    nextStep,
    prevStep,
    goToStep,
    setCompanionId,
    resetBooking,
  } = useBookingStore();

  const currentCompanionId = companionId || (paramCompanionId as string);

  useEffect(() => {
    if (currentCompanionId) {
      setCompanionId(currentCompanionId);
      posthog.capture('booking_started', { companion_id: currentCompanionId });
    }
    if (initialStep !== 1) {
      goToStep(initialStep);
    }
  }, [currentCompanionId, initialStep]);

  const handleNext = () => {
    posthog.capture('booking_step_completed', {
      step: bookingData.currentStep,
      step_name: STEP_LABELS[bookingData.currentStep - 1] ?? '',
      companion_id: currentCompanionId,
    });
    nextStep();
  };

  const handlePrevious = () => {
    if (bookingData.currentStep > 1) {
      prevStep();
    }
  };

  const handleClose = () => {
    router.back();
  };

  const renderCurrentStep = () => {
    switch (bookingData.currentStep) {
      case 1:
        return <ServiceSelectionStep onNext={handleNext} />;
      case 2:
        return <DateTimePickerStep onNext={handleNext} onPrevious={handlePrevious} />;
      case 3:
        return <LocationSelectionStep onNext={handleNext} onPrevious={handlePrevious} />;
      case 4:
        return <SpecialRequestsStep onNext={handleNext} onPrevious={handlePrevious} />;
      case 5:
        return <BookingSummaryStep onNext={handleNext} onPrevious={handlePrevious} />;
      case 6:
        return <BookingConfirmationStep onPrevious={handlePrevious} />;
      default:
        return <ServiceSelectionStep onNext={handleNext} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <RadialGradient style={styles.gradient}>
        <View style={styles.progressContainer}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
              accessibilityRole="button"
              accessibilityLabel="Back to guide profile"
            >
              <ArrowLeft size={22} color={designTokens.colors.semantic.text} />
            </TouchableOpacity>

            <View style={styles.progressWrap}>
              <ProgressBar
                currentStep={bookingData.currentStep}
                totalSteps={STEP_LABELS.length}
                labels={STEP_LABELS}
                showLabels={false}
                variant="gradient"
              />
            </View>

            <View style={styles.headerSpacer} />
          </View>
        </View>

        {bookingData.currentStep > 1 && (bookingData.companionData || bookingData.service || bookingData.dateTime) && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.summaryStrip}
            style={styles.summaryStripWrapper}
          >
            {bookingData.companionData && (
              <View style={styles.summaryChip}>
                <User size={12} color={designTokens.colors.semantic.primary} />
                <Text style={styles.summaryChipText} numberOfLines={1}>
                  {bookingData.companionData.name}
                </Text>
              </View>
            )}
            {bookingData.service && (
              <View style={styles.summaryChip}>
                <Briefcase size={12} color={designTokens.colors.semantic.primary} />
                <Text style={styles.summaryChipText} numberOfLines={1}>
                  {bookingData.service.name}
                </Text>
              </View>
            )}
            {bookingData.dateTime?.date && (
              <View style={styles.summaryChip}>
                <Calendar size={12} color={designTokens.colors.semantic.primary} />
                <Text style={styles.summaryChipText} numberOfLines={1}>
                  {new Date(bookingData.dateTime.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                  {bookingData.dateTime.time ? ` · ${bookingData.dateTime.time}` : ''}
                </Text>
              </View>
            )}
          </ScrollView>
        )}

        <View style={styles.content}>
          {renderCurrentStep()}
        </View>
      </RadialGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  progressContainer: {
    paddingHorizontal: designTokens.spacing.scale.lg,
    paddingTop: designTokens.spacing.scale.md,
    paddingBottom: designTokens.spacing.scale.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: designTokens.colors.semantic.border + '30',
  },
  headerRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.scale.md,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: designTokens.colors.semantic.surface,
    borderWidth: 1,
    borderColor: designTokens.colors.semantic.border,
    ...designTokens.shadows.sm,
  },
  progressWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  headerSpacer: {
    width: 44,
    height: 44,
  },
  summaryStripWrapper: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: designTokens.colors.semantic.border + '20',
    maxHeight: 44,
  },
  summaryStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: designTokens.spacing.scale.xl,
    paddingVertical: 8,
    gap: 8,
  },
  summaryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: designTokens.colors.semantic.primary + '12',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: designTokens.colors.semantic.primary + '25',
  },
  summaryChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: designTokens.colors.semantic.primary,
    maxWidth: 120,
  },
  content: {
    flex: 1,
  },
});
