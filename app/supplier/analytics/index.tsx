import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Calendar,
  Star,
  Eye,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Award,
  Clock,
  MapPin,
  Filter,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { RadialGradient } from '@/components/ui/RadialGradient';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Heading, Subheading, Body, Caption } from '@/components/ui/Typography';
import { designTokens, componentTokens } from '@/constants/design-tokens';

const { width } = Dimensions.get('window');

interface AnalyticsData {
  overview: {
    totalRevenue: number;
    totalBookings: number;
    averageRating: number;
    conversionRate: number;
    revenueGrowth: number;
    bookingGrowth: number;
    ratingTrend: number;
    conversionTrend: number;
  };
  timeframe: {
    period: string;
    revenue: number[];
    bookings: number[];
    labels: string[];
  };
  services: {
    id: string;
    name: string;
    revenue: number;
    bookings: number;
    rating: number;
    conversionRate: number;
    views: number;
    trend: 'up' | 'down' | 'stable';
  }[];
  demographics: {
    ageGroups: { label: string; value: number; percentage: number }[];
    countries: { label: string; value: number; percentage: number }[];
    bookingTimes: { label: string; value: number; percentage: number }[];
  };
  performance: {
    responseTime: number;
    completionRate: number;
    repeatCustomers: number;
    averageGroupSize: number;
    peakDays: string[];
    topLocations: string[];
  };
}

export default function AnalyticsScreen() {
  const router = useRouter();
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  // Mock analytics data
  const [analyticsData] = useState<AnalyticsData>({
    overview: {
      totalRevenue: 187250,
      totalBookings: 156,
      averageRating: 4.8,
      conversionRate: 67,
      revenueGrowth: 23.5,
      bookingGrowth: 18.2,
      ratingTrend: 2.1,
      conversionTrend: -3.4,
    },
    timeframe: {
      period: '30 days',
      revenue: [12500, 15200, 18900, 16800, 22100, 19500, 25300],
      bookings: [18, 22, 28, 24, 31, 27, 35],
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7'],
    },
    services: [
      {
        id: 'svc-001',
        name: 'Bangkok Street Food Adventure',
        revenue: 67200,
        bookings: 56,
        rating: 4.8,
        conversionRate: 72,
        views: 1240,
        trend: 'up',
      },
      {
        id: 'svc-002',
        name: 'Traditional Thai Cooking Class',
        revenue: 54600,
        bookings: 42,
        rating: 4.9,
        conversionRate: 68,
        views: 980,
        trend: 'up',
      },
      {
        id: 'svc-003',
        name: 'Temple & Cultural Walk',
        revenue: 45900,
        bookings: 38,
        rating: 4.7,
        conversionRate: 61,
        views: 1560,
        trend: 'stable',
      },
      {
        id: 'svc-004',
        name: 'Photography Workshop',
        revenue: 19550,
        bookings: 20,
        rating: 4.9,
        conversionRate: 78,
        views: 420,
        trend: 'down',
      },
    ],
    demographics: {
      ageGroups: [
        { label: '18-25', value: 28, percentage: 18 },
        { label: '26-35', value: 62, percentage: 40 },
        { label: '36-45', value: 47, percentage: 30 },
        { label: '46-55', value: 15, percentage: 10 },
        { label: '55+', value: 4, percentage: 2 },
      ],
      countries: [
        { label: 'United States', value: 45, percentage: 29 },
        { label: 'United Kingdom', value: 32, percentage: 21 },
        { label: 'Australia', value: 28, percentage: 18 },
        { label: 'Germany', value: 22, percentage: 14 },
        { label: 'Japan', value: 18, percentage: 12 },
        { label: 'Others', value: 11, percentage: 6 },
      ],
      bookingTimes: [
        { label: 'Morning (6-12)', value: 89, percentage: 57 },
        { label: 'Afternoon (12-18)', value: 52, percentage: 33 },
        { label: 'Evening (18-24)', value: 15, percentage: 10 },
      ],
    },
    performance: {
      responseTime: 2.3,
      completionRate: 96,
      repeatCustomers: 34,
      averageGroupSize: 4.2,
      peakDays: ['Friday', 'Saturday', 'Sunday'],
      topLocations: ['Chatuchak Market', 'Grand Palace', 'Khao San Road'],
    },
  });

  const periods = [
    { key: '7d', label: '7 Days' },
    { key: '30d', label: '30 Days' },
    { key: '90d', label: '3 Months' },
    { key: '1y', label: '1 Year' },
  ];

  const getTrendIcon = (trend: string, value: number) => {
    if (trend === 'up' || value > 0) {
      return <TrendingUp size={16} color={designTokens.colors.semantic.success} />;
    } else if (trend === 'down' || value < 0) {
      return <TrendingDown size={16} color={designTokens.colors.semantic.error} />;
    }
    return <Activity size={16} color={designTokens.colors.semantic.textSecondary} />;
  };

  const getTrendColor = (value: number) => {
    return value > 0 ? designTokens.colors.semantic.success : designTokens.colors.semantic.error;
  };

  const formatCurrency = (amount: number) => {
    return `฿${amount.toLocaleString()}`;
  };

  const MetricCard = ({ 
    icon, 
    title, 
    value, 
    trend, 
    trendValue, 
    subtitle 
  }: {
    icon: React.ReactNode;
    title: string;
    value: string;
    trend?: React.ReactNode;
    trendValue?: number;
    subtitle?: string;
  }) => (
    <Card style={styles.metricCard} padding={16}>
      <View style={styles.metricHeader}>
        <View style={styles.metricIcon}>
          {icon}
        </View>
        {trend && (
          <View style={styles.trendContainer}>
            {trend}
            {trendValue !== undefined && (
              <Caption style={[
                styles.trendValue,
                { color: getTrendColor(trendValue) }
              ]}>
                {trendValue > 0 ? '+' : ''}{trendValue.toFixed(1)}%
              </Caption>
            )}
          </View>
        )}
      </View>
      
      <Heading style={styles.metricValue}>{value}</Heading>
      <Caption style={styles.metricTitle}>{title}</Caption>
      {subtitle && (
        <Caption style={styles.metricSubtitle}>{subtitle}</Caption>
      )}
    </Card>
  );

  const ServiceCard = ({ service }: { service: AnalyticsData['services'][0] }) => (
    <Card style={styles.serviceCard} padding={16}>
      <View style={styles.serviceHeader}>
        <View style={styles.serviceInfo}>
          <Subheading style={styles.serviceName} numberOfLines={2}>
            {service.name}
          </Subheading>
          <View style={styles.serviceMetrics}>
            <View style={styles.serviceMetric}>
              <Star size={12} color="#FFD700" fill="#FFD700" />
              <Caption style={styles.serviceMetricText}>{service.rating}</Caption>
            </View>
            <View style={styles.serviceMetric}>
              <Eye size={12} color={designTokens.colors.semantic.primary} />
              <Caption style={styles.serviceMetricText}>{service.views}</Caption>
            </View>
          </View>
        </View>
        
        <View style={styles.serviceTrend}>
          {getTrendIcon(service.trend, 0)}
        </View>
      </View>

      <View style={styles.serviceStats}>
        <View style={styles.serviceStat}>
          <Body style={styles.serviceStatValue}>{formatCurrency(service.revenue)}</Body>
          <Caption style={styles.serviceStatLabel}>Revenue</Caption>
        </View>
        <View style={styles.serviceStat}>
          <Body style={styles.serviceStatValue}>{service.bookings}</Body>
          <Caption style={styles.serviceStatLabel}>Bookings</Caption>
        </View>
        <View style={styles.serviceStat}>
          <Body style={styles.serviceStatValue}>{service.conversionRate}%</Body>
          <Caption style={styles.serviceStatLabel}>Conversion</Caption>
        </View>
      </View>
    </Card>
  );

  const DemographicChart = ({ 
    title, 
    data, 
    icon 
  }: {
    title: string;
    data: { label: string; value: number; percentage: number }[];
    icon: React.ReactNode;
  }) => (
    <Card style={styles.chartCard} padding={16}>
      <View style={styles.chartHeader}>
        <View style={styles.chartTitleContainer}>
          {icon}
          <Subheading style={styles.chartTitle}>{title}</Subheading>
        </View>
      </View>
      
      <View style={styles.chartData}>
        {data.slice(0, 5).map((item, index) => (
          <View key={index} style={styles.chartItem}>
            <View style={styles.chartItemInfo}>
              <Body style={styles.chartItemLabel}>{item.label}</Body>
              <Caption style={styles.chartItemValue}>{item.value}</Caption>
            </View>
            <View style={styles.chartItemBar}>
              <View style={styles.chartItemBarBackground}>
                <LinearGradient
                  colors={[designTokens.colors.semantic.primary, designTokens.colors.semantic.accent]}
                  style={[
                    styles.chartItemBarFill,
                    { width: `${item.percentage}%` }
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              </View>
              <Caption style={styles.chartItemPercentage}>{item.percentage}%</Caption>
            </View>
          </View>
        ))}
      </View>
    </Card>
  );

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
            <Heading style={styles.title}>Performance Analytics</Heading>
            <Caption style={styles.subtitle}>Track your business performance</Caption>
          </View>

          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => router.push('/supplier/analytics')}
          >
            <Filter size={20} color={designTokens.colors.semantic.primary} />
          </TouchableOpacity>
        </View>

        {/* Period Selector */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.periodSelector}
          contentContainerStyle={styles.periodContent}
        >
          {periods.map((period) => (
            <TouchableOpacity
              key={period.key}
              style={[
                styles.periodChip,
                selectedPeriod === period.key && styles.periodChipActive
              ]}
              onPress={() => setSelectedPeriod(period.key as any)}
            >
              <Text style={[
                styles.periodChipText,
                selectedPeriod === period.key && styles.periodChipTextActive
              ]}>
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Overview Metrics */}
        <View style={styles.metricsGrid}>
          <MetricCard
            icon={<DollarSign size={20} color={designTokens.colors.semantic.success} />}
            title="Total Revenue"
            value={formatCurrency(analyticsData.overview.totalRevenue)}
            trend={getTrendIcon('up', analyticsData.overview.revenueGrowth)}
            trendValue={analyticsData.overview.revenueGrowth}
            subtitle="Last 30 days"
          />
          
          <MetricCard
            icon={<Calendar size={20} color={designTokens.colors.semantic.primary} />}
            title="Total Bookings"
            value={analyticsData.overview.totalBookings.toString()}
            trend={getTrendIcon('up', analyticsData.overview.bookingGrowth)}
            trendValue={analyticsData.overview.bookingGrowth}
            subtitle="Last 30 days"
          />
          
          <MetricCard
            icon={<Star size={20} color="#FFD700" />}
            title="Average Rating"
            value={analyticsData.overview.averageRating.toString()}
            trend={getTrendIcon('up', analyticsData.overview.ratingTrend)}
            trendValue={analyticsData.overview.ratingTrend}
            subtitle="All services"
          />
          
          <MetricCard
            icon={<Target size={20} color={designTokens.colors.semantic.accent} />}
            title="Conversion Rate"
            value={`${analyticsData.overview.conversionRate}%`}
            trend={getTrendIcon('down', analyticsData.overview.conversionTrend)}
            trendValue={analyticsData.overview.conversionTrend}
            subtitle="Views to bookings"
          />
        </View>

        {/* Service Performance */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Subheading style={styles.sectionTitle}>Service Performance</Subheading>
            <TouchableOpacity onPress={() => router.push('/supplier/analytics/services')}>
              <Caption style={styles.sectionLink}>View All</Caption>
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.servicesContainer}
          >
            {analyticsData.services.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </ScrollView>
        </View>

        {/* Demographics */}
        <View style={styles.section}>
          <Subheading style={styles.sectionTitle}>Customer Demographics</Subheading>
          
          <DemographicChart
            title="Age Groups"
            data={analyticsData.demographics.ageGroups}
            icon={<Users size={16} color={designTokens.colors.semantic.primary} />}
          />
          
          <DemographicChart
            title="Top Countries"
            data={analyticsData.demographics.countries}
            icon={<MapPin size={16} color={designTokens.colors.semantic.accent} />}
          />
          
          <DemographicChart
            title="Booking Times"
            data={analyticsData.demographics.bookingTimes}
            icon={<Clock size={16} color={designTokens.colors.semantic.success} />}
          />
        </View>

        {/* Performance Insights */}
        <Card style={styles.insightsCard} padding={16}>
          <View style={styles.insightsHeader}>
            <Award size={20} color={designTokens.colors.semantic.primary} />
            <Subheading style={styles.insightsTitle}>Performance Insights</Subheading>
          </View>
          
          <View style={styles.insightsGrid}>
            <View style={styles.insightItem}>
              <Body style={styles.insightValue}>{analyticsData.performance.responseTime}h</Body>
              <Caption style={styles.insightLabel}>Avg Response Time</Caption>
            </View>
            <View style={styles.insightItem}>
              <Body style={styles.insightValue}>{analyticsData.performance.completionRate}%</Body>
              <Caption style={styles.insightLabel}>Completion Rate</Caption>
            </View>
            <View style={styles.insightItem}>
              <Body style={styles.insightValue}>{analyticsData.performance.repeatCustomers}%</Body>
              <Caption style={styles.insightLabel}>Repeat Customers</Caption>
            </View>
            <View style={styles.insightItem}>
              <Body style={styles.insightValue}>{analyticsData.performance.averageGroupSize}</Body>
              <Caption style={styles.insightLabel}>Avg Group Size</Caption>
            </View>
          </View>

          <View style={styles.insightsDetails}>
            <View style={styles.insightDetail}>
              <Caption style={styles.insightDetailLabel}>Peak Days:</Caption>
              <Body style={styles.insightDetailValue}>
                {analyticsData.performance.peakDays.join(', ')}
              </Body>
            </View>
            <View style={styles.insightDetail}>
              <Caption style={styles.insightDetailLabel}>Top Locations:</Caption>
              <Body style={styles.insightDetailValue}>
                {analyticsData.performance.topLocations.join(', ')}
              </Body>
            </View>
          </View>
        </Card>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Button
            title="Detailed Reports"
            onPress={() => router.push('/supplier/analytics')}
            style={styles.actionButton}
            icon={<BarChart3 size={16} color={designTokens.colors.semantic.surface} />}
          />
          <Button
            title="Export Data"
            onPress={() => router.push('/supplier/analytics')}
            variant="outline"
            style={styles.actionButton}
            icon={<PieChart size={16} color={designTokens.colors.semantic.primary} />}
          />
        </View>
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
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: designTokens.colors.semantic.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...componentTokens.card.shadow,
  },
  periodSelector: {
    marginBottom: designTokens.spacing.scale.sm,
  },
  periodContent: {
    paddingRight: designTokens.spacing.scale.md,
  },
  periodChip: {
    backgroundColor: designTokens.colors.semantic.surface,
    paddingHorizontal: designTokens.spacing.scale.md,
    paddingVertical: designTokens.spacing.scale.sm,
    borderRadius: 20,
    marginRight: designTokens.spacing.scale.sm,
    ...componentTokens.card.shadow,
  },
  periodChipActive: {
    backgroundColor: designTokens.colors.semantic.primary,
  },
  periodChipText: {
    color: designTokens.colors.semantic.text,
    fontWeight: '500',
  },
  periodChipTextActive: {
    color: designTokens.colors.semantic.surface,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: designTokens.spacing.scale.md,
    paddingTop: 0,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: designTokens.spacing.scale.sm,
    marginBottom: designTokens.spacing.scale.lg,
  },
  metricCard: {
    width: (width - 48) / 2 - 6, // 2 columns with gap
    marginBottom: 0,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: designTokens.spacing.scale.sm,
  },
  metricIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: designTokens.colors.semantic.surface + '80',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendValue: {
    marginLeft: designTokens.spacing.scale.xs,
    fontWeight: '600',
    fontSize: 12,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: designTokens.spacing.scale.xs,
  },
  metricTitle: {
    color: designTokens.colors.semantic.textSecondary,
    marginBottom: designTokens.spacing.scale.xs,
  },
  metricSubtitle: {
    color: designTokens.colors.semantic.textSecondary,
    fontSize: 11,
  },
  section: {
    marginBottom: designTokens.spacing.scale.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: designTokens.spacing.scale.md,
  },
  sectionTitle: {
    flex: 1,
  },
  sectionLink: {
    color: designTokens.colors.semantic.primary,
    fontWeight: '500',
  },
  servicesContainer: {
    paddingRight: designTokens.spacing.scale.md,
  },
  serviceCard: {
    width: 280,
    marginRight: designTokens.spacing.scale.md,
    marginBottom: 0,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: designTokens.spacing.scale.md,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    marginBottom: designTokens.spacing.scale.sm,
    minHeight: 44,
  },
  serviceMetrics: {
    flexDirection: 'row',
    gap: designTokens.spacing.scale.md,
  },
  serviceMetric: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceMetricText: {
    marginLeft: designTokens.spacing.scale.xs,
    color: designTokens.colors.semantic.textSecondary,
  },
  serviceTrend: {
    marginLeft: designTokens.spacing.scale.sm,
  },
  serviceStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: designTokens.spacing.scale.md,
    borderTopWidth: 1,
    borderTopColor: designTokens.colors.semantic.border,
  },
  serviceStat: {
    alignItems: 'center',
  },
  serviceStatValue: {
    fontWeight: '600',
    marginBottom: designTokens.spacing.scale.xs,
  },
  serviceStatLabel: {
    color: designTokens.colors.semantic.textSecondary,
  },
  chartCard: {
    marginBottom: designTokens.spacing.scale.md,
  },
  chartHeader: {
    marginBottom: designTokens.spacing.scale.md,
  },
  chartTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chartTitle: {
    marginLeft: designTokens.spacing.scale.sm,
  },
  chartData: {
    gap: designTokens.spacing.scale.sm,
  },
  chartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chartItemInfo: {
    flex: 1,
    marginRight: designTokens.spacing.scale.md,
  },
  chartItemLabel: {
    fontWeight: '500',
    marginBottom: 2,
  },
  chartItemValue: {
    color: designTokens.colors.semantic.textSecondary,
  },
  chartItemBar: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  chartItemBarBackground: {
    flex: 1,
    height: 6,
    backgroundColor: designTokens.colors.semantic.surface + '80',
    borderRadius: 3,
    marginRight: designTokens.spacing.scale.sm,
  },
  chartItemBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  chartItemPercentage: {
    width: 35,
    textAlign: 'right',
    color: designTokens.colors.semantic.textSecondary,
    fontWeight: '500',
  },
  insightsCard: {
    marginBottom: designTokens.spacing.scale.lg,
  },
  insightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: designTokens.spacing.scale.md,
  },
  insightsTitle: {
    marginLeft: designTokens.spacing.scale.sm,
  },
  insightsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: designTokens.spacing.scale.md,
    marginBottom: designTokens.spacing.scale.md,
  },
  insightItem: {
    alignItems: 'center',
    flex: 1,
    minWidth: '45%',
  },
  insightValue: {
    fontWeight: '600',
    fontSize: 18,
    marginBottom: designTokens.spacing.scale.xs,
  },
  insightLabel: {
    color: designTokens.colors.semantic.textSecondary,
    textAlign: 'center',
  },
  insightsDetails: {
    paddingTop: designTokens.spacing.scale.md,
    borderTopWidth: 1,
    borderTopColor: designTokens.colors.semantic.border,
    gap: designTokens.spacing.scale.sm,
  },
  insightDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  insightDetailLabel: {
    color: designTokens.colors.semantic.textSecondary,
    marginRight: designTokens.spacing.scale.sm,
    minWidth: 80,
  },
  insightDetailValue: {
    flex: 1,
    fontWeight: '500',
  },
  actionsSection: {
    flexDirection: 'row',
    gap: designTokens.spacing.scale.md,
    marginBottom: designTokens.spacing.scale.xl,
  },
  actionButton: {
    flex: 1,
  },
});
