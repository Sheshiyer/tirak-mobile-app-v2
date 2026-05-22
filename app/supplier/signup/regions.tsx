import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { designTokens } from '@/constants/design-tokens';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { MultiSelect } from '@/components/ui/MultiSelect';
import { useSupplierStore } from '@/stores/supplier-store';
import { mockRegions } from '@/mocks/supplier-data';

export default function RegionsScreen() {
  const router = useRouter();
  const { signupData, updateSignupData } = useSupplierStore();
  
  const [error, setError] = useState<string | null>(null);
  
  const handleSelectRegion = (regionId: string) => {
    const isSelected = signupData.regions.includes(regionId);
    let newRegions: string[];
    
    if (isSelected) {
      // Remove region if already selected
      newRegions = signupData.regions.filter(id => id !== regionId);
    } else {
      // Add region if not already selected
      newRegions = [...signupData.regions, regionId];
    }
    
    updateSignupData({ regions: newRegions });
    setError(null);
  };
  
  const validate = () => {
    if (signupData.regions.length === 0) {
      setError('Please select at least one region');
      return false;
    }
    
    setError(null);
    return true;
  };
  
  const handleNext = () => {
    if (validate()) {
      updateSignupData({ step: 7 });
      router.push('/supplier/signup/availability');
    }
  };
  
  const handleBack = () => {
    router.back();
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Service Regions</Text>
          <Text style={styles.subtitle}>
            Select the regions where you offer your services. This helps customers find you in their area.
          </Text>
          
          <ProgressBar
            currentStep={7}
            totalSteps={8}
          />
        </View>
        
        <View style={styles.form}>
          <View style={styles.mapContainer}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1527525443983-6e60c75fff46?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80' }}
              style={styles.mapImage}
              resizeMode="cover"
            />
            <Text style={styles.mapCaption}>Thailand Map</Text>
          </View>
          
          <MultiSelect
            options={mockRegions}
            selectedIds={signupData.regions}
            onSelect={handleSelectRegion}
            title="Available Regions"
          />
          
          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}
          
          <View style={styles.selectedContainer}>
            <Text style={styles.selectedTitle}>Your selected regions:</Text>
            {signupData.regions.length > 0 ? (
              <View style={styles.selectedRegionsContainer}>
                {signupData.regions.map(regionId => {
                  const region = mockRegions.find(r => r.id === regionId);
                  return (
                    <View key={regionId} style={styles.selectedRegion}>
                      <Text style={styles.selectedRegionName}>{region?.name}</Text>
                    </View>
                  );
                })}
              </View>
            ) : (
              <Text style={styles.noSelectionText}>No regions selected yet</Text>
            )}
          </View>
          
          <View style={styles.infoContainer}>
            <Text style={styles.infoTitle}>Why regions matter:</Text>
            <Text style={styles.infoText}>
              Selecting regions helps customers find companions in their area. You can select multiple regions if you're willing to travel or provide services in different locations.
            </Text>
          </View>
        </View>
        
        <View style={styles.actions}>
          <Button
            title="Back"
            onPress={handleBack}
            variant="outline"
            style={styles.backButton}
          />
          <Button
            title="Next"
            onPress={handleNext}
            style={styles.nextButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: designTokens.colors.semantic.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: designTokens.colors.semantic.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: designTokens.colors.semantic.textSecondary,
    marginBottom: 16,
    lineHeight: 22,
  },
  form: {
    backgroundColor: designTokens.colors.semantic.surface,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  mapContainer: {
    marginBottom: 24,
  },
  mapImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  mapCaption: {
    fontSize: 12,
    color: designTokens.colors.semantic.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  errorText: {
    color: designTokens.colors.semantic.error,
    fontSize: 14,
    marginTop: 8,
  },
  selectedContainer: {
    marginTop: 24,
  },
  selectedTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: designTokens.colors.semantic.text,
    marginBottom: 12,
  },
  selectedRegionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectedRegion: {
    backgroundColor: designTokens.colors.semantic.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: designTokens.colors.semantic.primary,
  },
  selectedRegionName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: designTokens.colors.semantic.primary,
  },
  noSelectionText: {
    fontSize: 14,
    color: designTokens.colors.semantic.textSecondary,
    fontStyle: 'italic',
  },
  infoContainer: {
    marginTop: 24,
    backgroundColor: designTokens.colors.semantic.background,
    borderRadius: 8,
    padding: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: designTokens.colors.semantic.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: designTokens.colors.semantic.textSecondary,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 24,
    marginBottom: 16,
    gap: 12,
  },
  backButton: {
    flex: 1,
  },
  nextButton: {
    flex: 1,
  },
});