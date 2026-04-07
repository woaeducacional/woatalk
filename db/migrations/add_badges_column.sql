-- Add badges column to users table
-- badges is stored as a comma-separated string of badge IDs, e.g. 'first_step,streak_7'
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS badges TEXT DEFAULT '';
