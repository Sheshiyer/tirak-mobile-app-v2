import { logger } from '@/utils/logger';
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Dimensions,
  Animated,
  Switch,
  Platform,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/auth-store';
import { Card } from '@/components/ui/Card';
import { ProfileImage } from '@/components/ui/ProfileImage';
import { CategoryChip } from '@/components/ui/CategoryChip';
import { RadialGradient } from '@/components/ui/RadialGradient';
import { designTokens } from '@/constants/design-tokens';
import { useCompanionsQuery, Companion as APICompanion, CompanionSearchParams } from '@/app/api/companion/companion';
import { Companion } from '@/types/companion';
import { SearchShimmer } from '@/components/ui/SearchShimmer';
import {
  Search,
  Filter,
  MapPin,
  Star,
  Grid3X3,
  List,
  Heart,
  MessageCircle,
  ChevronDown,
  X,
  Sliders,
  Calendar as CalendarIcon,
  Globe,
  DollarSign,
  ArrowUpDown,
  Check,
  Sparkles,
  Plane,
  Moon,
  Film,
  Umbrella,
  Compass,
  Award,
  Zap,
  Music,
  Dumbbell,
} from 'lucide-react-native';
import { CompanionCard } from '@/components/ui/CompanionCard';
import { useTranslation } from 'react-i18next';
import { usePostHog } from 'posthog-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  getCompanionDisplayName,
  getCompanionGallery,
  getCompanionImage,
  getCompanionLocation,
  getCompanionServices,
} from '@/utils/companion-display';

const { width, height } = Dimensions.get('window');

// Helper function to transform API companion data to match existing interface
const transformAPICompanion = (apiCompanion: any): Companion => {
  const services = getCompanionServices(apiCompanion);

  return {
    id: apiCompanion.id,
    name: getCompanionDisplayName(apiCompanion),
    age: 0,
    location: getCompanionLocation(apiCompanion),
    rating: apiCompanion.rating?.average ?? apiCompanion.rating ?? 0,
    reviews: apiCompanion.rating?.count ?? apiCompanion.reviewCount ?? 0,
    price: apiCompanion.price ?? 0,
    image: getCompanionImage(apiCompanion),
    services,
    languages: apiCompanion.languages || [],
    verified: apiCompanion.emailVerified || apiCompanion.phoneVerified || apiCompanion.verified || false,
    online: apiCompanion.online || false,
    category: (apiCompanion.categories && apiCompanion.categories[0]) || services[0] || 'general',
    bio: apiCompanion.bio || '',
    gallery: getCompanionGallery(apiCompanion),
  };
};



export default function SearchScreen() {
  const { t } = useTranslation();
  const categories = [
    { id: 'all', name: t('search.all'), iconComponent: Sparkles },
    { id: 'travel', name: t('search.travel'), iconComponent: Plane },
    { id: 'nightlife', name: t('search.nightlife'), iconComponent: Moon },
    { id: 'cinema', name: t('search.cinema'), iconComponent: Film },
    { id: 'holiday', name: t('search.holiday'), iconComponent: Umbrella },
    { id: 'wellness', name: t('search.wellness'), iconComponent: Award },
    { id: 'explorer', name: t('search.explorer'), iconComponent: Compass },
    { id: 'private', name: t('search.private'), iconComponent: Star },
    { id: 'events', name: t('search.events'), iconComponent: Music },
    { id: 'sports', name: t('search.sports'), iconComponent: Dumbbell },
  ];
  
  const locations = [t('search.allLocations'), t('search.bangkok'), t('search.phuket'), t('search.chiangMai'), t('search.pattaya')];
  
  const languages = [
    { id: 'thai', name: t('search.thai'), flag: '🇹🇭' },
    { id: 'english', name: t('search.english'), flag: '🇬🇧' },
    { id: 'chinese', name: t('search.chinese'), flag: '🇨🇳' },
    { id: 'japanese', name: t('search.japanese'), flag: '🇯🇵' },
    { id: 'korean', name: t('search.korean'), flag: '🇰🇷' },
    { id: 'russian', name: t('search.russian'), flag: '🇷🇺' },
    { id: 'german', name: t('search.german'), flag: '🇩🇪' },
    { id: 'french', name: t('search.french'), flag: '🇫🇷' },
  ];
  
  const sortOptions = [
    { id: 'relevance', name: t('search.mostRelevant'), icon: '🔍' },
    { id: 'price', name: t('search.priceLowToHigh'), icon: '💰' },
    { id: 'price_high', name: t('search.priceHighToLow'), icon: '💎' },
    { id: 'rating', name: t('search.highestRated'), icon: '⭐' },
    { id: 'reviews', name: t('search.mostReviews'), icon: '💬' },
    { id: 'distance', name: t('search.nearestFirst'), icon: '📍' },
    { id: 'newest', name: t('search.newestMembers'), icon: '🆕' },
  ];

  const posthog = usePostHog();
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('All Locations');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState([1000, 5000]);
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [sortBy, setSortBy] = useState('relevance');
  const isCompanion = user?.userType === 'companion' || user?.userType === 'supplier';

  // For filter modal animation
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const filterModalAnimation = useRef(new Animated.Value(0)).current;

  // For sort modal animation
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const sortModalAnimation = useRef(new Animated.Value(0)).current;

  // For location dropdown
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);

  // For date picker
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pendingDate, setPendingDate] = useState<Date | null>(null);

  // Build search parameters from filters
  const searchParams: CompanionSearchParams = React.useMemo(() => {
    const params: CompanionSearchParams = {};

    // Basic search
    if (searchQuery.trim()) {
      params.search = searchQuery.trim();
    }

    // Category filter
    if (selectedCategory !== 'all') {
      params.category = selectedCategory;
    }

    // Location filter
    if (selectedLocation !== 'All Locations') {
      params.location = selectedLocation;
    }

    // Price range
    params.minPrice = priceRange[0];
    params.maxPrice = priceRange[1];

    // Languages
    if (selectedLanguages.length > 0) {
      params.languages = selectedLanguages;
    }

    // Quick filters
    if (onlineOnly) {
      params.available = true;
    }
    if (verifiedOnly) {
      params.verified = true;
    }

    // Sorting
    const sortMap: Record<string, { sortBy: CompanionSearchParams['sortBy'], sortOrder: CompanionSearchParams['sortOrder'] }> = {
      'price': { sortBy: 'price', sortOrder: 'asc' },
      'price_high': { sortBy: 'price', sortOrder: 'desc' },
      'rating': { sortBy: 'rating', sortOrder: 'desc' },
      'reviews': { sortBy: 'reviews', sortOrder: 'desc' },
      'distance': { sortBy: 'distance', sortOrder: 'asc' },
      'relevance': { sortBy: 'rating', sortOrder: 'desc' }, // Default fallback
    };

    const sortConfig = sortMap[sortBy];
    if (sortConfig) {
      params.sortBy = sortConfig.sortBy;
      params.sortOrder = sortConfig.sortOrder;
    }

    return params;
  }, [searchQuery, selectedCategory, selectedLocation, priceRange, selectedLanguages, onlineOnly, verifiedOnly, sortBy]);

  // Track search_performed with a short debounce to avoid firing on every keystroke
  useEffect(() => {
    const hasQuery = !!searchQuery.trim();
    const hasFilters = selectedCategory !== 'all' || selectedLocation !== 'All Locations' || onlineOnly || verifiedOnly || selectedLanguages.length > 0;
    if (!hasQuery && !hasFilters) return;
    const timer = setTimeout(() => {
      posthog.capture('search_performed', {
        query: searchQuery.trim() || null,
        category: selectedCategory !== 'all' ? selectedCategory : null,
        location: selectedLocation !== 'All Locations' ? selectedLocation : null,
        online_only: onlineOnly,
        verified_only: verifiedOnly,
        language_count: selectedLanguages.length,
        sort_by: sortBy,
      });
    }, 800);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, selectedLocation, onlineOnly, verifiedOnly, selectedLanguages, sortBy]);

  // Fetch companions using the API
  const { data: companionsData, isLoading: companionsLoading, error: companionsError } = useCompanionsQuery(searchParams);

  // Transform API data to match existing interface
  const companions: Companion[] = React.useMemo(() => {
    const items = (companionsData?.data as any)?.items || (companionsData?.data as any)?.companions;
    if (!items) return [];
    return items.map(transformAPICompanion);
  }, [companionsData]);

  // Unified loading, error, and data
  const isLoading = companionsLoading;
  const error = companionsError;
  const dataList = companions;

  // #22: Active filter detection for badge on filter button
  const hasActiveFilters = React.useMemo(() => {
    return (
      selectedCategory !== 'all' ||
      selectedLocation !== 'All Locations' ||
      selectedLanguages.length > 0 ||
      onlineOnly ||
      verifiedOnly ||
      sortBy !== 'relevance'
    );
  }, [selectedCategory, selectedLocation, selectedLanguages, onlineOnly, verifiedOnly, sortBy]);

  const clearAllFilters = () => {
    setSelectedCategory('all');
    setSelectedLocation('All Locations');
    setSelectedLanguages([]);
    setOnlineOnly(false);
    setVerifiedOnly(false);
    setSortBy('relevance');
  };

  // Navigation handlers
  const handleCompanionPress = (companionId: string) => {
    router.push(`/companion/${companionId}`);
  };

  const handleMessagePress = (companionId: string) => {
    router.push(`/chat/${companionId}`);
  };

  const openFilterModal = () => {
    setFilterModalVisible(true);
    Animated.timing(filterModalAnimation, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeFilterModal = () => {
    Animated.timing(filterModalAnimation, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setFilterModalVisible(false);
    });
  };

  const openSortModal = () => {
    setSortModalVisible(true);
    Animated.timing(sortModalAnimation, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeSortModal = () => {
    Animated.timing(sortModalAnimation, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setSortModalVisible(false);
    });
  };

  const toggleLanguageSelection = (langName: string) => {
    setSelectedLanguages(prev => {
      if (prev.includes(langName)) {
        return prev.filter(l => l !== langName);
      } else {
        return [...prev, langName];
      }
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <RadialGradient variant="appBackground" style={styles.container}>
        <View style={styles.header}>
          <Card style={styles.searchCard} padding={0}>
            <View style={styles.searchContainer}>
              <View style={styles.searchBar}>
                <Search size={20} color={designTokens.colors.semantic.textSecondary} />
                <TextInput
                  style={styles.searchInput}
                  placeholder={t('search.searchPlaceholder')}
                  placeholderTextColor={designTokens.colors.semantic.textSecondary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
              <TouchableOpacity
                style={[styles.filterButton, showFilters && styles.filterButtonActive]}
                onPress={openFilterModal}
              >
                <Filter size={20} color={showFilters ? designTokens.colors.semantic.surface : designTokens.colors.semantic.primary} />
              </TouchableOpacity>
            </View>
          </Card>

          {/* Categories */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
          >
            {categories.map((category) => (
              <CategoryChip
                key={category.id}
                title={category.name}
                iconComponent={(category as any).iconComponent}
                selected={selectedCategory === category.id}
                onPress={() => setSelectedCategory(category.id)}
                style={styles.categoryChip}
              />
            ))}
          </ScrollView>
        </View>
        
        {/* Results Header with shimmer count */}
        <Card style={styles.resultsHeader} padding={16}>
          <View style={styles.resultsHeaderContent}>

            <Text style={styles.resultsCount}>
              {isCompanion ? t('search.loadingCompanions') : t('search.loadingCustomers')}
            </Text>
            <View style={styles.headerActions}>
              <View style={styles.viewToggle}>
                <TouchableOpacity
                  style={[styles.viewButton, viewMode === 'grid' && styles.viewButtonActive]}
                  onPress={() => setViewMode('grid')}
                >
                  <Grid3X3 size={18} color={viewMode === 'grid' ? designTokens.colors.semantic.surface : designTokens.colors.semantic.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.viewButton, viewMode === 'list' && styles.viewButtonActive]}
                  onPress={() => setViewMode('list')}
                >
                  <List size={18} color={viewMode === 'list' ? designTokens.colors.semantic.surface : designTokens.colors.semantic.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Card>

        <SearchShimmer viewMode={viewMode} count={viewMode === 'grid' ? 6 : 4} />
      </RadialGradient>
    );
  }

  // Error state
  if (error) {
    return (
      <RadialGradient variant="appBackground" style={styles.container}>
        <View style={styles.header}>
          <Card style={styles.searchCard} padding={0}>
            <View style={styles.searchContainer}>
              <View style={styles.searchBar}>
                <Search size={20} color={designTokens.colors.semantic.textSecondary} />
                <TextInput
                  style={styles.searchInput}
                  placeholder={t('search.searchPlaceholder')}
                  placeholderTextColor={designTokens.colors.semantic.textSecondary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
              <TouchableOpacity
                style={[styles.filterButton, showFilters && styles.filterButtonActive]}
                onPress={openFilterModal}
              >
                <Filter size={20} color={showFilters ? designTokens.colors.semantic.surface : designTokens.colors.semantic.primary} />
              </TouchableOpacity>
            </View>
          </Card>
        </View>
        
        {/* Results Header for error state */}
        <Card style={styles.resultsHeader} padding={16}>
          <View style={styles.resultsHeaderContent}>
            <Text style={styles.resultsCount}>
              {t('search.failedToLoadCompanions')}
            </Text>
          </View>
        </Card>

        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{t('search.somethingWentWrong')}</Text>
          <Text style={styles.errorSubtext}>{error.message}</Text>
        </View>
      </RadialGradient>
    );
  }

  // Debug: log companions array before rendering
  // logger.log('COMPANIONS FOR UI:', companions);

  const filterModalTranslateY = filterModalAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [height, 0],
  });

  const filterOverlayOpacity = filterModalAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.5],
  });

  const sortModalTranslateY = sortModalAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [height, 0],
  });

  const sortOverlayOpacity = sortModalAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.5],
  });

  const renderCompanionCard = ({ item }: { item: Companion }) => (
    <CompanionCard
      companion={item}
      viewMode={viewMode}
            onPress={() => handleCompanionPress(item.id)}
      onMessage={() => handleMessagePress(item.id)}
    />
  );

  const renderFilterModal = () => {
    if (!filterModalVisible) return null;

    return (
      <>
        <Animated.View
          style={[
            styles.modalOverlay,
            { opacity: filterOverlayOpacity }
          ]}
          pointerEvents="auto"
        >
          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={closeFilterModal}
            activeOpacity={1}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.filterModal,
            { transform: [{ translateY: filterModalTranslateY }] }
          ]}
        >
          <View style={styles.filterModalHeader}>
            <Text style={styles.filterModalTitle}>{t('search.filters')}</Text>
            <TouchableOpacity onPress={closeFilterModal}>
              <X size={24} color={designTokens.colors.semantic.surface} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.filterModalContent}>
            {/* Location Section */}
            <View style={styles.filterSection}>
              <View style={styles.filterSectionHeader}>
                <MapPin size={20} color={designTokens.colors.semantic.primary} />
                <Text style={styles.filterSectionTitle}>{t('search.location')}</Text>
              </View>
              
              <TouchableOpacity 
                style={styles.locationDropdown}
                onPress={() => setLocationDropdownOpen(!locationDropdownOpen)}
              >
                <Text style={styles.locationDropdownText}>{selectedLocation}</Text>
                <ChevronDown size={20} color={designTokens.colors.semantic.textSecondary} />
              </TouchableOpacity>
              
              {locationDropdownOpen && (
                <View style={styles.locationOptions}>
                  {locations.map((location) => (
                    <TouchableOpacity
                      key={location}
                      style={[
                        styles.locationOptions,
                        selectedLocation === location && styles.selectedLocationOption
                      ]}
                      onPress={() => {
                        setSelectedLocation(location);
                        setLocationDropdownOpen(false);
                      }}
                    >
                      <Text 
                        style={[
                          styles.locationOptionText,
                          selectedLocation === location && styles.selectedLocationOptionText
                        ]}
                      >
                        {location}
                      </Text>
                      {selectedLocation === location && (
                        <Check size={18} color={designTokens.colors.semantic.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
            
            {/* Price Range Section */}
            <View style={styles.filterSection}>
              <View style={styles.filterSectionHeader}>
                <DollarSign size={20} color={designTokens.colors.semantic.primary} />
                <Text style={styles.filterSectionTitle}>{t('search.priceRange')}</Text>
              </View>
              
              <View style={styles.priceRangeContainer}>
                <Text style={styles.priceRangeText}>
                  ฿{priceRange[0].toLocaleString()} - ฿{priceRange[1].toLocaleString()}
                </Text>
                
                {/* This would be a custom slider component in a real app */}
                <View style={styles.priceSlider}>
                  <View style={styles.priceSliderTrack} />
                  <View 
                    style={[
                      styles.priceSliderFill,
                      { 
                        width: `${((priceRange[1] - priceRange[0]) / 4000) * 100}%`,
                        left: `${((priceRange[0] - 1000) / 4000) * 100}%`
                      }
                    ]} 
                  />
                </View>
                
                <View style={styles.priceSliderLabels}>
                  <Text style={styles.priceSliderLabel}>฿1,000</Text>
                  <Text style={styles.priceSliderLabel}>฿5,000</Text>
                </View>
              </View>
            </View>
            
            {/* Languages Section */}
            <View style={styles.filterSection}>
              <View style={styles.filterSectionHeader}>
                <Globe size={20} color={designTokens.colors.semantic.primary} />
                <Text style={styles.filterSectionTitle}>{t('search.languages')}</Text>
              </View>
              
              <View style={styles.languagesContainer}>
                {languages.map((language) => (
                  <TouchableOpacity
                    key={language.id}
                    style={[
                      styles.languageChip,
                      selectedLanguages.includes(language.name) && styles.selectedLanguageChip
                    ]}
                    onPress={() => toggleLanguageSelection(language.name)}
                  >
                    <Text style={styles.languageFlag}>{language.flag}</Text>
                    <Text 
                      style={[
                        styles.languageChipText,
                        selectedLanguages.includes(language.name) && styles.selectedLanguageChipText
                      ]}
                    >
                      {language.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            {/* Availability Section */}
            <View style={styles.filterSection}>
              <View style={styles.filterSectionHeader}>
                <CalendarIcon size={20} color={designTokens.colors.semantic.primary} />
                <Text style={styles.filterSectionTitle}>{t('search.availability')}</Text>
              </View>
              
              <TouchableOpacity 
                style={styles.datePickerButton}
                onPress={() => {
                  setPendingDate(selectedDate || new Date());
                  setShowDatePicker(true);
                }}
              >
                <Text style={styles.datePickerButtonText}>
                  {selectedDate ? selectedDate.toLocaleDateString() : t('search.selectDate')}
                </Text>
                <CalendarIcon size={20} color={designTokens.colors.semantic.textSecondary} />
              </TouchableOpacity>
            </View>
            
            {/* Date Picker */}
            {Platform.OS === 'ios' ? (
              <Modal
                visible={showDatePicker}
                transparent
                animationType="fade"
                onRequestClose={() => setShowDatePicker(false)}
              >
                <View style={styles.dateModalOverlay}>
                  <View style={styles.dateModalContent}>
                    <DateTimePicker
                      value={pendingDate || new Date()}
                      mode="date"
                      display="spinner"
                      onChange={(_, date) => {
                        if (date) setPendingDate(date);
                      }}
                      minimumDate={new Date()}
                    />
                    <View style={styles.dateModalButtonRow}>
                      <TouchableOpacity
                        style={styles.dateModalButton}
                        onPress={() => setShowDatePicker(false)}
                      >
                        <Text style={styles.dateModalButtonText}>{t('search.cancel')}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.dateModalButton, styles.dateModalButtonPrimary]}
                        onPress={() => {
                          setShowDatePicker(false);
                          if (pendingDate) setSelectedDate(pendingDate);
                        }}
                      >
                        <Text style={[styles.dateModalButtonText, styles.dateModalButtonPrimaryText]}>{t('search.confirm')}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </Modal>
            ) : (
              showDatePicker && (
                <DateTimePicker
                  value={pendingDate || new Date()}
                  mode="date"
                  display="default"
                  onChange={(_, date) => {
                    setShowDatePicker(false);
                    if (date) setSelectedDate(date);
                  }}
                  minimumDate={new Date()}
                />
              )
            )}
            
            {/* Quick Filters Section */}
            <View style={styles.filterSection}>
              <View style={styles.filterSectionHeader}>
                <Sliders size={20} color={designTokens.colors.semantic.primary} />
                <Text style={styles.filterSectionTitle}>{t('search.quickFilters')}</Text>
              </View>
              
              <View style={styles.quickFiltersContainer}>
                <View style={styles.switchContainer}>
                  <Text style={styles.switchLabel}>{t('search.onlineNow')}</Text>
                  <Switch
                    value={onlineOnly}
                    onValueChange={setOnlineOnly}
                    trackColor={{ false: designTokens.colors.semantic.border, true: `${designTokens.colors.semantic.primary}80` }}
                    thumbColor={onlineOnly ? designTokens.colors.semantic.primary : designTokens.colors.semantic.surface}
                    ios_backgroundColor={designTokens.colors.semantic.border}
                  />
                </View>
                
                <View style={styles.switchContainer}>
                  <Text style={styles.switchLabel}>{t('search.verifiedOnly')}</Text>
                  <Switch
                    value={verifiedOnly}
                    onValueChange={setVerifiedOnly}
                    trackColor={{ false: designTokens.colors.semantic.border, true: `${designTokens.colors.semantic.primary}80` }}
                    thumbColor={verifiedOnly ? designTokens.colors.semantic.primary : designTokens.colors.semantic.surface}
                    ios_backgroundColor={designTokens.colors.semantic.border}
                  />
                </View>
              </View>
            </View>
          </ScrollView>
          
          <View style={styles.filterModalFooter}>
            <TouchableOpacity 
              style={styles.resetButton}
              onPress={() => {
                setSelectedLocation(t('search.allLocations'));
                setPriceRange([1000, 5000]);
                setSelectedLanguages([]);
                setSelectedDate(null);
                setOnlineOnly(false);
                setVerifiedOnly(false);
              }}
            >
                <Text style={styles.resetButtonText}>{t('search.reset')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.applyButton}
              onPress={closeFilterModal}
            >
              <Text style={styles.applyButtonText}>{t('search.applyFilters')}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </>
    );
  };

  const renderSortModal = () => {
    if (!sortModalVisible) return null;

    return (
      <>
        <Animated.View
          style={[
            styles.modalOverlay,
            { opacity: sortOverlayOpacity }
          ]}
          pointerEvents="auto"
        >
          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={closeSortModal}
            activeOpacity={1}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.sortModal,
            { transform: [{ translateY: sortModalTranslateY }] }
          ]}
        >
          <View style={styles.sortModalHeader}>
            <Text style={styles.sortModalTitle}>{t('search.sortBy')}</Text>
            <TouchableOpacity onPress={closeSortModal}>
              <X size={24} color={designTokens.colors.semantic.surface} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.sortModalContent}>
            {sortOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.sortOption,
                  sortBy === option.id && styles.selectedSortOption
                ]}
                onPress={() => {
                  setSortBy(option.id);
                  closeSortModal();
                }}
              >
                <View style={styles.sortOptionContent}>
                  <Text style={styles.sortOptionIcon}>{option.icon}</Text>
                  <Text
                    style={[
                      styles.sortOptionText,
                      sortBy === option.id && styles.selectedSortOptionText
                    ]}
                  >
                    {option.name}
                  </Text>
                </View>
                {sortBy === option.id && (
                  <Check size={20} color={designTokens.colors.semantic.primary} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>
      </>
    );
  };

  return (
    <RadialGradient variant="appBackground" style={styles.container}>
      <View style={styles.header}>
        <Card style={styles.searchCard} padding={0}>
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Search size={20} color={designTokens.colors.semantic.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder={t('search.searchPlaceholder')}
                placeholderTextColor={designTokens.colors.semantic.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            <TouchableOpacity
              style={[styles.filterButton, (showFilters || hasActiveFilters) && styles.filterButtonActive]}
              onPress={openFilterModal}
            >
              <Filter size={20} color={(showFilters || hasActiveFilters) ? designTokens.colors.semantic.surface : designTokens.colors.semantic.primary} />
              {hasActiveFilters && <View style={styles.filterBadge} />}
            </TouchableOpacity>
          </View>
        </Card>

        {/* Categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          {categories.map((category) => (
            <CategoryChip
              key={category.id}
              title={category.name}
              iconComponent={(category as any).iconComponent}
              selected={selectedCategory === category.id}
              onPress={() => setSelectedCategory(category.id)}
              style={styles.categoryChip}
            />
          ))}
        </ScrollView>

        {/* Filters Panel */}
        {showFilters && (
          <Card style={styles.filtersPanel} padding={16}>
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>{t('search.location')}</Text>
              <TouchableOpacity style={styles.filterDropdown}>
                <Text style={styles.filterDropdownText}>{selectedLocation}</Text>
                <ChevronDown size={16} color={designTokens.colors.semantic.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>{t('search.quickFilters')}</Text>
              <View style={styles.quickFilters}>
                <CategoryChip
                  title={t('search.onlineNow')}
                  selected={onlineOnly}
                  onPress={() => setOnlineOnly(!onlineOnly)}
                  size="small"
                  style={styles.quickFilterChip}
                />
                <CategoryChip
                  title={t('search.verifiedOnly')}
                  selected={verifiedOnly}
                  onPress={() => setVerifiedOnly(!verifiedOnly)}
                  size="small"
                  style={styles.quickFilterChip}
                />
              </View>
            </View>
          </Card>
        )}
      </View>

      {/* Results Header */}
      <Card style={styles.resultsHeader} padding={16}>
        <View style={styles.resultsHeaderContent}>
          <Text style={styles.resultsCount}>
            {companions.length} {t('search.found')}
          </Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.sortButton}
              onPress={openSortModal}
            >
              <ArrowUpDown size={16} color={designTokens.colors.semantic.primary} />
              <Text style={styles.sortButtonText}>
                {sortOptions.find(opt => opt.id === sortBy)?.name || t('search.sortBy')}
              </Text>
            </TouchableOpacity>

            <View style={styles.viewToggle}>
              <TouchableOpacity
                style={[styles.viewButton, viewMode === 'grid' && styles.viewButtonActive]}
                onPress={() => setViewMode('grid')}
              >
                <Grid3X3 size={18} color={viewMode === 'grid' ? designTokens.colors.semantic.surface : designTokens.colors.semantic.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.viewButton, viewMode === 'list' && styles.viewButtonActive]}
                onPress={() => setViewMode('list')}
              >
                <List size={18} color={viewMode === 'list' ? designTokens.colors.semantic.surface : designTokens.colors.semantic.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Card>

      {/* Results */}
      {dataList.length === 0 ? (
        <View style={styles.emptyStateContainer}>
          <View style={styles.emptyStateIcon}>
            <Search size={48} color={designTokens.colors.semantic.textSecondary} />
          </View>
          {!isCompanion ? (
            <>
              <Text style={styles.emptyStateTitle}>{t('search.noCompanionsFound')}</Text>
              <Text style={styles.emptyStateSubtitle}>
                {t('search.tryAdjustingCompanions')}
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.emptyStateTitle}>{t('search.noCustomersFound')}</Text>
              <Text style={styles.emptyStateSubtitle}>
                {t('search.tryAdjustingCustomers')}
              </Text>
            </>
          )}
          {(hasActiveFilters || searchQuery.trim() !== '') && (
            <TouchableOpacity style={styles.clearFiltersButton} onPress={() => { clearAllFilters(); setSearchQuery(''); }}>
              <Text style={styles.clearFiltersText}>{t('search.clearFilters')}</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={dataList}
          renderItem={renderCompanionCard}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          numColumns={viewMode === 'grid' ? 2 : 1}
          key={viewMode}
          contentContainerStyle={styles.resultsContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      {renderFilterModal()}
      {renderSortModal()}
    </RadialGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    gap: 16,
  },
  searchCard: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: designTokens.colors.semantic.text,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(111, 76, 170, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  filterButtonActive: {
    backgroundColor: designTokens.colors.semantic.primary,
  },
  categoriesContainer: {
    paddingRight: 20,
    gap: 8,
  },
  categoryChip: {
    marginRight: 0,
  },
  filtersPanel: {
    gap: 16,
  },
  filterSection: {
    gap: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: designTokens.colors.semantic.text,
  },
  filterDropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: designTokens.colors.semantic.border,
    borderRadius: 8,
  },
  filterDropdownText: {
    fontSize: 14,
    color: designTokens.colors.semantic.text,
  },
  quickFilters: {
    flexDirection: 'row',
    gap: 8,
  },
  quickFilterChip: {
    marginRight: 0,
  },
  resultsHeader: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  resultsHeaderContent: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  resultsCount: {
    fontSize: designTokens.typography.sizes.body,
    fontWeight: '600',
    color: designTokens.colors.semantic.text,
    marginBottom: 16,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: `${designTokens.colors.semantic.primary}10`,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: `${designTokens.colors.semantic.primary}30`,
  },
  sortButtonText: {
    fontSize: 14,
    color: designTokens.colors.semantic.primary,
    fontWeight: '500',
    marginLeft: 6,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: designTokens.colors.semantic.border,
    borderRadius: 20,
    padding: 2,
  },
  viewButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
  },
  viewButtonActive: {
    backgroundColor: designTokens.colors.semantic.primary,
  },
  resultsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  // Grid view styles
  gridCard: {
    flex: 1,
    margin: 5,
    overflow: 'hidden',
  },
  gridCardContent: {
    flex: 1,
  },
  imageContainer: {
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: 150,
  },
  onlineIndicatorGrid: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: designTokens.colors.semantic.success,
    borderWidth: 2,
    borderColor: designTokens.colors.semantic.surface,
  },
  favoriteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridContent: {
    padding: 12,
  },
  // List view styles
  listCard: {
    marginBottom: 16,
    overflow: 'hidden',
  },
  listCardContent: {
    flexDirection: 'row',
  },
  listImage: {
    width: 100,
    height: 120,
  },
  listContent: {
    flex: 1,
    padding: 12,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  companionName: {
    fontSize: 16,
    fontWeight: '600',
    color: designTokens.colors.semantic.text,
    flex: 1,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationText: {
    fontSize: 12,
    color: designTokens.colors.semantic.textSecondary,
    marginLeft: 4,
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: designTokens.colors.semantic.success,
    marginLeft: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 12,
    color: designTokens.colors.semantic.text,
    marginLeft: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 16,
    fontWeight: '600',
    color: designTokens.colors.semantic.primary,
  },
  priceUnit: {
    fontSize: 12,
    color: designTokens.colors.semantic.textSecondary,
    marginLeft: 2,
  },
  servicesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  serviceChip: {
    marginRight: 0,
  },
  moreServices: {
    fontSize: 10,
    color: designTokens.colors.semantic.textSecondary,
    fontStyle: 'italic',
    alignSelf: 'center',
  },
  cardActions: {
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: designTokens.colors.semantic.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
  },
  // Filter Modal Styles
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: designTokens.colors.semantic.text,
    zIndex: 1000,
  },
  filterModal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: designTokens.colors.semantic.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    zIndex: 1001,
    maxHeight: height * 0.8,
  },
  filterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: designTokens.colors.semantic.primary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  filterModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: designTokens.colors.semantic.surface,
  },
  filterModalContent: {
    padding: 20,
    maxHeight: height * 0.6,
  },
  filterModalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: designTokens.colors.semantic.border,
  },
  resetButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: designTokens.colors.semantic.primary,
    borderRadius: 12,
    marginRight: 10,
  },
  resetButtonText: {
    color: designTokens.colors.semantic.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  applyButton: {
    flex: 2,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: designTokens.colors.semantic.primary,
    borderRadius: 12,
  },
  applyButtonText: {
    color: designTokens.colors.semantic.surface,
    fontSize: 16,
    fontWeight: '600',
  },
  filterSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: designTokens.colors.semantic.text,
    marginLeft: 8,
  },
  locationDropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: designTokens.colors.semantic.border,
    borderRadius: 8,
    marginBottom: 8,
  },
  locationDropdownText: {
    fontSize: 16,
    color: designTokens.colors.semantic.text,
  },
  locationOptions: {
    backgroundColor: designTokens.colors.semantic.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: designTokens.colors.semantic.border,
    marginBottom: 16,
  },
  locationOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: designTokens.colors.semantic.border,
  },
  selectedLocationOption: {
    backgroundColor: `${designTokens.colors.semantic.primary}10`,
  },
  locationOptionText: {
    fontSize: 16,
    color: designTokens.colors.semantic.text,
  },
  selectedLocationOptionText: {
    color: designTokens.colors.semantic.primary,
    fontWeight: '500',
  },
  priceRangeContainer: {
    marginBottom: 16,
  },
  priceRangeText: {
    fontSize: 16,
    fontWeight: '500',
    color: designTokens.colors.semantic.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  priceSlider: {
    height: 6,
    backgroundColor: designTokens.colors.semantic.border,
    borderRadius: 3,
    marginBottom: 8,
    position: 'relative',
  },
  priceSliderTrack: {
    height: 6,
    backgroundColor: designTokens.colors.semantic.border,
    borderRadius: 3,
    position: 'absolute',
    left: 0,
    right: 0,
  },
  priceSliderFill: {
    height: 6,
    backgroundColor: designTokens.colors.semantic.primary,
    borderRadius: 3,
    position: 'absolute',
  },
  priceSliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priceSliderLabel: {
    fontSize: 12,
    color: designTokens.colors.semantic.textSecondary,
  },
  languagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  languageChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: designTokens.colors.semantic.border,
    borderRadius: 20,
  },
  selectedLanguageChip: {
    backgroundColor: `${designTokens.colors.semantic.primary}20`,
    borderWidth: 1,
    borderColor: designTokens.colors.semantic.primary,
  },
  languageFlag: {
    fontSize: 16,
    marginRight: 6,
  },
  languageChipText: {
    fontSize: 14,
    color: designTokens.colors.semantic.text,
  },
  selectedLanguageChipText: {
    color: designTokens.colors.semantic.primary,
    fontWeight: '500',
  },
  datePickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: designTokens.colors.semantic.border,
    borderRadius: 8,
    marginBottom: 16,
  },
  datePickerButtonText: {
    fontSize: 16,
    color: designTokens.colors.semantic.text,
  },
  quickFiltersContainer: {
    marginBottom: 16,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  switchLabel: {
    fontSize: 16,
    color: designTokens.colors.semantic.text,
  },
  // Sort Modal Styles
  sortModal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: designTokens.colors.semantic.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    zIndex: 1001,
    maxHeight: height * 0.6,
  },
  sortModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: designTokens.colors.semantic.primary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  sortModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: designTokens.colors.semantic.surface,
  },
  sortModalContent: {
    padding: 20,
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  selectedSortOption: {
    backgroundColor: `${designTokens.colors.semantic.primary}10`,
    borderWidth: 1,
    borderColor: `${designTokens.colors.semantic.primary}30`,
  },
  sortOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sortOptionIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  sortOptionText: {
    fontSize: 16,
    color: designTokens.colors.semantic.text,
    flex: 1,
  },
  selectedSortOptionText: {
    color: designTokens.colors.semantic.primary,
    fontWeight: '500',
  },

  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: designTokens.typography.sizes.body,
    color: designTokens.colors.semantic.text,
  },
  errorSubtext: {
    fontSize: designTokens.typography.sizes.body,
    color: designTokens.colors.semantic.textSecondary,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: designTokens.typography.sizes.heading,
    fontWeight: '600',
    color: designTokens.colors.semantic.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyStateSubtitle: {
    fontSize: designTokens.typography.sizes.body,
    color: designTokens.colors.semantic.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyStateIcon: {
    marginBottom: 20,
    opacity: 0.4,
  },
  clearFiltersButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
    backgroundColor: designTokens.colors.semantic.primary,
  },
  clearFiltersText: {
    color: designTokens.colors.semantic.surface,
    fontSize: designTokens.typography.sizes.body,
    fontWeight: '600',
  },
  filterBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: designTokens.colors.semantic.surface,
  },
  // Date picker modal styles
  dateModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateModalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: designTokens.spacing.scale.lg,
    width: '85%',
    alignItems: 'center',
  },
  dateModalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: designTokens.spacing.scale.lg,
    width: '100%',
  },
  dateModalButton: {
    flex: 1,
    paddingVertical: designTokens.spacing.scale.md,
    borderRadius: 12,
    backgroundColor: designTokens.colors.semantic.surface,
    alignItems: 'center',
    marginHorizontal: designTokens.spacing.scale.xs,
  },
  dateModalButtonPrimary: {
    backgroundColor: designTokens.colors.semantic.primary,
  },
  dateModalButtonText: {
    color: designTokens.colors.semantic.text,
    fontWeight: '600',
    fontSize: 16,
  },
  dateModalButtonPrimaryText: {
    color: 'white',
  },
});
