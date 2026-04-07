'use client'

import { useState, useRef, useEffect } from 'react'
import { getSpeechRecognition } from '@/src/lib/speechRecognition'

interface SpeakFromMemoryQuestionProps {
  /**
   * Array de 1-5 frases. O usuário precisa falar qualquer uma com ≥70% de match.
   */
  sentences: string[]

  /**
   * Callback quando o desafio termina (ganho ou não)
   */
  onComplete: (xpEarned: number) => void

  /**
   * Label do passo
   * @default "Speak from Memory"
   */
  stepLabel?: string

  /**
   * Título do card
   * @default "Fale de Memória"
   */
  title?: string

  /**
   * Emoji do título
   * @default "🧠"
   */
  icon?: string

  /**
   * Instrução principal
   */
  instruction?: string

  /**
   * XP ganho ao acertar (além do bônus fixo de 30)
   * @default 30
   */
  xpReward?: number
}

type Phase = 'ready' | 'recording' | 'revealing' | 'result'

interface WordResult {
  word: string
  correct: boolean
}

const REVEAL_DELAY_MS = 2800
const WIN_THRESHOLD = 70

export function SpeakFromMemoryQuestion({
  sentences,
  onComplete,
  stepLabel = 'Speak from Memory',
  title = 'Fale de Memória',
  icon = '🧠',
  instruction = 'Diga qualquer uma das frases que você aprendeu — sem ler!',
  xpReward = 30,
}: SpeakFromMemoryQuestionProps) {
  const [phase, setPhase] = useState<Phase>('ready')
  const [liveTranscript, setLiveTranscript] = useState('')
  const [bestSentence, setBestSentence] = useState('')
  const [bestScore, setBestScore] = useState(0)
  const [wordResults, setWordResults] = useState<WordResult[]>([])
  const [won, setWon] = useState(false)
  const [revealCountdown, setRevealCountdown] = useState(3)
  const [coinBurst, setCoinBurst] = useState(false)

  const recognitionRef = useRef<any>(null)
  const liveRef = useRef('')

  // ── Score: how many target words appear anywhere in spoken transcript ──
  const calculateScore = (spoken: string, target: string): number => {
    const norm = (s: string) =>
      s.toLowerCase().replace(/[^a-z\s]/g, '').trim().split(/\s+/).filter(Boolean)
    const spokenWords = norm(spoken)
    const targetWords = norm(target)
    if (targetWords.length === 0) return 0
    let matched = 0
    for (const w of targetWords) {
      if (spokenWords.includes(w)) matched++
    }
    return Math.round((matched / targetWords.length) * 100)
  }

  // ── Word-by-word comparison: mark each target word as correct/wrong ──
  const buildWordResults = (spoken: string, target: string): WordResult[] => {
    const norm = (s: string) =>
      s.toLowerCase().replace(/[^a-z\s]/g, '').trim().split(/\s+/).filter(Boolean)
    const spokenWords = norm(spoken)
    const targetWords = norm(target)
    return targetWords.map((word) => ({
      word,
      correct: spokenWords.includes(word),
    }))
  }

  // ── Start countdown after recording ends ──
  useEffect(() => {
    if (phase !== 'revealing') return
    setRevealCountdown(3)
    const interval = setInterval(() => {
      setRevealCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval)
          setPhase('result')
          return 0
        }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [phase])

  // ── Coin burst effect on win ──
  useEffect(() => {
    if (phase === 'result' && won) {
      setTimeout(() => setCoinBurst(true), 300)
    }
  }, [phase, won])

  const handleRecord = () => {
    if (phase !== 'ready') return

    const API = getSpeechRecognition()
    if (!API) {
      alert('Seu navegador não suporta reconhecimento de voz.')
      return
    }

    const rec = new API()
    rec.lang = 'en-US'
    rec.continuous = true
    rec.interimResults = true
    liveRef.current = ''
    setLiveTranscript('')
    setPhase('recording')

    let silenceTimer: ReturnType<typeof setTimeout> | null = null
    let graceTimer: ReturnType<typeof setTimeout> | null = null

    const resetSilence = () => {
      if (silenceTimer) clearTimeout(silenceTimer)
      silenceTimer = setTimeout(() => rec.stop(), 4000)
    }

    rec.onresult = (e: any) => {
      if (graceTimer) { clearTimeout(graceTimer); graceTimer = null }
      resetSilence()
      const t = Array.from(e.results)
        .map((r: any) => r[0].transcript)
        .join('')
      liveRef.current = t
      setLiveTranscript(t)
    }

    rec.onend = () => {
      if (graceTimer) clearTimeout(graceTimer)
      if (silenceTimer) clearTimeout(silenceTimer)

      const spoken = liveRef.current

      // Find the best matching sentence
      let bestIdx = 0
      let topScore = 0
      sentences.forEach((s, i) => {
        const sc = calculateScore(spoken, s)
        if (sc > topScore) { topScore = sc; bestIdx = i }
      })

      const best = sentences[bestIdx]
      const scored = topScore
      const didWin = scored >= WIN_THRESHOLD

      if (didWin) {
        new Audio('/audio/som-concluir-memory-question.mp3').play().catch(() => {})
      }

      setBestSentence(best)
      setBestScore(scored)
      setWordResults(buildWordResults(spoken, best))
      setWon(didWin)

      // Move to revealing phase (countdown, then result)
      setPhase('revealing')
    }

    rec.onerror = (e: any) => {
      if (graceTimer) clearTimeout(graceTimer)
      if (silenceTimer) clearTimeout(silenceTimer)
      liveRef.current = liveRef.current || '(erro de microfone)'
      rec.stop()
    }

    recognitionRef.current = rec
    rec.start()

    // Grace period before silence detection starts
    graceTimer = setTimeout(() => { graceTimer = null; resetSilence() }, 2000)
  }

  const handleContinue = () => {
    onComplete(won ? xpReward : 0)
  }

  // ─────────────────────── RENDER ───────────────────────
  return (
    <div className="space-y-5" style={{ animation: 'fadeInMemory 0.5s ease-out' }}>

      {/* ── HEADER ── */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 text-center"
        style={{
          background: 'linear-gradient(135deg, rgba(40,0,80,0.9) 0%, rgba(120,0,255,0.15) 100%)',
          border: '1px solid rgba(168,85,247,0.35)',
          boxShadow: '0 0 30px rgba(120,0,255,0.15)',
        }}
      >
        <p className="text-xs font-bold tracking-[0.3em] uppercase text-purple-400/70 mb-1">
          {stepLabel}
        </p>
        <h2
          className="text-2xl font-black tracking-wide"
          style={{ color: '#C084FC', textShadow: '0 0 20px rgba(168,85,247,0.6)' }}
        >
          {icon} {title}
        </h2>
        <p className="text-sm text-purple-200/60 mt-1">{instruction}</p>
      </div>

      {/* ── PHASE: READY ── */}
      {phase === 'ready' && (
        <div className="space-y-4">
          {/* Hint card */}
          <div
            className="rounded-2xl p-6 text-center"
            style={{
              background: 'rgba(120,0,255,0.08)',
              border: '1px solid rgba(168,85,247,0.2)',
            }}
          >
            <p className="text-4xl mb-3">🤫</p>
            <p className="text-purple-200/70 text-sm font-medium">
              Você aprendeu <span style={{ color: '#C084FC' }}>{sentences.length}</span> frase{sentences.length > 1 ? 's' : ''} nessa aula.
            </p>
            <p className="text-purple-200/40 text-xs mt-1">
              Fale uma delas sem olhar — você tem apenas 1 tentativa!
            </p>
          </div>

          {/* Record button */}
          <button
            onClick={handleRecord}
            className="w-full font-black tracking-widest px-8 py-5 rounded-xl text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
              boxShadow: '0 0 25px rgba(168,85,247,0.4)',
              animation: 'pulsePurple 2s ease-in-out infinite',
            }}
          >
            🧠 Falar de memória
          </button>
        </div>
      )}

      {/* ── PHASE: RECORDING ── */}
      {phase === 'recording' && (
        <div className="space-y-4">
          {/* Live subtitle */}
          <div
            className="rounded-2xl p-6 min-h-[100px] flex flex-col items-center justify-center text-center"
            style={{
              background: 'rgba(120,0,255,0.1)',
              border: '1px solid rgba(168,85,247,0.3)',
            }}
          >
            <div className="flex gap-1 mb-4">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full"
                  style={{
                    background: '#a855f7',
                    animation: `barBounce 0.8s ease-in-out infinite`,
                    animationDelay: `${i * 0.2}s`,
                  }}
                />
              ))}
            </div>
            {liveTranscript ? (
              <p className="text-white text-lg font-semibold leading-relaxed">
                &ldquo;{liveTranscript}&rdquo;
              </p>
            ) : (
              <p className="text-purple-300/50 text-sm italic">Ouvindo... fale agora</p>
            )}
          </div>

          {/* Mic indicator */}
          <div
            className="w-full py-4 rounded-xl text-center font-black tracking-widest text-white"
            style={{
              background: 'linear-gradient(135deg, #7f1d1d, #dc2626)',
              boxShadow: '0 0 20px rgba(220,38,38,0.4)',
              animation: 'pulseRed 1s ease-in-out infinite',
            }}
          >
            🔴 GRAVANDO...
          </div>
        </div>
      )}

      {/* ── PHASE: REVEALING (countdown) ── */}
      {phase === 'revealing' && (
        <div className="space-y-4">
          {/* What the user said */}
          <div
            className="rounded-2xl p-5 text-center"
            style={{
              background: 'rgba(120,0,255,0.08)',
              border: '1px solid rgba(168,85,247,0.25)',
            }}
          >
            <p className="text-xs font-bold tracking-widest uppercase text-purple-400/60 mb-2">
              Você disse
            </p>
            <p className="text-white/80 text-base italic">
              &ldquo;{liveTranscript || '(nenhuma fala detectada)'}&rdquo;
            </p>
          </div>

          {/* Countdown */}
          <div
            className="rounded-2xl p-8 text-center"
            style={{
              background: 'rgba(40,0,80,0.5)',
              border: '1px solid rgba(168,85,247,0.3)',
            }}
          >
            <p className="text-purple-300/60 text-sm font-bold tracking-widest uppercase mb-3">
              Revelando em...
            </p>
            <p
              className="text-8xl font-black"
              style={{ color: '#C084FC', textShadow: '0 0 30px rgba(168,85,247,0.8)', animation: 'countPop 0.4s ease-out' }}
              key={revealCountdown}
            >
              {revealCountdown}
            </p>
          </div>
        </div>
      )}

      {/* ── PHASE: RESULT ── */}
      {phase === 'result' && (
        <div className="space-y-4">
          {/* Win / Lose banner */}
          <div
            className="relative overflow-hidden rounded-2xl p-6 text-center"
            style={{
              background: won
                ? 'linear-gradient(135deg, rgba(21,128,61,0.3), rgba(34,197,94,0.1))'
                : 'linear-gradient(135deg, rgba(127,29,29,0.3), rgba(239,68,68,0.1))',
              border: `1px solid ${won ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.35)'}`,
              boxShadow: won ? '0 0 25px rgba(34,197,94,0.15)' : '0 0 25px rgba(239,68,68,0.1)',
            }}
          >
            {/* Coin burst */}
            {coinBurst && won && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                {['🪙', '🪙', '🪙', '⭐', '🪙', '🪙'].map((c, i) => (
                  <span
                    key={i}
                    className="absolute text-2xl"
                    style={{
                      animation: `coinFly 0.8s ease-out forwards`,
                      animationDelay: `${i * 0.08}s`,
                      '--angle': `${i * 60}deg`,
                    } as React.CSSProperties}
                  >
                    {c}
                  </span>
                ))}
              </div>
            )}

            <p className="text-4xl mb-2">{won ? '🏆' : '💪'}</p>
            <p
              className="text-xl font-black tracking-wide"
              style={{ color: won ? '#4ade80' : '#f87171' }}
            >
              {won ? 'Incrível! Você lembrou!' : 'Quase lá! Continue praticando.'}
            </p>
            {won && (
              <div className="flex items-center justify-center gap-3 mt-3">
                <span className="text-yellow-300 font-black text-lg">🪙 +1 Coin</span>
                <span className="text-blue-300 font-black text-lg">⚡ +{xpReward} XP</span>
              </div>
            )}
          </div>

          {/* Target sentence reveal */}
          <div
            className="rounded-2xl p-5"
            style={{
              background: 'rgba(20,20,60,0.6)',
              border: '1px solid rgba(168,85,247,0.2)',
            }}
          >
            <p className="text-xs font-bold tracking-widest uppercase text-purple-400/60 mb-3 text-center">
              A frase era — comparação palavra por palavra
            </p>

            {/* Score bar */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${bestScore}%`,
                    background: bestScore >= WIN_THRESHOLD
                      ? 'linear-gradient(90deg, #15803d, #22c55e)'
                      : 'linear-gradient(90deg, #991b1b, #ef4444)',
                    boxShadow: bestScore >= WIN_THRESHOLD
                      ? '0 0 8px rgba(34,197,94,0.5)'
                      : '0 0 8px rgba(239,68,68,0.5)',
                  }}
                />
              </div>
              <span
                className="text-sm font-black w-12 text-right"
                style={{ color: bestScore >= WIN_THRESHOLD ? '#4ade80' : '#f87171' }}
              >
                {bestScore}%
              </span>
            </div>

            {/* Word-by-word */}
            <div className="flex flex-wrap gap-2 justify-center">
              {wordResults.map((wr, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 rounded-lg text-sm font-bold transition-all"
                  style={{
                    background: wr.correct ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
                    border: `1px solid ${wr.correct ? 'rgba(34,197,94,0.5)' : 'rgba(239,68,68,0.4)'}`,
                    color: wr.correct ? '#4ade80' : '#f87171',
                  }}
                >
                  {wr.correct ? '✓' : '✗'} {wr.word}
                </span>
              ))}
            </div>

            {/* What the user said */}
            <div className="mt-4 pt-3 border-t border-white/5 text-center">
              <p className="text-xs text-purple-300/40 mb-1">Você disse:</p>
              <p className="text-white/50 text-sm italic">
                &ldquo;{liveTranscript || '(nenhuma fala detectada)'}&rdquo;
              </p>
            </div>
          </div>

          {/* Continue button */}
          <button
            onClick={handleContinue}
            className="w-full font-black tracking-widest px-8 py-4 rounded-xl text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #1d4ed8, #0066FF)',
              boxShadow: '0 0 25px rgba(0,102,255,0.4)',
            }}
          >
            {won ? '✓ AVANÇAR →' : '→ CONTINUAR'}
          </button>
        </div>
      )}

      <style>{`
        @keyframes fadeInMemory {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulsePurple {
          0%, 100% { box-shadow: 0 0 20px rgba(168,85,247,0.4); }
          50%       { box-shadow: 0 0 40px rgba(168,85,247,0.7); }
        }
        @keyframes pulseRed {
          0%, 100% { box-shadow: 0 0 15px rgba(220,38,38,0.4); }
          50%       { box-shadow: 0 0 30px rgba(220,38,38,0.7); }
        }
        @keyframes barBounce {
          0%, 100% { transform: scaleY(0.4); opacity: 0.5; }
          50%       { transform: scaleY(1.4); opacity: 1; }
        }
        @keyframes countPop {
          from { transform: scale(1.4); opacity: 0.4; }
          to   { transform: scale(1);   opacity: 1; }
        }
        @keyframes coinFly {
          0%   { transform: translate(0,0) scale(1); opacity: 1; }
          100% { transform: translate(
                   calc(cos(var(--angle)) * 60px),
                   calc(sin(var(--angle)) * 60px)
                 ) scale(0); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
