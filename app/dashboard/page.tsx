'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
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

function CircleCard({ journey, isCenter }: { journey: JourneyItem; isCenter: boolean }) {
  const iconSrc = journey.icon_url || OCEAN_ICONS_DEFAULT
  const locked = journey.blocked
  const size = isCenter ? 176 : 136
  return (
    <div className="flex flex-col items-center gap-2">
    <div
      className="flex items-center justify-center rounded-full relative overflow-hidden"
      style={{
        width: size,
        height: size,
        background: locked
          ? 'linear-gradient(135deg, #0d0d1a, #1a1a2e)'
          : isCenter
          ? 'radial-gradient(circle at 35% 30%, #0055FF, #001A60)'
          : 'radial-gradient(circle at 35% 30%, #003AB0, #000D30)',
        border: locked
          ? '2px solid rgba(255,255,255,0.12)'
          : isCenter
          ? '3px solid #00D4FF'
          : '2px solid rgba(0,212,255,0.35)',
        boxShadow: isCenter && !locked
          ? '0 0 50px rgba(0,212,255,0.45), inset 0 0 25px rgba(0,102,255,0.2)'
          : 'none',
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
            background: 'radial-gradient(ellipse, rgba(255,255,255,0.28), transparent)',
            borderRadius: '50%',
            transform: 'rotate(-20deg)',
          }}
        />
      )}
      <Image
        src={iconSrc}
        alt={journey.title}
        width={isCenter ? 130 : 80}
        height={isCenter ? 130 : 80}
        className={`object-contain relative z-10 ${locked ? 'grayscale opacity-35' : ''}`}
      />
      {locked && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span style={{ fontSize: isCenter ? 32 : 20, opacity: 0.5 }}>🔒</span>
        </div>
      )}
    </div>
    {!isCenter && (
      <p
        className="text-center font-bold tracking-wide"
        style={{
          fontSize: 9,
          color: locked ? 'rgba(255,255,255,0.3)' : 'rgba(0,212,255,0.7)',
          letterSpacing: '0.12em',
          maxWidth: size,
          lineHeight: 1.3,
        }}
      >
        {journey.title.toUpperCase()}
      </p>
    )}
    </div>
  )
}

function JourneyGlobeCarousel({
  journeys,
  lastPhaseId,
  isAdmin,
  onToggleBlocked,
}: {
  journeys: JourneyItem[]
  lastPhaseId: number | null
  isAdmin: boolean
  onToggleBlocked: (phaseId: number) => void
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
          {leftJ && <CircleCard journey={leftJ} isCenter={false} />}
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
          <CircleCard journey={centerJ} isCenter={true} />
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
          {rightJ && <CircleCard journey={rightJ} isCenter={false} />}
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

        {isAdmin && (
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

  useEffect(() => {
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
        const allJourneys = d.journeys ?? []
        
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
  }, [])

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
          src="/images/fundo_do_mar.png"
          alt="Fundo do Mar"
          fill
          className="object-cover object-bottom"
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
        <header className="sticky top-0 z-40 flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 border-b border-cyan-400/20 backdrop-blur-md" style={{ background: 'rgba(5,14,26,0.72)' }}>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative w-8 sm:w-10 h-8 sm:h-10">
              <div className="absolute inset-0 rounded-full blur-lg bg-cyan-400/40" />
              <Image src="/images/logo.png" alt="WOA Talk" fill className="relative rounded-full border-2 border-cyan-400/60 object-cover" />
            </div>
            <div>
              <span className="text-sm sm:text-base font-black tracking-[0.12em] sm:tracking-[0.18em] text-white" style={{ textShadow: '0 0 12px rgba(0,212,255,0.5)' }}>
                WOA TALK
              </span>
              <p className="text-[8px] sm:text-[10px] text-cyan-400/50 tracking-widest">SUA JORNADA ÉPICA</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <NotificationBell />
            <Link
              href="/premium"
              onClick={() => playClick()}
              className="text-[11px] sm:text-xs font-black tracking-widest px-3 sm:px-4 py-1.5 sm:py-2 rounded transition-all hover:scale-105"
              style={{ border: '1px solid rgba(255,215,0,0.5)', color: '#FFD700', background: 'rgba(255,215,0,0.12)' }}
            >
              PREMIUM
            </Link>
            <button
              onClick={() => { playClick(); setSidebarOpen(true) }}
              className="text-[11px] sm:text-xs font-black tracking-widest px-3 sm:px-4 py-1.5 sm:py-2 rounded transition-all hover:scale-105"
              style={{ border: '1px solid rgba(0,212,255,0.35)', color: '#00D4FF', background: 'rgba(0,212,255,0.08)' }}
            >
              EXPLORADOR
            </button>
            <button
              onClick={() => { playClick(); (signOut({ redirect: true }) as any) }}
              className="text-[11px] sm:text-xs font-bold tracking-widest px-3 sm:px-4 py-1.5 sm:py-2 rounded border border-red-500/30 text-red-400/70 hover:border-red-400/60 hover:text-red-300 transition-all"
            >
              SAIR
            </button>
          </div>
        </header>

        <div className="flex-1 max-w-5xl mx-auto w-full px-4 py-10 space-y-10">

          {/* ── WELCOME ── */}
          <section className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-3 border border-cyan-400/25" style={{ background: 'rgba(0,212,255,0.07)' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-cyan-300/70 text-[10px] font-bold tracking-[0.18em]">BEM-VINDO DE VOLTA</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white" style={{ textShadow: '0 0 30px rgba(0,212,255,0.25)' }}>
                {session?.user?.name?.split(' ')[0] ?? 'Herói'}, <span style={{ color: '#00D4FF' }}>pronto</span> para mergulhar?
              </h2>
              <p className="text-blue-200/55 text-sm mt-2">Continue sua jornada e desbloqueie novos oceanos.</p>
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              <Link
                href="/community"
                onClick={() => playClick()}
                className="px-7 py-3 font-black text-sm tracking-widest rounded-lg text-white transition-all hover:scale-105 text-center"
                style={{ background: 'linear-gradient(135deg,#B05000,#FF6B00)', border: '2px solid #FF9A00', boxShadow: '0 0 24px rgba(255,107,0,0.4)' }}
              >
                COMUNIDADE
              </Link>
              {isAdmin && (
                <Link
                  href="/admin/journey-content/new"
                  onClick={() => playClick()}
                  className="px-7 py-3 font-black text-sm tracking-widest rounded-lg text-white transition-all hover:scale-105 text-center"
                  style={{ background: 'linear-gradient(135deg,#003AB0,#0066FF)', border: '2px solid #00D4FF', boxShadow: '0 0 24px rgba(0,102,255,0.4)' }}
                >
                  CRIAR JORNADA
                </Link>
              )}
            </div>
          </section>

          {/* ── STATS HUD ── */}
          <section>
            <h3 className="text-xs font-black tracking-[0.2em] text-cyan-400/60 mb-4">— SEU PROGRESSO —</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* XP / Level */}
              <button
                onClick={() => { playClick(); setLevelOpen(true) }}
                className="p-5 rounded-2xl backdrop-blur-md hover:scale-105 transition-transform text-left w-full"
                style={{ background: 'rgba(5,14,26,0.65)', border: '1px solid #00D4FF35', boxShadow: '0 4px 24px rgba(0,212,255,0.08)' }}
              >
                <p className="text-[10px] font-black tracking-widest mb-2" style={{ color: '#00D4FF' }}>⚡ NÍVEL</p>
                <p className="text-3xl font-black text-white" style={{ textShadow: '0 0 14px #00D4FF' }}>LVL {level}</p>
                <p className="text-[10px] text-blue-100/80 mt-2">Falta {xpToNext.toLocaleString('pt-BR')} XP</p>
                <div className="h-1 rounded-full mt-2 overflow-hidden" style={{ background: 'rgba(0,212,255,0.12)' }}>
                  <div className="h-full rounded-full" style={{ width: `${xpProgress}%`, background: '#00D4FF' }} />
                </div>
              </button>

              {/* Streaks */}
              <div className="p-5 rounded-2xl backdrop-blur-md hover:scale-105 transition-transform" style={{ background: 'rgba(5,14,26,0.65)', border: '1px solid #FF6B3535', boxShadow: '0 4px 24px rgba(255,107,53,0.06)' }}>
                <p className="text-[10px] font-black tracking-widest mb-2" style={{ color: '#FF6B35' }}>🔥 STREAK</p>
                <p className="text-3xl font-black text-white" style={{ textShadow: '0 0 14px #FF6B35' }}>{streakCount}</p>
                <p className="text-[10px] text-blue-100/80 mt-2">Dias consecutivos</p>
              </div>

              {/* Badges */}
              <button
                onClick={() => { playClick(); setBadgesOpen(true) }}
                className="p-5 rounded-2xl backdrop-blur-md hover:scale-105 transition-transform text-left w-full"
                style={{ background: 'rgba(5,14,26,0.65)', border: '1px solid #A855F735', boxShadow: '0 4px 24px rgba(168,85,247,0.06)' }}
              >
                <p className="text-[10px] font-black tracking-widest mb-2" style={{ color: '#A855F7' }}>🏅 BADGES</p>
                <p className="text-3xl font-black text-white" style={{ textShadow: '0 0 14px #A855F7' }}>{badgeCount}</p>
                <p className="text-[10px] text-blue-100/80 mt-2">Conquistas desbloqueadas</p>
              </button>

              {/* WOA Coins */}
              <div className="p-5 rounded-2xl backdrop-blur-md hover:scale-105 transition-transform flex items-center gap-3" style={{ background: 'rgba(5,14,26,0.65)', border: '1px solid #FFD70035', boxShadow: '0 4px 24px rgba(255,215,0,0.06)' }}>
                <div className="flex-1">
                  <p className="text-[10px] font-black tracking-widest mb-2" style={{ color: '#FFD700' }}>💰 WOA COINS</p>
                  <p className="text-3xl font-black text-white" style={{ textShadow: '0 0 14px #FFD700' }}>{coinsBalance}</p>
                  <p className="text-[10px] text-blue-100/80 mt-2">Moedas acumuladas</p>
                </div>
                <Image src="/images/woa_coin.png" alt="WOA Coin" width={52} height={52} className="object-contain drop-shadow-lg" />
              </div>
            </div>
          </section>

          {/* ── COMMUNITY TICKER ── */}
          <section>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-4 rounded" style={{ background: 'linear-gradient(180deg, #FF6B35, #FFA940)' }} />
                  <h3 className="text-xs font-black tracking-[0.2em]" style={{ color: '#FF6B35' }}>— COMUNIDADE ATIVA —</h3>
                </div>
                <Link
                  href="/community"
                  onClick={() => playClick()}
                  className="text-[10px] font-black tracking-widest px-4 py-2 rounded-lg transition-all hover:scale-105"
                  style={{ border: '1px solid rgba(255,107,53,0.35)', color: '#FF6B35', background: 'rgba(255,107,53,0.08)' }}
                >
                  VER TUDO →
                </Link>
              </div>
              <div
                className="rounded-2xl p-2 backdrop-blur-md space-y-1.5"
                style={{ 
                  background: 'linear-gradient(135deg, rgba(255,107,53,0.1), rgba(255,107,53,0.04))',
                  border: '1px solid rgba(255,107,53,0.25)',
                  boxShadow: '0 0 20px rgba(255,107,53,0.08)'
                }}
              >
                {recentPosts.map((p) => {
                  const TYPE_ICONS: Record<string, {icon: string, color: string, label: string}> = { 
                    badge_earned: { icon: '⬢', color: '#A855F7', label: 'Badge' },
                    streak_milestone: { icon: '▲', color: '#FF6B35', label: 'Streak' },
                    journey_completed: { icon: '◆', color: '#00D4FF', label: 'Jornada' },
                    block_completed: { icon: '■', color: '#22c55e', label: 'Bloco' },
                    xp_milestone: { icon: '★', color: '#FFD700', label: 'XP' }
                  }
                  const type = TYPE_ICONS[p.post_type] ?? { icon: '●', color: '#FF6B35', label: 'Evento' }
                  const name = p.users?.name ?? 'Jogador'
                  const userId = p.users?.id
                  let detail = ''
                  switch (p.post_type) {
                    case 'badge_earned': detail = `conquistou o badge "${p.payload.badge}"`; break
                    case 'streak_milestone': detail = `atingiu ${p.payload.streak} dias de sequência`; break
                    case 'journey_completed': detail = `completou uma nova Jornada`; break
                    case 'block_completed': {
                      const phaseId = p.payload.phaseId as number
                      const missionGroupId = p.payload.missionGroupId as number
                      const journey = journeys.find(j => j.phase_id === phaseId)
                      const journeyName = journey?.title ?? `Jornada ${phaseId}`
                      const blockNum = (missionGroupId + 1)
                      detail = `finalizou o bloco ${blockNum} da ${journeyName}`
                      break
                    }
                    case 'xp_milestone': detail = `alcançou ${Number(p.payload.xp).toLocaleString('pt-BR')} XP de experiência`; break
                  }
                  const timeStr = (() => { const m = Math.floor((Date.now() - new Date(p.created_at).getTime()) / 60000); return m < 1 ? 'agora' : m < 60 ? `${m}m` : m < 1440 ? `${Math.floor(m/60)}h` : `${Math.floor(m/1440)}d` })()
                  
                  return (
                    <div 
                      key={p.id} 
                      className="flex items-center gap-3 p-2 rounded-lg transition-all hover:scale-[1.02]"
                      style={{
                        background: `${type.color}12`,
                        border: `1px solid ${type.color}25`
                      }}
                    >
                      {p.users?.avatar_url ? (
                        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center overflow-hidden border border-gray-400/50">
                          <Image src={p.users.avatar_url} alt={name} width={32} height={32} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div 
                          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm text-white"
                          style={{
                            background: `${type.color}22`,
                            color: type.color,
                            border: `1.5px solid ${type.color}40`
                          }}
                        >
                          ◆
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link href={`/profile/${userId}`} onClick={() => playClick()} className="text-xs font-black text-white hover:text-orange-300 transition-colors cursor-pointer">
                            {name}
                          </Link>
                          <p className="text-xs text-white">{detail}</p>
                        </div>
                      </div>
                      
                      <span className="text-xs font-bold shrink-0" style={{ color: `${type.color}80` }}>
                        {timeStr}
                      </span>
                    </div>
                  )
                })}
                {recentPosts.length === 0 && (
                  <div className="flex items-center gap-3 py-2 px-2">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-base" style={{ background: 'rgba(255,107,53,0.2)', color: 'rgba(255,107,53,0.5)' }}>
                      ◆
                    </div>
                    <p className="text-xs text-blue-100/40">Nenhuma conquista ainda. Complete missões para aparecer aqui!</p>
                  </div>
                )}
              </div>
            </section>

          {/* ── OCEAN PHASES ── */}
          <section>
            <h3 className="text-xs font-black tracking-[0.2em] text-cyan-400/60 mb-6">— FASES OCEÂNICAS —</h3>
            <JourneyGlobeCarousel
              journeys={journeys}
              lastPhaseId={lastPhaseId}
              isAdmin={isAdmin}
              onToggleBlocked={handleToggleBlocked}
            />
          </section>

          {/* ── METHOD WOA ── */}
          <section>
            <h3 className="text-xs font-black tracking-[0.2em] text-cyan-400/60 mb-4">— MÉTODO WOA —</h3>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { icon: '📚', title: 'DISCOVER', desc: 'Explore conceitos e ouça exemplos reais para criar curiosidade e compreensão inicial.', color: '#00D4FF' },
                { icon: '⚡', title: 'PRACTICE', desc: 'Pratique através de exercícios: arrastar, completar, escutar e falar.', color: '#00F0C8' },
                { icon: '👑', title: 'COMMAND', desc: 'Domine com desafios avançados e aplique em contextos reais.', color: '#FFD700' },
              ].map((m, i) => (
                <div key={i} className="p-5 rounded-2xl backdrop-blur-md hover:scale-[1.02] transition-transform relative" style={{ background: 'rgba(5,14,26,0.65)', border: `1px solid ${m.color}30` }}>
                  {m.icon && <div className="text-3xl mb-3">{m.icon}</div>}
                  <h4 className="font-black text-sm tracking-widest mb-2" style={{ color: m.color }}>{m.title}</h4>
                  <p className="text-blue-100/80 text-xs leading-relaxed">{m.desc}</p>
                  <div className="absolute bottom-0 left-6 right-6 h-px" style={{ background: `linear-gradient(90deg,transparent,${m.color}70,transparent)` }} />
                </div>
              ))}
            </div>
          </section>

          {/* ── CTA ── */}
          <section className="rounded-2xl overflow-hidden relative" style={{ background: 'linear-gradient(135deg,rgba(0,58,176,0.6),rgba(0,102,255,0.4))', border: '1px solid #00D4FF35', boxShadow: '0 0 40px rgba(0,102,255,0.15)' }}>
            <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #00D4FF 2px, #00D4FF 3px)' }} />
            <div className="relative px-8 py-10 text-center">
              <h3 className="text-2xl font-black text-white mb-3" style={{ textShadow: '0 0 20px rgba(0,212,255,0.4)' }}>
                AVENTURA TE ESPERA
              </h3>
              <p className="text-blue-100/80 text-sm mb-6">Desbloqueie novos oceanos e conquiste novos desafios épicos</p>
              <Link
                href="/challenge/1"
                onClick={() => playClick()}
                className="inline-block px-8 py-3 font-black text-sm tracking-widest rounded-lg text-white transition-all hover:scale-105"
                style={{ background: 'linear-gradient(135deg,#003AB0,#0066FF)', border: '2px solid #00D4FF', boxShadow: '0 0 24px rgba(0,102,255,0.45)' }}
              >
                IR AO MAPA DA JORNADA →
              </Link>
            </div>
          </section>

        </div>

        {/* ── FOOTER ── */}
        <footer className="py-5 text-center border-t border-cyan-400/10">
          <p className="text-[11px] text-blue-200/30 tracking-[0.2em]">WOA TALK © 2026 — SUA JORNADA ÉPICA NO INGLÊS</p>
        </footer>
      </div>
      {/* ── BADGES MODAL ── */}
      {badgesOpen && <BadgesModal onClose={() => setBadgesOpen(false)} />}

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

        {/* Bottom padding */}
        <div className="h-8" />
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
