import { Router } from 'express';
import { z } from 'zod';
import { searchArtists, getPopularArtists } from '../services/artistSearch';
import { searchSportsTeams, getPopularSportsTeams } from '../services/sportsSearch';

const router = Router();

// GET /api/v1/artists/popular - Get popular artists
router.get('/popular', async (_req, res, next) => {
  try {
    const artists = await getPopularArtists();
    res.json({
      success: true,
      data: { artists },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/artists/search - Search for artists
router.get('/search', async (req, res, next) => {
  try {
    const { q } = z.object({
      q: z.string().min(1, 'Search query is required'),
    }).parse(req.query);

    const artists = await searchArtists(q);
    res.json({
      success: true,
      data: { artists },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/artists/sports/popular - Get popular sports teams
router.get('/sports/popular', async (_req, res, next) => {
  try {
    const teams = await getPopularSportsTeams();
    res.json({
      success: true,
      data: { teams },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/artists/sports/search - Search for sports teams
router.get('/sports/search', async (req, res, next) => {
  try {
    const { q } = z.object({
      q: z.string().min(1, 'Search query is required'),
    }).parse(req.query);

    const teams = await searchSportsTeams(q);
    res.json({
      success: true,
      data: { teams },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
