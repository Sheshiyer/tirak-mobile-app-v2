import React from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '@/components/ui/Button';
import { designTokens } from '@/constants/design-tokens';
import { useTranslation } from 'react-i18next';

// Get screen dimensions for responsive sizing
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Context-aware sizing constants optimized for single-word buttons
const RESPONSIVE_SIZING = {
  // Fixed button widths based on screen context - optimized for single words
  previousButtonWidth: Math.min(screenWidth * 0.32, 120), // 32% of screen width, max 120px
  nextButtonWidth: Math.min(screenWidth * 0.58, 180), // 58% of screen width, max 180px
  singleButtonWidth: Math.min(screenWidth * 0.75, 280), // 75% of screen width, max 280px

  // Context-aware spacing
  containerPadding: Math.min(screenWidth * 0.05, 20), // 5% of screen width, max 20px
  buttonGap: Math.min(screenWidth * 0.04, 16), // 4% of screen width, max 16px

  // Text sizing relative to screen - optimized for readability
  fontSize: Math.min(screenWidth * 0.045, 18), // 4.5% of screen width, max 18px
};

interface BookingStepFooterProps {
  onPrevious?: () => void;
  onNext?: () => void;
  nextTitle?: string;
  previousTitle?: string;
  nextDisabled?: boolean;
  previousDisabled?: boolean;
  showPrevious?: boolean;
  showNext?: boolean;
  nextVariant?: 'primary' | 'secondary' | 'coral' | 'outline';
  previousVariant?: 'primary' | 'secondary' | 'coral' | 'outline';
  nextIcon?: React.ReactNode;
  previousIcon?: React.ReactNode;
  loading?: boolean;
}

export const BookingStepFooter: React.FC<BookingStepFooterProps> = ({
  onPrevious,
  onNext,
  nextTitle = 'Continue',
  previousTitle,
  nextDisabled = false,
  previousDisabled = false,
  showPrevious = true,
  showNext = true,
  nextVariant = 'primary',
  previousVariant = 'outline',
  nextIcon,
  previousIcon,
  loading = false,
}) => {
  const { t } = useTranslation();
  
  // Determine button layout based on context
  const isDoubleButton = showPrevious && showNext;
  const isSingleButton = !showPrevious && showNext;
  
  // Use translated default for previousTitle if not provided
  const displayPreviousTitle = previousTitle || t('common.back');
  return (
    <View style={styles.container}>
      {/* Enhanced gradient background */}
      <LinearGradient
        colors={[
          'rgba(255, 255, 255, 0)',
          'rgba(255, 255, 255, 0.95)',
          designTokens.colors.semantic.surface,
        ]}
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      <View style={styles.content}>
        <View style={[
          styles.buttonContainer,
          isSingleButton && styles.singleButtonContainer,
        ]}>
          {showPrevious && onPrevious && (
            <Button
              title={displayPreviousTitle}
              onPress={onPrevious}
              variant={previousVariant}
              disabled={previousDisabled}
              style={styles.previousButton}
              leftIcon={previousIcon}
              textStyle={styles.buttonText}
            />
          )}

          {showNext && onNext && (
            <Button
              title={nextTitle}
              onPress={onNext}
              variant={nextVariant}
              disabled={nextDisabled || loading}
              loading={loading}
              style={styles.nextButton}
              rightIcon={nextIcon}
              textStyle={styles.buttonText}
            />
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    backgroundColor: 'transparent',
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    height: 120,
  },
  content: {
    paddingHorizontal: RESPONSIVE_SIZING.containerPadding,
    paddingVertical: designTokens.spacing.scale.lg,
    paddingTop: designTokens.spacing.scale.xl,
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: RESPONSIVE_SIZING.buttonGap,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 400, // Maximum container width for larger screens
  },
  singleButtonContainer: {
    justifyContent: 'center',
  },
  previousButton: {
    borderColor: designTokens.colors.semantic.primary,
    borderWidth: 2,
    backgroundColor: 'transparent',

    // Remove flex properties - using fixed width instead
  },
  nextButton: {

    // Remove flex properties - using fixed width instead
  },
  buttonText: {
    fontSize: RESPONSIVE_SIZING.fontSize,
    fontWeight: designTokens.typography.weights.semibold,
    lineHeight: RESPONSIVE_SIZING.fontSize * 1.2,
  },
});
