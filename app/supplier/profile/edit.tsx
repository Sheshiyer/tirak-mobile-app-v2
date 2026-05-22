import { logger } from '@/utils/logger';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Save,
  Camera,
  Edit3,
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  Star,
  Award,
  Languages,
  Plus,
  X,
  Instagram,
  Facebook,
  Twitter,
  Clock,
  Users,
} from 'lucide-react-native';
import { RadialGradient } from '@/components/ui/RadialGradient';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Heading, Subheading, Body, Caption } from '@/components/ui/Typography';
import { designTokens, componentTokens } from '@/constants/design-tokens';
import { useCompanionProfile, useCreateOrUpdateCompanionProfile, CompanionProfile, CompanionProfileRequest, CompanionProfileResponse } from '@/app/api/companion/profile';
import { useAuthStore } from '@/stores/auth-store';
import { useQueryClient } from '@tanstack/react-query';
import * as ExpoImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';

interface SupplierProfile {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  bio: string;
  email: string;
  phone: string;
  location: string;
  profilePhoto: string;
  coverPhoto: string;
  gallery: string[];
  languages: string[];
  specialization: string[];
  certifications: string[];
  socialLinks: {
    website?: string;
    instagram?: string;
    facebook?: string;
    twitter?: string;
  };
  experienceStats: {
    yearsOfExperience: number;
    totalGuests: number;
    totalTours: number;
    averageRating: number;
    responseTime: string;
  };
  availability: {
    workingDays: string[];
    workingHours: { start: string; end: string };
    timeZone: string;
  };
}

// Helper to map API response to camelCase state
function mapProfileFromApi(data: any) {
  const read = (...keys: string[]) => {
    for (const key of keys) {
      if (data?.[key] !== undefined && data?.[key] !== null) return data[key];
    }
    return undefined;
  };

  return {
    id: read('id'),
    userId: read('user_id', 'userId'),
    firstName: read('first_name', 'firstName') || '',
    lastName: read('last_name', 'lastName') || '',
    displayName: read('display_name', 'displayName') || '',
    bio: read('bio') || '',
    email: read('email') || '',
    phone: read('phone') || '',
    location: read('location') || '',
    profilePhoto: read('profile_photo', 'profilePhoto'),
    coverPhoto: read('cover_photo', 'coverPhoto'),
    gallery: read('gallery') || [],
    languages: read('languages') || [],
    specialization: read('specialization') || [],
    certifications: read('certifications') || [],
    socialLinks: typeof read('social_links', 'socialLinks') === 'string'
      ? JSON.parse(read('social_links', 'socialLinks'))
      : (read('social_links', 'socialLinks') || {}),
    experienceStats: read('experienceStats') || {
      yearsOfExperience: 0,
      totalGuests: 0,
      averageRating: 0,
      responseTime: 'New',
    },
    dateOfBirth: read('date_of_birth', 'dateOfBirth'),
    gender: read('gender'),
    createdAt: read('created_at', 'createdAt'),
    updatedAt: read('updated_at', 'updatedAt'),
  };
}

export default function ProfileEditScreen() {
  const router = useRouter();
  const { user, updateUser } = useAuthStore();
  const queryClient = useQueryClient();
  // API integration
  const { data: profileData, isLoading: profileLoading } = useCompanionProfile();
  const createOrUpdateProfile = useCreateOrUpdateCompanionProfile();
  const { t } = useTranslation();
  // Local state for editing
  const [profile, setProfile] = useState<CompanionProfile | null>(null);
  const [coverPhotoUri, setCoverPhotoUri] = useState<string | null>(null);
  const [profilePhotoUri, setProfilePhotoUri] = useState<string | null>(null);
  const hasLocalProfilePhotoChange = useRef(false);
  const hasLocalCoverPhotoChange = useRef(false);

  // Populate form when API data loads
  useEffect(() => {
    if (profileData?.data) {
      const mappedProfile = mapProfileFromApi(profileData.data);
      setProfile({
        ...mappedProfile,
        profilePhoto: user?.profileImage || mappedProfile.profilePhoto,
        displayName: mappedProfile.displayName || user?.name || 'Test Companion',
      });
    }
  }, [profileData, user?.profileImage, user?.name]);

  // Helper for safe field update
  const updateProfile = (field: keyof CompanionProfile, value: any) => {
    setProfile(prev => {
      if (!prev) return prev;
      return { ...prev, [field]: value } as CompanionProfile;
    });
  };

  // Helper for nested field update
  const updateNestedField = (parent: keyof CompanionProfile, field: string, value: any) => {
    setProfile(prev => {
      if (!prev) return prev;
      return {
      ...prev,
      [parent]: {
        ...(prev[parent] as any),
        [field]: value,
      },
      } as CompanionProfile;
    });
  };

  const addListItem = (listType: 'languages' | 'specialization' | 'certifications', value: string) => {
    if (value.trim()) {
      setProfile(prev => {
        if (!prev) return prev;
        return {
        ...prev,
          [listType]: [...(prev[listType] as string[]), value.trim()]
        } as CompanionProfile;
      });
    }
  };

  const removeListItem = (listType: 'languages' | 'specialization' | 'certifications', index: number) => {
    setProfile(prev => {
      if (!prev) return prev;
      return {
      ...prev,
        [listType]: (prev[listType] as string[]).filter((_: string, i: number) => i !== index)
      } as CompanionProfile;
    });
  };
  
  // Image picker logic
  // const pickImage = async (onPick: (uri: string) => void) => {
  //   const result = await ExpoImagePicker.launchImageLibraryAsync({
  //     mediaTypes: ExpoImagePicker.MediaTypeOptions.Images,
  //     allowsEditing: true,
  //     aspect: [1, 1],
  //     quality: 0.8,
  //   });
  //   if (!result.canceled && result.assets && result.assets.length > 0) {
  //     onPick(result.assets[0].uri);
  //   }
  // };

  // Image picker logic
  // const pickImage = async (onPick: (uri: string) => void) => {
  //   const result = await ExpoImagePicker.launchImageLibraryAsync({
  //     mediaTypes: ExpoImagePicker.MediaTypeOptions.Images,
  //     allowsEditing: true,
  //     aspect: [1, 1],
  //     quality: 0.8,
  //   });
  //   if (!result.canceled && result.assets && result.assets.length > 0) {
  //     const uri = result.assets[0].uri;
  //     logger.log('Picked image URI:', uri);
  //     onPick(uri);
  //   }
  // };

  const applyPickedImage = (kind: 'cover' | 'profile', uri?: string) => {
    if (!uri) return;

    setProfile(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        coverPhoto: kind === 'cover' ? uri : prev.coverPhoto,
        profilePhoto: kind === 'profile' ? uri : prev.profilePhoto,
      } as CompanionProfile;
    });

    if (kind === 'cover') {
      hasLocalCoverPhotoChange.current = true;
      setCoverPhotoUri(uri);
    } else {
      hasLocalProfilePhotoChange.current = true;
      setProfilePhotoUri(uri);
      updateUser({ profileImage: uri });
    }

    queryClient.setQueryData(['companionProfile'], (current: any) => ({
      success: true,
      message: current?.message || 'Updated locally',
      data: {
        ...(current?.data || profileData?.data || {}),
        cover_photo: kind === 'cover' ? uri : (current?.data?.cover_photo || profile?.coverPhoto),
        profile_photo: kind === 'profile' ? uri : (current?.data?.profile_photo || profile?.profilePhoto),
        coverPhoto: kind === 'cover' ? uri : (current?.data?.coverPhoto || profile?.coverPhoto),
        profilePhoto: kind === 'profile' ? uri : (current?.data?.profilePhoto || profile?.profilePhoto),
      },
    }));
  };

  const chooseImageSource = (kind: 'cover' | 'profile') => {
    Alert.alert(
      kind === 'cover' ? 'Change Cover Photo' : 'Change Profile Photo',
      'Choose an option',
      [
        { text: 'Camera', onPress: () => takePhoto(kind) },
        { text: 'Gallery', onPress: () => pickFromGallery(kind) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleCoverPhotoChange = async () => {
    chooseImageSource('cover');
  };
  
  const handleProfilePhotoChange = async () => {
    chooseImageSource('profile');
  };
  

  const pickFromGallery = async (kind: 'cover' | 'profile') => {
    const permission = await ExpoImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Gallery access needed', 'Please allow photo library access to update your profile photo.');
      return;
    }

    const result = await ExpoImagePicker.launchImageLibraryAsync({
      mediaTypes: ExpoImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: kind === 'cover' ? [16, 9] : [1, 1],
      quality: 0.85,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      applyPickedImage(kind, result.assets[0].uri);
    }
  };

  const takePhoto = async (kind: 'cover' | 'profile') => {
    const permission = await ExpoImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Camera access needed', 'Please allow camera access to update your profile photo.');
      return;
    }

    try {
      const result = await ExpoImagePicker.launchCameraAsync({
        mediaTypes: ExpoImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: kind === 'cover' ? [16, 9] : [1, 1],
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        applyPickedImage(kind, result.assets[0].uri);
      }
    } catch (err: any) {
      Alert.alert('Camera unavailable', err?.message || 'The camera could not be opened on this device.');
    }
  };
  // Helper to convert URI to blob for web
  const uriToBlob = async (uri: string): Promise<Blob> => {
    if (uri.startsWith('data:')) {
      // Handle data URI directly without fetch
      const [header, base64Data] = uri.split(',');
      const mimeMatch = header.match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      
      // Convert base64 to binary
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      return new Blob([bytes], { type: mime });
    }
    
    // For blob URLs or regular URLs
    const response = await fetch(uri);
    return await response.blob();
  };

  // const handleSave = async () => {
  //   if (!profile) return;
  //   if (!profile.firstName.trim() || !profile.lastName.trim() || !profile.displayName.trim()) {
  //     Alert.alert(t('profile.companion.error'), t('profile.companion.errorRequiredFields'));
  //     return;
  //   }
  //   // Prepare payload for API
  //   const payload: any = {
  //     firstName: profile.firstName,
  //     lastName: profile.lastName,
  //     displayName: profile.displayName,
  //     bio: profile.bio,
  //     socialLinks: profile.socialLinks && typeof profile.socialLinks === 'object' ? profile.socialLinks : {},
  //     gender: profile.gender as 'male' | 'female' | 'other',
  //     location: profile.location,
  //     languages: profile.languages,
  //     specialization: profile.specialization,
  //     certifications: profile.certifications,
  //   };
  //   if (profile.dateOfBirth) payload.dateOfBirth = profile.dateOfBirth;
  //   if (coverPhotoUri) payload.coverPhoto = coverPhotoUri;
  //   if (profilePhotoUri) payload.profilePhoto = profilePhotoUri;
  //   logger.log('payload:', payload);
  //   try {
  //     if (coverPhotoUri || profilePhotoUri) {
  //       // Use multipart/form-data
  //       const formData = new FormData();
  //       formData.append('data', JSON.stringify(payload));
  //       if (coverPhotoUri) {
  //         formData.append('coverPhoto', {
  //           uri: coverPhotoUri,
  //           name: 'cover.jpg',
  //           type: 'image/jpeg',
  //         } as any);
  //       }
  //       if (profilePhotoUri) {
  //         formData.append('profilePhoto', {
  //           uri: profilePhotoUri,
  //           name: 'profile.jpg',
  //           type: 'image/jpeg',
  //         } as any);
  //       }
  //       await createOrUpdateProfile.mutateAsync(formData);
  //       await queryClient.invalidateQueries({ queryKey: ['companionProfile'] });
  //       const newProfileData = await queryClient.fetchQuery({ queryKey: ['companionProfile'] }) as CompanionProfileResponse;
  //       setProfile(mapProfileFromApi(newProfileData.data));
  //       setCoverPhotoUri(null);
  //       setProfilePhotoUri(null);
  //     } else {
  //       await createOrUpdateProfile.mutateAsync(payload);
  //       await queryClient.invalidateQueries({ queryKey: ['companionProfile'] });
  //       const newProfileData = await queryClient.fetchQuery({ queryKey: ['companionProfile'] }) as CompanionProfileResponse;
  //       setProfile(mapProfileFromApi(newProfileData.data));
  //     }
  //     Alert.alert(t('profile.companion.profileUpdated'), t('profile.companion.profileUpdatedDescription'), [
  //       { text: 'OK', onPress: () => router.back() },
  //     ]);
  //   } catch (e) {
  //     Alert.alert(t('profile.companion.error'), e instanceof Error ? e.message : t('profile.companion.errorUpdatingProfile'));
  //   }
  // };


  const handleSave = async () => {
    if (!profile) {
      console.error('Profile is null, cannot save');
      return;
    }
    
    if (!profile.firstName?.trim() || !profile.lastName?.trim() || !profile.displayName?.trim()) {
      Alert.alert(t('profile.companion.error'), t('profile.companion.errorRequiredFields'));
      return;
    }

    if (!profile.bio?.trim() || profile.bio.trim().length < 30) {
      Alert.alert(
        'Bio too short',
        'Please write at least 30 characters in your bio so travellers can learn about you.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!profilePhotoUri && !profile.profilePhoto) {
      Alert.alert(
        'Profile Photo Required',
        'Please add a profile photo. Travellers are much more likely to book guides with a clear, welcoming photo.',
        [{ text: 'Add Photo', onPress: handleProfilePhotoChange }, { text: 'Later', style: 'cancel' }]
      );
      return;
    }
    // Prepare payload for API
    const savedProfilePhoto = profilePhotoUri || profile.profilePhoto;
    const savedCoverPhoto = coverPhotoUri || profile.coverPhoto;
    const payload: any = {
      first_name: profile.firstName,
      last_name: profile.lastName,
      display_name: profile.displayName,
      bio: profile.bio,
      social_links: profile.socialLinks && typeof profile.socialLinks === 'object' ? profile.socialLinks : {},
      gender: profile.gender as 'male' | 'female' | 'other',
      location: profile.location,
      languages: profile.languages,
      specialization: profile.specialization,
      certifications: profile.certifications,
      profile_photo: savedProfilePhoto,
      cover_photo: savedCoverPhoto,
    };
    if (profile.dateOfBirth) payload.dateOfBirth = profile.dateOfBirth;
    logger.log('payload:', payload);
    try {
      if (coverPhotoUri || profilePhotoUri) {
        // Use multipart/form-data
        const formData = new FormData();
        formData.append('data', JSON.stringify(payload));
        
        if (coverPhotoUri) {
          if (Platform.OS === 'web') {
            const blob = await uriToBlob(coverPhotoUri);
            formData.append('coverPhoto', blob, 'cover.jpg');
          } else {
            formData.append('coverPhoto', {
              uri: coverPhotoUri,
              name: 'cover.jpg',
              type: 'image/jpeg',
            } as any);
          }
        }
        
        if (profilePhotoUri) {
          if (Platform.OS === 'web') {
            const blob = await uriToBlob(profilePhotoUri);
            formData.append('profilePhoto', blob, 'profile.jpg');
          } else {
            formData.append('profilePhoto', {
              uri: profilePhotoUri,
              name: 'profile.jpg',
              type: 'image/jpeg',
            } as any);
          }
        }
        
        const response = await createOrUpdateProfile.mutateAsync(formData);
        const updatedProfile = mapProfileFromApi(response.data);
        const mergedProfile = {
          ...profile,
          ...updatedProfile,
          profilePhoto: savedProfilePhoto || updatedProfile.profilePhoto,
          coverPhoto: savedCoverPhoto || updatedProfile.coverPhoto,
        } as CompanionProfile;
        setProfile(mergedProfile);
        queryClient.setQueryData(['companionProfile'], {
          success: true,
          message: response.message,
          data: {
            ...response.data,
            first_name: mergedProfile.firstName,
            last_name: mergedProfile.lastName,
            display_name: mergedProfile.displayName,
            profile_photo: mergedProfile.profilePhoto,
            cover_photo: mergedProfile.coverPhoto,
            bio: mergedProfile.bio,
            location: mergedProfile.location,
            languages: mergedProfile.languages,
            specialization: mergedProfile.specialization,
            certifications: mergedProfile.certifications,
          },
        });
        updateUser({
          name: mergedProfile.displayName || `${mergedProfile.firstName} ${mergedProfile.lastName}`.trim(),
          profileImage: mergedProfile.profilePhoto,
          bio: mergedProfile.bio,
          location: mergedProfile.location,
        });
        setCoverPhotoUri(null);
        setProfilePhotoUri(null);
      } else {
        const response = await createOrUpdateProfile.mutateAsync(payload);
        const updatedProfile = mapProfileFromApi(response.data);
        const mergedProfile = {
          ...profile,
          ...updatedProfile,
          profilePhoto: savedProfilePhoto || updatedProfile.profilePhoto,
          coverPhoto: savedCoverPhoto || updatedProfile.coverPhoto,
        } as CompanionProfile;
        setProfile(mergedProfile);
        queryClient.setQueryData(['companionProfile'], {
          success: true,
          message: response.message,
          data: {
            ...response.data,
            first_name: mergedProfile.firstName,
            last_name: mergedProfile.lastName,
            display_name: mergedProfile.displayName,
            profile_photo: mergedProfile.profilePhoto,
            cover_photo: mergedProfile.coverPhoto,
            bio: mergedProfile.bio,
            location: mergedProfile.location,
            languages: mergedProfile.languages,
            specialization: mergedProfile.specialization,
            certifications: mergedProfile.certifications,
          },
        });
        updateUser({
          name: mergedProfile.displayName || `${mergedProfile.firstName} ${mergedProfile.lastName}`.trim(),
          profileImage: mergedProfile.profilePhoto,
          bio: mergedProfile.bio,
          location: mergedProfile.location,
        });
      }
      Alert.alert(t('profile.companion.profileUpdated'), t('profile.companion.profileUpdatedDescription'), [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e) {
      Alert.alert(t('profile.companion.error'), e instanceof Error ? e.message : t('profile.companion.errorUpdatingProfile'));
    }
  };
  const ListEditor = ({
    title,
    items,
    onAdd,
    onRemove,
    placeholder
  }: {
    title: string;
    items: string[];
    onAdd: (value: string) => void;
    onRemove: (index: number) => void;
    placeholder: string;
  }) => {
    const [inputValue, setInputValue] = useState('');
    const inputRef = useRef<TextInput>(null);

    const handleAdd = () => {
      if (!inputValue.trim()) return;
      onAdd(inputValue.trim());
      setInputValue('');
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    };

    return (
    <View style={styles.listEditor}>
      <Body style={styles.listTitle}>{title}</Body>
        <View style={styles.addItemContainer}>
          <TextInput
            ref={inputRef}
            style={styles.addItemInput}
            placeholder={placeholder}
            value={inputValue}
            onChangeText={setInputValue}
            onSubmitEditing={handleAdd}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAdd}
          >
            <Plus size={16} color={designTokens.colors.semantic.primary} />
          </TouchableOpacity>
        </View>
      {items.map((item, index) => (
        <View key={index} style={styles.listItem}>
          <Text style={styles.listItemText}>{item}</Text>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => onRemove(index)}
          >
            <X size={16} color={designTokens.colors.semantic.error} />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
  };


  if (!profile) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.loadingText}>{t('profile.companion.loadingProfile')}</Text>
      </SafeAreaView>
    );
  }
  // Debug: log image URIs before rendering
  // logger.log('coverPhoto:', coverPhotoUri, profile?.coverPhoto);
  // logger.log('profilePhoto:', profilePhotoUri, profile?.profilePhoto);
  return (
    <RadialGradient variant="appBackground" style={styles.container}>
      {/* Header */}
      <SafeAreaView edges={Platform.OS === 'web' ? [] : ['top']} style={[styles.header, Platform.OS === 'web' && styles.webHeader]}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color={designTokens.colors.semantic.text} />
          </TouchableOpacity>

          <View style={styles.headerTitle}>
            <Subheading style={styles.title}>{t('profile.companion.editProfile')}</Subheading>
            <Caption style={styles.subtitle}>{t('profile.companion.updateProfessionalInformation')}</Caption>
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Save size={20} color={designTokens.colors.semantic.surface} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Photos */}
        <Card style={styles.section} padding={16}>
          <Subheading style={styles.sectionTitle}>{t('profile.companion.profilePhotos')}</Subheading>

          {/* Cover Photo */}
          <View style={styles.coverPhotoContainer}>
            <Image
              source={{
                uri: (coverPhotoUri || profile?.coverPhoto)
                  ? coverPhotoUri || profile?.coverPhoto
                  : undefined,
              }}
              style={styles.coverPhoto}
            />
            <TouchableOpacity style={styles.editCoverButton} onPress={handleCoverPhotoChange}>
              <Edit3 size={16} color={designTokens.colors.semantic.surface} />
            </TouchableOpacity>
            <Caption style={styles.photoLabel}>{t('profile.companion.coverPhoto')}</Caption>
          </View>

          {/* Profile Photo */}
          <View style={styles.profilePhotoContainer}>
            <Image
              source={{
                uri: (profilePhotoUri || profile?.profilePhoto)
                  ? profilePhotoUri || profile?.profilePhoto
                  : undefined,
              }}
              style={styles.profilePhoto}
            />
            <TouchableOpacity style={styles.editProfileButton} onPress={handleProfilePhotoChange}>
              <Edit3 size={12} color={designTokens.colors.semantic.surface} />
            </TouchableOpacity>
            <Caption style={[styles.photoLabel, !profilePhotoUri && !profile?.profilePhoto && styles.photoLabelRequired]}>
              {t('profile.companion.profilePhoto')} {!profilePhotoUri && !profile?.profilePhoto ? '(Required)' : ''}
            </Caption>
          </View>
        </Card>
        {/* Basic Information */}
        <Card style={styles.section} padding={16}>
          <Subheading style={styles.sectionTitle}>{t('profile.companion.basicInformation')}</Subheading>

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Body style={styles.inputLabel}>{t('profile.companion.firstName')} *</Body>
              <TextInput
                style={styles.textInput}
                value={profile?.firstName}
                onChangeText={(text) => updateProfile('firstName', text)}
                placeholder={t('profile.companion.enterFirstName')}
              />
            </View>

            <View style={styles.halfInput}>
              <Body style={styles.inputLabel}>{t('profile.companion.lastName')} *</Body>
              <TextInput
                style={styles.textInput}
                value={profile?.lastName}
                onChangeText={(text) => updateProfile('lastName', text)}
                placeholder={t('profile.companion.enterLastName')}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Body style={styles.inputLabel}>{t('profile.companion.displayName')}</Body>
            <TextInput
              style={styles.textInput}
              value={profile?.displayName}
              onChangeText={(text) => updateProfile('displayName', text)}
              placeholder={t('profile.companion.enterDisplayName')}
            />
          </View>

          <View style={styles.inputGroup}>
            <Body style={styles.inputLabel}>{t('profile.companion.bio')} *</Body>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={profile?.bio}
              onChangeText={(text) => updateProfile('bio', text)}
              placeholder={t('profile.companion.enterBio')}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={500}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Caption style={(profile?.bio?.trim().length ?? 0) < 30 ? styles.characterCountWarning : styles.characterCount}>
                {(profile?.bio?.trim().length ?? 0) < 30 ? `Minimum 30 characters (${profile?.bio?.trim().length ?? 0}/30)` : '✓ Good length'}
              </Caption>
              <Caption style={styles.characterCount}>
                {profile?.bio?.length ?? 0}/500
              </Caption>
            </View>
          </View>
        </Card>

        {/* Contact Information */}
        <Card style={styles.section} padding={16}>
          <Subheading style={styles.sectionTitle}>{t('profile.companion.contactInformation')}</Subheading>

          <View style={styles.inputGroup}>
            <Body style={styles.inputLabel}>{t('profile.companion.location')}</Body>
            <View style={styles.inputWithIcon}>
              <MapPin size={16} color={designTokens.colors.semantic.primary} />
              <TextInput
                style={styles.inputWithIconText}
                value={profile?.location}
                onChangeText={(text) => updateProfile('location', text)}
                placeholder={t('profile.companion.enterLocation')}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Body style={styles.inputLabel}>{t('profile.companion.emailAddress')}</Body>
            <View style={styles.inputWithIcon}>
              <Mail size={16} color={designTokens.colors.semantic.primary} />
              <TextInput
                style={styles.inputWithIconText}
                value={user?.email || ''}
                placeholder={t('profile.companion.enterEmail')}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={true}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Body style={styles.inputLabel}>{t('profile.companion.phoneNumber')}</Body>
            <View style={styles.inputWithIcon}>
              <Phone size={16} color={designTokens.colors.semantic.primary} />
              <TextInput
                style={styles.inputWithIconText}
                value={user?.phone || ''}
                placeholder={t('profile.companion.enterPhoneNumber')}
                keyboardType="phone-pad"
                editable={true}
              />
            </View>
          </View>
        </Card>

        {/* Professional Information */}
        <Card style={styles.section} padding={16}>
          <Subheading style={styles.sectionTitle}>{t('profile.companion.professionalInformation')}</Subheading>

          <ListEditor
            title={t('profile.companion.languages')}
            items={profile?.languages || []}
            onAdd={val => addListItem('languages', val)}
            onRemove={index => removeListItem('languages', index)}
            placeholder={t('profile.companion.enterLanguages')}
          />

          <ListEditor
            title={t('profile.companion.specialization')}
            items={profile?.specialization || []}
            onAdd={val => addListItem('specialization', val)}
            onRemove={index => removeListItem('specialization', index)}
            placeholder={t('profile.companion.enterSpecialization')}
          />

          <ListEditor
            title={t('profile.companion.certifications')}
            items={profile?.certifications || []}
            onAdd={val => addListItem('certifications', val)}
            onRemove={index => removeListItem('certifications', index)}
            placeholder={t('profile.companion.enterCertifications')}
          />
        </Card>

        {/* Social Links */}
        <Card style={styles.section} padding={16}>
          <Subheading style={styles.sectionTitle}>{t('profile.companion.socialLinks')}</Subheading>

          <View style={styles.inputGroup}>
            <Body style={styles.inputLabel}>{t('profile.companion.website')}</Body>
            <View style={styles.inputWithIcon}>
              <Globe size={16} color={designTokens.colors.semantic.primary} />
              <TextInput
                style={styles.inputWithIconText}
                value={profile?.socialLinks?.website || ''}
                onChangeText={(text) => updateNestedField('socialLinks', 'website', text)}
                placeholder={t('profile.companion.enterWebsite')}
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Body style={styles.inputLabel}>{t('profile.companion.instagram')}</Body>
            <View style={styles.inputWithIcon}>
              <Instagram size={16} color={designTokens.colors.semantic.primary} />
              <TextInput
                style={styles.inputWithIconText}
                value={profile?.socialLinks?.instagram || ''}
                onChangeText={(text) => updateNestedField('socialLinks', 'instagram', text)}
                placeholder={t('profile.companion.enterInstagram')}
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Body style={styles.inputLabel}>{t('profile.companion.facebook')}</Body>
            <View style={styles.inputWithIcon}>
              <Facebook size={16} color={designTokens.colors.semantic.primary} />
              <TextInput
                style={styles.inputWithIconText}
                value={profile?.socialLinks?.facebook || ''}
                onChangeText={(text) => updateNestedField('socialLinks', 'facebook', text)}
                placeholder={t('profile.companion.enterFacebook')}
                autoCapitalize="none"
              />
            </View>
          </View>
        </Card>

        {/* Experience Stats */}
        <Card style={styles.section} padding={16}>
          <Subheading style={styles.sectionTitle}>{t('profile.companion.experienceStatistics')}</Subheading>
          <Caption style={styles.sectionDescription}>
            {t('profile.companion.experienceStatisticsDescription')}
          </Caption>

          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Award size={16} color={designTokens.colors.semantic.primary} />
              <View style={styles.statContent}>
                <Body style={styles.statValue}>{profile?.experienceStats.yearsOfExperience}</Body>
                <Caption style={styles.statLabel}>{t('profile.companion.yearsExperience')}</Caption>
              </View>
            </View>

            <View style={styles.statItem}>
              <Users size={16} color={designTokens.colors.semantic.success} />
              <View style={styles.statContent}>
                <Body style={styles.statValue}>{profile?.experienceStats.totalGuests.toLocaleString()}</Body>
                <Caption style={styles.statLabel}>{t('profile.companion.totalGuests')}</Caption>
              </View>
            </View>

            <View style={styles.statItem}>
              <Star size={16} color="#FFD700" />
              <View style={styles.statContent}>
                <Body style={styles.statValue}>{profile?.experienceStats.averageRating}</Body>
                <Caption style={styles.statLabel}>{t('profile.companion.averageRating')}</Caption>
              </View>
            </View>

            <View style={styles.statItem}>
              <Clock size={16} color={designTokens.colors.semantic.accent} />
              <View style={styles.statContent}>
                <Body style={styles.statValue}>{profile?.experienceStats.responseTime}</Body>
                <Caption style={styles.statLabel}>{t('profile.companion.responseTime')}</Caption>
              </View>
            </View>
          </View>
        </Card>
      </ScrollView>
    </RadialGradient>
  );
}

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
    backgroundColor: designTokens.colors.semantic.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: designTokens.spacing.scale.md,
    paddingBottom: designTokens.spacing.scale.xl,
  },
  section: {
    marginBottom: designTokens.spacing.scale.md,
  },
  sectionTitle: {
    marginBottom: designTokens.spacing.scale.md,
  },
  sectionDescription: {
    color: designTokens.colors.semantic.textSecondary,
    marginBottom: designTokens.spacing.scale.md,
  },
  coverPhotoContainer: {
    marginBottom: designTokens.spacing.scale.md,
    position: 'relative',
  },
  coverPhoto: {
    width: '100%',
    height: 120,
    borderRadius: designTokens.borderRadius.components.card,
  },
  editCoverButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: designTokens.colors.semantic.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profilePhotoContainer: {
    alignItems: 'center',
    marginBottom: designTokens.spacing.scale.md,
    position: 'relative',
  },
  profilePhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: designTokens.colors.semantic.surface,
  },
  editProfileButton: {
    position: 'absolute',
    bottom: 20,
    right: '35%',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: designTokens.colors.semantic.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoLabel: {
    marginTop: designTokens.spacing.scale.xs,
    textAlign: 'center',
    color: designTokens.colors.semantic.textSecondary,
  },
  inputGroup: {
    marginBottom: designTokens.spacing.scale.md,
  },
  inputLabel: {
    fontWeight: '500',
    marginBottom: designTokens.spacing.scale.sm,
  },
  textInput: {
    backgroundColor: designTokens.colors.semantic.surface,
    borderRadius: designTokens.borderRadius.components.card,
    padding: designTokens.spacing.scale.md,
    fontSize: 16,
    color: designTokens.colors.semantic.text,
    borderWidth: 1,
    borderColor: designTokens.colors.semantic.border,
  },
  textArea: {
    minHeight: 100,
  },
  characterCount: {
    textAlign: 'right',
    color: designTokens.colors.semantic.textSecondary,
    marginTop: designTokens.spacing.scale.xs,
  },
  characterCountWarning: {
    color: designTokens.colors.semantic.error || '#E53E3E',
    marginTop: designTokens.spacing.scale.xs,
  },
  photoLabelRequired: {
    color: designTokens.colors.semantic.error || '#E53E3E',
  },
  row: {
    flexDirection: 'row',
    gap: designTokens.spacing.scale.md,
    marginBottom: designTokens.spacing.scale.md,
  },
  halfInput: {
    flex: 1,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: designTokens.colors.semantic.surface,
    borderRadius: designTokens.borderRadius.components.card,
    padding: designTokens.spacing.scale.md,
    borderWidth: 1,
    borderColor: designTokens.colors.semantic.border,
  },
  inputWithIconText: {
    flex: 1,
    marginLeft: designTokens.spacing.scale.sm,
    fontSize: 16,
    color: designTokens.colors.semantic.text,
  },
  listEditor: {
    marginBottom: designTokens.spacing.scale.lg,
  },
  listTitle: {
    fontWeight: '500',
    marginBottom: designTokens.spacing.scale.sm,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: designTokens.colors.semantic.surface + '80',
    padding: designTokens.spacing.scale.sm,
    borderRadius: designTokens.borderRadius.components.card,
    marginBottom: designTokens.spacing.scale.xs,
  },
  listItemText: {
    flex: 1,
    color: designTokens.colors.semantic.text,
  },
  removeButton: {
    padding: designTokens.spacing.scale.xs,
  },
  addItemContainer: {
    flexDirection: 'row',
    gap: designTokens.spacing.scale.sm,
  },
  addItemInput: {
    flex: 1,
    backgroundColor: designTokens.colors.semantic.surface,
    borderRadius: designTokens.borderRadius.components.card,
    padding: designTokens.spacing.scale.sm,
    fontSize: 14,
    color: designTokens.colors.semantic.text,
    borderWidth: 1,
    borderColor: designTokens.colors.semantic.border,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: designTokens.colors.semantic.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: designTokens.spacing.scale.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: designTokens.colors.semantic.surface + '80',
    padding: designTokens.spacing.scale.sm,
    borderRadius: designTokens.borderRadius.components.card,
    flex: 1,
    minWidth: '45%',
  },
  statContent: {
    marginLeft: designTokens.spacing.scale.sm,
  },
  statValue: {
    fontWeight: '600',
    marginBottom: 2,
  },
  statLabel: {
    color: designTokens.colors.semantic.textSecondary,
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
