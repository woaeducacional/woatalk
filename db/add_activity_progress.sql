-- Tabela de progresso de atividades (novo sistema para Hobbies e fases futuras)
CREATE TABLE activity_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  phase_id INTEGER NOT NULL,
  activity_index INTEGER NOT NULL,  -- 0-7: qual atividade
  step_completed INTEGER DEFAULT 0, -- progresso dentro da atividade
  completed_at TIMESTAMP,
  xp_earned INTEGER DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, phase_id, activity_index)
);

CREATE INDEX idx_activity_progress_user_phase ON activity_progress(user_id, phase_id);
CREATE INDEX idx_activity_progress_user_activity ON activity_progress(user_id, activity_index);
