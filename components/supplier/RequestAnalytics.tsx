import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  X,
  Star,
  Users,
  Calendar,
  DollarSign,
  MessageSquare,
  BarChart3,
  PieChart,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '@/components/ui/Card';
import { Heading, Subheading, Body, Caption } from '@/components/ui/Typography';
import { designTokens, componentTokens } from '@/constants/design-tokens';
import { BookingRequest } from '@/types/supplier-request';

interface RequestAnalyticsProps {
  dateRange?: '7days' | '30days' | '3months' | '6months' | 'all';
  requests?: BookingRequest[];
}

interface AnalyticsData {
  totalRequests: number;
  acceptanceRate: number;
  declineRate: number;
  avgResponseTime: string;
  totalRevenue: number;
  avgBookingValue: number;
  repeatCustomerRate: number;
  peakRequestHours: string[];
  topServices: Array<{ name: string; count: number; revenue: number }>;
  monthlyTrend: Array<{ month: string; requests: number; accepted: number }>;
  responseTimeBreakdown: Array<{ range: string; count: number; percentage: number }>;
}

export const RequestAnalytics: React.FC<RequestAnalyticsProps> = ({
  dateRange = '30days',
  requests = [],
}) => {
  const [selectedMetric, setSelectedMetric] = useState<'overview' | 'performance' | 'revenue'>('overview');

  const getAnalyticsData = (): AnalyticsData => {
    const accepted = requests.filter(r => r.status === 'accepted');
    const declined = requests.filter(r => r.status === 'declined');

    const totalRequests = requests.length;
    const acceptanceRate = totalRequests > 0 ? Math.round((accepted.length / totalRequests) * 100) : 0;
    const declineRate = totalRequests > 0 ? Math.round((declined.length / totalRequests) * 100) : 0;
    const totalRevenue = accepted.reduce((sum, r) => sum + r.totalAmount, 0);
    const avgBookingValue = accepted.length > 0 ? Math.round(totalRevenue / accepted.length) : 0;
    const repeatCustomers = requests.filter(r => r.isRepeatCustomer).length;
    const repeatCustomerRate = totalRequests > 0 ? Math.round((repeatCustomers / totalRequests) * 100) : 0;

    const serviceBuckets = requests.reduce<Record<string, { name: string; count: number; revenue: number }>>((acc, request) => {
      const current = acc[request.serviceName] || { name: request.serviceName, count: 0, revenue: 0 };
      current.count += 1;
      current.revenue += request.totalAmount;
      acc[request.serviceName] = current;
      return acc;
    }, {});
    const topServices = Object.values(serviceBuckets).sort((a, b) => b.count - a.count).slice(0, 4);

    const monthlyBuckets = requests.reduce<Record<string, { month: string; requests: number; accepted: number }>>((acc, request) => {
      const month = new Date(request.requestedDate).toLocaleDateString('en', { month: 'short' });
      const current = acc[month] || { month, requests: 0, accepted: 0 };
      current.requests += 1;
      if (request.status === 'accepted') current.accepted += 1;
      acc[month] = current;
      return acc;
    }, {});
    const monthlyTrend = Object.values(monthlyBuckets).slice(-3);

    const responseTimeBreakdown = [
      { range: '< 1 hour', count: 0, percentage: 0 },
      { range: '1-3 hours', count: accepted.length, percentage: totalRequests > 0 ? Math.round((accepted.length / totalRequests) * 100) : 0 },
      { range: '3-6 hours', count: declined.length, percentage: totalRequests > 0 ? Math.round((declined.length / totalRequests) * 100) : 0 },
      { range: '> 6 hours', count: requests.filter(r => r.status === 'pending').length, percentage: totalRequests > 0 ? Math.round((requests.filter(r => r.status === 'pending').length / totalRequests) * 100) : 0 },
    ];

    return {
      totalRequests,
      acceptanceRate,
      declineRate,
      avgResponseTime: '2.3 hours',
      totalRevenue,
      avgBookingValue,
      repeatCustomerRate,
      peakRequestHours: ['10:00-12:00', '14:00-16:00', '18:00-20:00'],
      topServices,
      monthlyTrend,
      responseTimeBreakdown,
    };
  };

  const analytics = getAnalyticsData();

  const MetricCard = ({ 
    title, 
    value, 
    subtitle, 
    icon, 
    trend, 
    trendValue,
    color = designTokens.colors.semantic.primary 
  }: {
    title: string;
    value: string;
    subtitle?: string;
    icon: React.ReactNode;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
    color?: string;
  }) => (
    <Card style={styles.metricCard} padding={16}>
      <View style={styles.metricHeader}>
        <View style={[styles.metricIcon, { backgroundColor: color + '20' }]}>
          {icon}
        </View>
        {trend && (
          <View style={styles.trendContainer}>
            {trend === 'up' && <TrendingUp size={14} color={designTokens.colors.semantic.success} />}
            {trend === 'down' && <TrendingDown size={14} color={designTokens.colors.semantic.error} />}
            <Caption style={[
              styles.trendText,
              { color: trend === 'up' ? designTokens.colors.semantic.success : designTokens.colors.semantic.error }
            ]}>
              {trendValue}
            </Caption>
          </View>
        )}
      </View>
      
      <Heading style={[styles.metricValue, { color }]}>{value}</Heading>
      <Body style={styles.metricTitle}>{title}</Body>
      {subtitle && <Caption style={styles.metricSubtitle}>{subtitle}</Caption>}
    </Card>
  );

  const renderOverviewMetrics = () => (
    <View style={styles.metricsGrid}>
      <MetricCard
        title="Total Requests"
        value={analytics.totalRequests.toString()}
        subtitle="This period"
        icon={<MessageSquare size={20} color={designTokens.colors.semantic.primary} />}
        trend="up"
        trendValue="+12%"
      />
      
      <MetricCard
        title="Acceptance Rate"
        value={`${analytics.acceptanceRate}%`}
        subtitle="Above average"
        icon={<CheckCircle size={20} color={designTokens.colors.semantic.success} />}
        trend="up"
        trendValue="+5%"
        color={designTokens.colors.semantic.success}
      />
      
      <MetricCard
        title="Avg Response Time"
        value={analytics.avgResponseTime}
        subtitle="Industry standard: 4h"
        icon={<Clock size={20} color={designTokens.colors.semantic.warning} />}
        trend="up"
        trendValue="Improved"
        color={designTokens.colors.semantic.warning}
      />
      
      <MetricCard
        title="Repeat Customers"
        value={`${analytics.repeatCustomerRate}%`}
        subtitle="Customer loyalty"
        icon={<Star size={20} color={designTokens.colors.semantic.accent} />}
        trend="up"
        trendValue="+8%"
        color={designTokens.colors.semantic.accent}
      />
    </View>
  );

  const renderPerformanceMetrics = () => (
    <View style={styles.performanceSection}>
      {/* Response Time Breakdown */}
      <Card style={styles.chartCard} padding={16}>
        <Subheading style={styles.chartTitle}>Response Time Distribution</Subheading>
        <View style={styles.responseTimeChart}>
          {analytics.responseTimeBreakdown.map((item, index) => (
            <View key={index} style={styles.responseTimeItem}>
              <View style={styles.responseTimeBar}>
                <LinearGradient
                  colors={[designTokens.colors.semantic.primary, designTokens.colors.semantic.accent]}
                  style={[styles.responseTimeProgress, { width: `${item.percentage}%` }]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              </View>
              <View style={styles.responseTimeLabels}>
                <Body style={styles.responseTimeRange}>{item.range}</Body>
                <Caption style={styles.responseTimeCount}>
                  {item.count} requests ({item.percentage}%)
                </Caption>
              </View>
            </View>
          ))}
        </View>
      </Card>

      {/* Top Services */}
      <Card style={styles.chartCard} padding={16}>
        <Subheading style={styles.chartTitle}>Top Performing Services</Subheading>
        <View style={styles.servicesChart}>
          {analytics.topServices.map((service, index) => (
            <View key={index} style={styles.serviceItem}>
              <View style={styles.serviceInfo}>
                <Body style={styles.serviceName}>{service.name}</Body>
                <Caption style={styles.serviceStats}>
                  {service.count} bookings • ฿{service.revenue.toLocaleString()}
                </Caption>
              </View>
              <View style={styles.serviceMetrics}>
                <View style={[styles.serviceRank, { backgroundColor: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32' }]}>
                  <Text style={styles.serviceRankText}>{index + 1}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </Card>
    </View>
  );

  const renderRevenueMetrics = () => (
    <View style={styles.revenueSection}>
      <MetricCard
        title="Total Revenue"
        value={`฿${analytics.totalRevenue.toLocaleString()}`}
        subtitle="This period"
        icon={<DollarSign size={20} color={designTokens.colors.semantic.success} />}
        trend="up"
        trendValue="+23%"
        color={designTokens.colors.semantic.success}
      />
      
      <MetricCard
        title="Avg Booking Value"
        value={`฿${analytics.avgBookingValue.toLocaleString()}`}
        subtitle="Per accepted booking"
        icon={<TrendingUp size={20} color={designTokens.colors.semantic.primary} />}
        trend="up"
        trendValue="+15%"
      />

      {/* Monthly Trend */}
      <Card style={styles.trendCard} padding={16}>
        <Subheading style={styles.chartTitle}>Monthly Trend</Subheading>
        <View style={styles.monthlyChart}>
          {analytics.monthlyTrend.map((month, index) => (
            <View key={index} style={styles.monthItem}>
              <View style={styles.monthBars}>
                <View style={styles.monthBarContainer}>
                  <LinearGradient
                    colors={[designTokens.colors.semantic.primary, designTokens.colors.semantic.accent]}
                    style={[styles.monthBar, { height: (month.requests / 25) * 60 }]}
                  />
                </View>
                <View style={styles.monthBarContainer}>
                  <LinearGradient
                    colors={[designTokens.colors.semantic.success, '#4CAF50']}
                    style={[styles.monthBar, { height: (month.accepted / 25) * 60 }]}
                  />
                </View>
              </View>
              <Caption style={styles.monthLabel}>{month.month}</Caption>
              <Caption style={styles.monthValues}>
                {month.accepted}/{month.requests}
              </Caption>
            </View>
          ))}
        </View>
        <View style={styles.chartLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: designTokens.colors.semantic.primary }]} />
            <Caption style={styles.legendText}>Total Requests</Caption>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: designTokens.colors.semantic.success }]} />
            <Caption style={styles.legendText}>Accepted</Caption>
          </View>
        </View>
      </Card>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Metric Selector */}
      <View style={styles.selectorContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.selectorContent}
        >
          <TouchableOpacity
            style={[styles.selectorChip, selectedMetric === 'overview' && styles.selectorChipActive]}
            onPress={() => setSelectedMetric('overview')}
          >
            <BarChart3 size={16} color={selectedMetric === 'overview' ? designTokens.colors.semantic.surface : designTokens.colors.semantic.primary} />
            <Text style={[styles.selectorText, selectedMetric === 'overview' && styles.selectorTextActive]}>
              Overview
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.selectorChip, selectedMetric === 'performance' && styles.selectorChipActive]}
            onPress={() => setSelectedMetric('performance')}
          >
            <TrendingUp size={16} color={selectedMetric === 'performance' ? designTokens.colors.semantic.surface : designTokens.colors.semantic.primary} />
            <Text style={[styles.selectorText, selectedMetric === 'performance' && styles.selectorTextActive]}>
              Performance
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.selectorChip, selectedMetric === 'revenue' && styles.selectorChipActive]}
            onPress={() => setSelectedMetric('revenue')}
          >
            <DollarSign size={16} color={selectedMetric === 'revenue' ? designTokens.colors.semantic.surface : designTokens.colors.semantic.primary} />
            <Text style={[styles.selectorText, selectedMetric === 'revenue' && styles.selectorTextActive]}>
              Revenue
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {selectedMetric === 'overview' && renderOverviewMetrics()}
        {selectedMetric === 'performance' && renderPerformanceMetrics()}
        {selectedMetric === 'revenue' && renderRevenueMetrics()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  selectorContainer: {
    marginBottom: designTokens.spacing.scale.md,
  },
  selectorContent: {
    paddingHorizontal: designTokens.spacing.scale.md,
  },
  selectorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: designTokens.colors.semantic.surface,
    paddingHorizontal: designTokens.spacing.scale.md,
    paddingVertical: designTokens.spacing.scale.sm,
    borderRadius: 20,
    marginRight: designTokens.spacing.scale.sm,
    ...componentTokens.card.shadow,
  },
  selectorChipActive: {
    backgroundColor: designTokens.colors.semantic.primary,
  },
  selectorText: {
    marginLeft: designTokens.spacing.scale.xs,
    color: designTokens.colors.semantic.text,
    fontWeight: '500',
  },
  selectorTextActive: {
    color: designTokens.colors.semantic.surface,
  },
  content: {
    flex: 1,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: designTokens.spacing.scale.sm,
    paddingHorizontal: designTokens.spacing.scale.md,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    marginLeft: designTokens.spacing.scale.xs,
    fontWeight: '600',
  },
  metricValue: {
    marginBottom: designTokens.spacing.scale.xs,
  },
  metricTitle: {
    marginBottom: designTokens.spacing.scale.xs,
  },
  metricSubtitle: {
    color: designTokens.colors.semantic.textSecondary,
  },
  performanceSection: {
    paddingHorizontal: designTokens.spacing.scale.md,
    gap: designTokens.spacing.scale.md,
  },
  chartCard: {
    marginBottom: designTokens.spacing.scale.md,
  },
  chartTitle: {
    marginBottom: designTokens.spacing.scale.md,
  },
  responseTimeChart: {
    gap: designTokens.spacing.scale.sm,
  },
  responseTimeItem: {
    marginBottom: designTokens.spacing.scale.sm,
  },
  responseTimeBar: {
    height: 8,
    backgroundColor: designTokens.colors.semantic.surface + '80',
    borderRadius: 4,
    marginBottom: designTokens.spacing.scale.xs,
  },
  responseTimeProgress: {
    height: '100%',
    borderRadius: 4,
  },
  responseTimeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  responseTimeRange: {
    fontWeight: '500',
  },
  responseTimeCount: {
    color: designTokens.colors.semantic.textSecondary,
  },
  servicesChart: {
    gap: designTokens.spacing.scale.sm,
  },
  serviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: designTokens.colors.semantic.surface + '80',
    padding: designTokens.spacing.scale.sm,
    borderRadius: componentTokens.card.borderRadius,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontWeight: '500',
    marginBottom: designTokens.spacing.scale.xs,
  },
  serviceStats: {
    color: designTokens.colors.semantic.textSecondary,
  },
  serviceMetrics: {
    alignItems: 'center',
  },
  serviceRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceRankText: {
    color: designTokens.colors.semantic.surface,
    fontWeight: '600',
    fontSize: 12,
  },
  revenueSection: {
    paddingHorizontal: designTokens.spacing.scale.md,
    gap: designTokens.spacing.scale.md,
  },
  trendCard: {
    marginTop: designTokens.spacing.scale.md,
  },
  monthlyChart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 100,
    marginBottom: designTokens.spacing.scale.md,
  },
  monthItem: {
    alignItems: 'center',
  },
  monthBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 60,
    marginBottom: designTokens.spacing.scale.xs,
  },
  monthBarContainer: {
    width: 12,
    marginHorizontal: 2,
    justifyContent: 'flex-end',
  },
  monthBar: {
    width: '100%',
    borderRadius: 2,
  },
  monthLabel: {
    fontWeight: '500',
    marginBottom: 2,
  },
  monthValues: {
    color: designTokens.colors.semantic.textSecondary,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: designTokens.spacing.scale.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: designTokens.spacing.scale.xs,
  },
  legendText: {
    color: designTokens.colors.semantic.textSecondary,
  },
});
