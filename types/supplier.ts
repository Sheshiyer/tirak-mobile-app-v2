export type SupplierStatus = 'pending' | 'approved' | 'rejected';

export interface SupplierProfile {
  id: string;
  userId: string;
  displayName: string;
  bio: string;
  profileImage: string;
  coverImages: string[];
  categories: string[];
  services: Service[];
  regions: string[];
  languages: string[];
  availability: Availability;
  rating: number;
  reviewCount: number;
  status: SupplierStatus;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number; // in hours
  isActive: boolean;
}

export interface Availability {
  weeklySchedule: WeeklySchedule;
  exceptions: DateException[];
}

export interface WeeklySchedule {
  monday: TimeSlot[];
  tuesday: TimeSlot[];
  wednesday: TimeSlot[];
  thursday: TimeSlot[];
  friday: TimeSlot[];
  saturday: TimeSlot[];
  sunday: TimeSlot[];
}

export interface TimeSlot {
  start: string; // HH:MM format
  end: string; // HH:MM format
}

export interface DateException {
  date: string; // YYYY-MM-DD
  isAvailable: boolean;
  timeSlots?: TimeSlot[];
}

export interface SupplierStats {
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalEarnings: number;
  thisMonthEarnings: number;
  averageRating: number;
  profileViews: number;
}

export interface SupplierSignupData {
  step: number;
  basicInfo: {
    firstName: string;
    lastName: string;
    displayName: string;
    phone: string;
    email: string;
    bio: string;
  };
  idVerification: {
    idCardFront: string | null;
    idCardBack: string | null;
    selfieWithId: string | null;
  };
  photos: string[];
  categories: string[];
  services: Service[];
  regions: string[];
  availability: Availability;
  subscription: {
    plan: 'basic' | 'premium' | 'pro';
    paymentMethod: 'promptpay' | 'credit_card' | 'bank_transfer';
    paymentComplete: boolean;
  };
}