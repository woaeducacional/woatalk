'use client'

import { useState, useEffect } from 'react'
import { VideoWatchQuestion, MultipleChoiceQuestion, ListenRepeatQuestion, type ChoiceOption } from '../questions_structs'
import { getCookie, setCookie, deleteCookie } from '@/lib/utils'

interface Block1VideoInsightProps {
  onComplete: (xp: number) => void
  onActivityChange?: (current: number, total: number) => void
}

// Dados das sentenças para escolha (com ids e marcação de correto)
const CHOICE_OPTIONS: ChoiceOption[] = [
  { id: 1, text: 'I go to the gym.', isCorrect: true },
  { id: 2, text: 'I watch movies.', isCorrect: true },
  { id: 3, text: 'I have a meeting at 9 a.m.', isCorrect: false },
  { id: 4, text: 'I play soccer.', isCorrect: true },
  { id: 5, text: 'She works in an office.', isCorrect: false },
  { id: 6, text: 'I listen to music.', isCorrect: true },
  { id: 7, text: 'I need to buy food.', isCorrect: false },
  { id: 8, text: 'I read books.', isCorrect: true },
]

const LISTEN_REPEAT_SENTENCES = [
  'I watch movies.',
  'I listen to music.',
  'I play soccer.',
  'I read books.',
  'I learn new things.',
  'I travel on weekends.',
  'I spend time with my family.',
  'I go to the gym.',
]

type Stage = 'video' | 'choose' | 'listenRepeat' | 'complete'

export function Block1VideoInsight({ onComplete, onActivityChange }: Block1VideoInsightProps) {
  const [stage, setStage] = useState<Stage>(() => {
    const s = getCookie('woa_b1_stage') as Stage | null
    return (s && s !== 'complete') ? s : 'video'
  })
  const [xpEarned, setXpEarned] = useState(10) // Video = 10 XP

  const STAGE_INDEX: Record<Stage, number> = { video: 1, choose: 2, listenRepeat: 3, complete: 3 }
  useEffect(() => {
    onActivityChange?.(STAGE_INDEX[stage], 3)
    if (stage !== 'complete') setCookie('woa_b1_stage', stage)
  }, [stage])

  // Handler de conclusão do vídeo
  const handleVideoComplete = (xpGained: number) => {
    setXpEarned((p) => p + xpGained)
    setStage('choose')
  }

  // Handler de conclusão da escolha
  const handleChoiceComplete = (xpGained: number) => {
    setXpEarned((p) => p + xpGained)
    setStage('listenRepeat')
  }

  // Handler de conclusão do Listen & Repeat
  const handleListenRepeatComplete = (xpGained: number) => {
    setXpEarned((p) => p + xpGained)
    setStage('complete')
  }

  return (
    <div className="space-y-8">
      {/* STAGE 1: VIDEO */}
      {stage === 'video' && (
        <VideoWatchQuestion
          videoUrl="3SUcWS3WHPY"
          title="Talking About Hobbies"
          description="Assista atentamente"
          xpReward={10}
          icon="🎯"
          onComplete={handleVideoComplete}
        />
      )}

      {/* STAGE 2: CHOOSE */}
      {stage === 'choose' && (
        <MultipleChoiceQuestion
          stepLabel="Passo 1"
          title="🧩 Escolha"
          question="Which sentences are useful for talking about hobbies?"
          questionPt="Quais frases são úteis para falar sobre hobbies?"
          options={CHOICE_OPTIONS}
          expectedCorrectCount={5}
          icon="🧩"
          onComplete={handleChoiceComplete}
          xpReward={15}
        />
      )}

      {/* STAGE 3: LISTEN & REPEAT */}
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

      {/* STAGE 4: COMPLETE */}
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
            onClick={() => { deleteCookie('woa_b1_stage'); onComplete(xpEarned) }}
            className="w-full font-bold tracking-widest px-8 py-4 rounded-lg text-white transition-all hover:scale-105 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #003AB0, #0066FF)' }}
          >
            ✅ CONTINUAR →
          </button>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
