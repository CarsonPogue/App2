import { Router } from 'express';
import { z } from 'zod';
import * as eventModel from '../models/event.model';
import * as rsvpModel from '../models/rsvp.model';
import * as commentModel from '../models/comment.model';
import * as userModel from '../models/user.model';
import { authenticate, optionalAuth, AuthRequest } from '../middleware/auth';
import { writeLimiter } from '../middleware/rateLimit';
import { NotFoundError } from '../utils/errors';
import { uuidSchema, paginationSchema, radiusSchema, commentSchema } from '../utils/validation';
import { RSVPStatus, EventCategory } from '@moove/shared/types';

const router = Router();

// Validation schemas
const eventFiltersSchema = z.object({
  categories: z.array(z.nativeEnum(EventCategory)).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  search: z.string().optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  radiusMiles: radiusSchema.optional(),
  sortBy: z.enum(['date', 'distance', 'popularity', 'friends']).optional(),
});

const rsvpSchema = z.object({
  status: z.enum(['going', 'interested', 'not_going', 'hidden']),
  emojiReaction: z.string().max(10).optional(),
});

const createCommentSchema = z.object({
  content: commentSchema,
  parentCommentId: uuidSchema.optional(),
});

const updateCommentSchema = z.object({
  content: commentSchema,
});

// GET /api/v1/events
router.get('/', optionalAuth, async (req: AuthRequest, res, next) => {
  try {
    const filters = eventFiltersSchema.parse(req.query);
    const pagination = paginationSchema.parse(req.query);

    const result = await eventModel.findEvents(
      filters,
      req.userId,
      pagination.page,
      pagination.pageSize
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

// Default location (New York) for users without location set
const DEFAULT_LOCATION = { latitude: 40.7128, longitude: -74.0060 };
const DEFAULT_RADIUS = 50;

// Location query schema for tonight/week/month endpoints
const locationQuerySchema = z.object({
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  radiusMiles: radiusSchema.optional(),
});

// GET /api/v1/events/tonight
router.get('/tonight', optionalAuth, async (req: AuthRequest, res, next) => {
  try {
    const queryParams = locationQuerySchema.parse(req.query);
    const preferences = req.userId ? await userModel.getUserPreferences(req.userId) : null;

    // Prefer query params, then user location, then default
    const userLocation = (queryParams.latitude !== undefined && queryParams.longitude !== undefined)
      ? { latitude: queryParams.latitude, longitude: queryParams.longitude }
      : (req.user?.location || DEFAULT_LOCATION);
    const radius = queryParams.radiusMiles || preferences?.radiusMiles || DEFAULT_RADIUS;

    const events = await eventModel.findTonightEvents(
      userLocation,
      radius,
      req.userId
    );

    res.json({
      success: true,
      data: { items: events },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/events/week
router.get('/week', optionalAuth, async (req: AuthRequest, res, next) => {
  try {
    const queryParams = locationQuerySchema.parse(req.query);
    const preferences = req.userId ? await userModel.getUserPreferences(req.userId) : null;

    // Prefer query params, then user location, then default
    const userLocation = (queryParams.latitude !== undefined && queryParams.longitude !== undefined)
      ? { latitude: queryParams.latitude, longitude: queryParams.longitude }
      : (req.user?.location || DEFAULT_LOCATION);
    const radius = queryParams.radiusMiles || preferences?.radiusMiles || DEFAULT_RADIUS;

    const events = await eventModel.findWeekEvents(
      userLocation,
      radius,
      req.userId
    );

    res.json({
      success: true,
      data: { items: events },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/events/month
router.get('/month', optionalAuth, async (req: AuthRequest, res, next) => {
  try {
    const queryParams = locationQuerySchema.parse(req.query);
    const preferences = req.userId ? await userModel.getUserPreferences(req.userId) : null;

    // Prefer query params, then user location, then default
    const userLocation = (queryParams.latitude !== undefined && queryParams.longitude !== undefined)
      ? { latitude: queryParams.latitude, longitude: queryParams.longitude }
      : (req.user?.location || DEFAULT_LOCATION);
    const radius = queryParams.radiusMiles || preferences?.radiusMiles || DEFAULT_RADIUS;

    const events = await eventModel.findMonthEvents(
      userLocation,
      radius,
      req.userId
    );

    res.json({
      success: true,
      data: { items: events },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/events/trending
router.get('/trending', optionalAuth, async (req: AuthRequest, res, next) => {
  try {
    const events = await eventModel.findTrendingEvents(req.userId);

    res.json({
      success: true,
      data: { items: events },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/events/:eventId
router.get('/:eventId', optionalAuth, async (req: AuthRequest, res, next) => {
  try {
    const { eventId } = z.object({ eventId: uuidSchema }).parse(req.params);

    const event = await eventModel.findEventById(eventId);
    if (!event) {
      throw new NotFoundError('Event');
    }

    // Get RSVPs
    const rsvps = await rsvpModel.findRSVPsByEvent(eventId);
    const userRsvp = req.userId
      ? await rsvpModel.findRSVPByUserAndEvent(req.userId, eventId)
      : null;

    // Get friends attending if authenticated
    const friendsAttending = req.userId
      ? await rsvpModel.getFriendsAttendingEvent(req.userId, eventId)
      : [];

    // Get comments
    const comments = await commentModel.findCommentsByEvent(eventId, 1, 5);

    res.json({
      success: true,
      data: {
        event: {
          ...event,
          userRsvp,
          friendsAttending,
          rsvpCounts: {
            going: rsvps.filter((r) => r.status === 'going').length,
            interested: rsvps.filter((r) => r.status === 'interested').length,
          },
          commentCount: comments.total,
        },
        recentComments: comments.items,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/events/:eventId/rsvp
router.post('/:eventId/rsvp', authenticate, writeLimiter, async (req: AuthRequest, res, next) => {
  try {
    const { eventId } = z.object({ eventId: uuidSchema }).parse(req.params);
    const { status, emojiReaction } = rsvpSchema.parse(req.body);

    // Verify event exists
    const event = await eventModel.findEventById(eventId);
    if (!event) {
      throw new NotFoundError('Event');
    }

    const rsvp = await rsvpModel.createOrUpdateRSVP(
      req.userId!,
      eventId,
      status as RSVPStatus,
      emojiReaction
    );

    res.json({
      success: true,
      data: { rsvp },
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/events/:eventId/rsvp
router.delete('/:eventId/rsvp', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { eventId } = z.object({ eventId: uuidSchema }).parse(req.params);

    await rsvpModel.deleteRSVP(req.userId!, eventId);

    res.json({
      success: true,
      data: { message: 'RSVP removed' },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/events/:eventId/hide
router.post('/:eventId/hide', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { eventId } = z.object({ eventId: uuidSchema }).parse(req.params);

    await rsvpModel.createOrUpdateRSVP(req.userId!, eventId, RSVPStatus.HIDDEN);

    res.json({
      success: true,
      data: { message: 'Event hidden from your feed' },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/events/:eventId/comments
router.get('/:eventId/comments', optionalAuth, async (req: AuthRequest, res, next) => {
  try {
    const { eventId } = z.object({ eventId: uuidSchema }).parse(req.params);
    const pagination = paginationSchema.parse(req.query);

    const comments = await commentModel.findCommentsByEvent(
      eventId,
      pagination.page,
      pagination.pageSize
    );

    res.json({
      success: true,
      data: comments,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/events/:eventId/comments
router.post('/:eventId/comments', authenticate, writeLimiter, async (req: AuthRequest, res, next) => {
  try {
    const { eventId } = z.object({ eventId: uuidSchema }).parse(req.params);
    const { content, parentCommentId } = createCommentSchema.parse(req.body);

    // Verify event exists
    const event = await eventModel.findEventById(eventId);
    if (!event) {
      throw new NotFoundError('Event');
    }

    const comment = await commentModel.createComment(
      eventId,
      req.userId!,
      content,
      parentCommentId
    );

    res.status(201).json({
      success: true,
      data: { comment },
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/v1/events/:eventId/comments/:commentId
router.patch('/:eventId/comments/:commentId', authenticate, writeLimiter, async (req: AuthRequest, res, next) => {
  try {
    const { commentId } = z.object({ commentId: uuidSchema }).parse(req.params);
    const { content } = updateCommentSchema.parse(req.body);

    const comment = await commentModel.updateComment(commentId, req.userId!, content);

    res.json({
      success: true,
      data: { comment },
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/events/:eventId/comments/:commentId
router.delete('/:eventId/comments/:commentId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { commentId } = z.object({ commentId: uuidSchema }).parse(req.params);

    await commentModel.deleteComment(commentId, req.userId!);

    res.json({
      success: true,
      data: { message: 'Comment deleted' },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
