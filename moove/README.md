# MOOVE - Hyperlocal Event Discovery & Social Planning App

MOOVE is a cross-platform mobile application that helps users discover local events, restaurants, concerts, and more, while enabling social planning with friends.

## Features

- **Event Discovery**: Browse concerts, sports, restaurants, bars, theater, and more
- **Tonight View**: See everything happening today in your area
- **Weekly/Monthly Schedule**: Plan ahead with upcoming events
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
│   │   ├── controllers/ # Route handlers
│   │   ├── middleware/  # Express middleware
│   │   ├── models/      # Database models
│   │   ├── routes/      # API routes
│   │   ├── jobs/        # Background jobs
│   │   └── utils/       # Utilities
│   ├── migrations/      # SQL migrations
│   └── package.json
├── shared/              # Shared types and constants
│   ├── types/
│   └── constants/
└── docs/                # Documentation
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+ with PostGIS extension
- Redis (optional, for caching)
- Expo CLI (`npm install -g expo-cli`)

### Setup

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
- `GET /api/v1/events/:id` - Event details
- `POST /api/v1/events/:id/rsvp` - RSVP to event

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

## Environment Variables

### Backend
| Variable | Description |
|----------|-------------|
| DATABASE_URL | PostgreSQL connection string |
| JWT_SECRET | Secret for access tokens |
| JWT_REFRESH_SECRET | Secret for refresh tokens |
| TICKETMASTER_API_KEY | Ticketmaster Discovery API key |
| SEATGEEK_CLIENT_ID | SeatGeek client ID |
| GOOGLE_PLACES_API_KEY | Google Places API key |

### Mobile
| Variable | Description |
|----------|-------------|
| EXPO_PUBLIC_API_URL | Backend API URL |
| EXPO_PUBLIC_GOOGLE_MAPS_KEY | Google Maps API key |

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is private and proprietary.
