'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
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

const DAILY_MODULE_LIMIT = 2

function RedoPremiumModal({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(8px)' }} onClick={onClose}>
      <div className="relative w-full max-w-sm rounded-3xl overflow-hidden" style={{ background: 'linear-gradient(160deg, rgba(30,20,0,0.98), rgba(15,10,0,0.98))', border: '1px solid rgba(255,215,0,0.35)', boxShadow: '0 0 60px rgba(255,180,0,0.18)' }} onClick={e => e.stopPropagation()}>
        <div className="absolute inset-x-0 top-0 h-1 rounded-t-3xl" style={{ background: 'linear-gradient(90deg, #FFD700, #CC8800, #FFD700)' }} />
        <div className="p-8 space-y-5 text-center">
          <button onClick={onClose} className="absolute top-4 right-4 text-white/30 hover:text-white/70 transition-colors text-lg leading-none">✕</button>
          <div className="text-5xl">🔁</div>
          <div>
            <p className="text-[10px] font-black tracking-[0.25em] mb-1" style={{ color: 'rgba(255,215,0,0.6)' }}>REFAZER BLOCO</p>
            <h3 className="text-xl font-black text-white">Recurso Premium</h3>
          </div>
          <p className="text-white/60 text-sm leading-relaxed">
            Refazer blocos já concluídos é exclusivo para assinantes Premium. Pratique quantas vezes quiser!
          </p>
          <div className="space-y-3 pt-1">
            <button
              onClick={() => router.push('/premium')}
              className="w-full py-3.5 rounded-xl font-black text-sm tracking-widest text-black transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #FFD700, #CC8800)', boxShadow: '0 0 24px rgba(255,215,0,0.35)' }}
            >
              🚀 VER PLANOS PREMIUM
            </button>
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl font-bold text-xs tracking-widest transition-all hover:opacity-70"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.35)' }}
            >
              FECHAR
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function DailyLimitModal({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
      <div className="relative w-full max-w-md rounded-3xl overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(5,14,26,0.97), rgba(10,20,40,0.97))', border: '2px solid rgba(255,154,0,0.4)', boxShadow: '0 0 60px rgba(255,154,0,0.15)' }}>
        {/* Header glow */}
        <div className="absolute inset-x-0 top-0 h-1 rounded-t-3xl" style={{ background: 'linear-gradient(90deg, #FF6B00, #FFD700, #FF6B00)' }} />

        <div className="p-8 space-y-6">
          {/* Icon + title */}
          <div className="text-center space-y-3">
            <div className="text-5xl">⏳</div>
            <h2 className="text-2xl font-black tracking-wider text-white">LIMITE DIÁRIO ATINGIDO</h2>
            <p className="text-sm text-blue-200/70 leading-relaxed">
              Você já abriu <span className="text-orange-400 font-bold">{DAILY_MODULE_LIMIT} blocos hoje</span>. No plano gratuito o limite é de {DAILY_MODULE_LIMIT} blocos por dia.
            </p>
          </div>

          {/* Divider */}
          <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,154,0,0.3), transparent)' }} />

          {/* Premium pitch */}
          <div className="rounded-2xl p-5 space-y-3" style={{ background: 'linear-gradient(135deg, rgba(176,80,0,0.2), rgba(255,107,0,0.1))', border: '1px solid rgba(255,154,0,0.3)' }}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">👑</span>
              <div>
                <p className="text-base font-black text-white tracking-wide">PREMIUM — R$ 29,90/mês</p>
                <p className="text-xs text-orange-200/70">Módulos ilimitados por dia</p>
              </div>
            </div>
            <ul className="space-y-2">
              {[
                'Módulos ilimitados por dia',
                'Tutor com IA',
                'Prática de Conversação guiada',
                'Desbloqueio total do app',
                'Sem anúncios',
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm text-orange-100/80">
                  <span className="text-green-400 text-xs">✓</span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* CTAs */}
          <div className="space-y-3">
            <button
              onClick={() => router.push('/premium')}
              className="w-full py-3.5 rounded-xl font-black tracking-widest text-white transition-all hover:scale-105 active:scale-95"
              style={{ background: 'linear-gradient(135deg, #B05000, #FF6B00)', boxShadow: '0 0 24px rgba(255,107,0,0.4)' }}
            >
              👑 VER PLANOS PREMIUM
            </button>
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl text-sm font-bold tracking-widest transition-all hover:scale-105 active:scale-95"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}
            >
              VOLTAR
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

interface UnifiedJourneyFlowProps {
  phaseId: number
}

type GroupCardProps = {
  group: MissionGroupDef
  isCompleted: boolean
  isLocked: boolean
  canStart: boolean
  isPremium: boolean
  onClick: () => void
}

function GroupCard({ group, isCompleted, isLocked, canStart, isPremium, onClick }: GroupCardProps) {
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
            <div className="text-center py-2 rounded-lg" style={{ background: isPremium ? 'rgba(34,197,94,0.2)' : 'rgba(34,197,94,0.12)', border: isPremium ? '1px solid rgb(34,197,94)' : '1px solid rgba(34,197,94,0.4)' }}>
              <p className="text-sm font-bold text-green-300">{'\u2705'} COMPLETO</p>
              <p className="text-xs mt-0.5" style={{ color: isPremium ? 'rgba(74,222,128,0.6)' : 'rgba(255,215,0,0.7)' }}>
                {isPremium ? 'Toque para refazer' : '\ud83d\udc51 Premium para refazer'}
              </p>
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
  const [isPremium, setIsPremium] = useState(false)
  const [dailyAccessedBlocks, setDailyAccessedBlocks] = useState<{ phaseId: number; missionGroupId: number }[]>([])
  const [showDailyLimitModal, setShowDailyLimitModal] = useState(false)
  const [showRedoPremiumModal, setShowRedoPremiumModal] = useState(false)
  const router = useRouter()

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
    fetch('/api/user/subscription')
      .then(r => r.ok ? r.json() : { isPremium: false })
      .then(d => setIsPremium(d.isPremium === true))
      .catch(() => {})
    fetch('/api/mission-groups/daily-access')
      .then(r => r.ok ? r.json() : { accessedBlocks: [] })
      .then(d => setDailyAccessedBlocks(d.accessedBlocks ?? []))
      .catch(() => {})
  }, [])

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

  const handlePremiumRequired = () => {
    router.push('/premium')
  }

  const handleGroupComplete = (xp: number) => {
    if (isRedoing) { setIsRedoing(false); setShowGroups(true); return }
    if (isSavingRef.current) return
    isSavingRef.current = true

    const groupId = currentGroupRef.current
    const newTotal = totalXpRef.current + xp
    setTotalXp(newTotal)

    saveMissionGroupCompletion(groupId, xp).finally(() => {
      isSavingRef.current = false
    })
    setTimeout(() => setGroupCompleted(groupId), 600)

    if (groupId === missionGroups.length - 1) {
      setTimeout(() => { setCompleted(true); setGroupCompleted(null) }, 3600)
    } else {
      setTimeout(() => { setShowGroups(true); setGroupCompleted(null) }, 3600)
    }
  }

  const handleStartMissionGroup = (groupIndex: number, isRedo = false) => {
    if (isRedo && !isPremium) {
      setShowRedoPremiumModal(true)
      return
    }
    if (!isRedo && !isPremium) {
      const alreadyOpenedToday = dailyAccessedBlocks.some(
        b => b.phaseId === phaseId && b.missionGroupId === groupIndex
      )
      if (!alreadyOpenedToday) {
        if (dailyAccessedBlocks.length >= DAILY_MODULE_LIMIT) {
          setShowDailyLimitModal(true)
          return
        }
        // Record access optimistically in local state, then persist in background
        setDailyAccessedBlocks(prev => [...prev, { phaseId, missionGroupId: groupIndex }])
        fetch('/api/mission-groups/daily-access', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phaseId, missionGroupId: groupIndex }),
        }).catch(() => {})
      }
    }
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
    const atDailyLimit = !isPremium && dailyAccessedBlocks.length >= DAILY_MODULE_LIMIT
    const isBlockOpenedToday = (groupId: number) =>
      dailyAccessedBlocks.some(b => b.phaseId === phaseId && b.missionGroupId === groupId)
    return (
      <>
        <div className="space-y-8">
          <div className="p-8 rounded-lg backdrop-blur-md border border-cyan-400/20" style={{ background: 'linear-gradient(135deg, rgba(0,212,255,0.1), rgba(34,197,94,0.05))' }}>
            <h2 className="text-3xl font-black text-white mb-2">{'🌊'} {content.title}</h2>
            <p className="text-blue-200/80">{content.description} {'—'} complete os {missionGroups.length} blocos na sequ{'ê'}ncia!</p>
          </div>

          {/* Daily limit warning banner */}
          {atDailyLimit && (
            <div
              className="flex items-center gap-4 px-5 py-4 rounded-2xl"
              style={{ background: 'linear-gradient(135deg, rgba(176,80,0,0.2), rgba(255,107,0,0.1))', border: '1px solid rgba(255,154,0,0.4)' }}
            >
              <span className="text-2xl flex-shrink-0">⏳</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-orange-300 tracking-wide">LIMITE DIÁRIO ATINGIDO</p>
                <p className="text-xs text-orange-200/70 mt-0.5">Você já abriu {DAILY_MODULE_LIMIT} blocos hoje. Volte amanhã ou assine o Premium.</p>
              </div>
              <button
                onClick={() => setShowDailyLimitModal(true)}
                className="flex-shrink-0 px-4 py-2 rounded-xl text-xs font-black tracking-widest text-white transition-all hover:scale-105 active:scale-95"
                style={{ background: 'linear-gradient(135deg, #B05000, #FF6B00)' }}
              >
                👑 PREMIUM
              </button>
            </div>
          )}
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {missionGroups.slice(0, 3).map((group) => {
                const isCompleted = completedGroupIds.includes(group.id)
                const isLocked = group.id > 0 && !completedGroupIds.includes(group.id - 1) && !isCompleted
                const isBlockedByDailyLimit = atDailyLimit && !isBlockOpenedToday(group.id) && !isCompleted
                const canStart = !isLocked && !isCompleted && !isBlockedByDailyLimit
                return <GroupCard key={group.id} group={group} isCompleted={isCompleted} isLocked={isLocked || isBlockedByDailyLimit} canStart={canStart} isPremium={isPremium} onClick={() => { if (!isLocked && !isBlockedByDailyLimit) handleStartMissionGroup(group.id, isCompleted) }} />
              })}
            </div>
            <div className="flex gap-6 justify-center">
              {missionGroups.slice(3).map((group) => {
                const isCompleted = completedGroupIds.includes(group.id)
                const isLocked = group.id > 0 && !completedGroupIds.includes(group.id - 1) && !isCompleted
                const isBlockedByDailyLimit = atDailyLimit && !isBlockOpenedToday(group.id) && !isCompleted
                const canStart = !isLocked && !isCompleted && !isBlockedByDailyLimit
                return (
                  <div key={group.id} className="w-[calc(33.333%-12px)]" style={{ minWidth: '200px' }}>
                    <GroupCard group={group} isCompleted={isCompleted} isLocked={isLocked || isBlockedByDailyLimit} canStart={canStart} isPremium={isPremium} onClick={() => { if (!isLocked && !isBlockedByDailyLimit) handleStartMissionGroup(group.id, isCompleted) }} />
                  </div>
                )
              })}
            </div>
          </div>
        </div>
        {streakUpdate && <StreakModal status={streakUpdate.status} streak={streakUpdate.streak} recoveryCost={streakUpdate.recoveryCost} onClose={() => setStreakUpdate(null)} />}
        {badgeUnlocked && <BadgeUnlockedModal title={badgeUnlocked.title} challenge={badgeUnlocked.challenge} icon={badgeUnlocked.icon} onClose={() => setBadgeUnlocked(null)} />}
        {showDailyLimitModal && <DailyLimitModal onClose={() => setShowDailyLimitModal(false)} />}
        {showRedoPremiumModal && <RedoPremiumModal onClose={() => setShowRedoPremiumModal(false)} />}
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
          {currentGroup === 0 && <Block1VideoInsight  content={content.block1} phaseId={phaseId} onComplete={handleGroupComplete} onActivityChange={handleActivityChange} alreadyCompleted={isRedoing} isPremium={isPremium} onPremiumRequired={handlePremiumRequired} />}
          {currentGroup === 1 && <Block2LetsReflect    content={content.block2} phaseId={phaseId} onComplete={handleGroupComplete} onActivityChange={handleActivityChange} alreadyCompleted={isRedoing} isPremium={isPremium} onPremiumRequired={handlePremiumRequired} />}
          {currentGroup === 2 && <Block3Vocabulary     content={content.block3} phaseId={phaseId} onComplete={handleGroupComplete} onActivityChange={handleActivityChange} alreadyCompleted={isRedoing} isPremium={isPremium} onPremiumRequired={handlePremiumRequired} />}
          {currentGroup === 3 && <Block4PracticeSpeak  content={content.block4} phaseId={phaseId} onComplete={handleGroupComplete} onActivityChange={handleActivityChange} alreadyCompleted={isRedoing} isPremium={isPremium} onPremiumRequired={handlePremiumRequired} />}
          {currentGroup === 4 && <Block5WOAChallenge   content={content.block5} phaseId={phaseId} onComplete={handleGroupComplete} onActivityChange={handleActivityChange} alreadyCompleted={isRedoing} isPremium={isPremium} onPremiumRequired={handlePremiumRequired} />}
        </div>
        <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }`}</style>
      </div>
      {streakUpdate && <StreakModal status={streakUpdate.status} streak={streakUpdate.streak} recoveryCost={streakUpdate.recoveryCost} onClose={() => setStreakUpdate(null)} />}
      {badgeUnlocked && <BadgeUnlockedModal title={badgeUnlocked.title} challenge={badgeUnlocked.challenge} icon={badgeUnlocked.icon} onClose={() => setBadgeUnlocked(null)} />}
    </>
  )
}
