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

function getYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]{11})/)
  return match ? match[1] : null
}

export function DiscoverMission({ exercise, onComplete }: MissionProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasListened, setHasListened] = useState(false)
  const [hasWatched, setHasWatched] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  const isVideo = !!exercise.video
  const videoId = exercise.video ? getYouTubeId(exercise.video) : null

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

  if (isVideo && videoId) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-4">
          <h3 className="text-2xl font-bold text-white">Assista e Descubra</h3>
          <p className="text-white/70">Não se preocupe em entender tudo. Apenas descubra.</p>
        </div>

        <div className="flex justify-center">
          <div
            className="rounded-xl overflow-hidden"
            style={{
              border: '2px solid #0043BB',
              width: '100%',
              maxWidth: '560px',
              aspectRatio: '16/9',
            }}
          >
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`}
              title="Missão - Vídeo"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ border: 'none' }}
              onLoad={() => setHasWatched(true)}
            />
          </div>
        </div>

        {hasWatched && (
          <div className="flex justify-center gap-4 pt-2">
            <button
              onClick={() => onComplete(exercise.xp)}
              className="text-white font-bold tracking-wide px-6 py-3 rounded-lg transition-all hover:scale-105 active:scale-95"
              style={{ background: 'linear-gradient(135deg, #CC4A00, #FF6B35)', border: '2px solid #FF6B35', boxShadow: '0 0 15px rgba(255,107,53,0.3)', cursor: 'pointer' }}
            >
              Avançar →
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <h3 className="text-2xl font-bold text-white">Escute e Descubra</h3>
        <p className="text-white/70">Não se preocupe em entender tudo. Apenas descubra.</p>
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
  const [showTranslation, setShowTranslation] = useState(false)

  const handleSelect = (option: string) => {
    if (selected) return
    setSelected(option)
    setTimeout(() => onComplete(exercise.xp), 500)
  }

  const displayQuestion = showTranslation && exercise.questionPt ? exercise.questionPt : exercise.question

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-3">
          <h3
            className="text-2xl font-bold text-white transition-opacity duration-300"
            key={showTranslation ? 'pt' : 'en'}
            style={{ animation: 'fadeIn 0.3s ease' }}
          >
            {displayQuestion}
          </h3>
          {exercise.questionPt && (
            <button
              onClick={() => setShowTranslation(prev => !prev)}
              className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110"
              style={{
                backgroundColor: showTranslation ? 'rgba(255,107,53,0.3)' : 'rgba(255,255,255,0.15)',
                border: showTranslation ? '2px solid #FF6B35' : '2px solid rgba(255,255,255,0.3)',
                cursor: 'pointer',
              }}
              title={showTranslation ? 'Ver em inglês' : 'Traduzir para português'}
            >
              <span className="text-sm">?</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {exercise.options?.map((option) => {
          const isSelected = selected === option
          const isCorrect = !exercise.correctAnswer || option === exercise.correctAnswer
          return (
            <button
              key={option}
              onClick={() => handleSelect(option)}
              className="p-4 rounded-lg font-bold text-lg transition-all border-2 hover:scale-[1.02] hover:brightness-110"
              style={{
                backgroundColor: isSelected
                  ? isCorrect ? 'rgba(22,163,74,0.2)' : 'rgba(220,38,38,0.2)'
                  : 'rgba(255,255,255,0.08)',
                borderColor: isSelected
                  ? isCorrect ? '#22c55e' : '#ef4444'
                  : 'rgba(255,255,255,0.2)',
                color: isSelected
                  ? isCorrect ? '#86efac' : '#fca5a5'
                  : 'white',
                cursor: 'pointer',
                opacity: selected && !isSelected ? 0.4 : 1,
              }}
            >
              {option}
            </button>
          )
        })}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
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
        <h3 className="text-2xl font-bold text-white">Organize as Palavras</h3>
        <p className="text-white/70 mt-2">Clique nas palavras para montar a sentença correta.</p>
      </div>

      {/* Palavras disponíveis */}
      <div className="p-4 rounded-lg min-h-16 border-2 border-dashed" style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.2)' }}>
        <p className="text-xs font-semibold text-white/50 uppercase mb-3">Palavras disponíveis</p>
        <div className="flex flex-wrap gap-2 min-h-8">
          {available.map((word, idx) => (
            <button
              key={`avail-${idx}`}
              onClick={() => moveToArranged(word, idx)}
              className="px-4 py-2 rounded-lg font-semibold text-white transition-all hover:scale-105 border-2"
              style={{ background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.2)', cursor: 'pointer' }}
            >
              {word}
            </button>
          ))}
        </div>
      </div>

      {/* Área da sentença */}
      <div
        className="p-4 rounded-lg min-h-16 border-2 transition-all"
        style={{
          background: result === 'correct' ? 'rgba(22,163,74,0.15)' : result === 'wrong' ? 'rgba(220,38,38,0.15)' : 'rgba(0,67,187,0.15)',
          borderColor: result === 'correct' ? '#22c55e' : result === 'wrong' ? '#ef4444' : '#0043BB',
        }}
      >
        <p className="text-xs font-semibold uppercase mb-3" style={{ color: result === 'correct' ? '#86efac' : result === 'wrong' ? '#fca5a5' : '#93c5fd' }}>
          {result === 'correct' ? '✓ Correto!' : result === 'wrong' ? '✗ Tente novamente' : 'Sua sentença'}
        </p>
        <div className="flex flex-wrap gap-2 min-h-8">
          {arranged.length === 0 && (
            <p className="text-white/40 italic text-sm">Clique nas palavras acima para montar a frase...</p>
          )}
          {arranged.map((word, idx) => (
            <button
              key={`arr-${idx}`}
              onClick={() => moveToAvailable(word, idx)}
              className="px-4 py-2 text-white rounded-lg font-semibold transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #CC4A00, #FF6B35)', cursor: 'pointer' }}
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
          className="flex-1 font-semibold px-4 py-3 rounded-lg border-2 text-white/70 transition-all hover:bg-white/10"
          style={{ borderColor: 'rgba(255,255,255,0.2)', cursor: 'pointer' }}
        >
          Reiniciar
        </button>
        <button
          onClick={handleCheck}
          disabled={arranged.length === 0}
          className="text-white font-semibold px-6 py-3 rounded-lg transition-all disabled:opacity-40"
          style={{
            background: 'linear-gradient(135deg, #CC4A00, #FF6B35)',
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
        <h3 className="text-2xl font-bold text-white">Escute e Escolha</h3>
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
              className="p-4 rounded-lg font-semibold text-lg transition-all border-2 text-left"
              style={{
                backgroundColor: selected === option
                  ? option === exercise.correctAnswer ? 'rgba(22,163,74,0.2)' : 'rgba(220,38,38,0.2)'
                  : 'rgba(255,255,255,0.08)',
                borderColor: selected === option
                  ? option === exercise.correctAnswer ? '#22c55e' : '#ef4444'
                  : 'rgba(255,255,255,0.2)',
                color: selected === option
                  ? option === exercise.correctAnswer ? '#86efac' : '#fca5a5'
                  : 'white',
                cursor: 'pointer',
                opacity: selected && selected !== option ? 0.4 : 1,
              }}
            >
              {String.fromCharCode(65 + idx)}) {option}
            </button>
          ))}
        </div>
      )}

      {!hasListened && (
        <p className="text-center text-sm text-white/50">Escute o áudio para liberar as opções</p>
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
        <h3 className="text-2xl font-bold text-white">{exercise.question}</h3>
        <p className="text-sm text-white/50">{label}</p>
      </div>

      <div
        className="flex items-center border-2 rounded-lg overflow-hidden transition-colors"
        style={{
          borderColor: wrong ? '#ef4444' : 'rgba(255,255,255,0.2)',
          background: wrong ? 'rgba(220,38,38,0.1)' : 'rgba(255,255,255,0.05)',
        }}
      >
        {prefix && (
          <span className="px-4 py-4 font-semibold text-white/60 whitespace-nowrap select-none" style={{ background: 'rgba(255,255,255,0.05)', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
            {prefix}
          </span>
        )}
        <input
          type="text"
          value={answer}
          onChange={(e) => { setAnswer(e.target.value); setWrong(false) }}
          onKeyDown={(e) => e.key === 'Enter' && answer.trim() && handleSubmit()}
          placeholder="..."
          className="flex-1 px-4 py-4 font-semibold text-lg bg-transparent outline-none text-white placeholder-white/30"
          autoComplete="off"
        />
      </div>

      {wrong && (
        <p className="text-center text-sm text-red-400">Resposta incorreta — tente novamente!</p>
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
        <h3 className="text-2xl font-bold text-white">{exercise.question}</h3>
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
            className="w-20 p-4 border-2 rounded-lg font-bold text-lg text-center text-white outline-none"
            style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.2)' }}
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
        <h3 className="text-2xl font-bold text-white">{exercise.question}</h3>
        {hasExpected && (stage === 'idle' || stage === 'recording') && (
          <div className={`mt-4 p-4 border rounded-xl transition-all`}
            style={{
              background: stage === 'recording' ? 'rgba(0,67,187,0.3)' : 'rgba(0,67,187,0.15)',
              borderColor: stage === 'recording' ? '#0043BB' : 'rgba(0,67,187,0.3)',
            }}
          >
            <p className="text-xs font-bold text-blue-300 uppercase tracking-widest mb-2">Diga em inglês:</p>
            <p className="text-white font-semibold text-lg italic leading-relaxed">"{exercise.correctAnswer}"</p>
          </div>
        )}
      </div>

      {/* ─── IDLE ─── */}
      {stage === 'idle' && (
        <div className="flex flex-col items-center gap-4 py-4">
          {error && (
            <p className="text-red-400 text-sm text-center px-4">{error}</p>
          )}
          <button
            onClick={handleStartRecording}
            className="relative flex items-center justify-center w-28 h-28 rounded-full text-white text-5xl shadow-xl hover:scale-105 active:scale-95 transition-transform"
            style={{ backgroundColor: '#0043BB' }}
          >
            🎤
          </button>
          <p className="text-white/50 text-sm">Toque para começar a gravar</p>
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
          <div className="w-16 h-16 border-4 rounded-full animate-spin" style={{ borderColor: 'rgba(0,67,187,0.2)', borderTopColor: '#0043BB' }} />
          <p className="text-white font-semibold">Analisando sua fala...</p>
          <p className="text-white/40 text-sm">Processando sua fala...</p>
        </div>
      )}

      {/* ─── RESULT ─── */}
      {stage === 'result' && (
        <div className="space-y-6" style={{ animation: 'fadeInUp 0.4s ease forwards' }}>

          {/* Score Ring */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <svg width="144" height="144" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="72" cy="72" r={RADIUS} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="14" />
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
            <p className="text-lg font-bold mt-2 text-white">{scoreLabel}</p>
            {score < 50 && (
              <p className="text-sm text-white/50 mt-1">Precisa de ≥ 50% para continuar</p>
            )}
          </div>

          {/* Diff palavra por palavra */}
          {hasExpected && wordResults.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-white/40 uppercase tracking-widest text-center">
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
                <span className="flex items-center gap-1 text-xs text-green-400 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" /> Correto
                </span>
                <span className="flex items-center gap-1 text-xs text-red-400 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> Errado / faltando
                </span>
              </div>
            </div>
          )}

          {/* Transcrição bruta */}
          {transcript && (
            <div className="p-4 rounded-xl border" style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }}>
              <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1">Você disse:</p>
              <p className="text-white/80 italic">"{transcript}"</p>
            </div>
          )}

          {/* Frase esperada (reminder) */}
          {hasExpected && exercise.correctAnswer && (
            <div className="p-4 rounded-xl border" style={{ background: 'rgba(0,67,187,0.15)', borderColor: 'rgba(0,67,187,0.3)' }}>
              <p className="text-xs font-bold text-blue-300 uppercase tracking-widest mb-1">Esperado:</p>
              <p className="text-white italic">"{exercise.correctAnswer}"</p>
            </div>
          )}

          {/* Ações */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleRetry}
              className="flex-1 border-2 text-white/70 font-semibold px-4 py-3 rounded-xl transition-colors hover:bg-white/10"
              style={{ borderColor: 'rgba(255,255,255,0.2)' }}
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
