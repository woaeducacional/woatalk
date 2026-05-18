# Journey/Jornada System - Complete Guide

## Overview
The WOA Talk journey system is built around **phases** (also called **journeys** or **jornadas** in Portuguese). Each phase is an ocean/sea narrative that teaches English vocabulary and skills through structured blocks of content.

---

## 1. Database Structure

### Primary Tables

#### **journey_content** (Main Journey/Phase Table)
Stores all course content for each phase/journey.

```sql
CREATE TABLE journey_content (
  id UUID PRIMARY KEY,
  phase_id INTEGER UNIQUE NOT NULL,           -- Unique identifier (1, 2, 3...)
  title VARCHAR(255),                          -- e.g., "Pacific Ocean"
  description TEXT,                            -- e.g., "Self Introduction in English"
  mission_groups JSONB,                        -- Array of 5 mission group definitions
  block1 JSONB,                                -- Video + choice questions content
  block2 JSONB,                                -- Reflection & sentence building
  block3 JSONB,                                -- Vocabulary + fill exercises
  block4 JSONB,                                -- Expressions & completions
  block5 JSONB,                                -- Final speaking challenge
  blocked BOOLEAN DEFAULT false,               -- Whether phase is locked
  is_pro BOOLEAN DEFAULT false,                -- Whether phase requires premium
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### **users** (User Progress Tracking)
Tracks user completion of journeys.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  name VARCHAR(255),
  ...
  current_phase INTEGER DEFAULT 1,             -- Latest phase user reached
  xp_total INTEGER DEFAULT 0,                  -- Total XP earned
  coins_balance INTEGER DEFAULT 0,             -- Total WOA coins
  journey_progress JSONB DEFAULT '{}',         -- Completed mission groups per phase
  ...
);
```

**journey_progress Structure:**
```json
{
  "1": [0, 1, 2, 3, 4],        -- Phase 1: all 5 mission groups completed
  "2": [0, 1],                  -- Phase 2: only 2 mission groups completed
  "3": []                       -- Phase 3: not started
}
```

---

## 2. Journey Content Structure

### Phase Data Example (Pacific Ocean - Phase 1)

Each phase (stored in `journey_content` table) contains:

#### **mission_groups** (Array of 5 groups)
```typescript
[
  {
    "id": 0,
    "icon": "🎬",
    "title": "Video Insight Challenge",
    "description": "Watch a video introduction",
    "color": "#00D4FF",
    "xp": 50,
    "coins": 0
  },
  {
    "id": 1,
    "icon": "✍️",
    "title": "Let's Reflect",
    "description": "Reflect on motivation",
    "color": "#00FF88",
    "xp": 80,
    "coins": 5
  },
  // ... 3 more groups (Vocabulary, Practice & Speak, WOA Challenge)
]
```

#### **block1** - Video Content with Questions
```typescript
{
  "videoUrl": "YGTEXtptvGM",              // YouTube video ID or URL
  "videoTitle": "Self Introduction in English",
  "choiceQuestion": "Which sentences are useful?",
  "choiceQuestionPt": "Quais frases são úteis?",
  "choiceOptions": [
    { "id": 1, "text": "My name is Lucas.", "isCorrect": true },
    { "id": 2, "text": "I'm from Brazil.", "isCorrect": true },
    // ... more options
  ],
  "listenRepeatSentences": [
    "My name is Lucas.",
    "I'm from Brazil.",
    // ... 6 more sentences for listening/repeating
  ]
}
```

#### **block2** - Reflection & Motivation
```typescript
{
  "quote": "\"To speak another language is to have a second soul.\" — Charlemagne",
  "quotePt": "\"Falar outro idioma...\" — Carlos Magno",
  "choicePrompt": "Por que você quer aprender inglês?",
  "choices": [
    { "id": "A", "text": "I want to travel...", "pt": "Eu quero viajar..." },
    // ... more choices
  ],
  "modelSentence": "I'm learning English because it helps me...",
  "modelSentencePt": "Estou aprendendo inglês porque...",
  "sentenceTemplate": "I'm learning English because {first} and {second}.",
  "firstBlanks": [
    { "en": "I want to travel and explore the world", "pt": "quero viajar..." },
    // ... more options for first blank
  ],
  "secondBlanks": [
    { "en": "it opens new opportunities", "pt": "abre novas oportunidades" },
    // ... more options for second blank
  ],
  "helpText": "I'm learning English because + motivo + and + benefício",
  "boostSentence": "English is my key to the world.",
  "boostSentencePt": "O inglês é minha chave para o mundo."
}
```

#### **block3** - Vocabulary with Exercises
```typescript
{
  "vocabulary": [
    {
      "word": "Introduce",
      "definition": "To present yourself or someone to another person",
      "translationPt": "Apresentar",
      "example": "Let me introduce myself — my name is Ana."
    },
    // ... 7 more vocabulary words (8 total)
  ],
  "fillSentences": [
    {
      "sentence": "Let me ___ myself. My name is Ana.",
      "answer": "introduce",
      "options": ["introduce", "describe", "mention"],
      "full": "Let me introduce myself. My name is Ana."
    },
    // ... more fill exercises
  ],
  "memorySentences": [
    "Let me introduce myself.",
    "My nationality is Brazilian.",
    "English helps me connect with people worldwide."
  ]
}
```

#### **block4** - Expressions & Completions
```typescript
{
  "expressions": [
    { "id": 0, "text": "My name is…", "example": "My name is Lucas, and I study computer science." },
    { "id": 1, "text": "I'm from…", "example": "I'm from Rio de Janeiro." },
    // ... 6 more expressions (8 total)
  ],
  "completions": {
    "0": [
      { "label": "Lucas, and I study computer science", "full": "My name is Lucas, and I study computer science." },
      { "label": "Ana, and I work as a nurse", "full": "My name is Ana, and I work as a nurse." },
      // ... more variations
    ],
    "1": [
      { "label": "Rio de Janeiro", "full": "I'm from Rio de Janeiro." },
      // ... more variations
    ]
    // ... completions for each expression
  }
}
```

#### **block5** - Speaking Challenge
```typescript
{
  "promptEn": "How would you introduce yourself in English to someone you just met?",
  "promptPt": "Como você se apresentaria em inglês para alguém que acabou de conhecer?",
  "examplePt": "Meu nome é Lucas, sou de São Paulo e trabalho como desenvolvedor...",
  "topicHints": [
    "Seu nome e de onde você é",
    "O que você faz (trabalho/estudo)",
    "O que você gosta de fazer no tempo livre"
  ]
}
```

---

## 3. TypeScript Types

Located in [lib/journeyContent.ts](lib/journeyContent.ts):

```typescript
export interface MissionGroupDef {
  id: number
  icon: string
  title: string
  description: string
  color: string
  xp: number
  coins: number
}

export interface Block1Content {
  videoUrl: string
  videoTitle: string
  choiceQuestion: string
  choiceQuestionPt: string
  choiceOptions: { id: number; text: string; isCorrect: boolean }[]
  listenRepeatSentences: string[]
}

export interface Block2Content {
  quote: string
  quotePt: string
  choicePrompt: string
  choices: { id: string; text: string; pt: string }[]
  modelSentence: string
  modelSentencePt: string
  sentenceTemplate: string
  sentenceTemplatePt: string
  firstBlanksLabel: string
  secondBlanksLabel: string
  firstBlanks: { en: string; pt: string }[]
  secondBlanks: { en: string; pt: string }[]
  helpText: string
  boostSentence: string
  boostSentencePt: string
}

export interface Block3Content {
  vocabulary: { word: string; definition: string; translationPt: string; example: string }[]
  fillSentences: { sentence: string; answer: string; options: string[]; full: string }[]
  memorySentences: string[]
}

export interface Block4Content {
  expressions: { id: number; text: string; example: string }[]
  completions: Record<number, { label: string; full: string }[]>
}

export interface Block5Content {
  promptEn: string
  promptPt: string
  examplePt: string
  topicHints: string[]
}

export interface JourneyContent {
  phase_id: number
  title: string
  description: string
  mission_groups: MissionGroupDef[]
  block1: Block1Content
  block2: Block2Content
  block3: Block3Content
  block4: Block4Content
  block5: Block5Content
}
```

---

## 4. API Endpoints

### GET /api/journey
List all published journeys (public endpoint).

**Response:**
```json
{
  "journeys": [
    {
      "phase_id": 1,
      "title": "Pacific Ocean",
      "description": "Self Introduction in English",
      "blocked": false,
      "is_pro": false,
      "icon_url": null
    },
    {
      "phase_id": 2,
      "title": "Atlantic Ocean",
      "description": "Talking About Hobbies",
      "blocked": false,
      "is_pro": false,
      "icon_url": null
    }
    // ... more phases
  ]
}
```

**File:** [app/api/journey/route.ts](app/api/journey/route.ts)

---

### GET /api/journey-content/[phaseId]
Fetch complete journey content for a specific phase.

**Request:** `GET /api/journey-content/1`

**Response:**
```json
{
  "phase_id": 1,
  "title": "Pacific Ocean",
  "description": "Self Introduction in English",
  "mission_groups": [...],
  "block1": {...},
  "block2": {...},
  "block3": {...},
  "block4": {...},
  "block5": {...}
}
```

**File:** [app/api/journey-content/[phaseId]/route.ts](app/api/journey-content/[phaseId]/route.ts)

---

### POST /api/mission-groups/complete
Mark a mission group as completed for a user (with XP/coins reward).

**Request:**
```json
{
  "phaseId": 1,
  "missionGroupId": 0,
  "totalXp": 50,
  "woaCoins": 0
}
```

**Response:**
```json
{
  "success": true,
  "message": "Mission group completed",
  "communityPostId": "uuid-here"
}
```

**File:** [app/api/mission-groups/complete/route.ts](app/api/mission-groups/complete/route.ts)

---

## 5. How to Fetch Completed Journeys

### Get User's Current Phase
```typescript
const { data: user } = await supabase
  .from('users')
  .select('id, current_phase, journey_progress, xp_total, coins_balance')
  .eq('email', userEmail)
  .single()

// user.current_phase = 2 (user has reached phase 2)
// user.journey_progress = {
//   "1": [0, 1, 2, 3, 4],  // All 5 groups completed in phase 1
//   "2": [0, 1]            // Only groups 0-1 completed in phase 2
// }
```

### Get Completed Mission Groups for a Phase
```typescript
const { data: user } = await supabase
  .from('users')
  .select('journey_progress')
  .eq('email', userEmail)
  .single()

const phaseId = 1
const completedGroups = user.journey_progress?.[String(phaseId)] ?? []
// completedGroups = [0, 1, 2, 3, 4]
```

### Check if Phase is Fully Completed
```typescript
const phaseId = 1
const completedGroups = user.journey_progress?.[String(phaseId)] ?? []
const isPhaseComplete = completedGroups.length === 5  // All 5 groups done
```

---

## 6. How to Fetch Vocabulary from a Journey

### Get All Vocabulary from a Phase
```typescript
// Fetch the journey content
const { data: journeyContent } = await supabase
  .from('journey_content')
  .select('block3')
  .eq('phase_id', 1)
  .single()

// Extract vocabulary array
const vocabulary = journeyContent.block3.vocabulary
// Returns:
// [
//   { word: "Introduce", definition: "...", translationPt: "Apresentar", example: "..." },
//   { word: "Background", definition: "...", translationPt: "Histórico", example: "..." },
//   ...
// ]
```

### Get All Fill-in-the-Blank Exercises
```typescript
const fillExercises = journeyContent.block3.fillSentences
// Returns:
// [
//   { sentence: "Let me ___ myself.", answer: "introduce", options: [...], full: "Let me introduce myself." },
//   ...
// ]
```

### Get Memory Sentences
```typescript
const memorySentences = journeyContent.block3.memorySentences
// Returns: ["Let me introduce myself.", "My nationality is Brazilian.", ...]
```

---

## 7. Vocabulary Structure

Each vocabulary item in **block3** contains:

| Field | Type | Description |
|-------|------|-------------|
| `word` | string | The English word (e.g., "Introduce") |
| `definition` | string | English definition |
| `translationPt` | string | Portuguese translation |
| `example` | string | Example sentence in English |

**Full Vocabulary Item:**
```json
{
  "word": "Introduce",
  "definition": "To present yourself or someone to another person",
  "translationPt": "Apresentar",
  "example": "Let me introduce myself — my name is Ana."
}
```

---

## 8. Journey Hierarchy

```
PHASE / JOURNEY (e.g., Pacific Ocean - phase_id: 1)
  ↓
MISSION GROUPS (5 groups per phase)
  ├─ Group 0: 🎬 Video Insight Challenge
  ├─ Group 1: ✍️ Let's Reflect
  ├─ Group 2: 🎧 Key Vocabulary
  ├─ Group 3: 🎤 Practice & Speak
  └─ Group 4: 🦅 WOA Challenge
  ↓
BLOCKS (5 blocks per phase)
  ├─ Block 1: Video + questions
  ├─ Block 2: Reflection + sentence building
  ├─ Block 3: Vocabulary + exercises ← **Contains word lists**
  ├─ Block 4: Expressions + completions
  └─ Block 5: Speaking challenge
```

---

## 9. Query Examples

### Get All Journeys with Vocabulary Count
```typescript
const { data: journeys } = await supabase
  .from('journey_content')
  .select('phase_id, title, description')
  .order('phase_id', { ascending: true })

// For each journey, get vocabulary
const journeysWithVocab = journeys.map(journey => ({
  ...journey,
  vocabCount: journey.block3?.vocabulary?.length ?? 0
}))
```

### Get All Vocabulary Across All Journeys
```typescript
const { data: journeys } = await supabase
  .from('journey_content')
  .select('phase_id, title, block3')
  .order('phase_id', { ascending: true })

const allVocabulary = journeys.flatMap(journey => 
  (journey.block3?.vocabulary ?? []).map(v => ({
    ...v,
    phaseId: journey.phase_id,
    phaseTitle: journey.title
  }))
)

// Returns array of all words across all phases with phase information
```

### Get User's Completed Journey Count
```typescript
const { data: user } = await supabase
  .from('users')
  .select('journey_progress')
  .eq('id', userId)
  .single()

const completedJourneys = Object.entries(user.journey_progress)
  .filter(([_, groups]) => groups.length === 5)
  .map(([phaseId]) => parseInt(phaseId))

// Returns: [1, 2] if user completed phases 1 and 2
```

---

## 10. File Map

| File | Purpose |
|------|---------|
| [db/full_schema.sql](db/full_schema.sql) | Database schema with journey tables |
| [lib/journeyContent.ts](lib/journeyContent.ts) | TypeScript types for journey content |
| [app/api/journey/route.ts](app/api/journey/route.ts) | GET list of all journeys |
| [app/api/journey-content/[phaseId]/route.ts](app/api/journey-content/[phaseId]/route.ts) | GET journey content for a phase |
| [app/api/mission-groups/complete/route.ts](app/api/mission-groups/complete/route.ts) | POST mark mission group complete |
| [app/api/mission-groups/[phaseId]/completed/route.ts](app/api/mission-groups/[phaseId]/completed/route.ts) | GET completed groups for a phase |

---

## 11. Key Insights

1. **Journeys are phases:** Each "journey" is a phase identified by `phase_id` (1, 2, 3...)
2. **5 mission groups per phase:** Each phase has exactly 5 mission groups (0-4)
3. **Vocabulary in Block 3:** Word lists are stored in the `block3` JSONB field
4. **User progress tracking:** Journey completion is tracked in `users.journey_progress` as a JSONB object with phase_id keys and arrays of completed group IDs
5. **XP and coins:** Awarded per mission group completion, not individual words
6. **Bilingual design:** All content has English and Portuguese versions

---

## 12. Sample Data (Demo Users)

From [db/full_schema.sql](db/full_schema.sql#L600):

```sql
-- Lucas Silva: phase 1 complete (all 5 groups), phase 2 in progress
journey_progress: {"1": [0, 1, 2, 3, 4], "2": [0, 1]}

-- Maria Oliveira: phase 1 complete, phase 2 complete (all 5 groups)
journey_progress: {"1": [0, 1, 2, 3, 4], "2": [0, 1, 2, 3, 4]}

-- Ana Costa: phase 1 complete, phase 2 complete
journey_progress: {"1": [0, 1, 2, 3, 4], "2": [0, 1, 2, 3, 4]}
```
