import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const configSchema = z.object({
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  port: z.coerce.number().default(3001),

  // Database
  databaseUrl: z.string(),
  redisUrl: z.string().optional(),

  // JWT
  jwtSecret: z.string().min(32),
  jwtRefreshSecret: z.string().min(32),

  // OAuth
  googleClientId: z.string().optional(),
  googleClientSecret: z.string().optional(),
  googleCallbackUrl: z.string().optional(),
  appleClientId: z.string().optional(),
  appleTeamId: z.string().optional(),
  appleKeyId: z.string().optional(),
  applePrivateKey: z.string().optional(),

  // Third-party APIs
  ticketmasterApiKey: z.string().optional(),
  seatgeekClientId: z.string().optional(),
  seatgeekClientSecret: z.string().optional(),
  googlePlacesApiKey: z.string().optional(),

  // Email
  sendgridApiKey: z.string().optional(),
  fromEmail: z.string().email().default('noreply@moove.app'),

  // Monitoring
  sentryDsn: z.string().optional(),

  // CORS
  frontendUrl: z.string().default('http://localhost:8081'),
});

const rawConfig = {
  nodeEnv: process.env.NODE_ENV,
  port: process.env.PORT,
  databaseUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  googleClientId: process.env.GOOGLE_OAUTH_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
  googleCallbackUrl: process.env.GOOGLE_OAUTH_CALLBACK_URL,
  appleClientId: process.env.APPLE_CLIENT_ID,
  appleTeamId: process.env.APPLE_TEAM_ID,
  appleKeyId: process.env.APPLE_KEY_ID,
  applePrivateKey: process.env.APPLE_PRIVATE_KEY,
  ticketmasterApiKey: process.env.TICKETMASTER_API_KEY,
  seatgeekClientId: process.env.SEATGEEK_CLIENT_ID,
  seatgeekClientSecret: process.env.SEATGEEK_CLIENT_SECRET,
  googlePlacesApiKey: process.env.GOOGLE_PLACES_API_KEY,
  sendgridApiKey: process.env.SENDGRID_API_KEY,
  fromEmail: process.env.FROM_EMAIL,
  sentryDsn: process.env.SENTRY_DSN,
  frontendUrl: process.env.FRONTEND_URL,
};

export const config = configSchema.parse(rawConfig);
export type Config = z.infer<typeof configSchema>;
