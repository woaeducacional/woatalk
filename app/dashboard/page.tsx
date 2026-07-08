'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import { Button } from '@/src/components/ui/Button'
import Link from 'next/link'
import { playClick, playBubble } from '@/lib/sounds'
import { EagleTip } from '@/src/components/EagleTip'
import { BadgesModal } from '@/src/components/BadgesModal'
import { NotificationBell } from '@/src/components/NotificationBell'
import { calcLevel } from '@/lib/level'

interface TickerPost {
  id: string
  post_type: string
  payload: Record<string, unknown>
  created_at: string
  users: { id: string; name: string; avatar_url: string | null }
}

type JourneyItem = { phase_id: number; title: string; description: string; blocked: boolean; is_pro: boolean; icon_url?: string | null }

const OCEAN_ICONS_DEFAULT = '/images/jornada-secreta.png'

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

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [xpTotal, setXpTotal] = useState(0)
  const [coinsBalance, setCoinsBalance] = useState(0)
  const [streakCount, setStreakCount] = useState(0)
  const [badgeCount, setBadgeCount] = useState(0)
  const [badgesOpen, setBadgesOpen] = useState(false)
  const [levelOpen, setLevelOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [journeys, setJourneys] = useState<JourneyItem[]>([])
  const [lastPhaseId, setLastPhaseId] = useState<number | null>(null)
  const [isEmailVerified, setIsEmailVerified] = useState(true)
  const [recentPosts, setRecentPosts] = useState<TickerPost[]>([])
  const [showVerifyModal, setShowVerifyModal] = useState(false)
  const [verifyCode, setVerifyCode] = useState(['', '', '', '', '', ''])
  const [verifyStep, setVerifyStep] = useState<'send' | 'input' | 'done'>('send')
  const [verifyError, setVerifyError] = useState<string | null>(null)
  const [verifyLoading, setVerifyLoading] = useState(false)
  const verifyInputRefs = useRef<(HTMLInputElement | null)[]>([])
  const [isPremium, setIsPremium] = useState(false)
  const [dailyAccessedPhaseIds,  setDailyAccessedPhaseIds]  = useState<number[]>([])

  const refreshDailyAccess = useCallback(() => {
    fetch('/api/journey/daily-access')
      .then(r => r.ok ? r.json() : { accessedPhaseIds: [] })
      .then(d => setDailyAccessedPhaseIds(d.accessedPhaseIds ?? []))
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
      .then(r => r.ok ? r.json() : { xp_total: 0, coins_balance: 0 })
      .then(d => {
        setXpTotal(d.xp_total ?? 0)
        setCoinsBalance(d.coins_balance ?? 0)
        setStreakCount(d.streak_count ?? 0)
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
            {isAdmin && (
              <div className="flex justify-end px-4 mb-2">
                <Link href="/admin/journey-content/new" onClick={() => playClick()} className="text-[10px] font-black tracking-widest px-3 py-1.5 rounded-lg" style={{ background: 'rgba(0,102,255,0.15)', border: '1px solid rgba(0,212,255,0.3)', color: '#00D4FF' }}>+ CRIAR JORNADA</Link>
              </div>
            )}
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
    </main>
  )
}
