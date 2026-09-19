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
  bookingId?: string;
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

// ─── API helpers ──────────────────────────────────────────────────────────────

/** List all chat rooms for the current user. */
export async function getRooms(): Promise<ChatRoom[]> {
  if (!(await getAuthToken())) return [];
  const data = await apiGet<{ items: ChatRoom[] }>('/api/chat/rooms');
  if (!data) throw new Error('We could not load your conversations. Check your connection and try again.');
  return (data.items || []).filter(room => !room.id.startsWith('demo_room_'));
}

/**
 * Create or retrieve a room for a confirmed/in-progress booking.
 * Returns the room UUID or null on failure.
 */
export async function createOrGetRoom(bookingId: string): Promise<string | null> {
  const data = await apiPost<{ roomId: string; existed: boolean }>(
    '/api/chat/rooms',
    { bookingId },
  );
  return data?.roomId ?? null;
}

/** Exchange bearer authentication for a short-lived, single-use socket credential. */
export async function getSocketTicket(roomId: string): Promise<string | null> {
  if (roomId.startsWith('demo_room_')) return null;
  const data = await apiPost<{ ticket: string; expiresInSeconds: number }>(
    `/api/chat/rooms/${encodeURIComponent(roomId)}/socket-ticket`,
    {},
  );
  return typeof data?.ticket === 'string' && data.ticket ? data.ticket : null;
}

export function buildChatSocketUrl(roomId: string, ticket: string): string {
  const base = BACKEND_URL.replace(/^https:/, 'wss:').replace(/^http:/, 'ws:');
  return `${base}/api/chat/rooms/${encodeURIComponent(roomId)}/ws?ticket=${encodeURIComponent(ticket)}`;
}

type ParticipantChatResult = { roomId: string } | { roomId: null; reason: 'booking_required' | 'unavailable' };

/** Resolve profile links through the same booking policy enforced by the server. */
export async function resolveParticipantChat(otherUserId: string): Promise<ParticipantChatResult> {
  const rooms = await apiGet<{ items: ChatRoom[] }>('/api/chat/rooms');
  if (!rooms) return { roomId: null, reason: 'unavailable' };
  const existing = rooms.items.find(room => room.otherParty.id === otherUserId && !room.id.startsWith('demo_room_'));
  if (existing) return { roomId: existing.id };

  interface ChatBooking {
    id: string;
    status: string;
    companionId?: string;
    customerId?: string;
    companion?: { id: string };
    customer?: { id: string };
  }
  let page = 1;
  let totalPages = 1;
  do {
    const data = await apiGet<{ items?: ChatBooking[]; bookings?: ChatBooking[]; pagination?: { totalPages: number } }>(`/api/bookings?page=${page}&limit=100`);
    if (!data) return { roomId: null, reason: 'unavailable' };
    const booking = (data.items || data.bookings || []).find(item =>
      !item.id.startsWith('demo_booking_') && ['confirmed', 'in_progress'].includes(item.status) &&
      [item.companionId, item.customerId, item.companion?.id, item.customer?.id].includes(otherUserId)
    );
    if (booking) {
      const roomId = await createOrGetRoom(booking.id);
      return roomId ? { roomId } : { roomId: null, reason: 'unavailable' };
    }
    totalPages = data.pagination?.totalPages || 1;
    page += 1;
  } while (page <= totalPages);
  return { roomId: null, reason: 'booking_required' };
}

/** Durable Object events have a different envelope from the REST message API. */
export function normalizeRealtimeMessage(event: any, currentUserId: string): ChatMessage | null {
  if (event?.type !== 'message_received') return null;
  const message = event.data;
  if (!message?.id || !message.senderId || !message.timestamp) return null;
  return {
    id: message.id,
    senderId: message.senderId,
    senderName: message.senderName || null,
    type: message.messageType === 'image' ? 'image' : 'text',
    content: message.content || null,
    imageUrl: message.mediaUrl || null,
    metadata: null,
    timestamp: message.timestamp,
    isOwn: message.senderId === currentUserId,
  };
}

/** Load room metadata + first page of messages (newest-first, reversed to chrono). */
export async function getRoomDetail(roomId: string): Promise<RoomDetail | null> {
  if (roomId.startsWith('demo_room_')) return null;
  return apiGet<RoomDetail>(`/api/chat/rooms/${roomId}`);
}

/** Send a text message to a room. Returns the persisted message or null. */
export async function sendMessage(
  roomId: string,
  content: string,
  messageType: 'text' | 'image' = 'text',
): Promise<ChatMessage | null> {
  if (roomId.startsWith('demo_room_')) return null;
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
