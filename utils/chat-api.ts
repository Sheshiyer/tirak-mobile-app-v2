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
  const data = await apiGet<{ items: ChatRoom[] }>('/api/chat/rooms');
  return data?.items ?? [];
}

/**
 * Create or retrieve a chat room between the current user and `otherUserId`.
 * Returns the room UUID or null on failure.
 */
export async function createOrGetRoom(otherUserId: string): Promise<string | null> {
  const data = await apiPost<{ roomId: string; existed: boolean }>(
    '/api/chat/rooms',
    { otherUserId },
  );
  return data?.roomId ?? null;
}

/** Load room metadata + first page of messages (newest-first, reversed to chrono). */
export async function getRoomDetail(roomId: string): Promise<RoomDetail | null> {
  return apiGet<RoomDetail>(`/api/chat/rooms/${roomId}`);
}

/** Send a text message to a room. Returns the persisted message or null. */
export async function sendMessage(
  roomId: string,
  content: string,
  messageType: 'text' | 'image' = 'text',
): Promise<ChatMessage | null> {
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
