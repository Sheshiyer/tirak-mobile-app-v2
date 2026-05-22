import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '@/constants/colors';
import { Search, X, Filter } from 'lucide-react-native';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
  onFilter?: () => void;
  showFilter?: boolean;
  autoFocus?: boolean;
  style?: any;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Search...',
  onClear,
  onFilter,
  showFilter = false,
  autoFocus = false,
  style,
}) => {
  const handleClear = () => {
    onChangeText('');
    onClear?.();
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.searchContainer}>
        <Search size={20} color={colors.textLight} style={styles.searchIcon} />
        
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={colors.textLight}
          value={value}
          onChangeText={onChangeText}
          autoFocus={autoFocus}
          returnKeyType="search"
        />
        
        {value.length > 0 && (
          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <X size={20} color={colors.textLight} />
          </TouchableOpacity>
        )}
      </View>
      
      {showFilter && (
        <TouchableOpacity onPress={onFilter} style={styles.filterButton}>
          <Filter size={20} color={colors.coral} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    height: 48,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: typography.sizes.base,
    color: colors.text,
    paddingVertical: 0,
  },
  clearButton: {
    padding: spacing.sm,
    marginRight: -spacing.sm,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});