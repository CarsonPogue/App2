import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { Text, SkeletonCard } from '@/components/atoms';
import { EventCard, FilterChips } from '@/components/molecules';
import { useWeekEvents, useMonthEvents } from '@/hooks';
import { useAuthStore } from '@/stores';
import { colors, spacing, layout } from '@/constants/theme';

type ViewMode = 'week' | 'month';

const FILTER_OPTIONS = [
  { id: 'all', label: 'All' },
  { id: 'going', label: 'Going' },
  { id: 'interested', label: 'Interested' },
  { id: 'concert', label: 'Concerts' },
  { id: 'sports', label: 'Sports' },
  { id: 'food', label: 'Food' },
];

export default function HomeScreen() {
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [selectedFilters, setSelectedFilters] = useState<string[]>(['all']);

  const user = useAuthStore((state) => state.user);
  const weekEvents = useWeekEvents();
  const monthEvents = useMonthEvents();

  const { data, isLoading, refetch, isRefetching } = viewMode === 'week' ? weekEvents : monthEvents;

  const handleFilterSelect = (id: string) => {
    if (id === 'all') {
      setSelectedFilters(['all']);
    } else {
      const newFilters = selectedFilters.filter((f) => f !== 'all');
      if (newFilters.includes(id)) {
        const filtered = newFilters.filter((f) => f !== id);
        setSelectedFilters(filtered.length > 0 ? filtered : ['all']);
      } else {
        setSelectedFilters([...newFilters, id]);
      }
    }
  };

  const handleEventPress = (eventId: string) => {
    router.push(`/event/${eventId}`);
  };

  const filteredEvents = data?.items?.filter((event) => {
    if (selectedFilters.includes('all')) return true;
    if (selectedFilters.includes('going') && event.userRsvp?.status === 'going') return true;
    if (selectedFilters.includes('interested') && event.userRsvp?.status === 'interested') return true;
    if (selectedFilters.includes(event.category)) return true;
    return false;
  }) || [];

  // Helper to get the start of week (Sunday)
  const getWeekStart = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  // Helper to format week range
  const formatWeekRange = (weekStart: Date): string => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const startMonth = weekStart.toLocaleDateString('en-US', { month: 'short' });
    const endMonth = weekEnd.toLocaleDateString('en-US', { month: 'short' });
    const startDay = weekStart.getDate();
    const endDay = weekEnd.getDate();

    if (startMonth === endMonth) {
      return `${startMonth} ${startDay} - ${endDay}`;
    }
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
  };

  // Group events by date (for week view) or by week (for month view)
  const groupedEvents = filteredEvents.reduce((acc, event) => {
    let key: string;
    if (viewMode === 'week') {
      // Group by day for week view
      key = new Date(event.startTime).toDateString();
    } else {
      // Group by week for month view
      const weekStart = getWeekStart(new Date(event.startTime));
      key = weekStart.toISOString();
    }
    if (!acc[key]) acc[key] = [];
    acc[key].push(event);
    return acc;
  }, {} as Record<string, typeof filteredEvents>);

  // Format group headers based on view mode
  const formatGroupHeader = (key: string): string => {
    if (viewMode === 'week') {
      return new Date(key).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      });
    } else {
      const weekStart = new Date(key);
      return formatWeekRange(weekStart);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text variant="h1">Schedule</Text>
          <Text variant="body" color={colors.text.muted}>
            Hey {user?.displayName?.split(' ')[0] || user?.username || 'there'}! 👋
          </Text>
        </View>

        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[styles.toggleButton, viewMode === 'week' && styles.toggleButtonActive]}
            onPress={() => setViewMode('week')}
          >
            <Text
              variant="label"
              color={viewMode === 'week' ? colors.white : colors.text.primary}
            >
              Week
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, viewMode === 'month' && styles.toggleButtonActive]}
            onPress={() => setViewMode('month')}
          >
            <Text
              variant="label"
              color={viewMode === 'month' ? colors.white : colors.text.primary}
            >
              Month
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filters}>
        <FilterChips
          options={FILTER_OPTIONS}
          selected={selectedFilters}
          onSelect={handleFilterSelect}
          multiSelect
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
        ) : Object.entries(groupedEvents).length > 0 ? (
          Object.entries(groupedEvents)
            .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
            .map(([key, events]) => (
            <View key={key} style={styles.dateGroup}>
              <Text variant="h3" style={styles.dateHeader}>
                {formatGroupHeader(key)}
              </Text>
              {events.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onPress={() => handleEventPress(event.id)}
                />
              ))}
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text variant="h3" center>
              No events found
            </Text>
            <Text variant="body" color={colors.text.muted} center style={styles.emptyText}>
              {selectedFilters.includes('all')
                ? 'Check back later for new events in your area'
                : 'Try adjusting your filters'}
            </Text>
          </View>
        )}

        {/* Bottom padding for tab bar */}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl + spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.background.primary,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: colors.gray[100],
    borderRadius: 20,
    padding: 4,
  },
  toggleButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 16,
  },
  toggleButtonActive: {
    backgroundColor: colors.primary.sage,
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
  dateGroup: {
    marginBottom: spacing.lg,
  },
  dateHeader: {
    marginBottom: spacing.md,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptyText: {
    marginTop: spacing.sm,
  },
  bottomPadding: {
    height: layout.tabBarHeight + spacing.xl,
  },
});
