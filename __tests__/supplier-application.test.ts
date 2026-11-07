import type {
  SupplierSignupData,
  SupplierApplicationReceipt,
  SupplierApplicationStatusResponse,
} from '@/types/supplier';

// --- Mocks ---
const mockPost = jest.fn();
const mockGet = jest.fn();

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn().mockResolvedValue(null),
    setItem: jest.fn().mockResolvedValue(undefined),
    removeItem: jest.fn().mockResolvedValue(undefined),
    multiRemove: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    post: (...args: unknown[]) => mockPost(...args),
    get: (...args: unknown[]) => mockGet(...args),
    isAxiosError: (err: unknown) => (err as any)?.isAxiosError === true,
  },
}));

jest.mock('@/constants/api', () => ({
  apiUrl: (path: string) => `https://api.test${path}`,
}));

jest.mock('@/utils/logger', () => ({
  logger: { log: jest.fn(), warn: jest.fn() },
}));

const {
  submitSupplierApplication,
  getApplicationStatus,
  uploadEvidence,
  buildApplicationPayload,
  mapScheduleToCanonical,
  newIdempotencyKey,
  isValidUuid,
} = require('@/services/api/supplier/applications');

const { useSupplierStore } = require('@/stores/supplier-store');

// --- Fixtures ---

function makeSignupData(
  overrides?: Partial<SupplierSignupData>,
): SupplierSignupData {
  return {
    step: 8,
    basicInfo: {
      firstName: 'Somchai',
      lastName: 'Test',
      displayName: 'Somchai Guide',
      phone: '0812345678',
      email: 'Test@Example.COM ',
      bio: 'Experienced Bangkok guide with cultural expertise.',
    },
    idVerification: {
      idCardFront: 'file:///id_front.jpg',
      idCardBack: 'file:///id_back.jpg',
      selfieWithId: 'file:///selfie.jpg',
    },
    photos: ['file:///photo1.jpg', 'file:///photo2.jpg'],
    categories: ['Culture'],
    services: [
      {
        id: 'serv-1',
        name: 'City Tour',
        description: 'Full day Bangkok tour',
        price: 2500,
        duration: 8,
        isActive: true,
      },
    ],
    regions: ['reg-001'],
    languages: ['English', 'Thai'],
    interests: ['Culture', 'Temples'],
    availability: {
      weeklySchedule: {
        monday: [{ start: '09:00', end: '17:00' }],
        tuesday: [],
        wednesday: [{ start: '10:00', end: '15:00' }],
        thursday: [],
        friday: [{ start: '09:00', end: '17:00' }],
        saturday: [],
        sunday: [{ start: '08:00', end: '12:00' }],
      },
      exceptions: [],
    },
    applicationReceipt: null,
    idempotencyKey: null,
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  useSupplierStore.getState().clearSupplierState();
});

describe('UUID validator', () => {
  test('validates valid v4 UUIDs', () => {
    expect(isValidUuid('30c6d267-22d1-4cd0-8bdc-46993c14c143')).toBe(true);
    expect(isValidUuid('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d')).toBe(true);
  });

  test('rejects non-UUID strings', () => {
    expect(isValidUuid('')).toBe(false);
    expect(isValidUuid('not-a-uuid')).toBe(false);
    expect(isValidUuid('app-123')).toBe(false);
    expect(isValidUuid(null)).toBe(false);
    expect(isValidUuid(undefined)).toBe(false);
  });
});

describe('Canonical schedule mapping', () => {
  test('maps all 7 days with Sunday as dayOfWeek=0', () => {
    const data = makeSignupData();
    const days = mapScheduleToCanonical(data.availability.weeklySchedule);

    expect(days).toHaveLength(7);
    expect(days[0]).toEqual({
      dayOfWeek: 0,
      startTime: '08:00',
      endTime: '12:00',
      isAvailable: true,
    });
    expect(days[1]).toEqual({
      dayOfWeek: 1,
      startTime: '09:00',
      endTime: '17:00',
      isAvailable: true,
    });
    expect(days[2]).toEqual({
      dayOfWeek: 2,
      startTime: '09:00',
      endTime: '17:00',
      isAvailable: false,
    });
    expect(days[3]).toEqual({
      dayOfWeek: 3,
      startTime: '10:00',
      endTime: '15:00',
      isAvailable: true,
    });
    expect(days[4]).toEqual({
      dayOfWeek: 4,
      startTime: '09:00',
      endTime: '17:00',
      isAvailable: false,
    });
    expect(days[5]).toEqual({
      dayOfWeek: 5,
      startTime: '09:00',
      endTime: '17:00',
      isAvailable: true,
    });
    expect(days[6]).toEqual({
      dayOfWeek: 6,
      startTime: '09:00',
      endTime: '17:00',
      isAvailable: false,
    });
  });

  test('strictly throws error when a day has multiple time slots (never silently flattens)', () => {
    const schedule = {
      monday: [
        { start: '09:00', end: '12:00' },
        { start: '14:00', end: '18:00' },
      ],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: [],
    };

    expect(() => mapScheduleToCanonical(schedule)).toThrow(
      /Multiple time slots found for monday/,
    );
  });

  test('rejects slots where start time >= end time', () => {
    const schedule = {
      monday: [{ start: '18:00', end: '09:00' }],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: [],
    };

    expect(() => mapScheduleToCanonical(schedule)).toThrow(/Invalid time slot/);
  });
});

describe('buildApplicationPayload', () => {
  test('builds canonical payload with serviceDrafts and schedule.timeZone/days', () => {
    const data = makeSignupData();
    const payload = buildApplicationPayload(data, ['Bangkok']);

    expect(payload.businessName).toBe('Somchai Guide');
    expect(payload.contactName).toBe('Somchai Test');
    expect(payload.email).toBe('test@example.com');
    expect(payload.phone).toBe('0812345678');
    expect(payload.location).toBe('Bangkok');
    expect(payload.bio).toBe('Experienced Bangkok guide with cultural expertise.');
    expect(payload.categories).toEqual([{ name: 'Culture', memberCount: 1 }]);
    expect(payload.brochureUrls).toEqual([]);
    expect(payload.mode).toBe('tirak');

    // Canonical applicationData
    const appData = payload.applicationData;
    expect(appData.firstName).toBe('Somchai');
    expect(appData.lastName).toBe('Test');
    expect(appData.bio).toBe('Experienced Bangkok guide with cultural expertise.');
    expect(appData.location).toBe('Bangkok');
    expect(appData.languages).toEqual(['English', 'Thai']);
    expect(appData.interests).toEqual(['Culture', 'Temples']);

    // serviceDrafts
    expect(appData.serviceDrafts).toEqual([
      {
        title: 'City Tour',
        description: 'Full day Bangkok tour',
        price: 2500,
        currency: 'THB',
        durationMinutes: 480,
      },
    ]);

    // schedule
    expect(appData.schedule.timeZone).toBe('Asia/Bangkok');
    expect(appData.schedule.days).toHaveLength(7);
    expect(appData.schedule.days[0].dayOfWeek).toBe(0);

    // Ensure legacy/unexpected keys do not exist in applicationData
    expect((appData as any).services).toBeUndefined();
    expect((appData as any).weeklySchedule).toBeUndefined();
    expect((appData as any).timezone).toBeUndefined();
  });

  test('preserves exact same-day duration minutes without inventing a one-hour default', () => {
    const data = makeSignupData({
      services: [
        {
          id: 'serv-1439',
          name: 'Nearly all-day tour',
          description: 'Long same-day itinerary',
          price: 3500,
          duration: 1439 / 60,
          isActive: true,
        },
      ],
    });

    const payload = buildApplicationPayload(data, ['Bangkok']);
    expect(payload.applicationData.serviceDrafts).toEqual([
      expect.objectContaining({
        title: 'Nearly all-day tour',
        durationMinutes: 1439,
      }),
    ]);
  });

  test('rejects unbookable durations instead of inventing a one-hour default', () => {
    const data = makeSignupData({
      services: [
        {
          id: 'serv-bad',
          name: 'Broken duration draft',
          description: 'Should fail closed',
          price: 1200,
          duration: Number.NaN,
          isActive: true,
        },
      ],
    });

    expect(() => buildApplicationPayload(data, ['Bangkok'])).toThrow(
      /Broken duration draft.*30 and 1439 whole minutes/,
    );
  });
});

describe('submitSupplierApplication', () => {
  test('submits with Idempotency-Key and validates valid UUID receipt', async () => {
    const validUuid = '30c6d267-22d1-4cd0-8bdc-46993c14c143';
    mockPost.mockResolvedValue({
      status: 200,
      data: {
        success: true,
        data: {
          applicationId: validUuid,
          statusToken: 'high-entropy-token-123',
        },
      },
    });

    const payload = buildApplicationPayload(makeSignupData(), ['Bangkok']);
    const receipt = await submitSupplierApplication(payload, 'idempotency-uuid-1');

    expect(receipt).toEqual({
      applicationId: validUuid,
      statusToken: 'high-entropy-token-123',
    });
    expect(mockPost).toHaveBeenCalledWith(
      'https://api.test/api/supplier-onboarding',
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': 'idempotency-uuid-1',
        },
      },
    );
  });

  test('rejects response with invalid non-UUID applicationId', async () => {
    mockPost.mockResolvedValue({
      status: 200,
      data: {
        success: true,
        data: {
          applicationId: 'not-a-uuid',
          statusToken: 'tok-123',
        },
      },
    });

    const payload = buildApplicationPayload(makeSignupData(), ['Bangkok']);
    await expect(
      submitSupplierApplication(payload, 'idempotency-uuid-2'),
    ).rejects.toMatchObject({
      message: expect.stringContaining('Invalid application ID'),
    });
  });

  test('rejects missing Idempotency-Key before making network request', async () => {
    const payload = buildApplicationPayload(makeSignupData(), ['Bangkok']);
    await expect(submitSupplierApplication(payload, '')).rejects.toMatchObject({
      message: expect.stringContaining('Idempotency-Key is required'),
    });
    expect(mockPost).not.toHaveBeenCalled();
  });
});

describe('getApplicationStatus', () => {
  test('decodes status envelope with lifecycle blockers', async () => {
    const validUuid = '30c6d267-22d1-4cd0-8bdc-46993c14c143';
    const rawStatus = {
      applicationId: validUuid,
      status: 'approved',
      accountStatus: 'active',
      profileStatus: 'pending_verification',
      blockers: {
        profile: 'pending_verification',
        evidence: 'id_front_reviewed',
      },
      evidence: [{ evidenceId: 'ev-1', kind: 'id_front' }],
      paymentStatus: 'unavailable',
    };

    mockGet.mockResolvedValue({
      data: {
        success: true,
        data: rawStatus,
      },
    });

    const status = await getApplicationStatus(validUuid, 'valid-token');
    expect(status.status).toBe('approved');
    expect(status.accountStatus).toBe('active');
    expect(status.profileStatus).toBe('pending_verification');
    expect(status.blockers.profile).toBe('pending_verification');
    expect(status.paymentStatus).toBe('unavailable');
    expect(mockGet).toHaveBeenCalledWith(
      `https://api.test/api/supplier-onboarding/${validUuid}/status`,
      { headers: { Authorization: 'Bearer valid-token' } },
    );
  });

  test('rejects non-UUID application ID for status queries', async () => {
    await expect(getApplicationStatus('bad-id', 'token')).rejects.toMatchObject({
      status: 400,
    });
  });
});

describe('uploadEvidence', () => {
  test('uploads evidence with Authorization Bearer statusToken and returns evidenceId', async () => {
    const validUuid = '30c6d267-22d1-4cd0-8bdc-46993c14c143';
    mockPost.mockResolvedValue({
      status: 200,
      data: {
        success: true,
        data: {
          evidenceId: 'ev-front-123',
          kind: 'id_front',
        },
      },
    });

    const result = await uploadEvidence(
      validUuid,
      'status-tok-xyz',
      'file:///id_front.jpg',
      'id_front',
    );

    expect(result).toEqual({
      evidenceId: 'ev-front-123',
      kind: 'id_front',
    });
    expect(mockPost).toHaveBeenCalledWith(
      `https://api.test/api/supplier-onboarding/${validUuid}/evidence`,
      expect.any(FormData),
      expect.objectContaining({
        headers: {
          Authorization: 'Bearer status-tok-xyz',
          'Content-Type': 'multipart/form-data',
        },
      }),
    );
  });
});

describe('Supplier store workflow and state guards', () => {
  test('persists idempotencyKey before network call and preserves key on failure', async () => {
    const store = useSupplierStore.getState();
    store.updateSignupData(makeSignupData());

    mockPost.mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 500, data: { message: 'Server error' } },
    });

    await expect(store.submitApplication()).rejects.toMatchObject({
      message: 'Server error',
    });

    const stateAfterFailure = useSupplierStore.getState();
    const preservedKey = stateAfterFailure.signupData.idempotencyKey;
    expect(preservedKey).toBeTruthy();
    expect(stateAfterFailure.isSubmitting).toBe(false);
    expect(stateAfterFailure.applicationReceipt).toBeNull();

    // Retry should reuse the same idempotencyKey
    const validUuid = '30c6d267-22d1-4cd0-8bdc-46993c14c143';
    mockPost.mockResolvedValueOnce({
      status: 200,
      data: {
        success: true,
        data: {
          applicationId: validUuid,
          statusToken: 'tok-retry-success',
        },
      },
    });

    const receipt = await store.submitApplication();
    expect(receipt.applicationId).toBe(validUuid);
    expect(useSupplierStore.getState().signupData.idempotencyKey).toBe(preservedKey);
  });

  test('guards double submission', async () => {
    useSupplierStore.setState({ isSubmitting: true });
    await expect(useSupplierStore.getState().submitApplication()).rejects.toMatchObject({
      status: 409,
      message: expect.stringContaining('already in progress'),
    });
  });

  test('cancels in-flight responses on clearSupplierState/reset so stale response does not repopulate state', async () => {
    const store = useSupplierStore.getState();
    store.updateSignupData(makeSignupData());

    let resolveSubmission: any;
    const submissionPromise = new Promise((resolve) => {
      resolveSubmission = resolve;
    });
    mockPost.mockImplementationOnce(() => submissionPromise);

    const pendingSubmit = store.submitApplication();

    // User logs out / resets store while submit is in flight
    store.clearSupplierState();
    expect(useSupplierStore.getState().signupData.basicInfo.firstName).toBe('');

    // Network response resolves later
    const validUuid = '30c6d267-22d1-4cd0-8bdc-46993c14c143';
    resolveSubmission({
      status: 200,
      data: {
        success: true,
        data: {
          applicationId: validUuid,
          statusToken: 'tok-stale',
        },
      },
    });

    await pendingSubmit;

    // The store must NOT have been repopulated with the stale receipt
    const finalState = useSupplierStore.getState();
    expect(finalState.applicationReceipt).toBeNull();
    expect(finalState.isSupplier).toBe(false);
  });

  test('legacy unbacked store methods return explicit unavailable errors without inventing IDs', async () => {
    const store = useSupplierStore.getState();

    await expect(store.fetchProfile()).rejects.toThrow(/unavailable/i);
    await expect(store.fetchStats()).rejects.toThrow(/unavailable/i);

    const addServiceResult = await store.addService({
      name: 'Fake Tour',
      description: 'Test',
      price: 1000,
      duration: 2,
      isActive: true,
    });
    expect(addServiceResult).toBe(false);
    expect(useSupplierStore.getState().profile).toBeNull();
  });
});
