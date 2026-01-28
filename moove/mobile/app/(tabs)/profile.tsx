import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Text, Avatar, Button } from '@/components/atoms';
import { useAuthStore } from '@/stores';
import { useLogout, useCurrentUser } from '@/hooks';
import { colors, spacing, borderRadius, shadows, layout } from '@/constants/theme';

interface SettingItemProps {
  icon: string;
  label: string;
  onPress: () => void;
  destructive?: boolean;
}

function SettingItem({ icon, label, onPress, destructive }: SettingItemProps) {
  return (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <Text style={styles.settingIcon}>{icon}</Text>
      <Text
        variant="body"
        color={destructive ? colors.error : colors.text.primary}
        style={styles.settingLabel}
      >
        {label}
      </Text>
      <Text variant="body" color={colors.gray[400]}>
        →
      </Text>
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const user = useAuthStore((state) => state.user);
  const { data } = useCurrentUser();
  const logout = useLogout();

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await logout.mutateAsync();
            router.replace('/(auth)/welcome');
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement account deletion
            Alert.alert('Coming Soon', 'Account deletion will be available soon.');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.header}>
          <Avatar
            uri={user?.avatarUrl}
            name={user?.displayName}
            size="xlarge"
          />
          <Text variant="h2" style={styles.displayName}>
            {user?.displayName}
          </Text>
          <Text variant="body" color={colors.text.muted}>
            @{user?.username}
          </Text>
          {user?.bio && (
            <Text variant="body" style={styles.bio}>
              {user.bio}
            </Text>
          )}

          <Button
            title="Edit Profile"
            variant="secondary"
            size="small"
            onPress={() => router.push('/edit-profile' as const)}
            style={styles.editButton}
          />
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.stat}>
            <Text variant="h2">12</Text>
            <Text variant="label" color={colors.text.muted}>
              Events
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text variant="h2">48</Text>
            <Text variant="label" color={colors.text.muted}>
              Friends
            </Text>
          </View>
        </View>

        {/* Settings Sections */}
        <View style={styles.section}>
          <Text variant="label" color={colors.text.muted} style={styles.sectionTitle}>
            Preferences
          </Text>
          <View style={styles.settingsCard}>
            <SettingItem
              icon="🎵"
              label="Edit Interests"
              onPress={() => router.push('/(auth)/onboarding')}
            />
            <SettingItem
              icon="📍"
              label="Location Settings"
              onPress={() => Alert.alert('Coming Soon', 'Location settings will be available soon.')}
            />
            <SettingItem
              icon="🔔"
              label="Notifications"
              onPress={() => Alert.alert('Coming Soon', 'Notification settings will be available soon.')}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text variant="label" color={colors.text.muted} style={styles.sectionTitle}>
            Account
          </Text>
          <View style={styles.settingsCard}>
            <SettingItem
              icon="🔒"
              label="Privacy"
              onPress={() => Alert.alert('Coming Soon', 'Privacy settings will be available soon.')}
            />
            <SettingItem
              icon="🔗"
              label="Connected Accounts"
              onPress={() => Alert.alert('Coming Soon', 'Connected accounts will be available soon.')}
            />
            <SettingItem
              icon="❓"
              label="Help & Support"
              onPress={() => Alert.alert('Help', 'For support, please email support@moove.app')}
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.settingsCard}>
            <SettingItem
              icon="🚪"
              label="Log Out"
              onPress={handleLogout}
            />
            <SettingItem
              icon="🗑️"
              label="Delete Account"
              onPress={handleDeleteAccount}
              destructive
            />
          </View>
        </View>

        <Text variant="labelSmall" color={colors.text.muted} center style={styles.version}>
          MOOVE v1.0.0
        </Text>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: spacing.xxl + spacing.lg,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    backgroundColor: colors.background.primary,
  },
  displayName: {
    marginTop: spacing.md,
  },
  bio: {
    marginTop: spacing.sm,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  editButton: {
    marginTop: spacing.md,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.background.primary,
    marginTop: 1,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
  },
  stat: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.gray[200],
  },
  section: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: {
    marginBottom: spacing.sm,
    marginLeft: spacing.sm,
  },
  settingsCard: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.lg,
    ...shadows.subtle,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  settingIcon: {
    fontSize: 20,
    marginRight: spacing.md,
  },
  settingLabel: {
    flex: 1,
  },
  version: {
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  bottomPadding: {
    height: layout.tabBarHeight + spacing.xl,
  },
});
