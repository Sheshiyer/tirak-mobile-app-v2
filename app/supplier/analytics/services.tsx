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
  MessageCircle,
  Clock,
  MapPin,
  Activity,
  Target,
  BarChart3,
  Filter,
  Search,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { RadialGradient } from '@/components/ui/RadialGradient';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Heading, Subheading, Body, Caption } from '@/components/ui/Typography';
import { designTokens, componentTokens } from '@/constants/design-tokens';

const { width } = Dimensions.get('window');

interface ServiceAnalytics {
  id: string;
  name: string;
  description: string;
  category: string;
  status: 'active' | 'paused' | 'draft';
  metrics: {
    revenue: number;
    bookings: number;
    views: number;
    inquiries: number;
    rating: number;
    reviewCount: number;
    conversionRate: number;
    averageGroupSize: number;
    repeatBookings: number;
    cancellationRate: number;
  };
  trends: {
    revenue: number;
    bookings: number;
    views: number;
    rating: number;
    conversion: number;
  };
  performance: {
    peakDays: string[];
    peakTimes: string[];
    topLocations: string[];
    averageDuration: number;
    seasonality: 'high' | 'medium' | 'low';
  };
  demographics: {
    ageGroups: { label: string; percentage: number }[];
    countries: { label: string; percentage: number }[];
    groupTypes: { label: string; percentage: number }[];
  };
  pricing: {
    basePrice: number;
    averagePrice: number;
    priceRange: { min: number; max: number };
    competitorAverage: number;
  };
}

export default function ServiceAnalyticsScreen() {
  const router = useRouter();
  const [selectedService, setSelectedService] = useState<string>('svc-001');
  const [sortBy, setSortBy] = useState<'revenue' | 'bookings' | 'rating' | 'conversion'>('revenue');

  // Mock service analytics data
  const [services] = useState<ServiceAnalytics[]>([
    {
      id: 'svc-001',
      name: 'Bangkok Street Food Adventure',
      description: 'Explore authentic local street food with a knowledgeable guide',
      category: 'Food & Drink',
      status: 'active',
      metrics: {
        revenue: 67200,
        bookings: 56,
        views: 1240,
        inquiries: 89,
        rating: 4.8,
        reviewCount: 52,
        conversionRate: 72,
        averageGroupSize: 4.2,
        repeatBookings: 18,
        cancellationRate: 8,
      },
      trends: {
        revenue: 23.5,
        bookings: 18.2,
        views: 15.7,
        rating: 2.1,
        conversion: -3.4,
      },
      performance: {
        peakDays: ['Friday', 'Saturday', 'Sunday'],
        peakTimes: ['10:00-12:00', '14:00-16:00'],
        topLocations: ['Chatuchak Market', 'Khao San Road', 'Chinatown'],
        averageDuration: 3.5,
        seasonality: 'high',
      },
      demographics: {
        ageGroups: [
          { label: '18-25', percentage: 25 },
          { label: '26-35', percentage: 45 },
          { label: '36-45', percentage: 25 },
          { label: '46+', percentage: 5 },
        ],
        countries: [
          { label: 'United States', percentage: 35 },
          { label: 'United Kingdom', percentage: 25 },
          { label: 'Australia', percentage: 20 },
          { label: 'Others', percentage: 20 },
        ],
        groupTypes: [
          { label: 'Couples', percentage: 40 },
          { label: 'Friends', percentage: 35 },
          { label: 'Solo', percentage: 15 },
          { label: 'Family', percentage: 10 },
        ],
      },
      pricing: {
        basePrice: 1200,
        averagePrice: 1350,
        priceRange: { min: 1200, max: 1500 },
        competitorAverage: 1400,
      },
    },
    {
      id: 'svc-002',
      name: 'Traditional Thai Cooking Class',
      description: 'Learn to cook authentic Thai dishes in a traditional setting',
      category: 'Experiences',
      status: 'active',
      metrics: {
        revenue: 54600,
        bookings: 42,
        views: 980,
        inquiries: 67,
        rating: 4.9,
        reviewCount: 38,
        conversionRate: 68,
        averageGroupSize: 3.8,
        repeatBookings: 12,
        cancellationRate: 5,
      },
      trends: {
        revenue: 18.7,
        bookings: 22.1,
        views: 12.3,
        rating: 1.8,
        conversion: 4.2,
      },
      performance: {
        peakDays: ['Saturday', 'Sunday', 'Monday'],
        peakTimes: ['09:00-12:00', '15:00-18:00'],
        topLocations: ['Local Kitchen', 'Market Tour', 'Herb Garden'],
        averageDuration: 4.0,
        seasonality: 'medium',
      },
      demographics: {
        ageGroups: [
          { label: '18-25', percentage: 15 },
          { label: '26-35', percentage: 40 },
          { label: '36-45', percentage: 30 },
          { label: '46+', percentage: 15 },
        ],
        countries: [
          { label: 'United States', percentage: 30 },
          { label: 'Germany', percentage: 25 },
          { label: 'Japan', percentage: 20 },
          { label: 'Others', percentage: 25 },
        ],
        groupTypes: [
          { label: 'Couples', percentage: 50 },
          { label: 'Friends', percentage: 25 },
          { label: 'Solo', percentage: 20 },
          { label: 'Family', percentage: 5 },
        ],
      },
      pricing: {
        basePrice: 1800,
        averagePrice: 1950,
        priceRange: { min: 1800, max: 2200 },
        competitorAverage: 2100,
      },
    },
    {
      id: 'svc-003',
      name: 'Temple & Cultural Walk',
      description: 'Discover Bangkok\'s spiritual side with temple visits and cultural insights',
      category: 'Culture & History',
      status: 'active',
      metrics: {
        revenue: 45900,
        bookings: 38,
        views: 1560,
        inquiries: 95,
        rating: 4.7,
        reviewCount: 34,
        conversionRate: 61,
        averageGroupSize: 5.1,
        repeatBookings: 8,
        cancellationRate: 12,
      },
      trends: {
        revenue: 8.3,
        bookings: 5.7,
        views: 22.1,
        rating: -1.2,
        conversion: -8.5,
      },
      performance: {
        peakDays: ['Tuesday', 'Wednesday', 'Thursday'],
        peakTimes: ['08:00-11:00', '16:00-18:00'],
        topLocations: ['Wat Pho', 'Grand Palace', 'Wat Arun'],
        averageDuration: 3.0,
        seasonality: 'low',
      },
      demographics: {
        ageGroups: [
          { label: '18-25', percentage: 20 },
          { label: '26-35', percentage: 35 },
          { label: '36-45', percentage: 30 },
          { label: '46+', percentage: 15 },
        ],
        countries: [
          { label: 'United Kingdom', percentage: 30 },
          { label: 'Australia', percentage: 25 },
          { label: 'Canada', percentage: 20 },
          { label: 'Others', percentage: 25 },
        ],
        groupTypes: [
          { label: 'Friends', percentage: 40 },
          { label: 'Couples', percentage: 30 },
          { label: 'Solo', percentage: 20 },
          { label: 'Family', percentage: 10 },
        ],
      },
      pricing: {
        basePrice: 1500,
        averagePrice: 1650,
        priceRange: { min: 1500, max: 1800 },
        competitorAverage: 1750,
      },
    },
  ]);

  const selectedServiceData = services.find(s => s.id === selectedService) || services[0];

  const getTrendIcon = (value: number) => {
    if (value > 0) {
      return <TrendingUp size={14} color={designTokens.colors.semantic.success} />;
    } else if (value < 0) {
      return <TrendingDown size={14} color={designTokens.colors.semantic.error} />;
    }
    return <Activity size={14} color={designTokens.colors.semantic.textSecondary} />;
  };

  const getTrendColor = (value: number) => {
    return value > 0 ? designTokens.colors.semantic.success : designTokens.colors.semantic.error;
  };

  const formatCurrency = (amount: number) => {
    return `฿${amount.toLocaleString()}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return designTokens.colors.semantic.success;
      case 'paused': return designTokens.colors.semantic.warning;
      case 'draft': return designTokens.colors.semantic.textSecondary;
      default: return designTokens.colors.semantic.textSecondary;
    }
  };

  const ServiceSelector = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.serviceSelector}
      contentContainerStyle={styles.serviceSelectorContent}
    >
      {services.map((service) => (
        <TouchableOpacity
          key={service.id}
          style={[
            styles.serviceChip,
            selectedService === service.id && styles.serviceChipActive
          ]}
          onPress={() => setSelectedService(service.id)}
        >
          <View style={styles.serviceChipContent}>
            <Text style={[
              styles.serviceChipText,
              selectedService === service.id && styles.serviceChipTextActive
            ]} numberOfLines={1}>
              {service.name}
            </Text>
            <View style={[
              styles.serviceStatus,
              { backgroundColor: getStatusColor(service.status) }
            ]} />
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const MetricCard = ({
    icon,
    title,
    value,
    trend,
    subtitle,
    size = 'normal'
  }: {
    icon: React.ReactNode;
    title: string;
    value: string;
    trend?: number;
    subtitle?: string;
    size?: 'normal' | 'small';
  }) => (
    <Card style={[
      styles.metricCard,
      size === 'small' && styles.metricCardSmall
    ]} padding={size === 'small' ? 12 : 16}>
      <View style={styles.metricHeader}>
        <View style={[
          styles.metricIcon,
          size === 'small' && styles.metricIconSmall
        ]}>
          {icon}
        </View>
        {trend !== undefined && (
          <View style={styles.trendContainer}>
            {getTrendIcon(trend)}
            <Caption style={[
              styles.trendValue,
              { color: getTrendColor(trend) }
            ]}>
              {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
            </Caption>
          </View>
        )}
      </View>

      <Heading style={[
        styles.metricValue,
        size === 'small' && styles.metricValueSmall
      ]}>
        {value}
      </Heading>
      <Caption style={styles.metricTitle}>{title}</Caption>
      {subtitle && (
        <Caption style={styles.metricSubtitle}>{subtitle}</Caption>
      )}
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
            <Heading style={styles.title}>Service Analytics</Heading>
            <Caption style={styles.subtitle}>Detailed performance by service</Caption>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.searchButton}>
              <Search size={20} color={designTokens.colors.semantic.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterButton}>
              <Filter size={20} color={designTokens.colors.semantic.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Service Selector */}
        <ServiceSelector />
      </SafeAreaView>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Service Overview */}
        <Card style={styles.overviewCard} padding={16}>
          <View style={styles.serviceHeader}>
            <View style={styles.serviceInfo}>
              <Subheading style={styles.serviceName}>{selectedServiceData.name}</Subheading>
              <Caption style={styles.serviceDescription}>{selectedServiceData.description}</Caption>
              <View style={styles.serviceMeta}>
                <View style={styles.serviceCategory}>
                  <Caption style={styles.serviceCategoryText}>{selectedServiceData.category}</Caption>
                </View>
                <View style={[
                  styles.serviceStatusBadge,
                  { backgroundColor: getStatusColor(selectedServiceData.status) + '20' }
                ]}>
                  <Caption style={[
                    styles.serviceStatusText,
                    { color: getStatusColor(selectedServiceData.status) }
                  ]}>
                    {selectedServiceData.status.toUpperCase()}
                  </Caption>
                </View>
              </View>
            </View>
          </View>
        </Card>

        {/* Key Metrics */}
        <View style={styles.metricsGrid}>
          <MetricCard
            icon={<DollarSign size={18} color={designTokens.colors.semantic.success} />}
            title="Revenue"
            value={formatCurrency(selectedServiceData.metrics.revenue)}
            trend={selectedServiceData.trends.revenue}
          />

          <MetricCard
            icon={<Calendar size={18} color={designTokens.colors.semantic.primary} />}
            title="Bookings"
            value={selectedServiceData.metrics.bookings.toString()}
            trend={selectedServiceData.trends.bookings}
          />

          <MetricCard
            icon={<Eye size={18} color={designTokens.colors.semantic.accent} />}
            title="Views"
            value={selectedServiceData.metrics.views.toString()}
            trend={selectedServiceData.trends.views}
          />

          <MetricCard
            icon={<Target size={18} color={designTokens.colors.semantic.warning} />}
            title="Conversion"
            value={`${selectedServiceData.metrics.conversionRate}%`}
            trend={selectedServiceData.trends.conversion}
          />
        </View>

        {/* Secondary Metrics */}
        <View style={styles.secondaryMetrics}>
          <MetricCard
            icon={<Star size={16} color="#FFD700" />}
            title="Rating"
            value={selectedServiceData.metrics.rating.toString()}
            subtitle={`${selectedServiceData.metrics.reviewCount} reviews`}
            size="small"
          />

          <MetricCard
            icon={<Users size={16} color={designTokens.colors.semantic.primary} />}
            title="Avg Group"
            value={selectedServiceData.metrics.averageGroupSize.toString()}
            subtitle="people per booking"
            size="small"
          />

          <MetricCard
            icon={<MessageCircle size={16} color={designTokens.colors.semantic.accent} />}
            title="Inquiries"
            value={selectedServiceData.metrics.inquiries.toString()}
            subtitle="this month"
            size="small"
          />
        </View>

        {/* Performance Insights */}
        <Card style={styles.performanceCard} padding={16}>
          <Subheading style={styles.performanceTitle}>Performance Insights</Subheading>

          <View style={styles.performanceGrid}>
            <View style={styles.performanceItem}>
              <Body style={styles.performanceValue}>{selectedServiceData.metrics.repeatBookings}</Body>
              <Caption style={styles.performanceLabel}>Repeat Bookings</Caption>
            </View>
            <View style={styles.performanceItem}>
              <Body style={styles.performanceValue}>{selectedServiceData.metrics.cancellationRate}%</Body>
              <Caption style={styles.performanceLabel}>Cancellation Rate</Caption>
            </View>
            <View style={styles.performanceItem}>
              <Body style={styles.performanceValue}>{selectedServiceData.performance.averageDuration}h</Body>
              <Caption style={styles.performanceLabel}>Avg Duration</Caption>
            </View>
            <View style={styles.performanceItem}>
              <Body style={[
                styles.performanceValue,
                { color: selectedServiceData.performance.seasonality === 'high' ? designTokens.colors.semantic.success :
                         selectedServiceData.performance.seasonality === 'medium' ? designTokens.colors.semantic.warning :
                         designTokens.colors.semantic.error }
              ]}>
                {selectedServiceData.performance.seasonality.toUpperCase()}
              </Body>
              <Caption style={styles.performanceLabel}>Seasonality</Caption>
            </View>
          </View>

          <View style={styles.performanceDetails}>
            <View style={styles.performanceDetail}>
              <Caption style={styles.performanceDetailLabel}>Peak Days:</Caption>
              <Body style={styles.performanceDetailValue}>
                {selectedServiceData.performance.peakDays.join(', ')}
              </Body>
            </View>
            <View style={styles.performanceDetail}>
              <Caption style={styles.performanceDetailLabel}>Peak Times:</Caption>
              <Body style={styles.performanceDetailValue}>
                {selectedServiceData.performance.peakTimes.join(', ')}
              </Body>
            </View>
            <View style={styles.performanceDetail}>
              <Caption style={styles.performanceDetailLabel}>Top Locations:</Caption>
              <Body style={styles.performanceDetailValue}>
                {selectedServiceData.performance.topLocations.join(', ')}
              </Body>
            </View>
          </View>
        </Card>

        {/* Pricing Analysis */}
        <Card style={styles.pricingCard} padding={16}>
          <Subheading style={styles.pricingTitle}>Pricing Analysis</Subheading>

          <View style={styles.pricingGrid}>
            <View style={styles.pricingItem}>
              <Body style={styles.pricingValue}>{formatCurrency(selectedServiceData.pricing.basePrice)}</Body>
              <Caption style={styles.pricingLabel}>Base Price</Caption>
            </View>
            <View style={styles.pricingItem}>
              <Body style={styles.pricingValue}>{formatCurrency(selectedServiceData.pricing.averagePrice)}</Body>
              <Caption style={styles.pricingLabel}>Average Price</Caption>
            </View>
            <View style={styles.pricingItem}>
              <Body style={styles.pricingValue}>
                {formatCurrency(selectedServiceData.pricing.priceRange.min)}-{formatCurrency(selectedServiceData.pricing.priceRange.max)}
              </Body>
              <Caption style={styles.pricingLabel}>Price Range</Caption>
            </View>
            <View style={styles.pricingItem}>
              <Body style={[
                styles.pricingValue,
                { color: selectedServiceData.pricing.averagePrice < selectedServiceData.pricing.competitorAverage ?
                         designTokens.colors.semantic.success : designTokens.colors.semantic.error }
              ]}>
                {formatCurrency(selectedServiceData.pricing.competitorAverage)}
              </Body>
              <Caption style={styles.pricingLabel}>Competitor Avg</Caption>
            </View>
          </View>
        </Card>

        {/* Demographics */}
        <View style={styles.demographicsSection}>
          <Subheading style={styles.sectionTitle}>Customer Demographics</Subheading>

          <View style={styles.demographicsGrid}>
            <Card style={styles.demographicCard} padding={12}>
              <Caption style={styles.demographicTitle}>Age Groups</Caption>
              {selectedServiceData.demographics.ageGroups.map((group, index) => (
                <View key={index} style={styles.demographicItem}>
                  <Caption style={styles.demographicLabel}>{group.label}</Caption>
                  <View style={styles.demographicBar}>
                    <View style={styles.demographicBarBackground}>
                      <LinearGradient
                        colors={[designTokens.colors.semantic.primary, designTokens.colors.semantic.accent]}
                        style={[styles.demographicBarFill, { width: `${group.percentage}%` }]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      />
                    </View>
                    <Caption style={styles.demographicPercentage}>{group.percentage}%</Caption>
                  </View>
                </View>
              ))}
            </Card>

            <Card style={styles.demographicCard} padding={12}>
              <Caption style={styles.demographicTitle}>Top Countries</Caption>
              {selectedServiceData.demographics.countries.map((country, index) => (
                <View key={index} style={styles.demographicItem}>
                  <Caption style={styles.demographicLabel}>{country.label}</Caption>
                  <View style={styles.demographicBar}>
                    <View style={styles.demographicBarBackground}>
                      <LinearGradient
                        colors={[designTokens.colors.semantic.accent, designTokens.colors.semantic.success]}
                        style={[styles.demographicBarFill, { width: `${country.percentage}%` }]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      />
                    </View>
                    <Caption style={styles.demographicPercentage}>{country.percentage}%</Caption>
                  </View>
                </View>
              ))}
            </Card>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsSection}>
          <Button
            title="Optimize Service"
            onPress={() => router.push("/supplier/portfolio/optimization")}
            style={styles.actionButton}
            icon={<BarChart3 size={16} color={designTokens.colors.semantic.surface} />}
          />
          <Button
            title="View Reports"
            onPress={() => router.push("/supplier/analytics/services")}
            variant="outline"
            style={styles.actionButton}
            icon={<Activity size={16} color={designTokens.colors.semantic.primary} />}
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
  headerActions: {
    flexDirection: 'row',
    gap: designTokens.spacing.scale.xs,
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: designTokens.colors.semantic.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...componentTokens.card.shadow,
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
  serviceSelector: {
    marginBottom: designTokens.spacing.scale.sm,
  },
  serviceSelectorContent: {
    paddingRight: designTokens.spacing.scale.md,
  },
  serviceChip: {
    backgroundColor: designTokens.colors.semantic.surface,
    paddingHorizontal: designTokens.spacing.scale.md,
    paddingVertical: designTokens.spacing.scale.sm,
    borderRadius: 20,
    marginRight: designTokens.spacing.scale.sm,
    minWidth: 120,
    ...componentTokens.card.shadow,
  },
  serviceChipActive: {
    backgroundColor: designTokens.colors.semantic.primary,
  },
  serviceChipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  serviceChipText: {
    color: designTokens.colors.semantic.text,
    fontWeight: '500',
    flex: 1,
    marginRight: designTokens.spacing.scale.xs,
  },
  serviceChipTextActive: {
    color: designTokens.colors.semantic.surface,
  },
  serviceStatus: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: designTokens.spacing.scale.md,
    paddingTop: 0,
  },
  overviewCard: {
    marginBottom: designTokens.spacing.scale.md,
  },
  serviceHeader: {
    marginBottom: designTokens.spacing.scale.sm,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    marginBottom: designTokens.spacing.scale.sm,
  },
  serviceDescription: {
    color: designTokens.colors.semantic.textSecondary,
    marginBottom: designTokens.spacing.scale.md,
    lineHeight: 20,
  },
  serviceMeta: {
    flexDirection: 'row',
    gap: designTokens.spacing.scale.sm,
  },
  serviceCategory: {
    backgroundColor: designTokens.colors.semantic.accent + '20',
    paddingHorizontal: designTokens.spacing.scale.sm,
    paddingVertical: designTokens.spacing.scale.xs,
    borderRadius: 12,
  },
  serviceCategoryText: {
    color: designTokens.colors.semantic.accent,
    fontWeight: '500',
  },
  serviceStatusBadge: {
    paddingHorizontal: designTokens.spacing.scale.sm,
    paddingVertical: designTokens.spacing.scale.xs,
    borderRadius: 12,
  },
  serviceStatusText: {
    fontWeight: '600',
    fontSize: 10,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: designTokens.spacing.scale.sm,
    marginBottom: designTokens.spacing.scale.md,
  },
  metricCard: {
    width: (width - 48) / 2 - 6, // 2 columns with gap
    marginBottom: 0,
  },
  metricCardSmall: {
    width: (width - 56) / 3 - 8, // 3 columns with gap
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: designTokens.spacing.scale.sm,
  },
  metricIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: designTokens.colors.semantic.surface + '80',
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricIconSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendValue: {
    marginLeft: designTokens.spacing.scale.xs,
    fontWeight: '600',
    fontSize: 11,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: designTokens.spacing.scale.xs,
  },
  metricValueSmall: {
    fontSize: 16,
  },
  metricTitle: {
    color: designTokens.colors.semantic.textSecondary,
    marginBottom: designTokens.spacing.scale.xs,
  },
  metricSubtitle: {
    color: designTokens.colors.semantic.textSecondary,
    fontSize: 10,
  },
  secondaryMetrics: {
    flexDirection: 'row',
    gap: designTokens.spacing.scale.sm,
    marginBottom: designTokens.spacing.scale.lg,
  },
  performanceCard: {
    marginBottom: designTokens.spacing.scale.md,
  },
  performanceTitle: {
    marginBottom: designTokens.spacing.scale.md,
  },
  performanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: designTokens.spacing.scale.md,
    marginBottom: designTokens.spacing.scale.md,
  },
  performanceItem: {
    alignItems: 'center',
    flex: 1,
    minWidth: '45%',
  },
  performanceValue: {
    fontWeight: '600',
    fontSize: 16,
    marginBottom: designTokens.spacing.scale.xs,
  },
  performanceLabel: {
    color: designTokens.colors.semantic.textSecondary,
    textAlign: 'center',
  },
  performanceDetails: {
    paddingTop: designTokens.spacing.scale.md,
    borderTopWidth: 1,
    borderTopColor: designTokens.colors.semantic.border,
    gap: designTokens.spacing.scale.sm,
  },
  performanceDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  performanceDetailLabel: {
    color: designTokens.colors.semantic.textSecondary,
    marginRight: designTokens.spacing.scale.sm,
    minWidth: 80,
  },
  performanceDetailValue: {
    flex: 1,
    fontWeight: '500',
  },
  pricingCard: {
    marginBottom: designTokens.spacing.scale.md,
  },
  pricingTitle: {
    marginBottom: designTokens.spacing.scale.md,
  },
  pricingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: designTokens.spacing.scale.md,
  },
  pricingItem: {
    alignItems: 'center',
    flex: 1,
    minWidth: '45%',
  },
  pricingValue: {
    fontWeight: '600',
    fontSize: 14,
    marginBottom: designTokens.spacing.scale.xs,
    textAlign: 'center',
  },
  pricingLabel: {
    color: designTokens.colors.semantic.textSecondary,
    textAlign: 'center',
  },
  demographicsSection: {
    marginBottom: designTokens.spacing.scale.lg,
  },
  sectionTitle: {
    marginBottom: designTokens.spacing.scale.md,
  },
  demographicsGrid: {
    gap: designTokens.spacing.scale.md,
  },
  demographicCard: {
    marginBottom: 0,
  },
  demographicTitle: {
    fontWeight: '600',
    marginBottom: designTokens.spacing.scale.md,
    color: designTokens.colors.semantic.text,
  },
  demographicItem: {
    marginBottom: designTokens.spacing.scale.sm,
  },
  demographicLabel: {
    marginBottom: designTokens.spacing.scale.xs,
    color: designTokens.colors.semantic.textSecondary,
  },
  demographicBar: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  demographicBarBackground: {
    flex: 1,
    height: 4,
    backgroundColor: designTokens.colors.semantic.surface + '80',
    borderRadius: 2,
    marginRight: designTokens.spacing.scale.sm,
  },
  demographicBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  demographicPercentage: {
    width: 30,
    textAlign: 'right',
    color: designTokens.colors.semantic.textSecondary,
    fontWeight: '500',
    fontSize: 11,
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