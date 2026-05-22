import { Stack } from 'expo-router';

export default function ChatLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{
          title: 'Customer Chat',
        }}
      />
      <Stack.Screen 
        name="conversation/[id]" 
        options={{
          title: 'Conversation',
        }}
      />
      <Stack.Screen 
        name="templates" 
        options={{
          title: 'Message Templates',
        }}
      />
      <Stack.Screen 
        name="settings" 
        options={{
          title: 'Chat Settings',
        }}
      />
    </Stack>
  );
}
