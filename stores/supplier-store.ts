import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  SupplierProfile,
  SupplierSignupData,
  SupplierStats,
  SupplierApplicationReceipt,
  SupplierApplicationStatusResponse,
  SupplierEvidenceKind,
  EvidenceUploadRecord,
} from '@/types/supplier';
import {
  buildApplicationPayload,
  submitSupplierApplication,
  getApplicationStatus,
  uploadEvidence,
  newIdempotencyKey,
  SupplierApplicationError,
  SupplierApplicationIdempotencyConflictError,
} from '@/services/api/supplier/applications';
import { mockRegions } from '@/mocks/supplier-data';

interface SupplierState {
  isSupplier: boolean;
  profile: SupplierProfile | null;
  stats: SupplierStats | null;
  signupData: SupplierSignupData;
  isLoading: boolean;
  error: string | null;

  // In-flight generation tracker to invalidate responses across reset/logout
  generation: number;

  // Application state
  applicationReceipt: SupplierApplicationReceipt | null;
  applicationStatus: SupplierApplicationStatusResponse | null;
  applicationStatusLoading: boolean;
  isSubmitting: boolean;
  submissionError: SupplierApplicationError | null;

  // Evidence upload tracking
  evidenceUploads: Record<string, EvidenceUploadRecord>;

  // Actions
  setIsSupplier: (isSupplier: boolean) => void;
  setProfile: (profile: SupplierProfile | null) => void;
  setStats: (stats: SupplierStats | null) => void;
  updateSignupData: (data: Partial<SupplierSignupData>) => void;
  resetSignupData: () => void;
  clearSupplierState: () => void;
  nextSignupStep: () => void;
  prevSignupStep: () => void;

  // Real application actions
  ensureIdempotencyKey: () => string;
  submitApplication: () => Promise<SupplierApplicationReceipt>;
  pollApplicationStatus: () => Promise<SupplierApplicationStatusResponse>;
  uploadAllEvidence: () => Promise<void>;
  retryEvidenceUpload: (key: string) => Promise<void>;
  clearSubmission: () => void;
  discardDraft: () => void;
  retryOriginalApplication: () => Promise<SupplierApplicationReceipt>;
  startNewApplicationAttempt: () => string;

  // Legacy actions (explicitly unavailable errors, no fake local IDs)
  fetchProfile: () => Promise<void>;
  fetchStats: () => Promise<void>;
  updateProfile: (data: Partial<SupplierProfile>) => Promise<boolean>;
  addService: (service: Omit<SupplierProfile['services'][0], 'id'>) => Promise<boolean>;
  updateService: (serviceId: string, data: Partial<SupplierProfile['services'][0]>) => Promise<boolean>;
  deleteService: (serviceId: string) => Promise<boolean>;
  updateAvailability: (availability: SupplierProfile['availability']) => Promise<boolean>;
}

const initialSignupData: SupplierSignupData = {
  step: 1,
  basicInfo: {
    firstName: '',
    lastName: '',
    displayName: '',
    phone: '',
    email: '',
    bio: '',
  },
  idVerification: {
    idCardFront: null,
    idCardBack: null,
    selfieWithId: null,
  },
  photos: [],
  categories: [],
  services: [],
  regions: [],
  languages: [],
  interests: [],
  availability: {
    weeklySchedule: {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: [],
    },
    exceptions: [],
  },
  applicationReceipt: null,
  idempotencyKey: null,
  attemptedApplicationPayload: null,
};

function collectEvidenceItems(
  signupData: SupplierSignupData,
  existingUploads: Record<string, EvidenceUploadRecord>,
): Record<string, EvidenceUploadRecord> {
  const uploads: Record<string, EvidenceUploadRecord> = { ...existingUploads };

  if (signupData.idVerification.idCardFront) {
    const existing = uploads['idCardFront'];
    if (!existing || existing.uri !== signupData.idVerification.idCardFront) {
      uploads['idCardFront'] = {
        kind: 'id_front',
        uri: signupData.idVerification.idCardFront,
        evidenceId: existing?.uri === signupData.idVerification.idCardFront ? existing.evidenceId : null,
        status: existing?.uri === signupData.idVerification.idCardFront && existing.evidenceId ? 'uploaded' : 'pending',
        error: null,
      };
    }
  }

  if (signupData.idVerification.idCardBack) {
    const existing = uploads['idCardBack'];
    if (!existing || existing.uri !== signupData.idVerification.idCardBack) {
      uploads['idCardBack'] = {
        kind: 'id_back',
        uri: signupData.idVerification.idCardBack,
        evidenceId: existing?.uri === signupData.idVerification.idCardBack ? existing.evidenceId : null,
        status: existing?.uri === signupData.idVerification.idCardBack && existing.evidenceId ? 'uploaded' : 'pending',
        error: null,
      };
    }
  }

  if (signupData.idVerification.selfieWithId) {
    const existing = uploads['selfieWithId'];
    if (!existing || existing.uri !== signupData.idVerification.selfieWithId) {
      uploads['selfieWithId'] = {
        kind: 'selfie',
        uri: signupData.idVerification.selfieWithId,
        evidenceId: existing?.uri === signupData.idVerification.selfieWithId ? existing.evidenceId : null,
        status: existing?.uri === signupData.idVerification.selfieWithId && existing.evidenceId ? 'uploaded' : 'pending',
        error: null,
      };
    }
  }

  (signupData.photos || []).forEach((photoUri, index) => {
    const key = `portfolio_${index}`;
    const existing = uploads[key];
    if (!existing || existing.uri !== photoUri) {
      uploads[key] = {
        kind: 'portfolio',
        uri: photoUri,
        evidenceId: existing?.uri === photoUri ? existing.evidenceId : null,
        status: existing?.uri === photoUri && existing.evidenceId ? 'uploaded' : 'pending',
        error: null,
      };
    }
  });

  return uploads;
}

export const useSupplierStore = create<SupplierState>()(
  persist(
    (set, get) => ({
      isSupplier: false,
      profile: null,
      stats: null,
      signupData: initialSignupData,
      isLoading: false,
      error: null,

      generation: 0,

      applicationReceipt: null,
      applicationStatus: null,
      applicationStatusLoading: false,
      isSubmitting: false,
      submissionError: null,

      evidenceUploads: {},

      setIsSupplier: (isSupplier) => set({ isSupplier }),
      setProfile: (profile) => set({ profile }),
      setStats: (stats) => set({ stats }),

      updateSignupData: (data) =>
        set((state) => ({
          signupData: { ...state.signupData, ...data },
        })),

      ensureIdempotencyKey: () => {
        const currentKey = get().signupData.idempotencyKey;
        if (currentKey && currentKey.trim().length > 0) {
          return currentKey;
        }
        const freshKey = newIdempotencyKey();
        set((state) => ({
          signupData: {
            ...state.signupData,
            idempotencyKey: freshKey,
          },
        }));
        return freshKey;
      },

      resetSignupData: () =>
        set((state) => ({
          generation: state.generation + 1,
          signupData: initialSignupData,
          applicationReceipt: null,
          applicationStatus: null,
          applicationStatusLoading: false,
          isSubmitting: false,
          submissionError: null,
          evidenceUploads: {},
        })),

      clearSupplierState: () =>
        set((state) => ({
          generation: state.generation + 1,
          isSupplier: false,
          profile: null,
          stats: null,
          signupData: initialSignupData,
          isLoading: false,
          error: null,
          applicationReceipt: null,
          applicationStatus: null,
          applicationStatusLoading: false,
          isSubmitting: false,
          submissionError: null,
          evidenceUploads: {},
        })),

      nextSignupStep: () =>
        set((state) => ({
          signupData: {
            ...state.signupData,
            step: Math.min(state.signupData.step + 1, 8),
          },
        })),

      prevSignupStep: () =>
        set((state) => ({
          signupData: {
            ...state.signupData,
            step: Math.max(state.signupData.step - 1, 1),
          },
        })),

      submitApplication: async () => {
        const state = get();
        if (state.isSubmitting) {
          throw {
            status: 409,
            message: 'An application submission is already in progress',
          } as SupplierApplicationError;
        }

        // Persist cryptographic idempotency key BEFORE first network request
        const idempotencyKey = get().ensureIdempotencyKey();

        const currentGen = state.generation + 1;
        set({
          generation: currentGen,
          isSubmitting: true,
          submissionError: null,
        });

        try {
          const { signupData } = get();
          // Resolve region labels from IDs
          const regionLabels = signupData.regions.map((regionId) => {
            const region = mockRegions.find((r) => r.id === regionId);
            return region?.name || regionId;
          });

          const payload = buildApplicationPayload(signupData, regionLabels);
          set((s) => ({
            signupData: {
              ...s.signupData,
              attemptedApplicationPayload: payload,
            },
          }));
          const receipt = await submitSupplierApplication(
            payload,
            idempotencyKey,
          );

          // Check if superseded by logout or reset
          if (get().generation !== currentGen) {
            return receipt;
          }

          // Populate initial evidence records
          const uploads = collectEvidenceItems(signupData, get().evidenceUploads);

          // Persist receipt and key; do NOT set isSupplier
          set((s) => ({
            isSubmitting: false,
            applicationReceipt: receipt,
            evidenceUploads: uploads,
            signupData: {
              ...s.signupData,
              applicationReceipt: receipt,
              idempotencyKey,
              attemptedApplicationPayload: payload,
            },
          }));

          // Trigger evidence upload in background
          void get().uploadAllEvidence();

          return receipt;
        } catch (error) {
          if (get().generation === currentGen) {
            const appError = error as SupplierApplicationError;
            set({ isSubmitting: false, submissionError: appError });
          }
          throw error;
        }
      },

      uploadAllEvidence: async () => {
        const state = get();
        const receipt = state.applicationReceipt || state.signupData.applicationReceipt;
        if (!receipt?.applicationId || !receipt?.statusToken) {
          return;
        }

        const currentGen = state.generation;
        const uploads = collectEvidenceItems(state.signupData, state.evidenceUploads);
        set({ evidenceUploads: uploads });

        for (const [key, item] of Object.entries(uploads)) {
          if (item.status === 'uploaded' && item.evidenceId) {
            continue;
          }

          // Check generation
          if (get().generation !== currentGen) return;

          set((s) => ({
            evidenceUploads: {
              ...s.evidenceUploads,
              [key]: {
                ...s.evidenceUploads[key],
                status: 'uploading',
                error: null,
              },
            },
          }));

          try {
            const result = await uploadEvidence(
              receipt.applicationId,
              receipt.statusToken,
              item.uri,
              item.kind,
            );

            if (get().generation !== currentGen) return;

            set((s) => ({
              evidenceUploads: {
                ...s.evidenceUploads,
                [key]: {
                  ...s.evidenceUploads[key],
                  status: 'uploaded',
                  evidenceId: result.evidenceId,
                  error: null,
                },
              },
            }));
          } catch (err) {
            if (get().generation !== currentGen) return;

            const message =
              (err as SupplierApplicationError).message || 'Evidence upload failed';
            set((s) => ({
              evidenceUploads: {
                ...s.evidenceUploads,
                [key]: {
                  ...s.evidenceUploads[key],
                  status: 'failed',
                  error: message,
                },
              },
            }));
          }
        }
      },

      retryEvidenceUpload: async (key: string) => {
        const state = get();
        const receipt = state.applicationReceipt || state.signupData.applicationReceipt;
        const item = state.evidenceUploads[key];
        if (!receipt?.applicationId || !receipt?.statusToken || !item) {
          return;
        }

        const currentGen = state.generation;
        set((s) => ({
          evidenceUploads: {
            ...s.evidenceUploads,
            [key]: {
              ...s.evidenceUploads[key],
              status: 'uploading',
              error: null,
            },
          },
        }));

        try {
          const result = await uploadEvidence(
            receipt.applicationId,
            receipt.statusToken,
            item.uri,
            item.kind,
          );

          if (get().generation !== currentGen) return;

          set((s) => ({
            evidenceUploads: {
              ...s.evidenceUploads,
              [key]: {
                ...s.evidenceUploads[key],
                status: 'uploaded',
                evidenceId: result.evidenceId,
                error: null,
              },
            },
          }));
        } catch (err) {
          if (get().generation !== currentGen) return;

          const message =
            (err as SupplierApplicationError).message || 'Evidence upload retry failed';
          set((s) => ({
            evidenceUploads: {
              ...s.evidenceUploads,
              [key]: {
                ...s.evidenceUploads[key],
                status: 'failed',
                error: message,
              },
            },
          }));
        }
      },

      pollApplicationStatus: async () => {
        const receipt =
          get().applicationReceipt ||
          get().signupData.applicationReceipt;
        if (!receipt) {
          throw {
            status: 0,
            message: 'No application receipt available',
          } as SupplierApplicationError;
        }

        const currentGen = get().generation;
        set({ applicationStatusLoading: true });

        try {
          const status = await getApplicationStatus(
            receipt.applicationId,
            receipt.statusToken,
          );

          if (get().generation === currentGen) {
            set({ applicationStatus: status, applicationStatusLoading: false });
          }
          return status;
        } catch (error) {
          if (get().generation === currentGen) {
            set({ applicationStatusLoading: false });
          }
          throw error;
        }
      },

      clearSubmission: () =>
        set({
          submissionError: null,
        }),

      discardDraft: () =>
        set((state) => ({
          generation: state.generation + 1,
          signupData: initialSignupData,
          applicationReceipt: null,
          applicationStatus: null,
          applicationStatusLoading: false,
          isSubmitting: false,
          submissionError: null,
          evidenceUploads: {},
        })),

      retryOriginalApplication: async () => {
        const state = get();
        const payload = state.signupData.attemptedApplicationPayload;
        const idempotencyKey = state.signupData.idempotencyKey;
        if (!payload || !idempotencyKey) {
          throw {
            status: 400,
            message: 'No original application attempt is available to retry',
          } as SupplierApplicationError;
        }

        const currentGen = state.generation + 1;
        set({
          generation: currentGen,
          isSubmitting: true,
          submissionError: null,
        });

        try {
          const receipt = await submitSupplierApplication(
            payload as Parameters<typeof submitSupplierApplication>[0],
            idempotencyKey,
          );

          if (get().generation !== currentGen) {
            return receipt;
          }

          const uploads = collectEvidenceItems(get().signupData, get().evidenceUploads);
          set((s) => ({
            isSubmitting: false,
            applicationReceipt: receipt,
            evidenceUploads: uploads,
            signupData: {
              ...s.signupData,
              applicationReceipt: receipt,
            },
          }));

          void get().uploadAllEvidence();
          return receipt;
        } catch (error) {
          if (get().generation === currentGen) {
            const submissionError = error instanceof SupplierApplicationIdempotencyConflictError
              ? ({ status: 409, message: error.message } as SupplierApplicationError)
              : (error as SupplierApplicationError);
            set({ isSubmitting: false, submissionError });
          }
          throw error;
        }
      },

      startNewApplicationAttempt: () => {
        const nextKey = newIdempotencyKey();
        set((state) => ({
          signupData: {
            ...state.signupData,
            idempotencyKey: nextKey,
            applicationReceipt: null,
            attemptedApplicationPayload: null,
          },
          applicationReceipt: null,
          applicationStatus: null,
          submissionError: null,
        }));
        return nextKey;
      },

      // --- Legacy actions: explicitly unavailable, no invented fake IDs ---

      fetchProfile: async () => {
        set({ error: 'Legacy profile store is unavailable. Use companion profile API.' });
        throw new Error('Legacy profile store is unavailable. Use companion profile API.');
      },

      fetchStats: async () => {
        set({ error: 'Legacy stats store is unavailable. Use companion stats API.' });
        throw new Error('Legacy stats store is unavailable. Use companion stats API.');
      },

      updateProfile: async () => {
        set({ error: 'Legacy update profile is unavailable. Use companion profile API.' });
        return false;
      },

      addService: async () => {
        set({ error: 'Direct service creation is unavailable in signup store. Use companion experiences API.' });
        return false;
      },

      updateService: async () => {
        set({ error: 'Direct service update is unavailable in signup store. Use companion experiences API.' });
        return false;
      },

      deleteService: async () => {
        set({ error: 'Direct service deletion is unavailable in signup store. Use companion experiences API.' });
        return false;
      },

      updateAvailability: async () => {
        set({ error: 'Direct availability update is unavailable in signup store. Use availability settings API.' });
        return false;
      },
    }),
    {
      name: 'supplier-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        isSupplier: state.isSupplier,
        profile: state.profile,
        applicationReceipt: state.applicationReceipt,
        applicationStatus: state.applicationStatus,
        evidenceUploads: state.evidenceUploads,
        signupData: {
          ...state.signupData,
          applicationReceipt: state.applicationReceipt,
          idempotencyKey: state.signupData.idempotencyKey,
          attemptedApplicationPayload: state.signupData.attemptedApplicationPayload,
        },
      }),
    },
  ),
);
