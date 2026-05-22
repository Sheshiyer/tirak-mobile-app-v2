import { SupplierProfile, SupplierStats } from '@/types/supplier';

export const mockSupplierProfile: SupplierProfile = {
  id: 'sup-001',
  userId: 'user-001',
  displayName: 'Somchai Guide',
  bio: 'Professional tour guide with 5 years of experience in Bangkok and surrounding areas. Fluent in Thai, English, and Chinese.',
  profileImage: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
  coverImages: [
    'https://images.unsplash.com/photo-1528181304800-259b08848526?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
    'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
    'https://images.unsplash.com/photo-1552550018-5253c1b171e1?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
  ],
  categories: ['Travel', 'Explorer', 'Evening Activities'],
  services: [
    {
      id: 'serv-001',
      name: 'Bangkok City Tour',
      description: 'Full day tour of Bangkok including Grand Palace, Wat Pho, and river cruise.',
      price: 2500,
      duration: 8,
      isActive: true,
    },
    {
      id: 'serv-002',
      name: 'Evening Bar Tour',
      description: 'Evening tour of Bangkok bar scene, rooftop venues, and night markets.',
      price: 1800,
      duration: 5,
      isActive: true,
    },
    {
      id: 'serv-003',
      name: 'Ayutthaya Day Trip',
      description: 'Full day trip to the ancient city of Ayutthaya with transportation included.',
      price: 3200,
      duration: 10,
      isActive: true,
    },
  ],
  regions: ['Bangkok', 'Ayutthaya', 'Pattaya'],
  languages: ['Thai', 'English', 'Chinese'],
  availability: {
    weeklySchedule: {
      monday: [{ start: '09:00', end: '17:00' }],
      tuesday: [{ start: '09:00', end: '17:00' }],
      wednesday: [{ start: '09:00', end: '17:00' }],
      thursday: [{ start: '09:00', end: '17:00' }],
      friday: [{ start: '09:00', end: '17:00' }],
      saturday: [{ start: '10:00', end: '18:00' }],
      sunday: [],
    },
    exceptions: [
      {
        date: '2025-06-15',
        isAvailable: false,
      },
      {
        date: '2025-06-20',
        isAvailable: true,
        timeSlots: [{ start: '13:00', end: '20:00' }],
      },
    ],
  },
  rating: 4.8,
  reviewCount: 124,
  status: 'approved',
  verificationStatus: 'verified',
  createdAt: '2024-01-15T08:30:00Z',
  updatedAt: '2025-05-20T14:45:00Z',
};

export const mockSupplierStats: SupplierStats = {
  totalBookings: 156,
  completedBookings: 142,
  cancelledBookings: 14,
  totalEarnings: 324500,
  thisMonthEarnings: 42800,
  averageRating: 4.8,
  profileViews: 1245,
};

export const mockCategories = [
  { id: 'cat-001', name: 'Travel', icon: '✈️' },
  { id: 'cat-002', name: 'Evening Activities', icon: '🌃' },
  { id: 'cat-003', name: 'Cinema', icon: '🎬' },
  { id: 'cat-004', name: 'Holiday', icon: '🏖' },
  { id: 'cat-005', name: 'Wellness', icon: '🧖' },
  { id: 'cat-006', name: 'Explorer', icon: '🏙' },
  { id: 'cat-007', name: 'Luxury Experience', icon: '⭐' },
  { id: 'cat-008', name: 'Events', icon: '🎉' },
  { id: 'cat-009', name: 'Sports', icon: '🏋' },
];

export const mockRegions = [
  { id: 'reg-001', name: 'Bangkok' },
  { id: 'reg-002', name: 'Chiang Mai' },
  { id: 'reg-003', name: 'Phuket' },
  { id: 'reg-004', name: 'Pattaya' },
  { id: 'reg-005', name: 'Krabi' },
  { id: 'reg-006', name: 'Koh Samui' },
  { id: 'reg-007', name: 'Ayutthaya' },
  { id: 'reg-008', name: 'Hua Hin' },
  { id: 'reg-009', name: 'Koh Phi Phi' },
];

// Recent Activity Data for Supplier Dashboard
export interface SupplierActivity {
  id: string;
  type: 'booking_request' | 'booking_confirmed' | 'booking_completed' | 'review_received' | 'profile_view' | 'message_received' | 'payment_received';
  title: string;
  description: string;
  customerName?: string;
  customerImage?: string;
  serviceName?: string;
  amount?: number;
  rating?: number;
  timestamp: string;
  status?: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  actionRequired?: boolean;
  bookingId?: string;
  messageId?: string;
}

export const mockSupplierActivities: SupplierActivity[] = [
  {
    id: 'activity-001',
    type: 'booking_request',
    title: 'New Booking Request',
    description: 'Bangkok City Tour for Dec 22, 2024',
    customerName: 'Emma Wilson',
    customerImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1000&auto=format&fit=crop',
    serviceName: 'Bangkok City Tour',
    amount: 2500,
    timestamp: '2024-12-20T10:30:00Z',
    status: 'pending',
    actionRequired: true,
    bookingId: 'booking-new-001',
  },
  {
    id: 'activity-002',
    type: 'review_received',
    title: 'New 5-Star Review',
    description: 'Amazing tour guide! Very knowledgeable about Thai culture.',
    customerName: 'James Chen',
    customerImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=1000&auto=format&fit=crop',
    serviceName: 'Ayutthaya Day Trip',
    rating: 5,
    timestamp: '2024-12-20T08:15:00Z',
    bookingId: 'booking-completed-001',
  },
  {
    id: 'activity-003',
    type: 'payment_received',
    title: 'Payment Received',
    description: 'Payment for Evening Bar Tour service',
    customerName: 'Sarah Johnson',
    customerImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=1000&auto=format&fit=crop',
    serviceName: 'Evening Bar Tour',
    amount: 1530, // After commission
    timestamp: '2024-12-19T22:45:00Z',
    bookingId: 'booking-payment-001',
  },
  {
    id: 'activity-004',
    type: 'booking_confirmed',
    title: 'Booking Confirmed',
    description: 'Temple & Culture Tour confirmed for Dec 21, 2024',
    customerName: 'Michael Brown',
    customerImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1000&auto=format&fit=crop',
    serviceName: 'Temple & Culture Tour',
    amount: 2800,
    timestamp: '2024-12-19T16:20:00Z',
    status: 'confirmed',
    bookingId: 'booking-confirmed-001',
  },
  {
    id: 'activity-005',
    type: 'message_received',
    title: 'New Message',
    description: 'Question about meeting location for tomorrow\'s tour',
    customerName: 'Lisa Wang',
    customerImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1000&auto=format&fit=crop',
    timestamp: '2024-12-19T14:10:00Z',
    actionRequired: true,
    messageId: 'msg-new-001',
  },
  {
    id: 'activity-006',
    type: 'profile_view',
    title: 'Profile Views',
    description: '12 new profile views today',
    timestamp: '2024-12-19T12:00:00Z',
  },
  {
    id: 'activity-007',
    type: 'booking_completed',
    title: 'Tour Completed',
    description: 'Street Food Adventure completed successfully',
    customerName: 'David Kim',
    customerImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1000&auto=format&fit=crop',
    serviceName: 'Street Food Adventure',
    amount: 2200,
    timestamp: '2024-12-18T20:30:00Z',
    status: 'completed',
    bookingId: 'booking-completed-002',
  },
  {
    id: 'activity-008',
    type: 'review_received',
    title: 'New 4-Star Review',
    description: 'Great experience! Would recommend to friends.',
    customerName: 'Anna Martinez',
    customerImage: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?q=80&w=1000&auto=format&fit=crop',
    serviceName: 'Bangkok City Tour',
    rating: 4,
    timestamp: '2024-12-18T18:45:00Z',
    bookingId: 'booking-review-001',
  },
];

// Earnings Chart Data for Supplier Dashboard
export interface EarningsData {
  month: string;
  earnings: number;
  bookings: number;
  averageBookingValue: number;
}

export interface ServicePerformance {
  serviceName: string;
  earnings: number;
  bookings: number;
  averageRating: number;
  color: string;
}

export const mockEarningsData: EarningsData[] = [
  {
    month: 'Jul 2024',
    earnings: 28500,
    bookings: 18,
    averageBookingValue: 1583,
  },
  {
    month: 'Aug 2024',
    earnings: 35200,
    bookings: 22,
    averageBookingValue: 1600,
  },
  {
    month: 'Sep 2024',
    earnings: 41800,
    bookings: 26,
    averageBookingValue: 1608,
  },
  {
    month: 'Oct 2024',
    earnings: 38900,
    bookings: 24,
    averageBookingValue: 1621,
  },
  {
    month: 'Nov 2024',
    earnings: 45600,
    bookings: 28,
    averageBookingValue: 1629,
  },
  {
    month: 'Dec 2024',
    earnings: 42800,
    bookings: 25,
    averageBookingValue: 1712,
  },
];

export const mockServicePerformance: ServicePerformance[] = [
  {
    serviceName: 'Bangkok City Tour',
    earnings: 125000,
    bookings: 50,
    averageRating: 4.8,
    color: '#9B4DFF',
  },
  {
    serviceName: 'Evening Bar Tour',
    earnings: 98000,
    bookings: 55,
    averageRating: 4.7,
    color: '#FF9A7B',
  },
  {
    serviceName: 'Ayutthaya Day Trip',
    earnings: 101500,
    bookings: 32,
    averageRating: 4.9,
    color: '#4ECDC4',
  },
];

export const mockEarningsStats = {
  totalEarnings: 324500,
  thisMonthEarnings: 42800,
  lastMonthEarnings: 45600,
  monthlyGrowth: -6.1, // Percentage change from last month
  averageMonthlyEarnings: 38800,
  bestMonth: 'Nov 2024',
  bestMonthEarnings: 45600,
  totalBookings: 173,
  averageBookingValue: 1876,
};

// Performance Metrics Data for Supplier Dashboard
export interface PerformanceMetric {
  id: string;
  title: string;
  value: string | number;
  unit?: string;
  trend: 'up' | 'down' | 'neutral';
  trendValue: number;
  description: string;
  icon: string;
  color: string;
  benchmark?: string;
}

export const mockPerformanceMetrics: PerformanceMetric[] = [
  {
    id: 'response-time',
    title: 'Response Time',
    value: '2.3',
    unit: 'hours',
    trend: 'down', // Lower is better for response time
    trendValue: -15.2,
    description: 'Average time to respond to booking requests',
    icon: 'clock',
    color: '#4ECDC4',
    benchmark: 'Platform avg: 4.1h',
  },
  {
    id: 'acceptance-rate',
    title: 'Acceptance Rate',
    value: 94,
    unit: '%',
    trend: 'up',
    trendValue: 8.5,
    description: 'Percentage of booking requests accepted',
    icon: 'check-circle',
    color: '#9B4DFF',
    benchmark: 'Platform avg: 78%',
  },
  {
    id: 'customer-satisfaction',
    title: 'Customer Satisfaction',
    value: 4.8,
    unit: '/5',
    trend: 'up',
    trendValue: 2.1,
    description: 'Average rating from completed bookings',
    icon: 'star',
    color: '#FFB347',
    benchmark: 'Platform avg: 4.3',
  },
  {
    id: 'profile-completion',
    title: 'Profile Completion',
    value: 92,
    unit: '%',
    trend: 'neutral',
    trendValue: 0,
    description: 'Completeness of your supplier profile',
    icon: 'user',
    color: '#FF9A7B',
    benchmark: 'Recommended: 95%',
  },
];

// Supplier Notifications Data
export interface SupplierNotification {
  id: string;
  type: 'booking' | 'message' | 'payment' | 'review' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  urgent?: boolean;
  customerName?: string;
  customerImage?: string;
  actionRequired?: boolean;
}

export const mockSupplierNotifications: SupplierNotification[] = [
  {
    id: 'notif-001',
    type: 'booking',
    title: 'New Booking Request',
    message: 'Bangkok City Tour for Dec 22, 2024 at 2:00 PM',
    timestamp: '2024-12-20T11:30:00Z',
    read: false,
    urgent: true,
    customerName: 'Emma Wilson',
    customerImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1000&auto=format&fit=crop',
    actionRequired: true,
  },
  {
    id: 'notif-002',
    type: 'message',
    title: 'New Message',
    message: 'Question about meeting location for tomorrow\'s tour',
    timestamp: '2024-12-20T09:15:00Z',
    read: false,
    urgent: true,
    customerName: 'Michael Brown',
    customerImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1000&auto=format&fit=crop',
    actionRequired: true,
  },
  {
    id: 'notif-003',
    type: 'review',
    title: 'New 5-Star Review',
    message: 'Amazing tour guide! Very knowledgeable about Thai culture.',
    timestamp: '2024-12-20T08:45:00Z',
    read: false,
    customerName: 'Sarah Johnson',
    customerImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=1000&auto=format&fit=crop',
  },
  {
    id: 'notif-004',
    type: 'payment',
    title: 'Payment Received',
    message: 'Payment of ฿1,530 for Evening Bar Tour service',
    timestamp: '2024-12-19T22:30:00Z',
    read: true,
    customerName: 'James Chen',
    customerImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=1000&auto=format&fit=crop',
  },
  {
    id: 'notif-005',
    type: 'booking',
    title: 'Booking Confirmed',
    message: 'Temple & Culture Tour confirmed for Dec 21, 2024',
    timestamp: '2024-12-19T16:20:00Z',
    read: true,
    customerName: 'Lisa Wang',
    customerImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1000&auto=format&fit=crop',
  },
  {
    id: 'notif-006',
    type: 'system',
    title: 'Profile Performance Update',
    message: 'Your acceptance rate increased to 94% - great job!',
    timestamp: '2024-12-19T12:00:00Z',
    read: true,
  },
  {
    id: 'notif-007',
    type: 'message',
    title: 'Customer Inquiry',
    message: 'Interested in booking a custom food tour for next week',
    timestamp: '2024-12-18T14:30:00Z',
    read: true,
    customerName: 'David Kim',
    customerImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1000&auto=format&fit=crop',
    actionRequired: false,
  },
  {
    id: 'notif-008',
    type: 'payment',
    title: 'Monthly Earnings Summary',
    message: 'You earned ฿42,800 this month - 6.1% less than last month',
    timestamp: '2024-12-18T10:00:00Z',
    read: true,
  },
];