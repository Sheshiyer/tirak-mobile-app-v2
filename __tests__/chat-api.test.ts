const mockGetItemAsync = jest.fn<Promise<string | null>, [string]>();

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

const mockFetch = jest.fn();

global.fetch = mockFetch as unknown as typeof fetch;

const {
  createOrGetRoom,
  getRoomDetail,
  getRooms,
  sendMessage,
} = require('@/utils/chat-api');

describe('chat-api service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetItemAsync.mockResolvedValue('token-123');
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

  test('falls back to review chat rooms when backend has no rooms', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { items: [] } }),
    });

    const rooms = await getRooms();

    expect(rooms.length).toBeGreaterThan(0);
    expect(rooms.some((room: any) => room.id === 'demo_room_test_companion')).toBe(true);
  });

  test('does not call the backend without an auth token and still exposes review rooms', async () => {
    mockGetItemAsync.mockResolvedValueOnce(null);

    const rooms = await getRooms();

    expect(mockFetch).not.toHaveBeenCalled();
    expect(rooms.some((room: any) => room.id === 'demo_room_test_companion')).toBe(true);
  });

  test('creates backend rooms for real users', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { roomId: 'room-real', existed: false } }),
    });

    await expect(createOrGetRoom('real-user-id')).resolves.toBe('room-real');
    expect(mockFetch).toHaveBeenCalledWith(
      'https://chat.test/api/chat/rooms',
      {
        method: 'POST',
        headers: {
          Authorization: 'Bearer token-123',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ otherUserId: 'real-user-id' }),
      },
    );
  });

  test('routes review companions to deterministic demo rooms', async () => {
    await expect(createOrGetRoom('30c6d267-22d1-4cd0-8bdc-46993c14c143')).resolves.toBe(
      'demo_room_test_companion',
    );
    await expect(createOrGetRoom('companion_001')).resolves.toBe('demo_room_001');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  test('loads demo room detail and appends sent demo messages', async () => {
    const before = await getRoomDetail('demo_room_test_companion');

    const sent = await sendMessage('demo_room_test_companion', 'Can we meet at 10?');
    const after = await getRoomDetail('demo_room_test_companion');

    expect(sent).toMatchObject({
      senderId: 'user_current',
      senderName: 'You',
      type: 'text',
      content: 'Can we meet at 10?',
      isOwn: true,
    });
    expect(after?.messages).toHaveLength((before?.messages.length ?? 0) + 1);
    expect(after?.messages.at(-1)).toMatchObject({ content: 'Can we meet at 10?' });
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
});
