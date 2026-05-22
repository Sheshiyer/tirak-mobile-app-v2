/**
 * Chat API utilities for Tirak — Cloudflare D1 + Durable Objects
 *
 * Backend: https://tirak-backend.tirak-court.workers.dev
 * REST:    /api/chat/rooms  (CRUD + messages)
 * WS:      /api/chat/rooms/:roomId/ws  (Durable Objects real-time)
 */

import { secureStorage } from './secure-storage';
import { API_BASE_URL } from '@/constants/api';
import { logger } from './logger';
import { TEST_COMPANION_ID, getCompanionImage, isTestCompanionId } from './companion-display';
import { handleApiError } from './api-errors';

export const BACKEND_URL = API_BASE_URL;

export async function getAuthToken(): Promise<string | null> {
  return secureStorage.getItemAsync('authToken');
}

async function apiGet<T>(path: string): Promise<T | null> {
  try {
    const token = await getAuthToken();
    if (!token) {
      logger.warn('apiGet: No auth token');
      return null;
    }
    const url = `${BACKEND_URL}${path}`;
    logger.log('apiGet:', url);
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      logger.warn('apiGet failed:', res.status, url);
      handleApiError({ response: { status: res.status, data: await res.clone().json().catch(() => null) } });
      return null;
    }
    const json = await res.json();
    return (json as { success: boolean; data: T }).success
      ? (json as { success: boolean; data: T }).data
      : null;
  } catch (err) {
    logger.error('apiGet error:', err);
    return null;
  }
}

async function apiPost<T>(path: string, body: unknown): Promise<T | null> {
  try {
    const token = await getAuthToken();
    if (!token) {
      logger.warn('apiPost: No auth token');
      return null;
    }
    const url = `${BACKEND_URL}${path}`;
    logger.log('apiPost:', url);
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      logger.warn('apiPost failed:', res.status, url);
      if (res.status === 401 || res.status === 403) {
        handleApiError({ response: { status: res.status, data: await res.clone().json().catch(() => null) } });
      }
      return null;
    }
    const json = await res.json();
    return (json as { success: boolean; data: T }).success
      ? (json as { success: boolean; data: T }).data
      : null;
  } catch (err) {
    logger.error('apiPost error:', err);
    return null;
  }
}

// ─── Types matching backend response shapes ──────────────────────────────────

export interface OtherParty {
  id: string;
  name: string | null;
  image: string | null;
  type: 'supplier' | 'customer';
}

export interface ChatRoom {
  id: string;
  status: string;
  otherParty: OtherParty;
  lastMessage: {
    content: string;
    type: string;
    timestamp: string;
    senderId?: string;
    senderName?: string | null;
    isOwn?: boolean;
  } | null;
  lastActivity: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string | null;
  type: 'text' | 'image' | 'system';
  content: string | null;
  imageUrl: string | null;
  metadata: Record<string, unknown> | null;
  timestamp: string;
  isOwn: boolean;
}

export interface RoomDetail {
  id: string;
  status: string;
  otherParty: OtherParty;
  messages: ChatMessage[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  createdAt: string;
}

// Demo chat data for Apple review
const demoRooms: ChatRoom[] = [
  {
    id: 'demo_room_test_customer',
    status: 'active',
    otherParty: {
      id: '4f34d4e0-84f3-4e3c-b443-909ea3905f58',
      name: 'test.customer.tirak',
      image: null,
      type: 'customer',
    },
    lastMessage: {
      content: 'Can we meet by the main entrance?',
      type: 'text',
      timestamp: new Date(Date.now() - 600000).toISOString(),
    },
    lastActivity: new Date(Date.now() - 600000).toISOString(),
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'demo_room_test_companion',
    status: 'active',
    otherParty: {
      id: TEST_COMPANION_ID,
      name: 'Test Companion',
      image: getCompanionImage({ id: TEST_COMPANION_ID, displayName: 'Test Companion' }),
      type: 'supplier',
    },
    lastMessage: {
      content: 'Happy to tailor the walk around food, temples, or local markets.',
      type: 'text',
      timestamp: new Date(Date.now() - 1200000).toISOString(),
    },
    lastActivity: new Date(Date.now() - 1200000).toISOString(),
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'demo_room_001',
    status: 'active',
    otherParty: {
      id: 'companion_001',
      name: 'Somchai Guide',
      image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300',
      type: 'supplier',
    },
    lastMessage: {
      content: 'Looking forward to our Bangkok tour tomorrow!',
      type: 'text',
      timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    },
    lastActivity: new Date(Date.now() - 3600000).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'demo_room_002',
    status: 'active',
    otherParty: {
      id: 'companion_002',
      name: 'Areeya Thai',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300',
      type: 'supplier',
    },
    lastMessage: {
      content: 'The cooking class will start at 2 PM. See you then!',
      type: 'text',
      timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    },
    lastActivity: new Date(Date.now() - 86400000).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
];

const demoMessages: Record<string, ChatMessage[]> = {
  demo_room_test_customer: [
    {
      id: 'msg_customer_001',
      senderId: '4f34d4e0-84f3-4e3c-b443-909ea3905f58',
      senderName: 'test.customer.tirak',
      type: 'text',
      content: 'Hi, looking forward to the walk tomorrow.',
      imageUrl: null,
      metadata: null,
      timestamp: new Date(Date.now() - 1200000).toISOString(),
      isOwn: false,
    },
    {
      id: 'msg_customer_002',
      senderId: '4f34d4e0-84f3-4e3c-b443-909ea3905f58',
      senderName: 'test.customer.tirak',
      type: 'text',
      content: 'Can we meet by the main entrance?',
      imageUrl: null,
      metadata: null,
      timestamp: new Date(Date.now() - 600000).toISOString(),
      isOwn: false,
    },
  ],
  demo_room_test_companion: [
    {
      id: 'msg_test_001',
      senderId: 'user_current',
      senderName: 'You',
      type: 'text',
      content: 'Hi! I am planning a first trip to Bangkok and would love a local introduction.',
      imageUrl: null,
      metadata: null,
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      isOwn: true,
    },
    {
      id: 'msg_test_002',
      senderId: TEST_COMPANION_ID,
      senderName: 'Test Companion',
      type: 'text',
      content: 'I can help with a relaxed market and temple route, or an evening food trail. Tell me your pace and interests.',
      imageUrl: null,
      metadata: null,
      timestamp: new Date(Date.now() - 3000000).toISOString(),
      isOwn: false,
    },
    {
      id: 'msg_test_003',
      senderId: TEST_COMPANION_ID,
      senderName: 'Test Companion',
      type: 'text',
      content: 'For the guide rate, the Old Town walk starts at ฿1,800 for a half day.',
      imageUrl: null,
      metadata: null,
      timestamp: new Date(Date.now() - 1200000).toISOString(),
      isOwn: false,
    },
  ],
  demo_room_001: [
    {
      id: 'msg_001',
      senderId: 'user_current',
      senderName: 'You',
      type: 'text',
      content: 'Hi Somchai! I\'m excited about the Bangkok tour tomorrow.',
      imageUrl: null,
      metadata: null,
      timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
      isOwn: true,
    },
    {
      id: 'msg_002',
      senderId: 'companion_001',
      senderName: 'Somchai Guide',
      type: 'text',
      content: 'Hello! Yes, we\'ll start at the Grand Palace at 9 AM. Wear comfortable shoes!',
      imageUrl: null,
      metadata: null,
      timestamp: new Date(Date.now() - 86400000 * 2 + 300000).toISOString(),
      isOwn: false,
    },
    {
      id: 'msg_003',
      senderId: 'user_current',
      senderName: 'You',
      type: 'text',
      content: 'Perfect! Should I bring anything special?',
      imageUrl: null,
      metadata: null,
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      isOwn: true,
    },
    {
      id: 'msg_004',
      senderId: 'companion_001',
      senderName: 'Somchai Guide',
      type: 'text',
      content: 'Just your camera and water! I\'ll provide everything else. Looking forward to our Bangkok tour tomorrow!',
      imageUrl: null,
      metadata: null,
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      isOwn: false,
    },
  ],
  demo_room_002: [
    {
      id: 'msg_101',
      senderId: 'user_current',
      senderName: 'You',
      type: 'text',
      content: 'Hi Areeya! I booked the Thai cooking class.',
      imageUrl: null,
      metadata: null,
      timestamp: new Date(Date.now() - 86400000 * 3).toISOString(),
      isOwn: true,
    },
    {
      id: 'msg_102',
      senderId: 'companion_002',
      senderName: 'Areeya Thai',
      type: 'text',
      content: 'Welcome! We\'ll be making Pad Thai and Tom Yum soup.',
      imageUrl: null,
      metadata: null,
      timestamp: new Date(Date.now() - 86400000 * 3 + 600000).toISOString(),
      isOwn: false,
    },
    {
      id: 'msg_103',
      senderId: 'user_current',
      senderName: 'You',
      type: 'text',
      content: 'That sounds amazing! What time should I arrive?',
      imageUrl: null,
      metadata: null,
      timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
      isOwn: true,
    },
    {
      id: 'msg_104',
      senderId: 'companion_002',
      senderName: 'Areeya Thai',
      type: 'text',
      content: 'The cooking class will start at 2 PM. See you then!',
      imageUrl: null,
      metadata: null,
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      isOwn: false,
    },
  ],
};

// ─── API helpers ──────────────────────────────────────────────────────────────

/** List all chat rooms for the current user. */
export async function getRooms(): Promise<ChatRoom[]> {
  const data = await apiGet<{ items: ChatRoom[] }>('/api/chat/rooms');
  return data?.items || [];
}

/**
 * Create or retrieve a chat room between the current user and `otherUserId`.
 * Returns the room UUID or null on failure.
 */
export async function createOrGetRoom(otherUserId: string): Promise<string | null> {
  if (isTestCompanionId(otherUserId)) {
    return 'demo_room_test_companion';
  }

  if (otherUserId === 'companion_001') {
    return 'demo_room_001';
  }

  if (otherUserId === 'companion_002') {
    return 'demo_room_002';
  }

  const data = await apiPost<{ roomId: string; existed: boolean }>(
    '/api/chat/rooms',
    { otherUserId },
  );
  return data?.roomId ?? null;
}

/** Load room metadata + first page of messages (newest-first, reversed to chrono). */
export async function getRoomDetail(roomId: string): Promise<RoomDetail | null> {
  // Return demo room detail for demo rooms
  if (roomId.startsWith('demo_room_')) {
    const room = demoRooms.find(r => r.id === roomId);
    const messages = demoMessages[roomId] || [];
    if (room) {
      logger.log('Returning demo room detail for:', roomId);
      return {
        id: roomId,
        status: room.status,
        otherParty: room.otherParty,
        messages: messages,
        pagination: { page: 1, limit: 50, total: messages.length, totalPages: 1 },
        createdAt: room.createdAt,
      };
    }
  }
  return apiGet<RoomDetail>(`/api/chat/rooms/${roomId}`);
}

/** Send a text message to a room. Returns the persisted message or null. */
export async function sendMessage(
  roomId: string,
  content: string,
  messageType: 'text' | 'image' = 'text',
): Promise<ChatMessage | null> {
  if (roomId.startsWith('demo_room_')) {
    const timestamp = new Date().toISOString();
    const message: ChatMessage = {
      id: `demo_msg_${Date.now()}`,
      senderId: 'user_current',
      senderName: 'You',
      type: messageType,
      content,
      imageUrl: null,
      metadata: null,
      timestamp,
      isOwn: true,
    };
    demoMessages[roomId] = [...(demoMessages[roomId] || []), message];
    const room = demoRooms.find((item) => item.id === roomId);
    if (room) {
      room.lastMessage = {
        content,
        type: messageType,
        timestamp,
        senderId: message.senderId,
        senderName: message.senderName,
        isOwn: true,
      };
      room.lastActivity = timestamp;
    }
    return message;
  }

  return apiPost<ChatMessage>(`/api/chat/rooms/${roomId}/messages`, {
    roomId,
    messageType,
    content,
  });
}

/** Returns true if `id` looks like a UUID (real room ID or user ID). */
export function isUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

/**
 * Format a backend ISO timestamp to a relative label
 * ("2 min ago", "1 hour ago", etc.)
 */
export function formatRelativeTime(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins} min ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } catch {
    return '';
  }
}
