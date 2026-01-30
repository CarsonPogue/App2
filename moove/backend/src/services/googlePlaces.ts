import { config } from '../config';
import type { EventCategory, GeoLocation } from '@moove/shared/types';

const GOOGLE_PLACES_API_BASE = 'https://maps.googleapis.com/maps/api/place';

interface PlaceResult {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  rating?: number;
  price_level?: number;
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
  types: string[];
  opening_hours?: {
    open_now: boolean;
  };
}

interface NearbySearchResponse {
  results: PlaceResult[];
  status: string;
  next_page_token?: string;
}

// Map Google Places types to our event categories
function mapTypeToCategory(types: string[]): EventCategory {
  if (types.includes('restaurant') || types.includes('food') || types.includes('cafe')) {
    return 'restaurant' as EventCategory;
  }
  if (types.includes('bar') || types.includes('night_club')) {
    return 'bar' as EventCategory;
  }
  if (types.includes('stadium') || types.includes('gym')) {
    return 'sports' as EventCategory;
  }
  if (types.includes('museum') || types.includes('art_gallery')) {
    return 'arts' as EventCategory;
  }
  if (types.includes('movie_theater') || types.includes('performing_arts_theater')) {
    return 'theater' as EventCategory;
  }
  if (types.includes('park') || types.includes('amusement_park')) {
    return 'festival' as EventCategory;
  }
  if (types.includes('tourist_attraction') || types.includes('point_of_interest')) {
    return 'other' as EventCategory;
  }
  return 'other' as EventCategory;
}

// Get a photo URL from a photo reference
export function getPhotoUrl(photoReference: string, maxWidth: number = 400): string {
  if (!config.googlePlacesApiKey) return '';
  return `${GOOGLE_PLACES_API_BASE}/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${config.googlePlacesApiKey}`;
}

// Search for nearby places
export async function searchNearbyPlaces(
  location: GeoLocation,
  radiusMeters: number = 5000,
  type?: string
): Promise<PlaceResult[]> {
  if (!config.googlePlacesApiKey) {
    console.warn('Google Places API key not configured');
    return [];
  }

  try {
    const params = new URLSearchParams({
      location: `${location.latitude},${location.longitude}`,
      radius: radiusMeters.toString(),
      key: config.googlePlacesApiKey,
    });

    if (type) {
      params.set('type', type);
    }

    const response = await fetch(
      `${GOOGLE_PLACES_API_BASE}/nearbysearch/json?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error(`Google Places API error: ${response.status}`);
    }

    const data = await response.json() as NearbySearchResponse;

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Google Places API error:', data.status);
      return [];
    }

    return data.results;
  } catch (error) {
    console.error('Failed to fetch nearby places:', error);
    return [];
  }
}

// Get highly rated nearby venues (restaurants, bars, entertainment venues)
export async function getHighlyRatedNearbyVenues(
  location: GeoLocation,
  radiusMeters: number = 8000
): Promise<Array<{
  id: string;
  name: string;
  address: string;
  location: GeoLocation;
  rating: number | null;
  priceLevel: number | null;
  thumbnailUrl: string | null;
  category: EventCategory;
  types: string[];
  isOpen: boolean | null;
}>> {
  if (!config.googlePlacesApiKey) {
    return [];
  }

  // Search for different types of venues
  const venueTypes = ['restaurant', 'bar', 'cafe', 'night_club', 'park', 'museum', 'tourist_attraction'];

  const allPlaces: PlaceResult[] = [];

  // Fetch places for each type (in parallel)
  const results = await Promise.all(
    venueTypes.map(type => searchNearbyPlaces(location, radiusMeters, type))
  );

  results.forEach(places => {
    allPlaces.push(...places);
  });

  // Remove duplicates by place_id
  const uniquePlaces = Array.from(
    new Map(allPlaces.map(place => [place.place_id, place])).values()
  );

  // Filter to highly rated places (4.0+) and sort by rating
  const highlyRated = uniquePlaces
    .filter(place => (place.rating || 0) >= 4.0)
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 50); // Limit to top 50

  return highlyRated.map(place => ({
    id: place.place_id,
    name: place.name,
    address: place.formatted_address,
    location: {
      latitude: place.geometry.location.lat,
      longitude: place.geometry.location.lng,
    },
    rating: place.rating || null,
    priceLevel: place.price_level || null,
    thumbnailUrl: place.photos?.[0]
      ? getPhotoUrl(place.photos[0].photo_reference)
      : null,
    category: mapTypeToCategory(place.types),
    types: place.types,
    isOpen: place.opening_hours?.open_now ?? null,
  }));
}
