-- Chat groups: 4 themed conversation groups
CREATE TABLE IF NOT EXISTS chat_groups (
  id TEXT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  emoji VARCHAR(10) NOT NULL,
  color VARCHAR(20) NOT NULL,
  description TEXT
);

INSERT INTO chat_groups (id, name, emoji, color, description) VALUES
  ('viagens',     'Viagens',     '✈️',  '#00D4FF', 'Fale sobre destinos, dicas e experiências de viagem'),
  ('trabalho',    'Trabalho',    '💼',  '#FFD700', 'Conversas sobre carreira e profissão em inglês'),
  ('cotidiano',   'Cotidiano',   '☀️',  '#00FF88', 'O dia a dia em inglês'),
  ('english_tips','English Tips','📚',  '#FF6B9D', 'Dicas para aprender inglês mais rápido')
ON CONFLICT (id) DO NOTHING;

-- Chat messages: up to 100 per group, kept in check after each insert
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id TEXT NOT NULL REFERENCES chat_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) <= 500 AND char_length(content) >= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_group_time
  ON chat_messages (group_id, created_at DESC);
