import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Plus,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Settings,
  BarChart3,
  AlertCircle,
  CheckCircle,
  X,
} from 'lucide-react-native';
import { RadialGradient } from '@/components/ui/RadialGradient';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Heading, Subheading, Body, Caption } from '@/components/ui/Typography';
import { designTokens, componentTokens } from '@/constants/design-tokens';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { WebDatePicker } from '@/components/WebDatePicker';
import { useTranslation } from 'react-i18next';

const isWeb = Platform.OS === 'web';
const { width } = Dimensions.get('window');
const CALENDAR_WIDTH = width - 32; // Account for padding
const DAY_WIDTH = CALENDAR_WIDTH / 7;

interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  serviceId?: string;
  serviceName?: string;
  status: 'available' | 'booked' | 'blocked';
  price?: number;
  maxCapacity?: number;
  currentBookings?: number;
}

interface DayAvailability {
  date: string;
  dayOfWeek: string;
  isAvailable: boolean;
  timeSlots: TimeSlot[];
  totalSlots: number;
  availableSlots: number;
  bookedSlots: number;
  revenue: number;
}

export default function AvailabilityCalendarScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [pendingStartDate, setPendingStartDate] = useState<Date | null>(null);
  const [pendingEndDate, setPendingEndDate] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const formatDisplayDate = (date: Date | null) => {
    if (!date) return 'DD MMM YYYY';
    return date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const openAndroidDatePicker = (options: {
    value: Date;
    minimumDate?: Date;
    maximumDate?: Date;
    onConfirm: (date: Date) => void;
  }) => {
    DateTimePickerAndroid.open({
      value: options.value,
      mode: 'date',
      display: 'default',
      minimumDate: options.minimumDate,
      maximumDate: options.maximumDate,
      onChange: (_, date) => {
        if (date) options.onConfirm(date);
      },
    });
  };

  const renderDatePicker = (
    visible: boolean,
    value: Date | null,
    onClose: () => void,
    onConfirm: (date: Date) => void,
    minimumDate?: Date,
    maximumDate?: Date
  ) => {
    if (!visible) return null;

    if (isWeb) {
      return (
        <WebDatePicker
          value={value || new Date()}
          onChange={onConfirm}
          onDone={onClose}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          doneButtonText="Confirm"
        />
      );
    }

    if (Platform.OS === 'android') return null;

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
              value={value || new Date()}
              mode="date"
              display="spinner"
              onChange={(_, date) => {
                if (Platform.OS === 'android') {
                  onClose();
                  if (date) onConfirm(date);
                } else {
                  if (date) {
                    if (visible === showStartPicker) {
                      setPendingStartDate(date);
                    } else {
                      setPendingEndDate(date);
                    }
                  }
                }
              }}
              minimumDate={minimumDate}
              maximumDate={maximumDate}
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
                    if (visible === showStartPicker && pendingStartDate) {
                      onConfirm(pendingStartDate);
                    } else if (visible === showEndPicker && pendingEndDate) {
                      onConfirm(pendingEndDate);
                    }
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

  return (
    <RadialGradient variant="appBackground" style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={designTokens.colors.semantic.text} />
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Heading style={styles.title}>{t('availability.availabilityCalendar')}</Heading>
            <Caption style={styles.subtitle}>{t('availability.availabilityCalendarDescription')}</Caption>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => router.push('/supplier/availability/settings')}
            >
              <Settings size={20} color={designTokens.colors.semantic.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <View style={styles.formContainer}>
        <Text style={styles.dateFieldLabel}>{t('availability.from')}</Text>
        <TouchableOpacity
          style={styles.dateInputRow}
          onPress={() => {
            const base = startDate || new Date();
            if (Platform.OS === 'android') {
              openAndroidDatePicker({
                value: base,
                minimumDate: new Date(),
                maximumDate: endDate || undefined,
                onConfirm: (date) => setStartDate(date),
              });
              return;
            }
            setPendingStartDate(base);
            setShowStartPicker(true);
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.dateInputText}>{formatDisplayDate(startDate)}</Text>
          <Calendar size={22} color={designTokens.colors.semantic.textSecondary} />
        </TouchableOpacity>
        
        {renderDatePicker(
          showStartPicker,
          pendingStartDate,
          () => setShowStartPicker(false),
          (date) => setStartDate(date),
          new Date(),
          endDate || undefined
        )}

        <Text style={[styles.dateFieldLabel, { marginTop: designTokens.spacing.scale.lg }]}>
          To
        </Text>
        <TouchableOpacity
          style={styles.dateInputRow}
          onPress={() => {
            const base = endDate || startDate || new Date();
            if (Platform.OS === 'android') {
              openAndroidDatePicker({
                value: base,
                minimumDate: startDate && startDate > new Date() ? startDate : new Date(),
                onConfirm: (date) => setEndDate(date),
              });
              return;
            }
            setPendingEndDate(base);
            setShowEndPicker(true);
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.dateInputText}>{formatDisplayDate(endDate)}</Text>
          <Calendar size={22} color={designTokens.colors.semantic.textSecondary} />
        </TouchableOpacity>

        {renderDatePicker(
          showEndPicker,
          pendingEndDate,
          () => setShowEndPicker(false),
          (date) => setEndDate(date),
          startDate && startDate > new Date() ? startDate : new Date(),
          undefined
        )}
      </View>

      <View style={styles.bottomButtonContainer}>
        <TouchableOpacity
          style={styles.nextButton}
          onPress={() => {
            if (startDate && endDate) {
              router.push({
                pathname: '/availability/add-slot',
                params: {
                  startDate: startDate.toISOString(),
                  endDate: endDate.toISOString(),
                },
              });
            }
          }}
        >
          <Text style={styles.nextButtonText}>{t('availability.next')}</Text>
        </TouchableOpacity>
      </View>
    </RadialGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: 'transparent',
    paddingHorizontal: designTokens.spacing.scale.md,
    paddingBottom: designTokens.spacing.scale.sm,
    paddingTop: designTokens.spacing.scale.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: designTokens.spacing.scale.md,
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
    alignItems: 'flex-start',
  },
  title: {
    color: designTokens.colors.semantic.text,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: designTokens.colors.semantic.textSecondary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: designTokens.colors.semantic.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: designTokens.spacing.scale.md,
  },
  formContainer: {
    paddingHorizontal: designTokens.spacing.scale.lg,
    paddingTop: designTokens.spacing.scale.xl,
  },
  dateFieldLabel: {
    color: designTokens.colors.semantic.textSecondary,
    fontWeight: '500',
    marginBottom: designTokens.spacing.scale.xs,
    fontSize: 16,
  },
  dateInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: designTokens.colors.semantic.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: designTokens.colors.semantic.border,
    paddingVertical: designTokens.spacing.scale.md,
    paddingHorizontal: designTokens.spacing.scale.lg,
    marginBottom: designTokens.spacing.scale.md,
  },
  dateInputText: {
    flex: 1,
    fontSize: 16,
    color: designTokens.colors.semantic.text,
  },
  bottomButtonContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: designTokens.spacing.scale.lg,
    backgroundColor: 'transparent',
  },
  nextButton: {
    backgroundColor: designTokens.colors.semantic.primary,
    borderRadius: 24,
    paddingVertical: designTokens.spacing.scale.md,
    alignItems: 'center',
  },
  nextButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: designTokens.spacing.scale.lg,
    width: '85%',
    alignItems: 'center',
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: designTokens.spacing.scale.lg,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: designTokens.spacing.scale.md,
    borderRadius: 12,
    backgroundColor: designTokens.colors.semantic.surface,
    alignItems: 'center',
    marginHorizontal: designTokens.spacing.scale.xs,
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
  },
});
