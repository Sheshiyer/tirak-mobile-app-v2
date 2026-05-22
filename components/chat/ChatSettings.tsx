import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { 
  Settings, 
  User, 
  Bell, 
  Shield, 
  Trash2, 
  Archive,
  Star,
  Volume2,
  VolumeX,
  Moon,
  Sun,
  ChevronRight,
  X,
} from 'lucide-react-native';
import { Modal } from '@/components/ui/Modal';
import { ProfileImage } from '@/components/ui/ProfileImage';
import { designTokens } from '@/constants/design-tokens';

interface ChatSettingsProps {
  visible: boolean;
  onClose: () => void;
  companion: {
    id: string;
    name: string;
    image: string;
    rating: number;
    reviews: number;
    location: string;
  };
  onViewProfile: () => void;
  onMute: (muted: boolean) => void;
  onBlock: () => void;
  onReport: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onStarConversation: (starred: boolean) => void;
}

export const ChatSettings: React.FC<ChatSettingsProps> = ({
  visible,
  onClose,
  companion,
  onViewProfile,
  onMute,
  onBlock,
  onReport,
  onArchive,
  onDelete,
  onStarConversation,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isStarred, setIsStarred] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const handleMute = (muted: boolean) => {
    setIsMuted(muted);
    onMute(muted);
  };

  const handleStar = (starred: boolean) => {
    setIsStarred(starred);
    onStarConversation(starred);
  };

  const handleBlock = () => {
    Alert.alert(
      'Block Contact',
      `Are you sure you want to block ${companion.name}? You won't receive messages from them anymore.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Block', 
          style: 'destructive',
          onPress: () => {
            onBlock();
            onClose();
          }
        },
      ]
    );
  };

  const handleReport = () => {
    Alert.alert(
      'Report Contact',
      `Report ${companion.name} for inappropriate behavior?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Report', 
          style: 'destructive',
          onPress: () => {
            onReport();
            onClose();
          }
        },
      ]
    );
  };

  const handleArchive = () => {
    Alert.alert(
      'Archive Conversation',
      'This conversation will be moved to archived chats.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Archive', 
          onPress: () => {
            onArchive();
            onClose();
          }
        },
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Conversation',
      'This will permanently delete all messages in this conversation. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            onDelete();
            onClose();
          }
        },
      ]
    );
  };

  const SettingItem: React.FC<{
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
    danger?: boolean;
  }> = ({ icon, title, subtitle, onPress, rightElement, danger }) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.settingLeft}>
        <View style={[
          styles.settingIcon,
          danger && styles.settingIconDanger,
        ]}>
          {icon}
        </View>
        <View style={styles.settingText}>
          <Text style={[
            styles.settingTitle,
            danger && styles.settingTitleDanger,
          ]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={styles.settingSubtitle}>{subtitle}</Text>
          )}
        </View>
      </View>
      {rightElement || (
        <ChevronRight size={20} color={designTokens.colors.semantic.textSecondary} />
      )}
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      size="large"
      position="bottom"
      title="Chat Settings"
      animationType="slide"
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Companion Profile Section */}
        <View style={styles.profileSection}>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={onViewProfile}
            activeOpacity={0.8}
          >
            <ProfileImage
              uri={companion.image}
              size="large"
            />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{companion.name}</Text>
              <Text style={styles.profileLocation}>{companion.location}</Text>
              <View style={styles.profileRating}>
                <Text style={styles.ratingText}>⭐ {companion.rating}/5</Text>
                <Text style={styles.reviewsText}>({companion.reviews} reviews)</Text>
              </View>
            </View>
            <ChevronRight size={20} color={designTokens.colors.semantic.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <SettingItem
            icon={isStarred ? 
              <Star size={20} color={designTokens.colors.semantic.accent} fill={designTokens.colors.semantic.accent} /> :
              <Star size={20} color={designTokens.colors.semantic.textSecondary} />
            }
            title="Star Conversation"
            subtitle={isStarred ? "Remove from starred" : "Add to starred"}
            rightElement={
              <Switch
                value={isStarred}
                onValueChange={handleStar}
                trackColor={{ 
                  false: designTokens.colors.semantic.border, 
                  true: designTokens.colors.semantic.accent 
                }}
                thumbColor={designTokens.colors.semantic.surface}
              />
            }
          />

          <SettingItem
            icon={isMuted ? 
              <VolumeX size={20} color={designTokens.colors.semantic.textSecondary} /> :
              <Volume2 size={20} color={designTokens.colors.semantic.textSecondary} />
            }
            title="Mute Notifications"
            subtitle={isMuted ? "Notifications are off" : "Notifications are on"}
            rightElement={
              <Switch
                value={isMuted}
                onValueChange={handleMute}
                trackColor={{ 
                  false: designTokens.colors.semantic.border, 
                  true: designTokens.colors.semantic.primary 
                }}
                thumbColor={designTokens.colors.semantic.surface}
              />
            }
          />
        </View>

        {/* Chat Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          
          <SettingItem
            icon={<Bell size={20} color={designTokens.colors.semantic.textSecondary} />}
            title="Notifications"
            subtitle="Message alerts and sounds"
            rightElement={
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ 
                  false: designTokens.colors.semantic.border, 
                  true: designTokens.colors.semantic.primary 
                }}
                thumbColor={designTokens.colors.semantic.surface}
              />
            }
          />

          <SettingItem
            icon={darkMode ? 
              <Moon size={20} color={designTokens.colors.semantic.textSecondary} /> :
              <Sun size={20} color={designTokens.colors.semantic.textSecondary} />
            }
            title="Dark Mode"
            subtitle="Chat appearance"
            rightElement={
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ 
                  false: designTokens.colors.semantic.border, 
                  true: designTokens.colors.semantic.primary 
                }}
                thumbColor={designTokens.colors.semantic.surface}
              />
            }
          />
        </View>

        {/* Chat Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chat Management</Text>
          
          <SettingItem
            icon={<Archive size={20} color={designTokens.colors.semantic.textSecondary} />}
            title="Archive Chat"
            subtitle="Move to archived conversations"
            onPress={handleArchive}
          />

          <SettingItem
            icon={<Trash2 size={20} color={designTokens.colors.semantic.error} />}
            title="Delete Chat"
            subtitle="Permanently delete all messages"
            onPress={handleDelete}
            danger
          />
        </View>

        {/* Safety & Privacy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Safety & Privacy</Text>
          
          <SettingItem
            icon={<Shield size={20} color={designTokens.colors.semantic.error} />}
            title="Block Contact"
            subtitle="Stop receiving messages"
            onPress={handleBlock}
            danger
          />

          <SettingItem
            icon={<Shield size={20} color={designTokens.colors.semantic.error} />}
            title="Report Contact"
            subtitle="Report inappropriate behavior"
            onPress={handleReport}
            danger
          />
        </View>
      </ScrollView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileSection: {
    backgroundColor: designTokens.colors.semantic.primary + '10',
    borderRadius: designTokens.borderRadius.lg,
    margin: designTokens.spacing.md,
    padding: designTokens.spacing.md,
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.md,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: designTokens.typography.sizes.lg,
    fontWeight: designTokens.typography.weights.semibold,
    color: designTokens.colors.semantic.text,
    marginBottom: designTokens.spacing.xs,
  },
  profileLocation: {
    fontSize: designTokens.typography.sizes.sm,
    color: designTokens.colors.semantic.textSecondary,
    marginBottom: designTokens.spacing.xs,
  },
  profileRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.xs,
  },
  ratingText: {
    fontSize: designTokens.typography.sizes.sm,
    fontWeight: designTokens.typography.weights.medium,
    color: designTokens.colors.semantic.text,
  },
  reviewsText: {
    fontSize: designTokens.typography.sizes.sm,
    color: designTokens.colors.semantic.textSecondary,
  },
  section: {
    marginBottom: designTokens.spacing.lg,
  },
  sectionTitle: {
    fontSize: designTokens.typography.sizes.md,
    fontWeight: designTokens.typography.weights.semibold,
    color: designTokens.colors.semantic.text,
    marginHorizontal: designTokens.spacing.md,
    marginBottom: designTokens.spacing.sm,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: designTokens.spacing.md,
    paddingHorizontal: designTokens.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: designTokens.colors.semantic.border,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: designTokens.colors.semantic.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: designTokens.spacing.md,
  },
  settingIconDanger: {
    backgroundColor: designTokens.colors.semantic.error + '20',
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: designTokens.typography.sizes.md,
    fontWeight: designTokens.typography.weights.medium,
    color: designTokens.colors.semantic.text,
    marginBottom: 2,
  },
  settingTitleDanger: {
    color: designTokens.colors.semantic.error,
  },
  settingSubtitle: {
    fontSize: designTokens.typography.sizes.sm,
    color: designTokens.colors.semantic.textSecondary,
  },
});
