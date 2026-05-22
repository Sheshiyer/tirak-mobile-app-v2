import { logger } from '@/utils/logger';
import { StyleSheet, Text, TouchableOpacity, View, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import React, { useState, useEffect } from 'react'
import { ArrowLeft, Save, Check } from 'lucide-react-native'
import designTokens from '@/constants/design-tokens'
import { Caption } from '@/components/ui/Typography'
import { RadialGradient } from '@/components/ui/RadialGradient';
import { Subheading } from '@/components/ui/Typography';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { changeLanguage, getCurrentLanguage } from '@/utils/i18n';



interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
}

const language = () => {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');

  // Get language options with translations
  const languages: LanguageOption[] = [
    { code: 'en', name: t('language.english'), nativeName: 'English' },
    { code: 'th', name: t('language.thai'), nativeName: 'ไทย' }
  ];

  useEffect(() => {
    // Set initial language from current i18n language
    const currentLang = getCurrentLanguage();
    setSelectedLanguage(currentLang);
  }, []);

  const handleSave = async () => {
    try {
      await changeLanguage(selectedLanguage);
      logger.log('Language changed to:', selectedLanguage);
      router.back();
    } catch (error) {
      logger.log('Error saving language:', error);
    }
  }

  const LanguageOption = ({ option }: { option: LanguageOption }) => (
    <TouchableOpacity
      style={[
        styles.languageOption,
        selectedLanguage === option.code && styles.selectedLanguageOption
      ]}
      onPress={() => setSelectedLanguage(option.code)}
    >
      <View style={styles.languageContent}>
        <View style={styles.languageInfo}>
          <Text style={styles.languageName}>{option.name}</Text>
          <Text style={styles.nativeLanguageName}>{option.nativeName}</Text>
        </View>
        {selectedLanguage === option.code && (
          <Check size={20} color={designTokens.colors.semantic.accent} />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <RadialGradient variant="appBackground" style={styles.container}>
    {/* Header */}
    <SafeAreaView edges={Platform.OS === 'web' ? [] : ['top']} style={[styles.header, Platform.OS === 'web' && styles.webHeader]}>
      <View style={styles.headerContent}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={designTokens.colors.semantic.text} />
        </TouchableOpacity>

        <View style={styles.headerTitle}>
          <Subheading style={styles.title}>{t('language.selectLanguage')}</Subheading>
          <Caption style={styles.subtitle}>{t('language.selectPreferredLanguage')}</Caption>
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Save size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>

    {/* Language Options */}
    <View style={styles.content}>
      {languages.map((lang) => (
        <LanguageOption key={lang.code} option={lang} />
      ))}
    </View>
    </RadialGradient>
  )
}

export default language

const styles = StyleSheet.create({
    container: {
        flex: 1,
      },
      header: {
        backgroundColor: 'transparent',
        paddingHorizontal: designTokens.spacing.scale.md,
      },
      webHeader: {
        paddingTop: designTokens.spacing.scale.xl,
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
      saveButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: designTokens.colors.semantic.accent,
        justifyContent: 'center',
        alignItems: 'center',
      },
      content: {
        flex: 1,
        paddingHorizontal: designTokens.spacing.scale.md,
        paddingTop: designTokens.spacing.scale.lg,
      },
      languageOption: {
        backgroundColor: '#FFFFFF',
        borderRadius: designTokens.borderRadius.md,
        marginBottom: designTokens.spacing.scale.md,
        borderWidth: 2,
        borderColor: designTokens.colors.semantic.border,
        
      },
      selectedLanguageOption: {
        borderColor: designTokens.colors.semantic.accent,
        backgroundColor: '#FFFFFF',
        borderWidth: 3,
      },
      languageContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: designTokens.spacing.scale.lg,
      },
      languageInfo: {
        flex: 1,
      },
      languageName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1A1A1A',
        marginBottom: 4,
      },
      nativeLanguageName: {
        fontSize: 14,
        color: '#666666',
      },
})