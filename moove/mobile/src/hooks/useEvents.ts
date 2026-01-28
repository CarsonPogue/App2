import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { QUERY_KEYS } from '@/constants';
import { useLocationStore } from '@/stores';
import type { EventFilters, RSVPStatus } from '@moove/shared/types';

export function useEvents(filters?: EventFilters) {
  const location = useLocationStore((state) => state.location);
  const radiusMiles = useLocationStore((state) => state.radiusMiles);

  return useInfiniteQuery({
    queryKey: [QUERY_KEYS.EVENTS, filters, location, radiusMiles],
    queryFn: ({ pageParam = 1 }) =>
      api.getEvents(
        {
          ...filters,
          latitude: location?.latitude,
          longitude: location?.longitude,
          radiusMiles,
        },
        pageParam
      ),
    initialPageParam: 1,
    getNextPageParam: (lastPage, pages) =>
      lastPage.hasMore ? pages.length + 1 : undefined,
    enabled: !!location,
  });
}

export function useTonightEvents() {
  const location = useLocationStore((state) => state.location);
  const radiusMiles = useLocationStore((state) => state.radiusMiles);
  const hasRealLocation = useLocationStore((state) => state.hasRealLocation);

  return useQuery({
    queryKey: [QUERY_KEYS.TONIGHT_EVENTS, location, radiusMiles, hasRealLocation],
    queryFn: () => api.getTonightEvents(
      hasRealLocation ? location?.latitude : undefined,
      hasRealLocation ? location?.longitude : undefined,
      hasRealLocation ? radiusMiles : undefined
    ),
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}

export function useWeekEvents() {
  const location = useLocationStore((state) => state.location);
  const radiusMiles = useLocationStore((state) => state.radiusMiles);
  const hasRealLocation = useLocationStore((state) => state.hasRealLocation);

  return useQuery({
    queryKey: [QUERY_KEYS.WEEK_EVENTS, location, radiusMiles, hasRealLocation],
    queryFn: () => api.getWeekEvents(
      hasRealLocation ? location?.latitude : undefined,
      hasRealLocation ? location?.longitude : undefined,
      hasRealLocation ? radiusMiles : undefined
    ),
  });
}

export function useMonthEvents() {
  const location = useLocationStore((state) => state.location);
  const radiusMiles = useLocationStore((state) => state.radiusMiles);
  const hasRealLocation = useLocationStore((state) => state.hasRealLocation);

  return useQuery({
    queryKey: [QUERY_KEYS.MONTH_EVENTS, location, radiusMiles, hasRealLocation],
    queryFn: () => api.getMonthEvents(
      hasRealLocation ? location?.latitude : undefined,
      hasRealLocation ? location?.longitude : undefined,
      hasRealLocation ? radiusMiles : undefined
    ),
  });
}

export function useEventDetail(eventId: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.EVENT_DETAIL, eventId],
    queryFn: () => api.getEvent(eventId),
    enabled: !!eventId,
  });
}

export function useTrendingEvents() {
  return useQuery({
    queryKey: [QUERY_KEYS.TRENDING_EVENTS],
    queryFn: () => api.getTrendingEvents(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useNearbyPlaces() {
  const location = useLocationStore((state) => state.location);
  const radiusMiles = useLocationStore((state) => state.radiusMiles);
  const hasRealLocation = useLocationStore((state) => state.hasRealLocation);

  return useQuery({
    queryKey: [QUERY_KEYS.NEARBY_PLACES, location, radiusMiles],
    queryFn: () => api.getNearbyPlaces(
      location!.latitude,
      location!.longitude,
      radiusMiles
    ),
    enabled: hasRealLocation && !!location,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useRsvp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      eventId,
      status,
      emojiReaction,
    }: {
      eventId: string;
      status: RSVPStatus;
      emojiReaction?: string;
    }) => api.rsvpEvent(eventId, status, emojiReaction),
    onSuccess: (_, { eventId }) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EVENT_DETAIL, eventId] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EVENTS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TONIGHT_EVENTS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.WEEK_EVENTS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MONTH_EVENTS] });
    },
  });
}

export function useRemoveRsvp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (eventId: string) => api.removeRsvp(eventId),
    onSuccess: (_, eventId) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EVENT_DETAIL, eventId] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EVENTS] });
    },
  });
}

export function useHideEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (eventId: string) => api.hideEvent(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EVENTS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TONIGHT_EVENTS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.WEEK_EVENTS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MONTH_EVENTS] });
    },
  });
}

export function useComments(eventId: string) {
  return useInfiniteQuery({
    queryKey: [QUERY_KEYS.COMMENTS, eventId],
    queryFn: ({ pageParam = 1 }) => api.getComments(eventId, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage, pages) =>
      lastPage.hasMore ? pages.length + 1 : undefined,
    enabled: !!eventId,
  });
}

export function useCreateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      eventId,
      content,
      parentCommentId,
    }: {
      eventId: string;
      content: string;
      parentCommentId?: string;
    }) => api.createComment(eventId, content, parentCommentId),
    onSuccess: (_, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.COMMENTS, eventId] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EVENT_DETAIL, eventId] });
    },
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, commentId }: { eventId: string; commentId: string }) =>
      api.deleteComment(eventId, commentId),
    onSuccess: (_, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.COMMENTS, eventId] });
    },
  });
}
