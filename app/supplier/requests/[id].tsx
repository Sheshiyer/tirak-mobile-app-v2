import { Redirect, useLocalSearchParams } from 'expo-router';

export default function LegacySupplierRequestDetailRedirect() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const rawId = Array.isArray(id) ? id[0] : id;
  return <Redirect href={rawId ? (`/booking/${rawId}` as any) : '/bookings'} />;
}
