import { Router } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';
import { pool } from '../config/database';
import { AppError } from '../utils/errors';

const router = Router();

const bookmarkSchema = z.object({
  eventId: z.string().uuid(),
});

router.get('/bookmarks', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!;
    const { page = '1', limit = '20' } = req.query;

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    const result = await pool.query(
      `SELECT
        e.*,
        b.created_at as bookmarked_at,
        (SELECT COUNT(*) FROM rsvps WHERE event_id = e.id AND status = 'going') as going_count,
        (SELECT COUNT(*) FROM rsvps WHERE event_id = e.id AND status = 'interested') as interested_count
      FROM event_bookmarks b
      JOIN events e ON b.event_id = e.id
      WHERE b.user_id = $1
      ORDER BY b.created_at DESC
      LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM event_bookmarks WHERE user_id = $1',
      [userId]
    );

    res.json({
      success: true,
      data: {
        items: result.rows,
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page as string),
        pageSize: parseInt(limit as string),
        hasMore: offset + result.rows.length < parseInt(countResult.rows[0].count),
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/bookmarks', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!;
    const { eventId } = bookmarkSchema.parse(req.body);

    const eventCheck = await pool.query(
      'SELECT id FROM events WHERE id = $1',
      [eventId]
    );

    if (eventCheck.rows.length === 0) {
      throw new AppError('Event not found', 404);
    }

    const result = await pool.query(
      `INSERT INTO event_bookmarks (user_id, event_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, event_id) DO NOTHING
       RETURNING *`,
      [userId, eventId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Event already bookmarked', 400);
    }

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Event bookmarked successfully',
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/bookmarks/:eventId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!;
    const { eventId } = req.params;

    const result = await pool.query(
      'DELETE FROM event_bookmarks WHERE user_id = $1 AND event_id = $2 RETURNING *',
      [userId, eventId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Bookmark not found', 404);
    }

    res.json({
      success: true,
      message: 'Bookmark removed successfully',
    });
  } catch (error) {
    next(error);
  }
});

router.get('/bookmarks/check/:eventId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!;
    const { eventId } = req.params;

    const result = await pool.query(
      'SELECT id FROM event_bookmarks WHERE user_id = $1 AND event_id = $2',
      [userId, eventId]
    );

    res.json({
      success: true,
      data: {
        bookmarked: result.rows.length > 0,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
