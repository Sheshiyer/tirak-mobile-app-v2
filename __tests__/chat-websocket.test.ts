import { bookingMessageFromSocketEvent } from '@/utils/chat-websocket';

describe('booking chat WebSocket contract', () => {
  test('maps the Durable Object message_received data envelope', () => {
    expect(bookingMessageFromSocketEvent({
      type: 'message_received',
      data: {
        id: 'message-1',
        senderId: 'guide-1',
        content: 'Meet at the east entrance.',
        messageType: 'text',
        timestamp: '2026-08-10T09:00:00.000Z',
      },
    }, 'traveler-1')).toEqual({
      id: 'message-1',
      senderId: 'guide-1',
      content: 'Meet at the east entrance.',
      type: 'text',
      imageUrl: null,
      timestamp: '2026-08-10T09:00:00.000Z',
      isOwn: false,
    });
  });

  test('ignores the sender echo and unrelated event shapes', () => {
    expect(bookingMessageFromSocketEvent({
      type: 'message_received',
      data: { id: 'message-1', senderId: 'traveler-1' },
    }, 'traveler-1')).toBeNull();
    expect(bookingMessageFromSocketEvent({ type: 'new_message', message: {} }, 'traveler-1')).toBeNull();
  });
});
