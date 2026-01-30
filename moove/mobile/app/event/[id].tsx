import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Share,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Calendar from 'expo-calendar';
import { Text, Avatar, Button, SkeletonCard } from '@/components/atoms';
import { RSVPButtons, CommentItem } from '@/components/molecules';
import { useEventDetail, useRsvp, useComments, useCreateComment } from '@/hooks';
import { useAuthStore } from '@/stores';
import { colors, spacing, borderRadius, shadows, categoryColors } from '@/constants/theme';
import type { RSVPStatus } from '@moove/shared/types';

function formatDateTime(date: Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [newComment, setNewComment] = useState('');
  const eventId = id ?? '';

  const { data, isLoading } = useEventDetail(eventId);
  const comments = useComments(eventId);
  const rsvp = useRsvp();
  const createComment = useCreateComment();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const event = data?.event;
  const allComments = comments.data?.pages.flatMap((page) => page.items) || [];

  const handleRsvp = async (status: RSVPStatus) => {
    if (!isAuthenticated) {
      Alert.alert(
        'Sign in required',
        'Please sign in to RSVP to events',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => router.push('/(auth)/login') },
        ]
      );
      return;
    }
    if (event) {
      try {
        await rsvp.mutateAsync({ eventId: event.id, status });
      } catch (error) {
        Alert.alert('Error', 'Failed to update RSVP. Please try again.');
      }
    }
  };

  const handleAddToCalendar = async () => {
    if (!event) return;

    // On web, open Google Calendar or iCal link
    if (Platform.OS === 'web') {
      const startDate = new Date(event.startTime);
      const endDate = event.endTime ? new Date(event.endTime) : new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

      // Format dates for Google Calendar URL
      const formatDate = (d: Date) => d.toISOString().replace(/-|:|\.\d{3}/g, '');
      const gcalUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${formatDate(startDate)}/${formatDate(endDate)}&location=${encodeURIComponent(`${event.venueName}, ${event.venueAddress}`)}&details=${encodeURIComponent(event.description || '')}`;

      Linking.openURL(gcalUrl);
      return;
    }

    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Calendar permission is needed to add events');
        return;
      }

      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const defaultCalendar = calendars.find(
        (cal) => cal.allowsModifications && cal.isPrimary
      ) || calendars.find((cal) => cal.allowsModifications);

      if (!defaultCalendar) {
        Alert.alert('Error', 'No writable calendar found');
        return;
      }

      await Calendar.createEventAsync(defaultCalendar.id, {
        title: event.title,
        startDate: new Date(event.startTime),
        endDate: event.endTime ? new Date(event.endTime) : new Date(new Date(event.startTime).getTime() + 2 * 60 * 60 * 1000),
        location: `${event.venueName}, ${event.venueAddress}`,
        notes: event.description || undefined,
      });

      Alert.alert('Success', 'Event added to your calendar!');
    } catch (error) {
      console.error('Calendar error:', error);
      Alert.alert('Error', 'Failed to add event to calendar');
    }
  };

  const handleGetTickets = () => {
    if (event?.ticketUrl) {
      Linking.openURL(event.ticketUrl);
    }
  };

  const handleOpenMaps = () => {
    if (event) {
      const url = Platform.select({
        ios: `maps:?q=${encodeURIComponent(event.venueAddress)}`,
        android: `geo:0,0?q=${encodeURIComponent(event.venueAddress)}`,
        default: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.venueAddress)}`,
      });
      if (url) Linking.openURL(url);
    }
  };

  const handleShare = async () => {
    if (event) {
      await Share.share({
        title: event.title,
        message: `Check out ${event.title} at ${event.venueName}! ${event.ticketUrl || ''}`,
      });
    }
  };

  const handleSubmitComment = async () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Sign in required',
        'Please sign in to post comments',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => router.push('/(auth)/login') },
        ]
      );
      return;
    }
    if (newComment.trim() && event) {
      try {
        await createComment.mutateAsync({
          eventId: event.id,
          content: newComment.trim(),
        });
        setNewComment('');
      } catch (error) {
        Alert.alert('Error', 'Failed to post comment. Please try again.');
      }
    }
  };

  if (isLoading || !event) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <SkeletonCard />
          <SkeletonCard />
        </View>
      </View>
    );
  }

  const categoryColor = categoryColors[event.category as keyof typeof categoryColors] || categoryColors.other;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: event.thumbnailUrl || 'https://via.placeholder.com/600x400' }}
            style={styles.image}
            contentFit="cover"
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.4)', 'transparent', 'rgba(0,0,0,0.8)']}
            style={styles.imageGradient}
          />

          {/* Close button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => router.back()}
          >
            <Text style={styles.closeIcon}>×</Text>
          </TouchableOpacity>

          {/* Category badge */}
          <View style={[styles.categoryBadge, { backgroundColor: categoryColor }]}>
            <Text variant="labelSmall" color={colors.white}>
              {event.category.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Event Info */}
        <View style={styles.content}>
          <Text variant="h1" style={styles.title}>
            {event.title}
          </Text>

          {/* Date & Time */}
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>📅</Text>
            <View>
              <Text variant="body">{formatDateTime(event.startTime)}</Text>
              <TouchableOpacity onPress={handleAddToCalendar}>
                <Text variant="label" color={colors.primary.sage}>
                  Add to Calendar
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Venue */}
          <TouchableOpacity style={styles.infoRow} onPress={handleOpenMaps}>
            <Text style={styles.infoIcon}>📍</Text>
            <View style={styles.infoContent}>
              <Text variant="body">{event.venueName}</Text>
              <Text variant="bodySmall" color={colors.text.muted}>
                {event.venueAddress}
              </Text>
              <Text variant="label" color={colors.primary.sage}>
                Open in Maps
              </Text>
            </View>
          </TouchableOpacity>

          {/* Price */}
          {event.priceRange && (
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>💰</Text>
              <Text variant="body">
                ${event.priceRange.min} - ${event.priceRange.max}
              </Text>
            </View>
          )}

          {/* Get Tickets */}
          {event.ticketUrl && (
            <Button
              title="Get Tickets"
              onPress={handleGetTickets}
              size="large"
              fullWidth
              style={styles.ticketButton}
            />
          )}

          {/* RSVP Section */}
          <View style={styles.rsvpSection}>
            <Text variant="h3" style={styles.sectionTitle}>
              Are you going?
            </Text>
            <RSVPButtons
              currentStatus={event.userRsvp?.status}
              onSelect={handleRsvp}
              disabled={rsvp.isPending}
            />
            <View style={styles.rsvpStats}>
              <Text variant="label" color={colors.text.muted}>
                {event.rsvpCounts.going} going • {event.rsvpCounts.interested} interested
              </Text>
            </View>
          </View>

          {/* Friends Attending */}
          {event.friendsAttending.length > 0 && (
            <View style={styles.friendsSection}>
              <Text variant="label" color={colors.text.muted}>
                Friends going:
              </Text>
              <View style={styles.friendsList}>
                {event.friendsAttending.map((friend) => (
                  <View key={friend.id} style={styles.friendItem}>
                    <Avatar
                      uri={friend.avatarUrl}
                      name={friend.displayName}
                      size="small"
                    />
                    <Text variant="labelSmall">{friend.displayName}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Description */}
          {event.description && (
            <View style={styles.descriptionSection}>
              <Text variant="h3" style={styles.sectionTitle}>
                About
              </Text>
              <Text variant="body" color={colors.text.secondary}>
                {event.description}
              </Text>
            </View>
          )}

          {/* Comments */}
          <View style={styles.commentsSection}>
            <Text variant="h3" style={styles.sectionTitle}>
              Comments ({event.commentCount})
            </Text>

            {allComments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                onReply={() => {}}
              />
            ))}

            {allComments.length === 0 && (
              <Text variant="body" color={colors.text.muted}>
                No comments yet. Be the first to comment!
              </Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Comment Input */}
      <View style={styles.commentInputContainer}>
        <TextInput
          style={styles.commentInput}
          value={newComment}
          onChangeText={setNewComment}
          placeholder="Add a comment..."
          placeholderTextColor={colors.gray[400]}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, !newComment.trim() && styles.sendButtonDisabled]}
          onPress={handleSubmitComment}
          disabled={!newComment.trim() || createComment.isPending}
        >
          <Text
            variant="label"
            color={newComment.trim() ? colors.primary.sage : colors.gray[400]}
          >
            Send
          </Text>
        </TouchableOpacity>
      </View>

      {/* Share Button */}
      <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
        <Text style={styles.shareIcon}>↗</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  loadingContainer: {
    padding: spacing.lg,
    paddingTop: spacing.xxl,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  imageContainer: {
    height: 300,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  closeButton: {
    position: 'absolute',
    top: spacing.xxl,
    left: spacing.md,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '300',
  },
  categoryBadge: {
    position: 'absolute',
    top: spacing.xxl,
    right: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  shareButton: {
    position: 'absolute',
    top: spacing.xxl,
    right: spacing.xxl + 80,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareIcon: {
    color: colors.white,
    fontSize: 18,
  },
  content: {
    padding: spacing.lg,
  },
  title: {
    marginBottom: spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  infoIcon: {
    fontSize: 20,
    marginRight: spacing.md,
    marginTop: 2,
  },
  infoContent: {
    flex: 1,
  },
  ticketButton: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  rsvpSection: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  sectionTitle: {
    marginBottom: spacing.md,
  },
  rsvpStats: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
  friendsSection: {
    marginTop: spacing.lg,
  },
  friendsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  friendItem: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  descriptionSection: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  commentsSection: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    paddingBottom: spacing.xl,
    backgroundColor: colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
    ...shadows.subtle,
  },
  commentInput: {
    flex: 1,
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    marginLeft: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
