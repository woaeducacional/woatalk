-- ============================================================
-- MIGRATION: Tabela de histórico de recompensas do usuário
-- Registra cada checkpoint concluído e badge ganho
-- ============================================================

CREATE TABLE IF NOT EXISTS user_history (
  id                UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type        VARCHAR(20) NOT NULL,        -- 'checkpoint' | 'badge'
  xp_earned         INTEGER     NOT NULL DEFAULT 0,
  coins_earned      INTEGER     NOT NULL DEFAULT 0,
  badge_type        VARCHAR(100),                -- só para event_type = 'badge'
  description       TEXT,                        -- ex: "Atlantic Ocean — Introduce Yourself · Checkpoint 3"
  phase_id          INTEGER,
  checkpoint_number INTEGER,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_history_user_id    ON user_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_history_created_at ON user_history(created_at DESC);
