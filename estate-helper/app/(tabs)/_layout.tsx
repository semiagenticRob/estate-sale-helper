import { Tabs } from 'expo-router';
import { Text } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#1a5f2a',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#eee',
        },
        headerStyle: { backgroundColor: '#1a5f2a' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Estate Helper',
          tabBarLabel: 'Search',
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 22 }}>🔍</Text>
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
    </Tabs>
  );
}
