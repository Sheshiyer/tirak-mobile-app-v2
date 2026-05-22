import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Grid,
  List,
  TrendingUp,
  TrendingDown,
  Star,
  Eye,
  DollarSign,
  Users,
  Calendar,
  BarChart3,
  Award,
  Target,
  Zap,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { RadialGradient } from '@/components/ui/RadialGradient';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Heading, Subheading, Body, Caption } from '@/components/ui/Typography';
import { designTokens, componentTokens } from '@/constants/design-tokens';
import {
  mockSupplierServices,
  SupplierService,
  getActiveServices,
  getTopPerformingServices,
  getTotalRevenue,
} from '@/mocks/supplier-services';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2; // 2 columns with padding

type ViewMode = 'grid' | 'list';
type SortOption = 'performance' | 'revenue' | 'rating' | 'bookings' | 'recent';

export default function PortfolioScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('performance');

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const getSortedServices = (): SupplierService[] => {
    const services = [...mockSupplierServices];
    
    return services.sort((a, b) => {
      switch (sortBy) {
        case 'performance':
          return b.conversionRate - a.conversionRate;
        case 'revenue':
          return b.revenue - a.revenue;
        case 'rating':
          return b.rating - a.rating;
        case 'bookings':
          return b.totalBookings - a.totalBookings;
        case 'recent':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        default:
          return 0;
      }
    });
  };

  const getPerformanceInsights = () => {
    const services = mockSupplierServices;
    const activeServices = getActiveServices();
    const topPerformers = getTopPerformingServices(3);
    const totalRevenue = getTotalRevenue();
    const avgConversion = services.reduce((sum, s) => sum + s.conversionRate, 0) / services.length;
    const avgRating = services.reduce((sum, s) => sum + s.rating, 0) / services.length;

    // Performance recommendations
    const lowPerformers = services.filter(s => s.conversionRate < avgConversion);
    const highRatedServices = services.filter(s => s.rating >= 4.8);
    const recentlyUpdated = services.filter(s => {
      const daysSinceUpdate = (Date.now() - new Date(s.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceUpdate <= 7;
    });

    return {
      totalServices: services.length,
      activeServices: activeServices.length,
      topPerformers,
      totalRevenue,
      avgConversion: Math.round(avgConversion),
      avgRating: Math.round(avgRating * 10) / 10,
      lowPerformers,
      highRatedServices,
      recentlyUpdated,
      recommendations: [
        {
          type: 'optimization',
          title: 'Optimize Low Performers',
          description: `${lowPerformers.length} services below average conversion`,
          action: 'Review pricing and descriptions',
          priority: 'high',
        },
        {
          type: 'promotion',
          title: 'Promote Top Performers',
          description: `${topPerformers.length} services with excellent conversion`,
          action: 'Increase visibility and marketing',
          priority: 'medium',
        },
        {
          type: 'content',
          title: 'Update Service Content',
          description: `${services.length - recentlyUpdated.length} services need content refresh`,
          action: 'Add new photos and update descriptions',
          priority: 'low',
        },
      ],
    };
  };

  const insights = getPerformanceInsights();
  const sortedServices = getSortedServices();

  const handleServicePress = (serviceId: string) => {
    router.push("/supplier/services");
  };

  const handleEditService = (serviceId: string) => {
    router.push("/supplier/services/edit");
  };

  const formatCurrency = (amount: number) => {
    return `฿${amount.toLocaleString()}`;
  };

  const getPerformanceColor = (value: number, benchmark: number) => {
    if (value >= benchmark * 1.2) return designTokens.colors.semantic.success;
    if (value >= benchmark * 0.8) return designTokens.colors.semantic.warning;
    return designTokens.colors.semantic.error;
  };

  const ServiceGridCard = ({ service }: { service: SupplierService }) => (
    <TouchableOpacity
      style={styles.gridCard}
      onPress={() => handleServicePress(service.id)}
      activeOpacity={0.8}
    >
      <Card style={styles.serviceCard} padding={0}>
        {/* Service Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: service.coverPhoto }}
            style={styles.serviceImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.imageOverlay}
          />
          
          {/* Status Badge */}
          <View style={[
            styles.statusBadge,
            { backgroundColor: service.status === 'active' ? designTokens.colors.semantic.success : designTokens.colors.semantic.textSecondary }
          ]}>
            <Text style={styles.statusText}>
              {service.status === 'active' ? 'Active' : 'Inactive'}
            </Text>
          </View>

          {/* Performance Badge */}
          <View style={[
            styles.performanceBadge,
            { backgroundColor: getPerformanceColor(service.conversionRate, insights.avgConversion) }
          ]}>
            <TrendingUp size={12} color={designTokens.colors.semantic.surface} />
            <Text style={styles.performanceText}>{service.conversionRate}%</Text>
          </View>
        </View>

        {/* Service Info */}
        <View style={styles.cardContent}>
          <Subheading style={styles.serviceName} numberOfLines={2}>
            {service.name}
          </Subheading>
          
          <Caption style={styles.serviceCategory}>
            {service.subcategory}
          </Caption>

          {/* Metrics Row */}
          <View style={styles.metricsRow}>
            <View style={styles.metric}>
              <Star size={12} color="#FFD700" fill="#FFD700" />
              <Caption style={styles.metricText}>{service.rating}</Caption>
            </View>
            <View style={styles.metric}>
              <Calendar size={12} color={designTokens.colors.semantic.primary} />
              <Caption style={styles.metricText}>{service.totalBookings}</Caption>
            </View>
            <View style={styles.metric}>
              <DollarSign size={12} color={designTokens.colors.semantic.success} />
              <Caption style={styles.metricText}>{formatCurrency(service.basePrice)}</Caption>
            </View>
          </View>

          {/* Revenue */}
          <View style={styles.revenueContainer}>
            <Body style={styles.revenueAmount}>{formatCurrency(service.revenue)}</Body>
            <Caption style={styles.revenueLabel}>Total Revenue</Caption>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  const ServiceListCard = ({ service }: { service: SupplierService }) => (
    <TouchableOpacity
      onPress={() => handleServicePress(service.id)}
      activeOpacity={0.8}
    >
      <Card style={styles.listCard} padding={16}>
        <View style={styles.listContent}>
          {/* Service Image */}
          <View style={styles.listImageContainer}>
            <Image
              source={{ uri: service.coverPhoto }}
              style={styles.listImage}
              resizeMode="cover"
            />
            <View style={[
              styles.listStatusIndicator,
              { backgroundColor: service.status === 'active' ? designTokens.colors.semantic.success : designTokens.colors.semantic.textSecondary }
            ]} />
          </View>

          {/* Service Info */}
          <View style={styles.listInfo}>
            <View style={styles.listHeader}>
              <Subheading style={styles.listServiceName} numberOfLines={1}>
                {service.name}
              </Subheading>
              <View style={styles.listPerformance}>
                <TrendingUp 
                  size={14} 
                  color={getPerformanceColor(service.conversionRate, insights.avgConversion)} 
                />
                <Caption style={[
                  styles.listPerformanceText,
                  { color: getPerformanceColor(service.conversionRate, insights.avgConversion) }
                ]}>
                  {service.conversionRate}%
                </Caption>
              </View>
            </View>

            <Caption style={styles.listCategory}>
              {service.subcategory} • {service.duration} {service.durationUnit}
            </Caption>

            <View style={styles.listMetrics}>
              <View style={styles.listMetric}>
                <Star size={12} color="#FFD700" fill="#FFD700" />
                <Caption style={styles.listMetricText}>
                  {service.rating} ({service.reviewCount})
                </Caption>
              </View>
              <View style={styles.listMetric}>
                <Calendar size={12} color={designTokens.colors.semantic.primary} />
                <Caption style={styles.listMetricText}>
                  {service.totalBookings} bookings
                </Caption>
              </View>
            </View>

            <View style={styles.listRevenue}>
              <Body style={styles.listRevenueAmount}>{formatCurrency(service.revenue)}</Body>
              <Caption style={styles.listRevenueLabel}>revenue</Caption>
            </View>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  const SortChip = ({ 
    type, 
    label 
  }: { 
    type: SortOption; 
    label: string;
  }) => {
    const isActive = sortBy === type;
    return (
      <TouchableOpacity
        style={[styles.sortChip, isActive && styles.sortChipActive]}
        onPress={() => setSortBy(type)}
      >
        <Text style={[styles.sortChipText, isActive && styles.sortChipTextActive]}>
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
            <Heading style={styles.title}>Service Portfolio</Heading>
            <Caption style={styles.subtitle}>
              {insights.totalServices} services • {formatCurrency(insights.totalRevenue)} total revenue
            </Caption>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.viewModeButton, viewMode === 'grid' && styles.viewModeButtonActive]}
              onPress={() => setViewMode('grid')}
            >
              <Grid size={20} color={viewMode === 'grid' ? designTokens.colors.semantic.surface : designTokens.colors.semantic.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewModeButton, viewMode === 'list' && styles.viewModeButtonActive]}
              onPress={() => setViewMode('list')}
            >
              <List size={20} color={viewMode === 'list' ? designTokens.colors.semantic.surface : designTokens.colors.semantic.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Performance Overview */}
        <Card style={styles.overviewCard} padding={16}>
          <View style={styles.overviewHeader}>
            <Subheading style={styles.overviewTitle}>Performance Overview</Subheading>
            <TouchableOpacity>
              <BarChart3 size={16} color={designTokens.colors.semantic.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.overviewMetrics}>
            <View style={styles.overviewMetric}>
              <Award size={16} color={designTokens.colors.semantic.success} />
              <View style={styles.overviewMetricContent}>
                <Body style={styles.overviewMetricValue}>{insights.avgConversion}%</Body>
                <Caption style={styles.overviewMetricLabel}>Avg Conversion</Caption>
              </View>
            </View>

            <View style={styles.overviewMetric}>
              <Star size={16} color="#FFD700" />
              <View style={styles.overviewMetricContent}>
                <Body style={styles.overviewMetricValue}>{insights.avgRating}</Body>
                <Caption style={styles.overviewMetricLabel}>Avg Rating</Caption>
              </View>
            </View>

            <View style={styles.overviewMetric}>
              <Target size={16} color={designTokens.colors.semantic.accent} />
              <View style={styles.overviewMetricContent}>
                <Body style={styles.overviewMetricValue}>{insights.activeServices}</Body>
                <Caption style={styles.overviewMetricLabel}>Active Services</Caption>
              </View>
            </View>

            <View style={styles.overviewMetric}>
              <Zap size={16} color={designTokens.colors.semantic.warning} />
              <View style={styles.overviewMetricContent}>
                <Body style={styles.overviewMetricValue}>{insights.topPerformers.length}</Body>
                <Caption style={styles.overviewMetricLabel}>Top Performers</Caption>
              </View>
            </View>
          </View>
        </Card>

        {/* Sort Options */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.sortContainer}
          contentContainerStyle={styles.sortContent}
        >
          <SortChip type="performance" label="Performance" />
          <SortChip type="revenue" label="Revenue" />
          <SortChip type="rating" label="Rating" />
          <SortChip type="bookings" label="Bookings" />
          <SortChip type="recent" label="Recent" />
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
        {viewMode === 'grid' ? (
          <View style={styles.gridContainer}>
            {sortedServices.map((service) => (
              <ServiceGridCard key={service.id} service={service} />
            ))}
          </View>
        ) : (
          <View style={styles.listContainer}>
            {sortedServices.map((service) => (
              <ServiceListCard key={service.id} service={service} />
            ))}
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
    gap: designTokens.spacing.scale.xs,
  },
  viewModeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: designTokens.colors.semantic.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...componentTokens.card.shadow,
  },
  viewModeButtonActive: {
    backgroundColor: designTokens.colors.semantic.primary,
  },
  overviewCard: {
    marginBottom: designTokens.spacing.scale.md,
  },
  overviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: designTokens.spacing.scale.md,
  },
  overviewTitle: {
    flex: 1,
  },
  overviewMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  overviewMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  overviewMetricContent: {
    marginLeft: designTokens.spacing.scale.xs,
    alignItems: 'center',
  },
  overviewMetricValue: {
    fontWeight: '600',
    marginBottom: 2,
  },
  overviewMetricLabel: {
    color: designTokens.colors.semantic.textSecondary,
    textAlign: 'center',
  },
  sortContainer: {
    marginBottom: designTokens.spacing.scale.sm,
  },
  sortContent: {
    paddingRight: designTokens.spacing.scale.md,
  },
  sortChip: {
    backgroundColor: designTokens.colors.semantic.surface,
    paddingHorizontal: designTokens.spacing.scale.md,
    paddingVertical: designTokens.spacing.scale.sm,
    borderRadius: 16,
    marginRight: designTokens.spacing.scale.sm,
    ...componentTokens.card.shadow,
  },
  sortChipActive: {
    backgroundColor: designTokens.colors.semantic.primary,
  },
  sortChipText: {
    color: designTokens.colors.semantic.text,
    fontWeight: '500',
  },
  sortChipTextActive: {
    color: designTokens.colors.semantic.surface,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: designTokens.spacing.scale.md,
    paddingTop: 0,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridCard: {
    width: CARD_WIDTH,
    marginBottom: designTokens.spacing.scale.md,
  },
  serviceCard: {
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    height: 120,
  },
  serviceImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
  },
  statusBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: designTokens.colors.semantic.surface,
    fontSize: 10,
    fontWeight: '600',
  },
  performanceBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 12,
  },
  performanceText: {
    color: designTokens.colors.semantic.surface,
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 2,
  },
  cardContent: {
    padding: designTokens.spacing.scale.md,
  },
  serviceName: {
    marginBottom: designTokens.spacing.scale.xs,
    minHeight: 44, // Ensure consistent height
  },
  serviceCategory: {
    color: designTokens.colors.semantic.textSecondary,
    marginBottom: designTokens.spacing.scale.sm,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: designTokens.spacing.scale.sm,
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricText: {
    marginLeft: designTokens.spacing.scale.xs,
    color: designTokens.colors.semantic.textSecondary,
  },
  revenueContainer: {
    alignItems: 'center',
    paddingTop: designTokens.spacing.scale.sm,
    borderTopWidth: 1,
    borderTopColor: designTokens.colors.semantic.border,
  },
  revenueAmount: {
    fontWeight: '600',
    color: designTokens.colors.semantic.success,
    marginBottom: 2,
  },
  revenueLabel: {
    color: designTokens.colors.semantic.textSecondary,
  },
  listContainer: {
    gap: designTokens.spacing.scale.md,
  },
  listCard: {
    marginBottom: 0,
  },
  listContent: {
    flexDirection: 'row',
  },
  listImageContainer: {
    position: 'relative',
    marginRight: designTokens.spacing.scale.md,
  },
  listImage: {
    width: 80,
    height: 80,
    borderRadius: componentTokens.card.borderRadius,
  },
  listStatusIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: designTokens.colors.semantic.surface,
  },
  listInfo: {
    flex: 1,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: designTokens.spacing.scale.xs,
  },
  listServiceName: {
    flex: 1,
    marginRight: designTokens.spacing.scale.sm,
  },
  listPerformance: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listPerformanceText: {
    marginLeft: designTokens.spacing.scale.xs,
    fontWeight: '600',
  },
  listCategory: {
    color: designTokens.colors.semantic.textSecondary,
    marginBottom: designTokens.spacing.scale.sm,
  },
  listMetrics: {
    flexDirection: 'row',
    gap: designTokens.spacing.scale.md,
    marginBottom: designTokens.spacing.scale.sm,
  },
  listMetric: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listMetricText: {
    marginLeft: designTokens.spacing.scale.xs,
    color: designTokens.colors.semantic.textSecondary,
  },
  listRevenue: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  listRevenueAmount: {
    fontWeight: '600',
    color: designTokens.colors.semantic.success,
    marginRight: designTokens.spacing.scale.xs,
  },
  listRevenueLabel: {
    color: designTokens.colors.semantic.textSecondary,
  },
});
