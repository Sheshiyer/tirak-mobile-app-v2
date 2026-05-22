export interface SupplierService {
  id: string;
  name: string;
  description: string;
  category: string;
  subcategory: string;
  
  // Pricing
  basePrice: number;
  currency: 'THB';
  priceType: 'per_person' | 'per_group';
  maxGroupSize: number;
  
  // Duration & Timing
  duration: number; // hours
  durationUnit: 'hours' | 'days';
  
  // Location
  meetingType: 'fixed' | 'flexible' | 'pickup';
  meetingPoint: string;
  serviceArea: string;
  travelRadius: number; // km
  
  // Media
  photos: string[];
  coverPhoto: string;
  
  // Status & Performance
  status: 'active' | 'inactive' | 'draft';
  isVerified: boolean;
  rating: number;
  reviewCount: number;
  totalBookings: number;
  
  // Analytics
  viewCount: number;
  inquiryCount: number;
  conversionRate: number; // percentage
  revenue: number;
  lastBookingDate?: string;
  
  // Availability
  availableDays: string[];
  timeRanges: Array<{ start: string; end: string }>;
  advanceBooking: number; // days
  
  // Additional Details
  included: string[];
  excluded: string[];
  requirements: string[];
  languages: string[];
  difficulty: 'easy' | 'moderate' | 'challenging';
  ageRestriction: string;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export const mockSupplierServices: SupplierService[] = [
  {
    id: 'svc-001',
    name: 'Bangkok Street Food Adventure',
    description: 'Discover the authentic flavors of Bangkok through hidden street food gems that only locals know. We\'ll explore traditional markets, try exotic fruits, and learn about Thai culinary culture.',
    category: 'culinary_experiences',
    subcategory: 'Street Food Tour',
    
    basePrice: 1200,
    currency: 'THB',
    priceType: 'per_person',
    maxGroupSize: 6,
    
    duration: 3,
    durationUnit: 'hours',
    
    meetingType: 'fixed',
    meetingPoint: 'BTS Saphan Phut Station Exit 1',
    serviceArea: 'Bangkok Old Town',
    travelRadius: 5,
    
    photos: [
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1551218808-94e220e084d2?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1563379091339-03246963d96c?q=80&w=1000&auto=format&fit=crop',
    ],
    coverPhoto: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1000&auto=format&fit=crop',
    
    status: 'active',
    isVerified: true,
    rating: 4.8,
    reviewCount: 127,
    totalBookings: 156,
    
    viewCount: 2340,
    inquiryCount: 89,
    conversionRate: 67,
    revenue: 187200,
    lastBookingDate: '2024-12-18',
    
    availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
    timeRanges: [
      { start: '10:00', end: '13:00' },
      { start: '15:00', end: '18:00' }
    ],
    advanceBooking: 1,
    
    included: [
      'Professional local guide',
      'Food tastings at 8-10 stalls',
      'Traditional market visit',
      'Cultural insights and stories',
      'Bottled water'
    ],
    excluded: [
      'Hotel pickup/drop-off',
      'Additional drinks',
      'Personal expenses',
      'Tips (optional)'
    ],
    requirements: [
      'Comfortable walking shoes',
      'Appetite for adventure',
      'Basic English communication'
    ],
    languages: ['English', 'Thai'],
    difficulty: 'easy',
    ageRestriction: 'Suitable for ages 12+',
    
    createdAt: '2024-10-15T08:30:00Z',
    updatedAt: '2024-12-18T14:22:00Z',
  },
  
  {
    id: 'svc-002',
    name: 'Traditional Thai Cooking Class',
    description: 'Learn to cook authentic Thai dishes in a traditional kitchen setting. Master the art of balancing sweet, sour, salty, and spicy flavors while preparing 4-5 classic dishes.',
    category: 'culinary_experiences',
    subcategory: 'Cooking Class',
    
    basePrice: 1800,
    currency: 'THB',
    priceType: 'per_person',
    maxGroupSize: 8,
    
    duration: 4,
    durationUnit: 'hours',
    
    meetingType: 'pickup',
    meetingPoint: 'Hotel pickup available',
    serviceArea: 'Bangkok Central',
    travelRadius: 15,
    
    photos: [
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?q=80&w=1000&auto=format&fit=crop',
    ],
    coverPhoto: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?q=80&w=1000&auto=format&fit=crop',
    
    status: 'active',
    isVerified: true,
    rating: 4.9,
    reviewCount: 89,
    totalBookings: 102,
    
    viewCount: 1890,
    inquiryCount: 67,
    conversionRate: 72,
    revenue: 183600,
    lastBookingDate: '2024-12-19',
    
    availableDays: ['tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    timeRanges: [
      { start: '09:00', end: '13:00' },
      { start: '14:00', end: '18:00' }
    ],
    advanceBooking: 2,
    
    included: [
      'Market tour for ingredients',
      'All cooking ingredients',
      'Recipe booklet',
      'Lunch/dinner of cooked dishes',
      'Cooking apron',
      'Hotel pickup (central Bangkok)'
    ],
    excluded: [
      'Hotel drop-off',
      'Alcoholic beverages',
      'Personal expenses'
    ],
    requirements: [
      'No cooking experience needed',
      'Inform of any food allergies',
      'Comfortable clothing'
    ],
    languages: ['English', 'Thai', 'Japanese'],
    difficulty: 'easy',
    ageRestriction: 'All ages welcome (children with adult)',
    
    createdAt: '2024-09-20T10:15:00Z',
    updatedAt: '2024-12-19T09:45:00Z',
  },
  
  {
    id: 'svc-003',
    name: 'Temple & Cultural Heritage Walk',
    description: 'Explore Bangkok\'s most sacred temples and learn about Thai Buddhist culture, architecture, and traditions. Visit Wat Pho, Wat Arun, and hidden local temples.',
    category: 'cultural_tours',
    subcategory: 'Temple Tour',
    
    basePrice: 1500,
    currency: 'THB',
    priceType: 'per_person',
    maxGroupSize: 10,
    
    duration: 5,
    durationUnit: 'hours',
    
    meetingType: 'fixed',
    meetingPoint: 'Wat Pho Main Entrance',
    serviceArea: 'Rattanakosin Island',
    travelRadius: 3,
    
    photos: [
      'https://images.unsplash.com/photo-1563492065-1a83e8c2b2e9?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1528181304800-259b08848526?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1000&auto=format&fit=crop',
    ],
    coverPhoto: 'https://images.unsplash.com/photo-1563492065-1a83e8c2b2e9?q=80&w=1000&auto=format&fit=crop',
    
    status: 'active',
    isVerified: true,
    rating: 4.7,
    reviewCount: 156,
    totalBookings: 189,
    
    viewCount: 3120,
    inquiryCount: 134,
    conversionRate: 61,
    revenue: 283500,
    lastBookingDate: '2024-12-17',
    
    availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    timeRanges: [
      { start: '08:00', end: '13:00' },
      { start: '13:00', end: '18:00' }
    ],
    advanceBooking: 1,
    
    included: [
      'Professional guide',
      'Temple entrance fees',
      'Boat transportation',
      'Cultural insights',
      'Photography assistance',
      'Bottled water'
    ],
    excluded: [
      'Hotel pickup/drop-off',
      'Lunch',
      'Personal expenses',
      'Donations (optional)'
    ],
    requirements: [
      'Modest dress code (covered shoulders/knees)',
      'Comfortable walking shoes',
      'Respectful behavior in temples'
    ],
    languages: ['English', 'Thai', 'Mandarin'],
    difficulty: 'easy',
    ageRestriction: 'All ages welcome',
    
    createdAt: '2024-08-10T07:20:00Z',
    updatedAt: '2024-12-17T16:30:00Z',
  },
  
  {
    id: 'svc-004',
    name: 'Bangkok Photography Workshop',
    description: 'Capture the essence of Bangkok through your lens. Learn photography techniques while exploring photogenic locations, from bustling markets to serene temples.',
    category: 'photography_tours',
    subcategory: 'Photography Workshop',
    
    basePrice: 2500,
    currency: 'THB',
    priceType: 'per_person',
    maxGroupSize: 4,
    
    duration: 6,
    durationUnit: 'hours',
    
    meetingType: 'flexible',
    meetingPoint: 'Flexible based on lighting conditions',
    serviceArea: 'Bangkok Metropolitan',
    travelRadius: 20,
    
    photos: [
      'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1518709268805-4e9042af2176?q=80&w=1000&auto=format&fit=crop',
    ],
    coverPhoto: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?q=80&w=1000&auto=format&fit=crop',
    
    status: 'active',
    isVerified: true,
    rating: 4.9,
    reviewCount: 34,
    totalBookings: 41,
    
    viewCount: 890,
    inquiryCount: 28,
    conversionRate: 78,
    revenue: 102500,
    lastBookingDate: '2024-12-16',
    
    availableDays: ['friday', 'saturday', 'sunday'],
    timeRanges: [
      { start: '06:00', end: '12:00' },
      { start: '15:00', end: '21:00' }
    ],
    advanceBooking: 3,
    
    included: [
      'Professional photographer guide',
      'Photography tips and techniques',
      'Location scouting',
      'Photo editing basics',
      'Digital photo delivery',
      'Transportation between locations'
    ],
    excluded: [
      'Camera equipment (rental available)',
      'Meals',
      'Hotel pickup/drop-off',
      'Printing services'
    ],
    requirements: [
      'Basic camera knowledge helpful',
      'DSLR or mirrorless camera recommended',
      'Comfortable walking',
      'Early morning availability'
    ],
    languages: ['English', 'Thai'],
    difficulty: 'moderate',
    ageRestriction: 'Ages 16+ recommended',
    
    createdAt: '2024-11-05T12:00:00Z',
    updatedAt: '2024-12-16T18:45:00Z',
  },
  
  {
    id: 'svc-005',
    name: 'Floating Market & Canal Tour',
    description: 'Experience traditional Thai life along the canals. Visit authentic floating markets, see local communities, and enjoy a peaceful boat ride through Bangkok\'s waterways.',
    category: 'cultural_tours',
    subcategory: 'Boat Tour',
    
    basePrice: 1800,
    currency: 'THB',
    priceType: 'per_person',
    maxGroupSize: 12,
    
    duration: 6,
    durationUnit: 'hours',
    
    meetingType: 'pickup',
    meetingPoint: 'Hotel pickup available',
    serviceArea: 'Bangkok & Surrounding',
    travelRadius: 50,
    
    photos: [
      'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1528181304800-259b08848526?q=80&w=1000&auto=format&fit=crop',
    ],
    coverPhoto: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?q=80&w=1000&auto=format&fit=crop',
    
    status: 'inactive',
    isVerified: true,
    rating: 4.6,
    reviewCount: 78,
    totalBookings: 92,
    
    viewCount: 1560,
    inquiryCount: 45,
    conversionRate: 59,
    revenue: 165600,
    lastBookingDate: '2024-11-28',
    
    availableDays: ['saturday', 'sunday'],
    timeRanges: [
      { start: '07:00', end: '13:00' }
    ],
    advanceBooking: 2,
    
    included: [
      'Hotel pickup and drop-off',
      'Long-tail boat ride',
      'Floating market visit',
      'Local lunch',
      'Professional guide',
      'Life jackets'
    ],
    excluded: [
      'Personal shopping',
      'Additional snacks',
      'Tips for boat driver'
    ],
    requirements: [
      'Comfortable with boat travel',
      'Sun protection recommended',
      'Early morning departure'
    ],
    languages: ['English', 'Thai'],
    difficulty: 'easy',
    ageRestriction: 'All ages welcome',
    
    createdAt: '2024-07-22T06:30:00Z',
    updatedAt: '2024-11-28T11:20:00Z',
  },
];

// Utility functions
export const getActiveServices = () => {
  return mockSupplierServices.filter(service => service.status === 'active');
};

export const getServicesByCategory = (category: string) => {
  return mockSupplierServices.filter(service => service.category === category);
};

export const getTopPerformingServices = (limit: number = 3) => {
  return [...mockSupplierServices]
    .sort((a, b) => b.conversionRate - a.conversionRate)
    .slice(0, limit);
};

export const getTotalRevenue = () => {
  return mockSupplierServices.reduce((total, service) => total + service.revenue, 0);
};

export const getServiceAnalytics = () => {
  const totalServices = mockSupplierServices.length;
  const activeServices = getActiveServices().length;
  const totalBookings = mockSupplierServices.reduce((sum, s) => sum + s.totalBookings, 0);
  const totalRevenue = getTotalRevenue();
  const avgRating = mockSupplierServices.reduce((sum, s) => sum + s.rating, 0) / totalServices;
  const totalReviews = mockSupplierServices.reduce((sum, s) => sum + s.reviewCount, 0);

  return {
    totalServices,
    activeServices,
    totalBookings,
    totalRevenue,
    avgRating: Math.round(avgRating * 10) / 10,
    totalReviews,
  };
};
