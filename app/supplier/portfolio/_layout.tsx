import { Stack } from 'expo-router';

export default function PortfolioLayout() {
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
          title: 'Service Portfolio',
        }}
      />
      {/* <Stack.Screen 
        name="analytics" 
        options={{
          title: 'Portfolio Analytics',
        }}
      /> */}
      <Stack.Screen 
        name="optimization" 
        options={{
          title: 'Service Optimization',
        }}
      />
    </Stack>
  );
}
