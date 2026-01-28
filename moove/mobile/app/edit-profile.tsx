import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Text, Button, Input, Avatar } from '@/components/atoms';
import { useAuthStore } from '@/stores';
import { useUpdateProfile } from '@/hooks';
import { colors, spacing, borderRadius } from '@/constants/theme';

export default function EditProfileScreen() {
  const user = useAuthStore((state) => state.user);
  const updateProfile = useUpdateProfile();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || null);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setUsername(user.username || '');
      setBio(user.bio || '');
      setAvatarUrl(user.avatarUrl);
    }
  }, [user]);

  const handlePickImage = () => {
    // TODO: Implement image picker when expo-image-picker is installed
    Alert.alert('Coming Soon', 'Profile photo upload will be available soon.');
  };

  const handleSave = async () => {
    if (!displayName.trim()) {
      Alert.alert('Error', 'Display name is required');
      return;
    }

    if (!username.trim()) {
      Alert.alert('Error', 'Username is required');
      return;
    }

    try {
      await updateProfile.mutateAsync({
        displayName: displayName.trim(),
        username: username.trim(),
        bio: bio.trim() || null,
      });
      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Please try again.';
      Alert.alert('Error', `Failed to update profile. ${errorMessage}`);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Text variant="h3">×</Text>
        </TouchableOpacity>
        <Text variant="h3">Edit Profile</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={handlePickImage}>
            <Avatar
              uri={avatarUrl}
              name={displayName}
              size="xlarge"
            />
            <View style={styles.editAvatarBadge}>
              <Text variant="labelSmall" color={colors.white}>Edit</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={handlePickImage}>
            <Text variant="label" color={colors.primary.kineticOrange} style={styles.changePhotoText}>
              Change Photo
            </Text>
          </TouchableOpacity>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.field}>
            <Text variant="label" style={styles.fieldLabel}>Display Name</Text>
            <Input
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Your display name"
              maxLength={50}
            />
          </View>

          <View style={styles.field}>
            <Text variant="label" style={styles.fieldLabel}>Username</Text>
            <Input
              value={username}
              onChangeText={setUsername}
              placeholder="Your username"
              autoCapitalize="none"
              maxLength={30}
            />
          </View>

          <View style={styles.field}>
            <Text variant="label" style={styles.fieldLabel}>Bio</Text>
            <Input
              value={bio}
              onChangeText={setBio}
              placeholder="Tell us about yourself..."
              multiline
              numberOfLines={4}
              maxLength={200}
            />
            <Text variant="labelSmall" color={colors.text.muted} style={styles.charCount}>
              {bio.length}/200
            </Text>
          </View>
        </View>

        {/* Save Button */}
        <Button
          title="Save Changes"
          onPress={handleSave}
          loading={updateProfile.isPending}
          size="large"
          fullWidth
          style={styles.saveButton}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl + spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  editAvatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary.kineticOrange,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  changePhotoText: {
    marginTop: spacing.sm,
  },
  form: {
    gap: spacing.lg,
  },
  field: {
    gap: spacing.xs,
  },
  fieldLabel: {
    marginLeft: spacing.xs,
  },
  charCount: {
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  saveButton: {
    marginTop: spacing.xl,
  },
});
