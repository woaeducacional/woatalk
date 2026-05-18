-- ============================================================
-- WOAPLAY — Plataforma de Conteúdo em Vídeo
-- Uma tabela com módulos e progresso como JSONB
-- ============================================================

CREATE TABLE IF NOT EXISTS woaplay_courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  cover_url VARCHAR(500),
  is_published BOOLEAN DEFAULT false,

  -- Módulos do curso (JSONB)
  -- [{ id, position, video_title, video_url, has_practice_video, practice_video_url, materials: [{ id, file_name, file_url }] }]
  modules JSONB NOT NULL DEFAULT '[]',

  -- Progresso por usuário { "user_uuid": ["module_id_1", "module_id_2"] }
  user_progress JSONB NOT NULL DEFAULT '{}',

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_woaplay_courses_published ON woaplay_courses(is_published);
