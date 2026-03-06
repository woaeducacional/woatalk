-- Criar tabela de usuários
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(500),
  xp_total INTEGER DEFAULT 0,
  coins_balance INTEGER DEFAULT 0,
  current_phase INTEGER DEFAULT 1,
  errors_today INTEGER DEFAULT 0,
  last_error_reset TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices para melhorar performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_id ON users(id);

-- Criar tabela de progresso do usuário
CREATE TABLE user_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id INTEGER NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  xp_earned INTEGER DEFAULT 0,
  completed_at TIMESTAMP,
  streak_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices de progresso
CREATE INDEX idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX idx_user_progress_lesson_id ON user_progress(lesson_id);

-- Criar tabela de badges
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_type VARCHAR(50) NOT NULL,
  unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar índice de badges
CREATE INDEX idx_user_badges_user_id ON user_badges(user_id);

-- Criar tabela de níveis
CREATE TABLE levels (
  id INTEGER PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) DEFAULT 'Ocean',
  order_number INTEGER NOT NULL
);

-- Criar tabela de fases
CREATE TABLE phases (
  id INTEGER PRIMARY KEY,
  level_id INTEGER NOT NULL REFERENCES levels(id),
  name VARCHAR(255) NOT NULL,
  order_number INTEGER NOT NULL,
  curiosity TEXT,
  depth INTEGER
);

-- Inserir dados iniciais de níveis
INSERT INTO levels (id, name, type, order_number) VALUES
(1, 'Pacific Ocean', 'Ocean', 1),
(2, 'Atlantic Ocean', 'Ocean', 2),
(3, 'Indian Ocean', 'Ocean', 3),
(4, 'Arctic Ocean', 'Ocean', 4),
(5, 'Antarctic Ocean', 'Ocean', 5);

-- Inserir fases para o Nível 1 (Atlantic Ocean)
INSERT INTO phases (id, level_id, name, order_number, curiosity, depth) VALUES
(1, 2, 'Introduce Yourself', 1, 'O Oceano Atlântico separa dois grandes mundos: América e Europa.', 3200);
