import { logger } from '@/utils/logger';
import React, { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { Stack, router, usePathname, useGlobalSearchParams } from 'expo-router';
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

Sentry.init({
  dsn: 'https://aa0f61b9f2d781f2a2295677370e6749@o4509643523162112.ingest.us.sentry.io/4509643525783552',

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration(), Sentry.feedbackIntegration()],

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
  const [fontsLoaded] = useFonts({
    // Custom fonts for headings and subheadings only (visual impact)
    'ProximaNova-Regular': require('../assets/images/fonts/ProximaNova-Regular.otf'),
    'ProximaNova-Semibold': require('../assets/images/fonts/ProximaNova-Semibold.otf'),
    'ProximaNova-Thin': require('../assets/images/fonts/ProximaNova-Thin.otf'),
    'Garet-Heavy': require('../assets/images/fonts/garet.heavy.ttf'),
  });

  // Handle splash screen and initial navigation
  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
      SoundManager.preloadAll(); // warm up audio after fonts are ready

      const rafId = requestAnimationFrame(() => {
        setTimeout(() => {
          router.replace('/splash');
        }, 100);
      });
      
      return () => cancelAnimationFrame(rafId);
    }
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
    const handleDeepLink = (url: string) => {
      logger.log('Deep link received:', url);
      
      if (url.includes('reset-password')) {
        try {
          // Handle both production (tirak://) and development (exp://) URLs
          let token = null;
          
          if (url.includes('exp://')) {
            // Expo development URL format: exp://192.168.0.101:8081//reset-password?token=...
            const match = url.match(/token=([^&]+)/);
            token = match ? match[1] : null;
          } else {
            // Production URL format: tirak://reset-password?token=...
            const urlObj = new URL(url);
            token = urlObj.searchParams.get('token');
          }
          
          if (token) {
            logger.log('Reset password token:', token);
            // Navigate directly to /auth/new screen with token
            setTimeout(() => {
              router.replace(`/auth/new?token=${token}`);
            }, 100);
          } else {
            logger.log('No token found, redirecting to forgot password');
            setTimeout(() => {
              router.replace('/auth/forgot');
            }, 100);
          }
        } catch (error) {
          console.error('Error parsing deep link:', error);
          setTimeout(() => {
            router.replace('/auth/forgot');
          }, 100);
        }
      }
    };

    // Listen for incoming links when the app is already open
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    // Check if the app was opened by a deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <PostHogProvider
      client={posthog}
      autocapture={{
        captureScreens: false, // manual screen tracking via usePathname
        captureTouches: true,
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
  const params = useGlobalSearchParams();
  const previousPathname = useRef<string | undefined>(undefined);

  // Manual screen tracking for Expo Router
  useEffect(() => {
    if (previousPathname.current !== pathname) {
      posthog.screen(pathname, {
        previous_screen: previousPathname.current ?? null,
        ...params,
      });
      previousPathname.current = pathname;
    }
  }, [pathname, params]);

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