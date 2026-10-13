import React from 'react';
import { render } from '@testing-library/react-native';
import axios from 'axios';
import {
  isTestCompanion,
  isTestCompanionId,
  TEST_COMPANION_EMAIL,
  TEST_COMPANION_ID,
} from '@/utils/companion-display';
import { isCoreQaEnvironment } from '@/utils/qa-env';
import { QaEnvironmentBadge } from '@/components/ui/QaEnvironmentBadge';
import { CORE_QA_API_URL } from '@/utils/qa-env';

jest.mock('expo/virtual/env', () => ({ get env() { return process.env; } }));

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

jest.mock('@/stores/auth-store', () => ({
  useAuthStore: Object.assign(jest.fn(() => null), {
    getState: () => ({ user: { id: 'real-user' } }),
  }),
}));

jest.mock('@/utils/secure-storage', () => ({
  secureStorage: {
    getItemAsync: jest.fn().mockResolvedValue(null),
    setItemAsync: jest.fn().mockResolvedValue(undefined),
    deleteItemAsync: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('@/utils/demo-mode', () => ({
  getDemoModeEnabled: jest.fn().mockResolvedValue(false),
  getReviewModeEnabled: jest.fn().mockResolvedValue(false),
  isDemoModeEnabled: () => false,
}));

jest.mock('@/constants/api', () => ({
  apiUrl: (path: string) => `https://api.test${path}`,
}));

jest.mock('@/utils/logger', () => ({
  logger: { log: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

const { fetchCompanions, fetchCompanionById, fetchCompanionAvailability, useCompanions } = require('@/services/api/companion/companion');

describe('Public companion search encoding and pagination', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('encodes page, limit, price range, rating, availability, and passes AbortSignal', async () => {
    const controller = new AbortController();
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          companions: [
            { id: 'guide-1', displayName: 'Guide 1', email: 'guide1@example.com' },
          ],
          pagination: { page: 3, limit: 20, total: 100, totalPages: 5 },
        },
      },
    });

    const response = await fetchCompanions(
      {
        page: 3,
        limit: 20,
        minPrice: 500,
        maxPrice: 3000,
        rating: 4.5,
        available: true,
        verified: true,
        search: 'Bangkok',
        category: 'culture',
        location: 'Bangkok',
      },
      controller.signal,
    );

    expect(response.data.companions).toHaveLength(1);
    expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.stringContaining('/api/companions?'),
      expect.objectContaining({
        signal: controller.signal,
      }),
    );

    const callUrl = mockedAxios.get.mock.calls[0][0] as string;
    expect(callUrl).toContain('page=3');
    expect(callUrl).toContain('limit=20');
    expect(callUrl).toContain('minPrice=500');
    expect(callUrl).toContain('maxPrice=3000');
    expect(callUrl).toContain('rating=4.5');
    expect(callUrl).toContain('available=true');
    expect(callUrl).toContain('verified=true');
    expect(callUrl).toContain('search=Bangkok');
    expect(callUrl).toContain('category=culture');
  });
});

describe('Companion display test fixture exclusion rules', () => {
  test('matches exact test companion ID and test companion email', () => {
    expect(isTestCompanionId(TEST_COMPANION_ID)).toBe(true);
    expect(isTestCompanion({ id: TEST_COMPANION_ID })).toBe(true);
    expect(isTestCompanion({ email: TEST_COMPANION_EMAIL })).toBe(true);
    expect(isTestCompanion({ email: 'TEST.COMPANION.TIRAK@GMAIL.COM ' })).toBe(true);
  });

  test('does not reject ordinary vendor accounts named "Test Companion"', () => {
    // Normal account with display name "test companion" but legitimate non-fixture ID and email
    const normalAccount = {
      id: 'vendor-real-001',
      displayName: 'Test Companion',
      email: 'realguide@gmail.com',
    };
    expect(isTestCompanion(normalAccount)).toBe(false);
  });
});

describe('QA environment detection and badge', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('isCoreQaEnvironment returns true when EXPO_PUBLIC_ENV_NAME is core-qa', () => {
    process.env['EXPO_PUBLIC_ENV_NAME'] = 'core-qa';
    expect(isCoreQaEnvironment()).toBe(true);
  });

  test('isCoreQaEnvironment requires exact API URL match, not substring', () => {
    delete process.env['EXPO_PUBLIC_ENV_NAME'];
    process.env['EXPO_PUBLIC_API_URL'] = `${CORE_QA_API_URL}-mismatch`;
    expect(isCoreQaEnvironment()).toBe(false);
  });

  test('isCoreQaEnvironment returns true for exact core-qa API URL', () => {
    delete process.env['EXPO_PUBLIC_ENV_NAME'];
    process.env['EXPO_PUBLIC_API_URL'] = CORE_QA_API_URL;
    expect(isCoreQaEnvironment()).toBe(true);
  });

  test('isCoreQaEnvironment returns false in default/production config', () => {
    delete process.env['EXPO_PUBLIC_ENV_NAME'];
    process.env['EXPO_PUBLIC_API_URL'] = 'https://api.tirak.com/api';
    expect(isCoreQaEnvironment()).toBe(false);
  });

  test('QaEnvironmentBadge renders badge only in QA environment', () => {
    process.env['EXPO_PUBLIC_ENV_NAME'] = 'core-qa';
    const { queryByTestId } = render(<QaEnvironmentBadge />);
    expect(queryByTestId('qa-environment-badge')).toBeTruthy();
  });

  test('QaEnvironmentBadge renders null in non-QA environment', () => {
    delete process.env['EXPO_PUBLIC_ENV_NAME'];
    process.env['EXPO_PUBLIC_API_URL'] = 'https://api.tirak.com/api';
    const { queryByTestId } = render(<QaEnvironmentBadge />);
    expect(queryByTestId('qa-environment-badge')).toBeNull();
  });
});

describe("Error handling and query cancellation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("fetchCompanions preserves 400 rejection and does NOT retry without filters", async () => {
    mockedAxios.isAxiosError.mockReturnValue(true);
    mockedAxios.get.mockRejectedValueOnce({
      isAxiosError: true,
      response: {
        status: 400,
        data: { message: "Invalid filter combination" },
      },
    });

    await expect(
      fetchCompanions({ category: "invalid", page: 1 }),
    ).rejects.toThrow("Invalid filter combination");

    // Must be exactly 1 call; no second retry without filters
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.stringContaining("category=invalid"),
      expect.any(Object),
    );
  });

  test("useCompanions queryFn forwards AbortSignal", async () => {
    const controller = new AbortController();
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          companions: [],
          pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
        },
      },
    });

    const hookConfig = useCompanions({ location: "Bangkok" });
    await hookConfig.queryFn({ signal: controller.signal });

    expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.stringContaining("/api/companions?location=Bangkok"),
      expect.objectContaining({ signal: controller.signal }),
    );
  });

  test("fetchCompanionById and fetchCompanionAvailability forward AbortSignal", async () => {
    const controller = new AbortController();
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: { id: "guide-123", name: "Guide 123", displayName: "Guide 123" },
      },
    });

    await fetchCompanionById("guide-123", controller.signal);
    expect(mockedAxios.get).toHaveBeenCalledWith(
      "https://api.test/api/companions/guide-123",
      expect.objectContaining({ signal: controller.signal }),
    );

    mockedAxios.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: { availability: [] },
      },
    });

    await fetchCompanionAvailability(
      "guide-123",
      {
        startDate: "2026-10-01",
        endDate: "2026-10-07",
        startTime: "09:00",
        endTime: "17:00",
        isAvailable: true,
      },
      controller.signal,
    );
    expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.stringContaining("/api/companions/guide-123/availability?"),
      expect.objectContaining({ signal: controller.signal }),
    );
  });

  test("account switching: delayed response from Account A does not overwrite Account B", async () => {
    let currentRenderedGuide: any = null;
    let activeController: AbortController | null = null;

    const selectCompanion = async (companionId: string) => {
      if (activeController) {
        activeController.abort();
      }
      activeController = new AbortController();
      const signal = activeController.signal;

      try {
        const res = await fetchCompanionById(companionId, signal);
        if (!signal.aborted) {
          currentRenderedGuide = res.data;
        }
      } catch (err: any) {
        if (!signal.aborted) {
          throw err;
        }
      }
    };

    let resolveA: (val: any) => void = () => {};
    let resolveB: (val: any) => void = () => {};

    const promiseA = new Promise((resolve) => {
      resolveA = resolve;
    });
    const promiseB = new Promise((resolve) => {
      resolveB = resolve;
    });

    mockedAxios.get.mockImplementation((url: string) => {
      if (url.includes("guide-A")) return promiseA as any;
      if (url.includes("guide-B")) return promiseB as any;
      return Promise.resolve({ data: { success: true, data: {} } }) as any;
    });

    // Start fetching guide-A
    const actionA = selectCompanion("guide-A");

    // User switches to guide-B before guide-A completes
    const actionB = selectCompanion("guide-B");

    // guide-B responds first
    resolveB({
      data: {
        success: true,
        data: { id: "guide-B", displayName: "Guide B" },
      },
    });
    await actionB;
    expect(currentRenderedGuide).toEqual({ id: "guide-B", displayName: "Guide B" });

    // guide-A responds later (delayed response)
    resolveA({
      data: {
        success: true,
        data: { id: "guide-A", displayName: "Guide A" },
      },
    });
    await actionA;

    // Must still be Guide B; delayed response from A was cancelled and did not overwrite B
    expect(currentRenderedGuide).toEqual({ id: "guide-B", displayName: "Guide B" });
  });
});
