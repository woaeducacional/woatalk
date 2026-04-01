'use client'

import { useEffect, useState } from 'react'

interface Activity1ChooseSentencesProps {
  onComplete: (xp: number) => void
}

const SENTENCES = [
  { text: 'I usually go to the gym after work.', useful: false },
  { text: 'I enjoy watching movies in my free time.', useful: true },
  { text: 'I have a meeting at 9 a.m.', useful: false },
  { text: 'My favorite hobby is playing soccer.', useful: true },
  { text: 'She works in an office downtown.', useful: false },
  { text: 'I like listening to music when I want to relax.', useful: true },
  { text: 'I need to buy groceries today.', useful: false },
  { text: 'In my free time, I read books.', useful: true },
]

export function Activity1ChooseSentences({ onComplete }: Activity1ChooseSentencesProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [showFeedback, setShowFeedback] = useState(false)
  const [completed, setCompleted] = useState(false)

  const correctCount = Array.from(selected).filter(s => {
    const sentence = SENTENCES.find(x => x.text === s)
    return sentence?.useful
  }).length

  const isAllCorrect = correctCount === 4 && selected.size === 4

  const toggleSentence = (text: string) => {
    const newSelected = new Set(selected)
    if (newSelected.has(text)) {
      newSelected.delete(text)
    } else {
      newSelected.add(text)
    }
    setSelected(newSelected)
    // Reset feedback when user changes selection
    setShowFeedback(false)
  }

  const handleSubmit = () => {
    setShowFeedback(true)
    if (isAllCorrect) {
      setTimeout(() => {
        setCompleted(true)
        onComplete(15) // 15 XP por escolher corretamente
      }, 1000)
    }
  }

  if (completed) {
    return null
  }

  return (
    <div className="space-y-8">
      {/* Instruções */}
      <div className="space-y-4 p-6 rounded-2xl" style={{ background: 'rgba(0,102,255,0.1)', border: '1px solid rgba(0,212,255,0.2)' }}>
        <h2 className="text-2xl font-bold text-cyan-300 flex items-center gap-2">
          <span>🧩</span> Step 1 — Choose
        </h2>
        <p className="text-base text-blue-200/80">
          Which sentences are useful for talking about hobbies?
        </p>
        <p className="text-sm text-blue-200/50">Choose all that apply:</p>
      </div>

      {/* Sentenças */}
      <div className="space-y-3">
        {SENTENCES.map((sentence, idx) => {
          const isSelected = selected.has(sentence.text)
          const isCorrect = sentence.useful
          const shouldShowFeedback = showFeedback && isSelected

          return (
            <button
              key={idx}
              onClick={() => toggleSentence(sentence.text)}
              className="w-full text-left p-4 rounded-lg transition-all"
              style={{
                background: isSelected
                  ? isCorrect
                    ? 'rgba(34,197,94,0.2)'
                    : 'rgba(239,68,68,0.2)'
                  : showFeedback && !isCorrect && !isSelected
                    ? 'rgba(107,114,128,0.1)'
                    : 'rgba(0,102,255,0.1)',
                border: isSelected
                  ? isCorrect
                    ? '2px solid #22c55e'
                    : '2px solid #ef4444'
                  : '1px solid rgba(0,212,255,0.2)',
                opacity: showFeedback && !isSelected && !isCorrect ? 0.5 : 1,
              }}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl mt-1">
                  {isSelected
                    ? isCorrect
                      ? '✅'
                      : '❌'
                    : showFeedback && !isCorrect
                      ? '⚠️'
                      : '☐'}
                </span>
                <span className={isSelected ? (isCorrect ? 'text-green-300' : 'text-red-300') : 'text-blue-200/80'}>
                  {sentence.text}
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Feedback */}
      {showFeedback && (
        <div
          className="p-6 rounded-2xl backdrop-blur-md"
          style={{
            background: isAllCorrect ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
            border: `1px solid ${isAllCorrect ? '#22c55e' : '#ef4444'}`,
          }}
        >
          <p className={`text-base font-bold ${isAllCorrect ? 'text-green-300' : 'text-red-300'}`}>
            {isAllCorrect
              ? `✅ Perfect! You selected all 4 hobbies sentences (${correctCount}/4)`
              : `You selected ${correctCount}/4. Try again — look for sentences about free time and hobbies.`}
          </p>
        </div>
      )}

      {/* Submit button */}
      {!showFeedback && (
        <button
          onClick={handleSubmit}
          disabled={selected.size === 0}
          className="w-full font-bold tracking-widest px-8 py-4 rounded-lg text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: selected.size > 0 ? 'linear-gradient(135deg, #003AB0, #0066FF)' : 'rgba(0,102,255,0.3)',
            border: '2px solid #00D4FF',
          }}
        >
          ✓ CHECK ANSWER
        </button>
      )}
    </div>
  )
}
