import { Tabs } from 'expo-router';
import { Text, Image } from 'react-native';

const DorisHeader = () => (
  <Image
    source={require('../../assets/doris.png')}
    style={{ width: 40, height: 40, marginRight: 4 }}
    resizeMode="contain"
  />
);

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#3A3830',
        tabBarInactiveTintColor: '#A8A09A',
        tabBarStyle: {
          backgroundColor: '#FAF7F2',
          borderTopWidth: 1,
          borderTopColor: '#EDE8E0',
        },
        headerStyle: { backgroundColor: '#F5F0E8' },
        headerTintColor: '#1C1A16',
        headerTitleStyle: { fontWeight: '700', color: '#1C1A16' },
        headerShadowVisible: false,
        headerRight: () => <DorisHeader />,
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
