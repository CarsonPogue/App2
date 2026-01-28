import { Router } from 'express';
import { z } from 'zod';
import * as inviteModel from '../models/invite.model';
import * as eventModel from '../models/event.model';
import * as userModel from '../models/user.model';
import * as friendshipModel from '../models/friendship.model';
import { authenticate, AuthRequest } from '../middleware/auth';
import { writeLimiter } from '../middleware/rateLimit';
import { NotFoundError, AuthorizationError } from '../utils/errors';
import { uuidSchema, paginationSchema } from '../utils/validation';

const router = Router();

const createInviteSchema = z.object({
  eventId: uuidSchema,
  recipientId: uuidSchema,
  message: z.string().max(500).optional(),
});

const respondInviteSchema = z.object({
  status: z.enum(['accepted', 'declined']),
});

// GET /api/v1/invites/received
router.get('/received', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const pagination = paginationSchema.parse(req.query);
    const invites = await inviteModel.getReceivedInvites(
      req.userId!,
      pagination.page,
      pagination.pageSize
    );

    res.json({
      success: true,
      data: invites,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/invites/sent
router.get('/sent', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const pagination = paginationSchema.parse(req.query);
    const invites = await inviteModel.getSentInvites(
      req.userId!,
      pagination.page,
      pagination.pageSize
    );

    res.json({
      success: true,
      data: invites,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/invites
router.post('/', authenticate, writeLimiter, async (req: AuthRequest, res, next) => {
  try {
    const { eventId, recipientId, message } = createInviteSchema.parse(req.body);

    // Verify event exists
    const event = await eventModel.findEventById(eventId);
    if (!event) {
      throw new NotFoundError('Event');
    }

    // Verify recipient exists
    const recipient = await userModel.findUserById(recipientId);
    if (!recipient) {
      throw new NotFoundError('User');
    }

    // Optionally verify they are friends (can be relaxed based on requirements)
    const areFriends = await friendshipModel.areFriends(req.userId!, recipientId);
    if (!areFriends) {
      throw new AuthorizationError('You can only invite friends');
    }

    const invite = await inviteModel.createInvite(eventId, req.userId!, recipientId, message);

    res.status(201).json({
      success: true,
      data: { invite },
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/v1/invites/:inviteId
router.patch('/:inviteId', authenticate, writeLimiter, async (req: AuthRequest, res, next) => {
  try {
    const { inviteId } = z.object({ inviteId: uuidSchema }).parse(req.params);
    const { status } = respondInviteSchema.parse(req.body);

    const invite = await inviteModel.respondToInvite(inviteId, req.userId!, status);

    res.json({
      success: true,
      data: { invite },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
