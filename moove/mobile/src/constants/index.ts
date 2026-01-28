export * from './theme';

export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'moove_access_token',
  REFRESH_TOKEN: 'moove_refresh_token',
  USER: 'moove_user',
  ONBOARDING_COMPLETE: 'moove_onboarding_complete',
} as const;

export const QUERY_KEYS = {
  USER: 'user',
  USER_PREFERENCES: 'user_preferences',
  EVENTS: 'events',
  TONIGHT_EVENTS: 'tonight_events',
  WEEK_EVENTS: 'week_events',
  MONTH_EVENTS: 'month_events',
  TRENDING_EVENTS: 'trending_events',
  NEARBY_PLACES: 'nearby_places',
  EVENT_DETAIL: 'event_detail',
  COMMENTS: 'comments',
  FRIENDS: 'friends',
  FRIEND_REQUESTS: 'friend_requests',
  INVITES_RECEIVED: 'invites_received',
  INVITES_SENT: 'invites_sent',
} as const;

export const ONBOARDING_STEPS = {
  ARTISTS: 1,
  GENRES: 2,
  SPORTS: 3,
  INTERESTS: 4,
  LOCATION: 5,
} as const;
