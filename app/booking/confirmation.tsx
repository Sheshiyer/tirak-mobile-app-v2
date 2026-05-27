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
import { Calendar, MessageCircle, Home } from 'lucide-react-native';

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
  const handleMessageCompanion = () => router.push('/messages');
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
          Your Tirak guide has the details. Keep chat open for meeting-point updates.
        </Text>
        
        <Card style={styles.bookingCard} padding={20}>
          <Text style={styles.bookingTitle}>Request Details</Text>
          
          <View style={styles.bookingDetail}>
            <Text style={styles.detailLabel}>Booking ID</Text>
            <Text style={styles.detailValue}>TRK-12345678</Text>
          </View>
          
          <View style={styles.bookingDetail}>
            <Text style={styles.detailLabel}>Local Guide</Text>
            <Text style={styles.detailValue}>Nisa Thanakit</Text>
          </View>
          
          <View style={styles.bookingDetail}>
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailValue}>Monday, June 15, 2024</Text>
          </View>
          
          <View style={styles.bookingDetail}>
            <Text style={styles.detailLabel}>Time</Text>
            <Text style={styles.detailValue}>09:00 AM</Text>
          </View>
          
          <View style={styles.bookingDetail}>
            <Text style={styles.detailLabel}>Duration</Text>
            <Text style={styles.detailValue}>Full Day (8 hours)</Text>
          </View>
          
          <View style={styles.bookingDetail}>
            <Text style={styles.detailLabel}>Location</Text>
            <Text style={styles.detailValue}>Bangkok</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.bookingDetail}>
            <Text style={styles.detailLabel}>Guide Rate</Text>
            <Text style={styles.totalValue}>฿2,750</Text>
          </View>
          
          <View style={styles.bookingDetail}>
            <Text style={styles.detailLabel}>Payment</Text>
            <Text style={styles.detailValue}>Paid in cash directly to the guide</Text>
          </View>
        </Card>
        
        <Card style={styles.nextStepsCard} padding={20}>
          <Text style={styles.nextStepsTitle}>Next steps</Text>
          
          <View style={styles.stepItem}>
            <View style={styles.stepIcon}>
              <Calendar size={24} color={designTokens.colors.semantic.primary} />
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Add to Calendar</Text>
              <Text style={styles.stepDescription}>
                Save the time so your Tirak day is easy to find later.
              </Text>
            </View>
          </View>
          
          <View style={styles.stepItem}>
            <View style={styles.stepIcon}>
              <MessageCircle size={24} color={designTokens.colors.semantic.primary} />
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Message your guide</Text>
              <Text style={styles.stepDescription}>
                Confirm the meeting point, pace, food needs, and anything your guide should know.
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
            title="Message Guide"
            variant="white"
            onPress={handleMessageCompanion}
            fullWidth
            style={styles.actionButton}
            icon={<MessageCircle size={18} color={designTokens.colors.semantic.primary} />}
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
