import React, { useState } from 'react';
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
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import {
  HELP_CENTER_EMAIL,
  HELP_CENTER_MAILTO,
  PRIVACY_POLICY_URL,
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
          <Text style={styles.settingsSubtitle}>{subtitle}</Text>
        )}
      </View>
    </View>
    {showChevron && (
      <ChevronRight size={20} color={designTokens.colors.semantic.textSecondary} />
    )}
  </TouchableOpacity>
);

export default function SettingsScreen() {
  const { user, logout } = useAuthStore();
  const [deletingAccount, setDeletingAccount] = useState(false);

  const openExternalLink = async (url: string, fallbackMessage: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Unable to open link', fallbackMessage);
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
      const confirmed = window.confirm('Logout\n\nAre you sure you want to logout?');
      if (confirmed) performLogout();
    } else {
      Alert.alert('Logout', 'Are you sure you want to logout?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: performLogout },
      ]);
    }
  };

  const handleDeleteAccount = () => {
    const confirmDelete = () => {
      Alert.alert(
        'Delete Account',
        'This action is permanent. Your profile, bookings, and messages will be removed. Are you absolutely sure?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete Forever',
            style: 'destructive',
            onPress: performDeleteAccount,
          },
        ]
      );
    };

    const performDeleteAccount = async () => {
      if (!user?.id) return;
      setDeletingAccount(true);
      try {
        const token = await SecureStore.getItemAsync('authToken');
        const res = await fetch(`${BACKEND_URL}/api/users/${user.id}`, {
          method: 'DELETE',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          await logout();
          if (typeof window !== 'undefined') {
            window.location.href = '/auth';
          } else {
            router.replace('/auth');
          }
        } else {
          Alert.alert('Error', `Failed to delete account. Please contact ${SUPPORT_EMAIL}.`);
        }
      } catch {
        Alert.alert('Error', 'Network error. Please try again.');
      } finally {
        setDeletingAccount(false);
      }
    };

    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Delete Account\n\nThis is permanent. Are you sure?');
      if (confirmed) performDeleteAccount();
    } else {
      confirmDelete();
    }
  };

  return (
    <RadialGradient variant="appBackground" style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <Card style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <Text style={styles.sectionTitle}>Account</Text>
          </View>
          
          <SettingsItem
            icon={<User size={22} color={designTokens.colors.semantic.primary} />}
            title="Edit Profile"
            subtitle="Update your personal information"
            onPress={() => router.push('/profile/edit')}
          />
        </Card>

        {/* App Settings */}
        <Card style={styles.settingsCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>App Settings</Text>
          </View>
          
          <SettingsItem
            icon={<Bell size={22} color={designTokens.colors.semantic.primary} />}
            title="Notifications"
            subtitle="Manage your notification preferences"
            onPress={() =>  router.push('/(app)/profile/notificationSettings')}
          />
          <SettingsItem
            icon={<Gift size={22} color={designTokens.colors.semantic.primary} />}
            title="Referral Program"
            subtitle="Invite friends and earn Tirak Coins"
            onPress={() => router.push('/referrals' as any)}
          />
          
        
          
          <SettingsItem
            icon={<Globe size={22} color={designTokens.colors.semantic.primary} />}
            title="Language"
            subtitle="English"
            onPress={() => {
              Alert.alert('Coming Soon', 'Language settings will be available in a future update.');
            }}
          />
        </Card>

        {/* Privacy & Security */}
        <Card style={styles.settingsCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Privacy & Security</Text>
          </View>
          
          <SettingsItem
            icon={<Shield size={22} color={designTokens.colors.semantic.primary} />}
            title="Privacy Policy"
            subtitle="Read our privacy policy"
            onPress={() => openExternalLink(PRIVACY_POLICY_URL, `Visit ${PRIVACY_POLICY_URL}`)}
          />
          <SettingsItem
            icon={<FileText size={22} color={designTokens.colors.semantic.primary} />}
            title="Terms of Service"
            subtitle="Read our terms of service"
            onPress={() => router.push('/legal?type=terms')}
          />
        </Card>

        {/* Support */}
        <Card style={styles.settingsCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Support</Text>
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
            title="Rate App"
            subtitle="Rate us on the App Store"
            onPress={() => {
              Alert.alert('Thank You!', 'We appreciate your feedback.');
            }}
          />
        </Card>

        {/* Danger Zone */}
        <Card style={styles.settingsCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Account</Text>
          </View>
          <SettingsItem
            icon={
              deletingAccount
                ? <ActivityIndicator size="small" color={designTokens.colors.semantic.error} />
                : <Trash2 size={22} color={designTokens.colors.semantic.error} />
            }
            title="Delete Account"
            subtitle="Permanently delete your account and data"
            onPress={handleDeleteAccount}
            danger={true}
          />
        </Card>

        {/* Logout */}
        <Card style={styles.settingsCard}>
          <SettingsItem
            icon={<LogOut size={22} color={designTokens.colors.semantic.error} />}
            title="Logout"
            subtitle="Sign out of your account"
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
    </RadialGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
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
