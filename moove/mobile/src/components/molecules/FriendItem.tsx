import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text, Avatar, Button } from '@/components/atoms';
import { colors, spacing, borderRadius, shadows } from '@/constants/theme';
import type { UserSummary, FriendshipWithUsers } from '@moove/shared/types';

interface FriendItemProps {
  friend: UserSummary;
  subtitle?: string;
  onPress?: () => void;
  showAction?: boolean;
  actionLabel?: string;
  onAction?: () => void;
}

export function FriendItem({
  friend,
  subtitle,
  onPress,
  showAction = false,
  actionLabel = 'View',
  onAction,
}: FriendItemProps) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={onPress ? 0.8 : 1}
      disabled={!onPress}
    >
      <Avatar
        uri={friend.avatarUrl}
        name={friend.displayName}
        size="large"
      />

      <View style={styles.content}>
        <Text variant="h3" numberOfLines={1}>
          {friend.displayName}
        </Text>
        <Text variant="bodySmall" color={colors.text.muted} numberOfLines={1}>
          @{friend.username}
        </Text>
        {subtitle && (
          <Text variant="labelSmall" color={colors.text.secondary}>
            {subtitle}
          </Text>
        )}
      </View>

      {showAction && (
        <Button
          title={actionLabel}
          variant="secondary"
          size="small"
          onPress={onAction || (() => {})}
        />
      )}
    </TouchableOpacity>
  );
}

interface FriendRequestItemProps {
  request: FriendshipWithUsers;
  onAccept: () => void;
  onDecline: () => void;
}

export function FriendRequestItem({
  request,
  onAccept,
  onDecline,
}: FriendRequestItemProps) {
  return (
    <View style={styles.requestContainer}>
      <Avatar
        uri={request.requester.avatarUrl}
        name={request.requester.displayName}
        size="large"
      />

      <View style={styles.content}>
        <Text variant="h3" numberOfLines={1}>
          {request.requester.displayName}
        </Text>
        <Text variant="bodySmall" color={colors.text.muted}>
          @{request.requester.username}
        </Text>
      </View>

      <View style={styles.requestActions}>
        <Button
          title="Accept"
          variant="primary"
          size="small"
          onPress={onAccept}
        />
        <Button
          title="Decline"
          variant="ghost"
          size="small"
          onPress={onDecline}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    ...shadows.subtle,
  },
  content: {
    flex: 1,
    marginLeft: spacing.md,
  },
  requestContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    ...shadows.subtle,
  },
  requestActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
});
