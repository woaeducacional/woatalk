-- ============================================================
-- MIGRATION: Slots de energia do usuário (3 vidas)
-- Cada slot armazena o timestamp do último erro.
-- Se NULL ou >= 8h atrás → carga disponível.
-- ============================================================

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS energy_slot_1 TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS energy_slot_2 TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS energy_slot_3 TIMESTAMPTZ DEFAULT NULL;
