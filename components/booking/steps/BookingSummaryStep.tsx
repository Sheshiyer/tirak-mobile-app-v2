import { logger } from '@/utils/logger';
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
  CheckCircle, 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  MessageSquare,
  CreditCard,
  Edit3,
} from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BookingStepFooter } from '../BookingStepFooter';
import { ProfileImage } from '@/components/ui/ProfileImage';
import { useBookingStore } from '@/stores/booking-store';
import { designTokens, componentTokens } from '@/constants/design-tokens';
import { useCreateBooking } from '@/app/api/booking/booking';
import { useTranslation } from 'react-i18next';
import { convertCurrency, formatOriginalCurrencyContext, formatTravelerCurrency } from '@/utils/currency';
import { usePostHog } from 'posthog-react-native';

interface BookingSummaryStepProps {
  onNext: () => void;
  onPrevious: () => void;
}

const BookingSummaryDisplay = ({ data }: { data: any }) => {
  const { t } = useTranslation();
  if (!data) return null;
  
  return (
    <View style={styles.summaryContainer}>
      {/* Service Details */}
      {data.service && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('bookingSummary.service')}</Text>
          <Text style={styles.sectionContent}>{data.service.name}</Text>
          <Text style={styles.sectionPrice}>${data.service.price}</Text>
        </View>
      )}
      
      {/* Date & Time */}
      {data.dateTime && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('bookingSummary.dateTime')}</Text>
          <Text style={styles.sectionContent}>
            {new Date(data.dateTime.date).toLocaleDateString()}
          </Text>
          <Text style={styles.sectionContent}>
            {data.dateTime.time} - {data.dateTime.endTime}
          </Text>
        </View>
      )}
      
      {/* Location */}
      {data.location && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('bookingSummary.location')}</Text>
          <Text style={styles.sectionContent}>{data.location.area}</Text>
          <Text style={styles.sectionContent}>{data.location.meetingPoint}</Text>
        </View>
      )}
      
      {/* Special Requests */}
      {data.requests && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('bookingSummary.specialRequests')}</Text>
          <Text style={styles.sectionContent}>{data.requests.specialRequests || 'None'}</Text>
          
          {data.requests.dietaryRestrictions?.length > 0 && (
            <View>
              <Text style={styles.subsectionTitle}>{t('bookingSummary.dietaryRestrictions')}:</Text>
              <Text style={styles.sectionContent}>
                {data.requests.dietaryRestrictions.join(', ')}
              </Text>
            </View>
          )}
          
          {data.requests.accessibilityNeeds?.length > 0 && (
            <View>
              <Text style={styles.subsectionTitle}>{t('bookingSummary.accessibilityNeeds')}:</Text>
              <Text style={styles.sectionContent}>
                {data.requests.accessibilityNeeds.join(', ')}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

export const BookingSummaryStep: React.FC<BookingSummaryStepProps> = ({
  onNext,
  onPrevious,
}) => {
  const { bookingData, calculateTotal, goToStep, prepareBookingRequest, setBookingComplete } = useBookingStore();
  const [termsAccepted, setTermsAccepted] = useState(false);
  const createBookingMutation = useCreateBooking();
  const posthog = usePostHog();
  const { t } = useTranslation();

  const companion = bookingData.companionData
    ? {
        ...bookingData.companionData,
        image: bookingData.companionData.image || undefined,
      }
    : null;
  
  if (!companion || !bookingData.service || !bookingData.dateTime || !bookingData.location) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Missing booking information. Please go back and complete all steps.</Text>
        </View>
      );
    }

  const handleNext = async () => {
    logger.log('🔄 BookingSummaryStep handleNext started', {
      timestamp: new Date().toISOString(),
      termsAccepted,
      isPending: createBookingMutation.isPending
    });

    if (!termsAccepted) {
      logger.log('⚠️ Terms not accepted');
      Alert.alert('Terms Required', 'Please accept the terms and conditions to continue.');
      return;
    }

    // Prevent multiple submissions
    if (createBookingMutation.isPending) {
      logger.log('⏳ Submission already in progress, preventing duplicate');
      return;
    }

    try {
      // Get the prepared booking request from the store
      logger.log('📝 Getting prepared booking request from store');
      const bookingRequest = await prepareBookingRequest();
      
      if (!bookingRequest) {
        console.error('❌ Failed to prepare booking request');
        Alert.alert('Error', 'Failed to prepare booking request. Please try again.');
        return;
      }

      logger.log('🚀 Submitting booking request', {
        timestamp: new Date().toISOString(),
        bookingRequest: {
          companionId: bookingRequest.companionId,
          serviceId: bookingRequest.serviceId,
          date: bookingRequest.date,
          startTime: bookingRequest.startTime,
          duration: bookingRequest.duration
        }
      });

      // Submit the booking using React Query mutation
      const result = await createBookingMutation.mutateAsync(bookingRequest);
      
      logger.log('Booking API Response:', {
        result,
        success: result.success,
        bookingId: result?.data?.booking?.id,
        timestamp: new Date().toISOString()
      });
      
      if (result.success && result.data.booking.id) {
        logger.log('✅ Booking created successfully', {
          timestamp: new Date().toISOString(),
          bookingId: result.data.booking.id
        });
        posthog.capture('booking_submitted', {
          booking_id: result.data.booking.id,
          companion_id: bookingData.companionId,
          service_name: bookingData.service?.name ?? 'Selected experience',
          total_amount: result.data.booking.totalAmount,
          payment_status: result.data.booking.paymentStatus,
          duration_minutes: result.data.booking.duration,
        });
        setBookingComplete(true);
    onNext();
      } else {
        console.error('❌ Booking creation failed - Invalid response format:', {
          timestamp: new Date().toISOString(),
          result
        });
        throw new Error('Invalid booking response format');
      }
    } catch (error) {
      console.error('❌ Booking creation failed:', {
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      Alert.alert(
        'Booking Failed',
        'There was an error creating your booking. Please try again.',
        [
          {
            text: 'OK',
            onPress: () => {
              logger.log('🔄 Resetting booking state after error');
              setBookingComplete(false);
              goToStep(1);
            }
          }
        ]
      );
    }
  };

  const handleEditStep = (step: number) => {
    goToStep(step);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const groupSize = bookingData.service?.customizations?.groupSize || 1;
  const basePrice = Math.round(convertCurrency(bookingData.service?.price || 0, bookingData.service?.currency, 'THB')) * groupSize;
  const addOnPrice = bookingData.service?.customizations?.addOns?.reduce((total, addOnId) => {
    // Mock add-on prices (should match ServiceSelectionStep)
    const addOnPrices: Record<string, number> = {
      transport: 500,
      lunch: 300,
      photos: 800,
      translator: 200,
    };
    return total + (addOnPrices[addOnId] || 0);
  }, 0) || 0;
  
  const totalAmount = basePrice + addOnPrice;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('bookingSummary.reviewYourBooking')}</Text>
          <Text style={styles.subtitle}>
            {t('bookingSummary.pleaseReviewAllDetailsBeforeConfirming')}
          </Text>
        </View>

        {/* Companion Info */}
        <Card style={styles.sectionCard} padding={16}>
          <View style={styles.companionSection}>
            <ProfileImage
              uri={companion?.image}
              size="medium"
            />
            <View style={styles.companionInfo}>
              <Text style={styles.companionName}>{companion?.name}</Text>
              <View style={styles.companionDetails}>
                <View style={styles.detailRow}>
                  <MapPin size={14} color={designTokens.colors.semantic.textSecondary} />
                  <Text style={styles.detailText}>{companion?.location}</Text>
                </View>
                <View style={styles.detailRow}>
                  <User size={14} color={designTokens.colors.semantic.textSecondary} />
                  <Text style={styles.detailText}>Rating: {companion?.rating}/5</Text>
                </View>
              </View>
            </View>
          </View>
        </Card>

        {/* Service Details */}
        {bookingData.service && (
        <Card style={styles.sectionCard} padding={16}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('bookingSummary.serviceDetails')}</Text>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => handleEditStep(1)}
            >
              <Edit3 size={16} color={designTokens.colors.semantic.primary} />
              <Text style={styles.editText}>{t('bookingSummary.edit')}</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.serviceInfo}>
              <Text style={styles.serviceName}>{bookingData.service.name}</Text>
              <Text style={styles.serviceDescription}>{bookingData.service.description}</Text>
            
            <View style={styles.serviceDetails}>
              <View style={styles.detailRow}>
                <Clock size={16} color={designTokens.colors.semantic.textSecondary} />
                  <Text style={styles.detailText}>{bookingData.service.duration} {t('bookingSummary.hours')}</Text>
              </View>
                {bookingData.service.customizations?.groupSize && (
              <View style={styles.detailRow}>
                <User size={16} color={designTokens.colors.semantic.textSecondary} />
                <Text style={styles.detailText}>
                      {bookingData.service.customizations.groupSize} {t('bookingSummary.person')}
                </Text>
                  </View>
                )}
            </View>

                {bookingData.service.customizations?.addOns && bookingData.service.customizations.addOns.length > 0 && (
              <View style={styles.addOnsSection}>
                <Text style={styles.addOnsTitle}>{t('bookingSummary.addOns')}:</Text>
                  {bookingData.service.customizations.addOns.map((addOn, index) => (
                  <Text key={index} style={styles.addOnItem}>• {addOn}</Text>
                ))}
              </View>
            )}
          </View>
        </Card>
        )}

        {/* Date & Time */}
        {bookingData.dateTime && (
        <Card style={styles.sectionCard} padding={16}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('bookingSummary.dateTime')}</Text>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => handleEditStep(2)}
            >
              <Edit3 size={16} color={designTokens.colors.semantic.primary} />
              <Text style={styles.editText}>{t('bookingSummary.edit')}</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.dateTimeInfo}>
            <View style={styles.detailRow}>
              <Calendar size={16} color={designTokens.colors.semantic.primary} />
                <Text style={styles.detailText}>
                  {new Date(bookingData.dateTime.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </Text>
            </View>
            <View style={styles.detailRow}>
              <Clock size={16} color={designTokens.colors.semantic.primary} />
              <Text style={styles.detailText}>
                  {bookingData.dateTime.time} - {bookingData.dateTime.endTime}
              </Text>
            </View>
          </View>
        </Card>
        )}

        {/* Location */}
        {bookingData.location && (
        <Card style={styles.sectionCard} padding={16}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('bookingSummary.meetingLocation')}</Text>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => handleEditStep(3)}
            >
              <Edit3 size={16} color={designTokens.colors.semantic.primary} />
              <Text style={styles.editText}>{t('bookingSummary.edit')}</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.locationInfo}>
            <View style={styles.detailRow}>
              <MapPin size={16} color={designTokens.colors.semantic.primary} />
                <Text style={styles.detailText}>{bookingData.location.area}</Text>
            </View>
              <Text style={styles.meetingPoint}>{bookingData.location.meetingPoint}</Text>
              {bookingData.location.estimatedDistance && (
              <Text style={styles.distanceInfo}>
                  ~{bookingData.location.estimatedDistance} km • {bookingData.location.travelTime} min travel
              </Text>
            )}
          </View>
        </Card>
        )}

        {/* Special Requests */}
        {bookingData.requests && (
          bookingData.requests.specialRequests || 
          bookingData.requests.dietaryRestrictions?.length > 0 || 
          bookingData.requests.accessibilityNeeds?.length > 0
        ) && (
          <Card style={styles.sectionCard} padding={16}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('bookingSummary.specialRequests')}</Text>
              <TouchableOpacity 
                style={styles.editButton}
                onPress={() => handleEditStep(4)}
              >
                <Edit3 size={16} color={designTokens.colors.semantic.primary} />
                  <Text style={styles.editText}>{t('bookingSummary.edit')}</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.requestsInfo}>
              {bookingData.requests.specialRequests && (
                <View style={styles.requestSection}>
                  <View style={styles.detailRow}>
                    <MessageSquare size={16} color={designTokens.colors.semantic.primary} />
                    <Text style={styles.requestLabel}>{t('bookingSummary.specialRequests')}:</Text>
                  </View>
                  <Text style={styles.requestText}>{bookingData.requests.specialRequests}</Text>
                </View>
              )}
              
              {bookingData.requests.dietaryRestrictions?.length > 0 && (
                <View style={styles.requestSection}>
                  <Text style={styles.requestLabel}>{t('bookingSummary.dietaryRestrictions')}:</Text>
                  <Text style={styles.requestText}>
                    {bookingData.requests.dietaryRestrictions.join(', ')}
                  </Text>
                </View>
              )}
              
              {bookingData.requests.accessibilityNeeds?.length > 0 && (
                <View style={styles.requestSection}>
                  <Text style={styles.requestLabel}>{t('bookingSummary.accessibilityNeeds')}:</Text>
                  <Text style={styles.requestText}>
                    {bookingData.requests.accessibilityNeeds.join(', ')}
                  </Text>
                </View>
              )}
              
              <View style={styles.requestSection}>
                <Text style={styles.requestLabel}>{t('bookingSummary.languagePreference')}:</Text>
                <Text style={styles.requestText}>{bookingData.requests.languagePreference}</Text>
              </View>
            </View>
          </Card>
        )}

        {/* Pricing Summary */}
        <Card style={styles.sectionCard} padding={16}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('bookingSummary.pricingSummary')}</Text>
            <CreditCard size={20} color={designTokens.colors.semantic.primary} />
          </View>
          
          <View style={styles.pricingDetails}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Guide rate</Text>
              <View style={styles.priceValueGroup}>
                <Text style={styles.priceValue}>{formatTravelerCurrency(basePrice, 'THB')}</Text>
                {formatOriginalCurrencyContext(bookingData.service?.price || 0, bookingData.service?.currency) ? (
                  <Text style={styles.sourcePriceText}>{formatOriginalCurrencyContext(bookingData.service?.price || 0, bookingData.service?.currency)}</Text>
                ) : null}
              </View>
            </View>
            
            {addOnPrice > 0 && (
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>{t('bookingSummary.addOns')}</Text>
                <Text style={styles.priceValue}>฿{addOnPrice.toLocaleString()}</Text>
              </View>
            )}
            
            <Text style={styles.paymentNote}>Paid in cash directly to your guide</Text>
            
            <View style={styles.divider} />
            
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{t('bookingSummary.totalAmount')}</Text>
              <Text style={styles.totalValue}>{formatTravelerCurrency(totalAmount, 'THB')}</Text>
            </View>
          </View>
        </Card>

        {/* Terms and Conditions */}
        <Card style={styles.sectionCard} padding={16}>
          <TouchableOpacity
            style={styles.termsContainer}
            onPress={() => setTermsAccepted(!termsAccepted)}
          >
            <View style={[
              styles.checkbox,
              termsAccepted && styles.checkedCheckbox,
            ]}>
              {termsAccepted && (
                <CheckCircle size={16} color={designTokens.colors.semantic.surface} />
              )}
            </View>
            <Text style={styles.termsText}>
              {t('bookingSummary.agreeToTermsAndConditions')}{' '}
              <Text style={styles.termsLink}>{t('bookingSummary.termsAndConditions')}</Text>
              {' '}{t('bookingSummary.and')}{' '}
              <Text style={styles.termsLink}>{t('bookingSummary.privacyPolicy')}</Text>
            </Text>
          </TouchableOpacity>
        </Card>
      </ScrollView>

      <BookingStepFooter
        onPrevious={onPrevious}
        onNext={handleNext}
        nextTitle={t('bookingSummary.confirm')}
        nextDisabled={!termsAccepted}
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: designTokens.spacing.scale.xl,
  },
  errorText: {
    ...designTokens.typography.styles.body,
    color: designTokens.colors.semantic.error,
    textAlign: 'center',
    lineHeight: designTokens.typography.lineHeights.normal * designTokens.typography.sizes.body,
  },
  sectionCard: {
    marginBottom: designTokens.spacing.scale.lg,
    borderRadius: designTokens.borderRadius.components.card,
    ...designTokens.shadows.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: designTokens.spacing.scale.md,
  },
  sectionTitle: {
    ...designTokens.typography.styles.subheading,
    color: designTokens.colors.semantic.text,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.scale.xs,
    paddingVertical: designTokens.spacing.scale.sm,
    paddingHorizontal: designTokens.spacing.scale.md,
    borderRadius: designTokens.borderRadius.components.button,
    backgroundColor: designTokens.colors.semantic.surface,
    minHeight: 44, // Accessibility touch target
    ...designTokens.shadows.sm,
  },
  editText: {
    ...designTokens.typography.styles.caption,
    color: designTokens.colors.semantic.primary,
    fontWeight: designTokens.typography.weights.medium,
  },
  companionSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  companionInfo: {
    flex: 1,
    marginLeft: designTokens.spacing.scale.md,
  },
  companionName: {
    ...designTokens.typography.styles.subheading,
    color: designTokens.colors.semantic.text,
    marginBottom: designTokens.spacing.scale.xs,
    fontSize: designTokens.typography.sizes.body,
  },
  companionDetails: {
    gap: designTokens.spacing.scale.xs,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.scale.xs,
  },
  detailText: {
    ...designTokens.typography.styles.caption,
    color: designTokens.colors.semantic.textSecondary,
  },
  serviceInfo: {
    gap: designTokens.spacing.scale.sm,
  },
  serviceName: {
    ...designTokens.typography.styles.subheading,
    color: designTokens.colors.semantic.text,
    fontSize: designTokens.typography.sizes.body,
  },
  serviceDescription: {
    ...designTokens.typography.styles.caption,
    color: designTokens.colors.semantic.textSecondary,
    lineHeight: designTokens.typography.lineHeights.normal * designTokens.typography.sizes.caption,
  },
  serviceDetails: {
    flexDirection: 'row',
    gap: designTokens.spacing.scale.md,
  },
  addOnsSection: {
    marginTop: designTokens.spacing.scale.sm,
    padding: designTokens.spacing.scale.md,
    backgroundColor: designTokens.colors.semantic.surface,
    borderRadius: designTokens.borderRadius.components.card,
    borderWidth: 1,
    borderColor: designTokens.colors.semantic.border,
  },
  addOnsTitle: {
    ...designTokens.typography.styles.caption,
    fontWeight: designTokens.typography.weights.semibold,
    color: designTokens.colors.semantic.text,
    marginBottom: designTokens.spacing.scale.xs,
  },
  addOnItem: {
    ...designTokens.typography.styles.caption,
    color: designTokens.colors.semantic.textSecondary,
  },
  dateTimeInfo: {
    gap: designTokens.spacing.scale.sm,
  },
  locationInfo: {
    gap: designTokens.spacing.scale.sm,
  },
  meetingPoint: {
    ...designTokens.typography.styles.caption,
    fontWeight: designTokens.typography.weights.medium,
    color: designTokens.colors.semantic.text,
    marginLeft: 24,
  },
  distanceInfo: {
    ...designTokens.typography.styles.caption,
    color: designTokens.colors.semantic.textSecondary,
    marginLeft: 24,
    fontSize: designTokens.typography.sizes.small,
  },
  requestsInfo: {
    gap: designTokens.spacing.scale.md,
  },
  requestSection: {
    gap: designTokens.spacing.scale.xs,
  },
  requestLabel: {
    ...designTokens.typography.styles.caption,
    fontWeight: designTokens.typography.weights.semibold,
    color: designTokens.colors.semantic.text,
  },
  requestText: {
    ...designTokens.typography.styles.caption,
    color: designTokens.colors.semantic.textSecondary,
    lineHeight: designTokens.typography.lineHeights.normal * designTokens.typography.sizes.caption,
  },
  pricingDetails: {
    gap: designTokens.spacing.scale.sm,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 32, // Better touch target
  },
  priceLabel: {
    ...designTokens.typography.styles.caption,
    color: designTokens.colors.semantic.textSecondary,
  },
  priceValue: {
    ...designTokens.typography.styles.caption,
    fontWeight: designTokens.typography.weights.medium,
    color: designTokens.colors.semantic.text,
  },
  priceValueGroup: {
    alignItems: 'flex-end',
  },
  sourcePriceText: {
    ...designTokens.typography.styles.caption,
    color: designTokens.colors.semantic.textSecondary,
    fontSize: 10,
    marginTop: 2,
    maxWidth: 180,
    textAlign: 'right',
  },
  paymentNote: {
    ...designTokens.typography.styles.caption,
    color: designTokens.colors.semantic.textSecondary,
    lineHeight: designTokens.typography.lineHeights.normal * designTokens.typography.sizes.caption,
  },
  divider: {
    height: 1,
    backgroundColor: designTokens.colors.semantic.border,
    marginVertical: designTokens.spacing.scale.md,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: designTokens.spacing.scale.sm,
    minHeight: 44, // Better touch target
  },
  totalLabel: {
    ...designTokens.typography.styles.subheading,
    color: designTokens.colors.semantic.text,
    fontSize: designTokens.typography.sizes.body,
  },
  totalValue: {
    ...designTokens.typography.styles.heading,
    color: designTokens.colors.semantic.primary,
    fontSize: designTokens.typography.sizes.large,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: designTokens.spacing.scale.sm,
    minHeight: 44, // Accessibility touch target
    paddingVertical: designTokens.spacing.scale.xs,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: designTokens.borderRadius.components.input,
    borderWidth: 2,
    borderColor: designTokens.colors.semantic.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    ...designTokens.shadows.sm,
  },
  checkedCheckbox: {
    borderColor: designTokens.colors.semantic.primary,
    backgroundColor: designTokens.colors.semantic.primary,
    ...designTokens.shadows.md,
  },
  termsText: {
    flex: 1,
    ...designTokens.typography.styles.caption,
    color: designTokens.colors.semantic.text,
    lineHeight: designTokens.typography.lineHeights.normal * designTokens.typography.sizes.caption,
  },
  termsLink: {
    color: designTokens.colors.semantic.primary,
    fontWeight: designTokens.typography.weights.medium,
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
  summaryContainer: {
    gap: 16,
  },
  section: {
    backgroundColor: designTokens.colors.semantic.surface,
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  sectionContent: {
    fontSize: 14,
    color: designTokens.colors.semantic.textSecondary,
  },
  sectionPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: designTokens.colors.semantic.primary,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: designTokens.colors.semantic.text,
    marginTop: 8,
  },
});
