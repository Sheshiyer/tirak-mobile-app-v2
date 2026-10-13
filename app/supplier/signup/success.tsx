import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Clock, CheckCircle2, AlertTriangle, XCircle, RefreshCw, UploadCloud, ShieldCheck } from 'lucide-react-native';
import { designTokens } from '@/constants/design-tokens';
import { Button } from '@/components/ui/Button';
import { RadialGradient } from '@/components/ui/RadialGradient';
import { useSupplierStore } from '@/stores/supplier-store';

const POLL_INTERVAL_MS = 30_000;

const EVIDENCE_LABELS: Record<string, string> = {
  idCardFront: 'Thai ID Front',
  idCardBack: 'Thai ID Back',
  selfieWithId: 'Selfie with ID',
};

export default function ReceiptScreen() {
  const router = useRouter();
  const {
    applicationReceipt,
    applicationStatus,
    applicationStatusLoading,
    pollApplicationStatus,
    evidenceUploads,
    retryEvidenceUpload,
    uploadAllEvidence,
    discardDraft,
  } = useSupplierStore();

  const [pollError, setPollError] = useState<string | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const doPoll = useCallback(async () => {
    setPollError(null);
    try {
      await pollApplicationStatus();
    } catch {
      setPollError('Could not reach the server. You can try again.');
    }
  }, [pollApplicationStatus]);

  // Initial poll + interval
  useEffect(() => {
    doPoll();
    pollTimerRef.current = setInterval(doPoll, POLL_INTERVAL_MS);
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [doPoll]);

  const handleDiscard = () => {
    Alert.alert(
      'Discard Application',
      'This will clear your saved draft, receipt, and evidence from this device. You will need to start over.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            discardDraft();
            router.replace('/supplier/signup');
          },
        },
      ],
    );
  };

  const statusLabel = applicationStatus?.status || 'pending';
  const statusColor =
    statusLabel === 'approved'
      ? designTokens.colors.semantic.success
      : statusLabel === 'rejected'
        ? designTokens.colors.semantic.error
        : designTokens.colors.semantic.primary;

  const StatusIcon =
    statusLabel === 'approved'
      ? ShieldCheck
      : statusLabel === 'rejected'
        ? XCircle
        : Clock;

  const evidenceEntries = Object.entries(evidenceUploads);
  const hasFailedEvidence = evidenceEntries.some(([_, item]) => item.status === 'failed');

  return (
    <SafeAreaView style={styles.container}>
      <RadialGradient style={styles.background} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.statusIconContainer, { backgroundColor: statusColor }]}>
          <StatusIcon size={48} color="white" />
        </View>

        <Text style={styles.title}>
          {statusLabel === 'approved'
            ? 'Application Approved'
            : statusLabel === 'rejected'
              ? 'Application Not Approved'
              : 'Application Submitted'}
        </Text>

        <Text style={styles.message}>
          {statusLabel === 'approved'
            ? 'Your application has been approved. Provisioning is still pending for your account or trial, then activation and profile verification must complete before your profile is publicly listed.'
            : statusLabel === 'rejected'
              ? 'Your guide application was not approved at this time. You may contact support or submit an updated application.'
              : 'Your guide application is pending review. If approved, provisioning happens first, then activation and profile verification continue before publication.'}
        </Text>

        {/* Receipt card */}
        {applicationReceipt && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Application Receipt</Text>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Application ID</Text>
              <Text style={styles.receiptValue} numberOfLines={1}>
                {applicationReceipt.applicationId}
              </Text>
            </View>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Status</Text>
              <Text style={[styles.receiptValue, { color: statusColor, textTransform: 'capitalize' }]}>
                {statusLabel}
              </Text>
            </View>
            {applicationStatus?.accountStatus && (
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Account Status</Text>
                <Text style={styles.receiptValue}>
                  {applicationStatus.accountStatus}
                </Text>
              </View>
            )}
            {applicationStatus?.profileStatus && (
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Profile Status</Text>
                <Text style={styles.receiptValue}>
                  {applicationStatus.profileStatus}
                </Text>
              </View>
            )}
            {applicationStatus?.paymentStatus && (
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Payment</Text>
                <Text style={styles.receiptValue}>
                  {applicationStatus.paymentStatus}
                </Text>
              </View>
            )}

            {/* Blockers */}
            {Boolean(
              applicationStatus?.blockers?.account ||
              applicationStatus?.blockers?.profile ||
              applicationStatus?.blockers?.publication ||
              applicationStatus?.blockers?.evidence
            ) && (
              <View style={styles.blockersContainer}>
                <Text style={styles.blockersTitle}>Lifecycle Blockers</Text>
                {applicationStatus?.blockers?.account && (
                  <Text style={styles.blockerItem}>• Account: {applicationStatus.blockers.account}</Text>
                )}
                {applicationStatus?.blockers?.profile && (
                  <Text style={styles.blockerItem}>• Profile: {applicationStatus.blockers.profile}</Text>
                )}
                {applicationStatus?.blockers?.publication && (
                  <Text style={styles.blockerItem}>• Publication: {applicationStatus.blockers.publication}</Text>
                )}
                {applicationStatus?.blockers?.evidence && (
                  <Text style={styles.blockerItem}>• Evidence: {applicationStatus.blockers.evidence}</Text>
                )}
              </View>
            )}
          </View>
        )}

        {/* Evidence upload status */}
        {evidenceEntries.length > 0 && (
          <View style={styles.card}>
            <View style={styles.evidenceHeader}>
              <Text style={styles.cardTitle}>Evidence Uploads</Text>
              {hasFailedEvidence && (
                <TouchableOpacity onPress={() => void uploadAllEvidence()} style={styles.retryAllButton}>
                  <Text style={styles.retryAllText}>Retry All</Text>
                </TouchableOpacity>
              )}
            </View>

            {evidenceEntries.map(([key, item], index) => {
              const label =
                EVIDENCE_LABELS[key] ||
                (key.startsWith('portfolio_') ? `Portfolio Photo ${parseInt(key.split('_')[1], 10) + 1}` : key);

              return (
                <View key={key} style={[styles.evidenceRow, index > 0 && styles.evidenceBorder]}>
                  <View style={styles.evidenceInfo}>
                    <Text style={styles.evidenceLabel}>{label}</Text>
                    {item.status === 'uploaded' ? (
                      <Text style={styles.evidenceSuccess}>
                        ✓ Uploaded ({item.evidenceId || 'Received'})
                      </Text>
                    ) : item.status === 'uploading' ? (
                      <View style={styles.uploadingContainer}>
                        <ActivityIndicator size="small" color={designTokens.colors.semantic.primary} />
                        <Text style={styles.evidenceUploading}>Uploading...</Text>
                      </View>
                    ) : item.status === 'failed' ? (
                      <Text style={styles.evidenceError}>
                        ✕ {item.error || 'Upload failed'}
                      </Text>
                    ) : (
                      <Text style={styles.evidencePending}>Pending upload</Text>
                    )}
                  </View>

                  {item.status === 'failed' && (
                    <TouchableOpacity
                      onPress={() => void retryEvidenceUpload(key)}
                      style={styles.retryButton}
                    >
                      <RefreshCw size={14} color={designTokens.colors.semantic.primary} />
                      <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Poll error */}
        {pollError && (
          <Text style={styles.pollError}>{pollError}</Text>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title={applicationStatusLoading ? 'Checking...' : 'Check Status'}
            onPress={doPoll}
            loading={applicationStatusLoading}
            disabled={applicationStatusLoading}
            style={styles.primaryButton}
            icon={<RefreshCw size={16} color="white" />}
          />
          <Button
            title="Discard Draft"
            onPress={handleDiscard}
            variant="outline"
            style={styles.discardButton}
            icon={
              <XCircle
                size={16}
                color={designTokens.colors.semantic.error}
              />
            }
          />
        </View>

        {/* Info */}
        <Text style={styles.infoText}>
          The receipt and high-entropy status capability token are securely stored on this device. Application review does not require subscription payment. Application ID reference alone cannot recover credentials or capability on another device.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  scrollContent: {
    padding: 24,
    alignItems: 'center',
  },
  statusIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    color: 'white',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 22,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 18,
    width: '100%',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: designTokens.colors.semantic.text,
    marginBottom: 10,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: designTokens.colors.semantic.border,
  },
  receiptLabel: {
    fontSize: 13,
    color: designTokens.colors.semantic.textSecondary,
    flexShrink: 0,
  },
  receiptValue: {
    fontSize: 14,
    fontWeight: '600',
    color: designTokens.colors.semantic.text,
    flexShrink: 1,
    textAlign: 'right',
    marginLeft: 12,
  },
  blockersContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: designTokens.colors.semantic.warning + '15',
    borderRadius: 8,
  },
  blockersTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: designTokens.colors.semantic.text,
    marginBottom: 4,
  },
  blockerItem: {
    fontSize: 12,
    color: designTokens.colors.semantic.textSecondary,
    lineHeight: 18,
  },
  evidenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  retryAllButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  retryAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: designTokens.colors.semantic.primary,
  },
  evidenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  evidenceBorder: {
    borderTopWidth: 1,
    borderTopColor: designTokens.colors.semantic.border,
  },
  evidenceInfo: {
    flex: 1,
    marginRight: 8,
  },
  evidenceLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: designTokens.colors.semantic.text,
  },
  evidenceSuccess: {
    fontSize: 12,
    color: designTokens.colors.semantic.success,
    marginTop: 2,
  },
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  evidenceUploading: {
    fontSize: 12,
    color: designTokens.colors.semantic.primary,
  },
  evidenceError: {
    fontSize: 12,
    color: designTokens.colors.semantic.error,
    marginTop: 2,
  },
  evidencePending: {
    fontSize: 12,
    color: designTokens.colors.semantic.textSecondary,
    marginTop: 2,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: designTokens.colors.semantic.primary + '15',
  },
  retryButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: designTokens.colors.semantic.primary,
  },
  pollError: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
  },
  actions: {
    width: '100%',
    gap: 12,
    marginBottom: 16,
  },
  primaryButton: {
    width: '100%',
  },
  discardButton: {
    width: '100%',
    borderColor: 'rgba(255,255,255,0.4)',
  },
  infoText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 8,
    marginBottom: 24,
  },
});
