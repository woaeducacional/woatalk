'use client'

import { useEffect, useState } from 'react'

interface BadgeDefinition {
  id: string
  title: string
  challenge: string
  icon: string
  rarity: string
}

const ALL_BADGES: BadgeDefinition[] = [
  {
    id: 'first_step',
    title: 'O Primeiro Passo',
    challenge: 'Concluiu o primeiro bloco de atividades',
    icon: '🚀',
    rarity: 'COMUM',
  },
]

interface BadgesModalProps {
  onClose: () => void
}

export function BadgesModal({ onClose }: BadgesModalProps) {
  const [earnedIds, setEarnedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/user/badges')
      .then((r) => r.json())
      .then((d) => setEarnedIds(d.badges ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const earned = ALL_BADGES.filter((b) => earnedIds.includes(b.id))
  const locked = ALL_BADGES.filter((b) => !earnedIds.includes(b.id))

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50"
        style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          className="relative w-full max-w-md rounded-3xl overflow-hidden"
          style={{
            background: 'linear-gradient(160deg, rgba(30,0,60,0.98) 0%, rgba(10,0,30,0.99) 100%)',
            border: '1px solid rgba(168,85,247,0.4)',
            boxShadow: '0 0 60px rgba(168,85,247,0.25), 0 24px 60px rgba(0,0,0,0.7)',
            maxHeight: '90vh',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top glow line */}
          <div
            className="absolute top-0 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(90deg,transparent,#a855f7,transparent)' }}
          />

          {/* Header */}
          <div className="px-6 pt-6 pb-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black tracking-[0.3em] uppercase mb-1" style={{ color: 'rgba(168,85,247,0.6)' }}>
                CONQUISTAS
              </p>
              <h2 className="text-xl font-black text-white" style={{ textShadow: '0 0 20px rgba(168,85,247,0.5)' }}>
                🏅 Seus Badges
              </h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full text-white/40 hover:text-white/80 transition-colors"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              ✕
            </button>
          </div>

          {/* Counter */}
          <div className="px-6 pb-4">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.3)' }}
            >
              <span className="text-xs font-black" style={{ color: '#c084fc' }}>
                {loading ? '...' : `${earned.length} / ${ALL_BADGES.length}`} desbloqueados
              </span>
            </div>
          </div>

          {/* Cards */}
          <div className="px-6 pb-6 overflow-y-auto" style={{ maxHeight: '60vh' }}>
            {loading ? (
              <div className="flex justify-center py-10">
                <div className="w-6 h-6 rounded-full border-2 border-purple-400/30 border-t-purple-400 animate-spin" />
              </div>
            ) : (
              <div className="space-y-3">
                {earned.length === 0 && locked.length > 0 && (
                  <p className="text-center text-purple-300/40 text-sm py-4">
                    Nenhum badge desbloqueado ainda. Siga em frente!
                  </p>
                )}

                {/* Earned badges */}
                {earned.map((badge) => (
                  <BadgeCard key={badge.id} badge={badge} earned />
                ))}

                {/* Locked badges */}
                {locked.map((badge) => (
                  <BadgeCard key={badge.id} badge={badge} earned={false} />
                ))}
              </div>
            )}
          </div>

          {/* Bottom glow line */}
          <div
            className="absolute bottom-0 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(90deg,transparent,#a855f7,transparent)' }}
          />
        </div>
      </div>
    </>
  )
}

function BadgeCard({ badge, earned }: { badge: BadgeDefinition; earned: boolean }) {
  return (
    <div
      className="relative rounded-2xl p-4 flex items-center gap-4 transition-transform hover:scale-[1.02]"
      style={{
        background: earned
          ? 'linear-gradient(135deg, rgba(88,28,135,0.5) 0%, rgba(107,33,168,0.3) 100%)'
          : 'rgba(255,255,255,0.03)',
        border: earned
          ? '1px solid rgba(168,85,247,0.5)'
          : '1px solid rgba(255,255,255,0.07)',
        boxShadow: earned ? '0 0 20px rgba(168,85,247,0.15)' : 'none',
        opacity: earned ? 1 : 0.45,
        filter: earned ? 'none' : 'grayscale(1)',
      }}
    >
      {/* Icon */}
      <div
        className="w-14 h-14 shrink-0 flex items-center justify-center rounded-xl text-3xl"
        style={{
          background: earned
            ? 'linear-gradient(135deg, rgba(168,85,247,0.3), rgba(139,92,246,0.2))'
            : 'rgba(255,255,255,0.05)',
          border: earned ? '1px solid rgba(168,85,247,0.4)' : '1px solid rgba(255,255,255,0.08)',
          boxShadow: earned ? '0 0 14px rgba(168,85,247,0.3)' : 'none',
        }}
      >
        {earned ? badge.icon : '🔒'}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p
            className="font-black text-sm truncate"
            style={{ color: earned ? '#e9d5ff' : 'rgba(255,255,255,0.3)' }}
          >
            {badge.title}
          </p>
          <span
            className="shrink-0 text-[9px] font-black tracking-widest px-1.5 py-0.5 rounded"
            style={{
              background: earned ? 'rgba(168,85,247,0.25)' : 'rgba(255,255,255,0.05)',
              color: earned ? '#c084fc' : 'rgba(255,255,255,0.2)',
              border: earned ? '1px solid rgba(168,85,247,0.3)' : '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {badge.rarity}
          </span>
        </div>
        <p
          className="text-xs leading-relaxed"
          style={{ color: earned ? 'rgba(216,180,254,0.7)' : 'rgba(255,255,255,0.2)' }}
        >
          {badge.challenge}
        </p>
      </div>

      {/* Earned glow dot */}
      {earned && (
        <div
          className="shrink-0 w-2 h-2 rounded-full"
          style={{ background: '#a855f7', boxShadow: '0 0 8px #a855f7' }}
        />
      )}

      <style>{`
        @keyframes badgePop {
          from { transform: scale(0.9); opacity: 0; }
          to   { transform: scale(1);   opacity: 1; }
        }
      `}</style>
    </div>
  )
}
