import { query } from '../config/database';
import type { RSVP, RSVPStatus, RSVPWithUser, UserSummary } from '@moove/shared/types';
import { NotFoundError } from '../utils/errors';

interface DbRSVP {
  id: string;
  user_id: string;
  event_id: string;
  status: RSVPStatus;
  emoji_reaction: string | null;
  created_at: Date;
  updated_at: Date;
}

function mapDbRSVPToRSVP(dbRsvp: DbRSVP): RSVP {
  return {
    id: dbRsvp.id,
    userId: dbRsvp.user_id,
    eventId: dbRsvp.event_id,
    status: dbRsvp.status,
    emojiReaction: dbRsvp.emoji_reaction,
    createdAt: dbRsvp.created_at,
    updatedAt: dbRsvp.updated_at,
  };
}

export async function createOrUpdateRSVP(
  userId: string,
  eventId: string,
  status: RSVPStatus,
  emojiReaction?: string
): Promise<RSVP> {
  const result = await query<DbRSVP>(
    `INSERT INTO rsvps (user_id, event_id, status, emoji_reaction)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, event_id) DO UPDATE SET
       status = EXCLUDED.status,
       emoji_reaction = COALESCE(EXCLUDED.emoji_reaction, rsvps.emoji_reaction)
     RETURNING id, user_id, event_id, status, emoji_reaction, created_at, updated_at`,
    [userId, eventId, status, emojiReaction || null]
  );

  return mapDbRSVPToRSVP(result.rows[0]);
}

export async function updateRSVPEmoji(
  userId: string,
  eventId: string,
  emojiReaction: string | null
): Promise<RSVP> {
  const result = await query<DbRSVP>(
    `UPDATE rsvps SET emoji_reaction = $1
     WHERE user_id = $2 AND event_id = $3
     RETURNING id, user_id, event_id, status, emoji_reaction, created_at, updated_at`,
    [emojiReaction, userId, eventId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('RSVP');
  }

  return mapDbRSVPToRSVP(result.rows[0]);
}

export async function deleteRSVP(userId: string, eventId: string): Promise<boolean> {
  const result = await query(
    'DELETE FROM rsvps WHERE user_id = $1 AND event_id = $2 RETURNING id',
    [userId, eventId]
  );

  return result.rowCount !== null && result.rowCount > 0;
}

export async function findRSVPsByEvent(eventId: string): Promise<RSVPWithUser[]> {
  const result = await query<DbRSVP & { username: string; display_name: string; avatar_url: string | null }>(
    `SELECT r.id, r.user_id, r.event_id, r.status, r.emoji_reaction, r.created_at, r.updated_at,
            u.username, u.display_name, u.avatar_url
     FROM rsvps r
     JOIN users u ON u.id = r.user_id
     WHERE r.event_id = $1 AND r.status IN ('going', 'interested')
     ORDER BY r.created_at DESC`,
    [eventId]
  );

  return result.rows.map((row) => ({
    ...mapDbRSVPToRSVP(row),
    user: {
      id: row.user_id,
      username: row.username,
      displayName: row.display_name,
      avatarUrl: row.avatar_url,
    },
  }));
}

export async function findRSVPByUserAndEvent(
  userId: string,
  eventId: string
): Promise<RSVP | null> {
  const result = await query<DbRSVP>(
    `SELECT id, user_id, event_id, status, emoji_reaction, created_at, updated_at
     FROM rsvps WHERE user_id = $1 AND event_id = $2`,
    [userId, eventId]
  );

  if (result.rows.length === 0) return null;
  return mapDbRSVPToRSVP(result.rows[0]);
}

export async function findUserRSVPs(
  userId: string,
  status?: RSVPStatus[]
): Promise<RSVP[]> {
  let sql = `SELECT id, user_id, event_id, status, emoji_reaction, created_at, updated_at
             FROM rsvps WHERE user_id = $1`;
  const params: unknown[] = [userId];

  if (status && status.length > 0) {
    sql += ' AND status = ANY($2)';
    params.push(status);
  }

  sql += ' ORDER BY created_at DESC';

  const result = await query<DbRSVP>(sql, params);
  return result.rows.map(mapDbRSVPToRSVP);
}

export async function getFriendsAttendingEvent(
  userId: string,
  eventId: string
): Promise<UserSummary[]> {
  const result = await query<{ id: string; username: string; display_name: string; avatar_url: string | null }>(
    `SELECT DISTINCT u.id, u.username, u.display_name, u.avatar_url
     FROM users u
     JOIN rsvps r ON r.user_id = u.id
     JOIN friendships f ON (
       (f.requester_id = $1 AND f.addressee_id = u.id) OR
       (f.addressee_id = $1 AND f.requester_id = u.id)
     )
     WHERE r.event_id = $2
       AND r.status IN ('going', 'interested')
       AND f.status = 'accepted'
     LIMIT 10`,
    [userId, eventId]
  );

  return result.rows.map((row) => ({
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
  }));
}
