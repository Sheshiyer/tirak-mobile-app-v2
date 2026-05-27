import { Redirect, useLocalSearchParams } from 'expo-router';

export default function LegacySupplierConversationRedirect() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const rawId = Array.isArray(id) ? id[0] : id;
  return <Redirect href={rawId ? (`/chat/${rawId}` as any) : '/messages'} />;
}
