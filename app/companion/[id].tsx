import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ViewStyle, TextStyle, ImageStyle, Alert, Modal, TextInput, Platform, Share as NativeShare } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import { Image } from 'expo-image';
import { useLocalSearchParams, router, Link } from 'expo-router';
import { formatOriginalCurrencyContext, formatTravelerCurrency, useCurrencyConversion } from '@/utils/currency';
import { Card } from '@/components/ui/Card';
import { CategoryChip } from '@/components/ui/CategoryChip';
import { RadialGradient } from '@/components/ui/RadialGradient';
import { Button } from '@/components/ui/Button';
import { ImageCarousel } from '@/components/ui/ImageCarousel';
import { ProfileImage } from '@/components/ui/ProfileImage';
import { LoadingState } from '@/components/ui/LoadingState';
import CompanionProfileShimmer from '@/components/ui/CompanionProfileShimmer';
import { designTokens, componentTokens } from '@/constants/design-tokens';
import { useBookingStore } from '@/stores/booking-store';
import { useAuthStore } from '@/stores/auth-store';
import { useFavoritesStore } from '@/stores/favorites-store';
import { useNavigation } from '@react-navigation/native';
import { BookingService } from '@/types/booking';
import { useToastStore } from '@/stores/toast-store';
import { useTranslation } from 'react-i18next';
import {
  getCompanionDisplayName,
  getCompanionGallery,
  getCompanionImage,
  getCompanionLocation,
  isTestCompanion,
} from '@/utils/companion-display';
import { buildPreviewAvailability, getDemoGuideAvailability } from '@/utils/preview-availability';
import { usePostHog } from 'posthog-react-native';

// Import new API functions
import { 
  useCompanionQuery, 
  useCompanionWeeklyAvailability,
  CompanionDetails 
} from '@/app/api/companion/companion';

import { 
  ArrowLeft, 
  Heart, 
  Share, 
  Star, 
  MessageCircle, 
  Calendar, 
  MapPin, 
  Globe, 
  Shield, 
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Flag,
  Info,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

const REPORT_REASONS = [
  'Inappropriate content or photos',
  'Misleading profile information',
  'Suspicious or fraudulent behavior',
  'Harassment or offensive messages',
  'Offering prohibited services',
  'Other',
];

// Simple shimmer for inline loading states
const ShimmerBox = ({ width: w, height: h, style }: { width: number | string; height: number; style?: ViewStyle }) => (
  <View style={[{ width: w as any, height: h, backgroundColor: '#E1E9EE', borderRadius: 8 }, style]} />
);

// Helper to map API response to UI structure
function mapCompanionDetails(data: any) {
  const isTestProfile = isTestCompanion(data);
  const demoExperiences = [
    {
      id: 'test-market-temple-walk',
      title: 'Old Town Market & Temple Walk',
      description: 'A relaxed half-day walk through Bangkok food stalls, flower markets, river lanes, and a quiet temple stop with local context.',
      durationMinutes: 180,
      price: 1800,
      currency: 'THB',
      category: 'City Tour',
    },
    {
      id: 'test-evening-food-trail',
      title: 'Evening Food Trail',
      description: 'Taste street snacks, learn ordering etiquette, and visit a neighborhood night market at an easy traveler pace.',
      durationMinutes: 150,
      price: 1500,
      currency: 'THB',
      category: 'Evening',
    },
  ];
  const demoReviews = [
    {
      id: 'test-review-1',
      user: {
        id: 'demo-customer-1',
        name: 'Maya R.',
        profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=300&auto=format&fit=crop',
      },
      rating: 5,
      comment: 'Warm, practical, and full of local details we never would have found alone.',
      date: 'May 2026',
      verified: true,
    },
  ];

  return {
    id: data.id,
    email: data.email,
    name: getCompanionDisplayName(data),
    displayName: getCompanionDisplayName(data),
    profileImage: getCompanionImage(data),
    gallery: getCompanionGallery(data),
    location: getCompanionLocation(data),
    rating: data.rating?.average ?? data.rating ?? (isTestProfile ? 5 : 0),
    reviewCount: data.rating?.count ?? data.reviewCount ?? (isTestProfile ? demoReviews.length : 0),
    price: data.price ?? (isTestProfile ? 1800 : 0),
    currency: data.currency || data.experiences?.[0]?.currency || 'THB',
    experiences: Array.isArray(data.experiences) && data.experiences.length > 0 ? data.experiences : isTestProfile ? demoExperiences : [],
    languages: Array.isArray(data.languages) && data.languages.length > 0 ? data.languages : isTestProfile ? ['English', 'Thai'] : [],
    verified: data.verified ?? data.phoneVerified ?? isTestProfile,
    online: data.online ?? isTestProfile,
    lastSeen: data.lastSeen,
    categories: Array.isArray(data.categories) ? data.categories : [],
    bio: data.bio || (isTestProfile
      ? 'I help travelers experience Bangkok through everyday rituals: morning markets, temple etiquette, river shortcuts, neighborhood food stalls, and small cultural details that make Thailand feel personal.'
      : data.bio),
    age: data.age,
    responseTime: data.responseTime,
    completionRate: data.completionRate,
    joinedDate: data.joinedDate,
    availability: data.availability,
    reviews: Array.isArray(data.reviews) && data.reviews.length > 0 ? data.reviews : isTestProfile ? demoReviews : [],
    firstName: data.firstName,
    lastName: data.lastName,
    dateOfBirth: data.dateOfBirth,
    gender: data.gender,
    socialLinks: data.socialLinks,
    specialization: data.specialization,
    certifications: data.certifications,
  };
}

export default function CompanionProfileScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams();
  const [selectedTab, setSelectedTab] = useState<'about' | 'services' | 'reviews'>('about');
  const [showAllServices, setShowAllServices] = useState(false);
  const [showAllLanguages, setShowAllLanguages] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [expandedServices, setExpandedServices] = useState<Set<string>>(new Set());
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReportReason, setSelectedReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');

  // Toggle service description expansion
  const toggleServiceExpansion = (serviceId: string) => {
    const newExpanded = new Set(expandedServices);
    if (newExpanded.has(serviceId)) {
      newExpanded.delete(serviceId);
    } else {
      newExpanded.add(serviceId);
    }
    setExpandedServices(newExpanded);
  };
  
  // API calls
  const { data: companionData, isLoading: isLoadingCompanion, error: companionError } = useCompanionQuery(id as string);
  const { data: availabilityData, isLoading: isLoadingAvailability } = useCompanionWeeklyAvailability(id as string, '00:00', '23:59');
  
  // Currency conversion — called before early returns (React hook rules)
  const companionCurrency = companionData?.data?.currency || companionData?.data?.experiences?.[0]?.currency || 'THB';
  const convertedPrice = useCurrencyConversion(companionData?.data?.price, companionCurrency);
  const sourcePriceContext = formatOriginalCurrencyContext(companionData?.data?.price, companionCurrency);
  
  const posthog = usePostHog();
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const { setCompanionData } = useBookingStore();

  useEffect(() => {
    if (companionData?.data) {
      const companion = companionData.data;
      posthog.capture('companion_profile_viewed', {
        companion_id: id,
        companion_name: getCompanionDisplayName(companion),
        companion_location: getCompanionLocation(companion),
        companion_rating: companion.rating,
        is_test_companion: isTestCompanion(companion),
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companionData?.data?.id]);
  const { showToast } = useToastStore();
  const isFavorite = useFavoritesStore((state) => state.isFavorite(id as string));
  const toggleFavoriteInStore = useFavoritesStore((state) => state.toggleFavorite);
  
  // Show loading state
  if (isLoadingCompanion) {
    return <CompanionProfileShimmer />;
  }
  
  // Show error state
  if (companionError || !companionData?.success) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
        <Text style={styles.sectionTitle}>{t('companionDetails.errorLoadingCompanion')}</Text>
        <Text style={styles.bioText}>
          {companionError?.message || t('companionDetails.failedToLoadCompanion')}
        </Text>
        <Button
          title={t('companionDetails.goBack')}
          variant="primary"
          onPress={() => router.back()}
          style={{ marginTop: 20 }}
        />
      </View>
    );
  }
  
  const companion = mapCompanionDetails(companionData.data);
  const isTestProfile = isTestCompanion(companion);
  const isOwnProfile =
    user?.id === companion.id ||
    (typeof user?.email === 'string' &&
      typeof companion.email === 'string' &&
      user.email.toLowerCase() === companion.email.toLowerCase());
  
  
  const handleBack = () => {
    router.back();
  };
  
  const toggleFavorite = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleFavoriteInStore({
      id: companion.id,
      name: companion.name,
      displayName: companion.displayName,
      image: companion.profileImage,
      profileImage: companion.profileImage,
      location: companion.location,
      rating: companion.rating,
      reviewCount: companion.reviewCount,
      reviews: companion.reviewCount,
      price: companion.price,
      services: companion.experiences.map((experience: any) => experience.name || experience.title || 'Local experience'),
      languages: companion.languages,
      verified: companion.verified,
      online: companion.online,
      category: companion.categories?.[0] || 'general',
      categories: companion.categories,
    });
  };
  
  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const guideUrl = `https://tirak.app/guide/${id}`;
    try {
      await NativeShare.share({
        message: `Check out ${companion.name} on Tirak — local guide in Thailand\n${guideUrl}`,
        url: guideUrl,   // iOS only: triggers native URL share
        title: `${companion.name} — Tirak Local Guide`,
      });
    } catch {
      // user dismissed — no action needed
    }
  };

  const handleReport = () => {
    setShowReportModal(true);
  };

  const submitReport = () => {
    if (!selectedReportReason) {
      Alert.alert('Select a reason', 'Choose what Tirak should review before submitting.');
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowReportModal(false);
    setSelectedReportReason('');
    setReportDetails('');
    Alert.alert(
      t('companionDetails.reportSubmittedTitle'),
      t('companionDetails.reportSubmittedBody'),
      [{ text: t('common.ok') }]
    );
  };
  
  const handleChat = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const guideName = companion.displayName || companion.name;
    const starter = encodeURIComponent(`Hi ${guideName}! I'm interested in exploring Thailand with you. What experiences do you offer?`);
    router.push(`/chat/${companion.id}?starter=${starter}`);
  };
  
  const handleBookNow = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!selectedDate) {
      showToast({
        message: t('companionDetails.pleaseSelectDate'),
        type: 'warning'
      });
      return;
    }

    if (companion && companion.experiences && companion.experiences.length > 0) {
      const defaultService = companion.experiences[0];
      const defaultDuration = defaultService.durationMinutes || 60;

      // Set companion data in the store
      setCompanionData({
        id: companion.id,
        name: companion.name,
        image: companion.profileImage,
        location: companion.location,
        rating: companion.rating,
        languages: companion.languages || [],
        about: companion.bio,
        specialties: companion.experiences.map((exp: BookingService & { title?: string }) => exp.name || exp.title || 'Local experience'),
      });

      // Update service in the store
      useBookingStore.getState().updateService({
        id: defaultService.id,
        name: defaultService.title,
        description: defaultService.description,
        price: defaultService.price,
        currency: defaultService.currency || companion.currency || 'THB',
        duration: defaultDuration / 60, // Convert to hours
        category: defaultService.category || 'Experience',
      });

      // Update date/time in the store
      useBookingStore.getState().updateDateTime({
        date: selectedDate,
        time: '10:00', // Default to 10 AM
        duration: defaultDuration / 60, // Convert minutes to hours
        endTime: '11:00', // Will be calculated properly in the datetime step
        isAvailable: true
      });

      // Reset to first step and navigate
      useBookingStore.getState().goToStep(1);
      router.push('/booking/new');
    } else {
      showToast({
        message: t('companionDetails.noServicesAvailable'),
        type: 'error'
      });
    }
  };

  const handleUpdateProfile = () => {
    router.push('/supplier/profile/edit');
  };

  const handleUpdateServices = () => {
    router.push('/supplier/services');
  };

  const renderProfileEmptyState = (
    title: string,
    body: string,
    actionLabel: string,
    onPress: () => void
  ) => (
    <View style={styles.profileEmptyState as ViewStyle}>
      <Text style={styles.profileEmptyTitle as TextStyle}>{title}</Text>
      <Text style={styles.profileEmptyBody as TextStyle}>{body}</Text>
      {isOwnProfile && (
        <TouchableOpacity
          style={styles.profileEmptyAction as ViewStyle}
          onPress={onPress}
          accessibilityRole="button"
        >
          <Text style={styles.profileEmptyActionText as TextStyle}>{actionLabel}</Text>
          <ChevronRight size={16} color={designTokens.colors.semantic.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
  
  const testProfileDates = getDemoGuideAvailability();

  // Transform availability data or use deterministic preview data when not available.
  const availableDates = isTestProfile
    ? testProfileDates
    : availabilityData?.success && availabilityData.data.availability && availabilityData.data.availability.length > 0
      ? availabilityData.data.availability.map(day => ({
        date: day.date,
        day: new Date(day.date).getDate(),
        weekday: new Date(day.date).toLocaleDateString('en', { weekday: 'short' }),
        available: day.available,
      }))
      : buildPreviewAvailability(14, i => i % 4 !== 0);
  
  const renderDateItem = (item: any, index: number) => (
    <TouchableOpacity
      key={index}
      style={[
        styles.dateItem as ViewStyle,
        !item.available && styles.dateItemUnavailable as ViewStyle,
        selectedDate === item.date && styles.dateItemSelected as ViewStyle,
      ]}
      onPress={() => item.available && setSelectedDate(item.date)}
      disabled={!item.available}
    >
      <Text style={[
        styles.dateDay as TextStyle,
        !item.available && styles.dateTextUnavailable as TextStyle,
        selectedDate === item.date && styles.dateTextSelected as TextStyle,
      ]}>
        {item.day}
      </Text>
      <Text style={[
        styles.dateWeekday as TextStyle,
        !item.available && styles.dateTextUnavailable as TextStyle,
        selectedDate === item.date && styles.dateTextSelected as TextStyle,
      ]}>
        {item.weekday}
      </Text>
    </TouchableOpacity>
  );
  
  const renderReviewItem = (review: any) => (
    <Card key={review.id} style={styles.reviewCard as ViewStyle} padding={16}>
      <View style={styles.reviewHeader as ViewStyle}>
        <View style={styles.reviewUser as ViewStyle}>
          <ProfileImage
            uri={review.user.profileImage}
            size={40}
          />
          <View>
            <Text style={styles.reviewUserName as TextStyle}>{review.user.name}</Text>
            <Text style={styles.reviewDate as TextStyle}>{review.date}</Text>
          </View>
        </View>
        <View style={styles.reviewRating as ViewStyle}>
          {Array.from({ length: review.rating }, (_, i) => (
            <Star key={i} size={14} color="#FFD700" fill="#FFD700" />
          ))}
        </View>
      </View>
      <Text style={styles.reviewText as TextStyle}>{review.comment}</Text>
    </Card>
  );
  
  const galleryImages: string[] = getCompanionGallery(companion);

  return (
    <View style={styles.container as ViewStyle}>
      {/* Enhanced Header with Image Carousel */}
      <View style={styles.header as ViewStyle}>
        <ImageCarousel
          images={galleryImages}
          height={300}
          showDots={true}
          enableFullScreen={true}
          showImageCounter={true}
          style={styles.carousel}
        />
        
        <View style={styles.headerOverlay as ViewStyle}>
          <TouchableOpacity style={styles.backButton as ViewStyle} onPress={handleBack}>
            <ArrowLeft size={24} color={designTokens.colors.semantic.surface} />
          </TouchableOpacity>

          <View style={styles.headerActions as ViewStyle}>
            <TouchableOpacity
              style={styles.actionButton as ViewStyle}
              onPress={toggleFavorite}
            >
              <Heart
                size={24}
                color={designTokens.colors.semantic.surface}
                fill={isFavorite ? designTokens.colors.semantic.accent : 'transparent'}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton as ViewStyle}
              onPress={handleShare}
            >
              <Share size={24} color={designTokens.colors.semantic.surface} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton as ViewStyle}
              onPress={handleReport}
            >
              <Flag size={24} color={designTokens.colors.semantic.surface} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
      
      <ScrollView style={styles.content as ViewStyle} showsVerticalScrollIndicator={false}>
        {/* Profile Info */}
        <Card style={styles.profileCard as ViewStyle} padding={20}>
          {/* #9: Full-width name/rating/location — avatar is in the carousel above */}
          <Text style={styles.profileName as TextStyle}>{companion.displayName || companion.name}</Text>
          <View style={styles.profileMeta as ViewStyle}>
            <View style={styles.ratingContainer as ViewStyle}>
              {companion.reviewCount && companion.reviewCount > 0 ? (
                <>
                  <Star size={16} color="#FFD700" fill="#FFD700" />
                  <Text style={styles.ratingText as TextStyle}>
                    {companion.rating} ({companion.reviewCount} {t('companionDetails.reviews').toLowerCase()})
                  </Text>
                </>
              ) : (
                <Text style={styles.newGuideText as TextStyle}>{t('companionDetails.newGuide')}</Text>
              )}
            </View>
            
            <TouchableOpacity
              style={styles.locationContainer as ViewStyle}
              onPress={() => {
                if (!companion.location) return;
                const query = encodeURIComponent(companion.location);
                const url = Platform.OS === 'ios'
                  ? `maps:?q=${query}`
                  : `https://maps.google.com/?q=${query}`;
                Linking.openURL(url);
              }}
              accessibilityRole="link"
              accessibilityLabel={`Open ${companion.location} in Maps`}
            >
              <MapPin size={16} color={designTokens.colors.semantic.primary} />
              <Text style={[styles.locationText as TextStyle, { color: designTokens.colors.semantic.primary, textDecorationLine: 'underline' }]}>{companion.location || t('companionDetails.locationFallback')}</Text>
            </TouchableOpacity>
          </View>
          
          {companion.verified && (
            <TouchableOpacity
              style={styles.verificationBadge as ViewStyle}
              onPress={() => Alert.alert(
                t('companionDetails.verifiedGuideTitle'),
                t('companionDetails.verifiedGuideBody'),
                [{ text: t('companionDetails.verifiedGuideGotIt'), style: 'default' }]
              )}
              accessibilityRole="button"
              accessibilityLabel="Verified guide — tap to learn more"
            >
              <Shield size={16} color={designTokens.colors.semantic.success} />
              <Text style={styles.verificationText as TextStyle}>{t('companionDetails.verifiedProfile')}</Text>
              <Info size={14} color={designTokens.colors.semantic.success} style={{ marginLeft: 4 } as any} />
            </TouchableOpacity>
          )}
          
          {companion.price && companion.price > 0 ? (
            <View style={styles.priceContainer as ViewStyle}>
              <Text style={styles.price as TextStyle}>{convertedPrice || formatTravelerCurrency(companion.price, companion.currency)}</Text>
              <Text style={styles.priceUnit as TextStyle}>/{t('companionDetails.day')}</Text>
              {sourcePriceContext ? (
                <Text style={styles.priceSecondary as TextStyle}> ({sourcePriceContext})</Text>
              ) : null}
            </View>
          ) : (
            <View style={styles.priceContainer as ViewStyle}>
              <Text style={styles.priceContact as TextStyle}>{t('companionDetails.contactForPricing')}</Text>
            </View>
          )}
          
          {companion.languages && companion.languages.length > 0 && (
            <View style={styles.languagesRow as ViewStyle}>
              <Globe size={14} color={designTokens.colors.semantic.textSecondary} />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexShrink: 1 }}>
                <View style={styles.languageChips as ViewStyle}>
                  {companion.languages.slice(0, 5).map((lang: string) => (
                    <View key={lang} style={styles.languageChip as ViewStyle}>
                      <Text style={styles.languageChipText as TextStyle}>{lang}</Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}
          
          <View style={styles.actionButtons as ViewStyle}>
            <Button
              title={t('companionDetails.chatNow')}
              variant="primary"
              size="large"
              fullWidth
              onPress={handleChat}
              style={styles.chatButton as ViewStyle}
              textStyle={styles.chatButtonText as TextStyle}
              leftIcon={<MessageCircle size={18} color={designTokens.colors.semantic.surface} />}
            />
          </View>
        </Card>
        
        {/* Tabs */}
        <Card style={styles.tabsCard as ViewStyle} padding={0}>
          <View style={styles.tabsHeader as ViewStyle}>
            <TouchableOpacity
              style={[styles.tab as ViewStyle, selectedTab === 'about' && styles.tabActive as ViewStyle]}
              onPress={() => setSelectedTab('about')}
            >
              <Text style={[styles.tabText as TextStyle, selectedTab === 'about' && styles.tabTextActive as TextStyle]}>
                {t('companionDetails.about')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab as ViewStyle, selectedTab === 'services' && styles.tabActive as ViewStyle]}
              onPress={() => setSelectedTab('services')}
            >
              <Text style={[styles.tabText as TextStyle, selectedTab === 'services' && styles.tabTextActive as TextStyle]}>
                {t('companionDetails.services')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab as ViewStyle, selectedTab === 'reviews' && styles.tabActive as ViewStyle]}
              onPress={() => setSelectedTab('reviews')}
            >
              <Text style={[styles.tabText as TextStyle, selectedTab === 'reviews' && styles.tabTextActive as TextStyle]}>
                {t('companionDetails.reviews')}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tabContent as ViewStyle}>
            {selectedTab === 'about' && (
              <View style={styles.aboutContent as ViewStyle}>
                <View style={styles.bioSection as ViewStyle}>
                  <Text style={styles.sectionTitle as TextStyle}>{t('companionDetails.bio')}</Text>
                  {companion.bio ? (
                    <Text style={styles.bioText as TextStyle}>{companion.bio}</Text>
                  ) : renderProfileEmptyState(
                    isOwnProfile ? 'Tell travelers about yourself' : 'Bio not added yet',
                    isOwnProfile
                      ? 'A short bio helps travelers understand your style, local knowledge, and what makes booking you feel personal.'
                      : 'This guide has not added a bio yet.',
                    'Update it here',
                    handleUpdateProfile
                  )}
                </View>

                <View style={styles.languagesSection as ViewStyle}>
                  <Text style={styles.sectionTitle as TextStyle}>{t('companionDetails.languages')}</Text>
                  {companion.languages.length > 0 ? (
                    <>
                      <View style={styles.languagesList as ViewStyle}>
                        {companion.languages.slice(0, showAllLanguages ? companion.languages.length : 3).map((language: string, index: number) => (
                          <View key={index} style={styles.languageItem as ViewStyle}>
                            <Globe size={16} color={designTokens.colors.semantic.primary} />
                            <Text style={styles.languageText as TextStyle}>{language}</Text>
                          </View>
                        ))}
                      </View>

                      {companion.languages.length > 3 && (
                        <TouchableOpacity
                          style={styles.showMoreButton as ViewStyle}
                          onPress={() => setShowAllLanguages(!showAllLanguages)}
                        >
                          <Text style={styles.showMoreText as TextStyle}>
                            {showAllLanguages ? t('companionDetails.showLess') : t('companionDetails.showAllLanguages')}
                          </Text>
                          {showAllLanguages ? (
                            <ChevronUp size={16} color={designTokens.colors.semantic.primary} />
                          ) : (
                            <ChevronDown size={16} color={designTokens.colors.semantic.primary} />
                          )}
                        </TouchableOpacity>
                      )}
                    </>
                  ) : renderProfileEmptyState(
                    isOwnProfile ? 'Add the languages you guide in' : 'Languages not listed yet',
                    isOwnProfile
                      ? 'Languages are a major booking signal for travelers choosing a local guide.'
                      : 'This guide has not listed their languages yet.',
                    'Update profile',
                    handleUpdateProfile
                  )}
                </View>
              </View>
            )}

            {selectedTab === 'services' && (
              <View style={styles.servicesContent as ViewStyle}>
                <Text style={styles.sectionTitle as TextStyle}>{t('companionDetails.experiencesOffered')}</Text>
                {companion.experiences.length === 0 ? (
                  <View style={styles.emptyServicesContainer as ViewStyle}>
                    <Text style={styles.emptyServicesIcon as TextStyle}>🗺️</Text>
                    <Text style={styles.emptyServicesTitle as TextStyle}>
                      {isOwnProfile ? 'Create your first experience' : t('companionDetails.noExperiencesTitle')}
                    </Text>
                    <Text style={styles.emptyServicesSubtitle as TextStyle}>
                      {isOwnProfile
                        ? 'Add a clear service with price, duration, and what travelers will experience.'
                        : t('companionDetails.noExperiencesBody')}
                    </Text>
                    {isOwnProfile && (
                      <TouchableOpacity
                        style={styles.profileEmptyAction as ViewStyle}
                        onPress={handleUpdateServices}
                        accessibilityRole="button"
                      >
                        <Text style={styles.profileEmptyActionText as TextStyle}>Add experience</Text>
                        <ChevronRight size={16} color={designTokens.colors.semantic.primary} />
                      </TouchableOpacity>
                    )}
                  </View>
                ) : (
                <View style={styles.servicesList as ViewStyle}>
                  {companion.experiences.slice(0, showAllServices ? companion.experiences.length : 4).map((exp: any, index: number) => {
                    const serviceId = exp.id || `service-${index}`;
                    const isExpanded = expandedServices.has(serviceId);
                    const fullText = `${exp.title} - ${exp.description} (${exp.durationMinutes} min, ${formatTravelerCurrency(exp.price, exp.currency || companion.currency)})`;
                    const shortText = fullText.length > 80 ? `${fullText.substring(0, 80)}...` : fullText;
                    const needsToggle = fullText.length > 80;
                    
                    return (
                      <View key={serviceId} style={[styles.serviceItem as ViewStyle, { alignItems: 'flex-start' }]}> 
                        <View style={styles.serviceIcon as ViewStyle}>
                          <Text style={styles.serviceEmoji as TextStyle}>✓</Text>
                        </View>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={[styles.serviceText as TextStyle, { flexWrap: 'wrap' }]}>
                            {isExpanded ? fullText : shortText}
                          </Text>
                          {needsToggle && (
                            <TouchableOpacity
                              onPress={() => toggleServiceExpansion(serviceId)}
                              style={styles.toggleButton as ViewStyle}
                            >
                              <Text style={styles.toggleText as TextStyle}>
                                {isExpanded ? t('companionDetails.showLess') : t('companionDetails.showMore')}
                              </Text>
                              {isExpanded ? (
                                <ChevronUp size={14} color={designTokens.colors.semantic.primary} />
                              ) : (
                                <ChevronDown size={14} color={designTokens.colors.semantic.primary} />
                              )}
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
                )}

                {companion.experiences.length > 4 && (
                  <TouchableOpacity
                    style={styles.showMoreButton as ViewStyle}
                    onPress={() => setShowAllServices(!showAllServices)}
                  >
                    <Text style={styles.showMoreText as TextStyle}>
                      {showAllServices ? t('companionDetails.showLess') : t('companionDetails.showAllExperiences')}
                    </Text>
                    {showAllServices ? (
                      <ChevronUp size={16} color={designTokens.colors.semantic.primary} />
                    ) : (
                      <ChevronDown size={16} color={designTokens.colors.semantic.primary} />
                    )}
                  </TouchableOpacity>
                )}
              </View>
            )}

            {selectedTab === 'reviews' && (
              <View style={styles.reviewsContent as ViewStyle}>
                <View style={styles.reviewsHeader as ViewStyle}>
                  <Text style={styles.sectionTitle as TextStyle}>{t('companionDetails.customerReviews')}</Text>
                  <View style={styles.overallRating as ViewStyle}>
                    <Star size={18} color="#FFD700" fill="#FFD700" />
                    <Text style={styles.overallRatingText as TextStyle}>{companion.rating}</Text>
                    <Text style={styles.reviewCount as TextStyle}>({companion.reviewCount} reviews)</Text>
                  </View>
                </View>

                <View style={styles.reviewsList as ViewStyle}>
                  {companion.reviews.length > 0
                    ? companion.reviews.map(renderReviewItem)
                    : renderProfileEmptyState(
                      isOwnProfile ? 'No reviews yet' : 'Reviews not available yet',
                      isOwnProfile
                        ? 'Reviews will appear here after travelers complete bookings with you.'
                        : 'This guide does not have traveler reviews yet.',
                      'Improve your profile',
                      handleUpdateProfile
                    )}
                </View>

                {companion.reviews.length > 0 && (
                  <TouchableOpacity style={styles.allReviewsButton as ViewStyle}>
                    <Text style={styles.allReviewsText as TextStyle}>{t('companionDetails.seeAllReviews')}</Text>
                    <ChevronRight size={16} color={designTokens.colors.semantic.primary} />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </Card>

        {/* Availability */}
        <Card style={styles.availabilityCard as ViewStyle} padding={20}>
          <Text style={styles.sectionTitle as TextStyle}>{t('companionDetails.availability')}</Text>
          <Text style={styles.availabilitySubtitle as TextStyle}>{t('companionDetails.selectDateToBook')}</Text>
          
          {isLoadingAvailability ? (
            <View style={{ flexDirection: 'row', gap: 12, paddingVertical: 12 }}>
              {Array.from({ length: 7 }).map((_, i) => (
                <ShimmerBox key={i} width={60} height={80} style={{ borderRadius: 12 }} />
              ))}
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.datesContainer as ViewStyle}
            >
              {availableDates.map(renderDateItem)}
            </ScrollView>
          )}

          {/* <TouchableOpacity style={styles.calendarButton as ViewStyle}>
            <Text style={styles.calendarButtonText as TextStyle}>View Full Calendar</Text>
            <Calendar size={16} color={designTokens.colors.semantic.primary} />
          </TouchableOpacity> */}

          {/* Conditional Book Now Button */}
          {selectedDate && (
            <Button
              title={t('companionDetails.bookNow')}
              variant="primary"
              onPress={handleBookNow}
              style={styles.bookNowButton as ViewStyle}
              leftIcon={<Calendar size={18} color={designTokens.colors.semantic.surface} />}
              fullWidth
            />
          )}
        </Card>
      </ScrollView>

      {/* Report Modal */}
      <Modal
        visible={showReportModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReportModal(false)}
      >
        <View style={styles.reportOverlay as ViewStyle}>
          <View style={styles.reportSheet as ViewStyle}>
            <View style={styles.reportHeader as ViewStyle}>
              <Text style={styles.reportTitle as TextStyle}>Report this local guide</Text>
              <TouchableOpacity onPress={() => setShowReportModal(false)}>
                <Text style={styles.reportClose as TextStyle}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.reportSubtitle as TextStyle}>What should Tirak review?</Text>

            {REPORT_REASONS.map((reason) => (
              <TouchableOpacity
                key={reason}
                style={[
                  styles.reportOption as ViewStyle,
                  selectedReportReason === reason && styles.reportOptionSelected as ViewStyle,
                ]}
                onPress={() => setSelectedReportReason(reason)}
              >
                <View style={[styles.reportRadio as ViewStyle, selectedReportReason === reason && styles.reportRadioSelected as ViewStyle]} />
                <Text style={styles.reportOptionText as TextStyle}>{reason}</Text>
              </TouchableOpacity>
            ))}

            <TextInput
              style={styles.reportInput as any}
              placeholder="Add details for the Tirak safety team (optional)"
              placeholderTextColor={designTokens.colors.semantic.textSecondary}
              value={reportDetails}
              onChangeText={setReportDetails}
              multiline
              numberOfLines={3}
            />

            <Button
              title="Submit report"
              variant="primary"
              onPress={submitReport}
              style={styles.reportSubmitButton as ViewStyle}
              fullWidth
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: designTokens.colors.semantic.background,
  },
  header: {
    height: 300,
    position: 'relative',
  },
  carousel: {
    width: '100%',
    height: '100%',
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: designTokens.spacing.scale.lg,
    paddingTop: 50,
    zIndex: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    ...designTokens.shadows.sm,
  },
  headerActions: {
    flexDirection: 'row',
    gap: designTokens.spacing.scale.sm,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    ...designTokens.shadows.sm,
  },
  content: {
    flex: 1,
    marginTop: -30,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: 'hidden',
  },
  profileCard: {
    marginHorizontal: designTokens.spacing.scale.lg,
    marginBottom: designTokens.spacing.scale.md,
    borderRadius: designTokens.borderRadius.components.card,
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: designTokens.spacing.scale.md,
  },
  profileInfo: {
    flex: 1,
    marginRight: designTokens.spacing.scale.md,
  },
  profileName: {
    ...designTokens.typography.styles.heading,
    color: designTokens.colors.semantic.text,
    marginBottom: designTokens.spacing.scale.sm,
  },
  profileMeta: {
    gap: 8,
    marginBottom: designTokens.spacing.scale.md,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    color: designTokens.colors.semantic.text,
    marginLeft: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 14,
    color: designTokens.colors.semantic.textSecondary,
    marginLeft: 4,
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  verificationText: {
    fontSize: 12,
    color: designTokens.colors.semantic.success,
    fontWeight: '600',
    marginLeft: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: designTokens.colors.semantic.primary,
  },
  priceUnit: {
    fontSize: 14,
    color: designTokens.colors.semantic.textSecondary,
    marginLeft: 4,
  },
  priceSecondary: {
    fontSize: 13,
    color: designTokens.colors.semantic.textSecondary,
    marginLeft: 6,
  },
  priceContact: {
    fontSize: 14,
    color: designTokens.colors.semantic.textSecondary,
    fontStyle: 'italic',
  },
  newGuideText: {
    fontSize: 13,
    color: designTokens.colors.semantic.primary,
    fontWeight: '500',
    backgroundColor: designTokens.colors.semantic.primary + '15',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: 'hidden',
  },
  actionButtons: {
    marginTop: designTokens.spacing.scale.lg,
    width: '100%',
  },
  languagesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: designTokens.spacing.scale.sm,
    marginBottom: 2,
  },
  languageChips: {
    flexDirection: 'row',
    gap: 6,
    paddingLeft: 2,
  },
  languageChip: {
    backgroundColor: designTokens.colors.semantic.primary + '15',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  languageChipText: {
    fontSize: 12,
    color: designTokens.colors.semantic.primary,
    fontWeight: '500',
  },
  chatButton: {
    width: '100%',
    alignSelf: 'stretch',
    borderRadius: designTokens.borderRadius.components.button,
  },
  chatButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  tabsCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  tabsHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: designTokens.colors.semantic.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: designTokens.colors.semantic.primary,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: designTokens.colors.semantic.textSecondary,
  },
  tabTextActive: {
    color: designTokens.colors.semantic.primary,
    fontWeight: '600',
  },
  tabContent: {
    padding: 20,
  },
  aboutContent: {
    gap: 20,
  },
  bioSection: {},
  sectionTitle: {
    ...designTokens.typography.styles.subheading,
    color: designTokens.colors.semantic.text,
    marginBottom: designTokens.spacing.scale.sm,
  },
  bioText: {
    fontSize: 16,
    color: designTokens.colors.semantic.textSecondary,
    lineHeight: 24,
  },
  profileEmptyState: {
    paddingVertical: 12,
    gap: 8,
  },
  profileEmptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: designTokens.colors.semantic.text,
  },
  profileEmptyBody: {
    fontSize: 14,
    color: designTokens.colors.semantic.textSecondary,
    lineHeight: 20,
  },
  profileEmptyAction: {
    minHeight: 44,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
  },
  profileEmptyActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: designTokens.colors.semantic.primary,
  },
  languagesSection: {},
  languagesList: {
    gap: 8,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  languageText: {
    fontSize: 16,
    color: designTokens.colors.semantic.text,
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  showMoreText: {
    fontSize: 14,
    color: designTokens.colors.semantic.primary,
    fontWeight: '500',
    marginRight: 4,
  },
  servicesContent: {},
  servicesList: {
    gap: 12,
  },
  emptyServicesContainer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyServicesIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyServicesTitle: {
    fontSize: designTokens.typography.sizes.body,
    fontWeight: '600',
    color: designTokens.colors.semantic.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyServicesSubtitle: {
    fontSize: designTokens.typography.sizes.caption,
    color: designTokens.colors.semantic.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  serviceIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(111, 76, 170, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceEmoji: {
    fontSize: 16,
    color: designTokens.colors.semantic.primary,
  },
  serviceText: {
    fontSize: 16,
    color: designTokens.colors.semantic.text,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    paddingVertical: 2,
  },
  toggleText: {
    fontSize: 12,
    color: designTokens.colors.semantic.primary,
    fontWeight: '600',
    marginRight: 4,
  },
  reviewsContent: {},
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  overallRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  overallRatingText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: designTokens.colors.semantic.text,
  },
  reviewCount: {
    fontSize: 14,
    color: designTokens.colors.semantic.textSecondary,
  },
  reviewsList: {
    gap: 12,
  },
  reviewCard: {
    marginBottom: 4,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reviewUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  reviewUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: designTokens.colors.semantic.text,
  },
  reviewDate: {
    fontSize: 12,
    color: designTokens.colors.semantic.textSecondary,
  },
  reviewRating: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewText: {
    fontSize: 14,
    color: designTokens.colors.semantic.text,
    lineHeight: 22,
  },
  allReviewsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  allReviewsText: {
    fontSize: 16,
    color: designTokens.colors.semantic.primary,
    fontWeight: '500',
    marginRight: 4,
  },
  availabilityCard: {
    marginHorizontal: designTokens.spacing.scale.lg,
    marginBottom: designTokens.spacing.scale.xl,
    borderRadius: designTokens.borderRadius.components.card,
  },
  availabilitySubtitle: {
    ...designTokens.typography.styles.caption,
    color: designTokens.colors.semantic.textSecondary,
    marginBottom: designTokens.spacing.scale.md,
    marginTop: -designTokens.spacing.scale.sm,
  },
  datesContainer: {
    gap: designTokens.spacing.scale.sm,
    paddingVertical: designTokens.spacing.scale.sm,
  },
  dateItem: {
    width: 60,
    height: 80,
    borderRadius: designTokens.borderRadius.components.button,
    borderWidth: 1,
    borderColor: designTokens.colors.semantic.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: designTokens.colors.semantic.surface,
    ...designTokens.shadows.sm,
  },
  dateItemUnavailable: {
    backgroundColor: designTokens.colors.semantic.border,
    opacity: 0.6,
  },
  dateItemSelected: {
    backgroundColor: designTokens.colors.semantic.primary,
    borderColor: designTokens.colors.semantic.primary,
    ...designTokens.shadows.md,
  },
  dateDay: {
    fontSize: designTokens.typography.sizes.large,
    fontWeight: designTokens.typography.weights.bold as any,
    color: designTokens.colors.semantic.text,
    marginBottom: designTokens.spacing.scale.xs,
  },
  dateWeekday: {
    ...designTokens.typography.styles.caption,
    color: designTokens.colors.semantic.textSecondary,
    fontWeight: designTokens.typography.weights.medium as any,
  },
  dateTextUnavailable: {
    color: designTokens.colors.semantic.textSecondary,
  },
  dateTextSelected: {
    color: designTokens.colors.semantic.surface,
  },
  calendarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: designTokens.spacing.scale.md,
    paddingVertical: designTokens.spacing.scale.sm,
  },
  calendarButtonText: {
    ...designTokens.typography.styles.body,
    color: designTokens.colors.semantic.primary,
    fontWeight: designTokens.typography.weights.medium as any,
    marginRight: designTokens.spacing.scale.sm,
  },
  bookNowButton: {
    marginTop: designTokens.spacing.scale.lg,
    borderRadius: designTokens.borderRadius.components.button,
  },
  reportOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  reportSheet: {
    backgroundColor: designTokens.colors.semantic.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: designTokens.colors.semantic.text,
  },
  reportClose: {
    fontSize: 18,
    color: designTokens.colors.semantic.textSecondary,
    padding: 4,
  },
  reportSubtitle: {
    fontSize: 14,
    color: designTokens.colors.semantic.textSecondary,
    marginBottom: 16,
  },
  reportOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: designTokens.colors.semantic.border,
  },
  reportOptionSelected: {
    backgroundColor: designTokens.colors.semantic.primary + '10',
  },
  reportRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: designTokens.colors.semantic.textSecondary,
    marginRight: 12,
  },
  reportRadioSelected: {
    borderColor: designTokens.colors.semantic.primary,
    backgroundColor: designTokens.colors.semantic.primary,
  },
  reportOptionText: {
    fontSize: 15,
    color: designTokens.colors.semantic.text,
  },
  reportInput: {
    borderWidth: 1,
    borderColor: designTokens.colors.semantic.border,
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    marginBottom: 16,
    fontSize: 14,
    color: designTokens.colors.semantic.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  reportSubmitButton: {
    borderRadius: designTokens.borderRadius.components.button,
  },
});
