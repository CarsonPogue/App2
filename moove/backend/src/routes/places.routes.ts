import { Router } from 'express';
import { z } from 'zod';
import { optionalAuth, AuthRequest } from '../middleware/auth';
import { getHighlyRatedNearbyVenues } from '../services/googlePlaces';
import { radiusSchema } from '../utils/validation';

const router = Router();

// Validation schema for location query
const locationQuerySchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  radiusMiles: radiusSchema.optional().default(5),
});

// GET /api/v1/places/nearby
router.get('/nearby', optionalAuth, async (req: AuthRequest, res, next) => {
  try {
    const { latitude, longitude, radiusMiles } = locationQuerySchema.parse(req.query);

    // Convert miles to meters
    const radiusMeters = radiusMiles * 1609.34;

    const venues = await getHighlyRatedNearbyVenues(
      { latitude, longitude },
      radiusMeters
    );

    res.json({
      success: true,
      data: { items: venues },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
