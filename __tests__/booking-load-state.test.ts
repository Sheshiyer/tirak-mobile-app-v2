import { bookingLoadState } from '../utils/booking-load-state';
const base = { authenticated: true, loading: false, error: null, success: true, count: 0 };
it('recognizes a successful zero-item history as empty', () => {
  expect(bookingLoadState(base)).toBe('empty');
});
it('never turns expired authentication or a network failure into an empty history', () => {
  for (const message of ['401 Unauthorized', 'Network unavailable']) {
    expect(bookingLoadState({ ...base, success: false, error: new Error(message) })).toBe('error');
  }
});
it('does not claim an empty history without a successful response', () => {
  expect(bookingLoadState({ ...base, success: false })).toBe('ready');
});
it('retains loading and actual result states', () => {
  expect(bookingLoadState({ ...base, loading: true })).toBe('loading');
  expect(bookingLoadState({ ...base, count: 2 })).toBe('ready');
});
