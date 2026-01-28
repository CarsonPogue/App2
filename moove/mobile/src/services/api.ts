import { API_URL } from '@/constants';
import { useAuthStore } from '@/stores';
import type {
  ApiResponse,
  ApiError,
  AuthUser,
  LoginCredentials,
  RegisterCredentials,
  User,
  UserPreferences,
  EventWithRSVP,
  PaginatedResponse,
  CommentWithUser,
  RSVP,
  EventInviteWithDetails,
  UserSummary,
  FriendshipWithUsers,
  EventFilters,
} from '@moove/shared/types';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async getHeaders(): Promise<HeadersInit> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const tokens = useAuthStore.getState().tokens;
    if (tokens?.accessToken) {
      headers['Authorization'] = `Bearer ${tokens.accessToken}`;
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    const data = await response.json();

    if (!response.ok) {
      const error = data as ApiError;
      throw new Error(error.error?.message || 'An error occurred');
    }

    return (data as ApiResponse<T>).data;
  }

  private async refreshTokens(): Promise<boolean> {
    const tokens = useAuthStore.getState().tokens;
    if (!tokens?.refreshToken) return false;

    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: tokens.refreshToken }),
      });

      if (!response.ok) {
        await useAuthStore.getState().logout();
        return false;
      }

      const data = await response.json();
      await useAuthStore.getState().updateTokens(data.data.tokens);
      return true;
    } catch {
      await useAuthStore.getState().logout();
      return false;
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = await this.getHeaders();

    let response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    // Handle token expiration
    if (response.status === 401) {
      const refreshed = await this.refreshTokens();
      if (refreshed) {
        const newHeaders = await this.getHeaders();
        response = await fetch(url, {
          ...options,
          headers: {
            ...newHeaders,
            ...options.headers,
          },
        });
      }
    }

    return this.handleResponse<T>(response);
  }

  // Auth endpoints
  async register(credentials: RegisterCredentials): Promise<AuthUser> {
    const response = await fetch(`${this.baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    return this.handleResponse<AuthUser>(response);
  }

  async login(credentials: LoginCredentials): Promise<AuthUser> {
    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    return this.handleResponse<AuthUser>(response);
  }

  async logout(): Promise<void> {
    const tokens = useAuthStore.getState().tokens;
    await this.request('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: tokens?.refreshToken }),
    });
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const response = await fetch(`${this.baseUrl}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return this.handleResponse<{ message: string }>(response);
  }

  // User endpoints
  async getMe(): Promise<{ user: User; preferences: UserPreferences }> {
    return this.request('/users/me');
  }

  async updateProfile(data: Partial<User>): Promise<{ user: User }> {
    return this.request('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async updatePreferences(
    data: Partial<Omit<UserPreferences, 'id' | 'userId'>>
  ): Promise<{ user: User; preferences: UserPreferences }> {
    return this.request('/users/me/preferences', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async updateLocation(latitude: number, longitude: number): Promise<void> {
    return this.request('/users/me/location', {
      method: 'PATCH',
      body: JSON.stringify({ latitude, longitude }),
    });
  }

  async getUser(userId: string): Promise<{ user: User }> {
    return this.request(`/users/${userId}`);
  }

  // Event endpoints
  async getEvents(
    filters?: EventFilters,
    page: number = 1,
    pageSize: number = 20
  ): Promise<PaginatedResponse<EventWithRSVP>> {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('pageSize', pageSize.toString());

    if (filters?.categories?.length) {
      filters.categories.forEach((c) => params.append('categories', c));
    }
    if (filters?.dateFrom) params.set('dateFrom', filters.dateFrom.toISOString());
    if (filters?.dateTo) params.set('dateTo', filters.dateTo.toISOString());
    if (filters?.search) params.set('search', filters.search);
    if (filters?.latitude) params.set('latitude', filters.latitude.toString());
    if (filters?.longitude) params.set('longitude', filters.longitude.toString());
    if (filters?.radiusMiles) params.set('radiusMiles', filters.radiusMiles.toString());
    if (filters?.sortBy) params.set('sortBy', filters.sortBy);

    return this.request(`/events?${params.toString()}`);
  }

  async getTonightEvents(
    latitude?: number,
    longitude?: number,
    radiusMiles?: number
  ): Promise<{ items: EventWithRSVP[] }> {
    const params = new URLSearchParams();
    if (latitude !== undefined) params.set('latitude', latitude.toString());
    if (longitude !== undefined) params.set('longitude', longitude.toString());
    if (radiusMiles !== undefined) params.set('radiusMiles', radiusMiles.toString());
    const queryString = params.toString();
    return this.request(`/events/tonight${queryString ? `?${queryString}` : ''}`);
  }

  async getWeekEvents(
    latitude?: number,
    longitude?: number,
    radiusMiles?: number
  ): Promise<{ items: EventWithRSVP[] }> {
    const params = new URLSearchParams();
    if (latitude !== undefined) params.set('latitude', latitude.toString());
    if (longitude !== undefined) params.set('longitude', longitude.toString());
    if (radiusMiles !== undefined) params.set('radiusMiles', radiusMiles.toString());
    const queryString = params.toString();
    return this.request(`/events/week${queryString ? `?${queryString}` : ''}`);
  }

  async getMonthEvents(
    latitude?: number,
    longitude?: number,
    radiusMiles?: number
  ): Promise<{ items: EventWithRSVP[] }> {
    const params = new URLSearchParams();
    if (latitude !== undefined) params.set('latitude', latitude.toString());
    if (longitude !== undefined) params.set('longitude', longitude.toString());
    if (radiusMiles !== undefined) params.set('radiusMiles', radiusMiles.toString());
    const queryString = params.toString();
    return this.request(`/events/month${queryString ? `?${queryString}` : ''}`);
  }

  async getTrendingEvents(): Promise<{ items: EventWithRSVP[] }> {
    return this.request('/events/trending');
  }

  async getNearbyPlaces(
    latitude: number,
    longitude: number,
    radiusMiles?: number
  ): Promise<{
    items: Array<{
      id: string;
      name: string;
      address: string;
      location: { latitude: number; longitude: number };
      rating: number | null;
      priceLevel: number | null;
      thumbnailUrl: string | null;
      category: string;
      types: string[];
      isOpen: boolean | null;
    }>;
  }> {
    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
    });
    if (radiusMiles !== undefined) {
      params.set('radiusMiles', radiusMiles.toString());
    }
    return this.request(`/places/nearby?${params.toString()}`);
  }

  async getEvent(eventId: string): Promise<{
    event: EventWithRSVP;
    recentComments: CommentWithUser[];
  }> {
    return this.request(`/events/${eventId}`);
  }

  async rsvpEvent(
    eventId: string,
    status: 'going' | 'interested' | 'not_going' | 'hidden',
    emojiReaction?: string
  ): Promise<{ rsvp: RSVP }> {
    return this.request(`/events/${eventId}/rsvp`, {
      method: 'POST',
      body: JSON.stringify({ status, emojiReaction }),
    });
  }

  async removeRsvp(eventId: string): Promise<void> {
    return this.request(`/events/${eventId}/rsvp`, {
      method: 'DELETE',
    });
  }

  async hideEvent(eventId: string): Promise<void> {
    return this.request(`/events/${eventId}/hide`, {
      method: 'POST',
    });
  }

  // Comment endpoints
  async getComments(
    eventId: string,
    page: number = 1
  ): Promise<PaginatedResponse<CommentWithUser>> {
    return this.request(`/events/${eventId}/comments?page=${page}`);
  }

  async createComment(
    eventId: string,
    content: string,
    parentCommentId?: string
  ): Promise<{ comment: CommentWithUser }> {
    return this.request(`/events/${eventId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content, parentCommentId }),
    });
  }

  async updateComment(
    eventId: string,
    commentId: string,
    content: string
  ): Promise<{ comment: CommentWithUser }> {
    return this.request(`/events/${eventId}/comments/${commentId}`, {
      method: 'PATCH',
      body: JSON.stringify({ content }),
    });
  }

  async deleteComment(eventId: string, commentId: string): Promise<void> {
    return this.request(`/events/${eventId}/comments/${commentId}`, {
      method: 'DELETE',
    });
  }

  // Social endpoints
  async getFriends(
    page: number = 1
  ): Promise<PaginatedResponse<UserSummary>> {
    return this.request(`/social/friends?page=${page}`);
  }

  async getFriendRequests(): Promise<{ items: FriendshipWithUsers[] }> {
    return this.request('/social/friends/requests');
  }

  async sendFriendRequest(userId: string): Promise<void> {
    return this.request(`/social/friends/request/${userId}`, {
      method: 'POST',
    });
  }

  async acceptFriendRequest(requestId: string): Promise<void> {
    return this.request(`/social/friends/accept/${requestId}`, {
      method: 'POST',
    });
  }

  async declineFriendRequest(requestId: string): Promise<void> {
    return this.request(`/social/friends/decline/${requestId}`, {
      method: 'POST',
    });
  }

  async removeFriend(userId: string): Promise<void> {
    return this.request(`/social/friends/${userId}`, {
      method: 'DELETE',
    });
  }

  async blockUser(userId: string): Promise<void> {
    return this.request(`/social/friends/block/${userId}`, {
      method: 'POST',
    });
  }

  // Invite endpoints
  async getReceivedInvites(
    page: number = 1
  ): Promise<PaginatedResponse<EventInviteWithDetails>> {
    return this.request(`/invites/received?page=${page}`);
  }

  async getSentInvites(
    page: number = 1
  ): Promise<PaginatedResponse<EventInviteWithDetails>> {
    return this.request(`/invites/sent?page=${page}`);
  }

  async sendInvite(
    eventId: string,
    recipientId: string,
    message?: string
  ): Promise<void> {
    return this.request('/invites', {
      method: 'POST',
      body: JSON.stringify({ eventId, recipientId, message }),
    });
  }

  async respondToInvite(
    inviteId: string,
    status: 'accepted' | 'declined'
  ): Promise<void> {
    return this.request(`/invites/${inviteId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // Artist endpoints
  async getPopularArtists(): Promise<{ artists: Array<{ id: string; name: string; imageUrl: string | null; genres: string[]; upcomingEvents: number }> }> {
    return this.request('/artists/popular');
  }

  async searchArtists(query: string): Promise<{ artists: Array<{ id: string; name: string; imageUrl: string | null; genres: string[]; upcomingEvents: number }> }> {
    return this.request(`/artists/search?q=${encodeURIComponent(query)}`);
  }

  // Sports team endpoints
  async getPopularSportsTeams(): Promise<{ teams: Array<{ id: string; name: string; imageUrl: string | null; sport: string; league: string; upcomingEvents: number }> }> {
    return this.request('/artists/sports/popular');
  }

  async searchSportsTeams(query: string): Promise<{ teams: Array<{ id: string; name: string; imageUrl: string | null; sport: string; league: string; upcomingEvents: number }> }> {
    return this.request(`/artists/sports/search?q=${encodeURIComponent(query)}`);
  }

  // User search endpoint
  async searchUsers(query: string): Promise<{ users: Array<{ id: string; username: string; displayName: string; avatarUrl: string | null }> }> {
    return this.request(`/users/search?q=${encodeURIComponent(query)}`);
  }
}

export const api = new ApiClient(API_URL);
