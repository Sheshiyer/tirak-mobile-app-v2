import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Animated, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Camera, AlertCircle, CheckCircle, Shield, Info } from 'lucide-react-native';
import * as ExpoImagePicker from 'expo-image-picker';
import { designTokens, componentTokens } from '@/constants/design-tokens';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { RadialGradient } from '@/components/ui/RadialGradient';
import { Heading, Subheading, Body, Caption } from '@/components/ui/Typography';
import { useSupplierStore } from '@/stores/supplier-store';

// TypeScript interfaces for Step 2: ID Verification
interface IDVerificationData {
  idCardFront: string | null;
  idCardBack: string | null;
  selfieWithId: string | null;
}

interface ValidationErrors {
  idCardFront?: string;
  idCardBack?: string;
  selfieWithId?: string;
}

export default function VerificationScreen() {
  const router = useRouter();
  const { signupData, updateSignupData } = useSupplierStore();

  const [errors, setErrors] = useState<ValidationErrors>({});

  // Animation values for organic motion
  const shakeAnimation = useRef(new Animated.Value(0)).current;
  const uploadAnimations = useRef({
    idCardFront: new Animated.Value(0),
    idCardBack: new Animated.Value(0),
    selfieWithId: new Animated.Value(0),
  }).current;

  const handleUpload = async (field: 'idCardFront' | 'idCardBack' | 'selfieWithId') => {
    // Trigger upload animation
    Animated.sequence([
      Animated.timing(uploadAnimations[field], {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(uploadAnimations[field], {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    const permission = await ExpoImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photo access needed', 'Please allow photo library access to upload verification images.');
      return;
    }

    const result = await ExpoImagePicker.launchImageLibraryAsync({
      mediaTypes: ExpoImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.85,
    });

    if (result.canceled || !result.assets?.[0]?.uri) {
      return;
    }

    updateSignupData({
      idVerification: {
        ...signupData.idVerification,
        [field]: result.assets[0].uri,
      },
    });

    // Clear error when field is updated
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };
  
  const validate = () => {
    const newErrors: ValidationErrors = {};

    if (!signupData.idVerification.idCardFront) {
      newErrors.idCardFront = 'Thai ID card front photo is required for Local Guide verification';
    }

    if (!signupData.idVerification.idCardBack) {
      newErrors.idCardBack = 'Thai ID card back photo is required for identity confirmation';
    }

    if (!signupData.idVerification.selfieWithId) {
      newErrors.selfieWithId = 'Selfie with ID card is required to verify your identity as a Cultural Guide';
    }

    // Trigger shake animation if there are errors
    if (Object.keys(newErrors).length > 0) {
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
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleNext = () => {
    if (validate()) {
      updateSignupData({ step: 3 });
      router.push('/supplier/signup/photos');
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
              Identity Verification
            </Heading>
            <Subheading style={styles.subtitle}>
              Verification helps travelers book with confidence. We securely review your identity before your Tirak guide profile goes live.
            </Subheading>

            <ProgressBar
              currentStep={2}
              totalSteps={8}
              variant="gradient"
            />
          </View>

          <View style={styles.form}>
            <View style={styles.infoCard}>
              <View style={styles.infoIconContainer}>
                <Shield size={20} color={designTokens.colors.semantic.primary} />
              </View>
              <Body style={styles.infoText}>
                Your Thai ID information is encrypted and used only for guide verification. Travelers will never see your personal ID details.
              </Body>
            </View>

            <View style={styles.uploadSection}>
              <Subheading level={3} style={styles.sectionTitle}>
                Thai ID Card - Front Side
              </Subheading>
              <Caption style={styles.sectionDescription}>
                Clear photo of the front of your Thai National ID card
              </Caption>

              {signupData.idVerification.idCardFront ? (
                <Animated.View
                  style={[
                    styles.imagePreviewContainer,
                    { transform: [{ scale: uploadAnimations.idCardFront.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 0.95]
                    })}] }
                  ]}
                >
                  <Image
                    source={{ uri: signupData.idVerification.idCardFront }}
                    style={styles.imagePreview}
                  />
                  <View style={styles.successOverlay}>
                    <CheckCircle size={24} color={designTokens.colors.semantic.success} />
                  </View>
                  <TouchableOpacity
                    style={styles.retakeButton}
                    onPress={() => handleUpload('idCardFront')}
                  >
                    <Caption style={styles.retakeButtonText}>Retake</Caption>
                  </TouchableOpacity>
                </Animated.View>
              ) : (
                <Animated.View
                  style={[
                    styles.uploadButton,
                    { transform: [{ scale: uploadAnimations.idCardFront.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 0.95]
                    })}] }
                  ]}
                >
                  <TouchableOpacity
                    style={styles.uploadButtonInner}
                    onPress={() => handleUpload('idCardFront')}
                    activeOpacity={0.8}
                  >
                    <Camera size={32} color={designTokens.colors.semantic.primary} />
                    <Body style={styles.uploadButtonText}>Take Photo</Body>
                  </TouchableOpacity>
                </Animated.View>
              )}
              {errors.idCardFront && (
                <Body style={styles.errorText}>{errors.idCardFront}</Body>
              )}
            </View>

            <View style={styles.uploadSection}>
              <Subheading level={3} style={styles.sectionTitle}>
                Thai ID Card - Back Side
              </Subheading>
              <Caption style={styles.sectionDescription}>
                Clear photo of the back of your Thai National ID card
              </Caption>

              {signupData.idVerification.idCardBack ? (
                <Animated.View
                  style={[
                    styles.imagePreviewContainer,
                    { transform: [{ scale: uploadAnimations.idCardBack.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 0.95]
                    })}] }
                  ]}
                >
                  <Image
                    source={{ uri: signupData.idVerification.idCardBack }}
                    style={styles.imagePreview}
                  />
                  <View style={styles.successOverlay}>
                    <CheckCircle size={24} color={designTokens.colors.semantic.success} />
                  </View>
                  <TouchableOpacity
                    style={styles.retakeButton}
                    onPress={() => handleUpload('idCardBack')}
                  >
                    <Caption style={styles.retakeButtonText}>Retake</Caption>
                  </TouchableOpacity>
                </Animated.View>
              ) : (
                <Animated.View
                  style={[
                    styles.uploadButton,
                    { transform: [{ scale: uploadAnimations.idCardBack.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 0.95]
                    })}] }
                  ]}
                >
                  <TouchableOpacity
                    style={styles.uploadButtonInner}
                    onPress={() => handleUpload('idCardBack')}
                    activeOpacity={0.8}
                  >
                    <Camera size={32} color={designTokens.colors.semantic.primary} />
                    <Body style={styles.uploadButtonText}>Take Photo</Body>
                  </TouchableOpacity>
                </Animated.View>
              )}
              {errors.idCardBack && (
                <Body style={styles.errorText}>{errors.idCardBack}</Body>
              )}
            </View>

            <View style={styles.uploadSection}>
              <Subheading level={3} style={styles.sectionTitle}>
                Verification Selfie
              </Subheading>
              <Caption style={styles.sectionDescription}>
                Take a selfie holding your Thai ID card next to your face for identity verification
              </Caption>

              {signupData.idVerification.selfieWithId ? (
                <Animated.View
                  style={[
                    styles.imagePreviewContainer,
                    { transform: [{ scale: uploadAnimations.selfieWithId.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 0.95]
                    })}] }
                  ]}
                >
                  <Image
                    source={{ uri: signupData.idVerification.selfieWithId }}
                    style={styles.imagePreview}
                  />
                  <View style={styles.successOverlay}>
                    <CheckCircle size={24} color={designTokens.colors.semantic.success} />
                  </View>
                  <TouchableOpacity
                    style={styles.retakeButton}
                    onPress={() => handleUpload('selfieWithId')}
                  >
                    <Caption style={styles.retakeButtonText}>Retake</Caption>
                  </TouchableOpacity>
                </Animated.View>
              ) : (
                <Animated.View
                  style={[
                    styles.uploadButton,
                    { transform: [{ scale: uploadAnimations.selfieWithId.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 0.95]
                    })}] }
                  ]}
                >
                  <TouchableOpacity
                    style={styles.uploadButtonInner}
                    onPress={() => handleUpload('selfieWithId')}
                    activeOpacity={0.8}
                  >
                    <Camera size={32} color={designTokens.colors.semantic.primary} />
                    <Body style={styles.uploadButtonText}>Take Selfie</Body>
                  </TouchableOpacity>
                </Animated.View>
              )}
              {errors.selfieWithId && (
                <Body style={styles.errorText}>{errors.selfieWithId}</Body>
              )}
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
  infoCard: {
    backgroundColor: designTokens.colors.semantic.primary + '10',
    borderRadius: 12,
    padding: designTokens.spacing.scale.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: designTokens.spacing.scale.lg,
    borderWidth: 1,
    borderColor: designTokens.colors.semantic.primary + '20',
  },
  infoIconContainer: {
    marginRight: designTokens.spacing.scale.sm,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    color: designTokens.colors.semantic.primary,
    lineHeight: 20,
  },
  uploadSection: {
    marginBottom: designTokens.spacing.scale.xl,
  },
  sectionTitle: {
    marginBottom: designTokens.spacing.scale.xs,
    color: designTokens.colors.semantic.text,
  },
  sectionDescription: {
    marginBottom: designTokens.spacing.scale.md,
    color: designTokens.colors.semantic.textSecondary,
  },
  uploadButton: {
    borderWidth: 2,
    borderColor: designTokens.colors.semantic.accent + '40',
    borderStyle: 'dashed',
    borderRadius: 16,
    height: 160,
    backgroundColor: designTokens.colors.semantic.accent + '05',
  },
  uploadButtonInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  uploadButtonText: {
    color: designTokens.colors.semantic.primary,
    marginTop: designTokens.spacing.scale.sm,
    fontWeight: '600',
  },
  imagePreviewContainer: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    height: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  successOverlay: {
    position: 'absolute',
    top: designTokens.spacing.scale.sm,
    left: designTokens.spacing.scale.sm,
    backgroundColor: designTokens.colors.semantic.surface,
    borderRadius: 20,
    padding: designTokens.spacing.scale.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  retakeButton: {
    position: 'absolute',
    bottom: designTokens.spacing.scale.sm,
    right: designTokens.spacing.scale.sm,
    backgroundColor: designTokens.colors.semantic.accent,
    paddingHorizontal: designTokens.spacing.scale.md,
    paddingVertical: designTokens.spacing.scale.xs,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  retakeButtonText: {
    color: designTokens.colors.semantic.surface,
    fontWeight: '600',
  },
  errorText: {
    color: designTokens.colors.semantic.error,
    marginTop: designTokens.spacing.scale.xs,
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
