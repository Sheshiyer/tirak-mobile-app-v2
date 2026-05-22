export interface MockNotification {
  id: string;
  userId: string;
  type: 'booking' | 'message' | 'payment' | 'review' | 'system' | 'promotion';
  title: string;
  message: string;
  data?: {
    bookingId?: string;
    conversationId?: string;
    companionId?: string;
    customerId?: string;
    paymentId?: string;
    reviewId?: string;
    url?: string;
  };
  read: boolean;
  timestamp: string;
  priority: 'low' | 'medium' | 'high';
  actionRequired?: boolean;
  expiresAt?: string;
}

export const mockNotifications: MockNotification[] = [
  {
    id: 'notif_001',
    userId: 'customer_001',
    type: 'booking',
    title: 'Booking Confirmed',
    message: 'Your booking with Nisa Thanakit for Bangkok City Tour has been confirmed for Jan 15, 2024.',
    data: {
      bookingId: 'booking_001',
      companionId: '1',
    },
    read: false,
    timestamp: '2024-01-10T11:00:00Z',
    priority: 'high',
    actionRequired: false,
  },
  {
    id: 'notif_002',
    userId: 'customer_001',
    type: 'message',
    title: 'New Message',
    message: 'Nisa Thanakit sent you a message about your upcoming tour.',
    data: {
      conversationId: 'conv_001',
      companionId: '1',
    },
    read: false,
    timestamp: '2024-01-14T10:15:00Z',
    priority: 'medium',
    actionRequired: false,
  },
  {
    id: 'notif_003',
    userId: 'customer_001',
    type: 'payment',
    title: 'Payment Successful',
    message: 'Your payment of ฿2,500 for Bangkok City Tour has been processed successfully.',
    data: {
      bookingId: 'booking_001',
      paymentId: 'pay_001',
    },
    read: true,
    timestamp: '2024-01-10T10:45:00Z',
    priority: 'medium',
    actionRequired: false,
  },
  {
    id: 'notif_004',
    userId: 'customer_001',
    type: 'review',
    title: 'Rate Your Experience',
    message: 'How was your Shopping & Food Tour with Apinya? Please leave a review.',
    data: {
      bookingId: 'booking_003',
      companionId: '4',
    },
    read: false,
    timestamp: '2024-01-05T17:00:00Z',
    priority: 'low',
    actionRequired: true,
    expiresAt: '2024-01-19T17:00:00Z',
  },
  {
    id: 'notif_005',
    userId: 'customer_001',
    type: 'booking',
    title: 'Booking Request Pending',
    message: 'Your booking request with Somchai Kittisak is waiting for confirmation.',
    data: {
      bookingId: 'booking_002',
      companionId: '2',
    },
    read: true,
    timestamp: '2024-01-12T14:25:00Z',
    priority: 'medium',
    actionRequired: false,
  },
  {
    id: 'notif_006',
    userId: 'customer_001',
    type: 'promotion',
    title: 'Special Offer',
    message: 'Get 20% off your next booking! Use code WELCOME20. Valid until Jan 31.',
    data: {
      url: '/promotions/welcome20',
    },
    read: true,
    timestamp: '2024-01-08T12:00:00Z',
    priority: 'low',
    actionRequired: false,
    expiresAt: '2024-01-31T23:59:59Z',
  },
  {
    id: 'notif_007',
    userId: 'customer_001',
    type: 'system',
    title: 'Profile Verification',
    message: 'Complete your profile verification to unlock premium features.',
    data: {
      url: '/profile/verification',
    },
    read: false,
    timestamp: '2024-01-07T09:00:00Z',
    priority: 'medium',
    actionRequired: true,
  },
  {
    id: 'notif_008',
    userId: '1',
    type: 'booking',
    title: 'New Booking Request',
    message: 'John Smith wants to book a Bangkok City Tour for Jan 15, 2024.',
    data: {
      bookingId: 'booking_001',
      customerId: 'customer_001',
    },
    read: true,
    timestamp: '2024-01-10T10:30:00Z',
    priority: 'high',
    actionRequired: true,
  },
  {
    id: 'notif_009',
    userId: '1',
    type: 'payment',
    title: 'Payment Received',
    message: 'You received ฿2,125 for Bangkok City Tour (after commission).',
    data: {
      bookingId: 'booking_001',
      paymentId: 'pay_001',
    },
    read: true,
    timestamp: '2024-01-10T11:15:00Z',
    priority: 'medium',
    actionRequired: false,
  },
  {
    id: 'notif_010',
    userId: '1',
    type: 'review',
    title: 'New Review Received',
    message: 'John Smith left you a 5-star review for the Bangkok City Tour!',
    data: {
      bookingId: 'booking_001',
      reviewId: 'review_001',
      customerId: 'customer_001',
    },
    read: false,
    timestamp: '2024-01-15T18:30:00Z',
    priority: 'low',
    actionRequired: false,
  },
];

export const getNotificationsByUser = (userId: string) => {
  return mockNotifications
    .filter(notif => notif.userId === userId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const getUnreadNotificationsCount = (userId: string) => {
  return mockNotifications.filter(notif => notif.userId === userId && !notif.read).length;
};

export const getNotificationsByType = (userId: string, type: MockNotification['type']) => {
  return mockNotifications
    .filter(notif => notif.userId === userId && notif.type === type)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const getActionRequiredNotifications = (userId: string) => {
  return mockNotifications
    .filter(notif => notif.userId === userId && notif.actionRequired && !notif.read)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const markNotificationAsRead = (notificationId: string) => {
  const notification = mockNotifications.find(notif => notif.id === notificationId);
  if (notification) {
    notification.read = true;
  }
};

export const markAllNotificationsAsRead = (userId: string) => {
  mockNotifications.forEach(notif => {
    if (notif.userId === userId) {
      notif.read = true;
    }
  });
};

export const createNotification = (notification: Omit<MockNotification, 'id' | 'timestamp'>) => {
  const newNotification: MockNotification = {
    ...notification,
    id: `notif_${Date.now()}`,
    timestamp: new Date().toISOString(),
  };
  
  mockNotifications.unshift(newNotification);
  return newNotification;
};

export const deleteNotification = (notificationId: string) => {
  const index = mockNotifications.findIndex(notif => notif.id === notificationId);
  if (index > -1) {
    mockNotifications.splice(index, 1);
    return true;
  }
  return false;
};

export const getNotificationStats = (userId: string) => {
  const userNotifications = getNotificationsByUser(userId);
  
  return {
    total: userNotifications.length,
    unread: userNotifications.filter(n => !n.read).length,
    actionRequired: userNotifications.filter(n => n.actionRequired && !n.read).length,
    byType: {
      booking: userNotifications.filter(n => n.type === 'booking').length,
      message: userNotifications.filter(n => n.type === 'message').length,
      payment: userNotifications.filter(n => n.type === 'payment').length,
      review: userNotifications.filter(n => n.type === 'review').length,
      system: userNotifications.filter(n => n.type === 'system').length,
      promotion: userNotifications.filter(n => n.type === 'promotion').length,
    },
  };
};
