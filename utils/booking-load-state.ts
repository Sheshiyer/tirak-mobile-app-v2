/** Empty booking history is only established by a successful response. */
export function bookingLoadState(input: {
  authenticated: boolean;
  loading: boolean;
  error: unknown;
  success: boolean;
  count: number;
}): 'loading' | 'error' | 'empty' | 'ready' {
  if (input.loading) return 'loading';
  if (input.authenticated && input.error) return 'error';
  if (!input.authenticated || (input.success && input.count === 0)) return 'empty';
  return 'ready';
}
