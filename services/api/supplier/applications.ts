import axios, { AxiosError } from 'axios';
import { apiUrl } from '@/constants/api';
import { logger } from '@/utils/logger';
import { bookingDurationMinutes } from '@/utils/booking-schedule';
import type {
  SupplierSignupData,
  SupplierApplicationReceipt,
  SupplierApplicationStatusResponse,
  SupplierEvidenceKind,
  WeeklySchedule,
} from '@/types/supplier';

// --- Error types ---

export interface SupplierApplicationError {
  status: number;
  message: string;
  code?: string;
}

export class SupplierApplicationIdempotencyConflictError extends Error {
  constructor(message = 'Supplier application idempotency conflict') {
    super(message);
    this.name = 'SupplierApplicationIdempotencyConflictError';
  }
}

function isSupplierIdempotencyConflict(error: AxiosError): boolean {
  const data = error.response?.data as { code?: string; message?: string; error?: string } | undefined;
  const text = `${data?.code || ''} ${data?.message || ''} ${data?.error || ''}`.toLowerCase();
  return text.includes('idempot');
}

function isAxiosError(error: unknown): error is AxiosError {
  return axios.isAxiosError(error);
}

export function toApplicationError(error: unknown): SupplierApplicationError {
  if (isAxiosError(error)) {
    return {
      status: error.response?.status ?? 0,
      message:
        (error.response?.data as { message?: string })?.message ??
        error.message ??
        'Request failed',
      code: (error.response?.data as { code?: string })?.code,
    };
  }
  if (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    'message' in error
  ) {
    return error as SupplierApplicationError;
  }
  return {
    status: 0,
    message: error instanceof Error ? error.message : 'Unknown error',
  };
}

// --- UUID and validation helpers ---

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUuid(id: unknown): boolean {
  return typeof id === 'string' && UUID_REGEX.test(id.trim());
}

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

function toServiceDurationMinutes(duration: number | string, serviceName: string): number {
  const parsed = typeof duration === 'number' ? duration : Number(duration);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Service \"${serviceName}\" has an unbookable duration. Choose a service duration between 30 and 1439 whole minutes.`);
  }

  try {
    return bookingDurationMinutes(parsed);
  } catch (error) {
    throw new Error(
      `Service \"${serviceName}\" has an unbookable duration. ${error instanceof Error ? error.message : 'Choose a service duration between 30 and 1439 whole minutes.'}`,
    );
  }
}

// --- Schedule mapping ---
// Canonical order: Sunday=0, Monday=1, Tuesday=2, Wednesday=3, Thursday=4, Friday=5, Saturday=6.
// Unavailable intervals use 09:00/17:00 as inert bounds.
// Multiple spans in wizard are strictly rejected, never silently flattened.

export interface CanonicalDaySchedule {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

const DOW_MAPPING: Array<{ dayOfWeek: number; key: keyof WeeklySchedule }> = [
  { dayOfWeek: 0, key: 'sunday' },
  { dayOfWeek: 1, key: 'monday' },
  { dayOfWeek: 2, key: 'tuesday' },
  { dayOfWeek: 3, key: 'wednesday' },
  { dayOfWeek: 4, key: 'thursday' },
  { dayOfWeek: 5, key: 'friday' },
  { dayOfWeek: 6, key: 'saturday' },
];

export function mapScheduleToCanonical(schedule: WeeklySchedule): CanonicalDaySchedule[] {
  // Reject multiple intervals per day
  for (const { key } of DOW_MAPPING) {
    const slots = schedule[key] || [];
    if (slots.length > 1) {
      throw new Error(`Multiple time slots found for ${key}. Only one continuous interval per day is supported.`);
    }
  }

  return DOW_MAPPING.map(({ dayOfWeek, key }) => {
    const slots = schedule[key] || [];
    if (slots.length === 0) {
      return {
        dayOfWeek,
        startTime: '09:00',
        endTime: '17:00',
        isAvailable: false,
      };
    }

    const slot = slots[0];
    const start = slot.start?.trim() || '09:00';
    const end = slot.end?.trim() || '17:00';

    if (!TIME_REGEX.test(start) || !TIME_REGEX.test(end) || start >= end) {
      throw new Error(`Invalid time slot for ${key}: ${start}-${end}. Must be ordered HH:mm.`);
    }

    return {
      dayOfWeek,
      startTime: start,
      endTime: end,
      isAvailable: true,
    };
  });
}

// --- Payload builder ---

export interface CanonicalServiceDraft {
  title: string;
  description: string;
  price: number;
  currency: 'THB';
  durationMinutes: number;
}

export interface CanonicalApplicationData {
  firstName: string;
  lastName: string;
  bio: string;
  location: string;
  languages: string[];
  interests: string[];
  serviceDrafts: CanonicalServiceDraft[];
  schedule: {
    timeZone: 'Asia/Bangkok';
    days: CanonicalDaySchedule[];
  };
}

export interface SupplierApplicationPayload {
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  location: string;
  bio: string;
  categories: Array<{ name: string; memberCount: number }>;
  brochureUrls: string[];
  mode: 'tirak';
  applicationData: CanonicalApplicationData;
}

export function buildApplicationPayload(
  data: SupplierSignupData,
  regionLabels: string[],
): SupplierApplicationPayload {
  const { basicInfo, categories, services, availability, languages, interests } = data;
  const displayName =
    basicInfo.displayName?.trim() ||
    [basicInfo.firstName?.trim(), basicInfo.lastName?.trim()].filter(Boolean).join(' ') ||
    'Guide';
  const contactName =
    [basicInfo.firstName?.trim(), basicInfo.lastName?.trim()].filter(Boolean).join(' ') ||
    displayName;
  const location = regionLabels.filter(Boolean).join(', ') || 'Bangkok, Thailand';

  return {
    businessName: displayName,
    contactName,
    email: basicInfo.email.trim().toLowerCase(),
    phone: basicInfo.phone.trim(),
    location,
    bio: basicInfo.bio.trim(),
    categories: (categories.length > 0 ? categories : ['Local Experiences']).map((name) => ({
      name,
      memberCount: 1,
    })),
    brochureUrls: [],
    mode: 'tirak',
    applicationData: {
      firstName: basicInfo.firstName.trim(),
      lastName: basicInfo.lastName.trim(),
      bio: basicInfo.bio.trim(),
      location,
      languages: Array.isArray(languages) ? languages : [],
      interests: Array.isArray(interests) ? interests : [],
      serviceDrafts: (services || []).map((s) => ({
        title: s.name.trim(),
        description: (s.description || '').trim(),
        price: typeof s.price === 'number' ? s.price : Number(s.price) || 0,
        currency: 'THB' as const,
        durationMinutes: toServiceDurationMinutes(s.duration, s.name.trim() || 'Untitled service'),
      })),
      schedule: {
        timeZone: 'Asia/Bangkok' as const,
        days: mapScheduleToCanonical(availability.weeklySchedule),
      },
    },
  };
}

// --- API calls ---

export async function submitSupplierApplication(
  payload: SupplierApplicationPayload,
  idempotencyKey: string,
): Promise<SupplierApplicationReceipt> {
  if (!idempotencyKey || typeof idempotencyKey !== 'string' || !idempotencyKey.trim()) {
    throw {
      status: 400,
      message: 'Idempotency-Key is required before submitting application',
    } as SupplierApplicationError;
  }

  try {
    const response = await axios.post<{
      success: boolean;
      data: { applicationId: string; statusToken: string };
      message?: string;
    }>(apiUrl('/api/supplier-onboarding'), payload, {
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey.trim(),
      },
    });

    if (!response.data?.success || !response.data?.data) {
      throw {
        status: response.status ?? 500,
        message: response.data?.message || 'Invalid application response',
      } as SupplierApplicationError;
    }

    const { applicationId, statusToken } = response.data.data;
    if (!isValidUuid(applicationId)) {
      throw {
        status: 500,
        message: 'Invalid application ID received from server',
      } as SupplierApplicationError;
    }

    if (!statusToken || typeof statusToken !== 'string' || !statusToken.trim()) {
      throw {
        status: 500,
        message: 'Invalid status token received from server',
      } as SupplierApplicationError;
    }

    return {
      applicationId: applicationId.trim(),
      statusToken: statusToken.trim(),
    };
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 409 && isSupplierIdempotencyConflict(error)) {
      throw new SupplierApplicationIdempotencyConflictError(
        (error.response?.data as { message?: string })?.message || 'Supplier application idempotency conflict',
      );
    }
    if (isAxiosError(error) || (error as SupplierApplicationError).status) {
      throw toApplicationError(error);
    }
    throw toApplicationError(error);
  }
}

export async function getApplicationStatus(
  applicationId: string,
  statusToken: string,
): Promise<SupplierApplicationStatusResponse> {
  if (!isValidUuid(applicationId)) {
    throw {
      status: 400,
      message: 'Cannot query status with invalid application ID',
    } as SupplierApplicationError;
  }

  if (!statusToken || typeof statusToken !== 'string' || !statusToken.trim()) {
    throw {
      status: 401,
      message: 'Cannot query status without valid status token',
    } as SupplierApplicationError;
  }

  try {
    const response = await axios.get<{
      success: boolean;
      data: SupplierApplicationStatusResponse;
      message?: string;
    }>(apiUrl(`/api/supplier-onboarding/${applicationId}/status`), {
      headers: {
        Authorization: `Bearer ${statusToken.trim()}`,
      },
    });

    if (!response.data?.success || !response.data?.data) {
      throw {
        status: response.status ?? 500,
        message: response.data?.message || 'Invalid status response',
      } as SupplierApplicationError;
    }

    const data = response.data.data;
    return {
      applicationId: data.applicationId || applicationId,
      status: data.status || 'pending',
      accountStatus: data.accountStatus,
      profileStatus: data.profileStatus,
      blockers: {
        account: data.blockers?.account,
        profile: data.blockers?.profile,
        publication: data.blockers?.publication,
        evidence: data.blockers?.evidence,
      },
      evidence: Array.isArray(data.evidence) ? data.evidence : [],
      expiresAt: data.expiresAt ?? null,
      paymentStatus: data.paymentStatus || 'unavailable',
      invitationDelivery: data.invitationDelivery,
    };
  } catch (error) {
    throw toApplicationError(error);
  }
}

export async function uploadEvidence(
  applicationId: string,
  statusToken: string,
  fileUri: string,
  kind: SupplierEvidenceKind,
): Promise<{ evidenceId: string; kind: SupplierEvidenceKind }> {
  if (!isValidUuid(applicationId)) {
    throw {
      status: 400,
      message: 'Cannot upload evidence without valid application ID',
    } as SupplierApplicationError;
  }

  if (!statusToken || typeof statusToken !== 'string' || !statusToken.trim()) {
    throw {
      status: 401,
      message: 'Cannot upload evidence without valid status token',
    } as SupplierApplicationError;
  }

  if (!fileUri) {
    throw {
      status: 400,
      message: 'File URI is required for evidence upload',
    } as SupplierApplicationError;
  }

  const formData = new FormData();
  const filename = `${kind}_${Date.now()}.jpg`;
  formData.append('file', {
    uri: fileUri,
    name: filename,
    type: 'image/jpeg',
  } as unknown as Blob);
  formData.append('kind', kind);

  try {
    const response = await axios.post<{
      success: boolean;
      data: { evidenceId: string; kind: SupplierEvidenceKind };
      message?: string;
    }>(
      apiUrl(`/api/supplier-onboarding/${applicationId}/evidence`),
      formData,
      {
        headers: {
          Authorization: `Bearer ${statusToken.trim()}`,
          'Content-Type': 'multipart/form-data',
        },
      },
    );

    if (!response.data?.success || !response.data?.data?.evidenceId) {
      throw {
        status: response.status ?? 500,
        message: response.data?.message || 'Invalid evidence upload response',
      } as SupplierApplicationError;
    }

    return {
      evidenceId: response.data.data.evidenceId,
      kind: response.data.data.kind || kind,
    };
  } catch (error) {
    throw toApplicationError(error);
  }
}

// --- Idempotency Key Generator ---

export { newIdempotencyKey } from "@/utils/idempotency";
