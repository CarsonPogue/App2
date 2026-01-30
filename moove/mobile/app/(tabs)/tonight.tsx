import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { Text, SkeletonCard } from '@/components/atoms';
import { EventCard, FilterChips } from '@/components/molecules';
import { useTonightEvents } from '@/hooks';
import { colors, spacing, layout } from '@/constants/theme';
import { EventCategory } from '@moove/shared/types';

const CATEGORY_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'concert', label: 'Concerts' },
  { id: 'sports', label: 'Sports' },
  { id: 'restaurant', label: 'Dining' },
  { id: 'bar', label: 'Nightlife' },
  { id: 'theater', label: 'Theater' },
  { id: 'comedy', label: 'Comedy' },
];

export default function TonightScreen() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { data, isLoading, refetch, isRefetching } = useTonightEvents();

  const handleEventPress = (eventId: string) => {
    router.push(`/event/${eventId}`);
  };

  const handleCategorySelect = (id: string) => {
    setSelectedCategory(id);
  };

  const now = new Date();
  const filteredEvents = (data?.items || []).filter((event) => {
    // Filter out events whose start time has already passed (based on user's local time)
    const eventStart = new Date(event.startTime);
    if (eventStart.getTime() < now.getTime()) {
      return false;
    }
    if (selectedCategory !== 'all' && event.category !== selectedCategory) {
      return false;
    }
    return true;
  });

  // Categorize events by time
  const happeningNow = filteredEvents.filter((event) => {
    const start = new Date(event.startTime);
    const hoursAgo = (now.getTime() - start.getTime()) / (1000 * 60 * 60);
    return hoursAgo >= 0 && hoursAgo <= 2;
  });

  const startingSoon = filteredEvents.filter((event) => {
    const start = new Date(event.startTime);
    const hoursUntil = (start.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntil > 0 && hoursUntil <= 4;
  });

  const laterTonight = filteredEvents.filter((event) => {
    const start = new Date(event.startTime);
    const hoursUntil = (start.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntil > 4;
  });

  const renderSection = (
    title: string,
    events: typeof filteredEvents,
    emptyMessage: string
  ) => {
    if (events.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text variant="h3" style={styles.sectionTitle}>
          {title}
        </Text>
        {events.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            onPress={() => handleEventPress(event.id)}
            compact
          />
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="h1">Tonight</Text>
        <Text variant="body" color={colors.text.muted}>
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
      </View>

      {/* Category Filters */}
      <View style={styles.filters}>
        <FilterChips
          options={CATEGORY_FILTERS}
          selected={[selectedCategory]}
          onSelect={handleCategorySelect}
        />
      </View>

      {/* Events */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary.sage}
          />
        }
      >
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : filteredEvents.length > 0 ? (
          <>
            {renderSection('🔴 Happening Now', happeningNow, '')}
            {renderSection('⏰ Starting Soon', startingSoon, '')}
            {renderSection('🌙 Later Tonight', laterTonight, '')}
          </>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🌙</Text>
            <Text variant="h3" center>
              Nothing happening tonight
            </Text>
            <Text variant="body" color={colors.text.muted} center style={styles.emptyText}>
              Check back later or explore events for this week
            </Text>
          </View>
        )}

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
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl + spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.background.primary,
  },
  filters: {
    paddingVertical: spacing.md,
    backgroundColor: colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    marginBottom: spacing.md,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  emptyText: {
    marginTop: spacing.sm,
  },
  bottomPadding: {
    height: layout.tabBarHeight + spacing.xl,
  },
});
