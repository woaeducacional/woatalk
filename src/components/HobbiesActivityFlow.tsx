'use client'

import { useEffect, useState } from 'react'
import { Activity0VideoInsight, Activity1ChooseSentences, Activity2ListenRepeat, Activity3SelectTwoRepeat, Activity4SpeakOnly, Activity5WOAChallenge } from '@/src/components/activities'
import { MissionGroupsFlow } from '@/src/components/MissionGroupsFlow'

interface HobbiesActivityFlowProps {
  phaseId: number
  userId?: string
}

export function HobbiesActivityFlow({ phaseId, userId }: HobbiesActivityFlowProps) {
  const [showGroups, setShowGroups] = useState(true)
  const [currentActivity, setCurrentActivity] = useState(0)
  const [totalXp, setTotalXp] = useState(0)
  const [completed, setCompleted] = useState(false)
  const [selectedSentences, setSelectedSentences] = useState<Set<string>>(new Set())
  const [phaseAlreadyCompleted, setPhaseAlreadyCompleted] = useState(false)

  // Check if phase is already completed (all 5 mission groups done)
  useEffect(() => {
    const checkPhaseCompletion = async () => {
      try {
        const response = await fetch(`/api/mission-groups/${phaseId}/completed`)
        const completedGroupIds: number[] = await response.json()
        
        // If all 5 groups are completed, show completion screen when explicitly requested
        // But always show mission groups card view first
        if (Array.isArray(completedGroupIds) && completedGroupIds.length === 5) {
          setPhaseAlreadyCompleted(true)
          setTotalXp(140)
          // Keep showGroups = true so user sees the cards with "COMPLETO" badges
        }
      } catch (error) {
        console.error('Failed to check phase completion:', error)
      }
    }

    checkPhaseCompletion()
  }, [phaseId])

  // API would save to activity_progress table
  const saveActivityProgress = async (activityIndex: number, xpEarned: number) => {
    try {
      await fetch(`/api/activity-progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phase_id: phaseId,
          activity_index: activityIndex,
          xp_earned: xpEarned,
          step_completed: 1,
        }),
      })
    } catch (e) {
      console.error('Failed to save progress:', e)
    }
  }

  const handleActivityComplete = (xp: number) => {
    const newTotal = totalXp + xp
    setTotalXp(newTotal)
    saveActivityProgress(currentActivity, xp)

    // Determine which mission group this activity completes
    const getMissionGroupId = (activityIdx: number): number | null => {
      if (activityIdx === 0) return 0 // Watch & Learn
      if (activityIdx === 1) return 1 // Choose & Select
      if (activityIdx === 2) return 2 // Listen & Repeat
      if (activityIdx === 3) return null // Part of group 3, not yet complete
      if (activityIdx === 4) return 3 // Review & Master (complete on activity 4)
      if (activityIdx === 5) return 4 // WOA Challenge
      return null
    }

    const completedGroupId = getMissionGroupId(currentActivity)
    if (completedGroupId !== null) {
      saveMissionGroupCompletion(completedGroupId, newTotal)
    }

    // Check if this is the last activity in the current group
    if (currentActivity === 5) {
      // Last activity overall → show phase completion
      setTimeout(() => {
        setCompleted(true)
      }, 600)
    } else if (isLastActivityInGroup(currentActivity)) {
      // Last activity in this group → return to groups view
      setTimeout(() => {
        setShowGroups(true)
      }, 600)
    } else {
      // Continue to next activity within the same group
      setTimeout(() => {
        setCurrentActivity(currentActivity + 1)
      }, 600)
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
      // The API automatically marks the phase as complete when group 4 is saved
      // setCompleted(true) will be called from handleActivityComplete when activity 5 finishes
    } catch (e) {
      console.error('Failed to save mission group completion:', e)
    }
  }

  const handleActivity3SelectSentences = (sentences: Set<string>) => {
    setSelectedSentences(sentences)
  }

  // Map group index to the first activity of that group
  const getStartingActivity = (groupIndex: number): number => {
    if (groupIndex === 0) return 0 // Watch & Learn → Activity 0
    if (groupIndex === 1) return 1 // Choose & Select → Activity 1
    if (groupIndex === 2) return 2 // Listen & Repeat → Activity 2
    if (groupIndex === 3) return 3 // Review & Master → Activity 3 (then 4)
    if (groupIndex === 4) return 5 // WOA Challenge → Activity 5
    return 0
  }

  // Check if an activity is the last one in its group
  const isLastActivityInGroup = (activityIdx: number): boolean => {
    // Activity 0 → last in group 0
    // Activity 1 → last in group 1
    // Activity 2 → last in group 2
    // Activity 3 → NOT last (group 3 has activities 3 and 4)
    // Activity 4 → last in group 3
    // Activity 5 → last in group 4 (and last overall)
    return activityIdx !== 3
  }

  const handleStartMissionGroup = (groupIndex: number) => {
    // Set the correct starting activity for this group
    setCurrentActivity(getStartingActivity(groupIndex))
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
            onClick={() => window.location.href = '/journey'}
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

  return (
    <div className="space-y-8">
      {/* Progress indicator */}
      <div className="sticky top-0 z-30 backdrop-blur-md p-4 rounded-lg border border-cyan-400/20" style={{ background: 'rgba(5,14,26,0.9)' }}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold text-cyan-300 tracking-widest">ACTIVITY {currentActivity + 1}/6</p>
          <p className="text-sm font-bold text-yellow-400">{totalXp} XP</p>
        </div>
        <div className="flex gap-2">
          {[0, 1, 2, 3, 4, 5].map((idx) => (
            <div
              key={idx}
              className="flex-1 h-2.5 rounded-full transition-all"
              style={{
                background: idx <= currentActivity ? '#00D4FF' : 'rgba(0,212,255,0.2)',
              }}
            />
          ))}
        </div>
      </div>

      {/* Activity content with fade-in animation */}
      <div
        style={{
          animation: 'fadeIn 0.6s ease-in',
        }}
      >
        {currentActivity === 0 && <Activity0VideoInsight onComplete={handleActivityComplete} />}
        {currentActivity === 1 && <Activity1ChooseSentences onComplete={handleActivityComplete} />}
        {currentActivity === 2 && <Activity2ListenRepeat onComplete={handleActivityComplete} />}
        {currentActivity === 3 && <Activity3SelectTwoRepeat onComplete={handleActivityComplete} onSelectSentences={handleActivity3SelectSentences} />}
        {currentActivity === 4 && <Activity4SpeakOnly selectedSentences={selectedSentences} onComplete={handleActivityComplete} />}
        {currentActivity === 5 && <Activity5WOAChallenge selectedSentences={selectedSentences} onComplete={handleActivityComplete} />}
      </div>

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
