import React from 'react';
import { Stack } from 'expo-router';
import { designTokens } from '@/constants/design-tokens';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function SupplierLayout() {
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
