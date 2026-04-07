/**
 * Centralized exports for all question structure components
 * 
 * Usage:
 * import { VideoWatchQuestion, MultipleChoiceQuestion } from '@/components/questions_structs'
 */

export { VideoWatchQuestion } from './VideoWatchQuestion'
export { MultipleChoiceQuestion, type ChoiceOption } from './MultipleChoiceQuestion'
export { ListenRepeatQuestion } from './ListenRepeatQuestion'
export { SpeakFromMemoryQuestion } from './SpeakFromMemoryQuestion'
export { VocabularyMatchQuestion, type VocabItem } from './VocabularyMatchQuestion'

// Future exports:
// export { SpeechQuestion } from './SpeechQuestion'
// export { DictationQuestion } from './DictationQuestion'
// export { FillBlankQuestion } from './FillBlankQuestion'
