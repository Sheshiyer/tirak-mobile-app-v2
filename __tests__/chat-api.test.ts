const mockGetItemAsync = jest.fn<Promise<string | null>, [string]>();
jest.mock('expo/virtual/env', () => ({ env: process['env'] }));

jest.mock('@/utils/secure-storage', () => ({
  secureStorage: {
    getItemAsync: mockGetItemAsync,
  },
}));

jest.mock('@/constants/api', () => ({
  API_BASE_URL: 'https://chat.test',
}));

jest.mock('@/utils/logger', () => ({
  logger: {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('@/utils/api-errors', () => ({ handleApiError: jest.fn() }));

const mockFetch = jest.fn();

global.fetch = mockFetch as unknown as typeof fetch;

const {
  createOrGetRoom,
  resolveParticipantChat,
  normalizeRealtimeMessage,
  getSocketTicket,
  buildChatSocketUrl,
  getRoomDetail,
  getRooms,
  sendMessage,
} = require('@/utils/chat-api');

describe('chat-api service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
    delete process.env.EXPO_PUBLIC_DEMO_MODE;
    mockGetItemAsync.mockImplementation(async (key) => key === 'authToken' ? 'token-123' : JSON.stringify({ id: 'ordinary-user', email: 'real@example.com' }));
  });

  test('loads backend chat rooms with bearer auth', async () => {
    const room = {
      id: 'room-1',
      status: 'active',
      otherParty: {
        id: 'supplier-1',
        name: 'Local Guide',
        image: null,
        type: 'supplier',
      },
      lastMessage: {
        content: 'See you tomorrow',
        type: 'text',
        timestamp: '2026-05-20T08:00:00.000Z',
      },
      lastActivity: '2026-05-20T08:00:00.000Z',
      createdAt: '2026-05-20T07:00:00.000Z',
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { items: [room] } }),
    });

    await expect(getRooms()).resolves.toEqual([room]);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://chat.test/api/chat/rooms',
      { headers: { Authorization: 'Bearer token-123' } },
    );
  });

  test('does not invent review conversations when backend has no rooms', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { items: [] } }),
    });

    const rooms = await getRooms();

    expect(rooms).toEqual([]);
  });

  test('does not call the backend or expose review rooms without an auth token', async () => {
    mockGetItemAsync.mockResolvedValueOnce(null);

    await expect(getRooms()).resolves.toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  test('creates backend rooms using the confirmed booking contract', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { roomId: 'room-real', existed: false } }),
    });

    await expect(createOrGetRoom('booking-123')).resolves.toBe('room-real');
    expect(mockFetch).toHaveBeenCalledWith(
      'https://chat.test/api/chat/rooms',
      {
        method: 'POST',
        headers: {
          Authorization: 'Bearer token-123',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bookingId: 'booking-123' }),
      },
    );
  });

  test('blocks local demo-room detail and delivery for normal users', async () => {
    await expect(getRoomDetail('demo_room_test_companion')).resolves.toBeNull();
    await expect(sendMessage('demo_room_test_companion', 'Hello')).resolves.toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  test('does not restore fabricated chat even in an explicitly enabled demo session', async () => {
    process.env.EXPO_PUBLIC_DEMO_MODE = 'true';
    mockGetItemAsync.mockImplementation(async (key) => key === 'authToken' ? 'token-123' : JSON.stringify({ id: 'demo_customer_001' }));
    await expect(getRoomDetail('demo_room_test_companion')).resolves.toBeNull();
    await expect(sendMessage('demo_room_test_companion', 'Can we meet at 10?')).resolves.toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  test('resolves an existing participant room without creating a new one', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, data: { items: [{ id: 'room-existing', otherParty: { id: 'guide-1' } }] } }) });
    await expect(resolveParticipantChat('guide-1')).resolves.toEqual({ roomId: 'room-existing' });
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  test('uses a matching eligible booking to open a participant chat', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, data: { items: [] } }) });
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, data: { items: [
      { id: 'pending-booking', status: 'pending', companionId: 'guide-1' },
      { id: 'confirmed-booking', status: 'confirmed', companionId: 'guide-1' },
    ], pagination: { totalPages: 1 } } }) });
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, data: { roomId: 'room-new' } }) });
    await expect(resolveParticipantChat('guide-1')).resolves.toEqual({ roomId: 'room-new' });
    expect(mockFetch).toHaveBeenLastCalledWith('https://chat.test/api/chat/rooms', expect.objectContaining({ body: JSON.stringify({ bookingId: 'confirmed-booking' }) }));
  });

  test('shows booking requirement instead of trying a user-id room POST', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ success: true, data: { items: [], pagination: { totalPages: 1 } } }) });
    await expect(resolveParticipantChat('guide-1')).resolves.toEqual({ roomId: null, reason: 'booking_required' });
    expect(mockFetch.mock.calls.every(([, options]: any[]) => !options.method)).toBe(true);
  });

  test('normalizes the durable-object message_received event', () => {
    expect(normalizeRealtimeMessage({ type: 'message_received', data: { id: 'msg-1', senderId: 'guide-1', messageType: 'text', content: 'Hello', timestamp: '2026-09-19T10:00:00Z' } }, 'traveler-1')).toMatchObject({ id: 'msg-1', type: 'text', isOwn: false, content: 'Hello' });
    expect(normalizeRealtimeMessage({ type: 'typing_start', data: {} }, 'traveler-1')).toBeNull();
  });

  test('returns a failed send without inventing a persisted message', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 503 });
    await expect(sendMessage('room-real', 'Keep this draft')).resolves.toBeNull();
  });

  test('distinguishes a conversation-load failure from an empty inbox', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network unavailable'));
    await expect(getRooms()).rejects.toThrow('could not load');
  });

  test('exchanges bearer auth for a room-bound socket ticket', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, data: { ticket: 'one-use-ticket', expiresInSeconds: 60 } }) });
    await expect(getSocketTicket('room-real')).resolves.toBe('one-use-ticket');
    expect(mockFetch).toHaveBeenCalledWith('https://chat.test/api/chat/rooms/room-real/socket-ticket', {
      method: 'POST',
      headers: { Authorization: 'Bearer token-123', 'Content-Type': 'application/json' },
      body: '{}',
    });
    const socketUrl = new URL(buildChatSocketUrl('room-real', 'one-use-ticket'));
    expect(socketUrl.protocol).toBe('wss:');
    expect(socketUrl.pathname).toBe('/api/chat/rooms/room-real/ws');
    expect(Array.from(socketUrl.searchParams.keys())).toEqual(['ticket']);
    expect(socketUrl.searchParams.get('ticket')).toBe('one-use-ticket');
    expect(socketUrl.toString()).not.toContain('token-123');
  });

  test('does not offer a socket ticket after failed auth or for local demo rooms', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 503 });
    await expect(getSocketTicket('room-real')).resolves.toBeNull();
    mockFetch.mockClear();
    await expect(getSocketTicket('demo_room_001')).resolves.toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  test('posts real room messages to the backend', async () => {
    const message = {
      id: 'msg-real',
      senderId: 'current-user',
      senderName: 'You',
      type: 'text',
      content: 'Hello',
      imageUrl: null,
      metadata: null,
      timestamp: '2026-05-20T09:00:00.000Z',
      isOwn: true,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: message }),
    });

    await expect(sendMessage('room-real', 'Hello')).resolves.toEqual(message);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://chat.test/api/chat/rooms/room-real/messages',
      {
        method: 'POST',
        headers: {
          Authorization: 'Bearer token-123',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roomId: 'room-real', messageType: 'text', content: 'Hello' }),
      },
    );
  });

  test('does not fake persistence for demo-looking room IDs', async () => {
    mockFetch.mockRejectedValueOnce(new Error('offline'));

    await expect(
      sendMessage('demo_room_test_companion', 'Can we meet at 10?'),
    ).resolves.toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
