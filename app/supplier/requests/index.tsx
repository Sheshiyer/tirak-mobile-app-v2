import { logger } from '@/utils/logger';
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Filter,
  SortAsc,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  History,
} from 'lucide-react-native';
import { RadialGradient } from '@/components/ui/RadialGradient';
import { RequestCard } from '@/components/supplier/RequestCard';
import { Heading, Subheading, Body, Caption } from '@/components/ui/Typography';
import { designTokens, componentTokens } from '@/constants/design-tokens';
import { useBookingsQuery, useUpdateBookingStatus } from '@/app/api/booking/booking';
import { BookingRequest } from '@/types/supplier-request';
import { bookingToRequest } from '@/utils/booking-request-adapter';

type FilterType = 'all' | 'pending' | 'urgent' | 'today' | 'this_week';
type SortType = 'date' | 'price' | 'urgency';

export default function RequestsListScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('pending');
  const [sortBy, setSortBy] = useState<SortType>('date');
  const [showFilters, setShowFilters] = useState(false);
  const { data: bookingsData, isLoading, refetch } = useBookingsQuery({ page: 1, limit: 50 });
  const updateStatusMutation = useUpdateBookingStatus();

  const requests = ((bookingsData?.data?.items || bookingsData?.data?.bookings || [])).map(bookingToRequest);

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

    // Apply filters
    switch (activeFilter) {
      case 'pending':
        filtered = filtered.filter(req => req.status === 'pending');
        break;
      case 'urgent':
        filtered = filtered.filter(req => req.urgency === 'urgent' || req.urgency === 'high');
        break;
      case 'today':
        const today = new Date().toISOString().split('T')[0];
        filtered = filtered.filter(req => req.requestedDate === today);
        break;
      case 'this_week':
        const weekFromNow = new Date();
        weekFromNow.setDate(weekFromNow.getDate() + 7);
        filtered = filtered.filter(req => {
          const reqDate = new Date(req.requestedDate);
          return reqDate <= weekFromNow;
        });
        break;
      default:
        filtered = requests;
    }

    // Apply sorting
    switch (sortBy) {
      case 'date':
        return filtered.sort((a, b) => new Date(b.requestedDate).getTime() - new Date(a.requestedDate).getTime());
      case 'price':
        return filtered.sort((a, b) => b.totalAmount - a.totalAmount);
      case 'urgency':
        return filtered.sort((a, b) => {
          const urgencyOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          return urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
        });
      default:
        return filtered;
    }
  };

  const filteredRequests = getFilteredRequests();
  const pendingCount = requests.filter(req => req.status === 'pending').length;
  const urgentCount = requests.filter(req => req.urgency === 'urgent' || req.urgency === 'high').length;

  const handleAcceptRequest = (requestId: string) => {
    Alert.alert(
      'Accept Request',
      'Are you sure you want to accept this booking request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          style: 'default',
          onPress: async () => {
            await updateStatusMutation.mutateAsync({
              id: requestId,
              statusData: { status: 'confirmed' },
            });
            Alert.alert('Success', 'Booking request accepted!');
            refetch();
          },
        },
      ]
    );
  };

  const handleDeclineRequest = (requestId: string) => {
    router.push(`/supplier/requests/${requestId}/decline`);
  };

  const handleViewDetails = (requestId: string) => {
    router.push(`/supplier/requests/${requestId}`);
  };

  const handleMessageCustomer = (customerId: string) => {
    router.push(`/chat/${customerId}`);
  };

  const handleSendMessage = (message: string) => {
    // In a real app, this would send the message through the chat system
    logger.log('Sending message:', message);
    Alert.alert('Message Sent', 'Your message has been sent to the customer.');
  };

  const FilterChip = ({ 
    type, 
    label, 
    count, 
    icon 
  }: { 
    type: FilterType; 
    label: string; 
    count?: number; 
    icon?: React.ReactNode;
  }) => {
    const isActive = activeFilter === type;
    return (
      <TouchableOpacity
        style={[styles.filterChip, isActive && styles.filterChipActive]}
        onPress={() => setActiveFilter(type)}
      >
        {icon}
        <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
          {label}
        </Text>
        {count !== undefined && count > 0 && (
          <View style={styles.filterChipBadge}>
            <Text style={styles.filterChipBadgeText}>{count}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <CheckCircle size={64} color={designTokens.colors.semantic.textSecondary} />
      <Subheading style={styles.emptyStateTitle}>No requests found</Subheading>
      <Body style={styles.emptyStateText}>
        {activeFilter === 'pending' 
          ? "You're all caught up! No pending requests at the moment."
          : `No requests match the current filter: ${activeFilter.replace('_', ' ')}`
        }
      </Body>
    </View>
  );

  return (
    <RadialGradient variant="appBackground" style={styles.container}>
      {/* Header */}
      <SafeAreaView edges={['top']} style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.titleContainer}>
            <Heading style={styles.headerTitle}>Booking Requests</Heading>
            {pendingCount > 0 && (
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingBadgeText}>{pendingCount}</Text>
              </View>
            )}
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => router.push('/supplier/requests/history')}
            >
              <History size={20} color={designTokens.colors.semantic.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => setShowFilters(!showFilters)}
            >
              <Filter size={20} color={designTokens.colors.semantic.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => {
                const sortOptions: SortType[] = ['date', 'price', 'urgency'];
                const currentIndex = sortOptions.indexOf(sortBy);
                const nextIndex = (currentIndex + 1) % sortOptions.length;
                setSortBy(sortOptions[nextIndex]);
              }}
            >
              <SortAsc size={20} color={designTokens.colors.semantic.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Urgent Alerts */}
        {urgentCount > 0 && (
          <View style={styles.urgentAlert}>
            <AlertTriangle size={16} color={designTokens.colors.semantic.accent} />
            <Text style={styles.urgentAlertText}>
              {urgentCount} urgent request{urgentCount > 1 ? 's' : ''} need{urgentCount === 1 ? 's' : ''} immediate attention
            </Text>
          </View>
        )}

        {/* Filter Chips */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filtersContainer}
          contentContainerStyle={styles.filtersContent}
        >
          <FilterChip 
            type="pending" 
            label="Pending" 
            count={pendingCount}
            icon={<Clock size={16} color={activeFilter === 'pending' ? designTokens.colors.semantic.surface : designTokens.colors.semantic.primary} />}
          />
          <FilterChip 
            type="urgent" 
            label="Urgent" 
            count={urgentCount}
            icon={<AlertTriangle size={16} color={activeFilter === 'urgent' ? designTokens.colors.semantic.surface : designTokens.colors.semantic.accent} />}
          />
          <FilterChip 
            type="today" 
            label="Today"
            icon={<Calendar size={16} color={activeFilter === 'today' ? designTokens.colors.semantic.surface : designTokens.colors.semantic.primary} />}
          />
          <FilterChip 
            type="this_week" 
            label="This Week"
          />
          <FilterChip 
            type="all" 
            label="All Requests"
          />
        </ScrollView>

        {/* Sort Indicator */}
        <View style={styles.sortIndicator}>
          <Caption style={styles.sortText}>
            Sorted by: {sortBy === 'date' ? 'Date' : sortBy === 'price' ? 'Price' : 'Urgency'}
          </Caption>
          <Caption style={styles.resultCount}>
            {filteredRequests.length} request{filteredRequests.length !== 1 ? 's' : ''}
          </Caption>
        </View>
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
              onAccept={handleAcceptRequest}
              onDecline={handleDeclineRequest}
              onViewDetails={handleViewDetails}
              onMessage={handleMessageCustomer}
              onSendMessage={handleSendMessage}
            />
          ))
        ) : (
          <EmptyState />
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
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: designTokens.spacing.scale.md,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    marginRight: designTokens.spacing.scale.sm,
  },
  pendingBadge: {
    backgroundColor: designTokens.colors.semantic.accent,
    borderRadius: 12,
    paddingHorizontal: designTokens.spacing.scale.sm,
    paddingVertical: 2,
  },
  pendingBadgeText: {
    color: designTokens.colors.semantic.surface,
    fontSize: 12,
    fontWeight: '600',
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
  urgentAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: designTokens.colors.semantic.accent + '20',
    padding: designTokens.spacing.scale.sm,
    borderRadius: componentTokens.card.borderRadius,
    marginBottom: designTokens.spacing.scale.md,
  },
  urgentAlertText: {
    marginLeft: designTokens.spacing.scale.sm,
    color: designTokens.colors.semantic.accent,
    fontWeight: '500',
    flex: 1,
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
    marginLeft: designTokens.spacing.scale.xs,
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
  sortIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: designTokens.spacing.scale.sm,
  },
  sortText: {
    color: designTokens.colors.semantic.textSecondary,
  },
  resultCount: {
    color: designTokens.colors.semantic.textSecondary,
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
