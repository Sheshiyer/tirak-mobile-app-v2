import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { designTokens } from '@/constants/design-tokens';
import { Check } from 'lucide-react-native';

interface Option {
  id: string;
  name: string;
  icon?: string;
}

interface MultiSelectProps {
  options: Option[];
  selectedIds: string[];
  onSelect: (id: string) => void;
  title?: string;
  gridLayout?: boolean;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  selectedIds,
  onSelect,
  title,
  gridLayout = false,
}) => {
  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      
      <ScrollView 
        horizontal={!gridLayout}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={gridLayout ? styles.gridContainer : styles.rowContainer}
      >
        {options.map((option) => {
          const isSelected = selectedIds.includes(option.id);
          
          return (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.option,
                gridLayout && styles.gridOption,
                isSelected && styles.selectedOption,
              ]}
              onPress={() => onSelect(option.id)}
            >
              {option.icon && (
                <Text style={styles.icon}>{option.icon}</Text>
              )}
              <Text 
                style={[
                  styles.optionText,
                  isSelected && styles.selectedOptionText,
                ]}
                numberOfLines={1}
              >
                {option.name}
              </Text>
              {isSelected && (
                <View style={styles.checkContainer}>
                  <Check size={14} color="white" />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      
      {selectedIds.length > 0 && (
        <Text style={styles.selectedCount}>
          {selectedIds.length} selected
        </Text>
      )}
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
    marginBottom: 8,
    color: designTokens.colors.semantic.text,
  },
  rowContainer: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: designTokens.colors.semantic.surface,
    marginRight: 8,
    borderWidth: 1,
    borderColor: designTokens.colors.semantic.border,
  },
  gridOption: {
    width: '48%',
    marginRight: 0,
  },
  selectedOption: {
    backgroundColor: designTokens.colors.semantic.primary + '20',
    borderColor: designTokens.colors.semantic.primary,
  },
  icon: {
    fontSize: 16,
    marginRight: 8,
  },
  optionText: {
    color: designTokens.colors.semantic.text,
    fontSize: 14,
  },
  selectedOptionText: {
    color: designTokens.colors.semantic.primary,
    fontWeight: 'bold',
  },
  checkContainer: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: designTokens.colors.semantic.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  selectedCount: {
    color: designTokens.colors.semantic.primary,
    fontSize: 14,
    marginTop: 8,
    fontWeight: 'bold',
  },
});