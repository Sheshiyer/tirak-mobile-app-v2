import { logger } from '@/utils/logger';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Clock, 
  CheckCircle, 
  Star, 
  User, 
  TrendingUp, 
  TrendingDown,
  Minus
} from 'lucide-react-native';
import { designTokens, componentTokens } from '@/constants/design-tokens';

interface PerformanceMetricsProps {
  metrics: any[];
}

export const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({
  metrics,
}) => {

  logger.log("metrics", metrics);
  const getMetricIcon = (iconName: string) => {
    const iconProps = { size: 24, color: designTokens.colors.semantic.surface };
    
    switch (iconName) {
      case 'clock':
        return <Clock {...iconProps} />;
      case 'check-circle':
        return <CheckCircle {...iconProps} />;
      case 'star':
        return <Star {...iconProps} />;
      case 'user':
        return <User {...iconProps} />;
      default:
        return <Clock {...iconProps} />;
    }
  };

  const getTrendIcon = (trend: any, trendValue: number) => {
    const iconProps = { size: 14 };
    
    if (trend === 'up') {
      return <TrendingUp {...iconProps} color="#4ECDC4" />;
    } else if (trend === 'down') {
      return <TrendingDown {...iconProps} color="#4ECDC4" />;
    } else {
      return <Minus {...iconProps} color={designTokens.colors.semantic.textSecondary} />;
    }
  };

  const getTrendColor = (trend: any) => {
    switch (trend) {
      case 'up':
      case 'down':
        return '#4ECDC4';
      default:
        return designTokens.colors.semantic.textSecondary;
    }
  };

  const formatTrendValue = (trend: any, value: number) => {
    if (trend === 'neutral') return 'No change';
    if (typeof value !== 'number' || isNaN(value)) return 'N/A';
    const prefix = trend === 'up' ? '+' : '';
    return `${prefix}${value.toFixed(1)}%`;
  };

  const getProgressPercentage = (metric: any) => {
    switch (metric.id) {
      case 'response-time':
        // Lower is better, so invert the calculation
        // Assuming 8 hours is poor, 0 hours is perfect
        const maxResponseTime = 8;
        const responseTime = typeof metric.value === 'string' ? parseFloat(metric.value) : metric.value;
        return Math.max(0, Math.min(100, ((maxResponseTime - responseTime) / maxResponseTime) * 100));
      
      case 'acceptance-rate':
      case 'profile-completion':
        return typeof metric.value === 'number' ? metric.value : 0;
      
      case 'customer-satisfaction':
        // Convert 5-star rating to percentage
        const rating = typeof metric.value === 'number' ? metric.value : 0;
        return (rating / 5) * 100;
      
      default:
        return 0;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.metricsGrid}>
        {metrics.map((metric, index) => {
          const progressPercentage = getProgressPercentage(metric);
          
          return (
            <View key={metric.id || metric.name || index} style={styles.metricCard}>
              <LinearGradient
                colors={[metric.color, `${metric.color}CC`]}
                style={styles.metricHeader}
              >
                <View style={styles.metricIconContainer}>
                  {getMetricIcon(metric.icon)}
                </View>
                <View style={styles.metricValueContainer}>
                  <Text style={styles.metricValue}>
                    {metric.value}{metric.unit}
                  </Text>
                  <View style={styles.trendContainer}>
                    {getTrendIcon(metric.trend, metric.trendValue)}
                    <Text style={[
                      styles.trendText,
                      { color: getTrendColor(metric.trend) }
                    ]}>
                      {formatTrendValue(metric.trend, metric.trendValue)}
                    </Text>
                  </View>
                </View>
              </LinearGradient>
              
              <View style={styles.metricContent}>
                <Text style={styles.metricTitle}>{metric.name}</Text>
                <Text style={styles.metricDescription}>{metric.description}</Text>
                
                {/* Progress Bar */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressBarBackground}>
                    <LinearGradient
                      colors={[metric.color, `${metric.color}80`]}
                      style={[
                        styles.progressBar,
                        { width: `${progressPercentage}%` }
                      ]}
                    />
                  </View>
                  <Text style={styles.progressText}>{typeof progressPercentage === 'number' && !isNaN(progressPercentage) ? progressPercentage.toFixed(0) + '%' : 'N/A'}</Text>
                </View>
                
                {/* Benchmark */}
                {metric.benchmark && (
                  <Text style={styles.benchmarkText}>{metric.benchmark}</Text>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...componentTokens.card.default,
    padding: designTokens.spacing.scale.lg,
  },
  metricsGrid: {
    gap: designTokens.spacing.scale.md,
  },
  metricCard: {
    backgroundColor: designTokens.colors.semantic.surface,
    borderRadius: designTokens.borderRadius.components.card,
    overflow: 'hidden',
    ...designTokens.shadows.sm,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: designTokens.spacing.scale.lg,
  },
  metricIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: designTokens.spacing.scale.md,
  },
  metricValueContainer: {
    flex: 1,
  },
  metricValue: {
    ...designTokens.typography.styles.heading,
    color: designTokens.colors.semantic.surface,
    marginBottom: designTokens.spacing.scale.xs,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    ...componentTokens.text.caption,
    marginLeft: designTokens.spacing.scale.xs,
    fontWeight: designTokens.typography.weights.medium,
  },
  metricContent: {
    padding: designTokens.spacing.scale.lg,
    paddingTop: designTokens.spacing.scale.md,
  },
  metricTitle: {
    ...componentTokens.text.subheading,
    marginBottom: designTokens.spacing.scale.xs,
  },
  metricDescription: {
    ...componentTokens.text.caption,
    marginBottom: designTokens.spacing.scale.md,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: designTokens.spacing.scale.sm,
  },
  progressBarBackground: {
    flex: 1,
    height: 6,
    backgroundColor: designTokens.colors.semantic.background,
    borderRadius: 3,
    marginRight: designTokens.spacing.scale.sm,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    ...designTokens.typography.styles.caption,
    fontWeight: designTokens.typography.weights.semibold,
    color: designTokens.colors.semantic.primary,
    minWidth: 35,
    textAlign: 'right',
  },
  benchmarkText: {
    ...componentTokens.text.caption,
    color: designTokens.colors.semantic.textSecondary,
    fontStyle: 'italic',
  },
});
