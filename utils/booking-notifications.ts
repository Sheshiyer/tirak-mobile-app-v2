import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { apiUrl } from '@/constants/api';
import { secureStorage } from '@/utils/secure-storage';
import { logger } from '@/utils/logger';
import type { Booking, BookingListItem } from '@/app/api/booking/booking';
import type { User } from '@/types/auth';

const SCHEDULED_BOOKING_NOTIFICATIONS_KEY = 'tirak-scheduled-booking-notifications';

type BookingLike = Pick<
  Booking | BookingListItem,
  'id' | 'date' | 'startTime' | 'companion' | 'customer' | 'service' | 'location'
>;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const readScheduledIds = async (): Promise<Record<string, string>> => {
  try {
    const stored = await secureStorage.getItemAsync(SCHEDULED_BOOKING_NOTIFICATIONS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

const writeScheduledIds = async (ids: Record<string, string>) => {
  await secureStorage.setItemAsync(SCHEDULED_BOOKING_NOTIFICATIONS_KEY, JSON.stringify(ids));
};

const parseBookingStart = (booking: BookingLike): Date | null => {
  if (!booking.date || !booking.startTime) return null;
  const start = new Date(`${booking.date}T${booking.startTime}:00`);
  return Number.isNaN(start.getTime()) ? null : start;
};

const getExperienceName = (booking: BookingLike): string =>
  booking.service?.name || 'your Tirak experience';

export const registerForBookingPushNotifications = async (user?: User | null): Promise<string | null> => {
  if (!user || Platform.OS === 'web') return null;

  try {
    const currentPermissions = await Notifications.getPermissionsAsync();
    let finalStatus = currentPermissions.status;

    if (finalStatus !== 'granted') {
      const requested = await Notifications.requestPermissionsAsync();
      finalStatus = requested.status;
    }

    if (finalStatus !== 'granted') {
      logger.warn('[Notifications] Push permission not granted');
      return null;
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ||
      Constants.easConfig?.projectId;

    const tokenResponse = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    const pushToken = tokenResponse.data;
    const authToken = await secureStorage.getItemAsync('authToken');

    if (authToken) {
      await fetch(apiUrl('/api/notifications/push-token'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          token: pushToken,
          deviceType: Platform.OS,
          deviceInfo: {
            appVersion: Constants.expoConfig?.version,
            platform: Platform.OS,
          },
        }),
      });
    }

    return pushToken;
  } catch (error) {
    logger.warn('[Notifications] Failed to register push token:', error);
    return null;
  }
};

export const showBookingCreatedNotification = async (
  booking: BookingLike,
  role: 'traveler' | 'companion' = 'traveler'
) => {
  if (Platform.OS === 'web') return;

  const title = role === 'companion' ? 'New booking request' : 'Booking submitted';
  const body = role === 'companion'
    ? `${booking.customer?.name || 'A traveler'} requested ${getExperienceName(booking)}.`
    : `${getExperienceName(booking)} is in your Tirak bookings.`;

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: { bookingId: booking.id, type: 'booking_created' },
    },
    trigger: null,
  });
};

export const scheduleThreeHourBookingReminder = async (
  booking: BookingLike,
  role: 'traveler' | 'companion' = 'traveler'
) => {
  if (Platform.OS === 'web') return;

  const start = parseBookingStart(booking);
  if (!start) return;

  const reminderAt = new Date(start.getTime() - 3 * 60 * 60 * 1000);
  if (reminderAt <= new Date()) return;

  const scheduledKey = `${role}:${booking.id}:three-hour`;
  const scheduledIds = await readScheduledIds();
  if (scheduledIds[scheduledKey]) return;

  const title = 'Your Tirak experience starts in 3 hours';
  const body = role === 'companion'
    ? `${getExperienceName(booking)} with ${booking.customer?.name || 'your traveler'} starts at ${booking.startTime}.`
    : `${getExperienceName(booking)} with ${booking.companion?.name || 'your local guide'} starts at ${booking.startTime}.`;

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: { bookingId: booking.id, type: 'booking_reminder' },
    },
    trigger: { type: 'date', date: reminderAt } as Notifications.NotificationTriggerInput,
  });

  scheduledIds[scheduledKey] = notificationId;
  await writeScheduledIds(scheduledIds);
};

export const syncBookingReminderNotifications = async (
  bookings: BookingLike[],
  role: 'traveler' | 'companion' = 'traveler'
) => {
  await Promise.all(
    bookings.map((booking) => scheduleThreeHourBookingReminder(booking, role))
  );
};
