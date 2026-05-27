import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  RefreshControl,
  Dimensions,
  TextInput,
  Alert,
} from 'react-native';
import { useAuthStore } from '@/stores/auth-store';
import { Card } from '@/components/ui/Card';
import { ProfileImage } from '@/components/ui/ProfileImage';
import { RadialGradient } from '@/components/ui/RadialGradient';
import { Button } from '@/components/ui/Button';
import { Heading, Subheading, Body, Caption } from '@/components/ui/Typography';
import { LoadingState } from '@/components/ui/LoadingState';
import { designTokens, componentTokens } from '@/constants/design-tokens';
import { useTranslation } from 'react-i18next';
// Import booking API
import { 
  useBookingsQuery, 
  useUpdateBookingStatus,
  BookingListItem,
} from '@/app/api/booking/booking';

import {
  Calendar,
  Clock,
  MapPin,
  Star,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
  SortAsc,
  Eye,
  Timer
} from 'lucide-react-native';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');


// Enhanced status configuration with design tokens


// Component interfaces
interface BookingCardProps {
  booking: BookingListItem;
  onPress?: () => void;
  onMessage?: () => void;
  onViewDetails?: () => void;
  onModify?: () => void;
  onCancel?: () => void;
}

interface CountdownTimerProps {
  targetDate: string;
  targetTime: string;
}

// Countdown Timer Component
const CountdownTimer: React.FC<CountdownTimerProps> = ({ targetDate, targetTime }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const target = new Date(`${targetDate}T${targetTime}:00`);
      const now = new Date();
      const difference = target.getTime() - now.getTime();

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));

        if (days > 0) {
          setTimeLeft(`${days}d ${hours}h`);
        } else if (hours > 0) {
          setTimeLeft(`${hours}h ${minutes}m`);
        } else {
          setTimeLeft(`${minutes}m`);
        }
      } else {
        setTimeLeft('Now');
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 60000); // Update every minute

    return () => clearInterval(timer);
  }, [targetDate, targetTime]);

  return (
    <View style={styles.countdownContainer}>
      <Timer size={14} color={designTokens.colors.semantic.accent} />
      <Caption style={[styles.countdownText, { color: designTokens.colors.semantic.accent }]}>
        {timeLeft}
      </Caption>
    </View>
  );
};

export default function BookingsScreen() {
  const { t } = useTranslation();

  const statusConfig = {
    pending: {
      color: designTokens.colors.semantic.warning,
      icon: <AlertCircle size={16} color={designTokens.colors.semantic.warning} />,
      label: t('userHome.companion.pending'),
      bgColor: 'rgba(255, 152, 0, 0.1)',
      gradient: ['#FFF3E0', '#FFE0B2'],
    },
    confirmed: {
      color: designTokens.colors.semantic.success,
      icon: <CheckCircle size={16} color={designTokens.colors.semantic.success} />,
      label: t('userHome.companion.confirmed'),
      bgColor: 'rgba(76, 175, 80, 0.1)',
      gradient: ['#E8F5E8', '#C8E6C9'],
    },
    completed: {
      color: designTokens.colors.semantic.primary,
      icon: <CheckCircle size={16} color={designTokens.colors.semantic.primary} />,
      label: t('userHome.companion.completed'),
      bgColor: 'rgba(111, 76, 170, 0.1)',
      gradient: ['#F3E5F5', '#E1BEE7'],
    },
    in_progress: {
      color: designTokens.colors.semantic.accent,
      icon: <Timer size={16} color={designTokens.colors.semantic.accent} />,
      label: t('userHome.companion.inProgress'),
      bgColor: 'rgba(255, 107, 107, 0.1)',
      gradient: ['#FFE5E5', '#FFCDD2'],
    },
    cancelled: {
      color: designTokens.colors.semantic.error,
      icon: <XCircle size={16} color={designTokens.colors.semantic.error} />,
      label: t('userHome.companion.cancelled'),
      bgColor: 'rgba(255, 82, 82, 0.1)',
      gradient: ['#FFEBEE', '#FFCDD2'],
    },
  };
  
  const { user, isAuthenticated } = useAuthStore();
  const isCompanion = user?.userType === 'companion' || user?.userType === 'supplier';
  const [selectedTab, setSelectedTab] = useState<'upcoming' | 'past' | 'all'>('upcoming');
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'price' | 'status'>('date');
  const [showFilters, setShowFilters] = useState(false);
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | BookingListItem['status']>('all');
  const [search, setSearch] = useState('');
  const updateBookingStatus = useUpdateBookingStatus();

  // Fetch bookings from API
  const { data: bookingsData, isLoading, error, refetch } = useBookingsQuery({}, {
    enabled: isAuthenticated
  });

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Get bookings data - only use API data
  const allBookings = isAuthenticated && bookingsData?.success 
    ? bookingsData?.data?.items || []
    : [];

  // Debug: Log the actual bookings array to inspect companion data
  // logger.log('Bookings list items:', allBookings);

  // Enhanced filtering and sorting logic with better date handling
  const filteredBookings = (allBookings || [])
    .filter((booking: BookingListItem) => {
      const bookingDate = new Date(booking.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      bookingDate.setHours(0, 0, 0, 0);
      if (selectedTab === 'upcoming') {
        const isUpcoming = bookingDate >= today && !['completed', 'cancelled'].includes(booking.status);
        return isUpcoming;
      } else if (selectedTab === 'past') {
        const isPast = bookingDate < today || ['completed', 'cancelled'].includes(booking.status);
        return isPast;
      }
      return true;
    })
    .filter((booking: BookingListItem) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        booking.customer?.name?.toLowerCase().includes(q) ||
        booking.companion?.name?.toLowerCase().includes(q) ||
        booking.location?.toLowerCase().includes(q) ||
        booking.service?.name?.toLowerCase().includes(q) ||
        ((booking as any).experience?.name?.toLowerCase().includes(q))
      );
    })
    .filter((booking: BookingListItem) => {
      if (statusFilter === 'all') return true;
      return booking.status === statusFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'price':
          return b.totalAmount - a.totalAmount;
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

  // Calculate stats for display
  const upcomingCount = allBookings.filter((b: BookingListItem) => {
    const bookingDate = new Date(b.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    bookingDate.setHours(0, 0, 0, 0);
    return bookingDate >= today && !['completed', 'cancelled'].includes(b.status);
  }).length;

  const completedCount = allBookings.filter((b: BookingListItem) => b.status === 'completed').length;

  // Animation effects
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: designTokens.animation.duration.normal,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: designTokens.animation.duration.normal,
        useNativeDriver: true,
      }),
    ]).start();
  }, [selectedTab]);

  // Pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const getPaymentDisplayText = (booking: BookingListItem) => {
    if (isCompanion) {
      if (booking.status === 'pending') return 'Pending approval';
      if (booking.paymentStatus === 'paid') return 'Paid';
      return 'Cash due to guide';
    }

    if (booking.paymentStatus === 'paid') return 'Paid';
    if (booking.status === 'pending') return 'Pending guide approval';
    return 'Pay guide in cash';
  };

  const handleCompanionStatusUpdate = async (booking: BookingListItem, status: 'confirmed' | 'cancelled') => {
    try {
      await updateBookingStatus.mutateAsync({
        id: booking.id,
        statusData: {
          status,
          reason: status === 'cancelled' ? 'Guide declined the booking request.' : undefined,
        },
      });
      await refetch();
      Alert.alert(
        status === 'confirmed' ? 'Booking approved' : 'Booking rejected',
        status === 'confirmed'
          ? 'The traveler will see this booking as confirmed.'
          : 'The traveler will see that this booking request was rejected.'
      );
    } catch (error: any) {
      Alert.alert('Unable to update booking', error?.message || 'Please try again.');
    }
  };

  const handleRejectBooking = (booking: BookingListItem) => {
    Alert.alert(
      'Reject booking request',
      'Reject this request? The traveler will be notified.',
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: () => handleCompanionStatusUpdate(booking, 'cancelled'),
        },
      ]
    );
  };

  // Show loading state
  if (isLoading && isAuthenticated) {
    return (
      <RadialGradient variant="appBackground" style={styles.container}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Heading style={styles.headerTitle}>
              {isCompanion ? t('bookings.bookingRequests') : t('bookings.myBookings')}
            </Heading>
          </View>
        </View>
        <LoadingState message={t('bookings.loadingBookings')} />
      </RadialGradient>
    );
  }

  // Enhanced BookingCard component with design tokens
  const BookingCard: React.FC<BookingCardProps> = ({ booking }) => {
    const status = statusConfig[booking.status as keyof typeof statusConfig] || statusConfig.pending;
    const cardAnimation = useRef(new Animated.Value(0)).current;
    const isUpcoming = new Date(booking.date) >= new Date() && !['completed', 'cancelled'].includes(booking.status);
   
    const getDisplayPerson = () => {
      const person = isCompanion ? booking.customer : booking.companion;
      const fallback = isCompanion ? booking.companion : booking.customer;
      return {
        name: person?.name || fallback?.name || t('bookings.unknownCustomer'),
        image: person?.profileImage || fallback?.profileImage || '',
        rating: person?.rating || fallback?.rating || 0,
        isOnline: false, // API doesn't provide this yet
      };
    };

    // Get service data from API structure
    const getServiceData = () => {
      const service = booking.service;
      return {
        name: service ? (typeof service === 'string' ? service : service.name) : t('bookings.service'),
        type: 'Service', // API doesn't provide service type yet
      };
    };

    // Get booking details from API structure
    const getBookingDetails = () => {
      return {
        price: booking.totalAmount,
        time: booking.startTime,
        location: booking.location || 'Location TBD',
        duration: booking.duration,
      };
    };

    const displayPerson = getDisplayPerson();
    const serviceData = getServiceData();
    const bookingDetails = getBookingDetails();

    useEffect(() => {
      Animated.spring(cardAnimation, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }).start();
    }, []);

    const formatDate = (date: string) => {
      return new Date(date).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    };

    const formatTime = (time: string) => {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    };

    const formatDuration = (durationMinutes: number) => {
      if (durationMinutes < 60) return `${durationMinutes}m`;
      const hours = Math.floor(durationMinutes / 60);
      const minutes = durationMinutes % 60;
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    };

  

    return (
      <Animated.View
        style={[
          styles.bookingCardContainer,
          {
            opacity: cardAnimation,
            transform: [
              {
                translateY: cardAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          },
        ]}
      >
        <Card style={styles.bookingCard} padding={0}>
          {/* Card Header */}
          <View style={styles.cardHeader}>
            <View style={styles.companionInfo}>
              <ProfileImage
                uri={displayPerson.image}
                size="medium"
                online={displayPerson.isOnline}
              />
              <View style={styles.companionDetails}>
                <View style={styles.nameRow}>
                  <Subheading style={styles.companionName}>{displayPerson.name}</Subheading>
                </View>
                <View style={styles.ratingContainer}>
                  <Star size={14} color="#FFD700" fill="#FFD700" />
                  <Caption style={styles.ratingText}>{displayPerson.rating || 'New'}</Caption>
                  <Caption style={styles.serviceType}>• {serviceData.type}</Caption>
                </View>
              </View>
            </View>

            <View style={styles.cardHeaderActions}>
              <View style={[styles.statusBadge, { backgroundColor: status.bgColor }]}>
                {status.icon}
                <Caption style={[styles.statusText, { color: status.color }]}>
                  {status.label}
                </Caption>
              </View>
              {/* <TouchableOpacity style={styles.moreButton}>
                <MoreVertical size={20} color={designTokens.colors.semantic.textSecondary} />
              </TouchableOpacity> */}
            </View>
          </View>

          {/* Service Details */}
          <View style={styles.serviceSection}>
            <Subheading style={styles.serviceName}>{serviceData.name}</Subheading>

            {isUpcoming && (
              <CountdownTimer targetDate={booking.date} targetTime={bookingDetails.time} />
            )}
          </View>

          {/* Booking Details */}
          <View style={styles.detailsSection}>
            <View style={styles.detailRow}>
              <Calendar size={16} color={designTokens.colors.semantic.textSecondary} />
              <Body style={styles.detailText}>{formatDate(booking.date)}</Body>
            </View>

            <View style={styles.detailRow}>
              <Clock size={16} color={designTokens.colors.semantic.textSecondary} />
              <Body style={styles.detailText}>
                {formatTime(bookingDetails.time)} • {formatDuration(bookingDetails.duration)}
              </Body>
            </View>

            <View style={styles.detailRow}>
              <MapPin size={16} color={designTokens.colors.semantic.textSecondary} />
              <Body style={styles.detailText} numberOfLines={1}>
                {bookingDetails.location}
              </Body>
            </View>
          </View>

          {/* Footer Actions */}
          <View style={styles.cardFooter}>
            <View style={styles.priceSection}>
              <Subheading style={styles.priceText}>
                ฿{bookingDetails.price.toLocaleString()}
              </Subheading>
              <Caption style={styles.paymentMethod}>
                {getPaymentDisplayText(booking)}
              </Caption>
            </View>

            <View style={styles.actionButtons}>
              {/* <TouchableOpacity style={styles.actionButton} onPress={() => handleFavoritePress(booking.id)}>
                <Heart size={18} color={designTokens.colors.semantic.accent} fill={isFavorite ? designTokens.colors.semantic.accent : 'none'} />
              </TouchableOpacity> */}
              {/* <TouchableOpacity style={styles.actionButton}>
                <MessageCircle size={18} color={designTokens.colors.semantic.primary} />
              </TouchableOpacity> */}
              <TouchableOpacity style={styles.actionButton} onPress={() => router.push(`/(app)/booking/${booking.id}` as any)}>
                <Eye size={18} color={designTokens.colors.semantic.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {isCompanion && booking.status === 'pending' && (
            <View style={styles.approvalActions}>
              <TouchableOpacity
                style={[styles.approvalButton, styles.rejectApprovalButton]}
                onPress={() => handleRejectBooking(booking)}
                disabled={updateBookingStatus.isPending}
                accessibilityRole="button"
                accessibilityLabel="Reject booking request"
              >
                <XCircle size={17} color={designTokens.colors.semantic.error} />
                <Text style={styles.rejectApprovalText}>Reject</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.approvalButton, styles.approveApprovalButton]}
                onPress={() => handleCompanionStatusUpdate(booking, 'confirmed')}
                disabled={updateBookingStatus.isPending}
                accessibilityRole="button"
                accessibilityLabel="Approve booking request"
              >
                <CheckCircle size={17} color={designTokens.colors.semantic.surface} />
                <Text style={styles.approveApprovalText}>Approve</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Review Section for Completed Bookings */}
          {booking.status === 'completed' && (
            <View style={styles.reviewSection}>
              <Button
                title={t('bookings.writeReview')}
                variant="outline"
                size="small"
                style={styles.reviewButton}
              />
            </View>
          )}
        </Card>
      </Animated.View>
    );
  };

  // Enhanced Empty State Component
  const EmptyState = () => (
    <Animated.View
      style={[
        styles.emptyStateContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Card style={styles.emptyState} padding={designTokens.spacing.scale.xl}>
        <View style={styles.emptyStateIcon}>
          <Calendar size={48} color={designTokens.colors.semantic.textSecondary} />
        </View>
        <Subheading style={styles.emptyStateTitle}>{t('bookings.noBookingsFound')}</Subheading>
        <Body style={styles.emptyStateText}>
          {search.trim() || statusFilter !== 'all'
            ? 'No Tirak bookings match these filters.'
            : !isAuthenticated 
            ? t('bookings.pleaseLoginToViewBookings')
            : selectedTab === 'upcoming'
            ? t('bookings.youDontHaveAnyUpcomingBookings')
            : selectedTab === 'past'
            ? t('bookings.youDontHaveAnyPastBookings')
            : t('bookings.youDontHaveAnyBookings')
          }
        </Body>
        {!isCompanion && (
          <TouchableOpacity style={styles.exploreButton} onPress={() => router.push('/(app)/search')}>
            <Body style={styles.exploreButtonText}>{!isCompanion && t('bookings.exploreCompanions')}</Body>
          </TouchableOpacity>
        )}
      </Card>
    </Animated.View>
  );

  return (
    <RadialGradient variant="appBackground" style={styles.container}>
      {/* Search Bar */}
      
      {/* Enhanced Header with Fixed Layout */}
      <View style={styles.header}>
        {/* Title Row with Actions */}
        <View style={styles.titleRow}>
          <Heading style={styles.headerTitle}>
            {isCompanion ? t('bookings.bookingRequests') : t('bookings.myBookings')}
          </Heading>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.iconButton, showFilters && styles.iconButtonActive]}
              onPress={() => {
                setShowFilters(!showFilters);
                setShowSortOptions(false);
              }}
              accessibilityRole="button"
              accessibilityLabel="Filter bookings"
              accessibilityHint="Show booking request status filters"
            >
              <Filter size={20} color={designTokens.colors.semantic.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.iconButton, showSortOptions && styles.iconButtonActive]}
              onPress={() => {
                setShowSortOptions(!showSortOptions);
                setShowFilters(false);
              }}
              accessibilityRole="button"
              accessibilityLabel="Sort bookings"
              accessibilityHint="Show booking sort options"
            >
              <SortAsc size={20} color={designTokens.colors.semantic.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {showFilters && (
          <View style={styles.controlsPanel}>
            <Caption style={styles.controlsLabel}>Filter by booking status</Caption>
            <View style={styles.controlChips}>
              {[
                { key: 'all', label: 'All' },
                { key: 'pending', label: 'Pending' },
                { key: 'confirmed', label: 'Confirmed' },
                { key: 'completed', label: 'Completed' },
                { key: 'cancelled', label: 'Cancelled' },
              ].map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.controlChip,
                    statusFilter === option.key && styles.controlChipActive,
                  ]}
                  onPress={() => setStatusFilter(option.key as typeof statusFilter)}
                  accessibilityRole="button"
                  accessibilityLabel={`Show ${option.label.toLowerCase()} bookings`}
                >
                  <Caption
                    style={[
                      styles.controlChipText,
                      statusFilter === option.key && styles.controlChipTextActive,
                    ]}
                  >
                    {option.label}
                  </Caption>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {showSortOptions && (
          <View style={styles.controlsPanel}>
            <Caption style={styles.controlsLabel}>Sort by</Caption>
            <View style={styles.controlChips}>
              {[
                { key: 'date', label: 'Date' },
                { key: 'price', label: 'Price' },
                { key: 'status', label: 'Status' },
              ].map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.controlChip,
                    sortBy === option.key && styles.controlChipActive,
                  ]}
                  onPress={() => setSortBy(option.key as typeof sortBy)}
                  accessibilityRole="button"
                  accessibilityLabel={`Sort bookings by ${option.label.toLowerCase()}`}
                >
                  <Caption
                    style={[
                      styles.controlChipText,
                      sortBy === option.key && styles.controlChipTextActive,
                    ]}
                  >
                    {option.label}
                  </Caption>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={t('bookings.searchBookings')}
          value={search}
          onChangeText={setSearch}
          placeholderTextColor={designTokens.colors.semantic.textSecondary}
        />
      </View>

        {/* Tab Navigation with Design Tokens */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              selectedTab === 'upcoming' && styles.tabButtonActive
            ]}
            onPress={() => setSelectedTab('upcoming')}
          >
            <Body style={[
              styles.tabText,
              selectedTab === 'upcoming' && styles.tabTextActive
            ]}>
              {t('bookings.upcoming')}
            </Body>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              selectedTab === 'past' && styles.tabButtonActive
            ]}
            onPress={() => setSelectedTab('past')}
          >
            <Body style={[
              styles.tabText,
              selectedTab === 'past' && styles.tabTextActive
            ]}>
              {t('bookings.past')}
            </Body>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              selectedTab === 'all' && styles.tabButtonActive
            ]}
            onPress={() => setSelectedTab('all')}
          >
            <Body style={[
              styles.tabText,
              selectedTab === 'all' && styles.tabTextActive
            ]}>
              {t('search.all')}
            </Body>
          </TouchableOpacity>
        </View>

        {/* Stats Summary */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Caption style={styles.statLabel}>{t('bookings.total')}</Caption>
            <Body style={styles.statValue}>{allBookings.length}</Body>
          </View>
          <View style={styles.statItem}>
            <Caption style={styles.statLabel}>{t('bookings.upcoming')}</Caption>
            <Body style={styles.statValue}>{upcomingCount}</Body>
          </View>
          <View style={styles.statItem}>
            <Caption style={styles.statLabel}>{t('bookings.completed')}</Caption>
            <Body style={styles.statValue}>{completedCount}</Body>
          </View>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={designTokens.colors.semantic.primary}
            colors={[designTokens.colors.semantic.primary]}
          />
        }
      >
        {filteredBookings.length > 0 ? (
          filteredBookings.map((booking, index) => (
            <BookingCard key={booking.id} booking={booking} />
          ))
        ) : error && isAuthenticated ? (
          <View style={styles.errorContainer}>
            <Card style={styles.errorCard} padding={designTokens.spacing.scale.xl}>
              <View style={styles.errorIcon}>
                <AlertCircle size={48} color={designTokens.colors.semantic.error} />
              </View>
              <Subheading style={styles.errorTitle}>{t('bookings.unableToLoadBookings')}</Subheading>
              <Body style={styles.errorText}>
                {t('bookings.pleaseCheckYourConnectionAndTryAgain')}
              </Body>
              <Button
                title={t('bookings.retry')}
                onPress={() => refetch()}
                style={styles.retryButton}
              />
            </Card>
          </View>
        ) : (
          <EmptyState />
        )}
      </ScrollView>
    </RadialGradient>
  );
}

// Enhanced styles using comprehensive design token system
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header Styles
  header: {
    paddingHorizontal: designTokens.spacing.scale.lg,
    paddingTop: designTokens.spacing.scale.lg,
    paddingBottom: designTokens.spacing.scale.md,
  },

  // Fixed Title Row Layout - Horizontal Icon Alignment
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: designTokens.spacing.scale.md,
    width: '100%',
    minHeight: 40, // Ensure consistent height
  },
  headerTitle: {
    color: designTokens.colors.semantic.text,
    flex: 1,
    marginRight: designTokens.spacing.scale.md,
    lineHeight: 32, // Ensure proper vertical alignment
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: designTokens.spacing.scale.sm,
    flexShrink: 0,
    height: 40, // Match title height for alignment
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: designTokens.borderRadius.components.button,
    backgroundColor: 'rgba(111, 76, 170, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    // Ensure buttons don't shrink
    flexShrink: 0,
  },
  iconButtonActive: {
    backgroundColor: 'rgba(111, 76, 170, 0.2)',
    borderWidth: 1,
    borderColor: designTokens.colors.semantic.primary,
  },
  controlsPanel: {
    backgroundColor: designTokens.colors.components.card.background,
    borderRadius: designTokens.borderRadius.components.card,
    padding: designTokens.spacing.scale.md,
    marginBottom: designTokens.spacing.scale.md,
    ...designTokens.shadows.sm,
  },
  controlsLabel: {
    color: designTokens.colors.semantic.textSecondary,
    marginBottom: designTokens.spacing.scale.sm,
    fontWeight: '600',
  },
  controlChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: designTokens.spacing.scale.sm,
  },
  controlChip: {
    minHeight: 36,
    borderRadius: designTokens.borderRadius.components.button,
    paddingHorizontal: designTokens.spacing.scale.md,
    paddingVertical: designTokens.spacing.scale.sm,
    backgroundColor: designTokens.colors.semantic.background,
    borderWidth: 1,
    borderColor: designTokens.colors.semantic.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlChipActive: {
    backgroundColor: designTokens.colors.semantic.primary,
    borderColor: designTokens.colors.semantic.primary,
  },
  controlChipText: {
    color: designTokens.colors.semantic.text,
    fontWeight: '600',
  },
  controlChipTextActive: {
    color: designTokens.colors.semantic.primaryContrast,
  },

  // Enhanced Tab Navigation with Design Tokens
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: designTokens.colors.components.card.background,
    borderRadius: designTokens.borderRadius.components.button,
    padding: 4,
    marginBottom: designTokens.spacing.scale.md,
    ...designTokens.shadows.sm,
  },
  tabButton: {
    flex: 1,
    paddingVertical: designTokens.spacing.scale.sm,
    paddingHorizontal: designTokens.spacing.scale.md,
    borderRadius: designTokens.borderRadius.components.button - 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonActive: {
    backgroundColor: designTokens.colors.semantic.accent,
    ...designTokens.shadows.sm,
  },
  tabText: {
    color: designTokens.colors.semantic.textSecondary,
    fontWeight: '500',
    fontSize: 14,
  },
  tabTextActive: {
    color: designTokens.colors.components.button.text,
    fontWeight: '600',
  },

  // Stats Container
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: designTokens.colors.components.card.background,
    borderRadius: designTokens.borderRadius.components.card,
    padding: designTokens.spacing.scale.md,
    ...designTokens.shadows.sm,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    color: designTokens.colors.semantic.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    color: designTokens.colors.semantic.primary,
    fontWeight: '600',
  },

  // Content Styles
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: designTokens.spacing.scale.lg,
    paddingBottom: designTokens.spacing.scale.xl,
    gap: designTokens.spacing.scale.md,
  },

  // Booking Card Styles
  bookingCardContainer: {
    marginBottom: designTokens.spacing.scale.sm,
  },
  bookingCard: {
    ...designTokens.shadows.md,
    borderRadius: designTokens.borderRadius.components.card,
    overflow: 'hidden',
  },

  // Card Header
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: designTokens.spacing.scale.md,
    paddingBottom: designTokens.spacing.scale.sm,
  },
  companionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  companionDetails: {
    marginLeft: designTokens.spacing.scale.sm,
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.scale.xs,
    marginBottom: 4,
  },
  companionName: {
    color: designTokens.colors.semantic.text,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    color: designTokens.colors.semantic.text,
  },
  serviceType: {
    color: designTokens.colors.semantic.textSecondary,
  },
  cardHeaderActions: {
    alignItems: 'flex-end',
    gap: designTokens.spacing.scale.xs,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: designTokens.spacing.scale.sm,
    paddingVertical: 4,
    borderRadius: designTokens.borderRadius.components.button,
    gap: 4,
  },
  statusText: {
    fontWeight: '600',
  },
  moreButton: {
    padding: 4,
  },

  // Service Section
  serviceSection: {
    paddingHorizontal: designTokens.spacing.scale.md,
    paddingBottom: designTokens.spacing.scale.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceName: {
    color: designTokens.colors.semantic.text,
    flex: 1,
  },
  countdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    paddingHorizontal: designTokens.spacing.scale.sm,
    paddingVertical: 4,
    borderRadius: designTokens.borderRadius.components.button,
  },
  countdownText: {
    fontWeight: '600',
  },

  // Details Section
  detailsSection: {
    paddingHorizontal: designTokens.spacing.scale.md,
    paddingBottom: designTokens.spacing.scale.sm,
    gap: designTokens.spacing.scale.xs,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.scale.sm,
  },
  detailText: {
    color: designTokens.colors.semantic.textSecondary,
    flex: 1,
  },

  // Card Footer
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: designTokens.spacing.scale.md,
    paddingTop: designTokens.spacing.scale.sm,
    borderTopWidth: 1,
    borderTopColor: designTokens.colors.semantic.border,
  },
  priceSection: {
    flex: 1,
  },
  priceText: {
    color: designTokens.colors.semantic.primary,
    fontWeight: '700',
  },
  paymentMethod: {
    color: designTokens.colors.semantic.textSecondary,
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: designTokens.spacing.scale.sm,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(111, 76, 170, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  approvalActions: {
    flexDirection: 'row',
    gap: designTokens.spacing.scale.sm,
    paddingHorizontal: designTokens.spacing.scale.md,
    paddingBottom: designTokens.spacing.scale.md,
  },
  approvalButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: designTokens.borderRadius.components.button,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: designTokens.spacing.scale.xs,
  },
  rejectApprovalButton: {
    backgroundColor: designTokens.colors.semantic.surface,
    borderWidth: 1.5,
    borderColor: designTokens.colors.semantic.error,
  },
  approveApprovalButton: {
    backgroundColor: designTokens.colors.semantic.primary,
  },
  rejectApprovalText: {
    color: designTokens.colors.semantic.error,
    fontWeight: '700',
  },
  approveApprovalText: {
    color: designTokens.colors.semantic.surface,
    fontWeight: '700',
  },

  // Review Section
  reviewSection: {
    padding: designTokens.spacing.scale.md,
    paddingTop: designTokens.spacing.scale.sm,
    borderTopWidth: 1,
    borderTopColor: designTokens.colors.semantic.border,
  },
  reviewButton: {
    alignSelf: 'flex-start',
  },

  // Empty State
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: designTokens.spacing.scale.xl * 2,
  },
  emptyState: {
    alignItems: 'center',
    width: width * 0.8,
    maxWidth: 320,
  },
  emptyStateIcon: {
    marginBottom: designTokens.spacing.scale.lg,
    opacity: 0.5,
  },
  emptyStateTitle: {
    color: designTokens.colors.semantic.text,
    textAlign: 'center',
    marginBottom: designTokens.spacing.scale.sm,
  },
  emptyStateText: {
    color: designTokens.colors.semantic.textSecondary,
    textAlign: 'center',
    marginBottom: designTokens.spacing.scale.lg,
    lineHeight: 22,
  },
  exploreButton: {
    backgroundColor: designTokens.colors.semantic.primary,
    paddingVertical: designTokens.spacing.scale.md,
    paddingHorizontal: designTokens.spacing.scale.xl,
    borderRadius: designTokens.borderRadius.components.button,
    marginTop: designTokens.spacing.scale.sm,
    ...designTokens.shadows.md,
  },
  exploreButtonText: {
    color: designTokens.colors.components.button.text,
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 16,
  },

  // Error State Styles
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: designTokens.spacing.scale.xl * 2,
  },
  errorCard: {
    alignItems: 'center',
    width: width * 0.8,
    maxWidth: 320,
  },
  errorIcon: {
    marginBottom: designTokens.spacing.scale.lg,
    opacity: 0.7,
  },
  errorTitle: {
    color: designTokens.colors.semantic.text,
    textAlign: 'center',
    marginBottom: designTokens.spacing.scale.sm,
  },
  errorText: {
    color: designTokens.colors.semantic.textSecondary,
    textAlign: 'center',
    marginBottom: designTokens.spacing.scale.lg,
    lineHeight: 22,
  },
  retryButton: {
    marginTop: designTokens.spacing.scale.sm,
  },
  searchContainer: {
    // paddingHorizontal: designTokens.spacing.scale.lg,
    marginBottom: designTokens.spacing.scale.md,

  },
  searchInput: {
    backgroundColor: designTokens.colors.semantic.surface,
    borderRadius: designTokens.borderRadius.components.input,
    padding: 12,
    fontSize: 16,
    color: designTokens.colors.semantic.text,
    borderWidth: 1,
    borderColor: designTokens.colors.semantic.border,
  },
});
