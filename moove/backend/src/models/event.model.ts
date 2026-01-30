import { query } from '../config/database';
import type {
  Event,
  EventWithRSVP,
  EventCategory,
  EventSource,
  RSVPStatus,
  GeoLocation,
  PriceRange,
  UserSummary,
  RSVPCounts,
  PaginatedResponse,
  EventFilters,
} from '@moove/shared/types';
import { PAGINATION } from '@moove/shared/constants';

interface DbEvent {
  id: string;
  external_id: string | null;
  source: EventSource;
  title: string;
  description: string | null;
  category: EventCategory;
  subcategory: string | null;
  venue_name: string;
  venue_address: string;
  latitude: number;
  longitude: number;
  google_place_id: string | null;
  thumbnail_url: string | null;
  images: string[];
  start_time: Date;
  end_time: Date | null;
  price_range: PriceRange | null;
  ticket_url: string | null;
  rating: number | null;
  is_featured: boolean;
  relevance_tags: string[];
  created_at: Date;
  updated_at: Date;
  distance_miles?: number;
}

function mapDbEventToEvent(dbEvent: DbEvent): Event {
  return {
    id: dbEvent.id,
    externalId: dbEvent.external_id,
    source: dbEvent.source,
    title: dbEvent.title,
    description: dbEvent.description,
    category: dbEvent.category,
    subcategory: dbEvent.subcategory,
    venueName: dbEvent.venue_name,
    venueAddress: dbEvent.venue_address,
    location: {
      latitude: dbEvent.latitude,
      longitude: dbEvent.longitude,
    },
    googlePlaceId: dbEvent.google_place_id,
    thumbnailUrl: dbEvent.thumbnail_url,
    images: dbEvent.images || [],
    startTime: dbEvent.start_time,
    endTime: dbEvent.end_time,
    priceRange: dbEvent.price_range,
    ticketUrl: dbEvent.ticket_url,
    rating: dbEvent.rating ? parseFloat(dbEvent.rating.toString()) : null,
    isFeatured: dbEvent.is_featured,
    relevanceTags: dbEvent.relevance_tags || [],
    createdAt: dbEvent.created_at,
    updatedAt: dbEvent.updated_at,
  };
}

export async function createEvent(data: {
  externalId?: string;
  source: EventSource;
  title: string;
  description?: string;
  category: EventCategory;
  subcategory?: string;
  venueName: string;
  venueAddress: string;
  location: GeoLocation;
  googlePlaceId?: string;
  thumbnailUrl?: string;
  images?: string[];
  startTime: Date;
  endTime?: Date;
  priceRange?: PriceRange;
  ticketUrl?: string;
  rating?: number;
  isFeatured?: boolean;
  relevanceTags?: string[];
}): Promise<Event> {
  const result = await query<DbEvent>(
    `INSERT INTO events (
       external_id, source, title, description, category, subcategory,
       venue_name, venue_address, location, google_place_id,
       thumbnail_url, images, start_time, end_time, price_range,
       ticket_url, rating, is_featured, relevance_tags
     ) VALUES (
       $1, $2, $3, $4, $5, $6, $7, $8,
       ST_SetSRID(ST_MakePoint($9, $10), 4326)::geography,
       $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
     )
     ON CONFLICT (external_id, source) DO UPDATE SET
       title = EXCLUDED.title,
       description = EXCLUDED.description,
       venue_name = EXCLUDED.venue_name,
       venue_address = EXCLUDED.venue_address,
       location = EXCLUDED.location,
       thumbnail_url = EXCLUDED.thumbnail_url,
       images = EXCLUDED.images,
       start_time = EXCLUDED.start_time,
       end_time = EXCLUDED.end_time,
       price_range = EXCLUDED.price_range,
       ticket_url = EXCLUDED.ticket_url,
       rating = EXCLUDED.rating,
       updated_at = NOW()
     RETURNING id, external_id, source, title, description, category, subcategory,
               venue_name, venue_address,
               ST_X(location::geometry) as longitude, ST_Y(location::geometry) as latitude,
               google_place_id, thumbnail_url, images, start_time, end_time,
               price_range, ticket_url, rating, is_featured, relevance_tags,
               created_at, updated_at`,
    [
      data.externalId || null,
      data.source,
      data.title,
      data.description || null,
      data.category,
      data.subcategory || null,
      data.venueName,
      data.venueAddress,
      data.location.longitude,
      data.location.latitude,
      data.googlePlaceId || null,
      data.thumbnailUrl || null,
      JSON.stringify(data.images || []),
      data.startTime,
      data.endTime || null,
      data.priceRange ? JSON.stringify(data.priceRange) : null,
      data.ticketUrl || null,
      data.rating || null,
      data.isFeatured || false,
      JSON.stringify(data.relevanceTags || []),
    ]
  );

  return mapDbEventToEvent(result.rows[0]);
}

export async function findEventById(id: string): Promise<Event | null> {
  const result = await query<DbEvent>(
    `SELECT id, external_id, source, title, description, category, subcategory,
            venue_name, venue_address,
            ST_X(location::geometry) as longitude, ST_Y(location::geometry) as latitude,
            google_place_id, thumbnail_url, images, start_time, end_time,
            price_range, ticket_url, rating, is_featured, relevance_tags,
            created_at, updated_at
     FROM events WHERE id = $1`,
    [id]
  );

  if (result.rows.length === 0) return null;
  return mapDbEventToEvent(result.rows[0]);
}

export async function findEvents(
  filters: EventFilters,
  userId?: string,
  page: number = 1,
  pageSize: number = PAGINATION.DEFAULT_PAGE_SIZE
): Promise<PaginatedResponse<EventWithRSVP>> {
  const conditions: string[] = ['e.start_time > NOW()'];
  const params: unknown[] = [];
  const countParams: unknown[] = []; // Separate params for count query
  let paramCount = 1;
  let countParamCount = 1;

  // Location filter
  let distanceSelect = 'NULL as distance_miles';
  if (filters.latitude !== undefined && filters.longitude !== undefined) {
    distanceSelect = `ST_Distance(e.location, ST_SetSRID(ST_MakePoint($${paramCount}, $${paramCount + 1}), 4326)::geography) / 1609.34 as distance_miles`;
    params.push(filters.longitude, filters.latitude);
    paramCount += 2;

    if (filters.radiusMiles) {
      conditions.push(`ST_DWithin(e.location, ST_SetSRID(ST_MakePoint($${paramCount}, $${paramCount + 1}), 4326)::geography, $${paramCount + 2})`);
      params.push(filters.longitude, filters.latitude, filters.radiusMiles * 1609.34);
      paramCount += 3;
      // Add to count params with its own numbering
      countParams.push(filters.longitude, filters.latitude, filters.radiusMiles * 1609.34);
      countParamCount += 3;
    }
  }

  // Category filter
  if (filters.categories && filters.categories.length > 0) {
    conditions.push(`e.category = ANY($${paramCount})`);
    params.push(filters.categories);
    paramCount++;
    countParams.push(filters.categories);
    countParamCount++;
  }

  // Date range filter
  if (filters.dateFrom) {
    conditions.push(`e.start_time >= $${paramCount}`);
    params.push(filters.dateFrom);
    paramCount++;
    countParams.push(filters.dateFrom);
    countParamCount++;
  }
  if (filters.dateTo) {
    conditions.push(`e.start_time <= $${paramCount}`);
    params.push(filters.dateTo);
    paramCount++;
    countParams.push(filters.dateTo);
    countParamCount++;
  }

  // Search filter
  if (filters.search) {
    conditions.push(`(e.title ILIKE $${paramCount} OR e.venue_name ILIKE $${paramCount} OR e.description ILIKE $${paramCount})`);
    params.push(`%${filters.search}%`);
    paramCount++;
    countParams.push(`%${filters.search}%`);
    countParamCount++;
  }

  // Build ORDER BY
  let orderBy = 'e.start_time ASC';
  if (filters.sortBy === 'distance' && filters.latitude !== undefined) {
    orderBy = 'distance_miles ASC NULLS LAST';
  } else if (filters.sortBy === 'popularity') {
    orderBy = '(SELECT COUNT(*) FROM rsvps WHERE event_id = e.id AND status IN (\'going\', \'interested\')) DESC';
  }

  const offset = (page - 1) * pageSize;

  // Build count conditions properly
  const countConditionsList: string[] = ['e.start_time > NOW()'];
  let countIdx = 1;

  if (filters.radiusMiles && filters.latitude !== undefined && filters.longitude !== undefined) {
    countConditionsList.push(`ST_DWithin(e.location, ST_SetSRID(ST_MakePoint($${countIdx}, $${countIdx + 1}), 4326)::geography, $${countIdx + 2})`);
    countIdx += 3;
  }
  if (filters.categories && filters.categories.length > 0) {
    countConditionsList.push(`e.category = ANY($${countIdx})`);
    countIdx++;
  }
  if (filters.dateFrom) {
    countConditionsList.push(`e.start_time >= $${countIdx}`);
    countIdx++;
  }
  if (filters.dateTo) {
    countConditionsList.push(`e.start_time <= $${countIdx}`);
    countIdx++;
  }
  if (filters.search) {
    countConditionsList.push(`(e.title ILIKE $${countIdx} OR e.venue_name ILIKE $${countIdx} OR e.description ILIKE $${countIdx})`);
    countIdx++;
  }

  // Get total count
  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM events e WHERE ${countConditionsList.join(' AND ')}`,
    countParams
  );
  const total = parseInt(countResult.rows[0].count, 10);

  // Get events
  params.push(pageSize, offset);
  const eventsResult = await query<DbEvent & { distance_miles: number | null }>(
    `SELECT e.id, e.external_id, e.source, e.title, e.description, e.category, e.subcategory,
            e.venue_name, e.venue_address,
            ST_X(e.location::geometry) as longitude, ST_Y(e.location::geometry) as latitude,
            e.google_place_id, e.thumbnail_url, e.images, e.start_time, e.end_time,
            e.price_range, e.ticket_url, e.rating, e.is_featured, e.relevance_tags,
            e.created_at, e.updated_at,
            ${distanceSelect}
     FROM events e
     WHERE ${conditions.join(' AND ')}
     ORDER BY ${orderBy}
     LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
    params
  );

  // Get RSVPs and friend data for each event if user is provided
  const events: EventWithRSVP[] = await Promise.all(
    eventsResult.rows.map(async (dbEvent) => {
      const event = mapDbEventToEvent(dbEvent);

      // Get RSVP counts
      const countsResult = await query<{ status: RSVPStatus; count: string }>(
        `SELECT status, COUNT(*) as count FROM rsvps
         WHERE event_id = $1 AND status IN ('going', 'interested')
         GROUP BY status`,
        [event.id]
      );
      const rsvpCounts: RSVPCounts = { going: 0, interested: 0 };
      countsResult.rows.forEach((row) => {
        if (row.status === 'going') rsvpCounts.going = parseInt(row.count, 10);
        if (row.status === 'interested') rsvpCounts.interested = parseInt(row.count, 10);
      });

      // Get comment count
      const commentResult = await query<{ count: string }>(
        'SELECT COUNT(*) as count FROM comments WHERE event_id = $1 AND is_deleted = FALSE',
        [event.id]
      );
      const commentCount = parseInt(commentResult.rows[0].count, 10);

      // Get user RSVP if authenticated
      let userRsvp = null;
      if (userId) {
        const rsvpResult = await query<{ id: string; status: RSVPStatus; emoji_reaction: string | null; created_at: Date; updated_at: Date }>(
          'SELECT id, status, emoji_reaction, created_at, updated_at FROM rsvps WHERE event_id = $1 AND user_id = $2',
          [event.id, userId]
        );
        if (rsvpResult.rows.length > 0) {
          const r = rsvpResult.rows[0];
          userRsvp = {
            id: r.id,
            userId,
            eventId: event.id,
            status: r.status,
            emojiReaction: r.emoji_reaction,
            createdAt: r.created_at,
            updatedAt: r.updated_at,
          };
        }
      }

      // Get friends attending (simplified - returns empty for now, will implement with friendships)
      const friendsAttending: UserSummary[] = [];

      return {
        ...event,
        userRsvp,
        friendsAttending,
        rsvpCounts,
        commentCount,
      };
    })
  );

  return {
    items: events,
    total,
    page,
    pageSize,
    hasMore: offset + events.length < total,
  };
}

export async function findTonightEvents(
  location: GeoLocation,
  radiusMiles: number,
  userId?: string
): Promise<EventWithRSVP[]> {
  const now = new Date();
  const endOfTonight = new Date();
  endOfTonight.setHours(23, 59, 59, 999);

  const result = await findEvents(
    {
      latitude: location.latitude,
      longitude: location.longitude,
      radiusMiles,
      dateFrom: now,
      dateTo: endOfTonight,
      sortBy: 'date',
    },
    userId,
    1,
    100
  );

  return result.items;
}

export async function findWeekEvents(
  location: GeoLocation,
  radiusMiles: number,
  userId?: string
): Promise<EventWithRSVP[]> {
  const now = new Date();
  const endOfWeek = new Date();
  endOfWeek.setDate(endOfWeek.getDate() + 7);

  const result = await findEvents(
    {
      latitude: location.latitude,
      longitude: location.longitude,
      radiusMiles,
      dateFrom: now,
      dateTo: endOfWeek,
      sortBy: 'date',
    },
    userId,
    1,
    200
  );

  return result.items;
}

export async function findMonthEvents(
  location: GeoLocation,
  radiusMiles: number,
  userId?: string
): Promise<EventWithRSVP[]> {
  const now = new Date();
  const endOfMonth = new Date();
  endOfMonth.setMonth(endOfMonth.getMonth() + 1);

  const result = await findEvents(
    {
      latitude: location.latitude,
      longitude: location.longitude,
      radiusMiles,
      dateFrom: now,
      dateTo: endOfMonth,
      sortBy: 'date',
    },
    userId,
    1,
    500
  );

  return result.items;
}

export async function findTrendingEvents(
  userId?: string
): Promise<EventWithRSVP[]> {
  // Find events with the most RSVPs (going + interested) in the next month
  const result = await query<DbEvent & { rsvp_count: string }>(
    `SELECT e.id, e.external_id, e.source, e.title, e.description, e.category, e.subcategory,
            e.venue_name, e.venue_address,
            ST_X(e.location::geometry) as longitude, ST_Y(e.location::geometry) as latitude,
            e.google_place_id, e.thumbnail_url, e.images, e.start_time, e.end_time,
            e.price_range, e.ticket_url, e.rating, e.is_featured, e.relevance_tags,
            e.created_at, e.updated_at,
            COUNT(r.id) as rsvp_count
     FROM events e
     LEFT JOIN rsvps r ON r.event_id = e.id AND r.status IN ('going', 'interested')
     WHERE e.start_time > NOW()
       AND e.start_time < NOW() + INTERVAL '30 days'
     GROUP BY e.id
     HAVING COUNT(r.id) > 0
     ORDER BY COUNT(r.id) DESC, e.start_time ASC
     LIMIT 20`,
    []
  );

  // Get RSVPs and friend data for each event
  const events: EventWithRSVP[] = await Promise.all(
    result.rows.map(async (dbEvent) => {
      const event = mapDbEventToEvent(dbEvent);

      // Get RSVP counts
      const countsResult = await query<{ status: RSVPStatus; count: string }>(
        `SELECT status, COUNT(*) as count FROM rsvps
         WHERE event_id = $1 AND status IN ('going', 'interested')
         GROUP BY status`,
        [event.id]
      );
      const rsvpCounts: RSVPCounts = { going: 0, interested: 0 };
      countsResult.rows.forEach((row) => {
        if (row.status === 'going') rsvpCounts.going = parseInt(row.count, 10);
        if (row.status === 'interested') rsvpCounts.interested = parseInt(row.count, 10);
      });

      // Get comment count
      const commentResult = await query<{ count: string }>(
        'SELECT COUNT(*) as count FROM comments WHERE event_id = $1 AND is_deleted = FALSE',
        [event.id]
      );
      const commentCount = parseInt(commentResult.rows[0].count, 10);

      // Get user RSVP if authenticated
      let userRsvp = null;
      if (userId) {
        const rsvpResult = await query<{ id: string; status: RSVPStatus; emoji_reaction: string | null; created_at: Date; updated_at: Date }>(
          'SELECT id, status, emoji_reaction, created_at, updated_at FROM rsvps WHERE event_id = $1 AND user_id = $2',
          [event.id, userId]
        );
        if (rsvpResult.rows.length > 0) {
          const r = rsvpResult.rows[0];
          userRsvp = {
            id: r.id,
            userId,
            eventId: event.id,
            status: r.status,
            emojiReaction: r.emoji_reaction,
            createdAt: r.created_at,
            updatedAt: r.updated_at,
          };
        }
      }

      // Get friends attending (simplified)
      const friendsAttending: UserSummary[] = [];

      return {
        ...event,
        userRsvp,
        friendsAttending,
        rsvpCounts,
        commentCount,
      };
    })
  );

  return events;
}

export async function findEventsByExternalId(
  externalId: string,
  source: EventSource
): Promise<Event | null> {
  const result = await query<DbEvent>(
    `SELECT id, external_id, source, title, description, category, subcategory,
            venue_name, venue_address,
            ST_X(location::geometry) as longitude, ST_Y(location::geometry) as latitude,
            google_place_id, thumbnail_url, images, start_time, end_time,
            price_range, ticket_url, rating, is_featured, relevance_tags,
            created_at, updated_at
     FROM events WHERE external_id = $1 AND source = $2`,
    [externalId, source]
  );

  if (result.rows.length === 0) return null;
  return mapDbEventToEvent(result.rows[0]);
}
