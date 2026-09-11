import { NativeModules, Platform } from 'react-native';

export type PendingSceneLink = {
  id: string;
  url: string;
  kind: 'custom-scheme' | 'universal-link';
};

type SceneLinkBridge = {
  getPendingLink: () => Promise<PendingSceneLink | null>;
  acknowledgePendingLink: (id: string) => Promise<boolean>;
  acknowledgeWarmLink: (url: string) => Promise<void>;
};

type LinkHandler = (url: string) => void | Promise<void>;

function nativeBridge(): SceneLinkBridge | null {
  if (Platform.OS !== 'ios') {
    return null;
  }

  return (NativeModules.TirakSceneLink as SceneLinkBridge | undefined) ?? null;
}

function isPendingSceneLink(value: unknown): value is PendingSceneLink {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const link = value as Partial<PendingSceneLink>;
  return (
    typeof link.id === 'string' &&
    link.id.length > 0 &&
    typeof link.url === 'string' &&
    link.url.length > 0 &&
    (link.kind === 'custom-scheme' || link.kind === 'universal-link')
  );
}

/**
 * Reads but does not clear the native cold-start queue. The exact queue item
 * is cleared only after the JavaScript handler completes successfully.
 */
export async function consumePendingSceneLink(handleLink: LinkHandler): Promise<boolean> {
  const bridge = nativeBridge();
  if (!bridge) {
    return false;
  }

  const pending = await bridge.getPendingLink();
  if (!isPendingSceneLink(pending)) {
    return false;
  }

  await handleLink(pending.url);
  const acknowledged = await bridge.acknowledgePendingLink(pending.id);
  if (!acknowledged) {
    // Do not report "not consumed" after the handler already ran: callers may
    // otherwise fall back to Linking.getInitialURL() and route the URL twice.
    throw new Error('Native scene-link acknowledgement was rejected');
  }

  return true;
}

/** Adds a receipt to the existing Expo/RN warm-link event path. */
export async function consumeWarmSceneLink(url: string, handleLink: LinkHandler): Promise<void> {
  await handleLink(url);
  await nativeBridge()?.acknowledgeWarmLink(url);
}

export function shouldEnterSplashRoute(initialURL: string | null): boolean {
  return initialURL === null;
}
