-- ============================================================
-- JOURNEY CHECKPOINTS TABLE
-- Each row = 1 checkpoint (10 missions). 10 rows = 100 missions.
-- Options are pipe-separated (|) for practical storage.
-- ============================================================

CREATE TABLE IF NOT EXISTS journey_checkpoints (
  id                SERIAL      PRIMARY KEY,
  phase_id          INTEGER     NOT NULL,
  checkpoint_number INTEGER     NOT NULL CHECK (checkpoint_number BETWEEN 1 AND 10),

  -- Metadata
  theme_name        VARCHAR(100),

  -- Mission 1: Resource (video or audio)
  resource_type     VARCHAR(10) NOT NULL DEFAULT 'video',  -- 'video' | 'audio'
  resource_url      TEXT        NOT NULL,

  -- Mission 3: Question 1
  q1_en             TEXT        NOT NULL,
  q1_pt             TEXT,
  q1_options        TEXT        NOT NULL,  -- pipe separated: "A|B|C"
  q1_answer         TEXT        NOT NULL,

  -- Mission 4: Complete (fill-in-the-blank)
  complete_en       TEXT        NOT NULL,  -- e.g. "I really like to ___ soccer"
  complete_pt       TEXT,
  complete_options   TEXT        NOT NULL,
  complete_answer   TEXT        NOT NULL,

  -- Mission 5: Speak 1
  speak1            TEXT        NOT NULL,

  -- Mission 6: Question 2
  q2_en             TEXT        NOT NULL,
  q2_pt             TEXT,
  q2_options        TEXT        NOT NULL,
  q2_answer         TEXT        NOT NULL,

  -- Mission 7: Question 3
  q3_en             TEXT        NOT NULL,
  q3_pt             TEXT,
  q3_options        TEXT        NOT NULL,
  q3_answer         TEXT        NOT NULL,

  -- Mission 8: Speak 2
  speak2            TEXT        NOT NULL,

  -- Mission 9: Order sentence
  order_sentence    TEXT        NOT NULL,

  -- Mission 10: Speak 3
  speak3            TEXT        NOT NULL,

  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(phase_id, checkpoint_number)
);

CREATE INDEX IF NOT EXISTS idx_journey_checkpoints_phase
  ON journey_checkpoints(phase_id);

-- ============================================================
-- SEED DATA: Atlantic Ocean (phase_id = 2)
-- 10 checkpoints × 10 missions = 100 missions
-- ============================================================

INSERT INTO journey_checkpoints (
  phase_id, checkpoint_number, theme_name,
  resource_type, resource_url,
  q1_en, q1_pt, q1_options, q1_answer,
  complete_en, complete_pt, complete_options, complete_answer,
  speak1,
  q2_en, q2_pt, q2_options, q2_answer,
  q3_en, q3_pt, q3_options, q3_answer,
  speak2, order_sentence, speak3
) VALUES

-- ── CHECKPOINT 1: Hobbies & Interests (Video) ──────────────
(
  2, 1, 'Hobbies & Interests',
  'video', 'https://www.youtube.com/watch?v=yOJkygDGWvU',
  -- Q1
  'What sport does the man like to play?',
  'Qual esporte o homem gosta de jogar?',
  'Basketball|Soccer|Tennis', 'Soccer',
  -- Complete
  'How often does the man play soccer?',
  'Com que frequência o homem joga futebol?',
  'Once a week|Twice a week|Every day', 'Twice a week',
  -- Speak 1
  'I really like to play soccer',
  -- Q2
  'What does the woman enjoy doing?',
  'O que a mulher gosta de fazer?',
  'Playing the piano|Playing soccer|Going to the gym', 'Playing the piano',
  -- Q3
  'How often does the woman do Yoga?',
  'Com que frequência a mulher faz Yoga?',
  'Once a week|Twice a week|3 times a week', '3 times a week',
  -- Speak 2, Order, Speak 3
  'She has been playing the piano since she was five',
  'I really like to play soccer',
  'I go to the gym every day'
),

-- ── CHECKPOINT 2: Your Name ────────────────────────────────
(
  2, 2, 'Your Name',
  'audio', '/audio/dialog-exemplo.mp3',
  -- Q1
  'What ___ your name?',
  'Qual ___ o seu nome?',
  'is|are|am', 'is',
  -- Complete
  'My ___ name is Oliver.',
  'Meu ___ nome é Oliver.',
  'first|bad|old', 'first',
  -- Speak 1
  'My name is Oliver',
  -- Q2
  'Which sentence is about a last name?',
  'Qual frase é sobre sobrenome?',
  'My last name is Turner|I am from Brazil|I like music', 'My last name is Turner',
  -- Q3
  'My ___ name is Michael.',
  NULL,
  'middle|big|short', 'middle',
  -- Speak 2, Order, Speak 3
  'Nice to meet you Oliver',
  'My name is Oliver',
  'What is your name'
),

-- ── CHECKPOINT 3: Where Are You From? ──────────────────────
(
  2, 3, 'Where Are You From?',
  'audio', '/audio/dialog-exemplo.mp3',
  -- Q1
  'I am ___ London.',
  'Eu sou ___ Londres.',
  'from|in|at', 'from',
  -- Complete
  'She is from ___.',
  'Ela é de/da ___.',
  'Italy|from|and', 'Italy',
  -- Speak 1
  'I am from London',
  -- Q2
  'Which is the correct question about origin?',
  'Qual é a pergunta correta sobre origem?',
  'Where are you from?|What is your name?|How old are you?', 'Where are you from?',
  -- Q3
  'I am from ___.',
  'Eu sou do/da ___.',
  'Brazil|is|the', 'Brazil',
  -- Speak 2, Order, Speak 3
  'Where are you from',
  'I am from London',
  'He is from Canada'
),

-- ── CHECKPOINT 4: How Old Are You? ─────────────────────────
(
  2, 4, 'How Old Are You?',
  'audio', '/audio/dialog-exemplo.mp3',
  -- Q1
  'I am 25 ___ old.',
  'Eu tenho 25 ___ de idade.',
  'years|from|blue', 'years',
  -- Complete
  'She is ___ years old.',
  'Ela tem ___ anos de idade.',
  '30|going|from', '30',
  -- Speak 1
  'I am 25 years old',
  -- Q2
  'Which is the correct question about age?',
  'Qual é a pergunta correta sobre idade?',
  'How old are you?|Where are you from?|What is your name?', 'How old are you?',
  -- Q3
  'He ___ 18 years old.',
  'Ele ___ 18 anos de idade.',
  'is|am|are', 'is',
  -- Speak 2, Order, Speak 3
  'How old are you',
  'I am 25 years old',
  'She is thirty years old'
),

-- ── CHECKPOINT 5: Your Job ─────────────────────────────────
(
  2, 5, 'Your Job',
  'audio', '/audio/dialog-exemplo.mp3',
  -- Q1
  'I am a ___.',
  'Eu sou um(a) ___.',
  'teacher|from|in', 'teacher',
  -- Complete
  'She is a ___.',
  'Ela é uma ___.',
  'nurse|and|blue', 'nurse',
  -- Speak 1
  'I am a teacher',
  -- Q2
  'Which sentence mentions a profession?',
  'Qual frase menciona uma profissão?',
  'I am an engineer|I am 25 years old|My name is Oliver', 'I am an engineer',
  -- Q3
  'What do you ___?',
  'O que você ___?',
  'do|from|is', 'do',
  -- Speak 2, Order, Speak 3
  'What do you do',
  'I am a student',
  'He is a doctor'
),

-- ── CHECKPOINT 6: Where You Live ───────────────────────────
(
  2, 6, 'Where You Live',
  'audio', '/audio/dialog-exemplo.mp3',
  -- Q1
  'I live ___ New York.',
  'Eu moro ___ Nova York.',
  'in|from|at', 'in',
  -- Complete
  'She ___ in Paris.',
  'Ela ___ em Paris.',
  'lives|am|are', 'lives',
  -- Speak 1
  'I live in London',
  -- Q2
  'Which sentence is about where someone lives?',
  'Qual frase é sobre onde alguém mora?',
  'I live in London|I am 25 years old|My name is Oliver', 'I live in London',
  -- Q3
  'He lives in ___.',
  'Ele mora em ___.',
  'Tokyo|from|is', 'Tokyo',
  -- Speak 2, Order, Speak 3
  'Where do you live',
  'I live in New York',
  'Where does she live'
),

-- ── CHECKPOINT 7: Phone & Contact ──────────────────────────
(
  2, 7, 'Phone & Contact',
  'audio', '/audio/dialog-exemplo.mp3',
  -- Q1
  'My phone ___ is 555-0100.',
  'Meu ___ de telefone é 555-0100.',
  'number|from|is', 'number',
  -- Complete
  'My email ___ oliver@email.com.',
  'Meu email ___ oliver@email.com.',
  'is|from|at', 'is',
  -- Speak 1
  'My phone number is 555 0100',
  -- Q2
  'Which question asks for an email?',
  'Qual pergunta pede um email?',
  'What is your email?|Where do you live?|How old are you?', 'What is your email?',
  -- Q3
  'You can ___ me at 555-0200.',
  'Você pode me ___ no 555-0200.',
  'call|come|go', 'call',
  -- Speak 2, Order, Speak 3
  'What is your phone number',
  'What is your phone number',
  'You can call me at 555 0200'
),

-- ── CHECKPOINT 8: Hobbies & Interests (General) ────────────
(
  2, 8, 'Likes & Hobbies',
  'audio', '/audio/dialog-exemplo.mp3',
  -- Q1
  'I like ___.',
  'Eu gosto de ___.',
  'music|from|is', 'music',
  -- Complete
  'She loves ___.',
  'Ela ama ___.',
  'reading|from|is', 'reading',
  -- Speak 1
  'I like music',
  -- Q2
  'Which question asks about hobbies?',
  'Qual pergunta é sobre hobbies?',
  'What do you like?|Where do you live?|How old are you?', 'What do you like?',
  -- Q3
  'I enjoy ___ movies.',
  'Eu gosto de ___ filmes.',
  'watching|from|is', 'watching',
  -- Speak 2, Order, Speak 3
  'What do you like to do',
  'I like music and sports',
  'I love learning English'
),

-- ── CHECKPOINT 9: Asking About Others ──────────────────────
(
  2, 9, 'Asking About Others',
  'audio', '/audio/dialog-exemplo.mp3',
  -- Q1
  '___ is your name?',
  '___ é o seu nome?',
  'What|Where|How', 'What',
  -- Complete
  'How old ___ he?',
  'Quantos anos ___ ele?',
  'is|am|are', 'is',
  -- Speak 1
  'What is your name',
  -- Q2
  'Which question asks about her origin?',
  'Qual pergunta é sobre a origem dela?',
  'Where is she from?|What is her job?|How old is she?', 'Where is she from?',
  -- Q3
  'What does he ___?',
  'O que ele ___?',
  'do|from|is', 'do',
  -- Speak 2, Order, Speak 3
  'Where does she live',
  'What is his name',
  'Where are you from'
),

-- ── CHECKPOINT 10: Full Dialogue ───────────────────────────
(
  2, 10, 'Full Dialogue',
  'audio', '/audio/dialog-exemplo.mp3',
  -- Q1
  'Hi! My name ___ Oliver.',
  'Oi! Meu nome ___ Oliver.',
  'is|am|are', 'is',
  -- Complete
  'I am a teacher and I live ___ London.',
  'Eu sou professor e moro ___ Londres.',
  'in|from|at', 'in',
  -- Speak 1
  'My name is Oliver I am from London',
  -- Q2
  'What does Sarah say when meeting Oliver?',
  'O que a Sarah diz ao conhecer Oliver?',
  'Nice to meet you I am Sarah|Goodbye Oliver|I am from Brazil', 'Nice to meet you I am Sarah',
  -- Q3
  'I ___ 25 years old.',
  'Eu ___ 25 anos de idade.',
  'am|is|are', 'am',
  -- Speak 2, Order, Speak 3
  'Nice to meet you too',
  'It was great meeting you',
  'Hi my name is Oliver I am from London'
)
ON CONFLICT (phase_id, checkpoint_number) DO NOTHING;
