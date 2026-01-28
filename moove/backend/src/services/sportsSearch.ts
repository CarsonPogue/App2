import { config } from '../config';

export interface SportsTeam {
  id: string;
  name: string;
  imageUrl: string | null;
  sport: string;
  league: string;
  upcomingEvents: number;
}

interface TicketmasterAttraction {
  id: string;
  name: string;
  images?: Array<{ url: string; width: number; height: number }>;
  classifications?: Array<{
    segment?: { name: string };
    genre?: { name: string };
    subGenre?: { name: string };
  }>;
  upcomingEvents?: { _total: number };
}

// Popular sports teams with their leagues
const POPULAR_TEAMS = [
  // NFL
  { name: 'Dallas Cowboys', league: 'NFL' },
  { name: 'New England Patriots', league: 'NFL' },
  { name: 'Kansas City Chiefs', league: 'NFL' },
  { name: 'Green Bay Packers', league: 'NFL' },
  { name: 'San Francisco 49ers', league: 'NFL' },
  // NBA
  { name: 'Los Angeles Lakers', league: 'NBA' },
  { name: 'Golden State Warriors', league: 'NBA' },
  { name: 'Boston Celtics', league: 'NBA' },
  { name: 'Chicago Bulls', league: 'NBA' },
  { name: 'Miami Heat', league: 'NBA' },
  // MLB
  { name: 'New York Yankees', league: 'MLB' },
  { name: 'Los Angeles Dodgers', league: 'MLB' },
  { name: 'Boston Red Sox', league: 'MLB' },
  { name: 'Chicago Cubs', league: 'MLB' },
  // NHL
  { name: 'Toronto Maple Leafs', league: 'NHL' },
  { name: 'Montreal Canadiens', league: 'NHL' },
  { name: 'New York Rangers', league: 'NHL' },
  { name: 'Boston Bruins', league: 'NHL' },
];

// Cache for popular teams
let cachedPopularTeams: SportsTeam[] = [];
let cacheTime = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

export async function searchSportsTeams(query: string): Promise<SportsTeam[]> {
  if (!config.ticketmasterApiKey) {
    // Fallback to filtering popular teams
    const lowerQuery = query.toLowerCase();
    return POPULAR_TEAMS
      .filter(team => team.name.toLowerCase().includes(lowerQuery))
      .map((team, index) => ({
        id: `team-${index}`,
        name: team.name,
        imageUrl: null,
        sport: getSportFromLeague(team.league),
        league: team.league,
        upcomingEvents: 0,
      }));
  }

  try {
    const url = new URL('https://app.ticketmaster.com/discovery/v2/attractions.json');
    url.searchParams.set('apikey', config.ticketmasterApiKey);
    url.searchParams.set('keyword', query);
    url.searchParams.set('classificationName', 'sports');
    url.searchParams.set('size', '20');
    url.searchParams.set('sort', 'relevance,desc');

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Ticketmaster API error: ${response.status}`);
    }

    const data = await response.json() as { _embedded?: { attractions?: TicketmasterAttraction[] } };
    const attractions = data._embedded?.attractions || [];

    return attractions.map((attraction): SportsTeam => {
      const image = attraction.images?.find((img) => img.width >= 300 && img.width <= 800)?.url
        || attraction.images?.[0]?.url
        || null;

      const classification = attraction.classifications?.[0];
      const league = classification?.subGenre?.name || classification?.genre?.name || 'Sports';

      return {
        id: attraction.id,
        name: attraction.name,
        imageUrl: image,
        sport: getSportFromLeague(league),
        league,
        upcomingEvents: attraction.upcomingEvents?._total || 0,
      };
    });
  } catch (error) {
    console.error('Error searching sports teams:', error);
    const lowerQuery = query.toLowerCase();
    return POPULAR_TEAMS
      .filter(team => team.name.toLowerCase().includes(lowerQuery))
      .map((team, index) => ({
        id: `team-${index}`,
        name: team.name,
        imageUrl: null,
        sport: getSportFromLeague(team.league),
        league: team.league,
        upcomingEvents: 0,
      }));
  }
}

export async function getPopularSportsTeams(): Promise<SportsTeam[]> {
  if (cachedPopularTeams.length > 0 && Date.now() - cacheTime < CACHE_DURATION) {
    return cachedPopularTeams;
  }

  if (!config.ticketmasterApiKey) {
    return POPULAR_TEAMS.map((team, index) => ({
      id: `team-${index}`,
      name: team.name,
      imageUrl: null,
      sport: getSportFromLeague(team.league),
      league: team.league,
      upcomingEvents: 0,
    }));
  }

  try {
    const teamPromises = POPULAR_TEAMS.slice(0, 16).map(async (team): Promise<SportsTeam | null> => {
      try {
        const url = new URL('https://app.ticketmaster.com/discovery/v2/attractions.json');
        url.searchParams.set('apikey', config.ticketmasterApiKey!);
        url.searchParams.set('keyword', team.name);
        url.searchParams.set('classificationName', 'sports');
        url.searchParams.set('size', '1');

        const response = await fetch(url.toString());
        if (!response.ok) return null;

        const data = await response.json() as { _embedded?: { attractions?: TicketmasterAttraction[] } };
        const attraction = data._embedded?.attractions?.[0];

        if (!attraction) return null;

        const image = attraction.images?.find((img) => img.width >= 300 && img.width <= 800)?.url
          || attraction.images?.[0]?.url
          || null;

        return {
          id: attraction.id,
          name: attraction.name,
          imageUrl: image,
          sport: getSportFromLeague(team.league),
          league: team.league,
          upcomingEvents: attraction.upcomingEvents?._total || 0,
        };
      } catch {
        return null;
      }
    });

    const results = await Promise.all(teamPromises);
    cachedPopularTeams = results.filter((t): t is SportsTeam => t !== null);
    cacheTime = Date.now();

    return cachedPopularTeams;
  } catch (error) {
    console.error('Error fetching popular teams:', error);
    return POPULAR_TEAMS.map((team, index) => ({
      id: `team-${index}`,
      name: team.name,
      imageUrl: null,
      sport: getSportFromLeague(team.league),
      league: team.league,
      upcomingEvents: 0,
    }));
  }
}

function getSportFromLeague(league: string): string {
  const leagueMap: Record<string, string> = {
    'NFL': 'Football',
    'NBA': 'Basketball',
    'MLB': 'Baseball',
    'NHL': 'Hockey',
    'MLS': 'Soccer',
    'NCAA Football': 'Football',
    'NCAA Basketball': 'Basketball',
  };
  return leagueMap[league] || 'Sports';
}
