import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
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
import { EarningsChart } from '@/components/supplier/EarningsChart';
import { PerformanceMetrics } from '@/components/supplier/PerformanceMetrics';
import { NotificationCenter } from '@/components/supplier/NotificationCenter';
import {
  mockSupplierActivities,
  mockEarningsData,
  mockServicePerformance,
  mockEarningsStats,
  mockPerformanceMetrics,
  mockSupplierNotifications
} from '@/mocks/supplier-data';
import { useSupplierStats } from '@/app/api/companion/stats';

export default function SupplierDashboard() {
  const router = useRouter();
  const { data: statsData, isLoading, error } = useSupplierStats();

  const profile = statsData?.data?.user as any;
  const stats = statsData?.data?.data;
  
  
  const handleEditProfile = () => {
    router.push('/supplier/profile/edit');
  };
  
  

  const handleViewSettings = () => {
    router.push('/supplier/settings');
  };

  const handleBack = () => {
    router.back();
  };


  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US');
  };
  
  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </SafeAreaView>
    );
  }

  if (error || !profile || !stats) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Failed to load dashboard.</Text>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Header with Back Navigation - Consistent with Home Page */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={24} color={designTokens.colors.semantic.text} />
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Analytics</Text>
          </View>

          <TouchableOpacity
            style={styles.headerActionButton}
            onPress={handleViewSettings}
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
              uri={profile?.profileImage}
              size={80}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{profile.name}</Text>
              <View style={styles.ratingContainer}>
                <Star size={16} color={designTokens.colors.reference.purple} fill={designTokens.colors.reference.purple} />
                <Text style={styles.ratingText}>
                  {stats.averageRating} ({profile.totalReviews} reviews)
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
            <TouchableOpacity
              style={styles.editButton}
              onPress={handleEditProfile}
            >
              <Edit size={16} color={designTokens.colors.semantic.surface} />
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile Completeness */}
        {(() => {
          const fields = [
            { label: 'Profile photo', done: !!profile?.profileImage },
            { label: 'Bio', done: !!profile?.bio && profile.bio.length >= 30 },
            { label: 'Location', done: !!profile?.location },
            { label: 'Languages', done: Array.isArray(profile?.languages) && profile.languages.length > 0 },
            { label: 'Services', done: stats.totalBookings > 0 || !!profile?.specialization },
          ];
          const done = fields.filter(f => f.done).length;
          const percent = Math.round((done / fields.length) * 100);
          if (percent === 100) return null;
          return (
            <View style={styles.completenessCard}>
              <View style={styles.completenessHeader}>
                <Award size={16} color={designTokens.colors.semantic.primary} />
                <Text style={styles.completenessTitle}>Profile Completeness — {percent}%</Text>
                <TouchableOpacity onPress={handleEditProfile}>
                  <Text style={styles.completenessAction}>Complete →</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.completenessBar}>
                <View style={[styles.completenessBarFill, { width: `${percent}%` as any }]} />
              </View>
              <View style={styles.completenessList}>
                {fields.filter(f => !f.done).map(f => (
                  <View key={f.label} style={styles.completenessItem}>
                    <View style={styles.completenessItemDot} />
                    <Text style={styles.completenessItemText}>Add {f.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          );
        })()}

        {/* Overview Analytics Section */}
        <View style={styles.overviewSection}>
          <Text style={styles.sectionTitle}>Overview</Text>

          <View style={styles.analyticsGrid}>
            {/* Top Row - 2 Cards */}
            <View style={styles.analyticsRow}>
              <LinearGradient
                colors={[designTokens.colors.reference.purple, '#9B4DFF']}
                style={[styles.analyticsCard, styles.halfCard]}
              >
                <Calendar size={24} color={designTokens.colors.semantic.surface} />
                <Text style={styles.cardValue}>{stats.totalBookings}</Text>
                <Text style={styles.cardLabel}>Total Bookings</Text>
              </LinearGradient>

              <LinearGradient
                colors={[designTokens.colors.reference.pink, '#FF9A7B']}
                style={[styles.analyticsCard, styles.halfCard]}
              >
                <Users size={24} color={designTokens.colors.semantic.surface} />
                <Text style={styles.cardValue}>{stats.profileViews}</Text>
                <Text style={styles.cardLabel}>Profile Views</Text>
              </LinearGradient>
            </View>

            {/* Bottom Row - 2 Cards */}
            <View style={styles.analyticsRow}>
              <LinearGradient
                colors={['#4ECDC4', '#44A08D']}
                style={[styles.analyticsCard, styles.halfCard]}
              >
                <DollarSign size={24} color={designTokens.colors.semantic.surface} />
                <Text style={styles.cardValue}>฿{formatCurrency(stats.totalEarnings)}</Text>
                <Text style={styles.cardLabel}>Total Earnings</Text>
              </LinearGradient>

              <LinearGradient
                colors={['#FFB347', '#FF8C42']}
                style={[styles.analyticsCard, styles.halfCard]}
              >
                <DollarSign size={24} color={designTokens.colors.semantic.surface} />
                <Text style={styles.cardValue}>฿{formatCurrency(stats.thisMonthEarnings)}</Text>
                <Text style={styles.cardLabel}>This Month</Text>
              </LinearGradient>
            </View>
          </View>
        </View>

        {/* Earnings Chart Section */}
        <View style={styles.earningsSection}>
          <Text style={styles.sectionTitle}>Earnings Overview</Text>
          <EarningsChart
            earningsData={stats.monthlyStats.map(m => ({
              ...m,
              averageBookingValue: m.earnings && m.bookings ? m.earnings / m.bookings : 0,
            }))}
            
            servicePerformance={stats.servicePerformance.map(s => ({
              serviceName: s.name,
              bookings: s.bookings,
              averageRating: s.rating,
              earnings: s.earnings,
              color: '#A9A9A9',
            }))}
            totalEarnings={stats.totalEarnings}
            monthlyGrowth={0}
          />
        </View>

        {/* Performance Metrics Section */}
        <View style={styles.performanceSection}>
          <Text style={styles.sectionTitle}>Performance Metrics</Text>
          {stats.totalBookings > 0 && stats.profileViews > 0 && stats.responseRate > 0 && stats.averageRating > 0 && stats.profileCompletion > 0 ? (
          <PerformanceMetrics
            metrics={[
              { id: 'total-bookings', name: 'Total Bookings', value: stats.totalBookings },
              { id: 'completed-bookings', name: 'Completed Bookings', value: stats.completedBookings },
              { id: 'cancelled-bookings', name: 'Cancelled Bookings', value: stats.cancelledBookings },
              { id: 'total-earnings', name: 'Total Earnings', value: stats.totalEarnings },
              { id: 'profile-views', name: 'Profile Views', value: stats.profileViews },
              { id: 'response-rate', name: 'Response Rate', value: stats.responseRate },
              { id: 'average-rating', name: 'Average Rating', value: stats.averageRating },
              { id: 'profile-completion', name: 'Profile Completion', value: stats.profileCompletion },
            ]}
          />
          ) : (
            <Text style={styles.sectionTitle}>No data available yet</Text>
          )}
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
  },
  loadingText: {
    ...componentTokens.text.body,
  },
  // Header Styles - Consistent with Home Page
  header: {
    paddingTop: designTokens.spacing.scale.lg,
    paddingHorizontal: designTokens.spacing.scale.lg,
    backgroundColor: designTokens.colors.semantic.background,
    marginTop: 40,
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
  completenessCard: {
    backgroundColor: designTokens.colors.semantic.surface,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: designTokens.colors.semantic.primary + '25',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  completenessHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  completenessTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: designTokens.colors.semantic.text,
  },
  completenessAction: {
    fontSize: 13,
    color: designTokens.colors.semantic.primary,
    fontWeight: '600',
  },
  completenessBar: {
    height: 6,
    backgroundColor: designTokens.colors.semantic.primary + '20',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 10,
  },
  completenessBarFill: {
    height: 6,
    backgroundColor: designTokens.colors.semantic.primary,
    borderRadius: 3,
  },
  completenessList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  completenessItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: designTokens.colors.semantic.primary + '10',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  completenessItemDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: designTokens.colors.semantic.primary,
  },
  completenessItemText: {
    fontSize: 11,
    color: designTokens.colors.semantic.primary,
    fontWeight: '500',
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