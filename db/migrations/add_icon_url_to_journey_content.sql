-- ============================================================
-- Migration: Add icon_url field to journey_content
-- ============================================================

ALTER TABLE journey_content
ADD COLUMN IF NOT EXISTS icon_url VARCHAR(500);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_journey_content_icon_url ON journey_content(icon_url);

-- Add comment to document the field
COMMENT ON COLUMN journey_content.icon_url IS 'URL to the journey icon image stored in Supabase Storage. Format: journeys/icons/phase-{phaseId}.{ext}';
