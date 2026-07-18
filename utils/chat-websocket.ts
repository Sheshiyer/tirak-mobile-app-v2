import type { ChatMessage } from '@/utils/chat-api';

export type RealtimeChatMessage = Pick<
  ChatMessage,
  'id' | 'senderId' | 'content' | 'type' | 'imageUrl' | 'timestamp' | 'isOwn'
>;

type SocketEnvelope = {
  type?: unknown;
  data?: Record<string, unknown>;
};

/** Convert the backend Durable Object envelope into the persisted mobile shape. */
export function bookingMessageFromSocketEvent(
  event: unknown,
  currentUserId: string,
): RealtimeChatMessage | null {
  const envelope = event as SocketEnvelope | null;
  const data = envelope?.data;

  if (
    envelope?.type !== 'message_received'
    || !data
    || typeof data.id !== 'string'
    || typeof data.senderId !== 'string'
    || data.senderId === currentUserId
    || typeof data.timestamp !== 'string'
  ) {
    return null;
  }

  const messageType = data.messageType === 'image' ? 'image' : 'text';

  return {
    id: data.id,
    senderId: data.senderId,
    content: typeof data.content === 'string' ? data.content : null,
    type: messageType,
    imageUrl: typeof data.mediaUrl === 'string' ? data.mediaUrl : null,
    timestamp: data.timestamp,
    isOwn: false,
  };
}
