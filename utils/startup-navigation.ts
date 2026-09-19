function linkPath(url: URL): string {
  // Expo development links put the route after /--/. Custom-scheme links can
  // put the first route segment in the hostname (tirak://reset-password).
  const isHostBased = ['http:', 'https:', 'exp:', 'exps:'].includes(url.protocol);
  const path = isHostBased ? url.pathname : `${url.hostname}/${url.pathname}`;
  return path.replace(/^\/+/, '').replace(/^--\/+/, '').replace(/\/+$/, '');
}

export function shouldShowStartupSplash(pathname: string, initialUrl?: string | null): boolean {
  if (pathname !== '/' && pathname !== '') return false;
  if (!initialUrl) return true;
  try {
    const url = new URL(initialUrl);
    return linkPath(url) === '' && !url.search && !url.hash;
  } catch {
    // An unknown explicit link should be handled by the router, not discarded.
    return false;
  }
}

export function parsePasswordResetLink(initialUrl: string): { token: string | null } | null {
  try {
    const url = new URL(initialUrl);
    if (linkPath(url) !== 'reset-password') return null;
    return { token: url.searchParams.get('token') || null };
  } catch {
    return null;
  }
}
