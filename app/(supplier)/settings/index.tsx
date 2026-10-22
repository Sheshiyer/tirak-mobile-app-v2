import { logger } from '@/utils/logger';
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, Platform, Linking, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, useRouter } from 'expo-router';
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
import { useAuthStore } from '@/stores/auth-store';
import Constants from 'expo-constants';
import { useTranslation } from 'react-i18next';
import { useAuthStoreHydrated } from '@/hooks/useAuthStoreHydrated';
import { deleteCompanionAccount, deleteSupplierAccount, deleteUserAccount } from '@/services/api/auth/delete';
import {
  HELP_CENTER_EMAIL,
  HELP_CENTER_MAILTO,
  SUPPORT_EMAIL,
  SUPPORT_MAILTO,
} from '@/constants/support';
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from '@/services/api/notifications/notifications';
import { Smartphone, Mail } from 'lucide-react-native';
import CustomerSettingsScreen from '@/app/(app)/settings';
import { AccountEmailVerification } from '@/components/AccountEmailVerification';
import { AccountClosureConfirmation, ACCOUNT_CLOSURE_MESSAGE } from '@/components/AccountClosureConfirmation';
import { AccountPrivacyPreferences } from '@/components/AccountPrivacyPreferences';



export default function SettingsScreen() {
  const { isHydrated, user } = useAuthStoreHydrated();
  if (!isHydrated) return <ActivityIndicator accessibilityLabel="Loading account settings" />;
  if (!user) return <Redirect href="/auth" />;
  // Both route groups resolve to /settings on a cold link. Render the right
  // screen directly instead of redirecting back into the ambiguous URL.
  if (user.userType === 'customer') return <CustomerSettingsScreen />;
  return <SupplierSettingsScreen />;
}

function SupplierSettingsScreen() {
  const router = useRouter();
  const { setIsSupplier } = useSupplierStore();
  const { logout } = useAuthStore();

  const { user } = useAuthStoreHydrated();
  const isCompanion = user?.userType === 'companion' || user?.userType === 'supplier';
  const [notificationsEnabled, setNotificationsEnabled] = React.useState<boolean | null>(null);
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = React.useState<boolean | null>(null);
  const { data: notificationPreferences, isLoading: loadingPreferences, error: preferencesError, refetch: refetchPreferences } = useNotificationPreferences();
  const preferences = notificationPreferences?.success === true ? notificationPreferences.data?.preferences : undefined;
  const preferencesReady = !loadingPreferences && !preferencesError && typeof preferences?.push === 'boolean' && typeof preferences?.email === 'boolean';
  const updateNotificationPreferences = useUpdateNotificationPreferences();
  const [preferenceError, setPreferenceError] = React.useState('');
  const { t } = useTranslation();

  React.useEffect(() => {
    const preferences = notificationPreferences?.data?.preferences;
    if (!preferences) return;
    setNotificationsEnabled(preferences.push);
    setEmailNotificationsEnabled(preferences.email);
  }, [notificationPreferences]);

  const updatePreference = (key: 'push' | 'email', value: boolean) => {
    if (!preferencesReady || updateNotificationPreferences.isPending) return;
    setPreferenceError('');
    if (key === 'push') setNotificationsEnabled(value);
    if (key === 'email') setEmailNotificationsEnabled(value);
    updateNotificationPreferences.mutate(
      { [key]: value },
      {
        onError: () => {
          if (key === 'push') setNotificationsEnabled(!value);
          if (key === 'email') setEmailNotificationsEnabled(!value);
          setPreferenceError(t('settingsFlow.privacySaveError'));
        },
      }
    );
  };

  const [supportError, setSupportError] = React.useState('');
  const openExternalLink = async (url: string, fallbackMessage: string) => {
    setSupportError('');
    try {
      await Linking.openURL(url);
    } catch {
      if (Platform.OS === 'web') setSupportError(`Unable to open your email app. ${fallbackMessage}`);
      else Alert.alert('Unable to open link', fallbackMessage);
    }
  };

  const [showClosure, setShowClosure] = React.useState(false);
  const deletingRef = React.useRef(false);
  const performDelete = async () => {
    if (deletingRef.current) return;
    if (!user?.id) throw new Error('Please sign in again before closing your account.');
    deletingRef.current = true;
    try {
      const response = user.userType === 'supplier'
        ? await deleteSupplierAccount(user.id)
        : user.userType === 'companion'
          ? await deleteCompanionAccount(user.id)
          : await deleteUserAccount(user.id);
      if (!response.success) throw new Error(response.message || 'Unable to close your account. Please try again.');
      await logout();
      if (typeof window !== 'undefined') window.location.href = '/auth';
      else router.replace('/auth');
    } finally { deletingRef.current = false; }
  };
  const handleDeleteAccount = () => {
    if (Platform.OS === 'web') setShowClosure(true);
    else Alert.alert(t('settings.deleteAccount'), ACCOUNT_CLOSURE_MESSAGE, [
      {text:t('settings.cancel'),style:'cancel'},
      {text:t('settings.deleteAccount'),onPress:()=>{
        void performDelete().catch(error=>Alert.alert('Error', error instanceof Error ? error.message : 'Network error. Please try again.'));
      }},
    ]);
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
        <View style={styles.section}>
          <View style={styles.card}><AccountEmailVerification /></View>
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
          <Text style={styles.sectionTitle}>{t('settingsFlow.bookingAlerts')}</Text>
          {loadingPreferences ? <ActivityIndicator accessibilityLabel="Loading notification preferences" /> : !preferencesReady ? <View><Text accessibilityRole="alert">Unable to load notification preferences.</Text><TouchableOpacity accessibilityRole="button" accessibilityLabel="Retry notification preferences" onPress={()=>{void refetchPreferences();}}><Text style={{paddingVertical:12}}>Retry</Text></TouchableOpacity></View> : null}
          {preferenceError ? <Text accessibilityRole="alert">{preferenceError}</Text> : null}
          
          {preferencesReady && <View style={styles.card}>
            <View style={styles.settingItem}>
              <View style={styles.settingIcon}>
                <Smartphone size={20} color={designTokens.colors.semantic.surface} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>{t('settingsFlow.pushAlerts')}</Text>
                <Text style={styles.settingDescription}>
                  {t('settingsFlow.pushDescription')}
                </Text>
              </View>
              <Switch
                accessibilityLabel={t('settingsFlow.pushAlerts')}
                disabled={!preferencesReady || updateNotificationPreferences.isPending}
                value={notificationsEnabled ?? preferences?.push ?? false}
                onValueChange={(value) => updatePreference('push', value)}
                trackColor={{ false: colors.lightGray, true: colors.primaryLight }}
                thumbColor={(notificationsEnabled ?? preferences?.push) ? colors.primary : 'white'}
              />
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.settingItem}>
              <View style={styles.settingIcon}>
                <Mail size={20} color={designTokens.colors.semantic.surface} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>{t('settingsFlow.emailAlerts')}</Text>
                <Text style={styles.settingDescription}>
                  {t('settingsFlow.emailDescription')}
                </Text>
              </View>
              <Switch
                accessibilityLabel={t('settingsFlow.emailAlerts')}
                disabled={!preferencesReady || updateNotificationPreferences.isPending}
                value={emailNotificationsEnabled ?? preferences?.email ?? false}
                onValueChange={(value) => updatePreference('email', value)}
                trackColor={{ false: colors.lightGray, true: colors.primaryLight }}
                thumbColor={(emailNotificationsEnabled ?? preferences?.email) ? colors.primary : 'white'}
              />
            </View>
          </View>}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settingsFlow.coins')}</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => router.push('/referrals' as any)}
            >
              <View style={styles.settingIcon}>
                <Gift size={20} color={designTokens.colors.semantic.surface} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>{t('settingsFlow.invite')}</Text>
                <Text style={styles.settingDescription}>
                  {t('settingsFlow.inviteDescription')}
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
              onPress={() => router.push('/auth/legal?type=privacy')}
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
            <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/auth/legal?type=terms')}>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>{t('settings.termsOfService')}</Text>
                <Text style={styles.settingDescription}>{t('settings.termsOfServiceDescription')}</Text>
              </View>
              <ChevronRight size={20} color={designTokens.colors.semantic.text} />
            </TouchableOpacity>
            <View style={{ paddingHorizontal: 16 }}><AccountPrivacyPreferences /></View>
            
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
          {supportError ? <Text selectable accessibilityRole="alert" style={{paddingVertical:12}}>{supportError}</Text> : null}
          
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
                <Text selectable style={styles.settingDescription}>
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
                <Text selectable style={styles.settingDescription}>
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
      <AccountClosureConfirmation visible={showClosure} onClose={()=>setShowClosure(false)} onConfirm={performDelete} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: designTokens.colors.semantic.background,
  },
  scrollContent: {
    flexGrow: 1, width: '100%', maxWidth: 720, alignSelf: 'center',
    padding: 24, paddingBottom: 40,
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
    minHeight: 72,
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
