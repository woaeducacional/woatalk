'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface HistoryEvent {
  id: string
  event_type: 'checkpoint' | 'badge'
  xp_earned: number
  coins_earned: number
  badge_type: string | null
  description: string | null
  phase_id: number | null
  checkpoint_number: number | null
  created_at: string
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function groupByDate(events: HistoryEvent[]): [string, HistoryEvent[]][] {
  const map = new Map<string, HistoryEvent[]>()
  for (const ev of events) {
    const key = formatDate(ev.created_at)
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(ev)
  }
  return Array.from(map.entries())
}

function EventCard({ ev }: { ev: HistoryEvent }) {
  const isBadge = ev.event_type === 'badge'

  return (
    <div
      className="flex items-start gap-4 rounded-xl px-4 py-3"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      {/* Icon */}
      <div
        className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg"
        style={{
          background: isBadge
            ? 'rgba(160,100,255,0.15)'
            : 'rgba(0,212,255,0.1)',
          border: isBadge
            ? '1px solid rgba(160,100,255,0.3)'
            : '1px solid rgba(0,212,255,0.25)',
        }}
      >
        {isBadge ? '🏅' : '⚓'}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white/80 leading-snug truncate">
          {isBadge
            ? ev.badge_type ?? 'Badge desbloqueada'
            : (ev.description ?? `Checkpoint ${ev.checkpoint_number}`)}
        </p>
        <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
          {formatTime(ev.created_at)}
        </p>
      </div>

      {/* Rewards */}
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        {ev.xp_earned > 0 && (
          <span className="text-xs font-black tracking-wider" style={{ color: '#00D4FF' }}>
            +{ev.xp_earned} XP
          </span>
        )}
        {ev.coins_earned > 0 && (
          <span className="text-xs font-black tracking-wider" style={{ color: '#FFA940' }}>
            +{ev.coins_earned} 🪙
          </span>
        )}
        {isBadge && (
          <span className="text-xs font-black tracking-wider" style={{ color: '#C084FC' }}>
            +1 BADGE
          </span>
        )}
      </div>
    </div>
  )
}

export default function HistoryPage() {
  const { status } = useSession()
  const router = useRouter()
  const [history, setHistory] = useState<HistoryEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [totalXP, setTotalXP] = useState(0)
  const [totalCoins, setTotalCoins] = useState(0)
  const [totalBadges, setTotalBadges] = useState(0)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin')
  }, [status, router])

  useEffect(() => {
    if (status !== 'authenticated') return
    fetch('/api/history?limit=100')
      .then(r => r.json())
      .then(d => {
        const events: HistoryEvent[] = d.history ?? []
        setHistory(events)
        setTotalXP(events.reduce((s, e) => s + (e.xp_earned ?? 0), 0))
        setTotalCoins(events.reduce((s, e) => s + (e.coins_earned ?? 0), 0))
        setTotalBadges(events.filter(e => e.event_type === 'badge').length)
      })
      .finally(() => setLoading(false))
  }, [status])

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#050E1A' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-cyan-400/30 border-t-cyan-400 animate-spin" />
          <p className="text-cyan-300/60 text-sm tracking-widest">CARREGANDO HISTÓRICO...</p>
        </div>
      </div>
    )
  }

  const grouped = groupByDate(history)

  return (
    <div className="min-h-screen pb-16" style={{ background: '#050E1A' }}>
      {/* Navbar */}
      <div
        className="sticky top-0 z-20 flex items-center justify-between px-6 py-4"
        style={{ background: 'rgba(5,14,26,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <Link
          href="/dashboard"
          className="text-xs font-black tracking-widest px-3 py-2 rounded"
          style={{ color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)' }}
        >
          ← VOLTAR
        </Link>
        <span className="text-xs font-black tracking-[0.25em]" style={{ color: 'rgba(255,255,255,0.4)' }}>
          HISTÓRICO
        </span>
        <div className="w-20" />
      </div>

      <div className="max-w-lg mx-auto px-4 pt-8">
        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: 'XP TOTAL', value: totalXP, suffix: 'XP', color: '#00D4FF', bg: 'rgba(0,212,255,0.08)', border: 'rgba(0,212,255,0.2)' },
            { label: 'MOEDAS', value: totalCoins, suffix: '🪙', color: '#FFA940', bg: 'rgba(255,169,64,0.08)', border: 'rgba(255,169,64,0.2)' },
            { label: 'BADGES', value: totalBadges, suffix: '🏅', color: '#C084FC', bg: 'rgba(192,132,252,0.08)', border: 'rgba(192,132,252,0.2)' },
          ].map(card => (
            <div
              key={card.label}
              className="rounded-xl px-3 py-4 flex flex-col items-center gap-1"
              style={{ background: card.bg, border: `1px solid ${card.border}` }}
            >
              <span className="text-[9px] font-black tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {card.label}
              </span>
              <span className="text-lg font-black" style={{ color: card.color }}>
                {card.value.toLocaleString('pt-BR')}
              </span>
              <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                {card.suffix}
              </span>
            </div>
          ))}
        </div>

        {/* Timeline */}
        {grouped.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-20">
            <span className="text-4xl opacity-30">📭</span>
            <p className="text-sm font-black tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>
              NENHUMA ATIVIDADE AINDA
            </p>
            <Link
              href="/dashboard"
              className="text-xs font-black tracking-widest px-4 py-2 rounded"
              style={{ color: '#00D4FF', border: '1px solid rgba(0,212,255,0.3)', background: 'rgba(0,212,255,0.08)' }}
            >
              COMEÇAR JORNADA →
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {grouped.map(([date, events]) => (
              <div key={date}>
                <p
                  className="text-[10px] font-black tracking-widest mb-3"
                  style={{ color: 'rgba(255,255,255,0.3)' }}
                >
                  {date}
                </p>
                <div className="flex flex-col gap-2">
                  {events.map(ev => (
                    <EventCard key={ev.id} ev={ev} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
