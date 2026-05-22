import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ExpoImagePicker from 'expo-image-picker';
import { designTokens, componentTokens } from '@/constants/design-tokens';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ImagePicker } from '@/components/ui/ImagePicker';
import { RadialGradient } from '@/components/ui/RadialGradient';
import { Heading, Subheading, Body, Caption } from '@/components/ui/Typography';
import { useSupplierStore } from '@/stores/supplier-store';

export default function PhotosScreen() {
  const router = useRouter();
  const { signupData, updateSignupData } = useSupplierStore();

  const [error, setError] = useState<string | null>(null);

  // Animation values for organic motion
  const shakeAnimation = useRef(new Animated.Value(0)).current;
  const addPhotoAnimation = useRef(new Animated.Value(0)).current;

  const handleAddImage = async () => {
    // Trigger add photo animation
    Animated.sequence([
      Animated.timing(addPhotoAnimation, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(addPhotoAnimation, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    if (signupData.photos.length >= 5) {
      setError('You can only upload up to 5 photos for your Cultural Guide portfolio');
      // Trigger shake animation for error
      Animated.sequence([
        Animated.timing(shakeAnimation, {
          toValue: 10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnimation, {
          toValue: -10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnimation, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    const permission = await ExpoImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photo access needed', 'Please allow photo library access to add portfolio photos.');
      return;
    }

    const result = await ExpoImagePicker.launchImageLibraryAsync({
      mediaTypes: ExpoImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: Math.max(1, 5 - signupData.photos.length),
      quality: 0.85,
    });

    if (!result.canceled && result.assets?.length) {
      const selectedImages = result.assets.map(asset => asset.uri).filter(Boolean);
      updateSignupData({
        photos: [...signupData.photos, ...selectedImages].slice(0, 5),
      });
      setError(null);
    }
  };
  
  const handleRemoveImage = (index: number) => {
    const newPhotos = [...signupData.photos];
    newPhotos.splice(index, 1);
    updateSignupData({ photos: newPhotos });
    setError(null);
  };
  
  const validate = () => {
    if (signupData.photos.length === 0) {
      setError('Please upload at least one photo to showcase your Cultural Guide services');
      // Trigger shake animation for error
      Animated.sequence([
        Animated.timing(shakeAnimation, {
          toValue: 10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnimation, {
          toValue: -10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnimation, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
      return false;
    }

    setError(null);
    return true;
  };

  const handleNext = () => {
    if (validate()) {
      updateSignupData({ step: 4 });
      router.push('/supplier/signup/categories');
    }
  };

  const handleBack = () => {
    router.back();
  };
  
  return (
    <RadialGradient variant="appBackground" style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <Animated.ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          style={{ transform: [{ translateX: shakeAnimation }] }}
        >
          <View style={styles.header}>
            <Heading level={1} style={styles.title}>
              Cultural Guide Portfolio
            </Heading>
            <Subheading style={styles.subtitle}>
              Showcase your expertise with high-quality photos of Thai cultural sites, local experiences, and yourself as a professional guide.
            </Subheading>

            <ProgressBar
              currentStep={3}
              totalSteps={8}
              variant="gradient"
            />
          </View>

          <View style={styles.form}>
            <Animated.View
              style={[
                styles.imagePickerContainer,
                { transform: [{ scale: addPhotoAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 0.98]
                })}] }
              ]}
            >
              <ImagePicker
                images={signupData.photos}
                onImageAdd={handleAddImage}
                onImageRemove={handleRemoveImage}
                maxImages={5}
                title="Cultural Guide Portfolio"
                placeholder="Add photos showcasing Thai cultural sites, local experiences, and your guiding expertise"
              />
            </Animated.View>

            {error && (
              <Body style={styles.errorText}>{error}</Body>
            )}

            <View style={styles.tipsContainer}>
              <Subheading level={3} style={styles.tipsTitle}>
                Portfolio Guidelines:
              </Subheading>
              <View style={styles.tipItem}>
                <View style={styles.tipBullet} />
                <Caption style={styles.tipText}>Include professional photos of yourself as a Cultural Guide</Caption>
              </View>
              <View style={styles.tipItem}>
                <View style={styles.tipBullet} />
                <Caption style={styles.tipText}>Showcase Thai temples, markets, and cultural sites you know well</Caption>
              </View>
              <View style={styles.tipItem}>
                <View style={styles.tipBullet} />
                <Caption style={styles.tipText}>Highlight unique local experiences you can provide</Caption>
              </View>
              <View style={styles.tipItem}>
                <View style={styles.tipBullet} />
                <Caption style={styles.tipText}>Use high-quality, well-lit images that represent Thailand</Caption>
              </View>
              <View style={styles.tipItem}>
                <View style={styles.tipBullet} />
                <Caption style={styles.tipText}>Your first photo becomes your main profile image</Caption>
              </View>
            </View>
          </View>

          <View style={styles.actions}>
            <Button
              title="Back"
              onPress={handleBack}
              variant="coralOutline"
              style={styles.backButton}
              size="large"
            />
            <Button
              title="Continue"
              onPress={handleNext}
              variant="coral"
              style={styles.nextButton}
              size="large"
            />
          </View>
        </Animated.ScrollView>
      </SafeAreaView>
    </RadialGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: designTokens.spacing.scale.lg,
    paddingTop: designTokens.spacing.scale.xl,
  },
  header: {
    marginBottom: designTokens.spacing.scale.xl,
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: designTokens.spacing.scale.sm,
    color: designTokens.colors.semantic.text,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: designTokens.spacing.scale.lg,
    color: designTokens.colors.semantic.textSecondary,
    lineHeight: 22,
  },
  form: {
    backgroundColor: designTokens.colors.semantic.surface,
    borderRadius: 16,
    padding: designTokens.spacing.scale.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: designTokens.spacing.scale.lg,
  },
  imagePickerContainer: {
    marginBottom: designTokens.spacing.scale.md,
  },
  errorText: {
    color: designTokens.colors.semantic.error,
    marginTop: designTokens.spacing.scale.sm,
    marginBottom: designTokens.spacing.scale.sm,
  },
  tipsContainer: {
    marginTop: designTokens.spacing.scale.xl,
    backgroundColor: designTokens.colors.semantic.primary + '08',
    borderRadius: 12,
    padding: designTokens.spacing.scale.lg,
    borderWidth: 1,
    borderColor: designTokens.colors.semantic.primary + '15',
  },
  tipsTitle: {
    marginBottom: designTokens.spacing.scale.md,
    color: designTokens.colors.semantic.text,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: designTokens.spacing.scale.sm,
  },
  tipBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: designTokens.colors.semantic.accent,
    marginRight: designTokens.spacing.scale.sm,
    marginTop: 6, // Align with text baseline
  },
  tipText: {
    color: designTokens.colors.semantic.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    marginTop: designTokens.spacing.scale.xl,
    marginBottom: designTokens.spacing.scale.lg,
    gap: designTokens.spacing.scale.md,
    paddingHorizontal: designTokens.spacing.scale.sm,
  },
  backButton: {
    flex: 1,
  },
  nextButton: {
    flex: 1,
  },
});
