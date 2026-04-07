'use client'

import { useState, useRef, useEffect } from 'react'
import { getSpeechRecognition } from '@/src/lib/speechRecognition'
import { ListenRepeatQuestion, SpeakFromMemoryQuestion, VocabularyMatchQuestion } from '../questions_structs'
import { getCookie, setCookie, deleteCookie } from '@/lib/utils'

interface Block3VocabularyProps {
  onComplete: (xp: number) => void
  onActivityChange?: (current: number, total: number) => void
}

const VOCABULARY = [
  { word: 'Hobby',     definition: 'An activity done for pleasure',          translationPt: 'Hobby / Passatempo', example: 'Playing guitar is my favorite hobby.' },
  { word: 'Interest', definition: 'Wanting to learn more about something',   translationPt: 'Interesse',          example: 'I have a great interest in music.' },
  { word: 'Enjoy',    definition: 'To feel pleasure',                        translationPt: 'Gostar / Aproveitar', example: 'I enjoy watching movies on weekends.' },
  { word: 'Activity', definition: 'Something you do',                        translationPt: 'Atividade',          example: 'Swimming is a healthy activity.' },
  { word: 'Leisure',  definition: 'Free time',                               translationPt: 'Lazer',              example: 'I read books in my leisure time.' },
  { word: 'Free time',definition: 'Time when you are not busy',              translationPt: 'Tempo livre',        example: 'I listen to music in my free time.' },
  { word: 'Passion',  definition: 'Something you love a lot',                translationPt: 'Paixão',             example: 'Traveling is my biggest passion.' },
  { word: 'Relax',    definition: 'To rest and feel calm',                   translationPt: 'Relaxar',            example: 'I like to relax by listening to music.' },
]

const FILL_SENTENCES = [
  { sentence: 'I ___ watching movies on weekends.', answer: 'enjoy', options: ['enjoy', 'hobby', 'activity'], full: 'I enjoy watching movies on weekends.' },
  { sentence: 'In my ___ time, I like to read.', answer: 'leisure', options: ['leisure', 'passion', 'interest'], full: 'In my leisure time, I like to read.' },
  { sentence: 'Playing soccer is my favorite ___.', answer: 'hobby', options: ['hobby', 'relax', 'free time'], full: 'Playing soccer is my favorite hobby.' },
  { sentence: 'I like to ___ by listening to music.', answer: 'relax', options: ['relax', 'interest', 'activity'], full: 'I like to relax by listening to music.' },
  { sentence: 'Traveling is my biggest ___.', answer: 'passion', options: ['passion', 'leisure', 'enjoy'], full: 'Traveling is my biggest passion.' },
  { sentence: 'I have an ___ in learning English.', answer: 'interest', options: ['interest', 'hobby', 'relax'], full: 'I have an interest in learning English.' },
  { sentence: 'One fun ___ is going to the gym.', answer: 'activity', options: ['activity', 'enjoy', 'leisure'], full: 'One fun activity is going to the gym.' },
]

const SPEAK_PROMPTS = [
  'I enjoy ______ in my free time.',
  'My favorite hobby is ______.',
]

const MEMORY_SENTENCES = [
  'I enjoy watching movies on weekends.',
  'Playing soccer is my favorite hobby.',
  'I like to relax by listening to music.',
]

type Stage = 'matchIntro' | 'matchWord' | 'fillBlank' | 'fillRepeat' | 'speak' | 'memory' | 'complete'

const STAGE_INDEX: Record<Stage, number> = { matchIntro:1, matchWord:2, fillBlank:3, fillRepeat:4, speak:5, memory:6, complete:6 }

export function Block3Vocabulary({ onComplete, onActivityChange }: Block3VocabularyProps) {
  const [stage, setStage] = useState<Stage>(() => {
    const s = getCookie('woa_b3_stage') as Stage | null
    return (s && s !== 'complete') ? s : 'matchIntro'
  })
  const [fillIdx, setFillIdx] = useState(0)
  const [fillAnswer, setFillAnswer] = useState('')
  const [fillCorrect, setFillCorrect] = useState<boolean | null>(null)
  const [speakIdx, setSpeakIdx] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [score, setScore] = useState(0)
  const [error, setError] = useState('')
  const [xpEarned, setXpEarned] = useState(0)
  const [attemptCount, setAttemptCount] = useState(0)
  const transcriptRef = useRef('')

  useEffect(() => {
    onActivityChange?.(STAGE_INDEX[stage], 6)
    if (stage !== 'complete') setCookie('woa_b3_stage', stage)
  }, [stage])
  const calcScore = (spoken: string, target: string): number => {
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z\s]/g, '').trim().split(/\s+/)
    const a = norm(spoken), b = norm(target)
    if (b.length === 0) return 0
    let m = 0; for (const w of b) if (a.includes(w)) m++
    return Math.round((m / b.length) * 100)
  }

  const record = async (target: string, onPass: () => void, xp: number, isMemoryTask?: boolean) => {
    if (isRecording) return
    setError(''); setTranscript(''); setScore(0)
    const API = getSpeechRecognition()
    if (!API) { setError('Speech Recognition not supported.'); return }

    const rec = new API()
    rec.lang = 'en-US'; rec.continuous = true; rec.interimResults = true
    setIsRecording(true); transcriptRef.current = ''

    let timer: ReturnType<typeof setTimeout> | null = null
    const resetT = () => { if (timer) clearTimeout(timer); timer = setTimeout(() => rec.stop(), 3000) }

    rec.onresult = (e: any) => { resetT(); const t = Array.from(e.results).map((r: any) => r[0].transcript).join(''); transcriptRef.current = t; setTranscript(t) }
    rec.onend = () => { 
      setIsRecording(false); 
      if (timer) clearTimeout(timer); 
      const s = calcScore(transcriptRef.current, target); 
      setScore(s); 
      if (isMemoryTask) {
        // Memory tasks: auto-advance regardless of score (no second chance)
        setTimeout(onPass, 600)
      } else {
        // Regular tasks: show error if below threshold
        if (s >= 70) { setXpEarned(p => p + xp); setAttemptCount(0); setTimeout(onPass, 600) } 
        else { 
          setAttemptCount((prev) => prev + 1)
          setError(`Score: ${s}%. Tente de novo (mínimo 70%).`) 
        }
      }
    }
    rec.onerror = (e: any) => { setIsRecording(false); if (timer) clearTimeout(timer); setError(e.error === 'no-speech' ? 'Nenhuma fala detectada.' : `Erro: ${e.error}`) }

    await rec.start(); resetT()
  }

  const handleMatchComplete = (xpGained: number) => {
    setXpEarned((p) => p + xpGained)
    setStage('fillBlank')
  }

  const handleFillRepeatComplete = (_xp: number) => {
    const next = fillIdx + 1
    setFillAnswer('')
    setFillCorrect(null)
    if (next < FILL_SENTENCES.length) {
      setFillIdx(next)
      setStage('fillBlank')
    } else {
      setXpEarned((p) => p + 20)
      setStage('speak')
    }
  }

  // ─── Step 1: Match – Flip Cards ───
  if (stage === 'matchIntro') {
    return (
      <VocabularyMatchQuestion
        items={VOCABULARY}
        stepLabel="Step 1 — Match"
        title="Vocabulário"
        icon="🧩"
        instruction="Click each card to reveal the Portuguese translation."
        instructionPt="Clique em cada carta para ver a tradução. Vire todas para avançar!"
        onComplete={() => setStage('matchWord')}
      />
    )
  }

  // ─── Step 1: Match - Word by word ───
  if (stage === 'matchWord') {
    return (
      <ListenRepeatQuestion
        sentences={VOCABULARY.map((v) => v.word)}
        stepLabel="Step 1 — Match"
        title="Ouça e Repita"
        icon="🧩"
        instruction="Listen to each vocabulary word and repeat!"
        instructionPt="Ouça cada palavra de vocabulário e repita!"
        xpReward={10}
        onComplete={handleMatchComplete}
      />
    )
  }

  // ─── Step 2: Fill blank (MCQ only) ───
  if (stage === 'fillBlank') {
    const q = FILL_SENTENCES[fillIdx]
    return (
      <div className="space-y-6" style={{ animation: 'fadeIn 0.5s ease-in' }}>
        <div className="flex justify-between items-center">
          <p className="text-green-300 text-sm font-bold mb-0.5">⚡ STEP 2 — CHOOSE & SPEAK ({fillIdx + 1}/{FILL_SENTENCES.length})</p>
          <p className="text-white/40 text-[10px] mb-3">Escolha e fale</p>
        </div>
        <div className="p-6 rounded-xl border border-green-400/30" style={{ background: 'rgba(34,197,94,0.06)' }}>
          <p className="text-white text-xl font-semibold mb-6">{q.sentence}</p>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {q.options.map((o) => (
              <button key={o} onClick={() => { setFillAnswer(o); setFillCorrect(o === q.answer) }}
                className={`p-3 rounded-lg font-medium text-sm transition-all border ${fillAnswer === o ? (fillCorrect ? 'bg-green-500/30 border-green-400 text-green-300' : 'bg-red-500/30 border-red-400 text-red-300') : 'bg-white/5 border-white/10 text-white'}`}
              >{o}</button>
            ))}
          </div>
          {fillCorrect === true && (
            <div className="text-center mt-4">
              <p className="text-green-400 font-bold mb-3">✅ Correto!</p>
              <p className="text-white mb-4">{q.full}</p>
              <button
                onClick={() => setStage('fillRepeat')}
                className="px-6 py-3 rounded-xl font-bold text-white hover:scale-105 transition-all"
                style={{ background: 'linear-gradient(135deg, #00D4FF, #0066FF)' }}
              >
                🎧 Praticar pronúncia →
              </button>
            </div>
          )}
          {fillCorrect === false && (
            <p className="text-red-400 text-center mt-3">❌ Tente outra opção</p>
          )}
        </div>
        <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }`}</style>
      </div>
    )
  }

  // ─── Step 2: Fill repeat (listen + speak) ───
  if (stage === 'fillRepeat') {
    return (
      <ListenRepeatQuestion
        sentences={[FILL_SENTENCES[fillIdx].full]}
        stepLabel={`Step 2 — ${fillIdx + 1}/${FILL_SENTENCES.length}`}
        title="Ouça e Repita"
        icon="📝"
        instruction="Listen and repeat the full sentence!"
        instructionPt="Ouça e repita a frase completa!"
        xpReward={0}
        onComplete={handleFillRepeatComplete}
      />
    )
  }

  // ─── Step 3: Speak (complete sentences) ───
  if (stage === 'speak') {
    return (
      <div className="space-y-6" style={{ animation: 'fadeIn 0.5s ease-in' }}>
        <div className="p-6 rounded-xl border border-yellow-400/30" style={{ background: 'rgba(250,204,21,0.06)' }}>
          <p className="text-yellow-300 font-bold text-sm tracking-widest mb-0.5">🎤 STEP 3 — SPEAK</p>
          <p className="text-white/40 text-[10px] mb-3">Fale as frases completas</p>
          <p className="text-blue-200/80 mb-4">👉 Complete and say ({speakIdx + 1}/{SPEAK_PROMPTS.length}):</p>
          <p className="text-white text-xl font-semibold mb-6">{SPEAK_PROMPTS[speakIdx]}</p>
          {transcript && <p className="text-blue-200/60 text-sm mb-1">&quot;{transcript}&quot;</p>}
          {error && <p className="text-red-400 text-sm mb-2">{error}</p>}
          <button
            onClick={() => {
              if (isRecording) return; setError(''); setTranscript('')
              const API = getSpeechRecognition(); if (!API) return
              const rec = new API(); rec.lang = 'en-US'; rec.continuous = true; rec.interimResults = true
              setIsRecording(true); transcriptRef.current = ''
              let timer: ReturnType<typeof setTimeout> | null = null
              const resetT = () => { if (timer) clearTimeout(timer); timer = setTimeout(() => rec.stop(), 3000) }
              rec.onresult = (e: any) => { resetT(); transcriptRef.current = Array.from(e.results).map((r: any) => r[0].transcript).join(''); setTranscript(transcriptRef.current) }
              rec.onend = () => { setIsRecording(false); if (timer) clearTimeout(timer); if (transcriptRef.current.trim().split(/\s+/).length >= 3) { setXpEarned(p => p + 15);  if (speakIdx < SPEAK_PROMPTS.length - 1) setSpeakIdx(speakIdx + 1); else setStage('memory') } else { setError('Diga uma frase completa.') } }
              rec.onerror = (e: any) => { setIsRecording(false); setError(e.error === 'no-speech' ? 'Nenhuma fala.' : `Erro: ${e.error}`) }
              rec.start(); resetT()
            }}
            disabled={isRecording}
            className="px-8 py-3 rounded-xl font-bold text-white hover:scale-105 transition-all"
            style={{ background: isRecording ? '#ef4444' : 'linear-gradient(135deg, #f59e0b, #d97706)' }}
          >
            {isRecording ? '🔴 Gravando...' : '🎤 Falar'}
          </button>
          <p className="text-blue-200/40 text-xs mt-2">+15 XP por frase</p>
        </div>
        <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }`}</style>
      </div>
    )
  }

  // ─── Step 4: Memory Boost ───
  if (stage === 'memory') {
    return (
      <SpeakFromMemoryQuestion
        sentences={MEMORY_SENTENCES}
        stepLabel="Step 4 — Memory Boost"
        title="Fale de Memória"
        icon="🧠"
        instruction="Fale qualquer uma das frases que você aprendeu — sem ler!"
        xpReward={25}
        onComplete={(xpGained) => {
          setXpEarned((p) => p + xpGained)
          setStage('complete')
        }}
      />
    )
  }

  // ─── Complete ───
  return (
    <div className="space-y-6" style={{ animation: 'fadeIn 0.5s ease-in' }}>
      <div className="p-8 rounded-xl border border-green-400/30 text-center" style={{ background: 'rgba(34,197,94,0.08)' }}>
        <div className="text-5xl mb-4">🏆</div>
        <h3 className="text-2xl font-black text-white mb-2">Group Complete!</h3>
        <p className="text-blue-200/80 mb-4">Learn & Speak concluído</p>
        <div className="flex justify-center gap-4 mb-6">
          <div className="px-4 py-2 rounded-lg bg-yellow-500/20 border border-yellow-400"><p className="text-yellow-300 font-bold">+{xpEarned} XP</p></div>
          <div className="px-4 py-2 rounded-lg bg-yellow-500/20 border border-yellow-400"><p className="text-yellow-300 font-bold">🪙 +5 WOA Coins</p></div>
        </div>
        <button onClick={() => { deleteCookie('woa_b3_stage'); onComplete(xpEarned) }} className="px-8 py-3 rounded-xl font-bold text-white hover:scale-105 transition-all" style={{ background: 'linear-gradient(135deg, #003AB0, #0066FF)', border: '2px solid #00D4FF' }}>CONTINUAR →</button>
      </div>
      <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }`}</style>
    </div>
  )
}
