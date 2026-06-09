'use client'

/**
 * WordChip — chip visual de uma palavra no painel da coruja.
 * Verde com ✓ quando correta, vermelho com ✗ quando errada.
 * Palavras erradas mostram o que foi falado e um botão 🔊 de TTS.
 */

interface WordChipProps {
  /** Palavra esperada */
  word: string
  /** Se foi pronunciada corretamente */
  isCorrect: boolean
  /** O que o usuário disse (pode ser null se não reconhecido) */
  spoken?: string | null
  /** Se este chip está sendo reproduzido via TTS */
  isPlaying?: boolean
  /** Callback para reproduzir pronúncia correta */
  onPlay?: (word: string) => void
}

export function WordChip({ word, isCorrect, spoken, isPlaying, onPlay }: WordChipProps) {
  return (
    <div
      className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition-all"
      style={{
        background: isCorrect ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
        border: `1px solid ${isCorrect ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.4)'}`,
      }}
    >
      {/* Palavra com ícone de correto/errado */}
      <span className="text-sm font-bold" style={{ color: isCorrect ? '#4ade80' : '#f87171' }}>
        {isCorrect ? '✓' : '✗'} {word}
      </span>

      {/* Detalhes e botão TTS apenas para palavras erradas */}
      {!isCorrect && (
        <>
          {spoken && (
            <span className="text-[10px] italic" style={{ color: 'rgba(255,255,255,0.28)' }}>
              (você: "{spoken}")
            </span>
          )}

          {onPlay && (
            <button
              onClick={() => onPlay(word)}
              title={`Ouvir como pronunciar "${word}"`}
              className="flex items-center justify-center w-6 h-6 rounded-full transition-all duration-150 hover:scale-110 active:scale-95"
              style={{
                background: isPlaying ? 'rgba(168,85,247,0.5)' : 'rgba(168,85,247,0.22)',
                border: '1px solid rgba(168,85,247,0.55)',
                boxShadow: isPlaying ? '0 0 8px rgba(168,85,247,0.6)' : 'none',
                fontSize: '11px',
              }}
            >
              {isPlaying ? '⏸' : '🔊'}
            </button>
          )}
        </>
      )}
    </div>
  )
}
