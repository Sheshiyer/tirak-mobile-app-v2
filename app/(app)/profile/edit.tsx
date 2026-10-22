import { logger } from '@/utils/logger';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  SafeAreaView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useCustomerProfile, useUpdateCustomerProfile } from '@/services/api/customer/customerProfile';

import { RadialGradient } from '@/components/ui/RadialGradient';
import { ProfileImage } from '@/components/ui/ProfileImage';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
  ArrowLeft,
  Camera,
  Save,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
} from 'lucide-react-native';
import designTokens from '@/constants/design-tokens';
import { SimpleInput } from '@/components/ui/SimpleInput';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/auth-store';
import { chooseProfileImage } from '@/utils/profile-image-picker';

export default function ProfileEditScreen() {
  const { data, isLoading, error } = useCustomerProfile() as any;
  const updateProfile = useUpdateCustomerProfile() as any;
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { user, updateUser } = useAuthStore();
  
  // Initialize form with auth store data to prevent empty flash
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    dateOfBirth: user?.dateOfBirth || '',
  });
  const [profileImage, setProfileImage] = useState<string>(
    user?.profileImage || ''
  );
  const [feedback, setFeedback] = useState('');
  const notify: typeof Alert.alert = (title, message, buttons, options) => {
    if (Platform.OS === 'web') setFeedback([title, message].filter(Boolean).join(': '));
    else Alert.alert(title, message, buttons, options);
  };
  const goBack = () => router.canGoBack() ? router.back() : router.replace('/(app)');
  const hasLocalProfileImageChange = React.useRef(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date | null>(null);

  React.useEffect(() => {
    if ((data as any)?.data) {
      setFormData({
        name: (data as any).data.name || '',
        email: (data as any).data.email || '',
        phone: (data as any).data.phone || '',
        bio: (data as any).data.bio || '',
        dateOfBirth: (data as any).data.dateOfBirth || '',
      });
      const storedProfileImage = user?.profileImage || (data as any).data.profileImage;
      if (storedProfileImage && !hasLocalProfileImageChange.current) {
        setProfileImage(storedProfileImage);
      }
    }
  }, [data, user?.profileImage]);

  const handleSave = () => {
    if (updateProfile.isPending) return;
    setFeedback('');
    const nextProfile = {
      ...formData,
      id: user?.id,
      profileImage,
    } as any;

    updateProfile.mutate(
      nextProfile,
      {
        onSuccess: (response: any) => {
          const updatedProfile = response?.data || nextProfile;
          const savedProfileImage = updatedProfile.profileImage || nextProfile.profileImage;
          updateUser({
            name: updatedProfile.name || nextProfile.name,
            phone: updatedProfile.phone || nextProfile.phone,
            bio: updatedProfile.bio || nextProfile.bio,
            dateOfBirth: updatedProfile.dateOfBirth || nextProfile.dateOfBirth,
            profileImage: savedProfileImage,
          });
          queryClient.setQueryData(['customerProfile'], {
            success: true,
            data: {
              ...(data as any)?.data,
              ...updatedProfile,
              profileImage: savedProfileImage,
            },
          });
          notify(
            t('profile.customer.profileUpdated'),
            t('profile.customer.profileUpdatedDescription'),
            [
              {
                text: 'OK',
                onPress: () => {
                  router.replace('/(app)');
                },
              },
            ]
          );
        },
        onError: (err: any) => {
          notify(t('profile.customer.updateFailed'), err?.message || t('profile.customer.updateFailedDescription'));
        },
      }
    );
  };

  const applyPickedImage = (uri?: string) => {
    if (!uri) return;
    hasLocalProfileImageChange.current = true;
    setProfileImage(uri);
  };

  const handleImageEdit = () => {
    setFeedback('');
    chooseProfileImage('profile', uri => {
      applyPickedImage(uri);
      setFeedback(t('profile.customer.saveChanges'));
    }, message => notify(t('profile.customer.updateFailed'), message));
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    // Always update tempDate, don't close modal
    if (selectedDate) {
      setTempDate(selectedDate);
    }
  };

  const handleDatePickerOpen = () => {
    setTempDate(formData.dateOfBirth ? new Date(formData.dateOfBirth) : new Date());
    setShowDatePicker(true);
  };

  const handleDatePickerDone = () => {
    if (tempDate) {
      setFormData({
        ...formData,
        dateOfBirth: tempDate.toISOString().split('T')[0],
      });
    }
    setShowDatePicker(false);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.loadingText}>{t('profile.customer.loadingProfile')}</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <RadialGradient variant="appBackground" style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>{t('profile.customer.errorLoadingProfile')}</Text>
          <Text>{error?.message || t('profile.customer.unknownError')}</Text>
        </View>
      </RadialGradient>
    );
  }

  return (
    <RadialGradient variant="appBackground" style={styles.container}>
      <View style={[styles.header, Platform.OS === 'web' && styles.webHeader]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={goBack}
        >
          <ArrowLeft size={24} color={designTokens.colors.semantic.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('profile.customer.editProfile')}</Text>
        <TouchableOpacity
          style={styles.saveButton}
          accessibilityRole="button"
          accessibilityLabel={t('profile.customer.saveChanges')}
          disabled={updateProfile.isPending}
          onPress={handleSave}
        >
          <Save size={24} color={designTokens.colors.semantic.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {feedback ? <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={{ padding: 16 }}>{feedback}</Text> : null}
        <Card style={styles.profileCard}>
          <View style={styles.profileImageSection}>
            <ProfileImage
              uri={profileImage}
              size={120}
              editable={true}
              onEdit={handleImageEdit}
            />
            <Text style={styles.changePhotoText}>{t('profile.customer.tapToChangePhoto')}</Text>
          </View>
        </Card>

        <Card style={styles.formCard}>
          <Text style={styles.sectionTitle}>{t('profile.customer.personalInformation')}</Text>
          
          <SimpleInput
            label={t('profile.customer.fullName')}
            value={formData.name}
            onChangeText={(text: string) => setFormData({ ...formData, name: text })}
            placeholder={t('profile.customer.enterFullName')}
          />

          <SimpleInput
            label={t('profile.customer.email')}
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            placeholder={t('profile.customer.enterEmail')}
            keyboardType="email-address"
            disabled={true}
          />

          <SimpleInput
            label={t('profile.customer.phoneNumber')}
            value={formData.phone}
            onChangeText={(text) => setFormData({ ...formData, phone: text })}
            placeholder={t('profile.customer.enterPhoneNumber')}
            keyboardType="phone-pad"
          />

          <SimpleInput
            label={t('profile.customer.dateOfBirth')}
            value={formData.dateOfBirth}
            placeholder={t('profile.customer.enterDateOfBirth')}
            editable={false}
            onPressIn={handleDatePickerOpen}
          />
          {Platform.OS === 'ios' ? (
            <Modal
              visible={showDatePicker}
              transparent
              animationType="slide"
              onRequestClose={() => setShowDatePicker(false)}
            >
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, alignItems: 'center' }}>
                  <DateTimePicker
                    value={tempDate || new Date()}
                    mode="date"
                    display="spinner"
                    onChange={handleDateChange}
                    maximumDate={new Date()}
                    style={{ width: 250 }}
                  />
                  <TouchableOpacity onPress={handleDatePickerDone} style={{ marginTop: 12, paddingHorizontal: 24, paddingVertical: 10, backgroundColor: designTokens.colors.semantic.primary, borderRadius: 8 }}>
                    <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>{t('profile.customer.done')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setShowDatePicker(false)} style={{ marginTop: 8 }}>
                    <Text style={{ color: designTokens.colors.semantic.error, fontSize: 14 }}>{t('profile.customer.cancel')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          ) : (
            showDatePicker && (
              <DateTimePicker
                value={tempDate || new Date()}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) {
                    setFormData({
                      ...formData,
                      dateOfBirth: selectedDate.toISOString().split('T')[0],
                    });
                  }
                }}
                maximumDate={new Date()}
              />
            )
          )}

          <SimpleInput
            label={t('profile.customer.bio')}
            value={formData.bio}
            onChangeText={(text) => setFormData({ ...formData, bio: text })}
            placeholder={t('profile.customer.enterBio')}
            multiline
            numberOfLines={4}
            style={styles.bioInput}
          />
        </Card>

        <View style={styles.buttonContainer}>
          <Button
            title={t('profile.customer.saveChanges')}
            onPress={handleSave}
            loading={updateProfile.isPending}
            disabled={updateProfile.isPending}
            variant="primary"
            style={styles.saveButtonLarge}
          />
          
          <Button
            title={t('profile.customer.cancel')}
            onPress={goBack}
            variant="outline"
            style={styles.cancelButton}
          />
        </View>
      </ScrollView>
    </RadialGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  webHeader: {
    paddingTop: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: designTokens.colors.semantic.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: designTokens.colors.semantic.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: designTokens.colors.semantic.text,
  },
  saveButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: designTokens.colors.semantic.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: designTokens.colors.semantic.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  profileCard: {
    marginBottom: 20,
    paddingVertical: 30,
  },
  profileImageSection: {
    alignItems: 'center',
  },
  changePhotoText: {
    marginTop: 12,
    fontSize: 14,
    color: designTokens.colors.semantic.textSecondary,
    fontWeight: '500',
  },
  formCard: {
    marginBottom: 20,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: designTokens.colors.semantic.text,
    marginBottom: 20,
  },
  bioInput: {
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: designTokens.colors.semantic.border,
    borderRadius: designTokens.borderRadius.lg,
    padding: designTokens.spacing.scale.md,
  },
  buttonContainer: {
    paddingBottom: 40,
  },
  saveButtonLarge: {
    marginBottom: 12,
  },
  cancelButton: {
    marginBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: designTokens.colors.semantic.text,
  },
});
