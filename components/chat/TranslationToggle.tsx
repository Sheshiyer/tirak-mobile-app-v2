import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Languages, Globe, Check } from 'lucide-react-native';
import { designTokens } from '@/constants/design-tokens';

interface TranslationToggleProps {
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
  sourceLanguage?: string;
  targetLanguage?: string;
  onLanguageSelect?: (source: string, target: string) => void;
}

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'th', name: 'Thai', flag: '🇹🇭' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
];

export const TranslationToggle: React.FC<TranslationToggleProps> = ({
  isEnabled,
  onToggle,
  sourceLanguage = 'en',
  targetLanguage = 'th',
  onLanguageSelect,
}) => {
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [selectedSource, setSelectedSource] = useState(sourceLanguage);
  const [selectedTarget, setSelectedTarget] = useState(targetLanguage);
  
  const toggleAnimation = new Animated.Value(isEnabled ? 1 : 0);

  const handleToggle = () => {
    const newEnabled = !isEnabled;
    onToggle(newEnabled);
    
    Animated.timing(toggleAnimation, {
      toValue: newEnabled ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleLanguageChange = (type: 'source' | 'target', languageCode: string) => {
    if (type === 'source') {
      setSelectedSource(languageCode);
      onLanguageSelect?.(languageCode, selectedTarget);
    } else {
      setSelectedTarget(languageCode);
      onLanguageSelect?.(selectedSource, languageCode);
    }
  };

  const swapLanguages = () => {
    const newSource = selectedTarget;
    const newTarget = selectedSource;
    setSelectedSource(newSource);
    setSelectedTarget(newTarget);
    onLanguageSelect?.(newSource, newTarget);
  };

  const getLanguageInfo = (code: string) => {
    return LANGUAGES.find(lang => lang.code === code) || LANGUAGES[0];
  };

  const sourceInfo = getLanguageInfo(selectedSource);
  const targetInfo = getLanguageInfo(selectedTarget);

  return (
    <View style={styles.container}>
      {/* Main Toggle */}
      <TouchableOpacity
        style={[
          styles.toggleContainer,
          isEnabled && styles.toggleContainerActive,
        ]}
        onPress={handleToggle}
        activeOpacity={0.8}
      >
        <View style={styles.toggleContent}>
          <View style={[
            styles.iconContainer,
            isEnabled && styles.iconContainerActive,
          ]}>
            <Languages size={18} color={
              isEnabled 
                ? designTokens.colors.semantic.primaryContrast
                : designTokens.colors.semantic.textSecondary
            } />
          </View>
          
          <Text style={[
            styles.toggleText,
            isEnabled && styles.toggleTextActive,
          ]}>
            Translation
          </Text>
          
          <Animated.View style={[
            styles.toggleSwitch,
            {
              backgroundColor: toggleAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [designTokens.colors.semantic.border, designTokens.colors.semantic.accent],
              }),
            },
          ]}>
            <Animated.View style={[
              styles.toggleThumb,
              {
                transform: [{
                  translateX: toggleAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [2, 18],
                  }),
                }],
              },
            ]} />
          </Animated.View>
        </View>
      </TouchableOpacity>

      {/* Language Selector */}
      {isEnabled && (
        <View style={styles.languageSection}>
          <TouchableOpacity
            style={styles.languageSelectorButton}
            onPress={() => setShowLanguageSelector(!showLanguageSelector)}
            activeOpacity={0.8}
          >
            <View style={styles.languageDisplay}>
              <View style={styles.languageItem}>
                <Text style={styles.languageFlag}>{sourceInfo.flag}</Text>
                <Text style={styles.languageName}>{sourceInfo.name}</Text>
              </View>
              
              <TouchableOpacity
                style={styles.swapButton}
                onPress={swapLanguages}
                activeOpacity={0.7}
              >
                <Text style={styles.swapIcon}>⇄</Text>
              </TouchableOpacity>
              
              <View style={styles.languageItem}>
                <Text style={styles.languageFlag}>{targetInfo.flag}</Text>
                <Text style={styles.languageName}>{targetInfo.name}</Text>
              </View>
            </View>
            
            <Globe size={16} color={designTokens.colors.semantic.textSecondary} />
          </TouchableOpacity>

          {/* Language Options */}
          {showLanguageSelector && (
            <View style={styles.languageOptions}>
              <Text style={styles.sectionTitle}>From:</Text>
              <View style={styles.languageGrid}>
                {LANGUAGES.map((language) => (
                  <TouchableOpacity
                    key={`source-${language.code}`}
                    style={[
                      styles.languageOption,
                      selectedSource === language.code && styles.languageOptionSelected,
                    ]}
                    onPress={() => handleLanguageChange('source', language.code)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.languageFlag}>{language.flag}</Text>
                    <Text style={[
                      styles.languageOptionText,
                      selectedSource === language.code && styles.languageOptionTextSelected,
                    ]}>
                      {language.name}
                    </Text>
                    {selectedSource === language.code && (
                      <Check size={14} color={designTokens.colors.semantic.primaryContrast} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
              
              <Text style={styles.sectionTitle}>To:</Text>
              <View style={styles.languageGrid}>
                {LANGUAGES.map((language) => (
                  <TouchableOpacity
                    key={`target-${language.code}`}
                    style={[
                      styles.languageOption,
                      selectedTarget === language.code && styles.languageOptionSelected,
                    ]}
                    onPress={() => handleLanguageChange('target', language.code)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.languageFlag}>{language.flag}</Text>
                    <Text style={[
                      styles.languageOptionText,
                      selectedTarget === language.code && styles.languageOptionTextSelected,
                    ]}>
                      {language.name}
                    </Text>
                    {selectedTarget === language.code && (
                      <Check size={14} color={designTokens.colors.semantic.primaryContrast} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: designTokens.colors.semantic.surface,
    borderRadius: designTokens.borderRadius.lg,
    margin: designTokens.spacing.md,
    ...designTokens.shadows.sm,
  },
  toggleContainer: {
    padding: designTokens.spacing.md,
    borderRadius: designTokens.borderRadius.lg,
    borderWidth: 1,
    borderColor: designTokens.colors.semantic.border,
  },
  toggleContainerActive: {
    borderColor: designTokens.colors.semantic.primary,
    backgroundColor: designTokens.colors.semantic.primary + '10',
  },
  toggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: designTokens.colors.semantic.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainerActive: {
    backgroundColor: designTokens.colors.semantic.primary,
  },
  toggleText: {
    flex: 1,
    marginLeft: designTokens.spacing.md,
    fontSize: designTokens.typography.sizes.md,
    fontWeight: designTokens.typography.weights.medium,
    color: designTokens.colors.semantic.text,
  },
  toggleTextActive: {
    color: designTokens.colors.semantic.primary,
  },
  toggleSwitch: {
    width: 40,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
  },
  toggleThumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: designTokens.colors.semantic.surface,
    ...designTokens.shadows.sm,
  },
  languageSection: {
    borderTopWidth: 1,
    borderTopColor: designTokens.colors.semantic.border,
    paddingTop: designTokens.spacing.md,
  },
  languageSelectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: designTokens.spacing.md,
    paddingVertical: designTokens.spacing.sm,
  },
  languageDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.xs,
  },
  languageFlag: {
    fontSize: designTokens.typography.sizes.md,
  },
  languageName: {
    fontSize: designTokens.typography.sizes.sm,
    fontWeight: designTokens.typography.weights.medium,
    color: designTokens.colors.semantic.text,
  },
  swapButton: {
    marginHorizontal: designTokens.spacing.md,
    padding: designTokens.spacing.xs,
  },
  swapIcon: {
    fontSize: designTokens.typography.sizes.lg,
    color: designTokens.colors.semantic.primary,
  },
  languageOptions: {
    paddingHorizontal: designTokens.spacing.md,
    paddingBottom: designTokens.spacing.md,
  },
  sectionTitle: {
    fontSize: designTokens.typography.sizes.sm,
    fontWeight: designTokens.typography.weights.semibold,
    color: designTokens.colors.semantic.text,
    marginTop: designTokens.spacing.md,
    marginBottom: designTokens.spacing.sm,
  },
  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: designTokens.spacing.xs,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.xs,
    paddingVertical: designTokens.spacing.sm,
    paddingHorizontal: designTokens.spacing.md,
    borderRadius: designTokens.borderRadius.md,
    borderWidth: 1,
    borderColor: designTokens.colors.semantic.border,
    backgroundColor: designTokens.colors.semantic.background,
    minWidth: '45%',
  },
  languageOptionSelected: {
    borderColor: designTokens.colors.semantic.primary,
    backgroundColor: designTokens.colors.semantic.primary,
  },
  languageOptionText: {
    flex: 1,
    fontSize: designTokens.typography.sizes.sm,
    color: designTokens.colors.semantic.text,
  },
  languageOptionTextSelected: {
    color: designTokens.colors.semantic.primaryContrast,
  },
});
