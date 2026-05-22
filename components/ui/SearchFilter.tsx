import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { colors, spacing, typography } from '@/constants/colors';
import { Filter, X } from 'lucide-react-native';

interface FilterChip {
  id: string;
  label: string;
  value: any;
  removable?: boolean;
}

interface SearchFilterProps {
  activeFilters: FilterChip[];
  onRemoveFilter: (filterId: string) => void;
  onClearAll: () => void;
  onOpenFilters: () => void;
  style?: any;
}

export const SearchFilter: React.FC<SearchFilterProps> = ({
  activeFilters,
  onRemoveFilter,
  onClearAll,
  onOpenFilters,
  style,
}) => {
  const hasFilters = activeFilters.length > 0;

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.filterButton} onPress={onOpenFilters}>
          <Filter size={20} color={colors.primary} />
          <Text style={styles.filterButtonText}>Filters</Text>
          {hasFilters && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilters.length}</Text>
            </View>
          )}
        </TouchableOpacity>
        
        {hasFilters && (
          <TouchableOpacity onPress={onClearAll} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {hasFilters && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersScroll}
          contentContainerStyle={styles.filtersContent}
        >
          {activeFilters.map((filter) => (
            <View key={filter.id} style={styles.filterChip}>
              <Text style={styles.filterChipText}>{filter.label}</Text>
              {filter.removable !== false && (
                <TouchableOpacity
                  onPress={() => onRemoveFilter(filter.id)}
                  style={styles.removeButton}
                >
                  <X size={14} color={colors.primary} />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    paddingVertical: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '10',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 20,
    gap: spacing.sm,
  },
  filterButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.primary,
  },
  filterBadge: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.xs,
  },
  filterBadgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.white,
  },
  clearButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  clearButtonText: {
    fontSize: typography.sizes.sm,
    color: colors.textLight,
  },
  filtersScroll: {
    paddingLeft: spacing.md,
  },
  filtersContent: {
    paddingRight: spacing.md,
    gap: spacing.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '10',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 16,
    gap: spacing.sm,
  },
  filterChipText: {
    fontSize: typography.sizes.sm,
    color: colors.primary,
  },
  removeButton: {
    padding: 2,
  },
});