'use client'

/**
 * OwlFeedbackPanel — sessão interativa de pronúncia palavra a palavra.
 *
 * Fluxo:
 * 1. TTS "Let's do it together!"
 * 2. Para cada palavra errada:
 *    a. TTS fala a palavra em ritmo lento
 *    b. "Now your turn" + botão gravar
 *    c. Se correto → próxima palavra
 *    d. Se errado → uma segunda tentativa, depois segue em frente
 * 3. Ao final exibe mensagem de parabéns
 */
import { useState, useEffect, useRef } from 'react'
import { playTTS } from '@/src/lib/ttsService'
import {
  startLiveRecognition,
  isNativeWebSpeechSupported,
  transcribeFreeBlob,
  type LiveRecognitionHandle,
} from '@/src/lib/transcriptionService'
import type { WordDiffItem } from '@/src/hooks/usePronunciationFeedback'

// ── Tipos ──────────────────────────────────────────────────────────────────

type PracticePhase =
  | 'intro'         // TTS "Let's do it together!"
  | 'word-speaking' // TTS da palavra atual
  | 'user-turn'     // aguardando o usuário pressionar gravar
  | 'recording'     // gravando voz
  | 'result'        // mostrando ✅ / ❌
  | 'complete'      // todas as palavras concluídas

interface OwlFeedbackPanelProps {
  wordDiff: WordDiffItem[]
  aiTip: string | null
  isLoadingTip: boolean
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z]/g, '')
}

function checkPronunciation(spoken: string, target: string): boolean {
  const s = normalize(spoken)
  const t = normalize(target)
  return s === t || s.includes(t) || t.includes(s)
}

// ── Componente ───────────────────────────────────────────────────────────────

export function OwlFeedbackPanel({ wordDiff, aiTip }: OwlFeedbackPanelProps) {
  const wrongWords = wordDiff.filter(w => !w.isCorrect).map(w => w.expected)

  const [phase,       setPhase]       = useState<PracticePhase>('intro')
  const [wordIndex,   setWordIndex]   = useState(0)
  const [attemptCount,setAttemptCount]= useState(0) // 0 = primeira, 1 = retry
  const [lastResult,  setLastResult]  = useState<'correct' | 'wrong' | null>(null)

  const sessionStartedRef  = useRef(false)
  const liveRecognitionRef = useRef<LiveRecognitionHandle | null>(null)
  const mediaRecorderRef   = useRef<MediaRecorder | null>(null)
  const chunksRef          = useRef<Blob[]>([])
  const streamRef          = useRef<MediaStream | null>(null)
  const wordIndexRef       = useRef(0)
  const attemptCountRef    = useRef(0)

  useEffect(() => { wordIndexRef.current   = wordIndex   }, [wordIndex])
  useEffect(() => { attemptCountRef.current = attemptCount }, [attemptCount])

  const currentWord = wrongWords[wordIndex] ?? ''

  // ── Inicia sessão ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (sessionStartedRef.current || wrongWords.length === 0) return
    sessionStartedRef.current = true

    setPhase('intro')
    playTTS("Let's do it together!", 'oliver', 'normal', () => {
      speakWord(wrongWords[0])
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Helpers de fluxo ─────────────────────────────────────────────────────

  function speakWord(word: string) {
    setPhase('word-speaking')
    playTTS(word, 'oliver', 'slow', () => {
      setPhase('user-turn')
    })
  }

  function advanceWord(fromIndex: number) {
    const next = fromIndex + 1
    if (next >= wrongWords.length) {
      setPhase('complete')
      playTTS('Great job! Keep it up!', 'oliver', 'normal', () => {})
    } else {
      setWordIndex(next)
      setAttemptCount(0)
      setLastResult(null)
      speakWord(wrongWords[next])
    }
  }

  function processSpoken(spoken: string) {
    const idx     = wordIndexRef.current
    const attempt = attemptCountRef.current
    const correct = spoken ? checkPronunciation(spoken, wrongWords[idx]) : false

    setLastResult(correct ? 'correct' : 'wrong')
    setPhase('result')

    if (correct) {
      setTimeout(() => advanceWord(idx), 1400)
    } else if (attempt === 0) {
      // Primeira tentativa errada → uma chance de retry
      setTimeout(() => {
        setAttemptCount(1)
        setLastResult(null)
        speakWord(wrongWords[idx])
      }, 2000)
    } else {
      // Segunda tentativa — segue em frente
      setTimeout(() => advanceWord(idx), 1400)
    }
  }

  // ── Gravação ─────────────────────────────────────────────────────────────

  function startRecording() {
    if (phase !== 'user-turn') return
    setPhase('recording')

    if (isNativeWebSpeechSupported()) {
      const handle = startLiveRecognition('en-US', {
        onResult: () => {},
        onEnd: (finalTranscript) => {
          liveRecognitionRef.current = null
          processSpoken(finalTranscript)
        },
        onError: () => {
          liveRecognitionRef.current = null
          processSpoken('')
        },
      })
      liveRecognitionRef.current = handle
    } else {
      startWhisperRecording()
    }
  }

  async function startWhisperRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : ''
      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      chunksRef.current = []
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = async () => {
        streamRef.current?.getTracks().forEach(t => t.stop())
        try {
          const blob = new Blob(chunksRef.current, { type: mr.mimeType })
          const transcript = await transcribeFreeBlob(blob, 'en-US')
          processSpoken(transcript)
        } catch { processSpoken('') }
      }
      mr.start()
      mediaRecorderRef.current = mr
      setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop()
      }, 6000)
    } catch {
      setPhase('user-turn')
    }
  }

  if (wrongWords.length === 0) return null

  // ── UI ───────────────────────────────────────────────────────────────────

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(30,0,60,0.97) 0%, rgba(10,5,40,0.97) 100%)',
        border: '1px solid rgba(168,85,247,0.4)',
        boxShadow: '0 0 30px rgba(168,85,247,0.18)',
        animation: 'owlSlideIn 0.4s ease-out',
      }}
    >
      {/* ── Header ── */}
      <div
        className="flex items-center gap-3 px-5 pt-5 pb-3 border-b"
        style={{ borderColor: 'rgba(168,85,247,0.15)' }}
      >
        <div
          className="relative w-11 h-11 flex-shrink-0"
          style={{ animation: 'owlBob 2.5s ease-in-out infinite', filter: 'drop-shadow(0 0 10px rgba(168,85,247,0.7))' }}
        >
          <img src="/images/aguia-corretora.png" alt="Tutor" className="w-full h-full object-contain" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-xs tracking-[0.2em] uppercase" style={{ color: '#c084fc' }}>
            Vamos praticar juntos
          </p>
          <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {wrongWords.length} palavra{wrongWords.length !== 1 ? 's' : ''} para corrigir
          </p>
        </div>
        {/* Bolinhas de progresso */}
        <div className="flex gap-1.5 flex-shrink-0">
          {wrongWords.map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full transition-all duration-300"
              style={{
                background: i < wordIndex
                  ? 'rgba(34,197,94,0.9)'
                  : i === wordIndex
                    ? '#a855f7'
                    : 'rgba(255,255,255,0.15)',
              }}
            />
          ))}
        </div>
      </div>

      {/* ── Área de prática ── */}
      <div className="px-5 py-5 space-y-4">

        {/* Introdução */}
        {phase === 'intro' && (
          <div className="text-center py-3">
            <p className="text-xl font-black text-white">Let's do it together! 🎯</p>
            <p className="text-xs mt-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Vamos praticar cada palavra que precisa de atenção...
            </p>
          </div>
        )}

        {/* Prática da palavra */}
        {['word-speaking', 'user-turn', 'recording', 'result'].includes(phase) && (
          <>
            {/* Palavra em destaque */}
            <div className="text-center">
              <div
                className="inline-block px-8 py-3 rounded-2xl mb-3"
                style={{ background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.3)' }}
              >
                <p className="text-4xl font-black text-white tracking-wide">{currentWord}</p>
              </div>

              {/* Status label */}
              <div className="h-6 flex items-center justify-center">
                {phase === 'word-speaking' && (
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>🔊 Ouça com atenção...</p>
                )}
                {phase === 'user-turn' && attemptCount === 0 && (
                  <p className="text-sm font-bold" style={{ color: '#c084fc' }}>🎤 Now your turn!</p>
                )}
                {phase === 'user-turn' && attemptCount === 1 && (
                  <p className="text-sm font-bold" style={{ color: '#f59e0b' }}>🔄 Tente mais uma vez!</p>
                )}
                {phase === 'recording' && (
                  <p className="text-sm font-bold" style={{ color: '#ef4444' }}>🔴 Ouvindo...</p>
                )}
                {phase === 'result' && lastResult === 'correct' && (
                  <p className="text-sm font-black" style={{ color: '#22c55e' }}>✅ Perfeito! Avançando...</p>
                )}
                {phase === 'result' && lastResult === 'wrong' && attemptCount === 0 && (
                  <p className="text-sm font-black" style={{ color: '#f59e0b' }}>Quase! Ouça e tente novamente...</p>
                )}
                {phase === 'result' && lastResult === 'wrong' && attemptCount === 1 && (
                  <p className="text-sm font-black" style={{ color: 'rgba(255,255,255,0.55)' }}>Continue praticando! Próxima...</p>
                )}
              </div>
            </div>

            {/* Botão gravar */}
            {(phase === 'user-turn' || phase === 'recording') && (
              <button
                onClick={startRecording}
                disabled={phase === 'recording'}
                className="w-full py-4 rounded-xl font-black text-sm tracking-widest transition-all duration-200 disabled:cursor-not-allowed"
                style={{
                  background: phase === 'recording'
                    ? 'rgba(239,68,68,0.18)'
                    : 'linear-gradient(135deg, rgba(88,28,135,0.9), rgba(168,85,247,0.6))',
                  border: `1px solid ${phase === 'recording' ? 'rgba(239,68,68,0.45)' : 'rgba(168,85,247,0.4)'}`,
                  color: '#e9d5ff',
                  animation: phase === 'recording' ? 'pulseMic 1s ease-in-out infinite' : 'none',
                }}
              >
                {phase === 'recording' ? '🔴 Ouvindo...' : '🎤 FALAR'}
              </button>
            )}
          </>
        )}

        {/* Completo */}
        {phase === 'complete' && (
          <div className="text-center py-3 space-y-1">
            <p className="text-2xl">🎉</p>
            <p className="text-base font-black text-white">Ótimo trabalho!</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Continue praticando para melhorar ainda mais.
            </p>
          </div>
        )}

        {/* Dica da IA — menor, abaixo da prática */}
        {aiTip && phase !== 'intro' && (
          <div
            className="px-3 py-3 rounded-xl"
            style={{ background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.12)' }}
          >
            <p className="text-[9px] font-black tracking-widest uppercase mb-1.5" style={{ color: 'rgba(168,85,247,0.55)' }}>
              💡 Dica adicional
            </p>
            <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {aiTip}
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulseMic {
          0%, 100% { box-shadow: 0 0 10px rgba(239,68,68,0.3); }
          50%       { box-shadow: 0 0 25px rgba(239,68,68,0.7); }
        }
      `}</style>
    </div>
  )
}
