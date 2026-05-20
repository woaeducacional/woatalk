-- Banner do topo do Dashboard
CREATE TABLE IF NOT EXISTS app_banner (
  id         SERIAL PRIMARY KEY,
  image_url  TEXT NOT NULL,
  link_url   TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Garante que só exista uma linha (banner ativo)
-- Ao inserir, deletamos as anteriores via API
