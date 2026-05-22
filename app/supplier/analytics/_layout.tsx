import { Stack } from 'expo-router';

export default function AnalyticsLayout() {
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
          title: 'Performance Analytics',
        }}
      />
      <Stack.Screen 
        name="services" 
        options={{
          title: 'Service Analytics',
        }}
      />
      <Stack.Screen 
        name="conversion" 
        options={{
          title: 'Conversion Analytics',
        }}
      />
    </Stack>
  );
}
