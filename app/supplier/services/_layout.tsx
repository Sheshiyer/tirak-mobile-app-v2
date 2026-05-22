import { Stack } from 'expo-router';

export default function ServicesLayout() {
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
          title: 'My Services',
        }}
      />
      <Stack.Screen 
        name="create" 
        options={{
          title: 'Create Service',
          presentation: 'modal',
        }}
      />
      <Stack.Screen 
        name="edit" 
        options={{
          title: 'Edit Service',
        }}
      />
    </Stack>
  );
}
