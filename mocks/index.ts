// Mock Data Index - Central export for all mock data
export * from './companions';
export * from './bookings';
export * from './messages';
export * from './notifications';
export * from './payments';
export * from './supplier-data';

// Mock API simulation utilities
export const simulateNetworkDelay = (min: number = 500, max: number = 2000) => {
  const delay = Math.random() * (max - min) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
};

export const simulateApiCall = async <T>(
  data: T,
  options: {
    delay?: { min: number; max: number };
    successRate?: number; // 0-1, probability of success
    errorMessage?: string;
  } = {}
): Promise<{ success: boolean; data?: T; error?: string }> => {
  const { 
    delay = { min: 500, max: 1500 }, 
    successRate = 0.95, 
    errorMessage = 'Network error occurred' 
  } = options;

  // Simulate network delay
  await simulateNetworkDelay(delay.min, delay.max);

  // Simulate potential failure
  if (Math.random() > successRate) {
    return {
      success: false,
      error: errorMessage,
    };
  }

  return {
    success: true,
    data,
  };
};

// Mock API endpoints simulation
export const mockApi = {
  // Authentication
  login: async (email: string, password: string) => {
    return simulateApiCall(
      {
        user: {
          id: 'customer_001',
          name: 'Alex Johnson',
          email,
          role: 'customer' as const,
          verified: true,
          profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=1000&auto=format&fit=crop',
          bio: 'Travel enthusiast exploring Thailand. Looking for authentic local experiences and cultural connections.',
          location: 'Bangkok, Thailand',
          phone: '+66 81 234 5678',
          dateOfBirth: '1988-07-22',
          createdAt: new Date().toISOString(),
        },
        token: 'mock_jwt_token_' + Date.now(),
      },
      { delay: { min: 800, max: 1500 } }
    );
  },

  register: async (userData: any) => {
    return simulateApiCall(
      {
        user: {
          id: 'customer_' + Date.now(),
          ...userData,
          verified: false,
          createdAt: new Date().toISOString(),
        },
        token: 'mock_jwt_token_' + Date.now(),
      },
      { delay: { min: 1000, max: 2000 } }
    );
  },

  // Companions
  getCompanions: async (filters?: any) => {
    const { mockCompanions } = await import('./companions');
    return simulateApiCall(mockCompanions, { delay: { min: 300, max: 800 } });
  },

  getCompanion: async (id: string) => {
    const { mockCompanions } = await import('./companions');
    const companion = mockCompanions.find(c => c.id === id);
    return simulateApiCall(companion, { delay: { min: 200, max: 600 } });
  },

  // Bookings
  getBookings: async (userId: string) => {
    const { getBookingsByCustomer } = await import('./bookings');
    const bookings = getBookingsByCustomer(userId);
    return simulateApiCall(bookings, { delay: { min: 400, max: 900 } });
  },

  createBooking: async (bookingData: any) => {
    return simulateApiCall(
      {
        id: 'booking_' + Date.now(),
        ...bookingData,
        status: 'pending',
        createdAt: new Date().toISOString(),
      },
      { delay: { min: 800, max: 1500 } }
    );
  },

  // Messages
  getConversations: async (userId: string) => {
    const { mockConversations } = await import('./messages');
    return simulateApiCall(mockConversations, { delay: { min: 300, max: 700 } });
  },

  getMessages: async (conversationId: string) => {
    const { getConversationMessages } = await import('./messages');
    const messages = getConversationMessages(conversationId);
    return simulateApiCall(messages, { delay: { min: 200, max: 500 } });
  },

  sendMessage: async (messageData: any) => {
    const { sendMessage } = await import('./messages');
    const message = sendMessage(messageData);
    return simulateApiCall(message, { delay: { min: 100, max: 300 } });
  },

  // Notifications
  getNotifications: async (userId: string) => {
    const { getNotificationsByUser } = await import('./notifications');
    const notifications = getNotificationsByUser(userId);
    return simulateApiCall(notifications, { delay: { min: 300, max: 600 } });
  },

  markNotificationRead: async (notificationId: string) => {
    const { markNotificationAsRead } = await import('./notifications');
    markNotificationAsRead(notificationId);
    return simulateApiCall({ success: true }, { delay: { min: 100, max: 300 } });
  },

  // Payments
  getPayments: async (userId: string) => {
    const { getPaymentsByUser } = await import('./payments');
    const payments = getPaymentsByUser(userId);
    return simulateApiCall(payments, { delay: { min: 400, max: 800 } });
  },

  processPayment: async (paymentData: any) => {
    const { processPayment } = await import('./payments');
    const payment = processPayment(paymentData);
    return simulateApiCall(payment, { delay: { min: 1000, max: 2500 } });
  },

  generatePromptPayQR: async (amount: number, ref: string) => {
    const { generatePromptPayQR } = await import('./payments');
    const qrCode = generatePromptPayQR(amount, ref);
    return simulateApiCall({ qrCode, ref }, { delay: { min: 500, max: 1000 } });
  },
};

// Mock data generators for testing
export const generateMockUser = (role: 'customer' | 'companion' = 'customer') => ({
  id: `${role}_${Date.now()}`,
  name: `Mock ${role === 'customer' ? 'Customer' : 'Companion'}`,
  email: `mock.${role}@example.com`,
  role,
  verified: Math.random() > 0.3,
  profileImage: `https://images.unsplash.com/photo-${Math.floor(Math.random() * 1000000000)}?q=80&w=1000&auto=format&fit=crop`,
  phone: `+66 ${Math.floor(Math.random() * 90000000) + 10000000}`,
  createdAt: new Date().toISOString(),
});

export const generateMockBooking = (customerId: string, companionId: string) => ({
  id: `booking_${Date.now()}`,
  customerId,
  companionId,
  service: 'Mock Service',
  date: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  time: `${Math.floor(Math.random() * 12) + 8}:00`,
  duration: Math.floor(Math.random() * 8) + 2,
  location: 'Bangkok',
  price: Math.floor(Math.random() * 3000) + 1000,
  status: ['pending', 'confirmed', 'completed'][Math.floor(Math.random() * 3)],
  createdAt: new Date().toISOString(),
});

// Error simulation for testing error states
export const mockApiWithErrors = {
  ...mockApi,
  
  // Override with higher error rates for testing
  getCompanions: async (filters?: any) => {
    const { mockCompanions } = await import('./companions');
    return simulateApiCall(mockCompanions, { 
      delay: { min: 300, max: 800 },
      successRate: 0.7, // 30% failure rate for testing
      errorMessage: 'Failed to load companions. Please try again.'
    });
  },

  processPayment: async (paymentData: any) => {
    return simulateApiCall(null, { 
      delay: { min: 1000, max: 2500 },
      successRate: 0.8, // 20% failure rate for payment testing
      errorMessage: 'Payment processing failed. Please check your payment method.'
    });
  },
};

// Development utilities
export const isDevelopment = __DEV__;
export const enableMockErrors = false; // Toggle for testing error states

export const getApiInstance = () => {
  return (isDevelopment && enableMockErrors) ? mockApiWithErrors : mockApi;
};
