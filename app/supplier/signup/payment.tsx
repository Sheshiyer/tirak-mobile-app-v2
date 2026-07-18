import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AlertCircle, CheckCircle, MapPinned, ShieldCheck } from 'lucide-react-native';

import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { designTokens } from '@/constants/design-tokens';
import { useSupplierStore } from '@/stores/supplier-store';

export default function SubmitGuideApplicationScreen() {
  const router = useRouter();
  const submitSignup = useSupplierStore((state) => state.submitSignup);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const success = await submitSignup();
      if (success) {
        router.push('/supplier/signup/success');
      } else {
        setError('We could not submit your guide application. Please try again.');
      }
    } catch {
      setError('We could not submit your guide application. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Submit Guide Application</Text>
          <Text style={styles.subtitle}>
            Review the service-provider commitments below, then submit your profile and named itineraries for Tirak verification.
          </Text>
          <ProgressBar currentStep={8} totalSteps={8} />
        </View>

        <View style={styles.card}>
          <View style={styles.item}>
            <MapPinned size={22} color={designTokens.colors.semantic.primary} />
            <View style={styles.itemCopy}>
              <Text style={styles.itemTitle}>Deliver the listed itinerary</Text>
              <Text style={styles.itemBody}>Each accepted request is for the named route, duration, meeting point, inclusions, and total price.</Text>
            </View>
          </View>
          <View style={styles.item}>
            <ShieldCheck size={22} color={designTokens.colors.semantic.primary} />
            <View style={styles.itemCopy}>
              <Text style={styles.itemTitle}>Keep communication practical</Text>
              <Text style={styles.itemBody}>Booking chat is for timing, meeting-point, accessibility, dietary, language, and itinerary logistics.</Text>
            </View>
          </View>
          <View style={styles.item}>
            <CheckCircle size={22} color={designTokens.colors.semantic.success} />
            <View style={styles.itemCopy}>
              <Text style={styles.itemTitle}>Verification comes first</Text>
              <Text style={styles.itemBody}>Submitting creates a pending guide application. Tirak reviews it before any listing is published.</Text>
            </View>
          </View>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <AlertCircle size={20} color={designTokens.colors.semantic.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.actions}>
          <Button title="Back" onPress={() => router.back()} variant="outline" style={styles.action} />
          <Button title="Submit Application" onPress={handleSubmit} loading={isLoading} style={styles.action} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: designTokens.colors.semantic.background },
  scrollContent: { flexGrow: 1, padding: 16 },
  header: { marginBottom: 24 },
  title: { fontSize: 24, fontWeight: '700', color: designTokens.colors.semantic.text, marginBottom: 8 },
  subtitle: { fontSize: 16, lineHeight: 22, color: designTokens.colors.semantic.textSecondary, marginBottom: 16 },
  card: { backgroundColor: designTokens.colors.semantic.surface, borderRadius: 16, padding: 18, gap: 20 },
  item: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  itemCopy: { flex: 1 },
  itemTitle: { fontSize: 16, fontWeight: '700', color: designTokens.colors.semantic.text, marginBottom: 4 },
  itemBody: { fontSize: 14, lineHeight: 20, color: designTokens.colors.semantic.textSecondary },
  errorContainer: { flexDirection: 'row', gap: 8, marginTop: 18, padding: 12, borderRadius: 8, backgroundColor: designTokens.colors.semantic.error + '20' },
  errorText: { flex: 1, color: designTokens.colors.semantic.error },
  actions: { flexDirection: 'row', gap: 12, marginTop: 24, marginBottom: 16 },
  action: { flex: 1 },
});
