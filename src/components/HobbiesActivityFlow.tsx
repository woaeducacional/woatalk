'use client'

import { useEffect, useRef, useState } from 'react'
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
  const [groupCompleted, setGroupCompleted] = useState<number | null>(null)  // Track completed group for celebration screen

  // Refs that are always fresh — prevent stale-closure bugs in callbacks
  const currentGroupRef = useRef(0)
  const totalXpRef = useRef(0)
  const isSavingRef = useRef(false)   // guard against double-calls

  useEffect(() => { currentGroupRef.current = currentGroup }, [currentGroup])
  useEffect(() => { totalXpRef.current = totalXp }, [totalXp])

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

  // XP e moedas por grupo
  const getGroupRewards = (groupId: number): { xp: number; coins: number } => {
    const rewards: Record<number, { xp: number; coins: number }> = {
      0: { xp: 10, coins: 0 },      // Video Insight
      1: { xp: 80, coins: 5 },      // Quote & Reflect
      2: { xp: 85, coins: 5 },      // Learn & Speak (Vocabulary)
      3: { xp: 95, coins: 5 },      // Practice & Speak (Expressions)
      4: { xp: 100, coins: 15 },    // Conversation Challenge
    }
    return rewards[groupId] || { xp: 0, coins: 0 }
  }

  const saveMissionGroupCompletion = async (missionGroupId: number, groupXpEarned: number) => {
    try {
      const rewards = getGroupRewards(missionGroupId)
      await fetch(`/api/mission-groups/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phaseId,
          missionGroupId,
          totalXp: groupXpEarned,  // XP earned in THIS group
          woaCoins: rewards.coins,  // Coins for THIS group
        }),
      })
    } catch (e) {
      console.error('Failed to save mission group completion:', e)
    }
  }

  // ─── Called ONLY by the final CONTINUAR button of each group's last activity ───
  const handleGroupComplete = (xp: number) => {
    // Prevent double-calls (double-tap, fast click, stale event)
    if (isSavingRef.current) return
    isSavingRef.current = true

    // Use refs — always the real current values, not stale closures
    const groupId = currentGroupRef.current
    const newTotal = totalXpRef.current + xp

    setTotalXp(newTotal)

    // Save to DB — current_phase advances ONLY here, once per group completion
    // Pass the XP earned in THIS group (xp), not the cumulative total
    saveMissionGroupCompletion(groupId, xp).finally(() => {
      isSavingRef.current = false
    })

    // Show group completion celebration screen
    setTimeout(() => {
      setGroupCompleted(groupId)
    }, 600)

    if (groupId === 4) {
      // Last group completed → after celebration, phase complete screen will show
      setTimeout(() => {
        setCompleted(true)
        setGroupCompleted(null)
      }, 3600)  // 3 seconds after celebration starts
    } else {
      // Back to groups list after celebration
      setTimeout(() => {
        setShowGroups(true)
        setGroupCompleted(null)
      }, 3600)  // 3 seconds after celebration starts
    }
  }

  const handleStartMissionGroup = (groupIndex: number) => {
    setCurrentGroup(groupIndex)
    currentGroupRef.current = groupIndex
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

  // Show group completion celebration (but not if phase is already complete)
  if (groupCompleted !== null && !completed) {
    const groupRewards = getGroupRewards(groupCompleted)
    const GROUP_NAMES = ['Video Insight Challenge', "Let's Reflect", 'Related Vocabulary', 'Practice & Speak', 'WOA Challenge']
    
    return (
      <div className="space-y-8">
        <div
          className="p-12 rounded-3xl backdrop-blur-md text-center"
          style={{
            background: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(0,212,255,0.1))',
            border: '1px solid #22c55e',
          }}
        >
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-4xl font-black text-white mb-2">{GROUP_NAMES[groupCompleted]} Completo!</h2>
          <p className="text-xl text-blue-200/80 mb-6">
            Você ganhou <span className="text-yellow-400 font-bold">+{groupRewards.xp} XP</span>
          </p>
          {groupRewards.coins > 0 && (
            <div className="inline-block px-8 py-4 rounded-lg bg-yellow-500/20 border border-yellow-400 mb-6">
              <p className="text-lg text-yellow-300 tracking-widest font-bold">
                🪙 +{groupRewards.coins} WOA COINS
              </p>
            </div>
          )}
          <p className="text-blue-200/80 mt-8">Voltando aos grupos...</p>
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

  const GROUP_NAMES = ['Video Insight Challenge', "Let's Reflect", 'Related Vocabulary', 'Practice & Speak', 'WOA Challenge']

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
