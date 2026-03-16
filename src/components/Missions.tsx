'use client'

import { useState, useRef, useEffect } from 'react'
import { Exercise } from '@/lib/lessons'
import { Button } from './ui/Button'

interface MissionProps {
  missionNumber: number
  totalMissions: number
  exercise: Exercise
  onComplete: (xp: number) => void
}

export function DiscoverMission({ exercise, onComplete }: MissionProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasListened, setHasListened] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  const handlePlay = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  const handleEnded = () => {
    setIsPlaying(false)
    setHasListened(true)
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <h3 className="text-2xl font-bold text-gray-900">Escute e Descubra</h3>
        <p className="text-gray-600">Não se preocupe em entender tudo. Apenas descubra.</p>
      </div>

      <audio ref={audioRef} src={exercise.audio} onEnded={handleEnded} />

      <div className="flex justify-center">
        <button
          onClick={handlePlay}
          disabled={isPlaying}
          className="text-white font-semibold px-8 py-4 rounded-lg text-lg transition-opacity"
          style={{
            backgroundColor: '#0043BB',
            cursor: isPlaying ? 'not-allowed' : 'pointer',
            opacity: isPlaying ? 0.8 : 1,
          }}
        >
          {isPlaying ? '🔊 Tocando...' : '▶ Play'}
        </button>
      </div>

      {hasListened && (
        <div className="flex justify-center gap-4 pt-2">
          <button
            onClick={handlePlay}
            disabled={isPlaying}
            className="font-semibold px-6 py-2 rounded-lg border-2 transition-opacity"
            style={{
              borderColor: '#0043BB',
              color: '#0043BB',
              backgroundColor: 'white',
              cursor: isPlaying ? 'not-allowed' : 'pointer',
              opacity: isPlaying ? 0.6 : 1,
            }}
          >
            🔁 Repetir
          </button>
          <button
            onClick={() => onComplete(exercise.xp)}
            className="text-white font-semibold px-6 py-2 rounded-lg transition-opacity"
            style={{ backgroundColor: '#CC4A00', cursor: 'pointer' }}
          >
            Avançar →
          </button>
        </div>
      )}
    </div>
  )
}

export function NameBuilderMission({ exercise, onComplete }: MissionProps) {
  const [selected, setSelected] = useState<string | null>(null)

  const handleSelect = (option: string) => {
    setSelected(option)
    if (option === exercise.correctAnswer) {
      setTimeout(() => onComplete(exercise.xp), 500)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold text-gray-900">{exercise.question}</h3>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {exercise.options?.map((option) => (
          <button
            key={option}
            onClick={() => handleSelect(option)}
            className={`p-4 rounded-lg font-semibold text-lg transition-all border-2 ${
              selected === option
                ? option === exercise.correctAnswer
                  ? 'bg-green-100 border-green-500 text-green-900'
                  : 'bg-red-100 border-red-500 text-red-900'
                : 'bg-gray-50 border-gray-300 text-gray-900 hover:border-blue-500'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  )
}

export function OrderSentenceMission({ exercise, onComplete }: MissionProps) {
  // Usa exercise.words (injetado pelo challenge page via DB) ou
  // faz fallback dividindo correctAnswer por espaço e embaralhando
  const sourceWords = exercise.words && exercise.words.length > 0
    ? exercise.words
    : (exercise.correctAnswer ?? '').split(' ')

  const shuffle = (arr: string[]) => [...arr].sort(() => Math.random() - 0.5)

  const [available, setAvailable] = useState<string[]>(() => shuffle(sourceWords))
  const [arranged, setArranged] = useState<string[]>([])
  const [result, setResult] = useState<'idle' | 'correct' | 'wrong'>('idle')

  const moveToArranged = (word: string, idx: number) => {
    setAvailable(prev => prev.filter((_, i) => i !== idx))
    setArranged(prev => [...prev, word])
    setResult('idle')
  }

  const moveToAvailable = (word: string, idx: number) => {
    setArranged(prev => prev.filter((_, i) => i !== idx))
    setAvailable(prev => [...prev, word])
    setResult('idle')
  }

  const handleCheck = () => {
    const answer = arranged.join(' ')
    if (answer === exercise.correctAnswer) {
      setResult('correct')
      setTimeout(() => onComplete(exercise.xp), 700)
    } else {
      setResult('wrong')
    }
  }

  const handleReset = () => {
    setAvailable(shuffle(sourceWords))
    setArranged([])
    setResult('idle')
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900">Organize as Palavras</h3>
        <p className="text-gray-600 mt-2">Clique nas palavras para montar a sentença correta.</p>
      </div>

      {/* Palavras disponíveis */}
      <div className="p-4 bg-gray-100 rounded-lg min-h-16 border-2 border-dashed border-gray-300">
        <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Palavras disponíveis</p>
        <div className="flex flex-wrap gap-2 min-h-8">
          {available.map((word, idx) => (
            <button
              key={`avail-${idx}`}
              onClick={() => moveToArranged(word, idx)}
              className="px-4 py-2 bg-white border-2 border-gray-300 rounded-lg font-semibold text-gray-900 hover:border-blue-500 hover:bg-blue-50 transition-all"
              style={{ cursor: 'pointer' }}
            >
              {word}
            </button>
          ))}
        </div>
      </div>

      {/* Área da sentença */}
      <div
        className={`p-4 rounded-lg min-h-16 border-2 transition-all ${
          result === 'correct'
            ? 'border-green-500 bg-green-50'
            : result === 'wrong'
            ? 'border-red-400 bg-red-50'
            : 'border-blue-300 bg-blue-50'
        }`}
      >
        <p className={`text-xs font-semibold uppercase mb-3 ${
          result === 'correct' ? 'text-green-600' : result === 'wrong' ? 'text-red-500' : 'text-blue-600'
        }`}>
          {result === 'correct' ? '✓ Correto!' : result === 'wrong' ? '✗ Tente novamente' : 'Sua sentença'}
        </p>
        <div className="flex flex-wrap gap-2 min-h-8">
          {arranged.length === 0 && (
            <p className="text-gray-400 italic text-sm">Clique nas palavras acima para montar a frase...</p>
          )}
          {arranged.map((word, idx) => (
            <button
              key={`arr-${idx}`}
              onClick={() => moveToAvailable(word, idx)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-all"
              style={{ cursor: 'pointer' }}
            >
              {word}
            </button>
          ))}
        </div>
      </div>

      {/* Ações */}
      <div className="flex gap-3">
        <button
          onClick={handleReset}
          className="flex-1 font-semibold px-4 py-3 rounded-lg border-2 border-gray-300 text-gray-600 hover:bg-gray-50 transition-all"
          style={{ cursor: 'pointer' }}
        >
          Reiniciar
        </button>
        <button
          onClick={handleCheck}
          disabled={arranged.length === 0}
          className="flex-2 text-white font-semibold px-6 py-3 rounded-lg transition-all disabled:opacity-40"
          style={{
            backgroundColor: '#CC4A00',
            cursor: arranged.length === 0 ? 'not-allowed' : 'pointer',
            flex: 2,
          }}
        >
          Verificar
        </button>
      </div>
    </div>
  )
}

export function ListenSelectMission({ exercise, onComplete }: MissionProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasListened, setHasListened] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  const handlePlay = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  const handleSelect = (option: string) => {
    setSelected(option)
    if (option === exercise.correctAnswer) {
      setTimeout(() => onComplete(exercise.xp), 500)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <h3 className="text-2xl font-bold text-gray-900">Escute e Escolha</h3>
      </div>

      <audio ref={audioRef} src={exercise.audio} onEnded={() => { setIsPlaying(false); setHasListened(true) }} />

      <div className="flex justify-center">
        <button
          onClick={handlePlay}
          disabled={isPlaying}
          className="text-white font-semibold px-8 py-4 rounded-lg text-lg transition-opacity"
          style={{
            backgroundColor: '#0043BB',
            cursor: isPlaying ? 'not-allowed' : 'pointer',
            opacity: isPlaying ? 0.8 : 1,
          }}
        >
          {isPlaying ? '🔊 Tocando...' : '▶ Play'}
        </button>
      </div>

      {hasListened && (
        <div className="grid grid-cols-1 gap-3">
          {exercise.options?.map((option, idx) => (
            <button
              key={idx}
              onClick={() => handleSelect(option)}
              className={`p-4 rounded-lg font-semibold text-lg transition-all border-2 text-left ${
                selected === option
                  ? option === exercise.correctAnswer
                    ? 'bg-green-100 border-green-500 text-green-900'
                    : 'bg-red-100 border-red-500 text-red-900'
                  : 'bg-gray-50 border-gray-300 text-gray-900 hover:border-blue-500'
              }`}
              style={{ cursor: 'pointer' }}
            >
              {String.fromCharCode(65 + idx)}) {option}
            </button>
          ))}
        </div>
      )}

      {!hasListened && (
        <p className="text-center text-sm text-gray-500">Escute o áudio para liberar as opções</p>
      )}
    </div>
  )
}

// Componente compartilhado para missões de fill-in-the-blank
// O placeholder tem formato "I live in _____"; extraímos o prefixo para mostrar como texto fixo
// e o usuário digita apenas o blank, que é comparado com correctAnswer.
function FillBlankMission({ exercise, onComplete, label }: MissionProps & { label: string }) {
  const raw = exercise.placeholder ?? ''
  const blankIdx = raw.indexOf('_')
  const prefix = blankIdx > 0 ? raw.slice(0, blankIdx) : ''

  const [answer, setAnswer] = useState('')
  const [wrong, setWrong] = useState(false)

  const handleSubmit = () => {
    const trimmed = answer.trim().toLowerCase()
    const expected = (exercise.correctAnswer ?? '').trim().toLowerCase()
    if (trimmed === expected) {
      onComplete(exercise.xp)
    } else {
      setWrong(true)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold text-gray-900">{exercise.question}</h3>
        <p className="text-sm text-gray-500">{label}</p>
      </div>

      <div
        className={`flex items-center border-2 rounded-lg overflow-hidden transition-colors ${
          wrong ? 'border-red-400 bg-red-50' : 'border-gray-300 focus-within:border-blue-500'
        }`}
      >
        {prefix && (
          <span className="px-4 py-4 font-semibold text-gray-500 bg-gray-100 border-r border-gray-200 whitespace-nowrap select-none">
            {prefix}
          </span>
        )}
        <input
          type="text"
          value={answer}
          onChange={(e) => { setAnswer(e.target.value); setWrong(false) }}
          onKeyDown={(e) => e.key === 'Enter' && answer.trim() && handleSubmit()}
          placeholder="..."
          className="flex-1 px-4 py-4 font-semibold text-lg bg-transparent outline-none"
          autoComplete="off"
        />
      </div>

      {wrong && (
        <p className="text-center text-sm text-red-500">Resposta incorreta — tente novamente!</p>
      )}

      <Button
        onClick={handleSubmit}
        disabled={!answer.trim()}
        className="w-full text-white font-semibold px-6 py-3 rounded-lg disabled:opacity-50"
        style={{ backgroundColor: '#CC4A00' }}
      >
        Enviar
      </Button>
    </div>
  )
}

export function AddressMission(props: MissionProps) {
  return <FillBlankMission {...props} label="Complete a frase com sua cidade/país" />
}

export function PhoneNumberMission({ exercise, onComplete }: MissionProps) {
  const [phone, setPhone] = useState(['', '', ''])

  const handleChange = (idx: number, value: string) => {
    const newPhone = [...phone]
    newPhone[idx] = value
    setPhone(newPhone)
  }

  const handleSubmit = () => {
    const formatted = phone.join('-')
    if (formatted === exercise.correctAnswer) {
      onComplete(exercise.xp)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold text-gray-900">{exercise.question}</h3>
      </div>

      <div className="flex gap-2 justify-center">
        {phone.map((part, idx) => (
          <input
            key={idx}
            type="text"
            pattern="\d*"
            maxLength={idx === 0 ? 3 : idx === 1 ? 3 : 4}
            value={part}
            onChange={(e) => handleChange(idx, e.target.value)}
            className="w-20 p-4 border-2 border-gray-300 rounded-lg font-bold text-lg text-center focus:border-blue-500 focus:outline-none"
            placeholder={idx === 0 ? 'XXX' : idx === 1 ? 'XXX' : 'XXXX'}
          />
        ))}
      </div>

      <Button
        onClick={handleSubmit}
        disabled={phone.some(p => !p)}
        className="w-full text-white font-semibold px-6 py-3 rounded-lg disabled:opacity-50"
        style={{ backgroundColor: '#CC4A00' }}
      >
        Verificar
      </Button>
    </div>
  )
}

export function OriginMission(props: MissionProps) {
  return <FillBlankMission {...props} label="Complete a frase com sua origem" />
}

export function ProfessionMission(props: MissionProps) {
  return <FillBlankMission {...props} label="Complete a frase com sua profissão" />
}

export function SpeakModeMission({ exercise, onComplete }: MissionProps) {
  type Stage = 'idle' | 'recording' | 'processing' | 'result'

  const [stage, setStage] = useState<Stage>('idle')
  const [transcript, setTranscript] = useState('')
  const [score, setScore] = useState(0)
  const [displayScore, setDisplayScore] = useState(0)
  const [wordResults, setWordResults] = useState<{ word: string; correct: boolean }[]>([])
  const [error, setError] = useState('')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)
  const resultReceivedRef = useRef(false)
  const transcriptPartsRef = useRef<string[]>([])
  const circleRef = useRef<SVGCircleElement | null>(null)

  const hasExpected = !!exercise.correctAnswer
  const RADIUS = 52
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS

  const scoreColor = score >= 75 ? '#22c55e' : score >= 50 ? '#eab308' : '#ef4444'
  const scoreLabel =
    score >= 75 ? '🏆 Excelente!' :
    score >= 50 ? '💪 Bom esforço!' :
    '🔁 Tente novamente'
  const canContinue = !hasExpected || score >= 50

  // Anima o contador e o anel SVG quando o resultado aparece
  useEffect(() => {
    if (stage !== 'result') return
    const end = score
    const duration = 1300
    const startTime = performance.now()

    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
      setDisplayScore(Math.round(eased * end))

      if (circleRef.current) {
        circleRef.current.style.strokeDashoffset = String(
          CIRCUMFERENCE - eased * (end / 100) * CIRCUMFERENCE
        )
      }

      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [stage, score, CIRCUMFERENCE])

  // Algoritmo LCS para diff palavra a palavra
  const computeWordDiff = (expected: string[], actual: string[]) => {
    const n = expected.length
    const m = actual.length
    const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0))
    for (let i = 1; i <= n; i++)
      for (let j = 1; j <= m; j++)
        dp[i][j] = expected[i - 1] === actual[j - 1]
          ? dp[i - 1][j - 1] + 1
          : Math.max(dp[i - 1][j], dp[i][j - 1])

    const matched = new Set<number>()
    let i = n, j = m
    while (i > 0 && j > 0) {
      if (expected[i - 1] === actual[j - 1]) { matched.add(i - 1); i--; j-- }
      else if (dp[i - 1][j] > dp[i][j - 1]) i--
      else j--
    }
    return expected.map((word, idx) => ({ word, correct: matched.has(idx) }))
  }

  const processTranscript = (text: string) => {
    setTranscript(text)
    if (hasExpected) {
      const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s']/g, '').trim()
      const exp = norm(exercise.correctAnswer!).split(/\s+/)
      const act = norm(text).split(/\s+/)
      const results = computeWordDiff(exp, act)
      setWordResults(results)
      setScore(Math.round((results.filter(r => r.correct).length / exp.length) * 100))
    } else {
      setScore(100)
    }
    setStage('result')
  }

  const handleStartRecording = () => {
    setError('')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognitionAPI) {
      setError('Seu navegador não suporta reconhecimento de voz. Use Chrome ou Edge.')
      return
    }
    resultReceivedRef.current = false
    transcriptPartsRef.current = []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rec = new SpeechRecognitionAPI() as any
    rec.lang = 'en-US'
    rec.interimResults = false
    rec.continuous = true
    rec.maxAlternatives = 1
    rec.onresult = (event: any) => {
      resultReceivedRef.current = true
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          transcriptPartsRef.current.push(event.results[i][0].transcript)
        }
      }
    }
    rec.onerror = (event: any) => {
      if (event.error === 'no-speech') {
        setError('Nenhuma fala detectada. Tente novamente.')
      } else if (event.error === 'not-allowed') {
        setError('Permissão de microfone negada. Verifique as configurações do browser.')
      } else {
        setError(`Erro de reconhecimento: ${event.error}`)
      }
      setStage('idle')
    }
    rec.onend = () => {
      if (!resultReceivedRef.current || transcriptPartsRef.current.length === 0) {
        setError('Nenhuma fala detectada. Tente novamente.')
        setStage('idle')
      } else {
        const text = transcriptPartsRef.current.join(' ')
        setStage('processing')
        setTimeout(() => processTranscript(text), 300)
      }
    }
    recognitionRef.current = rec
    rec.start()
    setStage('recording')
  }

  const handleStopRecording = () => {
    if (recognitionRef.current && stage === 'recording') {
      recognitionRef.current.stop()
      // result will arrive via onresult; onend handles the no-speech case
    }
  }

  const handleRetry = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.abort() } catch { /* ignore */ }
      recognitionRef.current = null
    }
    setStage('idle')
    setTranscript('')
    setWordResults([])
    setDisplayScore(0)
    setScore(0)
    setError('')
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold text-gray-900">{exercise.question}</h3>
        {hasExpected && (stage === 'idle' || stage === 'recording') && (
          <div className={`mt-4 p-4 border rounded-xl transition-all ${
            stage === 'recording'
              ? 'bg-blue-100 border-blue-400 shadow-md'
              : 'bg-blue-50 border-blue-200'
          }`}>
            <p className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-2">Diga em inglês:</p>
            <p className="text-blue-900 font-semibold text-lg italic leading-relaxed">"{exercise.correctAnswer}"</p>
          </div>
        )}
      </div>

      {/* ─── IDLE ─── */}
      {stage === 'idle' && (
        <div className="flex flex-col items-center gap-4 py-4">
          {error && (
            <p className="text-red-500 text-sm text-center px-4">{error}</p>
          )}
          <button
            onClick={handleStartRecording}
            className="relative flex items-center justify-center w-28 h-28 rounded-full text-white text-5xl shadow-xl hover:scale-105 active:scale-95 transition-transform"
            style={{ backgroundColor: '#0043BB' }}
          >
            🎤
          </button>
          <p className="text-gray-500 text-sm">Toque para começar a gravar</p>
        </div>
      )}

      {/* ─── RECORDING ─── */}
      {stage === 'recording' && (
        <div className="flex flex-col items-center gap-5 py-4">
          <div className="relative flex items-center justify-center">
            <div className="absolute w-36 h-36 rounded-full bg-red-400 opacity-20"
              style={{ animation: 'ping 1.2s cubic-bezier(0,0,0.2,1) infinite' }} />
            <div className="absolute w-28 h-28 rounded-full bg-red-400 opacity-25"
              style={{ animation: 'ping 1.2s cubic-bezier(0,0,0.2,1) infinite', animationDelay: '0.4s' }} />
            <button
              onClick={handleStopRecording}
              className="relative z-10 w-20 h-20 rounded-full bg-red-600 text-white text-3xl shadow-2xl hover:bg-red-700 active:scale-95 transition-all"
            >
              ⏹
            </button>
          </div>

          {/* Waveform fake */}
          <div className="flex items-end gap-1 h-10">
            {[0.4, 0.7, 1, 0.8, 0.5, 0.9, 0.6, 1, 0.7, 0.4].map((h, i) => (
              <div
                key={i}
                className="w-2 bg-red-500 rounded-full origin-bottom"
                style={{
                  height: `${h * 100}%`,
                  animation: `barBounce 0.6s ease-in-out infinite`,
                  animationDelay: `${i * 70}ms`,
                }}
              />
            ))}
          </div>

          <p className="text-red-600 font-semibold text-sm animate-pulse">
            Gravando... toque ⏹ para parar
          </p>
        </div>
      )}

      {/* ─── PROCESSING ─── */}
      {stage === 'processing' && (
        <div className="flex flex-col items-center gap-4 py-10">
          <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-gray-600 font-semibold">Analisando sua fala...</p>
          <p className="text-gray-400 text-sm">Processando sua fala...</p>
        </div>
      )}

      {/* ─── RESULT ─── */}
      {stage === 'result' && (
        <div className="space-y-6" style={{ animation: 'fadeInUp 0.4s ease forwards' }}>

          {/* Score Ring */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <svg width="144" height="144" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="72" cy="72" r={RADIUS} fill="none" stroke="#e5e7eb" strokeWidth="14" />
                <circle
                  ref={circleRef}
                  cx="72" cy="72" r={RADIUS}
                  fill="none"
                  stroke={scoreColor}
                  strokeWidth="14"
                  strokeLinecap="round"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={CIRCUMFERENCE}
                  style={{ transition: 'none' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black leading-none" style={{ color: scoreColor }}>
                  {displayScore}%
                </span>
              </div>
            </div>
            <p className="text-lg font-bold mt-2 text-gray-800">{scoreLabel}</p>
            {score < 50 && (
              <p className="text-sm text-gray-500 mt-1">Precisa de ≥ 50% para continuar</p>
            )}
          </div>

          {/* Diff palavra por palavra */}
          {hasExpected && wordResults.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest text-center">
                Palavra por palavra
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {wordResults.map((r, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 rounded-full text-sm font-bold text-white select-none"
                    style={{
                      backgroundColor: r.correct ? '#16a34a' : '#dc2626',
                      opacity: 0,
                      animation: `popIn 0.35s ease forwards`,
                      animationDelay: `${i * 70}ms`,
                    }}
                  >
                    {r.correct ? '✓' : '✗'} {r.word}
                  </span>
                ))}
              </div>
              <div className="flex gap-4 justify-center mt-1">
                <span className="flex items-center gap-1 text-xs text-green-700 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-600 inline-block" /> Correto
                </span>
                <span className="flex items-center gap-1 text-xs text-red-700 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block" /> Errado / faltando
                </span>
              </div>
            </div>
          )}

          {/* Transcrição bruta */}
          {transcript && (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Você disse:</p>
              <p className="text-gray-700 italic">"{transcript}"</p>
            </div>
          )}

          {/* Frase esperada (reminder) */}
          {hasExpected && exercise.correctAnswer && (
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
              <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1">Esperado:</p>
              <p className="text-blue-800 italic">"{exercise.correctAnswer}"</p>
            </div>
          )}

          {/* Ações */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleRetry}
              className="flex-1 border-2 border-gray-300 text-gray-700 font-semibold px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors"
            >
              🔁 Tentar Novamente
            </button>
            {canContinue && (
              <button
                onClick={() => onComplete(exercise.xp)}
                className="flex-1 text-white font-bold px-4 py-3 rounded-xl transition-all hover:opacity-90 active:scale-95"
                style={{ backgroundColor: '#CC4A00' }}
              >
                Continuar →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
