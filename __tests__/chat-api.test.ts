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

  test('preserves an authenticated empty room list', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { items: [] } }),
    });

    await expect(getRooms()).resolves.toEqual([]);
  });

  test('does not fabricate rooms when authentication is missing', async () => {
    mockGetItemAsync.mockResolvedValueOnce(null);

    await expect(getRooms()).resolves.toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  test('does not fabricate rooms when the transport fails', async () => {
    mockFetch.mockRejectedValueOnce(new Error('offline'));

    await expect(getRooms()).resolves.toEqual([]);
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

  test('routes every companion through the authenticated backend', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { roomId: 'room-review', existed: true } }),
    });

    await expect(
      createOrGetRoom('30c6d267-22d1-4cd0-8bdc-46993c14c143'),
    ).resolves.toBe('room-review');
    expect(mockFetch).toHaveBeenCalledWith(
      'https://chat.test/api/chat/rooms',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          otherUserId: '30c6d267-22d1-4cd0-8bdc-46993c14c143',
        }),
      }),
    );
  });

  test('does not load demo-looking rooms from client fixtures', async () => {
    const detail = {
      id: 'demo_room_test_companion',
      status: 'active',
      otherParty: { id: 'server-user', name: 'Server User', image: null, type: 'supplier' },
      messages: [],
      pagination: { page: 1, limit: 50, total: 0, totalPages: 0 },
      createdAt: '2026-05-20T07:00:00.000Z',
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: detail }),
    });

    await expect(getRoomDetail('demo_room_test_companion')).resolves.toEqual(detail);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://chat.test/api/chat/rooms/demo_room_test_companion',
      { headers: { Authorization: 'Bearer token-123' } },
    );
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
    expect(mockFetch).toHaveBeenCalledWith(
      'https://chat.test/api/chat/rooms/demo_room_test_companion/messages',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          roomId: 'demo_room_test_companion',
          messageType: 'text',
          content: 'Can we meet at 10?',
        }),
      }),
    );
  });
});
