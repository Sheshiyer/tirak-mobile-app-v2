import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, title: 'Tirak' }}>
      <Stack.Screen name="index" options={{ title: 'Welcome — Tirak' }} />
      <Stack.Screen name="login" options={{ title: 'Log in — Tirak' }} />
      <Stack.Screen name="register" options={{ title: 'Create an account — Tirak' }} />
      <Stack.Screen name="verify-email" options={{ title: 'Verify your email — Tirak' }} />
      <Stack.Screen name="forgot" options={{ title: 'Reset your password — Tirak' }} />
      <Stack.Screen name="new" options={{ title: 'Choose a new password — Tirak' }} />
      <Stack.Screen name="legal" options={{ title: 'Terms and privacy — Tirak' }} />
    </Stack>
  );
}
