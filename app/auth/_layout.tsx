import { Stack, usePathname } from 'expo-router';
import Head from 'expo-router/head';

const accountPageTitles: Record<string, string> = {
  '/auth': 'Welcome — Tirak',
  '/auth/login': 'Log in — Tirak',
  '/auth/register': 'Create an account — Tirak',
  '/auth/verify-email': 'Verify your email — Tirak',
  '/auth/forgot': 'Reset your password — Tirak',
  '/auth/new': 'Choose a new password — Tirak',
  '/auth/legal': 'Terms and privacy — Tirak',
};

export default function AuthLayout() {
  const pathname = usePathname();
  return (
    <>
      <Head><title>{accountPageTitles[pathname] || 'Tirak'}</title></Head>
      <Stack screenOptions={{ headerShown: false, title: 'Tirak' }}>
      <Stack.Screen name="index" options={{ title: 'Welcome — Tirak' }} />
      <Stack.Screen name="login" options={{ title: 'Log in — Tirak' }} />
      <Stack.Screen name="register" options={{ title: 'Create an account — Tirak' }} />
      <Stack.Screen name="verify-email" options={{ title: 'Verify your email — Tirak' }} />
      <Stack.Screen name="forgot" options={{ title: 'Reset your password — Tirak' }} />
      <Stack.Screen name="new" options={{ title: 'Choose a new password — Tirak' }} />
      <Stack.Screen name="legal" options={{ title: 'Terms and privacy — Tirak' }} />
      </Stack>
    </>
  );
}
