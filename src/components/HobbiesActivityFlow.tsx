'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Block1VideoInsight,
  Block2LetsReflect,
  Block3Vocabulary,
  Block4PracticeSpeak,
  Block5WOAChallenge,
} from '@/src/components/journey_01'
import { MissionGroupsFlow } from '@/src/components/MissionGroupsFlow'
import { StreakModal, type StreakUpdateStatus } from '@/src/components/StreakModal'
import { BadgeUnlockedModal } from '@/src/components/BadgeUnlockedModal'

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
  const [streakUpdate, setStreakUpdate] = useState<{ status: StreakUpdateStatus; streak: number; recoveryCost: number } | null>(null)
  const [badgeUnlocked, setBadgeUnlocked] = useState<{ title: string; challenge: string; icon: string } | null>(null)
  const [activityInfo, setActivityInfo] = useState<{ current: number; total: number }>({ current: 1, total: 1 })

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

  const BADGE_DEFINITIONS: Record<string, { title: string; challenge: string; icon: string }> = {
    first_step: { title: 'O Primeiro Passo', challenge: 'Concluiu o primeiro bloco de atividades', icon: '🚀' },
  }

  const saveMissionGroupCompletion = async (missionGroupId: number, groupXpEarned: number) => {
    try {
      const rewards = getGroupRewards(missionGroupId)
      const res = await fetch(`/api/mission-groups/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phaseId,
          missionGroupId,
          totalXp: groupXpEarned,
          woaCoins: rewards.coins,
        }),
      })
      const data = await res.json()
      if (data.newBadge && BADGE_DEFINITIONS[data.newBadge]) {
        setBadgeUnlocked(BADGE_DEFINITIONS[data.newBadge])
      }
    } catch (e) {
      console.error('Failed to save mission group completion:', e)
    }
  }

  // Called when any individual activity step is completed inside a group
  const handleActivityChange = async (current: number, total: number) => {
    setActivityInfo({ current, total })
    // current > 1 means at least one activity was completed
    if (current <= 1) return
    try {
      const res = await fetch('/api/streak/update', { method: 'POST' })
      const data = await res.json()
      if (data.status && data.status !== 'already_counted') {
        setStreakUpdate({ status: data.status, streak: data.streak, recoveryCost: data.recoveryCost ?? 4 })
      }
    } catch (e) {
      console.error('Failed to update streak:', e)
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
    setActivityInfo({ current: 1, total: 1 })
    setShowGroups(false)
  }

  if (completed) {
    return (
      <>
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
        {streakUpdate && (
          <StreakModal
            status={streakUpdate.status}
            streak={streakUpdate.streak}
            recoveryCost={streakUpdate.recoveryCost}
            onClose={() => setStreakUpdate(null)}
          />
        )}
        {badgeUnlocked && (
          <BadgeUnlockedModal
            title={badgeUnlocked.title}
            challenge={badgeUnlocked.challenge}
            icon={badgeUnlocked.icon}
            onClose={() => setBadgeUnlocked(null)}
          />
        )}
      </>
    )
  }

  // Show group completion celebration (but not if phase is already complete)
  if (groupCompleted !== null && !completed) {
    const groupRewards = getGroupRewards(groupCompleted)
    const GROUP_NAMES = ['Video Insight Challenge', "Let's Reflect", 'Related Vocabulary', 'Practice & Speak', 'WOA Challenge']
    
    return (
      <>
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
        {streakUpdate && (
          <StreakModal
            status={streakUpdate.status}
            streak={streakUpdate.streak}
            recoveryCost={streakUpdate.recoveryCost}
            onClose={() => setStreakUpdate(null)}
          />
        )}
        {badgeUnlocked && (
          <BadgeUnlockedModal
            title={badgeUnlocked.title}
            challenge={badgeUnlocked.challenge}
            icon={badgeUnlocked.icon}
            onClose={() => setBadgeUnlocked(null)}
          />
        )}
      </>
    )
  }

  // Show mission groups first
  if (showGroups) {
    return (
      <>
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
        {streakUpdate && (
          <StreakModal
            status={streakUpdate.status}
            streak={streakUpdate.streak}
            recoveryCost={streakUpdate.recoveryCost}
            onClose={() => setStreakUpdate(null)}
          />
        )}
        {badgeUnlocked && (
          <BadgeUnlockedModal
            title={badgeUnlocked.title}
            challenge={badgeUnlocked.challenge}
            icon={badgeUnlocked.icon}
            onClose={() => setBadgeUnlocked(null)}
          />
        )}
      </>
    )
  }

  const GROUP_NAMES = ['Video Insight', "Let's Reflect", 'Vocabulário', 'Praticar & Falar', 'WOA Challenge']
  const JOURNEY_NAME = 'Hobbies'

  return (
    <>
      <div className="space-y-8">
      {/* Progress indicator */}
      <div className="sticky top-0 z-30 backdrop-blur-md px-4 pt-3 pb-3 rounded-lg border border-cyan-400/20" style={{ background: 'rgba(5,14,26,0.9)' }}>
        {/* Row 1: Journey + XP */}
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs text-blue-300/70 tracking-widest uppercase">🗺 Jornada: {JOURNEY_NAME}</p>
          <p className="text-sm font-bold text-yellow-400">{totalXp} XP</p>
        </div>
        {/* Row 2: Block name */}
        <p className="text-sm font-bold text-cyan-300 tracking-wide mb-1">
          Bloco {currentGroup + 1} de 5 &mdash; {GROUP_NAMES[currentGroup]}
        </p>
        {/* Row 3: Activity progress */}
        <div className="flex items-center gap-2 mb-2">
          <p className="text-xs text-blue-200/70">
            Atividade {activityInfo.current} de {activityInfo.total}
          </p>
          <div className="flex-1 h-1.5 rounded-full bg-cyan-400/20 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${(activityInfo.current / activityInfo.total) * 100}%`, background: '#00D4FF' }}
            />
          </div>
        </div>
        {/* Row 4: Block segment pills */}
        <div className="flex gap-2">
          {[0, 1, 2, 3, 4].map((idx) => (
            <div
              key={idx}
              className="flex-1 h-2 rounded-full transition-all"
              style={{
                background: idx < currentGroup ? '#22c55e' : idx === currentGroup ? '#00D4FF' : 'rgba(0,212,255,0.2)',
              }}
            />
          ))}
        </div>
      </div>

      {/* Activity content */}
      <div style={{ animation: 'fadeIn 0.6s ease-in' }}>
        {currentGroup === 0 && <Block1VideoInsight  onComplete={handleGroupComplete} onActivityChange={handleActivityChange} />}
        {currentGroup === 1 && <Block2LetsReflect    onComplete={handleGroupComplete} onActivityChange={handleActivityChange} />}
        {currentGroup === 2 && <Block3Vocabulary     onComplete={handleGroupComplete} onActivityChange={handleActivityChange} />}
        {currentGroup === 3 && <Block4PracticeSpeak  onComplete={handleGroupComplete} onActivityChange={handleActivityChange} />}
        {currentGroup === 4 && <Block5WOAChallenge   onComplete={handleGroupComplete} onActivityChange={handleActivityChange} />}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
      {streakUpdate && (
        <StreakModal
          status={streakUpdate.status}
          streak={streakUpdate.streak}
          recoveryCost={streakUpdate.recoveryCost}
          onClose={() => setStreakUpdate(null)}
        />
      )}
      {badgeUnlocked && (
        <BadgeUnlockedModal
          title={badgeUnlocked.title}
          challenge={badgeUnlocked.challenge}
          icon={badgeUnlocked.icon}
          onClose={() => setBadgeUnlocked(null)}
        />
      )}
    </>
  )
}
