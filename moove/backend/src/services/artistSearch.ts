import { config } from '../config';

export interface Artist {
  id: string;
  name: string;
  imageUrl: string | null;
  genres: string[];
  upcomingEvents: number;
}

interface TicketmasterAttraction {
  id: string;
  name: string;
  images?: Array<{ url: string; width: number; height: number }>;
  classifications?: Array<{
    genre?: { name: string };
    subGenre?: { name: string };
  }>;
  upcomingEvents?: { _total: number };
}

// Popular artist names to fetch from Ticketmaster
const POPULAR_ARTIST_NAMES = [
  'Taylor Swift', 'Beyoncé', 'Drake', 'Bad Bunny', 'The Weeknd',
  'Ed Sheeran', 'Coldplay', 'Billie Eilish', 'Harry Styles', 'Dua Lipa',
  'Kendrick Lamar', 'Bruno Mars', 'SZA', 'Morgan Wallen', 'Post Malone',
  'Travis Scott', 'Doja Cat', 'Olivia Rodrigo', 'Adele', 'Rihanna',
  'Ariana Grande', 'J. Cole', 'Lady Gaga', 'Kanye West',
];

// Fallback artist data when API is unavailable
const POPULAR_ARTISTS: Artist[] = POPULAR_ARTIST_NAMES.map((name, index) => ({
  id: `popular-${index}`,
  name,
  imageUrl: null,
  genres: ['Pop', 'Hip-Hop', 'R&B', 'Rock', 'Country', 'Latin'][index % 6] ? [['Pop', 'Hip-Hop', 'R&B', 'Rock', 'Country', 'Latin'][index % 6]] : [],
  upcomingEvents: 0,
}));

// Cache for popular artists (refresh every hour)
let cachedPopularArtists: Artist[] = [];
let cacheTime = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

export async function searchArtists(query: string): Promise<Artist[]> {
  if (!config.ticketmasterApiKey) {
    // Fallback to filtering popular artists if no API key
    const lowerQuery = query.toLowerCase();
    return POPULAR_ARTISTS.filter(artist =>
      artist.name.toLowerCase().includes(lowerQuery)
    );
  }

  try {
    const url = new URL('https://app.ticketmaster.com/discovery/v2/attractions.json');
    url.searchParams.set('apikey', config.ticketmasterApiKey);
    url.searchParams.set('keyword', query);
    url.searchParams.set('classificationName', 'music'); // Only music artists
    url.searchParams.set('size', '20');
    url.searchParams.set('sort', 'relevance,desc');

    const response = await fetch(url.toString());
    if (!response.ok) {
      console.error(`Ticketmaster Attractions API error: ${response.status}`);
      // Fallback to popular artists
      const lowerQuery = query.toLowerCase();
      return POPULAR_ARTISTS.filter(artist =>
        artist.name.toLowerCase().includes(lowerQuery)
      );
    }

    const data = await response.json() as { _embedded?: { attractions?: TicketmasterAttraction[] } };
    const attractions = data._embedded?.attractions || [];

    return attractions.map((attraction): Artist => {
      const image = attraction.images?.find((img) => img.width >= 300 && img.width <= 800)?.url
        || attraction.images?.[0]?.url
        || null;

      const genres = attraction.classifications
        ?.map(c => c.genre?.name || c.subGenre?.name)
        .filter(Boolean) as string[] || [];

      return {
        id: attraction.id,
        name: attraction.name,
        imageUrl: image,
        genres: [...new Set(genres)], // Remove duplicates
        upcomingEvents: attraction.upcomingEvents?._total || 0,
      };
    });
  } catch (error) {
    console.error('Error searching artists:', error);
    // Fallback to filtering popular artists
    const lowerQuery = query.toLowerCase();
    return POPULAR_ARTISTS.filter(artist =>
      artist.name.toLowerCase().includes(lowerQuery)
    );
  }
}

export async function getPopularArtists(): Promise<Artist[]> {
  // Return cached results if still valid
  if (cachedPopularArtists.length > 0 && Date.now() - cacheTime < CACHE_DURATION) {
    return cachedPopularArtists;
  }

  if (!config.ticketmasterApiKey) {
    // Return basic list without images if no API key
    return POPULAR_ARTIST_NAMES.map((name, index) => ({
      id: `popular-${index}`,
      name,
      imageUrl: null,
      genres: [],
      upcomingEvents: 0,
    }));
  }

  try {
    // Fetch each popular artist from Ticketmaster
    const artistPromises = POPULAR_ARTIST_NAMES.map(async (name): Promise<Artist | null> => {
      try {
        const url = new URL('https://app.ticketmaster.com/discovery/v2/attractions.json');
        url.searchParams.set('apikey', config.ticketmasterApiKey!);
        url.searchParams.set('keyword', name);
        url.searchParams.set('classificationName', 'music');
        url.searchParams.set('size', '1');

        const response = await fetch(url.toString());
        if (!response.ok) return null;

        const data = await response.json() as { _embedded?: { attractions?: TicketmasterAttraction[] } };
        const attraction = data._embedded?.attractions?.[0];

        if (!attraction) return null;

        const image = attraction.images?.find((img) => img.width >= 300 && img.width <= 800)?.url
          || attraction.images?.[0]?.url
          || null;

        const genres = attraction.classifications
          ?.map(c => c.genre?.name || c.subGenre?.name)
          .filter(Boolean) as string[] || [];

        return {
          id: attraction.id,
          name: attraction.name,
          imageUrl: image,
          genres: [...new Set(genres)],
          upcomingEvents: attraction.upcomingEvents?._total || 0,
        };
      } catch {
        return null;
      }
    });

    const results = await Promise.all(artistPromises);
    cachedPopularArtists = results.filter((a): a is Artist => a !== null);
    cacheTime = Date.now();

    return cachedPopularArtists;
  } catch (error) {
    console.error('Error fetching popular artists:', error);
    // Return basic list without images as fallback
    return POPULAR_ARTIST_NAMES.map((name, index) => ({
      id: `popular-${index}`,
      name,
      imageUrl: null,
      genres: [],
      upcomingEvents: 0,
    }));
  }
}
