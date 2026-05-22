import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen 
        name="edit" 
        options={{
          title: 'Edit Profile',
        }}
      />
        <Stack.Screen 
          name="verification" 
          options={{
            title: 'Verification',
          }}
        />
      {/* <Stack.Screen 
        name="settings" 
        options={{
          title: 'Profile Settings',
        }}
      /> */}
    </Stack>
  );
}
