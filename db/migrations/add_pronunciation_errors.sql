-- Tabela para rastrear erros de pronúncia por usuário
-- Permite que o tutor IA aprenda com o histórico de cada aluno
-- UNIQUE em (user_id, word) garante upsert eficiente (incrementa contagem)

CREATE TABLE IF NOT EXISTS pronunciation_errors (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  word           TEXT NOT NULL,                          -- palavra errada (lowercase, sem pontuação)
  sentence       TEXT NOT NULL DEFAULT '',               -- última frase do exercício onde errou
  error_count    INTEGER NOT NULL DEFAULT 1,             -- incrementado a cada novo erro
  ai_tip         TEXT,                                   -- dica gerada pelo GPT-4 mini (cacheada)
  last_error_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_user_word UNIQUE (user_id, word)
);

-- Índice para buscar top erros de um usuário ordenados por frequência
CREATE INDEX IF NOT EXISTS idx_pronunciation_errors_user
  ON pronunciation_errors (user_id, error_count DESC);

-- Função que faz upsert correto: insere na primeira vez, incrementa error_count nas seguintes
CREATE OR REPLACE FUNCTION upsert_pronunciation_error(
  p_user_id UUID,
  p_word    TEXT,
  p_sentence TEXT
) RETURNS VOID AS $$
BEGIN
  INSERT INTO pronunciation_errors (user_id, word, sentence, error_count, last_error_at)
    VALUES (p_user_id, p_word, p_sentence, 1, now())
  ON CONFLICT (user_id, word)
  DO UPDATE SET
    error_count   = pronunciation_errors.error_count + 1,
    sentence      = EXCLUDED.sentence,
    last_error_at = now();
END;
$$ LANGUAGE plpgsql;
