import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#1a5f2a' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="results"
        options={{ title: 'Search Results' }}
      />
      <Stack.Screen
        name="sale/[id]"
        options={{ title: 'Sale Details' }}
      />
    </Stack>
  );
}
