-- ============================================================
-- Adicionar módulos ao curso 2110a255-9bb1-4636-b7d7-e71e8e7dc08d
-- Appenda os novos módulos ao array JSONB existente
-- ============================================================

UPDATE woaplay_courses
SET
  modules = modules || '[
    {
      "id": "mod-VAuuCzgjIVE",
      "position": 2,
      "video_title": "Apresente-se",
      "video_url": "https://www.youtube.com/embed/VAuuCzgjIVE",
      "has_practice_video": false,
      "materials": []
    },
    {
      "id": "mod-X590YvWvOKs",
      "position": 3,
      "video_title": "Fale sobre coisas",
      "video_url": "https://www.youtube.com/embed/X590YvWvOKs",
      "has_practice_video": false,
      "materials": []
    },
    {
      "id": "mod-wpC1JTUpF20",
      "position": 4,
      "video_title": "Aprenda a contar até 20",
      "video_url": "https://www.youtube.com/embed/wpC1JTUpF20",
      "has_practice_video": false,
      "materials": []
    },
    {
      "id": "mod-i6W_r5F9e1c",
      "position": 5,
      "video_title": "Aprenda a contar de 20 a 1000",
      "video_url": "https://www.youtube.com/embed/i6W_r5F9e1c",
      "has_practice_video": false,
      "materials": []
    },
    {
      "id": "mod-rYjQs9zJFz4",
      "position": 6,
      "video_title": "Fale as horas",
      "video_url": "https://www.youtube.com/embed/rYjQs9zJFz4",
      "has_practice_video": false,
      "materials": []
    },
    {
      "id": "mod-WJCADLm8BZg",
      "position": 7,
      "video_title": "Dias, meses e anos",
      "video_url": "https://www.youtube.com/embed/WJCADLm8BZg",
      "has_practice_video": false,
      "materials": []
    },
    {
      "id": "mod-bwc_dira9Gw",
      "position": 8,
      "video_title": "Números ordinais",
      "video_url": "https://www.youtube.com/embed/bwc_dira9Gw",
      "has_practice_video": false,
      "materials": []
    },
    {
      "id": "mod-vN54RnaD5_c",
      "position": 9,
      "video_title": "Aprenda como fazer perguntas",
      "video_url": "https://www.youtube.com/embed/vN54RnaD5_c",
      "has_practice_video": false,
      "materials": []
    },
    {
      "id": "mod-xm2B9C-FU4w",
      "position": 10,
      "video_title": "Fale sobre o tempo",
      "video_url": "https://www.youtube.com/embed/xm2B9C-FU4w",
      "has_practice_video": false,
      "materials": []
    },
    {
      "id": "mod-MstfnvVtsJA",
      "position": 11,
      "video_title": "Como formar frases em inglês",
      "video_url": "https://www.youtube.com/embed/MstfnvVtsJA",
      "has_practice_video": false,
      "materials": []
    },
    {
      "id": "mod-gh8lfratRkA",
      "position": 12,
      "video_title": "Verbo to be",
      "video_url": "https://www.youtube.com/embed/gh8lfratRkA",
      "has_practice_video": false,
      "materials": []
    },
    {
      "id": "mod-S4s9Uf1-Gps",
      "position": 13,
      "video_title": "Como falar no passado",
      "video_url": "https://www.youtube.com/embed/S4s9Uf1-Gps",
      "has_practice_video": false,
      "materials": []
    },
    {
      "id": "mod-PWyjcw5j0EU",
      "position": 14,
      "video_title": "Como convidar para sair",
      "video_url": "https://www.youtube.com/embed/PWyjcw5j0EU",
      "has_practice_video": false,
      "materials": []
    },
    {
      "id": "mod-6tA7F1Q6dLA",
      "position": 15,
      "video_title": "Como falar no futuro",
      "video_url": "https://www.youtube.com/embed/6tA7F1Q6dLA",
      "has_practice_video": false,
      "materials": []
    },
    {
      "id": "mod-E5rcS5-cLx8",
      "position": 16,
      "video_title": "Como pronunciar o TH",
      "video_url": "https://www.youtube.com/embed/E5rcS5-cLx8",
      "has_practice_video": false,
      "materials": []
    },
    {
      "id": "mod-MR0QOXgRkWM",
      "position": 17,
      "video_title": "Como negar em inglês",
      "video_url": "https://www.youtube.com/embed/MR0QOXgRkWM",
      "has_practice_video": false,
      "materials": []
    },
    {
      "id": "mod-ciAvtMJwm08",
      "position": 18,
      "video_title": "Os principais tempos verbais",
      "video_url": "https://www.youtube.com/embed/ciAvtMJwm08",
      "has_practice_video": false,
      "materials": []
    }
  ]'::jsonb,
  updated_at = CURRENT_TIMESTAMP
WHERE id = '2110a255-9bb1-4636-b7d7-e71e8e7dc08d';
