-- ============================================================
-- Migration: Photo moderation & notifications system
-- ============================================================

-- Add avatar moderation status to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_status VARCHAR(20) DEFAULT 'none';
-- Possible values: 'none', 'pending', 'approved', 'rejected'

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
