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
  Modal,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { designTokens, componentTokens } from '@/constants/design-tokens';
import { ArrowLeft, Save, Plus, X, Edit, Edit2 } from 'lucide-react-native';
import { useExperiences, useCreateExperience, ExperienceCreateRequest, Experience, updateExperience, archiveExperience, invalidateExperienceQueries, readExperienceDrafts } from '@/services/api/companion/experience';
import { useAuthStore } from '@/stores/auth-store';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/stores/toast-store';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

type NewExperienceForm = Omit<ExperienceCreateRequest, 'durationMinutes'> & { durationMinutes: string };

export default function EditServices() {

  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const companionId = user?.id;
  const { t } = useTranslation();
  const toast = useToast();
  const queryClient = useQueryClient();
  
  // Fetch experiences
  const { data, isLoading, error, refetch } = useExperiences(companionId || '');
  const experiences: Experience[] = data?.data?.items || [];
  const drafts = useQuery({ queryKey: ['experienceDrafts', companionId], queryFn: () => readExperienceDrafts(companionId!), enabled: !!companionId });
  const [archiveTarget, setArchiveTarget] = useState<Experience | null>(null);
  const archiveMutation = useMutation({
    mutationFn: (experienceId: string) => archiveExperience(companionId!, experienceId),
    onSuccess: async () => { await invalidateExperienceQueries(queryClient, companionId!); setArchiveTarget(null); },
  });

  // Add experience mutation
  const createExperience = useCreateExperience(companionId || '');

  // Edit experience state
  const [editingExperience, setEditingExperience] = useState<Experience | null>(null);
  const [editForm, setEditForm] = useState<NewExperienceForm>({
    title: '',
    description: '',
    durationMinutes: '',
    keywords: [],
    price: 0,
    currency: 'THB',
    is_active: true,
  });

  // Update experience mutation
  const updateExperienceMutation = useMutation({
    mutationFn: ({ experienceId, payload }: { experienceId: string; payload: ExperienceCreateRequest }) =>
      updateExperience(companionId || '', experienceId, payload),
    onSuccess: () => {
      void invalidateExperienceQueries(queryClient, companionId!);
      setEditingExperience(null);
      if (Platform.OS === 'web') {
        toast.success(t('editServices.experienceUpdated'));
      } else {
        Alert.alert(t('editServices.success'), t('editServices.experienceUpdated'));
      }
    },
    onError: () => {
      if (Platform.OS === 'web') {
        toast.error(t('editServices.failedToUpdate'));
      } else {
        Alert.alert(t('editServices.error'), t('editServices.failedToUpdate'));
      }
    },
  });

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

  // Form validation errors
  const [formErrors, setFormErrors] = useState<{
    duration?: string;
  }>({});
  
  const [editFormErrors, setEditFormErrors] = useState<{
    duration?: string;
  }>({});

  const handleAddExperience = async () => {
    if (!companionId) {
      if (Platform.OS === 'web') {
        toast.error(t('editServices.userNotFound'));
      } else {
        Alert.alert(t('editServices.error'), t('editServices.userNotFound'));
      }
      return;
    }

    if (!newExperience.title.trim()) {
      if (Platform.OS === 'web') {
        toast.error(t('editServices.titleRequired'));
      } else {
        Alert.alert(t('editServices.error'), t('editServices.titleRequired'));
      }
      return;
    }
    if (!newExperience.description || newExperience.description.trim().length < 10) {
      if (Platform.OS === 'web') {
        toast.error(t('editServices.descriptionRequired'));
      } else {
        Alert.alert(t('editServices.error'), t('editServices.descriptionRequired'));
      }
      return;
    }
    if (!newExperience.price || newExperience.price <= 0) {
      if (Platform.OS === 'web') {
        toast.error(t('editServices.priceRequired'));
      } else {
        Alert.alert(t('editServices.error'), t('editServices.priceRequired'));
      }
      return;
    }
    // Clear previous errors
    setFormErrors({});
    
    if (!newExperience.durationMinutes || parseInt(newExperience.durationMinutes) <= 0) {
      setFormErrors({ duration: t('editServices.durationRequired') });
      return;
    }
    const durationMinutes = parseInt(newExperience.durationMinutes);
    if (!Number.isInteger(Number(newExperience.durationMinutes)) || durationMinutes < 30 || durationMinutes > 1439) {
      setFormErrors({ duration: t('editServices.durationRange') });
      return;
    }
    if (newExperience.keywords.length > 20 || newExperience.currency !== 'THB') {
      if (Platform.OS === 'web') {
        toast.error(t('editServices.currencyAndKeywords'));
      } else {
        Alert.alert(t('editServices.error'), t('editServices.currencyAndKeywords'));
      }
      return;
    }

    try {
      await createExperience.mutateAsync({
        ...newExperience,
        durationMinutes,
      });
      setNewExperience({
        title: '',
        description: '',
        durationMinutes: '',
        keywords: [],
        price: 0,
        currency: 'THB',
        is_active: true,
      });
      setFormErrors({});
      refetch();
      if (Platform.OS === 'web') {
        toast.success(t('editServices.experienceAdded'));
      } else {
        Alert.alert(t('editServices.success'), t('editServices.experienceAdded'));
      }
    } catch (e) {
      if (Platform.OS === 'web') {
        toast.error(t('editServices.failedToAddExperience'));
      } else {
        Alert.alert(t('editServices.error'), t('editServices.failedToAddExperience'));
      }
    }
  };

  const handleEditClick = (exp: Experience) => {
    setEditingExperience(exp);
    setEditForm({
      title: exp.title,
      description: exp.description || '',
      durationMinutes: String(exp.durationMinutes),
      keywords: exp.keywords || [],
      price: exp.price,
      currency: 'THB',
      is_active: exp.isActive,
    });
    setEditFormErrors({});
  };

  const handleUpdateExperience = async () => {
    if (!editingExperience || !companionId) return;

    if (!editForm.title.trim()) {
      if (Platform.OS === 'web') {
        toast.error(t('editServices.titleRequired'));
      } else {
        Alert.alert(t('editServices.error'), t('editServices.titleRequired'));
      }
      return;
    }
    if (!editForm.description || editForm.description.trim().length < 10) {
      if (Platform.OS === 'web') {
        toast.error(t('editServices.descriptionRequired'));
      } else {
        Alert.alert(t('editServices.error'), t('editServices.descriptionRequired'));
      }
      return;
    }
    if (!editForm.price || editForm.price <= 0) {
      if (Platform.OS === 'web') {
        toast.error(t('editServices.priceRequired'));
      } else {
        Alert.alert(t('editServices.error'), t('editServices.priceRequired'));
      }
      return;
    }
    // Clear previous errors
    setEditFormErrors({});
    
    if (!editForm.durationMinutes || parseInt(editForm.durationMinutes) <= 0) {
      setEditFormErrors({ duration: t('editServices.durationRequired') });
      return;
    }
    const durationMinutes = parseInt(editForm.durationMinutes);
    if (!Number.isInteger(Number(editForm.durationMinutes)) || durationMinutes < 30 || durationMinutes > 1439) {
      setEditFormErrors({ duration: t('editServices.durationRange') });
      return;
    }

    if (editForm.keywords.length > 20 || editForm.currency !== 'THB') {
      toast.error(t('editServices.currencyAndKeywords'));
      return;
    }
    updateExperienceMutation.mutate({
      experienceId: editingExperience.id,
      payload: {
        ...editForm,
        durationMinutes,
      },
    });
  };

  if (!companionId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{t('editServices.pleaseLogInToManageServices')}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => router.replace('/auth/login')}
          >
            <Text style={styles.retryText}>{t('editServices.goToLogin')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={designTokens.colors.semantic.primary} />
          <Text style={styles.loadingText}>{t('editServices.loadingServices')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{t('editServices.failedToLoadServices')}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => refetch()}
          >
            <Text style={styles.retryText}>{t('editServices.retry')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={designTokens.colors.semantic.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('editServices.editExperiences')}</Text>
        <View style={{width: 44}} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('editServices.currentExperiences')}</Text>
            {experiences.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>{t('editServices.noExperiences')}</Text>
              </View>
            ) : (
              experiences.map((exp: Experience) => (
                <View key={exp.id} style={styles.serviceCard}>
                  <View style={styles.serviceHeader}>
                    <Text style={styles.serviceTitle}>{exp.title}{!exp.isActive ? ` (${t('editServices.inactive')})` : ''}</Text>
                    <TouchableOpacity accessibilityLabel={t('editServices.editExperience')} onPress={() => handleEditClick(exp)}>
                      <Edit2 size={16} color={designTokens.colors.semantic.primary} />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.serviceDescription}>{exp.description}</Text>
                  <TouchableOpacity accessibilityRole="button" onPress={() => { archiveMutation.reset(); setArchiveTarget(exp); }}>
                    <Text style={styles.fieldErrorText}>{t('editServices.removeFromProfile')}</Text>
                  </TouchableOpacity>
                  <View style={styles.serviceDetails}>
                    <Text style={styles.servicePrice}>฿{exp.price}</Text>
                    <Text style={styles.serviceDuration}>{Math.round(exp.durationMinutes / 60)}h</Text>
                  </View>
                  
                </View>
              ))
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('editServices.addNewExperience')}</Text>
            {drafts.data && drafts.data.length > 0 && <Text style={styles.serviceDescription}>{t('editServices.localDraftsPreserved', { count: drafts.data.length })}</Text>}
            {drafts.data?.map(draft => <TouchableOpacity key={draft.id} onPress={() => setNewExperience({ title: draft.title, description: draft.description, durationMinutes: String(draft.durationMinutes), price: draft.price, currency: 'THB', keywords: draft.keywords, is_active: true })}>
              <Text style={styles.serviceDescription}>{t('editServices.restoreDraft')}: {draft.title}</Text>
            </TouchableOpacity>)}
            <View style={styles.addServiceCard}>
              <TextInput
                style={styles.input}
                placeholder={t('editServices.experienceTitle')}
                value={newExperience.title}
                onChangeText={(text) => setNewExperience({ ...newExperience, title: text })}
                placeholderTextColor={designTokens.colors.components.input.placeholder}
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder={t('editServices.experienceDescription')}
                value={newExperience.description}
                onChangeText={(text) => setNewExperience({ ...newExperience, description: text })}
                multiline
                numberOfLines={3}
                placeholderTextColor={designTokens.colors.components.input.placeholder}
              />
              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder={t('editServices.price') + ' (฿)'}
                  value={newExperience.price ? String(newExperience.price) : ''}
                  onChangeText={(text) => setNewExperience({ ...newExperience, price: parseInt(text) || 0 })}
                  keyboardType="numeric"
                  placeholderTextColor={designTokens.colors.components.input.placeholder}
                />
                <View style={styles.halfInput}>
                  <TextInput
                    style={[
                      styles.input,
                      formErrors.duration && styles.inputError
                    ]}
                    placeholder={t('editServices.duration') + ' (minutes)'}
                    value={newExperience.durationMinutes}
                    onChangeText={(text) => {
                      setNewExperience({ ...newExperience, durationMinutes: text });
                      // Clear error when user starts typing
                      if (formErrors.duration) {
                        setFormErrors({});
                      }
                    }}
                    keyboardType="numeric"
                    placeholderTextColor={designTokens.colors.components.input.placeholder}
                  />
                  {formErrors.duration && (
                    <Text style={styles.fieldErrorText}>{formErrors.duration}</Text>
                  )}
                </View>
              </View>
              <TextInput
                style={styles.input}
                placeholder={t('editServices.keywords') + ' (comma separated)'}
                value={newExperience.keywords.join(', ')}
                onChangeText={(text) => setNewExperience({ ...newExperience, keywords: text.split(',').map(k => k.trim()).filter(Boolean) })}
                placeholderTextColor={designTokens.colors.components.input.placeholder}
              />
              <TextInput
                style={styles.input}
                placeholder={t('editServices.currency') + ' (e.g. THB)'}
                value="THB"
                editable={false}
                placeholderTextColor={designTokens.colors.components.input.placeholder}
              />
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddExperience}
                disabled={createExperience.isPending}
              >
                {createExperience.isPending ? (
                  <ActivityIndicator size="small" color={designTokens.colors.components.button.text} />
                ) : (
                  <>
                    <Plus size={20} color={designTokens.colors.components.button.text} />
                    <Text style={styles.addButtonText}>{t('editServices.addNewExperience')}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={!!archiveTarget} transparent animationType="fade" onRequestClose={() => !archiveMutation.isPending && setArchiveTarget(null)}>
        <View style={styles.modalOverlay}><View style={styles.modalContent}>
          <View style={styles.modalBody}>
            <Text style={styles.modalTitle}>{t('editServices.removeFromProfile')}</Text>
            <Text style={styles.serviceDescription}>{archiveTarget?.title}</Text>
            <Text style={styles.serviceDescription}>{t('editServices.archiveExplanation')}</Text>
            {archiveMutation.isError && <Text accessibilityRole="alert" style={styles.errorText}>{t('editServices.archiveFailed')}</Text>}
          </View>
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.modalButton} disabled={archiveMutation.isPending} onPress={() => setArchiveTarget(null)}><Text>{t('common.cancel')}</Text></TouchableOpacity>
            <TouchableOpacity style={styles.modalButton} disabled={archiveMutation.isPending} onPress={() => archiveTarget && archiveMutation.mutate(archiveTarget.id)}>
              {archiveMutation.isPending ? <ActivityIndicator /> : <Text>{t('editServices.confirmRemove')}</Text>}
            </TouchableOpacity>
          </View>
        </View></View>
      </Modal>
      {/* Edit Experience Modal */}
      <Modal
        visible={!!editingExperience}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditingExperience(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('editServices.editExperience')}</Text>
              <TouchableOpacity onPress={() => setEditingExperience(null)}>
                <X size={24} color={designTokens.colors.semantic.text} />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.modalBody} 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScrollContent}
            >
              <View style={styles.serviceDetails}><Text>{t('editServices.acceptNewBookings')}</Text><Switch value={editForm.is_active} onValueChange={is_active => setEditForm({ ...editForm, is_active })} /></View>
              <TextInput
                style={styles.input}
                placeholder={t('editServices.experienceTitle')}
                value={editForm.title}
                onChangeText={(text) => setEditForm({ ...editForm, title: text })}
                placeholderTextColor={designTokens.colors.components.input.placeholder}
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder={t('editServices.experienceDescription')}
                value={editForm.description}
                onChangeText={(text) => setEditForm({ ...editForm, description: text })}
                multiline
                numberOfLines={3}
                placeholderTextColor={designTokens.colors.components.input.placeholder}
              />
              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder={t('editServices.price') + ' (฿)'}
                  value={editForm.price ? String(editForm.price) : ''}
                  onChangeText={(text) => setEditForm({ ...editForm, price: parseInt(text) || 0 })}
                  keyboardType="numeric"
                  placeholderTextColor={designTokens.colors.components.input.placeholder}
                />
                <View style={styles.halfInput}>
                  <TextInput
                    style={[
                      styles.input,
                      editFormErrors.duration && styles.inputError
                    ]}
                    placeholder={t('editServices.duration') + ' (minutes)'}
                    value={editForm.durationMinutes}
                    onChangeText={(text) => {
                      setEditForm({ ...editForm, durationMinutes: text });
                      // Clear error when user starts typing
                      if (editFormErrors.duration) {
                        setEditFormErrors({});
                      }
                    }}
                    keyboardType="numeric"
                    placeholderTextColor={designTokens.colors.components.input.placeholder}
                  />
                  {editFormErrors.duration && (
                    <Text style={styles.fieldErrorText}>{editFormErrors.duration}</Text>
                  )}
                </View>
              </View>
              <TextInput
                style={styles.input}
                placeholder={t('editServices.keywords') + ' (comma separated)'}
                value={editForm.keywords.join(', ')}
                onChangeText={(text) => setEditForm({ ...editForm, keywords: text.split(',').map(k => k.trim()).filter(Boolean) })}
                placeholderTextColor={designTokens.colors.components.input.placeholder}
              />
              <TextInput
                style={styles.input}
                placeholder={t('editServices.currency') + ' (e.g. THB)'}
                value="THB"
                editable={false}
                placeholderTextColor={designTokens.colors.components.input.placeholder}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setEditingExperience(null)}
              >
                <Text style={styles.modalButtonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSave]}
                onPress={handleUpdateExperience}
                disabled={updateExperienceMutation.isPending}
              >
                {updateExperienceMutation.isPending ? (
                  <ActivityIndicator size="small" color={designTokens.colors.components.button.text} />
                ) : (
                  <Text style={[styles.modalButtonText, styles.modalButtonTextPrimary]}>
                    {t('common.save')}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: designTokens.colors.semantic.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: designTokens.colors.semantic.background,
    gap: designTokens.spacing.scale.md,
  },
  loadingText: {
    ...componentTokens.text.body,
    color: designTokens.colors.semantic.text,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: designTokens.colors.semantic.background,
    gap: designTokens.spacing.scale.lg,
  },
  errorText: {
    ...componentTokens.text.body,
    color: designTokens.colors.semantic.error,
  },
  retryButton: {
    backgroundColor: designTokens.colors.semantic.primary,
    paddingHorizontal: designTokens.spacing.scale.xl,
    paddingVertical: designTokens.spacing.scale.md,
    borderRadius: designTokens.borderRadius.components.button,
  },
  retryText: {
    ...componentTokens.text.body,
    color: designTokens.colors.semantic.surface,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: designTokens.spacing.scale.xl,
    backgroundColor: designTokens.colors.semantic.surface,
    borderRadius: designTokens.borderRadius.components.card,
  },
  emptyStateText: {
    ...componentTokens.text.body,
    color: designTokens.colors.semantic.textSecondary,
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
  content: {
    flex: 1,
    padding: designTokens.spacing.scale.lg,
    width: '100%',
  },
  scrollContent: {
    width: '100%',
    maxWidth: '100%',
  },
  section: {
    marginBottom: designTokens.spacing.scale.xl,
    width: '100%',
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
    width: '100%',
    overflow: 'hidden',
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
    width: '100%',
    maxWidth: '100%',
    minWidth: 0,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    width: '100%',
    maxWidth: '100%',
  },
  inputRow: {
    flexDirection: 'row',
    gap: designTokens.spacing.scale.md,
    width: '100%',
    alignItems: 'flex-start',
    flexWrap: Platform.OS === 'web' ? 'nowrap' : 'wrap',
  },
  halfInput: {
    flex: 1,
    minWidth: 0,
    flexBasis: '48%',
  },
  inputError: {
    borderColor: designTokens.colors.semantic.error,
    borderWidth: 2,
  },
  fieldErrorText: {
    ...componentTokens.text.caption,
    color: designTokens.colors.semantic.error,
    marginTop: -designTokens.spacing.scale.md + 4,
    marginBottom: designTokens.spacing.scale.md,
    marginLeft: designTokens.spacing.scale.sm,
    fontSize: 12,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: designTokens.colors.semantic.surface,
    borderTopLeftRadius: designTokens.borderRadius.lg,
    borderTopRightRadius: designTokens.borderRadius.lg,
    maxHeight: '90%',
    width: '100%',
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: designTokens.spacing.scale.lg,
    borderBottomWidth: 1,
    borderBottomColor: designTokens.colors.semantic.border,
  },
  modalTitle: {
    ...componentTokens.text.subheading,
    fontWeight: designTokens.typography.weights.semibold,
  },
  modalBody: {
    padding: designTokens.spacing.scale.lg,
    maxHeight: 400,
    width: '100%',
  },
  modalScrollContent: {
    width: '100%',
    maxWidth: '100%',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: designTokens.spacing.scale.md,
    padding: designTokens.spacing.scale.lg,
    borderTopWidth: 1,
    borderTopColor: designTokens.colors.semantic.border,
  },
  modalButton: {
    flex: 1,
    paddingVertical: designTokens.spacing.scale.md,
    borderRadius: designTokens.borderRadius.components.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonCancel: {
    backgroundColor: designTokens.colors.semantic.surface,
    borderWidth: 1,
    borderColor: designTokens.colors.semantic.border,
  },
  modalButtonSave: {
    backgroundColor: designTokens.colors.semantic.primary,
  },
  modalButtonText: {
    ...componentTokens.text.body,
    color: designTokens.colors.semantic.text,
    fontWeight: '600',
  },
  modalButtonTextPrimary: {
    color: designTokens.colors.components.button.text,
  },
});
