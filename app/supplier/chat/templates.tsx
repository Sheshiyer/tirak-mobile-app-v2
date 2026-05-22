import { logger } from '@/utils/logger';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Copy,
  Search,
  MessageCircle,
  Clock,
  Star,
  Calendar,
  MapPin,
  DollarSign,
  Users,
  CheckCircle,
} from 'lucide-react-native';
import { RadialGradient } from '@/components/ui/RadialGradient';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Heading, Subheading, Body, Caption } from '@/components/ui/Typography';
import { designTokens, componentTokens } from '@/constants/design-tokens';

interface MessageTemplate {
  id: string;
  title: string;
  content: string;
  category: 'greeting' | 'booking' | 'pricing' | 'availability' | 'follow_up' | 'cancellation';
  usageCount: number;
  lastUsed: string;
  isDefault: boolean;
  variables: string[]; // e.g., ['customerName', 'serviceName', 'date']
}

export default function ChatTemplatesScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Mock templates data
  const [templates] = useState<MessageTemplate[]>([
    {
      id: 'tpl-001',
      title: 'Welcome Greeting',
      content: 'Hello {{customerName}}! Thank you for your interest in {{serviceName}}. I\'m excited to help you plan an amazing experience in Bangkok!',
      category: 'greeting',
      usageCount: 45,
      lastUsed: '2 hours ago',
      isDefault: true,
      variables: ['customerName', 'serviceName'],
    },
    {
      id: 'tpl-002',
      title: 'Booking Confirmation',
      content: 'Great! I\'ve confirmed your booking for {{serviceName}} on {{date}} at {{time}}. The total cost is {{price}} for {{guests}} people. I\'ll send you the meeting point details shortly.',
      category: 'booking',
      usageCount: 32,
      lastUsed: '1 day ago',
      isDefault: true,
      variables: ['serviceName', 'date', 'time', 'price', 'guests'],
    },
    {
      id: 'tpl-003',
      title: 'Pricing Information',
      content: 'The price for {{serviceName}} is {{price}} per person. This includes {{inclusions}}. For groups of {{minGroup}}+ people, we offer a {{discount}}% discount.',
      category: 'pricing',
      usageCount: 28,
      lastUsed: '3 hours ago',
      isDefault: false,
      variables: ['serviceName', 'price', 'inclusions', 'minGroup', 'discount'],
    },
    {
      id: 'tpl-004',
      title: 'Availability Check',
      content: 'Let me check our availability for {{date}}. I have the following time slots available: {{timeSlots}}. Which one works best for you?',
      category: 'availability',
      usageCount: 19,
      lastUsed: '5 hours ago',
      isDefault: false,
      variables: ['date', 'timeSlots'],
    },
    {
      id: 'tpl-005',
      title: 'Follow-up After Service',
      content: 'Hi {{customerName}}! I hope you enjoyed the {{serviceName}} experience today. I\'d love to hear your feedback and would be grateful if you could leave a review. Thank you!',
      category: 'follow_up',
      usageCount: 15,
      lastUsed: '1 week ago',
      isDefault: false,
      variables: ['customerName', 'serviceName'],
    },
    {
      id: 'tpl-006',
      title: 'Cancellation Policy',
      content: 'I understand you need to cancel your booking for {{serviceName}} on {{date}}. Our cancellation policy allows full refund if cancelled {{hours}} hours before the tour. Would you like to reschedule instead?',
      category: 'cancellation',
      usageCount: 8,
      lastUsed: '3 days ago',
      isDefault: false,
      variables: ['serviceName', 'date', 'hours'],
    },
    {
      id: 'tpl-007',
      title: 'Weather Update',
      content: 'Hi {{customerName}}! There\'s a chance of rain tomorrow for our {{serviceName}}. Don\'t worry - we have covered areas and umbrellas. The tour will still be amazing! See you at {{time}}.',
      category: 'booking',
      usageCount: 12,
      lastUsed: '2 days ago',
      isDefault: false,
      variables: ['customerName', 'serviceName', 'time'],
    },
    {
      id: 'tpl-008',
      title: 'Meeting Point Instructions',
      content: 'For tomorrow\'s {{serviceName}}, please meet me at {{location}}. Look for someone wearing a {{identifier}}. My phone number is {{phone}} if you need to reach me. See you at {{time}}!',
      category: 'booking',
      usageCount: 25,
      lastUsed: '6 hours ago',
      isDefault: true,
      variables: ['serviceName', 'location', 'identifier', 'phone', 'time'],
    },
  ]);

  const categories = [
    { key: 'all', label: 'All Templates', icon: MessageCircle },
    { key: 'greeting', label: 'Greetings', icon: Users },
    { key: 'booking', label: 'Bookings', icon: Calendar },
    { key: 'pricing', label: 'Pricing', icon: DollarSign },
    { key: 'availability', label: 'Availability', icon: Clock },
    { key: 'follow_up', label: 'Follow-up', icon: Star },
    { key: 'cancellation', label: 'Cancellation', icon: MapPin },
  ];

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'greeting': return designTokens.colors.semantic.success;
      case 'booking': return designTokens.colors.semantic.primary;
      case 'pricing': return designTokens.colors.semantic.warning;
      case 'availability': return designTokens.colors.semantic.accent;
      case 'follow_up': return '#FFD700';
      case 'cancellation': return designTokens.colors.semantic.error;
      default: return designTokens.colors.semantic.textSecondary;
    }
  };

  const handleUseTemplate = (template: MessageTemplate) => {
    Alert.alert(
      'Use Template',
      `Copy "${template.title}" to clipboard?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Copy', onPress: () => {
          // In a real app, this would copy to clipboard
          logger.log('Copying template:', template.content); 
          Alert.alert('Copied!', 'Template copied to clipboard');
        }},
      ]
    );
  };

  const handleEditTemplate = (templateId: string) => {
    router.push("/supplier/chat/templates");
  };

  const handleDeleteTemplate = (templateId: string) => {
    Alert.alert(
      'Delete Template',
      'Are you sure you want to delete this template?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => {
          logger.log('Deleting template:', templateId);
        }},
      ]
    );
  };

  const TemplateCard = ({ template }: { template: MessageTemplate }) => (
    <Card style={styles.templateCard} padding={16}>
      <View style={styles.templateHeader}>
        <View style={styles.templateTitleRow}>
          <Subheading style={styles.templateTitle}>{template.title}</Subheading>
          {template.isDefault && (
            <View style={styles.defaultBadge}>
              <CheckCircle size={12} color={designTokens.colors.semantic.success} />
              <Caption style={styles.defaultText}>Default</Caption>
            </View>
          )}
        </View>
        
        <View style={styles.templateActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleUseTemplate(template)}
          >
            <Copy size={16} color={designTokens.colors.semantic.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEditTemplate(template.id)}
          >
            <Edit size={16} color={designTokens.colors.semantic.accent} />
          </TouchableOpacity>
          {!template.isDefault && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDeleteTemplate(template.id)}
            >
              <Trash2 size={16} color={designTokens.colors.semantic.error} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <Body style={styles.templateContent} numberOfLines={3}>
        {template.content}
      </Body>

      <View style={styles.templateMeta}>
        <View style={styles.templateCategory}>
          <View style={[
            styles.categoryDot,
            { backgroundColor: getCategoryColor(template.category) }
          ]} />
          <Caption style={styles.categoryText}>
            {template.category.replace('_', ' ').toUpperCase()}
          </Caption>
        </View>

        <View style={styles.templateStats}>
          <Caption style={styles.statText}>Used {template.usageCount} times</Caption>
          <Caption style={styles.statText}>•</Caption>
          <Caption style={styles.statText}>{template.lastUsed}</Caption>
        </View>
      </View>

      {template.variables.length > 0 && (
        <View style={styles.variablesContainer}>
          <Caption style={styles.variablesLabel}>Variables:</Caption>
          <View style={styles.variablesList}>
            {template.variables.map((variable, index) => (
              <View key={index} style={styles.variableChip}>
                <Caption style={styles.variableText}>{`{{${variable}}}`}</Caption>
              </View>
            ))}
          </View>
        </View>
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
            <Heading style={styles.title}>Message Templates</Heading>
            <Caption style={styles.subtitle}>Quick responses for common inquiries</Caption>
          </View>

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/supplier/chat/templates')}
          >
            <Plus size={20} color={designTokens.colors.semantic.surface} />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Search size={20} color={designTokens.colors.semantic.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search templates..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={designTokens.colors.semantic.textSecondary}
            />
          </View>
        </View>

        {/* Category Filter */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoryFilter}
          contentContainerStyle={styles.categoryFilterContent}
        >
          {categories.map((category) => {
            const IconComponent = category.icon;
            const isSelected = selectedCategory === category.key;
            
            return (
              <TouchableOpacity
                key={category.key}
                style={[
                  styles.categoryChip,
                  isSelected && styles.categoryChipActive
                ]}
                onPress={() => setSelectedCategory(category.key)}
              >
                <IconComponent 
                  size={16} 
                  color={isSelected ? designTokens.colors.semantic.surface : designTokens.colors.semantic.primary} 
                />
                <Text style={[
                  styles.categoryChipText,
                  isSelected && styles.categoryChipTextActive
                ]}>
                  {category.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </SafeAreaView>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Templates List */}
        <View style={styles.templatesSection}>
          <View style={styles.templatesHeader}>
            <Subheading style={styles.templatesTitle}>
              Templates ({filteredTemplates.length})
            </Subheading>
          </View>
          
          {filteredTemplates.length > 0 ? (
            <View style={styles.templatesList}>
              {filteredTemplates.map((template) => (
                <TemplateCard key={template.id} template={template} />
              ))}
            </View>
          ) : (
            <Card style={styles.emptyState} padding={24}>
              <MessageCircle size={48} color={designTokens.colors.semantic.textSecondary} />
              <Body style={styles.emptyStateText}>No templates found</Body>
              <Caption style={styles.emptyStateSubtext}>
                {searchQuery ? 'Try adjusting your search terms' : 'Create your first template to get started'}
              </Caption>
              <Button
                title="Create Template"
                onPress={() => router.push('/supplier/chat/templates')}
                style={styles.createButton}
                icon={<Plus size={16} color={designTokens.colors.semantic.surface} />}
              />
            </Card>
          )}
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
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: designTokens.colors.semantic.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...componentTokens.card.shadow,
  },
  searchContainer: {
    marginBottom: designTokens.spacing.scale.md,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: designTokens.colors.semantic.surface,
    borderRadius: 24,
    paddingHorizontal: designTokens.spacing.scale.md,
    paddingVertical: designTokens.spacing.scale.sm,
    ...componentTokens.card.shadow,
  },
  searchInput: {
    flex: 1,
    marginLeft: designTokens.spacing.scale.sm,
    fontSize: 16,
    color: designTokens.colors.semantic.text,
  },
  categoryFilter: {
    marginBottom: designTokens.spacing.scale.sm,
  },
  categoryFilterContent: {
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
    marginLeft: designTokens.spacing.scale.xs,
    color: designTokens.colors.semantic.text,
    fontWeight: '500',
    fontSize: 14,
  },
  categoryChipTextActive: {
    color: designTokens.colors.semantic.surface,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: designTokens.spacing.scale.md,
    paddingTop: 0,
  },
  templatesSection: {
    marginBottom: designTokens.spacing.scale.xl,
  },
  templatesHeader: {
    marginBottom: designTokens.spacing.scale.md,
  },
  templatesTitle: {
    marginBottom: designTokens.spacing.scale.xs,
  },
  templatesList: {
    gap: designTokens.spacing.scale.md,
  },
  templateCard: {
    marginBottom: 0,
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: designTokens.spacing.scale.sm,
  },
  templateTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  templateTitle: {
    flex: 1,
    marginRight: designTokens.spacing.scale.sm,
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: designTokens.colors.semantic.success + '20',
    paddingHorizontal: designTokens.spacing.scale.sm,
    paddingVertical: designTokens.spacing.scale.xs,
    borderRadius: 12,
  },
  defaultText: {
    marginLeft: designTokens.spacing.scale.xs,
    color: designTokens.colors.semantic.success,
    fontWeight: '500',
    fontSize: 10,
  },
  templateActions: {
    flexDirection: 'row',
    gap: designTokens.spacing.scale.xs,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: designTokens.colors.semantic.surface + '80',
    justifyContent: 'center',
    alignItems: 'center',
  },
  templateContent: {
    color: designTokens.colors.semantic.textSecondary,
    lineHeight: 20,
    marginBottom: designTokens.spacing.scale.md,
  },
  templateMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: designTokens.spacing.scale.sm,
  },
  templateCategory: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: designTokens.spacing.scale.xs,
  },
  categoryText: {
    color: designTokens.colors.semantic.textSecondary,
    fontSize: 10,
    fontWeight: '600',
  },
  templateStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.scale.xs,
  },
  statText: {
    color: designTokens.colors.semantic.textSecondary,
    fontSize: 11,
  },
  variablesContainer: {
    paddingTop: designTokens.spacing.scale.sm,
    borderTopWidth: 1,
    borderTopColor: designTokens.colors.semantic.border,
  },
  variablesLabel: {
    color: designTokens.colors.semantic.textSecondary,
    marginBottom: designTokens.spacing.scale.xs,
    fontWeight: '500',
  },
  variablesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: designTokens.spacing.scale.xs,
  },
  variableChip: {
    backgroundColor: designTokens.colors.semantic.primary + '20',
    paddingHorizontal: designTokens.spacing.scale.sm,
    paddingVertical: designTokens.spacing.scale.xs,
    borderRadius: 8,
  },
  variableText: {
    color: designTokens.colors.semantic.primary,
    fontWeight: '500',
    fontSize: 11,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: designTokens.spacing.scale.xl,
  },
  emptyStateText: {
    marginTop: designTokens.spacing.scale.md,
    marginBottom: designTokens.spacing.scale.sm,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    textAlign: 'center',
    color: designTokens.colors.semantic.textSecondary,
    marginBottom: designTokens.spacing.scale.lg,
  },
  createButton: {
    alignSelf: 'center',
  },
});
