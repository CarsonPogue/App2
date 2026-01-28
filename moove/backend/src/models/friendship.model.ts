import { query } from '../config/database';
import type { Friendship, FriendshipStatus, FriendshipWithUsers, UserSummary, PaginatedResponse } from '@moove/shared/types';
import { ConflictError, NotFoundError } from '../utils/errors';
import { ERROR_CODES, PAGINATION } from '@moove/shared/constants';

interface DbFriendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: FriendshipStatus;
  created_at: Date;
  updated_at: Date;
}

function mapDbFriendshipToFriendship(dbFriendship: DbFriendship): Friendship {
  return {
    id: dbFriendship.id,
    requesterId: dbFriendship.requester_id,
    addresseeId: dbFriendship.addressee_id,
    status: dbFriendship.status,
    createdAt: dbFriendship.created_at,
    updatedAt: dbFriendship.updated_at,
  };
}

export async function sendFriendRequest(
  requesterId: string,
  addresseeId: string
): Promise<Friendship> {
  if (requesterId === addresseeId) {
    throw new ConflictError('Cannot send friend request to yourself', ERROR_CODES.CANNOT_FRIEND_SELF);
  }

  // Check for existing relationship (in either direction)
  const existing = await query<DbFriendship>(
    `SELECT * FROM friendships
     WHERE (requester_id = $1 AND addressee_id = $2)
        OR (requester_id = $2 AND addressee_id = $1)`,
    [requesterId, addresseeId]
  );

  if (existing.rows.length > 0) {
    const friendship = existing.rows[0];
    if (friendship.status === 'blocked') {
      throw new ConflictError('Unable to send friend request', ERROR_CODES.USER_BLOCKED);
    }
    if (friendship.status === 'accepted') {
      throw new ConflictError('Already friends', ERROR_CODES.ALREADY_FRIENDS);
    }
    throw new ConflictError('Friend request already exists', ERROR_CODES.REQUEST_EXISTS);
  }

  const result = await query<DbFriendship>(
    `INSERT INTO friendships (requester_id, addressee_id, status)
     VALUES ($1, $2, 'pending')
     RETURNING *`,
    [requesterId, addresseeId]
  );

  return mapDbFriendshipToFriendship(result.rows[0]);
}

export async function acceptFriendRequest(
  requestId: string,
  userId: string
): Promise<Friendship> {
  const result = await query<DbFriendship>(
    `UPDATE friendships
     SET status = 'accepted'
     WHERE id = $1 AND addressee_id = $2 AND status = 'pending'
     RETURNING *`,
    [requestId, userId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Friend request');
  }

  return mapDbFriendshipToFriendship(result.rows[0]);
}

export async function declineFriendRequest(
  requestId: string,
  userId: string
): Promise<void> {
  const result = await query(
    `DELETE FROM friendships
     WHERE id = $1 AND addressee_id = $2 AND status = 'pending'
     RETURNING id`,
    [requestId, userId]
  );

  if (result.rowCount === 0) {
    throw new NotFoundError('Friend request');
  }
}

export async function removeFriend(userId: string, friendId: string): Promise<void> {
  const result = await query(
    `DELETE FROM friendships
     WHERE ((requester_id = $1 AND addressee_id = $2)
        OR (requester_id = $2 AND addressee_id = $1))
       AND status = 'accepted'
     RETURNING id`,
    [userId, friendId]
  );

  if (result.rowCount === 0) {
    throw new NotFoundError('Friendship');
  }
}

export async function blockUser(userId: string, blockedId: string): Promise<void> {
  // Remove existing friendship if any
  await query(
    `DELETE FROM friendships
     WHERE (requester_id = $1 AND addressee_id = $2)
        OR (requester_id = $2 AND addressee_id = $1)`,
    [userId, blockedId]
  );

  // Create blocked relationship
  await query(
    `INSERT INTO friendships (requester_id, addressee_id, status)
     VALUES ($1, $2, 'blocked')
     ON CONFLICT DO NOTHING`,
    [userId, blockedId]
  );
}

export async function unblockUser(userId: string, blockedId: string): Promise<void> {
  await query(
    `DELETE FROM friendships
     WHERE requester_id = $1 AND addressee_id = $2 AND status = 'blocked'`,
    [userId, blockedId]
  );
}

export async function getFriends(
  userId: string,
  page: number = 1,
  pageSize: number = PAGINATION.DEFAULT_PAGE_SIZE
): Promise<PaginatedResponse<UserSummary>> {
  const offset = (page - 1) * pageSize;

  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM friendships
     WHERE ((requester_id = $1 OR addressee_id = $1) AND status = 'accepted')`,
    [userId]
  );
  const total = parseInt(countResult.rows[0].count, 10);

  const result = await query<{ id: string; username: string; display_name: string; avatar_url: string | null }>(
    `SELECT u.id, u.username, u.display_name, u.avatar_url
     FROM friendships f
     JOIN users u ON (
       CASE WHEN f.requester_id = $1 THEN f.addressee_id ELSE f.requester_id END = u.id
     )
     WHERE ((f.requester_id = $1 OR f.addressee_id = $1) AND f.status = 'accepted')
     ORDER BY u.display_name ASC
     LIMIT $2 OFFSET $3`,
    [userId, pageSize, offset]
  );

  const items: UserSummary[] = result.rows.map((row) => ({
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
  }));

  return {
    items,
    total,
    page,
    pageSize,
    hasMore: offset + items.length < total,
  };
}

export async function getPendingRequests(
  userId: string
): Promise<FriendshipWithUsers[]> {
  const result = await query<DbFriendship & {
    requester_username: string;
    requester_display_name: string;
    requester_avatar_url: string | null;
    addressee_username: string;
    addressee_display_name: string;
    addressee_avatar_url: string | null;
  }>(
    `SELECT f.*,
            r.username as requester_username, r.display_name as requester_display_name, r.avatar_url as requester_avatar_url,
            a.username as addressee_username, a.display_name as addressee_display_name, a.avatar_url as addressee_avatar_url
     FROM friendships f
     JOIN users r ON r.id = f.requester_id
     JOIN users a ON a.id = f.addressee_id
     WHERE f.addressee_id = $1 AND f.status = 'pending'
     ORDER BY f.created_at DESC`,
    [userId]
  );

  return result.rows.map((row) => ({
    ...mapDbFriendshipToFriendship(row),
    requester: {
      id: row.requester_id,
      username: row.requester_username,
      displayName: row.requester_display_name,
      avatarUrl: row.requester_avatar_url,
    },
    addressee: {
      id: row.addressee_id,
      username: row.addressee_username,
      displayName: row.addressee_display_name,
      avatarUrl: row.addressee_avatar_url,
    },
  }));
}

export async function areFriends(userId1: string, userId2: string): Promise<boolean> {
  const result = await query<{ id: string }>(
    `SELECT id FROM friendships
     WHERE ((requester_id = $1 AND addressee_id = $2)
        OR (requester_id = $2 AND addressee_id = $1))
       AND status = 'accepted'`,
    [userId1, userId2]
  );

  return result.rows.length > 0;
}
