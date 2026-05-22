import { logger } from '@/utils/logger';
import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView, Modal, Alert, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Settings, Clock } from 'lucide-react-native';
import { designTokens } from '@/constants/design-tokens';
import { Heading, Caption } from '@/components/ui/Typography';
import { WebTimePicker } from '@/components/Webtimepicker';
import { RadialGradient } from '@/components/ui/RadialGradient';
import { saveCompanionAvailability } from '@/app/api/companion/companion';
import type { AvailabilityParams } from '@/app/api/companion/companion';
import { useAuthStore } from '@/stores/auth-store';
import { useToast } from '@/stores/toast-store';
import { useTranslation } from 'react-i18next';

// Conditionally import DateTimePicker only for native platforms
const DateTimePicker = Platform.OS !== 'web' 
  ? require('@react-native-community/datetimepicker').default 
  : null;

const isWeb = Platform.OS === 'web';

function formatDateRange(start: Date, end: Date) {
  const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${startStr} – ${endStr}`;
}

function getDefaultStartTime() {
  const d = new Date();
  d.setHours(8, 0, 0, 0); // 8:00 AM
  return d;
}

function getDefaultEndTime() {
  const d = new Date();
  d.setHours(18, 0, 0, 0); // 6:00 PM
  return d;
}

function formatTime(date: Date) {
  return date.toISOString().slice(11, 16); // 'HH:MM'
}

const AddSlot = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const startDate = params.startDate ? new Date(params.startDate as string) : new Date();
  const endDate = params.endDate ? new Date(params.endDate as string) : new Date();
  const { user } = useAuthStore();
  const toast = useToast();
  const { t } = useTranslation();
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [pendingStartTime, setPendingStartTime] = useState<Date | null>(null);
  const [pendingEndTime, setPendingEndTime] = useState<Date | null>(null);

  const formatDisplayTime = (date: Date | null) => {
    if (!date) return 'Select time';
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const handleStartTimeConfirm = (date: Date) => {
    logger.log('Start time confirmed:', date);
    setStartTime(date);
    setShowStartTimePicker(false);
  };

  const handleEndTimeConfirm = (date: Date) => {
    logger.log('End time confirmed:', date);
    setEndTime(date);
    setShowEndTimePicker(false);
  };

  const renderTimePicker = (
    visible: boolean,
    value: Date | null,
    onClose: () => void,
    onConfirm: (date: Date) => void,
    defaultValue: Date,
    isStartTime: boolean
  ) => {
    if (!visible) return null;

    if (isWeb) {
      return (
        <View style={styles.webPickerContainer}>
          <WebTimePicker
            value={value || defaultValue}
            onChange={(date: Date) => {
              logger.log('WebTimePicker onChange called with:', date);
              onConfirm(date);
            }}
            onDone={() => {
              logger.log('WebTimePicker onDone called');
              onClose();
            }}
            is24Hour={false}
            doneButtonText="Confirm"
          />
        </View>
      );
    }

    // Native platforms (iOS/Android)
    if (!DateTimePicker) return null;

    return (
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <DateTimePicker
              value={value || defaultValue}
              mode="time"
              display="spinner"
              is24Hour={false}
              onChange={(_event: any, date?: Date) => {
                if (Platform.OS === 'android') {
                  onClose();
                  if (date) onConfirm(date);
                } else {
                  if (date) {
                    if (isStartTime) {
                      setPendingStartTime(date);
                    } else {
                      setPendingEndTime(date);
                    }
                  }
                }
              }}
            />
            {Platform.OS === 'ios' && (
              <View style={styles.modalButtonRow}>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={onClose}
                >
                  <Text style={styles.modalButtonText}>{t('availability.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonPrimary]}
                  onPress={() => {
                    onClose();
                    const pendingValue = isStartTime ? pendingStartTime : pendingEndTime;
                    if (pendingValue) onConfirm(pendingValue);
                  }}
                >
                  <Text style={[styles.modalButtonText, styles.modalButtonPrimaryText]}>
                    {t('availability.confirm')}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    );
  };

  const handleSave = async () => {
    logger.log('Save button pressed');
    logger.log('Start time:', startTime);
    logger.log('End time:', endTime);
    
    if (!startTime || !endTime) {
      logger.log('Missing time values');
      if (Platform.OS === 'web') {
        toast.error(t('availability.pleaseSelectBothStartAndEndTime'));
      } else {
        Alert.alert('Error', t('availability.pleaseSelectBothStartAndEndTime'));
      }
      return;
    }

    const slot = {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      startTime: formatTime(startTime),
      endTime: formatTime(endTime),
      isAvailable: true,
    };
    
    logger.log('Slot to save:', slot);
    
    try {
      let companionId = user?.id;
      if (Array.isArray(companionId)) companionId = companionId[0];
      if (!companionId) {
        logger.warn('companionId is undefined! Cannot save availability.');
        if (Platform.OS === 'web') {
          toast.error(t('availability.companionIdMissing'));
        } else {
          Alert.alert('Error', t('availability.companionIdMissing'));
        }
        return;
      }
      
      logger.log('Saving to companion ID:', companionId);
      await saveCompanionAvailability(companionId as string, [slot]);
      if (Platform.OS === 'web') {
        toast.success(t('availability.availabilitySaved'));
        // Small delay before navigation to show toast
        setTimeout(() => {
          router.replace('/(app)');
        }, 500);
      } else {
        Alert.alert('Success', t('availability.availabilitySaved'), [
          { text: 'OK', onPress: () => router.replace('/(app)') },
        ]);
      }
    } catch (err) {
      console.error('Save error:', err);
      const errorMessage = (err as any)?.message || t('availability.failedToSaveAvailability');
      if (Platform.OS === 'web') {
        toast.error(errorMessage);
      } else {
        Alert.alert('Error', errorMessage);
      }
    }
  };

  return (
    <RadialGradient variant="appBackground" style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <ArrowLeft size={24} color={designTokens.colors.semantic.text} />
            </TouchableOpacity>
            <View style={styles.headerTitle}>
              <Heading style={styles.title}>{t('availability.setAvailability')}</Heading>
            </View>
            <View style={{ width: 44 }} />
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Caption style={styles.subtitle}>
            {t('availability.chooseTime')}
          </Caption>

          <View style={styles.dateRangeCard}>
            <Text style={styles.dateRangeText}>{formatDateRange(startDate, endDate)}</Text>
          </View>

          <Text style={styles.sectionTitle}>{t('availability.availabilityTime')}</Text>

          <View style={styles.timePickerRow}>
            <View style={styles.timePickerCol}>
              <Text style={styles.timeLabel}>{t('availability.settings.startTime')}</Text>
              <TouchableOpacity
                style={styles.timeInputRow}
                onPress={() => {
                  logger.log('Opening start time picker');
                  setPendingStartTime(startTime || getDefaultStartTime());
                  setShowStartTimePicker(true);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.timeInputText}>{formatDisplayTime(startTime)}</Text>
                <Clock size={22} color={designTokens.colors.semantic.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.timePickerCol}>
              <Text style={styles.timeLabel}>{t('availability.settings.endTime')}</Text>
              <TouchableOpacity
                style={styles.timeInputRow}
                onPress={() => {
                  logger.log('Opening end time picker');
                  setPendingEndTime(endTime || getDefaultEndTime());
                  setShowEndTimePicker(true);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.timeInputText}>{formatDisplayTime(endTime)}</Text>
                <Clock size={22} color={designTokens.colors.semantic.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {renderTimePicker(
            showStartTimePicker,
            pendingStartTime,
            () => setShowStartTimePicker(false),
            handleStartTimeConfirm,
            getDefaultStartTime(),
            true
          )}

          {renderTimePicker(
            showEndTimePicker,
            pendingEndTime,
            () => setShowEndTimePicker(false),
            handleEndTimeConfirm,
            getDefaultEndTime(),
            false
          )}
        </ScrollView>

        <View style={styles.bottomButtonContainer}>
          <TouchableOpacity 
            style={styles.saveButton} 
            onPress={handleSave}
            activeOpacity={0.8}
          >
            <Text style={styles.saveButtonText}>{t('availability.save')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </RadialGradient>
  );
};

export default AddSlot;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: designTokens.colors.semantic.background,
  },
  header: {
    backgroundColor: 'transparent',
    paddingTop: designTokens.spacing.scale.lg,
    paddingBottom: designTokens.spacing.scale.md,
    paddingHorizontal: designTokens.spacing.scale.md,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: designTokens.colors.semantic.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: designTokens.spacing.scale.md,
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: designTokens.colors.semantic.text,
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    color: designTokens.colors.semantic.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    marginTop: 2,
    marginBottom: designTokens.spacing.scale.lg,
  },
  dateRangeCard: {
    backgroundColor: designTokens.colors.semantic.surface,
    borderRadius: 16,
    paddingVertical: designTokens.spacing.scale.md,
    paddingHorizontal: designTokens.spacing.scale.xl,
    marginBottom: designTokens.spacing.scale.lg,
  },
  dateRangeText: {
    color: designTokens.colors.semantic.primary,
    fontWeight: '700',
    fontSize: 18,
    textAlign: 'center',
  },
  sectionTitle: {
    fontWeight: '700',
    fontSize: 16,
    color: designTokens.colors.semantic.text,
    marginBottom: designTokens.spacing.scale.md,
    alignSelf: 'flex-start',
  },
  timePickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: designTokens.spacing.scale.xl,
    gap: 12,
  },
  timePickerCol: {
    flex: 1,
  },
  timeLabel: {
    fontWeight: '600',
    fontSize: 15,
    color: designTokens.colors.semantic.text,
    marginBottom: 6,
    marginLeft: 4,
  },
  timeInputRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: designTokens.colors.semantic.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: designTokens.colors.semantic.border,
    paddingVertical: designTokens.spacing.scale.md,
    paddingHorizontal: designTokens.spacing.scale.lg,
    marginBottom: designTokens.spacing.scale.md,
    marginHorizontal: 4,
  },
  timeInputText: {
    flex: 1,
    fontSize: 16,
    color: designTokens.colors.semantic.text,
  },
  webPickerContainer: {
    width: '100%',
    marginTop: designTokens.spacing.scale.md,
    marginBottom: designTokens.spacing.scale.lg,
    paddingHorizontal: 4,
  },
  bottomButtonContainer: {
    padding: designTokens.spacing.scale.lg,
    backgroundColor: 'transparent',
  },
  saveButton: {
    backgroundColor: designTokens.colors.semantic.primary,
    borderRadius: 24,
    paddingVertical: designTokens.spacing.scale.md,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 18,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsButton: {
    padding: designTokens.spacing.scale.sm,
  },
  content: {
    padding: designTokens.spacing.scale.lg,
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 20,
    width: '80%',
    alignItems: 'center',
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    backgroundColor: designTokens.colors.semantic.surface,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: designTokens.colors.semantic.primary,
  },
  modalButtonText: {
    color: designTokens.colors.semantic.text,
    fontWeight: '600',
    fontSize: 16,
  },
  modalButtonPrimaryText: {
    color: 'white',
    fontWeight: '700',
  },
});
