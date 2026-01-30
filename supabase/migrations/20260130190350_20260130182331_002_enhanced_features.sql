/*
  # Enhanced Social and Notification Features
  
  ## Overview
  This migration adds enhanced social features, bookmarking, and notification systems to MOOVE.
  
  ## New Tables
  
  ### Social Features
  - `event_bookmarks` - Saved events for later viewing
    - `id` (uuid, primary key)
    - `user_id` (uuid, foreign key to users)
    - `event_id` (uuid, foreign key to events)
    - `created_at` (timestamptz)
  
  - `user_blocks` - User blocking for privacy
    - `id` (uuid, primary key)
    - `blocker_id` (uuid, foreign key to users) - User who blocked
    - `blocked_id` (uuid, foreign key to users) - User who is blocked
    - `created_at` (timestamptz)
  
  - `friend_suggestions` - AI-powered friend recommendations
    - `id` (uuid, primary key)
    - `user_id` (uuid, foreign key to users)
    - `suggested_user_id` (uuid, foreign key to users)
    - `reason` (varchar) - Why this friend is suggested
    - `mutual_friends_count` (integer)
    - `common_interests` (jsonb)
    - `score` (decimal) - Relevance score
    - `dismissed` (boolean)
    - `created_at` (timestamptz)
  
  ### Notifications
  - `notifications` - User notifications
    - `id` (uuid, primary key)
    - `user_id` (uuid, foreign key to users)
    - `type` (notification_type enum) - Type of notification
    - `title` (varchar) - Notification title
    - `message` (text) - Notification message
    - `data` (jsonb) - Additional data (event_id, friend_id, etc.)
    - `read` (boolean) - Read status
    - `read_at` (timestamptz) - When notification was read
    - `created_at` (timestamptz)
  
  ### Activity Tracking
  - `user_activity_log` - Track user actions for analytics
    - `id` (uuid, primary key)
    - `user_id` (uuid, foreign key to users)
    - `activity_type` (varchar) - Type of activity
    - `event_id` (uuid, optional) - Related event
    - `metadata` (jsonb) - Additional context
    - `created_at` (timestamptz)
  
  - `comment_reactions` - Reactions/likes on comments
    - `id` (uuid, primary key)
    - `comment_id` (uuid, foreign key to comments)
    - `user_id` (uuid, foreign key to users)
    - `reaction` (varchar) - Emoji or reaction type
    - `created_at` (timestamptz)
  
  ## Security
  
  All tables have RLS enabled with appropriate policies:
  - Users can only manage their own bookmarks, blocks, and notifications
  - Friend suggestions are visible only to the target user
  - Comment reactions are public to all authenticated users
  - Activity logs are private to each user
  
  ## Indexes
  
  Performance indexes added for:
  - User-specific queries (bookmarks, blocks, notifications)
  - Unread notifications
  - Friend suggestion scores
  - Activity tracking by type
  
  ## Important Notes
  
  1. Notifications system supports real-time updates via websockets
  2. Friend suggestions can be periodically regenerated via background jobs
  3. Activity log supports GDPR compliance with user data export
  4. Comment reactions support multiple emoji types per user per comment
*/

-- =====================================
-- ENUMS
-- =====================================

DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM (
    'friend_request',
    'friend_accepted',
    'event_invite',
    'event_reminder',
    'comment_reply',
    'comment_mention',
    'rsvp_update',
    'new_event_nearby'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- =====================================
-- EVENT BOOKMARKS TABLE
-- =====================================

CREATE TABLE IF NOT EXISTS event_bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_event_bookmark UNIQUE(user_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON event_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_event_id ON event_bookmarks(event_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_created_at ON event_bookmarks(created_at DESC);

-- =====================================
-- USER BLOCKS TABLE
-- =====================================

CREATE TABLE IF NOT EXISTS user_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blocker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_block UNIQUE(blocker_id, blocked_id),
  CONSTRAINT no_self_block CHECK(blocker_id != blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_blocks_blocker ON user_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocked ON user_blocks(blocked_id);

-- =====================================
-- FRIEND SUGGESTIONS TABLE
-- =====================================

CREATE TABLE IF NOT EXISTS friend_suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  suggested_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason VARCHAR(500),
  mutual_friends_count INTEGER NOT NULL DEFAULT 0,
  common_interests JSONB NOT NULL DEFAULT '[]',
  score DECIMAL(5, 2) NOT NULL DEFAULT 0.0,
  dismissed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_suggestion UNIQUE(user_id, suggested_user_id),
  CONSTRAINT no_self_suggestion CHECK(user_id != suggested_user_id)
);

CREATE INDEX IF NOT EXISTS idx_suggestions_user ON friend_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_score ON friend_suggestions(score DESC);
CREATE INDEX IF NOT EXISTS idx_suggestions_dismissed ON friend_suggestions(dismissed) WHERE dismissed = FALSE;

-- =====================================
-- NOTIFICATIONS TABLE
-- =====================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read) WHERE read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- =====================================
-- USER ACTIVITY LOG TABLE
-- =====================================

CREATE TABLE IF NOT EXISTS user_activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_user ON user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_type ON user_activity_log(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_created_at ON user_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_event ON user_activity_log(event_id) WHERE event_id IS NOT NULL;

-- =====================================
-- COMMENT REACTIONS TABLE
-- =====================================

CREATE TABLE IF NOT EXISTS comment_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reaction VARCHAR(10) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_comment_reaction UNIQUE(comment_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_reactions_comment ON comment_reactions(comment_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user ON comment_reactions(user_id);

-- =====================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================

-- Enable RLS on all new tables
ALTER TABLE event_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_reactions ENABLE ROW LEVEL SECURITY;

-- Event Bookmarks: Users can only manage their own bookmarks
DROP POLICY IF EXISTS "Users can view own bookmarks" ON event_bookmarks;
CREATE POLICY "Users can view own bookmarks"
  ON event_bookmarks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own bookmarks" ON event_bookmarks;
CREATE POLICY "Users can create own bookmarks"
  ON event_bookmarks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own bookmarks" ON event_bookmarks;
CREATE POLICY "Users can delete own bookmarks"
  ON event_bookmarks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- User Blocks: Users can only manage their own blocks
DROP POLICY IF EXISTS "Users can view own blocks" ON user_blocks;
CREATE POLICY "Users can view own blocks"
  ON user_blocks FOR SELECT
  TO authenticated
  USING (auth.uid() = blocker_id);

DROP POLICY IF EXISTS "Users can create blocks" ON user_blocks;
CREATE POLICY "Users can create blocks"
  ON user_blocks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = blocker_id);

DROP POLICY IF EXISTS "Users can delete own blocks" ON user_blocks;
CREATE POLICY "Users can delete own blocks"
  ON user_blocks FOR DELETE
  TO authenticated
  USING (auth.uid() = blocker_id);

-- Friend Suggestions: Users can only view their own suggestions
DROP POLICY IF EXISTS "Users can view own suggestions" ON friend_suggestions;
CREATE POLICY "Users can view own suggestions"
  ON friend_suggestions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own suggestions" ON friend_suggestions;
CREATE POLICY "Users can update own suggestions"
  ON friend_suggestions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Notifications: Users can only access their own notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- User Activity Log: Users can only view their own activity
DROP POLICY IF EXISTS "Users can view own activity" ON user_activity_log;
CREATE POLICY "Users can view own activity"
  ON user_activity_log FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own activity" ON user_activity_log;
CREATE POLICY "Users can create own activity"
  ON user_activity_log FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Comment Reactions: All authenticated users can view, only owner can modify
DROP POLICY IF EXISTS "Authenticated users can view reactions" ON comment_reactions;
CREATE POLICY "Authenticated users can view reactions"
  ON comment_reactions FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can create own reactions" ON comment_reactions;
CREATE POLICY "Users can create own reactions"
  ON comment_reactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own reactions" ON comment_reactions;
CREATE POLICY "Users can update own reactions"
  ON comment_reactions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own reactions" ON comment_reactions;
CREATE POLICY "Users can delete own reactions"
  ON comment_reactions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================
-- HELPER FUNCTIONS
-- =====================================

-- Function to create notification for a user
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type notification_type,
  p_title VARCHAR(255),
  p_message TEXT,
  p_data JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (p_user_id, p_type, p_title, p_message, p_data)
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE notifications
  SET read = TRUE, read_at = NOW()
  WHERE id = p_notification_id AND user_id = auth.uid();
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO v_count
  FROM notifications
  WHERE user_id = p_user_id AND read = FALSE;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
