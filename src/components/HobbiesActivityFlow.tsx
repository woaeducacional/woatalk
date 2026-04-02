'use client'

import { useEffect, useState } from 'react'
import { Activity0VideoInsight } from '@/src/components/activities'
import { Activity1Quote } from '@/src/components/activities/Activity1Quote'
import { Activity2Vocabulary } from '@/src/components/activities/Activity2Vocabulary'
import { Activity3Expressions } from '@/src/components/activities/Activity3Expressions'
import { Activity4Conversation } from '@/src/components/activities/Activity4Conversation'
import { MissionGroupsFlow } from '@/src/components/MissionGroupsFlow'

interface HobbiesActivityFlowProps {
  phaseId: number
  userId?: string
}

export function HobbiesActivityFlow({ phaseId, userId }: HobbiesActivityFlowProps) {
  const [showGroups, setShowGroups] = useState(true)
  const [currentGroup, setCurrentGroup] = useState(0)
  const [totalXp, setTotalXp] = useState(0)
  const [completed, setCompleted] = useState(false)
  const [phaseAlreadyCompleted, setPhaseAlreadyCompleted] = useState(false)

  // Check if phase is already completed (all 5 mission groups done)
  useEffect(() => {
    const checkPhaseCompletion = async () => {
      try {
        const response = await fetch(`/api/mission-groups/${phaseId}/completed`)
        const completedGroupIds: number[] = await response.json()
        
        if (Array.isArray(completedGroupIds) && completedGroupIds.length === 5) {
          setPhaseAlreadyCompleted(true)
          setTotalXp(330)
        }
      } catch (error) {
        console.error('Failed to check phase completion:', error)
      }
    }

    checkPhaseCompletion()
  }, [phaseId])

  const handleGroupComplete = (xp: number) => {
    const newTotal = totalXp + xp
    setTotalXp(newTotal)

    // Save mission group completion
    saveMissionGroupCompletion(currentGroup, newTotal)

    if (currentGroup === 4) {
      // Last group → show phase completion
      setTimeout(() => setCompleted(true), 600)
    } else {
      // Return to groups view
      setTimeout(() => setShowGroups(true), 600)
    }
  }

  const saveMissionGroupCompletion = async (missionGroupId: number, currentTotalXp: number) => {
    try {
      const isLastGroup = missionGroupId === 4
      await fetch(`/api/mission-groups/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phaseId,
          missionGroupId,
          totalXp: isLastGroup ? currentTotalXp : undefined,
          woaCoins: isLastGroup ? 5 : undefined,
        }),
      })
    } catch (e) {
      console.error('Failed to save mission group completion:', e)
    }
  }

  const handleStartMissionGroup = (groupIndex: number) => {
    setCurrentGroup(groupIndex)
    setShowGroups(false)
  }

  if (completed) {
    return (
      <div className="space-y-8">
        <div
          className="p-12 rounded-3xl backdrop-blur-md text-center"
          style={{
            background: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(0,212,255,0.1))',
            border: '1px solid #22c55e',
          }}
        >
          <div className="text-6xl mb-4">🏆</div>
          <h2 className="text-4xl font-black text-white mb-2">Fase Completa!</h2>
          <p className="text-xl text-blue-200/80 mb-6">
            You earned <span className="text-yellow-400 font-bold">{totalXp} XP</span> in this unit!
          </p>
          <div className="inline-block px-8 py-4 rounded-lg bg-yellow-500/20 border border-yellow-400 mb-6">
            <p className="text-lg text-yellow-300 tracking-widest font-bold">
              🪙 +5 WOA COINS
            </p>
          </div>
          <div className="space-y-2 text-base text-blue-200/80 mb-8">
            <p>🔥 You can now talk about your hobbies in English</p>
            <p>🔥 You practiced like a real speaker</p>
            <p>🔥 You are improving step by step</p>
          </div>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="w-full font-bold tracking-widest px-8 py-4 rounded-lg text-white transition-all hover:scale-105 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #003AB0, #0066FF)',
              border: '2px solid #00D4FF',
            }}
          >
            ← BACK TO JOURNEY
          </button>
        </div>
      </div>
    )
  }

  // Show mission groups first
  if (showGroups) {
    return (
      <div className="space-y-8">
        <div
          className="p-8 rounded-lg backdrop-blur-md border border-cyan-400/20"
          style={{ background: 'linear-gradient(135deg, rgba(0,212,255,0.1), rgba(34,197,94,0.05))' }}
        >
          <h2 className="text-3xl font-black text-white mb-2">🎯 Grupos de Missões</h2>
          <p className="text-blue-200/80">Completa os grupos na sequência para desbloquear novas habilidades!</p>
        </div>
        <MissionGroupsFlow phaseId={phaseId} onStartGroup={handleStartMissionGroup} />
      </div>
    )
  }

  const GROUP_NAMES = ['Watch & Learn', "Let's Reflect", 'Learn & Speak', 'Practice & Speak', 'Conversation Challenge']

  return (
    <div className="space-y-8">
      {/* Progress indicator */}
      <div className="sticky top-0 z-30 backdrop-blur-md p-4 rounded-lg border border-cyan-400/20" style={{ background: 'rgba(5,14,26,0.9)' }}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold text-cyan-300 tracking-widest">{GROUP_NAMES[currentGroup]}</p>
          <p className="text-sm font-bold text-yellow-400">{totalXp} XP</p>
        </div>
        <div className="flex gap-2">
          {[0, 1, 2, 3, 4].map((idx) => (
            <div
              key={idx}
              className="flex-1 h-2.5 rounded-full transition-all"
              style={{
                background: idx <= currentGroup ? '#00D4FF' : 'rgba(0,212,255,0.2)',
              }}
            />
          ))}
        </div>
      </div>

      {/* Activity content */}
      <div style={{ animation: 'fadeIn 0.6s ease-in' }}>
        {currentGroup === 0 && <Activity0VideoInsight onComplete={handleGroupComplete} />}
        {currentGroup === 1 && <Activity1Quote onComplete={handleGroupComplete} />}
        {currentGroup === 2 && <Activity2Vocabulary onComplete={handleGroupComplete} />}
        {currentGroup === 3 && <Activity3Expressions onComplete={handleGroupComplete} />}
        {currentGroup === 4 && <Activity4Conversation onComplete={handleGroupComplete} />}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
