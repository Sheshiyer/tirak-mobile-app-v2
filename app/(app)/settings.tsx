import { useTranslation } from 'react-i18next';
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/auth-store';
import { designTokens } from '@/constants/design-tokens';
import { RadialGradient } from '@/components/ui/RadialGradient';
import { Card } from '@/components/ui/Card';
import { AccountClosureConfirmation, ACCOUNT_CLOSURE_MESSAGE } from '@/components/AccountClosureConfirmation';
import { AccountPrivacyPreferences } from '@/components/AccountPrivacyPreferences';
import {
  User,
  Bell,
  Shield,
  HelpCircle,
  LogOut,
  ChevronRight,
  Globe,
  Star,
  FileText,
  Trash2,
  Mail,
  Gift,
} from 'lucide-react-native';
import { secureStorage } from '@/utils/secure-storage';
import Constants from 'expo-constants';
import {
  HELP_CENTER_EMAIL,
  HELP_CENTER_MAILTO,
  SUPPORT_EMAIL,
  SUPPORT_MAILTO,
} from '@/constants/support';

import { API_BASE_URL as BACKEND_URL } from '@/constants/api';

const APP_VERSION = Constants.expoConfig?.version || '1.5.0';
const CURRENT_YEAR = new Date().getFullYear();

interface SettingsItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress: () => void;
  showChevron?: boolean;
  danger?: boolean;
}

const SettingsItem: React.FC<SettingsItemProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  showChevron = true,
  danger = false,
}) => (
  <TouchableOpacity style={styles.settingsItem} onPress={onPress}>
    <View style={styles.settingsItemLeft}>
      <View style={[styles.iconContainer, danger && styles.dangerIconContainer]}>
        {icon}
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.settingsTitle, danger && styles.dangerText]}>
          {title}
        </Text>
        {subtitle && (
          <Text selectable style={styles.settingsSubtitle}>{subtitle}</Text>
        )}
      </View>
    </View>
    {showChevron && (
      <ChevronRight size={20} color={designTokens.colors.semantic.textSecondary} />
    )}
  </TouchableOpacity>
);

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [showClosure, setShowClosure] = useState(false);
  const deletingRef = useRef(false);

  const [supportError, setSupportError] = useState('');
  const openExternalLink = async (url: string, fallbackMessage: string) => {
    setSupportError('');
    try {
      await Linking.openURL(url);
    } catch {
      if (Platform.OS === 'web') setSupportError(`Unable to open your email app. ${fallbackMessage}`);
      else Alert.alert('Unable to open link', fallbackMessage);
    }
  };

  const handleLogout = () => {
    const performLogout = async () => {
      await logout();
      if (typeof window !== 'undefined') {
        window.location.href = '/auth';
      } else {
        router.replace('/auth');
      }
    };

    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Sign out\n\nSign out of this Tirak account?');
      if (confirmed) performLogout();
    } else {
      Alert.alert('Sign out', 'Sign out of this Tirak account?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign out', style: 'destructive', onPress: performLogout },
      ]);
    }
  };

  const performDeleteAccount = async () => {
    if (deletingRef.current) return;
    if (!user?.id) throw new Error('Please sign in again before closing your account.');
    deletingRef.current = true;
    setDeletingAccount(true);
    try {
      const token = await secureStorage.getItemAsync('authToken');
      const res = await fetch(`${BACKEND_URL}/api/users/${user.id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(`Unable to close your account. Please try again or contact ${SUPPORT_EMAIL}.`);
      await logout();
      if (typeof window !== 'undefined') window.location.href = '/auth';
      else router.replace('/auth');
    } finally {
      deletingRef.current = false;
      setDeletingAccount(false);
    }
  };

  const handleDeleteAccount = () => {
    if (Platform.OS === 'web') setShowClosure(true);
    else Alert.alert('Delete Account', ACCOUNT_CLOSURE_MESSAGE, [
      {text:'Cancel',style:'cancel'},
      {text:'Delete Account',style:'destructive',onPress:()=>{
        void performDeleteAccount().catch(error=>Alert.alert('Error', error instanceof Error ? error.message : 'Network error. Please try again.'));
      }},
    ]);
  };

  return (
    <RadialGradient variant="appBackground" style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <Card style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <Text style={styles.sectionTitle}>{t('settingsFlow.yourAccount')}</Text>
          </View>
          
          <SettingsItem
            icon={<User size={22} color={designTokens.colors.semantic.primary} />}
            title={t('settingsFlow.editProfile')}
            subtitle={t('settingsFlow.editDescription')}
            onPress={() => router.push('/profile/edit')}
          />
          <SettingsItem
            icon={<Mail size={22} color={designTokens.colors.semantic.primary} />}
            title={user?.verified ? t('settingsFlow.emailVerified') : t('settingsFlow.verifyEmail')}
            subtitle={user?.verified ? t('settingsFlow.emailConfirmed') : t('settingsFlow.emailCode')}
            onPress={() => router.push('/auth/verify-email')}
          />
        </Card>

        {/* App Settings */}
        <Card style={styles.settingsCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('settingsFlow.preferences')}</Text>
          </View>
          
          <SettingsItem
            icon={<Bell size={22} color={designTokens.colors.semantic.primary} />}
            title={t('settingsFlow.notifications')}
            subtitle={t('settingsFlow.notificationsDescription')}
            onPress={() =>  router.push('/(app)/profile/notificationSettings')}
          />
          <SettingsItem
            icon={<Gift size={22} color={designTokens.colors.semantic.primary} />}
            title={t('settingsFlow.coins')}
            subtitle={t('settingsFlow.coinsDescription')}
            onPress={() => router.push('/referrals' as any)}
          />
          
        
          
          <SettingsItem
            icon={<Globe size={22} color={designTokens.colors.semantic.primary} />}
            title={t('settings.language')}
            subtitle={t('settings.languageDescription')}
            onPress={() => router.push('/supplier/profile/language')}
          />
        </Card>

        {/* Privacy & Security */}
        <Card style={styles.settingsCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('settingsFlow.trustSafety')}</Text>
          </View>
          
          <SettingsItem
            icon={<Shield size={22} color={designTokens.colors.semantic.primary} />}
            title={t('settings.privacyPolicy')}
            subtitle={t('settings.privacyPolicyDescription')}
            onPress={() => router.push('/auth/legal?type=privacy')}
          />
          <SettingsItem
            icon={<FileText size={22} color={designTokens.colors.semantic.primary} />}
            title={t('settings.termsOfService')}
            subtitle={t('settings.termsOfServiceDescription')}
            onPress={() => router.push('/auth/legal?type=terms')}
          />
          <AccountPrivacyPreferences />
        </Card>

        {/* Support */}
        <Card style={styles.settingsCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Support</Text>
            {supportError ? <Text selectable accessibilityRole="alert" style={{paddingVertical:12}}>{supportError}</Text> : null}
          </View>
          
          <SettingsItem
            icon={<HelpCircle size={22} color={designTokens.colors.semantic.primary} />}
            title="Help Center"
            subtitle={`Email ${HELP_CENTER_EMAIL}`}
            onPress={() => openExternalLink(HELP_CENTER_MAILTO, `Email ${HELP_CENTER_EMAIL}`)}
          />

          <SettingsItem
            icon={<Mail size={22} color={designTokens.colors.semantic.primary} />}
            title="Contact Support"
            subtitle={`Email ${SUPPORT_EMAIL}`}
            onPress={() => openExternalLink(SUPPORT_MAILTO, `Email ${SUPPORT_EMAIL}`)}
          />
          
          <SettingsItem
            icon={<Star size={22} color={designTokens.colors.semantic.primary} />}
            title="Send app feedback"
            subtitle={`Compose an email to ${SUPPORT_EMAIL}`}
            onPress={() => openExternalLink(`${SUPPORT_MAILTO}?subject=${encodeURIComponent('Tirak app feedback')}`, `Email ${SUPPORT_EMAIL}`)}
          />
        </Card>

        {/* Danger Zone */}
        <Card style={styles.settingsCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('settingsFlow.accountAccess')}</Text>
          </View>
          <SettingsItem
            icon={
              deletingAccount
                ? <ActivityIndicator size="small" color={designTokens.colors.semantic.error} />
                : <Trash2 size={22} color={designTokens.colors.semantic.error} />
            }
            title="Delete Account"
            subtitle="Close your account. Booking history may be retained."
            onPress={handleDeleteAccount}
            danger={true}
          />
        </Card>

        {/* Logout */}
        <Card style={styles.settingsCard}>
          <SettingsItem
            icon={<LogOut size={22} color={designTokens.colors.semantic.error} />}
            title="Sign Out"
            subtitle="Leave this Tirak account on this device"
            onPress={handleLogout}
            showChevron={false}
            danger={true}
          />
        </Card>

        <View style={styles.footer}>
          <Text style={styles.versionText}>Version {APP_VERSION}</Text>
          <Text style={styles.copyrightText}>© {CURRENT_YEAR} Tirak. All rights reserved.</Text>
        </View>
      </ScrollView>
      <AccountClosureConfirmation visible={showClosure} onClose={()=>setShowClosure(false)} onConfirm={performDeleteAccount} />
    </RadialGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: { flex: 1 },
  scrollContent: { width: '100%', maxWidth: 720, alignSelf: 'center', padding: 24, paddingBottom: 40 },
  profileCard: {
    marginBottom: 20,
    padding: 20,
  },
  profileHeader: {
    marginBottom: 16,
  },
  settingsCard: {
    marginBottom: 20,
    padding: 20,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: designTokens.colors.semantic.text,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 64,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: designTokens.colors.semantic.border,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: designTokens.colors.semantic.surface + '80',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  dangerIconContainer: {
    backgroundColor: designTokens.colors.semantic.error + '20',
  },
  textContainer: {
    flex: 1,
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: designTokens.colors.semantic.text,
    marginBottom: 2,
  },
  dangerText: {
    color: designTokens.colors.semantic.error,
  },
  settingsSubtitle: {
    fontSize: 14,
    color: designTokens.colors.semantic.textSecondary,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  versionText: {
    fontSize: 14,
    color: designTokens.colors.semantic.textSecondary,
    marginBottom: 4,
  },
  copyrightText: {
    fontSize: 12,
    color: designTokens.colors.semantic.textSecondary,
  },
});
