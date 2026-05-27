import { logger } from '@/utils/logger';
import React, { useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, TextStyle, ScrollView, Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Divider } from '@/components/ui/Divider';
import { LoadingState } from '@/components/ui/LoadingState';
import { SafeIcon } from '@/components/ui/SafeIcon';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ViewManagerSafeWrapper } from '@/components/ui/ViewManagerSafeWrapper';
import { designTokens } from '@/constants/design-tokens';
import { useTranslation } from 'react-i18next';





// Fabric-safe icons imported above to prevent ViewManagerDelegate crashes

// Import Lucide icons with error handling
import { Calendar, Settings, TrendingUp, Plus, Clock, CheckCircle, XCircle } from 'lucide-react-native';
import { useSupplierStats } from '@/app/api/companion/stats';

// Safe color utilities to prevent ViewManager crashes
const safeColor = (color: string | undefined, fallback: string = '#666666'): string => {
  try {
    if (!color || typeof color !== 'string') return fallback;
    // Ensure color is valid
    return color.startsWith('#') ? color : fallback;
  } catch (error) {
    logger.warn('Color parsing error:', error);
    return fallback;
  }
};

const safeColorWithOpacity = (color: string | undefined, opacity: string = '20', fallback: string = '#66666620'): string => {
  try {
    if (!color || typeof color !== 'string') return fallback;
    const baseColor = color.startsWith('#') ? color : fallback.replace(opacity, '');
    return `${baseColor}${opacity}`;
  } catch (error) {
    logger.warn('Color opacity error:', error);
    return fallback;
  }
};

// Pre-computed safe colors to avoid runtime issues
const SAFE_COLORS = {
  primary: safeColor(designTokens.colors.semantic.primary, '#007AFF'),
  primaryLight: safeColorWithOpacity(designTokens.colors.semantic.primary, '20', '#007AFF20'),
  accent: safeColor(designTokens.colors.semantic.accent, '#FF9500'),
  accentLight: safeColorWithOpacity(designTokens.colors.semantic.accent, '20', '#FF950020'),
  success: safeColor(designTokens.colors.semantic.success, '#34C759'),
  successLight: safeColorWithOpacity(designTokens.colors.semantic.success, '20', '#34C75920'),
  error: safeColor(designTokens.colors.semantic.error, '#FF3B30'),
  errorLight: safeColorWithOpacity(designTokens.colors.semantic.error, '20', '#FF3B3020'),
  surface: safeColor(designTokens.colors.semantic.surface, '#FFFFFF'),
  text: safeColor(designTokens.colors.semantic.text, '#000000'),
  textSecondary: safeColor(designTokens.colors.semantic.textSecondary, '#666666'),
};

// Import booking API and auth store
import { 
  useBookingsQuery, 
  useUpdateBookingStatus,
  BookingListItem,
  BookingStatus 
} from '@/app/api/booking/booking';
import { useAuthStore } from '@/stores/auth-store';

interface CompanionDashboardProps {
  userName?: string;
}

// Helper function to get badge variant based on booking status
const getStatusBadgeVariant = (status: BookingStatus): 'success' | 'warning' | 'error' | 'info' => {
  switch (status) {
    case 'confirmed':
    case 'completed':
      return 'success';
    case 'pending':
      return 'warning';
    case 'cancelled':
      return 'error';
    case 'in_progress':
      return 'info';
    default:
      return 'info';
  }
};

// Helper function to get status display text
const getStatusDisplayText = (status: BookingStatus, t: (key: string) => string): string => {
  switch (status) {
    case 'pending':
      return t('userHome.companion.pending');
    case 'confirmed':
      return t('userHome.companion.confirmed');
    case 'in_progress':
      return t('userHome.companion.inProgress');
    case 'completed':
      return t('userHome.companion.completed');
    case 'cancelled':
      return t('userHome.companion.cancelled');
    default:
      return status;
  }
};

// Helper function to format date and time
const formatBookingDateTime = (date: string, startTime: string): string => {
  const bookingDate = new Date(date);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  let dateText = '';
  if (bookingDate.toDateString() === today.toDateString()) {
    dateText = 'Today';
  } else if (bookingDate.toDateString() === tomorrow.toDateString()) {
    dateText = 'Tomorrow';
  } else {
    dateText = bookingDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  }
  
  return `${dateText}, ${startTime}`;
};

// Safe TouchableOpacity wrapper to prevent ViewManager crashes
const SafeTouchableOpacity = ({ children, onPress, style, activeOpacity = 0.8, disabled = false, ...props }: any) => {
  const handlePress = useCallback(() => {
    try {
      if (!disabled && onPress) {
        onPress();
      }
    } catch (error) {
      logger.warn('TouchableOpacity press error:', error);
    }
  }, [onPress, disabled]);

  return (
    <ErrorBoundary fallback={<View style={style}>{children}</View>}>
      <TouchableOpacity
        style={style}
        onPress={handlePress}
        activeOpacity={activeOpacity}
        disabled={disabled}
        {...props}
      >
        {children}
      </TouchableOpacity>
    </ErrorBoundary>
  );
};

// Individual booking item component
const BookingItem: React.FC<{ booking: BookingListItem; onStatusUpdate: (id: string, status: BookingStatus) => void; isDemo?: boolean; t: (key: string) => string }> = ({
  booking,
  onStatusUpdate,
  isDemo = false,
  t
}) => {
  const updateStatusMutation = useUpdateBookingStatus();

  const handleStatusUpdate = async (newStatus: 'confirmed' | 'cancelled') => {
    if (isDemo) {
      // For demo bookings, just update locally
      onStatusUpdate(booking.id, newStatus);
      return;
    }

    try {
      await updateStatusMutation.mutateAsync({
        id: booking.id,
        statusData: { status: newStatus }
      });
      onStatusUpdate(booking.id, newStatus);
    } catch (error) {
      logger.warn('Failed to update booking status:', error);
    }
  };

  const canConfirm = booking.status === 'pending';

  return (
    <View style={styles.bookingItem as ViewStyle}>
      <SafeTouchableOpacity
        style={styles.bookingInfo as ViewStyle}
        onPress={() => router.push(`/booking/${booking.id}` as any)}
        activeOpacity={0.7}
      >
        <Text style={styles.bookingClient as TextStyle}>{booking.customer?.name || booking.companion?.name || 'Traveler'}</Text>
        {booking.service && (
          <Text style={styles.bookingService as TextStyle}>{booking.service.name}</Text>
        )}
        <Text style={styles.bookingTime as TextStyle}>
          {formatBookingDateTime(booking.date, booking.startTime)}
        </Text>
        {booking.location && (
          <Text style={styles.bookingLocation as TextStyle}>{booking.location}</Text>
        )}
      </SafeTouchableOpacity>
      
      <View style={styles.bookingActions as ViewStyle}>
        <Badge 
          variant={getStatusBadgeVariant(booking.status)} 
          size="sm"
          style={styles.statusBadge}
        >
          {getStatusDisplayText(booking.status, t)}
        </Badge>
        
        {/* Quick action buttons for pending bookings */}
        {canConfirm && (
          <View style={styles.quickActions as ViewStyle}>
            <SafeTouchableOpacity
              style={[styles.actionButton as ViewStyle, styles.confirmButton as ViewStyle]}
              onPress={() => handleStatusUpdate('confirmed')}
              disabled={updateStatusMutation.isPending}
            >
              <SafeCheckCircleIcon />
            </SafeTouchableOpacity>
            <SafeTouchableOpacity
              style={[styles.actionButton as ViewStyle, styles.cancelButton as ViewStyle]}
              onPress={() => handleStatusUpdate('cancelled')}
              disabled={updateStatusMutation.isPending}
            >
              <SafeXCircleIcon />
            </SafeTouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

type SupplierRoute = '/(supplier)/availability' | '/(supplier)/services' | '/(supplier)/analytics' | '/supplier/profile/edit';

// Route types for type safety

// Safe Lucide icon components with error boundaries
const SafeCalendarIcon = () => (
  <ErrorBoundary fallback={<View style={{ width: 24, height: 24, backgroundColor: SAFE_COLORS.primary, borderRadius: 12 }} />}>
    <Calendar size={24} color={SAFE_COLORS.primary} />
  </ErrorBoundary>
);

const SafeSettingsIcon = () => (
  <ErrorBoundary fallback={<View style={{ width: 24, height: 24, backgroundColor: SAFE_COLORS.accent, borderRadius: 12 }} />}>
    <Settings size={24} color={SAFE_COLORS.accent} />
  </ErrorBoundary>
);

const SafeTrendingUpIcon = () => (
  <ErrorBoundary fallback={<View style={{ width: 24, height: 24, backgroundColor: SAFE_COLORS.success, borderRadius: 12 }} />}>
    <TrendingUp size={24} color={SAFE_COLORS.success} />
  </ErrorBoundary>
);

const SafePlusIcon = () => (
  <ErrorBoundary fallback={<View style={{ width: 20, height: 20, backgroundColor: SAFE_COLORS.surface, borderRadius: 10 }} />}>
    <Plus size={20} color={SAFE_COLORS.surface} />
  </ErrorBoundary>
);

const SafeClockIcon = () => (
  <ErrorBoundary fallback={<View style={{ width: 48, height: 48, backgroundColor: SAFE_COLORS.textSecondary, borderRadius: 24 }} />}>
    <Clock size={48} color={SAFE_COLORS.textSecondary} />
  </ErrorBoundary>
);

const SafeCheckCircleIcon = () => (
  <ErrorBoundary fallback={<View style={{ width: 16, height: 16, backgroundColor: SAFE_COLORS.success, borderRadius: 8 }} />}>
    <CheckCircle size={16} color={SAFE_COLORS.success} />
  </ErrorBoundary>
);

const SafeXCircleIcon = () => (
  <ErrorBoundary fallback={<View style={{ width: 16, height: 16, backgroundColor: SAFE_COLORS.error, borderRadius: 8 }} />}>
    <XCircle size={16} color={SAFE_COLORS.error} />
  </ErrorBoundary>
);

export const CompanionDashboard: React.FC<CompanionDashboardProps> = ({ userName }) => {
  const { t } = useTranslation();
  return (
    <ViewManagerSafeWrapper
      onError={(error, errorInfo) => {
        console.error('CompanionDashboard ViewManager Error:', error, errorInfo);
        // Log additional context for Android production builds
        if (Platform.OS === 'android' && !__DEV__) {
          console.error('Android Production ViewManager Error:', {
            message: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack,
            timestamp: new Date().toISOString(),
            platform: Platform.OS,
            version: Platform.Version,
            isViewManagerError: error.message?.includes('ViewManagerDelegate'),
          });
        }
      }}
      fallback={
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ width: 48, height: 48, backgroundColor: '#E0E0E0', borderRadius: 24, marginBottom: 16 }} />
          <Text style={{ fontSize: 16, color: '#666', textAlign: 'center' }}>
            {t('userHome.dashboardTemporarilyUnavailable')}
          </Text>
        </View>
      }
    >
      <ErrorBoundary
        onError={(error, errorInfo) => {
          console.error('CompanionDashboard Error:', error, errorInfo);
        }}
      >
        <CompanionDashboardContent userName={userName} />
      </ErrorBoundary>
    </ViewManagerSafeWrapper>
  );
};

const CompanionDashboardContent: React.FC<CompanionDashboardProps> = ({ userName }) => {
  const { t } = useTranslation();
  try {
    // Check authentication status
    const { isAuthenticated } = useAuthStore();
    const { data: statsData, isLoading: isLoadingStats } = useSupplierStats();
    const stats = statsData?.data?.data;


  // Only fetch bookings if user is authenticated
  const { data: bookingsData, isLoading, error, refetch } = useBookingsQuery({ 
    limit: 5,
    page: 1 
  }, {
    enabled: isAuthenticated // Only run query if authenticated
  });

  const handleStatusUpdate = (bookingId: string, newStatus: BookingStatus) => {
    // Refetch bookings to get updated data
    refetch();
  };

  const emptyBookings: BookingListItem[] = [];

  // Use real data if authenticated and available, otherwise show an honest empty state.
  const displayBookings = isAuthenticated && bookingsData?.success 
    ? (bookingsData.data.bookings || bookingsData.data.items || [])
    : emptyBookings;
  
  const showLoadingState = isAuthenticated && isLoading || isLoadingStats;
  const showErrorState = isAuthenticated && error && !error.message.includes('401');
  const showEmptyState = (
    // Show empty state for authenticated users with no bookings
    (isAuthenticated && bookingsData?.success && (bookingsData.data.bookings?.length === 0 && bookingsData.data.items?.length === 0)) ||
    // Show empty state for authenticated users when API call failed with auth error (401)
    (isAuthenticated && error && error.message.includes('401')) ||
    // Show empty state for authenticated users when API hasn't loaded yet but no error
    (isAuthenticated && !isLoading && !error && !bookingsData) ||
    // Show empty state for unauthenticated users (demo mode)
    (!isAuthenticated && emptyBookings.length === 0)
  );

  // Debug logging
  // logger.log('CompanionDashboard Debug:');
  // logger.log('- isAuthenticated:', isAuthenticated);
  // logger.log('- isLoading:', isLoading);
  // logger.log('- error:', !!error);
  // logger.log('- bookingsData?.success:', bookingsData?.success);
  // logger.log('- bookingsData?.data?.bookings?.length:', bookingsData?.data?.bookings?.length);
  // logger.log('- emptyBookings.length:', emptyBookings.length);
  // logger.log('- showLoadingState:', showLoadingState);
  // logger.log('- showErrorState:', showErrorState);
  // logger.log('- showEmptyState:', showEmptyState);
  // logger.log('- displayBookings.length:', displayBookings.length);

  const handleNavigation = (route: SupplierRoute) => {
    // Add extra safety for Android APK builds
    const isAndroidProduction = Platform.OS === 'android' && !__DEV__;

    try {
      // For Android production, add a small delay to ensure UI is ready
      if (isAndroidProduction) {
        setTimeout(() => {
          try {
            router.push(route as any);
          } catch (delayedError) {
            logger.warn('Delayed companion dashboard navigation failed:', delayedError);
            showFallbackAlert(route);
          }
        }, 150);
      } else {
        // Immediate navigation for development and iOS
        router.push(route as any);
      }
    } catch (error) {
      logger.warn('Companion dashboard navigation failed:', { route, error });
      showFallbackAlert(route);
    }
  };

  const showFallbackAlert = (route: SupplierRoute) => {
    const featureNames: Record<SupplierRoute, string> = {
      '/(supplier)/availability': 'Availability Management',
      '/(supplier)/services': 'Experience Management',
      '/(supplier)/analytics': 'Analytics Dashboard',
      '/supplier/profile/edit': 'Profile Enhancement'
    };

    // Use setTimeout to ensure alert doesn't interfere with touch events
    setTimeout(() => {
      Alert.alert(
        featureNames[route] || 'Feature',
        'We could not open this screen. Please try again from the bottom navigation or settings.',
        [{ text: 'OK', style: 'default' }]
      );
    }, 100);
  };

  return (
    <View style={styles.container as ViewStyle}>
      <Card style={styles.statsCard as ViewStyle} padding="lg" shadow="lg">
        <View style={styles.statsHeader as ViewStyle}>
          <Text style={styles.statsTitle as TextStyle}>{t('userHome.companion.overview')}</Text>
          <Badge variant="success" size="sm">
            {t('userHome.companion.active')}
          </Badge>
        </View>
        
        <View style={styles.statsRow as ViewStyle}>
          <View style={styles.statItem as ViewStyle}>
            <Text style={styles.statValue as TextStyle}>{stats?.totalBookings ?? 0}</Text>
            <Text style={styles.statLabel as TextStyle}>{t('userHome.companion.bookings')}</Text>
          </View>
          <Divider orientation="vertical" margin="sm" />
          <View style={styles.statItem as ViewStyle}>
            <Text style={styles.statValue as TextStyle}>{stats?.averageRating ?? 0}</Text>
            <Text style={styles.statLabel as TextStyle}>{t('userHome.companion.rating')}</Text>
          </View>
          <Divider orientation="vertical" margin="sm" />
          <View style={styles.statItem as ViewStyle}>
            <Text style={styles.statValue as TextStyle}>{stats?.thisMonthEarnings ?? 0}</Text>
            <Text style={styles.statLabel as TextStyle}>{t('userHome.companion.thisWeek')}</Text>
          </View>
        </View>
      </Card>

      <Card style={styles.actionCard as ViewStyle} padding="lg" shadow="md">
        <Text style={styles.actionTitle as TextStyle}>{t('userHome.companion.quickActions')}</Text>
        <View style={styles.actionGrid as ViewStyle}>
          <SafeTouchableOpacity
            style={styles.actionItem as ViewStyle}
            onPress={() => handleNavigation('/(supplier)/availability')}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIcon as ViewStyle, { backgroundColor: SAFE_COLORS.primaryLight }]}>
              <SafeCalendarIcon />
            </View>
            <Text style={styles.actionText as TextStyle}>{t('userHome.companion.setAvailability')}</Text>
          </SafeTouchableOpacity>

          <SafeTouchableOpacity
            style={styles.actionItem as ViewStyle}
            onPress={() => handleNavigation('/(supplier)/services')}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIcon as ViewStyle, { backgroundColor: SAFE_COLORS.accentLight }]}>
              <SafeSettingsIcon />
            </View>
            <Text style={styles.actionText as TextStyle}>{t('userHome.companion.experiences')}</Text>
          </SafeTouchableOpacity>

          <SafeTouchableOpacity
            style={styles.actionItem as ViewStyle}
            onPress={() => handleNavigation('/(supplier)/analytics')}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIcon as ViewStyle, { backgroundColor: SAFE_COLORS.successLight }]}>
              <SafeTrendingUpIcon />
            </View>
            <Text style={styles.actionText as TextStyle}>{t('userHome.companion.analytics')}</Text>
          </SafeTouchableOpacity>
        </View>
      </Card>

      <Card style={styles.recentBookingsCard as ViewStyle} padding="lg" shadow="md">
        <View style={styles.recentBookingsHeader as ViewStyle}>
          <View style={styles.titleContainer as ViewStyle}>
            <Text style={styles.recentBookingsTitle as TextStyle}>{t('userHome.companion.recentBookings')}</Text>
            {!isAuthenticated && (
              <Badge variant="info" size="sm" style={styles.demoBadge}>
                Demo
              </Badge>
            )}
          </View>
          <SafeTouchableOpacity onPress={() => router.push('/bookings')}>
            <Text style={styles.viewAllText as TextStyle}>{t('userHome.companion.viewAll')}</Text>
          </SafeTouchableOpacity>
        </View>
        
        {showLoadingState ? (
          <LoadingState size="small" />
        ) : showErrorState ? (
          <View style={styles.errorContainer as ViewStyle}>
            <Text style={styles.errorText as TextStyle}>
              {isAuthenticated ? t('userHome.companion.failedToLoadBookings') : t('userHome.companion.pleaseLoginToViewBookings')}
            </Text>
            {isAuthenticated && (
              <SafeTouchableOpacity onPress={() => refetch()}>
                <Text style={styles.retryText as TextStyle}>{t('userHome.companion.retry')}</Text>
              </SafeTouchableOpacity>
            )}
          </View>
        ) : showEmptyState ? (
          <View style={styles.emptyContainer as ViewStyle}>
            <SafeClockIcon />
            <Text style={styles.emptyTitle as TextStyle}>{t('userHome.companion.noRecentBookings')}</Text>
            <Text style={styles.emptyText as TextStyle}>
              {isAuthenticated 
                ? (error && error.message.includes('401') 
                   ? t('userHome.companion.unableToLoadBookings')
                   : t('userHome.companion.yourRecentBookings'))
                : t('userHome.companion.signInToViewYourRecentBookings')
              }
            </Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            {displayBookings.map((booking) => (
              <BookingItem
                key={booking.id}
                booking={booking}
                onStatusUpdate={handleStatusUpdate}
                isDemo={!isAuthenticated}
                t={t}
              />
            ))}
          </ScrollView>
        )}
      </Card>

      <Card style={styles.completeProfileCard as ViewStyle} padding="lg" shadow="md">
        <Text style={styles.completeProfileTitle as TextStyle}>{t('userHome.companion.boostYourProfile')}</Text>
        <Text style={styles.completeProfileText as TextStyle}>
          {t('userHome.companion.addMorePhotosAndServices')}
        </Text>
        <Button
          title={t('userHome.companion.enhanceProfile')}
          variant="primary"
          style={styles.completeProfileButton as ViewStyle}
          rightIcon={<SafePlusIcon />}
          onPress={() => handleNavigation('/supplier/profile/edit')}
        />
      </Card>
    </View>
  );
  } catch (error) {
    console.error('CompanionDashboard render error:', error);
    // Return a safe fallback UI
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ textAlign: 'center', fontSize: 16, marginBottom: 20 }}>
          {t('userHome.companion.welcomeToYourDashboard')}
        </Text>
        <Text style={{ textAlign: 'center', color: '#666' }}>
          {t('userHome.companion.weAreUpdating')}
        </Text>
      </View>
    );
  }
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: designTokens.spacing.scale.lg,
    gap: designTokens.spacing.scale.lg,
  },
  statsCard: {
    backgroundColor: designTokens.colors.semantic.surface,
    borderRadius: designTokens.borderRadius.xl,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: designTokens.spacing.scale.lg,
  },
  statsTitle: {
    ...designTokens.typography.styles.subheading,
    color: designTokens.colors.semantic.text,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    color: designTokens.colors.semantic.primary,
    marginBottom: designTokens.spacing.scale.xs,
    ...designTokens.typography.styles.subheading,
  },
  statLabel: {
    ...designTokens.typography.styles.caption,
    color: designTokens.colors.semantic.textSecondary,
  },
  actionCard: {
    backgroundColor: designTokens.colors.semantic.surface,
    borderRadius: designTokens.borderRadius.xl,
  },
  actionTitle: {
    color: designTokens.colors.semantic.text,
    marginBottom: designTokens.spacing.scale.lg,
    ...designTokens.typography.styles.subheading,
  },
  actionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionItem: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: designTokens.spacing.scale.xs,
  },
  actionIcon: {
    width: 60,
    height: 60,
    borderRadius: designTokens.borderRadius.xxl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: designTokens.spacing.scale.sm,
  },
  actionText: {
    ...designTokens.typography.styles.caption,
    color: designTokens.colors.semantic.text,
    textAlign: 'center',
  },
  completeProfileCard: {
    backgroundColor: designTokens.colors.semantic.surface,
    borderRadius: designTokens.borderRadius.xl,
  },
  completeProfileTitle: {
    color: designTokens.colors.semantic.text,
    marginBottom: designTokens.spacing.scale.sm,
    ...designTokens.typography.styles.subheading,
  },
  completeProfileText: {
    color: designTokens.colors.semantic.textSecondary,
    marginBottom: designTokens.spacing.scale.lg,
    ...designTokens.typography.styles.body,
  },
  completeProfileButton: {
    // alignSelf: 'stretch',
    width: '100%',
  },
  recentBookingsCard: {
    backgroundColor: designTokens.colors.semantic.surface,
    borderRadius: designTokens.borderRadius.xl,
  },
  recentBookingsTitle: {
    color: designTokens.colors.semantic.text,
    marginBottom: designTokens.spacing.scale.lg,
    ...designTokens.typography.styles.subheading,
  },
  bookingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: designTokens.spacing.scale.md,
    borderBottomWidth: 1,
    borderBottomColor: designTokens.colors.semantic.border,
  },
  bookingInfo: {
    flex: 1,
  },
  bookingClient: {
    color: designTokens.colors.semantic.text,
    marginBottom: designTokens.spacing.scale.xs,
    ...designTokens.typography.styles.body,
  },
  bookingService: {
    color: designTokens.colors.semantic.textSecondary,
    marginBottom: designTokens.spacing.scale.xs,
    ...designTokens.typography.styles.caption,
  },
  bookingTime: {
    ...designTokens.typography.styles.caption,
    color: designTokens.colors.semantic.accent,
  },
  bookingStatus: {
    marginLeft: designTokens.spacing.scale.md,
  },
  // New styles for booking management
  recentBookingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: designTokens.spacing.scale.lg,
  },
  viewAllText: {
    color: designTokens.colors.semantic.primary,
    ...designTokens.typography.styles.caption,
    fontWeight: '600',
  },
  bookingLocation: {
    ...designTokens.typography.styles.caption,
    color: designTokens.colors.semantic.textSecondary,
    fontStyle: 'italic',
  },
  bookingActions: {
    alignItems: 'flex-end',
    gap: designTokens.spacing.scale.sm,
  },
  statusBadge: {
    marginBottom: designTokens.spacing.scale.xs,
  },
  quickActions: {
    flexDirection: 'row',
    gap: designTokens.spacing.scale.xs,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: designTokens.colors.semantic.surface,
    borderWidth: 1,
    borderColor: designTokens.colors.semantic.border,
  },
  confirmButton: {
    backgroundColor: SAFE_COLORS.successLight,
    borderColor: SAFE_COLORS.success,
  },
  cancelButton: {
    backgroundColor: SAFE_COLORS.errorLight,
    borderColor: SAFE_COLORS.error,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: designTokens.spacing.scale.xl,
  },
  errorText: {
    ...designTokens.typography.styles.body,
    color: designTokens.colors.semantic.error,
    marginBottom: designTokens.spacing.scale.sm,
  },
  retryText: {
    ...designTokens.typography.styles.caption,
    color: designTokens.colors.semantic.primary,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: designTokens.spacing.scale.xl,
    gap: designTokens.spacing.scale.sm,
  },
  emptyTitle: {
    ...designTokens.typography.styles.subheading,
    color: designTokens.colors.semantic.text,
  },
  emptyText: {
    ...designTokens.typography.styles.body,
    color: designTokens.colors.semantic.textSecondary,
    textAlign: 'center',
    paddingHorizontal: designTokens.spacing.scale.lg,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.scale.xs,
  },
  demoBadge: {
    marginLeft: designTokens.spacing.scale.xs,
  },
});
