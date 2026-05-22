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
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { designTokens, componentTokens } from '@/constants/design-tokens';
import { ArrowLeft, Save, Plus, X } from 'lucide-react-native';
import { useExperiences, useCreateExperience, ExperienceCreateRequest, Experience } from '@/app/api/companion/experience';
import { useAuthStore } from '@/stores/auth-store';

type NewExperienceForm = Omit<ExperienceCreateRequest, 'durationMinutes'> & { durationMinutes: string };

export default function EditServices() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const companionId = user?.id;

  // Fetch experiences
  const { data, isLoading, error, refetch } = useExperiences(companionId || '');
  const experiences: Experience[] = data?.data?.items || [];
  // logger.log('COMPANION ID:', companionId);
  // logger.log('EXPERIENCE DATA:', data);
  // logger.log('EXPERIENCES ARRAY:', experiences);

  // Add experience mutation
  const createExperience = useCreateExperience(companionId || '');

  // Form state for new experience
  const [newExperience, setNewExperience] = useState<NewExperienceForm>({
    title: '',
    description: '',
    durationMinutes: '',
    keywords: [],
    price: 0,
    currency: 'THB',
    is_active: true,
  });

  const handleAddExperience = async () => {
    if (!newExperience.title.trim()) {
      Alert.alert('Validation Error', 'Title is required');
      return;
    }
    if (!newExperience.description || newExperience.description.trim().length < 10) {
      Alert.alert('Validation Error', 'Description must be at least 10 characters');
      return;
    }
    if (!newExperience.price || newExperience.price <= 0) {
      Alert.alert('Validation Error', 'Price must be greater than 0');
      return;
    }
    if (!newExperience.durationMinutes || parseInt(newExperience.durationMinutes) <= 0) {
      Alert.alert('Validation Error', 'Duration must be greater than 0');
      return;
    }
    if (!newExperience.currency || newExperience.currency.trim().length < 2) {
      Alert.alert('Validation Error', 'Currency is required');
      return;
    }
    try {
      await createExperience.mutateAsync({
        ...newExperience,
        durationMinutes: parseInt(newExperience.durationMinutes) || 60,
      });
      setNewExperience({ title: '', description: '', durationMinutes: '', keywords: [], price: 0, currency: 'THB', is_active: true });
      refetch();
      Alert.alert('Success', 'Experience added successfully!');
    } catch (e) {
      Alert.alert('Error', 'Failed to add experience');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={designTokens.colors.semantic.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Experiences</Text>
        <View style={{width: 44}} />

      </View>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Loading/Error States */}
          {isLoading && <Text>Loading experiences...</Text>}
          {error && <Text style={{ color: 'red' }}>Failed to load experiences</Text>}
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Current Experiences</Text>
            {experiences.map((exp: Experience) => (
              <View key={exp.id} style={styles.serviceCard}>
                <View style={styles.serviceHeader}>
                  <Text style={styles.serviceTitle}>{exp.title}</Text>
                  {/* Add delete/edit buttons if needed */}
                </View>
                <Text style={styles.serviceDescription}>{exp.description}</Text>
                <View style={styles.serviceDetails}>
                  <Text style={styles.servicePrice}>฿{exp.price}</Text>
                  <Text style={styles.serviceDuration}>{Math.round(exp.durationMinutes / 60)}h</Text>
                </View>
              </View>
            ))}
          </View>
          {/* Add New Experience */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Add New Experience</Text>
            <View style={styles.addServiceCard}>
              <TextInput
                style={styles.input}
                placeholder="Experience title"
                value={newExperience.title}
                onChangeText={(text) => setNewExperience({ ...newExperience, title: text })}
                placeholderTextColor={designTokens.colors.components.input.placeholder}
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Experience description"
                value={newExperience.description}
                onChangeText={(text) => setNewExperience({ ...newExperience, description: text })}
                multiline
                numberOfLines={3}
                placeholderTextColor={designTokens.colors.components.input.placeholder}
              />
              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="Price (฿)"
                  value={newExperience.price ? String(newExperience.price) : ''}
                  onChangeText={(text) => setNewExperience({ ...newExperience, price: parseInt(text) || 0 })}
                  keyboardType="numeric"
                  placeholderTextColor={designTokens.colors.components.input.placeholder}
                />
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="Duration (minutes)"
                  value={newExperience.durationMinutes}
                  onChangeText={(text) => setNewExperience({ ...newExperience, durationMinutes: text })}
                  keyboardType="numeric"
                  placeholderTextColor={designTokens.colors.components.input.placeholder}
                />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Keywords (comma separated)"
                value={newExperience.keywords.join(', ')}
                onChangeText={(text) => setNewExperience({ ...newExperience, keywords: text.split(',').map(k => k.trim()).filter(Boolean) })}
                placeholderTextColor={designTokens.colors.components.input.placeholder}
              />
              <TextInput
                style={styles.input}
                placeholder="Currency (e.g. THB)"
                value={newExperience.currency}
                onChangeText={(text) => setNewExperience({ ...newExperience, currency: text })}
                placeholderTextColor={designTokens.colors.components.input.placeholder}
              />
              <TouchableOpacity style={styles.addButton} onPress={handleAddExperience} disabled={createExperience.isPending}>
                {createExperience.isPending ? (
                  <ActivityIndicator size="small" color={designTokens.colors.components.button.text} />
                ) : (
                  <>
                <Plus size={20} color={designTokens.colors.components.button.text} />
                    <Text style={styles.addButtonText}>Add Experience</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: designTokens.colors.semantic.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: designTokens.spacing.scale.lg,
    paddingVertical: designTokens.spacing.scale.md,
    backgroundColor: designTokens.colors.semantic.surface,
    borderBottomWidth: 1,
    borderBottomColor: designTokens.colors.semantic.border,
    marginTop: 40,
  },
  backButton: {
    padding: designTokens.spacing.scale.sm,
  },
  headerTitle: {
    ...componentTokens.text.subheading,
    flex: 1,
    textAlign: 'center',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.scale.xs,
  },
  saveText: {
    ...designTokens.typography.styles.body,
    color: designTokens.colors.semantic.primary,
    fontWeight: designTokens.typography.weights.semibold,
  },
  content: {
    flex: 1,
    padding: designTokens.spacing.scale.lg,
  },
  section: {
    marginBottom: designTokens.spacing.scale.xl,
  },
  sectionTitle: {
    ...componentTokens.text.subheading,
    marginBottom: designTokens.spacing.scale.md,
  },
  serviceCard: {
    ...componentTokens.card.default,
    marginBottom: designTokens.spacing.scale.md,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: designTokens.spacing.scale.sm,
  },
  serviceTitle: {
    ...designTokens.typography.styles.body,
    fontWeight: designTokens.typography.weights.semibold,
    flex: 1,
  },
  removeButton: {
    padding: designTokens.spacing.scale.xs,
  },
  serviceDescription: {
    ...componentTokens.text.caption,
    marginBottom: designTokens.spacing.scale.sm,
  },
  serviceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  servicePrice: {
    ...designTokens.typography.styles.body,
    color: designTokens.colors.semantic.primary,
    fontWeight: designTokens.typography.weights.semibold,
  },
  serviceDuration: {
    ...componentTokens.text.caption,
  },
  addServiceCard: {
    ...componentTokens.card.default,
  },
  input: {
    ...designTokens.typography.styles.body,
    backgroundColor: designTokens.colors.components.input.background,
    borderWidth: 1,
    borderColor: designTokens.colors.components.input.border,
    borderRadius: designTokens.borderRadius.components.input,
    paddingHorizontal: designTokens.spacing.scale.md,
    paddingVertical: designTokens.spacing.scale.sm,
    marginBottom: designTokens.spacing.scale.md,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  inputRow: {
    flexDirection: 'row',
    gap: designTokens.spacing.scale.md,
  },
  halfInput: {
    flex: 1,
  },
  addButton: {
    ...componentTokens.button.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: designTokens.spacing.scale.sm,
    marginTop: designTokens.spacing.scale.sm,
  },
  addButtonText: {
    ...designTokens.typography.styles.body,
    color: designTokens.colors.components.button.text,
    fontWeight: designTokens.typography.weights.semibold,
  },
});
