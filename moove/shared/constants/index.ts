// ============================================
// MOOVE - Shared Constants
// ============================================

// -------------------- API Configuration --------------------

export const API_VERSION = 'v1';
export const API_BASE_PATH = `/api/${API_VERSION}`;

// -------------------- Auth Constants --------------------

export const AUTH = {
  ACCESS_TOKEN_EXPIRY: 15 * 60, // 15 minutes in seconds
  REFRESH_TOKEN_EXPIRY: 7 * 24 * 60 * 60, // 7 days in seconds
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 30,
  BIO_MAX_LENGTH: 160,
  BCRYPT_ROUNDS: 12,
} as const;

// -------------------- Rate Limiting --------------------

export const RATE_LIMITS = {
  LOGIN_ATTEMPTS: 5,
  LOGIN_WINDOW_MINUTES: 15,
  ACCOUNT_LOCKOUT_ATTEMPTS: 10,
  GENERAL_REQUESTS_PER_MINUTE: 100,
  WRITE_REQUESTS_PER_MINUTE: 10,
} as const;

// -------------------- Event Configuration --------------------

export const EVENTS = {
  DEFAULT_RADIUS_MILES: 25,
  MIN_RADIUS_MILES: 5,
  MAX_RADIUS_MILES: 100,
  CACHE_TTL_HOURS: 1,
  AGGREGATION_INTERVAL_HOURS: 6,
  TONIGHT_HOURS_THRESHOLD: 4,
  HAPPENING_NOW_HOURS: 2,
} as const;

// -------------------- Comments --------------------

export const COMMENTS = {
  MAX_LENGTH: 500,
  PAGE_SIZE: 20,
} as const;

// -------------------- Pagination --------------------

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

// -------------------- Genres --------------------

export const MUSIC_GENRES = [
  'Rock',
  'Pop',
  'Hip-Hop',
  'R&B',
  'Electronic',
  'Country',
  'Jazz',
  'Classical',
  'Latin',
  'Indie',
  'Metal',
  'Folk',
  'Blues',
  'Reggae',
  'Soul',
  'Punk',
  'Alternative',
  'World',
] as const;

// -------------------- Sports --------------------

export const SPORTS_LEAGUES = [
  { id: 'nfl', name: 'NFL', sport: 'Football' },
  { id: 'nba', name: 'NBA', sport: 'Basketball' },
  { id: 'mlb', name: 'MLB', sport: 'Baseball' },
  { id: 'nhl', name: 'NHL', sport: 'Hockey' },
  { id: 'mls', name: 'MLS', sport: 'Soccer' },
  { id: 'ncaaf', name: 'College Football', sport: 'Football' },
  { id: 'ncaab', name: 'College Basketball', sport: 'Basketball' },
] as const;

// -------------------- Interests --------------------

export const INTEREST_CATEGORIES = [
  { id: 'food', name: 'Food & Dining', icon: 'utensils' },
  { id: 'nightlife', name: 'Nightlife', icon: 'moon' },
  { id: 'arts', name: 'Arts & Culture', icon: 'palette' },
  { id: 'outdoor', name: 'Outdoor Activities', icon: 'mountain' },
  { id: 'comedy', name: 'Comedy', icon: 'laugh' },
  { id: 'theater', name: 'Theater', icon: 'masks' },
  { id: 'festivals', name: 'Festivals', icon: 'party' },
  { id: 'networking', name: 'Networking', icon: 'users' },
  { id: 'family', name: 'Family-Friendly', icon: 'child' },
  { id: 'fitness', name: 'Fitness & Wellness', icon: 'heart' },
] as const;

// -------------------- Validation Patterns --------------------

export const VALIDATION = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  USERNAME_REGEX: /^[a-zA-Z0-9_]+$/,
  // At least 8 chars, 1 uppercase, 1 lowercase, 1 number
  PASSWORD_REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
} as const;

// -------------------- Error Codes --------------------

export const ERROR_CODES = {
  // Auth errors
  INVALID_CREDENTIALS: 'AUTH_001',
  TOKEN_EXPIRED: 'AUTH_002',
  TOKEN_INVALID: 'AUTH_003',
  ACCOUNT_LOCKED: 'AUTH_004',
  EMAIL_EXISTS: 'AUTH_005',
  USERNAME_EXISTS: 'AUTH_006',

  // User errors
  USER_NOT_FOUND: 'USER_001',
  INVALID_PASSWORD: 'USER_002',

  // Event errors
  EVENT_NOT_FOUND: 'EVENT_001',

  // Social errors
  ALREADY_FRIENDS: 'SOCIAL_001',
  REQUEST_EXISTS: 'SOCIAL_002',
  USER_BLOCKED: 'SOCIAL_003',
  CANNOT_FRIEND_SELF: 'SOCIAL_004',

  // General errors
  VALIDATION_ERROR: 'VALIDATION_001',
  RATE_LIMITED: 'RATE_001',
  SERVER_ERROR: 'SERVER_001',
} as const;
