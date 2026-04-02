import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { ActivityIndicator, View, Text, Pressable, Platform, ScrollView } from 'react-native';
import { SavedSalesProvider } from '../context/SavedSalesContext';
import { useFonts, CormorantGaramond_500Medium } from '@expo-google-fonts/cormorant-garamond';
import { Lora_400Regular } from '@expo-google-fonts/lora';
import { DMSans_400Regular, DMSans_500Medium } from '@expo-google-fonts/dm-sans';
import { colors, fonts } from '../lib/theme';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
  errorStack: string;
}

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false, errorMessage: '', errorStack: '' };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorMessage: error?.message || 'Unknown error' };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[AppErrorBoundary]', error?.message, error?.stack);
    console.error('[AppErrorBoundary] Component stack:', errorInfo?.componentStack);
    this.setState({ errorStack: errorInfo?.componentStack || '' });
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, backgroundColor: colors.backgroundPrimary }}>
          <Text style={{ fontSize: 18, fontFamily: fonts.uiSansMedium, color: colors.textPrimary, marginBottom: 8 }}>
            Something went wrong
          </Text>
          <Text style={{ fontSize: 14, fontFamily: fonts.uiSans, color: colors.textSecondary, textAlign: 'center', marginBottom: 16 }}>
            Please try again or restart the app.
          </Text>
          <Pressable
            onPress={() => this.setState({ hasError: false, errorMessage: '', errorStack: '' })}
            style={{ backgroundColor: colors.accentPrimary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, marginBottom: 24 }}
          >
            <Text style={{ color: '#fff', fontSize: 16, fontFamily: fonts.uiSansMedium, fontWeight: '500' }}>
              Try Again
            </Text>
          </Pressable>
          <ScrollView style={{ maxHeight: 200, width: '100%' }}>
            <Text style={{ fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', color: colors.textSecondary, textAlign: 'left' }} selectable>
              {this.state.errorMessage}
              {this.state.errorStack ? '\n' + this.state.errorStack : ''}
            </Text>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function RootLayout() {
  useEffect(() => {
    console.log('[Estate Helper] Build mode:', __DEV__ ? 'DEBUG' : 'RELEASE');
    console.log('[Estate Helper] SUPABASE_URL defined:', typeof process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_URL ? 'length=' + process.env.EXPO_PUBLIC_SUPABASE_URL.length : 'MISSING');
    console.log('[Estate Helper] SUPABASE_ANON_KEY defined:', typeof process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? 'length=' + process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY.length : 'MISSING');
    console.log('[Estate Helper] Platform:', Platform.OS, Platform.Version);
  }, []);

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
