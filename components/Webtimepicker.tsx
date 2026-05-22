import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { designTokens } from "@/constants/design-tokens";
import { useTranslation } from "react-i18next";

interface WebTimePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  onDone: () => void;
  is24Hour?: boolean;
  doneButtonText?: string;
}

export const WebTimePicker: React.FC<WebTimePickerProps> = ({
  value,
  onChange,
  onDone,
  is24Hour = false,
  doneButtonText,
}) => {
  const [tempDate, setTempDate] = useState(value);
  const { t } = useTranslation();
  const defaultDoneButtonText = doneButtonText || t('common.done');
  const hours = is24Hour
    ? Array.from({ length: 24 }, (_, i) => i)
    : Array.from({ length: 12 }, (_, i) => i + 1);

  const minutes = Array.from({ length: 60 }, (_, i) => i);
  const periods = ["AM", "PM"];

  const handleDone = () => {
    onChange(tempDate);
    onDone();
  };

  const handleHourChange = (hour: number) => {
    const newDate = new Date(tempDate);
    if (is24Hour) {
      newDate.setHours(hour);
    } else {
      const isPM = newDate.getHours() >= 12;
      const adjustedHour = hour === 12 ? 0 : hour;
      newDate.setHours(isPM ? adjustedHour + 12 : adjustedHour);
    }
    setTempDate(newDate);
  };

  const handleMinuteChange = (minute: number) => {
    const newDate = new Date(tempDate);
    newDate.setMinutes(minute);
    setTempDate(newDate);
  };

  const handlePeriodChange = (period: string) => {
    const newDate = new Date(tempDate);
    const currentHour = newDate.getHours();
    if (period === "AM" && currentHour >= 12) {
      newDate.setHours(currentHour - 12);
    } else if (period === "PM" && currentHour < 12) {
      newDate.setHours(currentHour + 12);
    }
    setTempDate(newDate);
  };

  const getCurrentHour = () => {
    const hour = tempDate.getHours();
    if (is24Hour) {
      return hour;
    }
    return hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  };

  const getCurrentPeriod = () => {
    return tempDate.getHours() >= 12 ? "PM" : "AM";
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleDone}>
          <Text style={styles.doneButton}>{defaultDoneButtonText}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.pickerContent}>
        {/* Hour Column */}
        <View style={styles.column}>
          <Text style={styles.columnHeader}>{t('availability.hour')}</Text>
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {hours.map((hour) => (
              <TouchableOpacity
                key={hour}
                style={[
                  styles.option,
                  getCurrentHour() === hour && styles.optionSelected,
                ]}
                onPress={() => handleHourChange(hour)}
              >
                <Text
                  style={[
                    styles.optionText,
                    getCurrentHour() === hour && styles.optionTextSelected,
                  ]}
                >
                  {hour.toString().padStart(2, "0")}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Minute Column */}
        <View style={styles.column}>
          <Text style={styles.columnHeader}>{t('availability.minute')}</Text>
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {minutes.map((minute) => (
              <TouchableOpacity
                key={minute}
                style={[
                  styles.option,
                  tempDate.getMinutes() === minute && styles.optionSelected,
                ]}
                onPress={() => handleMinuteChange(minute)}
              >
                <Text
                  style={[
                    styles.optionText,
                    tempDate.getMinutes() === minute && styles.optionTextSelected,
                  ]}
                >
                  {minute.toString().padStart(2, "0")}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* AM/PM Column (only for 12-hour format) */}
        {!is24Hour && (
          <View style={[styles.column, styles.periodColumn]}>
            <Text style={styles.columnHeader}>{t('availability.period')}</Text>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
              {periods.map((period) => (
                <TouchableOpacity
                  key={period}
                  style={[
                    styles.option,
                    getCurrentPeriod() === period && styles.optionSelected,
                  ]}
                  onPress={() => handlePeriodChange(period)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      getCurrentPeriod() === period && styles.optionTextSelected,
                    ]}
                  >
                    {period}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
    backgroundColor: "rgba(249, 249, 249, 1)",
  },
  doneButton: {
    color: designTokens.colors.semantic.primary,
    fontSize: 17,
    fontWeight: "600",
  },
  pickerContent: {
    flexDirection: "row",
    height: 200,
    backgroundColor: "white",
  },
  column: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: "rgba(0, 0, 0, 0.08)",
  },
  periodColumn: {
    flex: 0.8,
    borderRightWidth: 0,
  },
  columnHeader: {
    textAlign: "center",
    paddingVertical: 10,
    fontSize: 11,
    fontWeight: "600",
    color: designTokens.colors.semantic.text,
    opacity: 0.5,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.08)",
    backgroundColor: "rgba(249, 249, 249, 1)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  option: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 40,
  },
  optionSelected: {
    backgroundColor: `${designTokens.colors.semantic.primary}15`,
  },
  optionText: {
    fontSize: 18,
    color: designTokens.colors.semantic.text,
    fontWeight: "400",
  },
  optionTextSelected: {
    color: designTokens.colors.semantic.primary,
    fontWeight: "700",
    fontSize: 20,
  },
});