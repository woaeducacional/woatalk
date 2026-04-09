'use client'

import { useState, useRef, useEffect } from 'react'

interface ListenRepeatQuestionProps {
  /**
   * Array de frases para praticar
   * Exemplo: ["I watch movies.", "I listen to music.", ...]
   */
  sentences: string[]

  /**
   * Callback quando todas as frases são completadas
   */
  onComplete: (xpEarned: number) => void

  /**
   * XP a ser ganho ao completar toda a sequência
   * @default 25
   */
  xpReward?: number

  /**
   * Emoji para o título
   * @default "🎧"
   */
  icon?: string

  /**
   * Label do step (ex: "Step 2")
   * @default "Listen & Repeat"
   */
  stepLabel?: string

  /**
   * Texto customizado para o título
   * @default "Listen & Repeat"
   */
  title?: string

  /**
   * Texto customizado para a instrução principal
   * @default "Listen and repeat the sentences:"
   */
  instruction?: string

  /**
   * Texto customizado para a instrução em português
   * @default "Escute e repita as frases:"
   */
  instructionPt?: string

  /**
   * Texto do botão de escutar
   * @default "🎧 ESCUTAR"
   */
  listenButtonText?: string

  /**
   * Texto do botão de falar
   * @default "🎤 FALAR"
   */
  speakButtonText?: string

  /**
   * Texto do botão de avançar
   * @default "✓ AVANÇAR →"
   */
  advanceButtonText?: string

  /**
   * Texto do botão de pular
   * @default "⏭️ PULAR →"
   */
  skipButtonText?: string

  /**
   * Callback chamado quando não há frase disponível (ex: usuário não escolheu ainda).
   * Use para voltar à atividade anterior.
   */
  onBack?: () => void
}

/**
 * Componente reutilizável para prática de listening e repetição
 *
 * Gerencia:
 * - Síntese de fala (Text-to-Speech) com velocidade reduzida (0.6x)
 * - Reconhecimento de fala (Web Speech API)
 * - Cálculo de score com threshold de 80%
 * - Limite de 3 tentativas com opção de pular
 *
 * @example
 * <ListenRepeatQuestion
 *   sentences={["I watch movies.", "I listen to music."]}
 *   onComplete={(xp) => console.log(`Completed with ${xp} XP`)}
 *   xpReward={25}
 *   icon="🎧"
 *   stepLabel="Step 2"
 * />
 */
export function ListenRepeatQuestion({
  sentences,
  onComplete,
  xpReward = 25,
  icon = '🎧',
  stepLabel = 'Listen & Repeat',
  title = 'Listen & Repeat',
  instruction = 'Listen and repeat the sentences:',
  instructionPt = 'Escute e repita as frases:',
  listenButtonText = '🎧 ESCUTAR',
  speakButtonText = '🎤 FALAR',
  advanceButtonText = '✓ AVANÇAR →',
  skipButtonText = '⏭️ PULAR →',
  onBack,
}: ListenRepeatQuestionProps) {
  const [repeatIndex, setRepeatIndex] = useState(0)
  const [isListening, setIsListening] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [attemptCount, setAttemptCount] = useState(0)
  const [lastScore, setLastScore] = useState(0)
  const [passed, setPassed] = useState(false)
  const [listenCount, setListenCount] = useState(0)
  const recognitionRef = useRef<any>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const vadActiveRef = useRef(false)  // true once user has spoken at least once

  // Se não houver frase disponível, volta para a atividade anterior
  useEffect(() => {
    if (!sentences || sentences.length === 0 || !sentences[0]) {
      onBack?.()
    }
  }, [sentences, onBack])

  const LISTEN_REQUIRED = 3
  const speakUnlocked = listenCount >= LISTEN_REQUIRED

  // Função para calcular match entre frase esperada e frase dita
  const calculateScore = (spoken: string, expected: string): number => {
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z\s]/g, '').trim().split(/\s+/)
    const spokenWords = normalize(spoken)
    const expectedWords = normalize(expected)

    if (expectedWords.length === 0) return 0

    let matches = 0
    for (let i = 0; i < Math.min(spokenWords.length, expectedWords.length); i++) {
      if (spokenWords[i] === expectedWords[i]) {
        matches++
      }
    }

    return Math.round((matches / expectedWords.length) * 100)
  }

  // Função para sintetizar e reproduzir áudio da frase
  const handleListen = () => {
    if ('speechSynthesis' in window) {
      if (isListening) {
        window.speechSynthesis.cancel()
        setIsListening(false)
        return
      }

      const utterance = new SpeechSynthesisUtterance(sentences[repeatIndex])
      utterance.lang = 'en-US'
      utterance.rate = 0.6
      utterance.pitch = 1
      utterance.volume = 1

      utterance.onstart = () => setIsListening(true)
      utterance.onend = () => {
        setIsListening(false)
        setListenCount((c) => Math.min(c + 1, LISTEN_REQUIRED))
      }
      utterance.onerror = () => setIsListening(false)

      window.speechSynthesis.speak(utterance)
    } else {
      alert('Web Speech API não é suportada neste navegador')
    }
  }

  // Processa o texto reconhecido e calcula o score
  const processTranscript = (text: string) => {
    const score = calculateScore(text, sentences[repeatIndex])
    setLastScore(score)
    console.log(`Tentativa ${attemptCount + 1}: "${text}" - Score: ${score}%`)
    if (score >= 80) {
      setPassed(true)
    } else {
      new Audio('/audio/falou-errado.mp3').play().catch(() => {})
      setAttemptCount((c) => c + 1)
    }
  }

  // Converte Blob para base64 via FileReader — seguro para áudio grande (evita stack overflow do btoa+spread)
  function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve((reader.result as string).split(',')[1])
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  // Inicia gravação: getUserMedia → AudioContext → createMediaStreamSource → MediaRecorder
  async function startRecording() {
    try {
      // Pede permissão para usar o microfone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // Cria o contexto de áudio e conecta ao microfone (padrão do snippet de referência)
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 2048
      source.connect(analyser)
      analyserRef.current = analyser
      // analyser não conectado ao destination → sem echo

      // MediaRecorder captura o áudio real do stream
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')
          ? 'audio/ogg;codecs=opus'
          : MediaRecorder.isTypeSupported('audio/mp4')
            ? 'audio/mp4'
            : ''
      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      chunksRef.current = []
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.start()
      mediaRecorderRef.current = mr
      vadActiveRef.current = false
      silenceTimerRef.current = null
      setIsRecording(true)
      setPassed(false)

      // Detecção de silêncio: para automaticamente 1.5s após o usuário parar de falar
      const bufferLength = analyser.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)
      const SILENCE_THRESHOLD = 10   // RMS mínimo para considerar fala
      const SILENCE_DELAY = 1500     // ms de silêncio antes de parar

      function checkSilence() {
        if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') return
        analyser.getByteTimeDomainData(dataArray)
        // Calcula RMS (volume médio)
        let sum = 0
        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] - 128
          sum += v * v
        }
        const rms = Math.sqrt(sum / bufferLength)

        if (rms > SILENCE_THRESHOLD) {
          // Usuário está falando — cancela timer de silêncio
          vadActiveRef.current = true
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current)
            silenceTimerRef.current = null
          }
        } else if (vadActiveRef.current && !silenceTimerRef.current) {
          // Silêncio detectado após fala — agenda parada
          silenceTimerRef.current = setTimeout(() => {
            stopRecording()
          }, SILENCE_DELAY)
        }
        requestAnimationFrame(checkSilence)
      }
      requestAnimationFrame(checkSilence)
    } catch (err) {
      console.error(err)
      alert('Erro ao acessar microfone')
    }
  }

  // Para a gravação, envia o áudio para transcrição
  function stopRecording() {
    const mr = mediaRecorderRef.current
    if (!mr || mr.state === 'inactive') return
    if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null }
    mr.onstop = async () => {
      streamRef.current?.getTracks().forEach((t) => t.stop())
      const blob = new Blob(chunksRef.current, { type: mr.mimeType })
      const mimeBase = (mr.mimeType || 'audio/webm').split(';')[0]
      try {
        setIsTranscribing(true)
        const base64 = await blobToBase64(blob)
        const res = await fetch('/api/transcribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ audio: base64, mimeType: mimeBase }),
        })
        const text = await res.text()
        if (!text) throw new Error('Resposta vazia do servidor')
        const data = JSON.parse(text)
        if (!res.ok) throw new Error(data.error || 'Erro na transcrição')
        if (!data.transcript) throw new Error('Transcrição vazia')
        processTranscript(data.transcript)
      } catch (err: any) {
        new Audio('/audio/falou-errado.mp3').play().catch(() => {})
        setAttemptCount((c) => c + 1)
      } finally {
        setIsTranscribing(false)
      }
    }
    mr.stop()
    setIsRecording(false)
  }

  // Função para gravar a voz do usuário
  const handleSpeak = () => {
    if (isRecording) {
      stopRecording()
      return
    }
    startRecording()
  }

  // Função para resetar e ir para próxima sentença
  const handleAdvance = () => {
    new Audio('/audio/som-correto.mp3').play().catch(() => {})
    setAttemptCount(0)
    setLastScore(0)
    setPassed(false)
    setListenCount(0)
    if (repeatIndex < sentences.length - 1) {
      setRepeatIndex((p) => p + 1)
    } else {
      onComplete(xpReward)
    }
  }

  return (
    <div className="space-y-5" style={{ animation: 'fadeIn 0.5s ease-out' }}>

      {/* ── HEADER ── */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 text-center"
        style={{
          background: 'linear-gradient(135deg, rgba(0,20,80,0.9) 0%, rgba(0,102,255,0.15) 100%)',
          border: '1px solid rgba(0,212,255,0.3)',
          boxShadow: '0 0 30px rgba(0,102,255,0.15)',
        }}
      >
        {/* Glow ring */}
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{ boxShadow: 'inset 0 0 40px rgba(0,212,255,0.05)' }}
        />
        <p className="text-xs font-bold tracking-[0.3em] uppercase text-cyan-400/70 mb-1">
          {stepLabel}
        </p>
        <h2 className="text-2xl font-black tracking-wide" style={{ color: '#00D4FF', textShadow: '0 0 20px rgba(0,212,255,0.5)' }}>
          {icon} {title}
        </h2>
        <p className="text-sm text-blue-200/60 mt-1">{instruction}</p>
        <p className="text-xs text-blue-200/40 mt-0.5">{instructionPt}</p>
      </div>

      {/* ── PROGRESS BAR ── */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-bold tracking-widest">
          <span className="text-blue-300/60 uppercase">Progresso</span>
          <span style={{ color: '#00D4FF' }}>{repeatIndex + 1} / {sentences.length}</span>
        </div>
        <div className="relative w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
            style={{
              width: `${((repeatIndex + 1) / sentences.length) * 100}%`,
              background: 'linear-gradient(90deg, #0066FF, #00D4FF)',
              boxShadow: '0 0 8px rgba(0,212,255,0.6)',
            }}
          />
        </div>
      </div>

      {/* ── SENTENCE CARD ── */}
      <div
        className="relative rounded-2xl p-7 text-center"
        style={{
          background: 'linear-gradient(135deg, rgba(0,50,150,0.25) 0%, rgba(0,102,255,0.1) 100%)',
          border: '1px solid rgba(0,212,255,0.25)',
          boxShadow: '0 4px 30px rgba(0,102,255,0.1)',
        }}
      >
        <p
          className="text-xl font-bold leading-relaxed"
          style={{ color: '#E8F4FF', textShadow: '0 0 15px rgba(0,212,255,0.3)' }}
        >
          {sentences[repeatIndex]}
        </p>
      </div>

      {/* ── LISTEN LOCK COUNTER ── */}
      <div
        className="rounded-xl p-4"
        style={{
          background: speakUnlocked
            ? 'rgba(34,197,94,0.08)'
            : 'rgba(0,20,60,0.6)',
          border: `1px solid ${speakUnlocked ? 'rgba(34,197,94,0.3)' : 'rgba(0,212,255,0.15)'}`,
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <p className="text-xs font-bold tracking-widest uppercase" style={{ color: speakUnlocked ? '#22c55e' : '#00D4FF' }}>
              {speakUnlocked ? '🔓 Falar desbloqueado!' : '🔒 Escute antes de falar'}
            </p>
            {!speakUnlocked && (
              <p className="text-xs text-blue-200/40">Escute {LISTEN_REQUIRED}x para desbloquear o microfone</p>
            )}
          </div>
          {/* Dots counter */}
          <div className="flex gap-2 flex-shrink-0">
            {Array.from({ length: LISTEN_REQUIRED }).map((_, i) => (
              <div
                key={i}
                className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300"
                style={{
                  background: i < listenCount
                    ? 'linear-gradient(135deg, #0066FF, #00D4FF)'
                    : 'rgba(255,255,255,0.06)',
                  border: `2px solid ${i < listenCount ? '#00D4FF' : 'rgba(255,255,255,0.1)'}`,
                  boxShadow: i < listenCount ? '0 0 10px rgba(0,212,255,0.5)' : 'none',
                  transform: i < listenCount ? 'scale(1.1)' : 'scale(1)',
                }}
              >
                {i < listenCount ? '🎧' : <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '10px' }}>○</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CARREGANDO TRANSCRIÇÃO ── */}
      {isTranscribing && (
        <div
          className="rounded-xl p-5 flex items-center justify-center gap-3"
          style={{
            background: 'rgba(0,20,60,0.6)',
            border: '1px solid rgba(0,212,255,0.2)',
          }}
        >
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full"
                style={{
                  background: '#00D4FF',
                  animation: 'dotPulse 0.8s ease-in-out infinite',
                  animationDelay: `${i * 0.2}s`,
                }}
              />
            ))}
          </div>
          <span className="text-sm font-bold tracking-widest text-cyan-300/80">Analisando áudio...</span>
        </div>
      )}

      {/* ── SCORE FEEDBACK ── */}
      {lastScore > 0 && (
        <div
          className="rounded-xl p-4 text-center"
          style={{
            background: lastScore >= 80 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
            border: `1px solid ${lastScore >= 80 ? 'rgba(34,197,94,0.35)' : 'rgba(239,68,68,0.35)'}`,
          }}
        >
          <p className="font-bold text-base" style={{ color: lastScore >= 80 ? '#4ade80' : '#f87171' }}>
            {lastScore >= 80 ? '✅ Perfeito!' : `❌ Score: ${lastScore}% — mínimo 80%`}
          </p>
          {attemptCount > 0 && lastScore < 80 && (
            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Tentativa {attemptCount} de 3
            </p>
          )}
        </div>
      )}

      {/* ── BUTTONS ── */}
      <div className="space-y-3">
        {/* ESCUTAR + PULAR (lado a lado após 3 erros) */}
        <div className="flex gap-3">
          <button
            onClick={handleListen}
            className="relative flex-1 font-black tracking-widest px-8 py-4 rounded-xl text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] overflow-hidden"
            style={{
              background: isListening
                ? 'linear-gradient(135deg, #7c2d12, #dc2626)'
                : 'linear-gradient(135deg, #c2410c, #f97316)',
              boxShadow: isListening
                ? '0 0 20px rgba(220,38,38,0.4)'
                : '0 0 20px rgba(249,115,22,0.3)',
            }}
          >
            {isListening ? '⏸ PARANDO...' : `${listenButtonText} ${listenCount > 0 && !speakUnlocked ? `(${listenCount}/${LISTEN_REQUIRED})` : ''}`}
          </button>
          {attemptCount >= 3 && (
            <button
              onClick={handleAdvance}
              className="relative flex-1 font-black tracking-widest px-8 py-4 rounded-xl text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #c2410c, #f97316)',
                boxShadow: '0 0 20px rgba(249,115,22,0.3)',
              }}
            >
              ⏭️ PULAR
            </button>
          )}
        </div>

        {/* FALAR — só aparece após 3 escutas */}
        {speakUnlocked && (
          <button
            onClick={handleSpeak}
            className="relative flex items-center justify-center gap-3 w-full font-black tracking-widest px-8 py-4 rounded-xl text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: isRecording
                ? 'linear-gradient(135deg, #7f1d1d, #dc2626)'
                : 'linear-gradient(135deg, #15803d, #22c55e)',
              boxShadow: isRecording
                ? '0 0 20px rgba(220,38,38,0.4)'
                : '0 0 20px rgba(34,197,94,0.3)',
              animation: !isRecording ? 'pulseGreen 2s ease-in-out infinite' : 'none',
              border: attemptCount > 0 && lastScore < 80
                ? '2px solid rgba(248,113,113,0.7)'
                : 'none',
            }}
          >
            <span>{isRecording ? '⏹ PARANDO...' : speakButtonText}</span>
            {attemptCount > 0 && lastScore < 80 && (
              <span className="flex gap-1 ml-1">
                {Array.from({ length: Math.min(attemptCount, 3) }).map((_, i) => (
                  <span
                    key={i}
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black"
                    style={{ background: 'rgba(239,68,68,0.8)', color: 'white' }}
                  >
                    ✕
                  </span>
                ))}
              </span>
            )}
          </button>
        )}

        {/* AVANÇAR */}
        <button
          onClick={handleAdvance}
          disabled={!passed || isTranscribing}
          className="w-full font-black tracking-widest px-8 py-4 rounded-xl text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
          style={{
            background: passed
              ? 'linear-gradient(135deg, #1d4ed8, #0066FF)'
              : 'rgba(255,255,255,0.05)',
            border: passed ? 'none' : '1px solid rgba(255,255,255,0.08)',
            boxShadow: passed ? '0 0 25px rgba(0,102,255,0.4)' : 'none',
          }}
        >
          {advanceButtonText}
        </button>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes dotPulse {
          0%, 100% { opacity: 0.3; transform: scaleY(0.6); }
          50%       { opacity: 1;   transform: scaleY(1.2); }
        }
          0%, 100% { box-shadow: 0 0 20px rgba(34,197,94,0.3); }
          50%       { box-shadow: 0 0 35px rgba(34,197,94,0.6); }
        }
      `}</style>
    </div>
  )
}
