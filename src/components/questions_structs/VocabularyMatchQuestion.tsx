'use client'

import { useState } from 'react'

export interface VocabItem {
  word: string
  definition: string
  translationPt: string
  example: string
}

interface VocabularyMatchQuestionProps {
  items: VocabItem[]
  onComplete: () => void
  stepLabel?: string
  title?: string
  icon?: string
  instruction?: string
  instructionPt?: string
}

export function VocabularyMatchQuestion({
  items,
  onComplete,
  stepLabel = 'Step 1 — Match',
  title = 'Vocabulário',
  icon = '🧩',
  instruction = 'Click each card to reveal its translation.',
  instructionPt = 'Clique em cada carta para ver a tradução. Vire todas para avançar!',
}: VocabularyMatchQuestionProps) {
  const [seen, setSeen] = useState<Set<number>>(new Set())
  const [flipped, setFlipped] = useState<Set<number>>(new Set())

  const allSeen = seen.size >= items.length

  const handleClick = (i: number) => {
    setFlipped((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
    setSeen((prev) => {
      const next = new Set(prev)
      next.add(i)
      return next
    })
  }

  return (
    <div className="space-y-5" style={{ animation: 'fadeInVocab 0.5s ease-out' }}>

      {/* ── HEADER ── */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 text-center"
        style={{
          background: 'linear-gradient(135deg, rgba(0,20,80,0.9) 0%, rgba(0,102,255,0.15) 100%)',
          border: '1px solid rgba(0,212,255,0.3)',
          boxShadow: '0 0 30px rgba(0,102,255,0.15)',
        }}
      >
        <p className="text-xs font-bold tracking-[0.3em] uppercase text-cyan-400/70 mb-1">
          {stepLabel}
        </p>
        <h2
          className="text-2xl font-black tracking-wide"
          style={{ color: '#00D4FF', textShadow: '0 0 20px rgba(0,212,255,0.5)' }}
        >
          {icon} {title}
        </h2>
        <p className="text-sm text-blue-200/60 mt-1">{instruction}</p>
        <p className="text-xs text-blue-200/40 mt-0.5">{instructionPt}</p>
      </div>

      {/* ── PROGRESS ── */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-bold tracking-widest">
          <span className="text-blue-300/60 uppercase">Descobertas</span>
          <span style={{ color: '#00D4FF' }}>{seen.size} / {items.length}</span>
        </div>
        <div
          className="relative w-full h-2 rounded-full overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.08)' }}
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
            style={{
              width: `${(seen.size / items.length) * 100}%`,
              background: 'linear-gradient(90deg, #0066FF, #00D4FF)',
              boxShadow: '0 0 8px rgba(0,212,255,0.6)',
            }}
          />
        </div>
      </div>

      {/* ── CARD GRID ── */}
      <div className="grid grid-cols-2 gap-3">
        {items.map((item, i) => {
          const isFlipped = flipped.has(i)
          const wasSeen = seen.has(i)
          return (
            <div
              key={i}
              onClick={() => handleClick(i)}
              className="cursor-pointer select-none"
              style={{ perspective: '1000px', height: '130px' }}
            >
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '100%',
                  transformStyle: 'preserve-3d',
                  transition: 'transform 0.55s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                }}
              >
                {/* ── FRONT ── */}
                <div
                  className="absolute inset-0 rounded-xl flex flex-col items-center justify-center p-3 text-center"
                  style={{
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden' as any,
                    background: wasSeen
                      ? 'linear-gradient(135deg, rgba(0,50,150,0.45), rgba(0,102,255,0.2))'
                      : 'linear-gradient(135deg, rgba(0,20,60,0.85), rgba(0,50,120,0.55))',
                    border: `1px solid ${wasSeen ? 'rgba(0,212,255,0.5)' : 'rgba(0,212,255,0.2)'}`,
                    boxShadow: wasSeen ? '0 0 14px rgba(0,212,255,0.2)' : 'none',
                  }}
                >
                  <p className="text-lg font-black text-white leading-tight">{item.word}</p>
                  <p className="text-blue-200/50 text-[10px] mt-1 leading-snug">{item.definition}</p>
                  {!wasSeen && (
                    <p className="text-cyan-400/40 text-[9px] mt-2 tracking-widest uppercase">toque para ver</p>
                  )}
                  {wasSeen && !isFlipped && (
                    <p className="text-cyan-400/50 text-[9px] mt-2 tracking-widest uppercase">✓ vista</p>
                  )}
                </div>

                {/* ── BACK ── */}
                <div
                  className="absolute inset-0 rounded-xl flex flex-col items-center justify-center p-3 text-center"
                  style={{
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden' as any,
                    transform: 'rotateY(180deg)',
                    background: 'linear-gradient(135deg, rgba(5,60,30,0.7), rgba(34,197,94,0.15))',
                    border: '1px solid rgba(34,197,94,0.45)',
                    boxShadow: '0 0 14px rgba(34,197,94,0.1)',
                  }}
                >
                  <p
                    className="text-lg font-black leading-tight"
                    style={{ color: '#4ade80', textShadow: '0 0 10px rgba(74,222,128,0.4)' }}
                  >
                    {item.translationPt}
                  </p>
                  <p className="text-white/45 text-[10px] mt-2 leading-snug italic">
                    &ldquo;{item.example}&rdquo;
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── ADVANCE BUTTON ── */}
      <button
        onClick={onComplete}
        disabled={!allSeen}
        className="w-full font-black tracking-widest px-8 py-4 rounded-xl text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
        style={{
          background: allSeen
            ? 'linear-gradient(135deg, #1d4ed8, #0066FF)'
            : 'rgba(255,255,255,0.05)',
          border: allSeen ? 'none' : '1px solid rgba(255,255,255,0.08)',
          boxShadow: allSeen ? '0 0 25px rgba(0,102,255,0.4)' : 'none',
        }}
      >
        {allSeen ? '✓ AVANÇAR →' : `Vire todas as cartas (${seen.size}/${items.length})`}
      </button>

      <style>{`
        @keyframes fadeInVocab {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
