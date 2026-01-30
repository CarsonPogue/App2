import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { pool } from '../config/database';
import { AppError } from '../utils/errors';

const router = Router();

router.get('/notifications', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!;
    const { page = '1', limit = '50', unreadOnly = 'false' } = req.query;

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    let query = `
      SELECT *
      FROM notifications
      WHERE user_id = $1
    `;

    const params: any[] = [userId];

    if (unreadOnly === 'true') {
      query += ' AND read = false';
    }

    query += ' ORDER BY created_at DESC LIMIT $2 OFFSET $3';
    params.push(limit, offset);

    const result = await pool.query(query, params);

    let countQuery = 'SELECT COUNT(*) FROM notifications WHERE user_id = $1';
    if (unreadOnly === 'true') {
      countQuery += ' AND read = false';
    }

    const countResult = await pool.query(countQuery, [userId]);

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

router.get('/notifications/unread-count', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!;

    const result = await pool.query(
      'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND read = false',
      [userId]
    );

    res.json({
      success: true,
      data: {
        count: parseInt(result.rows[0].count),
      },
    });
  } catch (error) {
    next(error);
  }
});

router.patch('/notifications/:notificationId/read', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!;
    const { notificationId } = req.params;

    const result = await pool.query(
      `UPDATE notifications
       SET read = true, read_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [notificationId, userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Notification not found', 404);
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Notification marked as read',
    });
  } catch (error) {
    next(error);
  }
});

router.patch('/notifications/mark-all-read', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!;

    await pool.query(
      `UPDATE notifications
       SET read = true, read_at = NOW()
       WHERE user_id = $1 AND read = false`,
      [userId]
    );

    res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/notifications/:notificationId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!;
    const { notificationId } = req.params;

    const result = await pool.query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING *',
      [notificationId, userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Notification not found', 404);
    }

    res.json({
      success: true,
      message: 'Notification deleted',
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/notifications', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!;

    await pool.query(
      'DELETE FROM notifications WHERE user_id = $1 AND read = true',
      [userId]
    );

    res.json({
      success: true,
      message: 'All read notifications deleted',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
