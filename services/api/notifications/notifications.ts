import { logger } from '@/utils/logger';
import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAuthToken } from '../companion/companion';
import { apiUrl } from '@/constants/api';
import { secureStorage } from '@/utils/secure-storage';

const notificationsUrl = (path = '') => apiUrl(`/api/notifications${path}`);
const DEMO_BOOKINGS_STORAGE_KEY = 'tirak-demo-bookings';
const LOCAL_NOTIFICATION_READ_IDS_KEY = 'tirak-local-notification-read-ids';

const emptyNotificationsResponse: NotificationsResponse = {
    success: true,
    data: {
        notifications: [],
        pagination: {
            page: 1,
            limit: 20,
            total: 0,
            totalPages: 0,
        },
        unreadCount: 0,
    },
};

// Types
export type NotificationType =
    | 'booking_created'
    | 'booking_request'
    | 'booking_confirmed'
    | 'booking_cancelled'
    | 'booking_reminder'
    | 'booking_status_update'
    | 'new_message'
    | 'review_received'
    | 'payment_completed';

export interface NotificationData {
    bookingId?: string;
    conversationId?: string;
    reviewId?: string;
    paymentId?: string;
}

export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    data: NotificationData;
    read: boolean;
    createdAt: string;
}

export interface NotificationsResponse {
    success: boolean;
    data: {
        notifications: Notification[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
        unreadCount: number;
    };
}

export interface NotificationPreferences {
    push: boolean;
    email: boolean;
    sms: boolean;
    in_app: boolean;
    types: Partial<Record<NotificationType, boolean>>;
}

const isExpectedNotificationFallback = (error: unknown): boolean => {
    if (!axios.isAxiosError(error)) return false;
    return [401, 404, 405, 409, 500, 501, 503].includes(error.response?.status || 0);
};

const readLocalNotificationReadIds = async (): Promise<Set<string>> => {
    try {
        const stored = await secureStorage.getItemAsync(LOCAL_NOTIFICATION_READ_IDS_KEY);
        const parsed = stored ? JSON.parse(stored) : [];
        return new Set(Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : []);
    } catch (error) {
        logger.warn('Unable to read local notification read state', error);
        return new Set();
    }
};

const writeLocalNotificationReadIds = async (ids: Set<string>) => {
    try {
        await secureStorage.setItemAsync(LOCAL_NOTIFICATION_READ_IDS_KEY, JSON.stringify(Array.from(ids)));
    } catch (error) {
        logger.warn('Unable to write local notification read state', error);
    }
};

const rememberLocalNotificationRead = async (id: string) => {
    const ids = await readLocalNotificationReadIds();
    ids.add(id);
    await writeLocalNotificationReadIds(ids);
};

const rememberAllLocalNotificationsRead = async (idsToRead: string[]) => {
    const ids = await readLocalNotificationReadIds();
    idsToRead.forEach((id) => ids.add(id));
    await writeLocalNotificationReadIds(ids);
};

const readStoredDemoBookings = async (): Promise<any[]> => {
    try {
        const stored = await secureStorage.getItemAsync(DEMO_BOOKINGS_STORAGE_KEY);
        const parsed = stored ? JSON.parse(stored) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        logger.warn('Unable to read local booking notifications', error);
        return [];
    }
};

const getLocalBookingNotifications = async (): Promise<Notification[]> => {
    const [bookings, readIds] = await Promise.all([
        readStoredDemoBookings(),
        readLocalNotificationReadIds(),
    ]);

    return bookings.map((booking): Notification => {
        const isPending = booking.status === 'pending';
        const id = `local_booking_notification_${booking.id}_${isPending ? 'request' : booking.status || 'status'}`;
        const customerName = booking.customer?.name || 'A traveler';
        const serviceName = booking.service?.name || 'a Tirak experience';

        return {
            id,
            type: isPending ? 'booking_request' : 'booking_status_update',
            title: isPending ? 'New booking request' : 'Booking updated',
            message: isPending
                ? `${customerName} requested ${serviceName}.`
                : `${serviceName} is now ${booking.status || 'updated'}.`,
            data: { bookingId: booking.id },
            read: readIds.has(id),
            createdAt: booking.updatedAt || booking.createdAt || new Date().toISOString(),
        };
    });
};

const normalizeNotificationsResponse = (
    response: NotificationsResponse,
    params: { page?: number; limit?: number; read?: boolean } = {}
): NotificationsResponse => {
    const notifications = [...(response.data.notifications || [])]
        .filter((notification) => params.read === undefined || notification.read === params.read)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const limit = params.limit || response.data.pagination.limit || 20;
    const page = params.page || response.data.pagination.page || 1;
    const total = notifications.length;

    return {
        success: true,
        data: {
            notifications,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
            unreadCount: notifications.filter((notification) => !notification.read).length,
        },
    };
};

const mergeNotifications = (
    backendResponse: NotificationsResponse,
    localNotifications: Notification[],
    params: { page?: number; limit?: number; read?: boolean } = {}
): NotificationsResponse => {
    const byId = new Map<string, Notification>();
    [...localNotifications, ...(backendResponse.data.notifications || [])].forEach((notification) => {
        byId.set(notification.id, notification);
    });

    return normalizeNotificationsResponse({
        success: true,
        data: {
            ...backendResponse.data,
            notifications: Array.from(byId.values()),
        },
    }, params);
};

const markResponseNotificationRead = (response: NotificationsResponse | undefined, id: string): NotificationsResponse | undefined => {
    if (!response) return response;
    const notifications = response.data.notifications.map((notification) => (
        notification.id === id ? { ...notification, read: true } : notification
    ));
    return normalizeNotificationsResponse({
        success: true,
        data: {
            ...response.data,
            notifications,
        },
    });
};

const markResponseAllNotificationsRead = (response: NotificationsResponse | undefined): NotificationsResponse | undefined => {
    if (!response) return response;
    return normalizeNotificationsResponse({
        success: true,
        data: {
            ...response.data,
            notifications: response.data.notifications.map((notification) => ({ ...notification, read: true })),
        },
    });
};

// API functions
export const getNotifications = async (params: { page?: number; limit?: number; read?: boolean } = {}): Promise<NotificationsResponse> => {
    try {
        const localNotifications = await getLocalBookingNotifications();
        const token = await getAuthToken();
        if (!token) {
            return normalizeNotificationsResponse({
                ...emptyNotificationsResponse,
                data: {
                    ...emptyNotificationsResponse.data,
                    notifications: localNotifications,
                },
            }, params);
        }
        const response = await axios.get(notificationsUrl(), { params, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
        return mergeNotifications(response.data, localNotifications, params);
    } catch (error) {
        if (isExpectedNotificationFallback(error)) {
            logger.warn('Notifications backend unavailable; using empty notifications fallback', {
                status: axios.isAxiosError(error) ? error.response?.status : undefined,
            });
            const localNotifications = await getLocalBookingNotifications();
            return normalizeNotificationsResponse({
                ...emptyNotificationsResponse,
                data: {
                    ...emptyNotificationsResponse.data,
                    notifications: localNotifications,
                },
            }, params);
        }
        console.error('Error fetching notifications:', error);
        throw error;
    }
};

export const markNotificationRead = async (id: string): Promise<{ success: boolean; message: string }> => {
    await rememberLocalNotificationRead(id);

    try {
        const token = await getAuthToken();
        if (!token || id.startsWith('local_booking_notification_')) {
            return { success: true, message: 'Notification marked as read locally' };
        }

        const response = await axios.put(notificationsUrl(`/${id}/read`), undefined, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
        // logger.log("response", response.data); 
        return response.data;
    } catch (error) {
        if (isExpectedNotificationFallback(error)) {
            logger.warn('Notification read endpoint unavailable; marked notification locally', {
                id,
                status: axios.isAxiosError(error) ? error.response?.status : undefined,
            });
            return { success: true, message: 'Notification marked as read locally' };
        }
        throw error;
    }
};

export const markAllNotificationsRead = async (): Promise<{ success: boolean; message: string }> => {
    try {
        const localNotifications = await getLocalBookingNotifications();
        await rememberAllLocalNotificationsRead(localNotifications.map((notification) => notification.id));

        const token = await getAuthToken();
        if (!token) {
            return { success: true, message: 'Notifications marked as read locally' };
        }

        const response = await axios.put(notificationsUrl('/read-all'), undefined, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
        // logger.log("response", response.data);     
        return response.data;
    } catch (error) {
        if (isExpectedNotificationFallback(error)) {
            logger.warn('Notification read-all endpoint unavailable; marked notifications locally', {
                status: axios.isAxiosError(error) ? error.response?.status : undefined,
            });
            return { success: true, message: 'Notifications marked as read locally' };
        }
        throw error;
    }
};

export const registerPushToken = async (payload: {
    token: string;
    deviceType: 'ios' | 'android' | 'web' | string;
    deviceInfo?: Record<string, unknown>;
}): Promise<{ success: boolean; message: string }> => {
    const token = await getAuthToken();
    const response = await axios.post(notificationsUrl('/push-token'), payload, {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });
    return response.data;
};

export const getNotificationPreferences = async (): Promise<{ success: boolean; data: { preferences: NotificationPreferences }; message: string }> => {
    const token = await getAuthToken();
    const response = await axios.get(notificationsUrl('/preferences'), {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });
    return response.data;
};

export const updateNotificationPreferences = async (
    preferences: Partial<NotificationPreferences>
): Promise<{ success: boolean; data: { preferences: NotificationPreferences }; message: string }> => {
    const token = await getAuthToken();
    const response = await axios.put(notificationsUrl('/preferences'), preferences, {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });
    return response.data;
};

// React Query hooks
export const useNotifications = (params: { page?: number; limit?: number; read?: boolean } = {}) => {
    return useQuery({
        queryKey: ['notifications', params],
        queryFn: () => getNotifications(params),
    });
};

export const useMarkNotificationRead = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => markNotificationRead(id),
        onMutate: async (id: string) => {
            await queryClient.cancelQueries({ queryKey: ['notifications'] });
            queryClient.setQueriesData<NotificationsResponse>(
                { queryKey: ['notifications'] },
                (old) => markResponseNotificationRead(old, id)
            );
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });
};

export const useMarkAllNotificationsRead = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => markAllNotificationsRead(),
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ['notifications'] });
            queryClient.setQueriesData<NotificationsResponse>(
                { queryKey: ['notifications'] },
                (old) => markResponseAllNotificationsRead(old)
            );
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });
};

export const useNotificationPreferences = () => {
    return useQuery({
        queryKey: ['notificationPreferences'],
        queryFn: getNotificationPreferences,
    });
};

export const useUpdateNotificationPreferences = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateNotificationPreferences,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notificationPreferences'] });
        },
    });
};
