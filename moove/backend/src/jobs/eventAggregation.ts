import cron from 'node-cron';
import { config } from '../config';
import * as eventModel from '../models/event.model';
import { EventCategory, EventSource } from '@moove/shared/types';
import { EVENTS } from '@moove/shared/constants';

interface TicketmasterEvent {
  id: string;
  name: string;
  info?: string;
  dates: {
    start: {
      localDate: string;
      localTime?: string;
      dateTime?: string;
    };
    end?: {
      localDate?: string;
      localTime?: string;
      dateTime?: string;
    };
  };
  classifications?: Array<{
    segment?: { name: string };
    genre?: { name: string };
  }>;
  images?: Array<{ url: string; width: number; height: number }>;
  priceRanges?: Array<{ min: number; max: number; currency: string }>;
  url?: string;
  _embedded?: {
    venues?: Array<{
      name: string;
      address?: { line1: string };
      city?: { name: string };
      state?: { stateCode: string };
      postalCode?: string;
      location?: { latitude: string; longitude: string };
    }>;
  };
}

interface SeatGeekEvent {
  id: number;
  title: string;
  short_title: string;
  description?: string;
  datetime_local: string;
  datetime_utc: string;
  type: string;
  venue: {
    name: string;
    address?: string;
    city: string;
    state: string;
    postal_code?: string;
    location: { lat: number; lon: number };
  };
  performers?: Array<{
    name: string;
    image?: string;
  }>;
  stats?: {
    lowest_price?: number;
    highest_price?: number;
  };
  url?: string;
}

function mapTicketmasterCategory(classifications?: TicketmasterEvent['classifications']): EventCategory {
  const segment = classifications?.[0]?.segment?.name?.toLowerCase();
  const genre = classifications?.[0]?.genre?.name?.toLowerCase();

  if (segment === 'music') return EventCategory.CONCERT;
  if (segment === 'sports') return EventCategory.SPORTS;
  if (segment === 'arts & theatre') {
    if (genre?.includes('comedy')) return EventCategory.COMEDY;
    return EventCategory.THEATER;
  }
  if (segment === 'film') return EventCategory.ARTS;
  if (segment?.includes('festival')) return EventCategory.FESTIVAL;

  return EventCategory.OTHER;
}

function mapSeatGeekCategory(type: string): EventCategory {
  const t = type.toLowerCase();
  if (t.includes('concert') || t.includes('music')) return EventCategory.CONCERT;
  if (t.includes('sport') || t.includes('basketball') || t.includes('football') || t.includes('baseball') || t.includes('hockey')) return EventCategory.SPORTS;
  if (t.includes('theater') || t.includes('theatre') || t.includes('broadway')) return EventCategory.THEATER;
  if (t.includes('comedy')) return EventCategory.COMEDY;
  if (t.includes('festival')) return EventCategory.FESTIVAL;
  return EventCategory.OTHER;
}

async function fetchTicketmasterEvents(
  latitude: number,
  longitude: number,
  radiusMiles: number = 50
): Promise<void> {
  if (!config.ticketmasterApiKey) {
    console.log('Ticketmaster API key not configured, skipping...');
    return;
  }

  try {
    const url = new URL('https://app.ticketmaster.com/discovery/v2/events.json');
    url.searchParams.set('apikey', config.ticketmasterApiKey);
    url.searchParams.set('latlong', `${latitude},${longitude}`);
    url.searchParams.set('radius', radiusMiles.toString());
    url.searchParams.set('unit', 'miles');
    url.searchParams.set('size', '100');
    url.searchParams.set('sort', 'date,asc');

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Ticketmaster API error: ${response.status}`);
    }

    const data = await response.json() as { _embedded?: { events?: TicketmasterEvent[] } };
    const events: TicketmasterEvent[] = data._embedded?.events || [];

    console.log(`Fetched ${events.length} events from Ticketmaster`);

    for (const event of events) {
      try {
        const venue = event._embedded?.venues?.[0];
        if (!venue?.location?.latitude || !venue?.location?.longitude) continue;

        const startTime = event.dates.start.dateTime
          ? new Date(event.dates.start.dateTime)
          : new Date(`${event.dates.start.localDate}T${event.dates.start.localTime || '00:00:00'}`);

        const endTime = event.dates.end?.dateTime
          ? new Date(event.dates.end.dateTime)
          : null;

        const thumbnail = event.images?.find((img) => img.width >= 300 && img.width <= 800)?.url
          || event.images?.[0]?.url;

        await eventModel.createEvent({
          externalId: event.id,
          source: EventSource.TICKETMASTER,
          title: event.name,
          description: event.info,
          category: mapTicketmasterCategory(event.classifications),
          subcategory: event.classifications?.[0]?.genre?.name,
          venueName: venue.name,
          venueAddress: [
            venue.address?.line1,
            venue.city?.name,
            venue.state?.stateCode,
            venue.postalCode,
          ].filter(Boolean).join(', '),
          location: {
            latitude: parseFloat(venue.location.latitude),
            longitude: parseFloat(venue.location.longitude),
          },
          thumbnailUrl: thumbnail,
          images: event.images?.map((img) => img.url) || [],
          startTime,
          endTime: endTime ?? undefined,
          priceRange: event.priceRanges?.[0]
            ? {
                min: event.priceRanges[0].min,
                max: event.priceRanges[0].max,
                currency: event.priceRanges[0].currency,
              }
            : undefined,
          ticketUrl: event.url,
          relevanceTags: event.classifications?.map((c) => c.genre?.name).filter(Boolean) as string[] || [],
        });
      } catch (error) {
        console.error(`Error processing Ticketmaster event ${event.id}:`, error);
      }
    }
  } catch (error) {
    console.error('Error fetching Ticketmaster events:', error);
  }
}

async function fetchSeatGeekEvents(
  latitude: number,
  longitude: number,
  radiusMiles: number = 50
): Promise<void> {
  if (!config.seatgeekClientId) {
    console.log('SeatGeek API credentials not configured, skipping...');
    return;
  }

  try {
    const url = new URL('https://api.seatgeek.com/2/events');
    url.searchParams.set('client_id', config.seatgeekClientId);
    if (config.seatgeekClientSecret) {
      url.searchParams.set('client_secret', config.seatgeekClientSecret);
    }
    url.searchParams.set('lat', latitude.toString());
    url.searchParams.set('lon', longitude.toString());
    url.searchParams.set('range', `${radiusMiles}mi`);
    url.searchParams.set('per_page', '100');
    url.searchParams.set('sort', 'datetime_local.asc');

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`SeatGeek API error: ${response.status}`);
    }

    const data = await response.json() as { events?: SeatGeekEvent[] };
    const events: SeatGeekEvent[] = data.events || [];

    console.log(`Fetched ${events.length} events from SeatGeek`);

    for (const event of events) {
      try {
        if (!event.venue?.location?.lat || !event.venue?.location?.lon) continue;

        const thumbnail = event.performers?.[0]?.image;

        await eventModel.createEvent({
          externalId: event.id.toString(),
          source: EventSource.SEATGEEK,
          title: event.title,
          description: event.description,
          category: mapSeatGeekCategory(event.type),
          venueName: event.venue.name,
          venueAddress: [
            event.venue.address,
            event.venue.city,
            event.venue.state,
            event.venue.postal_code,
          ].filter(Boolean).join(', '),
          location: {
            latitude: event.venue.location.lat,
            longitude: event.venue.location.lon,
          },
          thumbnailUrl: thumbnail,
          images: event.performers?.map((p) => p.image).filter(Boolean) as string[] || [],
          startTime: new Date(event.datetime_utc),
          priceRange: event.stats?.lowest_price && event.stats?.highest_price
            ? {
                min: event.stats.lowest_price,
                max: event.stats.highest_price,
                currency: 'USD',
              }
            : undefined,
          ticketUrl: event.url,
          relevanceTags: event.performers?.map((p) => p.name) || [],
        });
      } catch (error) {
        console.error(`Error processing SeatGeek event ${event.id}:`, error);
      }
    }
  } catch (error) {
    console.error('Error fetching SeatGeek events:', error);
  }
}

// Default locations to fetch events from (major US cities)
const DEFAULT_LOCATIONS = [
  { lat: 40.7128, lng: -74.0060, name: 'New York' },
  { lat: 34.0522, lng: -118.2437, name: 'Los Angeles' },
  { lat: 41.8781, lng: -87.6298, name: 'Chicago' },
  { lat: 29.7604, lng: -95.3698, name: 'Houston' },
  { lat: 33.4484, lng: -112.0740, name: 'Phoenix' },
  { lat: 39.7392, lng: -104.9903, name: 'Denver' },
  { lat: 47.6062, lng: -122.3321, name: 'Seattle' },
  { lat: 25.7617, lng: -80.1918, name: 'Miami' },
  { lat: 33.7490, lng: -84.3880, name: 'Atlanta' },
  { lat: 42.3601, lng: -71.0589, name: 'Boston' },
];

async function runAggregation(): Promise<void> {
  console.log('Starting event aggregation...');
  const startTime = Date.now();

  for (const location of DEFAULT_LOCATIONS) {
    console.log(`Fetching events for ${location.name}...`);

    await Promise.all([
      fetchTicketmasterEvents(location.lat, location.lng),
      fetchSeatGeekEvents(location.lat, location.lng),
    ]);

    // Small delay between locations to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  const duration = (Date.now() - startTime) / 1000;
  console.log(`Event aggregation completed in ${duration.toFixed(2)}s`);
}

export function startEventAggregationJob(): void {
  // Run immediately on startup
  runAggregation().catch(console.error);

  // Schedule to run every 6 hours
  cron.schedule(`0 */${EVENTS.AGGREGATION_INTERVAL_HOURS} * * *`, () => {
    runAggregation().catch(console.error);
  });

  console.log(`Event aggregation job scheduled (every ${EVENTS.AGGREGATION_INTERVAL_HOURS} hours)`);
}

export { runAggregation };
