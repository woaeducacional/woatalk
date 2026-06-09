'use client'

/**
 * TopicPracticeDialog — Diálogo de prática de pronúncia por tópico.
 *
 * Fluxo de cada rodada:
 * 1. AI envia pergunta em inglês → Azure TTS fala a pergunta
 * 2. Usuário pressiona mic → Azure STT transcreve a resposta
 * 3. API avalia pronúncia + gera próxima pergunta (GPT-4o-mini)
 * 4. Feedback em PT-BR + próxima pergunta via TTS
 * 5. Repete por 10 rodadas
 */
import { useState, useEffect, useRef } from 'react'
import type { ChatGroup } from '@/src/services/chat.service'
import {
  startLiveRecognition,
  transcribeFreeBlob,
  isNativeWebSpeechSupported,
  type LiveRecognitionHandle,
} from '@/src/lib/transcriptionService'

const TOTAL_QUESTIONS = 10

// ── Tipos ──────────────────────────────────────────────────────────────────

type Phase =
  | 'loading'      // carregando primeira pergunta
  | 'ai-speaking'  // TTS ativo
  | 'user-turn'    // aguardando mic — pressionar para começar
  | 'recording'    // gravando (pressionar novamente para parar)
  | 'transcribing' // processando áudio
  | 'processing'   // chamando API com a transcrição
  | 'complete'     // sessão encerrada

interface ChatMessage {
  role: 'ai' | 'user'
  text: string
  isFeedback?: boolean
}

interface ConversationTurn {
  role: 'assistant' | 'user'
  content: string
}

interface TopicPracticeDialogProps {
  group: ChatGroup
  onClose: () => void
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Reproduz texto via Azure TTS (/api/tts) */
async function speakText(text: string, rate = 'normal'): Promise<void> {
  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice: 'oliver', rate }),
    })
    if (!res.ok) throw new Error('TTS failed')
    const blob = await res.blob()
    const url  = URL.createObjectURL(blob)
    await new Promise<void>((resolve) => {
      const audio = new Audio(url)
      audio.onended = () => { URL.revokeObjectURL(url); resolve() }
      audio.onerror = () => { URL.revokeObjectURL(url); resolve() }
      audio.play().catch(() => resolve())
    })
  } catch {
    // fallback para Web Speech
    await new Promise<void>((resolve) => {
      if (typeof window === 'undefined' || !window.speechSynthesis) { resolve(); return }
      const u = new SpeechSynthesisUtterance(text)
      u.lang = 'en-US'; u.rate = 0.85
      u.onend = () => resolve(); u.onerror = () => resolve()
      window.speechSynthesis.speak(u)
    })
  }
}


// ── Componente ─────────────────────────────────────────────────────────────

export function TopicPracticeDialog({ group, onClose }: TopicPracticeDialogProps) {
  const [phase,          setPhase]          = useState<Phase>('loading')
  const [messages,       setMessages]       = useState<ChatMessage[]>([])
  const [questionNumber, setQuestionNumber] = useState(0)
  const [history,        setHistory]        = useState<ConversationTurn[]>([])

  const messagesEndRef      = useRef<HTMLDivElement>(null)
  /** Impede dupla execução no React Strict Mode */
  const sessionStartedRef   = useRef(false)
  /** Refs de gravação — mesma abordagem do ListenRepeatQuestion */
  const liveRecognitionRef  = useRef<LiveRecognitionHandle | null>(null)
  const mediaRecorderRef    = useRef<MediaRecorder | null>(null)
  const chunksRef           = useRef<Blob[]>([])
  const streamRef           = useRef<MediaStream | null>(null)
  /** Ref para acessar history atual dentro de callbacks async */
  const historyRef          = useRef<ConversationTurn[]>([])
  const questionNumberRef   = useRef(0)

  /** Scroll automático */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  /** Inicia a sessão ao montar — guard evita double-invoke do Strict Mode */
  useEffect(() => {
    if (sessionStartedRef.current) return
    sessionStartedRef.current = true
    startSession()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /** Sincroniza refs com state para uso em callbacks */
  useEffect(() => { historyRef.current = history }, [history])
  useEffect(() => { questionNumberRef.current = questionNumber }, [questionNumber])

  /** Adiciona mensagem ao chat */
  const addMessage = (msg: ChatMessage) =>
    setMessages(prev => [...prev, msg])

  /** Chama a API e obtém resposta da AI */
  const fetchAIResponse = async (
    currentHistory: ConversationTurn[],
    userSpeech: string,
    qNum: number,
  ) => {
    const res = await fetch('/api/pronunciation/topic-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: group.id,
        history: currentHistory,
        userSpeech,
        questionNumber: qNum,
      }),
    })
    if (!res.ok) throw new Error('AI response failed')
    return res.json() as Promise<{ feedback: string; question: string; isComplete: boolean; questionNumber: number }>
  }

  /** Inicia a sessão com a primeira pergunta */
  const startSession = async () => {
    setPhase('loading')
    try {
      const { question, isComplete } = await fetchAIResponse([], '', 0)

      addMessage({ role: 'ai', text: question })
      const newHistory: ConversationTurn[] = [{ role: 'assistant', content: question }]
      setHistory(newHistory)
      setQuestionNumber(1)

      setPhase('ai-speaking')
      await speakText(question)  // só fala a pergunta em inglês
      if (isComplete) { setPhase('complete'); return }
      setPhase('user-turn')
    } catch {
      addMessage({ role: 'ai', text: 'Erro ao iniciar a sessão. Tente novamente.' })
      setPhase('user-turn')
    }
  }

  /** Processa a transcrição — chama AI e exibe resposta */
  const processSpoken = async (spoken: string) => {
    if (spoken) {
      addMessage({ role: 'user', text: spoken })
    } else {
      addMessage({ role: 'user', text: '(não reconhecido — tente novamente)' })
    }

    const currentHistory = historyRef.current
    const currentQNum    = questionNumberRef.current

    const updatedHistory: ConversationTurn[] = [
      ...currentHistory,
      { role: 'user', content: spoken || '(no speech detected)' },
    ]

    setPhase('processing')
    try {
      const { feedback, question, isComplete } = await fetchAIResponse(
        updatedHistory,
        spoken,
        currentQNum,
      )

      // Exibe feedback em PT (sem TTS — voz configurada para inglês)
      if (feedback) {
        addMessage({ role: 'ai', text: feedback, isFeedback: true })
      }
      // Exibe e fala apenas a pergunta em inglês
      addMessage({ role: 'ai', text: question })

      const fullResponse = [feedback, question].filter(Boolean).join('\n')
      const newHistory: ConversationTurn[] = [
        ...updatedHistory,
        { role: 'assistant', content: fullResponse },
      ]
      setHistory(newHistory)
      setQuestionNumber(q => q + 1)

      setPhase('ai-speaking')
      await speakText(question)  // só fala a pergunta em inglês
      setPhase(isComplete ? 'complete' : 'user-turn')
    } catch {
      addMessage({ role: 'ai', text: 'Erro ao gerar resposta. Tente novamente.' })
      setPhase('user-turn')
    }
  }

  /** Inicia gravação — Web Speech contínuo (Chrome/Edge) ou MediaRecorder + Whisper.js */
  const startRecording = () => {
    if (isNativeWebSpeechSupported()) {
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      const recognition = new SR()
      recognition.lang = 'en-US'
      recognition.continuous = true       // mantém ouvindo até o usuário parar manualmente
      recognition.interimResults = false

      let finalTranscript = ''
      recognition.onresult = (e: any) => {
        for (let i = e.resultIndex; i < e.results.length; i++) {
          if (e.results[i].isFinal) finalTranscript += e.results[i][0].transcript + ' '
        }
      }
      recognition.onend = () => {
        liveRecognitionRef.current = null
        setPhase('transcribing')
        processSpoken(finalTranscript.trim())
      }
      recognition.onerror = () => {
        liveRecognitionRef.current = null
        processSpoken(finalTranscript.trim())
      }

      try {
        recognition.start()
        liveRecognitionRef.current = { stop: () => recognition.stop() }
        setPhase('recording')
      } catch {
        processSpoken('')
      }
    } else {
      // Firefox, Safari — MediaRecorder + Whisper.js
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
        const blob = new Blob(chunksRef.current, { type: mr.mimeType })
        setPhase('transcribing')
        try {
          const transcript = await transcribeFreeBlob(blob, 'en-US')
          processSpoken(transcript)
        } catch {
          processSpoken('')
        }
      }
      mr.start()
      mediaRecorderRef.current = mr
      setPhase('recording')
    } catch {
      alert('Erro ao acessar microfone')
      setPhase('user-turn')
    }
  }

  /** Para a gravação */
  const stopRecording = () => {
    if (liveRecognitionRef.current) {
      liveRecognitionRef.current.stop()
      liveRecognitionRef.current = null
    } else {
      const mr = mediaRecorderRef.current
      if (mr && mr.state !== 'inactive') mr.stop()
    }
  }

  /** Botão de mic — toggle start/stop */
  const handleMicPress = () => {
    if (phase === 'user-turn') {
      startRecording()
    } else if (phase === 'recording') {
      stopRecording()
    }
  }

  const progressPct = Math.round((questionNumber / TOTAL_QUESTIONS) * 100)

  return (
    /* ── Overlay ── */
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full sm:max-w-lg flex flex-col rounded-t-3xl sm:rounded-3xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(20,0,50,0.99), rgba(5,0,25,0.99))',
          border: `1px solid ${group.color}40`,
          boxShadow: `0 0 50px ${group.color}20`,
          height: '90vh',
          maxHeight: '640px',
          animation: 'slideUp 0.3s ease-out',
        }}
      >
        {/* ── Header ── */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0"
          style={{ borderColor: `${group.color}20` }}
        >
          <div className="flex items-center gap-3">
            <img
              src="/images/aguia-corretora.png"
              alt="Tutor"
              className="w-8 h-8 object-contain"
              style={{ filter: `drop-shadow(0 0 8px ${group.color})`, animation: 'owlBob 3s ease-in-out infinite' }}
            />
            <div>
              <p className="text-xs font-black tracking-widest uppercase" style={{ color: group.color }}>
                Tutor de Pronúncia
              </p>
              <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                {group.emoji} {group.name} · {questionNumber}/{TOTAL_QUESTIONS} perguntas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110"
            style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)' }}
          >
            ✕
          </button>
        </div>

        {/* ── Barra de progresso ── */}
        <div className="h-1 flex-shrink-0" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div
            className="h-full transition-all duration-700"
            style={{ width: `${progressPct}%`, background: `linear-gradient(90deg, ${group.color}80, ${group.color})` }}
          />
        </div>

        {/* ── Área do chat ── */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
          {phase === 'loading' && messages.length === 0 && (
            <div className="flex items-center gap-3 justify-center py-10">
              <div
                className="w-6 h-6 rounded-full animate-spin"
                style={{ border: `2px solid ${group.color}30`, borderTopColor: group.color }}
              />
              <p className="text-sm" style={{ color: `${group.color}90` }}>
                Preparando sua sessão...
              </p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar da coruja — só em mensagens EN (não feedback PT) */}
              {msg.role === 'ai' && !msg.isFeedback && (
                <img
                  src="/images/aguia-corretora.png"
                  className="w-6 h-6 object-contain self-end flex-shrink-0"
                  style={{ filter: `drop-shadow(0 0 4px ${group.color})` }}
                />
              )}
              {/* Espaçador para alinhar feedback PT sem avatar */}
              {msg.role === 'ai' && msg.isFeedback && (
                <div className="w-6 flex-shrink-0" />
              )}

              <div
                className={`px-4 leading-relaxed ${msg.isFeedback ? 'max-w-[85%] py-2 text-xs' : 'max-w-[80%] py-3 text-sm'}`}
                style={{
                  borderRadius: msg.role === 'ai' ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
                  background: msg.isFeedback
                    ? 'rgba(250,204,21,0.07)'           // PT feedback — amarelo suave
                    : msg.role === 'ai'
                      ? `${group.color}12`              // EN question — cor do tema
                      : 'rgba(255,255,255,0.08)',        // user
                  border: `1px solid ${
                    msg.isFeedback
                      ? 'rgba(250,204,21,0.2)'
                      : msg.role === 'ai'
                        ? `${group.color}25`
                        : 'rgba(255,255,255,0.1)'
                  }`,
                  color: msg.isFeedback
                    ? 'rgba(255,255,255,0.6)'
                    : 'rgba(255,255,255,0.88)',
                }}
              >
                {msg.isFeedback && (
                  <span className="text-[9px] font-black tracking-widest uppercase mr-1" style={{ color: 'rgba(250,204,21,0.6)' }}>
                    🇧🇷 dica ·{' '}
                  </span>
                )}
                {msg.text}
              </div>
            </div>
          ))}

          <div ref={messagesEndRef} />
        </div>

        {/* ── Controles ── */}
        <div
          className="px-5 py-4 border-t flex-shrink-0"
          style={{ borderColor: `${group.color}15` }}
        >
          {phase === 'complete' ? (
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl font-black text-sm tracking-widest transition-all hover:scale-[1.02]"
              style={{ background: `linear-gradient(135deg, ${group.color}80, ${group.color})`, color: '#fff' }}
            >
              🎉 SESSÃO CONCLUÍDA — FECHAR
            </button>
          ) : (
            <div className="space-y-2">
              {/* Botão de mic */}
              <button
                onClick={handleMicPress}
                disabled={phase !== 'user-turn' && phase !== 'recording'}
                className="w-full py-4 rounded-xl font-black text-sm tracking-widest transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: phase === 'recording'
                    ? 'rgba(239,68,68,0.2)'
                    : phase === 'user-turn'
                      ? `linear-gradient(135deg, rgba(88,28,135,0.8), ${group.color}50)`
                      : `${group.color}10`,
                  border: `1px solid ${phase === 'recording' ? 'rgba(239,68,68,0.5)' : `${group.color}40`}`,
                  color: (phase === 'user-turn' || phase === 'recording') ? '#fff' : `${group.color}60`,
                  boxShadow: phase === 'user-turn' ? `0 0 20px ${group.color}25` : 'none',
                  animation: phase === 'recording' ? 'pulseMic 1s ease-in-out infinite' : 'none',
                }}
              >
                {phase === 'recording'
                  ? '� PARAR DE FALAR'
                  : phase === 'transcribing'
                    ? '⏳ Transcrevendo...'
                    : phase === 'processing'
                      ? '⏳ Processando...'
                      : phase === 'ai-speaking'
                        ? '🦉 Ouça a pergunta...'
                        : phase === 'loading'
                          ? '⏳ Aguarde...'
                          : '🎤 FALAR — pressione para iniciar'}
              </button>

              {/* Dica */}
              {phase === 'user-turn' && (
                <p className="text-center text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                  Responda em inglês · pressione para falar · pressione para parar
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(40px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes owlBob {
          0%, 100% { transform: translateY(0px) rotate(-3deg); }
          50%       { transform: translateY(-5px) rotate(3deg); }
        }
        @keyframes pulseMic {
          0%, 100% { box-shadow: 0 0 10px rgba(239,68,68,0.3); }
          50%       { box-shadow: 0 0 25px rgba(239,68,68,0.7); }
        }
      `}</style>
    </div>
  )
}
