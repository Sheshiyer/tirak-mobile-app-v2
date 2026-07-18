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

jest.mock('@/utils/api-errors', () => ({
  handleApiError: jest.fn(),
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
      bookingId: 'booking-1',
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

  test('returns no rooms when the authenticated backend has no confirmed-booking chats', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { items: [] } }),
    });

    const rooms = await getRooms();

    expect(rooms).toEqual([]);
  });

  test('does not call the backend or synthesize rooms without an auth token', async () => {
    mockGetItemAsync.mockResolvedValueOnce(null);

    const rooms = await getRooms();

    expect(mockFetch).not.toHaveBeenCalled();
    expect(rooms).toEqual([]);
  });

  test('creates backend rooms for real users', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { roomId: 'room-real', existed: false } }),
    });

    await expect(createOrGetRoom('real-user-id', 'booking-123')).resolves.toBe('room-real');
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

  test('refuses to create pre-booking chat rooms', async () => {
    await expect(createOrGetRoom('real-user-id')).resolves.toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  test('never bypasses the backend for review or legacy guide identifiers', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { roomId: 'room-seeded', existed: true } }),
    });

    await expect(
      createOrGetRoom('30c6d267-22d1-4cd0-8bdc-46993c14c143', 'review-booking'),
    ).resolves.toBe('room-seeded');
    expect(mockFetch).toHaveBeenCalledWith(
      'https://chat.test/api/chat/rooms',
      expect.objectContaining({ body: JSON.stringify({ bookingId: 'review-booking' }) }),
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
});
