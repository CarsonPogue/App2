import { query } from '../config/database';
import type { Comment, CommentWithUser, PaginatedResponse } from '@moove/shared/types';
import { NotFoundError, AuthorizationError } from '../utils/errors';
import { PAGINATION } from '@moove/shared/constants';

interface DbComment {
  id: string;
  event_id: string;
  user_id: string;
  parent_comment_id: string | null;
  content: string;
  is_deleted: boolean;
  created_at: Date;
  updated_at: Date;
}

function mapDbCommentToComment(dbComment: DbComment): Comment {
  return {
    id: dbComment.id,
    eventId: dbComment.event_id,
    userId: dbComment.user_id,
    parentCommentId: dbComment.parent_comment_id,
    content: dbComment.content,
    isDeleted: dbComment.is_deleted,
    createdAt: dbComment.created_at,
    updatedAt: dbComment.updated_at,
  };
}

export async function createComment(
  eventId: string,
  userId: string,
  content: string,
  parentCommentId?: string
): Promise<CommentWithUser> {
  // Verify parent comment exists if provided
  if (parentCommentId) {
    const parentResult = await query<{ id: string }>(
      'SELECT id FROM comments WHERE id = $1 AND event_id = $2 AND is_deleted = FALSE',
      [parentCommentId, eventId]
    );
    if (parentResult.rows.length === 0) {
      throw new NotFoundError('Parent comment');
    }
  }

  // Insert comment first
  await query(
    `INSERT INTO comments (event_id, user_id, parent_comment_id, content)
     VALUES ($1, $2, $3, $4)`,
    [eventId, userId, parentCommentId || null, content]
  );

  // Need to fetch with user data separately due to INSERT...RETURNING limitations
  const commentResult = await query<DbComment>(
    'SELECT * FROM comments WHERE event_id = $1 AND user_id = $2 ORDER BY created_at DESC LIMIT 1',
    [eventId, userId]
  );

  const userResult = await query<{ id: string; username: string; display_name: string; avatar_url: string | null }>(
    'SELECT id, username, display_name, avatar_url FROM users WHERE id = $1',
    [userId]
  );

  const comment = mapDbCommentToComment(commentResult.rows[0]);
  const user = userResult.rows[0];

  return {
    ...comment,
    user: {
      id: user.id,
      username: user.username,
      displayName: user.display_name,
      avatarUrl: user.avatar_url,
    },
  };
}

export async function findCommentsByEvent(
  eventId: string,
  page: number = 1,
  pageSize: number = PAGINATION.DEFAULT_PAGE_SIZE
): Promise<PaginatedResponse<CommentWithUser>> {
  const offset = (page - 1) * pageSize;

  // Get total count of top-level comments
  const countResult = await query<{ count: string }>(
    'SELECT COUNT(*) as count FROM comments WHERE event_id = $1 AND parent_comment_id IS NULL AND is_deleted = FALSE',
    [eventId]
  );
  const total = parseInt(countResult.rows[0].count, 10);

  // Get top-level comments with user data
  const commentsResult = await query<DbComment & { username: string; display_name: string; avatar_url: string | null }>(
    `SELECT c.*, u.username, u.display_name, u.avatar_url
     FROM comments c
     JOIN users u ON u.id = c.user_id
     WHERE c.event_id = $1 AND c.parent_comment_id IS NULL AND c.is_deleted = FALSE
     ORDER BY c.created_at DESC
     LIMIT $2 OFFSET $3`,
    [eventId, pageSize, offset]
  );

  // Get all replies for these comments
  const commentIds = commentsResult.rows.map((c) => c.id);
  let repliesMap: Map<string, CommentWithUser[]> = new Map();

  if (commentIds.length > 0) {
    const repliesResult = await query<DbComment & { username: string; display_name: string; avatar_url: string | null }>(
      `SELECT c.*, u.username, u.display_name, u.avatar_url
       FROM comments c
       JOIN users u ON u.id = c.user_id
       WHERE c.parent_comment_id = ANY($1) AND c.is_deleted = FALSE
       ORDER BY c.created_at ASC`,
      [commentIds]
    );

    repliesResult.rows.forEach((row) => {
      const reply: CommentWithUser = {
        ...mapDbCommentToComment(row),
        user: {
          id: row.user_id,
          username: row.username,
          displayName: row.display_name,
          avatarUrl: row.avatar_url,
        },
      };

      const parentId = row.parent_comment_id!;
      if (!repliesMap.has(parentId)) {
        repliesMap.set(parentId, []);
      }
      repliesMap.get(parentId)!.push(reply);
    });
  }

  const comments: CommentWithUser[] = commentsResult.rows.map((row) => ({
    ...mapDbCommentToComment(row),
    user: {
      id: row.user_id,
      username: row.username,
      displayName: row.display_name,
      avatarUrl: row.avatar_url,
    },
    replies: repliesMap.get(row.id) || [],
  }));

  return {
    items: comments,
    total,
    page,
    pageSize,
    hasMore: offset + comments.length < total,
  };
}

export async function updateComment(
  commentId: string,
  userId: string,
  content: string
): Promise<CommentWithUser> {
  // Verify ownership
  const existing = await query<DbComment>(
    'SELECT * FROM comments WHERE id = $1',
    [commentId]
  );

  if (existing.rows.length === 0) {
    throw new NotFoundError('Comment');
  }

  if (existing.rows[0].user_id !== userId) {
    throw new AuthorizationError('You can only edit your own comments');
  }

  const result = await query<DbComment>(
    `UPDATE comments SET content = $1 WHERE id = $2
     RETURNING *`,
    [content, commentId]
  );

  const userResult = await query<{ id: string; username: string; display_name: string; avatar_url: string | null }>(
    'SELECT id, username, display_name, avatar_url FROM users WHERE id = $1',
    [userId]
  );

  return {
    ...mapDbCommentToComment(result.rows[0]),
    user: {
      id: userResult.rows[0].id,
      username: userResult.rows[0].username,
      displayName: userResult.rows[0].display_name,
      avatarUrl: userResult.rows[0].avatar_url,
    },
  };
}

export async function deleteComment(commentId: string, userId: string): Promise<void> {
  // Verify ownership
  const existing = await query<DbComment>(
    'SELECT * FROM comments WHERE id = $1',
    [commentId]
  );

  if (existing.rows.length === 0) {
    throw new NotFoundError('Comment');
  }

  if (existing.rows[0].user_id !== userId) {
    throw new AuthorizationError('You can only delete your own comments');
  }

  // Soft delete
  await query('UPDATE comments SET is_deleted = TRUE WHERE id = $1', [commentId]);
}
