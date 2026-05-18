-- ============================================================
-- Migration: Add icon_url field to journey_content
-- ============================================================

ALTER TABLE journey_content
ADD COLUMN IF NOT EXISTS icon_url VARCHAR(500);

-- Add comment to document the field
COMMENT ON COLUMN journey_content.icon_url IS 
  'URL do ícone de capa da jornada no Supabase Storage. 
   Formato padrão: journeys/icons/phase-{phaseId}.{ext}
   Se vazio, o frontend usa /images/jornada-secreta.png como fallback.';
