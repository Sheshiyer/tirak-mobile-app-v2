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
  Eye,
  MessageCircle,
  Calendar,
  Users,
  Clock,
  Target,
  Zap,
  AlertTriangle,
  CheckCircle,
  X,
  Filter,
  BarChart3,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { RadialGradient } from '@/components/ui/RadialGradient';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Heading, Subheading, Body, Caption } from '@/components/ui/Typography';
import { designTokens, componentTokens } from '@/constants/design-tokens';

const { width } = Dimensions.get('window');

interface ConversionFunnel {
  stage: string;
  count: number;
  percentage: number;
  dropOffRate: number;
  averageTime: number; // minutes
  improvements: string[];
}

interface ConversionData {
  overview: {
    totalViews: number;
    totalInquiries: number;
    totalBookings: number;
    overallConversion: number;
    inquiryConversion: number;
    viewToInquiry: number;
    inquiryToBooking: number;
    averageTimeToBook: number; // hours
  };
  funnel: ConversionFunnel[];
  timeframe: {
    period: string;
    conversions: number[];
    labels: string[];
  };
  segments: {
    byService: { name: string; conversion: number; trend: number }[];
    bySource: { name: string; conversion: number; count: number }[];
    byDevice: { name: string; conversion: number; percentage: number }[];
    byTimeOfDay: { hour: string; conversion: number; volume: number }[];
  };
  dropOffReasons: {
    reason: string;
    percentage: number;
    stage: string;
    impact: 'high' | 'medium' | 'low';
  }[];
  optimizations: {
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    effort: 'low' | 'medium' | 'high';
    category: 'pricing' | 'content' | 'process' | 'timing';
  }[];
}

export default function ConversionAnalyticsScreen() {
  const router = useRouter();
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  // Mock conversion analytics data
  const [conversionData] = useState<ConversionData>({
    overview: {
      totalViews: 3780,
      totalInquiries: 251,
      totalBookings: 156,
      overallConversion: 4.1,
      inquiryConversion: 62.2,
      viewToInquiry: 6.6,
      inquiryToBooking: 62.2,
      averageTimeToBook: 18.5,
    },
    funnel: [
      {
        stage: 'Profile Views',
        count: 3780,
        percentage: 100,
        dropOffRate: 0,
        averageTime: 2.3,
        improvements: ['Optimize profile photos', 'Improve service descriptions'],
      },
      {
        stage: 'Service Views',
        count: 1890,
        percentage: 50,
        dropOffRate: 50,
        averageTime: 3.7,
        improvements: ['Add more photos', 'Clarify pricing', 'Highlight unique features'],
      },
      {
        stage: 'Inquiries Sent',
        count: 251,
        percentage: 6.6,
        dropOffRate: 86.7,
        averageTime: 8.2,
        improvements: ['Simplify inquiry process', 'Add instant booking option'],
      },
      {
        stage: 'Responses Received',
        count: 234,
        percentage: 6.2,
        dropOffRate: 6.8,
        averageTime: 2.1,
        improvements: ['Faster response times', 'Automated responses'],
      },
      {
        stage: 'Bookings Confirmed',
        count: 156,
        percentage: 4.1,
        dropOffRate: 33.3,
        averageTime: 4.8,
        improvements: ['Flexible payment options', 'Clear booking terms'],
      },
    ],
    timeframe: {
      period: '30 days',
      conversions: [3.2, 3.8, 4.1, 3.9, 4.5, 4.2, 4.1],
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7'],
    },
    segments: {
      byService: [
        { name: 'Street Food Adventure', conversion: 7.2, trend: 12.5 },
        { name: 'Cooking Class', conversion: 6.8, trend: 8.3 },
        { name: 'Temple Walk', conversion: 3.9, trend: -5.2 },
        { name: 'Photography Workshop', conversion: 18.6, trend: 22.1 },
      ],
      bySource: [
        { name: 'Direct Search', conversion: 5.8, count: 1240 },
        { name: 'Social Media', conversion: 3.2, count: 890 },
        { name: 'Referrals', conversion: 8.9, count: 420 },
        { name: 'Partner Sites', conversion: 4.1, count: 1230 },
      ],
      byDevice: [
        { name: 'Mobile', conversion: 3.8, percentage: 72 },
        { name: 'Desktop', conversion: 5.2, percentage: 23 },
        { name: 'Tablet', conversion: 4.1, percentage: 5 },
      ],
      byTimeOfDay: [
        { hour: '6-9', conversion: 2.8, volume: 180 },
        { hour: '9-12', conversion: 4.9, volume: 520 },
        { hour: '12-15', conversion: 5.2, volume: 680 },
        { hour: '15-18', conversion: 4.1, volume: 890 },
        { hour: '18-21', conversion: 3.6, volume: 1240 },
        { hour: '21-24', conversion: 2.1, volume: 270 },
      ],
    },
    dropOffReasons: [
      { reason: 'Price too high', percentage: 34, stage: 'Service Views', impact: 'high' },
      { reason: 'Slow response time', percentage: 28, stage: 'Inquiries', impact: 'high' },
      { reason: 'Unclear availability', percentage: 22, stage: 'Service Views', impact: 'medium' },
      { reason: 'Complex booking process', percentage: 18, stage: 'Booking', impact: 'medium' },
      { reason: 'Limited payment options', percentage: 15, stage: 'Booking', impact: 'low' },
      { reason: 'Insufficient photos', percentage: 12, stage: 'Profile Views', impact: 'low' },
    ],
    optimizations: [
      {
        title: 'Enable Instant Booking',
        description: 'Allow customers to book immediately without waiting for approval',
        impact: 'high',
        effort: 'low',
        category: 'process',
      },
      {
        title: 'Optimize Response Time',
        description: 'Set up automated responses and faster reply notifications',
        impact: 'high',
        effort: 'medium',
        category: 'process',
      },
      {
        title: 'Add More Service Photos',
        description: 'Include high-quality photos showing the experience',
        impact: 'medium',
        effort: 'low',
        category: 'content',
      },
      {
        title: 'Flexible Pricing Options',
        description: 'Offer group discounts and seasonal pricing',
        impact: 'medium',
        effort: 'medium',
        category: 'pricing',
      },
      {
        title: 'Peak Time Promotions',
        description: 'Offer incentives during high-conversion time slots',
        impact: 'medium',
        effort: 'low',
        category: 'timing',
      },
    ],
  });

  const periods = [
    { key: '7d', label: '7 Days' },
    { key: '30d', label: '30 Days' },
    { key: '90d', label: '3 Months' },
  ];

  const getTrendIcon = (value: number) => {
    if (value > 0) {
      return <TrendingUp size={14} color={designTokens.colors.semantic.success} />;
    } else if (value < 0) {
      return <TrendingDown size={14} color={designTokens.colors.semantic.error} />;
    }
    return null;
  };

  const getTrendColor = (value: number) => {
    return value > 0 ? designTokens.colors.semantic.success : designTokens.colors.semantic.error;
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return designTokens.colors.semantic.error;
      case 'medium': return designTokens.colors.semantic.warning;
      case 'low': return designTokens.colors.semantic.success;
      default: return designTokens.colors.semantic.textSecondary;
    }
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'low': return designTokens.colors.semantic.success;
      case 'medium': return designTokens.colors.semantic.warning;
      case 'high': return designTokens.colors.semantic.error;
      default: return designTokens.colors.semantic.textSecondary;
    }
  };

  const MetricCard = ({ 
    icon, 
    title, 
    value, 
    trend, 
    subtitle 
  }: {
    icon: React.ReactNode;
    title: string;
    value: string;
    trend?: number;
    subtitle?: string;
  }) => (
    <Card style={styles.metricCard} padding={16}>
      <View style={styles.metricHeader}>
        <View style={styles.metricIcon}>
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
      
      <Heading style={styles.metricValue}>{value}</Heading>
      <Caption style={styles.metricTitle}>{title}</Caption>
      {subtitle && (
        <Caption style={styles.metricSubtitle}>{subtitle}</Caption>
      )}
    </Card>
  );

  const FunnelStage = ({ stage, index }: { stage: ConversionFunnel; index: number }) => (
    <View style={styles.funnelStage}>
      <View style={styles.funnelStageHeader}>
        <View style={styles.funnelStageInfo}>
          <Body style={styles.funnelStageName}>{stage.stage}</Body>
          <Caption style={styles.funnelStageCount}>{stage.count.toLocaleString()} users</Caption>
        </View>
        <View style={styles.funnelStageMetrics}>
          <Body style={styles.funnelStagePercentage}>{stage.percentage.toFixed(1)}%</Body>
          {index > 0 && (
            <Caption style={[
              styles.funnelStageDropOff,
              { color: designTokens.colors.semantic.error }
            ]}>
              -{stage.dropOffRate.toFixed(1)}% drop-off
            </Caption>
          )}
        </View>
      </View>
      
      <View style={styles.funnelStageBar}>
        <LinearGradient
          colors={[designTokens.colors.semantic.primary, designTokens.colors.semantic.accent]}
          style={[styles.funnelStageBarFill, { width: `${stage.percentage}%` }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
      </View>

      <View style={styles.funnelStageDetails}>
        <Caption style={styles.funnelStageTime}>
          Avg time: {stage.averageTime} min
        </Caption>
        {stage.improvements.length > 0 && (
          <View style={styles.funnelImprovements}>
            <Caption style={styles.funnelImprovementsTitle}>Improvements:</Caption>
            {stage.improvements.slice(0, 2).map((improvement, idx) => (
              <Caption key={idx} style={styles.funnelImprovement}>
                • {improvement}
              </Caption>
            ))}
          </View>
        )}
      </View>
    </View>
  );

  const SegmentChart = ({ 
    title, 
    data, 
    valueKey, 
    labelKey,
    showTrend = false 
  }: {
    title: string;
    data: any[];
    valueKey: string;
    labelKey: string;
    showTrend?: boolean;
  }) => (
    <Card style={styles.segmentCard} padding={16}>
      <Subheading style={styles.segmentTitle}>{title}</Subheading>
      
      <View style={styles.segmentData}>
        {data.map((item, index) => (
          <View key={index} style={styles.segmentItem}>
            <View style={styles.segmentItemInfo}>
              <Body style={styles.segmentItemLabel}>{item[labelKey]}</Body>
              <View style={styles.segmentItemMetrics}>
                <Body style={styles.segmentItemValue}>{item[valueKey]}%</Body>
                {showTrend && item.trend !== undefined && (
                  <View style={styles.segmentTrend}>
                    {getTrendIcon(item.trend)}
                    <Caption style={[
                      styles.segmentTrendValue,
                      { color: getTrendColor(item.trend) }
                    ]}>
                      {item.trend > 0 ? '+' : ''}{item.trend.toFixed(1)}%
                    </Caption>
                  </View>
                )}
              </View>
            </View>
            <View style={styles.segmentItemBar}>
              <View style={styles.segmentItemBarBackground}>
                <LinearGradient
                  colors={[designTokens.colors.semantic.accent, designTokens.colors.semantic.success]}
                  style={[
                    styles.segmentItemBarFill,
                    { width: `${Math.min(item[valueKey] * 5, 100)}%` }
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              </View>
            </View>
          </View>
        ))}
      </View>
    </Card>
  );

  const OptimizationCard = ({ optimization }: { optimization: ConversionData['optimizations'][0] }) => (
    <Card style={styles.optimizationCard} padding={16}>
      <View style={styles.optimizationHeader}>
        <Subheading style={styles.optimizationTitle}>{optimization.title}</Subheading>
        <View style={styles.optimizationBadges}>
          <View style={[
            styles.optimizationBadge,
            { backgroundColor: getImpactColor(optimization.impact) + '20' }
          ]}>
            <Caption style={[
              styles.optimizationBadgeText,
              { color: getImpactColor(optimization.impact) }
            ]}>
              {optimization.impact.toUpperCase()} IMPACT
            </Caption>
          </View>
          <View style={[
            styles.optimizationBadge,
            { backgroundColor: getEffortColor(optimization.effort) + '20' }
          ]}>
            <Caption style={[
              styles.optimizationBadgeText,
              { color: getEffortColor(optimization.effort) }
            ]}>
              {optimization.effort.toUpperCase()} EFFORT
            </Caption>
          </View>
        </View>
      </View>
      
      <Body style={styles.optimizationDescription}>{optimization.description}</Body>
      
      <View style={styles.optimizationCategory}>
        <Caption style={styles.optimizationCategoryText}>
          Category: {optimization.category.charAt(0).toUpperCase() + optimization.category.slice(1)}
        </Caption>
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
            <Heading style={styles.title}>Conversion Analytics</Heading>
            <Caption style={styles.subtitle}>Track booking conversion funnel</Caption>
          </View>

          <TouchableOpacity style={styles.filterButton}>
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
            icon={<Eye size={20} color={designTokens.colors.semantic.primary} />}
            title="Total Views"
            value={conversionData.overview.totalViews.toLocaleString()}
            subtitle="Last 30 days"
          />
          
          <MetricCard
            icon={<MessageCircle size={20} color={designTokens.colors.semantic.accent} />}
            title="Inquiries"
            value={conversionData.overview.totalInquiries.toString()}
            subtitle={`${conversionData.overview.viewToInquiry.toFixed(1)}% of views`}
          />
          
          <MetricCard
            icon={<Calendar size={20} color={designTokens.colors.semantic.success} />}
            title="Bookings"
            value={conversionData.overview.totalBookings.toString()}
            subtitle={`${conversionData.overview.inquiryToBooking.toFixed(1)}% of inquiries`}
          />
          
          <MetricCard
            icon={<Target size={20} color={designTokens.colors.semantic.warning} />}
            title="Overall Conversion"
            value={`${conversionData.overview.overallConversion.toFixed(1)}%`}
            subtitle="Views to bookings"
          />
        </View>

        {/* Conversion Funnel */}
        <Card style={styles.funnelCard} padding={16}>
          <Subheading style={styles.funnelTitle}>Conversion Funnel</Subheading>
          <Caption style={styles.funnelSubtitle}>
            Track where customers drop off in the booking process
          </Caption>
          
          <View style={styles.funnelStages}>
            {conversionData.funnel.map((stage, index) => (
              <FunnelStage key={index} stage={stage} index={index} />
            ))}
          </View>
        </Card>

        {/* Conversion by Segments */}
        <View style={styles.segmentsSection}>
          <Subheading style={styles.sectionTitle}>Conversion by Segments</Subheading>
          
          <SegmentChart
            title="By Service"
            data={conversionData.segments.byService}
            valueKey="conversion"
            labelKey="name"
            showTrend={true}
          />
          
          <SegmentChart
            title="By Traffic Source"
            data={conversionData.segments.bySource}
            valueKey="conversion"
            labelKey="name"
          />
          
          <SegmentChart
            title="By Device Type"
            data={conversionData.segments.byDevice}
            valueKey="conversion"
            labelKey="name"
          />
        </View>

        {/* Drop-off Analysis */}
        <Card style={styles.dropOffCard} padding={16}>
          <Subheading style={styles.dropOffTitle}>Top Drop-off Reasons</Subheading>
          
          <View style={styles.dropOffReasons}>
            {conversionData.dropOffReasons.slice(0, 4).map((reason, index) => (
              <View key={index} style={styles.dropOffReason}>
                <View style={styles.dropOffReasonInfo}>
                  <Body style={styles.dropOffReasonText}>{reason.reason}</Body>
                  <Caption style={styles.dropOffReasonStage}>at {reason.stage}</Caption>
                </View>
                <View style={styles.dropOffReasonMetrics}>
                  <Body style={styles.dropOffReasonPercentage}>{reason.percentage}%</Body>
                  <View style={[
                    styles.dropOffReasonImpact,
                    { backgroundColor: getImpactColor(reason.impact) }
                  ]} />
                </View>
              </View>
            ))}
          </View>
        </Card>

        {/* Optimization Recommendations */}
        <View style={styles.optimizationsSection}>
          <Subheading style={styles.sectionTitle}>Optimization Recommendations</Subheading>
          <Caption style={styles.sectionSubtitle}>
            Prioritized actions to improve your conversion rate
          </Caption>
          
          {conversionData.optimizations.slice(0, 3).map((optimization, index) => (
            <OptimizationCard key={index} optimization={optimization} />
          ))}
        </View>

        {/* Actions */}
        <View style={styles.actionsSection}>
          <Button
            title="Detailed Report"
            onPress={() => router.push('/supplier/analytics/conversion')}
            style={styles.actionButton}
            icon={<BarChart3 size={16} color={designTokens.colors.semantic.surface} />}
          />
          <Button
            title="A/B Test Setup"
            onPress={() => router.push('/supplier/analytics/conversion')}
            variant="outline"
            style={styles.actionButton}
            icon={<Zap size={16} color={designTokens.colors.semantic.primary} />}
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
  funnelCard: {
    marginBottom: designTokens.spacing.scale.lg,
  },
  funnelTitle: {
    marginBottom: designTokens.spacing.scale.xs,
  },
  funnelSubtitle: {
    color: designTokens.colors.semantic.textSecondary,
    marginBottom: designTokens.spacing.scale.lg,
  },
  funnelStages: {
    gap: designTokens.spacing.scale.md,
  },
  funnelStage: {
    marginBottom: designTokens.spacing.scale.sm,
  },
  funnelStageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: designTokens.spacing.scale.sm,
  },
  funnelStageInfo: {
    flex: 1,
  },
  funnelStageName: {
    fontWeight: '600',
    marginBottom: 2,
  },
  funnelStageCount: {
    color: designTokens.colors.semantic.textSecondary,
  },
  funnelStageMetrics: {
    alignItems: 'flex-end',
  },
  funnelStagePercentage: {
    fontWeight: '600',
    fontSize: 18,
  },
  funnelStageDropOff: {
    fontSize: 11,
    fontWeight: '500',
  },
  funnelStageBar: {
    height: 8,
    backgroundColor: designTokens.colors.semantic.surface + '80',
    borderRadius: 4,
    marginBottom: designTokens.spacing.scale.sm,
  },
  funnelStageBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  funnelStageDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  funnelStageTime: {
    color: designTokens.colors.semantic.textSecondary,
  },
  funnelImprovements: {
    flex: 1,
    marginLeft: designTokens.spacing.scale.md,
  },
  funnelImprovementsTitle: {
    color: designTokens.colors.semantic.textSecondary,
    fontWeight: '500',
    marginBottom: designTokens.spacing.scale.xs,
  },
  funnelImprovement: {
    color: designTokens.colors.semantic.textSecondary,
    fontSize: 11,
    marginBottom: 2,
  },
  segmentsSection: {
    marginBottom: designTokens.spacing.scale.lg,
  },
  sectionTitle: {
    marginBottom: designTokens.spacing.scale.md,
  },
  sectionSubtitle: {
    color: designTokens.colors.semantic.textSecondary,
    marginBottom: designTokens.spacing.scale.md,
  },
  segmentCard: {
    marginBottom: designTokens.spacing.scale.md,
  },
  segmentTitle: {
    marginBottom: designTokens.spacing.scale.md,
  },
  segmentData: {
    gap: designTokens.spacing.scale.sm,
  },
  segmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  segmentItemInfo: {
    flex: 1,
    marginRight: designTokens.spacing.scale.md,
  },
  segmentItemLabel: {
    fontWeight: '500',
    marginBottom: 2,
  },
  segmentItemMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  segmentItemValue: {
    fontWeight: '600',
    color: designTokens.colors.semantic.primary,
  },
  segmentTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: designTokens.spacing.scale.sm,
  },
  segmentTrendValue: {
    marginLeft: designTokens.spacing.scale.xs,
    fontSize: 11,
    fontWeight: '500',
  },
  segmentItemBar: {
    width: 60,
  },
  segmentItemBarBackground: {
    height: 4,
    backgroundColor: designTokens.colors.semantic.surface + '80',
    borderRadius: 2,
  },
  segmentItemBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  dropOffCard: {
    marginBottom: designTokens.spacing.scale.lg,
  },
  dropOffTitle: {
    marginBottom: designTokens.spacing.scale.md,
  },
  dropOffReasons: {
    gap: designTokens.spacing.scale.md,
  },
  dropOffReason: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: designTokens.spacing.scale.sm,
    borderBottomWidth: 1,
    borderBottomColor: designTokens.colors.semantic.border,
  },
  dropOffReasonInfo: {
    flex: 1,
  },
  dropOffReasonText: {
    fontWeight: '500',
    marginBottom: 2,
  },
  dropOffReasonStage: {
    color: designTokens.colors.semantic.textSecondary,
  },
  dropOffReasonMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dropOffReasonPercentage: {
    fontWeight: '600',
    marginRight: designTokens.spacing.scale.sm,
  },
  dropOffReasonImpact: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  optimizationsSection: {
    marginBottom: designTokens.spacing.scale.lg,
  },
  optimizationCard: {
    marginBottom: designTokens.spacing.scale.md,
  },
  optimizationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: designTokens.spacing.scale.sm,
  },
  optimizationTitle: {
    flex: 1,
    marginRight: designTokens.spacing.scale.sm,
  },
  optimizationBadges: {
    gap: designTokens.spacing.scale.xs,
  },
  optimizationBadge: {
    paddingHorizontal: designTokens.spacing.scale.sm,
    paddingVertical: designTokens.spacing.scale.xs,
    borderRadius: 8,
  },
  optimizationBadgeText: {
    fontSize: 9,
    fontWeight: '600',
  },
  optimizationDescription: {
    color: designTokens.colors.semantic.textSecondary,
    marginBottom: designTokens.spacing.scale.sm,
    lineHeight: 20,
  },
  optimizationCategory: {
    alignSelf: 'flex-start',
  },
  optimizationCategoryText: {
    color: designTokens.colors.semantic.textSecondary,
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
