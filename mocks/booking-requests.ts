export interface BookingRequest {
  id: string;
  customerId: string;
  customerName: string;
  customerImage: string;
  customerRating: number;
  customerReviewCount: number;
  customerVerified: boolean;
  customerJoinDate: string;
  
  // Service Details
  serviceId: string;
  serviceName: string;
  serviceCategory: string;
  requestedDate: string;
  requestedTime: string;
  duration: number; // hours
  groupSize: number;
  
  // Location
  meetingLocation: string;
  meetingPoint: string;
  area: string;
  distance: number; // km
  travelTime: number; // minutes
  
  // Pricing
  basePrice: number;
  serviceFee: number;
  totalAmount: number;
  currency: 'THB';
  
  // Request Details
  specialRequests: string;
  languagePreference: string;
  dietaryRestrictions: string[];
  accessibilityNeeds: string[];
  groupComposition: string;
  
  // Status & Timing
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled';
  urgency: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  expiresAt: string;
  respondBy: string;
  
  // Communication
  hasMessages: boolean;
  lastMessageAt?: string;
  customerPhone?: string;
  
  // History
  isRepeatCustomer: boolean;
  previousBookings: number;
  lastBookingDate?: string;
  

  
  // Decline reason (if applicable)
  declineReason?: {
    category: string;
    message: string;
    declinedAt: string;
  };
}

export const mockBookingRequests: BookingRequest[] = [
  {
    id: 'req-001',
    customerId: 'cust-001',
    customerName: 'Emma Wilson',
    customerImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1000&auto=format&fit=crop',
    customerRating: 4.8,
    customerReviewCount: 23,
    customerVerified: true,
    customerJoinDate: '2023-08-15',
    
    serviceId: 'svc-001',
    serviceName: 'Bangkok City Tour',
    serviceCategory: 'Cultural Tours',
    requestedDate: '2024-12-22',
    requestedTime: '14:00',
    duration: 4,
    groupSize: 2,
    
    meetingLocation: 'Sukhumvit Area',
    meetingPoint: 'BTS Asok Station Exit 3',
    area: 'Sukhumvit',
    distance: 5.2,
    travelTime: 25,
    
    basePrice: 1500,
    serviceFee: 180,
    totalAmount: 1680,
    currency: 'THB',
    
    specialRequests: 'Would love to visit authentic local markets and try street food. We\'re interested in photography spots.',
    languagePreference: 'English',
    dietaryRestrictions: ['vegetarian'],
    accessibilityNeeds: [],
    groupComposition: 'Couple (25-30 years old)',
    
    status: 'pending',
    urgency: 'high',
    createdAt: '2024-12-20T11:30:00Z',
    expiresAt: '2024-12-21T11:30:00Z',
    respondBy: '2024-12-20T17:30:00Z',
    
    hasMessages: false,
    customerPhone: '+66 89 123 4567',
    
    isRepeatCustomer: false,
    previousBookings: 0,
  },
  
  {
    id: 'req-002',
    customerId: 'cust-002',
    customerName: 'Michael Brown',
    customerImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1000&auto=format&fit=crop',
    customerRating: 4.9,
    customerReviewCount: 45,
    customerVerified: true,
    customerJoinDate: '2023-03-10',
    
    serviceId: 'svc-002',
    serviceName: 'Thai Cooking Class',
    serviceCategory: 'Culinary Experiences',
    requestedDate: '2024-12-23',
    requestedTime: '10:00',
    duration: 3,
    groupSize: 1,
    
    meetingLocation: 'Silom Area',
    meetingPoint: 'Silom Complex Food Court',
    area: 'Silom',
    distance: 8.1,
    travelTime: 35,
    
    basePrice: 1200,
    serviceFee: 144,
    totalAmount: 1344,
    currency: 'THB',
    
    specialRequests: 'I have some cooking experience and would like to learn advanced techniques. Interested in traditional Thai desserts.',
    languagePreference: 'English',
    dietaryRestrictions: [],
    accessibilityNeeds: [],
    groupComposition: 'Solo traveler (35 years old)',
    
    status: 'pending',
    urgency: 'medium',
    createdAt: '2024-12-20T09:15:00Z',
    expiresAt: '2024-12-21T09:15:00Z',
    respondBy: '2024-12-20T15:15:00Z',
    
    hasMessages: true,
    lastMessageAt: '2024-12-20T10:30:00Z',
    customerPhone: '+66 92 456 7890',
    
    isRepeatCustomer: true,
    previousBookings: 2,
    lastBookingDate: '2024-10-15',
  },
  
  {
    id: 'req-003',
    customerId: 'cust-003',
    customerName: 'Sarah Johnson',
    customerImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=1000&auto=format&fit=crop',
    customerRating: 4.6,
    customerReviewCount: 12,
    customerVerified: false,
    customerJoinDate: '2024-09-20',
    
    serviceId: 'svc-003',
    serviceName: 'Temple & Culture Walk',
    serviceCategory: 'Cultural Tours',
    requestedDate: '2024-12-24',
    requestedTime: '08:00',
    duration: 5,
    groupSize: 4,
    
    meetingLocation: 'Old City',
    meetingPoint: 'Wat Pho Main Entrance',
    area: 'Rattanakosin',
    distance: 12.3,
    travelTime: 45,
    
    basePrice: 2000,
    serviceFee: 240,
    totalAmount: 2240,
    currency: 'THB',
    
    specialRequests: 'Family with two teenagers (14, 16). Looking for educational experience about Thai Buddhism and history.',
    languagePreference: 'English',
    dietaryRestrictions: ['halal'],
    accessibilityNeeds: ['wheelchair_accessible'],
    groupComposition: 'Family with teenagers',
    
    status: 'pending',
    urgency: 'urgent',
    createdAt: '2024-12-20T08:45:00Z',
    expiresAt: '2024-12-20T20:45:00Z',
    respondBy: '2024-12-20T14:45:00Z',
    
    hasMessages: false,
    customerPhone: '+66 81 789 0123',
    
    isRepeatCustomer: false,
    previousBookings: 0,
  },
  
  {
    id: 'req-004',
    customerId: 'cust-004',
    customerName: 'David Kim',
    customerImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=1000&auto=format&fit=crop',
    customerRating: 4.7,
    customerReviewCount: 8,
    customerVerified: true,
    customerJoinDate: '2024-06-12',
    
    serviceId: 'svc-001',
    serviceName: 'Bangkok City Tour',
    serviceCategory: 'Cultural Tours',
    requestedDate: '2024-12-25',
    requestedTime: '16:00',
    duration: 4,
    groupSize: 3,
    
    meetingLocation: 'Chatuchak Area',
    meetingPoint: 'Chatuchak Weekend Market Gate 1',
    area: 'Chatuchak',
    distance: 15.7,
    travelTime: 55,
    
    basePrice: 1800,
    serviceFee: 216,
    totalAmount: 2016,
    currency: 'THB',
    
    specialRequests: 'Three friends visiting for Christmas. Interested in bar-hopping and rooftop venues.',
    languagePreference: 'English',
    dietaryRestrictions: [],
    accessibilityNeeds: [],
    groupComposition: 'Friends group (25-28 years old)',
    
    status: 'pending',
    urgency: 'low',
    createdAt: '2024-12-19T16:20:00Z',
    expiresAt: '2024-12-21T16:20:00Z',
    respondBy: '2024-12-20T22:20:00Z',

    hasMessages: true,
    lastMessageAt: '2024-12-20T07:15:00Z',
    customerPhone: '+66 95 234 5678',

    isRepeatCustomer: false,
    previousBookings: 0,
  },
  
  {
    id: 'req-005',
    customerId: 'cust-005',
    customerName: 'Lisa Chen',
    customerImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1000&auto=format&fit=crop',
    customerRating: 4.5,
    customerReviewCount: 6,
    customerVerified: true,
    customerJoinDate: '2024-11-05',
    
    serviceId: 'svc-004',
    serviceName: 'Street Food Adventure',
    serviceCategory: 'Culinary Experiences',
    requestedDate: '2024-12-21',
    requestedTime: '18:00',
    duration: 3,
    groupSize: 2,
    
    meetingLocation: 'Khao San Road',
    meetingPoint: 'Khao San Road Police Box',
    area: 'Banglamphu',
    distance: 18.2,
    travelTime: 65,
    
    basePrice: 900,
    serviceFee: 108,
    totalAmount: 1008,
    currency: 'THB',
    
    specialRequests: 'Looking for authentic street food experience. We love spicy food and want to try everything!',
    languagePreference: 'English',
    dietaryRestrictions: [],
    accessibilityNeeds: [],
    groupComposition: 'Couple (22-25 years old)',
    
    status: 'declined',
    urgency: 'medium',
    createdAt: '2024-12-19T14:30:00Z',
    expiresAt: '2024-12-20T14:30:00Z',
    respondBy: '2024-12-19T20:30:00Z',
    
    hasMessages: false,
    customerPhone: '+66 87 345 6789',
    
    isRepeatCustomer: false,
    previousBookings: 0,
    
    declineReason: {
      category: 'scheduling_conflict',
      message: 'Unfortunately, I have another booking at that time. I\'d be happy to suggest alternative dates.',
      declinedAt: '2024-12-19T15:45:00Z',
    },
  },
];

// Filter and sort utilities
export const getRequestsByStatus = (status: BookingRequest['status']) => {
  return mockBookingRequests.filter(request => request.status === status);
};

export const getRequestsByUrgency = (urgency: BookingRequest['urgency']) => {
  return mockBookingRequests.filter(request => request.urgency === urgency);
};

export const getPendingRequests = () => {
  return mockBookingRequests.filter(request => request.status === 'pending');
};

export const getUrgentRequests = () => {
  return mockBookingRequests.filter(request => 
    request.status === 'pending' && 
    (request.urgency === 'urgent' || request.urgency === 'high')
  );
};

export const sortRequestsByDate = (requests: BookingRequest[], order: 'asc' | 'desc' = 'desc') => {
  return [...requests].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return order === 'desc' ? dateB - dateA : dateA - dateB;
  });
};

export const sortRequestsByPrice = (requests: BookingRequest[], order: 'asc' | 'desc' = 'desc') => {
  return [...requests].sort((a, b) => {
    return order === 'desc' ? b.totalAmount - a.totalAmount : a.totalAmount - b.totalAmount;
  });
};
