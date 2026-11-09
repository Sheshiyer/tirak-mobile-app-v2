import React from 'react';
import { ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuthStoreHydrated } from '@/hooks/useAuthStoreHydrated';

// This explicit legacy URL must use the current settings surface. Its former
// duplicate guide screen omitted language, saved notifications and account controls.
export default function LegacySupplierSettingsRedirect() {
  const { isHydrated, user } = useAuthStoreHydrated();
  if (!isHydrated) return <ActivityIndicator accessibilityLabel="Loading account settings" />;
  if (!user) return <Redirect href="/auth" />;
  return <Redirect href={user.userType === 'customer' ? '/(app)/settings' : '/(supplier)/settings'} />;
}
