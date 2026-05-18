-- ============================================================
-- WOATALK — FULL SCHEMA (unified)
-- Single file combining all tables + migrations + seed data.
-- Safe to re-run: uses IF NOT EXISTS and ON CONFLICT DO UPDATE.
-- ============================================================

-- ── Extensions ──────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ════════════════════════════════════════════════════════════
-- 1. USERS TABLE
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255),
  avatar_url VARCHAR(500),
  avatar_status VARCHAR(20) DEFAULT 'none',
  role VARCHAR(20) DEFAULT 'user',
  xp_total INTEGER DEFAULT 0,
  coins_balance INTEGER DEFAULT 0,
  current_phase INTEGER DEFAULT 1,
  streak_count INTEGER DEFAULT 0,
  last_streak_date DATE,
  streak_pending BOOLEAN DEFAULT FALSE,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  badges TEXT DEFAULT '',
  journey_progress JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_id ON users(id);

-- ════════════════════════════════════════════════════════════
-- 2. OTP CODES TABLE
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS otp_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(email)
);

CREATE INDEX IF NOT EXISTS idx_otp_codes_email ON otp_codes(email);

-- ════════════════════════════════════════════════════════════
-- 3. JOURNEY CONTENT TABLE
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS journey_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phase_id INTEGER NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  mission_groups JSONB NOT NULL DEFAULT '[]',
  block1 JSONB NOT NULL DEFAULT '{}',
  block2 JSONB NOT NULL DEFAULT '{}',
  block3 JSONB NOT NULL DEFAULT '{}',
  block4 JSONB NOT NULL DEFAULT '{}',
  block5 JSONB NOT NULL DEFAULT '{}',
  blocked BOOLEAN NOT NULL DEFAULT false,
  is_pro BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_journey_content_phase ON journey_content(phase_id);

-- ════════════════════════════════════════════════════════════
-- 4. SEED: Pacific Ocean (phase_id = 1)
-- ════════════════════════════════════════════════════════════

INSERT INTO journey_content (phase_id, title, description, mission_groups, block1, block2, block3, block4, block5)
VALUES (
  1,
  'Pacific Ocean',
  'Self Introduction in English',

  -- mission_groups
  '[
    {"id":0,"icon":"🎬","title":"Video Insight Challenge","description":"Assista um vídeo sobre self-introduction em inglês","color":"#00D4FF","xp":50,"coins":0},
    {"id":1,"icon":"✍️","title":"Let''s Reflect","description":"Reflita sobre sua motivação para aprender inglês","color":"#00FF88","xp":80,"coins":5},
    {"id":2,"icon":"🎧","title":"Key Vocabulary","description":"Aprenda 8 palavras essenciais para se apresentar","color":"#FFD700","xp":85,"coins":5},
    {"id":3,"icon":"🎤","title":"Practice & Speak","description":"Domine expressões para se apresentar em inglês","color":"#FF6B9D","xp":95,"coins":5},
    {"id":4,"icon":"🦅","title":"WOA Challenge","description":"Dê uma apresentação completa em inglês","color":"#00F0FF","xp":100,"coins":15}
  ]'::jsonb,

  -- block1
  '{
    "videoUrl":"YGTEXtptvGM",
    "videoTitle":"Self Introduction in English",
    "choiceQuestion":"Which sentences are useful for introducing yourself?",
    "choiceQuestionPt":"Quais frases são úteis para se apresentar em inglês?",
    "choiceOptions":[
      {"id":1,"text":"My name is Lucas.","isCorrect":true},
      {"id":2,"text":"I''m from Brazil.","isCorrect":true},
      {"id":3,"text":"I need to buy groceries.","isCorrect":false},
      {"id":4,"text":"Nice to meet you.","isCorrect":true},
      {"id":5,"text":"The traffic is terrible today.","isCorrect":false},
      {"id":6,"text":"I work as a software developer.","isCorrect":true},
      {"id":7,"text":"It''s raining outside.","isCorrect":false},
      {"id":8,"text":"I''m interested in learning English.","isCorrect":true}
    ],
    "listenRepeatSentences":[
      "My name is Lucas.",
      "I''m from Brazil.",
      "Nice to meet you.",
      "I work as a teacher.",
      "I''m interested in English.",
      "I''ve been living here for two years.",
      "Let me introduce myself.",
      "One thing about me is that I love learning."
    ]
  }'::jsonb,

  -- block2
  '{
    "quote":"\"To speak another language is to have a second soul.\" — Charlemagne",
    "quotePt":"\"Falar outro idioma é ter uma segunda alma.\" — Carlos Magno",
    "choicePrompt":"Por que você quer aprender inglês? Escolha um:",
    "choices":[
      {"id":"A","text":"I want to travel and talk to people abroad.","pt":"Eu quero viajar e falar com pessoas no exterior."},
      {"id":"B","text":"I want to grow in my career.","pt":"Eu quero crescer na minha carreira."},
      {"id":"C","text":"I want to connect with people from different cultures.","pt":"Eu quero me conectar com pessoas de diferentes culturas."}
    ],
    "modelSentence":"I''m learning English because it helps me become a better version of myself.",
    "modelSentencePt":"Estou aprendendo inglês porque me ajuda a ser uma versão melhor de mim mesmo.",
    "sentenceTemplate":"I''m learning English because {first} and {second}.",
    "sentenceTemplatePt":"Estou aprendendo inglês porque {first} e {second}.",
    "firstBlanksLabel":"Escolha seu motivo:",
    "secondBlanksLabel":"Escolha o benefício:",
    "firstBlanks":[
      {"en":"I want to travel and explore the world","pt":"quero viajar e explorar o mundo"},
      {"en":"I want to grow in my career","pt":"quero crescer na minha carreira"},
      {"en":"I want to connect with different cultures","pt":"quero me conectar com diferentes culturas"}
    ],
    "secondBlanks":[
      {"en":"it opens new opportunities","pt":"abre novas oportunidades"},
      {"en":"it gives me confidence","pt":"me dá confiança"},
      {"en":"it makes me a global citizen","pt":"me torna um cidadão global"}
    ],
    "helpText":"I''m learning English because + motivo + and + benefício",
    "boostSentence":"English is my key to the world.",
    "boostSentencePt":"O inglês é minha chave para o mundo."
  }'::jsonb,

  -- block3
  '{
    "vocabulary":[
      {"word":"Introduce","definition":"To present yourself or someone to another person","translationPt":"Apresentar","example":"Let me introduce myself — my name is Ana."},
      {"word":"Background","definition":"Your history, education, and experience","translationPt":"Histórico","example":"Can you tell me about your background?"},
      {"word":"Nationality","definition":"The country you are from","translationPt":"Nacionalidade","example":"My nationality is Brazilian."},
      {"word":"Profession","definition":"Your job or career","translationPt":"Profissão","example":"My profession is software engineering."},
      {"word":"Origin","definition":"Where you come from","translationPt":"Origem","example":"I''m originally from São Paulo."},
      {"word":"Describe","definition":"To tell details about something or someone","translationPt":"Descrever","example":"How would you describe yourself?"},
      {"word":"Connect","definition":"To form a link or relationship with someone","translationPt":"Conectar","example":"English helps me connect with people worldwide."},
      {"word":"Mention","definition":"To speak about something briefly","translationPt":"Mencionar","example":"I should mention that I love music."}
    ],
    "fillSentences":[
      {"sentence":"Let me ___ myself. My name is Ana.","answer":"introduce","options":["introduce","describe","mention"],"full":"Let me introduce myself. My name is Ana."},
      {"sentence":"Can you tell me about your ___?","answer":"background","options":["background","origin","nationality"],"full":"Can you tell me about your background?"},
      {"sentence":"My ___ is Brazilian.","answer":"nationality","options":["nationality","profession","background"],"full":"My nationality is Brazilian."},
      {"sentence":"My ___ is software engineering.","answer":"profession","options":["profession","origin","describe"],"full":"My profession is software engineering."},
      {"sentence":"I''m originally from São Paulo — that''s my ___.","answer":"origin","options":["origin","nationality","connect"],"full":"I''m originally from São Paulo — that''s my origin."},
      {"sentence":"English helps me ___ with people from all over the world.","answer":"connect","options":["connect","mention","describe"],"full":"English helps me connect with people from all over the world."},
      {"sentence":"I should ___ that I enjoy music and art.","answer":"mention","options":["mention","introduce","origin"],"full":"I should mention that I enjoy music and art."}
    ],
    "memorySentences":[
      "Let me introduce myself.",
      "My nationality is Brazilian.",
      "English helps me connect with people worldwide."
    ]
  }'::jsonb,

  -- block4
  '{
    "expressions":[
      {"id":0,"text":"My name is…","example":"My name is Lucas, and I study computer science."},
      {"id":1,"text":"I''m from…","example":"I''m from Rio de Janeiro."},
      {"id":2,"text":"I work as a…","example":"I work as a teacher."},
      {"id":3,"text":"In my free time, I…","example":"In my free time, I enjoy reading books."},
      {"id":4,"text":"I''m interested in…","example":"I''m interested in learning new languages."},
      {"id":5,"text":"Nice to meet you, I''m…","example":"Nice to meet you, I''m Lucas, from São Paulo."},
      {"id":6,"text":"I''ve been living in…","example":"I''ve been living in São Paulo for five years."},
      {"id":7,"text":"One thing about me is…","example":"One thing about me is that I love traveling."}
    ],
    "completions":{
      "0":[
        {"label":"Lucas, and I study computer science","full":"My name is Lucas, and I study computer science."},
        {"label":"Ana, and I work as a nurse","full":"My name is Ana, and I work as a nurse."},
        {"label":"João, and I love traveling","full":"My name is João, and I love traveling."},
        {"label":"Maria, and I enjoy teaching","full":"My name is Maria, and I enjoy teaching."}
      ],
      "1":[
        {"label":"Rio de Janeiro","full":"I''m from Rio de Janeiro."},
        {"label":"São Paulo","full":"I''m from São Paulo."},
        {"label":"Belo Horizonte","full":"I''m from Belo Horizonte."},
        {"label":"Recife","full":"I''m from Recife."}
      ],
      "2":[
        {"label":"a teacher","full":"I work as a teacher."},
        {"label":"a software developer","full":"I work as a software developer."},
        {"label":"a nurse","full":"I work as a nurse."},
        {"label":"a student","full":"I work as a student."}
      ],
      "3":[
        {"label":"enjoy reading books","full":"In my free time, I enjoy reading books."},
        {"label":"like watching movies","full":"In my free time, I like watching movies."},
        {"label":"love listening to music","full":"In my free time, I love listening to music."},
        {"label":"enjoy spending time with family","full":"In my free time, I enjoy spending time with family."}
      ],
      "4":[
        {"label":"learning new languages","full":"I''m interested in learning new languages."},
        {"label":"exploring different cultures","full":"I''m interested in exploring different cultures."},
        {"label":"technology and innovation","full":"I''m interested in technology and innovation."},
        {"label":"music and the arts","full":"I''m interested in music and the arts."}
      ],
      "5":[
        {"label":"Lucas, from São Paulo","full":"Nice to meet you, I''m Lucas, from São Paulo."},
        {"label":"Ana, and I love art","full":"Nice to meet you, I''m Ana, and I love art."},
        {"label":"João, a software developer","full":"Nice to meet you, I''m João, a software developer."},
        {"label":"Maria, and I enjoy teaching","full":"Nice to meet you, I''m Maria, and I enjoy teaching."}
      ],
      "6":[
        {"label":"São Paulo for five years","full":"I''ve been living in São Paulo for five years."},
        {"label":"Rio de Janeiro since 2020","full":"I''ve been living in Rio de Janeiro since 2020."},
        {"label":"Belo Horizonte all my life","full":"I''ve been living in Belo Horizonte all my life."},
        {"label":"Curitiba for two years","full":"I''ve been living in Curitiba for two years."}
      ],
      "7":[
        {"label":"that I love traveling","full":"One thing about me is that I love traveling."},
        {"label":"that I enjoy cooking","full":"One thing about me is that I enjoy cooking."},
        {"label":"that I learn fast","full":"One thing about me is that I learn fast."},
        {"label":"that I am very creative","full":"One thing about me is that I am very creative."}
      ]
    }
  }'::jsonb,

  -- block5
  '{
    "promptEn":"How would you introduce yourself in English to someone you just met?",
    "promptPt":"Como você se apresentaria em inglês para alguém que acabou de conhecer?",
    "examplePt":"Meu nome é Lucas, sou de São Paulo e trabalho como desenvolvedor de software. No meu tempo livre gosto de ler livros e aprender coisas novas, e estou aprendendo inglês porque quero me comunicar com pessoas do mundo inteiro.",
    "topicHints":[
      "Seu nome e de onde você é",
      "O que você faz (trabalho/estudo)",
      "O que você gosta de fazer no tempo livre"
    ]
  }'::jsonb
)
ON CONFLICT (phase_id) DO UPDATE SET
  title        = EXCLUDED.title,
  description  = EXCLUDED.description,
  mission_groups = EXCLUDED.mission_groups,
  block1       = EXCLUDED.block1,
  block2       = EXCLUDED.block2,
  block3       = EXCLUDED.block3,
  block4       = EXCLUDED.block4,
  block5       = EXCLUDED.block5;

-- ════════════════════════════════════════════════════════════
-- 5. SEED: Atlantic Ocean (phase_id = 2)
-- ════════════════════════════════════════════════════════════

INSERT INTO journey_content (
  phase_id, title, description, mission_groups,
  block1, block2, block3, block4, block5, blocked, is_pro
) VALUES (
  2,
  'Atlantic Ocean',
  'Talking About Hobbies',

  -- mission_groups
  '[
    {"id":0,"icon":"🎬","title":"Video Insight Challenge","description":"Watch a video introduction to the topic","color":"#00D4FF","xp":10,"coins":0},
    {"id":1,"icon":"✍️","title":"Let''s Reflect","description":"Select the correct sentences about hobbies","color":"#00FF88","xp":80,"coins":5},
    {"id":2,"icon":"🎧","title":"Related Vocabulary","description":"Practice pronunciation with 8 sentences","color":"#FFD700","xp":85,"coins":5},
    {"id":3,"icon":"🎤","title":"Practice & Speak","description":"Master 2 selected sentences","color":"#FF6B9D","xp":95,"coins":5},
    {"id":4,"icon":"🦅","title":"WOA Challenge","description":"The ultimate speaking challenge","color":"#00F0FF","xp":100,"coins":15}
  ]'::jsonb,

  -- block1
  '{
    "videoUrl":"https://www.youtube.com/watch?v=3SUcWS3WHPY",
    "videoTitle":"Talking About Hobbies",
    "choiceQuestion":"Which sentences express hobbies?",
    "choiceQuestionPt":"Quais frases expressam hobbies?",
    "choiceOptions":[
      {"id":1,"text":"I go to the gym.","isCorrect":true},
      {"id":2,"text":"I watch movies.","isCorrect":true},
      {"id":3,"text":"I have a meeting at 9 a.m.","isCorrect":false},
      {"id":4,"text":"I play soccer.","isCorrect":true},
      {"id":5,"text":"She works in an office.","isCorrect":false},
      {"id":6,"text":"I listen to music.","isCorrect":true},
      {"id":7,"text":"I need to buy food.","isCorrect":false},
      {"id":8,"text":"I read books.","isCorrect":true}
    ],
    "listenRepeatSentences":[
      "I watch movies.",
      "I listen to music.",
      "I play soccer.",
      "I read books.",
      "I learn new things.",
      "I travel on weekends.",
      "I spend time with my family.",
      "I go to the gym."
    ]
  }'::jsonb,

  -- block2
  '{
    "quote":"\"Do what you love, and you will never have to work a day in your life.\" — Confucius",
    "quotePt":"\"Faça o que você ama e nunca terá que trabalhar um dia na sua vida.\" — Confúcio",
    "choicePrompt":"👉 O que você ama fazer? Escolha um:",
    "choices":[
      {"id":"A","text":"I love spending time with my family.","pt":"Eu adoro passar tempo com minha família."},
      {"id":"B","text":"I love listening to music.","pt":"Eu adoro ouvir música."},
      {"id":"C","text":"I love watching movies.","pt":"Eu adoro assistir filmes."}
    ],
    "modelSentence":"I love dancing because it makes me feel free.",
    "modelSentencePt":"Eu adoro dançar porque me sinto livre.",
    "sentenceTemplate":"I love ______ because ______.",
    "sentenceTemplatePt":"Eu adoro ______ porque ______.",
    "firstBlanksLabel":"Escolha sua atividade:",
    "secondBlanksLabel":"Escolha seu motivo:",
    "firstBlanks":[
      {"en":"listening to music","pt":"ouvir música"},
      {"en":"spending time with my family","pt":"passar tempo com minha família"},
      {"en":"watching movies","pt":"assistir filmes"}
    ],
    "secondBlanks":[
      {"en":"it helps me relax","pt":"me ajuda a relaxar"},
      {"en":"it makes me happy","pt":"me deixa feliz"},
      {"en":"I feel good when I do it","pt":"me sinto bem quando faço isso"}
    ],
    "helpText":"I love + activity because + reason",
    "boostSentence":"I want to do what I love every day.",
    "boostSentencePt":"Eu quero fazer o que amo todos os dias."
  }'::jsonb,

  -- block3
  '{
    "vocabulary":[
      {"word":"Hobby","definition":"An activity done for pleasure","translationPt":"Hobby / Passatempo","example":"Playing guitar is my favorite hobby."},
      {"word":"Interest","definition":"Wanting to learn more about something","translationPt":"Interesse","example":"I have a great interest in music."},
      {"word":"Enjoy","definition":"To feel pleasure","translationPt":"Gostar / Aproveitar","example":"I enjoy watching movies on weekends."},
      {"word":"Activity","definition":"Something you do","translationPt":"Atividade","example":"Swimming is a healthy activity."},
      {"word":"Leisure","definition":"Free time","translationPt":"Lazer","example":"I read books in my leisure time."},
      {"word":"Free time","definition":"Time when you are not busy","translationPt":"Tempo livre","example":"I listen to music in my free time."},
      {"word":"Passion","definition":"Something you love a lot","translationPt":"Paixão","example":"Traveling is my biggest passion."},
      {"word":"Relax","definition":"To rest and feel calm","translationPt":"Relaxar","example":"I like to relax by listening to music."}
    ],
    "fillSentences":[
      {"sentence":"I ___ watching movies on weekends.","answer":"enjoy","options":["enjoy","hobby","activity"],"full":"I enjoy watching movies on weekends."},
      {"sentence":"In my ___ time, I like to read.","answer":"leisure","options":["leisure","passion","interest"],"full":"In my leisure time, I like to read."},
      {"sentence":"Playing soccer is my favorite ___.","answer":"hobby","options":["hobby","relax","free time"],"full":"Playing soccer is my favorite hobby."},
      {"sentence":"I like to ___ by listening to music.","answer":"relax","options":["relax","interest","activity"],"full":"I like to relax by listening to music."},
      {"sentence":"Traveling is my biggest ___.","answer":"passion","options":["passion","leisure","enjoy"],"full":"Traveling is my biggest passion."},
      {"sentence":"I have an ___ in learning English.","answer":"interest","options":["interest","hobby","relax"],"full":"I have an interest in learning English."},
      {"sentence":"One fun ___ is going to the gym.","answer":"activity","options":["activity","enjoy","leisure"],"full":"One fun activity is going to the gym."}
    ],
    "memorySentences":[
      "I enjoy watching movies on weekends.",
      "Playing soccer is my favorite hobby.",
      "I like to relax by listening to music."
    ]
  }'::jsonb,

  -- block4
  '{
    "expressions":[
      {"id":0,"text":"I enjoy… because…","example":"I enjoy cooking because it helps me relax."},
      {"id":1,"text":"My favorite hobby is…","example":"My favorite hobby is playing guitar."},
      {"id":2,"text":"In my free time, I…","example":"In my free time, I go for a walk."},
      {"id":3,"text":"I like to… when I want to relax","example":"I like to read a book when I want to relax."},
      {"id":4,"text":"I''m interested in…","example":"I''m interested in learning new languages."},
      {"id":5,"text":"I''m passionate about…","example":"I''m passionate about photography."},
      {"id":6,"text":"I usually… in my free time","example":"I usually watch movies in my free time."},
      {"id":7,"text":"One thing I really like is…","example":"One thing I really like is traveling to new places."}
    ],
    "completions":{
      "0":[
        {"label":"cooking because it helps me unwind","full":"I enjoy cooking because it helps me unwind."},
        {"label":"reading because I learn new things","full":"I enjoy reading because I learn new things."},
        {"label":"drawing because it relaxes me","full":"I enjoy drawing because it relaxes me."},
        {"label":"hiking because I love nature","full":"I enjoy hiking because I love nature."}
      ],
      "1":[
        {"label":"playing guitar","full":"My favorite hobby is playing guitar."},
        {"label":"drawing and sketching","full":"My favorite hobby is drawing and sketching."},
        {"label":"cooking new recipes","full":"My favorite hobby is cooking new recipes."},
        {"label":"playing video games","full":"My favorite hobby is playing video games."}
      ],
      "2":[
        {"label":"go for a walk","full":"In my free time, I go for a walk."},
        {"label":"listen to music","full":"In my free time, I listen to music."},
        {"label":"read books","full":"In my free time, I read books."},
        {"label":"watch series","full":"In my free time, I watch series."}
      ],
      "3":[
        {"label":"read a book","full":"I like to read a book when I want to relax."},
        {"label":"listen to calm music","full":"I like to listen to calm music when I want to relax."},
        {"label":"take a long walk","full":"I like to take a long walk when I want to relax."},
        {"label":"watch a movie","full":"I like to watch a movie when I want to relax."}
      ],
      "4":[
        {"label":"learning new languages","full":"I''m interested in learning new languages."},
        {"label":"exploring different cultures","full":"I''m interested in exploring different cultures."},
        {"label":"understanding how technology works","full":"I''m interested in understanding how technology works."},
        {"label":"discovering new music","full":"I''m interested in discovering new music."}
      ],
      "5":[
        {"label":"photography","full":"I''m passionate about photography."},
        {"label":"music and art","full":"I''m passionate about music and art."},
        {"label":"cooking and trying new recipes","full":"I''m passionate about cooking and trying new recipes."},
        {"label":"traveling and exploring new places","full":"I''m passionate about traveling and exploring new places."}
      ],
      "6":[
        {"label":"watch movies","full":"I usually watch movies in my free time."},
        {"label":"listen to podcasts","full":"I usually listen to podcasts in my free time."},
        {"label":"go for a walk","full":"I usually go for a walk in my free time."},
        {"label":"read books","full":"I usually read books in my free time."}
      ],
      "7":[
        {"label":"traveling to new places","full":"One thing I really like is traveling to new places."},
        {"label":"trying different foods","full":"One thing I really like is trying different foods."},
        {"label":"learning something new","full":"One thing I really like is learning something new."},
        {"label":"spending time with friends","full":"One thing I really like is spending time with friends."}
      ]
    }
  }'::jsonb,

  -- block5
  '{
    "promptEn":"What do you like to do in your free time?",
    "promptPt":"O que você gosta de fazer no seu tempo livre?",
    "examplePt":"Eu gosto de ouvir música no meu tempo livre. É relaxante e me ajuda a me sentir melhor.",
    "topicHints":[
      "sports / esportes",
      "music / música",
      "movies / filmes",
      "reading / leitura",
      "cooking / culinária",
      "traveling / viagens",
      "games / jogos"
    ]
  }'::jsonb,

  false,
  false
)
ON CONFLICT (phase_id) DO UPDATE SET
  title        = EXCLUDED.title,
  description  = EXCLUDED.description,
  mission_groups = EXCLUDED.mission_groups,
  block1       = EXCLUDED.block1,
  block2       = EXCLUDED.block2,
  block3       = EXCLUDED.block3,
  block4       = EXCLUDED.block4,
  block5       = EXCLUDED.block5;

-- ═══════════════════════════════════════════════════════════════
-- COMMUNITY TABLES
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS community_posts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_type     TEXT NOT NULL CHECK (post_type IN ('badge_earned','streak_milestone','journey_completed','block_completed','xp_milestone')),
  payload       JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_community_posts_created ON community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_user    ON community_posts(user_id);

CREATE TABLE IF NOT EXISTS community_reactions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reaction   TEXT NOT NULL CHECK (reaction IN ('heart')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id, reaction)
);

CREATE INDEX IF NOT EXISTS idx_community_reactions_post ON community_reactions(post_id);

-- Repair constraint on existing table (safe to re-run)
ALTER TABLE community_reactions DROP CONSTRAINT IF EXISTS community_reactions_reaction_check;
DELETE FROM community_reactions WHERE reaction NOT IN ('heart');
ALTER TABLE community_reactions ADD CONSTRAINT community_reactions_reaction_check CHECK (reaction IN ('heart'));

CREATE TABLE IF NOT EXISTS community_comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  phrase     TEXT NOT NULL CHECK (phrase IN ('congrats','amazing','onfire','inspiring')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id, phrase)
);

CREATE INDEX IF NOT EXISTS idx_community_comments_post ON community_comments(post_id);

-- ─────────────────────────────────────────────────────────────
-- XP HISTORY  (used for weekly XP ranking — no cron needed)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS xp_history (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount     INTEGER NOT NULL,
  reason     TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_xp_history_user    ON xp_history(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_history_created ON xp_history(created_at DESC);

-- ─────────────────────────────────────────────────────────────
-- NOTIFICATIONS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- ═══════════════════════════════════════════════════════════════
-- SEED: Demo users
-- ═══════════════════════════════════════════════════════════════

INSERT INTO users (id, email, name, password_hash, xp_total, coins_balance, streak_count, badges, email_verified)
VALUES
  ('a1000000-0000-0000-0000-000000000001', 'lucas@demo.com', 'Lucas Silva',    NULL, 1250, 45, 7, 'first_step', true),
  ('a1000000-0000-0000-0000-000000000002', 'maria@demo.com', 'Maria Oliveira', NULL,  870, 30, 6, 'first_step', true),
  ('a1000000-0000-0000-0000-000000000003', 'joao@demo.com',  'João Santos',    NULL,  540, 20, 7, 'first_step', true),
  ('a1000000-0000-0000-0000-000000000004', 'ana@demo.com',   'Ana Costa',      NULL, 2100, 65, 7, 'first_step', true),
  ('a1000000-0000-0000-0000-000000000005', 'pedro@demo.com', 'Pedro Lima',     NULL,  320, 10, 3, '',           true)
ON CONFLICT (email) DO NOTHING;

-- Repair streak values on existing rows
UPDATE users SET streak_count = 7 WHERE email = 'lucas@demo.com';
UPDATE users SET streak_count = 6 WHERE email = 'maria@demo.com';
UPDATE users SET streak_count = 7 WHERE email = 'ana@demo.com';

-- ═══════════════════════════════════════════════════════════════
-- SEED: XP history (this week — for weekly ranking demo)
-- ═══════════════════════════════════════════════════════════════
INSERT INTO xp_history (user_id, amount, reason, created_at) VALUES
  ('a1000000-0000-0000-0000-000000000004', 200, 'mission_group', NOW() - INTERVAL '1 day'),
  ('a1000000-0000-0000-0000-000000000004', 180, 'mission_group', NOW() - INTERVAL '2 days'),
  ('a1000000-0000-0000-0000-000000000001', 175, 'mission_group', NOW() - INTERVAL '1 day'),
  ('a1000000-0000-0000-0000-000000000001', 140, 'mission_group', NOW() - INTERVAL '3 days'),
  ('a1000000-0000-0000-0000-000000000002', 160, 'mission_group', NOW() - INTERVAL '2 days'),
  ('a1000000-0000-0000-0000-000000000002',  95, 'mission_group', NOW() - INTERVAL '4 days'),
  ('a1000000-0000-0000-0000-000000000003', 130, 'mission_group', NOW() - INTERVAL '1 day'),
  ('a1000000-0000-0000-0000-000000000003',  85, 'mission_group', NOW() - INTERVAL '3 days'),
  ('a1000000-0000-0000-0000-000000000005',  50, 'mission_group', NOW() - INTERVAL '5 days');

-- ═══════════════════════════════════════════════════════════════
-- SEED: Community posts
-- payload keys match formatPayload() in CommunityPostCard.tsx:
--   badge_earned    → badge
--   streak_milestone → streak
--   journey_completed → phaseId
--   block_completed  → phaseId, missionGroupId
--   xp_milestone     → xp
-- ═══════════════════════════════════════════════════════════════

INSERT INTO community_posts (id, user_id, post_type, payload, created_at) VALUES
-- Lucas
('c0000000-0001-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001','badge_earned',
 '{"badge":"first_step"}', NOW() - INTERVAL '6 days'),
('c0000000-0001-0000-0000-000000000002','a1000000-0000-0000-0000-000000000001','block_completed',
 '{"phaseId":1,"missionGroupId":0}', NOW() - INTERVAL '6 days' + INTERVAL '5 minutes'),
('c0000000-0001-0000-0000-000000000003','a1000000-0000-0000-0000-000000000001','journey_completed',
 '{"phaseId":1}', NOW() - INTERVAL '4 days'),
('c0000000-0001-0000-0000-000000000004','a1000000-0000-0000-0000-000000000001','streak_milestone',
 '{"streak":7}', NOW() - INTERVAL '3 days'),
('c0000000-0001-0000-0000-000000000005','a1000000-0000-0000-0000-000000000001','xp_milestone',
 '{"xp":1000}', NOW() - INTERVAL '2 days'),
-- Maria
('c0000000-0002-0000-0000-000000000001','a1000000-0000-0000-0000-000000000002','badge_earned',
 '{"badge":"first_step"}', NOW() - INTERVAL '5 days'),
('c0000000-0002-0000-0000-000000000002','a1000000-0000-0000-0000-000000000002','block_completed',
 '{"phaseId":1,"missionGroupId":1}', NOW() - INTERVAL '5 days' + INTERVAL '20 minutes'),
('c0000000-0002-0000-0000-000000000003','a1000000-0000-0000-0000-000000000002','streak_milestone',
 '{"streak":7}', NOW() - INTERVAL '3 days' + INTERVAL '2 hours'),
('c0000000-0002-0000-0000-000000000004','a1000000-0000-0000-0000-000000000002','block_completed',
 '{"phaseId":2,"missionGroupId":2}', NOW() - INTERVAL '2 days'),
('c0000000-0002-0000-0000-000000000005','a1000000-0000-0000-0000-000000000002','journey_completed',
 '{"phaseId":2}', NOW() - INTERVAL '1 day'),
-- João
('c0000000-0003-0000-0000-000000000001','a1000000-0000-0000-0000-000000000003','badge_earned',
 '{"badge":"first_step"}', NOW() - INTERVAL '4 days'),
('c0000000-0003-0000-0000-000000000002','a1000000-0000-0000-0000-000000000003','streak_milestone',
 '{"streak":7}', NOW() - INTERVAL '2 days' + INTERVAL '4 hours'),
('c0000000-0003-0000-0000-000000000003','a1000000-0000-0000-0000-000000000003','block_completed',
 '{"phaseId":1,"missionGroupId":3}', NOW() - INTERVAL '1 day' + INTERVAL '3 hours'),
-- Ana
('c0000000-0004-0000-0000-000000000001','a1000000-0000-0000-0000-000000000004','badge_earned',
 '{"badge":"first_step"}', NOW() - INTERVAL '7 days'),
('c0000000-0004-0000-0000-000000000002','a1000000-0000-0000-0000-000000000004','journey_completed',
 '{"phaseId":1}', NOW() - INTERVAL '5 days' + INTERVAL '6 hours'),
('c0000000-0004-0000-0000-000000000003','a1000000-0000-0000-0000-000000000004','streak_milestone',
 '{"streak":7}', NOW() - INTERVAL '3 days' + INTERVAL '8 hours'),
('c0000000-0004-0000-0000-000000000004','a1000000-0000-0000-0000-000000000004','journey_completed',
 '{"phaseId":2}', NOW() - INTERVAL '1 day' + INTERVAL '5 hours'),
('c0000000-0004-0000-0000-000000000005','a1000000-0000-0000-0000-000000000004','xp_milestone',
 '{"xp":2000}', NOW() - INTERVAL '12 hours'),
-- Pedro
('c0000000-0005-0000-0000-000000000001','a1000000-0000-0000-0000-000000000005','block_completed',
 '{"phaseId":2,"missionGroupId":0}', NOW() - INTERVAL '8 hours'),
('c0000000-0005-0000-0000-000000000002','a1000000-0000-0000-0000-000000000005','streak_milestone',
 '{"streak":7}', NOW() - INTERVAL '2 hours')
ON CONFLICT (id) DO NOTHING;

-- Repair streak payloads on existing posts
UPDATE community_posts SET payload = '{"streak":7}' WHERE id = 'c0000000-0001-0000-0000-000000000004';
UPDATE community_posts SET payload = '{"streak":7}' WHERE id = 'c0000000-0002-0000-0000-000000000003';
UPDATE community_posts SET payload = '{"streak":7}' WHERE id = 'c0000000-0004-0000-0000-000000000003';

-- ═══════════════════════════════════════════════════════════════
-- SEED: Community reactions (alphanumeric keys)
-- ═══════════════════════════════════════════════════════════════

INSERT INTO community_reactions (post_id, user_id, reaction) VALUES
('c0000000-0001-0000-0000-000000000001','a1000000-0000-0000-0000-000000000002','heart'),
('c0000000-0001-0000-0000-000000000001','a1000000-0000-0000-0000-000000000003','heart'),
('c0000000-0001-0000-0000-000000000004','a1000000-0000-0000-0000-000000000002','heart'),
('c0000000-0004-0000-0000-000000000003','a1000000-0000-0000-0000-000000000001','heart'),
('c0000000-0004-0000-0000-000000000003','a1000000-0000-0000-0000-000000000005','heart'),
('c0000000-0002-0000-0000-000000000005','a1000000-0000-0000-0000-000000000001','heart'),
('c0000000-0005-0000-0000-000000000001','a1000000-0000-0000-0000-000000000002','heart')
ON CONFLICT (post_id, user_id, reaction) DO NOTHING;

INSERT INTO community_comments (post_id, user_id, phrase) VALUES
('c0000000-0001-0000-0000-000000000001','a1000000-0000-0000-0000-000000000002','congrats'),
('c0000000-0001-0000-0000-000000000001','a1000000-0000-0000-0000-000000000004','congrats'),
('c0000000-0001-0000-0000-000000000001','a1000000-0000-0000-0000-000000000003','amazing'),
('c0000000-0004-0000-0000-000000000003','a1000000-0000-0000-0000-000000000001','onfire'),
('c0000000-0004-0000-0000-000000000003','a1000000-0000-0000-0000-000000000002','onfire'),
('c0000000-0004-0000-0000-000000000003','a1000000-0000-0000-0000-000000000003','inspiring'),
('c0000000-0001-0000-0000-000000000004','a1000000-0000-0000-0000-000000000004','onfire'),
('c0000000-0002-0000-0000-000000000005','a1000000-0000-0000-0000-000000000004','congrats'),
('c0000000-0005-0000-0000-000000000001','a1000000-0000-0000-0000-000000000003','amazing')
ON CONFLICT (post_id, user_id, phrase) DO NOTHING;
