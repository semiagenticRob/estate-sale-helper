import { Stack } from 'expo-router';
import { Image } from 'react-native';
import { SavedSalesProvider } from '../context/SavedSalesContext';

const DorisHeader = () => (
  <Image
    source={require('../assets/doris.png')}
    style={{ width: 40, height: 40, marginRight: 4 }}
    resizeMode="contain"
  />
);

export default function RootLayout() {
  return (
    <SavedSalesProvider>
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#F5F0E8' },
        headerTintColor: '#1C1A16',
        headerTitleStyle: { fontWeight: '700', color: '#1C1A16' },
        headerShadowVisible: false,
        headerRight: () => <DorisHeader />,
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="sale/[id]"
        options={{ title: 'Sale Details' }}
      />
    </Stack>
    </SavedSalesProvider>
  );
}
