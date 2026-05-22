import { logger } from '@/utils/logger';
import { useCallback } from 'react';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import Constants from 'expo-constants';

type NavigationRoute = string;

// Route mapping for production builds
const getProductionRoute = (route: string): string => {
  // Map grouped routes to their actual file paths for production
  const routeMap: Record<string, string> = {
    '/(supplier)/availability': '/supplier/availability',
    '/(supplier)/services': '/supplier/services',
    '/(supplier)/analytics': '/supplier/dashboard', // Analytics maps to dashboard
    '/(supplier)/profile': '/supplier/profile/edit', // Profile maps to edit
  };

  return routeMap[route] || route;
};

export const useProductionNavigation = () => {
  // Detect production build more reliably
  const appOwnership = Constants.appOwnership as string | null;
  const isProduction = appOwnership === 'standalone' ||
                      Constants.executionEnvironment === 'standalone' ||
                      !__DEV__;
  const isAndroid = Platform.OS === 'android';

  const navigateWithFallback = useCallback((route: NavigationRoute) => {
    const productionRoute = isProduction ? getProductionRoute(route) : route;

    logger.log('Navigation attempt:', {
      originalRoute: route,
      productionRoute,
      platform: Platform.OS,
      isProduction,
      appOwnership
    });

    // For Android production builds (APK), use a more robust approach
    if (isAndroid && isProduction) {
      // Use multiple fallback strategies for Android APK
      const attemptNavigation = async () => {
        try {
          // Strategy 1: Use production route with delay
          await new Promise(resolve => setTimeout(resolve, 150));
          router.push(productionRoute as any);
          logger.log('Navigation successful with strategy 1 (production route)');
        } catch (error1) {
          logger.warn('Strategy 1 failed:', error1);

          try {
            // Strategy 2: Replace navigation with production route
            await new Promise(resolve => setTimeout(resolve, 250));
            router.replace(productionRoute as any);
            logger.log('Navigation successful with strategy 2 (replace)');
          } catch (error2) {
            logger.warn('Strategy 2 failed:', error2);

            try {
              // Strategy 3: Try original route
              await new Promise(resolve => setTimeout(resolve, 350));
              router.push(route as any);
              logger.log('Navigation successful with strategy 3 (original route)');
            } catch (error3) {
              logger.warn('Strategy 3 failed:', error3);

              try {
                // Strategy 4: Navigate to grouped route equivalent
                const groupedRoute = productionRoute.startsWith('/supplier/')
                  ? productionRoute.replace('/supplier/', '/(supplier)/')
                  : route;

                await new Promise(resolve => setTimeout(resolve, 450));
                router.push(groupedRoute as any);
                logger.log('Navigation successful with strategy 4 (grouped route)');
              } catch (error4) {
                console.error('All navigation strategies failed:', error4);

                // Last resort: navigate back to home
                try {
                  router.replace('/(app)/' as any);
                } catch (finalError) {
                  console.error('Even fallback navigation failed:', finalError);
                }
              }
            }
          }
        }
      };

      attemptNavigation();
    } else {
      // For development or iOS, use standard navigation
      try {
        const targetRoute = isProduction ? productionRoute : route;

        if (isAndroid) {
          // Small delay for Android development
          setTimeout(() => {
            router.push(targetRoute as any);
          }, 50);
        } else {
          // Immediate navigation for iOS
          router.push(targetRoute as any);
        }
      } catch (error) {
        console.error('Standard navigation failed:', error);
        // Fallback to replace
        const fallbackRoute = isProduction ? productionRoute : route;
        router.replace(fallbackRoute as any);
      }
    }
  }, [isProduction, isAndroid]);

  return { navigateWithFallback, isProduction, isAndroid };
};
