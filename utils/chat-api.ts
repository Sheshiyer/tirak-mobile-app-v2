/**
 * Booking-scoped chat API utilities for Tirak.
 *
 * Chat rooms and messages are always persisted by the backend. The client does
 * not synthesize review conversations or create a room from a person ID.
 */

import { API_BASE_URL } from '@/constants/api';
import { handleApiError } from './api-errors';
import { logger } from './logger';
import { secureStorage } from './secure-storage';

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
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      logger.warn('apiGet failed:', response.status, url);
      handleApiError({
        response: {
          status: response.status,
          data: await response.clone().json().catch(() => null),
        },
      });
      return null;
    }

    const json = await response.json() as { success: boolean; data: T };
    return json.success ? json.data : null;
  } catch (error) {
    logger.error('apiGet error:', error);
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
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      logger.warn('apiPost failed:', response.status, url);
      if (response.status === 401 || response.status === 403) {
        handleApiError({
          response: {
            status: response.status,
            data: await response.clone().json().catch(() => null),
          },
        });
      }
      return null;
    }

    const json = await response.json() as { success: boolean; data: T };
    return json.success ? json.data : null;
  } catch (error) {
    logger.error('apiPost error:', error);
    return null;
  }
}

export interface OtherParty {
  id: string;
  name: string | null;
  image: string | null;
  type: 'supplier' | 'customer';
}

export interface ChatRoom {
  id: string;
  bookingId: string;
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
  bookingId: string;
  status: string;
  otherParty: OtherParty;
  messages: ChatMessage[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  createdAt: string;
}

/** List persisted booking chat rooms for the current user. */
export async function getRooms(): Promise<ChatRoom[]> {
  const data = await apiGet<{ items: ChatRoom[] }>('/api/chat/rooms');
  return (data?.items || []).filter((room) => Boolean(room.bookingId));
}

/**
 * Create or retrieve the room for a confirmed booking. `otherUserId` remains a
 * compatibility argument for existing callers, but it is never sent or trusted;
 * the backend derives both participants from the booking.
 */
export async function createOrGetRoom(
  _otherUserId: string,
  bookingId?: string,
): Promise<string | null> {
  if (!bookingId) {
    logger.warn('createOrGetRoom: bookingId is required for booking-scoped chat');
    return null;
  }

  const data = await apiPost<{ roomId: string; existed: boolean }>(
    '/api/chat/rooms',
    { bookingId },
  );
  return data?.roomId ?? null;
}

/** Load persisted room metadata and messages. */
export async function getRoomDetail(roomId: string): Promise<RoomDetail | null> {
  return apiGet<RoomDetail>(`/api/chat/rooms/${encodeURIComponent(roomId)}`);
}

/** Send a persisted logistics message to an existing booking room. */
export async function sendMessage(
  roomId: string,
  content: string,
  messageType: 'text' | 'image' = 'text',
): Promise<ChatMessage | null> {
  return apiPost<ChatMessage>(`/api/chat/rooms/${encodeURIComponent(roomId)}/messages`, {
    roomId,
    messageType,
    content,
  });
}

export function isUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

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
