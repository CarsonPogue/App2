import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text, Avatar } from '@/components/atoms';
import { colors, spacing } from '@/constants/theme';
import type { CommentWithUser } from '@moove/shared/types';

interface CommentItemProps {
  comment: CommentWithUser;
  onReply?: () => void;
  onUserPress?: (userId: string) => void;
  isReply?: boolean;
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
}

export function CommentItem({
  comment,
  onReply,
  onUserPress,
  isReply = false,
}: CommentItemProps) {
  return (
    <View style={[styles.container, isReply && styles.replyContainer]}>
      <TouchableOpacity
        onPress={() => onUserPress?.(comment.user.id)}
        activeOpacity={0.8}
      >
        <Avatar
          uri={comment.user.avatarUrl}
          name={comment.user.displayName}
          size={isReply ? 'small' : 'medium'}
        />
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => onUserPress?.(comment.user.id)}
            activeOpacity={0.8}
          >
            <Text variant="label" style={styles.username}>
              {comment.user.displayName}
            </Text>
          </TouchableOpacity>
          <Text variant="labelSmall" color={colors.text.muted}>
            {formatRelativeTime(comment.createdAt)}
          </Text>
        </View>

        <Text variant="body" style={styles.text}>
          {comment.content}
        </Text>

        {onReply && !isReply && (
          <TouchableOpacity onPress={onReply} style={styles.replyButton}>
            <Text variant="label" color={colors.primary.sage}>
              Reply
            </Text>
          </TouchableOpacity>
        )}

        {comment.replies && comment.replies.length > 0 && (
          <View style={styles.replies}>
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                onUserPress={onUserPress}
                isReply
              />
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  replyContainer: {
    marginLeft: spacing.xl,
    marginBottom: spacing.sm,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  username: {
    fontWeight: '600',
  },
  text: {
    lineHeight: 22,
  },
  replyButton: {
    marginTop: spacing.xs,
  },
  replies: {
    marginTop: spacing.md,
  },
});
