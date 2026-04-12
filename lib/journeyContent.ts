// ============================================================
// Journey Content â€” Types + Seed Data
// All journey content that lives in the database
// ============================================================

// â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
