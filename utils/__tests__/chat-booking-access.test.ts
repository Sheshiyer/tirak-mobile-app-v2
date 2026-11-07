import { loadChatBookingAccess } from '../chat-booking-access';
const response = (status: string) => ({ success: true, data: { booking: { id: 'actual-booking', status } } });
it.each(['confirmed', 'in_progress'])('allows messages only for an authorized %s booking', async status => {
  const load = jest.fn().mockResolvedValue(response(status));
  await expect(loadChatBookingAccess('actual-booking', load)).resolves.toEqual({ canSend: true, status, message: null });
  expect(load).toHaveBeenCalledWith('actual-booking');
});
it.each(['cancelled', 'completed'])('retains history with explicit read-only copy for %s', async status => {
  const access = await loadChatBookingAccess('actual-booking', jest.fn().mockResolvedValue(response(status)));
  expect(access.canSend).toBe(false); expect(access.message).toContain(status); expect(access.message).toContain('read-only'); expect(access.message).not.toContain('connection');
});
it('keeps pending confirmation distinct from a closed booking', async () => {
  const access = await loadChatBookingAccess('actual-booking', jest.fn().mockResolvedValue(response('pending')));
  expect(access.canSend).toBe(false); expect(access.message).toContain('awaiting confirmation');
});
it.each([401,403,500])('propagates authorized booking lookup failure HTTP%s rather than fabricating closure', async status => {
  const error = Object.assign(new Error('Lookup failed'), { status });
  await expect(loadChatBookingAccess('actual-booking', jest.fn().mockRejectedValue(error))).rejects.toBe(error);
});
it('rejects missing linkage and mismatched/unknown booking data without granting send access', async () => {
  const load = jest.fn(); await expect(loadChatBookingAccess(undefined, load)).rejects.toThrow('verified'); expect(load).not.toHaveBeenCalled();
  for (const body of [{ success: false }, response('unknown'), { success: true, data: { booking: { id: 'other', status: 'confirmed' } } }]) {
    await expect(loadChatBookingAccess('actual-booking', jest.fn().mockResolvedValue(body))).rejects.toThrow('verified');
  }
});
