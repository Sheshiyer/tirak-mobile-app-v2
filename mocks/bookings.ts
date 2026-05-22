export interface MockBooking {
  id: string;
  companionId: string;
  companionName: string;
  companionImage: string;
  customerId: string;
  customerName: string;
  customerImage: string;
  service: string;
  date: string;
  time: string;
  duration: number; // hours
  location: string;
  meetingPoint: string;
  price: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'in-progress';
  paymentMethod: 'promptpay' | 'cash' | 'card';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  specialRequests?: string;
  createdAt: string;
  updatedAt: string;
  rating?: number;
  review?: string;
  cancellationReason?: string;
}

export const mockBookings: MockBooking[] = [
  {
    id: 'booking_001',
    companionId: '1',
    companionName: 'Siriporn Nakamura',
    companionImage: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?q=80&w=1000&auto=format&fit=crop',
    customerId: 'demo_customer_001',
    customerName: 'Alex Johnson',
    customerImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=1000&auto=format&fit=crop',
    service: 'Temple & Culture Tour',
    date: '2024-12-20',
    time: '14:00',
    duration: 4,
    location: 'Bangkok, Sukhumvit',
    meetingPoint: 'Wat Pho Temple Main Entrance',
    price: 2800,
    status: 'confirmed',
    paymentMethod: 'promptpay',
    paymentStatus: 'paid',
    specialRequests: 'First time in Thailand, interested in Buddhist culture and local food',
    createdAt: '2024-12-18T10:30:00Z',
    updatedAt: '2024-12-18T11:00:00Z',
  },
  {
    id: 'booking_002',
    companionId: '4',
    companionName: 'Waranya Suksawat',
    companionImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1000&auto=format&fit=crop',
    customerId: 'demo_customer_001',
    customerName: 'Alex Johnson',
    customerImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=1000&auto=format&fit=crop',
    service: 'Street Food & Night Markets',
    date: '2024-12-21',
    time: '18:00',
    duration: 4,
    location: 'Bangkok, Thonglor',
    meetingPoint: 'Chatuchak Weekend Market Gate 1',
    price: 3000,
    status: 'pending',
    paymentMethod: 'cash',
    paymentStatus: 'pending',
    specialRequests: 'Want to try authentic Thai street food, not too spicy please',
    createdAt: '2024-12-19T14:20:00Z',
    updatedAt: '2024-12-19T14:20:00Z',
  },
  {
    id: 'booking_003',
    companionId: '4',
    companionName: 'Apinya Charoensuk',
    companionImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1000&auto=format&fit=crop',
    customerId: 'customer_001',
    customerName: 'John Smith',
    customerImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=1000&auto=format&fit=crop',
    service: 'Shopping & Food Tour',
    date: '2024-01-05',
    time: '11:00',
    duration: 5,
    location: 'Bangkok',
    meetingPoint: 'Siam Paragon Main Entrance',
    price: 2800,
    status: 'completed',
    paymentMethod: 'promptpay',
    paymentStatus: 'paid',
    specialRequests: 'Looking for authentic Thai street food',
    createdAt: '2024-01-01T09:15:00Z',
    updatedAt: '2024-01-05T16:30:00Z',
    rating: 5,
    review: 'Amazing experience! Apinya showed me the best local spots and helped me find great souvenirs. Highly recommended!',
  },
  {
    id: 'booking_004',
    companionId: '6',
    companionName: 'Ploy Siriporn',
    companionImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1000&auto=format&fit=crop',
    customerId: 'customer_001',
    customerName: 'John Smith',
    customerImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=1000&auto=format&fit=crop',
    service: 'Wellness & Spa Day',
    date: '2023-12-28',
    time: '10:00',
    duration: 4,
    location: 'Chiang Mai',
    meetingPoint: 'Four Seasons Resort Spa',
    price: 2400,
    status: 'completed',
    paymentMethod: 'card',
    paymentStatus: 'paid',
    createdAt: '2023-12-20T12:00:00Z',
    updatedAt: '2023-12-28T14:30:00Z',
    rating: 4,
    review: 'Very relaxing day. Ploy was knowledgeable about wellness practices.',
  },
  {
    id: 'booking_005',
    companionId: '3',
    companionName: 'Malee Siriwan',
    companionImage: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=1000&auto=format&fit=crop',
    customerId: 'customer_002',
    customerName: 'Sarah Johnson',
    customerImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1000&auto=format&fit=crop',
    service: 'Temple & Cultural Tour',
    date: '2024-01-18',
    time: '07:00',
    duration: 7,
    location: 'Chiang Mai',
    meetingPoint: 'Wat Phra Singh Temple Gate',
    price: 2200,
    status: 'confirmed',
    paymentMethod: 'promptpay',
    paymentStatus: 'paid',
    specialRequests: 'Interested in Buddhist history and meditation',
    createdAt: '2024-01-13T16:45:00Z',
    updatedAt: '2024-01-13T17:00:00Z',
  },
  {
    id: 'booking_006',
    companionId: '1',
    companionName: 'Nisa Thanakit',
    companionImage: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?q=80&w=1000&auto=format&fit=crop',
    customerId: 'customer_003',
    customerName: 'Mike Chen',
    customerImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1000&auto=format&fit=crop',
    service: 'Evening Dinner Date',
    date: '2024-01-22',
    time: '18:00',
    duration: 3,
    location: 'Bangkok',
    meetingPoint: 'Lebua Sky Bar',
    price: 2500,
    status: 'cancelled',
    paymentMethod: 'promptpay',
    paymentStatus: 'refunded',
    cancellationReason: 'Customer had to cancel due to flight delay',
    createdAt: '2024-01-14T20:30:00Z',
    updatedAt: '2024-01-16T10:15:00Z',
  },
  // Additional bookings for demo companion
  {
    id: 'booking_007',
    companionId: 'demo_companion_001',
    companionName: 'Siriporn Nakamura',
    companionImage: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?q=80&w=1000&auto=format&fit=crop',
    customerId: 'customer_004',
    customerName: 'Sarah Chen',
    customerImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1000&auto=format&fit=crop',
    service: 'Street Food Tour',
    date: '2024-12-21',
    time: '18:00',
    duration: 3,
    location: 'Bangkok, Sukhumvit',
    meetingPoint: 'Terminal 21 Food Court',
    price: 2800,
    status: 'pending',
    paymentMethod: 'promptpay',
    paymentStatus: 'pending',
    specialRequests: 'Vegetarian options preferred',
    createdAt: '2024-12-19T15:30:00Z',
    updatedAt: '2024-12-19T15:30:00Z',
  },
  {
    id: 'booking_008',
    companionId: 'demo_companion_001',
    companionName: 'Siriporn Nakamura',
    companionImage: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?q=80&w=1000&auto=format&fit=crop',
    customerId: 'customer_005',
    customerName: 'David Kim',
    customerImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1000&auto=format&fit=crop',
    service: 'Cultural Tours',
    date: '2024-12-19',
    time: '09:00',
    duration: 6,
    location: 'Bangkok, Sukhumvit',
    meetingPoint: 'Grand Palace Main Gate',
    price: 2800,
    status: 'completed',
    paymentMethod: 'promptpay',
    paymentStatus: 'paid',
    specialRequests: 'Interested in Thai history and architecture',
    createdAt: '2024-12-17T08:00:00Z',
    updatedAt: '2024-12-19T16:00:00Z',
    rating: 5,
    review: 'Siriporn was an amazing guide! Her knowledge of Thai culture and history is incredible. Highly recommend!',
  },
];

export const mockBookingStats = {
  totalBookings: 187,
  completedBookings: 168,
  cancelledBookings: 12,
  pendingBookings: 7,
  totalRevenue: 524800,
  averageRating: 4.9,
  repeatCustomers: 45,
  thisWeekEarnings: 8400,
  todayBookings: 3,
  monthlyGrowth: 23,
};

export const getBookingsByStatus = (status: MockBooking['status']) => {
  return mockBookings.filter(booking => booking.status === status);
};

export const getBookingsByCustomer = (customerId: string) => {
  return mockBookings.filter(booking => booking.customerId === customerId);
};

export const getBookingsByCompanion = (companionId: string) => {
  return mockBookings.filter(booking => booking.companionId === companionId);
};

export const getUpcomingBookings = () => {
  const today = new Date();
  return mockBookings.filter(booking => {
    const bookingDate = new Date(booking.date);
    return bookingDate >= today && (booking.status === 'confirmed' || booking.status === 'pending');
  });
};

export const getBookingHistory = () => {
  return mockBookings.filter(booking => 
    booking.status === 'completed' || booking.status === 'cancelled'
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};
