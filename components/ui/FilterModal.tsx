import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { colors, spacing, typography } from '@/constants/colors';
import { Check } from 'lucide-react-native';

interface FilterOption {
  id: string;
  label: string;
  value: any;
}

interface FilterSection {
  id: string;
  title: string;
  type: 'single' | 'multiple';
  options?: FilterOption[];
  min?: number;
  max?: number;
  step?: number;
}

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  sections: FilterSection[];
  selectedFilters: Record<string, any>;
  onApplyFilters: (filters: Record<string, any>) => void;
  onClearFilters: () => void;
}

export const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  sections,
  selectedFilters,
  onApplyFilters,
  onClearFilters,
}) => {
  const [tempFilters, setTempFilters] = React.useState(selectedFilters);

  React.useEffect(() => {
    setTempFilters(selectedFilters);
  }, [selectedFilters, visible]);

  const handleOptionSelect = (sectionId: string, optionValue: any, type: 'single' | 'multiple') => {
    setTempFilters(prev => {
      if (type === 'single') {
        return {
          ...prev,
          [sectionId]: optionValue,
        };
      } else {
        const currentValues = prev[sectionId] || [];
        const isSelected = currentValues.includes(optionValue);
        
        return {
          ...prev,
          [sectionId]: isSelected
            ? currentValues.filter((v: any) => v !== optionValue)
            : [...currentValues, optionValue],
        };
      }
    });
  };

  const handleApply = () => {
    onApplyFilters(tempFilters);
    onClose();
  };

  const handleClear = () => {
    setTempFilters({});
    onClearFilters();
  };

  const isOptionSelected = (sectionId: string, optionValue: any, type: 'single' | 'multiple') => {
    const sectionValue = tempFilters[sectionId];
    
    if (type === 'single') {
      return sectionValue === optionValue;
    } else {
      return Array.isArray(sectionValue) && sectionValue.includes(optionValue);
    }
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="Filters"
      size="large"
    >
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {sections.map((section) => (
          <View key={section.id} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            
            {section.options && (
              <View style={styles.optionsContainer}>
                {section.options.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.option,
                      isOptionSelected(section.id, option.value, section.type) && styles.optionSelected,
                    ]}
                    onPress={() => handleOptionSelect(section.id, option.value, section.type)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        isOptionSelected(section.id, option.value, section.type) && styles.optionTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                    
                    {isOptionSelected(section.id, option.value, section.type) && (
                      <Check size={16} color={colors.coral} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        ))}
      </ScrollView>
      
      <View style={styles.footer}>
        <Button
          title="Clear All"
          variant="outline"
          onPress={handleClear}
          style={styles.clearButton}
        />
        <Button
          title="Apply Filters"
          variant="coral"
          onPress={handleApply}
          style={styles.applyButton}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  optionsContainer: {
    gap: spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  optionSelected: {
    backgroundColor: colors.coral + '10',
    borderColor: colors.coral,
  },
  optionText: {
    fontSize: typography.sizes.base,
    color: colors.text,
    flex: 1,
  },
  optionTextSelected: {
    color: colors.coral,
    fontWeight: typography.weights.medium,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  clearButton: {
    flex: 1,
  },
  applyButton: {
    flex: 2,
  },
});