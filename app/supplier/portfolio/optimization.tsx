import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Star,
  DollarSign,
  Eye,
  Users,
  Target,
  Zap,
  Award,
  Camera,
  Edit,
  ArrowRight,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { RadialGradient } from '@/components/ui/RadialGradient';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Heading, Subheading, Body, Caption } from '@/components/ui/Typography';
import { designTokens, componentTokens } from '@/constants/design-tokens';
import { mockSupplierServices, getServiceAnalytics } from '@/mocks/supplier-services';

interface OptimizationRecommendation {
  id: string;
  type: 'pricing' | 'content' | 'photos' | 'performance' | 'promotion';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
  serviceId?: string;
  serviceName?: string;
  currentValue?: string;
  suggestedValue?: string;
  potentialIncrease?: string;
}

export default function ServiceOptimizationScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'pricing' | 'content' | 'photos' | 'performance' | 'promotion'>('all');

  const analytics = getServiceAnalytics();

  const getOptimizationRecommendations = (): OptimizationRecommendation[] => {
    const recommendations: OptimizationRecommendation[] = [];
    
    mockSupplierServices.forEach(service => {
      // Low conversion rate recommendations
      if (service.conversionRate < 60) {
        recommendations.push({
          id: `conv-${service.id}`,
          type: 'performance',
          priority: 'high',
          title: 'Improve Conversion Rate',
          description: `${service.name} has a ${service.conversionRate}% conversion rate, below the 60% benchmark.`,
          impact: 'High - Could increase bookings by 20-30%',
          effort: 'medium',
          serviceId: service.id,
          serviceName: service.name,
          currentValue: `${service.conversionRate}%`,
          suggestedValue: '65-75%',
          potentialIncrease: '+25% bookings',
        });
      }

      // Pricing optimization
      if (service.basePrice < 1500 && service.rating >= 4.7) {
        recommendations.push({
          id: `price-${service.id}`,
          type: 'pricing',
          priority: 'medium',
          title: 'Consider Price Increase',
          description: `${service.name} has excellent ratings (${service.rating}★) but competitive pricing.`,
          impact: 'Medium - Could increase revenue by 15-20%',
          effort: 'low',
          serviceId: service.id,
          serviceName: service.name,
          currentValue: `฿${service.basePrice}`,
          suggestedValue: `฿${service.basePrice + 300}-${service.basePrice + 500}`,
          potentialIncrease: '+18% revenue',
        });
      }

      // Photo recommendations
      if (service.photos.length < 5) {
        recommendations.push({
          id: `photos-${service.id}`,
          type: 'photos',
          priority: 'medium',
          title: 'Add More Photos',
          description: `${service.name} only has ${service.photos.length} photos. Services with 5+ photos get 40% more views.`,
          impact: 'Medium - Could increase views by 30-40%',
          effort: 'low',
          serviceId: service.id,
          serviceName: service.name,
          currentValue: `${service.photos.length} photos`,
          suggestedValue: '5-8 photos',
          potentialIncrease: '+35% views',
        });
      }

      // Content freshness
      const daysSinceUpdate = (Date.now() - new Date(service.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceUpdate > 30) {
        recommendations.push({
          id: `content-${service.id}`,
          type: 'content',
          priority: 'low',
          title: 'Update Service Content',
          description: `${service.name} hasn't been updated in ${Math.round(daysSinceUpdate)} days.`,
          impact: 'Low - Keeps content fresh and relevant',
          effort: 'low',
          serviceId: service.id,
          serviceName: service.name,
          currentValue: `${Math.round(daysSinceUpdate)} days ago`,
          suggestedValue: 'Within 30 days',
          potentialIncrease: '+10% engagement',
        });
      }

      // Promotion for top performers
      if (service.conversionRate >= 70 && service.rating >= 4.8) {
        recommendations.push({
          id: `promote-${service.id}`,
          type: 'promotion',
          priority: 'high',
          title: 'Promote Top Performer',
          description: `${service.name} is a top performer with ${service.conversionRate}% conversion and ${service.rating}★ rating.`,
          impact: 'High - Could double visibility and bookings',
          effort: 'medium',
          serviceId: service.id,
          serviceName: service.name,
          currentValue: `${service.viewCount} views/month`,
          suggestedValue: `${Math.round(service.viewCount * 1.8)} views/month`,
          potentialIncrease: '+80% visibility',
        });
      }
    });

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  };

  const recommendations = getOptimizationRecommendations();
  const filteredRecommendations = selectedCategory === 'all' 
    ? recommendations 
    : recommendations.filter(r => r.type === selectedCategory);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pricing': return <DollarSign size={16} color={designTokens.colors.semantic.success} />;
      case 'content': return <Edit size={16} color={designTokens.colors.semantic.primary} />;
      case 'photos': return <Camera size={16} color={designTokens.colors.semantic.accent} />;
      case 'performance': return <TrendingUp size={16} color={designTokens.colors.semantic.warning} />;
      case 'promotion': return <Award size={16} color={designTokens.colors.semantic.primary} />;
      default: return <Target size={16} color={designTokens.colors.semantic.textSecondary} />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
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

  const handleApplyRecommendation = (recommendation: OptimizationRecommendation) => {
    if (recommendation.serviceId) {
      router.push("/supplier/services/edit");
    }
  };

  const CategoryChip = ({ 
    type, 
    label, 
    count 
  }: { 
    type: typeof selectedCategory; 
    label: string; 
    count: number;
  }) => {
    const isActive = selectedCategory === type;
    return (
      <TouchableOpacity
        style={[styles.categoryChip, isActive && styles.categoryChipActive]}
        onPress={() => setSelectedCategory(type)}
      >
        <Text style={[styles.categoryChipText, isActive && styles.categoryChipTextActive]}>
          {label}
        </Text>
        {count > 0 && (
          <View style={styles.categoryChipBadge}>
            <Text style={styles.categoryChipBadgeText}>{count}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const RecommendationCard = ({ recommendation }: { recommendation: OptimizationRecommendation }) => (
    <Card style={styles.recommendationCard} padding={16}>
      <View style={styles.recommendationHeader}>
        <View style={styles.recommendationTitleRow}>
          {getTypeIcon(recommendation.type)}
          <Subheading style={styles.recommendationTitle}>
            {recommendation.title}
          </Subheading>
        </View>
        
        <View style={styles.recommendationBadges}>
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(recommendation.priority) + '20' }]}>
            <Text style={[styles.priorityText, { color: getPriorityColor(recommendation.priority) }]}>
              {recommendation.priority.toUpperCase()}
            </Text>
          </View>
          <View style={[styles.effortBadge, { backgroundColor: getEffortColor(recommendation.effort) + '20' }]}>
            <Text style={[styles.effortText, { color: getEffortColor(recommendation.effort) }]}>
              {recommendation.effort} effort
            </Text>
          </View>
        </View>
      </View>

      {recommendation.serviceName && (
        <Caption style={styles.serviceName}>
          Service: {recommendation.serviceName}
        </Caption>
      )}

      <Body style={styles.recommendationDescription}>
        {recommendation.description}
      </Body>

      <View style={styles.impactContainer}>
        <Zap size={14} color={designTokens.colors.semantic.accent} />
        <Caption style={styles.impactText}>{recommendation.impact}</Caption>
      </View>

      {recommendation.currentValue && recommendation.suggestedValue && (
        <View style={styles.valuesContainer}>
          <View style={styles.valueItem}>
            <Caption style={styles.valueLabel}>Current</Caption>
            <Body style={styles.currentValue}>{recommendation.currentValue}</Body>
          </View>
          <ArrowRight size={16} color={designTokens.colors.semantic.textSecondary} />
          <View style={styles.valueItem}>
            <Caption style={styles.valueLabel}>Suggested</Caption>
            <Body style={styles.suggestedValue}>{recommendation.suggestedValue}</Body>
          </View>
        </View>
      )}

      {recommendation.potentialIncrease && (
        <View style={styles.potentialContainer}>
          <TrendingUp size={14} color={designTokens.colors.semantic.success} />
          <Caption style={styles.potentialText}>
            Potential: {recommendation.potentialIncrease}
          </Caption>
        </View>
      )}

      <Button
        title="Apply Recommendation"
        onPress={() => handleApplyRecommendation(recommendation)}
        style={styles.applyButton}
        icon={<CheckCircle size={16} color={designTokens.colors.semantic.surface} />}
      />
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
            <Heading style={styles.title}>Service Optimization</Heading>
            <Caption style={styles.subtitle}>
              {filteredRecommendations.length} recommendation{filteredRecommendations.length !== 1 ? 's' : ''} available
            </Caption>
          </View>

          <TouchableOpacity style={styles.analyticsButton}>
            <Target size={20} color={designTokens.colors.semantic.primary} />
          </TouchableOpacity>
        </View>

        {/* Overview Stats */}
        <Card style={styles.overviewCard} padding={16}>
          <View style={styles.overviewStats}>
            <View style={styles.overviewStat}>
              <AlertTriangle size={16} color={designTokens.colors.semantic.error} />
              <View style={styles.overviewStatContent}>
                <Body style={styles.overviewStatValue}>
                  {recommendations.filter(r => r.priority === 'high').length}
                </Body>
                <Caption style={styles.overviewStatLabel}>High Priority</Caption>
              </View>
            </View>

            <View style={styles.overviewStat}>
              <TrendingUp size={16} color={designTokens.colors.semantic.success} />
              <View style={styles.overviewStatContent}>
                <Body style={styles.overviewStatValue}>
                  {recommendations.filter(r => r.type === 'performance').length}
                </Body>
                <Caption style={styles.overviewStatLabel}>Performance</Caption>
              </View>
            </View>

            <View style={styles.overviewStat}>
              <DollarSign size={16} color={designTokens.colors.semantic.warning} />
              <View style={styles.overviewStatContent}>
                <Body style={styles.overviewStatValue}>
                  {recommendations.filter(r => r.type === 'pricing').length}
                </Body>
                <Caption style={styles.overviewStatLabel}>Pricing</Caption>
              </View>
            </View>

            <View style={styles.overviewStat}>
              <Camera size={16} color={designTokens.colors.semantic.accent} />
              <View style={styles.overviewStatContent}>
                <Body style={styles.overviewStatValue}>
                  {recommendations.filter(r => r.type === 'photos').length}
                </Body>
                <Caption style={styles.overviewStatLabel}>Content</Caption>
              </View>
            </View>
          </View>
        </Card>

        {/* Category Filters */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categoriesContent}
        >
          <CategoryChip type="all" label="All" count={recommendations.length} />
          <CategoryChip type="performance" label="Performance" count={recommendations.filter(r => r.type === 'performance').length} />
          <CategoryChip type="pricing" label="Pricing" count={recommendations.filter(r => r.type === 'pricing').length} />
          <CategoryChip type="photos" label="Photos" count={recommendations.filter(r => r.type === 'photos').length} />
          <CategoryChip type="content" label="Content" count={recommendations.filter(r => r.type === 'content').length} />
          <CategoryChip type="promotion" label="Promotion" count={recommendations.filter(r => r.type === 'promotion').length} />
        </ScrollView>
      </SafeAreaView>

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {filteredRecommendations.length > 0 ? (
          filteredRecommendations.map((recommendation) => (
            <RecommendationCard key={recommendation.id} recommendation={recommendation} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <CheckCircle size={64} color={designTokens.colors.semantic.success} />
            <Subheading style={styles.emptyStateTitle}>All Optimized!</Subheading>
            <Body style={styles.emptyStateText}>
              No recommendations available for the selected category. Your services are performing well!
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
  analyticsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: designTokens.colors.semantic.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...componentTokens.card.shadow,
  },
  overviewCard: {
    marginBottom: designTokens.spacing.scale.md,
  },
  overviewStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  overviewStat: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  overviewStatContent: {
    marginLeft: designTokens.spacing.scale.xs,
    alignItems: 'center',
  },
  overviewStatValue: {
    fontWeight: '600',
    marginBottom: 2,
  },
  overviewStatLabel: {
    color: designTokens.colors.semantic.textSecondary,
    textAlign: 'center',
  },
  categoriesContainer: {
    marginBottom: designTokens.spacing.scale.sm,
  },
  categoriesContent: {
    paddingRight: designTokens.spacing.scale.md,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: designTokens.colors.semantic.surface,
    paddingHorizontal: designTokens.spacing.scale.md,
    paddingVertical: designTokens.spacing.scale.sm,
    borderRadius: 20,
    marginRight: designTokens.spacing.scale.sm,
    ...componentTokens.card.shadow,
  },
  categoryChipActive: {
    backgroundColor: designTokens.colors.semantic.primary,
  },
  categoryChipText: {
    color: designTokens.colors.semantic.text,
    fontWeight: '500',
    marginRight: designTokens.spacing.scale.xs,
  },
  categoryChipTextActive: {
    color: designTokens.colors.semantic.surface,
  },
  categoryChipBadge: {
    backgroundColor: designTokens.colors.semantic.accent,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  categoryChipBadgeText: {
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
  recommendationCard: {
    marginBottom: designTokens.spacing.scale.md,
  },
  recommendationHeader: {
    marginBottom: designTokens.spacing.scale.sm,
  },
  recommendationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: designTokens.spacing.scale.xs,
  },
  recommendationTitle: {
    marginLeft: designTokens.spacing.scale.sm,
    flex: 1,
  },
  recommendationBadges: {
    flexDirection: 'row',
    gap: designTokens.spacing.scale.xs,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
  },
  effortBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  effortText: {
    fontSize: 10,
    fontWeight: '600',
  },
  serviceName: {
    color: designTokens.colors.semantic.primary,
    marginBottom: designTokens.spacing.scale.sm,
  },
  recommendationDescription: {
    marginBottom: designTokens.spacing.scale.sm,
    lineHeight: 20,
  },
  impactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: designTokens.spacing.scale.sm,
  },
  impactText: {
    marginLeft: designTokens.spacing.scale.xs,
    color: designTokens.colors.semantic.textSecondary,
  },
  valuesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: designTokens.colors.semantic.surface + '80',
    padding: designTokens.spacing.scale.sm,
    borderRadius: componentTokens.card.borderRadius,
    marginBottom: designTokens.spacing.scale.sm,
  },
  valueItem: {
    alignItems: 'center',
    flex: 1,
  },
  valueLabel: {
    color: designTokens.colors.semantic.textSecondary,
    marginBottom: 2,
  },
  currentValue: {
    fontWeight: '500',
  },
  suggestedValue: {
    fontWeight: '600',
    color: designTokens.colors.semantic.primary,
  },
  potentialContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: designTokens.spacing.scale.md,
  },
  potentialText: {
    marginLeft: designTokens.spacing.scale.xs,
    color: designTokens.colors.semantic.success,
    fontWeight: '500',
  },
  applyButton: {
    alignSelf: 'flex-start',
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
