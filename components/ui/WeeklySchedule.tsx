import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { designTokens } from '@/constants/design-tokens';
import { WeeklySchedule as WeeklyScheduleType, TimeSlot } from '@/types/supplier';
import { Plus, Trash2 } from 'lucide-react-native';

interface WeeklyScheduleProps {
  schedule: WeeklyScheduleType;
  onChange: (schedule: WeeklyScheduleType) => void;
}

const DAYS = [
  { key: 'monday', label: 'Mon' },
  { key: 'tuesday', label: 'Tue' },
  { key: 'wednesday', label: 'Wed' },
  { key: 'thursday', label: 'Thu' },
  { key: 'friday', label: 'Fri' },
  { key: 'saturday', label: 'Sat' },
  { key: 'sunday', label: 'Sun' },
] as const;

const TIME_OPTIONS = Array.from({ length: 24 }).map((_, i) => {
  const hour = i.toString().padStart(2, '0');
  return { value: `${hour}:00`, label: `${hour}:00` };
});

export const WeeklySchedule: React.FC<WeeklyScheduleProps> = ({
  schedule,
  onChange,
}) => {
  const [activeDay, setActiveDay] = useState<keyof WeeklyScheduleType>('monday');

  const handleAddTimeSlot = () => {
    const newSchedule = { ...schedule };
    const currentSlots = [...newSchedule[activeDay]];
    
    // Find a default time slot that doesn't overlap with existing ones
    let defaultStart = '09:00';
    let defaultEnd = '17:00';
    
    // If there are existing slots, try to add after the last one
    if (currentSlots.length > 0) {
      const lastSlot = currentSlots[currentSlots.length - 1];
      const lastEndHour = parseInt(lastSlot.end.split(':')[0]);
      
      if (lastEndHour < 22) {
        defaultStart = `${lastEndHour + 1}:00`;
        defaultEnd = `${Math.min(lastEndHour + 5, 23)}:00`;
      }
    }
    
    newSchedule[activeDay] = [
      ...currentSlots,
      { start: defaultStart, end: defaultEnd },
    ];
    
    onChange(newSchedule);
  };

  const handleRemoveTimeSlot = (index: number) => {
    const newSchedule = { ...schedule };
    newSchedule[activeDay] = newSchedule[activeDay].filter((_, i) => i !== index);
    onChange(newSchedule);
  };

  const handleUpdateTimeSlot = (index: number, field: keyof TimeSlot, value: string) => {
    const newSchedule = { ...schedule };
    const updatedSlots = [...newSchedule[activeDay]];
    updatedSlots[index] = { ...updatedSlots[index], [field]: value };
    
    // Ensure end time is after start time
    if (field === 'start' && updatedSlots[index].end <= value) {
      const startHour = parseInt(value.split(':')[0]);
      updatedSlots[index].end = `${Math.min(startHour + 1, 23)}:00`;
    }
    
    newSchedule[activeDay] = updatedSlots;
    onChange(newSchedule);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Weekly Schedule</Text>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.daysContainer}
      >
        {DAYS.map((day) => (
          <TouchableOpacity
            key={day.key}
            style={[
              styles.dayButton,
              activeDay === day.key && styles.activeDayButton,
            ]}
            onPress={() => setActiveDay(day.key)}
          >
            <Text
              style={[
                styles.dayText,
                activeDay === day.key && styles.activeDayText,
              ]}
            >
              {day.label}
            </Text>
            {schedule[day.key].length > 0 && (
              <View style={styles.slotCountBadge}>
                <Text style={styles.slotCountText}>{schedule[day.key].length}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      <View style={styles.timeSlotsContainer}>
        <View style={styles.dayHeader}>
          <Text style={styles.dayTitle}>
            {DAYS.find(d => d.key === activeDay)?.label} Schedule
          </Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddTimeSlot}
          >
            <Plus size={16} color={designTokens.colors.semantic.primary} />
            <Text style={styles.addButtonText}>Add Time Slot</Text>
          </TouchableOpacity>
        </View>
        
        {schedule[activeDay].length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No time slots added for this day</Text>
            <Text style={styles.emptySubtext}>Tap "Add Time Slot" to set your availability</Text>
          </View>
        ) : (
          schedule[activeDay].map((slot, index) => (
            <View key={index} style={styles.timeSlot}>
              <View style={styles.timeInputs}>
                <View style={styles.timeSelectContainer}>
                  <Text style={styles.timeLabel}>From</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.timeOptionsContainer}
                  >
                    {TIME_OPTIONS.map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          styles.timeOption,
                          slot.start === option.value && styles.selectedTimeOption,
                        ]}
                        onPress={() => handleUpdateTimeSlot(index, 'start', option.value)}
                      >
                        <Text
                          style={[
                            styles.timeOptionText,
                            slot.start === option.value && styles.selectedTimeOptionText,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
                
                <View style={styles.timeSelectContainer}>
                  <Text style={styles.timeLabel}>To</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.timeOptionsContainer}
                  >
                    {TIME_OPTIONS.filter(
                      option => option.value > slot.start
                    ).map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          styles.timeOption,
                          slot.end === option.value && styles.selectedTimeOption,
                        ]}
                        onPress={() => handleUpdateTimeSlot(index, 'end', option.value)}
                      >
                        <Text
                          style={[
                            styles.timeOptionText,
                            slot.end === option.value && styles.selectedTimeOptionText,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
              
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemoveTimeSlot(index)}
              >
                <Trash2 size={18} color={designTokens.colors.semantic.error} />
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: designTokens.colors.semantic.text,
  },
  daysContainer: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  dayButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: designTokens.colors.semantic.surface,
    marginRight: 8,
    borderWidth: 1,
    borderColor: designTokens.colors.semantic.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeDayButton: {
    backgroundColor: designTokens.colors.semantic.primary + '20',
    borderColor: designTokens.colors.semantic.primary,
  },
  dayText: {
    color: designTokens.colors.semantic.text,
    fontSize: 14,
  },
  activeDayText: {
    color: designTokens.colors.semantic.primary,
    fontWeight: 'bold',
  },
  slotCountBadge: {
    backgroundColor: designTokens.colors.semantic.primary,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  slotCountText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  timeSlotsContainer: {
    marginTop: 16,
    backgroundColor: designTokens.colors.semantic.surface,
    borderRadius: 12,
    padding: 16,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: designTokens.colors.semantic.text,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: designTokens.colors.semantic.primary + '20',
  },
  addButtonText: {
    color: designTokens.colors.semantic.primary,
    marginLeft: 4,
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: 16,
    color: designTokens.colors.semantic.textSecondary,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: designTokens.colors.semantic.textSecondary,
    opacity: 0.7,
  },
  timeSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: designTokens.colors.semantic.surface,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: designTokens.colors.semantic.border,
  },
  timeInputs: {
    flex: 1,
    gap: 12,
  },
  timeSelectContainer: {
    gap: 8,
  },
  timeLabel: {
    fontSize: 14,
    color: designTokens.colors.semantic.text,
    fontWeight: 'bold',
  },
  timeOptionsContainer: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  timeOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: designTokens.colors.semantic.surface,
    marginRight: 8,
    borderWidth: 1,
    borderColor: designTokens.colors.semantic.border,
  },
  selectedTimeOption: {
    backgroundColor: designTokens.colors.semantic.primary + '20',
    borderColor: designTokens.colors.semantic.primary,
  },
  timeOptionText: {
    color: designTokens.colors.semantic.text,
    fontSize: 14,
  },
  selectedTimeOptionText: {
    color: designTokens.colors.semantic.primary,
    fontWeight: 'bold',
  },
  removeButton: {
    padding: 8,
  },
});
