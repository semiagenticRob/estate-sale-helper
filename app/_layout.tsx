import { Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { SavedSalesProvider } from '../context/SavedSalesContext';
import { useFonts, CormorantGaramond_500Medium } from '@expo-google-fonts/cormorant-garamond';
import { Lora_400Regular } from '@expo-google-fonts/lora';
import { DMSans_400Regular, DMSans_500Medium } from '@expo-google-fonts/dm-sans';
import { colors, fonts } from '../lib/theme';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    CormorantGaramond_500Medium,
    Lora_400Regular,
    DMSans_400Regular,
    DMSans_500Medium,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.backgroundPrimary }}>
        <ActivityIndicator size="large" color={colors.accentPrimary} />
      </View>
    );
  }

  return (
    <SavedSalesProvider>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.backgroundSecondary },
          headerTintColor: '#3B2A1A',
          headerTitleStyle: { fontWeight: '800', fontSize: 20, color: '#3B2A1A', fontFamily: fonts.uiSansMedium },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="sale/[id]"
          options={{ title: 'Sale Details', headerBackTitle: 'Back' }}
        />
      </Stack>
    </SavedSalesProvider>
  );
}
