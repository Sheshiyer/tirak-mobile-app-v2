import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Modal } from '@/components/ui/Modal';
import { colors, spacing, typography } from '@/constants/colors';
import { Check } from 'lucide-react-native';

interface SortOption {
  id: string;
  label: string;
  value: string;
}

interface SortModalProps {
  visible: boolean;
  onClose: () => void;
  options: SortOption[];
  selectedSort: string;
  onSelectSort: (sortValue: string) => void;
}

export const SortModal: React.FC<SortModalProps> = ({
  visible,
  onClose,
  options,
  selectedSort,
  onSelectSort,
}) => {
  const handleSelectSort = (sortValue: string) => {
    onSelectSort(sortValue);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="Sort By"
      size="medium"
    >
      <View style={styles.content}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.option,
              selectedSort === option.value && styles.optionSelected,
            ]}
            onPress={() => handleSelectSort(option.value)}
          >
            <Text
              style={[
                styles.optionText,
                selectedSort === option.value && styles.optionTextSelected,
              ]}
            >
              {option.label}
            </Text>
            
            {selectedSort === option.value && (
              <Check size={20} color={colors.coral} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  optionSelected: {
    backgroundColor: colors.coral + '10',
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
});