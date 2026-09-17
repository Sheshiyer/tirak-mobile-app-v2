import React from 'react';
import { Alert, View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import { useAuthStore } from '@/stores/auth-store';
import { Card } from '@/components/ui/Card';
import { ProfileImage } from '@/components/ui/ProfileImage';
import { RadialGradient } from '@/components/ui/RadialGradient';
import { LinearGradient } from 'expo-linear-gradient';
import { designTokens } from '@/constants/design-tokens';
import {
  isReviewModeEnabled,
  REVIEW_ACCOUNT_LIST,
  type ReviewAccountKey,
} from '@/constants/review-mode';
import {
  Settings,
  LogOut,
  ChevronRight,
  User,
  Bell,
  Shield,
  HelpCircle,
  Heart,
  Star,
  Award,
} from 'lucide-react-native';

export default function ProfileScreen() {
  const { user, logout, switchReviewAccount, isLoading } = useAuthStore();
  const isCompanion = user?.userType === 'companion' || user?.userType === 'supplier';
  const appVersion = Constants.expoConfig?.version ?? 'unknown';

  const handleReviewAccountSwitch = (account: ReviewAccountKey) => {
    const target = REVIEW_ACCOUNT_LIST.find((candidate) => candidate.key === account);
    if (!target || target.user.id === user?.id || isLoading) return;

    const performSwitch = async () => {
      try {
        await switchReviewAccount(account);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to switch account';
        if (Platform.OS === 'web') {
          window.alert(message);
        } else {
          Alert.alert('Account switch failed', message);
        }
      }
    };

    const warning = 'Switching accounts clears the current booking and payment draft.';
    if (Platform.OS === 'web') {
      if (window.confirm(`${target.label}\n\n${warning}`)) void performSwitch();
      return;
    }

    Alert.alert(target.label, warning, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Switch account', onPress: () => void performSwitch() },
    ]);
  };

  const handleLogout = async () => {
    const performLogout = async () => {
      await logout();
      
      // On web, force a page reload to ensure complete cleanup
      if (typeof window !== 'undefined') {
        window.location.href = '/auth';
      } else {
        router.replace('/auth');
      }
    };

    // Web-compatible confirmation
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Sign out\n\nSign out of this Tirak account?');
      if (confirmed) {
        await performLogout();
      }
    } else {
      await performLogout();
    }
  };

  const menuItems = [
    {
      icon: <User size={20} color={designTokens.colors.semantic.text} />,
      title: 'Edit Profile',
      onPress: () => router.push('/profile/edit'),
    },
    {
      icon: <Bell size={20} color={designTokens.colors.semantic.text} />,
      title: 'Notification Preferences',
      onPress: () => router.push('/settings'),
    },

    {
      icon: <Shield size={20} color={designTokens.colors.semantic.text} />,
      title: 'Trust & Safety',
      onPress: () => router.push('/legal'),
    },
    {
      icon: <Heart size={20} color={designTokens.colors.semantic.text} />,
      title: 'Saved Guides',
      onPress: () => router.push('/favorites'),
      hideForCompanion: true,
    },
    {
      icon: <Award size={20} color={designTokens.colors.semantic.text} />,
      title: 'Traveler Reviews',
      onPress: () => router.push('/settings'),
      hideForCustomer: true,
    },
    {
      icon: <HelpCircle size={20} color={designTokens.colors.semantic.text} />,
      title: 'Help & Support',
      onPress: () => router.push('/settings'),
    },
    {
      icon: <Settings size={20} color={designTokens.colors.semantic.text} />,
      title: 'Settings',
      onPress: () => router.push('/settings'),
    },
  ];

  return (
    <RadialGradient variant="appBackground" style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with gradient */}
        <View style={styles.headerContainer}>
          <LinearGradient
            colors={[designTokens.colors.semantic.primary, designTokens.colors.semantic.primary + '80']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.headerGradient}
          >
            <View style={styles.profileHeader}>
              <ProfileImage
                uri={user?.profileImage}
                size="xlarge"
                editable={true}
                onEdit={() => router.push('/profile/edit')}
              />
              <Text style={styles.profileName}>{user?.name || 'User'}</Text>
              <Text style={styles.profileRole}>
                {isCompanion ? 'Local Guide' : 'Traveler'}
              </Text>
              {isCompanion && (
                <View style={styles.statsContainer}>
                  <View style={styles.statItem}>
                    <Star size={16} color={designTokens.colors.semantic.surface} fill={designTokens.colors.semantic.surface} />
                    <Text style={styles.statText}>4.9</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statText}>124 Reviews</Text>
                  </View>
                </View>
              )}
            </View>
          </LinearGradient>
        </View>

        <View style={styles.content}>
          {isReviewModeEnabled() && (
            <Card style={styles.reviewAccountCard} padding={20}>
              <Text style={styles.cardTitle}>App Review Accounts</Text>
              <Text style={styles.reviewAccountIntro}>
                Both pre-populated roles are available without passwords. Switching clears booking and payment drafts.
              </Text>
              {REVIEW_ACCOUNT_LIST.map((account) => {
                const active = account.user.id === user?.id;
                return (
                  <TouchableOpacity
                    key={account.key}
                    accessibilityRole="button"
                    accessibilityLabel={`${account.label}${active ? ', active account' : ''}`}
                    accessibilityHint={active ? undefined : 'Clears the current booking and payment draft before switching'}
                    disabled={active || isLoading}
                    onPress={() => handleReviewAccountSwitch(account.key)}
                    style={[styles.reviewAccountRow, active && styles.reviewAccountRowActive]}
                  >
                    <View style={styles.reviewAccountCopy}>
                      <Text style={styles.reviewAccountLabel}>{account.label}</Text>
                      <Text style={styles.reviewAccountDescription}>{account.description}</Text>
                    </View>
                    <Text style={[styles.reviewAccountStatus, active && styles.reviewAccountStatusActive]}>
                      {active ? 'Active' : 'Switch'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              <Text style={styles.reviewPaymentNote}>
                Review checkout with cash only. PromptPay is disabled and no real payment is created.
              </Text>
            </Card>
          )}

          {/* Quick Stats for Companion */}
          {isCompanion && (
            <Card style={styles.quickStatsCard} padding={20}>
              <Text style={styles.cardTitle}>Guide Snapshot</Text>
              <View style={styles.quickStatsGrid}>
                <View style={styles.quickStatItem}>
                  <Text style={styles.quickStatValue}>12</Text>
                  <Text style={styles.quickStatLabel}>This Month</Text>
                </View>
                <View style={styles.quickStatItem}>
                  <Text style={styles.quickStatValue}>฿45,600</Text>
                  <Text style={styles.quickStatLabel}>Earnings</Text>
                </View>
                <View style={styles.quickStatItem}>
                  <Text style={styles.quickStatValue}>98%</Text>
                  <Text style={styles.quickStatLabel}>Response Rate</Text>
                </View>
              </View>
            </Card>
          )}

          {/* Menu Items */}
          <Card style={styles.menuCard} padding={0}>
            {menuItems.map((item, index) => {
              if ((isCompanion && item.hideForCompanion) || (!isCompanion && item.hideForCustomer)) {
                return null;
              }
              
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.menuItem,
                    index === menuItems.length - 1 && styles.lastMenuItem,
                  ]}
                  onPress={item.onPress}
                >
                  <View style={styles.menuItemLeft}>
                    <View style={styles.menuItemIcon}>
                      {item.icon}
                    </View>
                    <Text style={styles.menuItemText}>{item.title}</Text>
                  </View>
                  <ChevronRight size={20} color={designTokens.colors.semantic.textSecondary} />
                </TouchableOpacity>
              );
            })}
          </Card>

          {/* Logout Button */}
          <Card style={styles.logoutCard} padding={0}>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuItemIcon, styles.logoutIcon]}>
                  <LogOut size={20} color={designTokens.colors.semantic.error} />
                </View>
                <Text style={[styles.menuItemText, styles.logoutText]}>Sign Out</Text>
              </View>
            </TouchableOpacity>
          </Card>

          {/* App Version */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Tirak v{appVersion}</Text>
            <Text style={styles.footerSubtext}>Built for local days in Thailand</Text>
          </View>
        </View>
      </ScrollView>
    </RadialGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    marginBottom: 20,
  },
  reviewAccountCard: {
    marginBottom: 16,
  },
  reviewAccountIntro: {
    color: designTokens.colors.semantic.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  reviewAccountRow: {
    alignItems: 'center',
    borderColor: designTokens.colors.semantic.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 10,
    padding: 12,
  },
  reviewAccountRowActive: {
    backgroundColor: `${designTokens.colors.semantic.primary}10`,
    borderColor: designTokens.colors.semantic.primary,
  },
  reviewAccountCopy: {
    flex: 1,
    paddingRight: 12,
  },
  reviewAccountLabel: {
    color: designTokens.colors.semantic.text,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 3,
  },
  reviewAccountDescription: {
    color: designTokens.colors.semantic.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  reviewAccountStatus: {
    color: designTokens.colors.semantic.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  reviewAccountStatusActive: {
    color: designTokens.colors.semantic.success,
  },
  reviewPaymentNote: {
    color: designTokens.colors.semantic.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  profileHeader: {
    alignItems: 'center',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: designTokens.colors.semantic.surface,
    marginTop: 16,
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 16,
    color: designTokens.colors.semantic.surface,
    opacity: 0.9,
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statDivider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 12,
  },
  statText: {
    color: designTokens.colors.semantic.surface,
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 20,
    gap: 16,
  },
  quickStatsCard: {},
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: designTokens.colors.semantic.text,
    marginBottom: 16,
  },
  quickStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  quickStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: designTokens.colors.semantic.primary,
    marginBottom: 4,
  },
  quickStatLabel: {
    fontSize: 12,
    color: designTokens.colors.semantic.textSecondary,
    textAlign: 'center',
  },
  menuCard: {
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: designTokens.colors.semantic.border,
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(111, 76, 170, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: designTokens.colors.semantic.text,
    fontWeight: '500',
  },
  logoutCard: {
    overflow: 'hidden',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  logoutIcon: {
    backgroundColor: 'rgba(255, 82, 82, 0.1)',
  },
  logoutText: {
    color: designTokens.colors.semantic.error,
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  footerText: {
    fontSize: 14,
    color: designTokens.colors.semantic.textSecondary,
    fontWeight: '500',
  },
  footerSubtext: {
    fontSize: 12,
    color: designTokens.colors.semantic.textSecondary,
    marginTop: 4,
  },
});
