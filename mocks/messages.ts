export interface MockMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderImage: string;
  receiverId: string;
  receiverName: string;
  receiverImage: string;
  content: string;
  type: 'text' | 'image' | 'location' | 'booking' | 'payment';
  timestamp: string;
  read: boolean;
  edited?: boolean;
  editedAt?: string;
  replyTo?: string;
  attachments?: {
    type: 'image' | 'document';
    url: string;
    name: string;
    size: number;
  }[];
}

export interface MockConversation {
  id: string;
  participants: {
    id: string;
    name: string;
    image: string;
    role: 'customer' | 'companion';
    online: boolean;
    lastSeen?: string;
  }[];
  lastMessage: MockMessage;
  unreadCount: number;
  bookingId?: string;
  createdAt: string;
  updatedAt: string;
}

export const mockMessages: MockMessage[] = [
  {
    id: 'msg_001',
    conversationId: 'conv_001',
    senderId: 'customer_001',
    senderName: 'John Smith',
    senderImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=1000&auto=format&fit=crop',
    receiverId: '1',
    receiverName: 'Nisa Thanakit',
    receiverImage: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?q=80&w=1000&auto=format&fit=crop',
    content: 'Hi Nisa! I\'m interested in booking a tour with you for tomorrow. Are you available?',
    type: 'text',
    timestamp: '2024-01-14T09:30:00Z',
    read: true,
  },
  {
    id: 'msg_002',
    conversationId: 'conv_001',
    senderId: '1',
    senderName: 'Nisa Thanakit',
    senderImage: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?q=80&w=1000&auto=format&fit=crop',
    receiverId: 'customer_001',
    receiverName: 'John Smith',
    receiverImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=1000&auto=format&fit=crop',
    content: 'Hello John! Yes, I\'m available tomorrow. What kind of tour are you interested in? I can show you temples, markets, or modern Bangkok!',
    type: 'text',
    timestamp: '2024-01-14T09:45:00Z',
    read: true,
  },
  {
    id: 'msg_003',
    conversationId: 'conv_001',
    senderId: 'customer_001',
    senderName: 'John Smith',
    senderImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=1000&auto=format&fit=crop',
    receiverId: '1',
    receiverName: 'Nisa Thanakit',
    receiverImage: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?q=80&w=1000&auto=format&fit=crop',
    content: 'I\'d love to see the temples and try some authentic street food! What time works best for you?',
    type: 'text',
    timestamp: '2024-01-14T10:00:00Z',
    read: true,
  },
  {
    id: 'msg_004',
    conversationId: 'conv_001',
    senderId: '1',
    senderName: 'Nisa Thanakit',
    senderImage: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?q=80&w=1000&auto=format&fit=crop',
    receiverId: 'customer_001',
    receiverName: 'John Smith',
    receiverImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=1000&auto=format&fit=crop',
    content: 'Perfect! I know the best spots for both. How about we start at 9 AM? We can meet at BTS Siam Station.',
    type: 'text',
    timestamp: '2024-01-14T10:15:00Z',
    read: true,
  },
  {
    id: 'msg_005',
    conversationId: 'conv_001',
    senderId: 'customer_001',
    senderName: 'John Smith',
    senderImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=1000&auto=format&fit=crop',
    receiverId: '1',
    receiverName: 'Nisa Thanakit',
    receiverImage: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?q=80&w=1000&auto=format&fit=crop',
    content: 'Sounds great! I\'ll book it now. See you tomorrow at 9 AM at Siam Station!',
    type: 'text',
    timestamp: '2024-01-14T10:30:00Z',
    read: false,
  },
  {
    id: 'msg_006',
    conversationId: 'conv_002',
    senderId: 'customer_001',
    senderName: 'John Smith',
    senderImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=1000&auto=format&fit=crop',
    receiverId: '2',
    receiverName: 'Somchai Kittisak',
    receiverImage: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=1000&auto=format&fit=crop',
    content: 'Hi Somchai! I\'m planning a trip to Phuket next week. I\'m interested in diving but I\'m a complete beginner. Can you help?',
    type: 'text',
    timestamp: '2024-01-12T14:20:00Z',
    read: true,
  },
  {
    id: 'msg_007',
    conversationId: 'conv_002',
    senderId: '2',
    senderName: 'Somchai Kittisak',
    senderImage: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=1000&auto=format&fit=crop',
    receiverId: 'customer_001',
    receiverName: 'John Smith',
    receiverImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=1000&auto=format&fit=crop',
    content: 'Absolutely! I\'m a certified PADI instructor. We can start with a discovery dive in shallow water. It\'s completely safe for beginners.',
    type: 'text',
    timestamp: '2024-01-12T14:35:00Z',
    read: true,
  },
  {
    id: 'msg_008',
    conversationId: 'conv_002',
    senderId: 'customer_001',
    senderName: 'John Smith',
    senderImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=1000&auto=format&fit=crop',
    receiverId: '2',
    receiverName: 'Somchai Kittisak',
    receiverImage: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=1000&auto=format&fit=crop',
    content: 'That sounds perfect! What\'s included in the price? And do you provide all the equipment?',
    type: 'text',
    timestamp: '2024-01-12T14:50:00Z',
    read: false,
  },
];

export const mockConversations: MockConversation[] = [
  {
    id: 'conv_001',
    participants: [
      {
        id: 'customer_001',
        name: 'John Smith',
        image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=1000&auto=format&fit=crop',
        role: 'customer',
        online: true,
      },
      {
        id: '1',
        name: 'Nisa Thanakit',
        image: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?q=80&w=1000&auto=format&fit=crop',
        role: 'companion',
        online: true,
      },
    ],
    lastMessage: mockMessages[4],
    unreadCount: 1,
    bookingId: 'booking_001',
    createdAt: '2024-01-14T09:30:00Z',
    updatedAt: '2024-01-14T10:30:00Z',
  },
  {
    id: 'conv_002',
    participants: [
      {
        id: 'customer_001',
        name: 'John Smith',
        image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=1000&auto=format&fit=crop',
        role: 'customer',
        online: true,
      },
      {
        id: '2',
        name: 'Somchai Kittisak',
        image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=1000&auto=format&fit=crop',
        role: 'companion',
        online: false,
        lastSeen: '2024-01-12T15:00:00Z',
      },
    ],
    lastMessage: mockMessages[7],
    unreadCount: 1,
    bookingId: 'booking_002',
    createdAt: '2024-01-12T14:20:00Z',
    updatedAt: '2024-01-12T14:50:00Z',
  },
];

export const getConversationMessages = (conversationId: string) => {
  return mockMessages
    .filter(msg => msg.conversationId === conversationId)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
};

export const getUnreadMessagesCount = (userId: string) => {
  return mockMessages.filter(msg => msg.receiverId === userId && !msg.read).length;
};

export const markMessagesAsRead = (conversationId: string, userId: string) => {
  // In a real app, this would make an API call
  mockMessages.forEach(msg => {
    if (msg.conversationId === conversationId && msg.receiverId === userId) {
      msg.read = true;
    }
  });
};

export const sendMessage = (message: Omit<MockMessage, 'id' | 'timestamp' | 'read'>) => {
  const newMessage: MockMessage = {
    ...message,
    id: `msg_${Date.now()}`,
    timestamp: new Date().toISOString(),
    read: false,
  };
  
  mockMessages.push(newMessage);
  
  // Update conversation
  const conversation = mockConversations.find(conv => conv.id === message.conversationId);
  if (conversation) {
    conversation.lastMessage = newMessage;
    conversation.updatedAt = newMessage.timestamp;
    if (message.receiverId !== message.senderId) {
      conversation.unreadCount += 1;
    }
  }
  
  return newMessage;
};
