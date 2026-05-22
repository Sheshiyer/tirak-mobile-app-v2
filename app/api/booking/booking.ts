import { logger } from '@/utils/logger';
import axios from "axios";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { secureStorage } from '@/utils/secure-storage';
import { apiUrl } from '@/constants/api';
import { isTestCompanionId } from '@/utils/companion-display';
import { handleApiError, isUnauthorizedError } from '@/utils/api-errors';
import { useAuthStore } from '@/stores/auth-store';
import {
  scheduleThreeHourBookingReminder,
  showBookingCreatedNotification,
  syncBookingReminderNotifications,
} from '@/utils/booking-notifications';

const DEMO_BOOKINGS_STORAGE_KEY = 'tirak-demo-bookings';

// TypeScript interfaces for booking API
export interface CreateBookingRequest {
  companionId: string; // Must be UUID format
  serviceId?: string; // Must be UUID format
  date: string;
  startTime: string;
  endTime?: string;
  duration: number; // Duration in minutes (minimum 30)
  location?: string;
  specialRequests?: string;
  meetingPoint?: string;
  template?: string;
  preferredLanguages?: string[];
  dietaryRestrictions?: string[];
  accessibilityNeeds?: string[];
}

export interface BookingCompanion {
  id: string;
  name: string;
  profileImage: string;
  phone?: string;
  rating?: number;
}

export interface BookingCustomer {
  id: string;
  name: string;
  profileImage: string;
  phone: string;
  rating: number;
}

export interface BookingService {
  id: string;
  name: string;
  description?: string;
  price: number;
}

export interface PaymentMethod {
  id: string;
  type: string;
  last4?: string;
}

export interface BookingTimelineItem {
  status: string;
  timestamp: string;
  note?: string;
}

export type BookingStatus = "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";
export type PaymentStatus = "pending" | "paid" | "refunded";

export interface Booking {
  meetingPoint: string;
  id: string;
  companionId: string;
  companion: BookingCompanion;
  customerId: string;
  customer?: BookingCustomer;
  serviceId?: string;
  service?: BookingService;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  location?: string;
  specialRequests?: string;
  status: BookingStatus;
  totalAmount: number;
  serviceFee: number;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  timeline?: BookingTimelineItem[];
  createdAt: string;
  updatedAt: string;
}

export interface BookingListItem {
  id: string;
  companion: BookingCompanion;
  customer: BookingCustomer;
  service?: BookingService;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  location?: string;
  status: BookingStatus;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  createdAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CreateBookingResponse {
  success: boolean;
  data: {
    booking: Booking;
  };
  message: string;
}

const createDemoBookingResponse = (bookingData: CreateBookingRequest): CreateBookingResponse => {
  const now = new Date().toISOString();
  const serviceName = bookingData.serviceId === 'test-evening-food-trail'
    ? 'Evening Food Trail'
    : 'Old Town Market & Temple Walk';
  const servicePrice = bookingData.serviceId === 'test-evening-food-trail' ? 1500 : 1800;

  return {
    success: true,
    message: 'Demo booking created',
    data: {
      booking: {
        id: `demo_booking_${Date.now()}`,
        companionId: bookingData.companionId,
        companion: {
          id: bookingData.companionId,
          name: 'Test Companion',
          profileImage: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?q=80&w=1000&auto=format&fit=crop',
          rating: 5,
        },
        customerId: 'demo_customer',
        customer: {
          id: 'demo_customer',
          name: 'Test',
          profileImage: '',
          phone: '',
          rating: 5,
        },
        serviceId: bookingData.serviceId,
        service: {
          id: bookingData.serviceId || 'test-market-temple-walk',
          name: serviceName,
          price: servicePrice,
        },
        date: bookingData.date,
        startTime: bookingData.startTime,
        endTime: bookingData.endTime || bookingData.startTime,
        duration: bookingData.duration,
        location: bookingData.location,
        meetingPoint: bookingData.meetingPoint || '',
        specialRequests: bookingData.specialRequests,
        status: 'pending',
        totalAmount: servicePrice,
        serviceFee: 0,
        paymentStatus: 'pending',
        timeline: [
          {
            status: 'pending',
            timestamp: now,
            note: 'Demo booking submitted for preview testing.',
          },
        ],
        createdAt: now,
        updatedAt: now,
      },
    },
  };
};

export interface BookingsListResponse {
  success: boolean;
  data: {
    // Some backends return 'bookings', some return 'items'
    bookings?: BookingListItem[];
    items?: BookingListItem[];
    pagination: Pagination;
  };
}

export interface BookingDetailsResponse {
  success: boolean;
  data: {
    booking: Booking;
  };
}

export interface UpdateBookingStatusRequest {
  status: "confirmed" | "cancelled" | "completed";
  reason?: string;
}

export interface UpdateBookingStatusResponse {
  success: boolean;
  data: {
    booking: Booking;
  };
  message: string;
}

// Query parameters for fetching bookings
export interface BookingsQueryParams {
  status?: BookingStatus;
  page?: number;
  limit?: number;
}

const isDemoBookingId = (id: string): boolean => id.startsWith('demo_booking_');

const getCurrentNotificationRole = (): 'traveler' | 'companion' => {
  const userType = useAuthStore.getState().user?.userType;
  return userType === 'companion' || userType === 'supplier' ? 'companion' : 'traveler';
};

const isDemoPreviewBookingRequest = (bookingData: CreateBookingRequest): boolean => {
  const serviceId = bookingData.serviceId || '';
  return (
    isTestCompanionId(bookingData.companionId) ||
    serviceId.startsWith('test-') ||
    serviceId.startsWith('demo-service-')
  );
};

const createAndStoreDemoBookingResponse = async (bookingData: CreateBookingRequest): Promise<CreateBookingResponse> => {
  const response = createDemoBookingResponse(bookingData);
  await upsertStoredDemoBooking(response.data.booking);
  await showBookingCreatedNotification(response.data.booking, 'traveler');
  await scheduleThreeHourBookingReminder(response.data.booking, 'traveler');
  return response;
};

const toBookingListItem = (booking: Booking): BookingListItem => ({
  id: booking.id,
  companion: booking.companion,
  customer: booking.customer || {
    id: booking.customerId,
    name: 'Traveler',
    profileImage: '',
    phone: '',
    rating: 0,
  },
  service: booking.service,
  date: booking.date,
  startTime: booking.startTime,
  endTime: booking.endTime,
  duration: booking.duration,
  location: booking.location,
  status: booking.status,
  totalAmount: booking.totalAmount,
  paymentStatus: booking.paymentStatus,
  createdAt: booking.createdAt,
});

const readStoredDemoBookings = async (): Promise<Booking[]> => {
  try {
    const stored = await secureStorage.getItemAsync(DEMO_BOOKINGS_STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    logger.warn('Failed to read demo bookings cache:', error);
    return [];
  }
};

const writeStoredDemoBookings = async (bookings: Booking[]) => {
  try {
    await secureStorage.setItemAsync(DEMO_BOOKINGS_STORAGE_KEY, JSON.stringify(bookings));
  } catch (error) {
    logger.warn('Failed to write demo bookings cache:', error);
  }
};

const upsertStoredDemoBooking = async (booking: Booking) => {
  const bookings = await readStoredDemoBookings();
  const nextBookings = [
    booking,
    ...bookings.filter((item) => item.id !== booking.id),
  ].slice(0, 20);
  await writeStoredDemoBookings(nextBookings);
};

// Helper function to get auth token
const getAuthToken = async (): Promise<string | null> => {
  try {
    return await secureStorage.getItemAsync("authToken");
  } catch (error) {
    console.error("Error getting auth token:", error);
    return null;
  }
};

// API Functions

// Create a new booking
export const createBooking = async (bookingData: CreateBookingRequest): Promise<CreateBookingResponse> => {
  try {
    const token = await getAuthToken();
    
    const url = apiUrl('/api/bookings');
    
    // Validate required fields
    if (!bookingData.companionId || !bookingData.date || !bookingData.startTime || !bookingData.duration) {
      throw new Error('Missing required booking fields');
    }
    
    // Clean up optional arrays to prevent sending empty arrays
    const cleanedData = {
      ...bookingData,
      preferredLanguages: bookingData.preferredLanguages?.length ? bookingData.preferredLanguages : undefined,
      dietaryRestrictions: bookingData.dietaryRestrictions?.length ? bookingData.dietaryRestrictions : undefined,
      accessibilityNeeds: bookingData.accessibilityNeeds?.length ? bookingData.accessibilityNeeds : undefined
    };
    
    // logger.log("Creating booking:", url, cleanedData); 
    // logger.log("created booking"); 
    
    let response;
    try {
      response = await axios.post(url, cleanedData, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });
    } catch (error) {
      if (axios.isAxiosError(error) && isDemoPreviewBookingRequest(bookingData)) {
        logger.warn('[Booking] Live booking endpoint unavailable for explicit demo booking; using local review fallback.', {
          status: error.response?.status,
          serviceId: bookingData.serviceId,
          companionId: bookingData.companionId,
        });
        return await createAndStoreDemoBookingResponse(bookingData);
      }
      throw error;
    }

    // logger.log("Create booking response:", response.data);
    
    await showBookingCreatedNotification(response.data.data.booking, 'traveler');
    await scheduleThreeHourBookingReminder(response.data.data.booking, 'traveler');

    return response.data;
  } catch (error) {
    if (isUnauthorizedError(error)) {
      throw new Error("Please log in again to create this booking.");
    }

    logger.error("Error creating booking:", error instanceof Error ? error.message : error);
    
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          "Failed to create booking";
      logger.error("API Error Details:", {
        status: error.response?.status,
        data: error.response?.data,
        message: errorMessage
      });
      throw new Error(errorMessage);
    }
    
    throw error instanceof Error ? error : new Error("Network error occurred while creating booking");
  }
};

// Demo bookings for Apple review and testing
const getDemoBookings = (): BookingsListResponse => ({
  success: true,
  data: {
    items: [
      {
        id: 'demo_booking_001',
        companion: {
          id: 'companion_001',
          name: 'Somchai Guide',
          profileImage: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300',
          phone: '+66 81 234 5678',
          rating: 4.8,
        },
        customer: {
          id: 'customer_001',
          name: 'John Smith',
          profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300',
          phone: '+1 555 123 4567',
          rating: 5.0,
        },
        service: {
          id: 'service_001',
          name: 'Bangkok City Tour',
          description: 'Full day tour of Bangkok including Grand Palace, Wat Pho, and river cruise.',
          price: 2500,
        },
        date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0], // 2 days from now
        startTime: '09:00',
        endTime: '17:00',
        duration: 480,
        location: 'Bangkok',
        status: 'confirmed',
        totalAmount: 2500,
        paymentStatus: 'paid',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'demo_booking_002',
        companion: {
          id: 'companion_002',
          name: 'Areeya Thai',
          profileImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300',
          phone: '+66 81 987 6543',
          rating: 4.9,
        },
        customer: {
          id: 'customer_001',
          name: 'John Smith',
          profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300',
          phone: '+1 555 123 4567',
          rating: 5.0,
        },
        service: {
          id: 'service_002',
          name: 'Thai Cooking Class',
          description: 'Learn to cook authentic Thai dishes with a local chef.',
          price: 1800,
        },
        date: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0], // 5 days from now
        startTime: '14:00',
        endTime: '17:00',
        duration: 180,
        location: 'Chiang Mai',
        status: 'pending',
        totalAmount: 1800,
        paymentStatus: 'pending',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'demo_booking_003',
        companion: {
          id: 'companion_003',
          name: 'Niran Beach',
          profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
          phone: '+66 81 456 7890',
          rating: 4.7,
        },
        customer: {
          id: 'customer_002',
          name: 'Sarah Johnson',
          profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300',
          phone: '+1 555 987 6543',
          rating: 4.8,
        },
        service: {
          id: 'service_003',
          name: 'Phuket Island Hopping',
          description: 'Explore the beautiful islands around Phuket by boat.',
          price: 3200,
        },
        date: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0], // 3 days ago
        startTime: '08:00',
        endTime: '16:00',
        duration: 480,
        location: 'Phuket',
        status: 'completed',
        totalAmount: 3200,
        paymentStatus: 'paid',
        createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
      },
    ],
    pagination: {
      page: 1,
      limit: 20,
      total: 3,
      totalPages: 1,
    },
  },
});

const getDemoBookingDetails = async (id: string): Promise<BookingDetailsResponse> => {
  const storedBookings = await readStoredDemoBookings();
  const storedMatch = storedBookings.find(item => item.id === id);

  if (storedMatch) {
    return {
      success: true,
      data: {
        booking: storedMatch,
      },
    };
  }

  const demoItems = getDemoBookings().data.items || [];
  const matchingItem = demoItems.find(item => item.id === id);

  if (matchingItem) {
    return {
      success: true,
      data: {
        booking: {
          ...matchingItem,
          companionId: matchingItem.companion.id,
          customerId: matchingItem.customer.id,
          meetingPoint: matchingItem.location || 'Meeting point to be confirmed',
          serviceFee: 0,
          timeline: [
            {
              status: matchingItem.status,
              timestamp: matchingItem.createdAt,
              note: 'Demo booking loaded for preview testing.',
            },
          ],
          updatedAt: matchingItem.createdAt,
        },
      },
    };
  }

  const now = new Date();
  const bookingDate = new Date(now);
  bookingDate.setDate(now.getDate() + 3);

  return {
    success: true,
    data: {
      booking: {
        id,
        companionId: '30c6d267-22d1-4cd0-8bdc-46993c14c143',
        companion: {
          id: '30c6d267-22d1-4cd0-8bdc-46993c14c143',
          name: 'Test Companion',
          profileImage: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?q=80&w=1000&auto=format&fit=crop',
          rating: 5,
        },
        customerId: 'demo_customer',
        customer: {
          id: 'demo_customer',
          name: 'Test',
          profileImage: '',
          phone: '',
          rating: 5,
        },
        serviceId: 'test-market-temple-walk',
        service: {
          id: 'test-market-temple-walk',
          name: 'Old Town Market & Temple Walk',
          description: 'A relaxed walk through Bangkok food stalls, flower markets, river lanes, and a quiet temple stop.',
          price: 1800,
        },
        date: bookingDate.toISOString().split('T')[0],
        startTime: '10:00',
        endTime: '13:00',
        duration: 180,
        location: 'Bangkok',
        meetingPoint: 'Tha Maharaj Pier entrance',
        specialRequests: 'Show me the must-see places and local culture',
        status: 'pending',
        totalAmount: 1800,
        serviceFee: 0,
        paymentStatus: 'pending',
        timeline: [
          {
            status: 'pending',
            timestamp: now.toISOString(),
            note: 'Demo booking submitted for preview testing.',
          },
        ],
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
    },
  };
};

const getMergedDemoBookings = async (): Promise<BookingsListResponse> => {
  const storedBookings = await readStoredDemoBookings();
  const storedItems = storedBookings.map(toBookingListItem);
  const defaultItems = getDemoBookings().data.items || [];
  const storedIds = new Set(storedItems.map((item) => item.id));
  const items = [
    ...storedItems,
    ...defaultItems.filter((item) => !storedIds.has(item.id)),
  ];

  return {
    success: true,
    data: {
      items,
      pagination: {
        page: 1,
        limit: 20,
        total: items.length,
        totalPages: 1,
      },
    },
  };
};

const updateDemoBookingStatus = async (
  id: string,
  statusData: UpdateBookingStatusRequest
): Promise<UpdateBookingStatusResponse> => {
  const details = await getDemoBookingDetails(id);
  const now = new Date().toISOString();
  const updatedBooking: Booking = {
    ...details.data.booking,
    status: statusData.status,
    updatedAt: now,
    timeline: [
      ...(details.data.booking.timeline || []),
      {
        status: statusData.status,
        timestamp: now,
        note: statusData.reason || `Guide marked booking as ${statusData.status}.`,
      },
    ],
  };

  await upsertStoredDemoBooking(updatedBooking);

  return {
    success: true,
    message: 'Demo booking status updated',
    data: {
      booking: updatedBooking,
    },
  };
};

// Fetch bookings list
export const fetchBookings = async (params: BookingsQueryParams = {}): Promise<BookingsListResponse> => {
  try {
    const token = await getAuthToken();
    
    // Build query string
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });
    
    const queryString = queryParams.toString();
    const url = apiUrl(`/api/bookings${queryString ? `?${queryString}` : ''}`);
    
    logger.log("Fetching bookings:", url);
    
    const response = await axios.get(url, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    });

    logger.log("Bookings list response:", response.data);

    if (__DEV__) {
      const storedDemoBookings = await readStoredDemoBookings();
      if (storedDemoBookings.length > 0) {
        const storedItems = storedDemoBookings.map(toBookingListItem);
        const responseItems = response.data?.data?.bookings || response.data?.data?.items || [];
        const storedIds = new Set(storedItems.map((item) => item.id));
        const mergedResponse = {
          ...response.data,
          data: {
            ...response.data.data,
            items: [
              ...storedItems,
              ...responseItems.filter((item: BookingListItem) => !storedIds.has(item.id)),
            ],
            pagination: response.data.data.pagination || {
              page: 1,
              limit: 20,
              total: storedItems.length + responseItems.length,
              totalPages: 1,
            },
          },
        };
        await syncBookingReminderNotifications(mergedResponse.data.items || [], getCurrentNotificationRole());
        return mergedResponse;
      }
    }

    const responseItems = response.data?.data?.bookings || response.data?.data?.items || [];
    await syncBookingReminderNotifications(responseItems, getCurrentNotificationRole());

    return response.data;
  } catch (error: any) {
    handleApiError(error);
    if (isUnauthorizedError(error)) {
      throw new Error("Please log in again to view your bookings.");
    }

    logger.error("Error fetching bookings:", error?.message);
    
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          "Failed to fetch bookings";
      logger.error("API Error Details:", {
        status: error.response?.status,
        data: error.response?.data,
        message: errorMessage
      });
      throw new Error(errorMessage);
    }
    
    throw new Error("Network error occurred while fetching bookings");
  }
};

// Fetch booking details by ID
export const fetchBookingById = async (id: string): Promise<BookingDetailsResponse> => {
  try {
    if (id.startsWith('demo_booking_')) {
      return await getDemoBookingDetails(id);
    }

    const token = await getAuthToken();
    
    const url = apiUrl(`/api/bookings/${id}`);
    
    // logger.log("Fetching booking details:", url);
    
    const response = await axios.get(url, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    });

    // logger.log("Booking details response:", response.data);
    
    return response.data;
  } catch (error: any) {
    handleApiError(error);
    if (isUnauthorizedError(error)) {
      throw new Error("Please log in again to view this booking.");
    }

    logger.error("Error fetching booking details:", error?.message);
    
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          "Failed to fetch booking details";
      logger.error("API Error Details:", {
        status: error.response?.status,
        data: error.response?.data,
        message: errorMessage
      });
      throw new Error(errorMessage);
    }
    
    throw new Error("Network error occurred while fetching booking details");
  }
};

// Update booking status
export const updateBookingStatus = async (
  id: string, 
  statusData: UpdateBookingStatusRequest
): Promise<UpdateBookingStatusResponse> => {
  try {
    if (isDemoBookingId(id)) {
      const response = await updateDemoBookingStatus(id, statusData);
      await scheduleThreeHourBookingReminder(response.data.booking, 'companion');
      return response;
    }

    const token = await getAuthToken();
    
    const url = apiUrl(`/api/bookings/${id}/status`);
    
    // logger.log("Updating booking status:", url, statusData);
    
    const response = await axios.put(url, statusData, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    });

    // logger.log("Update booking status response:", response.data);
    
    await scheduleThreeHourBookingReminder(response.data.data.booking, 'companion');

    return response.data;
  } catch (error) {
    handleApiError(error);
    if (isUnauthorizedError(error)) {
      throw new Error("Please log in again to update this booking.");
    }

    logger.error("Error updating booking status:", error instanceof Error ? error.message : error);
    
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          "Failed to update booking status";
      logger.warn("API Error Details:", {
        status: error.response?.status,
        data: error.response?.data,
        message: errorMessage
      });
      throw new Error(errorMessage);
    }
    
    throw new Error("Network error occurred while updating booking status");
  }
};

// React Query Hooks

// Hook for creating a booking
export const useCreateBooking = () => {
  const queryClient = useQueryClient();
  
  // logger.log('=== useCreateBooking hook initialized ===');
  
  return useMutation({
    mutationKey: ['createBooking'],
    mutationFn: async (bookingData: CreateBookingRequest) => {
      logger.log('🚀 [API Call Start] createBooking mutation triggered'  , {
        timestamp: new Date().toISOString(),
        bookingData: {
          companionId: bookingData.companionId,
          serviceId: bookingData.serviceId,
          date: bookingData.date,
          startTime: bookingData.startTime,
          duration: bookingData.duration
        }
      });
      
      const token = await getAuthToken();
      
      const url = apiUrl('/api/bookings');
      
      // Validate required fields
      if (!bookingData.companionId || !bookingData.date || !bookingData.startTime || !bookingData.duration) {
        // console.error('❌ Validation failed: Missing required booking fields'); 
        throw new Error('Missing required booking fields');
      }

      // Clean up optional arrays to prevent sending empty arrays
      const cleanedData = {
        ...bookingData,
        preferredLanguages: bookingData.preferredLanguages?.length ? bookingData.preferredLanguages : undefined,
        dietaryRestrictions: bookingData.dietaryRestrictions?.length ? bookingData.dietaryRestrictions : undefined,
        accessibilityNeeds: bookingData.accessibilityNeeds?.length ? bookingData.accessibilityNeeds : undefined
      };
      
      logger.log("📤 Sending API request:", {
        url,
        method: 'POST',
        timestamp: new Date().toISOString(),
        data: cleanedData
      });
      
      let response;
      try {
        response = await axios.post(url, cleanedData, {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
          },
        });
      } catch (error) {
        if (axios.isAxiosError(error) && isDemoPreviewBookingRequest(bookingData)) {
          logger.warn('[Booking] Live booking endpoint unavailable for explicit demo booking; using local review fallback.', {
            status: error.response?.status,
            serviceId: bookingData.serviceId,
            companionId: bookingData.companionId,
          });
          return await createAndStoreDemoBookingResponse(bookingData);
        }
        throw error;
      }

      logger.log("📥 API Response received:", {
        timestamp: new Date().toISOString(),
        status: response.status,
        data: response.data,
        success: response.data?.success,
        bookingId: response.data?.data?.booking?.id
      });

      // Validate response format
      if (!response.data?.success || !response.data?.data?.booking?.id) {
        console.error("❌ Invalid API response format:", {
          timestamp: new Date().toISOString(),
          response: response.data
        });
        throw new Error('Invalid API response format');
      }
      
      await showBookingCreatedNotification(response.data.data.booking, 'traveler');
      await scheduleThreeHourBookingReminder(response.data.data.booking, 'traveler');

      return response.data;
    },
    onSuccess: (data) => {
      logger.log("✅ Mutation succeeded:", {
        timestamp: new Date().toISOString(),
        success: data.success,
        bookingId: data.data?.booking?.id
      });
      // Invalidate and refetch bookings list
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error: Error) => {
      console.error("❌ Mutation failed:", {
        timestamp: new Date().toISOString(),
        error: error.message
      });
      throw error; // Re-throw to be caught by the component
    },
  });
};

// Hook for fetching bookings list
export const useBookingsQuery = (params: BookingsQueryParams = {}, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['bookings', params],
    queryFn: () => fetchBookings(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true, // Refetch when user returns to app
    enabled: options?.enabled !== false, // Default to true, allow override
    retry: (failureCount: number, error: Error) => {
      // Don't retry on authentication errors
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        return false;
      }
      // Retry up to 3 times for other errors
      return failureCount < 3;
    },
  });
};

// Hook for fetching booking details
export const useBookingQuery = (id: string) => {
  return useQuery({
    queryKey: ['booking', id],
    queryFn: () => fetchBookingById(id),
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 3 * 60 * 1000, // 3 minutes
    refetchOnWindowFocus: true,
    enabled: !!id, // Only run query if ID is provided
    retry: (failureCount: number, error: Error) => {
      // Don't retry on authentication errors or 404s
      if (error.message.includes('401') || error.message.includes('404') || error.message.includes('Unauthorized')) {
        return false;
      }
      // Retry up to 2 times for other errors
      return failureCount < 2;
    },
  });
};

// Hook for updating booking status
export const useUpdateBookingStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, statusData }: { id: string; statusData: UpdateBookingStatusRequest }) =>
      updateBookingStatus(id, statusData),
    onSuccess: (data, variables) => {
      // Invalidate and refetch bookings list
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      // Invalidate and refetch specific booking details
      queryClient.invalidateQueries({ queryKey: ['booking', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      logger.log("Booking status updated successfully:", data.data.booking.status);
    },
    onError: (error: Error) => {
      logger.warn("Failed to update booking status:", error.message);
    },
  });
};

// Convenience hooks for specific booking statuses
export const usePendingBookings = () => {
  return useBookingsQuery({ status: 'pending' });
};

export const useConfirmedBookings = () => {
  return useBookingsQuery({ status: 'confirmed' });
};

export const useCompletedBookings = () => {
  return useBookingsQuery({ status: 'completed' });
};

export const useCancelledBookings = () => {
  return useBookingsQuery({ status: 'cancelled' });
};

// Hook for bookings with pagination
export const useBookingsWithPagination = (page: number = 1, limit: number = 10, status?: BookingStatus) => {
  return useBookingsQuery({ page, limit, status });
};

// Convenience functions for direct API calls (without React Query)
export const getBookingDetails = (id: string) => {
  return fetchBookingById(id);
};

export const getUserBookings = (params: BookingsQueryParams = {}) => {
  return fetchBookings(params);
};

export const createNewBooking = (bookingData: CreateBookingRequest) => {
  return createBooking(bookingData);
};

export const changeBookingStatus = (id: string, statusData: UpdateBookingStatusRequest) => {
  return updateBookingStatus(id, statusData);
};
