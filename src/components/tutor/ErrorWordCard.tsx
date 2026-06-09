'use client'

/**
 * ErrorWordCard — card usado na tela /tutor.
 * Exibe uma palavra problemática do usuário com:
 *  - Badge de frequência de erro (🔥 vermelho quanto mais erros)
 *  - Botão 🔊 TTS para ouvir a pronúncia correta
 *  - Dica gerada pela IA
 *  - Frase de contexto onde o erro ocorreu
 */
import { useState } from 'react'
import { playTTS } from '@/src/lib/ttsService'

// ── Tipos ──────────────────────────────────────────────────────────────────

interface ErrorWordCardProps {
  word: string
  errorCount: number
  sentence: string
  aiTip: string | null
}

// ── Helpers ────────────────────────────────────────────────────────────────

/** Retorna a cor do badge baseada na frequência de erros */
function badgeColor(count: number): string {
  if (count >= 5) return '#ef4444' // vermelho — muito frequente
  if (count >= 3) return '#f97316' // laranja — frequente
  return '#eab308'                 // amarelo — ocasional
}

// ── Componente ─────────────────────────────────────────────────────────────

export function ErrorWordCard({ word, errorCount, sentence, aiTip }: ErrorWordCardProps) {
  const [isPlaying, setIsPlaying] = useState(false)

  /** Reproduz a palavra em voz lenta via Azure TTS */
  const handlePlay = () => {
    if (isPlaying) return
    setIsPlaying(true)
    playTTS(word, 'alice', 'slow', () => setIsPlaying(false))
  }

  const color = badgeColor(errorCount)

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-4 transition-all hover:scale-[1.01]"
      style={{
        background: 'linear-gradient(135deg, rgba(30,0,60,0.85) 0%, rgba(10,5,40,0.85) 100%)',
        border: `1px solid ${color}40`,
        boxShadow: `0 0 20px ${color}15`,
      }}
    >
      {/* ── Cabeçalho: palavra + badge de erros + botão TTS ── */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Badge de frequência */}
          <span
            className="flex-shrink-0 text-[10px] font-black px-2 py-1 rounded-full tracking-widest"
            style={{ background: `${color}22`, border: `1px solid ${color}`, color }}
          >
            🔥 {errorCount}×
          </span>

          {/* Palavra */}
          <span className="text-xl font-black text-white tracking-wide truncate">
            {word}
          </span>
        </div>

        {/* Botão TTS */}
        <button
          onClick={handlePlay}
          title={`Ouvir pronúncia de "${word}"`}
          className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full transition-all hover:scale-110 active:scale-95"
          style={{
            background: isPlaying ? 'rgba(168,85,247,0.45)' : 'rgba(168,85,247,0.18)',
            border: '1px solid rgba(168,85,247,0.5)',
            boxShadow: isPlaying ? '0 0 12px rgba(168,85,247,0.5)' : 'none',
            fontSize: '18px',
          }}
        >
          {isPlaying ? '⏸' : '🔊'}
        </button>
      </div>

      {/* ── Frase de contexto ── */}
      {sentence && (
        <p className="text-xs italic leading-relaxed" style={{ color: 'rgba(255,255,255,0.35)' }}>
          "{sentence}"
        </p>
      )}

      {/* ── Dica da IA ── */}
      {aiTip ? (
        <div
          className="px-3 py-2.5 rounded-xl"
          style={{
            background: 'rgba(168,85,247,0.08)',
            border: '1px solid rgba(168,85,247,0.2)',
          }}
        >
          <p className="text-[9px] font-black tracking-[0.2em] uppercase mb-1.5" style={{ color: '#a855f7' }}>
            💡 Dica
          </p>
          <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>
            {aiTip}
          </p>
        </div>
      ) : (
        <div
          className="px-3 py-2 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
            Pratique esta palavra para receber uma dica personalizada.
          </p>
        </div>
      )}
    </div>
  )
}
