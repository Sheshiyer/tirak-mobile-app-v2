import { logger } from '@/utils/logger';
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { RadialGradient } from '@/components/ui/RadialGradient';
import { DeclineReasonsModal } from '@/components/supplier/DeclineReasonsModal';
import { useBookingQuery, useUpdateBookingStatus } from '@/app/api/booking/booking';
import { bookingToRequest } from '@/utils/booking-request-adapter';

export default function DeclineRequestScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [modalVisible, setModalVisible] = useState(true);
  const { data } = useBookingQuery(id || '');
  const updateStatusMutation = useUpdateBookingStatus();
  const request = data?.data?.booking ? bookingToRequest(data.data.booking) : null;

  const handleDecline = async (reason: { category: string; message: string }) => {
    if (!request) return;

    try {
      logger.log('Declining request:', {
        requestId: request.id,
        reason: reason.category,
        message: reason.message,
      });
      await updateStatusMutation.mutateAsync({
        id: request.id,
        statusData: {
          status: 'cancelled',
          reason: `${reason.category}: ${reason.message}`,
        },
      });

      // Show success message
      Alert.alert(
        'Request Declined',
        `Your decline message has been sent to ${request.customerName}.`,
        [
          {
            text: 'OK',
            onPress: () => {
              setModalVisible(false);
              // Navigate back to requests list
              router.replace('/supplier/requests');
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to decline the request. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleClose = () => {
    setModalVisible(false);
    router.back();
  };

  if (!request) {
    return (
      <RadialGradient variant="appBackground" style={styles.container}>
        {/* Empty container - will navigate back if request not found */}
      </RadialGradient>
    );
  }

  return (
    <RadialGradient variant="appBackground" style={styles.container}>
      <DeclineReasonsModal
        visible={modalVisible}
        onClose={handleClose}
        onDecline={handleDecline}
        customerName={request.customerName}
        serviceName={request.serviceName}
        requestDate={request.requestedDate}
        requestTime={request.requestedTime}
      />
    </RadialGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
