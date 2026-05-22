import React from 'react';
import { Stack } from 'expo-router';
import { designTokens } from '@/constants/design-tokens';

export default function SupplierLayout() {
  return (
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
        name="availability"
        options={{
          title: 'Set Availability',
          headerShown: false,
        }}
      />
      
      
      <Stack.Screen
        name="dashboard/index"
        options={{
          title: 'Analytics Dashboard',
          headerShown: false,
        }}
      />
      
      {/* Other screens */}
      <Stack.Screen
        name="analytics"
        options={{
          headerShown: false,
        }}
      />
      
      <Stack.Screen
        name="chat"
        options={{
          headerShown: false,
        }}
      />
      
      <Stack.Screen
        name="portfolio"
        options={{
          headerShown: false,
        }}
      />
      
      <Stack.Screen
        name="profile"
        options={{
          headerShown: false,
        }}
      />
      
      <Stack.Screen
        name="requests"
        options={{
          headerShown: false,
        }}
      />
      
      <Stack.Screen
        name="services"
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
      
      <Stack.Screen
        name="signup/availability"
        options={{
          headerShown: false,
        }}
      />
      
      <Stack.Screen
        name="signup/basic-info"
        options={{
          headerShown: false,
        }}
      />
      
      <Stack.Screen
        name="signup/categories"
        options={{
          headerShown: false,
        }}
      />
      
      <Stack.Screen
        name="signup/index"
        options={{
          headerShown: false,
        }}
      />
      
      <Stack.Screen
        name="signup/payment"
        options={{
          headerShown: false,
        }}
      />
      
      <Stack.Screen
        name="signup/photos"
        options={{
          headerShown: false,
        }}
      />
      
      <Stack.Screen
        name="signup/regions"
        options={{
          headerShown: false,
        }}
      />
      
      <Stack.Screen
        name="signup/services"
        options={{
          headerShown: false,
        }}
      />
      
      <Stack.Screen
        name="signup/success"
        options={{
          headerShown: false,
        }}
      />
      
      <Stack.Screen
        name="signup/verification"
        options={{
          headerShown: false,
        }}
      />
      
      <Stack.Screen
        name="subscription/index"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}