import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { AuthenticationError } from '../utils/errors';
import { query } from '../config/database';
import type { User } from '@moove/shared/types';

export interface AuthRequest extends Request {
  user?: User;
  userId?: string;
}

export async function authenticate(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new AuthenticationError('No token provided');
    }

    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);

    const result = await query<User>(
      `SELECT id, email, username, display_name, avatar_url, bio,
              ST_X(location::geometry) as longitude,
              ST_Y(location::geometry) as latitude,
              onboarding_completed, created_at, updated_at, last_active_at
       FROM users WHERE id = $1`,
      [payload.userId]
    );

    if (result.rows.length === 0) {
      throw new AuthenticationError('User not found');
    }

    const user = result.rows[0];
    req.user = {
      ...user,
      displayName: (user as any).display_name,
      avatarUrl: (user as any).avatar_url,
      onboardingCompleted: (user as any).onboarding_completed,
      createdAt: (user as any).created_at,
      updatedAt: (user as any).updated_at,
      lastActiveAt: (user as any).last_active_at,
      location: (user as any).latitude && (user as any).longitude
        ? { latitude: (user as any).latitude, longitude: (user as any).longitude }
        : null,
    };
    req.userId = payload.userId;

    // Update last active timestamp (non-blocking)
    query('UPDATE users SET last_active_at = NOW() WHERE id = $1', [payload.userId]).catch(() => {});

    next();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      next(error);
    } else {
      next(new AuthenticationError('Invalid token'));
    }
  }
}

export function optionalAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return next();
  }

  authenticate(req, res, next);
}
