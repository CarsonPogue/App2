import rateLimit from 'express-rate-limit';
import { RATE_LIMITS } from '@moove/shared/constants';

export const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: RATE_LIMITS.GENERAL_REQUESTS_PER_MINUTE,
  message: {
    success: false,
    error: {
      code: 'RATE_001',
      message: 'Too many requests, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const writeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: RATE_LIMITS.WRITE_REQUESTS_PER_MINUTE,
  message: {
    success: false,
    error: {
      code: 'RATE_001',
      message: 'Too many write requests, please slow down',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: RATE_LIMITS.LOGIN_WINDOW_MINUTES * 60 * 1000,
  max: RATE_LIMITS.LOGIN_ATTEMPTS,
  message: {
    success: false,
    error: {
      code: 'RATE_001',
      message: 'Too many login attempts, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});
