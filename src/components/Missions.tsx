'use client'

import { useState, useRef, useEffect } from 'react'
import type { JourneyMission } from '@/lib/journey'
import { EagleTip } from '@/src/components/EagleTip'
import { getSpeechRecognition } from '@/src/lib/speechRecognition'

interface MissionProps {
  mission: JourneyMission
  onComplete: (xp: number) => void
  onError?: () => void
}

/* ─── helpers ─── */

function getYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]{11})/)
  return match ? match[1] : null
}

/* ═══════════════════════════════════════════════════
   1. ResourceMission  –  video or audio
   ═══════════════════════════════════════════════════ */

export function ResourceMission({ mission, onComplete }: MissionProps) {
  return (
    <>
      <EagleTip
        storageKey="eagle_tutorial_resource"
        lines={[
          '🎬 Missão: Descoberta!',
          'Assista ou ouça o conteúdo antes de avançar.',
          'Não precisa entender tudo — só mergulhe!',
        ]}
        buttonLabel="ENTENDIDO!"
      />
      <ResourceMissionInner mission={mission} onComplete={onComplete} />
    </>
  )
}

function ResourceMissionInner({ mission, onComplete }: MissionProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasListened, setHasListened] = useState(false)
  const [hasWatched, setHasWatched] = useState(false)
  const [showResourceTip, setShowResourceTip] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  const isVideo = mission.resourceType === 'video'
  const videoId = mission.resourceUrl ? getYouTubeId(mission.resourceUrl) : null

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

  const handleAdvance = () => {
    // Mostrar dica na primeira vez que completa um recurso
    if (!localStorage.getItem('eagle_resource_completed')) {
      setShowResourceTip(true)
      localStorage.setItem('eagle_resource_completed', '1')
      return // Não avança ainda, espera o usuário fechar a dica
    }
    onComplete(mission.xp)
  }

  if (isVideo && videoId) {
    return (
      <div className="space-y-6">
        <EagleTip
          storageKey="eagle_resource_completed"
          show={showResourceTip}
          onDismiss={() => {
            setShowResourceTip(false)
            onComplete(mission.xp)
          }}
          lines={[
            '🎬 Recurso completado!',
            'Parabéns! Este material agora está desbloqueado em RECURSOS.',
            'Você pode rever a qualquer momento.',
          ]}
          buttonLabel="CONTINUAR"
        />
        <div className="text-center space-y-4">
          <h3 className="text-2xl font-bold text-white">Assista e Descubra</h3>
          <p className="text-white/70">Não se preocupe em entender tudo. Apenas descubra.</p>
        </div>
        <div className="flex justify-center">
          <div className="rounded-xl overflow-hidden" style={{ border: '2px solid #0043BB', width: '100%', maxWidth: '560px', aspectRatio: '16/9' }}>
            <iframe
              width="100%" height="100%"
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
              onClick={handleAdvance}
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

  // Audio resource
  return (
    <div className="space-y-6">
      <EagleTip
        storageKey="eagle_resource_completed"
        show={showResourceTip}
        onDismiss={() => {
          setShowResourceTip(false)
          onComplete(mission.xp)
        }}
        lines={[
          '🎬 Recurso completado!',
          'Parabéns! Este material agora está desbloqueado em RECURSOS.',
          'Você pode rever a qualquer momento.',
        ]}
        buttonLabel="CONTINUAR"
      />
      <div className="text-center space-y-4">
        <h3 className="text-2xl font-bold text-white">Escute e Descubra</h3>
        <p className="text-white/70">Não se preocupe em entender tudo. Apenas descubra.</p>
      </div>
      <audio ref={audioRef} src={mission.resourceUrl} onEnded={handleEnded} />
      <div className="flex justify-center">
        <button
          onClick={handlePlay}
          disabled={isPlaying}
          className="text-white font-semibold px-8 py-4 rounded-lg text-lg transition-opacity"
          style={{ backgroundColor: '#0043BB', cursor: isPlaying ? 'not-allowed' : 'pointer', opacity: isPlaying ? 0.8 : 1 }}
        >
          {isPlaying ? '🔊 Tocando...' : '▶ Play'}
        </button>
      </div>
      {hasListened && (
        <div className="flex justify-center gap-4 pt-2">
          <button onClick={handlePlay} disabled={isPlaying} className="font-semibold px-6 py-2 rounded-lg border-2 transition-opacity" style={{ borderColor: '#0043BB', color: '#0043BB', backgroundColor: 'white', cursor: isPlaying ? 'not-allowed' : 'pointer', opacity: isPlaying ? 0.6 : 1 }}>
            🔁 Repetir
          </button>
          <button onClick={handleAdvance} className="text-white font-semibold px-6 py-2 rounded-lg transition-opacity" style={{ backgroundColor: '#CC4A00', cursor: 'pointer' }}>
            Avançar →
          </button>
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   2. DifficultyMission  –  fixed difficulty poll
   ═══════════════════════════════════════════════════ */

export function DifficultyMission({ mission, onComplete }: MissionProps) {
  return (
    <>
      <EagleTip
        storageKey="eagle_tutorial_difficulty"
        lines={[
          '💭 Missão: Dificuldade!',
          'Conte pra mim o quanto isso foi difícil pra você.',
          'Não tem resposta errada — é só pra eu te conhecer melhor!',
        ]}
        buttonLabel="ENTENDIDO!"
      />
      <DifficultyMissionInner mission={mission} onComplete={onComplete} />
    </>
  )
}

function DifficultyMissionInner({ mission, onComplete }: MissionProps) {
  const [selected, setSelected] = useState<string | null>(null)

  const handleSelect = (option: string) => {
    if (selected) return
    setSelected(option)
    setTimeout(() => onComplete(mission.xp), 500)
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold text-white">{mission.question}</h3>
      </div>
      <div className="grid grid-cols-1 gap-3">
        {mission.options?.map((option) => {
          const isSelected = selected === option
          return (
            <button
              key={option}
              onClick={() => handleSelect(option)}
              className="p-4 rounded-lg font-bold text-lg transition-all border-2 hover:scale-[1.02] hover:brightness-110"
              style={{
                backgroundColor: isSelected ? 'rgba(0,67,187,0.3)' : 'rgba(255,255,255,0.08)',
                borderColor: isSelected ? '#0043BB' : 'rgba(255,255,255,0.2)',
                color: isSelected ? '#93c5fd' : 'white',
                cursor: 'pointer',
                opacity: selected && !isSelected ? 0.4 : 1,
              }}
            >
              {option}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   3. QuestionMission  –  multiple choice + translation toggle
   ═══════════════════════════════════════════════════ */

export function QuestionMission({ mission, onComplete, onError }: MissionProps) {
  return (
    <>
      <EagleTip
        storageKey="eagle_tutorial_question"
        lines={[
          '❓ Missão: Múltipla Escolha!',
          'Leia a pergunta e escolha a resposta correta.',
          'Se errar, te mostro a resposta certa. Sem drama!',
        ]}
        buttonLabel="ENTENDIDO!"
      />
      <QuestionMissionInner mission={mission} onComplete={onComplete} onError={onError} />
    </>
  )
}

function QuestionMissionInner({ mission, onComplete, onError }: MissionProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const [showTranslation, setShowTranslation] = useState(false)

  const isWrong = selected !== null && mission.correctAnswer ? selected !== mission.correctAnswer : false

  const handleSelect = (option: string) => {
    if (selected) return
    setSelected(option)
    if (!mission.correctAnswer || option === mission.correctAnswer) {
      setTimeout(() => onComplete(mission.xp), 500)
    } else {
      onError?.()
    }
  }

  const displayQuestion = showTranslation && mission.questionPt ? mission.questionPt : mission.question

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-3">
          <h3 className="text-2xl font-bold text-white transition-opacity duration-300" key={showTranslation ? 'pt' : 'en'} style={{ animation: 'fadeIn 0.3s ease' }}>
            {displayQuestion}
          </h3>
          {mission.questionPt && (
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
        {mission.options?.map((option) => {
          const isSelected = selected === option
          const isCorrect = !mission.correctAnswer || option === mission.correctAnswer
          const highlightCorrect = isWrong && isCorrect
          const showGreen = highlightCorrect || (isSelected && !isWrong)
          return (
            <button
              key={option}
              onClick={() => handleSelect(option)}
              className="p-4 rounded-lg font-bold text-lg transition-all border-2 hover:scale-[1.02] hover:brightness-110"
              style={{
                backgroundColor: showGreen ? 'rgba(22,163,74,0.25)' : isSelected ? 'rgba(220,38,38,0.2)' : 'rgba(255,255,255,0.08)',
                borderColor: showGreen ? '#22c55e' : isSelected ? '#ef4444' : 'rgba(255,255,255,0.2)',
                color: showGreen ? '#86efac' : isSelected ? '#fca5a5' : 'white',
                cursor: 'pointer',
                opacity: selected && !isSelected && !showGreen ? 0.3 : 1,
              }}
            >
              {option}{showGreen ? ' ✓' : ''}
            </button>
          )
        })}      </div>
      {isWrong && (
        <div className="space-y-2 pt-1">
          <p className="text-center text-xs text-red-400/80 tracking-wide">Resposta correta destacada em verde</p>
          <div className="flex justify-center">
            <button
              onClick={() => onComplete(0)}
              className="font-bold tracking-wide px-6 py-2.5 rounded-lg text-white transition-all hover:scale-105 active:scale-95"
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)' }}
            >
              Continuar
            </button>
          </div>
        </div>
      )}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   4. CompleteMission  –  fill-in-the-blank with options
   ═══════════════════════════════════════════════════ */

export function CompleteMission({ mission, onComplete, onError }: MissionProps) {
  return (
    <>
      <EagleTip
        storageKey="eagle_tutorial_complete"
        lines={[
          '✏️ Missão: Complete a Frase!',
          'Escolha a palavra que melhor completa a sentença.',
          'Preste atenção no contexto — ele é a chave!',
        ]}
        buttonLabel="ENTENDIDO!"
      />
      <CompleteMissionInner mission={mission} onComplete={onComplete} onError={onError} />
    </>
  )
}

function CompleteMissionInner({ mission, onComplete, onError }: MissionProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const [showTranslation, setShowTranslation] = useState(false)

  const isWrong = selected !== null && mission.correctAnswer ? selected !== mission.correctAnswer : false

  const handleSelect = (option: string) => {
    if (selected) return
    setSelected(option)
    if (!mission.correctAnswer || option === mission.correctAnswer) {
      setTimeout(() => onComplete(mission.xp), 500)
    } else {
      onError?.()
    }
  }

  const rawQuestion = showTranslation && mission.questionPt ? mission.questionPt : (mission.question ?? '')

  // Split on ___ to render blank as styled underline
  const parts = rawQuestion.split('___')
  const filledWord = selected ?? '___'
  const isCorrect = !mission.correctAnswer || selected === mission.correctAnswer

  function renderSentence() {
    if (parts.length < 2) {
      // No ___ marker — show question + separate answer zone below
      return (
        <div className="space-y-4 w-full">
          <span className="text-2xl font-bold text-white">{rawQuestion}</span>
        </div>
      )
    }
    return (
      <span className="text-2xl font-bold text-white leading-relaxed">
        {parts[0]}
        <span
          className="inline-block min-w-[80px] text-center font-black px-2 mx-1 rounded"
          style={{
            color: selected
              ? isCorrect ? '#86efac' : '#fca5a5'
              : 'rgba(0,212,255,0.9)',
            background: selected
              ? isCorrect ? 'rgba(22,163,74,0.15)' : 'rgba(220,38,38,0.15)'
              : 'rgba(0,212,255,0.08)',
          }}
        >
          {filledWord}
        </span>
        {parts[1]}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <p className="text-xs font-black tracking-widest" style={{ color: 'rgba(0,212,255,0.6)' }}>
          COMPLETE A FRASE
        </p>
        <div className="flex items-center justify-center gap-3">
          {renderSentence()}
          {mission.questionPt && (
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
        {mission.options?.map((option) => {
          const isSelected = selected === option
          const optCorrect = !mission.correctAnswer || option === mission.correctAnswer
          const highlightCorrect = isWrong && optCorrect
          const showGreen = highlightCorrect || (isSelected && !isWrong)
          return (
            <button
              key={option}
              onClick={() => handleSelect(option)}
              className="p-4 rounded-lg font-bold text-lg transition-all border-2 hover:scale-[1.02] hover:brightness-110"
              style={{
                backgroundColor: showGreen ? 'rgba(22,163,74,0.25)' : isSelected ? 'rgba(220,38,38,0.2)' : 'rgba(255,255,255,0.08)',
                borderColor: showGreen ? '#22c55e' : isSelected ? '#ef4444' : 'rgba(255,255,255,0.2)',
                color: showGreen ? '#86efac' : isSelected ? '#fca5a5' : 'white',
                cursor: 'pointer',
                opacity: selected && !isSelected && !showGreen ? 0.3 : 1,
              }}
            >
              {option}{showGreen ? ' ✓' : ''}
            </button>
          )
        })}
      </div>
      {isWrong && (
        <div className="flex justify-center pt-2">
          <button
            onClick={() => onComplete(0)}
            className="font-bold tracking-wide px-6 py-2.5 rounded-lg text-white transition-all hover:scale-105 active:scale-95"
            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)' }}
          >
            Continuar
          </button>
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   5. OrderMission  –  arrange words into correct sentence
   ═══════════════════════════════════════════════════ */

export function OrderMission({ mission, onComplete, onError }: MissionProps) {
  return (
    <>
      <EagleTip
        storageKey="eagle_tutorial_order"
        lines={[
          '🔀 Missão: Ordene as Palavras!',
          'Clique nas palavras para montar a frase na ordem correta.',
          'Clique numa palavra já colocada para devolvê-la.',
        ]}
        buttonLabel="ENTENDIDO!"
      />
      <OrderMissionInner mission={mission} onComplete={onComplete} onError={onError} />
    </>
  )
}

function OrderMissionInner({ mission, onComplete, onError }: MissionProps) {
  const sourceWords = (mission.correctAnswer ?? '').split(' ')
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
    if (arranged.join(' ') === mission.correctAnswer) {
      setResult('correct')
      setTimeout(() => onComplete(mission.xp), 700)
    } else {
      setResult('wrong')
      onError?.()
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

      <div className="p-4 rounded-lg min-h-16 border-2 border-dashed" style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.2)' }}>
        <p className="text-xs font-semibold text-white/50 uppercase mb-3">Palavras disponíveis</p>
        <div className="flex flex-wrap gap-2 min-h-8">
          {available.map((word, idx) => (
            <button key={`avail-${idx}`} onClick={() => moveToArranged(word, idx)} className="px-4 py-2 rounded-lg font-semibold text-white transition-all hover:scale-105 border-2" style={{ background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.2)', cursor: 'pointer' }}>
              {word}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 rounded-lg min-h-16 border-2 transition-all" style={{
        background: result === 'correct' ? 'rgba(22,163,74,0.15)' : result === 'wrong' ? 'rgba(220,38,38,0.15)' : 'rgba(0,67,187,0.15)',
        borderColor: result === 'correct' ? '#22c55e' : result === 'wrong' ? '#ef4444' : '#0043BB',
      }}>
        <p className="text-xs font-semibold uppercase mb-3" style={{ color: result === 'correct' ? '#86efac' : result === 'wrong' ? '#fca5a5' : '#93c5fd' }}>
          {result === 'correct' ? '✓ Correto!' : result === 'wrong' ? '✗ Tente novamente' : 'Sua sentença'}
        </p>
        <div className="flex flex-wrap gap-2 min-h-8">
          {arranged.length === 0 && <p className="text-white/40 italic text-sm">Clique nas palavras acima para montar a frase...</p>}
          {arranged.map((word, idx) => (
            <button key={`arr-${idx}`} onClick={() => moveToAvailable(word, idx)} className="px-4 py-2 text-white rounded-lg font-semibold transition-all hover:scale-105" style={{ background: 'linear-gradient(135deg, #CC4A00, #FF6B35)', cursor: 'pointer' }}>
              {word}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={handleReset} className="flex-1 font-semibold px-4 py-3 rounded-lg border-2 text-white/70 transition-all hover:bg-white/10" style={{ borderColor: 'rgba(255,255,255,0.2)', cursor: 'pointer' }}>
          Reiniciar
        </button>
        <button onClick={handleCheck} disabled={arranged.length === 0} className="text-white font-semibold px-6 py-3 rounded-lg transition-all disabled:opacity-40" style={{ background: 'linear-gradient(135deg, #CC4A00, #FF6B35)', cursor: arranged.length === 0 ? 'not-allowed' : 'pointer', flex: 2 }}>
          Verificar
        </button>
      </div>
      {result === 'wrong' && (
        <div className="space-y-2">
          <p className="text-center text-sm font-semibold" style={{ color: '#86efac' }}>
            Resposta correta: <span className="font-black">{mission.correctAnswer}</span>
          </p>
          <div className="flex justify-center">
            <button
              onClick={() => onComplete(0)}
              className="font-bold tracking-wide px-6 py-2.5 rounded-lg text-white transition-all hover:scale-105 active:scale-95"
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)' }}
            >
              Continuar assim mesmo
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   6. SpeakMission  –  speech recognition with LCS diff
   ═══════════════════════════════════════════════════ */

export function SpeakMission({ mission, onComplete }: MissionProps) {
  return (
    <>
      <EagleTip
        storageKey="eagle_tutorial_speak"
        lines={[
          '🎤 Missão: Fale em Inglês!',
          'Clique no microfone e leia a frase em voz alta.',
          'Pronuncie devagar e com clareza. Você consegue!',
        ]}
        buttonLabel="ENTENDIDO!"
      />
      <SpeakMissionInner mission={mission} onComplete={onComplete} />
    </>
  )
}

function SpeakMissionInner({ mission, onComplete }: MissionProps) {
  type Stage = 'idle' | 'recording' | 'processing' | 'result'

  const [stage, setStage] = useState<Stage>('idle')
  const [transcript, setTranscript] = useState('')
  const [score, setScore] = useState(0)
  const [displayScore, setDisplayScore] = useState(0)
  const [wordResults, setWordResults] = useState<{ word: string; correct: boolean }[]>([])
  const [error, setError] = useState('')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)
  const circleRef = useRef<SVGCircleElement | null>(null)

  const expectedText = mission.speakText ?? mission.correctAnswer ?? ''
  const hasExpected = !!expectedText
  const RADIUS = 52
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS

  const scoreColor = score >= 75 ? '#22c55e' : score >= 50 ? '#eab308' : '#ef4444'
  const scoreLabel = score >= 75 ? '🏆 Excelente!' : score >= 50 ? '💪 Bom esforço!' : '🔁 Tente novamente'
  const canContinue = !hasExpected || score >= 50

  const audioCtxRef = useRef<AudioContext | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const vadActiveRef = useRef(false)

  useEffect(() => {
    if (stage !== 'result') return
    const end = score
    const duration = 1300
    const startTime = performance.now()
    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayScore(Math.round(eased * end))
      if (circleRef.current) {
        circleRef.current.style.strokeDashoffset = String(CIRCUMFERENCE - eased * (end / 100) * CIRCUMFERENCE)
      }
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [stage, score, CIRCUMFERENCE])

  const computeWordDiff = (expected: string[], actual: string[]) => {
    const n = expected.length
    const m = actual.length
    const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0))
    for (let i = 1; i <= n; i++)
      for (let j = 1; j <= m; j++)
        dp[i][j] = expected[i - 1] === actual[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1])
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
      const exp = norm(expectedText).split(/\s+/)
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
    startRecording()
  }

  // Converte Blob para base64 via FileReader — sem risk de stack overflow
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
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      audioCtxRef.current = audioContext
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 2048
      source.connect(analyser)
      analyserRef.current = analyser

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')
          ? 'audio/ogg;codecs=opus'
          : ''
      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      chunksRef.current = []
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.start()
      mediaRecorderRef.current = mr
      vadActiveRef.current = false
      silenceTimerRef.current = null
      setStage('recording')

      // Detecção de silêncio: para automaticamente 1.5s após o usuário parar de falar
      const bufferLength = analyser.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)
      const SILENCE_THRESHOLD = 10
      const SILENCE_DELAY = 1500

      function checkSilence() {
        if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') return
        analyser.getByteTimeDomainData(dataArray)
        let sum = 0
        for (let i = 0; i < bufferLength; i++) { const v = dataArray[i] - 128; sum += v * v }
        const rms = Math.sqrt(sum / bufferLength)

        if (rms > SILENCE_THRESHOLD) {
          vadActiveRef.current = true
          if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null }
        } else if (vadActiveRef.current && !silenceTimerRef.current) {
          silenceTimerRef.current = setTimeout(() => handleStopRecording(), SILENCE_DELAY)
        }
        requestAnimationFrame(checkSilence)
      }
      requestAnimationFrame(checkSilence)
    } catch (err) {
      console.error(err)
      setError('Erro ao acessar microfone')
    }
  }

  const handleStopRecording = () => {
    const mr = mediaRecorderRef.current
    if (!mr || mr.state === 'inactive') return
    if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null }
    setStage('processing')
    mr.onstop = async () => {
      streamRef.current?.getTracks().forEach((t) => t.stop())
      audioCtxRef.current?.close()
      audioCtxRef.current = null
      const blob = new Blob(chunksRef.current, { type: mr.mimeType })
      const mimeBase = (mr.mimeType || 'audio/webm').split(';')[0]
      try {
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
        console.error(err)
        setError(err.message)
        setStage('idle')
      }
    }
    mr.stop()
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
      {/* Header */}
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold text-white">Fale em Inglês</h3>
        {hasExpected && (stage === 'idle' || stage === 'recording') && (
          <div className="mt-4 p-4 border rounded-xl transition-all" style={{
            background: stage === 'recording' ? 'rgba(0,67,187,0.3)' : 'rgba(0,67,187,0.15)',
            borderColor: stage === 'recording' ? '#0043BB' : 'rgba(0,67,187,0.3)',
          }}>
            <p className="text-xs font-bold text-blue-300 uppercase tracking-widest mb-2">Diga em inglês:</p>
            <p className="text-white font-semibold text-lg italic leading-relaxed">&ldquo;{expectedText}&rdquo;</p>
          </div>
        )}
      </div>

      {/* IDLE */}
      {stage === 'idle' && (
        <div className="flex flex-col items-center gap-4 py-4">
          {error && <p className="text-red-400 text-sm text-center px-4">{error}</p>}
          <button onClick={handleStartRecording} className="relative flex items-center justify-center w-28 h-28 rounded-full text-white text-5xl shadow-xl hover:scale-105 active:scale-95 transition-transform" style={{ backgroundColor: '#0043BB' }}>
            🎤
          </button>
          <p className="text-white/50 text-sm">Toque para começar a gravar</p>
        </div>
      )}

      {/* RECORDING */}
      {stage === 'recording' && (
        <div className="flex flex-col items-center gap-5 py-4">
          <div className="relative flex items-center justify-center">
            <div className="absolute w-36 h-36 rounded-full bg-red-400 opacity-20" style={{ animation: 'ping 1.2s cubic-bezier(0,0,0.2,1) infinite' }} />
            <div className="absolute w-28 h-28 rounded-full bg-red-400 opacity-25" style={{ animation: 'ping 1.2s cubic-bezier(0,0,0.2,1) infinite', animationDelay: '0.4s' }} />
            <button onClick={handleStopRecording} className="relative z-10 w-20 h-20 rounded-full bg-red-600 text-white text-3xl shadow-2xl hover:bg-red-700 active:scale-95 transition-all">⏹</button>
          </div>
          <div className="flex items-end gap-1 h-10">
            {[0.4, 0.7, 1, 0.8, 0.5, 0.9, 0.6, 1, 0.7, 0.4].map((h, i) => (
              <div key={i} className="w-2 bg-red-500 rounded-full origin-bottom" style={{ height: `${h * 100}%`, animation: 'barBounce 0.6s ease-in-out infinite', animationDelay: `${i * 70}ms` }} />
            ))}
          </div>
          <p className="text-red-600 font-semibold text-sm animate-pulse">Gravando... toque ⏹ para parar</p>
        </div>
      )}

      {/* PROCESSING */}
      {stage === 'processing' && (
        <div className="flex flex-col items-center gap-4 py-10">
          <div className="w-16 h-16 border-4 rounded-full animate-spin" style={{ borderColor: 'rgba(0,67,187,0.2)', borderTopColor: '#0043BB' }} />
          <p className="text-white font-semibold">Analisando sua fala...</p>
        </div>
      )}

      {/* RESULT */}
      {stage === 'result' && (
        <div className="space-y-6" style={{ animation: 'fadeInUp 0.4s ease forwards' }}>
          {/* Score Ring */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <svg width="144" height="144" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="72" cy="72" r={RADIUS} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="14" />
                <circle ref={circleRef} cx="72" cy="72" r={RADIUS} fill="none" stroke={scoreColor} strokeWidth="14" strokeLinecap="round" strokeDasharray={CIRCUMFERENCE} strokeDashoffset={CIRCUMFERENCE} style={{ transition: 'none' }} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black leading-none" style={{ color: scoreColor }}>{displayScore}%</span>
              </div>
            </div>
            <p className="text-lg font-bold mt-2 text-white">{scoreLabel}</p>
            {score < 50 && <p className="text-sm text-white/50 mt-1">Precisa de ≥ 50% para continuar</p>}
          </div>

          {/* Word diff */}
          {hasExpected && wordResults.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-white/40 uppercase tracking-widest text-center">Palavra por palavra</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {wordResults.map((r, i) => (
                  <span key={i} className="px-3 py-1.5 rounded-full text-sm font-bold text-white select-none" style={{ backgroundColor: r.correct ? '#16a34a' : '#dc2626', opacity: 0, animation: 'popIn 0.35s ease forwards', animationDelay: `${i * 70}ms` }}>
                    {r.correct ? '✓' : '✗'} {r.word}
                  </span>
                ))}
              </div>
              <div className="flex gap-4 justify-center mt-1">
                <span className="flex items-center gap-1 text-xs text-green-400 font-semibold"><span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" /> Correto</span>
                <span className="flex items-center gap-1 text-xs text-red-400 font-semibold"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> Errado / faltando</span>
              </div>
            </div>
          )}

          {/* Transcript */}
          {transcript && (
            <div className="p-4 rounded-xl border" style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }}>
              <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1">Você disse:</p>
              <p className="text-white/80 italic">&ldquo;{transcript}&rdquo;</p>
            </div>
          )}

          {/* Expected */}
          {hasExpected && expectedText && (
            <div className="p-4 rounded-xl border" style={{ background: 'rgba(0,67,187,0.15)', borderColor: 'rgba(0,67,187,0.3)' }}>
              <p className="text-xs font-bold text-blue-300 uppercase tracking-widest mb-1">Esperado:</p>
              <p className="text-white italic">&ldquo;{expectedText}&rdquo;</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button onClick={handleRetry} className="flex-1 border-2 text-white/70 font-semibold px-4 py-3 rounded-xl transition-colors hover:bg-white/10" style={{ borderColor: 'rgba(255,255,255,0.2)' }}>
              🔁 Tentar Novamente
            </button>
            {canContinue && (
              <button onClick={() => onComplete(mission.xp)} className="flex-1 text-white font-bold px-4 py-3 rounded-xl transition-all hover:opacity-90 active:scale-95" style={{ backgroundColor: '#CC4A00' }}>
                Continuar →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
