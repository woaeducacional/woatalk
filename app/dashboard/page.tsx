'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import Image from 'next/image'
import { Button } from '@/src/components/ui/Button'
import Link from 'next/link'
import { playClick, playBubble } from '@/lib/sounds'
import { EagleTip } from '@/src/components/EagleTip'
import { BadgesModal } from '@/src/components/BadgesModal'
import { NotificationBell } from '@/src/components/NotificationBell'
import { calcLevel } from '@/lib/level'
import { resolveAvatarUrl } from '@/lib/avatarStorage'
import { TUTOR_THEMES, searchTutorThemes, getTutorThemeById } from '@/lib/tutorThemes'
import { useVoiceRecorder } from '@/src/hooks/useVoiceRecorder'
import { blobToWavBase64 } from '@/src/lib/audioUtils'
import { transcribeBlob, transcribeFreeBlob, isIOS } from '@/src/lib/transcriptionService'

interface TickerPost {
  id: string
  post_type: string
  payload: Record<string, unknown>
  created_at: string
  users: { id: string; name: string; avatar_url: string | null }
}

type ChallengePeriod = 'daily' | 'weekly' | 'monthly'

type ChallengeGoal = {
  key: string
  label: string
  current: number
  target: number
  suffix: string
  color: string
  note?: string
}

type JourneyItem = { phase_id: number; title: string; description: string; blocked: boolean; is_pro: boolean; icon_url?: string | null }

type RankingUser = { id: string; name: string; xp_total: number; avatar_url: string | null }

const OCEAN_ICONS_DEFAULT = '/images/jornada-secreta.png'

const CHALLENGE_DEFINITIONS: Record<ChallengePeriod, {
  title: string
  subtitle: string
  reward: string
  description: string[]
}> = {
  daily: {
    title: 'DESAFIO DIÁRIO',
    subtitle: 'Desafio mínimo recomendado',
    reward: 'XP + WOA Coins + Streak',
    description: [
      'Completar 1 missão',
      'Fazer 1 comentário em uma atividade de outro usuário',
      'Curtir 3 atividades de outros usuários',
    ],
  },
  weekly: {
    title: 'DESAFIO SEMANAL',
    subtitle: 'Desafio mínimo recomendado',
    reward: 'XP + WOA Coins + Badge semanal',
    description: [
      'Completar 7 missões',
      'Fazer 7 comentários em atividades de outros usuários',
      'Curtir 21 atividades',
      'Assistir 1 aula no WOA Play e realizar as práticas',
      'Manter o streak de 7 dias',
    ],
  },
  monthly: {
    title: 'DESAFIO MENSAL',
    subtitle: 'Desafio mínimo recomendado',
    reward: 'XP + WOA Coins + Badge mensal',
    description: [
      'Completar 28 missões',
      'Fazer 30 comentários',
      'Curtir 90 atividades',
      'Assistir 6 aulas no WOA Play e realizar as práticas',
      'Manter o streak durante o mês',
    ],
  },
}

function getChallengeGoals({ missions, comments, likes, streak, woaPlayLessons }: {
  missions: number
  comments: number
  likes: number
  streak: number
  woaPlayLessons: number
}) {
  const clamp = (value: number, max: number) => Math.max(0, Math.min(value, max))

  return {
    daily: [
      { key: 'missions', label: 'Missões', current: clamp(missions, 1), target: 1, suffix: '', color: '#00D4FF', note: 'Conclua 1 missão' },
      { key: 'comments', label: 'Comentários', current: clamp(comments, 1), target: 1, suffix: '', color: '#A855F7', note: 'Comente em outra atividade' },
      { key: 'likes', label: 'Curtidas', current: clamp(likes, 3), target: 3, suffix: '', color: '#FF6B35', note: 'Curta 3 atividades' },
    ],
    weekly: [
      { key: 'missions', label: 'Missões', current: clamp(missions, 7), target: 7, suffix: '', color: '#00D4FF', note: 'Complete 7 missões' },
      { key: 'comments', label: 'Comentários', current: clamp(comments, 7), target: 7, suffix: '', color: '#A855F7', note: 'Participe 7 vezes' },
      { key: 'likes', label: 'Curtidas', current: clamp(likes, 21), target: 21, suffix: '', color: '#FF6B35', note: 'Curta 21 atividades' },
      { key: 'streak', label: 'Streak', current: clamp(streak, 7), target: 7, suffix: 'd', color: '#FFB000', note: 'Mantenha 7 dias' },
      { key: 'woaplay', label: 'WOA Play', current: clamp(woaPlayLessons, 1), target: 1, suffix: ' aula', color: '#FFD700', note: 'Assista 1 aula e pratique' },
    ],
    monthly: [
      { key: 'missions', label: 'Missões', current: clamp(missions, 28), target: 28, suffix: '', color: '#00D4FF', note: 'Complete 28 missões' },
      { key: 'comments', label: 'Comentários', current: clamp(comments, 30), target: 30, suffix: '', color: '#A855F7', note: 'Faça 30 comentários' },
      { key: 'likes', label: 'Curtidas', current: clamp(likes, 90), target: 90, suffix: '', color: '#FF6B35', note: 'Curta 90 atividades' },
      { key: 'streak', label: 'Streak', current: clamp(streak, 30), target: 30, suffix: 'd', color: '#FFB000', note: 'Mantenha o hábito' },
      { key: 'woaplay', label: 'WOA Play', current: clamp(woaPlayLessons, 6), target: 6, suffix: ' aulas', color: '#FFD700', note: 'Assista 6 aulas e pratique' },
    ],
  }
}

function getChallengeSummary(period: ChallengePeriod, goals: ChallengeGoal[]) {
  const done = goals.filter(goal => goal.current >= goal.target).length
  const total = goals.length
  const percent = Math.round((done / total) * 100)
  const isComplete = done === total

  return { done, total, percent, isComplete }
}

function CircleCard({ journey, isCenter, isDailyLocked = false, isSeqLocked = false }: { journey: JourneyItem; isCenter: boolean; isDailyLocked?: boolean; isSeqLocked?: boolean }) {
  const iconSrc = journey.icon_url || OCEAN_ICONS_DEFAULT
  const locked = journey.blocked || isDailyLocked || isSeqLocked
  const size = isCenter ? 176 : 136
  const isMemoryGame = journey.phase_id === -1
  
  let bgColor = journey.blocked
    ? 'linear-gradient(135deg, #0d0d1a, #1a1a2e)'
    : isDailyLocked
    ? 'linear-gradient(135deg, #1a0d00, #2e1500)'
    : isMemoryGame
    ? isCenter ? 'radial-gradient(circle at 35% 30%, #FFD700, #DAA520)' : 'radial-gradient(circle at 35% 30%, #FFC700, #CC8800)'
    : isCenter
    ? 'radial-gradient(circle at 35% 30%, #0055FF, #001A60)'
    : 'radial-gradient(circle at 35% 30%, #003AB0, #000D30)'
  
  let borderColor = journey.blocked
    ? '2px solid rgba(255,255,255,0.12)'
    : isDailyLocked
    ? isCenter ? '3px solid rgba(255,107,0,0.5)' : '2px solid rgba(255,107,0,0.3)'
    : isMemoryGame
    ? isCenter ? '3px solid #FFD700' : '2px solid rgba(255,215,0,0.5)'
    : isCenter
    ? '3px solid #00D4FF'
    : '2px solid rgba(0,212,255,0.35)'
  
  let glowShadow = isCenter && !locked
    ? isMemoryGame
      ? '0 0 50px rgba(255,215,0,0.45), inset 0 0 25px rgba(255,255,255,0.2)'
      : '0 0 50px rgba(0,212,255,0.45), inset 0 0 25px rgba(0,102,255,0.2)'
    : 'none'
  
  return (
    <div className="flex flex-col items-center gap-2">
    <div
      className="flex items-center justify-center rounded-full relative overflow-hidden"
      style={{
        width: size,
        height: size,
        background: bgColor,
        border: borderColor,
        boxShadow: glowShadow,
        transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {!locked && (
        <div
          className="absolute pointer-events-none"
          style={{
            top: isCenter ? 16 : 10,
            left: isCenter ? 22 : 14,
            width: isCenter ? 56 : 34,
            height: isCenter ? 36 : 22,
            background: isMemoryGame 
              ? 'radial-gradient(ellipse, rgba(255,255,255,0.4), transparent)'
              : 'radial-gradient(ellipse, rgba(255,255,255,0.28), transparent)',
            borderRadius: '50%',
            transform: 'rotate(-20deg)',
          }}
        />
      )}
      {isMemoryGame ? (
        <span style={{ fontSize: isCenter ? 80 : 50 }}>🎮</span>
      ) : (
        <Image
          src={iconSrc}
          alt={journey.title}
          width={isCenter ? 130 : 80}
          height={isCenter ? 130 : 80}
          unoptimized
          className={`object-contain relative z-10 ${locked ? 'grayscale opacity-35' : ''}`}
        />
      )}
      {(journey.blocked || isDailyLocked || isSeqLocked) && !isMemoryGame && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span style={{ fontSize: isCenter ? 32 : 20, opacity: 0.6 }}>{isDailyLocked ? '⏳' : '🔒'}</span>
        </div>
      )}
    </div>
    {!isCenter && (
      <>
        <p
          className="text-center font-bold tracking-wide"
          style={{
            fontSize: 9,
            color: journey.blocked ? 'rgba(255,255,255,0.3)' : isDailyLocked ? 'rgba(255,107,0,0.5)' : isMemoryGame ? '#FFD700' : 'rgba(0,212,255,0.7)',
            letterSpacing: '0.12em',
            maxWidth: size,
            lineHeight: 1.3,
          }}
        >
          {journey.title.toUpperCase()}
        </p>
        {isMemoryGame && (
          <p
            className="text-center font-bold tracking-wide"
            style={{
              fontSize: 7,
              color: '#FFD700',
              letterSpacing: '0.1em',
              maxWidth: size,
              lineHeight: 1.2,
            }}
          >
            RECURSO PREMIUM
          </p>
        )}
      </>
    )}
    </div>
  )
}

function JourneyGlobeCarousel({
  journeys,
  lastPhaseId,
  isAdmin,
  isPremium,
  dailyAccessedPhaseIds,
  completedPhaseIds,
  onToggleBlocked,
  onDailyLimitClick,
}: {
  journeys: JourneyItem[]
  lastPhaseId: number | null
  isAdmin: boolean
  isPremium: boolean
  dailyAccessedPhaseIds: number[]
  completedPhaseIds: number[]
  onToggleBlocked: (phaseId: number) => void
  onDailyLimitClick: (phaseId: number) => void
}) {
  const [current, setCurrent] = useState(0)
  const router = useRouter()
  const len = journeys.length
  if (len === 0) return null

  const prev = () => setCurrent((i) => (i - 1 + len) % len)
  const next = () => setCurrent((i) => (i + 1) % len)

  const centerJ = journeys[current]
  const leftJ = len >= 2 ? journeys[(current - 1 + len) % len] : null
  const rightJ = len >= 2 ? journeys[(current + 1) % len] : null

  const atDailyJourneyLimit = !isPremium && dailyAccessedPhaseIds.length >= 2
  const isDailyLocked = (j: JourneyItem) =>
    atDailyJourneyLimit && j.phase_id !== -1 && !dailyAccessedPhaseIds.includes(j.phase_id)

  // Sequential locking: journey N is locked until journey N-1 is completed
  const sortedReal = journeys.filter(x => x.phase_id > 0).sort((a, b) => a.phase_id - b.phase_id)
  const isSeqLocked = (j: JourneyItem): boolean => {
    if (isAdmin || j.phase_id <= 0) return false
    const idx = sortedReal.findIndex(x => x.phase_id === j.phase_id)
    if (idx <= 0) return false
    const prev = sortedReal[idx - 1]
    return !completedPhaseIds.includes(prev.phase_id)
  }

  return (
    <div className="select-none">
      {/* 3D Globe viewport */}
      <div
        className="relative"
        style={{ perspective: '980px', height: 220 }}
      >
        {/* Left arrow */}
        {len > 1 && (
          <button
            onClick={() => { playBubble(); prev() }}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-30 w-10 h-10 flex items-center justify-center rounded-full transition-all hover:scale-110 active:scale-95"
            style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.35)', color: '#00D4FF', fontSize: 22, fontWeight: 900 }}
          >
            ‹
          </button>
        )}

        {/* Left card — absolute, anchored to left */}
        <div
          className="absolute cursor-pointer"
          onClick={() => { if (leftJ) { playBubble(); prev() } }}
          style={{
            left: 44,
            top: '50%',
            transform: 'translateY(-50%) translateZ(-55px) rotateY(22deg)',
            opacity: leftJ ? 0.78 : 0,
            pointerEvents: leftJ ? 'auto' : 'none',
            transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            transformOrigin: 'left center',
          }}
        >
          {leftJ && <CircleCard journey={leftJ} isCenter={false} isDailyLocked={isDailyLocked(leftJ)} isSeqLocked={isSeqLocked(leftJ)} />}
        </div>

        {/* Center card — absolute, truly centered */}
        <div
          className="absolute"
          style={{
            left: '50%',
            top: '50%',
            transform: 'translateX(-50%) translateY(-50%) translateZ(30px)',
            zIndex: 10,
            transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <CircleCard journey={centerJ} isCenter={true} isDailyLocked={isDailyLocked(centerJ)} isSeqLocked={isSeqLocked(centerJ)} />
        </div>

        {/* Right card — absolute, anchored to right */}
        <div
          className="absolute cursor-pointer"
          onClick={() => { if (rightJ) { playBubble(); next() } }}
          style={{
            right: 44,
            top: '50%',
            transform: 'translateY(-50%) translateZ(-55px) rotateY(-22deg)',
            opacity: rightJ ? 0.78 : 0,
            pointerEvents: rightJ ? 'auto' : 'none',
            transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            transformOrigin: 'right center',
          }}
        >
          {rightJ && <CircleCard journey={rightJ} isCenter={false} isDailyLocked={isDailyLocked(rightJ)} isSeqLocked={isSeqLocked(rightJ)} />}
        </div>

        {/* Right arrow */}
        {len > 1 && (
          <button
            onClick={() => { playBubble(); next() }}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-30 w-10 h-10 flex items-center justify-center rounded-full transition-all hover:scale-110 active:scale-95"
            style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.35)', color: '#00D4FF', fontSize: 22, fontWeight: 900 }}
          >
            ›
          </button>
        )}
      </div>

      {/* Center card info panel */}
      <div className="text-center mt-5 space-y-3 px-4">
        <h4
          className="font-black text-base tracking-wider text-white transition-all duration-300"
          style={{ textShadow: !centerJ.blocked ? '0 0 16px rgba(0,212,255,0.4)' : 'none' }}
        >
          {centerJ.title.toUpperCase()}
          {centerJ.is_pro && (
            <span className="ml-2 text-[9px] text-yellow-400 bg-yellow-400/10 border border-yellow-400/30 rounded px-1.5 py-0.5 align-middle">PRO</span>
          )}
        </h4>
        <p className="text-[11px] text-blue-100/70 max-w-[260px] mx-auto transition-all duration-300">{centerJ.description}</p>

        {centerJ.blocked ? (
          <div
            className="inline-block px-6 py-2.5 text-xs font-black tracking-widest text-white/30 rounded-full cursor-not-allowed"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            🔒 EM BREVE
          </div>
        ) : isSeqLocked(centerJ) ? (
          <div
            className="inline-block px-6 py-2.5 text-xs font-black tracking-widest text-white/50 rounded-full cursor-not-allowed"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.15)' }}
          >
            🔒 CONCLUA A JORNADA ANTERIOR
          </div>
        ) : isDailyLocked(centerJ) ? (
          <button
            onClick={() => onDailyLimitClick(centerJ.phase_id)}
            className="inline-block px-6 py-2.5 text-xs font-black tracking-widest text-white rounded-full transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #B05000, #FF6B00)', boxShadow: '0 0 18px rgba(255,107,0,0.35)' }}
          >
            ⏳ LIMITE DIÁRIO — 👑 PREMIUM
          </button>
        ) : centerJ.phase_id === -1 ? (
          // WOA Memory Game
          <Link
            href={isPremium ? '/memory-game' : '/premium'}
            onClick={() => playClick()}
            className="inline-block px-8 py-2.5 text-xs font-black tracking-widest text-white rounded-full transition-all hover:scale-105 active:scale-95"
            style={{ background: isPremium ? 'linear-gradient(135deg, #FFD700, #DAA520)' : 'linear-gradient(135deg, #CC4A00, #FF6B35)', boxShadow: isPremium ? '0 0 22px rgba(255,215,0,0.5)' : '0 0 22px rgba(255,107,53,0.4)' }}
          >
            {isPremium ? '▶ JOGAR AGORA' : '🔒 PREMIUM'}
          </Link>
        ) : lastPhaseId === centerJ.phase_id ? (
          <Link
            href={`/challenge/${centerJ.phase_id}`}
            onClick={() => playClick()}
            className="inline-block px-8 py-2.5 text-xs font-black tracking-widest text-white rounded-full transition-all hover:scale-105 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #00DD00, #00AA00)', boxShadow: '0 0 22px rgba(0,221,0,0.5)' }}
          >
            ▶ CONTINUAR
          </Link>
        ) : (
          <Link
            href={`/challenge/${centerJ.phase_id}`}
            onClick={() => playClick()}
            className="inline-block px-8 py-2.5 text-xs font-black tracking-widest text-white rounded-full transition-all hover:scale-105 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #CC4A00, #FF6B35)', boxShadow: '0 0 22px rgba(255,107,53,0.4)' }}
          >
            ▶ INICIAR JORNADA
          </Link>
        )}

        {isAdmin && centerJ.phase_id !== -1 && (
          <div className="flex items-center justify-center gap-3 pt-1">
            <button
              onClick={() => { playClick(); onToggleBlocked(centerJ.phase_id) }}
              className="px-4 py-1.5 text-[10px] font-black tracking-widest rounded-full transition-all hover:scale-105 active:scale-95"
              style={{
                background: centerJ.blocked ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)',
                border: centerJ.blocked ? '1px solid rgba(239,68,68,0.4)' : '1px solid rgba(34,197,94,0.4)',
                color: centerJ.blocked ? '#ef4444' : '#22c55e',
              }}
            >
              {centerJ.blocked ? '🔒 DESBLOQUEAR' : '🔓 BLOQUEAR'}
            </button>
            <button
              onClick={() => { playClick(); router.push(`/admin/journey-content/${centerJ.phase_id}`) }}
              className="px-4 py-1.5 text-[10px] font-black tracking-widest rounded-full transition-all hover:scale-105 active:scale-95"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.25)', color: 'rgba(255,255,255,0.8)' }}
            >
              ✏️ EDITAR
            </button>
          </div>
        )}

        {len > 1 && (
          <div className="flex items-center justify-center gap-2 pt-2">
            {journeys.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className="rounded-full transition-all duration-300 hover:scale-125"
                style={{
                  width: i === current ? 20 : 6,
                  height: 6,
                  background: i === current ? '#00D4FF' : 'rgba(0,212,255,0.25)',
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function getEndOfMonthCountdown() {
  const now = new Date()
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0)
  const diff = endOfMonth.getTime() - now.getTime()
  if (diff <= 0) return { days: 0, hours: 0 }
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  return { days, hours }
}

function AvatarPlaceholder({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" fill="rgba(0,212,255,0.55)" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="rgba(0,212,255,0.55)" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [xpTotal, setXpTotal] = useState(0)
  const [coinsBalance, setCoinsBalance] = useState(0)
  const [streakCount, setStreakCount] = useState(0)
  const [commentsMade, setCommentsMade] = useState(0)
  const [likesMade, setLikesMade] = useState(0)
  const [badgeCount, setBadgeCount] = useState(0)
  const [badgesOpen, setBadgesOpen] = useState(false)
  const [levelOpen, setLevelOpen] = useState(false)
  const [challengeOpen, setChallengeOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [journeys, setJourneys] = useState<JourneyItem[]>([])
  const [lastPhaseId, setLastPhaseId] = useState<number | null>(null)
  const [isEmailVerified, setIsEmailVerified] = useState(true)
  const [recentPosts, setRecentPosts] = useState<TickerPost[]>([])
  const [showVerifyModal, setShowVerifyModal] = useState(false)
  const [verifyCode, setVerifyCode] = useState(['', '', '', '', '', ''])
  const [verifyStep, setVerifyStep] = useState<'send' | 'input' | 'done'>('send')
  const [challengeConfig, setChallengeConfig] = useState<{ daily_reward: string; weekly_reward: string; monthly_reward: string; monthly_winner_name: string; monthly_winner_badge: string; monthly_winner_note: string; winner_confirmed: boolean } | null>(null)
  const [monthlyRanking, setMonthlyRanking] = useState<RankingUser[]>([])
  const [monthlyRankingLoaded, setMonthlyRankingLoaded] = useState(false)
  const [verifyError, setVerifyError] = useState<string | null>(null)
  const [verifyLoading, setVerifyLoading] = useState(false)
  const verifyInputRefs = useRef<(HTMLInputElement | null)[]>([])
  const [isPremium, setIsPremium] = useState(false)
  const [dailyAccessedPhaseIds,  setDailyAccessedPhaseIds]  = useState<number[]>([])
  const [conversationTheme, setConversationTheme] = useState<'viagens' | 'trabalho' | 'entrevistas'>('viagens')
  const [conversationOpen, setConversationOpen] = useState(false)
  const [conversationLoading, setConversationLoading] = useState(false)
  const [conversationInput, setConversationInput] = useState('')
  const [conversationMessages, setConversationMessages] = useState<Array<{ role: 'assistant' | 'user'; content: string }>>([])
  const [conversationHistory, setConversationHistory] = useState<Array<{ role: 'assistant' | 'user'; content: string }>>([])
  const [conversationStep, setConversationStep] = useState(0)
  // Voice chat states
  const [conversationVoiceEnabled, setConversationVoiceEnabled] = useState(true)
  const [conversationVoiceError, setConversationVoiceError] = useState<string | null>(null)
  const [themeSearchQuery, setThemeSearchQuery] = useState('')
  const [themeSearchResults, setThemeSearchResults] = useState(TUTOR_THEMES)
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null)

  // Voice recording refs (implementação simples sem useVoiceRecorder)
  const voiceMediaRecorderRef = useRef<MediaRecorder | null>(null)
  const voiceChunksRef = useRef<Blob[]>([])
  const voiceStreamRef = useRef<MediaStream | null>(null)
  const [voiceRecording, setVoiceRecording] = useState(false)
  const [voiceTranscribing, setVoiceTranscribing] = useState(false)

  // Simplified voice recording - same as ListenRepeatQuestion
  const startVoiceRecording = useCallback(async () => {
    try {
      console.log('🎤 [DASHBOARD] [1] Iniciando gravação de voz...')
      console.log('🎤 [DASHBOARD] [1.5] iOS detectado:', isIOS())
      voiceChunksRef.current = []
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      voiceStreamRef.current = stream
      console.log('🎤 [DASHBOARD] [2] ✅ Microfone acessado')

      // Firefox suporta audio/ogg;codecs=opus, Chrome/Edge suporta audio/webm
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')
          ? 'audio/ogg;codecs=opus'
          : MediaRecorder.isTypeSupported('audio/mp4')
            ? 'audio/mp4'
            : ''
      
      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      voiceMediaRecorderRef.current = mr
      console.log('🎤 [DASHBOARD] [3] MediaRecorder criado, mimeType:', mimeType || 'default')

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) {
          console.log('🎤 [DASHBOARD] [4] Chunk recebido:', e.data.size, 'bytes')
          voiceChunksRef.current.push(e.data)
        }
      }

      mr.onstop = async () => {
        console.log('🎤 [DASHBOARD] [5] ✅ Gravação parada! Chunks:', voiceChunksRef.current.length)
        voiceStreamRef.current?.getTracks().forEach(t => t.stop())
        voiceStreamRef.current = null

        const blob = new Blob(voiceChunksRef.current, { type: mr.mimeType })
        console.log('🎤 [DASHBOARD] [6] Blob criado:', blob.size, 'bytes')

        try {
          setVoiceTranscribing(true)
          console.log('🎤 [DASHBOARD] [7] Convertendo áudio para WAV...')
          
          // Converter qualquer formato (WebM, OGG, MP4) para WAV PCM 16000Hz
          const base64Audio = await blobToWavBase64(blob)
          console.log('🎤 [DASHBOARD] [8] ✅ Base64 WAV pronto, tamanho:', base64Audio.length)

          // iOS: tentar transcribeFreeBlob primeiro (Whisper.js ou fallback)
          // Outros: usar transcribeBlob (Azure direto)
          let transcript = ''
          if (isIOS()) {
            console.log('🎤 [DASHBOARD] [8.5] iOS detectado - tentando transcribeFreeBlob...')
            try {
              transcript = await transcribeFreeBlob(blob, 'en-US')
              console.log('🎤 [DASHBOARD] [9] ✅ Transcrição iOS OK')
            } catch (iOSError) {
              console.warn('🎤 [DASHBOARD] iOS transcribeFreeBlob falhou, tentando Azure...', iOSError)
              // Fallback para Azure
              const response = await fetch('/api/transcribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  audio: base64Audio,
                  language: 'en-US',
                }),
              })
              const data = await response.json()
              if (!response.ok) throw new Error(data.error || 'Erro no transcribe')
              transcript = data.transcript || ''
            }
          } else {
            // Desktop/Android: usar Azure direto via /api/transcribe
            console.log('🎤 [DASHBOARD] [8.5] Desktop detectado - usando Azure')
            const response = await fetch('/api/transcribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                audio: base64Audio,
                language: 'en-US',
              }),
            })
            console.log('🎤 [DASHBOARD] [9] Resposta da API, status:', response.status)
            const data = await response.json()

            if (!response.ok) {
              console.error('🎤 [DASHBOARD] ❌ Erro API:', data.error)
              setConversationVoiceError(`Erro: ${data.error}`)
              setVoiceTranscribing(false)
              return
            }

            transcript = data.transcript || ''
            console.log('🎤 [DASHBOARD] [9] ✅ Transcrição recebida')
          }

          console.log('🎤 [DASHBOARD] [10] ✅ Transcrição:', transcript.substring(0, 50))
          
          if (transcript) {
            setConversationInput(transcript)
            setConversationVoiceError(null)
          } else {
            setConversationVoiceError('Nenhuma fala detectada. Tente novamente.')
          }
          
          setVoiceTranscribing(false)
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Erro ao processar áudio'
          console.error('🎤 [DASHBOARD] ❌ Erro:', msg)
          setConversationVoiceError(msg)
          setVoiceTranscribing(false)
        }
      }

      mr.start()
      setVoiceRecording(true)
      console.log('🎤 [DASHBOARD] [3.5] ✅ Gravação iniciada!')
    } catch (error) {
      let msg = 'Erro ao acessar microfone'
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError') {
          msg = '🎤 Permissão de microfone negada. Verifique as configurações do navegador.'
        } else if (error.name === 'NotFoundError') {
          msg = '🎤 Nenhum microfone encontrado. Verifique seu equipamento.'
        }
      }
      console.error('🎤 [DASHBOARD] ❌ Erro ao iniciar:', msg)
      setConversationVoiceError(msg)
    }
  }, [])

  const stopVoiceRecording = useCallback(() => {
    const mr = voiceMediaRecorderRef.current
    if (mr && mr.state === 'recording') {
      console.log('🎤 [DASHBOARD] Parando gravação...')
      mr.stop()
      setVoiceRecording(false)
    }
  }, [])

  // Audio ref para TTS
  const audioRef = useRef<HTMLAudioElement>(null)

  // Função para reproduzir áudio TTS
  const playTutorResponse = useCallback(async (text: string) => {
    if (!text) return
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice: 'en-US-AvaNeural', rate: 1.0 }),
      })
      if (!response.ok) throw new Error('TTS failed')
      const audioData = await response.arrayBuffer()
      const blob = new Blob([audioData], { type: 'audio/mpeg' })
      const url = URL.createObjectURL(blob)
      if (audioRef.current) {
        audioRef.current.src = url
        audioRef.current.play().catch(() => {}) // Silenciar erro se autoplay falhar
      }
    } catch (error) {
      console.error('TTS error:', error)
    }
  }, [])

  // Busca de temas
  const handleThemeSearch = useCallback((query: string) => {
    setThemeSearchQuery(query)
    const results = searchTutorThemes(query)
    setThemeSearchResults(results)
  }, [])

  const refreshDailyAccess = useCallback(() => {
    fetch('/api/journey/daily-access')
      .then(r => r.ok ? r.json() : { accessedPhaseIds: [] })
      .then(d => {
        setDailyAccessedPhaseIds(d.accessedPhaseIds ?? [])
        if (d.isPremium === true) setIsPremium(true)
      })
      .catch(() => {})
  }, [])

  const handleDailyLimitClick = useCallback((phaseId: number) => {
    fetch('/api/journey/daily-access')
      .then(r => r.ok ? r.json() : { accessedPhaseIds: [] })
      .then(d => {
        const fresh: number[] = d.accessedPhaseIds ?? []
        setDailyAccessedPhaseIds(fresh)
        if (fresh.length < 2 || fresh.includes(phaseId)) {
          router.push(`/challenge/${phaseId}`)
        } else {
          router.push('/premium')
        }
      })
      .catch(() => router.push('/premium'))
  }, [router])
  const [completedPhaseIds,      setCompletedPhaseIds]      = useState<number[]>([])
  const [lastWOAPlayCourse, setLastWOAPlayCourse] = useState<{ id: string; title: string; cover_url: string | null; module_count: number; watched_count: number } | null>(null)
  const [banner, setBanner] = useState<{ image_url: string; link_url: string | null } | null>(null)
  const [showWoaPlayPremiumModal, setShowWoaPlayPremiumModal] = useState(false)

  useEffect(() => {
    fetch('/api/admin/banner')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.banner) setBanner(d.banner) })
      .catch(() => {})
    fetch('/api/user/stats')
      .then(r => r.ok ? r.json() : { xp_total: 0, coins_balance: 0, comments_made: 0, likes_made: 0 })
      .then(d => {
        setXpTotal(d.xp_total ?? 0)
        setCoinsBalance(d.coins_balance ?? 0)
        setStreakCount(d.streak_count ?? 0)
        setCommentsMade(d.comments_made ?? 0)
        setLikesMade(d.likes_made ?? 0)
      })
      .catch(() => {})
    fetch('/api/user/badges')
      .then(r => r.ok ? r.json() : { badges: [] })
      .then(d => setBadgeCount((d.badges ?? []).length))
      .catch(() => {})
    fetch('/api/auth/verify-status')
      .then(r => r.ok ? r.json() : { verified: true })
      .then(d => setIsEmailVerified(d.verified ?? true))
      .catch(() => {})
    fetch('/api/journey')
      .then(r => r.ok ? r.json() : { journeys: [] })
      .then(d => {
        let allJourneys = d.journeys ?? []
        
        // Add WOA Memory game as a special item
        allJourneys.push({
          phase_id: -1, // Special ID for memory game
          title: 'WOA Memory',
          description: 'Jogo de Memória - Recurso Premium',
          blocked: false,
          is_pro: true,
          icon_url: '/images/logo.png', // Will be styled differently
        })
        
        // Fetch last accessed journey
        fetch('/api/history?limit=1')
          .then(hr => hr.ok ? hr.json() : { history: [] })
          .then(hd => {
            const lastEntry = (hd.history ?? [])[0]
            if (lastEntry?.phase_id) {
              setLastPhaseId(lastEntry.phase_id)
              
              // Reorder: move last accessed to first position
              const lastIdx = allJourneys.findIndex((j: JourneyItem) => j.phase_id === lastEntry.phase_id)
              if (lastIdx > 0) {
                const reordered = [allJourneys[lastIdx], ...allJourneys.slice(0, lastIdx), ...allJourneys.slice(lastIdx + 1)]
                setJourneys(reordered)
              } else {
                setJourneys(allJourneys)
              }
            } else {
              setJourneys(allJourneys)
            }
          })
          .catch(() => setJourneys(allJourneys))
      })
      .catch(() => {})
    fetch('/api/community/recent')
      .then(r => r.ok ? r.json() : { posts: [] })
      .then(d => setRecentPosts(d.posts ?? []))
      .catch(() => {})
    fetch('/api/public/challenge-config')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setChallengeConfig(d) })
      .catch(() => {})
    fetch('/api/community/rankings?period=monthly')
      .then(r => r.ok ? r.json() : { xpRanking: [] })
      .then(d => { setMonthlyRanking(d.xpRanking ?? []); setMonthlyRankingLoaded(true) })
      .catch(() => { setMonthlyRankingLoaded(true) })
    refreshDailyAccess()
    fetch('/api/journey/completed')
      .then(r => r.ok ? r.json() : { completedPhaseIds: [] })
      .then(d => setCompletedPhaseIds(d.completedPhaseIds ?? []))
      .catch(() => {})
    fetch('/api/user/subscription')
      .then(r => r.ok ? r.json() : { isPremium: false })
      .then(d => {
        const premium = d.isPremium ?? false
        setIsPremium(premium)
        if (premium) {
          fetch('/api/woaplay')
            .then(r => r.ok ? r.json() : { courses: [] })
            .then(d2 => {
              const courses: { id: string; title: string; cover_url: string | null; module_count: number; watched_count: number }[] = d2.courses ?? []
              const withProgress = courses.filter(c => c.watched_count > 0)
              const toShow = withProgress.length > 0
                ? withProgress.sort((a, b) => b.watched_count - a.watched_count)[0]
                : courses[0] ?? null
              setLastWOAPlayCourse(toShow)
            })
            .catch(() => {})
        }
      })
      .catch(() => {})

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') refreshDailyAccess()
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [refreshDailyAccess])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  const isAdmin = session?.user?.role === 'admin'
  const { level, xpIntoLevel, xpForLevel, xpToNext, progress: xpProgress } = calcLevel(xpTotal)

  const startConversationPractice = useCallback(async (theme: 'viagens' | 'trabalho' | 'entrevistas') => {
    setConversationTheme(theme)
    setConversationOpen(true)
    setConversationLoading(true)
    setConversationInput('')
    setConversationMessages([])
    setConversationHistory([])
    setConversationStep(0)

    try {
      const response = await fetch('/api/pronunciation/topic-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: theme, history: [], userSpeech: '', questionNumber: 0 }),
      })

      if (!response.ok) throw new Error('Failed to start conversation')

      const data = await response.json() as { feedback?: string; question?: string; isComplete?: boolean; questionNumber?: number }
      const initialQuestion = data.question || 'Let’s talk about this topic.'
      const firstAssistantMessage = { role: 'assistant' as const, content: initialQuestion }
      setConversationHistory([{ role: 'assistant', content: initialQuestion }])
      setConversationMessages([firstAssistantMessage])
      setConversationStep(data.questionNumber ?? 1)
    } catch {
      setConversationMessages([{ role: 'assistant', content: 'Hi! Let’s practice English in a natural conversation. Tell me about your experience in this topic.' }])
      setConversationHistory([{ role: 'assistant', content: 'Hi! Let’s practice English in a natural conversation. Tell me about your experience in this topic.' }])
      setConversationStep(1)
    } finally {
      setConversationLoading(false)
    }
  }, [])

  const handleSendConversationMessage = useCallback(async () => {
    const trimmed = conversationInput.trim()
    if (!trimmed || conversationLoading) return

    const userTurn = { role: 'user' as const, content: trimmed }
    const newHistory = [...conversationHistory, userTurn]
    const nextMessages = [...conversationMessages, userTurn]
    setConversationMessages(nextMessages)
    setConversationInput('')
    setConversationLoading(true)

    try {
      const response = await fetch('/api/pronunciation/topic-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: selectedThemeId || 'general',
          history: newHistory,
          userSpeech: trimmed,
          questionNumber: conversationStep,
        }),
      })

      if (!response.ok) throw new Error('Failed to get next reply')

      const data = await response.json() as { feedback?: string; question?: string; isComplete?: boolean; questionNumber?: number }
      const assistantReply = [data.feedback, data.question].filter(Boolean).join('\n')
      const assistantTurn = { role: 'assistant' as const, content: assistantReply }
      const updatedHistory = [...newHistory, assistantTurn]
      setConversationHistory(updatedHistory)
      setConversationMessages([...nextMessages, assistantTurn])
      setConversationStep(data.questionNumber ?? conversationStep + 1)
      
      // Reproduzir voz do tutor se voice chat está ativado
      if (conversationVoiceEnabled && assistantReply) {
        playTutorResponse(assistantReply)
      }
    } catch {
      const fallbackAssistantTurn = { role: 'assistant' as const, content: 'Good try! Please answer in English and keep the conversation focused on this topic.' }
      const updatedHistory = [...newHistory, fallbackAssistantTurn]
      setConversationHistory(updatedHistory)
      setConversationMessages([...nextMessages, fallbackAssistantTurn])
      
      // Reproduzir fallback message também
      if (conversationVoiceEnabled) {
        playTutorResponse(fallbackAssistantTurn.content)
      }
    } finally {
      setConversationLoading(false)
    }
  }, [conversationHistory, conversationInput, conversationLoading, conversationStep, selectedThemeId, conversationMessages, conversationVoiceEnabled, playTutorResponse])

  const challengeSnapshot = useMemo(() => {
    const missions = completedPhaseIds.length
    const comments = commentsMade
    const likes = likesMade
    const streak = streakCount
    const woaPlayLessons = 0
    const allGoals = getChallengeGoals({ missions, comments, likes, streak, woaPlayLessons })

    return {
      daily: {
        ...getChallengeSummary('daily', allGoals.daily),
        goals: allGoals.daily,
        label: 'Diário',
        meta: {
          ...CHALLENGE_DEFINITIONS.daily,
          reward: challengeConfig?.daily_reward || CHALLENGE_DEFINITIONS.daily.reward,
        },
      },
      weekly: {
        ...getChallengeSummary('weekly', allGoals.weekly),
        goals: allGoals.weekly,
        label: 'Semanal',
        meta: {
          ...CHALLENGE_DEFINITIONS.weekly,
          reward: challengeConfig?.weekly_reward || CHALLENGE_DEFINITIONS.weekly.reward,
        },
      },
      monthly: {
        ...getChallengeSummary('monthly', allGoals.monthly),
        goals: allGoals.monthly,
        label: 'Mensal',
        meta: {
          ...CHALLENGE_DEFINITIONS.monthly,
          reward: challengeConfig?.monthly_reward || CHALLENGE_DEFINITIONS.monthly.reward,
        },
      },
    }
  }, [completedPhaseIds.length, streakCount, commentsMade, likesMade, challengeConfig])

  const overallChallengePercent = Math.round(
    ((challengeSnapshot.daily.percent + challengeSnapshot.weekly.percent + challengeSnapshot.monthly.percent) / 3)
  )

  const prizeSet = !!(challengeConfig?.monthly_reward && challengeConfig.monthly_reward?.trim())
  const top3 = monthlyRanking.slice(0, 3)
  const currentUserRankIdx = monthlyRanking.findIndex(u => u.id === (session?.user as { id?: string })?.id)
  const currentUserRank = currentUserRankIdx >= 0 ? currentUserRankIdx + 1 : null
  const currentUserData = currentUserRankIdx >= 0 ? monthlyRanking[currentUserRankIdx] : null
  const { days: cdDays, hours: cdHours } = getEndOfMonthCountdown()
  const { level: userLevel } = calcLevel(xpTotal)
  const RANK_BADGES: Record<number, { label: string; color: string; bg: string; border: string }> = {
    1: { label: 'OURO', color: '#FFD700', bg: 'rgba(255,215,0,0.12)', border: 'rgba(255,215,0,0.3)' },
    2: { label: 'PRATA', color: '#C0C0C0', bg: 'rgba(192,192,192,0.12)', border: 'rgba(192,192,192,0.3)' },
    3: { label: 'BRONZE', color: '#CD7F32', bg: 'rgba(205,127,50,0.12)', border: 'rgba(205,127,50,0.3)' },
  }

  const handleToggleBlocked = async (phaseId: number) => {
    const journey = journeys.find((j) => j.phase_id === phaseId)
    if (!journey) return
    const newVal = !journey.blocked
    setJourneys((prev) => prev.map((j) => j.phase_id === phaseId ? { ...j, blocked: newVal } : j))
    await fetch(`/api/admin/journey/${phaseId}/toggle`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ field: 'blocked', value: newVal }),
    })
  }

  // ── Verify email from dashboard ──
  const handleSendVerifyCode = async () => {
    setVerifyLoading(true)
    setVerifyError(null)
    try {
      const res = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: session?.user?.email }),
      })
      const data = await res.json()
      if (!res.ok) { setVerifyError(data.error || 'Erro ao enviar código'); return }
      setVerifyStep('input')
      setVerifyCode(['', '', '', '', '', ''])
    } catch { setVerifyError('Erro ao conectar ao servidor') }
    finally { setVerifyLoading(false) }
  }

  const handleVerifyCode = async () => {
    const fullCode = verifyCode.join('')
    if (fullCode.length !== 6) { setVerifyError('Insira o código completo'); return }
    setVerifyLoading(true)
    setVerifyError(null)
    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: session?.user?.email, code: fullCode }),
      })
      const data = await res.json()
      if (!res.ok) {
        setVerifyError(data.error || 'Código inválido')
        setVerifyCode(['', '', '', '', '', ''])
        verifyInputRefs.current[0]?.focus()
        return
      }
      setVerifyStep('done')
      setIsEmailVerified(true)
    } catch { setVerifyError('Erro ao conectar ao servidor') }
    finally { setVerifyLoading(false) }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#050E1A' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-cyan-400/30 border-t-cyan-400 animate-spin" />
          <p className="text-cyan-300/60 text-sm tracking-widest">CARREGANDO...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen relative" style={{ background: '#050E1A' }}>

      {/* ── Background ── */}
      <div className="fixed inset-0 z-0">
        <Image
          src="/images/plano-de-fundo-mar.png"
          alt="Oceano"
          fill
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(to bottom, rgba(5,14,26,0.90) 0%, rgba(5,14,26,0.70) 40%, rgba(5,14,26,0.88) 100%)'
        }} />
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #00D4FF 2px, #00D4FF 3px)'
        }} />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">

        {/* ── NAV ── */}
        <header className="sticky top-0 z-40 flex items-center justify-between px-4 sm:px-6 py-3 border-b border-cyan-400/15 backdrop-blur-md" style={{ background: 'rgba(5,14,26,0.80)' }}>
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="relative w-8 h-8 shrink-0">
              <div className="absolute inset-0 rounded-full blur-lg bg-cyan-400/40" />
              <Image src="/images/logo.png" alt="WOA Talk" fill className="relative rounded-full border-2 border-cyan-400/60 object-cover" />
            </div>
            <span className="text-sm font-black tracking-[0.15em] text-white hidden sm:block" style={{ textShadow: '0 0 12px rgba(0,212,255,0.5)' }}>WOA TALK</span>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => playClick()}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest transition-all hover:scale-105"
                style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}
              >
                ⚙️ ADMIN
              </Link>
            )}
            {/* Plan label */}
            <Link
              href="/premium"
              onClick={() => playClick()}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest transition-all hover:scale-105"
              style={{
                background: isPremium ? 'rgba(255,215,0,0.12)' : 'rgba(0,212,255,0.1)',
                border: isPremium ? '1px solid rgba(255,215,0,0.3)' : '1px solid rgba(0,212,255,0.3)',
                color: isPremium ? '#FFD700' : '#00D4FF',
              }}
            >
              {isPremium ? '👑 PREMIUM' : '⭐ FREE'}
            </Link>
            <NotificationBell />
            {/* Coins */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: 'rgba(255,215,0,0.12)', border: '1px solid rgba(255,215,0,0.3)' }}>
              <span className="text-sm">🪙</span>
              <span className="text-xs font-black" style={{ color: '#FFD700' }}>{coinsBalance.toLocaleString('pt-BR')}</span>
            </div>
            {/* Avatar / sidebar trigger */}
            <button
              onClick={() => { playClick(); setSidebarOpen(true) }}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110"
              style={{ background: 'linear-gradient(135deg, rgba(0,67,187,0.6), rgba(0,212,255,0.3))', border: '2px solid rgba(0,212,255,0.45)' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="8" r="4" fill="rgba(0,212,255,0.8)" />
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="rgba(0,212,255,0.8)" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </header>

        {/* ── BANNER ── */}
        {banner && (
          <div className="relative z-10 max-w-3xl mx-auto w-full px-4 pt-4">
            {banner.link_url ? (
              <a href={banner.link_url} target="_blank" rel="noopener noreferrer" className="block w-full">
                <div className="relative w-full rounded-2xl overflow-hidden" style={{ aspectRatio: '4/1', maxHeight: 180 }}>
                  <Image src={banner.image_url} alt="Banner" fill className="object-cover" priority />
                </div>
              </a>
            ) : (
              <div className="relative w-full rounded-2xl overflow-hidden" style={{ aspectRatio: '4/1', maxHeight: 180 }}>
                <Image src={banner.image_url} alt="Banner" fill className="object-cover" priority />
              </div>
            )}
          </div>
        )}

        <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-6 space-y-6 pb-24 md:pb-10">

          {/* ── DESAFIO DO MÊS ── */}
          <section className="rounded-2xl overflow-hidden" style={{ background: 'rgba(5,14,26,0.85)', border: '1px solid rgba(255,215,0,0.25)', boxShadow: '0 0 40px rgba(255,180,0,0.06)' }}>
            <div className="flex flex-col md:flex-row">
              {/* LEFT: Leaderboard */}
              <div className="flex-1 p-5">
                <div className="flex items-center justify-between gap-3 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🏆</span>
                    <p className="text-sm font-black tracking-widest" style={{ color: '#FFD700' }}>DESAFIO DO MÊS</p>
                  </div>
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-full" style={{ background: 'rgba(255,80,80,0.12)', border: '1px solid rgba(255,80,80,0.25)' }}>
                    <span className="text-[10px]">⏱</span>
                    <span className="text-[11px] font-black" style={{ color: '#FF6060' }}>{cdDays}d {cdHours}h</span>
                  </div>
                </div>
                <p className="text-[11px] text-white/45 mb-4">Aprenda, pratique e suba no ranking!</p>

                {/* Top 3 rows */}
                <div className="space-y-2 mb-3">
                  {!monthlyRankingLoaded
                    ? [1, 2, 3].map(i => (
                      <div key={i} className="flex items-center gap-3 rounded-xl px-3 py-2 animate-pulse" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="w-6 h-6 rounded-full flex-shrink-0" style={{ background: 'rgba(255,255,255,0.06)' }} />
                        <div className="w-7 h-7 rounded-full flex-shrink-0" style={{ background: 'rgba(255,255,255,0.06)' }} />
                        <div className="flex-1 h-3 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
                      </div>
                    ))
                    : top3.length === 0
                    ? (
                      <div className="rounded-xl px-4 py-5 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <p className="text-2xl mb-1">🏁</p>
                        <p className="text-xs font-black text-white/50">Nenhum XP registrado este mês ainda</p>
                        <p className="text-[10px] text-white/30 mt-1">Complete missões para aparecer no ranking!</p>
                      </div>
                    )
                    : top3.map((user, idx) => {
                      const rank = idx + 1
                      const badge = RANK_BADGES[rank]
                      const isConfirmedWinner = rank === 1 && challengeConfig?.winner_confirmed
                      const shortName = user.name.split(' ').slice(0, 2).map((n, i2) => i2 === 1 ? n[0] + '.' : n).join(' ')
                      return (
                        <div key={user.id} className="flex items-center gap-2.5 rounded-xl px-3 py-2" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${badge.border}` }}>
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0" style={{ background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}>{rank}</div>
                          <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ background: 'rgba(0,67,187,0.3)', border: `1px solid ${badge.border}` }}>
                            {user.avatar_url
                              ? <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                              : <AvatarPlaceholder size={20} />}
                          </div>
                          <div className="flex-1 min-w-0 flex items-center gap-1.5 flex-wrap">
                            <Link href={`/profile/${user.id}`} onClick={() => playClick()} className="text-xs font-black text-white truncate max-w-[90px] hover:text-cyan-300 transition-colors">{shortName}</Link>
                            {isConfirmedWinner && (
                              <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.4)', color: '#4ade80' }}>DEFINITIVO</span>
                            )}
                          </div>
                          <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ background: badge.bg, border: `1px solid ${badge.border}`, color: badge.color }}>{badge.label}</span>
                          <span className="text-[11px] font-black text-white/70 min-w-[56px] text-right flex-shrink-0">{user.xp_total.toLocaleString('pt-BR')} XP</span>
                        </div>
                      )
                    })
                  }
                </div>

                <div className="h-px mb-3" style={{ background: 'rgba(255,215,0,0.1)' }} />

                {/* Current user row */}
                {currentUserRank === null || currentUserRank > 3 ? (
                  <div className="flex items-center gap-2.5 rounded-xl px-3 py-2.5" style={{ background: 'rgba(255,215,0,0.06)', border: '1px solid rgba(255,215,0,0.3)' }}>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0" style={{ background: 'rgba(255,215,0,0.15)', color: '#FFD700', border: '1px solid rgba(255,215,0,0.35)' }}>
                      {currentUserRank ?? '?'}
                    </div>
                    <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ background: 'rgba(0,67,187,0.3)', border: '1px solid rgba(255,215,0,0.3)' }}>
                      {currentUserData?.avatar_url
                        ? <img src={currentUserData.avatar_url} alt="Você" className="w-full h-full object-cover" />
                        : <AvatarPlaceholder size={20} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-white">Você</p>
                      {currentUserRank === null && monthlyRankingLoaded && (
                        <p className="text-[9px] text-white/35">Complete missões para entrar!</p>
                      )}
                    </div>
                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.25)', color: '#00D4FF' }}>Nv. {userLevel}</span>
                    <span className="text-[11px] font-black text-white/70 min-w-[56px] text-right flex-shrink-0">
                      {(currentUserData?.xp_total ?? 0) > 0 ? `${(currentUserData!.xp_total).toLocaleString('pt-BR')} XP` : '— XP'}
                    </span>
                  </div>
                ) : null}
              </div>

              {/* RIGHT: Prize */}
              <div className="flex flex-col items-center justify-center gap-3 p-5 md:w-64 border-t md:border-t-0 md:border-l" style={{ borderColor: 'rgba(255,215,0,0.12)', background: 'rgba(255,180,0,0.04)' }}>
                <p className="text-[10px] font-black tracking-widest" style={{ color: '#FFD700' }}>PRÊMIO DO MÊS</p>
                <div className="relative w-32 h-32">
                  <Image src="/images/bau-tesouro.png" alt="Baú do Tesouro" fill className="object-contain" style={{ filter: 'drop-shadow(0 4px 16px rgba(255,180,0,0.35))' }} />
                </div>
                {prizeSet
                  ? <p className="text-sm font-black text-white text-center leading-snug">{challengeConfig!.monthly_reward}</p>
                  : <p className="text-xl font-black text-center tracking-[0.2em]" style={{ color: '#FFD700', textShadow: '0 0 16px rgba(255,215,0,0.5)' }}>??????</p>
                }

                {/* Vencedor mensal */}
                {challengeConfig?.monthly_winner_name && challengeConfig.monthly_winner_name !== 'A definir' && (
                  <div className="w-full rounded-xl p-3 space-y-2" style={{ background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.25)' }}>
                    <p className="text-[9px] font-black tracking-widest" style={{ color: '#FFD700' }}>🏆 VENCEDOR DO MÊS</p>
                    <p className="text-xs font-black text-white">{challengeConfig.monthly_winner_name}</p>
                    {challengeConfig.monthly_winner_badge && (
                      <p className="text-[10px] font-bold text-white/70">Badge: {challengeConfig.monthly_winner_badge}</p>
                    )}
                    {challengeConfig.monthly_winner_note && (
                      <p className="text-[9px] text-white/60 italic">{challengeConfig.monthly_winner_note}</p>
                    )}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => { playClick(); setChallengeOpen(true) }}
                  className="text-[11px] font-black tracking-wide transition-opacity hover:opacity-75"
                  style={{ color: '#00D4FF' }}
                >
                  Ver detalhes →
                </button>
              </div>
            </div>
          </section>

          {/* ── SUA JORNADA — env tabs ── */}
          <section className="rounded-2xl overflow-hidden" style={{ background: 'rgba(5,14,26,0.75)', border: '1px solid rgba(0,212,255,0.15)' }}>
            <p className="text-center text-xs font-black tracking-[0.25em] text-white pt-4 pb-3">SUA JORNADA</p>
            <div className="grid grid-cols-3 gap-0 border-t border-white/5">
              {/* OCEANOS — active */}
              <button className="flex flex-col items-center gap-1 py-3 px-2 transition-all" style={{ background: 'rgba(0,212,255,0.12)', borderBottom: '2px solid #00D4FF' }}>
                <span className="text-lg">🌊</span>
                <span className="text-[10px] font-black tracking-widest" style={{ color: '#00D4FF' }}>OCEANOS</span>
                <span className="text-[9px] font-bold" style={{ color: 'rgba(0,212,255,0.6)' }}>Ativo</span>
              </button>
              {/* TERRA — locked */}
              <button className="flex flex-col items-center gap-1 py-3 px-2 border-x border-white/5 opacity-50 cursor-not-allowed">
                <span className="text-lg">🌿</span>
                <span className="text-[10px] font-black tracking-widest text-white/60">TERRA</span>
                <span className="text-[9px] font-bold text-white/35">Bloqueado</span>
              </button>
              {/* GALÁXIAS — locked */}
              <button className="flex flex-col items-center gap-1 py-3 px-2 opacity-50 cursor-not-allowed">
                <span className="text-lg">✨</span>
                <span className="text-[10px] font-black tracking-widest text-white/60">GALÁXIAS</span>
                <span className="text-[9px] font-bold text-white/35">Bloqueado</span>
              </button>
            </div>
            {/* Progress bar */}
            <div className="px-5 pt-2 pb-4">
              <div className="h-2 rounded-full overflow-hidden mb-2" style={{ background: 'rgba(0,212,255,0.12)' }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${journeys.length > 0 ? Math.round((completedPhaseIds.length / Math.max(journeys.filter(j => j.phase_id > 0).length, 1)) * 100) : 0}%`,
                    background: 'linear-gradient(90deg, #0043BB, #00D4FF)'
                  }}
                />
              </div>
              <p className="text-center text-sm font-black tracking-widest">
                <span style={{ color: '#00D4FF', textShadow: '0 0 10px rgba(0,212,255,0.7)' }}>
                  {journeys.length > 0 ? Math.round((completedPhaseIds.length / Math.max(journeys.filter(j => j.phase_id > 0).length, 1)) * 100) : 0}%
                </span>
                <span className="text-white/40 font-bold"> CONCLUÍDO</span>
              </p>
            </div>
          </section>

          {/* ── GLOBE CAROUSEL ── */}
          <section className="rounded-2xl py-4" style={{ background: 'rgba(5,14,26,0.60)', border: '1px solid rgba(0,212,255,0.12)' }}>
            <div className="flex items-center justify-between px-4 mb-2">
              {!isPremium && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black tracking-widest" style={{ color: dailyAccessedPhaseIds.length >= 2 ? '#FF6B35' : '#00D4FF' }}>
                    ⚡ JORNADAS HOJE: {dailyAccessedPhaseIds.length}/2
                  </span>
                  {dailyAccessedPhaseIds.length >= 2 && (
                    <span className="text-[9px] text-orange-400/70">— limite atingido</span>
                  )}
                </div>
              )}
              {isPremium && (
                <span className="text-[10px] font-black tracking-widest" style={{ color: '#FF9A00' }}>👑 PREMIUM — JORNADAS ILIMITADAS</span>
              )}
              {isAdmin && (
                <Link href="/admin/journey-content/new" onClick={() => playClick()} className="text-[10px] font-black tracking-widest px-3 py-1.5 rounded-lg" style={{ background: 'rgba(0,102,255,0.15)', border: '1px solid rgba(0,212,255,0.3)', color: '#00D4FF' }}>+ CRIAR JORNADA</Link>
              )}
            </div>
            <JourneyGlobeCarousel
              journeys={journeys}
              lastPhaseId={lastPhaseId}
              isAdmin={isAdmin}
              isPremium={isPremium}
              dailyAccessedPhaseIds={dailyAccessedPhaseIds}
              completedPhaseIds={completedPhaseIds}
              onToggleBlocked={handleToggleBlocked}
              onDailyLimitClick={handleDailyLimitClick}
            />
          </section>

          {/* ── STATS — 3 cards ── */}
          <section className="grid grid-cols-3 gap-3">
            {/* Level */}
            <button
              onClick={() => { playClick(); setLevelOpen(true) }}
              className="p-4 rounded-2xl backdrop-blur-md hover:scale-105 transition-transform text-left w-full"
              style={{ background: 'rgba(5,14,26,0.75)', border: '1px solid rgba(0,212,255,0.2)' }}
            >
              <p className="text-[9px] font-black tracking-widest mb-1.5" style={{ color: '#00D4FF' }}>NÍVEL ATUAL</p>
              <p className="text-2xl font-black text-white leading-none">LVL {level}</p>
              <div className="h-1 rounded-full mt-2 mb-1 overflow-hidden" style={{ background: 'rgba(0,212,255,0.15)' }}>
                <div className="h-full rounded-full" style={{ width: `${xpProgress}%`, background: '#00D4FF' }} />
              </div>
              <p className="text-[9px]" style={{ color: 'rgba(0,212,255,0.55)' }}>{xpProgress}%</p>
            </button>

            {/* Streak */}
            <div className="p-4 rounded-2xl backdrop-blur-md" style={{ background: 'rgba(5,14,26,0.75)', border: '1px solid rgba(255,107,0,0.2)' }}>
              <p className="text-[9px] font-black tracking-widest mb-1.5" style={{ color: '#FF6B00' }}>🔥 STREAK</p>
              <p className="text-2xl font-black text-white leading-none">{streakCount} <span className="text-sm font-bold text-white/50">DIA{streakCount !== 1 ? 'S' : ''}</span></p>
              <p className="text-[9px] mt-2" style={{ color: 'rgba(255,107,0,0.55)' }}>Use amanhã para não perder</p>
            </div>

            {/* Coins */}
            <div className="p-4 rounded-2xl backdrop-blur-md" style={{ background: 'rgba(5,14,26,0.75)', border: '1px solid rgba(255,215,0,0.2)' }}>
              <p className="text-[9px] font-black tracking-widest mb-1.5" style={{ color: '#FFD700' }}>💰 WOA COINS</p>
              <p className="text-2xl font-black text-white leading-none">{coinsBalance.toLocaleString('pt-BR')}</p>
              <p className="text-[9px] mt-2" style={{ color: 'rgba(255,215,0,0.55)' }}>Use na loja e recompensas</p>
            </div>
          </section>

          {/* ── MISSÃO DO DIA + PRÓXIMA CONQUISTA ── */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* MISSÃO DO DIA */}
            <div className="rounded-2xl p-5" style={{ background: 'rgba(5,14,26,0.75)', border: '1px solid rgba(0,212,255,0.15)' }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-base">🎯</span>
                <p className="text-[10px] font-black tracking-widest" style={{ color: '#00D4FF' }}>MISSÃO DO DIA</p>
              </div>
              <p className="text-white font-black text-sm mb-1">Pratique 10 minutos</p>
              <div className="flex gap-3 mb-4">
                <span className="text-[11px] text-yellow-300/80">⭐ +50 XP</span>
                <span className="text-[11px] text-yellow-300/80">🪙 +5 WOA Coins</span>
              </div>
              <Link
                href={journeys.length > 0 ? `/challenge/${journeys.find(j => j.phase_id > 0)?.phase_id ?? 1}` : '/dashboard'}
                onClick={() => playClick()}
                className="block w-full py-2.5 text-center text-xs font-black tracking-widest rounded-xl text-white transition-all hover:scale-[1.02]"
                style={{ background: 'linear-gradient(135deg, #FF6B00, #FF9A00)', boxShadow: '0 4px 16px rgba(255,107,0,0.35)' }}
              >
                COMEÇAR MISSÃO
              </Link>
            </div>

            {/* PRÓXIMA CONQUISTA */}
            <div className="rounded-2xl p-5" style={{ background: 'rgba(5,14,26,0.75)', border: '1px solid rgba(255,215,0,0.15)' }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-base">🏆</span>
                <p className="text-[10px] font-black tracking-widest" style={{ color: '#FFD700' }}>PRÓXIMA CONQUISTA</p>
              </div>
              <p className="text-white font-black text-sm mb-1">Complete Pacific Ocean</p>
              <p className="text-[11px] text-white/50 mb-2">Recompensa:</p>
              <div className="flex flex-col gap-1 mb-3">
                <span className="text-[11px] text-yellow-300/80">⭐ +500 XP</span>
                <span className="text-[11px] text-yellow-300/80">🪙 +100 WOA Coins</span>
                <span className="text-[11px] text-yellow-300/80">🏅 Badge Explorer</span>
              </div>
              <div className="flex justify-between text-[10px] text-white/40 mb-1">
                <span>{completedPhaseIds.length}/{journeys.filter(j => j.phase_id > 0).length} Oceanos</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,215,0,0.12)' }}>
                <div className="h-full rounded-full" style={{ width: `${journeys.filter(j => j.phase_id > 0).length > 0 ? Math.round((completedPhaseIds.length / journeys.filter(j => j.phase_id > 0).length) * 100) : 0}%`, background: '#FFD700' }} />
              </div>
            </div>
          </section>

          {/* ── COMUNIDADE + WOA PLAY — 2 cols ── */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* COMUNIDADE */}
            <div className="rounded-2xl p-5 flex flex-col gap-3" style={{ background: 'rgba(5,14,26,0.75)', border: '1px solid rgba(255,107,53,0.2)' }}>
              <div className="flex items-center gap-2">
                <span className="text-base">👥</span>
                <p className="text-[10px] font-black tracking-widest" style={{ color: '#FF6B35' }}>COMUNIDADE</p>
              </div>
              <div className="flex-1 space-y-2">
                {recentPosts.slice(0, 2).map((p) => {
                  const TYPE_COLORS: Record<string, string> = { badge_earned: '#A855F7', streak_milestone: '#FF6B35', journey_completed: '#00D4FF', block_completed: '#22c55e', xp_milestone: '#FFD700' }
                  const color = TYPE_COLORS[p.post_type] ?? '#FF6B35'
                  const name = p.users?.name ?? 'Jogador'
                  const userId = p.users?.id
                  let detail = ''
                  switch (p.post_type) {
                    case 'badge_earned': detail = `conquistou o badge "${p.payload.badge}"`; break
                    case 'streak_milestone': detail = `atingiu ${p.payload.streak} dias`; break
                    case 'journey_completed': detail = 'completou uma Jornada'; break
                    case 'block_completed': { const j = journeys.find(j => j.phase_id === (p.payload.phaseId as number)); detail = `finalizou bloco da ${j?.title ?? 'Jornada'}`; break }
                    case 'xp_milestone': detail = `alcançou ${Number(p.payload.xp).toLocaleString('pt-BR')} XP`; break
                  }
                  const timeStr = (() => { const m = Math.floor((Date.now() - new Date(p.created_at).getTime()) / 60000); return m < 1 ? 'agora' : m < 60 ? `${m}m` : m < 1440 ? `${Math.floor(m/60)}h` : `${Math.floor(m/1440)}d` })()
                  return (
                    <div key={p.id} className="flex items-center gap-2 p-2 rounded-lg" style={{ background: `${color}10`, border: `1px solid ${color}20` }}>
                      <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs" style={{ background: `${color}20`, border: `1px solid ${color}40` }}>◆</div>
                      <div className="flex-1 min-w-0">
                        <Link href={`/profile/${userId}`} onClick={() => playClick()} className="text-[11px] font-black text-white hover:text-orange-300 transition-colors">{name}</Link>
                        <p className="text-[10px] text-white/50 truncate">{detail}</p>
                      </div>
                      <span className="text-[10px] shrink-0" style={{ color: `${color}70` }}>{timeStr}</span>
                    </div>
                  )
                })}
                {recentPosts.length === 0 && <p className="text-xs text-white/30 py-2">Nenhuma conquista ainda. Complete missões para aparecer aqui!</p>}
              </div>
              <Link href="/community" onClick={() => playClick()} className="block w-full py-2.5 text-center text-xs font-black tracking-widest rounded-xl text-white transition-all hover:scale-[1.02]" style={{ background: 'rgba(255,107,53,0.15)', border: '1px solid rgba(255,107,53,0.3)' }}>VER FEED →</Link>
            </div>

            {/* SIMULAÇÕES PREMIUM */}
            <div className="rounded-2xl p-5 flex flex-col gap-3" style={{ background: 'linear-gradient(135deg, rgba(88,28,135,0.8), rgba(59,7,100,0.9))', border: '1px solid rgba(168,85,247,0.35)' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">🎭</span>
                  <p className="text-[10px] font-black tracking-widest" style={{ color: '#E9D5FF' }}>SIMULAÇÕES PREMIUM</p>
                </div>
                {!isPremium && <span className="text-[9px] font-black px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#F3E8FF' }}>PREMIUM</span>}
              </div>

              <p className="text-xs text-white/70">
                {isPremium ? 'Escolha um tema e pratique conversação com a IA.' : 'Simule situações reais e pratique inglês em contexto.'}
              </p>

              {isPremium ? (
                <>
                  {/* Busca de temas com autocomplete */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Buscar tema (ex: 'restaurante', 'entrevista')..."
                      value={themeSearchQuery}
                      onChange={(e) => handleThemeSearch(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors"
                    />
                    {themeSearchQuery && themeSearchResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md z-20 max-h-60 overflow-y-auto">
                        {themeSearchResults.slice(0, 8).map((theme) => (
                          <button
                            key={theme.id}
                            type="button"
                            onClick={() => {
                              setSelectedThemeId(theme.id)
                              setThemeSearchQuery('')
                              setThemeSearchResults(TUTOR_THEMES)
                            }}
                            className="w-full px-3 py-2 text-left text-sm text-white/80 hover:bg-white/10 border-b border-white/5 last:border-b-0 transition-colors flex items-center gap-2"
                          >
                            <span className="text-lg">{theme.emoji}</span>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-white truncate">{theme.label}</p>
                              <p className="text-[10px] text-white/50 truncate">{theme.description}</p>
                            </div>
                          </button>
                        ))}
                        {themeSearchResults.length > 8 && (
                          <div className="px-3 py-2 text-center text-[10px] text-white/40 border-t border-white/5">
                            +{themeSearchResults.length - 8} mais temas...
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Tema selecionado */}
                  {selectedThemeId && getTutorThemeById(selectedThemeId) && (
                    <div className="rounded-xl p-3" style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)' }}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xl">{getTutorThemeById(selectedThemeId)!.emoji}</span>
                          <div className="min-w-0">
                            <p className="text-xs font-black text-white truncate">{getTutorThemeById(selectedThemeId)!.label}</p>
                            <p className="text-[9px] text-white/60 truncate">{getTutorThemeById(selectedThemeId)!.description}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedThemeId(null)}
                          className="text-white/40 hover:text-white/70 transition-colors flex-shrink-0"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      if (selectedThemeId) {
                        setConversationOpen(true)
                        setConversationLoading(true)
                        setConversationInput('')
                        setConversationMessages([])
                        setConversationHistory([])
                        setConversationStep(0)
                        setConversationVoiceError(null)

                        // Iniciar conversa com tema selecionado
                        fetch('/api/pronunciation/topic-chat', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ topic: selectedThemeId, history: [], userSpeech: '', questionNumber: 0 }),
                        })
                          .then(r => r.ok ? r.json() : { question: 'Let\'s start this conversation.' })
                          .then(data => {
                            const initialQuestion = data.question || 'Let\'s start this conversation.'
                            setConversationHistory([{ role: 'assistant', content: initialQuestion }])
                            setConversationMessages([{ role: 'assistant', content: initialQuestion }])
                            setConversationStep(data.questionNumber ?? 1)
                            // ✅ Reproduzir a primeira frase!
                            if (conversationVoiceEnabled) {
                              playTutorResponse(initialQuestion)
                            }
                          })
                          .catch(() => {
                            const fallbackMessage = 'Hi! Let\'s practice this topic in English. Go ahead and start.'
                            setConversationMessages([{ role: 'assistant', content: fallbackMessage }])
                            setConversationHistory([{ role: 'assistant', content: fallbackMessage }])
                            setConversationStep(1)
                            // ✅ Reproduzir a mensagem de fallback se voz ativada!
                            if (conversationVoiceEnabled) {
                              playTutorResponse(fallbackMessage)
                            }
                          })
                          .finally(() => setConversationLoading(false))
                      }
                    }}
                    disabled={!selectedThemeId}
                    className="block w-full py-2.5 text-center text-xs font-black tracking-widest rounded-xl text-white transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: 'linear-gradient(135deg, #7C3AED, #A855F7)', boxShadow: '0 4px 20px rgba(168,85,247,0.35)' }}
                  >
                    COMEÇAR SIMULAÇÃO
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedThemeId(null)
                      setThemeSearchQuery('')
                      setThemeSearchResults(TUTOR_THEMES)
                    }}
                    className="text-[10px] text-white/60 hover:text-white/80 transition-colors py-1 font-bold tracking-wide"
                  >
                    💡 Sugerir um tema diferente?
                  </button>
                </>
              ) : (
                <>
                  <div className="rounded-xl p-3 text-[11px] font-bold text-white/80" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    Disponível somente no plano premium
                  </div>
                  <button
                    type="button"
                    onClick={() => router.push('/premium')}
                    className="block w-full py-2.5 text-center text-xs font-black tracking-widest rounded-xl text-white transition-all hover:scale-[1.02]"
                    style={{ background: 'linear-gradient(135deg, #7C3AED, #A855F7)', boxShadow: '0 4px 20px rgba(168,85,247,0.35)' }}
                  >
                    VER PLANOS
                  </button>
                </>
              )}
            </div>

            {/* WOA PLAY */}
            <div className="rounded-2xl p-5 flex flex-col gap-3" style={{ background: 'rgba(5,14,26,0.75)', border: '1px solid rgba(255,215,0,0.2)' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">🎬</span>
                  <p className="text-[10px] font-black tracking-widest" style={{ color: '#FFD700' }}>WOA PLAY</p>
                </div>
                <span className="text-[9px] font-black px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,215,0,0.12)', border: '1px solid rgba(255,215,0,0.3)', color: '#FFD700' }}>PREMIUM</span>
              </div>
              <p className="text-xs text-white/60">Desbloqueie conteúdos exclusivos</p>
              <div className="grid grid-cols-4 gap-2">
                {[{ icon: '📹', label: 'Aulas Gravadas' }, { icon: '📚', label: 'E-books' }, { icon: '🎧', label: 'Podcasts' }, { icon: '👨‍🏫', label: 'Mentorias' }].map((item, i) => (
                  <div key={i} className="flex flex-col items-center gap-1 p-2 rounded-xl" style={{ background: 'rgba(255,215,0,0.06)', border: '1px solid rgba(255,215,0,0.12)' }}>
                    <span className="text-xl">{item.icon}</span>
                    <span className="text-[8px] text-white/50 text-center leading-tight">{item.label}</span>
                  </div>
                ))}
              </div>
              {isPremium ? (
                <Link href="/woaplay" onClick={() => playClick()} className="block w-full py-2.5 text-center text-xs font-black tracking-widest rounded-xl text-black transition-all hover:scale-[1.02]" style={{ background: 'linear-gradient(135deg, #FFD700, #CC8800)' }}>EXPLORAR →</Link>
              ) : (
                <button onClick={() => setShowWoaPlayPremiumModal(true)} className="block w-full py-2.5 text-center text-xs font-black tracking-widest rounded-xl text-white transition-all hover:scale-[1.02]" style={{ background: 'rgba(255,215,0,0.12)', border: '1px solid rgba(255,215,0,0.3)', color: '#FFD700' }}>🔒 DESBLOQUEAR</button>
              )}
            </div>

          </section>



          {/* ── EVOLUA MAIS RÁPIDO — Premium banner ── */}
          {!isPremium && (
            <section className="rounded-2xl p-6 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(88,28,135,0.7), rgba(59,7,100,0.8))', border: '1px solid rgba(168,85,247,0.3)' }}>
              <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #A855F7 2px, #A855F7 3px)' }} />
              <div className="relative">
                <p className="text-[10px] font-black tracking-[0.25em] mb-1" style={{ color: 'rgba(216,180,254,0.7)' }}>🚀 EVOLUA MAIS RÁPIDO</p>
                <p className="text-white text-sm mb-4 leading-relaxed">Com o Premium você desbloqueia tudo que acelera sua fluência.</p>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-5">
                  {[
                    { icon: '🤖', label: 'Oliver\nAI Tutor' },
                    { icon: '💬', label: 'Conversação\nIA' },
                    { icon: '📡', label: 'Aulas\nao vivo' },
                    { icon: '📜', label: 'Certificados' },
                    { icon: '🎬', label: 'WOA Play' },
                    { icon: '⚔️', label: 'Missões\nAvançadas' },
                  ].map((f, i) => (
                    <div key={i} className="flex flex-col items-center gap-1 p-2 rounded-xl" style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)' }}>
                      <span className="text-xl">{f.icon}</span>
                      <span className="text-[8px] text-center leading-tight" style={{ color: 'rgba(216,180,254,0.7)', whiteSpace: 'pre-line' }}>{f.label}</span>
                    </div>
                  ))}
                </div>
                <Link
                  href="/premium"
                  onClick={() => playClick()}
                  className="block w-full py-3.5 text-center font-black text-sm tracking-widest rounded-xl text-white transition-all hover:scale-[1.02]"
                  style={{ background: 'linear-gradient(135deg, #7C3AED, #A855F7)', boxShadow: '0 4px 20px rgba(168,85,247,0.4)' }}
                >
                  ATIVAR PREMIUM
                </Link>
              </div>
            </section>
          )}

        </div>

        {/* ── FOOTER ── */}
        <footer className="py-5 text-center border-t border-cyan-400/10">
          <p className="text-[11px] text-blue-200/30 tracking-[0.2em]">WOA TALK © 2026 — SUA JORNADA ÉPICA NO INGLÊS</p>
        </footer>
      </div>
      {/* ── BADGES MODAL ── */}
      {badgesOpen && <BadgesModal onClose={() => setBadgesOpen(false)} />}

      {/* ── DESAFIOS MODAL ── */}
      {challengeOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(8px)' }}
          onClick={() => setChallengeOpen(false)}
        >
          <div
            className="relative w-full max-w-xl max-h-[84vh] overflow-y-auto rounded-3xl p-4 sm:p-5"
            style={{ background: 'rgba(5,14,26,0.97)', border: '1px solid rgba(255,215,0,0.3)', boxShadow: '0 0 60px rgba(255,180,0,0.12)' }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setChallengeOpen(false)}
              className="absolute top-4 right-4 text-white/30 hover:text-white/70 transition-colors text-lg leading-none"
            >✕</button>

            <div className="mb-4">
              <p className="text-[10px] font-black tracking-[0.25em] mb-2" style={{ color: 'rgba(255,215,0,0.75)' }}>DESAFIOS</p>
              <h3 className="text-2xl font-black text-white">Seu progresso na rotina</h3>
            </div>

            <div className="space-y-3">
              {(Object.keys(challengeSnapshot) as ChallengePeriod[]).map((period) => {
                const summary = challengeSnapshot[period]
                const progressPercent = summary.percent

                return (
                  <div key={period} className="rounded-2xl p-3.5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div>
                        <p className="text-[10px] font-black tracking-widest text-white/60">{summary.meta.title}</p>
                        <p className="text-[11px] text-white/40 mt-1">{summary.meta.subtitle}</p>
                        <p className="text-lg font-black text-white mt-2">{summary.done}/{summary.total} concluídos</p>
                      </div>
                      <span className="text-[10px] font-black tracking-widest px-2 py-1 rounded-full" style={{ background: 'rgba(255,215,0,0.12)', border: '1px solid rgba(255,215,0,0.25)', color: '#FFD700' }}>
                        {progressPercent}%
                      </span>
                    </div>

                    <div className="rounded-xl p-2.5 mb-3" style={{ background: 'rgba(255,215,0,0.06)', border: '1px solid rgba(255,215,0,0.18)' }}>
                      <p className="text-[9px] font-black tracking-widest mb-1" style={{ color: '#FFD700' }}>RECOMPENSA</p>
                      <p className="text-sm font-bold text-white">{summary.meta.reward}</p>
                    </div>

                    <div className="mb-3">
                      <p className="text-[10px] font-black tracking-widest text-white/50 mb-2">O QUE PRECISA FAZER</p>
                      <ul className="space-y-2 text-sm text-white/75">
                        {summary.meta.description.map((item) => (
                          <li key={item} className="flex gap-2">
                            <span className="text-cyan-400 mt-0.5">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="h-2 rounded-full overflow-hidden mb-3" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${progressPercent}%`, background: 'linear-gradient(90deg, #00D4FF, #FFD700)' }} />
                    </div>

                    <div className="space-y-2">
                      {summary.goals.map((goal) => {
                        const ratio = Math.min((goal.current / goal.target) * 100, 100)
                        return (
                          <div key={goal.key} className="rounded-xl p-2.5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <div className="flex items-center justify-between gap-3 mb-1.5">
                              <span className="text-[11px] font-bold text-white/80">{goal.label}</span>
                              <span className="text-[10px] font-black" style={{ color: goal.color }}>
                                {goal.current}{goal.suffix}/{goal.target}{goal.suffix}
                              </span>
                            </div>
                            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                              <div className="h-full rounded-full transition-all" style={{ width: `${ratio}%`, background: goal.color }} />
                            </div>
                            {goal.note && <p className="text-[9px] text-white/40 mt-1">{goal.note}</p>}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── CONVERSAÇÃO PREMIUM MODAL ── */}
      {conversationOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(8px)' }}
          onClick={() => setConversationOpen(false)}
        >
          <div
            className="relative w-full max-w-2xl max-h-[82vh] rounded-[28px] flex flex-col"
            style={{ background: 'linear-gradient(180deg, rgba(21,16,42,0.98), rgba(8,15,30,0.98))', border: '1px solid rgba(168,85,247,0.3)', boxShadow: '0 0 80px rgba(168,85,247,0.2)' }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setConversationOpen(false)}
              className="absolute top-5 right-5 text-white/30 hover:text-white/70 transition-colors text-2xl leading-none z-10"
            >✕</button>

            {/* Header - não scrolla */}
            <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-0 flex-shrink-0">
              <div className="pr-10">
                <p className="text-[12px] sm:text-[14px] font-black tracking-[0.28em] mb-2" style={{ color: 'rgba(216,180,254,0.7)' }}>SIMULAÇÃO PREMIUM</p>
                <h3 className="text-3xl sm:text-4xl font-black text-white leading-tight">
                  {selectedThemeId && getTutorThemeById(selectedThemeId) 
                    ? `${getTutorThemeById(selectedThemeId)!.emoji} ${getTutorThemeById(selectedThemeId)!.label}`
                    : 'Conversa com IA'
                  }
                </h3>
                <p className="text-base sm:text-lg text-white/70 mt-2 leading-relaxed">The conversation stays in English. Practice speaking and listening in a real scenario.</p>
              </div>

              {/* Voice toggle */}
              <div className="mt-4 flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="flex items-center gap-2">
                  <span className="text-sm">🎤</span>
                  <span className="text-sm font-bold text-white">Chat por voz</span>
                </div>
                <button
                  type="button"
                  onClick={() => setConversationVoiceEnabled(!conversationVoiceEnabled)}
                  className="w-10 h-6 rounded-full transition-colors flex items-center px-1"
                  style={{ background: conversationVoiceEnabled ? 'rgba(168,85,247,0.5)' : 'rgba(255,255,255,0.1)' }}
                >
                  <div
                    className="w-4 h-4 rounded-full bg-white transition-transform"
                    style={{ transform: conversationVoiceEnabled ? 'translateX(16px)' : 'translateX(0)' }}
                  />
                </button>
              </div>

              {conversationVoiceError && (
                <div className="mt-3 px-3 py-2 rounded-lg text-xs text-red-300" style={{ background: 'rgba(255,0,0,0.1)', border: '1px solid rgba(255,0,0,0.2)' }}>
                  {conversationVoiceError}
                </div>
              )}
            </div>

            {/* Mensagens - scrolla */}
            <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-4 pr-2">
              {conversationMessages.length === 0 && !conversationLoading && (
                <div className="rounded-2xl p-4 text-base sm:text-lg text-white/60" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  Preparing your practice conversation...
                </div>
              )}

              {conversationMessages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`rounded-2xl p-4 text-base sm:text-lg leading-relaxed ${message.role === 'assistant' ? 'ml-0 mr-8' : 'ml-8 mr-0'}`}
                  style={{
                    background: message.role === 'assistant' ? 'rgba(168,85,247,0.12)' : 'rgba(0,212,255,0.12)',
                    border: `1px solid ${message.role === 'assistant' ? 'rgba(168,85,247,0.2)' : 'rgba(0,212,255,0.2)'}`,
                    color: 'rgba(255,255,255,0.9)',
                  }}
                >
                  {message.content}
                </div>
              ))}

              {conversationLoading && (
                <div className="rounded-2xl p-4 text-base sm:text-lg text-white/60" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  The coach is preparing the next question...
                </div>
              )}

              {voiceTranscribing && (
                <div className="rounded-2xl p-4 text-base sm:text-lg text-white/60 flex items-center gap-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <span className="inline-block animate-spin">⏳</span>
                  Transcribing your audio...
                </div>
              )}
            </div>

            {/* Input + Botão - sempre visível no fundo */}
            <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-3 flex-shrink-0 border-t" style={{ borderTopColor: 'rgba(255,255,255,0.08)' }}>
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <textarea
                    value={conversationInput}
                    onChange={(e) => setConversationInput(e.target.value)}
                    rows={3}
                    placeholder={conversationVoiceEnabled ? "Fale ou digite sua resposta em inglês..." : "Type your answer in English..."}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-base sm:text-lg text-white placeholder-white/30 resize-none"
                  />
                  {conversationVoiceEnabled && (
                    <button
                      type="button"
                      onClick={() => {
                        if (voiceRecording) {
                          stopVoiceRecording()
                        } else {
                          startVoiceRecording()
                        }
                      }}
                      disabled={voiceTranscribing}
                      className="absolute bottom-3 right-3 text-2xl transition-transform hover:scale-110 disabled:opacity-50"
                      title={voiceRecording ? 'Stop recording' : 'Start recording'}
                    >
                      {voiceRecording 
                        ? '🛑' 
                        : voiceTranscribing 
                        ? '⏳' 
                        : '🎤'
                      }
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleSendConversationMessage}
                  disabled={conversationLoading || !conversationInput.trim()}
                  className="self-end rounded-2xl px-5 py-4 text-sm sm:text-base font-black tracking-widest text-white disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #7C3AED, #A855F7)' }}
                >
                  SEND
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── WOAPLAY PREMIUM MODAL ── */}
      {showWoaPlayPremiumModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(8px)' }}
          onClick={() => setShowWoaPlayPremiumModal(false)}
        >
          <div
            className="relative w-full max-w-sm rounded-3xl p-8 flex flex-col items-center gap-5 text-center"
            style={{ background: 'linear-gradient(160deg, rgba(30,20,0,0.98), rgba(15,10,0,0.98))', border: '1px solid rgba(255,215,0,0.35)', boxShadow: '0 0 60px rgba(255,180,0,0.18)' }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setShowWoaPlayPremiumModal(false)}
              className="absolute top-4 right-4 text-white/30 hover:text-white/70 transition-colors text-lg leading-none"
            >✕</button>

            <div className="text-5xl">🎬</div>

            <div>
              <p className="text-[10px] font-black tracking-[0.25em] mb-1" style={{ color: 'rgba(255,215,0,0.6)' }}>WOA PLAY</p>
              <h3 className="text-xl font-black text-white">Recurso Premium</h3>
            </div>

            <p className="text-white/60 text-sm leading-relaxed">
              O WOA Play é exclusivo para assinantes Premium. Acesse cursos em vídeo, aulas especiais e muito mais conteúdo para acelerar seu inglês.
            </p>

            <div className="w-full space-y-3 pt-1">
              <Link
                href="/premium"
                onClick={() => setShowWoaPlayPremiumModal(false)}
                className="block w-full py-3.5 rounded-xl font-black text-sm tracking-widest text-center text-black transition-all hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #FFD700, #CC8800)', boxShadow: '0 0 24px rgba(255,215,0,0.35)' }}
              >
                🚀 VER PLANOS PREMIUM
              </Link>
              <button
                onClick={() => setShowWoaPlayPremiumModal(false)}
                className="w-full py-2.5 rounded-xl font-bold text-xs tracking-widest transition-all hover:opacity-70"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.35)' }}
              >
                FECHAR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── LEVEL MODAL ── */}
      {levelOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
          onClick={() => setLevelOpen(false)}
        >
          <div
            className="relative w-full max-w-xs rounded-3xl p-8 flex flex-col items-center gap-4"
            style={{ background: 'rgba(5,14,26,0.97)', border: '1px solid #00D4FF40', boxShadow: '0 0 60px rgba(0,212,255,0.15)' }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setLevelOpen(false)}
              className="absolute top-4 right-4 text-white/30 hover:text-white/70 transition-colors text-lg leading-none"
            >✕</button>

            <p className="text-[10px] font-black tracking-[0.25em] text-cyan-400/60">SEU NÍVEL</p>
            <p className="text-7xl font-black text-white" style={{ textShadow: '0 0 30px #00D4FF' }}>
              {level}
            </p>

            <div className="w-full">
              <div className="flex justify-between text-[10px] text-white/40 mb-1.5">
                <span>{xpIntoLevel.toLocaleString('pt-BR')} XP</span>
                <span>{xpForLevel.toLocaleString('pt-BR')} XP</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(0,212,255,0.12)' }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${xpProgress}%`, background: 'linear-gradient(90deg,#00D4FF,#00F0C8)' }} />
              </div>
              <p className="text-xs text-blue-100/60 mt-2 text-center">
                Falta <span className="text-cyan-400 font-bold">{xpToNext.toLocaleString('pt-BR')} XP</span> para o nível {level + 1}
              </p>
            </div>

            <div className="w-full h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />

            <div className="flex flex-col items-center gap-1">
              <p className="text-[10px] text-white/30 tracking-widest">XP TOTAL ACUMULADO</p>
              <p className="text-2xl font-black" style={{ color: '#00D4FF', textShadow: '0 0 14px #00D4FF' }}>
                {xpTotal.toLocaleString('pt-BR')} XP
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── SIDEBAR EXPLORADOR ── */}
      {/* Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Panel */}
      <div
        className="fixed top-0 right-0 h-full z-50 flex flex-col"
        style={{
          width: 'min(300px, 80vw)',
          background: 'rgba(5,14,26,0.97)',
          borderLeft: '1px solid rgba(0,212,255,0.2)',
          boxShadow: '-8px 0 40px rgba(0,0,0,0.6)',
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        {/* Close */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <span className="text-[9px] sm:text-[10px] font-black tracking-[0.2em] sm:tracking-[0.25em]" style={{ color: 'rgba(255,255,255,0.4)' }}>EXPLORADOR</span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="w-7 h-7 flex items-center justify-center rounded-full text-white/40 hover:text-white/80 transition-colors"
            style={{ background: 'rgba(255,255,255,0.07)' }}
          >
            ✕
          </button>
        </div>

        {/* Avatar placeholder */}
        <div className="flex flex-col items-center pt-6 sm:pt-8 pb-4 sm:pb-6 px-4 sm:px-6">
          <div
            className="w-16 sm:w-20 h-16 sm:h-20 rounded-full flex items-center justify-center mb-3 sm:mb-4"
            style={{
              background: 'linear-gradient(135deg, rgba(0,67,187,0.5), rgba(0,212,255,0.2))',
              border: '2px solid rgba(0,212,255,0.35)',
              boxShadow: '0 0 24px rgba(0,212,255,0.2)',
            }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="sm:w-9 sm:h-9">
              <circle cx="12" cy="8" r="4" fill="rgba(0,212,255,0.6)" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="rgba(0,212,255,0.6)" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </div>

          {/* Name */}
          <p className="text-sm sm:text-base font-black text-white tracking-wide text-center">
            {session?.user?.name ?? 'Herói'}
          </p>
          <p className="text-[9px] sm:text-[10px] mt-1 tracking-widest" style={{ color: 'rgba(0,212,255,0.55)' }}>
            {session?.user?.email ?? ''}
          </p>
        </div>

        <div className="flex-1 px-4 sm:px-6 space-y-4 sm:space-y-6 overflow-y-auto">
          {/* Level + XP bar */}
          <div
            className="rounded-xl p-3 sm:p-4"
            style={{ background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.15)' }}
          >
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <span className="text-[9px] sm:text-[10px] font-black tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>NÍVEL</span>
              <span className="text-xl sm:text-2xl font-black" style={{ color: '#00D4FF', textShadow: '0 0 12px rgba(0,212,255,0.6)' }}>
                {level}
              </span>
            </div>

            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] sm:text-xs font-bold" style={{ color: '#00D4FF' }}>{xpIntoLevel.toLocaleString('pt-BR')} XP</span>
              <span className="text-[9px] sm:text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>{xpForLevel.toLocaleString('pt-BR')} XP</span>
            </div>
            <div
              className="w-full h-3 rounded-full overflow-hidden"
              style={{ background: 'rgba(0,212,255,0.12)', border: '1px solid rgba(0,212,255,0.18)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${xpProgress}%`,
                  background: 'linear-gradient(90deg,#0043BB,#00D4FF,#00F0C8)',
                  boxShadow: '0 0 8px rgba(0,212,255,0.5)',
                }}
              />
            </div>
            <p className="text-[9px] sm:text-[10px] mt-2 text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {xpToNext.toLocaleString('pt-BR')} XP para o próximo nível
            </p>

            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-white/5 flex items-center justify-between">
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-xs sm:text-sm font-black" style={{ color: '#00D4FF' }}>{xpTotal.toLocaleString('pt-BR')}</span>
                <span className="text-[8px] sm:text-[9px] tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>XP TOTAL</span>
              </div>
              <div className="w-px h-7 sm:h-8" style={{ background: 'rgba(255,255,255,0.08)' }} />
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-xs sm:text-sm font-black" style={{ color: '#FFA940' }}>{coinsBalance}</span>
                <span className="text-[8px] sm:text-[9px] tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>MOEDAS</span>
              </div>
            </div>
          </div>

          {/* History rewards button */}
          <Link
            href="/history"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center justify-between w-full rounded-xl px-3 sm:px-4 py-2.5 sm:py-3.5 transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: 'rgba(192,132,252,0.1)',
              border: '1px solid rgba(192,132,252,0.25)',
            }}
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-lg sm:text-xl">🏆</span>
              <div>
                <p className="text-xs sm:text-sm font-black tracking-wider text-white">HISTORY REWARDS</p>
                <p className="text-[8px] sm:text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>XP, moedas e badges ganhos</p>
              </div>
            </div>
            <span style={{ color: 'rgba(192,132,252,0.7)', fontSize: '16px' }} className="sm:text-lg">›</span>
          </Link>

          {/* Tutor de Pronúncia */}
          <Link
            href="/tutor"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center justify-between w-full rounded-xl px-3 sm:px-4 py-2.5 sm:py-3.5 transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: 'rgba(168,85,247,0.1)',
              border: '1px solid rgba(168,85,247,0.25)',
            }}
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-lg sm:text-xl">🦉</span>
              <div>
                <p className="text-xs sm:text-sm font-black tracking-wider text-white">TUTOR DE PRONÚNCIA</p>
                <p className="text-[8px] sm:text-[10px]" style={{ color: 'rgba(168,85,247,0.7)' }}>Suas palavras mais desafiadoras</p>
              </div>
            </div>
            <span style={{ color: 'rgba(168,85,247,0.7)', fontSize: '16px' }} className="sm:text-lg">›</span>
          </Link>

          {/* Profile button */}
          <Link
            href="/profile"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center justify-between w-full rounded-xl px-3 sm:px-4 py-2.5 sm:py-3.5 transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: 'rgba(0,212,255,0.1)',
              border: '1px solid rgba(0,212,255,0.25)',
            }}
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-lg sm:text-xl">👤</span>
              <div>
                <p className="text-xs sm:text-sm font-black tracking-wider text-white">VER PERFIL</p>
                <p className="text-[8px] sm:text-[10px]" style={{ color: 'rgba(0,212,255,0.55)' }}>Editar informações</p>
              </div>
            </div>
            <span style={{ color: 'rgba(0,212,255,0.7)', fontSize: '16px' }} className="sm:text-lg">›</span>
          </Link>

          {/* Support button */}
          <Link
            href="/support"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center justify-between w-full rounded-xl px-3 sm:px-4 py-2.5 sm:py-3.5 transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: 'rgba(34,197,94,0.10)',
              border: '1px solid rgba(34,197,94,0.30)',
            }}
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-lg sm:text-xl">🛟</span>
              <div>
                <p className="text-xs sm:text-sm font-black tracking-wider text-white">SUPORTE</p>
                <p className="text-[8px] sm:text-[10px]" style={{ color: 'rgba(34,197,94,0.70)' }}>Abra uma solicitação de ajuda</p>
              </div>
            </div>
            <span style={{ color: 'rgba(34,197,94,0.8)', fontSize: '16px' }} className="sm:text-lg">›</span>
          </Link>

          {/* Verify email button — only shown if not verified */}
          {!isEmailVerified && (
            <button
              onClick={() => { setShowVerifyModal(true); setVerifyStep('send'); setVerifyError(null) }}
              className="flex items-center gap-2 sm:gap-3 w-full rounded-xl px-3 sm:px-4 py-2.5 sm:py-3.5 transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: 'rgba(234,179,8,0.1)',
                border: '1px solid rgba(234,179,8,0.4)',
                boxShadow: '0 0 12px rgba(234,179,8,0.1)',
              }}
            >
              <span className="text-lg sm:text-xl">🔒</span>
              <div className="text-left">
                <p className="text-xs sm:text-sm font-black tracking-wider" style={{ color: '#eab308' }}>VERIFICAR MINHA CONTA</p>
                <p className="text-[8px] sm:text-[10px]" style={{ color: 'rgba(234,179,8,0.55)' }}>Email ainda não confirmado</p>
              </div>
            </button>
          )}
        </div>

        {/* Logout */}
        <div className="px-4 sm:px-6 pb-6 pt-2">
          <button
            onClick={() => { playClick(); signOut({ redirect: true }) }}
            className="flex items-center gap-2 sm:gap-3 w-full rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444' }}
          >
            <span className="text-lg sm:text-xl">🚪</span>
            <div className="text-left">
              <p className="text-xs sm:text-sm font-black tracking-wider">SAIR DA CONTA</p>
              <p className="text-[8px] sm:text-[10px]" style={{ color: 'rgba(239,68,68,0.5)' }}>Encerrar sessão</p>
            </div>
          </button>
        </div>
      </div>
      {/* ── VERIFY EMAIL MODAL ── */}
      {showVerifyModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowVerifyModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6 space-y-5"
            style={{ background: '#0a1628', border: '1px solid rgba(234,179,8,0.4)', boxShadow: '0 0 40px rgba(234,179,8,0.1)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {verifyStep === 'send' && (
              <>
                <div className="text-center">
                  <p className="text-2xl mb-2">📧</p>
                  <p className="text-yellow-300 font-black tracking-widest text-sm">VERIFICAR CONTA</p>
                  <p className="text-blue-200/60 text-xs mt-2">
                    Enviaremos um código de 6 dígitos para<br />
                    <strong className="text-white">{session?.user?.email}</strong>
                  </p>
                </div>
                {verifyError && <p className="text-red-400 text-xs text-center">{verifyError}</p>}
                <button
                  onClick={handleSendVerifyCode}
                  disabled={verifyLoading}
                  className="w-full py-3 rounded-xl font-black tracking-widest text-sm text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #b45309, #eab308)', boxShadow: '0 0 20px rgba(234,179,8,0.3)' }}
                >
                  {verifyLoading ? 'Enviando...' : '📨 ENVIAR CÓDIGO'}
                </button>
                <button onClick={() => setShowVerifyModal(false)} className="w-full text-center text-xs text-blue-200/40 hover:text-blue-200/70 transition-colors">Fechar</button>
              </>
            )}

            {verifyStep === 'input' && (
              <>
                <div className="text-center">
                  <p className="text-yellow-300 font-black tracking-widest text-sm">INSIRA O CÓDIGO</p>
                  <p className="text-blue-200/50 text-xs mt-1">Código enviado para {session?.user?.email}</p>
                </div>
                {verifyError && <p className="text-red-400 text-xs text-center bg-red-500/10 py-2 rounded-lg border border-red-500/20">{verifyError}</p>}
                <div className="flex gap-1.5 justify-center">
                  {verifyCode.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { verifyInputRefs.current[i] = el }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => {
                        if (!/^\d*$/.test(e.target.value)) return
                        const next = [...verifyCode]; next[i] = e.target.value; setVerifyCode(next)
                        if (e.target.value && i < 5) verifyInputRefs.current[i + 1]?.focus()
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Backspace') {
                          const next = [...verifyCode]; next[i] = ''; setVerifyCode(next)
                          if (i > 0) verifyInputRefs.current[i - 1]?.focus()
                        }
                      }}
                      onPaste={(e) => {
                        const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6).split('')
                        if (digits.length === 6) { setVerifyCode(digits); verifyInputRefs.current[5]?.focus(); e.preventDefault() }
                      }}
                      className="w-11 h-11 text-center text-xl font-black text-white rounded-lg outline-none"
                      style={{
                        background: 'rgba(255,255,255,0.08)',
                        border: `2px solid ${digit ? 'rgba(234,179,8,0.8)' : 'rgba(255,255,255,0.2)'}`,
                        boxShadow: digit ? '0 0 12px rgba(234,179,8,0.3)' : 'none',
                      }}
                    />
                  ))}
                </div>
                <button
                  onClick={handleVerifyCode}
                  disabled={verifyLoading || verifyCode.some(d => !d)}
                  className="w-full py-3 rounded-xl font-black tracking-widest text-sm text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg, #b45309, #eab308)', boxShadow: '0 0 20px rgba(234,179,8,0.3)' }}
                >
                  {verifyLoading ? 'Verificando...' : '✓ CONFIRMAR'}
                </button>
                <button onClick={() => setVerifyStep('send')} className="w-full text-center text-xs text-blue-200/40 hover:text-blue-200/70 transition-colors">← Reenviar código</button>
              </>
            )}

            {verifyStep === 'done' && (
              <div className="text-center space-y-4 py-2">
                <p className="text-4xl">✓</p>
                <p className="text-green-400 font-black tracking-widest text-sm">EMAIL VERIFICADO!</p>
                <p className="text-blue-200/60 text-xs">Sua conta está completamente ativa agora.</p>
                <button
                  onClick={() => setShowVerifyModal(false)}
                  className="w-full py-3 rounded-xl font-black tracking-widest text-sm text-white transition-all hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, #15803d, #22c55e)', boxShadow: '0 0 20px rgba(34,197,94,0.3)' }}
                >
                  FECHAR
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <EagleTip
        storageKey="eagle_dashboard_welcome"
        lines={[
          '🦅 Bem-vindo ao fundo do mar, explorador!',
          'Você mergulhou fundo e agora precisa subir à superfície.',
          'Siga sua Jornada e resolva as missões para ganhar XP e voltar ao topo!',
        ]}
        buttonLabel="VAMOS COMEÇAR"
      />
      
      {/* Audio element for TTS playback */}
      <audio ref={audioRef} style={{ display: 'none' }} crossOrigin="anonymous" />
    </main>
  )
}
