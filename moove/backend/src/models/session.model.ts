import { query } from '../config/database';
import { hashToken, generateSecureToken } from '../utils/hash';
import { AUTH } from '@moove/shared/constants';

interface Session {
  id: string;
  userId: string;
  refreshTokenHash: string;
  deviceInfo: Record<string, unknown> | null;
  ipAddress: string | null;
  expiresAt: Date;
  createdAt: Date;
  revokedAt: Date | null;
}

export async function createSession(
  userId: string,
  deviceInfo?: Record<string, unknown>,
  ipAddress?: string
): Promise<{ sessionId: string; refreshToken: string }> {
  const refreshToken = generateSecureToken();
  const refreshTokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + AUTH.REFRESH_TOKEN_EXPIRY * 1000);

  const result = await query<{ id: string }>(
    `INSERT INTO sessions (user_id, refresh_token_hash, device_info, ip_address, expires_at)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [userId, refreshTokenHash, deviceInfo ? JSON.stringify(deviceInfo) : null, ipAddress || null, expiresAt]
  );

  return {
    sessionId: result.rows[0].id,
    refreshToken,
  };
}

export async function findSessionByToken(refreshToken: string): Promise<Session | null> {
  const tokenHash = hashToken(refreshToken);

  const result = await query<{
    id: string;
    user_id: string;
    refresh_token_hash: string;
    device_info: Record<string, unknown> | null;
    ip_address: string | null;
    expires_at: Date;
    created_at: Date;
    revoked_at: Date | null;
  }>(
    `SELECT id, user_id, refresh_token_hash, device_info, ip_address, expires_at, created_at, revoked_at
     FROM sessions
     WHERE refresh_token_hash = $1 AND revoked_at IS NULL AND expires_at > NOW()`,
    [tokenHash]
  );

  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  return {
    id: row.id,
    userId: row.user_id,
    refreshTokenHash: row.refresh_token_hash,
    deviceInfo: row.device_info,
    ipAddress: row.ip_address,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    revokedAt: row.revoked_at,
  };
}

export async function rotateSession(
  oldRefreshToken: string,
  deviceInfo?: Record<string, unknown>,
  ipAddress?: string
): Promise<{ sessionId: string; refreshToken: string } | null> {
  const oldTokenHash = hashToken(oldRefreshToken);

  // Find and revoke the old session
  const oldSession = await query<{ id: string; user_id: string }>(
    `UPDATE sessions
     SET revoked_at = NOW()
     WHERE refresh_token_hash = $1 AND revoked_at IS NULL AND expires_at > NOW()
     RETURNING id, user_id`,
    [oldTokenHash]
  );

  if (oldSession.rows.length === 0) {
    // Token not found or already revoked - potential token theft
    // Revoke all sessions for this token's user if we can identify them
    return null;
  }

  const userId = oldSession.rows[0].user_id;

  // Create new session
  return createSession(userId, deviceInfo, ipAddress);
}

export async function revokeSession(refreshToken: string): Promise<boolean> {
  const tokenHash = hashToken(refreshToken);

  const result = await query(
    `UPDATE sessions SET revoked_at = NOW()
     WHERE refresh_token_hash = $1 AND revoked_at IS NULL
     RETURNING id`,
    [tokenHash]
  );

  return result.rowCount !== null && result.rowCount > 0;
}

export async function revokeAllUserSessions(userId: string): Promise<void> {
  await query(
    'UPDATE sessions SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL',
    [userId]
  );
}

export async function cleanupExpiredSessions(): Promise<number> {
  const result = await query(
    'DELETE FROM sessions WHERE expires_at < NOW() OR revoked_at IS NOT NULL',
    []
  );

  return result.rowCount || 0;
}
