import { Redirect } from 'expo-router';

export default function LegacySupplierAvailabilityRedirect() {
  return <Redirect href="/(supplier)/availability" />;
}
