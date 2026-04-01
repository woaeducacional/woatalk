-- Criar tabela para rastrear fases completadas
CREATE TABLE IF NOT EXISTS user_phase_completion (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  phase_id INTEGER NOT NULL,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  total_xp INTEGER DEFAULT 0,
  woa_coins INTEGER DEFAULT 0,
  UNIQUE(user_id, phase_id)
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_user_phase_completion_user_id ON user_phase_completion(user_id);
CREATE INDEX IF NOT EXISTS idx_user_phase_completion_phase_id ON user_phase_completion(phase_id);
