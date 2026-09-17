const pendingLink = {
  id: 'cold-link-id',
  url: 'tirak://messages?scene-link-receipt=cold',
  kind: 'custom-scheme' as const,
};

jest.mock('react-native', () => ({
  NativeModules: {
    TirakSceneLink: {
      getPendingLink: jest.fn(),
      acknowledgePendingLink: jest.fn(),
      acknowledgeWarmLink: jest.fn(),
    },
  },
  Platform: { OS: 'ios' },
}));

import { NativeModules } from 'react-native';
import {
  consumePendingSceneLink,
  consumeWarmSceneLink,
  shouldEnterSplashRoute,
} from '@/utils/scene-link-consumption';

const mockGetPendingLink = NativeModules.TirakSceneLink.getPendingLink as jest.Mock;
const mockAcknowledgePendingLink = NativeModules.TirakSceneLink.acknowledgePendingLink as jest.Mock;
const mockAcknowledgeWarmLink = NativeModules.TirakSceneLink.acknowledgeWarmLink as jest.Mock;

describe('scene-link JavaScript consumption boundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPendingLink.mockResolvedValue(pendingLink);
    mockAcknowledgePendingLink.mockResolvedValue(true);
    mockAcknowledgeWarmLink.mockResolvedValue(undefined);
  });

  it('acknowledges the exact cold link only after JavaScript handles it', async () => {
    const order: string[] = [];
    const handleLink = jest.fn(async (url: string) => {
      expect(url).toBe('tirak://messages?scene-link-receipt=cold');
      order.push('handled');
    });
    mockAcknowledgePendingLink.mockImplementation(async (id: string) => {
      expect(id).toBe('cold-link-id');
      order.push('acknowledged');
      return true;
    });

    await expect(consumePendingSceneLink(handleLink)).resolves.toBe(true);

    expect(handleLink).toHaveBeenCalledTimes(1);
    expect(order).toEqual(['handled', 'acknowledged']);
  });

  it('leaves the cold link pending when JavaScript handling fails', async () => {
    const error = new Error('routing failed');

    await expect(
      consumePendingSceneLink(async () => {
        throw error;
      }),
    ).rejects.toBe(error);

    expect(mockAcknowledgePendingLink).not.toHaveBeenCalled();
  });

  it('fails closed when native rejects the exact cold-link acknowledgement', async () => {
    const handleLink = jest.fn().mockResolvedValue(undefined);
    mockAcknowledgePendingLink.mockResolvedValue(false);

    await expect(consumePendingSceneLink(handleLink)).rejects.toThrow(
      'Native scene-link acknowledgement was rejected',
    );

    expect(handleLink).toHaveBeenCalledTimes(1);
    expect(mockAcknowledgePendingLink).toHaveBeenCalledWith('cold-link-id');
  });

  it('does not acknowledge a malformed native pending-link response', async () => {
    mockGetPendingLink.mockResolvedValue({ id: '', url: pendingLink.url, kind: pendingLink.kind });

    await expect(consumePendingSceneLink(jest.fn())).resolves.toBe(false);

    expect(mockAcknowledgePendingLink).not.toHaveBeenCalled();
  });

  it('records a warm receipt only after the existing link handler runs', async () => {
    const order: string[] = [];
    const warmURL = 'tirak://messages?scene-link-receipt=warm';
    const handleLink = jest.fn(async () => {
      order.push('handled');
    });
    mockAcknowledgeWarmLink.mockImplementation(async (url: string) => {
      expect(url).toBe(warmURL);
      order.push('acknowledged');
    });

    await consumeWarmSceneLink(warmURL, handleLink);

    expect(handleLink).toHaveBeenCalledTimes(1);
    expect(order).toEqual(['handled', 'acknowledged']);
  });

  it('does not record a warm receipt when the existing link handler fails', async () => {
    const error = new Error('warm routing failed');

    await expect(
      consumeWarmSceneLink(pendingLink.url, async () => {
        throw error;
      }),
    ).rejects.toBe(error);

    expect(mockAcknowledgeWarmLink).not.toHaveBeenCalled();
  });

  it('does not replace an iOS cold-link route with the splash route', () => {
    expect(shouldEnterSplashRoute(null)).toBe(true);
    expect(shouldEnterSplashRoute('tirak://messages')).toBe(false);
  });
});
