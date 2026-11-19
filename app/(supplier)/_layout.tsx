import React from 'react';
import { Platform } from 'react-native';
import { Redirect, Stack, usePathname } from 'expo-router';
import { designTokens } from '@/constants/design-tokens';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useAuthStoreHydrated } from '@/hooks/useAuthStoreHydrated';

export default function SupplierLayout() {
  const { isHydrated, user } = useAuthStoreHydrated();
  const pathname = usePathname();

  if (!isHydrated) return null;
  if (!user) return <Redirect href={Platform.OS === 'web' ? '/auth' : '/splash'} />;
  if (user.userType !== 'supplier' && user.userType !== 'companion') {
    return <Redirect href={pathname === '/settings' ? '/(app)/settings' : '/(app)'} />;
  }

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Supplier Layout Error:', error, errorInfo);
      }}
    >
      <Stack
        screenOptions={{
          headerShown: false,
          headerStyle: {
            backgroundColor: designTokens.colors.semantic.primary,
          },
          headerTintColor: designTokens.colors.semantic.surface,
          headerTitleStyle: {
            fontWeight: '600',
          },
          contentStyle: {
            backgroundColor: designTokens.colors.semantic.background,
          },
          animation: 'slide_from_right',
        }}
      >
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="availability/index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen name="availability/settings" options={{ headerShown: false }} />
      <Stack.Screen
        name="availability/add-slot"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="services/index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="analytics/index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="profile/index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="settings/index"
        options={{
          headerShown: false,
        }}
      />
      </Stack>
    </ErrorBoundary>
  );
}
