'use client'

import { useState, useEffect } from 'react'
import { VideoWatchQuestion, MultipleChoiceQuestion, ListenRepeatQuestion, type ChoiceOption } from '../questions_structs'
import { getCookie, setCookie, deleteCookie } from '@/lib/utils'

interface Block1VideoInsightProps {
  onComplete: (xp: number) => void
  onActivityChange?: (current: number, total: number) => void
  alreadyCompleted?: boolean
}

const CHOICE_OPTIONS: ChoiceOption[] = [
  { id: 1, text: 'My name is Lucas.',                      isCorrect: true  },
  { id: 2, text: "I'm from Brazil.",                        isCorrect: true  },
  { id: 3, text: 'I need to buy groceries.',               isCorrect: false },
  { id: 4, text: 'Nice to meet you.',                      isCorrect: true  },
  { id: 5, text: 'The traffic is terrible today.',         isCorrect: false },
  { id: 6, text: 'I work as a software developer.',        isCorrect: true  },
  { id: 7, text: "It's raining outside.",                  isCorrect: false },
  { id: 8, text: "I'm interested in learning English.",    isCorrect: true  },
]

const LISTEN_REPEAT_SENTENCES = [
  'My name is Lucas.',
  "I'm from Brazil.",
  'Nice to meet you.',
  'I work as a teacher.',
  "I'm interested in English.",
  "I've been living here for two years.",
  'Let me introduce myself.',
  'One thing about me is that I love learning.',
]

type Stage = 'video' | 'choose' | 'listenRepeat' | 'complete'

export function Block1VideoInsight({ onComplete, onActivityChange, alreadyCompleted = false }: Block1VideoInsightProps) {
  const [stage, setStage] = useState<Stage>(() => {
    const s = getCookie('woa_j2_b1_stage') as Stage | null
    return (s && s !== 'complete') ? s : 'video'
  })
  const [xpEarned, setXpEarned] = useState(10)

  const STAGE_INDEX: Record<Stage, number> = { video: 1, choose: 2, listenRepeat: 3, complete: 3 }
  useEffect(() => {
    onActivityChange?.(STAGE_INDEX[stage], 3)
    if (stage !== 'complete') setCookie('woa_j2_b1_stage', stage)
  }, [stage])

  const handleVideoComplete = (xp: number) => { setXpEarned((p) => p + xp); setStage('choose') }
  const handleChoiceComplete = (xp: number) => { setXpEarned((p) => p + xp); setStage('listenRepeat') }
  const handleListenRepeatComplete = (xp: number) => { setXpEarned((p) => p + xp); setStage('complete') }

  return (
    <div className="space-y-8">
      {stage === 'video' && (
        <VideoWatchQuestion
          videoUrl="YGTEXtptvGM"
          title="Self Introduction in English"
          description="Assista atentamente"
          xpReward={10}
          icon="🎯"
          onComplete={handleVideoComplete}
        />
      )}

      {stage === 'choose' && (
        <MultipleChoiceQuestion
          stepLabel="Passo 1"
          title="🧩 Escolha"
          question="Which sentences are useful for introducing yourself?"
          questionPt="Quais frases são úteis para se apresentar em inglês?"
          options={CHOICE_OPTIONS}
          expectedCorrectCount={5}
          icon="🧩"
          onComplete={handleChoiceComplete}
          xpReward={15}
        />
      )}

      {stage === 'listenRepeat' && (
        <ListenRepeatQuestion
          sentences={LISTEN_REPEAT_SENTENCES}
          stepLabel="Passo 2"
          title="Ouça e Repita"
          xpReward={25}
          icon="🎧"
          onComplete={handleListenRepeatComplete}
        />
      )}

      {stage === 'complete' && (
        <div className="space-y-6" style={{ animation: 'fadeIn 0.6s ease-in' }}>
          <div className="p-8 rounded-xl border border-green-400/30 text-center" style={{ background: 'rgba(34,197,94,0.08)' }}>
            <div className="text-5xl mb-4">🏆</div>
            <h3 className="text-3xl font-black text-green-300 mb-3">Video Insight Concluído!</h3>
            <p className="text-blue-200/80 mb-6">Parabéns! Você completou esta atividade!</p>
            <div className="flex justify-center gap-4 mb-6">
              <div className="px-4 py-2 rounded-lg bg-yellow-500/20 border border-yellow-400">
                <p className="text-yellow-300 font-bold">+{xpEarned} XP</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => { deleteCookie('woa_j2_b1_stage'); onComplete(alreadyCompleted ? 0 : xpEarned) }}
            className="w-full font-bold tracking-widest px-8 py-4 rounded-lg text-white transition-all hover:scale-105 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #003AB0, #0066FF)' }}
          >
            ✅ CONTINUAR →
          </button>
        </div>
      )}

      <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }`}</style>
    </div>
  )
}
