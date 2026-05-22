import { logger } from '@/utils/logger';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Shield,
  CheckCircle,
  Clock,
  AlertTriangle,
  X,
  Upload,
  Camera,
  FileText,
  Award,
  User,
  CreditCard,
  MapPin,
  Phone,
  Mail,
  Star,
  Zap,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { RadialGradient } from '@/components/ui/RadialGradient';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Heading, Subheading, Body, Caption } from '@/components/ui/Typography';
import { designTokens, componentTokens } from '@/constants/design-tokens';

interface VerificationItem {
  id: string;
  type: 'identity' | 'professional' | 'background' | 'contact' | 'address';
  title: string;
  description: string;
  status: 'verified' | 'pending' | 'rejected' | 'not_started';
  icon: React.ReactNode;
  priority: 'high' | 'medium' | 'low';
  documents?: string[];
  rejectionReason?: string;
  verifiedDate?: string;
  expiryDate?: string;
  trustScore: number;
}

interface TrustBadge {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  earned: boolean;
  earnedDate?: string;
  requirements: string[];
}

export default function VerificationScreen() {
  const router = useRouter();

  const [verificationItems] = useState<VerificationItem[]>([
    {
      id: 'identity',
      type: 'identity',
      title: 'Identity Verification',
      description: 'Government-issued ID verification',
      status: 'verified',
      icon: <User size={20} color={designTokens.colors.semantic.success} />,
      priority: 'high',
      documents: ['passport.jpg', 'national_id.jpg'],
      verifiedDate: '2024-11-15',
      trustScore: 25,
    },
    {
      id: 'professional',
      type: 'professional',
      title: 'Professional Certifications',
      description: 'Tour guide license and certifications',
      status: 'verified',
      icon: <Award size={20} color={designTokens.colors.semantic.success} />,
      priority: 'high',
      documents: ['tour_guide_license.pdf', 'first_aid_cert.pdf'],
      verifiedDate: '2024-11-20',
      expiryDate: '2025-11-20',
      trustScore: 30,
    },
    {
      id: 'background',
      type: 'background',
      title: 'Background Check',
      description: 'Criminal background verification',
      status: 'pending',
      icon: <Shield size={20} color={designTokens.colors.semantic.warning} />,
      priority: 'high',
      documents: ['background_check_request.pdf'],
      trustScore: 20,
    },
    {
      id: 'contact',
      type: 'contact',
      title: 'Contact Verification',
      description: 'Phone and email verification',
      status: 'verified',
      icon: <Phone size={20} color={designTokens.colors.semantic.success} />,
      priority: 'medium',
      verifiedDate: '2024-10-28',
      trustScore: 15,
    },
    {
      id: 'address',
      type: 'address',
      title: 'Address Verification',
      description: 'Proof of residence',
      status: 'rejected',
      icon: <MapPin size={20} color={designTokens.colors.semantic.error} />,
      priority: 'medium',
      documents: ['utility_bill.jpg'],
      rejectionReason: 'Document is older than 3 months. Please provide a recent utility bill or bank statement.',
      trustScore: 10,
    },
  ]);

  const [trustBadges] = useState<TrustBadge[]>([
    {
      id: 'verified_guide',
      name: 'Verified Guide',
      description: 'Identity and professional credentials verified',
      icon: <CheckCircle size={16} color={designTokens.colors.semantic.success} />,
      earned: true,
      earnedDate: '2024-11-20',
      requirements: ['Identity verification', 'Professional certifications'],
    },
    {
      id: 'trusted_host',
      name: 'Trusted Host',
      description: 'Background check completed successfully',
      icon: <Shield size={16} color={designTokens.colors.semantic.warning} />,
      earned: false,
      requirements: ['Background check', 'Address verification', '10+ positive reviews'],
    },
    {
      id: 'super_guide',
      name: 'Super Guide',
      description: 'Exceptional service and customer satisfaction',
      icon: <Star size={16} color="#FFD700" />,
      earned: false,
      requirements: ['4.8+ rating', '50+ completed tours', 'All verifications complete'],
    },
    {
      id: 'quick_responder',
      name: 'Quick Responder',
      description: 'Responds to inquiries within 2 hours',
      icon: <Zap size={16} color={designTokens.colors.semantic.accent} />,
      earned: true,
      earnedDate: '2024-12-01',
      requirements: ['Average response time under 2 hours', '30-day consistency'],
    },
  ]);

  const getTotalTrustScore = () => {
    return verificationItems.reduce((total, item) => {
      return item.status === 'verified' ? total + item.trustScore : total;
    }, 0);
  };

  const getVerificationProgress = () => {
    const total = verificationItems.length;
    const completed = verificationItems.filter(item => item.status === 'verified').length;
    return Math.round((completed / total) * 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return designTokens.colors.semantic.success;
      case 'pending': return designTokens.colors.semantic.warning;
      case 'rejected': return designTokens.colors.semantic.error;
      default: return designTokens.colors.semantic.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return <CheckCircle size={16} color={designTokens.colors.semantic.success} />;
      case 'pending': return <Clock size={16} color={designTokens.colors.semantic.warning} />;
      case 'rejected': return <X size={16} color={designTokens.colors.semantic.error} />;
      default: return <AlertTriangle size={16} color={designTokens.colors.semantic.textSecondary} />;
    }
  };

  const handleUploadDocument = (itemId: string) => {
    Alert.alert(
      'Upload Document',
      'In a real app, this would open the camera or file picker to upload verification documents.',
      [{ text: 'OK' }]
    );
  };

  const handleRetryVerification = (itemId: string) => {
    Alert.alert(
      'Retry Verification',
      'Would you like to resubmit your documents for verification?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Retry', onPress: () => logger.log('Retrying verification for:', itemId) },
      ]
    );
  };

  const trustScore = getTotalTrustScore();
  const progress = getVerificationProgress();
  const earnedBadges = trustBadges.filter(badge => badge.earned);

  const VerificationCard = ({ item }: { item: VerificationItem }) => (
    <Card style={styles.verificationCard} padding={16}>
      <View style={styles.verificationHeader}>
        <View style={styles.verificationTitleRow}>
          {item.icon}
          <View style={styles.verificationTitleContent}>
            <Subheading style={styles.verificationTitle}>{item.title}</Subheading>
            <Caption style={styles.verificationDescription}>{item.description}</Caption>
          </View>
        </View>
        
        <View style={styles.verificationStatus}>
          {getStatusIcon(item.status)}
          <Caption style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status.replace('_', ' ').toUpperCase()}
          </Caption>
        </View>
      </View>

      {item.status === 'verified' && item.verifiedDate && (
        <View style={styles.verificationDetails}>
          <Caption style={styles.verificationDate}>
            Verified on {new Date(item.verifiedDate).toLocaleDateString()}
          </Caption>
          {item.expiryDate && (
            <Caption style={styles.expiryDate}>
              Expires: {new Date(item.expiryDate).toLocaleDateString()}
            </Caption>
          )}
        </View>
      )}

      {item.status === 'rejected' && item.rejectionReason && (
        <View style={styles.rejectionContainer}>
          <Caption style={styles.rejectionReason}>{item.rejectionReason}</Caption>
          <Button
            title="Retry"
            onPress={() => handleRetryVerification(item.id)}
            style={styles.retryButton}
            icon={<Upload size={14} color={designTokens.colors.semantic.surface} />}
          />
        </View>
      )}

      {(item.status === 'not_started' || item.status === 'rejected') && (
        <Button
          title="Upload Documents"
          onPress={() => handleUploadDocument(item.id)}
          style={styles.uploadButton}
          icon={<Camera size={16} color={designTokens.colors.semantic.surface} />}
        />
      )}

      {item.status === 'pending' && (
        <View style={styles.pendingContainer}>
          <Caption style={styles.pendingText}>
            Your documents are being reviewed. This usually takes 1-3 business days.
          </Caption>
        </View>
      )}

      <View style={styles.trustScoreContainer}>
        <Caption style={styles.trustScoreLabel}>Trust Score Impact:</Caption>
        <Body style={styles.trustScoreValue}>+{item.trustScore} points</Body>
      </View>
    </Card>
  );

  const BadgeCard = ({ badge }: { badge: TrustBadge }) => (
    <Card style={[styles.badgeCard, !badge.earned && styles.badgeCardDisabled]} padding={12}>
      <View style={styles.badgeHeader}>
        {badge.icon}
        <View style={styles.badgeContent}>
          <Body style={[styles.badgeName, !badge.earned && styles.badgeNameDisabled]}>
            {badge.name}
          </Body>
          <Caption style={styles.badgeDescription}>{badge.description}</Caption>
        </View>
      </View>

      {badge.earned && badge.earnedDate && (
        <Caption style={styles.badgeEarnedDate}>
          Earned {new Date(badge.earnedDate).toLocaleDateString()}
        </Caption>
      )}

      {!badge.earned && (
        <View style={styles.badgeRequirements}>
          <Caption style={styles.requirementsTitle}>Requirements:</Caption>
          {badge.requirements.map((req, index) => (
            <Caption key={index} style={styles.requirementItem}>
              • {req}
            </Caption>
          ))}
        </View>
      )}
    </Card>
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
            <Heading style={styles.title}>Verification</Heading>
            <Caption style={styles.subtitle}>Build trust with customers</Caption>
          </View>

          <TouchableOpacity style={styles.helpButton}>
            <FileText size={20} color={designTokens.colors.semantic.primary} />
          </TouchableOpacity>
        </View>

        {/* Trust Score Overview */}
        <Card style={styles.overviewCard} padding={16}>
          <View style={styles.overviewHeader}>
            <Subheading style={styles.overviewTitle}>Trust Score</Subheading>
            <View style={styles.scoreContainer}>
              <Heading style={styles.trustScoreDisplay}>{trustScore}</Heading>
              <Caption style={styles.scoreOutOf}>/100</Caption>
            </View>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <LinearGradient
                colors={[designTokens.colors.semantic.primary, designTokens.colors.semantic.accent]}
                style={[styles.progressFill, { width: `${progress}%` }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </View>
            <Caption style={styles.progressText}>
              {progress}% verification complete
            </Caption>
          </View>

          <View style={styles.badgesPreview}>
            <Caption style={styles.badgesLabel}>Trust Badges Earned:</Caption>
            <View style={styles.earnedBadges}>
              {earnedBadges.map((badge) => (
                <View key={badge.id} style={styles.miniBadge}>
                  {badge.icon}
                  <Caption style={styles.miniBadgeText}>{badge.name}</Caption>
                </View>
              ))}
              {earnedBadges.length === 0 && (
                <Caption style={styles.noBadgesText}>Complete verifications to earn badges</Caption>
              )}
            </View>
          </View>
        </Card>
      </SafeAreaView>

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Verification Items */}
        <View style={styles.section}>
          <Subheading style={styles.sectionTitle}>Verification Requirements</Subheading>
          {verificationItems.map((item) => (
            <VerificationCard key={item.id} item={item} />
          ))}
        </View>

        {/* Trust Badges */}
        <View style={styles.section}>
          <Subheading style={styles.sectionTitle}>Trust Badges</Subheading>
          <Caption style={styles.sectionDescription}>
            Earn badges to showcase your credibility and attract more customers
          </Caption>
          {trustBadges.map((badge) => (
            <BadgeCard key={badge.id} badge={badge} />
          ))}
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
    paddingBottom: designTokens.spacing.scale.sm,
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
    ...componentTokens.card.shadow,
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
  helpButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: designTokens.colors.semantic.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...componentTokens.card.shadow,
  },
  overviewCard: {
    marginBottom: designTokens.spacing.scale.md,
  },
  overviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: designTokens.spacing.scale.md,
  },
  overviewTitle: {
    flex: 1,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  trustScoreDisplay: {
    color: designTokens.colors.semantic.primary,
    fontSize: 32,
    fontWeight: '700',
  },
  scoreOutOf: {
    color: designTokens.colors.semantic.textSecondary,
    marginLeft: 4,
  },
  progressContainer: {
    marginBottom: designTokens.spacing.scale.md,
  },
  progressBar: {
    height: 6,
    backgroundColor: designTokens.colors.semantic.surface + '40',
    borderRadius: 3,
    marginBottom: designTokens.spacing.scale.xs,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    textAlign: 'center',
    color: designTokens.colors.semantic.textSecondary,
  },
  badgesPreview: {
    marginTop: designTokens.spacing.scale.sm,
  },
  badgesLabel: {
    marginBottom: designTokens.spacing.scale.xs,
    color: designTokens.colors.semantic.textSecondary,
  },
  earnedBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: designTokens.spacing.scale.xs,
  },
  miniBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: designTokens.colors.semantic.success + '20',
    paddingHorizontal: designTokens.spacing.scale.sm,
    paddingVertical: designTokens.spacing.scale.xs,
    borderRadius: 12,
  },
  miniBadgeText: {
    marginLeft: designTokens.spacing.scale.xs,
    color: designTokens.colors.semantic.success,
    fontWeight: '500',
  },
  noBadgesText: {
    color: designTokens.colors.semantic.textSecondary,
    fontStyle: 'italic',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: designTokens.spacing.scale.md,
    paddingTop: 0,
  },
  section: {
    marginBottom: designTokens.spacing.scale.lg,
  },
  sectionTitle: {
    marginBottom: designTokens.spacing.scale.md,
  },
  sectionDescription: {
    color: designTokens.colors.semantic.textSecondary,
    marginBottom: designTokens.spacing.scale.md,
  },
  verificationCard: {
    marginBottom: designTokens.spacing.scale.md,
  },
  verificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: designTokens.spacing.scale.sm,
  },
  verificationTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  verificationTitleContent: {
    marginLeft: designTokens.spacing.scale.sm,
    flex: 1,
  },
  verificationTitle: {
    marginBottom: designTokens.spacing.scale.xs,
  },
  verificationDescription: {
    color: designTokens.colors.semantic.textSecondary,
  },
  verificationStatus: {
    alignItems: 'center',
  },
  statusText: {
    marginTop: designTokens.spacing.scale.xs,
    fontSize: 10,
    fontWeight: '600',
  },
  verificationDetails: {
    marginBottom: designTokens.spacing.scale.sm,
  },
  verificationDate: {
    color: designTokens.colors.semantic.success,
    marginBottom: designTokens.spacing.scale.xs,
  },
  expiryDate: {
    color: designTokens.colors.semantic.warning,
  },
  rejectionContainer: {
    backgroundColor: designTokens.colors.semantic.error + '10',
    padding: designTokens.spacing.scale.sm,
    borderRadius: componentTokens.card.borderRadius,
    marginBottom: designTokens.spacing.scale.sm,
  },
  rejectionReason: {
    color: designTokens.colors.semantic.error,
    marginBottom: designTokens.spacing.scale.sm,
  },
  retryButton: {
    backgroundColor: designTokens.colors.semantic.error,
    alignSelf: 'flex-start',
  },
  uploadButton: {
    marginBottom: designTokens.spacing.scale.sm,
  },
  pendingContainer: {
    backgroundColor: designTokens.colors.semantic.warning + '10',
    padding: designTokens.spacing.scale.sm,
    borderRadius: componentTokens.card.borderRadius,
    marginBottom: designTokens.spacing.scale.sm,
  },
  pendingText: {
    color: designTokens.colors.semantic.warning,
  },
  trustScoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: designTokens.spacing.scale.sm,
    borderTopWidth: 1,
    borderTopColor: designTokens.colors.semantic.border,
  },
  trustScoreLabel: {
    color: designTokens.colors.semantic.textSecondary,
  },
  trustScoreValue: {
    color: designTokens.colors.semantic.primary,
    fontWeight: '600',
  },
  badgeCard: {
    marginBottom: designTokens.spacing.scale.sm,
  },
  badgeCardDisabled: {
    opacity: 0.6,
  },
  badgeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: designTokens.spacing.scale.sm,
  },
  badgeContent: {
    marginLeft: designTokens.spacing.scale.sm,
    flex: 1,
  },
  badgeName: {
    fontWeight: '600',
    marginBottom: designTokens.spacing.scale.xs,
  },
  badgeNameDisabled: {
    color: designTokens.colors.semantic.textSecondary,
  },
  badgeDescription: {
    color: designTokens.colors.semantic.textSecondary,
  },
  badgeEarnedDate: {
    color: designTokens.colors.semantic.success,
    fontWeight: '500',
  },
  badgeRequirements: {
    backgroundColor: designTokens.colors.semantic.surface + '80',
    padding: designTokens.spacing.scale.sm,
    borderRadius: componentTokens.card.borderRadius,
  },
  requirementsTitle: {
    fontWeight: '500',
    marginBottom: designTokens.spacing.scale.xs,
  },
  requirementItem: {
    color: designTokens.colors.semantic.textSecondary,
    marginBottom: 2,
  },
});
