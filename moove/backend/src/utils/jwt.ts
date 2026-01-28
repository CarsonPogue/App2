import jwt from 'jsonwebtoken';
import { config } from '../config';
import { AUTH } from '@moove/shared/constants';

export interface TokenPayload {
  userId: string;
  type: 'access' | 'refresh';
}

export function generateAccessToken(userId: string): string {
  return jwt.sign(
    { userId, type: 'access' } as TokenPayload,
    config.jwtSecret,
    { expiresIn: AUTH.ACCESS_TOKEN_EXPIRY }
  );
}

export function generateRefreshToken(userId: string): string {
  return jwt.sign(
    { userId, type: 'refresh' } as TokenPayload,
    config.jwtRefreshSecret,
    { expiresIn: AUTH.REFRESH_TOKEN_EXPIRY }
  );
}

export function verifyAccessToken(token: string): TokenPayload {
  const payload = jwt.verify(token, config.jwtSecret) as TokenPayload;
  if (payload.type !== 'access') {
    throw new Error('Invalid token type');
  }
  return payload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  const payload = jwt.verify(token, config.jwtRefreshSecret) as TokenPayload;
  if (payload.type !== 'refresh') {
    throw new Error('Invalid token type');
  }
  return payload;
}

export function generateTokenPair(userId: string) {
  return {
    accessToken: generateAccessToken(userId),
    refreshToken: generateRefreshToken(userId),
    expiresIn: AUTH.ACCESS_TOKEN_EXPIRY,
  };
}
