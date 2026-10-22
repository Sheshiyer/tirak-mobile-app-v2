import { Redirect } from 'expo-router';

// Legacy prototype controls have no verified account contract. Use the real
// account verification, notification and privacy settings instead.
export default function LegacySettingsRedirect() {
  return <Redirect href="/settings" />;
}
