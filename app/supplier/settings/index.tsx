import { logger } from '@/utils/logger';
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { 
  User, 
  Bell, 
  Shield, 
  CreditCard, 
  HelpCircle, 
  LogOut, 
  ChevronRight 
} from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useSupplierStore } from '@/stores/supplier-store';
import { designTokens } from '@/constants/design-tokens';
import { useCompanionProfile } from '@/app/api/companion/profile';
import { useAuthStore } from '@/stores/auth-store';
import Constants from 'expo-constants';
import {
  HELP_CENTER_EMAIL,
  HELP_CENTER_MAILTO,
  PRIVACY_POLICY_URL,
  SUPPORT_EMAIL,
  SUPPORT_MAILTO,
} from '@/constants/support';

export default function SettingsScreen() {
  const router = useRouter();
  const { setIsSupplier } = useSupplierStore();
  const { logout } = useAuthStore();
  const { data: companionProfile } = useCompanionProfile();
  logger.log('companionProfile', companionProfile);
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = React.useState(true);

  const openExternalLink = async (url: string, fallbackMessage: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Unable to open link', fallbackMessage);
    }
  };
  
  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", onPress: async () => {
        // Alert.alert("Logging out...", "Please wait while we log you out...");
        await logout();
        router.replace("/auth");
      } },
    ]);
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>
            Manage your account settings and preferences.
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <View style={styles.card}>
            <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => router.push('/supplier/profile/edit')}
            >
              <View style={styles.settingIcon}>
                <User size={20} color={colors.primary} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Personal Information</Text>
                <Text style={styles.settingDescription}>
                  Update your profile and personal details
                </Text>
              </View>
              <ChevronRight size={20} color={designTokens.colors.semantic.text} />
            </TouchableOpacity>
            
            <View style={styles.divider} />
            
          </View>
        </View>
        
        {/* <View style={styles.section}>
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
                onValueChange={setNotificationsEnabled}
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
                onValueChange={setEmailNotificationsEnabled}
                trackColor={{ false: colors.lightGray, true: colors.primaryLight }}
                thumbColor={emailNotificationsEnabled ? colors.primary : 'white'}
              />
            </View>
          </View>
        </View> */}
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy & Security</Text>
          
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => openExternalLink(PRIVACY_POLICY_URL, `Visit ${PRIVACY_POLICY_URL}`)}
            >
              <View style={styles.settingIcon}>
                <Shield size={20} color={colors.primary} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Privacy Policy</Text>
                <Text style={styles.settingDescription}>
                  Manage your privacy preferences
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
          <Text style={styles.sectionTitle}>Support</Text>
          
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => openExternalLink(HELP_CENTER_MAILTO, `Email ${HELP_CENTER_EMAIL}`)}
            >
              <View style={styles.settingIcon}>
                <HelpCircle size={20} color={colors.primary} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Help Center</Text>
                <Text style={styles.settingDescription}>
                  Email {HELP_CENTER_EMAIL}
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
                <HelpCircle size={20} color={colors.primary} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Contact Support</Text>
                <Text style={styles.settingDescription}>
                  Email {SUPPORT_EMAIL}
                </Text>
              </View>
              <ChevronRight size={20} color={designTokens.colors.semantic.text} />
            </TouchableOpacity>
          </View>
        </View>
{/*         
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <LogOut size={20} color={colors.error} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity> */}
        
        <Text style={styles.versionText}>{`Version ${Constants.expoConfig?.version}`}</Text>
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
});
