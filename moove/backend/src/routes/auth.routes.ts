import { Router } from 'express';
import { z } from 'zod';
import * as userModel from '../models/user.model';
import * as sessionModel from '../models/session.model';
import { generateTokenPair, verifyRefreshToken } from '../utils/jwt';
import { generateSecureToken, hashToken } from '../utils/hash';
import { AuthenticationError, ValidationError } from '../utils/errors';
import { authLimiter } from '../middleware/rateLimit';
import { authenticate, AuthRequest } from '../middleware/auth';
import {
  emailSchema,
  usernameSchema,
  passwordSchema,
  displayNameSchema,
} from '../utils/validation';
import { ERROR_CODES, AUTH } from '@moove/shared/constants';
import { query } from '../config/database';

const router = Router();

// Validation schemas
const registerSchema = z.object({
  email: emailSchema,
  username: usernameSchema,
  password: passwordSchema,
  displayName: displayNameSchema,
});

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

const forgotPasswordSchema = z.object({
  email: emailSchema,
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: passwordSchema,
});

// POST /api/v1/auth/register
router.post('/register', authLimiter, async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);

    const user = await userModel.createUser({
      email: data.email,
      password: data.password,
      username: data.username,
      displayName: data.displayName,
    });

    const { refreshToken } = await sessionModel.createSession(
      user.id,
      { userAgent: req.headers['user-agent'] },
      req.ip
    );

    const tokens = generateTokenPair(user.id);

    res.status(201).json({
      success: true,
      data: {
        user,
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken,
          expiresIn: AUTH.ACCESS_TOKEN_EXPIRY,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/auth/login
router.post('/login', authLimiter, async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);

    const user = await userModel.validateCredentials(data.email, data.password);

    const { refreshToken } = await sessionModel.createSession(
      user.id,
      { userAgent: req.headers['user-agent'] },
      req.ip
    );

    const tokens = generateTokenPair(user.id);

    res.json({
      success: true,
      data: {
        user,
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken,
          expiresIn: AUTH.ACCESS_TOKEN_EXPIRY,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/auth/logout
router.post('/logout', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await sessionModel.revokeSession(refreshToken);
    }

    res.json({
      success: true,
      data: { message: 'Logged out successfully' },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/auth/refresh
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = refreshSchema.parse(req.body);

    // Verify the refresh token is valid JWT
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new AuthenticationError('Invalid refresh token', ERROR_CODES.TOKEN_INVALID);
    }

    // Rotate the session
    const newSession = await sessionModel.rotateSession(
      refreshToken,
      { userAgent: req.headers['user-agent'] },
      req.ip
    );

    if (!newSession) {
      // Token reuse detected - revoke all sessions for safety
      await sessionModel.revokeAllUserSessions(payload.userId);
      throw new AuthenticationError('Token reuse detected. All sessions revoked.', ERROR_CODES.TOKEN_INVALID);
    }

    const user = await userModel.findUserById(payload.userId);
    if (!user) {
      throw new AuthenticationError('User not found', ERROR_CODES.TOKEN_INVALID);
    }

    const tokens = generateTokenPair(user.id);

    res.json({
      success: true,
      data: {
        user,
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: newSession.refreshToken,
          expiresIn: AUTH.ACCESS_TOKEN_EXPIRY,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/auth/forgot-password
router.post('/forgot-password', authLimiter, async (req, res, next) => {
  try {
    const { email } = forgotPasswordSchema.parse(req.body);

    const user = await userModel.findUserByEmail(email);

    // Always return success to prevent email enumeration
    if (!user) {
      res.json({
        success: true,
        data: { message: 'If an account exists, a reset email has been sent' },
      });
      return;
    }

    // Generate reset token
    const token = generateSecureToken();
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, tokenHash, expiresAt]
    );

    // TODO: Send email with reset link
    // For now, log the token in development
    console.log(`Password reset token for ${email}: ${token}`);

    res.json({
      success: true,
      data: { message: 'If an account exists, a reset email has been sent' },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/auth/reset-password
router.post('/reset-password', authLimiter, async (req, res, next) => {
  try {
    const { token, password } = resetPasswordSchema.parse(req.body);
    const tokenHash = hashToken(token);

    // Find valid token
    const result = await query<{ user_id: string; id: string }>(
      `SELECT id, user_id FROM password_reset_tokens
       WHERE token_hash = $1 AND expires_at > NOW() AND used_at IS NULL`,
      [tokenHash]
    );

    if (result.rows.length === 0) {
      throw new ValidationError('Invalid or expired reset token');
    }

    const { user_id: userId, id: tokenId } = result.rows[0];

    // Update password
    await userModel.updatePassword(userId, password);

    // Mark token as used
    await query(
      'UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1',
      [tokenId]
    );

    // Revoke all existing sessions
    await sessionModel.revokeAllUserSessions(userId);

    res.json({
      success: true,
      data: { message: 'Password reset successfully. Please log in with your new password.' },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/auth/me - Get current user
router.get('/me', authenticate, async (req: AuthRequest, res, next) => {
  try {
    res.json({
      success: true,
      data: { user: req.user },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
