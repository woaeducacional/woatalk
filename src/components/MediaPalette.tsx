'use client'

import { useState } from 'react'
import type { JourneyMission } from '@/lib/journey'
import { EagleTip } from './EagleTip'

/* ──────────────────────────────────────────────────────────────
   MediaPalette — sidebar card with 10 slots (one per checkpoint)
   Each slot holds the first mission's video/audio from that group.
   Slots unlock as the player progresses.
   ────────────────────────────────────────────────────────────── */

function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|v=)([A-Za-z0-9_-]{11})/)
  return m ? m[1] : null
}

interface MediaSlot {
  checkpoint: number
  type: 'video' | 'audio' | null
  src: string | null       // YouTube URL or audio path
  label: string
}

interface MediaPaletteProps {
  journeyMissions: JourneyMission[]
  currentMissionIdx: number
  totalCheckpoints: number
  isOpen: boolean
  onClose: () => void
}

export function MediaPalette({ journeyMissions, currentMissionIdx, totalCheckpoints, isOpen, onClose }: MediaPaletteProps) {
  const [playingSlot, setPlayingSlot] = useState<number | null>(null)
  const [showMediaTip, setShowMediaTip] = useState(false)

  // Build the 10 slots from first mission of each checkpoint group
  const slots: MediaSlot[] = Array.from({ length: totalCheckpoints }).map((_, i) => {
    const firstMission = journeyMissions[i * 10]
    const cp = i + 1
    const unlocked = currentMissionIdx >= i * 10

    if (!firstMission || !unlocked || firstMission.type !== 'resource') {
      return { checkpoint: cp, type: null, src: null, label: `Checkpoint ${cp}` }
    }

    if (firstMission.resourceType === 'video' && firstMission.resourceUrl) {
      return { checkpoint: cp, type: 'video', src: firstMission.resourceUrl, label: `Checkpoint ${cp}` }
    }
    if (firstMission.resourceType === 'audio' && firstMission.resourceUrl) {
      return { checkpoint: cp, type: 'audio', src: firstMission.resourceUrl, label: `Checkpoint ${cp}` }
    }
    return { checkpoint: cp, type: null, src: null, label: `Checkpoint ${cp}` }
  })

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Sidebar Overlay */}
      <aside
        className="fixed top-0 right-0 z-50 h-screen w-80 sm:w-96 transition-transform duration-300 ease-out translate-x-0"
      >
        <div
          className="h-full flex flex-col overflow-y-auto pt-6 pb-6 px-4"
          style={{
            background: 'linear-gradient(180deg, rgba(5,14,26,0.95) 0%, rgba(0,36,120,0.40) 50%, rgba(5,14,26,0.95) 100%)',
            borderLeft: '1px solid rgba(0,212,255,0.15)',
            backdropFilter: 'blur(20px)',
          }}
        >
          {/* Header with close button */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="text-2xl">🎬</div>
              <div>
                <h3
                  className="text-sm font-black tracking-[0.15em] text-cyan-300"
                  style={{ textShadow: '0 0 12px rgba(0,212,255,0.5)' }}
                >
                  RECURSOS
                </h3>
                <p className="text-[10px] text-cyan-400/40 tracking-widest">REVEJA A QUALQUER MOMENTO</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all"
            >
              ✕
            </button>
          </div>

          {/* Slots Grid */}
          <div className="space-y-2 flex-1">
            {slots.map((slot, idx) => {
              const isActive = playingSlot === idx
              const hasContent = slot.type !== null

              return (
                <button
                  key={idx}
                  onClick={() => {
                    if (!hasContent) return
                    // Mostrar dica sempre na primeira vez que abre um slot
                    if (!localStorage.getItem('eagle_media_revisit')) {
                      setShowMediaTip(true)
                      localStorage.setItem('eagle_media_revisit', '1')
                    }
                    setPlayingSlot(isActive ? null : idx)
                  }}
                  className={`
                    w-full rounded-xl p-3 text-left transition-all duration-200
                    ${hasContent ? 'hover:scale-[1.02] cursor-pointer' : 'cursor-default opacity-30'}
                    ${isActive ? 'ring-2 ring-cyan-400' : ''}
                  `}
                  style={{
                    background: isActive
                      ? 'rgba(0,67,187,0.35)'
                      : hasContent
                        ? 'rgba(255,255,255,0.05)'
                        : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${isActive ? 'rgba(0,212,255,0.5)' : hasContent ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)'}`,
                  }}
                  disabled={!hasContent}
                >
                  <div className="flex items-center gap-3">
                    {/* Slot Number */}
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0"
                      style={{
                        background: hasContent
                          ? 'linear-gradient(135deg, #CC4A00, #FF6B35)'
                          : 'rgba(255,255,255,0.05)',
                        color: hasContent ? 'white' : 'rgba(255,255,255,0.2)',
                      }}
                    >
                      {hasContent ? (slot.type === 'video' ? '▶' : '♫') : slot.checkpoint}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-bold truncate ${hasContent ? 'text-white' : 'text-white/20'}`}>
                        {hasContent ? slot.label : `Checkpoint ${slot.checkpoint}`}
                      </p>
                      <p className="text-[10px] text-white/30">
                        {hasContent
                          ? slot.type === 'video' ? 'Vídeo' : 'Áudio'
                          : '🔒 Bloqueado'}
                      </p>
                    </div>

                    {/* Play indicator */}
                    {isActive && (
                      <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shrink-0" />
                    )}
                  </div>

                  {/* Expanded player */}
                  {isActive && slot.src && (
                    <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                      {slot.type === 'video' && (() => {
                        const ytId = getYouTubeId(slot.src!)
                        if (!ytId) return null
                        return (
                          <div className="relative w-full rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
                            <iframe
                              src={`https://www.youtube-nocookie.com/embed/${ytId}?rel=0&modestbranding=1`}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              className="absolute inset-0 w-full h-full"
                              title={slot.label}
                            />
                          </div>
                        )
                      })()}
                      {slot.type === 'audio' && (
                        <audio
                          controls
                          src={slot.src}
                          className="w-full h-8"
                          style={{ filter: 'invert(1) hue-rotate(180deg) brightness(0.8)' }}
                        />
                      )}
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Footer decoration */}
          <div className="text-center mt-4">
            <div className="w-12 h-0.5 mx-auto rounded-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.3), transparent)' }} />
            <p className="text-[9px] text-cyan-400/25 tracking-widest mt-2">
              {slots.filter(s => s.type !== null).length}/{totalCheckpoints} DESBLOQUEADOS
            </p>
          </div>
        </div>
      </aside>

      <EagleTip
        storageKey="eagle_media_revisit"
        show={showMediaTip}
        onDismiss={() => setShowMediaTip(false)}
        lines={[
          '🎬 Você abriu um recurso!',
          'Vídeos e áudios ficam salvos aqui para você rever a qualquer momento.',
        ]}
        buttonLabel="ENTENDIDO!"
      />
    </>
  )
}

/** Small pill button for the header */
export function MediaPaletteButton({ onClick, unlockedCount }: { onClick: () => void; unlockedCount: number }) {
  if (unlockedCount === 0) return null
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 text-xs font-bold tracking-widest px-4 py-2 rounded border transition-all hover:scale-105 active:scale-95"
      style={{
        borderColor: 'rgba(0,212,255,0.3)',
        color: '#00D4FF',
        background: 'rgba(0,212,255,0.06)',
      }}
    >
      🎬 RECURSOS
      <span
        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white"
        style={{ background: 'linear-gradient(135deg, #CC4A00, #FF6B35)' }}
      >
        {unlockedCount}
      </span>
    </button>
  )
}
