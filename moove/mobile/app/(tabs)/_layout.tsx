import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { Text } from '@/components/atoms';
import { colors, spacing, shadows, borderRadius } from '@/constants/theme';

interface TabIconProps {
  icon: string;
  label: string;
  focused: boolean;
}

function TabIcon({ icon, label, focused }: TabIconProps) {
  return (
    <View style={[styles.tabItem, focused ? styles.tabItemFocused : undefined]}>
      <Text style={{ ...styles.tabIcon, ...(focused ? styles.tabIconFocused : {}) }}>
        {icon}
      </Text>
      {focused && (
        <Text variant="labelSmall" color={colors.primary.sage}>
          {label}
        </Text>
      )}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="📅" label="Schedule" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="tonight"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="⚡" label="Tonight" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="🔍" label="Discover" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="social"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="👥" label="Friends" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="👤" label="Profile" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
    height: 70,
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    borderTopWidth: 0,
    ...shadows.elevated,
    paddingBottom: 0,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  tabItemFocused: {
    transform: [{ scale: 1.1 }],
  },
  tabIcon: {
    fontSize: 24,
    opacity: 0.5,
  },
  tabIconFocused: {
    opacity: 1,
  },
});
