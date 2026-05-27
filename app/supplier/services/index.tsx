import { Redirect } from 'expo-router';

export default function LegacySupplierServicesRedirect() {
  return <Redirect href="/(supplier)/services" />;
}
