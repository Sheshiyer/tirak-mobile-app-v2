interface LocalPromptPayCapabilityInput {
  flag: string | undefined;
  apiBaseUrl: string;
  isDev: boolean;
  reviewMode?: boolean;
}

export function isLocalPromptPayEnabled({
  flag,
  apiBaseUrl,
  isDev,
  reviewMode = false,
}: LocalPromptPayCapabilityInput): boolean {
  if (reviewMode || !isDev || flag !== 'true') return false;

  try {
    const url = new URL(apiBaseUrl);
    return (
      url.protocol === 'http:'
      && (url.hostname === 'localhost' || url.hostname === '127.0.0.1')
      && url.port === '8787'
      && (url.pathname === '/' || url.pathname === '')
      && url.search === ''
      && url.hash === ''
      && url.username === ''
      && url.password === ''
    );
  } catch {
    return false;
  }
}
