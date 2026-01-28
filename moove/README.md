# MOOVE - Hyperlocal Event Discovery & Social Planning App

MOOVE is a cross-platform mobile application that helps users discover local events, restaurants, concerts, and more, while enabling social planning with friends.

## Features

- **Event Discovery**: Browse concerts, sports, restaurants, bars, theater, and more
- **Tonight View**: See everything happening today in your area
- **Weekly/Monthly Schedule**: Plan ahead with upcoming events
- **Trending Events**: Discover popular events with the most RSVPs
- **Nearby Places**: Find highly-rated restaurants, venues, and attractions
- **RSVP System**: Mark events as Going, Interested, or Can't Go
- **Social Features**: Connect with friends, see who's attending, send invites
- **Comments**: Discuss events with other attendees
- **Personalized Recommendations**: Based on your favorite artists, genres, and interests
- **Real-time Updates**: Live comments and RSVP counts via WebSocket

## Tech Stack

### Mobile App (React Native/Expo)
- **Framework**: Expo SDK 50 with Expo Router
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Animations**: React Native Reanimated 3
- **UI**: Custom component library with distinctive design system

### Backend (Node.js)
- **Framework**: Express.js
- **Database**: PostgreSQL with PostGIS
- **Cache**: Redis (optional)
- **Auth**: JWT with refresh token rotation
- **Real-time**: Socket.io
- **Validation**: Zod

### Third-Party Integrations
- Ticketmaster Discovery API
- SeatGeek API
- Google Places API

## Project Structure

```
moove/
├── mobile/              # React Native/Expo app
│   ├── app/             # Expo Router screens
│   ├── src/
│   │   ├── components/  # UI components (atoms, molecules, organisms)
│   │   ├── constants/   # Theme, colors, config
│   │   ├── hooks/       # Custom React hooks
│   │   ├── services/    # API client
│   │   └── stores/      # Zustand stores
│   └── package.json
├── backend/             # Node.js API server
│   ├── src/
│   │   ├── config/      # Configuration
│   │   ├── middleware/  # Express middleware
│   │   ├── models/      # Database models
│   │   ├── routes/      # API routes
│   │   ├── services/    # External API integrations
│   │   ├── jobs/        # Background jobs
│   │   └── utils/       # Utilities
│   ├── migrations/      # SQL migrations
│   └── package.json
├── shared/              # Shared types and constants
│   ├── types/
│   └── constants/
├── .github/workflows/   # CI/CD pipelines
└── docker-compose.yml   # Local development setup
```

## Security & Environment Configuration

### ⚠️ IMPORTANT: Secret Management

This project follows security best practices for secret management:

1. **Never commit secrets** - All `.env` files are in `.gitignore`
2. **Use environment variables** - All secrets are loaded from environment variables
3. **Fail fast** - The application refuses to start if required secrets are missing
4. **Validate secrets** - JWT secrets must be at least 32 characters
5. **No client-side secrets** - The mobile app never contains API keys; all sensitive operations go through the backend

### Setting Up Environment Variables

#### Backend

1. Copy the example file:
   ```bash
   cp backend/.env.example backend/.env
   ```

2. Generate secure JWT secrets:
   ```bash
   # On macOS/Linux:
   openssl rand -base64 64

   # On Windows (PowerShell):
   [Convert]::ToBase64String((1..64 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])
   ```

3. Edit `backend/.env` and fill in your values:
   ```env
   # Required
   DATABASE_URL=postgresql://user:password@localhost:5432/moove
   JWT_SECRET=<your-generated-64-char-secret>
   JWT_REFRESH_SECRET=<your-generated-64-char-secret>

   # Optional (features disabled if not set)
   GOOGLE_PLACES_API_KEY=<your-google-api-key>
   TICKETMASTER_API_KEY=<your-ticketmaster-key>
   ```

#### Mobile App

1. Copy the example file:
   ```bash
   cp mobile/.env.example mobile/.env
   ```

2. Configure the API URL:
   ```env
   # For local development
   EXPO_PUBLIC_API_URL=http://localhost:3001/api/v1

   # For Android emulator
   EXPO_PUBLIC_API_URL=http://10.0.2.2:3001/api/v1
   ```

#### Docker Compose

1. Copy the example file:
   ```bash
   cp .env.example .env
   ```

2. Set required values:
   ```env
   POSTGRES_PASSWORD=<secure-password>
   JWT_SECRET=<your-generated-secret>
   JWT_REFRESH_SECRET=<your-generated-secret>
   ```

### Environment Variables Reference

#### Backend (Required)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string with PostGIS |
| `JWT_SECRET` | Secret for access tokens (min 32 chars) |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens (min 32 chars) |

#### Backend (Optional)

| Variable | Description |
|----------|-------------|
| `REDIS_URL` | Redis connection string for caching |
| `GOOGLE_OAUTH_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Google OAuth client secret |
| `TICKETMASTER_API_KEY` | Ticketmaster Discovery API key |
| `SEATGEEK_CLIENT_ID` | SeatGeek client ID |
| `SEATGEEK_CLIENT_SECRET` | SeatGeek client secret |
| `GOOGLE_PLACES_API_KEY` | Google Places API key |
| `SENDGRID_API_KEY` | SendGrid API key for emails |
| `SENTRY_DSN` | Sentry DSN for error tracking |
| `FRONTEND_URL` | Frontend URL for CORS (default: http://localhost:8081) |

#### Mobile App

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_API_URL` | Backend API URL |
| `EXPO_PUBLIC_GOOGLE_MAPS_KEY` | Google Maps API key (optional) |

### CI/CD Secrets

For GitHub Actions, configure these secrets in your repository settings:

| Secret | Description |
|--------|-------------|
| `TEST_POSTGRES_PASSWORD` | Password for test database |
| `TEST_JWT_SECRET` | JWT secret for tests (32+ chars) |
| `TEST_JWT_REFRESH_SECRET` | JWT refresh secret for tests (32+ chars) |

### Production Deployment

For production deployments:

1. **Never use development secrets** - Generate new secrets for production
2. **Use a secrets manager** - AWS Secrets Manager, HashiCorp Vault, etc.
3. **Rotate secrets regularly** - Especially JWT secrets
4. **Restrict API keys** - Limit Google API keys to specific domains/apps
5. **Enable audit logging** - Track who accesses secrets

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+ with PostGIS extension
- Redis (optional, for caching)
- Expo CLI (`npm install -g expo-cli`)

### Quick Start with Docker

The fastest way to get started:

```bash
cd moove

# Copy and configure environment variables
cp .env.example .env
# Edit .env with your values (especially POSTGRES_PASSWORD, JWT_SECRET, JWT_REFRESH_SECRET)

# Start all services
docker-compose up -d

# The backend will be available at http://localhost:3001
```

### Manual Setup

1. **Clone and install dependencies**
   ```bash
   cd moove
   npm install
   ```

2. **Configure environment variables**
   ```bash
   cp backend/.env.example backend/.env
   # Edit backend/.env with your configuration
   ```

3. **Set up the database**
   ```bash
   # Create database
   createdb moove

   # Enable PostGIS
   psql moove -c "CREATE EXTENSION IF NOT EXISTS postgis;"
   psql moove -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"

   # Run migrations
   psql moove -f backend/migrations/001_initial_schema.sql
   ```

4. **Start the backend**
   ```bash
   npm run backend
   ```

5. **Start the mobile app**
   ```bash
   cd mobile
   cp .env.example .env
   npx expo start
   ```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/logout` - Logout
- `POST /api/v1/auth/refresh` - Refresh tokens

### Users
- `GET /api/v1/users/me` - Get current user
- `PATCH /api/v1/users/me` - Update profile
- `PATCH /api/v1/users/me/preferences` - Update preferences
- `PATCH /api/v1/users/me/location` - Update location

### Events
- `GET /api/v1/events` - List events with filters
- `GET /api/v1/events/tonight` - Tonight's events
- `GET /api/v1/events/week` - This week's events
- `GET /api/v1/events/month` - This month's events
- `GET /api/v1/events/trending` - Trending events by popularity
- `GET /api/v1/events/:id` - Event details
- `POST /api/v1/events/:id/rsvp` - RSVP to event

### Places
- `GET /api/v1/places/nearby` - Highly-rated nearby venues

### Social
- `GET /api/v1/social/friends` - List friends
- `GET /api/v1/social/friends/requests` - Friend requests
- `POST /api/v1/social/friends/request/:userId` - Send request
- `POST /api/v1/social/friends/accept/:id` - Accept request

### Invites
- `GET /api/v1/invites/received` - Received invites
- `POST /api/v1/invites` - Send invite
- `PATCH /api/v1/invites/:id` - Respond to invite

## Design System

MOOVE uses a custom "Fluid Motion" design system:

- **Primary Colors**: Kinetic Orange (#FF7A3D), Deep Midnight (#0D0D1A)
- **Secondary Colors**: Warm Sand (#F7F3ED), Electric Teal (#00D4AA)
- **Accent Colors**: Pulse Purple (#8B5CF6), Soft Blush (#FFB8B8)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. **Never commit secrets or .env files**
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

### Security Guidelines for Contributors

- Never hardcode secrets in code
- Use environment variables for all configuration
- Don't log sensitive information
- Review dependencies for security vulnerabilities
- Report security issues privately to the maintainers

## License

This project is private and proprietary.
