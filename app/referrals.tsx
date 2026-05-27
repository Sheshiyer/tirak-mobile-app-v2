import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Coins, Gift, Share2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { designTokens } from '@/constants/design-tokens';
import { useApplyReferralCode, useReferralAccount } from '@/app/api/referrals/referrals';

export default function ReferralsScreen() {
  const { data, isLoading, error } = useReferralAccount();
  const applyReferralCode = useApplyReferralCode();
  const [inviteCode, setInviteCode] = React.useState('');
  const referral = data?.data;

  const handleShare = async () => {
    if (!referral) return;
    try {
      await Share.share({
        message: `Join Tirak and find trusted local guides in Thailand. Use my code ${referral.referralCode}: ${referral.shareUrl}`,
      });
    } catch {
      Alert.alert('Share unavailable', 'Please try again.');
    }
  };

  const handleApplyCode = () => {
    const code = inviteCode.trim();
    if (!code) return;
    applyReferralCode.mutate(code, {
      onSuccess: () => {
        setInviteCode('');
        Alert.alert('Invite code applied', 'Your inviter has received Tirak Coins.');
      },
      onError: () => {
        Alert.alert('Could not apply code', 'Check the code and try again.');
      },
    });
  };

  return (
    <LinearGradient
      colors={[designTokens.colors.reference.lightPink, '#F2E6FF', designTokens.colors.semantic.background]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
            <ArrowLeft size={22} color={designTokens.colors.semantic.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Tirak Coins</Text>
          <View style={styles.iconSpacer} />
        </View>

        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={designTokens.colors.semantic.primary} />
          </View>
        ) : error || !referral ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Rewards unavailable</Text>
            <Text style={styles.body}>Connect again to see your invite code and Tirak Coins.</Text>
          </View>
        ) : (
          <View style={styles.content}>
            <View style={styles.hero}>
              <View style={styles.coinIcon}>
                <Coins size={32} color={designTokens.colors.semantic.surface} />
              </View>
              <Text style={styles.coinValue}>{referral.coinBalance}</Text>
              <Text style={styles.coinLabel}>Tirak Coins</Text>
            </View>

            <View style={styles.card}>
              <View style={styles.row}>
                <Gift size={22} color={designTokens.colors.semantic.primary} />
                <View style={styles.rowText}>
                  <Text style={styles.cardTitle}>Invite travelers and guides</Text>
                  <Text style={styles.body}>
                    Earn {referral.awardCoins} Tirak Coins when someone joins Tirak with your code.
                  </Text>
                </View>
              </View>

              <View style={styles.codeBox}>
                <Text style={styles.codeLabel}>Your invite code</Text>
                <Text style={styles.code}>{referral.referralCode}</Text>
              </View>

              <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
                <Share2 size={18} color={designTokens.colors.semantic.surface} />
                <Text style={styles.shareText}>Share Code</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.stats}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{referral.totalEarned}</Text>
                <Text style={styles.statLabel}>Earned</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statValue}>{referral.referrals.length}</Text>
                <Text style={styles.statLabel}>Invites</Text>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Have a Tirak code?</Text>
              <Text style={styles.body}>Apply it once after joining so your inviter receives Tirak Coins.</Text>
              <View style={styles.inputRow}>
                <TextInput
                  value={inviteCode}
                  onChangeText={setInviteCode}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  placeholder="TIRAKCODE"
                  placeholderTextColor={designTokens.colors.semantic.textSecondary}
                  style={styles.input}
                />
                <TouchableOpacity
                  style={[styles.applyButton, (!inviteCode.trim() || applyReferralCode.isPending) && styles.disabledButton]}
                  onPress={handleApplyCode}
                  disabled={!inviteCode.trim() || applyReferralCode.isPending}
                >
                  <Text style={styles.applyText}>Apply</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: 20 },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: designTokens.colors.semantic.surface,
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  iconSpacer: { width: 44 },
  title: {
    color: designTokens.colors.semantic.text,
    fontSize: 20,
    fontWeight: '800',
  },
  center: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  content: { gap: 18 },
  hero: {
    alignItems: 'center',
    paddingVertical: 26,
  },
  coinIcon: {
    alignItems: 'center',
    backgroundColor: designTokens.colors.semantic.primary,
    borderRadius: 32,
    height: 64,
    justifyContent: 'center',
    marginBottom: 12,
    width: 64,
  },
  coinValue: {
    color: designTokens.colors.semantic.text,
    fontSize: 44,
    fontWeight: '900',
  },
  coinLabel: {
    color: designTokens.colors.semantic.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
  card: {
    backgroundColor: designTokens.colors.semantic.surface,
    borderRadius: 18,
    gap: 18,
    padding: 20,
  },
  row: { flexDirection: 'row', gap: 12 },
  rowText: { flex: 1 },
  cardTitle: {
    color: designTokens.colors.semantic.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  body: {
    color: designTokens.colors.semantic.textSecondary,
    fontSize: 15,
    lineHeight: 21,
  },
  codeBox: {
    backgroundColor: `${designTokens.colors.semantic.primary}12`,
    borderColor: `${designTokens.colors.semantic.primary}33`,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
  },
  codeLabel: {
    color: designTokens.colors.semantic.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  code: {
    color: designTokens.colors.semantic.primary,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 0,
  },
  shareButton: {
    alignItems: 'center',
    backgroundColor: designTokens.colors.semantic.primary,
    borderRadius: 14,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 52,
  },
  shareText: {
    color: designTokens.colors.semantic.surface,
    fontSize: 16,
    fontWeight: '800',
  },
  stats: {
    backgroundColor: designTokens.colors.semantic.surface,
    borderRadius: 18,
    flexDirection: 'row',
    padding: 18,
  },
  stat: { alignItems: 'center', flex: 1 },
  statDivider: {
    backgroundColor: designTokens.colors.semantic.border,
    width: 1,
  },
  statValue: {
    color: designTokens.colors.semantic.primary,
    fontSize: 22,
    fontWeight: '900',
  },
  statLabel: {
    color: designTokens.colors.semantic.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  inputRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  input: {
    borderColor: designTokens.colors.semantic.border,
    borderRadius: 12,
    borderWidth: 1,
    color: designTokens.colors.semantic.text,
    flex: 1,
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: 14,
  },
  applyButton: {
    alignItems: 'center',
    backgroundColor: designTokens.colors.semantic.primary,
    borderRadius: 12,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 18,
  },
  disabledButton: {
    opacity: 0.5,
  },
  applyText: {
    color: designTokens.colors.semantic.surface,
    fontSize: 15,
    fontWeight: '800',
  },
});
