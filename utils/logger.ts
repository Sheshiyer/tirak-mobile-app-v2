const isDev = __DEV__;

export const logger = {
  log: (...args: unknown[]) => {
    if (isDev) console.log('[tirak]', ...args);
  },
  warn: (...args: unknown[]) => {
    if (isDev) console.warn('[tirak]', ...args);
  },
  error: (...args: unknown[]) => {
    if (isDev) {
      console.warn('[tirak:error]', ...args);
      return;
    }
    console.error('[tirak]', ...args);
  },
  debug: (...args: unknown[]) => {
    if (isDev) console.log('[tirak:debug]', ...args);
  },
};
