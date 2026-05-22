import { logger } from '@/utils/logger';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Calendar, Clock, AlertCircle } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BookingStepFooter } from '../BookingStepFooter';
import { useBookingStore, BookingDateTime } from '@/stores/booking-store';
import { designTokens } from '@/constants/design-tokens';
import { useCompanionWeeklyAvailability } from '@/app/api/companion/companion';
import { useTranslation } from 'react-i18next';
import { isTestCompanionId } from '@/utils/companion-display';
import { getDemoGuideAvailability } from '@/utils/preview-availability';

interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
  price?: number;
}

interface DayAvailability {
  date: string;
  available: boolean;
  slots?: TimeSlot[];
  timeSlots?: TimeSlot[];
}

interface DateTimePickerStepProps {
  onNext: () => void;
  onPrevious: () => void;
}

const timeToMinutes = (time: string) => {
  const [hours = '0', minutes = '0'] = time.split(':');
  return Number(hours) * 60 + Number(minutes);
};

const minutesToTime = (totalMinutes: number) => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

const getDaySlots = (day?: DayAvailability): TimeSlot[] => {
  if (!day) return [];
  const slots = Array.isArray(day.slots) ? day.slots : day.timeSlots;
  return Array.isArray(slots) ? slots.filter(slot => slot.available !== false) : [];
};

const buildBookableTimeSlots = (slots: TimeSlot[], durationHours: number): TimeSlot[] => {
  const sortedSlots = [...slots].sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
  const latestAvailableEnd = sortedSlots.reduce(
    (latest, slot) => Math.max(latest, timeToMinutes(slot.end)),
    0
  );
  const durationMinutes = Math.max(Math.round(durationHours * 60), 30);
  const seenStarts = new Set<string>();

  return sortedSlots
    .map(slot => {
      const startMinutes = timeToMinutes(slot.start);
      const endMinutes = startMinutes + durationMinutes;

      if (seenStarts.has(slot.start) || endMinutes > latestAvailableEnd) {
        return null;
      }

      seenStarts.add(slot.start);
      return {
        ...slot,
        end: minutesToTime(endMinutes),
        available: true,
      };
    })
    .filter((slot): slot is TimeSlot => Boolean(slot));
};

export const DateTimePickerStep: React.FC<DateTimePickerStepProps> = ({
  onNext,
  onPrevious,
}) => {
  const { bookingData, updateDateTime } = useBookingStore();
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState<string | null>(
    bookingData.dateTime?.date || null
  );
  const [selectedTime, setSelectedTime] = useState<string | null>(
    bookingData.dateTime?.time || null
  );

  // Get companion ID from booking data
  const companionId = bookingData.companionId;

  // Fetch availability data using the API hook
  const { data: availabilityData, isLoading: isLoadingAvailability } = useCompanionWeeklyAvailability(
    companionId,
    '00:00', // Start time
    '23:59'  // End time
  );

  logger.log('companionId:', companionId);
  logger.log('Raw Availability Data:', availabilityData);

  const demoAvailabilityDates = isTestCompanionId(companionId) ? getDemoGuideAvailability() : [];

  // Get available dates and time slots from API response
  const availableDates = demoAvailabilityDates.length > 0
    ? demoAvailabilityDates
    : availabilityData?.success && availabilityData.data.availability
      ? availabilityData.data.availability.filter(day => day.available)
      : [];

  logger.log('Filtered Available Dates:', availableDates);

  // Get time slots for selected date
  const selectedDateData = availableDates.find(d => d.date === selectedDate);
  logger.log('Selected Date Data:', selectedDateData);

  const serviceDurationHours = Math.max(bookingData.service?.duration || 1, 0.5);
  const availableTimeSlots = buildBookableTimeSlots(
    getDaySlots(selectedDateData),
    serviceDurationHours
  );
  const selectedSlot = availableTimeSlots.find(slot => slot.start === selectedTime);
  const effectiveEndTime = selectedSlot?.end || bookingData.dateTime?.endTime || 'N/A';
  
  logger.log('Available Time Slots:', availableTimeSlots);

  useEffect(() => {
    if (!selectedDate || !selectedTime || !selectedSlot) return;
    const nextDateTime: BookingDateTime = {
      date: selectedDate,
      time: selectedSlot.start,
      duration: serviceDurationHours,
      endTime: selectedSlot.end,
      isAvailable: true,
    };

    const current = bookingData.dateTime;
    if (
      current?.date !== nextDateTime.date ||
      current?.time !== nextDateTime.time ||
      current?.duration !== nextDateTime.duration ||
      current?.endTime !== nextDateTime.endTime
    ) {
      updateDateTime(nextDateTime);
    }
  }, [selectedDate, selectedTime, selectedSlot, serviceDurationHours, bookingData.dateTime, updateDateTime]);

  const handleDateSelect = (date: string) => {
    logger.log('Selected Date:', date);
    setSelectedDate(date);
    setSelectedTime(null); // Reset time when date changes
  };

  const handleTimeSelect = (slot: { start: string; end: string; available: boolean; price?: number }) => {
    logger.log('Selected Time Slot:', slot);
    if (!selectedDate || !slot.available) return;
    
    setSelectedTime(slot.start);
    
    const dateTimeData: BookingDateTime = {
      date: selectedDate,
      time: slot.start,
      duration: serviceDurationHours,
      endTime: slot.end,
      isAvailable: true,
    };
    
    logger.log('Updated DateTime Data:', dateTimeData);
    updateDateTime(dateTimeData);
  };

  const handleNext = () => {
    if (selectedDate && selectedTime) {
      onNext();
    } else {
      Alert.alert(t('dateTimePicker.selectionRequired'), t('dateTimePicker.pleaseSelectBothDateAndTime'));
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateLong = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('dateTimePicker.whenWouldYouLikeToMeet')}</Text>
          <Text style={styles.subtitle}>
            {t('dateTimePicker.selectYourPreferredDateAndStartingTime')}
          </Text>
        </View>

        {/* Date Selection */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Calendar size={20} color={designTokens.colors.semantic.primary} />
            <Text style={styles.sectionTitle}>{t('dateTimePicker.chooseDate')}</Text>
          </View>
          
          {isLoadingAvailability ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>{t('dateTimePicker.loadingAvailability')}</Text>
            </View>
          ) : availableDates.length > 0 ? (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.dateScrollView}
            contentContainerStyle={styles.dateScrollContent}
          >
              {availableDates.map((date, index) => {
                const dateObj = new Date(date.date);
                return (
              <TouchableOpacity
                    key={date.date}
                style={[
                  styles.dateOption,
                      selectedDate === date.date && styles.selectedDateOption,
                ]}
                    onPress={() => handleDateSelect(date.date)}
              >
                <Text style={[
                  styles.dateLabel,
                      selectedDate === date.date && styles.selectedDateLabel,
                ]}>
                      {dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short' })}
                </Text>
                <Text style={[
                  styles.dateNumber,
                      selectedDate === date.date && styles.selectedDateNumber,
                ]}>
                      {dateObj.getDate()}
                </Text>
              </TouchableOpacity>
                );
              })}
          </ScrollView>
          ) : (
            <View style={styles.noTimesContainer}>
              <Text style={styles.noTimesText}>{t('dateTimePicker.noDatesAvailable')}</Text>
            </View>
          )}
        </Card>

        {/* Time Selection */}
        {selectedDate && (
          <Card style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Clock size={20} color={designTokens.colors.semantic.primary} />
              <Text style={styles.sectionTitle}>{t('dateTimePicker.chooseTime')}</Text>
            </View>
            
            <Text style={styles.sectionSubtitle}>
              {t('dateTimePicker.availableTimes')} {formatDateLong(selectedDate)}
            </Text>
            
            <View style={styles.timeGrid}>
              {availableTimeSlots.length > 0 ? (
                availableTimeSlots.map((slot, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.timeOption,
                      selectedTime === slot.start && styles.selectedTimeOption,
                  ]}
                    onPress={() => handleTimeSelect(slot)}
                >
                  <Text style={[
                    styles.timeText,
                      selectedTime === slot.start && styles.selectedTimeText,
                  ]}>
                      {slot.start.slice(0, 5)}
                  </Text>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.noTimesContainer}>
                  <Text style={styles.noTimesText}>{t('dateTimePicker.noTimesAvailable')}</Text>
                </View>
              )}
            </View>
          </Card>
        )}

        {/* Duration Info */}
        {selectedTime && selectedDate && (
          <Card style={styles.sectionCard}>
            <View style={styles.durationInfo}>
              <View style={styles.durationHeader}>
                <AlertCircle size={20} color={designTokens.colors.semantic.accent} />
                <Text style={styles.durationTitle}>{t('dateTimePicker.durationInformation')}</Text>
              </View>
              
              <View style={styles.durationDetails}>
                <View style={styles.durationRow}>
                  <Text style={styles.durationLabel}>{t('dateTimePicker.startTime')}:</Text>
                  <Text style={styles.durationValue}>{selectedTime}</Text>
                </View>
                <View style={styles.durationRow}>
                  <Text style={styles.durationLabel}>{t('dateTimePicker.duration')}:</Text>
                  <Text style={styles.durationValue}>
                    {serviceDurationHours} hours
                  </Text>
                </View>
                <View style={styles.durationRow}>
                  <Text style={styles.durationLabel}>{t('dateTimePicker.endTime')}:</Text>
                  <Text style={styles.durationValue}>
                    {effectiveEndTime}
                  </Text>
                </View>
              </View>
              
              <Text style={styles.durationNote}>
                💡 {t('dateTimePicker.durationNote')}
              </Text>
            </View>
          </Card>
        )}
      </ScrollView>

      <BookingStepFooter
        onPrevious={onPrevious}
        onNext={handleNext}
        nextTitle={t('dateTimePicker.continue')}
        nextDisabled={!selectedDate || !selectedTime}
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
  sectionCard: {
    marginBottom: designTokens.spacing.scale.lg,
    borderRadius: designTokens.borderRadius.components.card,
    ...designTokens.shadows.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.scale.sm,
    marginBottom: designTokens.spacing.scale.md,
  },
  sectionTitle: {
    ...designTokens.typography.styles.subheading,
    color: designTokens.colors.semantic.text,
  },
  sectionSubtitle: {
    ...designTokens.typography.styles.caption,
    color: designTokens.colors.semantic.textSecondary,
    marginBottom: designTokens.spacing.scale.md,
    lineHeight: designTokens.typography.lineHeights.normal * designTokens.typography.sizes.caption,
  },
  dateScrollView: {
    marginHorizontal: -designTokens.spacing.scale.sm,
  },
  dateScrollContent: {
    paddingHorizontal: designTokens.spacing.scale.sm,
    gap: designTokens.spacing.scale.sm,
  },
  dateOption: {
    alignItems: 'center',
    paddingVertical: designTokens.spacing.scale.md,
    paddingHorizontal: designTokens.spacing.scale.lg,
    borderRadius: designTokens.borderRadius.components.button,
    borderWidth: 1,
    borderColor: designTokens.colors.semantic.border,
    backgroundColor: designTokens.colors.semantic.surface,
    minWidth: 80,
    minHeight: 44, // Accessibility touch target
    justifyContent: 'center',
    ...designTokens.shadows.sm,
  },
  selectedDateOption: {
    borderColor: designTokens.colors.semantic.primary,
    backgroundColor: designTokens.colors.semantic.primary,
    ...designTokens.shadows.md,
    transform: [{ scale: 1.05 }],
  },
  dateLabel: {
    ...designTokens.typography.styles.caption,
    fontWeight: designTokens.typography.weights.medium,
    color: designTokens.colors.semantic.textSecondary,
    marginBottom: designTokens.spacing.scale.xs,
    fontSize: designTokens.typography.sizes.small,
  },
  selectedDateLabel: {
    color: designTokens.colors.semantic.surface,
  },
  dateNumber: {
    fontSize: designTokens.typography.sizes.large,
    fontWeight: designTokens.typography.weights.bold,
    color: designTokens.colors.semantic.text,
  },
  selectedDateNumber: {
    color: designTokens.colors.semantic.surface,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: designTokens.spacing.scale.sm,
    marginTop: designTokens.spacing.scale.md,
  },
  timeOption: {
    width: '30%',
    paddingVertical: designTokens.spacing.scale.md,
    paddingHorizontal: designTokens.spacing.scale.sm,
    borderRadius: designTokens.borderRadius.components.button,
    borderWidth: 1,
    borderColor: designTokens.colors.semantic.border,
    backgroundColor: designTokens.colors.semantic.surface,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 48,
    ...designTokens.shadows.sm,
  },
  selectedTimeOption: {
    borderColor: designTokens.colors.semantic.primary,
    backgroundColor: designTokens.colors.semantic.primary,
    ...designTokens.shadows.md,
  },
  timeText: {
    ...designTokens.typography.styles.body,
    color: designTokens.colors.semantic.text,
    fontWeight: designTokens.typography.weights.medium,
  },
  selectedTimeText: {
    color: designTokens.colors.semantic.surface,
  },
  priceText: {
    ...designTokens.typography.styles.caption,
    color: designTokens.colors.semantic.textSecondary,
    marginTop: designTokens.spacing.scale.xs,
  },
  noTimesContainer: {
    width: '100%',
    paddingVertical: designTokens.spacing.scale.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noTimesText: {
    ...designTokens.typography.styles.body,
    color: designTokens.colors.semantic.textSecondary,
    textAlign: 'center',
  },
  durationInfo: {
    backgroundColor: designTokens.colors.semantic.accent + '10',
    borderRadius: designTokens.borderRadius.components.card,
    padding: designTokens.spacing.scale.lg,
    borderWidth: 1,
    borderColor: designTokens.colors.semantic.accent + '20',
  },
  durationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.scale.sm,
    marginBottom: designTokens.spacing.scale.md,
  },
  durationTitle: {
    ...designTokens.typography.styles.subheading,
    color: designTokens.colors.semantic.text,
    fontSize: designTokens.typography.sizes.body,
  },
  durationDetails: {
    marginBottom: designTokens.spacing.scale.md,
  },
  durationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: designTokens.spacing.scale.sm,
  },
  durationLabel: {
    ...designTokens.typography.styles.caption,
    color: designTokens.colors.semantic.textSecondary,
  },
  durationValue: {
    ...designTokens.typography.styles.caption,
    fontWeight: designTokens.typography.weights.semibold,
    color: designTokens.colors.semantic.text,
  },
  durationNote: {
    ...designTokens.typography.styles.caption,
    color: designTokens.colors.semantic.textSecondary,
    fontStyle: 'italic',
    lineHeight: designTokens.typography.lineHeights.normal * designTokens.typography.sizes.caption,
  },
  footer: {
    padding: designTokens.spacing.scale.lg,
    backgroundColor: designTokens.colors.semantic.surface,
    borderTopWidth: 1,
    borderTopColor: designTokens.colors.semantic.border,
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
  loadingContainer: {
    paddingVertical: designTokens.spacing.scale.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...designTokens.typography.styles.body,
    color: designTokens.colors.semantic.textSecondary,
  },
});
