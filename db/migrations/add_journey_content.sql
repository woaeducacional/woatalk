-- ============================================================
-- Migration: Add journey_content table
-- Stores all content for activity-based journeys (5-block structure)
-- Each row = one journey phase with its 5 blocks of content
-- ============================================================

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
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_journey_content_phase ON journey_content(phase_id);

-- ── Seed: Pacific Ocean (phase_id = 1) ──────────────────────

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
