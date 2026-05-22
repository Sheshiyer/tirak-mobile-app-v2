import { Stack } from 'expo-router';

export default function RequestsLayout() {
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
          title: 'Booking Requests',
        }}
      />
      <Stack.Screen 
        name="[id]" 
        options={{
          title: 'Request Details',
        }}
      />
      <Stack.Screen 
        name="[id]/decline" 
        options={{
          title: 'Decline Request',
          presentation: 'modal',
        }}
      />
      <Stack.Screen 
        name="history" 
        options={{
          title: 'Request History',
        }}
      />
    </Stack>
  );
}
