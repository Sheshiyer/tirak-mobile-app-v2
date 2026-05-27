import { Redirect } from 'expo-router';

export default function LegacySupplierAvailabilityAddSlotRedirect() {
  return <Redirect href="/(supplier)/availability/add-slot" />;
}
