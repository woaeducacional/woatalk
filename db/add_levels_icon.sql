-- Migration: Add icon_path and lesson_title to levels table
-- Run this in Supabase SQL Editor if the levels table already exists

ALTER TABLE levels ADD COLUMN IF NOT EXISTS icon_path VARCHAR(255);
ALTER TABLE levels ADD COLUMN IF NOT EXISTS lesson_title VARCHAR(255);

-- Upsert all 20 phases
INSERT INTO levels (id, name, type, order_number, icon_path, lesson_title) VALUES
(1,  'Pacific Ocean',     'Ocean', 1,  '/images/icon_pacifico.png',    'The Alphabet'),
(2,  'Atlantic Ocean',    'Ocean', 2,  '/images/icon_atlantico.png',   'Introduce Yourself'),
(3,  'Indian Ocean',      'Ocean', 3,  '/images/icon_indico.png',      'Talking About Things'),
(4,  'Arctic Ocean',      'Ocean', 4,  '/images/icon_artico.png',      'Counting Up to 20'),
(5,  'Antarctic Ocean',   'Ocean', 5,  '/images/icon_antartico.png',   'Counting from 20 to 1000'),
(6,  'Mediterranean Sea', 'Sea',   6,  '/images/icon_mediterraneo.png','Talking About the Time'),
(7,  'Caribbean Sea',     'Sea',   7,  '/images/icon_caribe.png',      'Days, Months and Years'),
(8,  'South China Sea',   'Sea',   8,  '/images/icon_chinameridional.png','Ordinal Numbers'),
(9,  'Arabian Sea',       'Sea',   9,  '/images/icon_arabia.png',      'How to Ask Questions'),
(10, 'Coral Sea',         'Sea',   10, '/images/icon_coral.png',       'Talking About the Weather'),
(11, 'Bering Sea',        'Sea',   11, '/images/icon_bering.png',      'How to Build Sentences'),
(12, 'Philippine Sea',    'Sea',   12, '/images/icon_filipinas.png',   'Verb To Be (Present)'),
(13, 'Sea of Japan',      'Sea',   13, '/images/icon_japao.png',       'How to Speak in the Past Tense'),
(14, 'Red Sea',           'Sea',   14, '/images/icon_vermelho.png',    'How to Ask Someone to Hang Out'),
(15, 'Black Sea',         'Sea',   15, '/images/icon_negro.png',       'How to Talk About the Future'),
(16, 'Baltic Sea',        'Sea',   16, '/images/icon_baltico.png',     'TH Sound — THE'),
(17, 'North Sea',         'Sea',   17, '/images/icon_norte.png',       'TH Sound — THANKS'),
(18, 'Gulf of Mexico',    'Gulf',  18, '/images/icon_mexico.png',      'How to Say "No" Politely'),
(19, 'Sea of Okhotsk',    'Sea',   19, '/images/icon_okhotsk.png',     'The Main Verb Tenses'),
(20, 'Tasman Sea',        'Sea',   20, '/images/icon_tasman.png',      'To Be in the Past (WAS/WERE)')
ON CONFLICT (id) DO UPDATE SET
  name         = EXCLUDED.name,
  icon_path    = EXCLUDED.icon_path,
  lesson_title = EXCLUDED.lesson_title;
