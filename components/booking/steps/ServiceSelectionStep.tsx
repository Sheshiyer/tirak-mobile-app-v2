import { logger } from '@/utils/logger';
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Clock, Star } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BookingStepFooter } from '../BookingStepFooter';
import { useBookingStore, BookingService } from '@/stores/booking-store';
import { useExperiences, Experience } from '@/app/api/companion/experience';
import { designTokens, componentTokens } from '@/constants/design-tokens';
import { useTranslation } from 'react-i18next';
import { formatOriginalCurrencyContext, formatTravelerCurrency } from '@/utils/currency';

interface ServiceSelectionStepProps {
  onNext: () => void;
}

// Convert Experience to BookingService
const experienceToBookingService = (experience: Experience): BookingService => ({
  id: experience.id,
  name: experience.title,
  description: experience.description || '',
  price: experience.price,
  currency: experience.currency,
  duration: Math.ceil(experience.durationMinutes / 60), // Convert minutes to hours
  category: experience.keywords[0] || 'Experience', // Use first keyword as category
  customizations: {
    groupSize: 1,
    addOns: [],
    specialRequirements: [],
  },
});

export const ServiceSelectionStep: React.FC<ServiceSelectionStepProps> = ({ onNext }) => {
  const { bookingData, updateService } = useBookingStore();
  const { t } = useTranslation();
  const [selectedService, setSelectedService] = useState<BookingService | null>(
    bookingData.service
  );

  useEffect(() => {
    if (selectedService) {
      const updatedService = {
        ...selectedService,
        customizations: {
          groupSize: 1,
          addOns: [],
          specialRequirements: [],
        },
      };
      updateService(updatedService);
    }
  }, [selectedService]);

  // Log the companionId for debugging
  logger.log('Current companionId:', bookingData.companionId);

  // // Validate companionId before making the API call
  // const isValidCompanionId = bookingData.companionId && 
  //   typeof bookingData.companionId === 'string' && 
  //   bookingData.companionId.length > 0;

  const { data: experiencesData, isLoading, error } = useExperiences(
     bookingData.companionId
  );

  const services = experiencesData?.data.items.map(experienceToBookingService) || [];

  // // If companionId is invalid, show error
  // if (!isValidCompanionId) {
  //   return (
  //     <View style={styles.container}>
  //       <View style={styles.errorContainer}>
  //         <Text style={styles.errorText}>Invalid companion ID. Please try again.</Text>
  //       </View>
  //     </View>
  //   );
  // }

  const handleServiceSelect = (service: BookingService) => {
    setSelectedService(service);
  };

  const calculateTotalPrice = () => {
    if (!selectedService) return 0;
    return selectedService.price;
  };

  const handleNext = () => {
    if (selectedService) {
      onNext();
    }
  };

  const ServiceCard: React.FC<{ service: BookingService }> = ({ service }) => {
    const isSelected = selectedService?.id === service.id;
    const animatedValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      if (isSelected) {
        // Start gradient animation when selected
        Animated.loop(
          Animated.sequence([
            Animated.timing(animatedValue, {
              toValue: 1,
              duration: 2000,
              useNativeDriver: false,
            }),
            Animated.timing(animatedValue, {
              toValue: 0,
              duration: 2000,
              useNativeDriver: false,
            }),
          ])
        ).start();
      } else {
        // Stop animation when not selected
        animatedValue.setValue(0);
      }
    }, [isSelected]);

    const gradientColors = animatedValue.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [
        designTokens.colors.semantic.primary,
        designTokens.colors.semantic.accent,
        designTokens.colors.semantic.primary,
      ],
    });

    return (
      <TouchableOpacity
        style={[
          styles.serviceCard,
          isSelected && styles.selectedServiceCard,
        ]}
        onPress={() => handleServiceSelect(service)}
        activeOpacity={0.8}
      >
        {isSelected && (
          <Animated.View style={styles.gradientOverlay}>
            <LinearGradient
              colors={[
                designTokens.colors.semantic.primary + '20',
                designTokens.colors.semantic.accent + '30',
                designTokens.colors.semantic.primary + '20',
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientBackground}
            />
          </Animated.View>
        )}

        <View style={styles.serviceCardContent}>
          <View style={styles.serviceHeader}>
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceName}>{service.name}</Text>
              <Text style={styles.serviceDescription} numberOfLines={2}>
                {service.description}
              </Text>
            </View>
            <View style={styles.servicePrice}>
              <Text style={styles.priceText}>{formatTravelerCurrency(service.price, service.currency)}</Text>
              <Text style={styles.priceUnit}>{t('chooseExperience.perPerson')}</Text>
              {formatOriginalCurrencyContext(service.price, service.currency) ? (
                <Text style={styles.sourcePriceText}>{formatOriginalCurrencyContext(service.price, service.currency)}</Text>
              ) : null}
            </View>
          </View>

          <View style={styles.serviceDetails}>
            <View style={styles.serviceDetail}>
              <Clock size={16} color={designTokens.colors.semantic.textSecondary} />
              <Text style={styles.serviceDetailText}>{service.duration} {t('chooseExperience.hours')}</Text>
            </View>
            <View style={styles.serviceDetail}>
              <Star size={16} color={designTokens.colors.semantic.accent} />
              <Text style={styles.serviceDetailText}>{service.category}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('chooseExperience.chooseYourExperience')}</Text>
          <Text style={styles.subtitle}>
            {t('chooseExperience.selectService')}
          </Text>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={designTokens.colors.semantic.primary} />
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{t('chooseExperience.failedToLoadExperiences')}</Text>
          </View>
        ) : services.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{t('chooseExperience.noExperiencesAvailable')}</Text>
          </View>
        ) : (
          <View style={styles.servicesContainer}>
            {services.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </View>
        )}
      </ScrollView>

      <BookingStepFooter
        onNext={handleNext}
        nextTitle={t('chooseExperience.continue')}
        nextDisabled={!selectedService || isLoading || !!error}
        showPrevious={false}
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
  servicesContainer: {
    paddingBottom: designTokens.spacing.scale.xl,
  },
  serviceCard: {
    marginBottom: designTokens.spacing.scale.md,
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: designTokens.borderRadius.components.card,
    backgroundColor: designTokens.colors.semantic.surface,
    ...designTokens.shadows.sm,
    overflow: 'hidden',
    position: 'relative',
  },
  selectedServiceCard: {
    borderColor: designTokens.colors.semantic.primary,
    // ...designTokens.shadows.md,
    transform: [{ scale: 1.02 }],
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  gradientBackground: {
    flex: 1,
  },
  serviceCardContent: {
    padding: designTokens.spacing.scale.lg,
    position: 'relative',
    zIndex: 2,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: designTokens.spacing.scale.md,
  },
  serviceInfo: {
    flex: 1,
    marginRight: designTokens.spacing.scale.md,
  },
  serviceName: {
    ...designTokens.typography.styles.subheading,
    color: designTokens.colors.semantic.text,
    marginBottom: designTokens.spacing.scale.xs,
  },
  serviceDescription: {
    ...designTokens.typography.styles.caption,
    color: designTokens.colors.semantic.textSecondary,
    lineHeight: designTokens.typography.lineHeights.normal * designTokens.typography.sizes.caption,
  },
  servicePrice: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: designTokens.typography.sizes.large,
    fontWeight: designTokens.typography.weights.bold,
    color: designTokens.colors.semantic.primary,
  },
  priceUnit: {
    ...designTokens.typography.styles.caption,
    color: designTokens.colors.semantic.textSecondary,
    fontSize: designTokens.typography.sizes.small,
  },
  sourcePriceText: {
    ...designTokens.typography.styles.caption,
    color: designTokens.colors.semantic.textSecondary,
    fontSize: 10,
    marginTop: 2,
    maxWidth: 120,
    textAlign: 'right',
  },
  serviceDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.scale.md,
  },
  serviceDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.scale.xs,
  },
  serviceDetailText: {
    ...designTokens.typography.styles.caption,
    color: designTokens.colors.semantic.textSecondary,
  },
  footer: {
    padding: designTokens.spacing.scale.lg,
    backgroundColor: designTokens.colors.semantic.surface,
    borderTopWidth: 1,
    borderTopColor: designTokens.colors.semantic.border,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: designTokens.spacing.scale.xl,
  },
  errorContainer: {
    padding: designTokens.spacing.scale.xl,
    alignItems: 'center',
  },
  errorText: {
    color: designTokens.colors.semantic.error,
    textAlign: 'center',
  },
  emptyContainer: {
    padding: designTokens.spacing.scale.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: designTokens.colors.semantic.textSecondary,
    textAlign: 'center',
  },
});
