// ============================================
// MOOVE - Shared Type Definitions
// ============================================

// -------------------- Enums --------------------

export enum EventSource {
  TICKETMASTER = 'ticketmaster',
  SEATGEEK = 'seatgeek',
  GOOGLE_PLACES = 'google_places',
  USER_CREATED = 'user_created',
}

export enum EventCategory {
  CONCERT = 'concert',
  SPORTS = 'sports',
  RESTAURANT = 'restaurant',
  BAR = 'bar',
  THEATER = 'theater',
  FESTIVAL = 'festival',
  COMEDY = 'comedy',
  ARTS = 'arts',
  NIGHTLIFE = 'nightlife',
  OTHER = 'other',
}

export enum RSVPStatus {
  GOING = 'going',
  INTERESTED = 'interested',
  NOT_GOING = 'not_going',
  HIDDEN = 'hidden',
}

export enum FriendshipStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  BLOCKED = 'blocked',
}

export enum InviteStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
}

// -------------------- Base Types --------------------

export interface Timestamps {
  createdAt: Date;
  updatedAt: Date;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
}

export interface PriceRange {
  min: number;
  max: number;
  currency: string;
}

// -------------------- User Types --------------------

export interface User extends Timestamps {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  location: GeoLocation | null;
  onboardingCompleted: boolean;
  lastActiveAt: Date;
}

export interface UserPreferences {
  id: string;
  userId: string;
  favoriteArtists: ArtistPreference[];
  favoriteGenres: string[];
  sportsTeams: TeamPreference[];
  interests: string[];
  notificationSettings: NotificationSettings;
  radiusMiles: number;
}

export interface ArtistPreference {
  id: string;
  name: string;
  imageUrl?: string;
  spotifyId?: string;
}

export interface TeamPreference {
  id: string;
  name: string;
  sport: string;
  logoUrl?: string;
}

export interface NotificationSettings {
  eventReminders: boolean;
  friendActivity: boolean;
  invites: boolean;
  comments: boolean;
  marketing: boolean;
}

// -------------------- Event Types --------------------

export interface Event extends Timestamps {
  id: string;
  externalId: string | null;
  source: EventSource;
  title: string;
  description: string | null;
  category: EventCategory;
  subcategory: string | null;
  venueName: string;
  venueAddress: string;
  location: GeoLocation;
  googlePlaceId: string | null;
  thumbnailUrl: string | null;
  images: string[];
  startTime: Date;
  endTime: Date | null;
  priceRange: PriceRange | null;
  ticketUrl: string | null;
  rating: number | null;
  isFeatured: boolean;
  relevanceTags: string[];
}

export interface EventWithRSVP extends Event {
  userRsvp: RSVP | null;
  friendsAttending: UserSummary[];
  rsvpCounts: RSVPCounts;
  commentCount: number;
}

export interface RSVPCounts {
  going: number;
  interested: number;
}

// -------------------- RSVP Types --------------------

export interface RSVP extends Timestamps {
  id: string;
  userId: string;
  eventId: string;
  status: RSVPStatus;
  emojiReaction: string | null;
}

export interface RSVPWithUser extends RSVP {
  user: UserSummary;
}

// -------------------- Comment Types --------------------

export interface Comment extends Timestamps {
  id: string;
  eventId: string;
  userId: string;
  parentCommentId: string | null;
  content: string;
  isDeleted: boolean;
}

export interface CommentWithUser extends Comment {
  user: UserSummary;
  replies?: CommentWithUser[];
}

// -------------------- Social Types --------------------

export interface Friendship extends Timestamps {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: FriendshipStatus;
}

export interface FriendshipWithUsers extends Friendship {
  requester: UserSummary;
  addressee: UserSummary;
}

export interface EventInvite {
  id: string;
  eventId: string;
  senderId: string;
  recipientId: string;
  message: string | null;
  status: InviteStatus;
  createdAt: Date;
  respondedAt: Date | null;
}

export interface EventInviteWithDetails extends EventInvite {
  event: Event;
  sender: UserSummary;
  recipient: UserSummary;
}

// -------------------- Summary Types --------------------

export interface UserSummary {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

// -------------------- Auth Types --------------------

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  username: string;
  password: string;
  displayName: string;
}

export interface AuthUser {
  user: User;
  tokens: AuthTokens;
}

// -------------------- API Response Types --------------------

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// -------------------- Filter Types --------------------

export interface EventFilters {
  categories?: EventCategory[];
  dateFrom?: Date;
  dateTo?: Date;
  rsvpStatus?: RSVPStatus[];
  search?: string;
  latitude?: number;
  longitude?: number;
  radiusMiles?: number;
  sortBy?: 'date' | 'distance' | 'popularity' | 'friends';
}

export interface TimeFrame {
  type: 'tonight' | 'week' | 'month';
}
