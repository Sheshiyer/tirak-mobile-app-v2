import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AlertCircle, Shield, FileText, MapPin, Clock } from 'lucide-react-native';
import { designTokens } from '@/constants/design-tokens';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useSupplierStore } from '@/stores/supplier-store';
import { mockRegions } from '@/mocks/supplier-data';
import { mockCategories } from '@/mocks/supplier-data';
import {
  SupplierApplicationIdempotencyConflictError,
  type SupplierApplicationError,
} from '@/services/api/supplier/applications';

export default function ReviewSubmitScreen() {
  const router = useRouter();
  const {
    signupData,
    submitApplication,
    retryOriginalApplication,
    startNewApplicationAttempt,
    isSubmitting,
    submissionError,
    clearSubmission,
  } = useSupplierStore();

  const [localError, setLocalError] = useState<string | null>(null);

  const { basicInfo, categories, services, regions, availability, languages } =
    signupData;

  const regionLabels = regions.map((id) => {
    const region = mockRegions.find((r) => r.id === id);
    return region?.name || id;
  });

  const categoryLabels = categories.map((id) => {
    const cat = mockCategories.find((c) => c.id === id);
    return cat?.name || id;
  });

  const daysWithSlots = Object.entries(availability.weeklySchedule)
    .filter(([_, slots]) => slots.length > 0)
    .map(([day]) => day.charAt(0).toUpperCase() + day.slice(1));

  const handleSubmit = async () => {
    setLocalError(null);
    clearSubmission();

    try {
      await submitApplication();
      router.push('/supplier/signup/success');
    } catch (error) {
      if (error instanceof SupplierApplicationIdempotencyConflictError) {
        Alert.alert(
          'Application Already Sent?',
          'Your earlier application request may already have succeeded. Retry the original submission to check safely, or start a new application attempt with your current edits.',
          [
            {
              text: 'Retry Original',
              onPress: () => {
                void retryOriginalApplication()
                  .then(() => {
                    router.push('/supplier/signup/success');
                  })
                  .catch((retryError: SupplierApplicationError) => {
                    setLocalError(retryError.message || 'Could not retry the original application.');
                  });
              },
            },
            {
              text: 'New Attempt',
              onPress: () => {
                startNewApplicationAttempt();
                setLocalError('Started a new application attempt. Submit again only if you are sure the earlier request did not succeed.');
              },
            },
            { text: 'Cancel', style: 'cancel' },
          ],
        );
        return;
      }
      const appError = error as SupplierApplicationError;
      setLocalError(
        appError.message || 'Submission failed. You can retry without losing your draft.',
      );
    }
  };

  const handleBack = () => {
    router.back();
  };

  const displayError =
    localError || submissionError?.message || null;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Review & Submit</Text>
          <Text style={styles.subtitle}>
            Review your guide application before submitting. Your application
            will be reviewed by our team.
          </Text>
          <ProgressBar currentStep={8} totalSteps={8} />
        </View>

        {/* Profile Summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Profile</Text>
          <Text style={styles.summaryValue}>
            {basicInfo.displayName ||
              [basicInfo.firstName, basicInfo.lastName]
                .filter(Boolean)
                .join(' ')}
          </Text>
          <Text style={styles.summaryLabel}>{basicInfo.email}</Text>
          <Text style={styles.summaryLabel}>{basicInfo.phone}</Text>
          {basicInfo.bio ? (
            <Text style={styles.summaryBio}>{basicInfo.bio}</Text>
          ) : null}
        </View>

        {/* Categories */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Categories</Text>
          {categoryLabels.length > 0 ? (
            <View style={styles.tagRow}>
              {categoryLabels.map((name) => (
                <View key={name} style={styles.tag}>
                  <Text style={styles.tagText}>{name}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>No categories selected</Text>
          )}
        </View>

        {/* Experiences */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            <FileText size={16} color={designTokens.colors.semantic.text} />{' '}
            Experiences ({services.length})
          </Text>
          {services.length > 0 ? (
            services.map((s, i) => (
              <View key={s.id || i} style={styles.serviceRow}>
                <Text style={styles.serviceName}>{s.name}</Text>
                <Text style={styles.serviceDetail}>
                  ฿{s.price} · {s.duration}h
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No experiences added</Text>
          )}
        </View>

        {/* Regions */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            <MapPin size={16} color={designTokens.colors.semantic.text} />{' '}
            Regions
          </Text>
          {regionLabels.length > 0 ? (
            <View style={styles.tagRow}>
              {regionLabels.map((name) => (
                <View key={name} style={styles.tag}>
                  <Text style={styles.tagText}>{name}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>No regions selected</Text>
          )}
        </View>

        {/* Availability */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            <Clock size={16} color={designTokens.colors.semantic.text} />{' '}
            Availability
          </Text>
          {daysWithSlots.length > 0 ? (
            <Text style={styles.summaryLabel}>
              {daysWithSlots.join(', ')}
            </Text>
          ) : (
            <Text style={styles.emptyText}>No availability set</Text>
          )}
        </View>

        {/* Payment unavailable notice */}
        <View style={styles.noticeCard}>
          <Shield
            size={20}
            color={designTokens.colors.semantic.textSecondary}
          />
          <Text style={styles.noticeText}>
            Supplier application payment status is currently unavailable. If approved,
            provisioning happens first, then account activation and profile verification
            complete before your profile can be listed publicly.
          </Text>
        </View>

        {/* Errors */}
        {displayError && (
          <View style={styles.errorContainer}>
            <AlertCircle
              size={20}
              color={designTokens.colors.semantic.error}
            />
            <Text style={styles.errorText}>{displayError}</Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title="Back"
            onPress={handleBack}
            variant="outline"
            style={styles.backButton}
            disabled={isSubmitting}
          />
          <Button
            title={isSubmitting ? 'Submitting...' : 'Submit Application'}
            onPress={handleSubmit}
            style={styles.nextButton}
            loading={isSubmitting}
            disabled={isSubmitting}
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
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: designTokens.colors.semantic.text,
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: designTokens.colors.semantic.text,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: designTokens.colors.semantic.textSecondary,
    marginBottom: 2,
  },
  summaryBio: {
    fontSize: 14,
    color: designTokens.colors.semantic.textSecondary,
    marginTop: 8,
    lineHeight: 20,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: designTokens.colors.semantic.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: designTokens.colors.semantic.primary,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '600',
    color: designTokens.colors.semantic.primary,
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: designTokens.colors.semantic.border,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '500',
    color: designTokens.colors.semantic.text,
    flex: 1,
  },
  serviceDetail: {
    fontSize: 14,
    color: designTokens.colors.semantic.textSecondary,
  },
  emptyText: {
    fontSize: 14,
    color: designTokens.colors.semantic.textSecondary,
    fontStyle: 'italic',
  },
  noticeCard: {
    backgroundColor: designTokens.colors.semantic.surface,
    borderRadius: 12,
    padding: 16,
    marginTop: 4,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderWidth: 1,
    borderColor: designTokens.colors.semantic.border,
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    color: designTokens.colors.semantic.textSecondary,
    lineHeight: 19,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: designTokens.colors.semantic.error + '15',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  errorText: {
    color: designTokens.colors.semantic.error,
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 16,
    marginBottom: 24,
    gap: 12,
  },
  backButton: {
    flex: 1,
  },
  nextButton: {
    flex: 1,
  },
});
