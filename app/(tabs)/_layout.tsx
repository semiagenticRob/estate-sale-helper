import { Tabs, useRouter } from 'expo-router';
import { Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '../../lib/theme';
import { getLastSearch } from '../../lib/searchState';

export default function TabLayout() {
  const router = useRouter();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.accentPrimary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.backgroundPrimary,
          borderTopWidth: 1,
          borderTopColor: colors.backgroundSecondary,
        },
        tabBarLabelStyle: {
          fontFamily: fonts.uiSans,
          fontSize: 10,
        },
        headerStyle: { backgroundColor: colors.backgroundSecondary },
        headerTintColor: colors.textDark,
        headerTitleStyle: { fontWeight: '800', fontSize: 20, color: colors.textDark, fontFamily: fonts.uiSansMedium },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Estate Sale Helper',
          tabBarLabel: 'Search',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search" size={size} color={color} />
          ),
          headerRight: () => (
            <Pressable onPress={() => router.push('/about')} style={{ marginRight: 16 }}>
              <Ionicons name="information-circle-outline" size={22} color={colors.textSecondary} />
            </Pressable>
          ),
        }}
      />
      <Tabs.Screen
        name="mapview"
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            const last = getLastSearch();
            if (last) {
              e.preventDefault();
              navigation.navigate('results', { ...last, viewMode: 'map' });
            }
          },
        })}
        options={{
          title: 'Map View',
          tabBarLabel: 'Map',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: 'Saved Sales',
          tabBarLabel: 'Saved',
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 22 }}>★</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="listview"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="results"
        options={{
          href: null,
          title: 'Search Results',
        }}
      />
    </Tabs>
  );
}
