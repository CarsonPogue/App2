import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from '@/utils/haptics';
import { Text, Avatar, Badge } from '@/components/atoms';
import { colors, spacing, borderRadius, shadows, categoryColors, typography } from '@/constants/theme';
import type { EventWithRSVP } from '@moove/shared/types';

interface EventCardProps {
  event: EventWithRSVP;
  onPress: () => void;
  compact?: boolean;
}

function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatDate(date: Date): string {
  const d = new Date(date);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (d.toDateString() === today.toDateString()) {
    return 'Today';
  }
  if (d.toDateString() === tomorrow.toDateString()) {
    return 'Tomorrow';
  }
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function EventCard({ event, onPress, compact = false }: EventCardProps) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const categoryColor = categoryColors[event.category as keyof typeof categoryColors] || categoryColors.other;

  if (compact) {
    return (
      <TouchableOpacity
        style={styles.compactContainer}
        onPress={handlePress}
        activeOpacity={0.9}
      >
        <Image
          source={{ uri: event.thumbnailUrl || 'https://via.placeholder.com/80' }}
          style={styles.compactImage}
          contentFit="cover"
        />
        <View style={styles.compactContent}>
          <Text variant="label" color={categoryColor}>
            {event.category.toUpperCase()}
          </Text>
          <Text variant="h3" numberOfLines={1}>
            {event.title}
          </Text>
          <Text variant="bodySmall" color={colors.text.muted} numberOfLines={1}>
            {event.venueName}
          </Text>
          <Text variant="mono" color={colors.text.secondary}>
            {formatDate(event.startTime)} • {formatTime(event.startTime)}
          </Text>
        </View>
        {event.userRsvp?.status === 'going' && (
          <Badge label="Going" variant="success" style={styles.rsvpBadge} />
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.9}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: event.thumbnailUrl || 'https://via.placeholder.com/400x200' }}
          style={styles.image}
          contentFit="cover"
          transition={200}
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.gradient}
        />

        <View style={styles.imageOverlay}>
          <View style={[styles.categoryBadge, { backgroundColor: categoryColor }]}>
            <Text variant="labelSmall" color={colors.white}>
              {event.category.toUpperCase()}
            </Text>
          </View>

          {event.priceRange && (
            <View style={styles.priceBadge}>
              <Text variant="labelSmall" color={colors.white}>
                ${event.priceRange.min}+
              </Text>
            </View>
          )}
        </View>

        <View style={styles.imageBottom}>
          <Text variant="h3" color={colors.white} numberOfLines={2}>
            {event.title}
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.venueRow}>
          <Text variant="body" numberOfLines={1} style={styles.venueName}>
            {event.venueName}
          </Text>
          {event.rating && (
            <View style={styles.ratingContainer}>
              <Text variant="labelSmall">★</Text>
              <Text variant="labelSmall">{event.rating.toFixed(1)}</Text>
            </View>
          )}
        </View>

        <View style={styles.metaRow}>
          <Text variant="mono" color={colors.text.secondary}>
            {formatDate(event.startTime)} • {formatTime(event.startTime)}
          </Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.rsvpInfo}>
            {event.rsvpCounts.going > 0 && (
              <Text variant="labelSmall" color={colors.text.muted}>
                {event.rsvpCounts.going} going
              </Text>
            )}
            {event.commentCount > 0 && (
              <Text variant="labelSmall" color={colors.text.muted}>
                {event.commentCount} comments
              </Text>
            )}
          </View>

          {event.friendsAttending.length > 0 && (
            <View style={styles.friendAvatars}>
              {event.friendsAttending.slice(0, 3).map((friend, index) => (
                <Avatar
                  key={friend.id}
                  uri={friend.avatarUrl}
                  name={friend.displayName}
                  size="small"
                  style={{ ...styles.friendAvatar, marginLeft: index > 0 ? -8 : 0 }}
                />
              ))}
              {event.friendsAttending.length > 3 && (
                <View style={[styles.friendAvatar, styles.moreAvatars, { marginLeft: -8 } as const]}>
                  <Text variant="labelSmall" color={colors.white}>
                    +{event.friendsAttending.length - 3}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {event.userRsvp && event.userRsvp.status !== 'hidden' && (
          <View style={styles.userRsvp}>
            <Badge
              label={event.userRsvp.status === 'going' ? 'Going' : 'Interested'}
              variant={event.userRsvp.status === 'going' ? 'success' : 'info'}
            />
            {event.userRsvp.emojiReaction && (
              <Text style={styles.emoji}>{event.userRsvp.emojiReaction}</Text>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
    ...shadows.card,
  },
  imageContainer: {
    height: 180,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  imageOverlay: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  categoryBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  priceBadge: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  imageBottom: {
    position: 'absolute',
    bottom: spacing.md,
    left: spacing.md,
    right: spacing.md,
  },
  content: {
    padding: spacing.md,
  },
  venueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  venueName: {
    flex: 1,
    marginRight: spacing.sm,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  metaRow: {
    marginBottom: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rsvpInfo: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  friendAvatars: {
    flexDirection: 'row',
  },
  friendAvatar: {
    borderWidth: 2,
    borderColor: colors.white,
  },
  moreAvatars: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.gray[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  userRsvp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  emoji: {
    fontSize: 20,
  },

  // Compact styles
  compactContainer: {
    flexDirection: 'row',
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    marginBottom: spacing.sm,
    ...shadows.subtle,
  },
  compactImage: {
    width: 80,
    height: 80,
  },
  compactContent: {
    flex: 1,
    padding: spacing.sm,
    justifyContent: 'center',
  },
  rsvpBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
  },
});
