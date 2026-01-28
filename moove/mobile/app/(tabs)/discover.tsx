import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { Text, SkeletonCard } from '@/components/atoms';
import { EventCard, SearchBar } from '@/components/molecules';
import { useEvents, useTrendingEvents, useNearbyPlaces } from '@/hooks';
import { colors, spacing, layout } from '@/constants/theme';
import type { EventWithRSVP } from '@moove/shared/types';

export default function DiscoverScreen() {
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading, refetch, isRefetching, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useEvents(searchQuery ? { search: searchQuery } : undefined);

  const { data: trendingData, isLoading: trendingLoading } = useTrendingEvents();
  const { data: placesData, isLoading: placesLoading } = useNearbyPlaces();

  const handleEventPress = (eventId: string) => {
    router.push(`/event/${eventId}`);
  };

  const handleSearch = () => {
    setSearchQuery(search);
  };

  const handleClear = () => {
    setSearch('');
    setSearchQuery('');
  };

  const events = data?.pages.flatMap((page) => page.items) || [];

  const renderEvent = ({ item }: { item: EventWithRSVP }) => (
    <EventCard
      event={item}
      onPress={() => handleEventPress(item.id)}
    />
  );

  const renderFooter = () => {
    if (isFetchingNextPage) {
      return (
        <View style={styles.loadingFooter}>
          <SkeletonCard />
        </View>
      );
    }
    return null;
  };

  const trendingEvents = trendingData?.items || [];
  const nearbyPlaces = placesData?.items || [];

  const renderEmpty = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      );
    }

    // Show trending events and nearby places when not searching
    if (!searchQuery && (trendingEvents.length > 0 || nearbyPlaces.length > 0)) {
      return (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Trending Events */}
          {trendingEvents.length > 0 && (
            <View style={styles.trendingContainer}>
              <View style={styles.trendingHeader}>
                <Text variant="h2">Trending Events</Text>
                <Text variant="body" color={colors.text.muted}>
                  Popular events everyone's talking about
                </Text>
              </View>
              {trendingEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onPress={() => handleEventPress(event.id)}
                />
              ))}
            </View>
          )}

          {/* Nearby Places */}
          {nearbyPlaces.length > 0 && (
            <View style={styles.placesContainer}>
              <View style={styles.trendingHeader}>
                <Text variant="h2">Highly Rated Nearby</Text>
                <Text variant="body" color={colors.text.muted}>
                  Top-rated restaurants, venues, and attractions
                </Text>
              </View>
              {nearbyPlaces.slice(0, 10).map((place) => (
                <View key={place.id} style={styles.placeCard}>
                  {place.thumbnailUrl && (
                    <View style={styles.placeThumbnail}>
                      <View style={styles.placeThumbnailPlaceholder} />
                    </View>
                  )}
                  <View style={styles.placeInfo}>
                    <Text variant="h3" numberOfLines={1}>{place.name}</Text>
                    <Text variant="bodySmall" color={colors.text.muted} numberOfLines={1}>
                      {place.address}
                    </Text>
                    <View style={styles.placeDetails}>
                      {place.rating && (
                        <Text variant="label" color={colors.warning}>
                          ★ {place.rating.toFixed(1)}
                        </Text>
                      )}
                      <Text variant="labelSmall" color={colors.text.muted}>
                        {place.category.charAt(0).toUpperCase() + place.category.slice(1)}
                      </Text>
                      {place.isOpen !== null && (
                        <Text variant="labelSmall" color={place.isOpen ? colors.success : colors.error}>
                          {place.isOpen ? 'Open' : 'Closed'}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          <View style={{ height: layout.tabBarHeight + spacing.xl }} />
        </ScrollView>
      );
    }

    if (!searchQuery && trendingLoading) {
      return (
        <View style={styles.loadingContainer}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyEmoji}>🔍</Text>
        <Text variant="h3" center>
          {searchQuery ? 'No results found' : 'Discover events'}
        </Text>
        <Text variant="body" color={colors.text.muted} center style={styles.emptyText}>
          {searchQuery
            ? `No events matching "${searchQuery}"`
            : 'Search for concerts, sports, restaurants, and more'}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="h1">Discover</Text>
        <View style={styles.searchContainer}>
          <SearchBar
            value={search}
            onChangeText={setSearch}
            placeholder="Search events, venues, artists..."
            onSubmit={handleSearch}
            onClear={handleClear}
          />
        </View>
      </View>

      {/* Events List */}
      <FlatList
        data={events}
        renderItem={renderEvent}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary.kineticOrange}
          />
        }
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
      />
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
  searchContainer: {
    marginTop: spacing.md,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: layout.tabBarHeight + spacing.xl,
  },
  loadingContainer: {
    padding: spacing.lg,
  },
  loadingFooter: {
    paddingVertical: spacing.md,
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
    paddingHorizontal: spacing.xl,
  },
  trendingContainer: {
    paddingBottom: spacing.xl,
  },
  trendingHeader: {
    marginBottom: spacing.lg,
  },
  placesContainer: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  placeCard: {
    flexDirection: 'row',
    backgroundColor: colors.background.card,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  placeThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: spacing.md,
    overflow: 'hidden',
  },
  placeThumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.gray[200],
  },
  placeInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  placeDetails: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
    alignItems: 'center',
  },
});
