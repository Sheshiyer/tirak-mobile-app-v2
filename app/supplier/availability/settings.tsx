import { Redirect } from 'expo-router';

export default function LegacySupplierAvailabilitySettingsRedirect() {
  return <Redirect href="/(supplier)/availability" />;
}
