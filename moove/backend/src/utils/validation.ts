import { z } from 'zod';
import { AUTH, VALIDATION, COMMENTS } from '@moove/shared/constants';

export const emailSchema = z.string().email('Invalid email address').toLowerCase();

export const usernameSchema = z
  .string()
  .min(AUTH.USERNAME_MIN_LENGTH, `Username must be at least ${AUTH.USERNAME_MIN_LENGTH} characters`)
  .max(AUTH.USERNAME_MAX_LENGTH, `Username must be at most ${AUTH.USERNAME_MAX_LENGTH} characters`)
  .regex(VALIDATION.USERNAME_REGEX, 'Username can only contain letters, numbers, and underscores');

export const passwordSchema = z
  .string()
  .min(AUTH.PASSWORD_MIN_LENGTH, `Password must be at least ${AUTH.PASSWORD_MIN_LENGTH} characters`)
  .max(AUTH.PASSWORD_MAX_LENGTH, `Password must be at most ${AUTH.PASSWORD_MAX_LENGTH} characters`)
  .regex(
    VALIDATION.PASSWORD_REGEX,
    'Password must contain at least one uppercase letter, one lowercase letter, and one number'
  );

export const displayNameSchema = z
  .string()
  .min(1, 'Display name is required')
  .max(100, 'Display name must be at most 100 characters');

export const bioSchema = z
  .string()
  .max(AUTH.BIO_MAX_LENGTH, `Bio must be at most ${AUTH.BIO_MAX_LENGTH} characters`)
  .optional();

export const commentSchema = z
  .string()
  .min(1, 'Comment cannot be empty')
  .max(COMMENTS.MAX_LENGTH, `Comment must be at most ${COMMENTS.MAX_LENGTH} characters`);

export const uuidSchema = z.string().uuid('Invalid ID format');

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const locationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const radiusSchema = z.coerce.number().int().min(5).max(100).default(25);
