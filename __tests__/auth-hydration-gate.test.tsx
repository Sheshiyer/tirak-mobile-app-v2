import React from 'react';
const TestRenderer = require('react-test-renderer');
const { act } = TestRenderer;
const mockState: any = { user: null, isAuthenticated: false, isLoading: false };
let mockPersistHydrated = false;
let mockCompleteHydration: () => void;
let mockCompleteValidation: () => void;
const mockRehydrate = jest.fn(() => new Promise<void>(resolve => { mockCompleteHydration = () => { mockPersistHydrated = true; resolve(); }; }));
const mockValidateToken = jest.fn(() => new Promise<void>(resolve => { mockCompleteValidation = resolve; }));
jest.mock('../stores/auth-store', () => ({ useAuthStore: Object.assign((selector: any) => selector(mockState), {
  persist: { hasHydrated: () => mockPersistHydrated, rehydrate: () => mockRehydrate() },
  getState: () => ({ validateToken: () => mockValidateToken() }),
}) }));
import { useAuthStoreHydrated } from '../hooks/useAuthStoreHydrated';
let latest: ReturnType<typeof useAuthStoreHydrated>;
function Probe() { latest = useAuthStoreHydrated(); return null; }
beforeEach(() => { mockPersistHydrated = false; mockState.user = null; mockState.isAuthenticated = false; jest.clearAllMocks(); });
it('does not expose false anonymous readiness before persistence and token restoration; restores guide identity', async () => {
  let tree: ReturnType<typeof TestRenderer.create>;
  await act(async () => { tree = TestRenderer.create(<Probe />); });
  expect(latest!.isHydrated).toBe(false); expect(latest!.isLoading).toBe(true);
  expect(mockValidateToken).not.toHaveBeenCalled();
  await act(async () => { mockCompleteHydration(); });
  expect(mockValidateToken).toHaveBeenCalledTimes(1);
  expect(latest!.isHydrated).toBe(false);
  await act(async () => {
    mockState.user = { id: 'guide-1', userType: 'companion' };
    mockState.isAuthenticated = true;
    mockCompleteValidation();
  });
  expect(latest!.isHydrated).toBe(true); expect(latest!.user?.id).toBe('guide-1');
  expect(latest!.isAuthenticated).toBe(true);
  await act(async () => { tree!.unmount(); });
});
it('declares anonymous only after completed token restoration and skips already hydrated persistence', async () => {
  mockPersistHydrated = true;
  let tree: ReturnType<typeof TestRenderer.create>;
  await act(async () => { tree = TestRenderer.create(<Probe />); });
  expect(mockRehydrate).not.toHaveBeenCalled(); expect(latest!.isHydrated).toBe(false);
  await act(async () => { mockCompleteValidation(); });
  expect(latest!.isHydrated).toBe(true); expect(latest!.user).toBeNull();
  expect(latest!.isAuthenticated).toBe(false);
  await act(async () => { tree!.unmount(); });
});
