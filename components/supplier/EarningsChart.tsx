import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TrendingUp, TrendingDown, Calendar, DollarSign } from 'lucide-react-native';
import { designTokens, componentTokens } from '@/constants/design-tokens';
import { EarningsData, ServicePerformance } from '@/mocks/supplier-data';
import { useTranslation } from 'react-i18next';
interface EarningsChartProps {
  earningsData: EarningsData[];
  servicePerformance: ServicePerformance[];
  totalEarnings: number;
  monthlyGrowth: number;
}

type TimePeriod = 'week' | 'month' | 'quarter';

export const EarningsChart: React.FC<EarningsChartProps> = ({
  earningsData,
  servicePerformance,
  totalEarnings,
  monthlyGrowth,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('month');
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - (designTokens.spacing.scale.lg * 4); // Account for padding
  const chartHeight = 180;
  const { t } = useTranslation();
  const formatCurrency = (amount: number) => {
    if (amount >= 1000) {
      return `฿${(amount / 1000).toFixed(1)}K`;
    }
    return `฿${amount.toLocaleString('en-US')}`;
  };

  const getMaxEarnings = () => {
    return Math.max(...earningsData.map(item => item.earnings));
  };

  const renderBarChart = () => {
    const maxEarnings = getMaxEarnings();
    const barWidth = (chartWidth - (earningsData.length - 1) * 8) / earningsData.length;

    return (
      <View style={styles.chartContainer}>
        <View style={styles.chart}>
          {earningsData.map((item, index) => {
            const barHeight = (item.earnings / maxEarnings) * chartHeight;
            
            return (
              <View key={index} style={styles.barContainer}>
                <View style={[styles.barWrapper, { height: chartHeight }]}>
                  <LinearGradient
                    colors={[designTokens.colors.reference.purple, '#9B4DFF']}
                    style={[
                      styles.bar,
                      {
                        width: barWidth,
                        height: barHeight,
                      }
                    ]}
                  />
                </View>
                <Text style={styles.barLabel}>{item.month.split(' ')[0]}</Text>
                <Text style={styles.barValue}>{formatCurrency(item.earnings)}</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderServicePerformance = () => {
    const totalServiceEarnings = servicePerformance.reduce((sum, service) => sum + service.earnings, 0);

    return (
      <View style={styles.servicePerformanceContainer}>
        <Text style={styles.servicePerformanceTitle}>{t('analytics.servicePerformance')}</Text>
        {servicePerformance.map((service, index) => {
          const percentage = (service.earnings / totalServiceEarnings) * 100;
          
          return (
            <View key={index} style={styles.serviceItem}>
              <View style={styles.serviceHeader}>
                <View style={styles.serviceInfo}>
                  <View style={[styles.serviceColorIndicator, { backgroundColor: service.color }]} />
                  <Text style={styles.serviceName}>{service.serviceName}</Text>
                </View>
                <Text style={styles.serviceEarnings}>{formatCurrency(service.earnings)}</Text>
              </View>
              
              <View style={styles.serviceStats}>
                <Text style={styles.serviceStatText}>
                  {service.bookings} {t('analytics.bookings')} • {service.averageRating}★ • {percentage.toFixed(1)}%
                </Text>
              </View>
              
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBar, { backgroundColor: service.color, width: `${percentage}%` }]} />
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header with Period Selector */}
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.totalEarnings}>{formatCurrency(totalEarnings)}</Text>
          <View style={styles.growthContainer}>
            {monthlyGrowth >= 0 ? (
              <TrendingUp size={16} color="#4ECDC4" />
            ) : (
              <TrendingDown size={16} color="#FF6B6B" />
            )}
            <Text style={[
              styles.growthText,
              { color: monthlyGrowth >= 0 ? '#4ECDC4' : '#FF6B6B' }
            ]}>
              {monthlyGrowth >= 0 ? '+' : ''}{monthlyGrowth.toFixed(1)}% {t('analytics.thisMonthEarnings')}
            </Text>
          </View>
        </View>
        
        <View style={styles.periodSelector}>
          {([`${t('analytics.week')}`, `${t('analytics.month')}`, `${t('analytics.quarter')}`] as TimePeriod[]).map((period) => (
            <TouchableOpacity
              key={period}
              style={[
                styles.periodButton,
                selectedPeriod === period && styles.periodButtonActive
              ]}
              onPress={() => setSelectedPeriod(period)}
            >
              <Text style={[
                styles.periodButtonText,
                selectedPeriod === period && styles.periodButtonTextActive
              ]}>
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Earnings Chart */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chartScrollContent}
      >
        {renderBarChart()}
      </ScrollView>

      {/* Service Performance */}
      {renderServicePerformance()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...componentTokens.card.default,
    padding: designTokens.spacing.scale.lg,
  },
  header: {
    marginBottom: designTokens.spacing.scale.lg,
  },
  headerInfo: {
    marginBottom: designTokens.spacing.scale.md,
  },
  totalEarnings: {
    ...designTokens.typography.styles.heading,
    color: designTokens.colors.semantic.text,
    marginBottom: designTokens.spacing.scale.xs,
  },
  growthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  growthText: {
    ...componentTokens.text.caption,
    marginLeft: designTokens.spacing.scale.xs,
    fontWeight: designTokens.typography.weights.medium,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: designTokens.colors.semantic.background,
    borderRadius: designTokens.borderRadius.components.button,
    padding: 2,
  },
  periodButton: {
    flex: 1,
    paddingVertical: designTokens.spacing.scale.sm,
    paddingHorizontal: designTokens.spacing.scale.md,
    borderRadius: designTokens.borderRadius.components.button - 2,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: designTokens.colors.semantic.surface,
    ...designTokens.shadows.sm,
  },
  periodButtonText: {
    ...componentTokens.text.caption,
    fontWeight: designTokens.typography.weights.medium,
  },
  periodButtonTextActive: {
    color: designTokens.colors.semantic.primary,
    fontWeight: designTokens.typography.weights.semibold,
  },
  chartScrollContent: {
    paddingHorizontal: designTokens.spacing.scale.sm,
  },
  chartContainer: {
    marginBottom: designTokens.spacing.scale.xl,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 8,
  },
  barContainer: {
    alignItems: 'center',
  },
  barWrapper: {
    justifyContent: 'flex-end',
    marginBottom: designTokens.spacing.scale.sm,
  },
  bar: {
    borderRadius: 4,
    minHeight: 20,
  },
  barLabel: {
    ...componentTokens.text.caption,
    marginBottom: designTokens.spacing.scale.xs,
  },
  barValue: {
    ...designTokens.typography.styles.caption,
    fontWeight: designTokens.typography.weights.semibold,
    color: designTokens.colors.semantic.primary,
  },
  servicePerformanceContainer: {
    borderTopWidth: 1,
    borderTopColor: designTokens.colors.semantic.border,
    paddingTop: designTokens.spacing.scale.lg,
  },
  servicePerformanceTitle: {
    ...componentTokens.text.subheading,
    marginBottom: designTokens.spacing.scale.md,
  },
  serviceItem: {
    marginBottom: designTokens.spacing.scale.lg,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: designTokens.spacing.scale.xs,
  },
  serviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  serviceColorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: designTokens.spacing.scale.sm,
  },
  serviceName: {
    ...componentTokens.text.body,
    fontWeight: designTokens.typography.weights.medium,
    flex: 1,
  },
  serviceEarnings: {
    ...componentTokens.text.body,
    fontWeight: designTokens.typography.weights.semibold,
    color: designTokens.colors.semantic.primary,
  },
  serviceStats: {
    marginBottom: designTokens.spacing.scale.sm,
  },
  serviceStatText: {
    ...componentTokens.text.caption,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: designTokens.colors.semantic.background,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
});
