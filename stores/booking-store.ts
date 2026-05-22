import { logger } from '@/utils/logger';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createBooking, CreateBookingRequest } from '../app/api/booking/booking';
import { apiUrl } from '@/constants/api';
import { convertCurrency } from '@/utils/currency';
import axios from 'axios';

// Booking form data interfaces
export interface BookingService {
  id: string;
  name: string;
  description: string;
  price: number;
  currency?: string;
  duration: number;
  category: string;
  customizations?: {
    groupSize?: number;
    addOns?: string[];
    specialRequirements?: string[];
  };
}

export interface CompanionData {
  id: string;
  name: string;
  image: string;
  location: string;
  rating: number;
  languages: string[];
  about?: string;
  specialties?: string[];
  reviews?: number; // Number of reviews
}

export interface BookingDateTime {
  date: string;
  time: string;
  duration: number;
  endTime: string;
  isAvailable: boolean;
}

export interface BookingLocation {
  area: string;
  meetingPoint: string;
  address?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  estimatedDistance?: number;
  travelTime?: number;
}

export interface BookingRequests {
  specialRequests: string;
  dietaryRestrictions: string[];
  accessibilityNeeds: string[];
  languagePreference: string;
  groupComposition: string;
}

export interface BookingPayment {
  method: 'cash' | 'promptpay' | 'bank_transfer';
  amount: number;
  serviceFee: number;
  totalAmount: number;
  currency: 'THB';
  terms: boolean;
}

export interface BookingFormData {
  companionId: string;
  companionData: CompanionData | null;
  service: BookingService | null;
  dateTime: BookingDateTime | null;
  location: BookingLocation | null;
  requests: BookingRequests;
  payment: BookingPayment | null;
  currentStep: number;
  isComplete: boolean;
  errors: Record<string, string>;
}

// Initial state
const initialBookingData: BookingFormData = {
  companionId: '',
  companionData: null,
  service: null,
  dateTime: null,
  location: null,
  requests: {
    specialRequests: '',
    dietaryRestrictions: [],
    accessibilityNeeds: [],
    languagePreference: 'English',
    groupComposition: '',
  },
  payment: null,
  currentStep: 1,
  isComplete: false,
  errors: {},
};

// Add new interface for service fetching
interface ServiceResponse {
  success: boolean;
  data: {
    services: BookingService[];
  };
}

// Store interface
interface BookingState {
  bookingData: BookingFormData;
  isLoading: boolean;
  error: string | null;
  services: BookingService[]; // Add this
}

interface BookingActions {
  // Step navigation
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  
  // Data updates
  updateService: (service: BookingService) => void;
  updateDateTime: (dateTime: BookingDateTime) => void;
  updateLocation: (location: BookingLocation) => void;
  updateRequests: (requests: Partial<BookingRequests>) => void;
  updatePayment: (payment: BookingPayment) => void;
  
  // Form management
  setCompanionId: (companionId: string) => void;
  setError: (field: string, error: string) => void;
  clearError: (field: string) => void;
  clearAllErrors: () => void;
  validateStep: (step: number) => boolean;
  
  // Booking lifecycle
  submitBooking: () => Promise<CreateBookingRequest | null>; // Updated return type
  resetBooking: () => void;
  
  // Utility
  calculateTotal: () => number;
  isStepValid: (step: number) => boolean;
  
  // Add new actions
  fetchServices: (companionId: string) => Promise<void>;
  setCompanionData: (companionData: CompanionData) => void;
  prepareBookingRequest: () => CreateBookingRequest | null;
  setBookingComplete: (isComplete: boolean) => void;
}

export const useBookingStore = create<BookingState & BookingActions>()(
  persist(
    (set, get) => ({
      bookingData: initialBookingData,
      isLoading: false,
      error: null,
      services: [], // Initialize services array

      // Step navigation
      nextStep: () => {
        const { bookingData } = get();
        if (bookingData.currentStep < 7) {
          set((state) => ({
            bookingData: {
              ...state.bookingData,
              currentStep: state.bookingData.currentStep + 1,
            },
          }));
        }
      },

      prevStep: () => {
        const { bookingData } = get();
        if (bookingData.currentStep > 1) {
          set((state) => ({
            bookingData: {
              ...state.bookingData,
              currentStep: state.bookingData.currentStep - 1,
            },
          }));
        }
      },

      goToStep: (step: number) => {
        if (step >= 1 && step <= 7) {
          set((state) => ({
            bookingData: {
              ...state.bookingData,
              currentStep: step,
            },
          }));
        }
      },

      // Data updates
      updateService: (service: BookingService) => {
        set((state) => ({
          bookingData: {
            ...state.bookingData,
            service,
          },
        }));
      },

      updateDateTime: (dateTime: BookingDateTime) => {
        set((state) => ({
          bookingData: {
            ...state.bookingData,
            dateTime,
          },
        }));
      },

      updateLocation: (location: BookingLocation) => {
        set((state) => ({
          bookingData: {
            ...state.bookingData,
            location,
          },
        }));
      },

      updateRequests: (requests: Partial<BookingRequests>) => {
        set((state) => ({
          bookingData: {
            ...state.bookingData,
            requests: {
              ...state.bookingData.requests,
              ...requests,
            },
          },
        }));
      },

      updatePayment: (payment: BookingPayment) => {
        set((state) => ({
          bookingData: {
            ...state.bookingData,
            payment,
          },
        }));
      },

      // Form management
      setCompanionId: (companionId: string) => {
        set((state) => ({
          bookingData: {
            ...state.bookingData,
            companionId,
          },
        }));
      },

      setError: (field: string, error: string) => {
        set((state) => ({
          bookingData: {
            ...state.bookingData,
            errors: {
              ...state.bookingData.errors,
              [field]: error,
            },
          },
        }));
      },

      clearError: (field: string) => {
        set((state) => ({
          bookingData: {
            ...state.bookingData,
            errors: {
              ...state.bookingData.errors,
              [field]: '',
            },
          },
        }));
      },

      clearAllErrors: () => {
        set((state) => ({
          bookingData: {
            ...state.bookingData,
            errors: {},
          },
        }));
      },

      validateStep: (step: number): boolean => {
        // logger.log('Validating step', step);
        const { bookingData } = get();
        const { setError, clearError } = get();
        
        clearError(`step${step}`);
        
        switch (step) {
          case 1: // Service selection
            if (!bookingData.service) {
              setError(`step${step}`, 'Please select a service');
              return false;
            }
            return true;
            
          case 2: // Date & Time
            if (!bookingData.dateTime) {
              setError(`step${step}`, 'Please select date and time');
              return false;
            }
            return true;
            
          case 3: // Location
            if (!bookingData.location) {
              setError(`step${step}`, 'Please select location and meeting point');
              return false;
            }
            return true;
            
          case 4: // Special requests (optional)
            return true;
            
          case 5: // Summary (validation)
            return !!bookingData.service && !!bookingData.dateTime && !!bookingData.location && !!bookingData.payment;
            
          case 6: // Payment
            if (!bookingData.payment) {
              setError(`step${step}`, 'Please select payment method');
              return false;
            }
            return true;
            
          case 7: // Confirmation
            return true;
            
          default:
            return false;
        }
      },

      isStepValid: (step: number) => {
        const { validateStep } = get();
        return validateStep(step);
      },

      calculateTotal: () => {
        const { bookingData } = get();
        if (!bookingData.service) return 0;

        return Math.round(convertCurrency(bookingData.service.price, bookingData.service.currency, 'THB'));
      },

      fetchServices: async (companionId: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await axios.get<ServiceResponse>(apiUrl(`/api/companions/${companionId}/services`));
          set({ services: response.data.data.services, isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch services',
            isLoading: false 
          });
        }
      },

      submitBooking: async () => {
        set({ isLoading: true, error: null });
        
        try {
          const { bookingData } = get();
          
          logger.log("Preparing booking submission with data:", {
            companionId: bookingData.companionId,
            serviceId: bookingData?.service?.id,
            date: bookingData?.dateTime?.date,
            startTime: bookingData?.dateTime?.time,
            duration: bookingData?.dateTime?.duration,
            location: bookingData?.location?.area,
          });

          // Validate all required fields
          if (!bookingData.service || !bookingData.dateTime || !bookingData.location) {
            console.error("Missing required fields:", {
              hasService: !!bookingData.service,
              hasDateTime: !!bookingData.dateTime,
              hasLocation: !!bookingData.location
            });
            throw new Error('Missing required booking information');
          }

          // // Validate UUID format
          // const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
          // if (!uuidRegex.test(bookingData.companionId)) {
          //   throw new Error('Invalid companion ID format');
          // }
          // if (!uuidRegex.test(bookingData.service.id)) {
          //   throw new Error('Invalid service ID format');
          // }

          // Ensure minimum duration of 30 minutes
          const durationInMinutes = bookingData.dateTime.duration * 60; // Convert hours to minutes
          if (durationInMinutes < 30) {
            throw new Error('Booking duration must be at least 30 minutes');
          }

          // Prepare booking request data
          const bookingRequest: CreateBookingRequest = {
            companionId: bookingData.companionId,
            serviceId: bookingData.service.id,
            date: bookingData.dateTime.date,
            startTime: bookingData.dateTime.time,
            endTime: bookingData.dateTime.endTime,
            duration: durationInMinutes, // Send duration in minutes
            location: bookingData.location.area,
            meetingPoint: bookingData.location.meetingPoint,
            specialRequests: bookingData.requests.specialRequests,
            dietaryRestrictions: bookingData.requests.dietaryRestrictions,
            accessibilityNeeds: bookingData.requests.accessibilityNeeds,
            preferredLanguages: [bookingData.requests.languagePreference]
          };

          logger.log("Prepared booking request:", bookingRequest);
          set({ isLoading: false });
          return bookingRequest;
          
        } catch (error) {
          console.error("Error preparing booking request:", error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to prepare booking request',
            isLoading: false 
          });
          return null;
        }
      },

      resetBooking: () => {
        set({
          bookingData: initialBookingData,
          isLoading: false,
          error: null,
        });
      },

      setCompanionData: (companionData: CompanionData) => {
        set((state) => ({
          bookingData: {
            ...state.bookingData,
            companionData,
            companionId: companionData.id,
          },
        }));
      },

      prepareBookingRequest: (): CreateBookingRequest | null => {
        const { bookingData } = get();
        
        try {
          // Validate all required fields
          if (!bookingData.service || !bookingData.dateTime || !bookingData.location) {
            console.error("Missing required fields:", {
              hasService: !!bookingData.service,
              hasDateTime: !!bookingData.dateTime,
              hasLocation: !!bookingData.location
            });
            throw new Error('Missing required booking information');
          }

          // // Validate UUID format
          // const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
          // if (!uuidRegex.test(bookingData.companionId)) {
          //   throw new Error('Invalid companion ID format');
          // }
          // if (!uuidRegex.test(bookingData.service.id)) {
          //   throw new Error('Invalid service ID format');
          // }

          // Ensure minimum duration of 30 minutes
          const durationInMinutes = bookingData.dateTime.duration * 60; // Convert hours to minutes
          if (durationInMinutes < 30) {
            throw new Error('Booking duration must be at least 30 minutes');
          }

          // Prepare booking request data
          return {
            companionId: bookingData.companionId,
            serviceId: bookingData.service.id,
            date: bookingData.dateTime.date,
            startTime: bookingData.dateTime.time,
            endTime: bookingData.dateTime.endTime,
            duration: durationInMinutes, // Send duration in minutes
            location: bookingData.location.area,
            meetingPoint: bookingData.location.meetingPoint,
            specialRequests: bookingData.requests.specialRequests,
            dietaryRestrictions: bookingData.requests.dietaryRestrictions,
            accessibilityNeeds: bookingData.requests.accessibilityNeeds,
            preferredLanguages: [bookingData.requests.languagePreference],
          };
        } catch (error) {
          console.error("Error preparing booking request:", error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to prepare booking request',
            isLoading: false 
          });
          return null;
        }
      },

      setBookingComplete: (isComplete: boolean) => {
        set((state) => ({
          bookingData: {
            ...state.bookingData,
            isComplete,
          },
        }));
      },
    }),
    {
      name: 'booking-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        bookingData: state.bookingData,
      }),
    }
  )
);
