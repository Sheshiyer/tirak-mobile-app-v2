import { logger } from '@/utils/logger';
  import React, { useState } from 'react';
  import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView, Modal, Alert, Platform } from 'react-native';
  import { useRouter, useLocalSearchParams } from 'expo-router';
  import { ArrowLeft, Settings, Clock } from 'lucide-react-native';
  import { designTokens } from '@/constants/design-tokens';
  import { Heading, Caption } from '@/components/ui/Typography';
  import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
  import { RadialGradient } from '@/components/ui/RadialGradient';
  import { saveCompanionAvailability } from '@/app/api/companion/companion';
  import type { AvailabilityParams } from '@/app/api/companion/companion';
  import { useAuthStore } from '@/stores/auth-store';

  const TIME_OPTIONS = [
    '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM',
  ];

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
    // logger.log(user);
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

    const openAndroidTimePicker = (options: { value: Date; onConfirm: (date: Date) => void }) => {
      DateTimePickerAndroid.open({
        value: options.value,
        mode: 'time',
        display: 'default',
        is24Hour: false,
        onChange: (_, date) => {
          if (date) options.onConfirm(date);
        },
      });
    };

  

    const handleSave = async () => {
      if (startTime && endTime) {
        const slot = {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          startTime: formatTime(startTime),
          endTime: formatTime(endTime),
          isAvailable: true,
        };
        try {
          let companionId = user?.id;
          if (Array.isArray(companionId)) companionId = companionId[0];
          if (!companionId) {
            logger.warn('companionId is undefined! Cannot save availability.');
            Alert.alert('Error', 'Companion ID is missing.');
            return;
          }
          await saveCompanionAvailability(companionId as string, [slot]);
          Alert.alert('Availability saved', 'Your availability has been saved', [
            { text: 'OK', onPress: () => router.replace('/(app)') },
          ]);
        } catch (err) {
          Alert.alert('Error', (err as any)?.message || 'Failed to save availability');
        }
      } else {
        Alert.alert('Please select start and end time');
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
                <Heading style={styles.title}>Set Availability</Heading>
              
              </View>
              <View style={{ width: 44 }} />
            </View>
          </View>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Caption style={styles.subtitle}>Choose the time you'll be available for the provided date range</Caption>
            <View style={styles.dateRangeCard}>
              <Text style={styles.dateRangeText}>{formatDateRange(startDate, endDate)}</Text>
            </View>
            <Text style={styles.sectionTitle}>Availability time</Text>
            <View style={styles.timePickerRow}>
              <View style={styles.timePickerCol}>
                <Text style={styles.timeLabel}>Start Time</Text>
                <TouchableOpacity
                  style={styles.timeInputRow}
                  onPress={() => {
                    const base = startTime || getDefaultStartTime();
                    if (Platform.OS === 'android') {
                      openAndroidTimePicker({ value: base, onConfirm: (date) => setStartTime(date) });
                      return;
                    }
                    setPendingStartTime(base);
                    setShowStartTimePicker(true);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.timeInputText}>{formatDisplayTime(startTime)}</Text>
                  <Clock size={22} color={designTokens.colors.semantic.textSecondary} />
                </TouchableOpacity>
              </View>
              <View style={styles.timePickerCol}>
                <Text style={styles.timeLabel}>End time</Text>
                <TouchableOpacity
                  style={styles.timeInputRow}
                  onPress={() => {
                    const base = endTime || getDefaultEndTime();
                    if (Platform.OS === 'android') {
                      openAndroidTimePicker({ value: base, onConfirm: (date) => setEndTime(date) });
                      return;
                    }
                    setPendingEndTime(base);
                    setShowEndTimePicker(true);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.timeInputText}>{formatDisplayTime(endTime)}</Text>
                  <Clock size={22} color={designTokens.colors.semantic.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>
            {Platform.OS === 'ios' && (
              <Modal
                visible={showStartTimePicker}
                transparent
                animationType="fade"
                onRequestClose={() => setShowStartTimePicker(false)}
              >
                <View style={styles.modalOverlay}>
                  <View style={styles.modalContent}>
                    <DateTimePicker
                      value={pendingStartTime || getDefaultStartTime()}
                      mode="time"
                      display="spinner"
                      is24Hour={false}
                      onChange={(_, date) => {
                        if (date) setPendingStartTime(date);
                      }}
                    />
                    <View style={styles.modalButtonRow}>
                      <TouchableOpacity
                        style={styles.modalButton}
                        onPress={() => setShowStartTimePicker(false)}
                      >
                        <Text style={styles.modalButtonText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.modalButton, styles.modalButtonPrimary]}
                        onPress={() => {
                          setShowStartTimePicker(false);
                          if (pendingStartTime) setStartTime(pendingStartTime);
                        }}
                      >
                        <Text style={[styles.modalButtonText, styles.modalButtonPrimaryText]}>Confirm</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </Modal>
            )}
            {Platform.OS === 'ios' && (
              <Modal
                visible={showEndTimePicker}
                transparent
                animationType="fade"
                onRequestClose={() => setShowEndTimePicker(false)}
              >
                <View style={styles.modalOverlay}>
                  <View style={styles.modalContent}>
                    <DateTimePicker
                      value={pendingEndTime || getDefaultEndTime()}
                      mode="time"
                      display="spinner"
                      is24Hour={false}
                      onChange={(_, date) => {
                        if (date) setPendingEndTime(date);
                      }}
                    />
                    <View style={styles.modalButtonRow}>
                      <TouchableOpacity
                        style={styles.modalButton}
                        onPress={() => setShowEndTimePicker(false)}
                      >
                        <Text style={styles.modalButtonText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.modalButton, styles.modalButtonPrimary]}
                        onPress={() => {
                          setShowEndTimePicker(false);
                          if (pendingEndTime) setEndTime(pendingEndTime);
                        }}
                      >
                        <Text style={[styles.modalButtonText, styles.modalButtonPrimaryText]}>Confirm</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </Modal>
            )}
          </ScrollView>
          <View style={styles.bottomButtonContainer}>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save</Text>
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
      padding: 10,
      borderRadius: 10,
      backgroundColor: designTokens.colors.semantic.surface,
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

 
