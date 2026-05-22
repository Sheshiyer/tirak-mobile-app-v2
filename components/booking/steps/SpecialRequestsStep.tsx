import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { MessageSquare, Users, Utensils, Heart, Globe } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BookingStepFooter } from '../BookingStepFooter';
import { FormField } from '@/components/ui/FormField';
import { useBookingStore } from '@/stores/booking-store';
import { designTokens, componentTokens } from '@/constants/design-tokens';
import { useTranslation } from 'react-i18next';

interface SpecialRequestsStepProps {
  onNext: () => void;
  onPrevious: () => void;
}

// Predefined request templates


export const SpecialRequestsStep: React.FC<SpecialRequestsStepProps> = ({
  onNext,
  onPrevious,
}) => {
  const { t } = useTranslation();

  const REQUEST_TEMPLATES = [
    {
      id: 'first_time',
      title: t('specialRequests.firstTimeInThailand'),
      description: t('specialRequests.firstTimeInThailandDescription'),
      icon: Globe,
    },
    {
      id: 'food_lover',
      title: t('specialRequests.foodLover'),
      description: t('specialRequests.foodLoverDescription'),
      icon: Utensils,
    },
    {
      id: 'photography',
      title: t('specialRequests.photography'),
      description: t('specialRequests.photographyDescription'),
      icon: Heart,
    },
  ];
  
  // Dietary restrictions options
  const DIETARY_OPTIONS = [
    t('specialRequests.vegetarian'),
    t('specialRequests.vegan'),
    t('specialRequests.halal'),
    t('specialRequests.noPork'),
    t('specialRequests.noBeef'),
    t('specialRequests.noSeafood'),
    t('specialRequests.glutenFree'),
    t('specialRequests.noSpicyFood'),
    t('specialRequests.mildSpiceOnly'),
    t('specialRequests.noNuts'),
    t('specialRequests.lactoseFree'),
  ];
  
  // Accessibility needs options
  const ACCESSIBILITY_OPTIONS = [
    t('specialRequests.wheelchairAccessible'),
    t('specialRequests.mobilityAssistance'),
    t('specialRequests.visualImpairmentSupport'),
    t('specialRequests.hearingImpairmentSupport'),
    t('specialRequests.elderlyFriendlyPace'),
    t('specialRequests.restBreaksNeeded'),
  ];
  
  // Language preferences
  const LANGUAGE_OPTIONS = [
    t('specialRequests.english'),
    t('specialRequests.thai'),
    t('specialRequests.chinese'),
    t('specialRequests.japanese'),
    t('specialRequests.korean'),
    t('specialRequests.german'),
    t('specialRequests.french'),
    t('specialRequests.spanish'),
  ];

  const { bookingData, updateRequests } = useBookingStore();
  
  const [specialRequests, setSpecialRequests] = useState(
    bookingData.requests.specialRequests || ''
  );
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>(
    bookingData.requests.dietaryRestrictions || []
  );
  const [accessibilityNeeds, setAccessibilityNeeds] = useState<string[]>(
    bookingData.requests.accessibilityNeeds || []
  );
  const [languagePreference, setLanguagePreference] = useState(
    bookingData.requests.languagePreference || 'English'
  );
  const [groupComposition, setGroupComposition] = useState(
    bookingData.requests.groupComposition || ''
  );

  const handleTemplateSelect = (template: typeof REQUEST_TEMPLATES[0]) => {
    setSelectedTemplate(template.id);
    setSpecialRequests(template.description);
  };

  const handleDietaryToggle = (option: string) => {
    setDietaryRestrictions(prev =>
      prev.includes(option)
        ? prev.filter(item => item !== option)
        : [...prev, option]
    );
  };

  const handleAccessibilityToggle = (option: string) => {
    setAccessibilityNeeds(prev =>
      prev.includes(option)
        ? prev.filter(item => item !== option)
        : [...prev, option]
    );
  };

  const handleNext = () => {
    // Update the store with all the collected data
    updateRequests({
      specialRequests,
      dietaryRestrictions,
      accessibilityNeeds,
      languagePreference,
      groupComposition,
    });
    
    onNext();
  };

  const getCharacterCount = () => {
    return specialRequests.length;
  };

  const isCharacterLimitExceeded = () => {
    return getCharacterCount() > 500;
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('specialRequests.tellUs')}</Text>
          <Text style={styles.subtitle}>
            {t('specialRequests.helpYourCompanion')}
          </Text>
        </View>

        {/* Quick Templates */}
        <Card style={styles.sectionCard} padding={16}>
          <View style={styles.sectionHeader}>
            <MessageSquare size={20} color={designTokens.colors.semantic.primary} />
            <Text style={styles.sectionTitle}>{t('specialRequests.quickTemplates')}</Text>
          </View>
          
          <Text style={styles.sectionSubtitle}>
            {t('specialRequests.chooseATemplate')}
          </Text>
          
          <View style={styles.templatesContainer}>
            {REQUEST_TEMPLATES.map((template) => {
              const IconComponent = template.icon;
              const isSelected = selectedTemplate === template.id;
              
              return (
                <TouchableOpacity
                  key={template.id}
                  style={[
                    styles.templateCard,
                    isSelected && styles.selectedTemplateCard,
                  ]}
                  onPress={() => handleTemplateSelect(template)}
                >
                  <View style={styles.templateIcon}>
                    <IconComponent 
                      size={20} 
                      color={isSelected 
                        ? designTokens.colors.semantic.surface 
                        : designTokens.colors.semantic.primary
                      } 
                    />
                  </View>
                  <View style={styles.templateContent}>
                    <Text style={[
                      styles.templateTitle,
                      isSelected && styles.selectedTemplateTitle,
                    ]}>
                      {template.title}
                    </Text>
                    <Text style={[
                      styles.templateDescription,
                      isSelected && styles.selectedTemplateDescription,
                    ]}>
                      {template.description}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* Custom Special Requests */}
        <Card style={styles.sectionCard} padding={16}>
          <Text style={styles.sectionTitle}>{t('specialRequests.specialRequests')}</Text>
          
          <FormField
            placeholder={t('specialRequests.specialRequestsPlaceholder')}
            value={specialRequests}
            onChangeText={setSpecialRequests}
            multiline
            numberOfLines={6}
            maxLength={500}
            style={styles.requestsInput}
          />
          
          <View style={styles.characterCount}>
            <Text style={[
              styles.characterCountText,
              isCharacterLimitExceeded() && styles.characterCountError,
            ]}>
              {getCharacterCount()}/{t('specialRequests.characters')}
            </Text>
          </View>
        </Card>

        {/* Language Preference */}
        <Card style={styles.sectionCard} padding={16}>
          <Text style={styles.sectionTitle}>{t('specialRequests.preferredLanguage')}</Text>
          
          <View style={styles.languageOptions}>
            {LANGUAGE_OPTIONS.map((language) => (
              <TouchableOpacity
                key={language}
                style={[
                  styles.languageOption,
                  languagePreference === language && styles.selectedLanguageOption,
                ]}
                onPress={() => setLanguagePreference(language)}
              >
                <Text style={[
                  styles.languageText,
                  languagePreference === language && styles.selectedLanguageText,
                ]}>
                  {language}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

       

        {/* Dietary Restrictions */}
        <Card style={styles.sectionCard} padding={16}>
          <Text style={styles.sectionTitle}>{t('specialRequests.dietaryRestrictions')}</Text>
          
          <View style={styles.optionsGrid}>
            {DIETARY_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.optionChip,
                  dietaryRestrictions.includes(option) && styles.selectedOptionChip,
                ]}
                onPress={() => handleDietaryToggle(option)}
              >
                <Text style={[
                  styles.optionText,
                  dietaryRestrictions.includes(option) && styles.selectedOptionText,
                ]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Accessibility Needs */}
        <Card style={styles.sectionCard} padding={16}>
          <Text style={styles.sectionTitle}>{t('specialRequests.accessibilityNeeds')}</Text>
          
          <View style={styles.optionsGrid}>
            {ACCESSIBILITY_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.optionChip,
                  accessibilityNeeds.includes(option) && styles.selectedOptionChip,
                ]}
                onPress={() => handleAccessibilityToggle(option)}
              >
                <Text style={[
                  styles.optionText,
                  accessibilityNeeds.includes(option) && styles.selectedOptionText,
                ]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>
      </ScrollView>

      <BookingStepFooter
        onPrevious={onPrevious}
        onNext={handleNext}
        nextTitle={t('specialRequests.continue')}
        nextDisabled={isCharacterLimitExceeded()}
        showPrevious={true}
        showNext={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: designTokens.colors.semantic.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: designTokens.spacing.scale.lg,
  },
  header: {
    paddingVertical: designTokens.spacing.scale.xl,
    alignItems: 'center',
  },
  title: {
    ...designTokens.typography.styles.heading,
    color: designTokens.colors.semantic.text,
    textAlign: 'center',
    marginBottom: designTokens.spacing.scale.sm,
  },
  subtitle: {
    ...designTokens.typography.styles.body,
    color: designTokens.colors.semantic.textSecondary,
    textAlign: 'center',
    lineHeight: designTokens.typography.lineHeights.normal * designTokens.typography.sizes.body,
  },
  sectionCard: {
    marginBottom: designTokens.spacing.scale.lg,
    borderRadius: designTokens.borderRadius.components.card,
    ...designTokens.shadows.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.scale.sm,
    marginBottom: designTokens.spacing.scale.md,
  },
  sectionTitle: {
    ...designTokens.typography.styles.subheading,
    color: designTokens.colors.semantic.text,
    marginBottom: designTokens.spacing.scale.sm,
  },
  sectionSubtitle: {
    ...designTokens.typography.styles.caption,
    color: designTokens.colors.semantic.textSecondary,
    marginBottom: designTokens.spacing.scale.md,
    lineHeight: designTokens.typography.lineHeights.normal * designTokens.typography.sizes.caption,
  },
  templatesContainer: {
    gap: designTokens.spacing.scale.sm,
  },
  templateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: designTokens.spacing.scale.lg,
    borderRadius: designTokens.borderRadius.components.button,
    borderWidth: 1,
    borderColor: designTokens.colors.semantic.border,
    backgroundColor: designTokens.colors.semantic.surface,
    minHeight: 44, // Accessibility touch target
    ...designTokens.shadows.sm,
  },
  selectedTemplateCard: {
    borderColor: designTokens.colors.semantic.primary,
    backgroundColor: designTokens.colors.semantic.primary,
    ...designTokens.shadows.md,
    transform: [{ scale: 1.02 }],
  },
  templateIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: designTokens.colors.semantic.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: designTokens.spacing.scale.md,
  },
  templateContent: {
    flex: 1,
  },
  templateTitle: {
    ...designTokens.typography.styles.subheading,
    color: designTokens.colors.semantic.text,
    marginBottom: designTokens.spacing.scale.xs,
    fontSize: designTokens.typography.sizes.body,
  },
  selectedTemplateTitle: {
    color: designTokens.colors.semantic.surface,
  },
  templateDescription: {
    ...designTokens.typography.styles.caption,
    color: designTokens.colors.semantic.textSecondary,
    lineHeight: designTokens.typography.lineHeights.normal * designTokens.typography.sizes.caption,
  },
  selectedTemplateDescription: {
    color: designTokens.colors.semantic.surface + 'CC',
  },
  requestsInput: {
    minHeight: 120,
    textAlignVertical: 'top',
    borderRadius: designTokens.borderRadius.components.input,
    ...designTokens.shadows.sm,
  },
  characterCount: {
    alignItems: 'flex-end',
    marginTop: designTokens.spacing.scale.xs,
  },
  characterCountText: {
    ...designTokens.typography.styles.caption,
    color: designTokens.colors.semantic.textSecondary,
    fontSize: designTokens.typography.sizes.small,
  },
  characterCountError: {
    color: designTokens.colors.semantic.error,
  },
  languageOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: designTokens.spacing.scale.sm,
  },
  languageOption: {
    paddingVertical: designTokens.spacing.scale.sm,
    paddingHorizontal: designTokens.spacing.scale.md,
    borderRadius: designTokens.borderRadius.components.button,
    borderWidth: 1,
    borderColor: designTokens.colors.semantic.border,
    backgroundColor: designTokens.colors.semantic.surface,
    minHeight: 44, // Accessibility touch target
    justifyContent: 'center',
    ...designTokens.shadows.sm,
  },
  selectedLanguageOption: {
    borderColor: designTokens.colors.semantic.primary,
    backgroundColor: designTokens.colors.semantic.primary,
    ...designTokens.shadows.md,
    transform: [{ scale: 1.05 }],
  },
  languageText: {
    ...designTokens.typography.styles.caption,
    fontWeight: designTokens.typography.weights.medium,
    color: designTokens.colors.semantic.text,
  },
  selectedLanguageText: {
    color: designTokens.colors.semantic.surface,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: designTokens.spacing.scale.sm,
  },
  optionChip: {
    paddingVertical: designTokens.spacing.scale.sm,
    paddingHorizontal: designTokens.spacing.scale.md,
    borderRadius: designTokens.borderRadius.components.button,
    borderWidth: 1,
    borderColor: designTokens.colors.semantic.border,
    backgroundColor: designTokens.colors.semantic.surface,
    minHeight: 44, // Accessibility touch target
    justifyContent: 'center',
    ...designTokens.shadows.sm,
  },
  selectedOptionChip: {
    borderColor: designTokens.colors.semantic.primary,
    backgroundColor: designTokens.colors.semantic.primary,
    ...designTokens.shadows.md,
    transform: [{ scale: 1.05 }],
  },
  optionText: {
    ...designTokens.typography.styles.caption,
    fontWeight: designTokens.typography.weights.medium,
    color: designTokens.colors.semantic.text,
  },
  selectedOptionText: {
    color: designTokens.colors.semantic.surface,
  },
  footer: {
    padding: designTokens.spacing.scale.lg,
    backgroundColor: designTokens.colors.semantic.surface,
    borderTopWidth: 1,
    borderTopColor: designTokens.colors.semantic.border,
    ...designTokens.shadows.sm,
  },
  footerButtons: {
    flexDirection: 'row',
    gap: designTokens.spacing.scale.md,
  },
  previousButton: {
    flex: 1,
  },
  nextButton: {
    flex: 2,
  },
});
