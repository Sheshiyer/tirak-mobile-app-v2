import { logger } from '@/utils/logger';
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Download,
  Filter,
  Search,
  BarChart3,
  X,
} from 'lucide-react-native';
import { RequestAnalytics } from '@/components/supplier/RequestAnalytics';
import { RadialGradient } from '@/components/ui/RadialGradient';
import { RequestCard } from '@/components/supplier/RequestCard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Heading, Subheading, Body, Caption } from '@/components/ui/Typography';
import { designTokens, componentTokens } from '@/constants/design-tokens';
import { useBookingsQuery } from '@/app/api/booking/booking';
import { BookingRequest } from '@/types/supplier-request';
import { bookingToRequest } from '@/utils/booking-request-adapter';

type HistoryFilter = 'all' | 'accepted' | 'declined' | 'expired' | 'cancelled';
type DateRange = '7days' | '30days' | '3months' | '6months' | 'all';

export default function RequestHistoryScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<HistoryFilter>('all');
  const [dateRange, setDateRange] = useState<DateRange>('30days');
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { data: bookingsData, refetch } = useBookingsQuery({ page: 1, limit: 100 });
  const requests = (bookingsData?.data?.items || bookingsData?.data?.bookings || []).map(bookingToRequest);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const getFilteredRequests = (): BookingRequest[] => {
    let filtered = [...requests];

    // Filter by status
    if (activeFilter !== 'all') {
      filtered = filtered.filter(req => req.status === activeFilter);
    }

    // Filter by date range
    const now = new Date();
    const cutoffDate = new Date();
    
    switch (dateRange) {
      case '7days':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case '30days':
        cutoffDate.setDate(now.getDate() - 30);
        break;
      case '3months':
        cutoffDate.setMonth(now.getMonth() - 3);
        break;
      case '6months':
        cutoffDate.setMonth(now.getMonth() - 6);
        break;
      default:
        cutoffDate.setFullYear(2020); // Show all
    }

    filtered = filtered.filter(req => new Date(req.createdAt) >= cutoffDate);

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(req =>
        req.customerName.toLowerCase().includes(query) ||
        req.serviceName.toLowerCase().includes(query) ||
        req.serviceCategory.toLowerCase().includes(query) ||
        req.meetingLocation.toLowerCase().includes(query) ||
        req.specialRequests?.toLowerCase().includes(query)
      );
    }

    return filtered.sort((a, b) => new Date(b.requestedDate).getTime() - new Date(a.requestedDate).getTime());
  };

  const getAnalytics = () => {
    const requests = getFilteredRequests();
    const total = requests.length;
    const accepted = requests.filter(r => r.status === 'accepted').length;
    const declined = requests.filter(r => r.status === 'declined').length;
    const pending = requests.filter(r => r.status === 'pending').length;
    const expired = requests.filter(r => r.status === 'expired').length;

    const acceptanceRate = total > 0 ? Math.round((accepted / total) * 100) : 0;
    const totalRevenue = requests
      .filter(r => r.status === 'accepted')
      .reduce((sum, r) => sum + r.totalAmount, 0);

    const avgResponseTime = '2.3 hours'; // Mock data
    const repeatCustomerRate = Math.round(
      (requests.filter(r => r.isRepeatCustomer).length / total) * 100
    );

    return {
      total,
      accepted,
      declined,
      pending,
      expired,
      acceptanceRate,
      totalRevenue,
      avgResponseTime,
      repeatCustomerRate,
    };
  };

  const analytics = getAnalytics();
  const filteredRequests = getFilteredRequests();

  const handleViewDetails = (requestId: string) => {
    router.push(`/supplier/requests/${requestId}`);
  };

  const handleExportData = () => logger.log('Exporting request history data...');

  const FilterChip = ({ 
    type, 
    label, 
    count 
  }: { 
    type: HistoryFilter; 
    label: string; 
    count: number;
  }) => {
    const isActive = activeFilter === type;
    return (
      <TouchableOpacity
        style={[styles.filterChip, isActive && styles.filterChipActive]}
        onPress={() => setActiveFilter(type)}
      >
        <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
          {label}
        </Text>
        {count > 0 && (
          <View style={styles.filterChipBadge}>
            <Text style={styles.filterChipBadgeText}>{count}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const DateRangeChip = ({ 
    type, 
    label 
  }: { 
    type: DateRange; 
    label: string;
  }) => {
    const isActive = dateRange === type;
    return (
      <TouchableOpacity
        style={[styles.dateChip, isActive && styles.dateChipActive]}
        onPress={() => setDateRange(type)}
      >
        <Text style={[styles.dateChipText, isActive && styles.dateChipTextActive]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <RadialGradient variant="appBackground" style={styles.container}>
      {/* Header */}
      <SafeAreaView edges={['top']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={designTokens.colors.semantic.text} />
          </TouchableOpacity>
          
          <View style={styles.headerTitle}>
            <Heading style={styles.title}>Request History</Heading>
            <Caption style={styles.subtitle}>
              {filteredRequests.length} request{filteredRequests.length !== 1 ? 's' : ''} found
            </Caption>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => setShowAnalytics(!showAnalytics)}
            >
              <BarChart3 size={20} color={designTokens.colors.semantic.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleExportData}
            >
              <Download size={20} color={designTokens.colors.semantic.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Analytics Dashboard */}
        {showAnalytics && (
          <View style={styles.analyticsContainer}>
            <RequestAnalytics dateRange={dateRange} requests={filteredRequests} />
          </View>
        )}

        {/* Search Input */}
        <View style={styles.searchContainer}>
          <Search size={16} color={designTokens.colors.semantic.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by customer, service, or location..."
            placeholderTextColor={designTokens.colors.semantic.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={16} color={designTokens.colors.semantic.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Date Range Filter */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.dateRangeContainer}
          contentContainerStyle={styles.dateRangeContent}
        >
          <DateRangeChip type="7days" label="7 Days" />
          <DateRangeChip type="30days" label="30 Days" />
          <DateRangeChip type="3months" label="3 Months" />
          <DateRangeChip type="6months" label="6 Months" />
          <DateRangeChip type="all" label="All Time" />
        </ScrollView>

        {/* Status Filters */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filtersContainer}
          contentContainerStyle={styles.filtersContent}
        >
          <FilterChip 
            type="all" 
            label="All" 
            count={analytics.total}
          />
          <FilterChip 
            type="accepted" 
            label="Accepted" 
            count={analytics.accepted}
          />
          <FilterChip 
            type="declined" 
            label="Declined" 
            count={analytics.declined}
          />
          <FilterChip 
            type="expired" 
            label="Expired" 
            count={analytics.expired}
          />
        </ScrollView>
      </SafeAreaView>

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
        {filteredRequests.length > 0 ? (
          filteredRequests.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              onViewDetails={handleViewDetails}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Search size={64} color={designTokens.colors.semantic.textSecondary} />
            <Subheading style={styles.emptyStateTitle}>No requests found</Subheading>
            <Body style={styles.emptyStateText}>
              No requests match your current filters. Try adjusting the date range or status filter.
            </Body>
          </View>
        )}
      </ScrollView>
    </RadialGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: 'transparent',
    paddingHorizontal: designTokens.spacing.scale.md,
    paddingBottom: designTokens.spacing.scale.sm,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: designTokens.spacing.scale.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: designTokens.colors.semantic.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: designTokens.spacing.scale.md,
    ...componentTokens.card.shadow,
  },
  headerTitle: {
    flex: 1,
  },
  title: {
    marginBottom: designTokens.spacing.scale.xs,
  },
  subtitle: {
    color: designTokens.colors.semantic.textSecondary,
  },
  headerActions: {
    flexDirection: 'row',
    gap: designTokens.spacing.scale.sm,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: designTokens.colors.semantic.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...componentTokens.card.shadow,
  },
  analyticsContainer: {
    marginBottom: designTokens.spacing.scale.md,
    height: 400,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: designTokens.colors.semantic.surface,
    paddingHorizontal: designTokens.spacing.scale.md,
    paddingVertical: designTokens.spacing.scale.sm,
    borderRadius: componentTokens.card.borderRadius,
    marginBottom: designTokens.spacing.scale.md,
    ...componentTokens.card.shadow,
  },
  searchInput: {
    flex: 1,
    marginLeft: designTokens.spacing.scale.sm,
    fontSize: 16,
    color: designTokens.colors.semantic.text,
  },
  dateRangeContainer: {
    marginBottom: designTokens.spacing.scale.sm,
  },
  dateRangeContent: {
    paddingRight: designTokens.spacing.scale.md,
  },
  dateChip: {
    backgroundColor: designTokens.colors.semantic.surface + '80',
    paddingHorizontal: designTokens.spacing.scale.md,
    paddingVertical: designTokens.spacing.scale.sm,
    borderRadius: 16,
    marginRight: designTokens.spacing.scale.sm,
  },
  dateChipActive: {
    backgroundColor: designTokens.colors.semantic.accent,
  },
  dateChipText: {
    color: designTokens.colors.semantic.text,
    fontWeight: '500',
  },
  dateChipTextActive: {
    color: designTokens.colors.semantic.surface,
  },
  filtersContainer: {
    marginBottom: designTokens.spacing.scale.sm,
  },
  filtersContent: {
    paddingRight: designTokens.spacing.scale.md,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: designTokens.colors.semantic.surface,
    paddingHorizontal: designTokens.spacing.scale.md,
    paddingVertical: designTokens.spacing.scale.sm,
    borderRadius: 20,
    marginRight: designTokens.spacing.scale.sm,
    ...componentTokens.card.shadow,
  },
  filterChipActive: {
    backgroundColor: designTokens.colors.semantic.primary,
  },
  filterChipText: {
    color: designTokens.colors.semantic.text,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: designTokens.colors.semantic.surface,
  },
  filterChipBadge: {
    backgroundColor: designTokens.colors.semantic.accent,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: designTokens.spacing.scale.xs,
  },
  filterChipBadgeText: {
    color: designTokens.colors.semantic.surface,
    fontSize: 10,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: designTokens.spacing.scale.md,
    paddingTop: 0,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: designTokens.spacing.scale.xl * 2,
  },
  emptyStateTitle: {
    marginTop: designTokens.spacing.scale.md,
    marginBottom: designTokens.spacing.scale.sm,
    textAlign: 'center',
  },
  emptyStateText: {
    textAlign: 'center',
    color: designTokens.colors.semantic.textSecondary,
    paddingHorizontal: designTokens.spacing.scale.lg,
  },
});
