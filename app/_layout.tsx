import React from 'react';
import { Stack } from 'expo-router';
import { ActivityIndicator, View, Text } from 'react-native';
import { SavedSalesProvider } from '../context/SavedSalesContext';
import { useFonts, CormorantGaramond_500Medium } from '@expo-google-fonts/cormorant-garamond';
import { Lora_400Regular } from '@expo-google-fonts/lora';
import { DMSans_400Regular, DMSans_500Medium } from '@expo-google-fonts/dm-sans';
import { colors, fonts } from '../lib/theme';

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, backgroundColor: colors.backgroundPrimary }}>
          <Text style={{ fontSize: 18, fontFamily: fonts.uiSansMedium, color: colors.textPrimary, marginBottom: 8 }}>
            Something went wrong
          </Text>
          <Text style={{ fontSize: 14, fontFamily: fonts.uiSans, color: colors.textSecondary, textAlign: 'center' }}>
            Please close and reopen the app.
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

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
    <AppErrorBoundary>
    <SavedSalesProvider>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.backgroundSecondary },
          headerTintColor: colors.textDark,
          headerTitleStyle: { fontWeight: '800', fontSize: 20, color: colors.textDark, fontFamily: fonts.uiSansMedium },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="sale/[id]"
          options={{ title: 'Sale Details', headerBackTitle: 'Back' }}
        />
        <Stack.Screen
          name="about"
          options={{ title: 'About', headerBackTitle: 'Back' }}
        />
        <Stack.Screen
          name="privacy"
          options={{ title: 'Privacy Policy', headerBackTitle: 'Back' }}
        />
        <Stack.Screen
          name="terms"
          options={{ title: 'Terms of Service', headerBackTitle: 'Back' }}
        />
      </Stack>
    </SavedSalesProvider>
    </AppErrorBoundary>
  );
}
