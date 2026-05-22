import { Stack } from 'expo-router';

export default function AvailabilityLayout() {
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
          title: 'Availability Calendar',
        }}
      />
      <Stack.Screen 
        name="add-slot" 
        options={{
          title: 'Add Time Slot',
        }}
      />
      <Stack.Screen 
        name="settings" 
        options={{
          title: 'Availability Settings',
        }}
      />
      {/* <Stack.Screen 
        name="analytics" 
        options={{
          title: 'Availability Analytics',
        }}
      /> */}
    </Stack>
  );
}
