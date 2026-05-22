import { logger } from '@/utils/logger';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Clock,
  Calendar,
  Bell,
  Globe,
  Users,
  Settings as SettingsIcon,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react-native';
import { RadialGradient } from '@/components/ui/RadialGradient';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Heading, Subheading, Body, Caption } from '@/components/ui/Typography';
import { designTokens, componentTokens } from '@/constants/design-tokens';
import { useTranslation } from 'react-i18next';
interface AvailabilitySettings {
  workingDays: string[];
  workingHours: {
    start: string;
    end: string;
  };
  timeZone: string;
  bufferTime: number; // minutes between bookings
  maxAdvanceBooking: number; // days
  minAdvanceBooking: number; // hours
  autoAcceptBookings: boolean;
  instantBooking: boolean;
  notifications: {
    newBooking: boolean;
    bookingReminder: boolean;
    cancellation: boolean;
    rescheduling: boolean;
  };
  pricing: {
    weekendPremium: number; // percentage
    holidayPremium: number; // percentage
    lastMinuteDiscount: number; // percentage
  };
}

export default function AvailabilitySettingsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [settings, setSettings] = useState<AvailabilitySettings>({
    workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
    workingHours: {
      start: '08:00',
      end: '18:00',
    },
    timeZone: 'Asia/Bangkok',
    bufferTime: 30,
    maxAdvanceBooking: 90,
    minAdvanceBooking: 24,
    autoAcceptBookings: false,
    instantBooking: true,
    notifications: {
      newBooking: true,
      bookingReminder: true,
      cancellation: true,
      rescheduling: true,
    },
    pricing: {
      weekendPremium: 20,
      holidayPremium: 30,
      lastMinuteDiscount: 10,
    },
  });

  const updateSettings = (field: keyof AvailabilitySettings, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const updateNestedSettings = (parent: keyof AvailabilitySettings, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [parent]: {
        ...(prev[parent] as any),
        [field]: value,
      },
    }));
  };

  const toggleWorkingDay = (day: string) => {
    const isSelected = settings.workingDays.includes(day);
    if (isSelected) {
      updateSettings('workingDays', settings.workingDays.filter(d => d !== day));
    } else {
      updateSettings('workingDays', [...settings.workingDays, day]);
    }
  };

  const handleSave = () => {
    // In a real app, this would save to API
    // logger.log('Saving availability settings:', settings);
    
    Alert.alert(
      t('availability.settings.settingsSaved'),
      t('availability.settings.settingsSavedDescription'),
      [{ text: t('availability.settings.ok'), onPress: () => router.back() }]
    );
  };

  const handleReset = () => {
    Alert.alert(
      t('availability.settings.resetSettings'),
      t('availability.settings.resetSettingsDescription'),
      [
        { text: t('availability.settings.cancel'), style: 'cancel' },
        { text: t('availability.settings.reset'), style: 'destructive', onPress: () => {
          // Reset to default values
          // logger.log('Resetting settings to defaults');
        }},
      ]
    );
  };

  const weekDays = [
    { key: 'monday', label: t('availability.settings.monday'), short: t('availability.settings.mon') },
    { key: 'tuesday', label: t('availability.settings.tuesday'), short: t('availability.settings.tue') },
    { key: 'wednesday', label: t('availability.settings.wednesday'), short: t('availability.settings.wed') },
    { key: 'thursday', label: t('availability.settings.thursday'), short: t('availability.settings.thu') },
    { key: 'friday', label: t('availability.settings.friday'), short: t('availability.settings.fri') },
    { key: 'saturday', label: t('availability.settings.saturday'), short: t('availability.settings.sat') },
    { key: 'sunday', label: t('availability.settings.sunday'), short: t('availability.settings.sun') },
  ];

  const timeZones = [
    { value: 'Asia/Bangkok', label: t('availability.settings.bangkok') + ' (UTC+7)' },
    { value: 'Asia/Singapore', label: t('availability.settings.singapore') + ' (UTC+8)' },
    { value: 'Asia/Tokyo', label: t('availability.settings.tokyo') + ' (UTC+9)' },
    { value: 'Asia/Hong_Kong', label: t('availability.settings.hong_kong') + ' (UTC+8)' },
  ];

  const SettingRow = ({ 
    icon, 
    title, 
    description, 
    value, 
    onPress,
    rightElement 
  }: {
    icon: React.ReactNode;
    title: string;
    description?: string;
    value?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
  }) => (
    <TouchableOpacity style={styles.settingRow} onPress={onPress} disabled={!onPress}>
      <View style={styles.settingIcon}>
        {icon}
      </View>
      <View style={styles.settingContent}>
        <Body style={styles.settingTitle}>{title}</Body>
        {description && (
          <Caption style={styles.settingDescription}>{description}</Caption>
        )}
        {value && (
          <Caption style={styles.settingValue}>{value}</Caption>
        )}
      </View>
      {rightElement && (
        <View style={styles.settingRight}>
          {rightElement}
        </View>
      )}
    </TouchableOpacity>
  );

  const SwitchRow = ({ 
    icon, 
    title, 
    description, 
    value, 
    onValueChange 
  }: {
    icon: React.ReactNode;
    title: string;
    description?: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
  }) => (
    <SettingRow
      icon={icon}
      title={title}
      description={description}
      rightElement={
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{
            false: designTokens.colors.semantic.textSecondary + '40',
            true: designTokens.colors.semantic.primary + '40',
          }}
          thumbColor={value ? designTokens.colors.semantic.primary : designTokens.colors.semantic.textSecondary}
        />
      }
    />
  );

  return (
    <RadialGradient variant="appBackground" style={styles.container}>
      {/* Header */}
      <SafeAreaView edges={['top']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={designTokens.colors.semantic.text} />
          </TouchableOpacity>
          
          <View style={styles.headerTitle}>
            <Heading style={styles.title}>{t('availability.settings.title')}</Heading>
            <Caption style={styles.subtitle}>{t('availability.settings.description')}</Caption>
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Save size={20} color={designTokens.colors.semantic.surface} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Working Days */}
        <Card style={styles.section} padding={16}>
          <Subheading style={styles.sectionTitle}>{t('availability.settings.workingDays')}</Subheading>
          <Caption style={styles.sectionDescription}>
            {t('availability.settings.workingDaysDescription')}
          </Caption>
          
          <View style={styles.workingDaysGrid}>
            {weekDays.map((day) => (
              <TouchableOpacity
                key={day.key}
                style={[
                  styles.dayButton,
                  settings.workingDays.includes(day.key) && styles.dayButtonActive
                ]}
                onPress={() => toggleWorkingDay(day.key)}
              >
                <Text style={[
                  styles.dayButtonText,
                  settings.workingDays.includes(day.key) && styles.dayButtonTextActive
                ]}>
                  {day.short}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Working Hours */}
        <Card style={styles.section} padding={16}>
          <Subheading style={styles.sectionTitle}>{t('availability.settings.workingHours')}</Subheading>
          <Caption style={styles.sectionDescription}>
            {t('availability.settings.workingHoursDescription')}
          </Caption>
          
          <View style={styles.timeRow}>
            <View style={styles.timeInput}>
              <Caption style={styles.timeLabel}>{t('availability.settings.startTime')}</Caption>
              <TouchableOpacity style={styles.timeButton}>
                <Clock size={16} color={designTokens.colors.semantic.primary} />
                <Body style={styles.timeText}>{settings.workingHours.start}</Body>
              </TouchableOpacity>
            </View>
            
            <View style={styles.timeInput}>
              <Caption style={styles.timeLabel}>{t('availability.settings.endTime')}</Caption>
              <TouchableOpacity style={styles.timeButton}>
                <Clock size={16} color={designTokens.colors.semantic.primary} />
                <Body style={styles.timeText}>{settings.workingHours.end}</Body>
              </TouchableOpacity>
            </View>
          </View>
        </Card>

        {/* Booking Rules */}
        <Card style={styles.section} padding={16}>
          <Subheading style={styles.sectionTitle}>{t('availability.settings.bookingRules')}</Subheading>
          
          <SettingRow
            icon={<Clock size={20} color={designTokens.colors.semantic.primary} />}
            title={t('availability.settings.bufferTime')}
            description={t('availability.settings.bufferTimeDescription')}
            value={`${settings.bufferTime} minutes`}
          />
          
          <SettingRow
            icon={<Calendar size={20} color={designTokens.colors.semantic.primary} />}
            title={t('availability.settings.maximumAdvanceBooking')}
            description={t('availability.settings.maximumAdvanceBookingDescription')}
            value={`${settings.maxAdvanceBooking} days`}
          />
          
          <SettingRow
            icon={<AlertTriangle size={20} color={designTokens.colors.semantic.warning} />}
            title={t('availability.settings.minimumAdvanceBooking')}
            description={t('availability.settings.minimumAdvanceBookingDescription')}
            value={`${settings.minAdvanceBooking} hours`}
          />
          
          <SwitchRow
            icon={<CheckCircle size={20} color={designTokens.colors.semantic.success} />}
            title={t('availability.settings.autoAcceptBookings')}
            description={t('availability.settings.autoAcceptBookingsDescription')}
            value={settings.autoAcceptBookings}
            onValueChange={(value) => updateSettings('autoAcceptBookings', value)}
          />
          
          <SwitchRow
            icon={<RefreshCw size={20} color={designTokens.colors.semantic.accent} />}
            title={t('availability.settings.instantBooking')}
            description={t('availability.settings.instantBookingDescription')}
            value={settings.instantBooking}
            onValueChange={(value) => updateSettings('instantBooking', value)}
          />
        </Card>

        {/* Notifications */}
        <Card style={styles.section} padding={16}>
          <Subheading style={styles.sectionTitle}>{t('availability.settings.notifications')}</Subheading>
          <Caption style={styles.sectionDescription}>
            {t('availability.settings.notificationsDescription')}
          </Caption>
          
          <SwitchRow
            icon={<Bell size={20} color={designTokens.colors.semantic.primary} />}
            title={t('availability.settings.newBooking')}
            description={t('availability.settings.newBookingDescription')}
            value={settings.notifications.newBooking}
            onValueChange={(value) => updateNestedSettings('notifications', 'newBooking', value)}
          />
          
          <SwitchRow
            icon={<Clock size={20} color={designTokens.colors.semantic.warning} />}
            title={t('availability.settings.bookingReminder')}
            description={t('availability.settings.bookingReminderDescription')}
            value={settings.notifications.bookingReminder}
            onValueChange={(value) => updateNestedSettings('notifications', 'bookingReminder', value)}
          />
          
          <SwitchRow
            icon={<AlertTriangle size={20} color={designTokens.colors.semantic.error} />}
            title={t('availability.settings.cancellation')}
            description={t('availability.settings.cancellationDescription')}
            value={settings.notifications.cancellation}
            onValueChange={(value) => updateNestedSettings('notifications', 'cancellation', value)}
          />
          
          <SwitchRow
            icon={<RefreshCw size={20} color={designTokens.colors.semantic.accent} />}
            title={t('availability.settings.rescheduling')}
            description={t('availability.settings.reschedulingDescription')}
            value={settings.notifications.rescheduling}
            onValueChange={(value) => updateNestedSettings('notifications', 'rescheduling', value)}
          />
        </Card>

        {/* Advanced Settings */}
        <Card style={styles.section} padding={16}>
          <Subheading style={styles.sectionTitle}>{t('availability.settings.advancedSettings')}</Subheading>
          
          <SettingRow
            icon={<Globe size={20} color={designTokens.colors.semantic.primary} />}
            title={t('availability.settings.timeZone')}
            description={t('availability.settings.timeZoneDescription')}
            value={timeZones.find(tz => tz.value === settings.timeZone)?.label}
          />
          
          <SettingRow
            icon={<Users size={20} color={designTokens.colors.semantic.accent} />}
            title={t('availability.settings.weekendPremium')}
            description={t('availability.settings.weekendPremiumDescription')}
            value={`+${settings.pricing.weekendPremium}%`}
          />
          
          <SettingRow
            icon={<Calendar size={20} color={designTokens.colors.semantic.success} />}
            title={t('availability.settings.holidayPremium')}
            description={t('availability.settings.holidayPremiumDescription')}
            value={`+${settings.pricing.holidayPremium}%`}
          />
        </Card>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title={t('availability.settings.resetToDefaults')}
            onPress={handleReset}
            variant="outline"
            style={styles.resetButton}
            // icon={<RefreshCw size={16} color={designTokens.colors.semantic.primary} />}
          />
        </View>
      </ScrollView>
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
  },
  title: {
    marginBottom: designTokens.spacing.scale.xs,
  },
  subtitle: {
    color: designTokens.colors.semantic.textSecondary,
  },
  saveButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: designTokens.colors.semantic.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: designTokens.spacing.scale.md,
    paddingBottom: designTokens.spacing.scale.xl,
  },
  section: {
    marginBottom: designTokens.spacing.scale.md,
  },
  sectionTitle: {
    marginBottom: designTokens.spacing.scale.sm,
  },
  sectionDescription: {
    color: designTokens.colors.semantic.textSecondary,
    marginBottom: designTokens.spacing.scale.md,
  },
  workingDaysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: designTokens.spacing.scale.sm,
  },
  dayButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: designTokens.colors.semantic.surface + '80',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dayButtonActive: {
    backgroundColor: designTokens.colors.semantic.primary,
    borderColor: designTokens.colors.semantic.primary,
  },
  dayButtonText: {
    fontWeight: '500',
    color: designTokens.colors.semantic.text,
    fontSize: 12,
  },
  dayButtonTextActive: {
    color: designTokens.colors.semantic.surface,
    fontWeight: '600',
    fontSize: 12,
  },
  timeRow: {
    flexDirection: 'row',
    gap: designTokens.spacing.scale.md,
  },
  timeInput: {
    flex: 1,
  },
  timeLabel: {
    marginBottom: designTokens.spacing.scale.sm,
    color: designTokens.colors.semantic.textSecondary,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: designTokens.colors.semantic.surface,
    padding: designTokens.spacing.scale.md,
    borderRadius: componentTokens.card.default.borderRadius,
    borderWidth: 1,
    borderColor: designTokens.colors.semantic.border,
  },
  timeText: {
    marginLeft: designTokens.spacing.scale.sm,
    fontWeight: '500',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: designTokens.spacing.scale.md,
    borderBottomWidth: 1,
    borderBottomColor: designTokens.colors.semantic.border,
  },
  settingIcon: {
    marginRight: designTokens.spacing.scale.md,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontWeight: '500',
    marginBottom: designTokens.spacing.scale.xs,
  },
  settingDescription: {
    color: designTokens.colors.semantic.textSecondary,
    marginBottom: designTokens.spacing.scale.xs,
  },
  settingValue: {
    color: designTokens.colors.semantic.primary,
    fontWeight: '500',
  },
  settingRight: {
    marginLeft: designTokens.spacing.scale.md,
  },
  actions: {
    marginTop: designTokens.spacing.scale.md,
  },
  resetButton: {
    alignSelf: 'center',
  },
});
