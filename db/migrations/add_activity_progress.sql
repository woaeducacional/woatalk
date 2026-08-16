-- ============================================================
-- WOA EDUCACIONAL — SPRINT 4
-- PROGRESSO INDIVIDUAL DAS ATIVIDADES
-- ============================================================

CREATE TABLE IF NOT EXISTS activity_progress (

  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID NOT NULL
    REFERENCES users(id)
    ON DELETE CASCADE,

  phase_id INTEGER NOT NULL,

  mission_group_id INTEGER NOT NULL,

  activity_index INTEGER NOT NULL,

  xp_earned INTEGER NOT NULL DEFAULT 0,

  step_completed BOOLEAN NOT NULL DEFAULT FALSE,

  completed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT activity_progress_unique
    UNIQUE (user_id, phase_id, mission_group_id, activity_index),

  CONSTRAINT activity_progress_phase_check
    CHECK (phase_id >= 1),

  CONSTRAINT activity_progress_group_check
    CHECK (mission_group_id >= 0 AND mission_group_id <= 4),

  CONSTRAINT activity_progress_activity_check
    CHECK (activity_index >= 0),

  CONSTRAINT activity_progress_xp_check
    CHECK (xp_earned >= 0)

);

-- ============================================================
-- ÍNDICES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_activity_progress_user_phase
  ON activity_progress(user_id, phase_id);

CREATE INDEX IF NOT EXISTS idx_activity_progress_user_phase_group
  ON activity_progress(user_id, phase_id, mission_group_id);

CREATE INDEX IF NOT EXISTS idx_activity_progress_user
  ON activity_progress(user_id);

CREATE INDEX IF NOT EXISTS idx_activity_progress_phase
  ON activity_progress(phase_id);

-- ============================================================
-- DOCUMENTAÇÃO
-- ============================================================

COMMENT ON TABLE activity_progress IS
'Registro individual do progresso das atividades realizadas pelo aluno nas Jornadas WOA.';

COMMENT ON COLUMN activity_progress.user_id IS
'Usuário proprietário do progresso.';

COMMENT ON COLUMN activity_progress.phase_id IS
'ID da Jornada/Oceano. WOA Memory não utiliza esta tabela como Jornada certificável.';

COMMENT ON COLUMN activity_progress.mission_group_id IS
'Missão/grupo da Jornada ao qual a atividade pertence. Valores atuais: 0 a 4.';

COMMENT ON COLUMN activity_progress.activity_index IS
'Índice da atividade dentro da missão/grupo.';

COMMENT ON COLUMN activity_progress.xp_earned IS
'XP obtido na atividade.';

COMMENT ON COLUMN activity_progress.step_completed IS
'Indica se a atividade foi efetivamente concluída.';

COMMENT ON COLUMN activity_progress.completed_at IS
'Data e hora em que a atividade foi concluída.';

-- ============================================================
-- ATUALIZAÇÃO AUTOMÁTICA DE updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION update_activity_progress_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_activity_progress_updated_at
ON activity_progress;

CREATE TRIGGER trg_activity_progress_updated_at
BEFORE UPDATE ON activity_progress
FOR EACH ROW
EXECUTE FUNCTION update_activity_progress_updated_at();
