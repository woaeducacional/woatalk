'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Block1VideoInsight,
  Block2LetsReflect,
  Block3Vocabulary,
  Block4PracticeSpeak,
  Block5WOAChallenge,
} from '@/src/components/journey_02'
import { StreakModal, type StreakUpdateStatus } from '@/src/components/StreakModal'
import { BadgeUnlockedModal } from '@/src/components/BadgeUnlockedModal'
import type { JourneyContent, MissionGroupDef } from '@/lib/journeyContent'

interface UnifiedJourneyFlowProps {
  phaseId: number
}

type GroupCardProps = {
  group: MissionGroupDef
  isCompleted: boolean
  isLocked: boolean
  canStart: boolean
  onClick: () => void
}

function GroupCard({ group, isCompleted, isLocked, canStart, onClick }: GroupCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={isLocked}
      className="relative overflow-hidden rounded-2xl transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 w-full text-left"
    >
      <div className="absolute inset-0" style={{ background: isCompleted || canStart ? `linear-gradient(135deg, ${group.color}20, ${group.color}05)` : 'linear-gradient(135deg, #333333, #1a1a1a)', filter: isLocked ? 'grayscale(100%)' : 'none' }} />
      <div className="absolute inset-0 rounded-2xl border-2 transition-all" style={{ borderColor: isCompleted || canStart ? group.color : '#555555', boxShadow: isCompleted || canStart ? `0 0 20px ${group.color}40` : 'none', filter: isLocked ? 'grayscale(100%)' : 'none' }} />
      <div className="relative p-6 space-y-4 h-full flex flex-col justify-between">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-4xl">{group.icon}</span>
            <span className="text-sm font-black tracking-widest px-2 py-1 rounded-full" style={{ color: isCompleted || canStart ? group.color : '#999999', background: isCompleted || canStart ? `${group.color}20` : '#33333340', border: `1px solid ${isCompleted || canStart ? group.color : '#555555'}` }}>
              {'\u26A1'} {group.xp} XP
            </span>
          </div>
          <h3 className="text-xl font-black" style={{ color: isLocked ? '#999999' : 'white' }}>{group.title}</h3>
          <p className="text-sm" style={{ color: isLocked ? '#666666' : 'rgba(147,197,253,0.7)' }}>{group.description}</p>
        </div>
        <div className="pt-2">
          {isCompleted && (
            <div className="text-center py-2 rounded-lg" style={{ background: 'rgba(34,197,94,0.2)', border: '1px solid rgb(34,197,94)' }}>
              <p className="text-sm font-bold text-green-300">{'\u2705'} COMPLETO</p>
              <p className="text-xs text-green-400/60 mt-0.5">Toque para refazer</p>
            </div>
          )}
          {isLocked && (
            <div className="text-center py-2 rounded-lg" style={{ background: 'rgba(100,100,100,0.2)', border: '1px solid #555555' }}>
              <p className="text-sm font-bold text-gray-400">{'\uD83D\uDD12'} BLOQUEADO</p>
            </div>
          )}
          {canStart && (
            <div className="text-center py-2 rounded-lg font-bold transition-all" style={{ background: `${group.color}20`, border: `1px solid ${group.color}`, color: group.color }}>
              {'\u27A1\uFE0F'} COME{'C'}AR
            </div>
          )}
        </div>
      </div>
    </button>
  )
}

function Toast({ message }: { message: string }) {
  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl font-bold text-white text-sm shadow-2xl"
      style={{ background: 'rgba(239,68,68,0.92)', border: '1px solid rgba(239,68,68,0.4)', backdropFilter: 'blur(8px)' }}
    >
      {message}
    </div>
  )
}

export function UnifiedJourneyFlow({ phaseId }: UnifiedJourneyFlowProps) {
  const [content, setContent] = useState<JourneyContent | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [showGroups, setShowGroups] = useState(true)
  const [currentGroup, setCurrentGroup] = useState(0)
  const [totalXp, setTotalXp] = useState(0)
  const [completed, setCompleted] = useState(false)
  const [groupCompleted, setGroupCompleted] = useState<number | null>(null)
  const [completedGroupIds, setCompletedGroupIds] = useState<number[]>([])
  const [streakUpdate, setStreakUpdate] = useState<{ status: StreakUpdateStatus; streak: number; recoveryCost: number } | null>(null)
  const [badgeUnlocked, setBadgeUnlocked] = useState<{ title: string; challenge: string; icon: string } | null>(null)
  const [activityInfo, setActivityInfo] = useState<{ current: number; total: number }>({ current: 1, total: 1 })
  const [isRedoing, setIsRedoing] = useState(false)

  const currentGroupRef = useRef(0)
  const totalXpRef = useRef(0)
  const isSavingRef = useRef(false)

  useEffect(() => { currentGroupRef.current = currentGroup }, [currentGroup])
  useEffect(() => { totalXpRef.current = totalXp }, [totalXp])

  useEffect(() => {
    fetch(`/api/journey-content/${phaseId}`)
      .then(r => { if (!r.ok) throw new Error('not_found'); return r.json() })
      .then((data: JourneyContent) => setContent(data))
      .catch(() => setLoadError(true))
  }, [phaseId])

  useEffect(() => {
    fetch(`/api/mission-groups/${phaseId}/completed`)
      .then(r => r.ok ? r.json() : [])
      .then((ids: number[]) => {
        if (Array.isArray(ids)) {
          setCompletedGroupIds(ids)
          if (ids.length === 5) setTotalXp(410)
        }
      })
      .catch(() => {})
  }, [phaseId])

  if (loadError) return <Toast message="Jornada não encontrada" />

  if (!content) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mx-auto" />
          <p className="text-blue-200/60 text-sm">Carregando jornada...</p>
        </div>
      </div>
    )
  }

  const missionGroups = content.mission_groups
  const groupNames = missionGroups.map(g => g.title)
  const getGroupRewards = (groupId: number) => missionGroups[groupId] ?? { xp: 0, coins: 0 }

  const BADGE_DEFINITIONS: Record<string, { title: string; challenge: string; icon: string }> = {
    first_step: { title: 'O Primeiro Passo', challenge: 'Concluiu o primeiro bloco de atividades', icon: '\uD83D\uDE80' },
  }

  const saveMissionGroupCompletion = async (missionGroupId: number, groupXpEarned: number) => {
    try {
      const rewards = getGroupRewards(missionGroupId)
      const res = await fetch('/api/mission-groups/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phaseId, missionGroupId, totalXp: groupXpEarned, woaCoins: rewards.coins }),
      })
      const data = await res.json()
      if (data.newBadge && BADGE_DEFINITIONS[data.newBadge]) setBadgeUnlocked(BADGE_DEFINITIONS[data.newBadge])
      const r2 = await fetch(`/api/mission-groups/${phaseId}/completed`)
      const ids: number[] = await r2.json()
      if (Array.isArray(ids)) setCompletedGroupIds(ids)
    } catch (e) {
      console.error('Failed to save mission group completion:', e)
    }
  }

  const handleActivityChange = async (current: number, total: number) => {
    setActivityInfo({ current, total })
    if (current <= 1) return
    try {
      const res = await fetch('/api/streak/update', { method: 'POST' })
      const data = await res.json()
      if (data.status && data.status !== 'already_counted') {
        setStreakUpdate({ status: data.status, streak: data.streak, recoveryCost: data.recoveryCost ?? 4 })
      }
    } catch { /* silent */ }
  }

  const handleGroupComplete = (xp: number) => {
    if (isRedoing) { setIsRedoing(false); setShowGroups(true); return }
    if (isSavingRef.current) return
    isSavingRef.current = true

    const groupId = currentGroupRef.current
    const newTotal = totalXpRef.current + xp
    setTotalXp(newTotal)

    saveMissionGroupCompletion(groupId, xp).finally(() => { isSavingRef.current = false })
    setTimeout(() => setGroupCompleted(groupId), 600)

    if (groupId === missionGroups.length - 1) {
      setTimeout(() => { setCompleted(true); setGroupCompleted(null) }, 3600)
    } else {
      setTimeout(() => { setShowGroups(true); setGroupCompleted(null) }, 3600)
    }
  }

  const handleStartMissionGroup = (groupIndex: number, isRedo = false) => {
    setCurrentGroup(groupIndex)
    currentGroupRef.current = groupIndex
    setIsRedoing(isRedo)
    setActivityInfo({ current: 1, total: 1 })
    setShowGroups(false)
  }

  // Phase complete
  if (completed) {
    return (
      <>
        <div className="p-12 rounded-3xl backdrop-blur-md text-center" style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(0,212,255,0.1))', border: '1px solid #22c55e' }}>
          <div className="text-6xl mb-4">{'\uD83C\uDFC6'}</div>
          <h2 className="text-4xl font-black text-white mb-2">{content.title} {'\u2014'} Completo!</h2>
          <p className="text-xl text-blue-200/80 mb-6">You earned <span className="text-yellow-400 font-bold">{totalXp} XP</span> in this unit!</p>
          <div className="inline-block px-8 py-4 rounded-lg bg-yellow-500/20 border border-yellow-400 mb-8">
            <p className="text-lg text-yellow-300 tracking-widest font-bold">{'\uD83E\uDE99'} +15 WOA COINS</p>
          </div>
          <button onClick={() => window.location.href = '/dashboard'} className="w-full font-bold tracking-widest px-8 py-4 rounded-lg text-white transition-all hover:scale-105 active:scale-95" style={{ background: 'linear-gradient(135deg, #003AB0, #0066FF)', border: '2px solid #00D4FF' }}>
            {'\u2190'} BACK TO JOURNEY
          </button>
        </div>
        {streakUpdate && <StreakModal status={streakUpdate.status} streak={streakUpdate.streak} recoveryCost={streakUpdate.recoveryCost} onClose={() => setStreakUpdate(null)} />}
        {badgeUnlocked && <BadgeUnlockedModal title={badgeUnlocked.title} challenge={badgeUnlocked.challenge} icon={badgeUnlocked.icon} onClose={() => setBadgeUnlocked(null)} />}
      </>
    )
  }

  // Group completion celebration
  if (groupCompleted !== null) {
    const rewards = getGroupRewards(groupCompleted)
    return (
      <>
        <div className="p-12 rounded-3xl backdrop-blur-md text-center" style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(0,212,255,0.1))', border: '1px solid #22c55e' }}>
          <div className="text-6xl mb-4">{'\uD83C\uDF89'}</div>
          <h2 className="text-4xl font-black text-white mb-2">{groupNames[groupCompleted]} Completo!</h2>
          <p className="text-xl text-blue-200/80 mb-6">Voc{'e\u0302'} ganhou <span className="text-yellow-400 font-bold">+{rewards.xp} XP</span></p>
          {rewards.coins > 0 && (
            <div className="inline-block px-8 py-4 rounded-lg bg-yellow-500/20 border border-yellow-400 mb-6">
              <p className="text-lg text-yellow-300 tracking-widest font-bold">{'\uD83E\uDE99'} +{rewards.coins} WOA COINS</p>
            </div>
          )}
          <p className="text-blue-200/80 mt-8">Voltando aos grupos...</p>
        </div>
        {streakUpdate && <StreakModal status={streakUpdate.status} streak={streakUpdate.streak} recoveryCost={streakUpdate.recoveryCost} onClose={() => setStreakUpdate(null)} />}
        {badgeUnlocked && <BadgeUnlockedModal title={badgeUnlocked.title} challenge={badgeUnlocked.challenge} icon={badgeUnlocked.icon} onClose={() => setBadgeUnlocked(null)} />}
      </>
    )
  }

  // Groups list
  if (showGroups) {
    return (
      <>
        <div className="space-y-8">
          <div className="p-8 rounded-lg backdrop-blur-md border border-cyan-400/20" style={{ background: 'linear-gradient(135deg, rgba(0,212,255,0.1), rgba(34,197,94,0.05))' }}>
            <h2 className="text-3xl font-black text-white mb-2">{'\uD83C\uDF0A'} {content.title}</h2>
            <p className="text-blue-200/80">{content.description} {'\u2014'} complete os {missionGroups.length} blocos na sequ{'e\u0302'}ncia!</p>
          </div>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {missionGroups.slice(0, 3).map((group) => {
                const isCompleted = completedGroupIds.includes(group.id)
                const isLocked = group.id > 0 && !completedGroupIds.includes(group.id - 1) && !isCompleted
                const canStart = !isLocked && !isCompleted
                return <GroupCard key={group.id} group={group} isCompleted={isCompleted} isLocked={isLocked} canStart={canStart} onClick={() => { if (!isLocked) handleStartMissionGroup(group.id, isCompleted) }} />
              })}
            </div>
            <div className="flex gap-6 justify-center">
              {missionGroups.slice(3).map((group) => {
                const isCompleted = completedGroupIds.includes(group.id)
                const isLocked = group.id > 0 && !completedGroupIds.includes(group.id - 1) && !isCompleted
                const canStart = !isLocked && !isCompleted
                return (
                  <div key={group.id} className="w-[calc(33.333%-12px)]" style={{ minWidth: '200px' }}>
                    <GroupCard group={group} isCompleted={isCompleted} isLocked={isLocked} canStart={canStart} onClick={() => { if (!isLocked) handleStartMissionGroup(group.id, isCompleted) }} />
                  </div>
                )
              })}
            </div>
          </div>
        </div>
        {streakUpdate && <StreakModal status={streakUpdate.status} streak={streakUpdate.streak} recoveryCost={streakUpdate.recoveryCost} onClose={() => setStreakUpdate(null)} />}
        {badgeUnlocked && <BadgeUnlockedModal title={badgeUnlocked.title} challenge={badgeUnlocked.challenge} icon={badgeUnlocked.icon} onClose={() => setBadgeUnlocked(null)} />}
      </>
    )
  }

  // Active block
  return (
    <>
      <div className="space-y-8">
        <div className="sticky top-0 z-30 backdrop-blur-md px-4 pt-3 pb-3 rounded-lg border border-cyan-400/20" style={{ background: 'rgba(5,14,26,0.9)' }}>
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-blue-300/70 tracking-widest uppercase">{'\uD83C\uDF0A'} {content.title}</p>
            <p className="text-sm font-bold text-yellow-400">{totalXp} XP</p>
          </div>
          <p className="text-sm font-bold text-cyan-300 tracking-wide mb-1">
            Bloco {currentGroup + 1} de {missionGroups.length} {'\u2014'} {groupNames[currentGroup]}
          </p>
          <div className="flex items-center gap-2 mb-2">
            <p className="text-xs text-blue-200/70">Atividade {activityInfo.current} de {activityInfo.total}</p>
            <div className="flex-1 h-1.5 rounded-full bg-cyan-400/20 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-300" style={{ width: `${(activityInfo.current / activityInfo.total) * 100}%`, background: '#00D4FF' }} />
            </div>
          </div>
          <div className="flex gap-2">
            {missionGroups.map((_, idx) => (
              <div key={idx} className="flex-1 h-2 rounded-full transition-all" style={{ background: idx < currentGroup ? '#22c55e' : idx === currentGroup ? '#00D4FF' : 'rgba(0,212,255,0.2)' }} />
            ))}
          </div>
          {isRedoing && (
            <div className="mt-2 text-center text-xs font-bold tracking-widest" style={{ color: '#c084fc' }}>
              {'\uD83D\uDD01'} REFAZENDO {'\u2014'} nenhum XP ser{'a\u0301'} ganho
            </div>
          )}
        </div>
        <div style={{ animation: 'fadeIn 0.6s ease-in' }}>
          {currentGroup === 0 && <Block1VideoInsight  content={content.block1} phaseId={phaseId} onComplete={handleGroupComplete} onActivityChange={handleActivityChange} alreadyCompleted={isRedoing} />}
          {currentGroup === 1 && <Block2LetsReflect    content={content.block2} phaseId={phaseId} onComplete={handleGroupComplete} onActivityChange={handleActivityChange} alreadyCompleted={isRedoing} />}
          {currentGroup === 2 && <Block3Vocabulary     content={content.block3} phaseId={phaseId} onComplete={handleGroupComplete} onActivityChange={handleActivityChange} alreadyCompleted={isRedoing} />}
          {currentGroup === 3 && <Block4PracticeSpeak  content={content.block4} phaseId={phaseId} onComplete={handleGroupComplete} onActivityChange={handleActivityChange} alreadyCompleted={isRedoing} />}
          {currentGroup === 4 && <Block5WOAChallenge   content={content.block5} phaseId={phaseId} onComplete={handleGroupComplete} onActivityChange={handleActivityChange} alreadyCompleted={isRedoing} />}
        </div>
        <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }`}</style>
      </div>
      {streakUpdate && <StreakModal status={streakUpdate.status} streak={streakUpdate.streak} recoveryCost={streakUpdate.recoveryCost} onClose={() => setStreakUpdate(null)} />}
      {badgeUnlocked && <BadgeUnlockedModal title={badgeUnlocked.title} challenge={badgeUnlocked.challenge} icon={badgeUnlocked.icon} onClose={() => setBadgeUnlocked(null)} />}
    </>
  )
}
