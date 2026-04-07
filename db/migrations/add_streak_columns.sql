-- Migration: add streak columns to users table
-- Run once against your Supabase project (SQL Editor or psql)

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS streak_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_streak_date DATE,
  ADD COLUMN IF NOT EXISTS streak_pending BOOLEAN DEFAULT FALSE;
