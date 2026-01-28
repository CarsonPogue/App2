import { query, transaction } from '../config/database';
import type { User, UserPreferences, UserSummary, GeoLocation } from '@moove/shared/types';
import { hashPassword, verifyPassword } from '../utils/hash';
import { NotFoundError, ConflictError, AuthenticationError } from '../utils/errors';
import { ERROR_CODES, RATE_LIMITS } from '@moove/shared/constants';

interface DbUser {
  id: string;
  email: string;
  password_hash: string | null;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  latitude: number | null;
  longitude: number | null;
  onboarding_completed: boolean;
  google_id: string | null;
  apple_id: string | null;
  email_verified: boolean;
  failed_login_attempts: number;
  locked_until: Date | null;
  created_at: Date;
  updated_at: Date;
  last_active_at: Date;
}

function mapDbUserToUser(dbUser: DbUser): User {
  return {
    id: dbUser.id,
    email: dbUser.email,
    username: dbUser.username,
    displayName: dbUser.display_name,
    avatarUrl: dbUser.avatar_url,
    bio: dbUser.bio,
    location: dbUser.latitude && dbUser.longitude
      ? { latitude: dbUser.latitude, longitude: dbUser.longitude }
      : null,
    onboardingCompleted: dbUser.onboarding_completed,
    createdAt: dbUser.created_at,
    updatedAt: dbUser.updated_at,
    lastActiveAt: dbUser.last_active_at,
  };
}

export async function createUser(data: {
  email: string;
  password?: string;
  username: string;
  displayName: string;
  googleId?: string;
  appleId?: string;
}): Promise<User> {
  const passwordHash = data.password ? await hashPassword(data.password) : null;

  return transaction(async (client) => {
    // Check for existing email
    const emailCheck = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [data.email.toLowerCase()]
    );
    if (emailCheck.rows.length > 0) {
      throw new ConflictError('Email already registered', ERROR_CODES.EMAIL_EXISTS);
    }

    // Check for existing username
    const usernameCheck = await client.query(
      'SELECT id FROM users WHERE username = $1',
      [data.username.toLowerCase()]
    );
    if (usernameCheck.rows.length > 0) {
      throw new ConflictError('Username already taken', ERROR_CODES.USERNAME_EXISTS);
    }

    const result = await client.query<DbUser>(
      `INSERT INTO users (email, password_hash, username, display_name, google_id, apple_id, email_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, email, password_hash, username, display_name, avatar_url, bio,
                 ST_X(location::geometry) as longitude, ST_Y(location::geometry) as latitude,
                 onboarding_completed, google_id, apple_id, email_verified,
                 failed_login_attempts, locked_until, created_at, updated_at, last_active_at`,
      [
        data.email.toLowerCase(),
        passwordHash,
        data.username.toLowerCase(),
        data.displayName,
        data.googleId || null,
        data.appleId || null,
        !!data.googleId || !!data.appleId, // Email verified if OAuth
      ]
    );

    const user = mapDbUserToUser(result.rows[0]);

    // Create default preferences
    await client.query(
      'INSERT INTO user_preferences (user_id) VALUES ($1)',
      [user.id]
    );

    return user;
  });
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const result = await query<DbUser>(
    `SELECT id, email, password_hash, username, display_name, avatar_url, bio,
            ST_X(location::geometry) as longitude, ST_Y(location::geometry) as latitude,
            onboarding_completed, google_id, apple_id, email_verified,
            failed_login_attempts, locked_until, created_at, updated_at, last_active_at
     FROM users WHERE email = $1`,
    [email.toLowerCase()]
  );

  if (result.rows.length === 0) return null;
  return mapDbUserToUser(result.rows[0]);
}

export async function findUserById(id: string): Promise<User | null> {
  const result = await query<DbUser>(
    `SELECT id, email, password_hash, username, display_name, avatar_url, bio,
            ST_X(location::geometry) as longitude, ST_Y(location::geometry) as latitude,
            onboarding_completed, google_id, apple_id, email_verified,
            failed_login_attempts, locked_until, created_at, updated_at, last_active_at
     FROM users WHERE id = $1`,
    [id]
  );

  if (result.rows.length === 0) return null;
  return mapDbUserToUser(result.rows[0]);
}

export async function findUserByUsername(username: string): Promise<User | null> {
  const result = await query<DbUser>(
    `SELECT id, email, password_hash, username, display_name, avatar_url, bio,
            ST_X(location::geometry) as longitude, ST_Y(location::geometry) as latitude,
            onboarding_completed, google_id, apple_id, email_verified,
            failed_login_attempts, locked_until, created_at, updated_at, last_active_at
     FROM users WHERE username = $1`,
    [username.toLowerCase()]
  );

  if (result.rows.length === 0) return null;
  return mapDbUserToUser(result.rows[0]);
}

export async function findUserByOAuth(
  provider: 'google' | 'apple',
  providerId: string
): Promise<User | null> {
  const column = provider === 'google' ? 'google_id' : 'apple_id';
  const result = await query<DbUser>(
    `SELECT id, email, password_hash, username, display_name, avatar_url, bio,
            ST_X(location::geometry) as longitude, ST_Y(location::geometry) as latitude,
            onboarding_completed, google_id, apple_id, email_verified,
            failed_login_attempts, locked_until, created_at, updated_at, last_active_at
     FROM users WHERE ${column} = $1`,
    [providerId]
  );

  if (result.rows.length === 0) return null;
  return mapDbUserToUser(result.rows[0]);
}

export async function validateCredentials(
  email: string,
  password: string
): Promise<User> {
  const result = await query<DbUser>(
    `SELECT id, email, password_hash, username, display_name, avatar_url, bio,
            ST_X(location::geometry) as longitude, ST_Y(location::geometry) as latitude,
            onboarding_completed, google_id, apple_id, email_verified,
            failed_login_attempts, locked_until, created_at, updated_at, last_active_at
     FROM users WHERE email = $1`,
    [email.toLowerCase()]
  );

  if (result.rows.length === 0) {
    throw new AuthenticationError('Invalid credentials', ERROR_CODES.INVALID_CREDENTIALS);
  }

  const dbUser = result.rows[0];

  // Check if account is locked
  if (dbUser.locked_until && new Date(dbUser.locked_until) > new Date()) {
    throw new AuthenticationError('Account is locked. Try again later.', ERROR_CODES.ACCOUNT_LOCKED);
  }

  if (!dbUser.password_hash) {
    throw new AuthenticationError('Please use social login', ERROR_CODES.INVALID_CREDENTIALS);
  }

  const isValid = await verifyPassword(password, dbUser.password_hash);

  if (!isValid) {
    // Increment failed attempts
    const newAttempts = dbUser.failed_login_attempts + 1;
    const shouldLock = newAttempts >= RATE_LIMITS.ACCOUNT_LOCKOUT_ATTEMPTS;

    await query(
      `UPDATE users SET
         failed_login_attempts = $1,
         locked_until = $2
       WHERE id = $3`,
      [
        newAttempts,
        shouldLock ? new Date(Date.now() + 30 * 60 * 1000) : null, // Lock for 30 minutes
        dbUser.id,
      ]
    );

    throw new AuthenticationError('Invalid credentials', ERROR_CODES.INVALID_CREDENTIALS);
  }

  // Reset failed attempts on successful login
  await query(
    'UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = $1',
    [dbUser.id]
  );

  return mapDbUserToUser(dbUser);
}

export async function updateUser(
  id: string,
  data: Partial<{
    displayName: string;
    avatarUrl: string;
    bio: string;
    username: string;
  }>
): Promise<User> {
  const updates: string[] = [];
  const values: unknown[] = [];
  let paramCount = 1;

  if (data.displayName !== undefined) {
    updates.push(`display_name = $${paramCount++}`);
    values.push(data.displayName);
  }
  if (data.avatarUrl !== undefined) {
    updates.push(`avatar_url = $${paramCount++}`);
    values.push(data.avatarUrl);
  }
  if (data.bio !== undefined) {
    updates.push(`bio = $${paramCount++}`);
    values.push(data.bio);
  }
  if (data.username !== undefined) {
    // Check if username is taken
    const existing = await findUserByUsername(data.username);
    if (existing && existing.id !== id) {
      throw new ConflictError('Username already taken', ERROR_CODES.USERNAME_EXISTS);
    }
    updates.push(`username = $${paramCount++}`);
    values.push(data.username.toLowerCase());
  }

  if (updates.length === 0) {
    const user = await findUserById(id);
    if (!user) throw new NotFoundError('User');
    return user;
  }

  values.push(id);

  const result = await query<DbUser>(
    `UPDATE users SET ${updates.join(', ')}
     WHERE id = $${paramCount}
     RETURNING id, email, password_hash, username, display_name, avatar_url, bio,
               ST_X(location::geometry) as longitude, ST_Y(location::geometry) as latitude,
               onboarding_completed, google_id, apple_id, email_verified,
               failed_login_attempts, locked_until, created_at, updated_at, last_active_at`,
    values
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('User');
  }

  return mapDbUserToUser(result.rows[0]);
}

export async function updateUserLocation(
  id: string,
  location: GeoLocation
): Promise<void> {
  await query(
    `UPDATE users SET location = ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
     WHERE id = $3`,
    [location.longitude, location.latitude, id]
  );
}

export async function getUserSummary(id: string): Promise<UserSummary | null> {
  const result = await query<{ id: string; username: string; display_name: string; avatar_url: string | null }>(
    'SELECT id, username, display_name, avatar_url FROM users WHERE id = $1',
    [id]
  );

  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
  };
}

export async function getUserPreferences(userId: string): Promise<UserPreferences | null> {
  const result = await query<{
    id: string;
    user_id: string;
    favorite_artists: unknown[];
    favorite_genres: string[];
    sports_teams: unknown[];
    interests: string[];
    notification_settings: unknown;
    radius_miles: number;
  }>(
    'SELECT * FROM user_preferences WHERE user_id = $1',
    [userId]
  );

  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  return {
    id: row.id,
    userId: row.user_id,
    favoriteArtists: row.favorite_artists as any,
    favoriteGenres: row.favorite_genres,
    sportsTeams: row.sports_teams as any,
    interests: row.interests,
    notificationSettings: row.notification_settings as any,
    radiusMiles: row.radius_miles,
  };
}

export async function updateUserPreferences(
  userId: string,
  data: Partial<Omit<UserPreferences, 'id' | 'userId'>>
): Promise<UserPreferences> {
  const updates: string[] = [];
  const values: unknown[] = [];
  let paramCount = 1;

  if (data.favoriteArtists !== undefined) {
    updates.push(`favorite_artists = $${paramCount++}`);
    values.push(JSON.stringify(data.favoriteArtists));
  }
  if (data.favoriteGenres !== undefined) {
    updates.push(`favorite_genres = $${paramCount++}`);
    values.push(JSON.stringify(data.favoriteGenres));
  }
  if (data.sportsTeams !== undefined) {
    updates.push(`sports_teams = $${paramCount++}`);
    values.push(JSON.stringify(data.sportsTeams));
  }
  if (data.interests !== undefined) {
    updates.push(`interests = $${paramCount++}`);
    values.push(JSON.stringify(data.interests));
  }
  if (data.notificationSettings !== undefined) {
    updates.push(`notification_settings = $${paramCount++}`);
    values.push(JSON.stringify(data.notificationSettings));
  }
  if (data.radiusMiles !== undefined) {
    updates.push(`radius_miles = $${paramCount++}`);
    values.push(data.radiusMiles);
  }

  if (updates.length === 0) {
    const prefs = await getUserPreferences(userId);
    if (!prefs) throw new NotFoundError('User preferences');
    return prefs;
  }

  values.push(userId);

  const result = await query(
    `UPDATE user_preferences SET ${updates.join(', ')}
     WHERE user_id = $${paramCount}
     RETURNING *`,
    values
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('User preferences');
  }

  // Mark onboarding as complete if preferences are set
  await query(
    'UPDATE users SET onboarding_completed = TRUE WHERE id = $1',
    [userId]
  );

  const prefs = await getUserPreferences(userId);
  return prefs!;
}

export async function updatePassword(
  userId: string,
  newPassword: string
): Promise<void> {
  const passwordHash = await hashPassword(newPassword);
  await query(
    'UPDATE users SET password_hash = $1 WHERE id = $2',
    [passwordHash, userId]
  );
}

export async function searchUsers(
  searchQuery: string,
  currentUserId: string
): Promise<Array<{ id: string; username: string; displayName: string; avatarUrl: string | null }>> {
  const result = await query<{
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  }>(
    `SELECT id, username, display_name, avatar_url
     FROM users
     WHERE id != $1
       AND (username ILIKE $2 OR display_name ILIKE $2)
     ORDER BY
       CASE WHEN username ILIKE $3 THEN 0 ELSE 1 END,
       username
     LIMIT 20`,
    [currentUserId, `%${searchQuery}%`, `${searchQuery}%`]
  );

  return result.rows.map(row => ({
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
  }));
}
