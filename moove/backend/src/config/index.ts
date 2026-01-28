import dotenv from 'dotenv';
import { z } from 'zod';
import path from 'path';

// Load environment variables from .env file in development
// In production, env vars should be set by the deployment platform
const envPath = path.resolve(__dirname, '../../.env');
const result = dotenv.config({ path: envPath });

// Only warn about missing .env in development (it's expected in production)
if (result.error && process.env.NODE_ENV !== 'production') {
  console.warn(`Warning: Could not load .env file from ${envPath}`);
  console.warn('Make sure to copy .env.example to .env and configure your environment variables.');
}

// Environment variable schema with strict validation
const configSchema = z.object({
  // Server
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  port: z.coerce.number().min(1).max(65535).default(3001),

  // Database - REQUIRED
  databaseUrl: z.string({
    required_error: 'DATABASE_URL is required. Set it to your PostgreSQL connection string.',
  }).min(1, 'DATABASE_URL cannot be empty'),

  // Redis - Optional
  redisUrl: z.string().optional(),

  // JWT - REQUIRED with minimum security requirements
  jwtSecret: z.string({
    required_error: 'JWT_SECRET is required. Generate with: openssl rand -base64 64',
  }).min(32, 'JWT_SECRET must be at least 32 characters for security'),

  jwtRefreshSecret: z.string({
    required_error: 'JWT_REFRESH_SECRET is required. Generate with: openssl rand -base64 64',
  }).min(32, 'JWT_REFRESH_SECRET must be at least 32 characters for security'),

  // OAuth - Optional (only required if using OAuth)
  googleClientId: z.string().optional(),
  googleClientSecret: z.string().optional(),
  googleCallbackUrl: z.string().url().optional(),
  appleClientId: z.string().optional(),
  appleTeamId: z.string().optional(),
  appleKeyId: z.string().optional(),
  applePrivateKey: z.string().optional(),

  // Third-party APIs - Optional (features disabled if not set)
  ticketmasterApiKey: z.string().optional(),
  seatgeekClientId: z.string().optional(),
  seatgeekClientSecret: z.string().optional(),
  googlePlacesApiKey: z.string().optional(),

  // Email - Optional
  sendgridApiKey: z.string().optional(),
  fromEmail: z.string().email().default('noreply@themoove.app'),

  // Monitoring - Optional
  sentryDsn: z.string().url().optional().or(z.literal('')),

  // CORS - REQUIRED for frontend communication
  frontendUrl: z.string({
    required_error: 'FRONTEND_URL is required for CORS configuration',
  }).url().default('http://localhost:8081'),
});

// Map environment variables to config object
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

// Parse and validate configuration - fails fast with clear error messages
let config: z.infer<typeof configSchema>;

try {
  config = configSchema.parse(rawConfig);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('\n========================================');
    console.error('CONFIGURATION ERROR - Missing or invalid environment variables:');
    console.error('========================================\n');

    error.errors.forEach((err) => {
      const path = err.path.join('.');
      console.error(`  ❌ ${path}: ${err.message}`);
    });

    console.error('\n----------------------------------------');
    console.error('Please check your .env file or environment variables.');
    console.error('Copy .env.example to .env and fill in the required values.');
    console.error('----------------------------------------\n');

    process.exit(1);
  }
  throw error;
}

// Security warnings for production
if (config.nodeEnv === 'production') {
  if (config.jwtSecret.includes('development') || config.jwtSecret.includes('change')) {
    console.error('SECURITY ERROR: JWT_SECRET appears to be a development placeholder. Set a secure value in production.');
    process.exit(1);
  }
  if (config.jwtRefreshSecret.includes('development') || config.jwtRefreshSecret.includes('change')) {
    console.error('SECURITY ERROR: JWT_REFRESH_SECRET appears to be a development placeholder. Set a secure value in production.');
    process.exit(1);
  }
  if (config.frontendUrl.includes('localhost')) {
    console.warn('WARNING: FRONTEND_URL is set to localhost in production. This may cause CORS issues.');
  }
}

// Log configuration status (without exposing secrets)
console.log('\n========================================');
console.log('Configuration loaded successfully');
console.log('========================================');
console.log(`  Environment: ${config.nodeEnv}`);
console.log(`  Port: ${config.port}`);
console.log(`  Database: ${config.databaseUrl ? '✓ configured' : '✗ not configured'}`);
console.log(`  Redis: ${config.redisUrl ? '✓ configured' : '○ not configured (optional)'}`);
console.log(`  Google OAuth: ${config.googleClientId ? '✓ configured' : '○ not configured'}`);
console.log(`  Apple OAuth: ${config.appleClientId ? '✓ configured' : '○ not configured'}`);
console.log(`  Ticketmaster API: ${config.ticketmasterApiKey ? '✓ configured' : '○ not configured'}`);
console.log(`  SeatGeek API: ${config.seatgeekClientId ? '✓ configured' : '○ not configured'}`);
console.log(`  Google Places API: ${config.googlePlacesApiKey ? '✓ configured' : '○ not configured'}`);
console.log(`  SendGrid: ${config.sendgridApiKey ? '✓ configured' : '○ not configured'}`);
console.log(`  Sentry: ${config.sentryDsn ? '✓ configured' : '○ not configured'}`);
console.log('========================================\n');

export { config };
export type Config = z.infer<typeof configSchema>;
