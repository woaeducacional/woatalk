'use client'

import { useState, useRef } from 'react'
import { getSpeechRecognition } from '@/src/lib/speechRecognition'

interface Activity2VocabularyProps {
  onComplete: (xp: number) => void
}

const VOCABULARY = [
  { word: 'Hobby', def: 'An activity done for pleasure' },
  { word: 'Interest', def: 'Wanting to learn more about something' },
  { word: 'Enjoy', def: 'To feel pleasure' },
  { word: 'Activity', def: 'Something you do' },
  { word: 'Leisure', def: 'Free time' },
  { word: 'Free time', def: 'Time when you are not busy' },
  { word: 'Passion', def: 'Something you love a lot' },
  { word: 'Relax', def: 'To rest and feel calm' },
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

function tts(text: string, rate = 0.85): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) { resolve(); return }
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'en-US'; u.rate = rate
    u.onend = () => resolve(); u.onerror = () => resolve()
    window.speechSynthesis.speak(u)
  })
}

export function Activity2Vocabulary({ onComplete }: Activity2VocabularyProps) {
  const [stage, setStage] = useState<Stage>('matchIntro')
  const [matchIdx, setMatchIdx] = useState(0)
  const [matchRepeated, setMatchRepeated] = useState(false)
  const [fillIdx, setFillIdx] = useState(0)
  const [fillAnswer, setFillAnswer] = useState('')
  const [fillCorrect, setFillCorrect] = useState<boolean | null>(null)
  const [fillRepeatDone, setFillRepeatDone] = useState(false)
  const [speakIdx, setSpeakIdx] = useState(0)
  const [memoryIdx, setMemoryIdx] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [score, setScore] = useState(0)
  const [error, setError] = useState('')
  const [xpEarned, setXpEarned] = useState(0)
  const transcriptRef = useRef('')

  const calcScore = (spoken: string, target: string): number => {
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z\s]/g, '').trim().split(/\s+/)
    const a = norm(spoken), b = norm(target)
    if (b.length === 0) return 0
    let m = 0; for (const w of b) if (a.includes(w)) m++
    return Math.round((m / b.length) * 100)
  }

  const record = async (target: string, onPass: () => void, xp: number) => {
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
    rec.onend = () => { setIsRecording(false); if (timer) clearTimeout(timer); const s = calcScore(transcriptRef.current, target); setScore(s); if (s >= 70) { setXpEarned(p => p + xp); setTimeout(onPass, 600) } else { setError(`Score: ${s}%. Tente de novo (mínimo 70%).`) } }
    rec.onerror = (e: any) => { setIsRecording(false); if (timer) clearTimeout(timer); setError(e.error === 'no-speech' ? 'Nenhuma fala detectada.' : `Erro: ${e.error}`) }

    await rec.start(); resetT()
  }

  // ─── Step 1: Match – Intro ───
  if (stage === 'matchIntro') {
    return (
      <div className="space-y-6" style={{ animation: 'fadeIn 0.5s ease-in' }}>
        <div className="p-6 rounded-xl border border-cyan-400/30" style={{ background: 'rgba(0,212,255,0.06)' }}>
          <p className="text-cyan-300 font-bold text-sm tracking-widest mb-0.5">🧩 STEP 1 — MATCH</p>
          <p className="text-white/40 text-[10px] mb-3">Combine as palavras</p>
          <p className="text-blue-200/80 mb-4">Learn 8 vocabulary words. Listen to each word and repeat!</p>
          <div className="grid gap-2">
            {VOCABULARY.map((v, i) => (
              <div key={i} className="flex justify-between p-3 rounded-lg border border-white/10" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <span className="text-white font-semibold">{v.word}</span>
                <span className="text-blue-200/60 text-sm">{v.def}</span>
              </div>
            ))}
          </div>
          <button onClick={() => setStage('matchWord')} className="mt-6 w-full py-3 rounded-xl font-bold text-white hover:scale-105 transition-all" style={{ background: 'linear-gradient(135deg, #00D4FF, #0066FF)' }}>
            COMEÇAR →
          </button>
        </div>
        <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }`}</style>
      </div>
    )
  }

  // ─── Step 1: Match - Word by word ───
  if (stage === 'matchWord') {
    const v = VOCABULARY[matchIdx]
    return (
      <div className="space-y-6" style={{ animation: 'fadeIn 0.5s ease-in' }}>
        <div className="flex justify-between items-center mb-2">
          <p className="text-cyan-300 text-sm font-bold">{matchIdx + 1}/{VOCABULARY.length}</p>
          <div className="flex gap-1">{VOCABULARY.map((_, i) => (<div key={i} className="w-3 h-3 rounded-full" style={{ background: i < matchIdx ? '#22c55e' : i === matchIdx ? '#00D4FF' : 'rgba(255,255,255,0.1)' }} />))}</div>
        </div>
        <div className="p-8 rounded-xl border border-cyan-400/30 text-center" style={{ background: 'rgba(0,212,255,0.06)' }}>
          <p className="text-4xl font-black text-white mb-2">{v.word}</p>
          <p className="text-blue-200/60 mb-6">{v.def}</p>

          {!matchRepeated ? (
            <button
              onClick={async () => { setIsPlaying(true); await tts(v.word); setIsPlaying(false); setMatchRepeated(true) }}
              disabled={isPlaying}
              className="px-8 py-3 rounded-xl font-bold text-white hover:scale-105 transition-all"
              style={{ background: isPlaying ? '#666' : 'linear-gradient(135deg, #00D4FF, #0066FF)' }}
            >
              {isPlaying ? '🔊 Playing...' : '🎧 Ouvir'}
            </button>
          ) : (
            <div>
              {transcript && <p className="text-blue-200/60 text-sm mb-2">&quot;{transcript}&quot;</p>}
              {score > 0 && <p className={`text-sm font-bold mb-2 ${score >= 70 ? 'text-green-400' : 'text-red-400'}`}>{score}%</p>}
              {error && <p className="text-red-400 text-sm mb-2">{error}</p>}
              <button
                onClick={() => record(v.word, () => {
                  setMatchRepeated(false); setTranscript(''); setScore(0)
                  if (matchIdx < VOCABULARY.length - 1) { setMatchIdx(matchIdx + 1) }
                  else { setXpEarned(p => p + 10); setStage('fillBlank') }
                }, 0)}
                disabled={isRecording}
                className="px-8 py-3 rounded-xl font-bold text-white hover:scale-105 transition-all"
                style={{ background: isRecording ? '#ef4444' : 'linear-gradient(135deg, #22c55e, #16a34a)' }}
              >
                {isRecording ? '🔴 Gravando...' : '🎤 Repetir'}
              </button>
            </div>
          )}
        </div>
        <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }`}</style>
      </div>
    )
  }

  // ─── Step 2: Fill blank ───
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
          {fillCorrect === true && !fillRepeatDone && (
            <div className="text-center mt-4">
              <p className="text-green-400 font-bold mb-3">✅ Correct!</p>
              <p className="text-white mb-4">{q.full}</p>
              <button
                onClick={async () => { setIsPlaying(true); await tts(q.full); setIsPlaying(false); setFillRepeatDone(true) }}
                disabled={isPlaying}
                className="px-6 py-2 rounded-xl font-bold text-white hover:scale-105 transition-all"
                style={{ background: isPlaying ? '#666' : 'linear-gradient(135deg, #00D4FF, #0066FF)' }}
              >
                {isPlaying ? '🔊...' : '🎧 Ouvir → 🎤 Repetir'}
              </button>
            </div>
          )}
          {fillRepeatDone && (
            <div className="text-center mt-4">
              {transcript && <p className="text-blue-200/60 text-sm mb-1">&quot;{transcript}&quot;</p>}
              {score > 0 && <p className={`text-sm font-bold mb-2 ${score >= 70 ? 'text-green-400' : 'text-red-400'}`}>{score}%</p>}
              {error && <p className="text-red-400 text-sm mb-2">{error}</p>}
              <button
                onClick={() => record(q.full, () => {
                  setFillAnswer(''); setFillCorrect(null); setFillRepeatDone(false); setTranscript(''); setScore(0)
                  if (fillIdx < FILL_SENTENCES.length - 1) setFillIdx(fillIdx + 1)
                  else { setXpEarned(p => p + 20); setStage('speak') }
                }, 0)}
                disabled={isRecording}
                className="px-6 py-2 rounded-xl font-bold text-white hover:scale-105 transition-all"
                style={{ background: isRecording ? '#ef4444' : 'linear-gradient(135deg, #22c55e, #16a34a)' }}
              >
                {isRecording ? '🔴 Gravando...' : '🎤 Repetir agora'}
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
    const s = MEMORY_SENTENCES[memoryIdx]
    return (
      <div className="space-y-6" style={{ animation: 'fadeIn 0.5s ease-in' }}>
        <div className="p-6 rounded-xl border border-orange-400/30 text-center" style={{ background: 'rgba(249,115,22,0.06)' }}>
          <p className="text-orange-300 font-bold text-sm tracking-widest mb-0.5">🧠 STEP 4 — MEMORY BOOST ({memoryIdx + 1}/{MEMORY_SENTENCES.length})</p>
          <p className="text-white/40 text-[10px] mb-3">Teste sua memória</p>
          <p className="text-blue-200/80 mb-4">👉 Say this sentence WITHOUT listening:</p>
          {transcript && <p className="text-blue-200/60 text-sm mb-1">&quot;{transcript}&quot;</p>}
          {score > 0 && <p className={`text-sm font-bold mb-2 ${score >= 70 ? 'text-green-400' : 'text-red-400'}`}>{score}%</p>}
          {error && <p className="text-red-400 text-sm mb-2">{error}</p>}
          <button
            onClick={() => record(s, () => {
              setTranscript(''); setScore(0)
              if (memoryIdx < MEMORY_SENTENCES.length - 1) setMemoryIdx(memoryIdx + 1)
              else { setXpEarned(p => p + 25); setStage('complete') }
            }, 0)}
            disabled={isRecording}
            className="px-8 py-3 rounded-xl font-bold text-white hover:scale-105 transition-all"
            style={{ background: isRecording ? '#ef4444' : 'linear-gradient(135deg, #f97316, #ea580c)' }}
          >
            {isRecording ? '🔴 Gravando...' : '🧠 Falar de memória'}
          </button>
        </div>
        <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }`}</style>
      </div>
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
        <button onClick={() => onComplete(xpEarned)} className="px-8 py-3 rounded-xl font-bold text-white hover:scale-105 transition-all" style={{ background: 'linear-gradient(135deg, #003AB0, #0066FF)', border: '2px solid #00D4FF' }}>CONTINUAR →</button>
      </div>
      <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }`}</style>
    </div>
  )
}
