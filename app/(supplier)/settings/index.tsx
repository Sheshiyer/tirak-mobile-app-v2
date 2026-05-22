import { logger } from '@/utils/logger';
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, Platform, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { 
  User, 
  Bell, 
  Shield, 
  CreditCard, 
  HelpCircle, 
  LogOut, 
  ChevronRight,
  Globe,
  Contact2,
  ChevronLeft,
  Trash2,
  Gift,
} from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useSupplierStore } from '@/stores/supplier-store';
import { designTokens } from '@/constants/design-tokens';
import { useCompanionProfile } from '@/app/api/companion/profile';
import { useAuthStore } from '@/stores/auth-store';
import Constants from 'expo-constants';
import { useTranslation } from 'react-i18next';
import { useAuthStoreHydrated } from '@/hooks/useAuthStoreHydrated';
import { deleteCompanionAccount, deleteSupplierAccount, deleteUserAccount } from '@/app/api/auth/delete';
import {
  HELP_CENTER_EMAIL,
  HELP_CENTER_MAILTO,
  PRIVACY_POLICY_URL,
  SUPPORT_EMAIL,
  SUPPORT_MAILTO,
} from '@/constants/support';
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from '@/app/api/notifications/notifications';

export default function SettingsScreen() {
  const router = useRouter();
  const { setIsSupplier } = useSupplierStore();
  const { logout } = useAuthStore();

  const { user } = useAuthStoreHydrated();
  const isCompanion = user?.userType === 'companion' || user?.userType === 'supplier';
  // logger.log('companionProfile', companionProfile);
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = React.useState(true);
  const { data: notificationPreferences } = useNotificationPreferences();
  const updateNotificationPreferences = useUpdateNotificationPreferences();
  const { t } = useTranslation();

  React.useEffect(() => {
    const preferences = notificationPreferences?.data?.preferences;
    if (!preferences) return;
    setNotificationsEnabled(preferences.push);
    setEmailNotificationsEnabled(preferences.email);
  }, [notificationPreferences]);

  const updatePreference = (key: 'push' | 'email', value: boolean) => {
    if (key === 'push') setNotificationsEnabled(value);
    if (key === 'email') setEmailNotificationsEnabled(value);
    updateNotificationPreferences.mutate(
      { [key]: value },
      {
        onError: () => {
          if (key === 'push') setNotificationsEnabled(!value);
          if (key === 'email') setEmailNotificationsEnabled(!value);
          Alert.alert('Unable to update settings', 'Please try again.');
        },
      }
    );
  };

  const openExternalLink = async (url: string, fallbackMessage: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Unable to open link', fallbackMessage);
    }
  };

  const handleDeleteAccount = async () => {
    const performDelete = async () => {
      if (user?.userType === 'supplier') {
        logger.log('Deleting supplier account...');
        await deleteSupplierAccount(user?.id || '');
        await logout();
      } else if (user?.userType === 'companion') {
        logger.log('Deleting companion account...');
        await deleteCompanionAccount(user?.id || '');
        await logout();
      } else {
        logger.log('Deleting user account...');
        await deleteUserAccount(user?.id || '');
        await logout();
      }
      
      // On web, force a page reload to ensure complete cleanup
      if (typeof window !== 'undefined') {
        window.location.href = '/auth';
      } else {
        router.replace("/auth");
      }
    };

    // Web-compatible confirmation
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`${t('settings.deleteAccount')}\n\n${t('settings.deleteAccountDescription')}`);
      if (confirmed) {
        await performDelete();
      }
    } else {
      Alert.alert(t('settings.deleteAccount'), t('settings.deleteAccountDescription'), [
        { text: t('settings.cancel'), style: "cancel" },
        { text: t('settings.deleteAccount'), onPress: performDelete },
      ]);
    }
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <ChevronLeft size={20} color={designTokens.colors.semantic.text} />
      </TouchableOpacity>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{t('settings.settings')}</Text>
          <Text style={styles.subtitle}>
            {t('settings.settingsDescription')}
          </Text>
        </View>
        
        {isCompanion && (
          <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.account')}</Text>
          
          <View style={styles.card}>
            <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => router.push('/supplier/profile/edit')}
            >
              <View style={styles.settingIcon}>
                <User size={20} color={designTokens.colors.semantic.surface} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>{t('settings.personalInformation')}</Text>
                <Text style={styles.settingDescription}>
                    {t('settings.personalInformationDescription')}
                </Text>
              </View>
              <ChevronRight size={20} color={designTokens.colors.semantic.text} />
            </TouchableOpacity>
            
            <View style={styles.divider} />
            
          </View>
        </View>
        ) }

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.language')}</Text>
          
          <View style={styles.card}>
            <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => router.push('/supplier/profile/language')}
            >
              <View style={styles.settingIcon}>
                <Globe size={20} color={designTokens.colors.semantic.surface} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>{t('settings.language')}</Text>
                <Text style={styles.settingDescription}>
                  {t('settings.languageDescription')}
                </Text>
              </View>
              <ChevronRight size={20} color={designTokens.colors.semantic.text} />
            </TouchableOpacity>
            
            <View style={styles.divider} />
            
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          
          <View style={styles.card}>
            <View style={styles.settingItem}>
              <View style={styles.settingIcon}>
                <Bell size={20} color={colors.primary} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Push Notifications</Text>
                <Text style={styles.settingDescription}>
                  Receive notifications for bookings and messages
                </Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={(value) => updatePreference('push', value)}
                trackColor={{ false: colors.lightGray, true: colors.primaryLight }}
                thumbColor={notificationsEnabled ? colors.primary : 'white'}
              />
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.settingItem}>
              <View style={styles.settingIcon}>
                <Bell size={20} color={colors.primary} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Email Notifications</Text>
                <Text style={styles.settingDescription}>
                  Receive email notifications for bookings and messages
                </Text>
              </View>
              <Switch
                value={emailNotificationsEnabled}
                onValueChange={(value) => updatePreference('email', value)}
                trackColor={{ false: colors.lightGray, true: colors.primaryLight }}
                thumbColor={emailNotificationsEnabled ? colors.primary : 'white'}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rewards</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => router.push('/referrals' as any)}
            >
              <View style={styles.settingIcon}>
                <Gift size={20} color={designTokens.colors.semantic.surface} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Referral Program</Text>
                <Text style={styles.settingDescription}>
                  Invite travelers or guides and earn Tirak Coins
                </Text>
              </View>
              <ChevronRight size={20} color={designTokens.colors.semantic.text} />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.privacyPolicy')}</Text>
          
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => openExternalLink(PRIVACY_POLICY_URL, `Visit ${PRIVACY_POLICY_URL}`)}
            >
              <View style={styles.settingIcon}>
                <Shield size={20} color={designTokens.colors.semantic.surface} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>{t('settings.privacyPolicy')}</Text>
                <Text style={styles.settingDescription}>
                  {t('settings.privacyPolicyDescription')}
                </Text>
              </View>
              <ChevronRight size={20} color={designTokens.colors.semantic.text} />
            </TouchableOpacity>
            
            {/* <View style={styles.divider} /> */}
            
            {/* <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingIcon}>
                <Shield size={20} color={colors.primary} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Security</Text>
                <Text style={styles.settingDescription}>
                  Change password and security settings
                </Text>
              </View>
              <ChevronRight size={20} color={designTokens.colors.semantic.text} />
            </TouchableOpacity> */}
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.support')}</Text>
          
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => openExternalLink(HELP_CENTER_MAILTO, `Email ${HELP_CENTER_EMAIL}`)}
            >
              <View style={styles.settingIcon}>
                <HelpCircle size={20} color={designTokens.colors.semantic.surface} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>{t('settings.helpCenter')}</Text>
                <Text style={styles.settingDescription}>
                  {HELP_CENTER_EMAIL}
                </Text>
              </View>
              <ChevronRight size={20} color={designTokens.colors.semantic.text} />
            </TouchableOpacity>
            
            <View style={styles.divider} />
            
            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => openExternalLink(SUPPORT_MAILTO, `Email ${SUPPORT_EMAIL}`)}
            >
              <View style={styles.settingIcon}>
                <Contact2 size={20} color={designTokens.colors.semantic.surface} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>{t('settings.contactSupport')}</Text>
                <Text style={styles.settingDescription}>
                  {SUPPORT_EMAIL}
                </Text>
              </View>
              <ChevronRight size={20} color={designTokens.colors.semantic.text} />
            </TouchableOpacity>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleDeleteAccount}
        >
          <Trash2 size={20} color={colors.error} />
          <Text style={styles.logoutText}>{t('settings.deleteAccount')}</Text>
        </TouchableOpacity>
        
        <Text style={styles.versionText}>{`${t('settings.version')} ${Constants.expoConfig?.version}`}</Text>
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
    color: designTokens.colors.semantic.text,
    marginBottom: 16,
    lineHeight: 22,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: designTokens.colors.semantic.text,
    marginBottom: 12,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: designTokens.colors.semantic.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: designTokens.colors.semantic.text,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: designTokens.colors.semantic.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.lightGray,
    marginHorizontal: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 24,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.error,
    marginLeft: 8,
  },
  versionText: {
    fontSize: 14,
    color: designTokens.colors.semantic.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  backButton: {
    padding: 8,
    backgroundColor: designTokens.colors.semantic.surface,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
    marginTop: 16,
  },
});
