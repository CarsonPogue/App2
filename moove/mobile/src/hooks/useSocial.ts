import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { QUERY_KEYS } from '@/constants';

export function useFriends() {
  return useInfiniteQuery({
    queryKey: [QUERY_KEYS.FRIENDS],
    queryFn: ({ pageParam = 1 }) => api.getFriends(pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage, pages) =>
      lastPage.hasMore ? pages.length + 1 : undefined,
  });
}

export function useFriendRequests() {
  return useQuery({
    queryKey: [QUERY_KEYS.FRIEND_REQUESTS],
    queryFn: () => api.getFriendRequests(),
  });
}

export function useSendFriendRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => api.sendFriendRequest(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.FRIENDS] });
    },
  });
}

export function useAcceptFriendRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (requestId: string) => api.acceptFriendRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.FRIENDS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.FRIEND_REQUESTS] });
    },
  });
}

export function useDeclineFriendRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (requestId: string) => api.declineFriendRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.FRIEND_REQUESTS] });
    },
  });
}

export function useRemoveFriend() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => api.removeFriend(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.FRIENDS] });
    },
  });
}

export function useBlockUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => api.blockUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.FRIENDS] });
    },
  });
}

export function useReceivedInvites() {
  return useInfiniteQuery({
    queryKey: [QUERY_KEYS.INVITES_RECEIVED],
    queryFn: ({ pageParam = 1 }) => api.getReceivedInvites(pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage, pages) =>
      lastPage.hasMore ? pages.length + 1 : undefined,
  });
}

export function useSentInvites() {
  return useInfiniteQuery({
    queryKey: [QUERY_KEYS.INVITES_SENT],
    queryFn: ({ pageParam = 1 }) => api.getSentInvites(pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage, pages) =>
      lastPage.hasMore ? pages.length + 1 : undefined,
  });
}

export function useSendInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      eventId,
      recipientId,
      message,
    }: {
      eventId: string;
      recipientId: string;
      message?: string;
    }) => api.sendInvite(eventId, recipientId, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.INVITES_SENT] });
    },
  });
}

export function useRespondToInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      inviteId,
      status,
    }: {
      inviteId: string;
      status: 'accepted' | 'declined';
    }) => api.respondToInvite(inviteId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.INVITES_RECEIVED] });
    },
  });
}
