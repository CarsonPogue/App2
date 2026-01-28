-- MOOVE Database Schema
-- Initial migration: Core tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- Enable PostGIS for geolocation
CREATE EXTENSION IF NOT EXISTS "postgis";

-- =====================================
-- ENUMS
-- =====================================

CREATE TYPE event_source AS ENUM (
  'ticketmaster',
  'seatgeek',
  'google_places',
  'user_created'
);

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

CREATE TYPE rsvp_status AS ENUM (
  'going',
  'interested',
  'not_going',
  'hidden'
);

CREATE TYPE friendship_status AS ENUM (
  'pending',
  'accepted',
  'blocked'
);

CREATE TYPE invite_status AS ENUM (
  'pending',
  'accepted',
  'declined'
);

-- =====================================
-- USERS TABLE
-- =====================================

CREATE TABLE users (
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

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_location ON users USING GIST(location);
CREATE INDEX idx_users_google_id ON users(google_id) WHERE google_id IS NOT NULL;
CREATE INDEX idx_users_apple_id ON users(apple_id) WHERE apple_id IS NOT NULL;

-- =====================================
-- USER PREFERENCES TABLE
-- =====================================

CREATE TABLE user_preferences (
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

CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);

-- =====================================
-- EVENTS TABLE
-- =====================================

CREATE TABLE events (
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

CREATE INDEX idx_events_location ON events USING GIST(location);
CREATE INDEX idx_events_start_time ON events(start_time);
CREATE INDEX idx_events_category ON events(category);
CREATE INDEX idx_events_source ON events(source);
CREATE INDEX idx_events_external_id ON events(external_id) WHERE external_id IS NOT NULL;
CREATE INDEX idx_events_is_featured ON events(is_featured) WHERE is_featured = TRUE;

-- =====================================
-- RSVPS TABLE
-- =====================================

CREATE TABLE rsvps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  status rsvp_status NOT NULL,
  emoji_reaction VARCHAR(10),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_event_rsvp UNIQUE(user_id, event_id)
);

CREATE INDEX idx_rsvps_user_id ON rsvps(user_id);
CREATE INDEX idx_rsvps_event_id ON rsvps(event_id);
CREATE INDEX idx_rsvps_status ON rsvps(status);

-- =====================================
-- COMMENTS TABLE
-- =====================================

CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content VARCHAR(500) NOT NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_comments_event_id ON comments(event_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_parent ON comments(parent_comment_id) WHERE parent_comment_id IS NOT NULL;
CREATE INDEX idx_comments_created_at ON comments(created_at DESC);

-- =====================================
-- FRIENDSHIPS TABLE
-- =====================================

CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status friendship_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_friendship UNIQUE(requester_id, addressee_id),
  CONSTRAINT no_self_friendship CHECK(requester_id != addressee_id)
);

CREATE INDEX idx_friendships_requester ON friendships(requester_id);
CREATE INDEX idx_friendships_addressee ON friendships(addressee_id);
CREATE INDEX idx_friendships_status ON friendships(status);

-- =====================================
-- EVENT INVITES TABLE
-- =====================================

CREATE TABLE event_invites (
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

CREATE INDEX idx_invites_sender ON event_invites(sender_id);
CREATE INDEX idx_invites_recipient ON event_invites(recipient_id);
CREATE INDEX idx_invites_event ON event_invites(event_id);
CREATE INDEX idx_invites_status ON event_invites(status);

-- =====================================
-- SESSIONS TABLE (for refresh token management)
-- =====================================

CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token_hash VARCHAR(255) NOT NULL,
  device_info JSONB,
  ip_address INET,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_refresh_token ON sessions(refresh_token_hash);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- =====================================
-- PASSWORD RESET TOKENS TABLE
-- =====================================

CREATE TABLE password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reset_tokens_user ON password_reset_tokens(user_id);
CREATE INDEX idx_reset_tokens_token ON password_reset_tokens(token_hash);

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
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rsvps_updated_at
  BEFORE UPDATE ON rsvps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_friendships_updated_at
  BEFORE UPDATE ON friendships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
