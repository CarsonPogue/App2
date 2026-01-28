import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Text, Badge, Button } from '@/components/atoms';
import { FriendItem, FriendRequestItem, SearchBar } from '@/components/molecules';
import { useFriends, useFriendRequests, useAcceptFriendRequest, useDeclineFriendRequest, useSendFriendRequest } from '@/hooks';
import { api } from '@/services/api';
import { colors, spacing, borderRadius, layout } from '@/constants/theme';

interface SearchUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

type Tab = 'friends' | 'requests' | 'find';

export default function SocialScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());

  const friends = useFriends();
  const friendRequests = useFriendRequests();
  const acceptRequest = useAcceptFriendRequest();
  const declineRequest = useDeclineFriendRequest();
  const sendFriendRequest = useSendFriendRequest();

  const friendsList = friends.data?.pages.flatMap((page) => page.items) || [];
  const requestsList = friendRequests.data?.items || [];

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      try {
        const { users } = await api.searchUsers(searchQuery);
        setSearchResults(users);
      } catch (error) {
        console.error('Failed to search users:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleSendRequest = async (userId: string) => {
    try {
      await sendFriendRequest.mutateAsync(userId);
      setSentRequests(prev => new Set(prev).add(userId));
    } catch (error) {
      console.error('Failed to send friend request:', error);
    }
  };

  const handleAccept = async (requestId: string) => {
    await acceptRequest.mutateAsync(requestId);
  };

  const handleDecline = async (requestId: string) => {
    await declineRequest.mutateAsync(requestId);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'friends':
        return (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={friends.isRefetching}
                onRefresh={() => friends.refetch()}
                tintColor={colors.primary.kineticOrange}
              />
            }
          >
            {friendsList.length > 0 ? (
              friendsList.map((friend) => (
                <FriendItem
                  key={friend.id}
                  friend={friend}
                  showAction
                  actionLabel="View"
                  onAction={() => {}}
                />
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>👥</Text>
                <Text variant="h3" center>
                  No friends yet
                </Text>
                <Text variant="body" color={colors.text.muted} center style={styles.emptyText}>
                  Find people you know and start connecting
                </Text>
              </View>
            )}
          </ScrollView>
        );

      case 'requests':
        return (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={friendRequests.isRefetching}
                onRefresh={() => friendRequests.refetch()}
                tintColor={colors.primary.kineticOrange}
              />
            }
          >
            {requestsList.length > 0 ? (
              requestsList.map((request) => (
                <FriendRequestItem
                  key={request.id}
                  request={request}
                  onAccept={() => handleAccept(request.id)}
                  onDecline={() => handleDecline(request.id)}
                />
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>📭</Text>
                <Text variant="h3" center>
                  No pending requests
                </Text>
                <Text variant="body" color={colors.text.muted} center style={styles.emptyText}>
                  When someone sends you a friend request, it will appear here
                </Text>
              </View>
            )}
          </ScrollView>
        );

      case 'find':
        return (
          <View style={styles.findContainer}>
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by username or name..."
            />
            {isSearching ? (
              <ActivityIndicator color={colors.primary.kineticOrange} style={styles.loader} />
            ) : searchResults.length > 0 ? (
              <ScrollView style={styles.searchResults} showsVerticalScrollIndicator={false}>
                {searchResults.map((user) => {
                  const alreadyFriend = friendsList.some(f => f.id === user.id);
                  const requestSent = sentRequests.has(user.id);

                  return (
                    <View key={user.id} style={styles.searchResultItem}>
                      <View style={styles.userAvatar}>
                        {user.avatarUrl ? (
                          <View style={styles.avatarImage}>
                            <Text style={styles.avatarInitial}>
                              {user.displayName.charAt(0).toUpperCase()}
                            </Text>
                          </View>
                        ) : (
                          <View style={styles.avatarImage}>
                            <Text style={styles.avatarInitial}>
                              {user.displayName.charAt(0).toUpperCase()}
                            </Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.userInfo}>
                        <Text variant="body" style={styles.displayName}>
                          {user.displayName}
                        </Text>
                        <Text variant="labelSmall" color={colors.text.muted}>
                          @{user.username}
                        </Text>
                      </View>
                      {alreadyFriend ? (
                        <Text variant="labelSmall" color={colors.success}>Friends</Text>
                      ) : requestSent ? (
                        <Text variant="labelSmall" color={colors.text.muted}>Sent</Text>
                      ) : (
                        <Button
                          title="Add"
                          size="small"
                          onPress={() => handleSendRequest(user.id)}
                          loading={sendFriendRequest.isPending}
                        />
                      )}
                    </View>
                  );
                })}
              </ScrollView>
            ) : searchQuery.trim() ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>🤷</Text>
                <Text variant="h3" center>
                  No users found
                </Text>
                <Text variant="body" color={colors.text.muted} center style={styles.emptyText}>
                  Try a different search term
                </Text>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>🔍</Text>
                <Text variant="h3" center>
                  Find friends
                </Text>
                <Text variant="body" color={colors.text.muted} center style={styles.emptyText}>
                  Search for people by their username or name
                </Text>
              </View>
            )}
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="h1">Friends</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'friends' && styles.tabActive]}
          onPress={() => setActiveTab('friends')}
        >
          <Text
            variant="label"
            color={activeTab === 'friends' ? colors.primary.kineticOrange : colors.text.muted}
          >
            Friends
          </Text>
          {friendsList.length > 0 && (
            <Badge label={friendsList.length.toString()} variant="default" />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'requests' && styles.tabActive]}
          onPress={() => setActiveTab('requests')}
        >
          <Text
            variant="label"
            color={activeTab === 'requests' ? colors.primary.kineticOrange : colors.text.muted}
          >
            Requests
          </Text>
          {requestsList.length > 0 && (
            <Badge label={requestsList.length.toString()} variant="warning" />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'find' && styles.tabActive]}
          onPress={() => setActiveTab('find')}
        >
          <Text
            variant="label"
            color={activeTab === 'find' ? colors.primary.kineticOrange : colors.text.muted}
          >
            Find Friends
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {renderContent()}
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
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginRight: spacing.sm,
    gap: spacing.xs,
    borderRadius: borderRadius.full,
  },
  tabActive: {
    backgroundColor: `${colors.primary.kineticOrange}15`,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: layout.tabBarHeight + spacing.xl,
  },
  findContainer: {
    flex: 1,
    padding: spacing.lg,
  },
  loader: {
    marginTop: spacing.xl,
  },
  searchResults: {
    flex: 1,
    marginTop: spacing.md,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  userAvatar: {
    marginRight: spacing.md,
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary.kineticOrange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '600',
  },
  userInfo: {
    flex: 1,
  },
  displayName: {
    fontWeight: '600',
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
});
