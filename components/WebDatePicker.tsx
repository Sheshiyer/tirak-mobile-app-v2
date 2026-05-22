import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import { designTokens } from "@/constants/design-tokens";
import { useTranslation } from "react-i18next";

interface WebDatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  onDone: () => void;
  maximumDate?: Date;
  minimumDate?: Date;
  doneButtonText?: string;
  allowPastDates?: boolean; // When true, allows selecting past dates (useful for birth date pickers)
}

export const WebDatePicker: React.FC<WebDatePickerProps> = ({
  value,
  onChange,
  onDone,
  maximumDate = new Date(),
  minimumDate,
  doneButtonText,
  allowPastDates = false,
}) => {
  const { t } = useTranslation();
  const [tempDate, setTempDate] = useState(value);
  const defaultDoneButtonText = doneButtonText || t('common.done');
  
  // Get today's date for comparison
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const maxDate = maximumDate || today;
  const minDate = minimumDate || new Date(today.getFullYear() - 100, 0, 1);
  
  const currentYear = maxDate.getFullYear();
  const currentMonth = maxDate.getMonth();
  const currentDay = maxDate.getDate();
  const minYear = minDate.getFullYear();
  
  // Generate years array (from current year down to min year)
  const years = Array.from(
    { length: currentYear - minYear + 1 },
    (_, i) => currentYear - i
  );
  
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // Check if a month is disabled (past months in current year are disabled)
  const isMonthDisabled = (monthIndex: number) => {
    // If allowPastDates is true, don't disable any months
    if (allowPastDates) return false;
    
    if (tempDate.getFullYear() > currentYear) return false; // Allow all months in future years
    if (tempDate.getFullYear() < currentYear) return true; // Disable all months in past years
    // In current year: disable past months (months before current month)
    return monthIndex < currentMonth;
  };

  // Check if a day is disabled (past dates in current month are disabled)
  const isDayDisabled = (day: number) => {
    // If allowPastDates is true, don't disable any days
    if (allowPastDates) return false;
    
    if (tempDate.getFullYear() < currentYear) return true; // Disable all days in past years
    if (tempDate.getFullYear() > currentYear) return false; // Allow all days in future years
    if (tempDate.getMonth() < currentMonth) return true; // Disable all days in past months
    if (tempDate.getMonth() > currentMonth) return false; // Allow all days in future months
    // In current month: disable past days (days before today)
    return day < currentDay;
  };

  // Check if a year is disabled
  const isYearDisabled = (year: number) => {
    // If allowPastDates is true, only respect maximumDate if provided
    if (allowPastDates) {
      return maximumDate ? year > maximumDate.getFullYear() : false;
    }
    return year > currentYear; // Disable future years
  };

  // Calculate days in month
  const daysInMonth = new Date(
    tempDate.getFullYear(),
    tempDate.getMonth() + 1,
    0
  ).getDate();
  
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const handleDone = () => {
    onChange(tempDate);
    onDone();
  };

  const handleMonthChange = (monthIndex: number) => {
    const newDate = new Date(tempDate);
    newDate.setMonth(monthIndex);
    
    // Adjust day if it exceeds the days in the new month
    const daysInNewMonth = new Date(
      newDate.getFullYear(),
      monthIndex + 1,
      0
    ).getDate();
    
    if (newDate.getDate() > daysInNewMonth) {
      newDate.setDate(daysInNewMonth);
    }
    
    setTempDate(newDate);
  };

  const handleDayChange = (day: number) => {
    const newDate = new Date(tempDate);
    newDate.setDate(day);
    setTempDate(newDate);
  };

  const handleYearChange = (year: number) => {
    const newDate = new Date(tempDate);
    newDate.setFullYear(year);
    
    // Adjust day if it's Feb 29 and new year is not a leap year
    const daysInNewMonth = new Date(
      year,
      newDate.getMonth() + 1,
      0
    ).getDate();
    
    if (newDate.getDate() > daysInNewMonth) {
      newDate.setDate(daysInNewMonth);
    }
    
    setTempDate(newDate);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleDone}>
          <Text style={styles.doneButton}>{defaultDoneButtonText}</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.pickerContent}>
        {/* Month Column */}
        <View style={styles.column}>
          <Text style={styles.columnHeader}>{t('availability.month')}</Text>
          <ScrollView 
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            {months.map((month, index) => {
              const disabled = isMonthDisabled(index);
              return (
                <TouchableOpacity
                  key={month}
                  style={[
                    styles.option,
                    tempDate.getMonth() === index && styles.optionSelected,
                    disabled && styles.optionDisabled,
                  ]}
                  onPress={() => !disabled && handleMonthChange(index)}
                  disabled={disabled}
                >
                  <Text
                    style={[
                      styles.optionText,
                      tempDate.getMonth() === index && styles.optionTextSelected,
                      disabled && styles.optionTextDisabled,
                    ]}
                  >
                    {month}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Day Column */}
        <View style={styles.column}>
          <Text style={styles.columnHeader}>{t('availability.day')}</Text>
          <ScrollView 
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            {days.map((day) => {
              const disabled = isDayDisabled(day);
              return (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.option,
                    tempDate.getDate() === day && styles.optionSelected,
                    disabled && styles.optionDisabled,
                  ]}
                  onPress={() => !disabled && handleDayChange(day)}
                  disabled={disabled}
                >
                  <Text
                    style={[
                      styles.optionText,
                      tempDate.getDate() === day && styles.optionTextSelected,
                      disabled && styles.optionTextDisabled,
                    ]}
                  >
                    {day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Year Column */}
        <View style={styles.column}>
          <Text style={styles.columnHeader}>{t('availability.year')}</Text>
          <ScrollView 
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            {years.map((year) => {
              const disabled = isYearDisabled(year);
              return (
                <TouchableOpacity
                  key={year}
                  style={[
                    styles.option,
                    tempDate.getFullYear() === year && styles.optionSelected,
                    disabled && styles.optionDisabled,
                  ]}
                  onPress={() => !disabled && handleYearChange(year)}
                  disabled={disabled}
                >
                  <Text
                    style={[
                      styles.optionText,
                      tempDate.getFullYear() === year && styles.optionTextSelected,
                      disabled && styles.optionTextDisabled,
                    ]}
                  >
                    {year}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
  },
  doneButton: {
    color: designTokens.colors.semantic.primary,
    fontSize: 16,
    fontWeight: "600",
  },
  pickerContent: {
    flexDirection: "row",
    height: 250,
  },
  column: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: "rgba(0, 0, 0, 0.05)",
  },
  columnHeader: {
    textAlign: "center",
    paddingVertical: 8,
    fontSize: 12,
    fontWeight: "600",
    color: designTokens.colors.semantic.text,
    opacity: 0.6,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.05)",
  },
  scrollView: {
    flex: 1,
  },
  option: {
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  optionSelected: {
    backgroundColor: `${designTokens.colors.semantic.primary}20`,
  },
  optionText: {
    fontSize: 14,
    color: designTokens.colors.semantic.text,
  },
  optionTextSelected: {
    color: designTokens.colors.semantic.primary,
    fontWeight: "600",
  },
  optionDisabled: {
    opacity: 0.4,
  },
  optionTextDisabled: {
    color: designTokens.colors.semantic.textSecondary,
    opacity: 0.5,
  },
});