import { Router } from 'express';
import { z } from 'zod';
import * as friendshipModel from '../models/friendship.model';
import * as userModel from '../models/user.model';
import { authenticate, AuthRequest } from '../middleware/auth';
import { writeLimiter } from '../middleware/rateLimit';
import { NotFoundError } from '../utils/errors';
import { uuidSchema, paginationSchema } from '../utils/validation';

const router = Router();

// GET /api/v1/social/friends
router.get('/friends', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const pagination = paginationSchema.parse(req.query);
    const friends = await friendshipModel.getFriends(
      req.userId!,
      pagination.page,
      pagination.pageSize
    );

    res.json({
      success: true,
      data: friends,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/social/friends/requests
router.get('/friends/requests', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const requests = await friendshipModel.getPendingRequests(req.userId!);

    res.json({
      success: true,
      data: { items: requests },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/social/friends/request/:userId
router.post('/friends/request/:userId', authenticate, writeLimiter, async (req: AuthRequest, res, next) => {
  try {
    const { userId } = z.object({ userId: uuidSchema }).parse(req.params);

    // Verify user exists
    const user = await userModel.findUserById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    const friendship = await friendshipModel.sendFriendRequest(req.userId!, userId);

    res.status(201).json({
      success: true,
      data: { friendship },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/social/friends/accept/:requestId
router.post('/friends/accept/:requestId', authenticate, writeLimiter, async (req: AuthRequest, res, next) => {
  try {
    const { requestId } = z.object({ requestId: uuidSchema }).parse(req.params);

    const friendship = await friendshipModel.acceptFriendRequest(requestId, req.userId!);

    res.json({
      success: true,
      data: { friendship },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/social/friends/decline/:requestId
router.post('/friends/decline/:requestId', authenticate, writeLimiter, async (req: AuthRequest, res, next) => {
  try {
    const { requestId } = z.object({ requestId: uuidSchema }).parse(req.params);

    await friendshipModel.declineFriendRequest(requestId, req.userId!);

    res.json({
      success: true,
      data: { message: 'Friend request declined' },
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/social/friends/:userId
router.delete('/friends/:userId', authenticate, writeLimiter, async (req: AuthRequest, res, next) => {
  try {
    const { userId } = z.object({ userId: uuidSchema }).parse(req.params);

    await friendshipModel.removeFriend(req.userId!, userId);

    res.json({
      success: true,
      data: { message: 'Friend removed' },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/social/friends/block/:userId
router.post('/friends/block/:userId', authenticate, writeLimiter, async (req: AuthRequest, res, next) => {
  try {
    const { userId } = z.object({ userId: uuidSchema }).parse(req.params);

    await friendshipModel.blockUser(req.userId!, userId);

    res.json({
      success: true,
      data: { message: 'User blocked' },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/social/friends/unblock/:userId
router.post('/friends/unblock/:userId', authenticate, writeLimiter, async (req: AuthRequest, res, next) => {
  try {
    const { userId } = z.object({ userId: uuidSchema }).parse(req.params);

    await friendshipModel.unblockUser(req.userId!, userId);

    res.json({
      success: true,
      data: { message: 'User unblocked' },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/social/friends/:userId/events
router.get('/friends/:userId/events', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { userId } = z.object({ userId: uuidSchema }).parse(req.params);

    // Verify they are friends
    const areFriends = await friendshipModel.areFriends(req.userId!, userId);
    if (!areFriends) {
      throw new NotFoundError('User');
    }

    // Get friend's RSVPs for upcoming events
    // This would need to be implemented in the RSVP model
    // For now, return empty
    res.json({
      success: true,
      data: { items: [] },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
