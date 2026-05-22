import { logger } from '@/utils/logger';
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Download, ChevronRight } from 'lucide-react-native';
import { designTokens } from '@/constants/design-tokens';

export default function PaymentHistoryScreen() {
  const router = useRouter();
  
  const paymentHistory = [
    {
      id: 'pay-001',
      date: 'June 1, 2025',
      amount: 999,
      status: 'paid',
      plan: 'Premium',
      invoice: 'INV-2025-06-001',
    },
    {
      id: 'pay-002',
      date: 'May 1, 2025',
      amount: 999,
      status: 'paid',
      plan: 'Premium',
      invoice: 'INV-2025-05-001',
    },
    {
      id: 'pay-003',
      date: 'April 1, 2025',
      amount: 999,
      status: 'paid',
      plan: 'Premium',
      invoice: 'INV-2025-04-001',
    },
    {
      id: 'pay-004',
      date: 'March 1, 2025',
      amount: 499,
      status: 'paid',
      plan: 'Basic',
      invoice: 'INV-2025-03-001',
    },
    {
      id: 'pay-005',
      date: 'February 1, 2025',
      amount: 499,
      status: 'paid',
      plan: 'Basic',
      invoice: 'INV-2025-02-001',
    },
  ];
  
  const handleDownloadInvoice = (invoiceId: string) => {
    // In a real app, this would download the invoice
    logger.log('Download invoice', invoiceId);
  };
  
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US');
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Payment History</Text>
          <Text style={styles.subtitle}>
            View and download your payment history and invoices.
          </Text>
        </View>
        
        <View style={styles.card}>
          <View style={styles.paymentsList}>
            {paymentHistory.map((payment) => (
              <View key={payment.id} style={styles.paymentItem}>
                <View style={styles.paymentInfo}>
                  <Text style={styles.paymentDate}>{payment.date}</Text>
                  <View style={styles.paymentDetails}>
                    <Text style={styles.paymentPlan}>{payment.plan} Plan</Text>
                    <Text style={styles.paymentAmount}>฿{formatCurrency(payment.amount)}</Text>
                  </View>
                  <View style={styles.paymentStatus}>
                    <View style={[
                      styles.statusBadge,
                      payment.status === 'paid' ? styles.paidBadge : styles.pendingBadge
                    ]}>
                      <Text style={[
                        styles.statusText,
                        payment.status === 'paid' ? styles.paidText : styles.pendingText
                      ]}>
                        {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                      </Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.paymentActions}>
                  <TouchableOpacity
                    style={styles.invoiceButton}
                    onPress={() => handleDownloadInvoice(payment.invoice)}
                  >
                    <Download size={16} color={designTokens.colors.semantic.primary} />
                    <Text style={styles.invoiceButtonText}>Invoice</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.detailsButton}>
                    <Text style={styles.detailsButtonText}>Details</Text>
                    <ChevronRight size={16} color={designTokens.colors.semantic.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </View>
        
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Payment Information</Text>
          <Text style={styles.infoText}>
            Payments are processed on the 1st of each month. If you have any questions about your payments, please contact our support team.
          </Text>
        </View>
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
    color: designTokens.colors.semantic.textSecondary,
    marginBottom: 16,
    lineHeight: 22,
  },
  card: {
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
  paymentsList: {
    gap: 16,
  },
  paymentItem: {
    borderBottomWidth: 1,
    borderBottomColor: designTokens.colors.semantic.border,
    paddingBottom: 16,
    marginBottom: 16,
  },
  paymentInfo: {
    marginBottom: 12,
  },
  paymentDate: {
    fontSize: 14,
    color: designTokens.colors.semantic.textSecondary,
    marginBottom: 8,
  },
  paymentDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  paymentPlan: {
    fontSize: 16,
    fontWeight: 'bold',
    color: designTokens.colors.semantic.text,
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: designTokens.colors.semantic.primary,
  },
  paymentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  paidBadge: {
    backgroundColor: designTokens.colors.semantic.success + '20',
  },
  pendingBadge: {
    backgroundColor: designTokens.colors.semantic.warning + '20',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  paidText: {
    color: designTokens.colors.semantic.success,
  },
  pendingText: {
    color: designTokens.colors.semantic.warning,
  },
  paymentActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  invoiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: designTokens.colors.semantic.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  invoiceButtonText: {
    color: designTokens.colors.semantic.primary,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailsButtonText: {
    color: designTokens.colors.semantic.primary,
    fontWeight: 'bold',
    marginRight: 4,
  },
  infoCard: {
    backgroundColor: designTokens.colors.semantic.primary + '20',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: designTokens.colors.semantic.primary,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: designTokens.colors.semantic.text,
    lineHeight: 20,
  },
});