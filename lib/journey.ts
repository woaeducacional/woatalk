// Types and logic for the journey system
// All journey content lives in the database (journey_checkpoints table)
// Each checkpoint row contains data for 10 missions in a fixed pattern

export type JourneyMissionType = 'resource' | 'difficulty' | 'question' | 'complete' | 'speak' | 'order'

// Fixed pattern: every group of 10 missions follows this sequence
export const MISSION_PATTERN: JourneyMissionType[] = [
  'resource',    // 1. Watch video / listen audio
  'difficulty',  // 2. Rate difficulty (fixed question)
  'question',    // 3. Multiple choice question
  'complete',    // 4. Fill-in-the-blank
  'speak',       // 5. Speak a phrase
  'question',    // 6. Multiple choice question
  'question',    // 7. Multiple choice question
  'speak',       // 8. Speak a phrase
  'order',       // 9. Put words in correct order
  'speak',       // 10. Speak a phrase
]

// XP rewards per mission type
export const MISSION_XP: Record<JourneyMissionType, number> = {
  resource: 20,
  difficulty: 20,
  question: 25,
  complete: 25,
  speak: 30,
  order: 30,
}

// DB row shape
export interface JourneyCheckpoint {
  id: number
  phase_id: number
  checkpoint_number: number
  theme_name: string | null
  resource_type: 'video' | 'audio'
  resource_url: string
  q1_en: string
  q1_pt: string | null
  q1_options: string
  q1_answer: string
  complete_en: string
  complete_pt: string | null
  complete_options: string
  complete_answer: string
  speak1: string
  q2_en: string
  q2_pt: string | null
  q2_options: string
  q2_answer: string
  q3_en: string
  q3_pt: string | null
  q3_options: string
  q3_answer: string
  speak2: string
  order_sentence: string
  speak3: string
}

// Runtime mission derived from checkpoint data
export interface JourneyMission {
  id: number
  type: JourneyMissionType
  question?: string
  questionPt?: string
  options?: string[]
  correctAnswer?: string
  resourceType?: 'video' | 'audio'
  resourceUrl?: string
  speakText?: string
  xp: number
}

/**
 * Converts 10 checkpoint rows into 100 missions using the fixed pattern.
 * Options are stored pipe-separated in DB and split here.
 */
export function checkpointsToMissions(checkpoints: JourneyCheckpoint[]): JourneyMission[] {
  const missions: JourneyMission[] = []
  const sorted = [...checkpoints].sort((a, b) => a.checkpoint_number - b.checkpoint_number)

  for (const cp of sorted) {
    const base = (cp.checkpoint_number - 1) * 10

    for (let pos = 0; pos < 10; pos++) {
      const type = MISSION_PATTERN[pos]
      const mission: JourneyMission = { id: base + pos + 1, type, xp: MISSION_XP[type] }

      switch (pos) {
        case 0: // Resource
          mission.resourceType = cp.resource_type
          mission.resourceUrl = cp.resource_url
          break
        case 1: // Difficulty (fixed question, no DB data needed)
          mission.question = 'Como você classifica a dificuldade de entender o conteúdo?'
          mission.options = ['Fácil', 'Médio', 'Difícil']
          break
        case 2: // Question 1
          mission.question = cp.q1_en
          mission.questionPt = cp.q1_pt || undefined
          mission.options = cp.q1_options.split('|')
          mission.correctAnswer = cp.q1_answer
          break
        case 3: // Complete (fill blank)
          mission.question = cp.complete_en
          mission.questionPt = cp.complete_pt || undefined
          mission.options = cp.complete_options.split('|')
          mission.correctAnswer = cp.complete_answer
          break
        case 4: // Speak 1
          mission.speakText = cp.speak1
          break
        case 5: // Question 2
          mission.question = cp.q2_en
          mission.questionPt = cp.q2_pt || undefined
          mission.options = cp.q2_options.split('|')
          mission.correctAnswer = cp.q2_answer
          break
        case 6: // Question 3
          mission.question = cp.q3_en
          mission.questionPt = cp.q3_pt || undefined
          mission.options = cp.q3_options.split('|')
          mission.correctAnswer = cp.q3_answer
          break
        case 7: // Speak 2
          mission.speakText = cp.speak2
          break
        case 8: // Order sentence
          mission.correctAnswer = cp.order_sentence
          break
        case 9: // Speak 3
          mission.speakText = cp.speak3
          break
      }

      missions.push(mission)
    }
  }

  return missions
}
