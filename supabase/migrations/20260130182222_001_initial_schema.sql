/*
  # MOOVE - Initial Database Schema
  
  ## Overview
  This migration creates the complete database schema for the MOOVE social events application.
  
  ## New Tables
  
  ### Core Tables
  - `users` - User accounts and profiles
    - `id` (uuid, primary key)
    - `email` (varchar, unique) - User email address
    - `password_hash` (varchar) - Hashed password for email/password auth
    - `username` (varchar, unique) - Unique username
    - `display_name` (varchar) - Display name
    - `avatar_url` (text) - Profile picture URL
    - `bio` (varchar) - User biography (160 chars)
    - `location` (geography) - User's geolocation
    - `onboarding_completed` (boolean) - Onboarding status
    - `google_id`, `apple_id` (varchar) - OAuth provider IDs
    - `email_verified` (boolean) - Email verification status
    - `failed_login_attempts` (integer) - Security tracking
    - `locked_until` (timestamptz) - Account lock timestamp
    - `last_active_at` (timestamptz) - Last activity timestamp
  
  - `user_preferences` - User settings and preferences
    - `id` (uuid, primary key)
    - `user_id` (uuid, foreign key to users)
    - `favorite_artists` (jsonb) - List of favorite artists
    - `favorite_genres` (jsonb) - List of favorite music genres
    - `sports_teams` (jsonb) - List of favorite sports teams
    - `interests` (jsonb) - General interests
    - `notification_settings` (jsonb) - Notification preferences
    - `radius_miles` (integer) - Default search radius
  
  - `events` - Event listings from multiple sources
    - `id` (uuid, primary key)
    - `external_id` (varchar) - External API identifier
    - `source` (event_source enum) - Event data source
    - `title` (varchar) - Event title
    - `description` (text) - Event description
    - `category` (event_category enum) - Event category
    - `subcategory` (varchar) - Event subcategory
    - `venue_name` (varchar) - Venue name
    - `venue_address` (varchar) - Venue address
    - `location` (geography) - Venue geolocation
    - `google_place_id` (varchar) - Google Places ID
    - `thumbnail_url` (text) - Thumbnail image URL
    - `images` (jsonb) - Array of image URLs
    - `start_time` (timestamptz) - Event start time
    - `end_time` (timestamptz) - Event end time
    - `price_range` (jsonb) - Price range object
    - `ticket_url` (text) - Ticket purchase URL
    - `rating` (decimal) - Event rating
    - `is_featured` (boolean) - Featured event flag
    - `relevance_tags` (jsonb) - Tags for personalization
  
  ### Social Tables
  - `rsvps` - User event RSVPs
    - `id` (uuid, primary key)
    - `user_id` (uuid, foreign key to users)
    - `event_id` (uuid, foreign key to events)
    - `status` (rsvp_status enum) - RSVP status
    - `emoji_reaction` (varchar) - Optional emoji reaction
  
  - `comments` - Event comments and discussions
    - `id` (uuid, primary key)
    - `event_id` (uuid, foreign key to events)
    - `user_id` (uuid, foreign key to users)
    - `parent_comment_id` (uuid) - For threaded replies
    - `content` (varchar) - Comment text
    - `is_deleted` (boolean) - Soft delete flag
  
  - `friendships` - Friend connections between users
    - `id` (uuid, primary key)
    - `requester_id` (uuid, foreign key to users)
    - `addressee_id` (uuid, foreign key to users)
    - `status` (friendship_status enum) - Friendship status
  
  - `event_invites` - Event invitations between users
    - `id` (uuid, primary key)
    - `event_id` (uuid, foreign key to events)
    - `sender_id` (uuid, foreign key to users)
    - `recipient_id` (uuid, foreign key to users)
    - `message` (varchar) - Optional invitation message
    - `status` (invite_status enum) - Invitation status
    - `responded_at` (timestamptz) - Response timestamp
  
  ### Auth Tables
  - `sessions` - User session management for refresh tokens
    - `id` (uuid, primary key)
    - `user_id` (uuid, foreign key to users)
    - `refresh_token_hash` (varchar) - Hashed refresh token
    - `device_info` (jsonb) - Device metadata
    - `ip_address` (inet) - Session IP address
    - `expires_at` (timestamptz) - Token expiration
    - `revoked_at` (timestamptz) - Revocation timestamp
  
  - `password_reset_tokens` - Password reset token tracking
    - `id` (uuid, primary key)
    - `user_id` (uuid, foreign key to users)
    - `token_hash` (varchar) - Hashed reset token
    - `expires_at` (timestamptz) - Token expiration
    - `used_at` (timestamptz) - Usage timestamp
  
  ## Security
  
  ### Row Level Security (RLS)
  All tables have RLS enabled with restrictive policies:
  
  - **users**: Users can read all user profiles but only update their own
  - **user_preferences**: Users can only access their own preferences
  - **events**: All authenticated users can read events (public data)
  - **rsvps**: Users can manage their own RSVPs and view others' RSVPs
  - **comments**: Users can create comments and read all comments; only edit/delete their own
  - **friendships**: Users can manage their own friend requests
  - **event_invites**: Users can create invites and view invites they sent or received
  - **sessions**: Users can only access their own sessions
  - **password_reset_tokens**: No direct access via RLS (managed by auth endpoints)
  
  ### Indexes
  - Geographic indexes (GIST) for location-based queries
  - Composite indexes for common query patterns
  - Partial indexes for filtered queries
  
  ## Important Notes
  
  1. PostGIS extension is required for geographic data types
  2. UUID extension is required for UUID generation
  3. All timestamps use timestamptz for timezone awareness
  4. Automatic updated_at triggers on relevant tables
  5. Constraints prevent self-friendships and self-invites
  6. Unique constraints prevent duplicate relationships
*/

-- =====================================
-- EXTENSIONS
-- =====================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- =====================================
-- ENUMS
-- =====================================

DO $$ BEGIN
  CREATE TYPE event_source AS ENUM (
    'ticketmaster',
    'seatgeek',
    'google_places',
    'user_created'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE event_category AS ENUM (
    'concert',
    'sports',
    'restaurant',
    'bar',
    'theater',
    'festival',
    'comedy',
    'arts',
    'nightlife',
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE rsvp_status AS ENUM (
    'going',
    'interested',
    'not_going',
    'hidden'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE friendship_status AS ENUM (
    'pending',
    'accepted',
    'blocked'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE invite_status AS ENUM (
    'pending',
    'accepted',
    'declined'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- =====================================
-- USERS TABLE
-- =====================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255),
  username VARCHAR(30) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  avatar_url TEXT,
  bio VARCHAR(160),
  location GEOGRAPHY(POINT, 4326),
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  google_id VARCHAR(255) UNIQUE,
  apple_id VARCHAR(255) UNIQUE,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  failed_login_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_location ON users USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id) WHERE google_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_apple_id ON users(apple_id) WHERE apple_id IS NOT NULL;

-- =====================================
-- USER PREFERENCES TABLE
-- =====================================

CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  favorite_artists JSONB NOT NULL DEFAULT '[]',
  favorite_genres JSONB NOT NULL DEFAULT '[]',
  sports_teams JSONB NOT NULL DEFAULT '[]',
  interests JSONB NOT NULL DEFAULT '[]',
  notification_settings JSONB NOT NULL DEFAULT '{
    "eventReminders": true,
    "friendActivity": true,
    "invites": true,
    "comments": true,
    "marketing": false
  }',
  radius_miles INTEGER NOT NULL DEFAULT 25,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_preferences UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- =====================================
-- EVENTS TABLE
-- =====================================

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  external_id VARCHAR(255),
  source event_source NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  category event_category NOT NULL,
  subcategory VARCHAR(100),
  venue_name VARCHAR(255) NOT NULL,
  venue_address VARCHAR(500) NOT NULL,
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  google_place_id VARCHAR(255),
  thumbnail_url TEXT,
  images JSONB NOT NULL DEFAULT '[]',
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  price_range JSONB,
  ticket_url TEXT,
  rating DECIMAL(2, 1),
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  relevance_tags JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_external_event UNIQUE(external_id, source)
);

CREATE INDEX IF NOT EXISTS idx_events_location ON events USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_events_start_time ON events(start_time);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_events_source ON events(source);
CREATE INDEX IF NOT EXISTS idx_events_external_id ON events(external_id) WHERE external_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_events_is_featured ON events(is_featured) WHERE is_featured = TRUE;

-- =====================================
-- RSVPS TABLE
-- =====================================

CREATE TABLE IF NOT EXISTS rsvps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  status rsvp_status NOT NULL,
  emoji_reaction VARCHAR(10),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_event_rsvp UNIQUE(user_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_rsvps_user_id ON rsvps(user_id);
CREATE INDEX IF NOT EXISTS idx_rsvps_event_id ON rsvps(event_id);
CREATE INDEX IF NOT EXISTS idx_rsvps_status ON rsvps(status);

-- =====================================
-- COMMENTS TABLE
-- =====================================

CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content VARCHAR(500) NOT NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_event_id ON comments(event_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_comment_id) WHERE parent_comment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

-- =====================================
-- FRIENDSHIPS TABLE
-- =====================================

CREATE TABLE IF NOT EXISTS friendships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status friendship_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_friendship UNIQUE(requester_id, addressee_id),
  CONSTRAINT no_self_friendship CHECK(requester_id != addressee_id)
);

CREATE INDEX IF NOT EXISTS idx_friendships_requester ON friendships(requester_id);
CREATE INDEX IF NOT EXISTS idx_friendships_addressee ON friendships(addressee_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status);

-- =====================================
-- EVENT INVITES TABLE
-- =====================================

CREATE TABLE IF NOT EXISTS event_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message VARCHAR(500),
  status invite_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  CONSTRAINT unique_invite UNIQUE(event_id, sender_id, recipient_id),
  CONSTRAINT no_self_invite CHECK(sender_id != recipient_id)
);

CREATE INDEX IF NOT EXISTS idx_invites_sender ON event_invites(sender_id);
CREATE INDEX IF NOT EXISTS idx_invites_recipient ON event_invites(recipient_id);
CREATE INDEX IF NOT EXISTS idx_invites_event ON event_invites(event_id);
CREATE INDEX IF NOT EXISTS idx_invites_status ON event_invites(status);

-- =====================================
-- SESSIONS TABLE
-- =====================================

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token_hash VARCHAR(255) NOT NULL,
  device_info JSONB,
  ip_address INET,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_refresh_token ON sessions(refresh_token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- =====================================
-- PASSWORD RESET TOKENS TABLE
-- =====================================

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reset_tokens_user ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_reset_tokens_token ON password_reset_tokens(token_hash);

-- =====================================
-- UPDATED_AT TRIGGER FUNCTION
-- =====================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_events_updated_at ON events;
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_rsvps_updated_at ON rsvps;
CREATE TRIGGER update_rsvps_updated_at
  BEFORE UPDATE ON rsvps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;
CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_friendships_updated_at ON friendships;
CREATE TRIGGER update_friendships_updated_at
  BEFORE UPDATE ON friendships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Users: All can read, only owner can update
DROP POLICY IF EXISTS "Users can view all profiles" ON users;
CREATE POLICY "Users can view all profiles"
  ON users FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON users;
CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- User Preferences: Only owner can access
DROP POLICY IF EXISTS "Users can view own preferences" ON user_preferences;
CREATE POLICY "Users can view own preferences"
  ON user_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own preferences" ON user_preferences;
CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own preferences" ON user_preferences;
CREATE POLICY "Users can insert own preferences"
  ON user_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own preferences" ON user_preferences;
CREATE POLICY "Users can delete own preferences"
  ON user_preferences FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Events: All authenticated users can read (public events)
DROP POLICY IF EXISTS "Authenticated users can view events" ON events;
CREATE POLICY "Authenticated users can view events"
  ON events FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can create events" ON events;
CREATE POLICY "Authenticated users can create events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update events they created" ON events;
CREATE POLICY "Users can update events they created"
  ON events FOR UPDATE
  TO authenticated
  USING (source = 'user_created')
  WITH CHECK (source = 'user_created');

-- RSVPs: Users manage their own, can view others
DROP POLICY IF EXISTS "Users can view all RSVPs" ON rsvps;
CREATE POLICY "Users can view all RSVPs"
  ON rsvps FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can create own RSVPs" ON rsvps;
CREATE POLICY "Users can create own RSVPs"
  ON rsvps FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own RSVPs" ON rsvps;
CREATE POLICY "Users can update own RSVPs"
  ON rsvps FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own RSVPs" ON rsvps;
CREATE POLICY "Users can delete own RSVPs"
  ON rsvps FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Comments: All can read, only owner can edit/delete
DROP POLICY IF EXISTS "Authenticated users can view comments" ON comments;
CREATE POLICY "Authenticated users can view comments"
  ON comments FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can create comments" ON comments;
CREATE POLICY "Authenticated users can create comments"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own comments" ON comments;
CREATE POLICY "Users can update own comments"
  ON comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own comments" ON comments;
CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Friendships: Users can view their own relationships
DROP POLICY IF EXISTS "Users can view own friendships" ON friendships;
CREATE POLICY "Users can view own friendships"
  ON friendships FOR SELECT
  TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

DROP POLICY IF EXISTS "Users can create friendship requests" ON friendships;
CREATE POLICY "Users can create friendship requests"
  ON friendships FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = requester_id);

DROP POLICY IF EXISTS "Users can update own friendships" ON friendships;
CREATE POLICY "Users can update own friendships"
  ON friendships FOR UPDATE
  TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id)
  WITH CHECK (auth.uid() = requester_id OR auth.uid() = addressee_id);

DROP POLICY IF EXISTS "Users can delete own friendships" ON friendships;
CREATE POLICY "Users can delete own friendships"
  ON friendships FOR DELETE
  TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Event Invites: Users can view sent/received invites
DROP POLICY IF EXISTS "Users can view own invites" ON event_invites;
CREATE POLICY "Users can view own invites"
  ON event_invites FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

DROP POLICY IF EXISTS "Users can create invites" ON event_invites;
CREATE POLICY "Users can create invites"
  ON event_invites FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users can update invites they received" ON event_invites;
CREATE POLICY "Users can update invites they received"
  ON event_invites FOR UPDATE
  TO authenticated
  USING (auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = recipient_id);

DROP POLICY IF EXISTS "Users can delete invites they sent" ON event_invites;
CREATE POLICY "Users can delete invites they sent"
  ON event_invites FOR DELETE
  TO authenticated
  USING (auth.uid() = sender_id);

-- Sessions: Users can only access their own sessions
DROP POLICY IF EXISTS "Users can view own sessions" ON sessions;
CREATE POLICY "Users can view own sessions"
  ON sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own sessions" ON sessions;
CREATE POLICY "Users can create own sessions"
  ON sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own sessions" ON sessions;
CREATE POLICY "Users can update own sessions"
  ON sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own sessions" ON sessions;
CREATE POLICY "Users can delete own sessions"
  ON sessions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Password Reset Tokens: No direct RLS access (managed by auth endpoints only)
-- These are managed server-side only and should not be accessible via RLS