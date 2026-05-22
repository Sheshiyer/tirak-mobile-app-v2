import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, Animated, Image } from 'react-native';
import { router } from 'expo-router';
import { Logo } from '@/components/ui/Logo';
import { Card } from '@/components/ui/Card';
import { designTokens } from '@/constants/design-tokens';
import { Search, Filter, Clock, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

function getTimeOfDayGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Good night';
}
interface SearchHeaderProps {
  userName?: string;
  isCompanion: boolean;
}

const defaultSuggestions = [
  'Tour guide Bangkok',
  'Local dining guide',
  'Shopping tour',
  'Cultural experience',
  'Language practice',
  'Local food tour',
  'Temple visit guide',
  'Beach activities',
  'Evening bar tour',
  'Business meeting assistant'
];

const defaultSearchHistory = [
  'Bangkok tour guide',
  'Phuket island hopping',
  'Chiang Mai cultural tour',
  'Shopping tour Bangkok'
];

export const SearchHeader: React.FC<SearchHeaderProps> = ({ userName, isCompanion }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchHistory, setSearchHistory] = useState(defaultSearchHistory);
  const { t } = useTranslation();
  const greeting = useMemo(() => getTimeOfDayGreeting(), []);

  const handleSearchPress = () => {
    if (searchQuery.trim()) {
      // Add to search history
      const newHistory = [searchQuery, ...searchHistory.filter(item => item !== searchQuery)].slice(0, 5);
      setSearchHistory(newHistory);
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    } else {
      router.push('/search');
    }
    setShowSuggestions(false);
  };

  const handleSuggestionPress = (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    const newHistory = [suggestion, ...searchHistory.filter(item => item !== suggestion)].slice(0, 5);
    setSearchHistory(newHistory);
    router.push(`/search?q=${encodeURIComponent(suggestion)}`);
  };

  const handleSearchFocus = () => {
    setShowSuggestions(true);
  };

  const handleSearchBlur = () => {
    // Delay hiding suggestions to allow for suggestion tap
    setTimeout(() => setShowSuggestions(false), 150);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setShowSuggestions(false);
  };

  const filteredSuggestions = searchQuery
    ? defaultSuggestions.filter(suggestion =>
        suggestion.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5)
    : [];

  const showSearchHistory = showSuggestions && !searchQuery && searchHistory.length > 0;
  const showFilteredSuggestions = showSuggestions && searchQuery && filteredSuggestions.length > 0;

  return (
    <View style={styles.container}>
      <View style={styles.headerTop}>
        <View style={styles.logoContainer}>
        <Image source={require('@/assets/images/tirak.png')} style={styles.logo} />
        </View>
        <Text style={styles.greeting}>
          {greeting}, {userName?.split(' ')[0] || t('userHome.there')}!
        </Text>
      </View>

      {!isCompanion && (
      <View style={styles.searchWrapper}>
        <Card style={styles.searchCard} padding={0} shadow="sm">
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Search size={20} color={designTokens.colors.semantic.textSecondary} />
              
              <TextInput
                style={styles.searchInput}
                placeholder={t('userHome.searchPlaceholder')}
                placeholderTextColor={designTokens.colors.semantic.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onFocus={handleSearchFocus}
                onBlur={handleSearchBlur}
                onSubmitEditing={handleSearchPress}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                  <X size={16} color={designTokens.colors.semantic.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => router.push('/search')}
              activeOpacity={0.7}
            >
              <Filter size={20} color={designTokens.colors.semantic.accent} />
            </TouchableOpacity>
          </View>
        </Card>

      
        {(showSearchHistory || showFilteredSuggestions) && (
          <Card style={styles.suggestionsCard} padding={0} shadow="md">
            {showSearchHistory && (
              <View style={styles.suggestionsSection}>
                <View style={styles.suggestionsSectionHeader}>
                  <Clock size={16} color={designTokens.colors.semantic.textSecondary} />
                  <Text style={styles.suggestionsSectionTitle}>{t('userHome.recentSearches')}</Text>
                </View>
                {searchHistory.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.suggestionItem}
                    onPress={() => handleSuggestionPress(item)}
                  >
                    <Clock size={16} color={designTokens.colors.semantic.textSecondary} />
                    <Text style={styles.suggestionText}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {showFilteredSuggestions && (
              <View style={styles.suggestionsSection}>
                <View style={styles.suggestionsSectionHeader}>
                  <Search size={16} color={designTokens.colors.semantic.textSecondary} />
                  <Text style={styles.suggestionsSectionTitle}>{t('userHome.suggestions')}</Text>
                </View>
                {filteredSuggestions.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.suggestionItem}
                    onPress={() => handleSuggestionPress(item)}
                  >
                    <Search size={16} color={designTokens.colors.semantic.textSecondary} />
                    <Text style={styles.suggestionText}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </Card>
        )}
      </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: designTokens.spacing.scale.lg,
    paddingTop: designTokens.spacing.scale.md,
    paddingBottom: designTokens.spacing.scale.lg,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: designTokens.spacing.scale.lg,
  },
  greeting: {
    fontSize: designTokens.typography.sizes.large,
    fontWeight: '600',
    color: designTokens.colors.semantic.text,
    marginLeft: designTokens.spacing.scale.md,
  },
  searchWrapper: {
    position: 'relative',
    zIndex: 1000,
  },
  searchCard: {
    borderRadius: designTokens.borderRadius.xxl,
    overflow: 'hidden',
    backgroundColor: designTokens.colors.semantic.surface,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: designTokens.spacing.scale.lg,
    paddingVertical: designTokens.spacing.scale.md,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    marginLeft: designTokens.spacing.scale.md,
    fontSize: designTokens.typography.sizes.body,
    color: designTokens.colors.semantic.text,
  },
  clearButton: {
    padding: designTokens.spacing.scale.xs,
    marginLeft: designTokens.spacing.scale.sm,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: designTokens.borderRadius.lg,
    backgroundColor: designTokens.colors.semantic.accent + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestionsCard: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: designTokens.spacing.scale.xs,
    borderRadius: designTokens.borderRadius.lg,
    backgroundColor: designTokens.colors.semantic.surface,
    maxHeight: 300,
    zIndex: 1001,
  },
  suggestionsSection: {
    paddingVertical: designTokens.spacing.scale.sm,
  },
  suggestionsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: designTokens.spacing.scale.lg,
    paddingVertical: designTokens.spacing.scale.sm,
    borderBottomWidth: 1,
    borderBottomColor: designTokens.colors.semantic.border,
  },
  suggestionsSectionTitle: {
    fontSize: designTokens.typography.sizes.caption,
    fontWeight: '500',
    color: designTokens.colors.semantic.textSecondary,
    marginLeft: designTokens.spacing.scale.sm,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: designTokens.spacing.scale.lg,
    paddingVertical: designTokens.spacing.scale.md,
    borderBottomWidth: 1,
    borderBottomColor: designTokens.colors.semantic.border + '50',
  },
  suggestionText: {
    fontSize: designTokens.typography.sizes.body,
    color: designTokens.colors.semantic.text,
    marginLeft: designTokens.spacing.scale.md,
  },
  logo: { 
    width: 30,
    height: 30,
  },
  logoContainer: {
    width: 40,
    height: 40,
    padding: 10,
    borderRadius: 10,
    backgroundColor: designTokens.colors.semantic.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
