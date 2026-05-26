-- Adiciona rastreamento de emails de evolução enviados aos usuários
-- Permite controlar 2 envios por semana sem spam

ALTER TABLE users
ADD COLUMN IF NOT EXISTS last_evolution_email_sent_at TIMESTAMP DEFAULT NULL;

-- Cria índice para filtrar usuários que não receberam email recentemente
CREATE INDEX IF NOT EXISTS idx_users_evolution_email 
ON users(last_evolution_email_sent_at, email_verified);
