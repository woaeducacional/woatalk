-- Criar tabela de usuários
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(500),
  role VARCHAR(20) DEFAULT 'user',
  xp_total INTEGER DEFAULT 0,
  coins_balance INTEGER DEFAULT 0,
  current_phase INTEGER DEFAULT 1,
  errors_today INTEGER DEFAULT 0,
  last_error_reset TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Set admin user
UPDATE users SET role = 'admin' WHERE email = 'alberto.carlos803@gmail.com';

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
  order_number INTEGER NOT NULL,
  icon_path VARCHAR(255),
  lesson_title VARCHAR(255)
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
INSERT INTO levels (id, name, type, order_number, icon_path, lesson_title) VALUES
(1, 'Pacific Ocean', 'Ocean', 1, '/images/icon_pacifico.png', 'The Alphabet'),
(2, 'Atlantic Ocean', 'Ocean', 2, '/images/icon_atlantico.png', 'Introduce Yourself'),
(3, 'Indian Ocean', 'Ocean', 3, '/images/icon_indico.png', 'Talking About Things'),
(4, 'Arctic Ocean', 'Ocean', 4, '/images/icon_artico.png', 'Counting Up to 20'),
(5, 'Antarctic Ocean', 'Ocean', 5, '/images/icon_antartico.png', 'Counting from 20 to 1000');

-- ============================================================
-- TABELA DE CHECKPOINTS DE FASE (100-missão Atlantic Ocean)
-- Guarda progresso do usuário por checkpoint (a cada 10 missões)
-- ============================================================
CREATE TABLE phase_checkpoints (
  id                 UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id            UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  phase_id           INTEGER     NOT NULL,
  checkpoint         INTEGER     NOT NULL DEFAULT 0,  -- 0-10
  missions_completed INTEGER     NOT NULL DEFAULT 0,  -- 0-100
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, phase_id)
);

CREATE INDEX idx_phase_checkpoints_user_phase ON phase_checkpoints(user_id, phase_id);

-- Inserir fases para o Nível 1 (Atlantic Ocean)
INSERT INTO phases (id, level_id, name, order_number, curiosity, depth) VALUES
(1, 2, 'Introduce Yourself', 1, 'O Oceano Atlântico separa dois grandes mundos: América e Europa.', 3200);

-- ============================================================
-- TABELA DE FRASES PARA EXERCÍCIOS DE ORDENAÇÃO DE SENTENÇA
-- Escalável: cada fase/aula terá suas frases armazenadas aqui.
-- phase_id referencia phases.id (lição dentro de um oceano).
-- ============================================================
CREATE TABLE phase_sentences (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  phase_id     INTEGER     NOT NULL REFERENCES phases(id) ON DELETE CASCADE,
  sentence     TEXT        NOT NULL,        -- Frase correta em inglês
  translation  TEXT,                        -- Tradução em português (opcional)
  hint         TEXT,                        -- Dica opcional para o aluno
  difficulty   SMALLINT    NOT NULL DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 3),
  xp_reward    INTEGER     NOT NULL DEFAULT 30,
  active       BOOLEAN     NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_phase_sentences_phase_id ON phase_sentences(phase_id);
CREATE INDEX idx_phase_sentences_active   ON phase_sentences(phase_id, active);

-- ============================================================
-- SEED — Fase 1 (phase_id=1): Atlantic Ocean — Introduce Yourself
-- 10 frases de apresentação pessoal, dificuldade crescente
-- ============================================================
INSERT INTO phase_sentences (phase_id, sentence, translation, hint, difficulty, xp_reward) VALUES
(1, 'My name is Oliver',           'Meu nome é Oliver',                    'Apresentação básica — nome',         1, 20),
(1, 'I am from Brazil',            'Eu sou do Brasil',                     'De onde você é',                    1, 20),
(1, 'Nice to meet you',            'Muito prazer',                         'Expressão social essencial',         1, 20),
(1, 'My last name is Smith',       'Meu sobrenome é Smith',                'last name = sobrenome',              1, 25),
(1, 'I live in New York',          'Eu moro em Nova York',                 'live in = morar em',                 1, 25),
(1, 'What is your name',           'Qual é o seu nome',                    'Pergunta básica de apresentação',    2, 30),
(1, 'Where are you from',          'De onde você é',                       'Pergunta sobre origem',              2, 30),
(1, 'I am a teacher',              'Eu sou professor',                     'Profissão com to be',                2, 30),
(1, 'How old are you',             'Quantos anos você tem',                'Pergunta sobre idade',               2, 35),
(1, 'It is nice to meet you',      'É um prazer te conhecer',              'Versão formal de nice to meet you',  3, 40);
