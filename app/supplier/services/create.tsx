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
  ArrowRight,
  Star,
  MapPin,
  Clock,
  DollarSign,
  Camera,
  Calendar,
  CheckCircle,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { RadialGradient } from '@/components/ui/RadialGradient';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Heading, Subheading, Body, Caption } from '@/components/ui/Typography';
import { designTokens, componentTokens } from '@/constants/design-tokens';

interface ServiceFormData {
  // Basic Information
  name: string;
  description: string;
  category: string;
  subcategory: string;
  
  // Pricing
  basePrice: number;
  currency: 'THB';
  priceType: 'per_person' | 'per_group';
  maxGroupSize: number;
  
  // Duration & Timing
  duration: number; // hours
  durationUnit: 'hours' | 'days';
  timeSlots: string[];
  
  // Location
  meetingType: 'fixed' | 'flexible' | 'pickup';
  meetingPoint: string;
  serviceArea: string;
  travelRadius: number; // km
  
  // Media
  photos: string[];
  coverPhoto: string;
  
  // Availability
  availableDays: string[];
  timeRanges: Array<{ start: string; end: string }>;
  advanceBooking: number; // days
  
  // Additional Details
  included: string[];
  excluded: string[];
  requirements: string[];
  languages: string[];
  difficulty: 'easy' | 'moderate' | 'challenging';
  ageRestriction: string;
}

const SERVICE_CATEGORIES = [
  { id: 'cultural_tours', name: 'Cultural Tours', icon: '🏛️' },
  { id: 'culinary_experiences', name: 'Culinary Experiences', icon: '🍜' },
  { id: 'adventure_activities', name: 'Adventure Activities', icon: '🏔️' },
  { id: 'wellness_spa', name: 'Wellness & Spa', icon: '🧘' },
  { id: 'shopping_tours', name: 'Shopping Tours', icon: '🛍️' },
  { id: 'nightlife_entertainment', name: 'Evening Activities', icon: '🌃' },
  { id: 'nature_wildlife', name: 'Nature & Wildlife', icon: '🌿' },
  { id: 'photography_tours', name: 'Photography Tours', icon: '📸' },
];

const STEP_TITLES = [
  'Basic Information',
  'Category & Type',
  'Pricing Details',
  'Duration & Timing',
  'Location Setup',
  'Photos & Media',
  'Availability',
  'Final Review',
];

export default function ServiceCreateScreen() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<ServiceFormData>({
    name: '',
    description: '',
    category: '',
    subcategory: '',
    basePrice: 0,
    currency: 'THB',
    priceType: 'per_person',
    maxGroupSize: 8,
    duration: 3,
    durationUnit: 'hours',
    timeSlots: [],
    meetingType: 'fixed',
    meetingPoint: '',
    serviceArea: 'Bangkok',
    travelRadius: 10,
    photos: [],
    coverPhoto: '',
    availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    timeRanges: [{ start: '09:00', end: '17:00' }],
    advanceBooking: 1,
    included: [],
    excluded: [],
    requirements: [],
    languages: ['English', 'Thai'],
    difficulty: 'easy',
    ageRestriction: 'All ages welcome',
  });

  const updateFormData = (field: keyof ServiceFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < STEP_TITLES.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      router.back();
    }
  };

  const handleSubmit = () => {
    // In a real app, this would submit to an API
    logger.log('Creating service:', formData);
    Alert.alert(
      'Service Created!',
      'Your new service has been created successfully.',
      [
        {
          text: 'OK',
          onPress: () => router.replace('/supplier/services'),
        },
      ]
    );
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 0: // Basic Information
        return formData.name.trim() && formData.description.trim();
      case 1: // Category
        return formData.category && formData.subcategory;
      case 2: // Pricing
        return formData.basePrice > 0;
      case 3: // Duration
        return formData.duration > 0;
      case 4: // Location
        return formData.meetingPoint.trim();
      case 5: // Photos
        return formData.photos.length > 0;
      case 6: // Availability
        return formData.availableDays.length > 0;
      default:
        return true;
    }
  };

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressBar}>
        <LinearGradient
          colors={[designTokens.colors.semantic.primary, designTokens.colors.semantic.accent]}
          style={[styles.progressFill, { width: `${((currentStep + 1) / STEP_TITLES.length) * 100}%` }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
      </View>
      <Caption style={styles.progressText}>
        Step {currentStep + 1} of {STEP_TITLES.length}
      </Caption>
    </View>
  );

  const renderBasicInformation = () => (
    <View style={styles.stepContent}>
      <Heading style={styles.stepTitle}>Basic Information</Heading>
      <Caption style={styles.stepSubtitle}>
        Tell us about your service and what makes it special
      </Caption>

      <View style={styles.inputGroup}>
        <Body style={styles.inputLabel}>Service Name *</Body>
        <TextInput
          style={styles.textInput}
          placeholder="e.g., Bangkok Street Food Adventure"
          value={formData.name}
          onChangeText={(text) => updateFormData('name', text)}
          maxLength={100}
        />
        <Caption style={styles.characterCount}>
          {formData.name.length}/100 characters
        </Caption>
      </View>

      <View style={styles.inputGroup}>
        <Body style={styles.inputLabel}>Description *</Body>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          placeholder="Describe your service, what customers will experience, and what makes it unique..."
          value={formData.description}
          onChangeText={(text) => updateFormData('description', text)}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          maxLength={500}
        />
        <Caption style={styles.characterCount}>
          {formData.description.length}/500 characters
        </Caption>
      </View>
    </View>
  );

  const renderCategorySelection = () => (
    <View style={styles.stepContent}>
      <Heading style={styles.stepTitle}>Category & Type</Heading>
      <Caption style={styles.stepSubtitle}>
        Choose the category that best describes your service
      </Caption>

      <View style={styles.categoryGrid}>
        {SERVICE_CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryCard,
              formData.category === category.id && styles.categoryCardSelected
            ]}
            onPress={() => updateFormData('category', category.id)}
          >
            <Text style={styles.categoryIcon}>{category.icon}</Text>
            <Body style={[
              styles.categoryName,
              formData.category === category.id && styles.categoryNameSelected
            ]}>
              {category.name}
            </Body>
          </TouchableOpacity>
        ))}
      </View>

      {formData.category && (
        <View style={styles.inputGroup}>
          <Body style={styles.inputLabel}>Specific Type</Body>
          <TextInput
            style={styles.textInput}
            placeholder="e.g., Traditional Market Tour, Cooking Class, etc."
            value={formData.subcategory}
            onChangeText={(text) => updateFormData('subcategory', text)}
          />
        </View>
      )}
    </View>
  );

  const renderPricingDetails = () => (
    <View style={styles.stepContent}>
      <Heading style={styles.stepTitle}>Pricing Details</Heading>
      <Caption style={styles.stepSubtitle}>
        Set your pricing structure and group size limits
      </Caption>

      <View style={styles.pricingContainer}>
        <View style={styles.priceInputContainer}>
          <DollarSign size={20} color={designTokens.colors.semantic.primary} />
          <TextInput
            style={styles.priceInput}
            placeholder="0"
            value={formData.basePrice.toString()}
            onChangeText={(text) => updateFormData('basePrice', parseInt(text) || 0)}
            keyboardType="numeric"
          />
          <Text style={styles.currencyText}>THB</Text>
        </View>
      </View>

      <View style={styles.pricingOptions}>
        <TouchableOpacity
          style={[
            styles.pricingOption,
            formData.priceType === 'per_person' && styles.pricingOptionSelected
          ]}
          onPress={() => updateFormData('priceType', 'per_person')}
        >
          <Body style={[
            styles.pricingOptionText,
            formData.priceType === 'per_person' && styles.pricingOptionTextSelected
          ]}>
            Per Person
          </Body>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.pricingOption,
            formData.priceType === 'per_group' && styles.pricingOptionSelected
          ]}
          onPress={() => updateFormData('priceType', 'per_group')}
        >
          <Body style={[
            styles.pricingOptionText,
            formData.priceType === 'per_group' && styles.pricingOptionTextSelected
          ]}>
            Per Group
          </Body>
        </TouchableOpacity>
      </View>

      <View style={styles.inputGroup}>
        <Body style={styles.inputLabel}>Maximum Group Size</Body>
        <View style={styles.numberInputContainer}>
          <TouchableOpacity
            style={styles.numberButton}
            onPress={() => updateFormData('maxGroupSize', Math.max(1, formData.maxGroupSize - 1))}
          >
            <Text style={styles.numberButtonText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.numberValue}>{formData.maxGroupSize}</Text>
          <TouchableOpacity
            style={styles.numberButton}
            onPress={() => updateFormData('maxGroupSize', Math.min(20, formData.maxGroupSize + 1))}
          >
            <Text style={styles.numberButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return renderBasicInformation();
      case 1:
        return renderCategorySelection();
      case 2:
        return renderPricingDetails();
      default:
        return (
          <View style={styles.stepContent}>
            <Heading style={styles.stepTitle}>{STEP_TITLES[currentStep]}</Heading>
            <Body style={styles.placeholderText}>
              Step {currentStep + 1} content will be implemented here
            </Body>
          </View>
        );
    }
  };

  return (
    <RadialGradient variant="appBackground" style={styles.container}>
      {/* Header */}
      <SafeAreaView edges={['top']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <ArrowLeft size={24} color={designTokens.colors.semantic.text} />
          </TouchableOpacity>
          
          <View style={styles.headerTitle}>
            <Subheading style={styles.title}>Create New Service</Subheading>
            <Caption style={styles.subtitle}>{STEP_TITLES[currentStep]}</Caption>
          </View>
        </View>

        {renderProgressBar()}
      </SafeAreaView>

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Card style={styles.stepCard} padding={24}>
          {renderCurrentStep()}
        </Card>
      </ScrollView>

      {/* Footer */}
      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <View style={styles.footerButtons}>
          <Button
            title="Next"
            onPress={handleNext}
            disabled={!isStepValid()}
            style={styles.nextButton}
            icon={currentStep === STEP_TITLES.length - 1 ? 
              <CheckCircle size={16} color={designTokens.colors.semantic.surface} /> :
              <ArrowRight size={16} color={designTokens.colors.semantic.surface} />
            }
          />
        </View>
      </SafeAreaView>
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
  progressContainer: {
    marginBottom: designTokens.spacing.scale.md,
  },
  progressBar: {
    height: 4,
    backgroundColor: designTokens.colors.semantic.surface + '40',
    borderRadius: 2,
    marginBottom: designTokens.spacing.scale.xs,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    textAlign: 'center',
    color: designTokens.colors.semantic.textSecondary,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: designTokens.spacing.scale.md,
    paddingBottom: designTokens.spacing.scale.xl,
  },
  stepCard: {
    marginBottom: designTokens.spacing.scale.md,
  },
  stepContent: {
    gap: designTokens.spacing.scale.lg,
  },
  stepTitle: {
    textAlign: 'center',
    marginBottom: designTokens.spacing.scale.xs,
  },
  stepSubtitle: {
    textAlign: 'center',
    color: designTokens.colors.semantic.textSecondary,
    marginBottom: designTokens.spacing.scale.lg,
  },
  inputGroup: {
    gap: designTokens.spacing.scale.sm,
  },
  inputLabel: {
    fontWeight: '500',
    color: designTokens.colors.semantic.text,
  },
  textInput: {
    backgroundColor: designTokens.colors.semantic.surface,
    borderRadius: componentTokens.card.borderRadius,
    padding: designTokens.spacing.scale.md,
    fontSize: 16,
    color: designTokens.colors.semantic.text,
    borderWidth: 1,
    borderColor: designTokens.colors.semantic.border,
  },
  textArea: {
    minHeight: 120,
  },
  characterCount: {
    textAlign: 'right',
    color: designTokens.colors.semantic.textSecondary,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: designTokens.spacing.scale.sm,
  },
  categoryCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: designTokens.colors.semantic.surface,
    padding: designTokens.spacing.scale.md,
    borderRadius: componentTokens.card.borderRadius,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    ...componentTokens.card.shadow,
  },
  categoryCardSelected: {
    borderColor: designTokens.colors.semantic.primary,
    backgroundColor: designTokens.colors.semantic.primary + '10',
  },
  categoryIcon: {
    fontSize: 32,
    marginBottom: designTokens.spacing.scale.sm,
  },
  categoryName: {
    textAlign: 'center',
    fontWeight: '500',
  },
  categoryNameSelected: {
    color: designTokens.colors.semantic.primary,
    fontWeight: '600',
  },
  pricingContainer: {
    alignItems: 'center',
    marginBottom: designTokens.spacing.scale.lg,
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: designTokens.colors.semantic.surface,
    borderRadius: componentTokens.card.borderRadius,
    padding: designTokens.spacing.scale.md,
    borderWidth: 2,
    borderColor: designTokens.colors.semantic.primary + '40',
    ...componentTokens.card.shadow,
  },
  priceInput: {
    fontSize: 24,
    fontWeight: '600',
    color: designTokens.colors.semantic.text,
    marginHorizontal: designTokens.spacing.scale.sm,
    minWidth: 100,
    textAlign: 'center',
  },
  currencyText: {
    fontSize: 18,
    fontWeight: '500',
    color: designTokens.colors.semantic.primary,
  },
  pricingOptions: {
    flexDirection: 'row',
    gap: designTokens.spacing.scale.sm,
    marginBottom: designTokens.spacing.scale.lg,
  },
  pricingOption: {
    flex: 1,
    backgroundColor: designTokens.colors.semantic.surface,
    padding: designTokens.spacing.scale.md,
    borderRadius: componentTokens.card.borderRadius,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  pricingOptionSelected: {
    borderColor: designTokens.colors.semantic.primary,
    backgroundColor: designTokens.colors.semantic.primary + '10',
  },
  pricingOptionText: {
    fontWeight: '500',
  },
  pricingOptionTextSelected: {
    color: designTokens.colors.semantic.primary,
    fontWeight: '600',
  },
  numberInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: designTokens.spacing.scale.md,
  },
  numberButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: designTokens.colors.semantic.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberButtonText: {
    color: designTokens.colors.semantic.surface,
    fontSize: 20,
    fontWeight: '600',
  },
  numberValue: {
    fontSize: 20,
    fontWeight: '600',
    color: designTokens.colors.semantic.text,
    minWidth: 40,
    textAlign: 'center',
  },
  placeholderText: {
    textAlign: 'center',
    color: designTokens.colors.semantic.textSecondary,
    fontStyle: 'italic',
  },
  footer: {
    backgroundColor: designTokens.colors.semantic.surface,
    paddingHorizontal: designTokens.spacing.scale.md,
    paddingTop: designTokens.spacing.scale.md,
    ...componentTokens.card.shadow,
  },
  footerButtons: {
    flexDirection: 'row',
  },
  nextButton: {
    flex: 1,
  },
});
