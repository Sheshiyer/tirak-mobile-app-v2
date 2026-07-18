import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { RadialGradient } from '@/components/ui/RadialGradient';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LottiePlayer } from '@/components/ui/LottiePlayer';
import { SoundManager } from '@/utils/sound-manager';
import { designTokens } from '@/constants/design-tokens';
import { Calendar, Home } from 'lucide-react-native';

export default function BookingConfirmationScreen() {
  useEffect(() => {
    // Staggered 2-beat success celebration
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }, 300);
    }
    SoundManager.play('bookingSuccess');
  }, []);

  const handleViewBooking = () => router.push('/bookings');
  const handleBackToHome = () => router.push('/(app)');

  return (
    <RadialGradient variant="primary" style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.successIcon}>
          <LottiePlayer
            name="bookingSuccess"
            autoPlay
            loop={false}
            style={{ width: 120, height: 120 }}
          />
        </View>
        
        <Text style={styles.title}>Guide Request Sent</Text>
        <Text style={styles.subtitle}>
          Open Bookings to see the live request. It is not confirmed or paid yet.
        </Text>
        
        <Card style={styles.bookingCard} padding={20}>
          <Text style={styles.bookingTitle}>Booking states</Text>
          
          <View style={styles.bookingDetail}>
            <Text style={styles.detailLabel}>Requested</Text>
            <Text style={styles.detailValue}>Guide review</Text>
          </View>
          
          <View style={styles.bookingDetail}>
            <Text style={styles.detailLabel}>Confirmed</Text>
            <Text style={styles.detailValue}>Chat and payment open</Text>
          </View>
          
          <View style={styles.bookingDetail}>
            <Text style={styles.detailLabel}>Paid</Text>
            <Text style={styles.detailValue}>PromptPay complete</Text>
          </View>
        </Card>
        
        <Card style={styles.nextStepsCard} padding={20}>
          <Text style={styles.nextStepsTitle}>Next steps</Text>
          
          <View style={styles.stepItem}>
            <View style={styles.stepIcon}>
              <Calendar size={24} color={designTokens.colors.semantic.primary} />
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Watch the request</Text>
              <Text style={styles.stepDescription}>
                The Bookings screen reads current status from the backend.
              </Text>
            </View>
          </View>
        </Card>
        
        <View style={styles.actionsContainer}>
          <Button
            title="View Booking"
            variant="white"
            onPress={handleViewBooking}
            fullWidth
            style={styles.actionButton}
            icon={<Calendar size={18} color={designTokens.colors.semantic.primary} />}
          />

          <Button
            title="Back to Home"
            variant="primary"
            onPress={handleBackToHome}
            fullWidth
            style={styles.actionButton}
            icon={<Home size={18} color={designTokens.colors.semantic.surface} />}
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
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: 'center',
  },
  successIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: designTokens.colors.semantic.surface,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: designTokens.colors.semantic.surface,
    opacity: 0.9,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  bookingCard: {
    width: '100%',
    marginBottom: 16,
  },
  bookingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: designTokens.colors.semantic.text,
    marginBottom: 16,
  },
  bookingDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: designTokens.colors.semantic.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    color: designTokens.colors.semantic.text,
    fontWeight: '500',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: designTokens.colors.semantic.primary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: designTokens.colors.semantic.success,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: designTokens.colors.semantic.border,
    marginVertical: 16,
  },
  nextStepsCard: {
    width: '100%',
    marginBottom: 24,
  },
  nextStepsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: designTokens.colors.semantic.text,
    marginBottom: 16,
  },
  stepItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  stepIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(111, 76, 170, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: designTokens.colors.semantic.text,
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: designTokens.colors.semantic.textSecondary,
    lineHeight: 20,
  },
  actionsContainer: {
    width: '100%',
    gap: 12,
  },
  actionButton: {
    marginBottom: 0,
  },
});
