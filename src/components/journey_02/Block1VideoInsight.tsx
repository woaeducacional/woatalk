'use client'

import { useState, useEffect } from 'react'
import { VideoWatchQuestion, MultipleChoiceQuestion, ListenRepeatQuestion } from '../questions_structs'
import { getCookie, setCookie, deleteCookie } from '@/lib/utils'
import type { Block1Content } from '@/lib/journeyContent'

interface Block1VideoInsightProps {
  content: Block1Content
  phaseId: number
  onComplete: (xp: number) => void
  onActivityChange?: (current: number, total: number) => void
  alreadyCompleted?: boolean
}

type Stage = 'video' | 'choose' | 'listenRepeat' | 'complete'

export function Block1VideoInsight({ content, phaseId, onComplete, onActivityChange, alreadyCompleted = false }: Block1VideoInsightProps) {
  const cookieKey = `woa_p${phaseId}_b1_stage`
  const [stage, setStage] = useState<Stage>(() => {
    const s = getCookie(cookieKey) as Stage | null
    return (s && s !== 'complete') ? s : 'video'
  })
  const [xpEarned, setXpEarned] = useState(10)

  const STAGE_INDEX: Record<Stage, number> = { video: 1, choose: 2, listenRepeat: 3, complete: 3 }
  useEffect(() => {
    onActivityChange?.(STAGE_INDEX[stage], 3)
    if (stage !== 'complete') setCookie(cookieKey, stage)
  }, [stage])

  const handleVideoComplete = (xp: number) => { setXpEarned((p) => p + xp); setStage('choose') }
  const handleChoiceComplete = (xp: number) => { setXpEarned((p) => p + xp); setStage('listenRepeat') }
  const handleListenRepeatComplete = (xp: number) => { setXpEarned((p) => p + xp); setStage('complete') }

  return (
    <div className="space-y-8">
      {stage === 'video' && (
        <VideoWatchQuestion
          videoUrl={content.videoUrl}
          title={content.videoTitle}
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
          question={content.choiceQuestion}
          questionPt={content.choiceQuestionPt}
          options={content.choiceOptions}
          expectedCorrectCount={content.choiceOptions.filter(o => o.isCorrect).length}
          icon="🧩"
          onComplete={handleChoiceComplete}
          xpReward={15}
        />
      )}

      {stage === 'listenRepeat' && (
        <ListenRepeatQuestion
          sentences={content.listenRepeatSentences}
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
            onClick={() => { deleteCookie(cookieKey); onComplete(alreadyCompleted ? 0 : xpEarned) }}
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
