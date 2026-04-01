'use client'

import { useEffect, useState, useRef } from 'react'
import { playClick, playCorrect, playWrong } from '@/lib/sounds'
import { getSpeechRecognition } from '@/src/lib/speechRecognition'

interface Activity2ListenRepeatProps {
  onComplete: (xp: number) => void
}

const SENTENCES = [
  'I enjoy watching movies in my free time.',
  'I like listening to music when I want to relax.',
  'My favorite hobby is playing soccer.',
  'In my free time, I read books.',
  'I enjoy learning new things.',
  'I usually go to the gym after work.',
  'I like to travel on weekends.',
  'I spend my free time with my family.',
]

const AUDIO_MAP: Record<string, string> = {
  'I enjoy watching movies in my free time.': '/audio/I_enjoy_watching_movies_in_my_free_time.mp3',
  'I like listening to music when I want to relax.': '/audio/I_like_listening_to_music_when_I_want_to_relax.mp3',
  'My favorite hobby is playing soccer.': '/audio/My_favorite_hobby_is_playing_soccer.mp3',
  'In my free time, I read books.': '/audio/In_my_free_time,_I_read_books.mp3',
  'I enjoy learning new things.': '/audio/I_enjoy_learning_new_things.mp3',
  'I usually go to the gym after work.': '/audio/I_usually_go_to_the_gym_after_work.mp3',
  'I like to travel on weekends.': '/audio/I_like_to_travel_on_weekends.mp3',
  'I spend my free time with my family.': '/audio/I_spend_my_free_time_with_my_family.mp3',
}

type RecordingStage = 'idle' | 'recording' | 'processing' | 'result'

export function Activity2ListenRepeat({ onComplete }: Activity2ListenRepeatProps) {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [repeated, setRepeated] = useState<Set<number>>(new Set())
  const [showAllCompleted, setShowAllCompleted] = useState(false)
  const [recordingStage, setRecordingStage] = useState<RecordingStage>('idle')
  const [transcript, setTranscript] = useState('')
  const [score, setScore] = useState(0)
  const [error, setError] = useState('')
  const [wordResults, setWordResults] = useState<{ word: string; correct: boolean }[]>([])
  
  const audioRef = useRef<HTMLAudioElement>(null)
  const recognitionRef = useRef<any>(null)
  const resultReceivedRef = useRef(false)
  const transcriptPartsRef = useRef<string[]>([])
  const silenceTimeoutRef = useRef<NodeJS.Timeout>(null)

  const currentSentence = SENTENCES[currentIdx]
  const allRepeated = repeated.size === SENTENCES.length

  useEffect(() => {
    if (allRepeated) {
      setTimeout(() => setShowAllCompleted(true), 500)
    }
  }, [allRepeated])

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current)
      }
      if (recognitionRef.current) {
        try { recognitionRef.current.abort() } catch { /* ignore */ }
      }
    }
  }, [])

  // Comparador simples: verifica se cada palavra esperada aparece nas palavras do usuário
  const computeWordDiff = (expected: string[], actual: string[]) => {
    const actualSet = new Set(actual)
    return expected.map(word => ({
      word,
      correct: actualSet.has(word)
    }))
  }

  const processTranscript = (text: string) => {
    setTranscript(text)
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s']/g, '').trim()
    const exp = norm(currentSentence).split(/\s+/)
    const act = norm(text).split(/\s+/)
    const results = computeWordDiff(exp, act)
    setWordResults(results)
    const calculatedScore = Math.round((results.filter(r => r.correct).length / exp.length) * 100)
    setScore(calculatedScore)

    if (calculatedScore >= 70) {
      playCorrect()
      setRecordingStage('result')
    } else {
      playWrong()
      setRecordingStage('result')
    }
  }

  const handleRepeat = async () => {
    playClick()
    setError('')
    
    const SpeechRecognitionAPI = getSpeechRecognition()
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

    // Função para resetar o timeout de silêncio
    const resetSilenceTimeout = () => {
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current)
      }
      silenceTimeoutRef.current = setTimeout(() => {
        if (recognitionRef.current) {
          rec.stop()
        }
      }, 3000) // 3 segundos de silêncio = parar
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (event: any) => {
      resultReceivedRef.current = true
      resetSilenceTimeout() // Resetar timer quando recebe resultado
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          transcriptPartsRef.current.push(event.results[i][0].transcript)
        }
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onerror = (event: any) => {
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current)
      }
      if (event.error === 'no-speech') setError('Nenhuma fala detectada. Tente novamente.')
      else if (event.error === 'not-allowed') setError('Permissão de microfone negada.')
      else setError(`Erro: ${event.error}`)
      setRecordingStage('idle')
    }

    rec.onend = () => {
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current)
      }
      if (!resultReceivedRef.current || transcriptPartsRef.current.length === 0) {
        setError('Nenhuma fala detectada. Tente novamente.')
        setRecordingStage('idle')
      } else {
        const text = transcriptPartsRef.current.join(' ')
        setRecordingStage('processing')
        setTimeout(() => processTranscript(text), 300)
      }
    }

    recognitionRef.current = rec
    await rec.start()
    resetSilenceTimeout() // Iniciar timeout ao começar a gravação
    setRecordingStage('recording')
  }

  const handleNextOrContinue = () => {
    playClick()
    const newRepeated = new Set(repeated)
    newRepeated.add(currentIdx)
    setRepeated(newRepeated)

    // Ir para próxima sentença
    if (currentIdx < SENTENCES.length - 1) {
      setTimeout(() => {
        setCurrentIdx(currentIdx + 1)
        setRecordingStage('idle')
        setTranscript('')
        setScore(0)
        setError('')
        setWordResults([])
      }, 300)
    }
  }

  const handleListen = () => {
    playClick()
    if (audioRef.current) {
      const audioUrl = AUDIO_MAP[currentSentence]
      if (!audioUrl) {
        console.warn('Audio not found for:', currentSentence)
        return
      }
      audioRef.current.src = audioUrl
      audioRef.current.load()
      audioRef.current.play().catch(err => console.error('Error playing audio:', err))
    }
  }

  if (showAllCompleted) {
    return (
      <div className="space-y-8">
        <div
          className="p-8 rounded-2xl backdrop-blur-md text-center"
          style={{
            background: 'rgba(34,197,94,0.1)',
            border: '1px solid #22c55e',
          }}
        >
          <h3 className="text-2xl font-bold text-green-300 mb-2">✅ Excellent!</h3>
          <p className="text-base text-blue-200/80">
            You listened and repeated all {SENTENCES.length} sentences correctly.
          </p>
          <button
            onClick={() => onComplete(40)}
            className="mt-6 font-bold tracking-widest px-8 py-4 rounded-lg text-white hover:scale-105 active:scale-95 transition-all"
            style={{
              background: 'linear-gradient(135deg, #003AB0, #0066FF)',
              border: '2px solid #00D4FF',
            }}
          >
            ✓ CONTINUE (+40 XP)
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Instruções */}
      <div className="space-y-4 p-6 rounded-2xl" style={{ background: 'rgba(0,102,255,0.1)', border: '1px solid rgba(0,212,255,0.2)' }}>
        <h2 className="text-2xl font-bold text-cyan-300 flex items-center gap-2">
          <span>🎧</span> Step 2 — Listen & Repeat
        </h2>
        <p className="text-base text-blue-200/80">
          Listen and repeat the sentences:
        </p>
      </div>

      {/* Progress */}
      <div className="flex gap-2">
        {SENTENCES.map((_, idx) => (
          <div
            key={idx}
            className="flex-1 h-2 rounded-full transition-all"
            style={{
              background: repeated.has(idx) ? '#22c55e' : 'rgba(0,212,255,0.2)',
            }}
          />
        ))}
      </div>

      {/* Current sentence */}
      <div className="space-y-6 p-8 rounded-2xl backdrop-blur-md" style={{ background: 'rgba(0,36,120,0.5)', border: '1px solid rgba(0,212,255,0.3)' }}>
        <div>
          <p className="text-sm text-cyan-400/60 mb-2 tracking-widest">SENTENCE {currentIdx + 1}/{SENTENCES.length}</p>
          <p className="text-xl sm:text-2xl text-blue-200/90 font-light leading-relaxed">
            {currentSentence}
          </p>
        </div>

        {/* Buttons or Recording Result */}
        {recordingStage === 'idle' && (
          <div className="flex gap-3">
            <button
              onClick={handleListen}
              className="flex-1 font-bold tracking-widest px-6 py-3 rounded-lg text-white transition-all hover:scale-105 active:scale-95"
              style={{
                background: 'rgba(0,102,255,0.3)',
                border: '2px solid #00D4FF',
              }}
            >
              🎧 LISTEN
            </button>
            <button
              onClick={handleRepeat}
              className="flex-1 font-bold tracking-widest px-6 py-3 rounded-lg text-white transition-all hover:scale-105 active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #003AB0, #0066FF)',
                border: '2px solid #00D4FF',
              }}
            >
              🎤 REPEAT
            </button>
          </div>
        )}

        {/* Recording State */}
        {recordingStage === 'recording' && (
          <div className="text-center space-y-3">
            <div className="text-4xl animate-pulse">🎤</div>
            <p className="text-blue-300 font-semibold">Listening to you...</p>
          </div>
        )}

        {/* Processing State */}
        {recordingStage === 'processing' && (
          <div className="text-center space-y-3">
            <p className="text-blue-300 font-semibold">Processing...</p>
          </div>
        )}

        {/* Result State */}
        {recordingStage === 'result' && (
          <div className="space-y-4">
            <div
              className="p-4 rounded-lg"
              style={{
                background: score >= 70 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                border: score >= 70 ? '2px solid #22c55e' : '2px solid rgba(239,68,68,0.5)',
              }}
            >
              <div className="space-y-2">
                <p className="text-sm text-blue-200/60">Your transcript:</p>
                <p className="text-lg text-blue-200/90 italic">"{transcript}"</p>
                
                {/* Word-by-word feedback */}
                {wordResults.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm text-blue-200/60">Word accuracy:</p>
                    <div className="flex flex-wrap gap-2">
                      {wordResults.map((wr, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 rounded-full text-sm font-semibold transition-all"
                          style={{
                            background: wr.correct ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
                            color: wr.correct ? '#22c55e' : '#ef4444',
                            border: `1px solid ${wr.correct ? '#22c55e' : '#ef4444'}`,
                          }}
                        >
                          {wr.correct ? '✓' : '✗'} {wr.word}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-between mt-3">
                  <p className="text-sm text-blue-200/60">Accuracy:</p>
                  <p className={`text-2xl font-bold ${score >= 70 ? 'text-green-300' : 'text-red-300'}`}>
                    {score}%
                  </p>
                </div>
              </div>
            </div>
            
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}

            {score >= 70 ? (
              <button
                onClick={handleNextOrContinue}
                className="w-full font-bold tracking-widest px-6 py-3 rounded-lg text-white transition-all hover:scale-105 active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                  border: '2px solid #22c55e',
                }}
              >
                ✅ CORRECT! → NEXT
              </button>
            ) : (
              <button
                onClick={() => {
                  setRecordingStage('idle')
                  setTranscript('')
                  setScore(0)
                  setError('')
                  setWordResults([])
                }}
                className="w-full font-bold tracking-widest px-6 py-3 rounded-lg text-white transition-all hover:scale-105 active:scale-95"
                style={{
                  background: 'rgba(239,68,68,0.2)',
                  border: '2px solid rgba(239,68,68,0.5)',
                }}
              >
                🔄 TRY AGAIN
              </button>
            )}
          </div>
        )}
      </div>

      {/* Audio player element */}
      <audio ref={audioRef} crossOrigin="anonymous" />
    </div>
  )
}
