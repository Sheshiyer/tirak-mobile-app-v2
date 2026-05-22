import { logger } from '@/utils/logger';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Bell,
  MessageCircle,
  Clock,
  Users,
  Shield,
  Smartphone,
  Mail,
  Volume2,
  Moon,
  Globe,
  Archive,
  Trash2,
  Settings as SettingsIcon,
  Save,
  RefreshCw,
} from 'lucide-react-native';
import { RadialGradient } from '@/components/ui/RadialGradient';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Heading, Subheading, Body, Caption } from '@/components/ui/Typography';
import { designTokens, componentTokens } from '@/constants/design-tokens';

interface ChatSettings {
  notifications: {
    newMessages: boolean;
    bookingRequests: boolean;
    pushNotifications: boolean;
    emailNotifications: boolean;
    soundEnabled: boolean;
    vibrationEnabled: boolean;
    quietHours: {
      enabled: boolean;
      startTime: string;
      endTime: string;
    };
  };
  autoResponses: {
    enabled: boolean;
    welcomeMessage: boolean;
    awayMessage: boolean;
    responseDelay: number; // minutes
    businessHoursOnly: boolean;
  };
  privacy: {
    readReceipts: boolean;
    typingIndicators: boolean;
    onlineStatus: boolean;
    lastSeenVisibility: boolean;
  };
  messageManagement: {
    autoArchiveAfter: number; // days
    deleteAfter: number; // days
    markAsReadAutomatically: boolean;
    groupSimilarInquiries: boolean;
  };
  language: {
    primaryLanguage: string;
    autoTranslate: boolean;
    supportedLanguages: string[];
  };
}

export default function ChatSettingsScreen() {
  const router = useRouter();

  const [settings, setSettings] = useState<ChatSettings>({
    notifications: {
      newMessages: true,
      bookingRequests: true,
      pushNotifications: true,
      emailNotifications: false,
      soundEnabled: true,
      vibrationEnabled: true,
      quietHours: {
        enabled: true,
        startTime: '22:00',
        endTime: '08:00',
      },
    },
    autoResponses: {
      enabled: true,
      welcomeMessage: true,
      awayMessage: true,
      responseDelay: 5,
      businessHoursOnly: true,
    },
    privacy: {
      readReceipts: true,
      typingIndicators: true,
      onlineStatus: true,
      lastSeenVisibility: true,
    },
    messageManagement: {
      autoArchiveAfter: 30,
      deleteAfter: 90,
      markAsReadAutomatically: false,
      groupSimilarInquiries: true,
    },
    language: {
      primaryLanguage: 'English',
      autoTranslate: false,
      supportedLanguages: ['English', 'Thai', 'Chinese', 'Japanese'],
    },
  });

  const updateNestedSettings = (section: keyof ChatSettings, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] as any),
        [field]: value,
      },
    }));
  };

  const updateQuietHours = (field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        quietHours: {
          ...prev.notifications.quietHours,
          [field]: value,
        },
      },
    }));
  };

  const handleSave = () => {
    // In a real app, this would save to API
    // logger.log('Saving chat settings:', settings); 
    
    Alert.alert(
      'Settings Saved',
      'Your chat settings have been updated successfully.',
      [{ text: 'OK', onPress: () => router.back() }]
    );
  };

  const handleReset = () => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset all settings to default values?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: () => {
          // logger.log('Resetting settings to defaults');
        }},
      ]
    );
  };

  const SettingRow = ({ 
    icon, 
    title, 
    description, 
    value, 
    onPress,
    rightElement 
  }: {
    icon: React.ReactNode;
    title: string;
    description?: string;
    value?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
  }) => (
    <TouchableOpacity style={styles.settingRow} onPress={onPress} disabled={!onPress}>
      <View style={styles.settingIcon}>
        {icon}
      </View>
      <View style={styles.settingContent}>
        <Body style={styles.settingTitle}>{title}</Body>
        {description && (
          <Caption style={styles.settingDescription}>{description}</Caption>
        )}
        {value && (
          <Caption style={styles.settingValue}>{value}</Caption>
        )}
      </View>
      {rightElement && (
        <View style={styles.settingRight}>
          {rightElement}
        </View>
      )}
    </TouchableOpacity>
  );

  const SwitchRow = ({ 
    icon, 
    title, 
    description, 
    value, 
    onValueChange 
  }: {
    icon: React.ReactNode;
    title: string;
    description?: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
  }) => (
    <SettingRow
      icon={icon}
      title={title}
      description={description}
      rightElement={
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{
            false: designTokens.colors.semantic.textSecondary + '40',
            true: designTokens.colors.semantic.primary + '40',
          }}
          thumbColor={value ? designTokens.colors.semantic.primary : designTokens.colors.semantic.textSecondary}
        />
      }
    />
  );

  return (
    <RadialGradient variant="appBackground" style={styles.container}>
      {/* Header */}
      <SafeAreaView edges={['top']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={designTokens.colors.semantic.text} />
          </TouchableOpacity>
          
          <View style={styles.headerTitle}>
            <Heading style={styles.title}>Chat Settings</Heading>
            <Caption style={styles.subtitle}>Configure your chat preferences</Caption>
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Save size={20} color={designTokens.colors.semantic.surface} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Notifications */}
        <Card style={styles.section} padding={16}>
          <Subheading style={styles.sectionTitle}>Notifications</Subheading>
          
          <SwitchRow
            icon={<Bell size={20} color={designTokens.colors.semantic.primary} />}
            title="New Messages"
            description="Get notified when you receive new messages"
            value={settings.notifications.newMessages}
            onValueChange={(value) => updateNestedSettings('notifications', 'newMessages', value)}
          />
          
          <SwitchRow
            icon={<MessageCircle size={20} color={designTokens.colors.semantic.accent} />}
            title="Booking Requests"
            description="Get notified for new booking inquiries"
            value={settings.notifications.bookingRequests}
            onValueChange={(value) => updateNestedSettings('notifications', 'bookingRequests', value)}
          />
          
          <SwitchRow
            icon={<Smartphone size={20} color={designTokens.colors.semantic.success} />}
            title="Push Notifications"
            description="Receive push notifications on your device"
            value={settings.notifications.pushNotifications}
            onValueChange={(value) => updateNestedSettings('notifications', 'pushNotifications', value)}
          />
          
          <SwitchRow
            icon={<Mail size={20} color={designTokens.colors.semantic.warning} />}
            title="Email Notifications"
            description="Receive notifications via email"
            value={settings.notifications.emailNotifications}
            onValueChange={(value) => updateNestedSettings('notifications', 'emailNotifications', value)}
          />
          
          <SwitchRow
            icon={<Volume2 size={20} color={designTokens.colors.semantic.primary} />}
            title="Sound"
            description="Play sound for new messages"
            value={settings.notifications.soundEnabled}
            onValueChange={(value) => updateNestedSettings('notifications', 'soundEnabled', value)}
          />
          
          <SwitchRow
            icon={<Smartphone size={20} color={designTokens.colors.semantic.accent} />}
            title="Vibration"
            description="Vibrate for new messages"
            value={settings.notifications.vibrationEnabled}
            onValueChange={(value) => updateNestedSettings('notifications', 'vibrationEnabled', value)}
          />
          
          <SwitchRow
            icon={<Moon size={20} color={designTokens.colors.semantic.textSecondary} />}
            title="Quiet Hours"
            description="Disable notifications during specified hours"
            value={settings.notifications.quietHours.enabled}
            onValueChange={(value) => updateQuietHours('enabled', value)}
          />
          
          {settings.notifications.quietHours.enabled && (
            <View style={styles.quietHoursContainer}>
              <View style={styles.timeRow}>
                <View style={styles.timeInput}>
                  <Caption style={styles.timeLabel}>From</Caption>
                  <TouchableOpacity style={styles.timeButton}>
                    <Clock size={16} color={designTokens.colors.semantic.primary} />
                    <Body style={styles.timeText}>{settings.notifications.quietHours.startTime}</Body>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.timeInput}>
                  <Caption style={styles.timeLabel}>To</Caption>
                  <TouchableOpacity style={styles.timeButton}>
                    <Clock size={16} color={designTokens.colors.semantic.primary} />
                    <Body style={styles.timeText}>{settings.notifications.quietHours.endTime}</Body>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </Card>

        {/* Auto Responses */}
        <Card style={styles.section} padding={16}>
          <Subheading style={styles.sectionTitle}>Auto Responses</Subheading>
          
          <SwitchRow
            icon={<MessageCircle size={20} color={designTokens.colors.semantic.primary} />}
            title="Enable Auto Responses"
            description="Automatically respond to common inquiries"
            value={settings.autoResponses.enabled}
            onValueChange={(value) => updateNestedSettings('autoResponses', 'enabled', value)}
          />
          
          <SwitchRow
            icon={<Users size={20} color={designTokens.colors.semantic.success} />}
            title="Welcome Message"
            description="Send welcome message to new customers"
            value={settings.autoResponses.welcomeMessage}
            onValueChange={(value) => updateNestedSettings('autoResponses', 'welcomeMessage', value)}
          />
          
          <SwitchRow
            icon={<Clock size={20} color={designTokens.colors.semantic.warning} />}
            title="Away Message"
            description="Send away message when offline"
            value={settings.autoResponses.awayMessage}
            onValueChange={(value) => updateNestedSettings('autoResponses', 'awayMessage', value)}
          />
          
          <SettingRow
            icon={<Clock size={20} color={designTokens.colors.semantic.accent} />}
            title="Response Delay"
            description="Delay before sending auto response"
            value={`${settings.autoResponses.responseDelay} minutes`}
          />
          
          <SwitchRow
            icon={<Clock size={20} color={designTokens.colors.semantic.primary} />}
            title="Business Hours Only"
            description="Only send auto responses during business hours"
            value={settings.autoResponses.businessHoursOnly}
            onValueChange={(value) => updateNestedSettings('autoResponses', 'businessHoursOnly', value)}
          />
        </Card>

        {/* Privacy */}
        <Card style={styles.section} padding={16}>
          <Subheading style={styles.sectionTitle}>Privacy</Subheading>
          
          <SwitchRow
            icon={<MessageCircle size={20} color={designTokens.colors.semantic.primary} />}
            title="Read Receipts"
            description="Show when you've read messages"
            value={settings.privacy.readReceipts}
            onValueChange={(value) => updateNestedSettings('privacy', 'readReceipts', value)}
          />
          
          <SwitchRow
            icon={<MessageCircle size={20} color={designTokens.colors.semantic.accent} />}
            title="Typing Indicators"
            description="Show when you're typing"
            value={settings.privacy.typingIndicators}
            onValueChange={(value) => updateNestedSettings('privacy', 'typingIndicators', value)}
          />
          
          <SwitchRow
            icon={<Users size={20} color={designTokens.colors.semantic.success} />}
            title="Online Status"
            description="Show when you're online"
            value={settings.privacy.onlineStatus}
            onValueChange={(value) => updateNestedSettings('privacy', 'onlineStatus', value)}
          />
          
          <SwitchRow
            icon={<Clock size={20} color={designTokens.colors.semantic.warning} />}
            title="Last Seen"
            description="Show when you were last active"
            value={settings.privacy.lastSeenVisibility}
            onValueChange={(value) => updateNestedSettings('privacy', 'lastSeenVisibility', value)}
          />
        </Card>

        {/* Message Management */}
        <Card style={styles.section} padding={16}>
          <Subheading style={styles.sectionTitle}>Message Management</Subheading>
          
          <SettingRow
            icon={<Archive size={20} color={designTokens.colors.semantic.primary} />}
            title="Auto Archive"
            description="Automatically archive conversations after"
            value={`${settings.messageManagement.autoArchiveAfter} days`}
          />
          
          <SettingRow
            icon={<Trash2 size={20} color={designTokens.colors.semantic.error} />}
            title="Auto Delete"
            description="Automatically delete archived conversations after"
            value={`${settings.messageManagement.deleteAfter} days`}
          />
          
          <SwitchRow
            icon={<MessageCircle size={20} color={designTokens.colors.semantic.accent} />}
            title="Auto Mark as Read"
            description="Mark messages as read when viewed"
            value={settings.messageManagement.markAsReadAutomatically}
            onValueChange={(value) => updateNestedSettings('messageManagement', 'markAsReadAutomatically', value)}
          />
          
          <SwitchRow
            icon={<Users size={20} color={designTokens.colors.semantic.success} />}
            title="Group Similar Inquiries"
            description="Group similar inquiries together"
            value={settings.messageManagement.groupSimilarInquiries}
            onValueChange={(value) => updateNestedSettings('messageManagement', 'groupSimilarInquiries', value)}
          />
        </Card>

        {/* Language */}
        <Card style={styles.section} padding={16}>
          <Subheading style={styles.sectionTitle}>Language & Translation</Subheading>
          
          <SettingRow
            icon={<Globe size={20} color={designTokens.colors.semantic.primary} />}
            title="Primary Language"
            description="Your main communication language"
            value={settings.language.primaryLanguage}
          />
          
          <SwitchRow
            icon={<Globe size={20} color={designTokens.colors.semantic.accent} />}
            title="Auto Translate"
            description="Automatically translate incoming messages"
            value={settings.language.autoTranslate}
            onValueChange={(value) => updateNestedSettings('language', 'autoTranslate', value)}
          />
          
          <SettingRow
            icon={<Globe size={20} color={designTokens.colors.semantic.success} />}
            title="Supported Languages"
            description="Languages you can communicate in"
            value={`${settings.language.supportedLanguages.length} languages`}
          />
        </Card>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title="Reset to Defaults"
            onPress={handleReset}
            variant="outline"
            style={styles.resetButton}
            // icon={<RefreshCw size={16} color={designTokens.colors.semantic.primary} />}
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
    backgroundColor: 'transparent',
    paddingHorizontal: designTokens.spacing.scale.md,
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
    // ...componentTokens.card.default.shadow,
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
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: designTokens.spacing.scale.md,
    borderBottomWidth: 1,
    borderBottomColor: designTokens.colors.semantic.border,
  },
  settingIcon: {
    marginRight: designTokens.spacing.scale.md,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontWeight: '500',
    marginBottom: designTokens.spacing.scale.xs,
  },
  settingDescription: {
    color: designTokens.colors.semantic.textSecondary,
    marginBottom: designTokens.spacing.scale.xs,
  },
  settingValue: {
    color: designTokens.colors.semantic.primary,
    fontWeight: '500',
  },
  settingRight: {
    marginLeft: designTokens.spacing.scale.md,
  },
  quietHoursContainer: {
    marginTop: designTokens.spacing.scale.md,
    paddingLeft: designTokens.spacing.scale.xl,
  },
  timeRow: {
    flexDirection: 'row',
    gap: designTokens.spacing.scale.md,
  },
  timeInput: {
    flex: 1,
  },
  timeLabel: {
    marginBottom: designTokens.spacing.scale.sm,
    color: designTokens.colors.semantic.textSecondary,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: designTokens.colors.semantic.surface,
    padding: designTokens.spacing.scale.md,
    borderRadius: componentTokens.card.default.borderRadius,
    borderWidth: 1,
    borderColor: designTokens.colors.semantic.border,
  },
  timeText: {
    marginLeft: designTokens.spacing.scale.sm,
    fontWeight: '500',
  },
  actions: {
    marginTop: designTokens.spacing.scale.md,
  },
  resetButton: {
    alignSelf: 'center',
  },
});
