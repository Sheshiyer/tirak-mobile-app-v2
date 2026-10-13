import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Calendar,
  Users,
  DollarSign,
  Star,
  Settings,
  MessageSquare,
  Clock,
  ChevronRight,
  TrendingUp,
  Award,
  Edit,
  ArrowLeft
} from 'lucide-react-native';
import { designTokens, componentTokens } from '@/constants/design-tokens';
import { ProfileImage } from '@/components/ui/ProfileImage';
import { useSupplierStore } from '@/stores/supplier-store';
import { LinearGradient } from 'expo-linear-gradient';
import { RadialGradient } from '@/components/ui/RadialGradient';
import { RecentActivityFeed } from '@/components/supplier/RecentActivityFeed';
import { NotificationCenter } from '@/components/supplier/NotificationCenter';
import { useSupplierStats } from '@/services/api/companion/stats';
import { useTranslation } from 'react-i18next';

type SupplierRoute = '/(supplier)/settings';

export default function SupplierDashboard() {
  const router = useRouter();
  const { data: statsData, isLoading, error } = useSupplierStats();
  const { t } = useTranslation();
  const handleSettings = () => {
    try {
      router.push('/(supplier)/settings' as any);
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={designTokens.colors.semantic.primary} />
        <Text style={styles.loadingText}>{t('analytics.loadingAnalytics')}</Text>
      </SafeAreaView>
    );
  }

  if (error || !statsData?.data) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>{t('analytics.failedToLoadAnalytics')}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => router.replace('/(supplier)/analytics')}
        >
          <Text style={styles.retryText}>{t('analytics.retry')}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const { user: profile, data: stats } = statsData.data;


  const handleEditProfile = () => {
    router.push('/supplier/profile/edit');
  };
  
  

  const handleViewSettings = () => {
    router.push('/supplier/settings');
  };

  const handleBack = () => {
    router.back();
  };


  const formatCurrency = (amount: number | null) => amount === null ? t('analytics.unavailable') : `฿${amount.toLocaleString('en-US')}`;
  
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Header with Back Navigation */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={24} color={designTokens.colors.semantic.text} />
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>{t('analytics.analytics')}</Text>
          </View>

          <TouchableOpacity
            style={styles.headerActionButton}
            onPress={handleSettings}
            accessibilityRole="button"
            accessibilityLabel="Settings"
          >
            <Settings size={20} color={designTokens.colors.semantic.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileSection}>
            <ProfileImage
              uri={profile.profileImage}
              size={80}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{profile.name}</Text>
              <View style={styles.ratingContainer}>
                <Star size={16} color={designTokens.colors.reference.purple} fill={designTokens.colors.reference.purple} />
                <Text style={styles.ratingText}>
                  {stats.averageRating ?? t('analytics.unavailable')} ({profile.totalReviews} {t('analytics.reviews')})
                </Text>
              </View>
              <View style={styles.statusContainer}>
                <View style={[
                  styles.statusBadge,
                  profile.status === 'active' ? styles.statusApproved : styles.statusPending
                ]}>
                  <Text style={styles.statusText}>
                    {profile.status.charAt(0).toUpperCase() + profile.status.slice(1)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Overview Analytics Section */}
        <View style={styles.overviewSection}>
          <Text style={styles.sectionTitle}>{t('analytics.overview')}</Text>

          <View style={styles.analyticsGrid}>
            {/* Top Row - 2 Cards */}
            <View style={styles.analyticsRow}>
              <LinearGradient
                colors={[designTokens.colors.reference.purple, '#9B4DFF']}
                style={[styles.analyticsCard, styles.halfCard]}
              >
                <Calendar size={24} color={designTokens.colors.semantic.surface} />
                <Text style={styles.cardValue}>{stats.totalBookings}</Text>
                <Text style={styles.cardLabel}>{t('analytics.totalBookings')}</Text>
              </LinearGradient>

              <LinearGradient
                colors={[designTokens.colors.reference.pink, '#FF9A7B']}
                style={[styles.analyticsCard, styles.halfCard]}
              >
                <Users size={24} color={designTokens.colors.semantic.surface} />
                <Text style={styles.cardValue}>{stats.profileViews ?? t('analytics.unavailable')}</Text>
                <Text style={styles.cardLabel}>{t('analytics.profileViews')}</Text>
              </LinearGradient>
            </View>

            {/* Bottom Row - 2 Cards */}
            <View style={styles.analyticsRow}>
              <LinearGradient
                colors={['#4ECDC4', '#44A08D']}
                style={[styles.analyticsCard, styles.halfCard]}
              >
                <DollarSign size={24} color={designTokens.colors.semantic.surface} />
                <Text style={styles.cardValue}>{formatCurrency(stats.totalEarnings)}</Text>
                <Text style={styles.cardLabel}>{t('analytics.totalEarnings')}</Text>
              </LinearGradient>

              <LinearGradient
                colors={['#FFB347', '#FF8C42']}
                style={[styles.analyticsCard, styles.halfCard]}
              >
                <DollarSign size={24} color={designTokens.colors.semantic.surface} />
                <Text style={styles.cardValue}>{formatCurrency(stats.thisMonthEarnings)}</Text>
                <Text style={styles.cardLabel}>{t('analytics.thisMonthEarnings')}</Text>
              </LinearGradient>
            </View>
          </View>
        </View>

        <View style={styles.earningsSection}>
          <Text style={styles.sectionTitle}>{t('analytics.earningsOverview')}</Text>
          <Text>{t('analytics.cashEarningsUnavailable')}</Text>
        </View>
        <View style={styles.performanceSection}>
          <Text style={styles.sectionTitle}>{t('analytics.performanceMetrics')}</Text>
          <Text>{t('analytics.completedBookings')}: {stats.completedBookings}</Text>
          <Text>{t('analytics.cancelledBookings')}: {stats.cancelledBookings}</Text>
          <Text>{t('analytics.responseRate')}: {stats.responseRate === null ? t('analytics.unavailable') : `${stats.responseRate}%`}</Text>
          <Text>{t('analytics.averageRating')}: {stats.averageRating ?? t('analytics.unavailable')}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: designTokens.colors.semantic.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: designTokens.colors.semantic.background,
    gap: designTokens.spacing.scale.md,
  },
  loadingText: {
    ...componentTokens.text.body,
    color: designTokens.colors.semantic.text,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: designTokens.colors.semantic.background,
    gap: designTokens.spacing.scale.lg,
  },
  errorText: {
    ...componentTokens.text.body,
    color: designTokens.colors.semantic.error,
  },
  retryButton: {
    backgroundColor: designTokens.colors.semantic.primary,
    paddingHorizontal: designTokens.spacing.scale.xl,
    paddingVertical: designTokens.spacing.scale.md,
    borderRadius: designTokens.borderRadius.components.button,
  },
  retryText: {
    ...componentTokens.text.body,
    color: designTokens.colors.semantic.surface,
    fontWeight: '600',
  },
  // Header Styles - Consistent with Home Page
  header: {
    paddingTop: designTokens.spacing.scale.lg,
    paddingHorizontal: designTokens.spacing.scale.lg,
    backgroundColor: designTokens.colors.semantic.background,
    marginTop: 40,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: designTokens.colors.semantic.surface,
    ...designTokens.shadows.sm,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    ...componentTokens.text.subheading,
    color: designTokens.colors.semantic.text,
    fontWeight: '600',
  },
  headerSubtitle: {
    ...componentTokens.text.caption,
    color: designTokens.colors.semantic.textSecondary,
  },
  headerActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: designTokens.colors.semantic.surface,
    ...designTokens.shadows.sm,
  },
  scrollContent: {
    flexGrow: 1,
    padding: designTokens.spacing.scale.lg,
  },
  // Profile Header Card
  profileCard: {
    ...componentTokens.card.default,
    marginBottom: designTokens.spacing.scale.lg,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
    marginLeft: designTokens.spacing.scale.lg,
  },
  profileName: {
    ...componentTokens.text.subheading,
    marginBottom: designTokens.spacing.scale.xs,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: designTokens.spacing.scale.xs,
  },
  ratingText: {
    ...componentTokens.text.caption,
    marginLeft: designTokens.spacing.scale.xs,
  },
  statusContainer: {
    flexDirection: 'row',
  },
  statusBadge: {
    paddingHorizontal: designTokens.spacing.scale.sm,
    paddingVertical: designTokens.spacing.scale.xs,
    borderRadius: designTokens.borderRadius.components.button,
  },
  statusApproved: {
    backgroundColor: '#4ECDC4',
  },
  statusPending: {
    backgroundColor: '#FFB347',
  },
  statusText: {
    ...designTokens.typography.styles.caption,
    fontWeight: designTokens.typography.weights.semibold,
    color: designTokens.colors.semantic.surface,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.scale.xs,
    paddingHorizontal: designTokens.spacing.scale.md,
    paddingVertical: designTokens.spacing.scale.sm,
    backgroundColor: designTokens.colors.reference.purple,
    borderRadius: designTokens.borderRadius.components.button,
  },
  editButtonText: {
    ...designTokens.typography.styles.caption,
    color: designTokens.colors.semantic.surface,
    fontWeight: designTokens.typography.weights.semibold,
  },
  // Overview Analytics Section
  overviewSection: {
    marginBottom: designTokens.spacing.scale.xl,
  },
  // Earnings Section
  earningsSection: {
    marginBottom: designTokens.spacing.scale.xl,
  },
  // Performance Section
  performanceSection: {
    marginBottom: designTokens.spacing.scale.xl,
  },
  // Notification Section
  notificationSection: {
    marginBottom: designTokens.spacing.scale.xl,
  },
  // Recent Activity Section
  recentActivitySection: {
    marginBottom: designTokens.spacing.scale.xl,
  },
  sectionTitle: {
    ...componentTokens.text.subheading,
    marginBottom: designTokens.spacing.scale.lg,
  },
  analyticsGrid: {
    gap: designTokens.spacing.scale.md,
  },
  analyticsRow: {
    flexDirection: 'row',
    gap: designTokens.spacing.scale.md,
  },
  analyticsCard: {
    padding: designTokens.spacing.scale.lg,
    borderRadius: designTokens.borderRadius.components.card,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
    ...designTokens.shadows.md,
  },
  halfCard: {
    flex: 1,
  },
  cardValue: {
    ...designTokens.typography.styles.subheading,
    color: designTokens.colors.semantic.surface,
    marginTop: designTokens.spacing.scale.sm,
    marginBottom: designTokens.spacing.scale.xs,
  },
  cardLabel: {
    ...designTokens.typography.styles.caption,
    color: designTokens.colors.semantic.surface,
    textAlign: 'center',
    opacity: 0.9,
  },
  // Quick Actions Section
  quickActionsSection: {
    marginBottom: designTokens.spacing.scale.xl,
  },
  actionsList: {
    gap: designTokens.spacing.scale.md,
  },
  actionItem: {
    ...componentTokens.card.default,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: designTokens.spacing.scale.lg,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: designTokens.borderRadius.components.avatar,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: designTokens.spacing.scale.lg,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    ...designTokens.typography.styles.body,
    fontWeight: designTokens.typography.weights.semibold,
    marginBottom: designTokens.spacing.scale.xs,
  },
  actionDescription: {
    ...componentTokens.text.caption,
  },
});
