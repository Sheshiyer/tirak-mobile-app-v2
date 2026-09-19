import { logger } from '@/utils/logger';
import React, { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { Stack, router, usePathname } from 'expo-router';
import { PostHogProvider } from 'posthog-react-native';
import { posthog } from '@/utils/posthog';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import * as Linking from 'expo-linking';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Sentry from '@sentry/react-native';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/utils/i18n';
import { registerServiceWorker } from '@/utils/pwa';
import PWAHead from '@/components/PWAHead';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';
import { SimpleToast } from '@/components/ui/SimpleToast';
import { SoundManager } from '@/utils/sound-manager';
import {
  consumePendingSceneLink,
  consumeWarmSceneLink,
  shouldEnterSplashRoute,
} from '@/utils/scene-link-consumption';
import { useAuthStore } from '@/stores/auth-store';
import { parsePasswordResetLink, shouldShowStartupSplash } from '@/utils/startup-navigation';

Sentry.init({
  dsn: 'https://aa0f61b9f2d781f2a2295677370e6749@o4509643523162112.ingest.us.sentry.io/4509643525783552',

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: false,

  // Configure Session Replay
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,
  integrations: [Sentry.feedbackIntegration()],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: (failureCount, error) => {
        // Don't retry on authentication errors
        if (error instanceof Error && (error.message.includes('401') || error.message.includes('Unauthorized'))) {
          return false;
        }
        // Don't retry on network errors
        if (error instanceof Error && error.message.includes('Network Error')) {
          return false;
        }

        // Retry up to 3 times
        return failureCount < 2;
      },
    },
  },
});

// Add a splash screen route
export { default as SplashScreen } from './splash';

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default Sentry.wrap(function RootLayout() {
  const initialSceneLink = useRef(
    Platform.OS === 'ios' ? Linking.getLinkingURL() : null,
  );
  const pathname = usePathname();
  const currentPathname = useRef(pathname);
  currentPathname.current = pathname;
  useEffect(() => useAuthStore.subscribe((state, previous) => {
    if (state.user?.id !== previous.user?.id) {
      // User-specific query keys predate account scoping in some screens.
      // Cancel in-flight responses and discard cache across account changes.
      void queryClient.cancelQueries();
      queryClient.clear();
    }
  }), []);
  const [fontsLoaded] = useFonts({
    // Custom fonts for headings and subheadings only (visual impact)
    'ProximaNova-Regular': require('../assets/images/fonts/ProximaNova-Regular.otf'),
    'ProximaNova-Semibold': require('../assets/images/fonts/ProximaNova-Semibold.otf'),
    'ProximaNova-Thin': require('../assets/images/fonts/ProximaNova-Thin.otf'),
    'Garet-Heavy': require('../assets/images/fonts/garet.heavy.ttf'),
  });

  // Show the branded startup sequence only for a plain root launch. Explicit
  // auth/legal/reset routes must remain accessible when opened directly.
  useEffect(() => {
    if (!fontsLoaded) return;
    void SplashScreen.hideAsync();
    void SoundManager.preloadAll();
    let cancelled = false;
    let rafId: number | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    void Linking.getInitialURL().catch(() => null).then((initialUrl) => {
      if (cancelled || !shouldEnterSplashRoute(initialSceneLink.current) || !shouldShowStartupSplash(currentPathname.current, initialUrl)) return;
      rafId = requestAnimationFrame(() => {
        timer = setTimeout(() => {
          if (!cancelled && shouldEnterSplashRoute(initialSceneLink.current) && shouldShowStartupSplash(currentPathname.current, initialUrl)) router.replace('/splash');
        }, 100);
      });
    });
    return () => {
      cancelled = true;
      if (rafId !== undefined) cancelAnimationFrame(rafId);
      if (timer !== undefined) clearTimeout(timer);
    };
  }, [fontsLoaded]);

  // Register service worker for PWA (web only) - DISABLED for now
  useEffect(() => {
    if (Platform.OS === 'web') {
      // Unregister any existing service workers to prevent caching issues
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          registrations.forEach((registration) => {
            registration.unregister();
            logger.log('[PWA] Unregistered existing service worker');
          });
        });
      }
      
      // Handle PWA install prompt
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        (window as any).deferredPrompt = e;
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    }
  }, []);

  // Handle deep links
  useEffect(() => {
    if (!fontsLoaded) return;
    let disposed = false;
    let resetTimer: ReturnType<typeof setTimeout> | undefined;
    const handleDeepLink = (url: string) => {
      const reset = parsePasswordResetLink(url);
      if (!reset || disposed) return;
      // Never log the reset URL or token. Structured params safely preserve
      // encoded characters rather than inserting the token into a new URL.
      if (resetTimer !== undefined) clearTimeout(resetTimer);
      resetTimer = setTimeout(() => {
        if (disposed) return;
        router.replace(reset.token
          ? { pathname: '/auth/new', params: { token: reset.token } }
          : '/auth/forgot');
      }, 100);
    };

    // Listen for incoming links when the app is already open
    const subscription = Linking.addEventListener('url', ({ url }) => {
      void consumeWarmSceneLink(url, handleDeepLink).catch(() => {
        logger.warn('Unable to consume warm scene link');
      });
    });

    // UIScene links stay in the native queue until this handler succeeds and
    // acknowledges the exact queue item. Fall back for Android and old-style
    // iOS application launch options, which do not populate that scene queue.
    void consumePendingSceneLink(handleDeepLink)
      .then(async (consumed) => {
        if (!consumed) {
          const url = await Linking.getInitialURL();
          if (url) {
            await handleDeepLink(url);
          }
        }
      })
      .catch(() => {
        logger.warn('Unable to consume cold scene link');
      });

    return () => {
      disposed = true;
      if (resetTimer !== undefined) clearTimeout(resetTimer);
      subscription.remove();
    };
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <PostHogProvider
      client={posthog}
      autocapture={{
        captureScreens: false, // manual screen tracking via usePathname
        captureTouches: false,
        propsToCapture: ['testID'],
      }}
    >
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={queryClient}>
          {Platform.OS === 'web' && <PWAHead />}
          {Platform.OS === 'web' && <PWAInstallPrompt />}
          <SimpleToast />
          <StatusBar style={Platform.OS === 'ios' ? 'dark' : 'auto'} />
          <RootLayoutNav />
        </QueryClientProvider>
      </I18nextProvider>
    </PostHogProvider>
  );
});

function RootLayoutNav() {
  const pathname = usePathname();
  const previousPathname = useRef<string | undefined>(undefined);

  // Manual screen tracking for Expo Router
  useEffect(() => {
    if (previousPathname.current !== pathname) {
      posthog.screen(pathname, {
        previous_screen: previousPathname.current ?? null,
      });
      previousPathname.current = pathname;
    }
  }, [pathname]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="splash" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="auth" />
      <Stack.Screen name="(app)" />
      <Stack.Screen name="(supplier)" />
      <Stack.Screen name="supplier" />
    </Stack>
  );
}
