'use client'

/**
 * PracticeSession — Sessão guiada de pronúncia com 10 rodadas.
 *
 * Fluxo de cada rodada:
 * 1. AI exibe mensagem + TTS fala a palavra  (phase: 'ai-speaking')
 * 2. Usuário pressiona mic e fala            (phase: 'user-turn' → 'listening')
 * 3. Sistema avalia a pronúncia             (phase: 'evaluating')
 * 4. AI dá feedback + TTS repete a palavra  (phase: 'feedback')
 * 5. Próxima rodada ou fim da sessão
 */
import { useState, useEffect, useRef } from 'react'
import { playTTS } from '@/src/lib/ttsService'
import type { PronunciationError } from '@/src/services/pronunciation.service'
import {
  startLiveRecognition,
  transcribeFreeBlob,
  isNativeWebSpeechSupported,
  type LiveRecognitionHandle,
} from '@/src/lib/transcriptionService'

// ── Constantes ─────────────────────────────────────────────────────────────

const TOTAL_ROUNDS = 10

// ── Tipos ──────────────────────────────────────────────────────────────────

type Phase =
  | 'intro'       // mensagem inicial sendo exibida
  | 'ai-speaking' // TTS ativo (AI falando)
  | 'user-turn'   // aguardando o usuário pressionar mic
  | 'listening'   // gravando voz do usuário
  | 'feedback'    // AI dando feedback
  | 'complete'    // sessão encerrada

interface ChatMessage {
  role: 'ai' | 'user'
  text: string
  correct?: boolean // undefined = neutro, true = certo, false = errado
}

export interface PracticeSessionProps {
  errors: PronunciationError[]
  onEnd: () => void
}

// ── Helpers ────────────────────────────────────────────────────────────────

/** Seleciona até `count` palavras aleatórias do histórico (prioriza as mais frequentes) */
function pickWords(errors: PronunciationError[], count: number): PronunciationError[] {
  const pool = errors.slice(0, Math.min(15, errors.length))
  return [...pool].sort(() => Math.random() - 0.5).slice(0, Math.min(count, pool.length))
}

/** Normaliza string para comparação (só letras minúsculas) */
function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z]/g, '')
}

/** Verifica se a pronúncia está correta (aceita matches parciais próximos) */
function checkPronunciation(spoken: string, target: string): boolean {
  const s = normalize(spoken)
  const t = normalize(target)
  return s === t || s.includes(t) || t.includes(s)
}

/** Retorna um elogio aleatório */
function randomPraise(): string {
  const list = ['Perfeito! 🎉', 'Excelente! ✅', 'Isso aí! 🌟', 'Arrasou! 👏', 'Muito bem! 🎯']
  return list[Math.floor(Math.random() * list.length)]
}

// ── Componente ─────────────────────────────────────────────────────────────

export function PracticeSession({ errors, onEnd }: PracticeSessionProps) {
  /** Palavras selecionadas aleatoriamente — fixas durante a sessão */
  const [words] = useState(() => pickWords(errors, 3))

  const [phase, setPhase] = useState<Phase>('intro')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isListening,         setIsListening]         = useState(false)
  const [mediaRecordingActive, setMediaRecordingActive] = useState(false)
  const [round, setRound] = useState(0)
  const [displayScore, setDisplayScore] = useState(0)

  /** Refs para acessar valores atuais dentro de callbacks assíncronos */
  const roundRef  = useRef(0)
  const scoreRef  = useRef(0)
  const wordsRef  = useRef(words)

  const messagesEndRef    = useRef<HTMLDivElement>(null)
  /** Impede dupla execução no React Strict Mode */
  const sessionStartedRef = useRef(false)
  /** Refs de gravação */
  const liveRecognitionRef = useRef<LiveRecognitionHandle | null>(null)
  const mediaRecorderRef   = useRef<MediaRecorder | null>(null)
  const chunksRef          = useRef<Blob[]>([])
  const streamRef          = useRef<MediaStream | null>(null)

  /** Auto-scroll ao final do chat */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  /** Adiciona mensagem ao histórico do chat */
  const addMessage = (msg: ChatMessage) =>
    setMessages(prev => [...prev, msg])

  /** Palavra da rodada atual */
  const wordOf = (r: number) => wordsRef.current[r % wordsRef.current.length]

  /** Inicia uma rodada: AI exibe e fala a palavra */
  const startRound = (r: number) => {
    const word = wordOf(r)
    setPhase('ai-speaking')
    addMessage({ role: 'ai', text: `Repita esta palavra: "${word.word}"` })

    playTTS(word.word, 'alice', 'slow', () => {
      setPhase('user-turn')
    })
  }

  /** Mensagem de boas-vindas + inicia primeira rodada — guard evita double-invoke do Strict Mode */
  useEffect(() => {
    if (sessionStartedRef.current) return
    sessionStartedRef.current = true

    const wordList = words.map(w => `"${w.word}"`).join(', ')
    const intro = `Deixe eu te ajudar! 🦉 Vamos treinar ${words.length === 1 ? 'a palavra' : 'as palavras'} ${wordList} em ${TOTAL_ROUNDS} rodadas. Ouça com atenção e repita!`

    setTimeout(() => {
      addMessage({ role: 'ai', text: intro })
      setTimeout(() => startRound(0), 1000)
    }, 400)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /** Para a gravação MediaRecorder (iOS/Firefox) */
  function stopWhisperRecording() {
    const mr = mediaRecorderRef.current
    if (mr && mr.state === 'recording') mr.stop()
  }

  /** Inicia gravação — Web Speech API (Chrome/Edge) ou MediaRecorder (iOS/Firefox) */
  const handleMicPress = () => {
    // Press-to-stop: se MediaRecorder estiver ativo, para a gravação
    if (mediaRecordingActive) {
      stopWhisperRecording()
      return
    }

    if (phase !== 'user-turn') return

    setIsListening(true)
    setPhase('listening')

    if (isNativeWebSpeechSupported()) {
      const handle = startLiveRecognition('en-US', {
        onResult: () => {},
        onEnd: (finalTranscript) => {
          liveRecognitionRef.current = null
          setIsListening(false)
          processAnswer(finalTranscript)
        },
        onError: () => {
          liveRecognitionRef.current = null
          setIsListening(false)
          processAnswer('')
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
        setIsListening(false)
        setMediaRecordingActive(false)
        try {
          const blob = new Blob(chunksRef.current, { type: mr.mimeType })
          const transcript = await transcribeFreeBlob(blob, 'en-US')
          processAnswer(transcript)
        } catch {
          processAnswer('')
        }
      }
      mr.start()
      mediaRecorderRef.current = mr
      setMediaRecordingActive(true)
    } catch {
      setIsListening(false)
      setPhase('user-turn')
      alert('Erro ao acessar microfone')
    }
  }

  /** Avalia a resposta do usuário e dá feedback */
  const processAnswer = (spoken: string) => {
    const word = wordOf(roundRef.current)
    const correct = spoken ? checkPronunciation(spoken, word.word) : false

    // Mensagem do usuário no chat
    addMessage({ role: 'user', text: spoken || '(não reconhecido)', correct })

    // Atualiza score
    if (correct) {
      scoreRef.current += 1
      setDisplayScore(scoreRef.current)
    }

    // Monta feedback
    let feedback: string
    if (correct) {
      feedback = `${randomPraise()} "${word.word}" — pronúncia correta! Vamos para a próxima. 🎵`
    } else {
      const tipSnippet = word.ai_tip ? word.ai_tip.split('.')[0] : null
      feedback = spoken
        ? `Quase! Você disse "${spoken}". ${tipSnippet ?? `"${word.word}" — ouça e tente novamente!`} 💪`
        : `Vamos tentar de novo! Ouça com atenção e repita: "${word.word}" 🎧`
    }

    setPhase('feedback')
    addMessage({ role: 'ai', text: feedback, correct })

    const nextRound = roundRef.current + 1

    /** TTS repete a palavra depois do feedback, depois avança */
    playTTS(word.word, 'alice', correct ? 'normal' : 'slow', () => {
      if (nextRound >= TOTAL_ROUNDS) {
        setTimeout(() => endSession(), 600)
      } else {
        roundRef.current = nextRound
        setRound(nextRound)
        setTimeout(() => startRound(nextRound), 700)
      }
    })
  }

  /** Encerra a sessão e exibe resultado */
  const endSession = () => {
    const final = scoreRef.current
    const pct   = Math.round((final / TOTAL_ROUNDS) * 100)
    const emoji = pct >= 80 ? '🏆' : pct >= 50 ? '💪' : '📚'
    const msg   = pct >= 80
      ? 'Incrível! Você está mandando muito bem!'
      : pct >= 50
        ? 'Bom trabalho! Continue praticando!'
        : 'Não desista — a prática leva à perfeição!'

    addMessage({
      role: 'ai',
      text: `${emoji} Sessão encerrada! ${final}/${TOTAL_ROUNDS} corretas (${pct}%). ${msg}`,
    })
    setPhase('complete')
  }

  const progressPct = Math.round((round / TOTAL_ROUNDS) * 100)

  return (
    <div
      className="rounded-2xl flex flex-col overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(30,0,60,0.98), rgba(10,5,40,0.98))',
        border: '1px solid rgba(168,85,247,0.35)',
        boxShadow: '0 0 40px rgba(168,85,247,0.15)',
        height: '580px',
      }}
    >
      {/* ── Header ── */}
      <div
        className="flex items-center justify-between px-5 py-3 border-b flex-shrink-0"
        style={{ borderColor: 'rgba(168,85,247,0.15)' }}
      >
        <div className="flex items-center gap-3">
          <img
            src="/images/aguia-corretora.png"
            alt="Coruja"
            className="w-8 h-8 object-contain"
            style={{ filter: 'drop-shadow(0 0 6px rgba(168,85,247,0.8))', animation: 'owlBob 3s ease-in-out infinite' }}
          />
          <div>
            <p className="text-xs font-black tracking-widest uppercase" style={{ color: '#c084fc' }}>
              Sessão de Prática
            </p>
            <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {words.map(w => w.word).join(' · ')}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-black" style={{ color: '#a855f7' }}>
            {round}/{TOTAL_ROUNDS}
          </p>
          <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
            {displayScore} corretas
          </p>
        </div>
      </div>

      {/* ── Barra de progresso ── */}
      <div className="h-1 flex-shrink-0" style={{ background: 'rgba(168,85,247,0.1)' }}>
        <div
          className="h-full transition-all duration-700"
          style={{ width: `${progressPct}%`, background: 'linear-gradient(90deg, #7c3aed, #a855f7)' }}
        />
      </div>

      {/* ── Área do chat ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {/* Avatar da coruja (só nas mensagens da AI) */}
            {msg.role === 'ai' && (
              <img
                src="/images/aguia-corretora.png"
                className="w-6 h-6 object-contain self-end flex-shrink-0"
                style={{ filter: 'drop-shadow(0 0 4px rgba(168,85,247,0.6))' }}
              />
            )}

            {/* Balão da mensagem */}
            <div
              className="max-w-[78%] px-4 py-2.5 text-sm leading-relaxed"
              style={{
                borderRadius: msg.role === 'ai' ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
                background: msg.role === 'ai'
                  ? 'rgba(168,85,247,0.1)'
                  : msg.correct === true
                    ? 'rgba(34,197,94,0.15)'
                    : msg.correct === false
                      ? 'rgba(239,68,68,0.12)'
                      : 'rgba(255,255,255,0.08)',
                border: `1px solid ${
                  msg.role === 'ai'
                    ? 'rgba(168,85,247,0.2)'
                    : msg.correct === true
                      ? 'rgba(34,197,94,0.35)'
                      : msg.correct === false
                        ? 'rgba(239,68,68,0.3)'
                        : 'rgba(255,255,255,0.1)'
                }`,
                color: 'rgba(255,255,255,0.85)',
              }}
            >
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Controles ── */}
      <div
        className="px-5 py-4 border-t flex-shrink-0"
        style={{ borderColor: 'rgba(168,85,247,0.15)' }}
      >
        {phase === 'complete' ? (
          <div className="space-y-2">
            {/* Botão praticar novamente */}
            <button
              onClick={onEnd}
              className="w-full py-3 rounded-xl font-black text-sm tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)', color: '#fff' }}
            >
              🔄 NOVA SESSÃO
            </button>
            {/* Ver histórico */}
            <button
              onClick={onEnd}
              className="w-full py-2.5 rounded-xl font-bold text-xs tracking-widest transition-all hover:opacity-70"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.35)',
              }}
            >
              VER HISTÓRICO DE ERROS
            </button>
          </div>
        ) : (
          /* Botão de microfone */
          <button
            onClick={handleMicPress}
            disabled={phase !== 'user-turn' && !mediaRecordingActive}
            className="w-full py-4 rounded-xl font-black text-sm tracking-widest transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: mediaRecordingActive
                ? 'rgba(239,68,68,0.2)'
                : isListening
                  ? 'rgba(239,68,68,0.15)'
                  : phase === 'user-turn'
                    ? 'linear-gradient(135deg, rgba(88,28,135,0.9), rgba(168,85,247,0.6))'
                    : 'rgba(168,85,247,0.08)',
              border: `1px solid ${(isListening || mediaRecordingActive) ? 'rgba(239,68,68,0.5)' : 'rgba(168,85,247,0.4)'}`,
              color: phase === 'user-turn' || mediaRecordingActive ? '#e9d5ff' : 'rgba(168,85,247,0.4)',
              boxShadow: phase === 'user-turn' ? '0 0 20px rgba(168,85,247,0.25)' : 'none',
            }}
          >
            {mediaRecordingActive
              ? '🛑 PRESSIONE PARA PARAR'
              : isListening
                ? '🔴 Ouvindo... fale agora!'
                : phase === 'user-turn'
                  ? '🎤 PRESSIONE E FALE'
                  : phase === 'ai-speaking' || phase === 'feedback'
                    ? '🦉 Ouça a coruja...'
                    : '⏳ Processando...'}
          </button>
        )}
      </div>
    </div>
  )
}
