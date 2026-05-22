import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SupplierProfile, SupplierSignupData, SupplierStats } from '@/types/supplier';

interface SupplierState {
  isSupplier: boolean;
  profile: SupplierProfile | null;
  stats: SupplierStats | null;
  signupData: SupplierSignupData;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setIsSupplier: (isSupplier: boolean) => void;
  setProfile: (profile: SupplierProfile | null) => void;
  setStats: (stats: SupplierStats | null) => void;
  updateSignupData: (data: Partial<SupplierSignupData>) => void;
  resetSignupData: () => void;
  nextSignupStep: () => void;
  prevSignupStep: () => void;
  
  // Local signup/profile actions
  fetchProfile: () => Promise<void>;
  fetchStats: () => Promise<void>;
  submitSignup: () => Promise<boolean>;
  updateProfile: (data: Partial<SupplierProfile>) => Promise<boolean>;
  addService: (service: Omit<SupplierProfile['services'][0], 'id'>) => Promise<boolean>;
  updateService: (serviceId: string, data: Partial<SupplierProfile['services'][0]>) => Promise<boolean>;
  deleteService: (serviceId: string) => Promise<boolean>;
  updateAvailability: (availability: SupplierProfile['availability']) => Promise<boolean>;
}

const initialSignupData: SupplierSignupData = {
  step: 1,
  basicInfo: {
    firstName: '',
    lastName: '',
    displayName: '',
    phone: '',
    email: '',
    bio: '',
  },
  idVerification: {
    idCardFront: null,
    idCardBack: null,
    selfieWithId: null,
  },
  photos: [],
  categories: [],
  services: [],
  regions: [],
  availability: {
    weeklySchedule: {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: [],
    },
    exceptions: [],
  },
  subscription: {
    plan: 'basic',
    paymentMethod: 'promptpay',
    paymentComplete: false,
  },
};

const emptySupplierStats: SupplierStats = {
  totalBookings: 0,
  completedBookings: 0,
  cancelledBookings: 0,
  totalEarnings: 0,
  thisMonthEarnings: 0,
  averageRating: 0,
  profileViews: 0,
};

const buildProfileFromSignup = (signupData: SupplierSignupData): SupplierProfile => {
  const now = new Date().toISOString();
  return {
    id: `local-supplier-${Date.now()}`,
    userId: `local-user-${Date.now()}`,
    displayName: signupData.basicInfo.displayName || [signupData.basicInfo.firstName, signupData.basicInfo.lastName].filter(Boolean).join(' ') || 'Local Guide',
    bio: signupData.basicInfo.bio,
    profileImage: signupData.photos[0] || '',
    coverImages: signupData.photos,
    categories: signupData.categories,
    services: signupData.services,
    regions: signupData.regions,
    languages: [],
    availability: signupData.availability,
    rating: 0,
    reviewCount: 0,
    status: 'pending',
    verificationStatus: 'pending',
    createdAt: now,
    updatedAt: now,
  };
};

export const useSupplierStore = create<SupplierState>()(
  persist(
    (set, get) => ({
      isSupplier: false,
      profile: null,
      stats: null,
      signupData: initialSignupData,
      isLoading: false,
      error: null,
      
      setIsSupplier: (isSupplier) => set({ isSupplier }),
      setProfile: (profile) => set({ profile }),
      setStats: (stats) => set({ stats }),
      
      updateSignupData: (data) => set((state) => ({
        signupData: { ...state.signupData, ...data }
      })),
      
      resetSignupData: () => set({ signupData: initialSignupData }),
      
      nextSignupStep: () => set((state) => ({
        signupData: {
          ...state.signupData,
          step: Math.min(state.signupData.step + 1, 8)
        }
      })),
      
      prevSignupStep: () => set((state) => ({
        signupData: {
          ...state.signupData,
          step: Math.max(state.signupData.step - 1, 1)
        }
      })),
      
      fetchProfile: async () => {
        set({ isLoading: true, error: null });
        try {
          set({ profile: get().profile, isLoading: false });
        } catch (error) {
          set({ error: 'Failed to fetch profile', isLoading: false });
        }
      },
      
      fetchStats: async () => {
        set({ isLoading: true, error: null });
        try {
          set({ stats: get().stats || emptySupplierStats, isLoading: false });
        } catch (error) {
          set({ error: 'Failed to fetch stats', isLoading: false });
        }
      },
      
      submitSignup: async () => {
        set({ isLoading: true, error: null });
        try {
          set({ 
            isSupplier: true,
            profile: buildProfileFromSignup(get().signupData),
            stats: emptySupplierStats,
            isLoading: false,
            signupData: initialSignupData
          });
          return true;
        } catch (error) {
          set({ error: 'Failed to submit signup', isLoading: false });
          return false;
        }
      },
      
      updateProfile: async (data) => {
        set({ isLoading: true, error: null });
        try {
          set((state) => ({
            profile: state.profile ? { ...state.profile, ...data } : null,
            isLoading: false
          }));
          return true;
        } catch (error) {
          set({ error: 'Failed to update profile', isLoading: false });
          return false;
        }
      },
      
      addService: async (service) => {
        set({ isLoading: true, error: null });
        try {
          const newService = {
            ...service,
            id: `serv-${Date.now()}`,
          };
          set((state) => ({
            profile: state.profile 
              ? { 
                  ...state.profile, 
                  services: [...state.profile.services, newService] 
                } 
              : null,
            isLoading: false
          }));
          return true;
        } catch (error) {
          set({ error: 'Failed to add service', isLoading: false });
          return false;
        }
      },
      
      updateService: async (serviceId, data) => {
        set({ isLoading: true, error: null });
        try {
          set((state) => {
            if (!state.profile) return { isLoading: false };
            
            const updatedServices = state.profile.services.map(service => 
              service.id === serviceId ? { ...service, ...data } : service
            );
            
            return {
              profile: { ...state.profile, services: updatedServices },
              isLoading: false
            };
          });
          return true;
        } catch (error) {
          set({ error: 'Failed to update service', isLoading: false });
          return false;
        }
      },
      
      deleteService: async (serviceId) => {
        set({ isLoading: true, error: null });
        try {
          set((state) => {
            if (!state.profile) return { isLoading: false };
            
            const updatedServices = state.profile.services.filter(
              service => service.id !== serviceId
            );
            
            return {
              profile: { ...state.profile, services: updatedServices },
              isLoading: false
            };
          });
          return true;
        } catch (error) {
          set({ error: 'Failed to delete service', isLoading: false });
          return false;
        }
      },
      
      updateAvailability: async (availability) => {
        set({ isLoading: true, error: null });
        try {
          set((state) => ({
            profile: state.profile 
              ? { ...state.profile, availability } 
              : null,
            isLoading: false
          }));
          return true;
        } catch (error) {
          set({ error: 'Failed to update availability', isLoading: false });
          return false;
        }
      },
    }),
    {
      name: 'supplier-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        isSupplier: state.isSupplier,
        profile: state.profile,
      }),
    }
  )
);
