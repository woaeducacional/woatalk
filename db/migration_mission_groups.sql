-- Criar tabela para rastrear grupos de missões completados
CREATE TABLE IF NOT EXISTS user_mission_group_completion (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  phase_id INTEGER NOT NULL,
  mission_group_id INTEGER NOT NULL,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, phase_id, mission_group_id)
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_user_mission_group_user_id ON user_mission_group_completion(user_id);
CREATE INDEX IF NOT EXISTS idx_user_mission_group_phase_id ON user_mission_group_completion(phase_id);
CREATE INDEX IF NOT EXISTS idx_user_mission_group_mission_id ON user_mission_group_completion(mission_group_id);

-- Limpar dados antigos de phase_id = 2 que foi marcado como completo antes da implementação de mission groups
DELETE FROM user_phase_completion 
WHERE phase_id = 2;
