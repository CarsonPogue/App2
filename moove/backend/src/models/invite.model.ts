import { query } from '../config/database';
import type { EventInvite, EventInviteWithDetails, InviteStatus, PaginatedResponse } from '@moove/shared/types';
import { ConflictError, NotFoundError } from '../utils/errors';
import { PAGINATION } from '@moove/shared/constants';

interface DbInvite {
  id: string;
  event_id: string;
  sender_id: string;
  recipient_id: string;
  message: string | null;
  status: InviteStatus;
  created_at: Date;
  responded_at: Date | null;
}

function mapDbInviteToInvite(dbInvite: DbInvite): EventInvite {
  return {
    id: dbInvite.id,
    eventId: dbInvite.event_id,
    senderId: dbInvite.sender_id,
    recipientId: dbInvite.recipient_id,
    message: dbInvite.message,
    status: dbInvite.status,
    createdAt: dbInvite.created_at,
    respondedAt: dbInvite.responded_at,
  };
}

export async function createInvite(
  eventId: string,
  senderId: string,
  recipientId: string,
  message?: string
): Promise<EventInvite> {
  if (senderId === recipientId) {
    throw new ConflictError('Cannot invite yourself', 'SELF_INVITE');
  }

  // Check for existing invite
  const existing = await query<{ id: string }>(
    `SELECT id FROM event_invites
     WHERE event_id = $1 AND sender_id = $2 AND recipient_id = $3`,
    [eventId, senderId, recipientId]
  );

  if (existing.rows.length > 0) {
    throw new ConflictError('Invite already sent', 'INVITE_EXISTS');
  }

  const result = await query<DbInvite>(
    `INSERT INTO event_invites (event_id, sender_id, recipient_id, message)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [eventId, senderId, recipientId, message || null]
  );

  return mapDbInviteToInvite(result.rows[0]);
}

export async function respondToInvite(
  inviteId: string,
  userId: string,
  status: 'accepted' | 'declined'
): Promise<EventInvite> {
  const result = await query<DbInvite>(
    `UPDATE event_invites
     SET status = $1, responded_at = NOW()
     WHERE id = $2 AND recipient_id = $3 AND status = 'pending'
     RETURNING *`,
    [status, inviteId, userId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Invite');
  }

  return mapDbInviteToInvite(result.rows[0]);
}

export async function getReceivedInvites(
  userId: string,
  page: number = 1,
  pageSize: number = PAGINATION.DEFAULT_PAGE_SIZE
): Promise<PaginatedResponse<EventInviteWithDetails>> {
  const offset = (page - 1) * pageSize;

  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM event_invites
     WHERE recipient_id = $1 AND status = 'pending'`,
    [userId]
  );
  const total = parseInt(countResult.rows[0].count, 10);

  const result = await query<DbInvite & {
    event_title: string;
    event_start_time: Date;
    event_thumbnail_url: string | null;
    event_venue_name: string;
    sender_username: string;
    sender_display_name: string;
    sender_avatar_url: string | null;
    recipient_username: string;
    recipient_display_name: string;
    recipient_avatar_url: string | null;
  }>(
    `SELECT i.*,
            e.title as event_title, e.start_time as event_start_time,
            e.thumbnail_url as event_thumbnail_url, e.venue_name as event_venue_name,
            s.username as sender_username, s.display_name as sender_display_name, s.avatar_url as sender_avatar_url,
            r.username as recipient_username, r.display_name as recipient_display_name, r.avatar_url as recipient_avatar_url
     FROM event_invites i
     JOIN events e ON e.id = i.event_id
     JOIN users s ON s.id = i.sender_id
     JOIN users r ON r.id = i.recipient_id
     WHERE i.recipient_id = $1 AND i.status = 'pending'
     ORDER BY i.created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, pageSize, offset]
  );

  const items: EventInviteWithDetails[] = result.rows.map((row) => ({
    ...mapDbInviteToInvite(row),
    event: {
      id: row.event_id,
      externalId: null,
      source: 'user_created' as any,
      title: row.event_title,
      description: null,
      category: 'other' as any,
      subcategory: null,
      venueName: row.event_venue_name,
      venueAddress: '',
      location: { latitude: 0, longitude: 0 },
      googlePlaceId: null,
      thumbnailUrl: row.event_thumbnail_url,
      images: [],
      startTime: row.event_start_time,
      endTime: null,
      priceRange: null,
      ticketUrl: null,
      rating: null,
      isFeatured: false,
      relevanceTags: [],
      createdAt: row.created_at,
      updatedAt: row.created_at,
    },
    sender: {
      id: row.sender_id,
      username: row.sender_username,
      displayName: row.sender_display_name,
      avatarUrl: row.sender_avatar_url,
    },
    recipient: {
      id: row.recipient_id,
      username: row.recipient_username,
      displayName: row.recipient_display_name,
      avatarUrl: row.recipient_avatar_url,
    },
  }));

  return {
    items,
    total,
    page,
    pageSize,
    hasMore: offset + items.length < total,
  };
}

export async function getSentInvites(
  userId: string,
  page: number = 1,
  pageSize: number = PAGINATION.DEFAULT_PAGE_SIZE
): Promise<PaginatedResponse<EventInviteWithDetails>> {
  const offset = (page - 1) * pageSize;

  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM event_invites WHERE sender_id = $1`,
    [userId]
  );
  const total = parseInt(countResult.rows[0].count, 10);

  const result = await query<DbInvite & {
    event_title: string;
    event_start_time: Date;
    event_thumbnail_url: string | null;
    event_venue_name: string;
    sender_username: string;
    sender_display_name: string;
    sender_avatar_url: string | null;
    recipient_username: string;
    recipient_display_name: string;
    recipient_avatar_url: string | null;
  }>(
    `SELECT i.*,
            e.title as event_title, e.start_time as event_start_time,
            e.thumbnail_url as event_thumbnail_url, e.venue_name as event_venue_name,
            s.username as sender_username, s.display_name as sender_display_name, s.avatar_url as sender_avatar_url,
            r.username as recipient_username, r.display_name as recipient_display_name, r.avatar_url as recipient_avatar_url
     FROM event_invites i
     JOIN events e ON e.id = i.event_id
     JOIN users s ON s.id = i.sender_id
     JOIN users r ON r.id = i.recipient_id
     WHERE i.sender_id = $1
     ORDER BY i.created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, pageSize, offset]
  );

  const items: EventInviteWithDetails[] = result.rows.map((row) => ({
    ...mapDbInviteToInvite(row),
    event: {
      id: row.event_id,
      externalId: null,
      source: 'user_created' as any,
      title: row.event_title,
      description: null,
      category: 'other' as any,
      subcategory: null,
      venueName: row.event_venue_name,
      venueAddress: '',
      location: { latitude: 0, longitude: 0 },
      googlePlaceId: null,
      thumbnailUrl: row.event_thumbnail_url,
      images: [],
      startTime: row.event_start_time,
      endTime: null,
      priceRange: null,
      ticketUrl: null,
      rating: null,
      isFeatured: false,
      relevanceTags: [],
      createdAt: row.created_at,
      updatedAt: row.created_at,
    },
    sender: {
      id: row.sender_id,
      username: row.sender_username,
      displayName: row.sender_display_name,
      avatarUrl: row.sender_avatar_url,
    },
    recipient: {
      id: row.recipient_id,
      username: row.recipient_username,
      displayName: row.recipient_display_name,
      avatarUrl: row.recipient_avatar_url,
    },
  }));

  return {
    items,
    total,
    page,
    pageSize,
    hasMore: offset + items.length < total,
  };
}
