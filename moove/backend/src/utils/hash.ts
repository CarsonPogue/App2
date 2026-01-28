import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { AUTH } from '@moove/shared/constants';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, AUTH.BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}
