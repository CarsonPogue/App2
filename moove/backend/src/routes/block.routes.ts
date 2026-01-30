import { Router } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';
import { pool } from '../config/database';
import { AppError } from '../utils/errors';

const router = Router();

const blockSchema = z.object({
  userId: z.string().uuid(),
});

router.get('/blocks', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!;

    const result = await pool.query(
      `SELECT
        u.id,
        u.username,
        u.display_name,
        u.avatar_url,
        b.created_at as blocked_at
      FROM user_blocks b
      JOIN users u ON b.blocked_id = u.id
      WHERE b.blocker_id = $1
      ORDER BY b.created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: {
        blockedUsers: result.rows,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/blocks', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!;
    const { userId: blockedUserId } = blockSchema.parse(req.body);

    if (userId === blockedUserId) {
      throw new AppError('Cannot block yourself', 400);
    }

    const userCheck = await pool.query(
      'SELECT id FROM users WHERE id = $1',
      [blockedUserId]
    );

    if (userCheck.rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    const result = await pool.query(
      `INSERT INTO user_blocks (blocker_id, blocked_id)
       VALUES ($1, $2)
       ON CONFLICT (blocker_id, blocked_id) DO NOTHING
       RETURNING *`,
      [userId, blockedUserId]
    );

    if (result.rows.length === 0) {
      throw new AppError('User already blocked', 400);
    }

    await pool.query(
      `DELETE FROM friendships
       WHERE (requester_id = $1 AND addressee_id = $2)
          OR (requester_id = $2 AND addressee_id = $1)`,
      [userId, blockedUserId]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'User blocked successfully',
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/blocks/:userId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!;
    const { userId: blockedUserId } = req.params;

    const result = await pool.query(
      'DELETE FROM user_blocks WHERE blocker_id = $1 AND blocked_id = $2 RETURNING *',
      [userId, blockedUserId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Block not found', 404);
    }

    res.json({
      success: true,
      message: 'User unblocked successfully',
    });
  } catch (error) {
    next(error);
  }
});

router.get('/blocks/check/:userId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!;
    const { userId: targetUserId } = req.params;

    const result = await pool.query(
      'SELECT id FROM user_blocks WHERE blocker_id = $1 AND blocked_id = $2',
      [userId, targetUserId]
    );

    res.json({
      success: true,
      data: {
        blocked: result.rows.length > 0,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
