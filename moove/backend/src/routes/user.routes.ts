import { Router } from 'express';
import { z } from 'zod';
import * as userModel from '../models/user.model';
import { authenticate, AuthRequest } from '../middleware/auth';
import { writeLimiter } from '../middleware/rateLimit';
import { NotFoundError } from '../utils/errors';
import {
  displayNameSchema,
  bioSchema,
  usernameSchema,
  radiusSchema,
  uuidSchema,
} from '../utils/validation';

const router = Router();

// Validation schemas
const updateProfileSchema = z.object({
  displayName: displayNameSchema.optional(),
  username: usernameSchema.optional(),
  bio: bioSchema,
  avatarUrl: z.string().url().optional(),
});

const updatePreferencesSchema = z.object({
  favoriteArtists: z.array(z.object({
    id: z.string(),
    name: z.string(),
    imageUrl: z.string().optional(),
    spotifyId: z.string().optional(),
  })).optional(),
  favoriteGenres: z.array(z.string()).optional(),
  sportsTeams: z.array(z.object({
    id: z.string(),
    name: z.string(),
    sport: z.string(),
    logoUrl: z.string().optional(),
  })).optional(),
  interests: z.array(z.string()).optional(),
  notificationSettings: z.object({
    eventReminders: z.boolean(),
    friendActivity: z.boolean(),
    invites: z.boolean(),
    comments: z.boolean(),
    marketing: z.boolean(),
  }).optional(),
  radiusMiles: radiusSchema.optional(),
});

const updateLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

// GET /api/v1/users/me
router.get('/me', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const preferences = await userModel.getUserPreferences(req.userId!);

    res.json({
      success: true,
      data: {
        user: req.user,
        preferences,
      },
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/v1/users/me
router.patch('/me', authenticate, writeLimiter, async (req: AuthRequest, res, next) => {
  try {
    const data = updateProfileSchema.parse(req.body);
    const user = await userModel.updateUser(req.userId!, data);

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/v1/users/me/preferences
router.patch('/me/preferences', authenticate, writeLimiter, async (req: AuthRequest, res, next) => {
  try {
    const data = updatePreferencesSchema.parse(req.body);
    const preferences = await userModel.updateUserPreferences(req.userId!, data);

    // Refetch user to get updated onboarding status
    const user = await userModel.findUserById(req.userId!);

    res.json({
      success: true,
      data: { user, preferences },
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/v1/users/me/location
router.patch('/me/location', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const location = updateLocationSchema.parse(req.body);
    await userModel.updateUserLocation(req.userId!, location);

    res.json({
      success: true,
      data: { message: 'Location updated' },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/users/search - Search users by username
router.get('/search', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { q } = z.object({
      q: z.string().min(1, 'Search query is required'),
    }).parse(req.query);

    const users = await userModel.searchUsers(q, req.userId!);

    res.json({
      success: true,
      data: { users },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/users/:userId
router.get('/:userId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { userId } = z.object({ userId: uuidSchema }).parse(req.params);

    const user = await userModel.findUserById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    // Return limited public profile
    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          bio: user.bio,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
